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
  Switch,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import Logger from "./Logger"; // Adjust the path as needed
import DateTimePicker from "@react-native-community/datetimepicker";
import { CheckBox } from "react-native-elements";
import { useRouter } from "expo-router";

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

  const router = useRouter();

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
        setReminderTime(currentTime.toLocaleTimeString());
      }
      setShowTimePicker(false);
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

          if (data.groups && Array.isArray(data.groups)) {
            setGroups(data.groups);
            Logger.log(`Groups set: ${JSON.stringify(data.groups)}`);

            if (data.groups.length === 1) {
              handleGroupSelect(data.groups[0].groupId);
            }
          } else {
            Logger.log("No groups found or groups is not an array");
            setGroups([]);
          }
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
    Logger.log(`Handling group selection for groupId: ${groupId}`);
    const selectedGroup = groups.find((group) => group.groupId === groupId);
    if (selectedGroup) {
      Logger.log(`Selected group: ${JSON.stringify(selectedGroup)}`);
      setSelectedGroup(selectedGroup);
      setSelectedGroupId(groupId);
    } else {
      Logger.log(`No group found with id: ${groupId}`);
      setSelectedGroup(null);
      setSelectedGroupId(null);
    }
    setShowGroupPicker(false);
    setSelectedUsers([]);
  };

  const handleUserSelect = (user) => {
    setSelectedUsers((prevSelectedUsers) => {
      const isUserSelected = prevSelectedUsers.some(
        (u) => u.userId === user.userId
      );
      if (isUserSelected) {
        return prevSelectedUsers.filter((u) => u.userId !== user.userId);
      } else {
        return [...prevSelectedUsers, user];
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
      !reminderTime ||
      selectedUsers.length === 0
    ) {
      Logger.warn("Please fill all fields.");
      return;
    }

    try {
      Logger.log("Starting to send reminder...");

      const userData = await AsyncStorage.getItem("user");
      if (!userData) {
        throw new Error("User data not found in AsyncStorage");
      }
      Logger.log("User data retrieved from AsyncStorage");

      let userObject = JSON.parse(userData);
      Logger.log("User data parsed successfully");

      Logger.log("Preparing reminder data...");

      Logger.log(
        `reminderDate: ${reminderDate}, reminderTime: ${reminderTime}`
      );

      const dateObj = new Date(reminderDate);

      const [time, period] = reminderTime.split(" ");

      const [hours, minutes, seconds] = time.split(":");

      dateObj.setHours(
        period === "PM" ? (parseInt(hours) % 12) + 12 : parseInt(hours) % 12,
        parseInt(minutes),
        parseInt(seconds)
      );
      // Combine date and time strings
      const reminderDateTime = dateObj;

      Logger.log(`reminderDateTime created: ${reminderDateTime}`);

      if (isNaN(reminderDateTime.getTime())) {
        throw new Error(`Invalid date/time: ${dateTimeString}`);
      }
      const isoDateTime = reminderDateTime.toISOString();
      Logger.log(`Reminder date/time (ISO): ${isoDateTime}`);

      Logger.log(`Selected users: ${JSON.stringify(selectedUsers)}`);
      const reminderUsers = selectedUsers.map((user) => {
        Logger.log(`Processing user: ${JSON.stringify(user)}`);
        if (!user.userId || !user.userEmail || !user.userName) {
          throw new Error(`Invalid user data: ${JSON.stringify(user)}`);
        }
        return {
          userId: user.userId,
          userEmail: user.userEmail,
          userName: user.userName,
        };
      });
      Logger.log(`Reminder users processed: ${JSON.stringify(reminderUsers)}`);

      const requestBody = {
        groupId: selectedGroup.groupId,
        reminderSenderUser: userObject,
        reminderMessage,
        reminderUsers: reminderUsers,
        reminderEditorUsers: [],
        reminderDateTime: isoDateTime,
      };
      Logger.log("Request body prepared:", JSON.stringify(requestBody));

      Logger.log("Sending POST request to server...");
      const response = await fetch("http://10.0.0.54:8080/send-reminder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      Logger.log("Received response from server. Parsing JSON...");
      const data = await response.json();
      Logger.log("Reminder response:", data);

      if (data.responseCode === 200) {
        Logger.log("Reminder sent successfully.");
      } else {
        Logger.warn("Failed to send reminder:", data.responseMessage);
      }
    } catch (error) {
      Logger.error("Error sending reminder:", error.message);
      Logger.error("Error stack:", error.stack);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (groups.length === 1) {
      Logger.log(`Auto-selecting the only group: ${groups[0].groupId}`);
      handleGroupSelect(groups[0].groupId);
    }
  }, [groups]);

  useEffect(() => {
    Logger.log(`Selected group updated: ${JSON.stringify(selectedGroup)}`);
    if (selectedGroup) {
      if (Array.isArray(selectedGroup.groupUsers)) {
        setUsers(selectedGroup.groupUsers);
        Logger.log(
          `Users set from selected group: ${JSON.stringify(
            selectedGroup.groupUsers
          )}`
        );
      } else if (
        typeof selectedGroup.groupUsers === "object" &&
        selectedGroup.groupUsers !== null
      ) {
        const usersArray = Object.values(selectedGroup.groupUsers);
        setUsers(usersArray);
        Logger.log(
          `Users set from selected group (converted from object): ${JSON.stringify(
            usersArray
          )}`
        );
      } else {
        setUsers([]);
        Logger.log(
          "No users found in the selected group or groupUsers is not in the expected format"
        );
      }
    }
  }, [selectedGroup]);

  const UserItem = ({ user, isSelected, onSelect }) => (
    <View style={styles.userItem}>
      <Text>{user.userName}</Text>
      <Switch value={isSelected} onValueChange={() => onSelect(user)} />
    </View>
  );

  const navigateToCreateGroup = () => {
    router.push('/tabs/groups/create');
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (groups.length === 0) {
    return (
      <View style={styles.noGroupsContainer}>
        <Text style={styles.noGroupsText}>You are not part of any groups.</Text>
        <Button
          title="Create Group"
          onPress={navigateToCreateGroup}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.container}>
          {/* Group Selection */}
          {groups.length > 0 && (
            <View style={styles.groupSection}>
              <Text style={styles.sectionTitle}>
                Group: {groups.length === 1 ? groups[0].groupName : ""}
              </Text>
              {groups.length > 1 && (
                <>
                  <TouchableOpacity
                    onPress={toggleGroupPicker}
                    style={styles.pickerButton}
                  >
                    <Text style={styles.pickerText}>
                      {selectedGroup
                        ? selectedGroup.groupName
                        : "Select group"}
                    </Text>
                  </TouchableOpacity>

                  {showGroupPicker && (
                    <Picker
                      selectedValue={selectedGroupId}
                      onValueChange={(itemValue) =>
                        handleGroupSelect(itemValue)
                      }
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
                </>
              )}
            </View>
          )}

          {/* User Selection */}
          {(selectedGroup || groups.length === 1) && (
            <View style={styles.userListContainer}>
              <Text style={styles.sectionTitle}>Select Users:</Text>
              {users && users.length > 0 ? (
                <>
                  <Text>Number of users: {users.length}</Text>
                  <FlatList
                    data={users}
                    renderItem={({ item }) => {
                      Logger.log(
                        `Rendering user item: ${JSON.stringify(item)}`
                      );
                      return (
                        <UserItem
                          user={item}
                          isSelected={selectedUsers.some(
                            (u) => u.userId === item.userId
                          )}
                          onSelect={handleUserSelect}
                        />
                      );
                    }}
                    keyExtractor={(item) => item.userId}
                  />
                </>
              ) : (
                <Text>No users found in this group</Text>
              )}
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
        </View>
      </ScrollView>
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
  groupSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  groupName: {
    fontSize: 16,
    color: "#333",
  },
  userListContainer: {
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    maxHeight: 200, // Add this line to limit the height and make it scrollable
  },
  userItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  noGroupsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noGroupsText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
});