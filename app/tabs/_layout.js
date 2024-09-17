import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import { createStackNavigator } from "@react-navigation/stack";
import Groups from "../../components/Groups";
import GroupReminders from "../../components/GroupDetails;

// Create a stack navigator for the "Groups" tab
const GroupStack = createStackNavigator();

function GroupNavigator() {
  return (
    <GroupStack.Navigator>
      <GroupStack.Screen
        name="Groups"
        component={Groups} // The main groups screen
        options={{ headerShown: false }} // Hide the header for the main tab screen
      />
      <GroupStack.Screen
        name="GroupReminders"
        component={GroupReminders} // The reminders for a group screen
        options={{ title: "Upcoming Reminders" }}
      />
    </GroupStack.Navigator>
  );
}

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "blue", headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
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
            <FontAwesome size={28} class="cog" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
