import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import Header from "../../components/Header";
import * as Notifications from "expo-notifications";

export default function TabLayout() {
  return (
    <>
      <Header />
      <Tabs
        screenOptions={{ tabBarActiveTintColor: "blue", headerShown: false }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Reminders",
            tabBarIcon: ({ color }) => (
              <FontAwesome size={28} name="home" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="sendreminder"
          options={{
            title: "SendReminder",
            tabBarIcon: ({ color }) => (
              <FontAwesome size={28} class="cog" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="groups"
          options={{
            title: "Groups",
            tabBarIcon: ({ color }) => (
              <FontAwesome size={28} name="users" color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
