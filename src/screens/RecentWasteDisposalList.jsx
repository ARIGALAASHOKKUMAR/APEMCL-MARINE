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

function RecentWasteDisposalList({ navigation, route }) {
  const [wasteData, setWasteData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [detailedData, setDetailedData] = useState(null);
  const [detailedDataFlag, setDetailedDataFlag] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
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
            return Number(value) <= Number(detailedData?.quantity_ready_for_disposal);
          }
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
        dispatch
      );
      if (response.status === 200) {
        Alert.alert("Success", "Interest shown successfully!");
        setShowModal(false);
        setDetailedDataFlag(false);
        setDetailedData(null);
        formik.resetForm();
        getAllWasteData();
        // Navigate back to list
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
        dispatch
      );
      if (response.status === 200) {
        const data = response.data.WasteDisposal_Details[0]
          .WasteDisposal_Details_With_Generator || [];
        setWasteData(data);
        setFilteredData(data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", "Failed to fetch waste disposal data");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (text) => {
    setSearchTerm(text);
    const filtered = wasteData.filter((item) =>
      Object.values(item).some(
        (value) =>
          value &&
          value.toString().toLowerCase().includes(text.toLowerCase())
      )
    );
    setFilteredData(filtered);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    formik.resetForm();
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
            <View style={styles.card}>
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
                    <Text style={styles.panelHeaderText}>{CONTEXT_HEADING}</Text>
                  </View>
                  <View style={styles.panelBody}>
                    {/* Generator Details */}
                    <View style={styles.detailSection}>
                      <View style={styles.sectionHeader}>
                        <Icon name="business-outline" size={20} color="#2e7d32" />
                        <Text style={styles.sectionTitle}>Generator Details</Text>
                      </View>
                      <View style={styles.detailCard}>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Industry Name:</Text>
                          <Text style={styles.detailValue}>
                            {detailedData?.industry_name}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>District - State:</Text>
                          <Text style={styles.detailValue}>
                            {detailedData?.dist_name} - Andhra Pradesh
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Industry Address:</Text>
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
                          <Text style={styles.detailLabel}>Authorized Person:</Text>
                          <Text style={styles.detailValue}>
                            {detailedData?.authorized_person}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Email:</Text>
                          <TouchableOpacity
                            onPress={() =>
                              Linking.openURL(
                                `mailto:${detailedData?.authorized_person_email}`
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
                          <Text style={styles.detailLabel}>Line of Activity:</Text>
                          <Text style={styles.detailValue}>
                            {detailedData?.lineofactivityname}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Correspondence Address:</Text>
                          <Text style={styles.detailValue}>
                            {detailedData?.correspondence_address}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Mobile:</Text>
                          <TouchableOpacity
                            onPress={() =>
                              Linking.openURL(
                                `tel:${detailedData?.authorized_person_mobile}`
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
                        <Icon name="recycle" size={20} color="#2e7d32" />
                        <Text style={styles.sectionTitle}>
                          {detailedData.waste_type_name} - Waste Details
                        </Text>
                      </View>
                      <View style={styles.detailCard}>
                        {detailedData.waste_type_name === "Effluent" ? (
                          <>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Waste Details:</Text>
                              <Text style={styles.detailValue}>
                                {detailedData.waste_type_name}
                              </Text>
                            </View>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Quantity for Disposal:</Text>
                              <Text style={styles.detailValue}>
                                {detailedData.quantity_ready_for_disposal}
                              </Text>
                            </View>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Total Permitted Quantity:</Text>
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
                              <Text style={styles.detailLabel}>Permitted Disposal Option:</Text>
                              <Text style={styles.detailValue}>
                                {detailedData.permitted_disposal_option}
                              </Text>
                            </View>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Total Permitted Qty (Tonnes):</Text>
                              <Text style={styles.detailValue}>
                                {detailedData.permitted_quantity}
                              </Text>
                            </View>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Name of Hazardous Waste:</Text>
                              <Text style={styles.detailValue}>
                                {detailedData.hazardous_waste_name}
                              </Text>
                            </View>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Quantity Ready For Disposal:</Text>
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
                          <Text style={styles.interestButtonText}>Show Interest</Text>
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
                          {formik.errors.remarks &&
                            formik.touched.remarks && (
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
                            style={[styles.footerButton, styles.submitModalButton]}
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

  const renderListView = () => {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="list" size={24} color="#1e3a5f" />
            <Text style={styles.cardTitle}>Recent Waste Disposal List</Text>
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
                    <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
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
                        }}
                      >
                        <Icon name="close-circle" size={20} color="#999" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Table */}
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2e7d32" />
                    <Text style={styles.loadingText}>Loading...</Text>
                  </View>
                ) : (
                  <View style={styles.tableContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View>
                        <View style={styles.tableHeader}>
                          <Text style={[styles.tableCell, { width: 50 }]}>S.No</Text>
                          <Text style={[styles.tableCell, { width: 150 }]}>
                            Waste Name
                          </Text>
                          <Text style={[styles.tableCell, { width: 150 }]}>
                            Generator Name
                          </Text>
                          <Text style={[styles.tableCell, { width: 120 }]}>
                            Quantity (TPA)
                          </Text>
                          <Text style={[styles.tableCell, { width: 120 }]}>
                            Updated Date
                          </Text>
                          <Text style={[styles.tableCell, { width: 100 }]}>
                            Action
                          </Text>
                        </View>

                        {filteredData.length > 0 ? (
                          filteredData.map((item, index) => (
                            <View key={index} style={styles.tableRow}>
                              <Text style={[styles.tableCell, { width: 50, textAlign: "center" }]}>
                                {index + 1}
                              </Text>
                              <Text style={[styles.tableCell, { width: 150 }]} numberOfLines={1}>
                                {item.waste_type_name}
                              </Text>
                              <Text style={[styles.tableCell, { width: 150 }]} numberOfLines={1}>
                                {item.industry_name}
                              </Text>
                              <Text style={[styles.tableCell, { width: 120, textAlign: "right" }]}>
                                {item.quantity_ready_for_disposal}
                              </Text>
                              <Text style={[styles.tableCell, { width: 120, textAlign: "right" }]}>
                                {item.created_on?.split("T")[0] || "-"}
                              </Text>
                              <View style={[styles.tableCell, { width: 100 }]}>
                                {item.quantity_ready_for_disposal === 0 ? (
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
                          ))
                        ) : (
                          <View style={styles.noDataContainer}>
                            <Text style={styles.noDataText}>No Records Found</Text>
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
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e3a5f",
    flex: 1,
    textAlign: "center",
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
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 14,
  },
  noDataContainer: {
    padding: 20,
    alignItems: "center",
  },
  noDataText: {
    color: "#dc3545",
    fontSize: 14,
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2e7d32",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  viewButtonText: {
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
  // Detail View Styles
  detailSection: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2e7d32",
    marginLeft: 8,
  },
  detailCard: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 8,
  },
  detailRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
  },
  detailLabel: {
    width: 120,
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    color: "#555",
  },
  linkText: {
    color: "#2e7d32",
    textDecorationLine: "underline",
  },
  interestButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  interestButtonText: {
    color: "#fff",
    fontSize: 14,
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
    fontSize: 16,
    fontWeight: "600",
    color: "#1e3a5f",
  },
  modalBody: {
    marginBottom: 8,
  },
  availableQtyContainer: {
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    flexDirection: "row",
    alignItems: "center",
  },
  availableQtyLabel: {
    fontSize: 14,
    color: "#666",
  },
  availableQtyValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2e7d32",
    marginLeft: 4,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  star: {
    color: "red",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#fff",
    color: "#333",
  },
  inputError: {
    borderColor: "#dc3545",
    borderWidth: 2,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  errorText: {
    color: "#dc3545",
    fontSize: 12,
    marginTop: 4,
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
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: "#6c757d",
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  submitModalButton: {
    backgroundColor: "#2e7d32",
  },
  submitModalButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
});

export default RecentWasteDisposalList;