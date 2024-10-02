import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Button,
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
          const response = await fetch(
            `http://10.0.0.54:8080/get-by-user?userId=${userEmail}`
          );
          const data = await response.json();
          Logger.log("Reminders fetched successfully.");

          // Generate ids for the fetched reminders
          const remindersWithIds = data.reminders.map((reminder) => ({
            ...reminder,
            id: generateId(reminder, userEmail),
          }));

          // Retrieve existing reminders from AsyncStorage
          const storedReminders = JSON.parse(
            (await AsyncStorage.getItem("reminders")) || "[]"
          );

          // Create a map of existing reminders by id
          const existingRemindersMap = new Map(
            storedReminders.map((reminder) => [reminder.id, reminder])
          );

          // Filter out existing reminders to avoid duplication
          const newReminders = remindersWithIds.filter(
            (reminder) => !existingRemindersMap.has(reminder.id)
          );

          if (newReminders.length > 0) {
            // Update state with new reminders
            setReminders((prevReminders) => [
              ...prevReminders,
              ...newReminders,
            ]);

            // Save new reminders to AsyncStorage
            await AsyncStorage.setItem(
              "reminders",
              JSON.stringify([...storedReminders, ...newReminders])
            );

            // Schedule notifications for new reminders
            await scheduleNotifications(newReminders);
          } else {
            Logger.log("No new reminders to add.");
          }
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

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      setExpoPushToken(token);
      if (token) {
        sendPushTokenToBackend(token);
      }
    });

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

  return (
    <View style={styles.container}>
      <Button title="Refresh Reminders" onPress={fetchReminders} />
      <FlatList
        data={reminders}
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
});
