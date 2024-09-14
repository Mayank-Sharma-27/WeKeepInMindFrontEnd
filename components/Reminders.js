import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Reminders() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReminders = async () => {
      try {
        const userData = await AsyncStorage.getItem("user"); // Fetch the entire user object
        if (userData) {
          const userObject = JSON.parse(userData); // Parse the user data
          const userId = userObject.id; // Access the user id
          const userEmail = userObject.email; // Access the email
          console.log("User ID:", userId);
          console.log("User Email:", userEmail);

          if (userId) {
            const response = await fetch(
              `http://localhost:8080/get-by-user?userId=${userEmail}`
            );
            const data = await response.json();
            setReminders(data.reminders);
          }
        } else {
          console.log("No user data found in AsyncStorage");
        }
      } catch (error) {
        console.error("Error fetching reminders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReminders();
  }, []);

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

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {reminders.length === 0 ? (
        <Text> No upcoming reminders</Text>
      ) : (
        <FlatList
          data={reminders}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderReminder}
        />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
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
});
