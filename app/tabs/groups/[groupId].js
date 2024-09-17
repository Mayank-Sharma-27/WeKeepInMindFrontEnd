import GroupDetails from "../../../components/GroupDetails";
import { useLocalSearchParams } from "expo-router"; // To get dynamic parameters

export default function GroupDetailsScreen() {
  const { groupId } = useLocalSearchParams(); // Get groupId from the URL

  return <GroupDetails groupId={groupId} />;
}
