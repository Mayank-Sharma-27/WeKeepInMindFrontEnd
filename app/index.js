import { Stack, useNavigation } from "expo-router";
import { Text, View, StyleSheet } from "react-native";
import { useEffect } from "react";
import GoogleLogin from "../components/GoogleLogin"; // Correct import

export default function Home() {
  return (
    <View style={styles.container}>
      <GoogleLogin />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // Ensures the View takes up the full screen
    justifyContent: "center", // Centers content vertically
    alignItems: "center", // Centers content horizontally
    backgroundColor: "#f5f5f5", // Optional: Set a background color
  },
});
