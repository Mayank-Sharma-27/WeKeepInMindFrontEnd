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
import { scheduleNotifications } from "./Notification";
import messaging from "@react-native-firebase/messaging";

const { height } = Dimensions.get("window");
const TOP_MARGIN = height * 0.05; // 5% of the screen height

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const generateId = (reminder, userEmail) => {
    const { reminderSenderUserName, reminderDateTime } = reminder;
    const reminderTimestamp = new Date(reminderDateTime).toISOString();

    return `${reminderSenderUserName}-${userEmail}-${reminderTimestamp}`;
  };

  // Fetch reminders from local storage on component load
  const loadRemindersFromLocalStorage = async () => {
    try {
      Logger.log("Fetching reminders");
      const storedReminders = await AsyncStorage.getItem("reminders");
      Logger.log("Fetched reminders :", storedReminders);
      if (storedReminders) {
        const parsedReminders = JSON.parse(storedReminders);
        const currentTime = new Date();

        const activeReminders = parsedReminders.filter((reminder) => {
          const reminiderTime = new Date(reminder.reminderDateTime);
          return reminderTime > currentTime;
        });
        setReminders(activeReminders);

        if (activeReminders.length !== parsedReminders.length) {
          await AsyncStorage.setItem(
            "reminders",
            JSON.stringify(activeReminders)
          );
          Logger.log("Removed expired reminders from storage");
        }
      } else {
        // If no reminders are found in local storage, initialize with an empty array
        setReminders([]);
      }
      setLoading(false);
    } catch (error) {
      Logger.error("Error loading reminders from local storage:", error);
      setLoading(false);
    }
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
    loadRemindersFromLocalStorage();
    setupFCM();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReminders();
  }, []);

  const setupFCM = async () => {
    try {
      await messaging().registerDeviceForRemoteMessages();
      const token = await messaging().getToken();
      await updateFCMToken(token);

      const unsubscribe = messaging().onTokenRefresh(async (newToken) => {
        await updateFCMToken(newToken);
      });

      // Set up a listener for incoming messages when the app is in the foreground
      const messageUnsubscribe = messaging().onMessage(
        async (remoteMessage) => {
          Logger.log("Received FCM message:", remoteMessage);
          // Handle the incoming message (e.g., add it to the reminders list)
          await handleIncomingReminder(remoteMessage);
        }
      );

      return () => {
        unsubscribe();
        messageUnsubscribe();
      };
    } catch (error) {
      Logger.error("Error setting up FCM:", error);
    }
  };

  const updateFCMToken = async (token) => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const userObject = JSON.parse(userData);
        const response = await fetch("http://10.0.0.54:8080/update-fcm-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userObject.email,
            fcmToken: token,
          }),
        });
        if (!response.ok) {
          throw new Error("Failed to update FCM token");
        }
        Logger.log("FCM token updated successfully");
      }
    } catch (error) {
      Logger.error("Error updating FCM token:", error);
    }
  };

  const handleIncomingReminder = async (remoteMessage) => {
    // Extract reminder data from the message
    const newReminder = remoteMessage.data;

    // Add the new reminder to the state and local storage
    setReminders((prevReminders) => [...prevReminders, newReminder]);

    // Update AsyncStorage
    const storedReminders = JSON.parse(
      (await AsyncStorage.getItem("reminders")) || "[]"
    );
    await AsyncStorage.setItem(
      "reminders",
      JSON.stringify([...storedReminders, newReminder])
    );

    // Schedule a notification for the new reminder
    await scheduleNotifications([newReminder]);

    // Optionally, show an alert or toast to inform the user
    Alert.alert("New Reminder", "You have received a new reminder!");
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
