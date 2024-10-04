import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Button,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import Logger from "./Logger"; // Adjust the path as needed
import {
  scheduleNotifications,
  showImmediateNotification,
  registerForPushNotificationsAsync,
  addNotificationListeners,
  removeNotificationListeners,
  sendPushTokenToBackend,
} from "./Notification";

const { height } = Dimensions.get("window");
const TOP_MARGIN = height * 0.05; // 5% of the screen height

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const notificationListeners = useRef(null);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [sentReminders, setSentReminders] = useState([]);
  const [expoPushToken, setExpoPushToken] = useState(null);

  const generateId = (reminder, userEmail) => {
    const { reminderSenderUserName, reminderDateTime } = reminder;
    const reminderTimestamp = new Date(reminderDateTime).toISOString();

    return `${reminderSenderUserName}-${userEmail}-${reminderTimestamp}`;
  };

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        Logger.log("User data found in AsyncStorage.");
        const userObject = JSON.parse(userData);
        const userEmail = userObject.email;

        if (userEmail) {
          Logger.log(`Fetching reminders for user: ${userEmail}`);
          const upcomingResponse = await fetch(
            `http://10.0.0.54:8080/get-by-user?userId=${userEmail}`
          );
          const upcomingData = await upcomingResponse.json();
          Logger.log("Reminders fetched successfully.");

          // Generate ids for the fetched reminders
          const upcomingRemindersWithIds = upcomingData.reminders.map(
            (reminder) => ({
              ...reminder,
              id: generateId(reminder, userEmail),
            })
          );

          // Retrieve existing reminders from AsyncStorage
          const storedReminders = JSON.parse(
            (await AsyncStorage.getItem("reminders")) || "[]"
          );

          // Create a map of existing reminders by id
          const existingRemindersMap = new Map(
            storedReminders.map((reminder) => [reminder.id, reminder])
          );

          // Filter out existing reminders to avoid duplication
          const newReminders = upcomingRemindersWithIds.filter(
            (reminder) => !existingRemindersMap.has(reminder.id)
          );

          // Update state with all reminders (new and existing)
          setReminders([...storedReminders, ...newReminders]);
          // Save new reminders to AsyncStorage
          await AsyncStorage.setItem(
            "reminders",
            JSON.stringify([...storedReminders, ...newReminders])
          );

          // Schedule notifications for new reminders
          await scheduleNotifications(newReminders);

          const sentResponse = await fetch(
            `http://10.0.0.54:8080/get-sent-reminders?userId=${userEmail}`
          );
          const sentData = await sentResponse.json();
          const sentRemindersWithIds = sentData.reminders.map((reminder) => ({
            ...reminder,
            id: generateId(reminder, userEmail),
          }));
          setSentReminders(sentRemindersWithIds);
        } else {
          Logger.warn("User email not found.");
        }
      } else {
        Logger.warn("No user data found in AsyncStorage.");
      }
    } catch (error) {
      Logger.error("Error fetching reminders:", error);
    } finally {
      setLoading(false);
      setRefreshing(false); // Ensure refreshing state is reset after fetch
    }
  };

  const checkAndUpdatePushToken = async (newToken) => {
    try {
      const storedToken = await AsyncStorage.getItem("expoPushToken");

      if (storedToken !== newToken) {
        await AsyncStorage.setItem("expoPushToken", newToken);
        await sendPushTokenToBackend(newToken);
        Logger.log("Push token updated and sent to backend");
      } else {
        Logger.log("Push token already up to date");
      }
    } catch (error) {
      Logger.error("Error checking and updating push token:", error);
    }
  };

  const setupNotifications = async () => {
    try {
      Logger.log("Starting to set up notifications...");

      Logger.log("Checking notification permissions...");
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      Logger.log("Existing notification permission status:", existingStatus);

      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        Logger.log("Requesting notification permissions...");
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        Logger.log("New notification permission status:", finalStatus);
      }

      if (finalStatus !== "granted") {
        Logger.warn("Notification permissions not granted");
        return;
      }

      Logger.log("Registering for push notifications...");
      const token = await registerForPushNotificationsAsync();
      Logger.log("Push token received:", token);

      if (token) {
        setExpoPushToken(token);
        await checkAndUpdatePushToken(token);
      } else {
        Logger.warn("Failed to get push token");
      }
    } catch (error) {
      Logger.error("Error setting up notifications:", error);
      if (error.stack) {
        Logger.error("Error stack:", error.stack);
      }
    }
  };

  useEffect(() => {
    setupNotifications();

    notificationListeners.current = addNotificationListeners(
      (notification) => {
        Logger.log("Notification received:", notification);
        handleIncomingReminder(notification);
      },
      (response) => {
        Logger.log("Notification response received:", response);
        // Handle notification response (e.g., when user taps on the notification)
      }
    );

    fetchReminders();

    return () => {
      if (notificationListeners.current) {
        removeNotificationListeners(notificationListeners.current);
      }
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReminders();
  }, []);

  const handleIncomingReminder = async (remoteMessage) => {
    // Extract reminder data from the message
    const newReminder = remoteMessage.data;

    // Optionally, show an alert or toast to inform the user
    await showImmediateNotification(
      "New Reminder",
      `New reminder: ${newReminder.reminderMessage}`
    );
  };

  const renderReminder = ({ item }) => (
    <View style={styles.reminderCard}>
      <Text style={styles.reminderMessage}>{item.reminderMessage}</Text>
      <Text style={styles.reminderSender}>
        Sent by: {item.reminderSenderUserName}
      </Text>
      <Text style={styles.reminderDateTime}>
        {new Date(item.reminderDateTime).toLocaleString()}
      </Text>
    </View>
  );

  const keyExtractor = (item, index) => {
    const id = item.id || index.toString(); // Use index as fallback if id is missing
    return id.toString(); // Ensure the key is a string
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const TabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === "upcoming" && styles.activeTab]}
        onPress={() => setActiveTab("upcoming")}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === "upcoming" && styles.activeTabText,
          ]}
        >
          Upcoming
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === "sent" && styles.activeTab]}
        onPress={() => setActiveTab("sent")}
      >
        <Text
          style={[styles.tabText, activeTab === "sent" && styles.activeTabText]}
        >
          Sent
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <TabBar />
      <FlatList
        data={activeTab === "upcoming" ? reminders : sentReminders}
        keyExtractor={keyExtractor}
        renderItem={renderReminder}
        onRefresh={onRefresh}
        refreshing={refreshing}
        contentContainerStyle={styles.flatListContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  reminderCard: {
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 15,
    marginTop: TOP_MARGIN,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  reminderMessage: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  reminderSender: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  reminderDateTime: {
    fontSize: 12,
    color: "#999",
  },
  flatListContent: {
    paddingTop: TOP_MARGIN,
  },
  tabBar: {
    flexDirection: "row",
    marginBottom: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#e0e0e0",
  },
  activeTab: {
    backgroundColor: "#007AFF",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  activeTabText: {
    color: "#fff",
  },
});
