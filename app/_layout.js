import { Stack } from "expo-router/stack";

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        tabBarActiveTintColor: "blue",
        headerShown: false, // Disable the header for all tabs
      }}
    />
  );
}
