import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Header() {
  const insets = useSafeAreaInsets(); // Get safe area insets (e.g., on iPhone with notches)
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const toggleDropdown = () => setDropdownVisible(!dropdownVisible);
  const closeDropdown = () => setDropdownVisible(false);

  return (
    <View style={[styles.headerContainer, { paddingTop: insets.top + 15 }]}>
      <Text style={styles.title}>WeKeepInMind</Text>

      {/* Three dots (menu button) */}
      <TouchableOpacity onPress={toggleDropdown}>
        <FontAwesome name="ellipsis-v" size={24} color="black" />
      </TouchableOpacity>

      {/* Dropdown as Modal */}
      <Modal
        transparent={true}
        visible={dropdownVisible}
        animationType="fade"
        onRequestClose={closeDropdown}
      >
        <TouchableWithoutFeedback onPress={closeDropdown}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.dropdownMenu,
                  {
                    top: insets.top + 60, // Use insets to position dropdown below header
                  },
                ]}
              >
                <TouchableOpacity style={styles.dropdownItem}>
                  <Text>Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dropdownItem}>
                  <Text>Subscription</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dropdownItem}>
                  <Text>Settings</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dropdownItem}>
                  <Text>Sign Out</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    backgroundColor: "#f8f8f8",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-start",
    backgroundColor: "rgba(0, 0, 0, 0.1)", // Slightly darken the background
  },
  dropdownMenu: {
    position: "absolute",
    right: 15, // Align dropdown with the ellipsis icon
    backgroundColor: "white",
    paddingVertical: 10,
    borderRadius: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5, // For Android shadow
  },
  dropdownItem: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
});
