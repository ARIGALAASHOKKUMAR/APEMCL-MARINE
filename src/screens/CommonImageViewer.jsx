import { Ionicons } from "@expo/vector-icons";
import { Image, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CommonImageViewer ({
  visible,
  imageUrl,
  title,
  onClose,
  loading = false,
}) {
  console.log(visible, imageUrl, title, onClose);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.imageModalOverlay}>
        <View style={styles.imageModalContent}>
          <View style={styles.imageModalHeader}>
            <Text style={styles.imageModalTitle}>
              {title || "Image"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.imageModalBody}>
            {imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.imageModalImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.noImageContainer}>
                <Text style={styles.noImageText}>No image available</Text>
              </View>
            )}
            <View style={styles.imageModalFooter}>
              <TouchableOpacity
                style={styles.imageModalDownloadButton}
                onPress={() => {
                  if (selectedImage) {
                    downloadFile(selectedImage);
                  }
                }}
              >
                <Ionicons name="download-outline" size={20} color="#fff" />
                <Text style={styles.imageModalDownloadText}>Download</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  inputBlock: {
    marginBottom: 16,
  },
   selectBox: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flex: 1,
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  cardBody: {
    padding: 16,
    flex: 1,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2196F3",
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  contextHeading: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#009688",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
    marginLeft: 4,
  },
  // Card styles
  cardItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeaderItem: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardId: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e3a5f",
  },
  cardPond: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 2,
  },
  cardBodyItem: {
    padding: 12,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardLabelContainer: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 11,
    color: "#6c757d",
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  cardRemarksContainer: {
    backgroundColor: "#f8f9fa",
    padding: 8,
    borderRadius: 4,
    marginBottom: 10,
  },
  cardRemarks: {
    fontSize: 13,
    color: "#333",
    marginTop: 2,
  },
  cardFilesContainer: {
    marginTop: 4,
  },
  cardFileItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  cardFileLabel: {
    fontSize: 12,
    color: "#495057",
    flex: 1,
    marginLeft: 8,
  },
  fileActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "green",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 4,
  },
  viewButtonText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "500",
    marginLeft: 2,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#28a745",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  downloadButtonText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "500",
    marginLeft: 2,
  },
  noFileText: {
    color: "#999",
    fontSize: 11,
  },
  // Image Modal styles
  imageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalContent: {
    width: "95%",
    height: "90%",
    backgroundColor: "#000",
    borderRadius: 10,
    overflow: "hidden",
  },
  imageModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  imageModalTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  imageModalBody: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalImage: {
    width: "100%",
    height: "100%",
  },
  imageModalFooter: {
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.8)",
    alignItems: "center",
  },
  imageModalDownloadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#28a745",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  imageModalDownloadText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  noImageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: {
    color: "#fff",
    fontSize: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    width: "100%",
    maxHeight: "80%",
    minHeight: "40%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "green",
    padding: 16,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "normal",
  },
  closeButton: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  modalBody: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  modalBodyContent: {
    paddingVertical: 16,
    paddingBottom: 24,
  },
  // Form styles
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  star: {
    color: "red",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  uploadButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f9f9f9",
    alignItems: "center",
  },
  uploadButtonText: {
    color: "#555",
    fontSize: 14,
  },
  inputError: {
    borderColor: "red",
    borderWidth: 2,
  },
  fileNameText: {
    color: "green",
    fontSize: 12,
    textDecorationLine: "underline",
    marginTop: 10,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: "#28a745",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 14,
  },
  listContainer: {
    paddingBottom: 20,
  },
  noRecords: {
    padding: 40,
    alignItems: "center",
  },
  noRecordsText: {
    color: "#dc3545",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  noRecordsSubText: {
    color: "#999",
    fontSize: 12,
    marginTop: 4,
  },
});
