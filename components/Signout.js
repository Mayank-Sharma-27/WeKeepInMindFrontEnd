import React, { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function Signout() {
  const router = useRouter(); // Get the navigation object

  // Function to handle the sign-out process
  const handleSignOut = async () => {
    try {
      await AsyncStorage.clear();

      // Navigate to the login screen
      router.push(`/tabs/login/`);
    } catch (error) {
      console.log("Error during sign-out:", error);
    }
  };

  // Trigger the sign-out process when the component loads
  useEffect(() => {
    handleSignOut();
  }, []);

  return (
    <View style={styles.container}>
      {/* Display a loading indicator while signing out */}
      <ActivityIndicator size="large" color="#0000ff" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
  },
});
