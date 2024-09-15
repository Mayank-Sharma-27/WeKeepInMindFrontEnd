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

export { scheduleNotifications };
