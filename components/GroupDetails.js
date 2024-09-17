import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import Logger from "../../components/Logger"; // Import your logger

export default function GroupDetails() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const route = useRoute(); // Get route parameters
  const { groupId } = route.params; // Get the passed groupId

  useEffect(() => {
    const fetchReminders = async () => {
      try {
        const response = await fetch(
          `http://10.0.0.54:8080/get-upcoming-group-reminders?groupId=${groupId}`
        );

        const data = await response.json();
        setReminders(data.reminders); // Assuming the API returns an array of reminders
        Logger.log(
          `Fetched ${data.reminders.length} reminders for group ${groupId}`
        );
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchReminders();
  }, [groupId]); // Fetch reminders when groupId changes

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (error) {
    return <Text style={styles.errorText}>Error: {error}</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Group Reminders</Text>
      <FlatList
        data={reminders}
        keyExtractor={(item) => item.reminderId.toString()}
        renderItem={({ item }) => (
          <View style={styles.reminderItem}>
            <Text style={styles.reminderText}>Reminder: {item.message}</Text>
            <Text style={styles.reminderText}>Time: {item.time}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  reminderItem: {
    padding: 15,
    backgroundColor: "#ffffff",
    borderRadius: 5,
    marginBottom: 10,
  },
  reminderText: {
    fontSize: 16,
  },
  errorText: {
    color: "red",
  },
});
