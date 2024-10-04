import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import Logger from "./Logger";

export default function GroupDetails() {
  const [reminders, setReminders] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('Reminders');

  const { groupId } = useLocalSearchParams();
  Logger.log(`Group id ${groupId}`);

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const [remindersResponse, membersResponse] = await Promise.all([
          fetch(`http://10.0.0.54:8080/get-upcoming-group-reminders?groupId=${groupId}`),
          fetch(`http://10.0.0.54:8080/get-group-members?groupId=${groupId}`)
        ]);

        const remindersData = await remindersResponse.json();
        const membersData = await membersResponse.json();

        setReminders(remindersData.upcomingReminders || []);
        setMembers(membersData.members || []);
        setLoading(false);
      } catch (err) {
        Logger.error('Error fetching group data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchGroupData();
  }, [groupId]);

  const handleAddMember = () => {
    Logger.log("Add member button pressed");
    // Implement the logic to add a new member
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (error) {
    return <Text style={styles.errorText}>Error: {error}</Text>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'Reminders' && styles.activeTabButton]}
          onPress={() => setActiveTab('Reminders')}
        >
          <Text style={styles.tabButtonText}>Reminders</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'Members' && styles.activeTabButton]}
          onPress={() => setActiveTab('Members')}
        >
          <Text style={styles.tabButtonText}>Members</Text>
        </TouchableOpacity>
      </View>
      
      {activeTab === 'Reminders' ? (
        reminders.length > 0 ? (
          <FlatList
            data={reminders}
            keyExtractor={(item) => item.reminderId.toString()}
            renderItem={({ item }) => (
              <View style={styles.reminderItem}>
                <Text style={styles.reminderText}>Message: {item.reminderMessage}</Text>
                <Text style={styles.reminderText}>Sender: {item.reminderSenderUser?.userName || "Unknown"}</Text>
                <Text style={styles.reminderText}>Time: {new Date(item.reminderDateTime).toLocaleString()}</Text>
              </View>
            )}
          />
        ) : (
          <Text style={styles.noDataText}>No reminders found</Text>
        )
      ) : (
        <View>
          {members.length > 0 ? (
            <FlatList
              data={members}
              keyExtractor={(item) => item.userId.toString()}
              renderItem={({ item }) => (
                <View style={styles.memberItem}>
                  <Text style={styles.memberText}>{item.userName}</Text>
                </View>
              )}
            />
          ) : (
            <Text style={styles.noDataText}>No members found</Text>
          )}
          {members.length < 4 && (
            <TouchableOpacity style={styles.addButton} onPress={handleAddMember}>
              <Text style={styles.addButtonText}>Add Member</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginBottom: 10,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  reminderItem: {
    padding: 15,
    backgroundColor: "#ffffff",
    borderRadius: 5,
    marginBottom: 10,
    marginHorizontal: 10,
  },
  reminderText: {
    fontSize: 16,
  },
  memberItem: {
    padding: 15,
    backgroundColor: "#ffffff",
    borderRadius: 5,
    marginBottom: 10,
    marginHorizontal: 10,
  },
  memberText: {
    fontSize: 16,
  },
  errorText: {
    color: "red",
    textAlign: 'center',
    marginTop: 20,
  },
  addButton: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 20,
    marginHorizontal: 10,
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  noDataText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});
