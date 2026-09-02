import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  Dimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  commonAPICall,
  CONTEXT_HEADING,
  TRANSPORTVEHICLESELECTIONDETAILS,
} from "../utils/utils";
import Icon from "react-native-vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import ManifestConfirmation from "./ManifestConfirmation";
import { useDispatch } from "react-redux";

const { width } = Dimensions.get("window");

// Status badge component
const StatusBadge = ({ status }) => {
  const getStatusConfig = () => {
    const statusMap = {
      "Manifest Not Generated": {
        backgroundColor: "#e9ecef",
        color: "#6c757d",
        icon: "document-text-outline",
      },
      "Transporter Pending": {
        backgroundColor: "#fff3cd",
        color: "#856404",
        icon: "time-outline",
      },
      "Receiver Pending": {
        backgroundColor: "#fff3cd",
        color: "#856404",
        icon: "hourglass-outline",
      },
      "Manifest Closed": {
        backgroundColor: "#d4edda",
        color: "#155724",
        icon: "checkmark-circle-outline",
      },
      "Manifest Closed By Admin": {
        backgroundColor: "#d4edda",
        color: "#155724",
        icon: "checkmark-circle-outline",
      },
      "Redirection Approved By Admin": {
        backgroundColor: "#d4edda",
        color: "#155724",
        icon: "checkmark-circle-outline",
      },
    };
    return (
      statusMap[status] || {
        backgroundColor: "#e9ecef",
        color: "#6c757d",
        icon: "information-circle-outline",
      }
    );
  };

  const config = getStatusConfig();

  return (
    <View
      style={[styles.statusBadge, { backgroundColor: config.backgroundColor }]}
    >
      <Icon
        name={config.icon}
        size={14}
        color={config.color}
        style={styles.statusIcon}
      />
      <Text style={[styles.statusText, { color: config.color }]}>
        {formatStatus(status)}
      </Text>
    </View>
  );
};

// Format status helper
const formatStatus = (value) => {
  if (!value) return "-";
  return value.toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
};

