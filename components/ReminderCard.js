import React from "react";
import { View, Text, StyleSheet } from "react-native";

const ReminderCard = ({ reminder }) => (
  <View style={styles.reminderCard}>
    <Text style={styles.reminderMessage}>{reminder.reminderMessage}</Text>
    <Text style={styles.reminderSender}>
      Sent by: {reminder.reminderSenderUserName}
    </Text>
    <Text style={styles.reminderDateTime}>
      {new Date(reminder.reminderDateTime).toLocaleString()}
    </Text>
  </View>
);

const styles = StyleSheet.create({
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

export default ReminderCard;
