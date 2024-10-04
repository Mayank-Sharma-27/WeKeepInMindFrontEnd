import { Stack } from "expo-router";
import { Button } from "react-native";
import { useRouter } from "expo-router";

export default function GroupsLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "blue",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Groups",
          headerRight: () => (
            <Button
              onPress={() => router.push("/tabs/groups/create")}
              title="Create"
            />
          ),
        }}
      />
      <Stack.Screen
        name="[groupId]"
        options={{
          title: "Group Details",
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          title: "Create Group",
          presentation: "modal",
        }}
      />
    </Stack>
  );
}
