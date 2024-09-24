import messaging from "@react-native-firebase/messaging";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Logger from "./Logger";

export const setupFCM = async (handleIncomingReminder) => {
  try {
    await messaging().registerDeviceForRemoteMessages();
    const token = await messaging().getToken();
    await updateFCMToken(token);

    const unsubscribe = messaging().onTokenRefresh(async (newToken) => {
      await updateFCMToken(newToken);
    });

    const messageUnsubscribe = messaging().onMessage(async (remoteMessage) => {
      Logger.log("Received FCM message:", remoteMessage);
      await handleIncomingReminder(remoteMessage.data);
    });

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
