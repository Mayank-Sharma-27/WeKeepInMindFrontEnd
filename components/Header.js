import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Button,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";

export default function Header() {
  const [modalVisible, setModalVisible] = useState(false);

  const openMenu = () => setModalVisible(true);
  const closeMenu = () => setModalVisible(false);

  return (
    <View style={styles.headerContainer}>
      <Text style={styles.title}>WeKeepInMind</Text>
      <TouchableOpacity>
        <FontAwesome name="ellipsis-v" size={24} color="black" />
      </TouchableOpacity>

      <Modal
        transparent={true}
        animationType="slide"
        visible={modalVisible}
        onRequestClose={closeMenu}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Button title="Profile" onPress={() => {}} />
            <Button title="Subscription" onPress={() => {}} />
            <Button title="Settings" onPress={() => {}} />
            <Button title="Sign Out" onPress={() => {}} />
            <Button title="Close" onPress={closeMenu} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row", // Display in a row
    justifyContent: "space-between", // Space between title and button
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingTop: 40,
    backgroundColor: "#f8f8f8",
    alignItems: "center", // Center vertically
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    margin: 20,
    padding: 20,
    borderRadius: 10,
  },
});
