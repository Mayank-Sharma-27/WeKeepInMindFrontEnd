import { View, Text, StyleSheet } from "react-native";
import Groups from "../../components/Groups";

export default function Tab() {
  return (
    <View style={styles.container}>
      <Groups />
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
