import React, { useEffect, useState } from "react";
import { TouchableOpacity, Button, View, Text, StyleSheet } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { makeRedirectUri } from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();

export default function GoogleLogin({ navigation }) {
  const [userInfo, setUserInfo] = useState(null);
  const redirectUri = makeRedirectUri();
  //client IDs from .env
  const config = {
    androidClientId:
      "999713381835-fog5jamno603lnn175g9buc15bpkfk7v.apps.googleusercontent.com",
    iosClientId:
      "999713381835-nsjkc9v3gudkkungn9pvdbp5bo5jjg60.apps.googleusercontent.com",
    webClientId:
      "999713381835-fog5jamno603lnn175g9buc15bpkfk7v.apps.googleusercontent.com",
          scopes: ['profile', 'email'],
    redirectUri: Platform.select({
      web: "http://localhost:8081",
      ios: "com.googleusercontent.apps.999713381835-nsjkc9v3gudkkungn9pvdbp5bo5jjg60:/oauthredirect", // Use the iOS URL Scheme here
      default: "https://auth.expo.io/@your-username/WeKeepInMindFrontEnd", // Expo proxy for Android
    }),
  };

  const [request, response, promptAsync] = Google.useAuthRequest(config);

  const getUserInfo = async (token) => {
    //absent token
    if (!token) return;
    //present token
    try {
      const response = await fetch(
        "https://www.googleapis.com/userinfo/v2/me",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const user = await response.json();
      //store user information  in Asyncstorage
      await AsyncStorage.setItem("user", JSON.stringify(user));
      setUserInfo(user);
    } catch (error) {
      console.error(
        "Failed to fetch user data:",
        response.status,
        response.statusText
      );
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Attempt to retrieve user information from AsyncStorage
      const userJSON = await AsyncStorage.getItem("user");

      if (userJSON) {
        // If user information is found in AsyncStorage, parse it and set it in the state
        setUserInfo(JSON.parse(userJSON));
      } else if (response?.type === "success") {
        // If no user information is found and the response type is "success" (assuming response is defined),
        // call getUserInfo with the access token from the response
        getUserInfo(response.authentication.accessToken);
      }
    } catch (error) {
      // Handle any errors that occur during AsyncStorage retrieval or other operations
      console.error("Error retrieving user data from AsyncStorage:", error);
    }
  };

  //add it to a useEffect with response as a dependency
  useEffect(() => {
    signInWithGoogle();
  }, [response]);

  const handleGoogleLogin = async () => {
    promptAsync(); // This triggers the login flow
  };

  //log the userInfo to see user details
  console.log(JSON.stringify(userInfo));

  return (
    <View style={styles.container}>
      {userInfo ? (
        <Text>Welcome, {userInfo.name}</Text>
      ) : (
        <TouchableOpacity
          style={styles.googleButton}
          onPress={handleGoogleLogin}
        >
          <Text style={styles.buttonText}>Login with Google</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center", // Centers vertically
    alignItems: "center", // Centers horizontally
    backgroundColor: "#f5f5f5", // Optional: A light background color for better contrast
  },
  googleButton: {
    backgroundColor: "#4285F4", // Google blue
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5, // Shadow for Android
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
});
