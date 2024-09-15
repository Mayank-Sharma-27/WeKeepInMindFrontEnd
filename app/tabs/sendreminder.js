import { View, Text, StyleSheet } from "react-native";
import SendReminder from "../../components/SendReminder";

export default function Tab() {
  return (
    <View style={styles.container}>
      <SendReminder />
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
