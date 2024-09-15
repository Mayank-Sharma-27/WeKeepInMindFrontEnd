import React, {
  useState,
  useCallback,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { fetchReminders } from "./ReminderService";

// Use forwardRef to allow the parent to call the onRefresh function
const ReminderList = forwardRef((props, ref) => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const loadReminders = async (isRefreshing = false) => {
    if (isRefreshing) setRefreshing(true);
    else setLoading(true);

    const fetchedReminders = await fetchReminders(page, pageSize);

    setReminders((prevReminders) => {
      if (isRefreshing) return fetchedReminders;
      return [...prevReminders, ...fetchedReminders];
    });

    if (isRefreshing) setRefreshing(false);
    else setLoading(false);
  };

  useEffect(() => {
    loadReminders();
  }, [page]);

  const onEndReached = () => {
    setPage((prevPage) => prevPage + 1);
  };

  const onRefresh = useCallback(() => {
    setPage(1);
    loadReminders(true);
  }, []);

  // Expose the onRefresh method to the parent via ref
  useImperativeHandle(ref, () => ({
    onRefresh,
  }));

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

  return (
    <FlatList
      data={reminders}
      keyExtractor={(item, index) => index.toString()}
      renderItem={renderReminder}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.1}
      ListFooterComponent={loading && <ActivityIndicator size="large" />}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    />
  );
});

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

export default ReminderList;
