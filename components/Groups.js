import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import Logger from "./Logger";
import { useRouter } from "expo-router";

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          const userObject = JSON.parse(userData);
          const userEmail = userObject.email;

          if (userEmail) {
            const response = await fetch(
              `http://10.0.0.54:8080/get-groups-by-user?userId=${userEmail}`
            );

            const data = await response.json();
            setGroups(data.groups);
            Logger.log(`Groups returned ${data.groups.length}`);
            setLoading(false);
          }
        }
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchGroups();
  }, []);

  // Function to handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGroups(); // Re-fetch the groups
    setRefreshing(false);
  };

  const renderGroup = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.groupItem}
        onPress={() => router.push(`/tabs/groups/${item.groupId}`)} // Dynamic navigation with groupId
      >
        <Text style={styles.groupName}>{item.groupName}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (error) {
    return <Text style={styles.errorText}>Error: {error}</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Groups</Text>
      <FlatList
        data={groups}
        renderItem={renderGroup}
        keyExtractor={(item) => item.groupId.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 60,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  groupItem: {
    padding: 15,
    backgroundColor: "#ffffff",
    borderRadius: 5,
    marginBottom: 10,
  },
  groupName: {
    fontSize: 18,
  },
  errorText: {
    color: "red",
  },
});
