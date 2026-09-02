// screens/GenApprovedList.js
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  SafeAreaView,
  TextInput,
  Platform,
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

const ITEMS_PER_PAGE = 10;

function GenApprovedList() {
  const navigation = useNavigation();
  const route = useRoute();
  const flatListRef = useRef(null);
  const [data, setData] = useState([]);
  const [flattenedData, setFlattenedData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [wasteDisposalId, setWasteDisposalId] = useState("");
  const [wasteDisposalInterestId, setWasteDisposalInterestId] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const dispatch = useDispatch();

  // Get route params
  const routeId = route?.params?.id || "";
  const stateData = route?.params?.state || {};

  useEffect(() => {
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
      GetApprovedData();
    }
  }, [routeId]);

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
        updatePagination(flattened);
      } else {
        console.error("Invalid response or no data:", res);
        setData([]);
        setFlattenedData([]);
        setFilteredData([]);
        setDisplayData([]);
      }
    } catch (error) {
      console.error("Error fetching approved data:", error);
      setData([]);
      setFlattenedData([]);
      setFilteredData([]);
      setDisplayData([]);
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

  const updatePagination = (dataArray) => {
    const total = Math.ceil(dataArray.length / ITEMS_PER_PAGE);
    setTotalPages(total);
    setCurrentPage(1);
    const start = 0;
    const end = ITEMS_PER_PAGE;
    setDisplayData(dataArray.slice(start, end));
  };

  const handleSearch = (text) => {
    setSearchTerm(text);
    if (text.trim() === "") {
      setFilteredData(flattenedData);
      updatePagination(flattenedData);
      scrollToTop();
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
    updatePagination(filtered);
    scrollToTop();
  };

  const scrollToTop = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  };

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    setDisplayData(filteredData.slice(start, end));
    requestAnimationFrame(() => {
      scrollToTop();
    });
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

      if (response.status === 200) {
        navigation.navigate("TransportVehicleSelection", {
          rowData: rowData,
          wasteList: wasteList,
        });
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

  // Render each card item
  const renderCardItem = ({ item, index }) => {
    const actualIndex = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
    
    return (
      <View style={styles.itemCard}>
        <View style={styles.itemCardHeader}>
          <View style={styles.itemCardNumber}>
            <Text style={styles.itemCardNumberText}>{actualIndex}</Text>
          </View>
          <View style={styles.itemCardBadge}>
            <Text style={styles.itemCardBadgeText}>{item.unit || "Tonnes"}</Text>
          </View>
        </View>

        <View style={styles.itemCardBody}>
          <View style={styles.itemCardRow}>
            <View style={styles.itemCardCol6}>
              <Text style={styles.itemCardLabel}>Waste Type</Text>
              <Text style={styles.itemCardValue}>{item.wasteType || "-"}</Text>
            </View>
            <View style={styles.itemCardCol6}>
              <Text style={styles.itemCardLabel}>Waste Name</Text>
              <Text style={styles.itemCardValue}>{item.wasteName || "-"}</Text>
            </View>
          </View>

          <View style={styles.itemCardRow}>
            <View style={styles.itemCardCol6}>
              <Text style={styles.itemCardLabel}>Receiver</Text>
              <Text style={styles.itemCardValue} numberOfLines={1}>
                {item.receiverName || "-"}
              </Text>
            </View>
            <View style={styles.itemCardCol6}>
              <Text style={styles.itemCardLabel}>Approved Date</Text>
              <Text style={styles.itemCardValue}>
                {item.approvedDate || "-"}
              </Text>
            </View>
          </View>

          <View style={styles.itemCardRow}>
            <View style={styles.itemCardCol6}>
              <Text style={styles.itemCardLabel}>Interested Qty</Text>
              <Text style={styles.itemCardValue}>{item.interestedQty || "0"}</Text>
            </View>
            <View style={styles.itemCardCol6}>
              <Text style={styles.itemCardLabel}>Pending Dispatch</Text>
              <Text style={styles.itemCardValue}>{item.pendingDispatch || "0"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.itemCardFooter}>
          {item.isProceeded ? (
            <View style={styles.disabledButton}>
              <Icon name="checkmark-circle" size={14} color="#28a745" />
              <Text style={styles.disabledButtonText}>Proceeded</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.proceedButton}
              onPress={() => handleProceed(item)}
              disabled={loading}
            >
              <Icon name="arrow-forward" size={14} color="#fff" />
              <Text style={styles.proceedButtonText}>Proceed</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Render Pagination Controls - All in one row
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    // Calculate which page numbers to show (previous, current, next)
    let pageNumbers = [];
    
    // Always show previous page if it exists
    if (currentPage - 1 >= 1) {
      pageNumbers.push(currentPage - 1);
    }
    
    // Show current page
    pageNumbers.push(currentPage);
    
    // Show next page if it exists
    if (currentPage + 1 <= totalPages) {
      pageNumbers.push(currentPage + 1);
    }
    
    // If we only have 1 number, try to add more context
    if (pageNumbers.length === 1) {
      if (currentPage < totalPages) {
        pageNumbers.push(currentPage + 1);
        if (currentPage + 2 <= totalPages) {
          pageNumbers.push(currentPage + 2);
        }
      } else if (currentPage > 1) {
        pageNumbers.unshift(currentPage - 1);
        if (currentPage - 2 >= 1) {
          pageNumbers.unshift(currentPage - 2);
        }
      }
    }
    
    // If we have 2 numbers, add one more for context
    if (pageNumbers.length === 2) {
      if (pageNumbers[pageNumbers.length - 1] < totalPages) {
        pageNumbers.push(pageNumbers[pageNumbers.length - 1] + 1);
      } else if (pageNumbers[0] > 1) {
        pageNumbers.unshift(pageNumbers[0] - 1);
      }
    }

    return (
      <View style={styles.paginationWrapper}>
        <View style={styles.paginationContainer}>
          {/* Previous Button */}
          <TouchableOpacity
            style={[styles.paginationButton, currentPage === 1 && styles.paginationDisabled]}
            onPress={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <Icon name="chevron-back" size={16} color={currentPage === 1 ? "#ccc" : "#2e7d32"} />
            <Text style={[styles.paginationText, currentPage === 1 && styles.paginationTextDisabled]}>
              Prev
            </Text>
          </TouchableOpacity>

          {/* First Page */}
          {pageNumbers[0] > 1 && (
            <>
              <TouchableOpacity style={styles.paginationNumber} onPress={() => goToPage(1)}>
                <Text style={styles.paginationNumberText}>1</Text>
              </TouchableOpacity>
              {pageNumbers[0] > 2 && <Text style={styles.paginationDots}>...</Text>}
            </>
          )}

          {/* Page Numbers */}
          {pageNumbers.map((page) => (
            <TouchableOpacity
              key={page}
              style={[
                styles.paginationNumber,
                currentPage === page && styles.paginationNumberActive,
              ]}
              onPress={() => goToPage(page)}
            >
              <Text
                style={[
                  styles.paginationNumberText,
                  currentPage === page && styles.paginationNumberTextActive,
                ]}
              >
                {page}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Last Page */}
          {pageNumbers[pageNumbers.length - 1] < totalPages && (
            <>
              {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                <Text style={styles.paginationDots}>...</Text>
              )}
              <TouchableOpacity style={styles.paginationNumber} onPress={() => goToPage(totalPages)}>
                <Text style={styles.paginationNumberText}>{totalPages}</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Next Button */}
          <TouchableOpacity
            style={[styles.paginationButton, currentPage === totalPages && styles.paginationDisabled]}
            onPress={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <Text style={[styles.paginationText, currentPage === totalPages && styles.paginationTextDisabled]}>
              Next
            </Text>
            <Icon name="chevron-forward" size={16} color={currentPage === totalPages ? "#ccc" : "#2e7d32"} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // List Header Component
  const ListHeaderComponent = () => (
    <>
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Icon name="search" size={18} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            value={searchTerm}
            onChangeText={handleSearch}
            placeholderTextColor="#999"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Icon name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </>
  );

  // List Footer Component
  const ListFooterComponent = () => (
    <>
      {renderPagination()}
      <View style={styles.pageInfoContainer}>
        <Text style={styles.pageInfoText}>
          Page {currentPage} of {totalPages} ({filteredData.length} records)
        </Text>
      </View>
    </>
  );

  // Empty List Component
  const ListEmptyComponent = () => (
    <View style={styles.noDataContainer}>
      <Icon name="warning-outline" size={40} color="#856404" />
      <Text style={styles.noDataText}>No Records Found</Text>
    </View>
  );

  const renderMainList = () => {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.cardContainer}>
          <View style={styles.cardHeader}>
            <Icon name="list" size={22} color="#1e3a5f" />
            <Text style={styles.cardTitle}>Approved List</Text>
            {filteredData.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{filteredData.length}</Text>
              </View>
            )}
          </View>

          <View style={styles.cardBody}>
            <View style={styles.panel}>
              <View style={styles.panelHeader}>
                <Text style={styles.panelHeaderText}>{CONTEXT_HEADING}</Text>
              </View>

              <View style={styles.panelBody}>
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2e7d32" />
                    <Text style={styles.loadingText}>Loading...</Text>
                  </View>
                ) : (
                  <FlatList
                    ref={flatListRef}
                    data={displayData}
                    renderItem={renderCardItem}
                    keyExtractor={(item, index) => 
                      item.wasteDisposalId + index.toString()
                    }
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshing={loading}
                    onRefresh={() => {
                      setSearchTerm("");
                      setFilteredData(flattenedData);
                      updatePagination(flattenedData);
                    }}
                    ListHeaderComponent={ListHeaderComponent}
                    ListFooterComponent={ListFooterComponent}
                    ListEmptyComponent={ListEmptyComponent}
                    getItemLayout={(data, index) => ({
                      length: 180,
                      offset: 180 * index,
                      index,
                    })}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                    keyboardShouldPersistTaps="handled"
                  />
                )}
              </View>
            </View>
          </View>
        </View>

        {renderPaymentModal()}
      </SafeAreaView>
    );
  };

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
  // Card Container
  cardContainer: {
    flex: 1,
    margin: 12,
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
  },
  cardHeader: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e3a5f",
    marginLeft: 8,
  },
  countBadge: {
    backgroundColor: "#2e7d32",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  countBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  cardBody: {
    padding: 12,
    flex: 1,
  },
  // Panel
  panel: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e8ecf1",
    overflow: "hidden",
    flex: 1,
  },
  panelHeader: {
    backgroundColor: "#2e7d32",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  panelHeaderText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  panelBody: {
    padding: 12,
    flex: 1,
  },
  // Search
  searchContainer: {
    marginBottom: 12,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 6,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 6,
    fontSize: 13,
    color: "#333",
  },
  // Loading
  loadingContainer: {
    padding: 30,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    color: "#666",
    fontSize: 13,
  },
  // No Data
  noDataContainer: {
    padding: 30,
    alignItems: "center",
    backgroundColor: "#fff3cd",
    borderRadius: 6,
    marginTop: 6,
  },
  noDataText: {
    color: "#856404",
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
  },
  // List
  listContainer: {
    paddingBottom: 10,
    paddingTop: 4,
  },
  // Item Card
  itemCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e8ecf1",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    overflow: "hidden",
  },
  itemCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
  },
  itemCardNumber: {
    backgroundColor: "#2e7d32",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  itemCardNumberText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  itemCardBadge: {
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  itemCardBadgeText: {
    fontSize: 10,
    color: "#2e7d32",
    fontWeight: "500",
  },
  itemCardBody: {
    padding: 12,
  },
  itemCardRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  itemCardCol6: {
    flex: 1,
    paddingHorizontal: 4,
  },
  itemCardLabel: {
    fontSize: 10,
    color: "#888",
    fontWeight: "500",
    marginBottom: 2,
  },
  itemCardValue: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
  },
  itemCardFooter: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: "#e8ecf1",
    backgroundColor: "#fafbfc",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  // Buttons
  proceedButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2e7d32",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  proceedButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  disabledButton: {
    flexDirection: "row",
    alignItems: "center",
    opacity: 0.6,
  },
  disabledButtonText: {
    fontSize: 11,
    color: "#28a745",
    marginLeft: 4,
    fontWeight: "500",
  },
  // Pagination Wrapper
  paginationWrapper: {
    borderTopWidth: 1,
    borderTopColor: "#e8ecf1",
    paddingVertical: 8,
    marginTop: 4,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "nowrap",
    paddingHorizontal: 4,
  },
  paginationButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: "#f5f7fa",
    marginHorizontal: 2,
  },
  paginationDisabled: {
    opacity: 0.5,
  },
  paginationText: {
    fontSize: 11,
    color: "#2e7d32",
    fontWeight: "500",
  },
  paginationTextDisabled: {
    color: "#ccc",
  },
  paginationNumber: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginHorizontal: 2,
    minWidth: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  paginationNumberActive: {
    backgroundColor: "#2e7d32",
  },
  paginationNumberText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
  paginationNumberTextActive: {
    color: "#fff",
  },
  paginationDots: {
    fontSize: 12,
    color: "#666",
    paddingHorizontal: 2,
  },
  pageInfoContainer: {
    alignItems: "center",
    paddingVertical: 4,
    paddingBottom: 8,
  },
  pageInfoText: {
    fontSize: 11,
    color: "#888",
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
    borderRadius: 14,
    padding: 16,
    width: "95%",
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
  },
  modalTitle: {
    fontSize: 16,
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
  },
  modalOkButton: {
    backgroundColor: "#2e7d32",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  modalOkButtonText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 14,
  },
  // Payment Styles
  paymentCard: {
    borderWidth: 1,
    borderColor: "#dcdcdc",
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#fff",
  },
  paymentAmountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  paymentAmountLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  paymentAmountValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "green",
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginVertical: 8,
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  paymentStatusRow: {
    marginTop: 2,
  },
  paymentLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#555",
  },
  paymentValue: {
    fontSize: 13,
    color: "#333",
  },
  paymentStatus: {
    fontSize: 13,
    fontWeight: "600",
    color: "green",
    textTransform: "uppercase",
  },
});

export default GenApprovedList;