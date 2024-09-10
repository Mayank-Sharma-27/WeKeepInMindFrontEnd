import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router"; // Use Expo Router navigation

export default function LoginPage() {
  const [loginStatus, setLoginStatus] = useState("Logging in...");
  const router = useRouter(); // Expo Router navigation

  useEffect(() => {
    // Extract 'code', 'scope', 'authuser', and 'prompt' from the URL parameters
    const urlParams = new URLSearchParams(window.location.search); // Expo web-based
    const code = urlParams.get("code");
    const scope = urlParams.get("scope");
    const authUser = urlParams.get("authuser");
    const prompt = urlParams.get("prompt");

    if (code) {
      // Send the code and other parameters to the backend
      sendCodeToBackend({ code, scope, authUser, prompt });
    } else {
      setLoginStatus("Failed to retrieve authorization code.");
    }
  }, []);

  // Send the authorization code to the backend
  const sendCodeToBackend = async ({ code, scope, authUser, prompt }) => {
    try {
      const res = await fetch("http://localhost:8080/google-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, scope, authUser, prompt }), // Send the authorization code and other params
      });

      const data = await res.json();
      if (data.message === "USER_EXISTS") {
        // Send message back to original window
      } else {
        setLoginStatus("Login failed. New user registration required.");
      }
    } catch (error) {
      setLoginStatus("Error logging in.");
      console.error("Error sending code to backend:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text>{loginStatus}</Text>
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
