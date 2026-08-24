// screens/GenApprovedList.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  SafeAreaView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useDispatch } from "react-redux";
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  commonAPICall,
  CONTEXT_HEADING,
  GENAPPROVEDDISPOSALDATA,
  ADDWASTEDISPOSALDETAILS,
} from "../utils/utils";

function GenApprovedList() {
  const navigation = useNavigation();
  const route = useRoute();
  const [data, setData] = useState([]);
  const [flattenedData, setFlattenedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [wasteDisposalId, setWasteDisposalId] = useState("");
  const [wasteDisposalInterestId, setWasteDisposalInterestId] = useState("");
  const dispatch = useDispatch();

  // Get route params
  const routeId = route?.params?.id || "";
  const stateData = route?.params?.state || {};

  useEffect(() => {
    // Check if we're on a specific screen
    if (routeId === "1") {
      navigation.navigate("TransportVehicleSelection", {
        rowData: stateData?.rowData,
        wasteList: stateData?.wasteList,
      });
    } else if (routeId === "2") {
      navigation.navigate("RegistrationPayment", {
        type: "MANIFEST_PAYMENT",
        vehicleList: stateData?.data,
        onPaymentComplete: () => {},
      });
    } else if (routeId === "3") {
      navigation.navigate("ManifestConfirmation", {
        wasteDisposalInterestId: wasteDisposalInterestId,
        wasteDisposalId: wasteDisposalId,
      });
    } else if (routeId === "4") {
      navigation.navigate("RejectedTransportVehicleSelection");
    } else if (routeId === "transporters") {
      navigation.navigate("TransportersList");
    } else {
      // Fetch data for main list
      GetApprovedData();
    }
  }, [routeId]);

  // Check for payment data in route params
  useEffect(() => {
    if (route?.params?.paymentData) {
      setPaymentData(route.params.paymentData);
      setShowPaymentModal(true);
    }
  }, [route?.params?.paymentData]);

  async function GetApprovedData() {
    try {
      setLoading(true);
      let res = await commonAPICall(
        GENAPPROVEDDISPOSALDATA,
        {},
        "GET",
        dispatch
      );
      
      
      if (res && res.status === 200 && res.data) {
        const dataList = res.data.WasteDisposal_Interest_Details || [];
        setData(dataList);
        const flattened = flattenData(dataList);
        setFlattenedData(flattened);
        setFilteredData(flattened);
      } else {
        console.error("Invalid response or no data:", res);
        setData([]);
        setFlattenedData([]);
        setFilteredData([]);
      }
    } catch (error) {
      console.error("Error fetching approved data:", error);
      setData([]);
      setFlattenedData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  }

  const flattenData = (dataList) => {
    if (!dataList || dataList.length === 0) {
      return [];
    }

    const flattened = [];
    
    dataList.forEach((item) => {
      let receivers = [];
      try {
        receivers = JSON.parse(item.receivers_list || "[]");
      } catch (err) {
        console.error("Invalid receivers_list JSON", err);
        receivers = [];
      }
      
      if (receivers.length === 0) {
        // If no receivers, add a single row with empty receiver data
        flattened.push({
          wasteDisposalId: item.waste_disposal_id || "",
          wasteName: item.waste_name || "",
          processName: item.process_name || "",
          streamName: item.stream_name || "",
          wasteType: item.waste_type_name || "",
          permittedQuantity: item.permitted_quantity || "",
          permittedDisposalOption: item.permitted_disposal_option || "",
          approvedDate: item.interest_submitted_date || "",
          pendingDispatch: item.current_available_qty || "",
          unit: "Tonnes",
          totalQtyDisposed: item.total_qty_disposed || "",
          noOfInterestReceivers: item.no_of_interest_receivers || 0,
          genLatitude: item.generator_latitude || "",
          genLongitude: item.generator_longitude || "",
          receiverWasteTypeId: item.waste_type_id || "",
          wasteTypeName: item.waste_type_name || "",
          actionId: "",
          receiverName: "No Receiver",
          districtName: "",
          industryAddress: "",
          correspondenceAddress: "",
          pinCode: "",
          authorizedPerson: "",
          authorizedPersonMobile: "",
          authorizedPersonEmail: "",
          gstNumber: "",
          receiverWasteType: "",
          interestedQty: "",
          remarks: "",
          recLatitude: "",
          recLongitude: "",
          approvedDate: "",
          registrationCode: "",
          wasteDisposalInterestId: "",
          generatorAcceptedTransactionId: "",
          isProceeded: true,
        });
      } else {
        receivers.forEach((receiver) => {
          flattened.push({
            wasteDisposalId: item.waste_disposal_id || "",
            wasteName: item.waste_name || "",
            processName: item.process_name || "",
            streamName: item.stream_name || "",
            wasteType: item.waste_type_name || "",
            permittedQuantity: item.permitted_quantity || "",
            permittedDisposalOption: item.permitted_disposal_option || "",
            approvedDate: item.interest_submitted_date || "",
            pendingDispatch: item.current_available_qty || "",
            unit: "Tonnes",
            totalQtyDisposed: item.total_qty_disposed || "",
            noOfInterestReceivers: item.no_of_interest_receivers || 0,
            genLatitude: item.generator_latitude || "",
            genLongitude: item.generator_longitude || "",
            receiverWasteTypeId: item.waste_type_id || "",
            wasteTypeName: item.waste_type_name || "",
            actionId: receiver.waste_disposal_interest_id || "",
            receiverName: receiver.industry_name || "",
            districtName: receiver.district_name || "",
            industryAddress: receiver.industry_address || "",
            correspondenceAddress: receiver.correspondence_address || "",
            pinCode: receiver.pin_code || "",
            authorizedPerson: receiver.authorized_person || "",
            authorizedPersonMobile: receiver.authorized_person_mobile || "",
            authorizedPersonEmail: receiver.authorized_person_email || "",
            gstNumber: receiver.gst_number || "",
            receiverWasteType: receiver.waste_type_name || "",
            interestedQty: receiver.interest_qty || "",
            remarks: receiver.remarks || "",
            recLatitude: receiver.receiver_latitude || "",
            recLongitude: receiver.receiver_longitude || "",
            approvedDate: receiver.approved_submitted_date || "",
            registrationCode: receiver.registrationCode || "",
            wasteDisposalInterestId: receiver.waste_disposal_interest_id || "",
            generatorAcceptedTransactionId: receiver.generator_approval_transaction_number || "",
            isProceeded: receiver.is_proceeded || false,
          });
        });
      }
    });
    
    return flattened;
  };

  const handleSearch = (text) => {
    setSearchTerm(text);
    if (text.trim() === "") {
      setFilteredData(flattenedData);
      return;
    }
    const filtered = flattenedData.filter((item) =>
      Object.values(item).some(
        (value) =>
          value &&
          value.toString().toLowerCase().includes(text.toLowerCase())
      )
    );
    setFilteredData(filtered);
  };

  const handleProceed = (rowData) => {
    Alert.alert(
      "Are you sure?",
      "Do you want to Proceed?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          onPress: () => proceedAction(rowData),
        },
      ],
      { cancelable: false }
    );
  };

  const proceedAction = async (rowData) => {
    setWasteDisposalId(rowData.wasteDisposalId);
    setWasteDisposalInterestId(rowData.wasteDisposalInterestId);

    const filteredRows = flattenedData.filter(
      (item) =>
        item.receiverName === rowData.receiverName &&
        item.wasteName === rowData.wasteName &&
        item.isProceeded === false
    );

    const wasteList = filteredRows.map(
      (item) =>
        `${item.wasteName} - ${item.interestedQty} - ${item.generatorAcceptedTransactionId}`
    );

    let payload = [
      {
        wasteDisposalInterestId: rowData.actionId,
        isProceeded: true,
      },
    ];

    try {
      setLoading(true);
      const response = await commonAPICall(
        ADDWASTEDISPOSALDETAILS,
        payload,
        "POST",
        dispatch
      );

      navigation.navigate("TransportVehicleSelection", {
        rowData: rowData,
        wasteList: wasteList,
      });
      if (response.status === 200) {
      }
    } catch (error) {
      console.error("Error in API call:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    navigation.navigate("ManifestConfirmation", {
      wasteDisposalInterestId: wasteDisposalInterestId,
      wasteDisposalId: wasteDisposalId,
    });
  };

  const renderPaymentModal = () => {
    if (!paymentData) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPaymentModal}
        onRequestClose={closePaymentModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payment Details</Text>
              <TouchableOpacity onPress={closePaymentModal}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.paymentCard}>
                <View style={styles.paymentAmountRow}>
                  <Text style={styles.paymentAmountLabel}>Amount</Text>
                  <Text style={styles.paymentAmountValue}>
                    ₹ {paymentData?.amount || "0"}
                  </Text>
                </View>

                <View style={styles.divider} />

                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Transaction ID</Text>
                  <Text style={styles.paymentValue}>
                    {paymentData?.transactionId || "-"}
                  </Text>
                </View>

                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Order ID</Text>
                  <Text style={styles.paymentValue}>
                    {paymentData?.orderId || "-"}
                  </Text>
                </View>

                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Customer Name</Text>
                  <Text style={styles.paymentValue}>
                    {paymentData?.customerName || "-"}
                  </Text>
                </View>

                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Mobile</Text>
                  <Text style={styles.paymentValue}>
                    {paymentData?.customerMobile || "-"}
                  </Text>
                </View>

                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Payment Method</Text>
                  <Text style={styles.paymentValue}>
                    {paymentData?.paymentMethod || "-"}
                  </Text>
                </View>

                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>UPI Transaction ID</Text>
                  <Text style={styles.paymentValue}>
                    {paymentData?.upiTransactionId || "-"}
                  </Text>
                </View>

                <View style={[styles.paymentRow, styles.paymentStatusRow]}>
                  <Text style={styles.paymentLabel}>Status</Text>
                  <Text style={styles.paymentStatus}>
                    {paymentData?.status || "-"}
                  </Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalOkButton}
                onPress={closePaymentModal}
              >
                <Text style={styles.modalOkButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderMainList = () => {
    // Use filteredData for display
    const displayData = filteredData.length > 0 ? filteredData : flattenedData;
    const hasData = displayData.length > 0;

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="list" size={24} color="#1e3a5f" />
            <Text style={styles.cardTitle}>Approved List</Text>
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
                      onChangeText={handleSearch}
                      placeholderTextColor="#999"
                    />
                    {searchTerm.length > 0 && (
                      <TouchableOpacity
                        onPress={() => {
                          setSearchTerm("");
                          setFilteredData(flattenedData);
                        }}
                      >
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
                ) : !hasData ? (
                  <View style={styles.noDataContainer}>
                    <Icon name="warning-outline" size={40} color="#856404" />
                    <Text style={styles.noDataText}>No Records Found</Text>
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
                          <Text style={[styles.tableCell, { width: 120 }]}>
                            Waste Type
                          </Text>
                          <Text style={[styles.tableCell, { width: 120 }]}>
                            Waste Name
                          </Text>
                          <Text style={[styles.tableCell, { width: 140 }]}>
                            Receiver
                          </Text>
                          <Text style={[styles.tableCell, { width: 60 }]}>
                            Unit
                          </Text>
                          <Text style={[styles.tableCell, { width: 80 }]}>
                            Qty
                          </Text>
                          <Text style={[styles.tableCell, { width: 100 }]}>
                            Pending
                          </Text>
                          <Text style={[styles.tableCell, { width: 120 }]}>
                            Approved Date
                          </Text>
                          <Text style={[styles.tableCell, { width: 100 }]}>
                            Action
                          </Text>
                        </View>

                        {displayData.map((row, index) => (
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
                              style={[styles.tableCell, { width: 120 }]}
                              numberOfLines={1}
                            >
                              {row.wasteType || "-"}
                            </Text>
                            <Text
                              style={[styles.tableCell, { width: 120 }]}
                              numberOfLines={1}
                            >
                              {row.wasteName || "-"}
                            </Text>
                            <Text
                              style={[styles.tableCell, { width: 140 }]}
                              numberOfLines={1}
                            >
                              {row.receiverName || "-"}
                            </Text>
                            <Text
                              style={[
                                styles.tableCell,
                                { width: 60, textAlign: "center" },
                              ]}
                            >
                              {row.unit || "-"}
                            </Text>
                            <Text
                              style={[
                                styles.tableCell,
                                { width: 80, textAlign: "right" },
                              ]}
                            >
                              {row.interestedQty || "0"}
                            </Text>
                            <Text
                              style={[
                                styles.tableCell,
                                { width: 100, textAlign: "right" },
                              ]}
                            >
                              {row.pendingDispatch || "0"}
                            </Text>
                            <Text
                              style={[styles.tableCell, { width: 120 }]}
                              numberOfLines={1}
                            >
                              {row.approvedDate || "-"}
                            </Text>
                            <View style={[styles.tableCell, { width: 100 }]}>
                              {/* {row.isProceeded ? (
                                <View style={styles.disabledButton}>
                                  <Icon
                                    name="checkmark-circle"
                                    size={14}
                                    color="#28a745"
                                  />
                                  <Text style={styles.disabledButtonText}>
                                    Proceeded
                                  </Text>
                                </View>
                              ) : ( */}
                                <TouchableOpacity
                                  style={styles.proceedButton}
                                  onPress={() => handleProceed(row)}
                                  disabled={loading}
                                >
                                  <Icon
                                    name="arrow-forward"
                                    size={14}
                                    color="#fff"
                                  />
                                  <Text style={styles.proceedButtonText}>
                                    Proceed
                                  </Text>
                                </TouchableOpacity>
                              {/* )} */}
                            </View>
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {renderPaymentModal()}
      </SafeAreaView>
    );
  };

  // If route has id param, navigate to appropriate screen
  if (routeId && routeId !== "transporters") {
    return null; 
  }

  return renderMainList();
}

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
  proceedButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2e7d32",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  proceedButtonText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "500",
    marginLeft: 4,
  },
  disabledButton: {
    flexDirection: "row",
    alignItems: "center",
    opacity: 0.6,
  },
  disabledButtonText: {
    fontSize: 10,
    color: "#28a745",
    marginLeft: 4,
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
    padding: 20,
    width: "92%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e3a5f",
  },
  modalBody: {
    marginBottom: 8,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e8ecf1",
    marginTop: 8,
  },
  modalOkButton: {
    backgroundColor: "#2e7d32",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6,
  },
  modalOkButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  // Payment Styles
  paymentCard: {
    borderWidth: 1,
    borderColor: "#dcdcdc",
    borderRadius: 15,
    padding: 20,
    backgroundColor: "#fff",
  },
  paymentAmountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  paymentAmountLabel: {
    fontSize: 22,
    fontWeight: "600",
    color: "#333",
  },
  paymentAmountValue: {
    fontSize: 22,
    fontWeight: "600",
    color: "green",
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 10,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  paymentStatusRow: {
    marginTop: 4,
  },
  paymentLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555",
  },
  paymentValue: {
    fontSize: 14,
    color: "#333",
  },
  paymentStatus: {
    fontSize: 14,
    fontWeight: "600",
    color: "green",
    textTransform: "uppercase",
  },
});

export default GenApprovedList;