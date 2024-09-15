import React, { useEffect, useState } from "react";
import {
  TouchableOpacity,
  Button,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { makeRedirectUri } from "expo-auth-session";
import { useNavigation } from "expo-router";

WebBrowser.maybeCompleteAuthSession();

export default function GoogleLogin() {
  const [userInfo, setUserInfo] = useState(null);
  const navigation = useNavigation();
  const redirectUri = makeRedirectUri();
  //client IDs from .env
  const config = {
    androidClientId:
      "999713381835-fog5jamno603lnn175g9buc15bpkfk7v.apps.googleusercontent.com",
    iosClientId:
      "999713381835-nsjkc9v3gudkkungn9pvdbp5bo5jjg60.apps.googleusercontent.com",
    webClientId:
      "999713381835-fog5jamno603lnn175g9buc15bpkfk7v.apps.googleusercontent.com",
    scopes: ["profile", "email"],
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

      await sendUserInfoToBackend(user);
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
        navigateToHome();
      } else if (response?.type === "success") {
        // If no user information is found and the response type is "success" (assuming response is defined),
        // call getUserInfo with the access token from the response
        getUserInfo(response.authentication.accessToken);
        navigateToHome();
      }
    } catch (error) {
      // Handle any errors that occur during AsyncStorage retrieval or other operations
      console.error("Error retrieving user data from AsyncStorage:", error);
    }
  };

  const navigateToHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "tabs" }], // Assumes "tabs" is your tab navigator
    });
  };

  //add it to a useEffect with response as a dependency
  useEffect(() => {
    signInWithGoogle();
  }, [response]);

  const sendUserInfoToBackend = async (user) => {
    try {
      const response = await fetch("http://10.0.0.54:8080/google-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          name: user.name,
        }),
      });

      const data = await response.json();
      console.log("Response from backend", data);
    } catch (error) {
      console.error("Failed to send user info to backend", error);
    }
  };

  const handleGoogleLogin = async () => {
    promptAsync(); // This triggers the login flow
  };

  //log the userInfo to see user details
  console.log(JSON.stringify(userInfo));

  return (
    <SafeAreaView style={styles.safeArea}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    justifyContent: "center", // Vertically centers content
    alignItems: "center", // Horizontally centers content
    flex: 1,
  },
  googleButton: {
    backgroundColor: "#4285F4",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
