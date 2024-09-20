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
  Modal,
  FlatList,
  KeyboardAvoidingView,
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
  const [reminderDate, setReminderDate] = useState("");
  const [reminderTime, setReminderTime] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [showUserPicker, setShowUserPicker] = useState(false); // State for user picker visibility
  const [showUserConfirmation, setShowUserConfirmation] = useState(false); // State for user confirmation dialog
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());

  const toggleDatePicker = () => {
    setShowDatePicker(!showDatePicker);
  };

  const toggleTimePicker = () => {
    setShowTimePicker(!showTimePicker);
  };

  const toggleGroupPicker = () => {
    setShowGroupPicker(!showGroupPicker);
  };

  const toggleUserPicker = () => {
    setShowUserPicker(!showUserPicker);
  };

  const confirmUserSelection = () => {
    setShowUserConfirmation(false); // Close the confirmation dialog
    toggleUserPicker(); // Optionally close the picker as well
  };

  const cancelUserSelection = () => {
    setSelectedUsers([]); // Clear selected users if canceled
    setShowUserConfirmation(false); // Close the confirmation dialog
    toggleUserPicker(); // Optionally close the picker as well
  };

  const confirmIosDate = () => {
    setReminderDate(date.toDateString());
    toggleDatePicker();
  };

  const confirmIosTime = () => {
    const formattedTime = time.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    //setReminderDate(`${reminderDate} ${formattedTime}`);
    setReminderTime(time.toLocaleTimeString());
    toggleTimePicker();
  };

  const onchangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setDate(currentDate);
    if (Platform.OS === "android") {
      if (event.type === "set") {
        setReminderDate(currentDate.toDateString());
      }
      setShowDatePicker(false);
    }
  };

  const onchangeTime = (event, selectedTime) => {
    const currentTime = selectedTime || time;
    setTime(currentTime);
    if (Platform.OS === "android") {
      if (event.type === "set") {
        const formattedTime = currentTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
        setReminderDate(`${reminderDate} ${formattedTime}`);
      }
      setShowTimePicker(false);
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
                Logger.log(`No users found for group: ${group.groupName}`);
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
      setLoading(false);
    }
  };

  // Handle group selection
  const handleGroupSelect = (groupId) => {
    const selectedGroup = groups.find((group) => group.groupId === groupId);
    setSelectedGroup(selectedGroup);
    setUsers(selectedGroup ? selectedGroup.groupUsers : []);
    setSelectedGroupId(groupId);
    setShowGroupPicker(false); // Close the group picker after selection
    setSelectedUsers([]); // Clear selected users when the group changes
  };

  const handleUserSelect = (user) => {
    setSelectedUsers((prevSelectedUsers) => {
      // Ensure user is an object
      const userObject = typeof user === "string" ? JSON.parse(user) : user;

      const isUserSelected = prevSelectedUsers.some(
        (u) =>
          (typeof u === "string" ? JSON.parse(u).userId : u.userId) ===
          userObject.userId
      );

      if (isUserSelected) {
        // Remove user if already selected
        return prevSelectedUsers.filter(
          (u) =>
            (typeof u === "string" ? JSON.parse(u).userId : u.userId) !==
            userObject.userId
        );
      } else {
        // Add user if not already selected
        return [...prevSelectedUsers, userObject];
      }
    });
  };

  const handleTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || time;
    setShowTimePicker(false);
    setTime(currentTime);
    const formattedTime = currentTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    setReminderTime(formattedTime); // Set the reminder time in AM/PM format
  };

  // Send reminder
  const handleSendReminder = async () => {
    if (
      !selectedGroup ||
      !reminderMessage ||
      !reminderDate ||
      !reminderTime || // Ensure time is selected
      selectedUsers.length === 0
    ) {
      Logger.warn("Please fill all fields.");
      return;
    }

    try {
      const userData = await AsyncStorage.getItem("user");
      const userObject = JSON.parse(userData);
      const userEmail = userObject.email;
      const usersend = selectedUsers[0];
      const length = selectedUsers.length;
      Logger.log(`${length}`);
      Logger.log(`selectedUsers type: ${typeof selectedUsers}`);
      Logger.log(`selectedUsers length: ${selectedUsers.length}`);
      Logger.log(`First selected user type: ${typeof selectedUsers[0]}`);
      Logger.log(
        `All selected users: ${JSON.stringify(selectedUsers, null, 2)}`
      );
      const reminderDateTime = new Date(
        `${reminderDate} ${reminderTime}`
      ).toISOString();

      const reminderUsers = selectedUsers.map((user) => ({
        userId: user.userId,
        userEmail: user.userEmail,
        userName: user.userName,
      }));

      const response = await fetch("http://10.0.0.54:8080/send-reminder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupId: selectedGroup.groupId,
          reminderSenderUser: userObject,
          reminderMessage,
          reminderUsers: reminderUsers,
          reminderEditorUsers: [], // Populate if needed
          reminderDateTime: reminderDateTime, // Combine date and time
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
    fetchGroups();
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color="#0000ff" />
        ) : (
          <>
            {/* FontAwesome Refresh Icon */}
            {/* <TouchableOpacity onPress={fetchGroups} style={styles.refreshIcon}>
            <FontAwesome name="refresh" size={28} color="black" />
          </TouchableOpacity> */}

            {/* Group Picker Button */}
            <TouchableOpacity
              onPress={toggleGroupPicker}
              style={styles.pickerButton}
            >
              <Text style={styles.pickerText}>
                {selectedGroup ? selectedGroup.groupName : "Select group"}
              </Text>
            </TouchableOpacity>

            {/* Group Picker */}
            {showGroupPicker && (
              <Picker
                selectedValue={selectedGroupId}
                onValueChange={(itemValue) => handleGroupSelect(itemValue)}
                style={styles.picker}
              >
                <Picker.Item label="Select group" value="" />
                {groups.map((group) => (
                  <Picker.Item
                    key={group.groupId}
                    label={group.groupName}
                    value={group.groupId}
                  />
                ))}
              </Picker>
            )}

            {/* User Picker Button */}
            <TouchableOpacity
              onPress={toggleUserPicker}
              style={styles.pickerButton}
              disabled={!selectedGroup}
            >
              <Text style={styles.pickerText}>
                {selectedUsers.length > 0
                  ? `Selected ${selectedUsers.length} user(s): ${selectedUsers
                      .map((u) => u.userName)
                      .join(", ")}`
                  : "Select users"}
              </Text>
            </TouchableOpacity>
            {/* User Picker */}
            {showUserPicker && (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue=""
                  onValueChange={(itemValue) => handleUserSelect(itemValue)}
                  style={styles.picker}
                  mode="dropdown"
                >
                  <Picker.Item label="Select user" value="" />
                  {users.map((user) => (
                    <Picker.Item
                      key={user.userId}
                      label={user.userName}
                      value={JSON.stringify(user)}
                    />
                  ))}
                </Picker>
                {/* Confirmation Dialog for Users */}
                <View style={styles.confirmationButtons}>
                  <TouchableOpacity onPress={cancelUserSelection}>
                    <Text>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={confirmUserSelection}>
                    <Text>Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View>
              <Text>Reminder Date</Text>
              {showDatePicker && (
                <DateTimePicker
                  mode="date"
                  display="spinner"
                  value={date}
                  onChange={onchangeDate}
                  style={{ width: "100%", marginVertical: 10 }}
                />
              )}

              {showDatePicker && Platform.OS === "ios" && (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-around",
                  }}
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
                    editable={false}
                    onChangeText={setReminderDate}
                    onPressIn={toggleDatePicker}
                  />
                </Pressable>
              )}
            </View>

            <View>
              <Text>Reminder Time</Text>
              {showTimePicker && (
                <DateTimePicker
                  mode="time"
                  display="spinner"
                  value={time}
                  onChange={onchangeTime}
                  style={{ width: "100%", marginVertical: 10 }}
                />
              )}

              {showTimePicker && Platform.OS === "ios" && (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-around",
                  }}
                >
                  <TouchableOpacity onPress={toggleTimePicker}>
                    <Text>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={confirmIosTime}>
                    <Text>Confirm</Text>
                  </TouchableOpacity>
                </View>
              )}

              {!showTimePicker && (
                <Pressable onPress={toggleTimePicker}>
                  <TextInput
                    style={styles.input}
                    placeholder="Select Time"
                    value={reminderTime}
                    editable={false}
                    onChangeText={setReminderTime}
                    onPressIn={toggleTimePicker}
                  />
                </Pressable>
              )}
            </View>

            <TextInput
              style={styles.reminderInput}
              placeholder="Reminder Message"
              value={reminderMessage}
              onChangeText={setReminderMessage}
            />

            <Button title="Send Reminder" onPress={handleSendReminder} />
          </>
        )}
      </View>
    </KeyboardAvoidingView>
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
    height: 150, // Adjusted height for better appearance
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

  reminderInput: {
    height: 120,
    borderColor: "gray",
    borderWidth: 1,
    marginVertical: 10,
    paddingHorizontal: 10,
  },

  refreshIcon: {
    alignSelf: "center",
    marginVertical: 10,
  },
  pickerButton: {
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    marginVertical: 10,
    alignItems: "center", // Center the content inside the button
  },
  pickerText: {
    fontSize: 16,
    color: "#333",
  },
  pickerContainer: {
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "gray",
  },
  confirmationButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
  },
});