function ManifestList() {
  const navigation = useNavigation();
  const route = useRoute();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const dispatch = useDispatch();
  
  // Check if we're in a detail view
  const queryParams = route.params || {};
  const id = queryParams.id;

  // Get manifest list
  const GetInterestedList = async () => {
    try {
      setLoading(true);
      const res = await commonAPICall(
        TRANSPORTVEHICLESELECTIONDETAILS,
        {},
        "GET",
        dispatch,
      );
      if (res.status === 200) {
        const manifestData = res.data.Transport_Vehicle_Selection_Details || [];
        setData(manifestData);
        // Flatten and filter data
        const flattened = flattenData(manifestData);
        setFilteredData(flattened);
      } else {
        setFilteredData([]);
      }
    } catch (error) {
      console.error("Error fetching manifest list:", error);
      setFilteredData([]);
      Alert.alert("Error", "Failed to load manifest list");
    } finally {
      setLoading(false);
    }
  };

  // Flatten data function
  const flattenData = (dataArray) => {
    if (!dataArray || dataArray.length === 0) return [];

    return dataArray.flatMap((item) => {
      let wasteDetails = [];
      try {
        wasteDetails = JSON.parse(item.waste_details || "[]");
      } catch (err) {
        console.error("Invalid waste_details JSON", err);
      }

      return wasteDetails.length > 0
        ? wasteDetails.map((waste) => ({
            ...item,
            ...waste,
          }))
        : [item];
    });
  };

  // Handle view details navigation
  const handleView = (row) => {
    navigation.navigate("ManifestConfirmation", {
      data: row,
      key: "receiver",
    });
  };

  // Search filter
  const handleSearch = useCallback(
    (text) => {
      setSearchTerm(text);
      if (text.trim() === "") {
        const flattened = flattenData(data);
        setFilteredData(flattened);
      } else {
        const flattened = flattenData(data);
        const filtered = flattened.filter((item) =>
          Object.values(item).some(
            (value) =>
              value &&
              value.toString().toLowerCase().includes(text.toLowerCase()),
          ),
        );
        setFilteredData(filtered);
      }
    },
    [data],
  );

  // Refresh function
  const onRefresh = async () => {
    setRefreshing(true);
    await GetInterestedList();
    setRefreshing(false);
  };

  useEffect(() => {
    GetInterestedList();
  }, []);

  // If in detail view, render ManifestConfirmation
  if (id === "1") {
    return <ManifestConfirmation />;
  }

  // Loading state
  if (loading && data.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2e7d32" />
          <Text style={styles.loadingText}>Loading Manifest List...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <Icon name="list" size={24} color="#1e3a5f" />
          <Text style={styles.cardTitle}>Manifest List</Text>
        </View>

        {/* Content */}
        <View style={styles.cardBody}>
          <View style={styles.panel}>
            {/* Panel Heading */}
            <View style={styles.panelHeader}>
              <Text style={styles.panelHeaderText}>{CONTEXT_HEADING}</Text>
            </View>

            <View style={styles.panelBody}>
              {/* Search Controls */}
              <View style={styles.searchContainer}>
                <View style={styles.searchWrapper}>
                  <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search..."
                    value={searchTerm}
                    onChangeText={handleSearch}
                    placeholderTextColor="#999"
                  />
                  {searchTerm.length > 0 && (
                    <TouchableOpacity onPress={() => handleSearch("")}>
                      <Icon name="close-circle" size={20} color="#999" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Table */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
              >
                <ScrollView vertical showsVerticalScrollIndicator={true}>
                  <View style={styles.tableContainer}>
                    {/* Table Header */}
                    <View style={[styles.tableRow, styles.tableHeader]}>
                      <Text style={[styles.tableHeaderCell, styles.colSno]}>S.No</Text>
                      <Text style={[styles.tableHeaderCell, styles.colDate]}>Date</Text>
                      <Text style={[styles.tableHeaderCell, styles.colManifest]}>Manifest No</Text>
                      <Text style={[styles.tableHeaderCell, styles.colTrnx]}>Trnx No</Text>
                      <Text style={[styles.tableHeaderCell, styles.colWasteType]}>Waste Type</Text>
                      <Text style={[styles.tableHeaderCell, styles.colWasteName]}>Waste Name</Text>
                      <Text style={[styles.tableHeaderCell, styles.colReceiver]}>Receiver</Text>
                      <Text style={[styles.tableHeaderCell, styles.colQuantity]}>Qty</Text>
                      <Text style={[styles.tableHeaderCell, styles.colVehicle]}>Vehicle No</Text>
                      <Text style={[styles.tableHeaderCell, styles.colAmount]}>Amount</Text>
                      <Text style={[styles.tableHeaderCell, styles.colStatus]}>Status</Text>
                      <Text style={[styles.tableHeaderCell, styles.colAction]}>Action</Text>
                    </View>

                    {/* Table Body */}
                    {filteredData && filteredData.length > 0 ? (
                      filteredData.map((row, index) => (
                        <View
                          key={index}
                          style={[styles.tableRow, styles.tableBodyRow]}
                        >
                          <Text
                            style={[
                              styles.tableCell,
                              styles.colSno,
                              styles.textCenter,
                            ]}
                          >
                            {index + 1}
                          </Text>
                          <Text
                            style={[
                              styles.tableCell,
                              styles.colDate,
                              styles.textCenter,
                            ]}
                          >
                            {row.manifest_generated_on?.split(" ")[0] || "-"}
                          </Text>
                          <Text
                            style={[
                              styles.tableCell,
                              styles.colManifest,
                              styles.textRight,
                            ]}
                          >
                            {row.manifest_number || "-"}
                          </Text>
                          <Text style={[styles.tableCell, styles.colTrnx]}>
                            {row.generator_approval_transaction_number || "-"}
                          </Text>
                          <Text style={[styles.tableCell, styles.colWasteType]}>
                            {row.receiver_type_name || "-"}
                          </Text>
                          <Text style={[styles.tableCell, styles.colWasteName]}>
                            {row.waste_type_name || "-"}
                          </Text>
                          <Text style={[styles.tableCell, styles.colReceiver]}>
                            {row.receiver_industry_name || "-"}
                          </Text>
                          <Text
                            style={[
                              styles.tableCell,
                              styles.colQuantity,
                              styles.textRight,
                            ]}
                          >
                            {row.total_disposal_quantity || "-"}
                          </Text>
                          <Text style={[styles.tableCell, styles.colVehicle]}>
                            {row.vehicle_registration_number || "-"}
                          </Text>
                          <Text
                            style={[
                              styles.tableCell,
                              styles.colAmount,
                              styles.textRight,
                            ]}
                          >
                            {row.amount || "-"}
                          </Text>
                          <View style={[styles.tableCell, styles.colStatus]}>
                            <StatusBadge status={row.current_status} />
                          </View>
                          <View
                            style={[
                              styles.tableCell,
                              styles.colAction,
                              styles.textCenter,
                            ]}
                          >
                            <TouchableOpacity
                              style={styles.viewButton}
                              onPress={() => handleView(row)}
                            >
                              <Icon name="folder-open-outline" size={14} color="#fff" />
                              <Text style={styles.viewButtonText}>Details</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))
                    ) : (
                      <View style={[styles.tableRow, styles.noDataRow]}>
                        <Icon name="warning-outline" size={40} color="#856404" />
                        <Text style={styles.noDataText}>No Records Found</Text>
                      </View>
                    )}
                  </View>
                </ScrollView>
              </ScrollView>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7fa",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#2e7d32",
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
  tableContainer: {
    minWidth: 900,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
    minHeight: 45,
    alignItems: "center",
  },
  tableHeader: {
    backgroundColor: "#2e7d32",
    borderTopWidth: 1,
    borderTopColor: "#e8ecf1",
  },
  tableBodyRow: {
    backgroundColor: "#fff",
    minHeight: 50,
  },
  tableHeaderCell: {
    padding: 10,
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
  tableCell: {
    padding: 10,
    fontSize: 12,
    color: "#333",
  },
  textCenter: {
    textAlign: "center",
  },
  textRight: {
    textAlign: "right",
  },
  // Column widths
  colSno: { width: 50, minWidth: 50 },
  colDate: { width: 100, minWidth: 100 },
  colManifest: { width: 120, minWidth: 120 },
  colTrnx: { width: 120, minWidth: 120 },
  colWasteType: { width: 100, minWidth: 100 },
  colWasteName: { width: 120, minWidth: 120 },
  colReceiver: { width: 150, minWidth: 150 },
  colQuantity: { width: 80, minWidth: 80 },
  colVehicle: { width: 120, minWidth: 120 },
  colAmount: { width: 100, minWidth: 100 },
  colStatus: { width: 180, minWidth: 180 },
  colAction: { width: 100, minWidth: 100 },
  // Status badge styles
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  statusIcon: {
    marginRight: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "500",
  },
  // View button
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#17a2b8",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  viewButtonText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "500",
    marginLeft: 4,
  },
  // No data
  noDataRow: {
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    width: 900,
  },
  noDataText: {
    color: "#856404",
    fontSize: 14,
    marginTop: 8,
  },
});

export default ManifestList;