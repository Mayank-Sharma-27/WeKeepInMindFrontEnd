import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Logger from "./Logger"; // Adjust the path as needed
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

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

  try {
    Logger.log("Starting registerForPushNotificationsAsync...");

    if (!Device.isDevice) {
      Logger.warn(
        "Push notifications don't work on simulators/emulators. Use a physical device."
      );
      return;
    }

    Logger.log("Checking notification permissions...");
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    Logger.log("Existing permission status:", existingStatus);

    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      Logger.log("Requesting notification permissions...");
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      Logger.log("New permission status:", finalStatus);
    }

    if (finalStatus !== "granted") {
      Logger.warn("Failed to get push token for push notification!");
      return;
    }

    Logger.log("Getting Expo push token...");
    console.log("Project ID:", Constants.expoConfig.extra.eas.projectId);
    const tokenObject = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig.extra.eas.projectId,
    });

    const token = tokenObject.data;
    Logger.log(`Expo Push Token: ${token}`);

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    return token;
  } catch (error) {
    Logger.error(
      `Error in registerForPushNotificationsAsync: ${error.message}`
    );
    Logger.error(`Error stack: ${error.stack}`);
    if (error.stack) {
      Logger.error("Error stack:", error.stack);
    }
    return null;
  }
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

      const storedToken = await AsyncStorage.getItem("expoPushToken");
      if (storedToken === token) {
        Logger.log("Token already sent to backend");
        return;
      }

      const response = await fetch("http://10.0.0.54:8080/update-push-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userEmail, // Matches the 'email' field in UpdateTokenRequest
          token: token, // Matches the 'token' field in UpdateTokenRequest
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update push token on server");
      }

      Logger.log(`Backend response status: ${response.status}`);
      const responseData = await response.json();
      Logger.log(`Backend response data:`, JSON.stringify(responseData));

      if (responseData.statusCode === 200) {
        if (responseData.message === "USER_UPDATED") {
          await AsyncStorage.setItem("expoPushToken", token);
          Logger.log("Push token updated on server successfully");
        } else if (responseData.message === "USER_DOES_NOT_EXISTS") {
          Logger.warn("User does not exist on the server");
        }
      } else {
        Logger.error("Unexpected response from server:", responseData);
      }
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
