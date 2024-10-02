import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Logger from "./Logger"; // Adjust the path as needed

// Set up the notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Request notification permissions
const requestPermissions = async () => {
  Logger.log("Requesting notification permissions...");
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") {
    Logger.warn("Notification permission not granted");
    return false;
  }
  Logger.log("Notification permissions granted.");
  return true;
};

// Schedule a single notification
const scheduleNotification = async (reminder) => {
  const { reminderMessage, reminderDateTime } = reminder;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Reminder",
      body: reminderMessage,
      sound: true,
    },
    trigger: {
      date: new Date(reminderDateTime), // Use the specific reminder time
    },
  });
};

// Schedule notifications for an array of reminders
const scheduleNotifications = async (reminders) => {
  const status = await requestPermissions();

  if (status) {
    Logger.log("Notification permissions granted.");
    const scheduledReminders = JSON.parse(
      (await AsyncStorage.getItem("scheduledReminders")) || "[]"
    );
    Logger.log(
      "Scheduled reminders loaded from AsyncStorage:",
      scheduledReminders
    );

    for (const reminder of reminders) {
      const { id } = reminder;

      Logger.log(
        `Processing reminder ID: ${id}, scheduled for: ${new Date(
          new Date(reminder.reminderDateTime).getTime()
        ).toLocaleString()}`
      );

      try {
        const isReminderAlreadyScheduled = scheduledReminders.some(
          (scheduledReminder) => scheduledReminder.id === id
        );

        if (!isReminderAlreadyScheduled) {
          Logger.log(`Scheduling new notification for reminder ID: ${id}`);
          await scheduleNotification(reminder);

          scheduledReminders.push({
            id,
            reminderTime: new Date(reminder.reminderDateTime).getTime(),
          });
          await AsyncStorage.setItem(
            "scheduledReminders",
            JSON.stringify(scheduledReminders)
          );
          Logger.log(`Reminder ID: ${id} scheduled successfully.`);
        } else {
          Logger.log(`Reminder ID: ${id} is already scheduled.`);
        }
      } catch (error) {
        Logger.error(`Error processing reminder ID: ${id}`, error);
      }
    }
  } else {
    Logger.warn("Notification permission not granted");
  }
};

const showImmediateNotification = async (title, body) => {
  const status = await requestPermissions();

  if (status) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: body,
          sound: true,
        },
        trigger: null,
      });
      Logger.log("Immediate notifications shown successfully");
    } catch (error) {
      Logger.error("Error showing immediate notification:", error);
    }
  } else {
    Logger.warn(
      "Notification permission not granted for immediate notification"
    );
  }
};

const registerForPushNotificationsAsync = async () => {
  let token;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    Logger.warn("Failed to get push token for push notification!");
    return;
  }

  token = (await Notifications.getExpoPushTokenAsync()).data;
  Logger.log("Expo Push Token:", token);

  // Store the token in AsyncStorage
  await AsyncStorage.setItem("expoPushToken", token);

  return token;
};

// Add notification listeners
const addNotificationListeners = (
  onNotificationReceived,
  onNotificationResponse
) => {
  const receivedSubscription = Notifications.addNotificationReceivedListener(
    onNotificationReceived
  );
  const responseSubscription =
    Notifications.addNotificationResponseReceivedListener(
      onNotificationResponse
    );

  return { receivedSubscription, responseSubscription };
};

// Remove notification listeners
const removeNotificationListeners = (subscriptions) => {
  if (subscriptions.receivedSubscription) {
    Notifications.removeNotificationSubscription(
      subscriptions.receivedSubscription
    );
  }
  if (subscriptions.responseSubscription) {
    Notifications.removeNotificationSubscription(
      subscriptions.responseSubscription
    );
  }
};

// Send push token to backend
const sendPushTokenToBackend = async (token) => {
  try {
    const userData = await AsyncStorage.getItem("user");
    if (userData) {
      const userObject = JSON.parse(userData);
      const userEmail = userObject.email;

      // Replace with your actual API endpoint
      const response = await fetch("http://10.0.0.54:8080/update-push-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userEmail: userEmail,
          pushToken: token,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update push token on server");
      }

      Logger.log("Push token updated on server successfully");
    }
  } catch (error) {
    Logger.error("Error sending token to backend:", error);
  }
};

export {
  scheduleNotifications,
  showImmediateNotification,
  registerForPushNotificationsAsync,
  addNotificationListeners,
  removeNotificationListeners,
  sendPushTokenToBackend,
};
