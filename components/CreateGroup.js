import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import Logger from "./Logger";

export default function CreateGroup() {
  const [groupName, setGroupName] = useState("");
  const router = useRouter();

  const handleCreateGroup = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const userObject = JSON.parse(userData);
        const userEmail = userObject.email; // Assuming the user object has a 'name' field

        const response = await fetch("http://10.0.0.54:8080/create-group", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            groupName: groupName,
            email: userEmail,
          }),
        });

        const data = await response.json();

        if (response.ok && data.status === 200) {
          Logger.log("Group created successfully:", data);
          Alert.alert("Success", "Group created successfully!", [
            {
              text: "OK",
              onPress: () => router.replace("/tabs/groups"),
            },
          ]);
        } else {
          Logger.error("Failed to create group:", data);
          Alert.alert("Error", "Failed to create group. Please try again.");
        }
      }
    } catch (error) {
      Logger.error("Error creating group:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create New Group</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter group name"
        value={groupName}
        onChangeText={setGroupName}
      />
      <Button title="Create Group" onPress={handleCreateGroup} />
      <Button title="Cancel" onPress={() => router.back()} color="gray" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
});
