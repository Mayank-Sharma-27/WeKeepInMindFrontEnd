import AsyncStorage from "@react-native-async-storage/async-storage";

export const fetchReminders = async (page = 1, pageSize = 10) => {
  try {
    const userData = await AsyncStorage.getItem("user");
    if (userData) {
      const userObject = JSON.parse(userData);
      const userEmail = userObject.email;

      const response = await fetch(
        `http://localhost:8080/get-by-user?userId=${userEmail}&page=${page}&pageSize=${pageSize}`
      );
      const data = await response.json();

      // Sort reminders based on recent ones at the top
      const sortedReminders = data.reminders.sort(
        (a, b) => new Date(b.reminderDateTime) - new Date(a.reminderDateTime)
      );
      return sortedReminders;
    } else {
      console.log("No user data found in AsyncStorage");
      return [];
    }
  } catch (error) {
    console.error("Error fetching reminders:", error);
    return [];
  }
};
