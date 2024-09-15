import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Pressable,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Logger from "./Logger"; // Adjust the path as needed
import DateTimePicker from "@react-native-community/datetimepicker";

export default function SendReminder() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [reminderMessage, setReminderMessage] = useState("");
  const [reminderDate, setReminderDate] = useState(new Date());
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);

  const toggleDatePicker = () => {
    setShowDatePicker(!showDatePicker);
  };

    const toggleGroupPicker = () => {
      setShowGroupPicker(!showGroupPicker);
    };

  const confirmIosDate = () => {
    setReminderDate(reminderDate.toDateString());
    toggleDatePicker();
  };

  const onchange = ({ type }, selectedDate) => {
    if (type == "set") {
      const currentDate = selectedDate;
      setReminderDate(currentDate);

      if (Platform.OS === "ios") {
        toggleDatePicker();
        setReminderDate(currentDate.toDateString());
      }
    } else {
      toggleDatePicker();
    }
  };

  // Fetch groups from local storage
  const loadGroupsFromLocalStorage = async () => {
    try {
      const storedGroups = await AsyncStorage.getItem("groups");
      if (storedGroups) {
        setGroups(JSON.parse(storedGroups));
      } else {
        setGroups([]);
      }
      setLoading(false);
    } catch (error) {
      Logger.error("Error loading groups from local storage:", error);
      setLoading(false);
    }
  };

  // Fetch and update groups
  const fetchGroups = async () => {
    setRefreshing(true);
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const userObject = JSON.parse(userData);
        const userEmail = userObject.email;
        Logger.log(`Getting user for ${userEmail}`);
        if (userEmail) {
          const response = await fetch(
            `http://10.0.0.54:8080/get-groups-by-user?userId=${userEmail}`
          );
          const data = await response.json();
          Logger.log(`Data from the group: ${JSON.stringify(data.groups)}`);

          if (data.groups) {
            data.groups.forEach((group) => {
              if (group.groupUsers && Array.isArray(group.groupUsers)) {
                Logger.log(`Group: ${group.groupName}`);
                group.groupUsers.forEach((user) => {
                  Logger.log(`User: ${user.userName}`);
                });
              } else {
                Logger.warn(`No users found for group: ${group.groupName}`);
              }
            });
          }

          await AsyncStorage.setItem("groups", JSON.stringify(data.groups));
          setGroups(data.groups);
        }
      }
    } catch (error) {
      Logger.error("Error fetching groups:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle group selection
  const handleGroupSelect = (groupId) => {
    // Find the selected group from the list of groups
    const selectedGroup = groups.find((group) => group.groupId === groupId);

    // Log the selected group name
    Logger.log(`Selected Group Name: ${selectedGroup?.groupName}`);

    // Log the users in the selected group
    if (selectedGroup && selectedGroup.groupUsers) {
      Logger.log(`Users in the selected group:`);
      selectedGroup.groupUsers.forEach((user) => {
        Logger.log(`Username: ${user.userName}`);
      });
    } else {
      Logger.log("No users found in the selected group");
    }

    // Update state or any other actions with the selected group
    setSelectedGroup(selectedGroup);
    setSelectedUsers([]); // Clear selected users when the group changes
    setUsers(selectedGroup ? selectedGroup.groupUsers : []);
    setSelectedGroupId(groupId); // Update selected group ID
  };

  // Send reminder
  const handleSendReminder = async () => {
    if (
      !selectedGroup ||
      !reminderMessage ||
      !reminderDateTime ||
      selectedUsers.length === 0
    ) {
      Logger.warn("Please fill all fields.");
      return;
    }

    try {
      const userData = await AsyncStorage.getItem("user");
      const userObject = JSON.parse(userData);
      const userEmail = userObject.email;

      const response = await fetch("http://10.0.0.54:8080/send-reminder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupId: selectedGroup.groupId,
          reminderSenderUser: { userEmail },
          reminderMessage,
          reminderUsers: selectedUsers,
          reminderEditorUsers: [], // Populate if needed
          reminderDateTime,
        }),
      });

      const data = await response.json();
      Logger.log("Reminder response:", data);

      if (data.responseCode === 200) {
        Logger.log("Reminder sent successfully.");
      } else {
        Logger.warn("Failed to send reminder:", data.responseMessage);
      }
    } catch (error) {
      Logger.error("Error sending reminder:", error);
    }
  };

  useEffect(() => {
    loadGroupsFromLocalStorage();
  }, []);

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          {/* FontAwesome Refresh Icon */}
          <TouchableOpacity onPress={fetchGroups} style={styles.refreshIcon}>
            <FontAwesome name="refresh" size={28} color="black" />
          </TouchableOpacity>

          {/* Group Picker */}
          <Picker
            selectedValue={selectedGroupId}
            onValueChange={(itemValue) => handleGroupSelect(itemValue)}
            style={{ marginVertical: 10, flex: 1 }}
          >
            <Picker.Item label="Select group" value={null} />
            {groups.map((group) => (
              <Picker.Item
                key={group.groupId}
                label={group.groupName}
                value={group.groupId}
              />
            ))}
          </Picker>

          {/* Users Picker */}
          <Picker
            selectedValue={selectedUsers.length > 0 ? selectedUsers[0] : null}
            onValueChange={(itemValue) => setSelectedUsers([itemValue])}
            style={{ marginVertical: 10, flex: 1 }} // Adjust margin as needed
            enabled={!!selectedGroup}
          >
            <Picker.Item label="Select user" value={null} />
            {users.map((user) => (
              <Picker.Item
                key={user.userId}
                label={user.userName}
                value={user.userId}
              />
            ))}
          </Picker>

          <Text> Reminder Date</Text>
          {showDatePicker && (
            <DateTimePicker
              mode="date"
              display="spinner"
              value={reminderDate}
              onchange={onchange}
              style={{ width: "100%", marginVertical: 10 }}
            />
          )}

          {showDatePicker && Platform.OS === "ios" && (
            <View
              style={{ flexDirection: "row", justifyContent: "space-around" }}
            >
              <TouchableOpacity onPress={toggleDatePicker}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmIosDate}>
                <Text>Confirm</Text>
              </TouchableOpacity>
            </View>
          )}

          {!showDatePicker && (
            <Pressable onPress={toggleDatePicker}>
              <TextInput
                style={styles.input}
                placeholder="Select Date"
                value={reminderDate}
                onChangeText={setReminderDate}
                editable={false}
                onPressIn={toggleDatePicker}
                editable={false}
                onPressIn={toggleDatePicker}
              />
            </Pressable>
          )}

          <TextInput
            style={styles.input}
            placeholder="Reminder Message"
            value={reminderMessage}
            onChangeText={setReminderMessage}
          />

          <Button title="Send Reminder" onPress={handleSendReminder} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center", // Align items to the center vertically
  },
  picker: {
    height: 50, // Adjusted height for better appearance
    marginVertical: 10,
    width: "100%", // Ensure picker takes full width
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginVertical: 10,
    paddingHorizontal: 10,
  },
  refreshIcon: {
    alignSelf: "center",
    marginVertical: 10,
  },
  datePickerButton: {
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    marginVertical: 10,
    alignItems: "center", // Center the content inside the button
  },
  datePickerText: {
    fontSize: 16,
    color: "#333",
  },
});
