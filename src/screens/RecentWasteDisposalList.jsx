import React, { useEffect, useState, useRef } from "react";
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
  Platform,
  KeyboardAvoidingView,
  Linking,
} from "react-native";
import { useDispatch } from "react-redux";
import { useFormik, FormikProvider } from "formik";
import * as Yup from "yup";
import Icon from "react-native-vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  commonAPICall,
  CONTEXT_HEADING,
  ADDWASTEDISPOSALDETAILS,
  GETWASTEDISPOSALDETAILS,
} from "../utils/utils";

const ITEMS_PER_PAGE = 10;

function RecentWasteDisposalList({ navigation, route }) {
  const [wasteData, setWasteData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [detailedData, setDetailedData] = useState(null);
  const [detailedDataFlag, setDetailedDataFlag] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const flatListRef = useRef(null);
  const dispatch = useDispatch();

  // Check if we have detailed data from navigation
  useEffect(() => {
    if (route?.params?.detailedData) {
      setDetailedData(route.params.detailedData);
      setDetailedDataFlag(true);
    } else {
      setDetailedDataFlag(false);
      setDetailedData(null);
    }
  }, [route?.params]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      interestQty: "",
      remarks: "",
    },
    validationSchema: Yup.object({
      interestQty: Yup.number()
        .typeError("Enter valid quantity")
        .required("Quantity is required")
        .min(0, "Quantity must be greater than 0")
        .test(
          "not-greater-than-available",
          "Cannot exceed available quantity",
          function (value) {
            if (!value) return true;
            return (
              Number(value) <= Number(detailedData?.quantity_ready_for_disposal)
            );
          },
        ),
      remarks: Yup.string().max(250, "Maximum 250 characters allowed"),
    }),
    onSubmit: (values) => {
      handleSubmit(values);
    },
  });

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const payload = [
        {
          ...values,
          isInterested: true,
          wasteDisposalId: detailedData.waste_disposal_id,
        },
      ];
      const response = await commonAPICall(
        ADDWASTEDISPOSALDETAILS,
        payload,
        "post",
        dispatch,
      );
      if (response.status === 200) {
        Alert.alert("Success", "Interest shown successfully!");
        setShowModal(false);
        setDetailedDataFlag(false);
        setDetailedData(null);
        formik.resetForm();
        getAllWasteData();
        navigation.setParams({ detailedData: null });
      }
    } catch (error) {
      console.error("Submit error:", error);
      Alert.alert("Error", "Failed to submit interest");
    } finally {
      setLoading(false);
    }
  };

  const getAllWasteData = async () => {
    try {
      setLoading(true);
      const response = await commonAPICall(
        GETWASTEDISPOSALDETAILS,
        {},
        "get",
        dispatch,
      );
      if (response.status === 200) {
        const data =
          response.data.WasteDisposal_Details[0]
            .WasteDisposal_Details_With_Generator || [];
        setWasteData(data);
        setFilteredData(data);
        updatePagination(data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", "Failed to fetch waste disposal data");
    } finally {
      setLoading(false);
    }
  };

  const updatePagination = (dataArray) => {
    const total = Math.ceil(dataArray.length / ITEMS_PER_PAGE);
    setTotalPages(total);
    setCurrentPage(1);
    const start = 0;
    const end = ITEMS_PER_PAGE;
    setDisplayData(dataArray.slice(start, end));
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

  const handleSearch = (text) => {
    setSearchTerm(text);
    if (text.trim() === "") {
      setFilteredData(wasteData);
      updatePagination(wasteData);
      scrollToTop();
      return;
    }
    const filtered = wasteData.filter((item) =>
      Object.values(item).some(
        (value) =>
          value && value.toString().toLowerCase().includes(text.toLowerCase()),
      ),
    );
    setFilteredData(filtered);
    updatePagination(filtered);
    scrollToTop();
  };

  const handleCloseModal = () => {
    setShowModal(false);
    formik.resetForm();
  };

  // Render Pagination Controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    let pageNumbers = [];
    if (currentPage - 1 >= 1) {
      pageNumbers.push(currentPage - 1);
    }
    pageNumbers.push(currentPage);
    if (currentPage + 1 <= totalPages) {
      pageNumbers.push(currentPage + 1);
    }

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
          <TouchableOpacity
            style={[
              styles.paginationButton,
              currentPage === 1 && styles.paginationDisabled,
            ]}
            onPress={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <Icon
              name="chevron-back"
              size={16}
              color={currentPage === 1 ? "#ccc" : "#2e7d32"}
            />
            <Text
              style={[
                styles.paginationText,
                currentPage === 1 && styles.paginationTextDisabled,
              ]}
            >
              Prev
            </Text>
          </TouchableOpacity>

          {pageNumbers[0] > 1 && (
            <>
              <TouchableOpacity
                style={styles.paginationNumber}
                onPress={() => goToPage(1)}
              >
                <Text style={styles.paginationNumberText}>1</Text>
              </TouchableOpacity>
              {pageNumbers[0] > 2 && (
                <Text style={styles.paginationDots}>...</Text>
              )}
            </>
          )}

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

          {pageNumbers[pageNumbers.length - 1] < totalPages && (
            <>
              {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                <Text style={styles.paginationDots}>...</Text>
              )}
              <TouchableOpacity
                style={styles.paginationNumber}
                onPress={() => goToPage(totalPages)}
              >
                <Text style={styles.paginationNumberText}>{totalPages}</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[
              styles.paginationButton,
              currentPage === totalPages && styles.paginationDisabled,
            ]}
            onPress={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <Text
              style={[
                styles.paginationText,
                currentPage === totalPages && styles.paginationTextDisabled,
              ]}
            >
              Next
            </Text>
            <Icon
              name="chevron-forward"
              size={16}
              color={currentPage === totalPages ? "#ccc" : "#2e7d32"}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderDetailedView = () => {
    if (!detailedData) return null;

    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            <View style={styles.cardContainer}>
              <View style={styles.cardHeader}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => {
                    setDetailedDataFlag(false);
                    setDetailedData(null);
                    navigation.setParams({ detailedData: null });
                  }}
                >
                  <Icon name="arrow-back" size={24} color="#1e3a5f" />
                </TouchableOpacity>
                <Text style={styles.cardTitle}>Waste Disposal Details</Text>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.panel}>
                  <View style={styles.panelHeader}>
                    <Text style={styles.panelHeaderText}>
                      {CONTEXT_HEADING}
                    </Text>
                  </View>
                  <View style={styles.panelBody}>
                    {/* Generator Details */}
                    <View style={styles.detailSection}>
                      <View style={styles.sectionHeader}>
                        <Icon
                          name="business-outline"
                          size={20}
                          color="#2e7d32"
                        />
                        <Text style={styles.sectionTitle}>
                          Generator Details
                        </Text>
                      </View>
                      <View style={styles.detailCard}>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Industry Name:</Text>
                          <Text style={styles.detailValue}>
                            {detailedData?.industry_name}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>
                            District - State:
                          </Text>
                          <Text style={styles.detailValue}>
                            {detailedData?.dist_name} - Andhra Pradesh
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>
                            Industry Address:
                          </Text>
                          <Text style={styles.detailValue}>
                            {detailedData?.industry_location_address}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Pincode:</Text>
                          <Text style={styles.detailValue}>
                            {detailedData?.pin_code}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>
                            Authorized Person:
                          </Text>
                          <Text style={styles.detailValue}>
                            {detailedData?.authorized_person}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Email:</Text>
                          <TouchableOpacity
                            onPress={() =>
                              Linking.openURL(
                                `mailto:${detailedData?.authorized_person_email}`,
                              )
                            }
                          >
                            <Text style={[styles.detailValue, styles.linkText]}>
                              {detailedData?.authorized_person_email}
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Category:</Text>
                          <Text style={styles.detailValue}>
                            {detailedData?.category_name}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>
                            Line of Activity:
                          </Text>
                          <Text style={styles.detailValue}>
                            {detailedData?.lineofactivityname}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>
                            Correspondence Address:
                          </Text>
                          <Text style={styles.detailValue}>
                            {detailedData?.correspondence_address}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Mobile:</Text>
                          <TouchableOpacity
                            onPress={() =>
                              Linking.openURL(
                                `tel:${detailedData?.authorized_person_mobile}`,
                              )
                            }
                          >
                            <Text style={[styles.detailValue, styles.linkText]}>
                              {detailedData?.authorized_person_mobile}
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>GST Number:</Text>
                          <Text style={styles.detailValue}>
                            {detailedData?.gst_number}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Type:</Text>
                          <Text style={styles.detailValue}>
                            {detailedData?.waste_type_name}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Waste Details */}
                    <View style={styles.detailSection}>
                      <View style={styles.sectionHeader}>
                        <Icon name="sync" size={20} color="#2e7d32" />
                        <Text style={styles.sectionTitle}>
                          {detailedData.waste_type_name} - Waste Details
                        </Text>
                      </View>
                      <View style={styles.detailCard}>
                        {detailedData.waste_type_name === "Effluent" ? (
                          <>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>
                                Waste Details:
                              </Text>
                              <Text style={styles.detailValue}>
                                {detailedData.waste_type_name}
                              </Text>
                            </View>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>
                                Quantity for Disposal:
                              </Text>
                              <Text style={styles.detailValue}>
                                {detailedData.quantity_ready_for_disposal}
                              </Text>
                            </View>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>
                                Total Permitted Quantity:
                              </Text>
                              <Text style={styles.detailValue}>
                                {detailedData.permitted_quantity}
                              </Text>
                            </View>
                          </>
                        ) : (
                          <>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Process:</Text>
                              <Text style={styles.detailValue}>
                                {detailedData.process_name}
                              </Text>
                            </View>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Stream:</Text>
                              <Text style={styles.detailValue}>
                                {detailedData.stream_name}
                              </Text>
                            </View>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>
                                Permitted Disposal Option:
                              </Text>
                              <Text style={styles.detailValue}>
                                {detailedData.permitted_disposal_option}
                              </Text>
                            </View>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>
                                Total Permitted Qty (Tonnes):
                              </Text>
                              <Text style={styles.detailValue}>
                                {detailedData.permitted_quantity}
                              </Text>
                            </View>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>
                                Name of Hazardous Waste:
                              </Text>
                              <Text style={styles.detailValue}>
                                {detailedData.hazardous_waste_name}
                              </Text>
                            </View>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>
                                Quantity Ready For Disposal:
                              </Text>
                              <Text style={styles.detailValue}>
                                {detailedData.quantity_ready_for_disposal}
                              </Text>
                            </View>
                          </>
                        )}

                        <TouchableOpacity
                          style={styles.interestButton}
                          onPress={() => setShowModal(true)}
                          disabled={loading}
                        >
                          <Text style={styles.interestButtonText}>
                            Show Interest
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Interest Modal */}
            <Modal
              animationType="slide"
              transparent={true}
              visible={showModal}
              onRequestClose={handleCloseModal}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{CONTEXT_HEADING}</Text>
                    <TouchableOpacity onPress={handleCloseModal}>
                      <Icon name="close" size={24} color="#333" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalBody}>
                    <View style={styles.availableQtyContainer}>
                      <Text style={styles.availableQtyLabel}>
                        Available Quantity:
                      </Text>
                      <Text style={styles.availableQtyValue}>
                        {detailedData?.quantity_ready_for_disposal} Tonnes
                      </Text>
                    </View>

                    <FormikProvider value={formik}>
                      <View>
                        <View style={styles.formGroup}>
                          <Text style={styles.label}>
                            Quantity (Tonnes) <Text style={styles.star}>*</Text>
                          </Text>
                          <TextInput
                            style={[
                              styles.input,
                              formik.errors.interestQty &&
                                formik.touched.interestQty &&
                                styles.inputError,
                            ]}
                            value={formik.values.interestQty}
                            onChangeText={formik.handleChange("interestQty")}
                            onBlur={formik.handleBlur("interestQty")}
                            keyboardType="numeric"
                            maxLength={9}
                            placeholder="Enter quantity"
                            placeholderTextColor="#999"
                          />
                          {formik.errors.interestQty &&
                            formik.touched.interestQty && (
                              <Text style={styles.errorText}>
                                {formik.errors.interestQty}
                              </Text>
                            )}
                        </View>

                        <View style={styles.formGroup}>
                          <Text style={styles.label}>Remarks</Text>
                          <TextInput
                            style={[styles.input, styles.textArea]}
                            value={formik.values.remarks}
                            onChangeText={formik.handleChange("remarks")}
                            onBlur={formik.handleBlur("remarks")}
                            placeholder="Enter remarks (optional)"
                            placeholderTextColor="#999"
                            multiline={true}
                            numberOfLines={3}
                            textAlignVertical="top"
                          />
                          {formik.errors.remarks && formik.touched.remarks && (
                            <Text style={styles.errorText}>
                              {formik.errors.remarks}
                            </Text>
                          )}
                        </View>

                        <View style={styles.modalFooter}>
                          <TouchableOpacity
                            style={[styles.footerButton, styles.cancelButton]}
                            onPress={handleCloseModal}
                            disabled={loading}
                          >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.footerButton,
                              styles.submitModalButton,
                            ]}
                            onPress={formik.handleSubmit}
                            disabled={loading}
                          >
                            {loading ? (
                              <ActivityIndicator size="small" color="#fff" />
                            ) : (
                              <Text style={styles.submitModalButtonText}>
                                Submit
                              </Text>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    </FormikProvider>
                  </View>
                </View>
              </View>
            </Modal>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  };

  // Render Card Item
  const renderCardItem = ({ item, index }) => {
    const actualIndex = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
    const isInterestShown = item.quantity_ready_for_disposal === 0;

    return (
      <View style={styles.resultCard}>
        <View style={styles.resultCardHeader}>
          <View style={styles.resultCardNumber}>
            <Text style={styles.resultCardNumberText}>{actualIndex}</Text>
          </View>
          <Text style={styles.resultCardTitle} numberOfLines={1}>
            {item.waste_type_name || "Waste"}
          </Text>
        </View>

        <View style={styles.resultCardBody}>
          <View style={styles.resultCardRow}>
            <View style={styles.resultCardCol12}>
              <Text style={styles.resultCardLabel}>Generator Name</Text>
              <Text style={styles.resultCardValue} numberOfLines={1}>
                {item.industry_name || "-"}
              </Text>
            </View>
          </View>

          <View style={styles.resultCardRow}>
            <View style={styles.resultCardCol6}>
              <Text style={styles.resultCardLabel}>Quantity (TPA)</Text>
              <Text style={styles.resultCardValue}>
                {item.quantity_ready_for_disposal || "0"}
              </Text>
            </View>
            <View style={styles.resultCardCol6}>
              <Text style={styles.resultCardLabel}>Updated Date</Text>
              <Text style={styles.resultCardValue}>
                {item.created_on?.split("T")[0] || "-"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.resultCardFooter}>
          {isInterestShown ? (
            <View style={styles.disabledButton}>
              <Icon name="checkmark-circle" size={16} color="#28a745" />
              <Text style={styles.disabledButtonText}>Interest Shown</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => {
                navigation.navigate("RecentWasteDisposalList", {
                  detailedData: item,
                });
              }}
            >
              <Icon name="folder-open" size={16} color="#fff" />
              <Text style={styles.viewButtonText}>Details</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // List Header Component
  const ListHeaderComponent = () => (
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
          <TouchableOpacity
            onPress={() => {
              setSearchTerm("");
              setFilteredData(wasteData);
              updatePagination(wasteData);
            }}
          >
            <Icon name="close-circle" size={18} color="#999" />
          </TouchableOpacity>
        )}
      </View>
    </View>
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

  const renderListView = () => {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.cardContainer}>
          <View style={styles.cardHeader}>
            <Icon name="list" size={22} color="#1e3a5f" />
            <Text style={styles.cardTitle}>Recent Waste Disposal List</Text>
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
                      (item.waste_disposal_id || "") + index.toString()
                    }
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    refreshing={loading}
                    onRefresh={() => {
                      setSearchTerm("");
                      setFilteredData(wasteData);
                      updatePagination(wasteData);
                    }}
                    ListHeaderComponent={ListHeaderComponent}
                    ListFooterComponent={ListFooterComponent}
                    ListEmptyComponent={ListEmptyComponent}
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
      </SafeAreaView>
    );
  };

  useEffect(() => {
    getAllWasteData();
  }, []);

  if (detailedDataFlag && detailedData) {
    return renderDetailedView();
  }

  return renderListView();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  scrollView: {
    flex: 1,
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
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e3a5f",
    flex: 1,
    textAlign: "center",
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
  // List
  listContainer: {
    paddingBottom: 10,
    paddingTop: 4,
  },
  // Result Card
  resultCard: {
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
  resultCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
  },
  resultCardNumber: {
    backgroundColor: "#2e7d32",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 10,
  },
  resultCardNumberText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  resultCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e3a5f",
    flex: 1,
  },
  resultCardBody: {
    padding: 12,
  },
  resultCardRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  resultCardCol6: {
    flex: 1,
    paddingHorizontal: 4,
  },
  resultCardCol12: {
    flex: 1,
    paddingHorizontal: 4,
  },
  resultCardLabel: {
    fontSize: 10,
    color: "#888",
    fontWeight: "500",
    marginBottom: 2,
  },
  resultCardValue: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
  },
  resultCardFooter: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: "#e8ecf1",
    backgroundColor: "#fafbfc",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  // Action Buttons
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2e7d32",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewButtonText: {
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
  // Pagination
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
    paddingHorizontal: 6,
    paddingVertical: 4,
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
    paddingVertical: 4,
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
  // Detail View Styles
  detailSection: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    padding: 8,
    borderRadius: 6,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2e7d32",
    marginLeft: 6,
  },
  detailCard: {
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 6,
  },
  detailRow: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
  },
  detailLabel: {
    width: 100,
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  detailValue: {
    flex: 1,
    fontSize: 12,
    color: "#555",
  },
  linkText: {
    color: "#2e7d32",
    textDecorationLine: "underline",
  },
  interestButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 10,
  },
  interestButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
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
    fontSize: 15,
    fontWeight: "600",
    color: "#1e3a5f",
  },
  modalBody: {
    marginBottom: 8,
  },
  availableQtyContainer: {
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    flexDirection: "row",
    alignItems: "center",
  },
  availableQtyLabel: {
    fontSize: 13,
    color: "#666",
  },
  availableQtyValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#2e7d32",
    marginLeft: 4,
  },
  formGroup: {
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    marginBottom: 3,
  },
  star: {
    color: "red",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    backgroundColor: "#fff",
    color: "#333",
  },
  inputError: {
    borderColor: "#dc3545",
    borderWidth: 2,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  errorText: {
    color: "#dc3545",
    fontSize: 11,
    marginTop: 3,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e8ecf1",
    marginTop: 8,
  },
  footerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 6,
  },
  cancelButton: {
    backgroundColor: "#6c757d",
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 13,
  },
  submitModalButton: {
    backgroundColor: "#2e7d32",
  },
  submitModalButtonText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 13,
  },
});

export default RecentWasteDisposalList;
