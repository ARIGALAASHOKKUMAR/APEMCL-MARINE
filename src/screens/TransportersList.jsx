// screens/TransportersList.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  SafeAreaView,
  Linking,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Icon from "react-native-vector-icons/Ionicons";
import { SafeAreaView as SafeAreaViewWrapper } from "react-native-safe-area-context";
import {
  commonAPICall,
  CONTEXT_HEADING,
  ALLREGISTRATIONS,
} from "../utils/utils";
import { TableExport } from "../utils/CommonFunctions";

const TransportersList = () => {
  const dispatch = useDispatch();
  const [modalData, setModalData] = useState({
    name: "",
    vehicles: [],
  });
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Get transporters from Redux store
  const transporters = useSelector(
    (state) => state.IndustryReducer?.transporters || [],
  );

  // For demo purposes, if no transporters in Redux, use sample data
  const [localTransporters, setLocalTransporters] = useState([]);
  const [data, setData] = useState([]);

  // Parse vehicles from JSON string
  const parseVehicles = (vehiclesStr) => {
    try {
      return vehiclesStr ? JSON.parse(vehiclesStr) : [];
    } catch {
      return [];
    }
  };

  // Handle view vehicles
  const handleViewVehicles = (item) => {
    const vehicles = parseVehicles(item.vehicles);
    setModalData({
      name: item.transport_company_name,
      vehicles,
    });
    setShowModal(true);
  };

  // Get filtered data
  const getFilteredData = () => {
    const sourceData =
      transporters.length > 0 ? transporters : localTransporters;
    if (!searchTerm.trim()) return sourceData;

    return sourceData.filter((item) =>
      Object.values(item).some(
        (value) =>
          value &&
          value.toString().toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    );
  };

  const filteredData = getFilteredData();

  // Fetch transporters data if needed
  const fetchTransporters = async () => {
    try {
      setLoading(true);
      // If you have an API endpoint for transporters
      const response = await commonAPICall(
        ALLREGISTRATIONS,
        {},
        "get",
        dispatch,
      );
      if (response.status === 200) {
        setLocalTransporters(response.data.Registration_Details[0].transporters_with_vehicles || []);
      }

      // For demo, using sample data
    } catch (error) {
      console.error("Error fetching transporters:", error);
      Alert.alert("Error", "Failed to fetch transporter data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (transporters.length === 0) {
      fetchTransporters();
    }
  }, []);

  // Render vehicle modal
  const renderVehicleModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderTitle}>APEMCL</Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowModal(false)}
              >
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <View style={styles.modalBody}>
              <Text style={styles.modalTitle}>
                <Icon name="list" size={20} color="#1e3a5f" />
                <Text style={styles.modalTitleText}>
                  Vehicle List of Transporter - {modalData.name}
                </Text>
              </Text>

              <View style={styles.tableContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View>
                    <View style={styles.tableHeader}>
                      <Text style={[styles.tableCell, { width: 50 }]}>
                        S.No
                      </Text>
                      <Text style={[styles.tableCell, { width: 120 }]}>
                        Vehicle No
                      </Text>
                      <Text style={[styles.tableCell, { width: 100 }]}>
                        Type
                      </Text>
                      <Text style={[styles.tableCell, { width: 100 }]}>
                        Capacity
                      </Text>
                      <Text style={[styles.tableCell, { width: 100 }]}>
                        Permit No
                      </Text>
                      <Text style={[styles.tableCell, { width: 100 }]}>
                        Status
                      </Text>
                    </View>

                    {modalData.vehicles.length > 0 ? (
                      modalData.vehicles.map((v, i) => (
                        <View key={i} style={styles.tableRow}>
                          <Text
                            style={[
                              styles.tableCell,
                              { width: 50, textAlign: "center" },
                            ]}
                          >
                            {i + 1}
                          </Text>
                          <Text
                            style={[styles.tableCell, { width: 120 }]}
                            numberOfLines={1}
                          >
                            {v.vehicle_no}
                          </Text>
                          <Text
                            style={[styles.tableCell, { width: 100 }]}
                            numberOfLines={1}
                          >
                            {v.vehicle_type_name}
                          </Text>
                          <Text
                            style={[
                              styles.tableCell,
                              { width: 100, textAlign: "right" },
                            ]}
                          >
                            {v.capacity}
                          </Text>
                          <Text
                            style={[styles.tableCell, { width: 100 }]}
                            numberOfLines={1}
                          >
                            {v.permit_no}
                          </Text>
                          <View style={[styles.tableCell, { width: 100 }]}>
                            <View
                              style={[
                                styles.statusBadge,
                                v.status === "AVAILABLE"
                                  ? styles.statusAvailable
                                  : v.status === "IN_TRANSIT"
                                    ? styles.statusInTransit
                                    : v.status === "COMPLETED"
                                      ? styles.statusCompleted
                                      : styles.statusDefault,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusText,
                                  v.status === "AVAILABLE"
                                    ? styles.statusTextAvailable
                                    : v.status === "IN_TRANSIT"
                                      ? styles.statusTextInTransit
                                      : v.status === "COMPLETED"
                                        ? styles.statusTextCompleted
                                        : styles.statusTextDefault,
                                ]}
                              >
                                {v.status || "UNKNOWN"}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ))
                    ) : (
                      <View style={styles.noDataContainer}>
                        <Text style={styles.noDataText}>
                          No vehicle data available
                        </Text>
                      </View>
                    )}
                  </View>
                </ScrollView>
              </View>
            </View>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCloseFooterButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.modalCloseFooterButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Render main list
  const renderMainList = () => {
    return (
      <SafeAreaViewWrapper style={styles.container}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="car-outline" size={24} color="#1e3a5f" />
            <Text style={styles.cardTitle}>Transporter List</Text>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.panel}>
              <View style={styles.panelHeader}>
                <Text style={styles.panelHeaderText}>{CONTEXT_HEADING}</Text>
              </View>
              <View style={styles.panelBody}>
                {/* Search */}
                <View style={styles.searchContainer}>
                  <View style={styles.searchWrapper}>
                    <Icon
                      name="search"
                      size={20}
                      color="#666"
                      style={styles.searchIcon}
                    />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search..."
                      value={searchTerm}
                      onChangeText={setSearchTerm}
                      placeholderTextColor="#999"
                    />
                    {searchTerm.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchTerm("")}>
                        <Icon name="close-circle" size={20} color="#999" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2e7d32" />
                    <Text style={styles.loadingText}>Loading...</Text>
                  </View>
                ) : (
                  <View style={styles.tableContainer}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      <View>
                        <View style={styles.tableHeader}>
                          <Text style={[styles.tableCell, { width: 50 }]}>
                            S.No
                          </Text>
                          <Text style={[styles.tableCell, { width: 150 }]}>
                            Transporter Name
                          </Text>
                          <Text style={[styles.tableCell, { width: 100 }]}>
                            Reg Code
                          </Text>
                          <Text style={[styles.tableCell, { width: 150 }]}>
                            Location
                          </Text>
                          <Text style={[styles.tableCell, { width: 100 }]}>
                            Mobile
                          </Text>
                          <Text style={[styles.tableCell, { width: 120 }]}>
                            Email
                          </Text>
                          <Text style={[styles.tableCell, { width: 120 }]}>
                            Vehicles
                          </Text>
                        </View>

                        {filteredData.length > 0 ? (
                          filteredData.map((item, index) => (
                            <View key={index} style={styles.tableRow}>
                              <Text
                                style={[
                                  styles.tableCell,
                                  { width: 50, textAlign: "center" },
                                ]}
                              >
                                {index + 1}
                              </Text>
                              <Text
                                style={[styles.tableCell, { width: 150 }]}
                                numberOfLines={1}
                              >
                                {item.transport_company_name}
                              </Text>
                              <Text
                                style={[styles.tableCell, { width: 100 }]}
                                numberOfLines={1}
                              >
                                {item.registrationcode}
                              </Text>
                              <Text
                                style={[styles.tableCell, { width: 150 }]}
                                numberOfLines={1}
                              >
                                {item.address}
                              </Text>
                              <TouchableOpacity
                                style={[styles.tableCell, { width: 100 }]}
                                onPress={() => {
                                  if (item.mobile_number) {
                                    Linking.openURL(
                                      `tel:${item.mobile_number}`,
                                    );
                                  }
                                }}
                              >
                                <Text style={styles.contactLink}>
                                  {item.mobile_number}
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.tableCell, { width: 120 }]}
                                onPress={() => {
                                  if (item.email) {
                                    Linking.openURL(`mailto:${item.email}`);
                                  }
                                }}
                              >
                                <Text
                                  style={styles.contactLink}
                                  numberOfLines={1}
                                >
                                  {item.email}
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.tableCell, { width: 120 }]}
                                onPress={() => handleViewVehicles(item)}
                              >
                                <View style={styles.vehicleInfoContainer}>
                                  <Text style={styles.vehicleInfoLink}>
                                    Total: {item.total_vehicles ?? 0}
                                  </Text>
                                  <Text style={styles.vehicleInfoText}>
                                    Allocated: {item.allocated ?? 0}
                                  </Text>
                                  <Text style={styles.vehicleInfoText}>
                                    In Transit: {item.in_transit ?? 0}
                                  </Text>
                                  <Text style={styles.vehicleInfoText}>
                                    Available: {item.available ?? 0}
                                  </Text>
                                </View>
                              </TouchableOpacity>
                            </View>
                          ))
                        ) : (
                          <View style={styles.noDataContainer}>
                            <Icon
                              name="warning-outline"
                              size={40}
                              color="#856404"
                            />
                            <Text style={styles.noDataText}>
                              {searchTerm
                                ? "No matching records found"
                                : "No Records Found"}
                            </Text>
                          </View>
                        )}
                      </View>
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {renderVehicleModal()}
      </SafeAreaViewWrapper>
    );
  };

  return renderMainList();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  card: {
    flex: 1,
    margin: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
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
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e3a5f",
    marginLeft: 8,
  },
  cardBody: {
    padding: 16,
  },
  panel: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e8ecf1",
    borderRadius: 8,
    overflow: "hidden",
  },
  panelHeader: {
    backgroundColor: "#2e7d32",
    padding: 12,
  },
  panelHeaderText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  panelBody: {
    padding: 16,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: "#333",
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
  tableContainer: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#d8ece8",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    alignItems: "center",
  },
  tableCell: {
    fontSize: 11,
    paddingHorizontal: 3,
    color: "#333",
  },
  noDataContainer: {
    padding: 30,
    alignItems: "center",
    backgroundColor: "#fff3cd",
    borderRadius: 8,
    marginTop: 8,
  },
  noDataText: {
    color: "#856404",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  contactLink: {
    color: "#2e7d32",
    textDecorationLine: "underline",
    fontSize: 11,
  },
  vehicleInfoContainer: {
    padding: 4,
  },
  vehicleInfoLink: {
    color: "#2e7d32",
    textDecorationLine: "underline",
    fontSize: 11,
    fontWeight: "500",
  },
  vehicleInfoText: {
    fontSize: 10,
    color: "#555",
    marginTop: 1,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "95%",
    maxHeight: "85%",
    overflow: "hidden",
  },
  modalHeader: {
    backgroundColor: "#2e7d32",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalHeaderTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
    flex: 1,
  },
  modalTitle: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e3a5f",
    marginLeft: 8,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e8ecf1",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalCloseFooterButton: {
    backgroundColor: "#6c757d",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  modalCloseFooterButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  // Status Badge Styles
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignItems: "center",
    alignSelf: "flex-start",
  },
  statusAvailable: {
    backgroundColor: "#d4edda",
  },
  statusInTransit: {
    backgroundColor: "#fff3cd",
  },
  statusCompleted: {
    backgroundColor: "#e2e3e5",
  },
  statusDefault: {
    backgroundColor: "#f8f9fa",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "500",
  },
  statusTextAvailable: {
    color: "#155724",
  },
  statusTextInTransit: {
    color: "#856404",
  },
  statusTextCompleted: {
    color: "#383d41",
  },
  statusTextDefault: {
    color: "#333",
  },
});

export default TransportersList;
