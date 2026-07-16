import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Ionicons } from "@expo/vector-icons";
import { hideModal } from "../actions";

const ModalPopup = () => {
  const dispatch = useDispatch();

  const { modal, modalText, modalTitle } = useSelector(
    (state) => state.ModalReducer || {}
  );

  const handleClose = () => {
    dispatch(hideModal());
  };

  // Check if modalText is a valid React element
  const isValidReactElement = React.isValidElement(modalText);

  // Determine what to render in the body
  const renderBody = () => {
    if (typeof modalText === "string") {
      return <Text style={styles.bodyText}>{modalText}</Text>;
    } else if (isValidReactElement) {
      return modalText;
    } else if (modalText === null || modalText === undefined) {
      return null;
    } else {
      // Handle other types (numbers, etc.)
      return <Text style={styles.bodyText}>{String(modalText)}</Text>;
    }
  };

  return (
    <Modal
      visible={!!modal}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>{modalTitle || "Details"}</Text>

            <TouchableOpacity onPress={handleClose} style={styles.iconButton}>
              <Ionicons name="close" size={24} color="#e6e8eb" />
            </TouchableOpacity>
          </View>

          {/* BODY */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {renderBody()}
          </ScrollView>

          {/* FOOTER */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ModalPopup;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  modalCard: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "80%",
    backgroundColor: "#ffffff",
    borderRadius: 22,
    overflow: "hidden", // important for full header color
    elevation: 10,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#4a6cf7",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },

  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
  },

  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  content: {
    paddingHorizontal: 18,
  },

  contentContainer: {
    paddingVertical: 10,
  },

  bodyText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#374151",
  },

  closeButton: {
    margin: 16,
    backgroundColor: "#2563EB",
    paddingVertical: 13,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  closeButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});