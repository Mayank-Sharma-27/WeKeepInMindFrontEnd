import { Stack, useNavigation } from "expo-router";
import { Text, View } from "react-native";
import { useEffect } from "react";
import GoogleLogin from "../components/GoogleLogin"; // Correct import

export default function Home() {
  return (
    <View>
      <GoogleLogin />
    </View>
  );
}
