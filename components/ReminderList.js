import React from "react";
import { FlatList, StyleSheet } from "react-native";
import ReminderCard from "./ReminderCard";

const ReminderList = ({ reminders, onRefresh, refreshing }) => {
  const renderReminder = ({ item }) => <ReminderCard reminder={item} />;

  const keyExtractor = (item, index) => {
    const id = item.id || index.toString();
    return id.toString();
  };

  return (
    <FlatList
      data={reminders}
      renderItem={renderReminder}
      keyExtractor={keyExtractor}
      onRefresh={onRefresh}
      refreshing={refreshing}
      contentContainerStyle={styles.flatListContent}
    />
  );
};

const styles = StyleSheet.create({
  flatListContent: {
    paddingTop: 20,
  },
});

export default ReminderList;
