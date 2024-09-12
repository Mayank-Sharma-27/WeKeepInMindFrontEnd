import { View, Text, StyleSheet } from "react-native";
import Reminders from "../../components/Reminders";

export default function Tab() {
  return (
    <View style={styles.container}>
      <Reminders />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
