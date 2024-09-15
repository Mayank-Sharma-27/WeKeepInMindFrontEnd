import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

const RefreshButton = ({ onRefresh }) => {
  return (
    <TouchableOpacity style={styles.button} onPress={onRefresh}>
      <Text style={styles.buttonText}>Refresh Reminders</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#1E90FF",
    padding: 10,
    borderRadius: 5,
    marginVertical: 15,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default RefreshButton;
