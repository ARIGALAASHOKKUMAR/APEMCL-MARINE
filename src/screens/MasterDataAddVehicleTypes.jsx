import React, { useEffect, useState } from "react";
import {
  commonAPICall,
  CONTEXT_HEADING,
  MASTERDATAADDVEHICLEDETAILS,
  MASTERDATAADDVEHICLE,
} from "../utils/utils";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  FlatList,
  ActivityIndicator,
  TextInput,
  Modal,
  SafeAreaView,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import { useDispatch } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";

// Validation schema
const validationSchema = Yup.object().shape({
  vehicleTypeName: Yup.string()
    .required("Vehicle type name is required")
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must not exceed 50 characters"),
});

function MasterDataAddVehicleTypes() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const [updating, setUpdating] = useState(false);
  const dispatch = useDispatch();

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      vehicleTypeName: editData?.vehicleTypeName || "",
      vehicleTypeId: editData?.vehicleTypeId || "",
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      console.log(values);
      HandleSubmit(values);
    },
  });

  const GetData = async () => {
    try {
      setLoading(true);
      const res = await commonAPICall(
        MASTERDATAADDVEHICLEDETAILS,
        {},
        "get",
        dispatch,
      );
      if (res?.status === 200) {
        setData(res?.data?.VehicleTypeDetails || []);
      } else {
        setData([]);
      }
    } catch (error) {
      console.log("API ERROR:", error);
      setData([]);
      Alert.alert("Error", "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const HandleSubmit = async (values) => {
    try {
      setUpdating(true);
      
      let payload = {
        vehicleTypeName: values.vehicleTypeName.trim(),
      };

      if (!isAddMode && values.vehicleTypeId) {
        payload.vehicleTypeId = values.vehicleTypeId;
      }

      const res = await commonAPICall(
        MASTERDATAADDVEHICLE,
        payload,
        "post",
        dispatch,
      );

      if (res?.status === 200) {
        Alert.alert(
          "Success",
          isAddMode 
            ? "Vehicle type added successfully" 
            : "Vehicle type updated successfully"
        );
        setModalVisible(false);
        setIsAddMode(false);
        setEditData(null);
        formik.resetForm();
        GetData();
      } else {
        Alert.alert("Error", res?.message || "Operation failed");
      }
    } catch (error) {
      console.log("Submit error:", error);
      Alert.alert("Error", "Failed to complete operation");
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusToggle = async (item) => {
    Alert.alert(
      "Are you sure?",
      `Do you want to ${item?.status ? "deactivate" : "activate"} "${item?.vehicleTypeName}"?`,
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: async () => {
            try {
              setUpdating(true);
              const payload = {
                vehicleTypeId: item.vehicleTypeId,
                vehicleTypeName: item.vehicleTypeName,
                status: !item?.status,
              };

              const res = await commonAPICall(
                MASTERDATAADDVEHICLE,
                payload,
                "post",
                dispatch,
              );

              if (res?.status === 200) {
                Alert.alert(
                  "Success",
                  `Vehicle type ${!item?.status ? "activated" : "deactivated"} successfully`
                );
                GetData();
              } else {
                Alert.alert("Error", res?.message || "Failed to update status");
              }
            } catch (error) {
              console.log("Status update error:", error);
              Alert.alert("Error", "Failed to update status");
            } finally {
              setUpdating(false);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const handleEdit = (item) => {
    setEditData(item);
    setIsAddMode(false);
    formik.setValues({
      vehicleTypeName: item.vehicleTypeName || "",
      vehicleTypeId: item.vehicleTypeId || "",
    });
    setModalVisible(true);
  };

  const handleAddNew = () => {
    setEditData(null);
    setIsAddMode(true);
    formik.resetForm();
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setIsAddMode(false);
    setEditData(null);
    formik.resetForm();
  };

  const getInitials = (name) => {
    if (!name) return "V";
    const words = name.split(" ");
    if (words.length === 1) return name.charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  const getColorForName = (name) => {
    const colors = [
      "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
      "#DDA0DD", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9",
      "#F8C471", "#82E0AA", "#F1948A", "#85929E", "#73C6B6"
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const renderCard = ({ item }) => (
    <View style={styles.cardItem}>
      <View style={styles.cardContent}>
        <View style={styles.cardLeftSection}>
          <View style={[styles.avatarContainer, { backgroundColor: getColorForName(item?.vehicleTypeName || "") }]}>
            <Text style={styles.avatarText}>{getInitials(item?.vehicleTypeName)}</Text>
          </View>
        </View>
        
        <View style={styles.cardMiddleSection}>
          <Text style={styles.vehicleTypeName}>{item?.vehicleTypeName || "N/A"}</Text>
          <View style={styles.metaInfoContainer}>
            {item?.createdDate && (
              <View style={styles.metaInfoItem}>
                <Icon name="calendar-outline" size={12} color="#888" />
                <Text style={styles.metaInfoText}>
                  {new Date(item.createdDate).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.cardRightSection}>
          <View style={[styles.statusBadge, item?.status ? styles.activeBadge : styles.inactiveBadge]}>
            <View style={[styles.statusDot, item?.status ? styles.activeDot : styles.inactiveDot]} />
            <Text style={[styles.statusText, item?.status ? styles.activeText : styles.inactiveText]}>
              {item?.status ? "Active" : "Inactive"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEdit(item)}
          disabled={updating}
        >
          <Icon name="create-outline" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            item?.status ? styles.deactivateButton : styles.activateButton,
          ]}
          onPress={() => handleStatusToggle(item)}
          disabled={updating}
        >
          <Icon
            name={item?.status ? "close-circle-outline" : "checkmark-circle-outline"}
            size={16}
            color="#fff"
          />
          <Text style={styles.actionButtonText}>
            {item?.status ? "Deactivate" : "Activate"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerTitleContainer}>
          <Icon name="car-outline" size={24} color="#1e3a5f" />
          <Text style={styles.cardTitle}>Vehicle Types</Text>
        </View>
        <View style={styles.headerRightContainer}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddNew}
            disabled={updating}
          >
            <Icon name="add" size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add New</Text>
          </TouchableOpacity>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{data.length}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  useEffect(() => {
    GetData();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item, index) =>
          item?.vehicleTypeId?.toString() || index.toString()
        }
        renderItem={renderCard}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1e3a5f" />
              <Text style={styles.loadingText}>Loading vehicle types...</Text>
            </View>
          ) : (
            <View style={styles.noRecords}>
              <Icon name="car-outline" size={50} color="#ccc" />
              <Text style={styles.noRecordsText}>No Vehicle Types Found</Text>
              <TouchableOpacity
                style={[styles.addButton, styles.emptyAddButton]}
                onPress={handleAddNew}
                disabled={updating}
              >
                <Icon name="add" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add Your First Vehicle Type</Text>
              </TouchableOpacity>
            </View>
          )
        }
        showsVerticalScrollIndicator={false}
        onRefresh={GetData}
        refreshing={loading}
      />

      {/* Add/Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Icon 
                  name={isAddMode ? "add-circle-outline" : "create-outline"} 
                  size={24} 
                  color="#1e3a5f" 
                />
                <Text style={styles.modalTitle}>
                  {isAddMode ? "Add New Vehicle Type" : "Edit Vehicle Type"}
                </Text>
              </View>
              <TouchableOpacity onPress={handleCloseModal} disabled={updating}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Vehicle Type Name</Text>
              <TextInput
                style={[
                  styles.input,
                  formik.errors.vehicleTypeName && formik.touched.vehicleTypeName && styles.inputError
                ]}
                value={formik.values.vehicleTypeName}
                onChangeText={formik.handleChange("vehicleTypeName")}
                onBlur={formik.handleBlur("vehicleTypeName")}
                placeholder="Enter vehicle type name"
                placeholderTextColor="#999"
                editable={!updating}
              />
              {formik.errors.vehicleTypeName && formik.touched.vehicleTypeName && (
                <Text style={styles.errorText}>{formik.errors.vehicleTypeName}</Text>
              )}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.footerButton, styles.cancelButton]}
                onPress={handleCloseModal}
                disabled={updating}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.footerButton, styles.saveButton]}
                onPress={formik.handleSubmit}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>
                    {isAddMode ? "Add" : "Update"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5",
  },
  listContainer: {
    padding: 12,
    paddingTop: 0,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerRightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e3a5f",
    marginLeft: 8,
  },
  addButton: {
    backgroundColor: "#28a745",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
    marginLeft: 4,
  },
  emptyAddButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  countBadge: {
    backgroundColor: "#1e3a5f",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  countText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 14,
  },
  // Card Styles
  cardItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e8ecf1",
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  cardContent: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  cardLeftSection: {
    marginRight: 14,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  cardMiddleSection: {
    flex: 1,
  },
  vehicleTypeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e3a5f",
    marginBottom: 4,
  },
  metaInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  metaInfoText: {
    fontSize: 12,
    color: "#888",
    marginLeft: 4,
  },
  cardRightSection: {
    marginLeft: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  activeDot: {
    backgroundColor: "#28a745",
  },
  inactiveDot: {
    backgroundColor: "#dc3545",
  },
  activeBadge: {
    backgroundColor: "#d4edda",
  },
  inactiveBadge: {
    backgroundColor: "#f8d7da",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  activeText: {
    color: "#155724",
  },
  inactiveText: {
    color: "#721c24",
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e8ecf1",
    backgroundColor: "#fafbfc",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 0.48,
  },
  editButton: {
    backgroundColor: "#1e3a5f",
  },
  activateButton: {
    backgroundColor: "#28a745",
  },
  deactivateButton: {
    backgroundColor: "#dc3545",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 6,
  },
  noRecords: {
    padding: 60,
    alignItems: "center",
  },
  noRecordsText: {
    color: "#666",
    fontSize: 16,
    marginTop: 12,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e3a5f",
    marginLeft: 10,
  },
  modalBody: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: "#f8fafc",
  },
  inputError: {
    borderColor: "#dc3545",
    borderWidth: 2,
  },
  errorText: {
    color: "#dc3545",
    fontSize: 12,
    marginTop: 4,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#e8ecf1",
    paddingTop: 16,
  },
  footerButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: "#6c757d",
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  saveButton: {
    backgroundColor: "#1e3a5f",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
});

export default MasterDataAddVehicleTypes;