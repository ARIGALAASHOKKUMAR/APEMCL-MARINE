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
  ActionSheetIOS,
} from "react-native";
import { useDispatch } from "react-redux";
import { useFormik, FormikProvider } from "formik";
import * as Yup from "yup";
import Icon from "react-native-vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  commonAPICall,
  CONTEXT_HEADING,
  ADDWASTEDISPOSALDETAILS,
  WASTEDISPOSALINTERESTDETAILS,
} from "../utils/utils";
import { wasteTypes } from "../utils/CommonFunctions";



function InterestedWasteList() {
  const navigation = useNavigation();
  const route = useRoute();
  const [wasteData, setWasteData] = useState([]);
  const [res, setRes] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReceivers, setShowReceivers] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [selectedType, setSelectedType] = useState("");
  const [receiversList, setReceiversList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const dispatch = useDispatch();

  // Check if we're in receivers view mode
  useEffect(() => {
    if (route?.params?.rowData && route?.params?.type) {
      setSelectedData(route.params.rowData);
      setSelectedType(route.params.type);
      const unparsedData = route.params.rowData.receivers_list;
      const receivers = JSON.parse(unparsedData || "[]");
      setReceiversList(receivers);
      setShowReceivers(true);
    } else {
      setShowReceivers(false);
      setSelectedData(null);
      setReceiversList([]);
    }
  }, [route?.params]);

  const formik = useFormik({
    initialValues: {
      wasteType: "",
      quantityReadyForDisposal: [],
    },
    validationSchema: Yup.object({
      quantityReadyForDisposal: Yup.array().test(
        "at-least-one",
        "Enter Quantity Ready For Disposal in at least one row",
        function (value) {
          if (!value) return false;
          const hasAtLeastOne = value.some(
            (v) => v !== undefined && v !== null && v !== ""
          );
          return hasAtLeastOne;
        }
      ),
    }),
    onSubmit: () => {},
  });

  const handleWasteTypeChange = async (value) => {
    try {
      setLoading(true);
      setRes("");
      const response = await commonAPICall(
        WASTEDISPOSALINTERESTDETAILS + value + "&approved=false",
        {},
        "get",
        dispatch
      );
      if (response.status === 200) {
        const data = response.data.WasteDisposal_Interest_Details || [];
        setWasteData(data);
        setRes("datafound");
      } else {
        setRes("nodata");
        setWasteData([]);
      }
    } catch (error) {
      console.error("Error fetching waste data:", error);
      setRes("nodata");
      setWasteData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (rowData) => {
    navigation.navigate("InterestedWasteList", {
      rowData: rowData,
      type: formik.values.wasteType,
    });
  };

  const handleApprove = async (wasteDisposalInterestId) => {
    Alert.alert(
      "Are you sure?",
      "Do you want to Approve?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            try {
              setLoading(true);
              const payload = [{ wasteDisposalInterestId: wasteDisposalInterestId }];
              const response = await commonAPICall(
                ADDWASTEDISPOSALDETAILS,
                payload,
                "POST",
                dispatch
              );
              if (response.status === 200) {
                Alert.alert("Success", "Approved successfully!");
                // Navigate back or refresh
                navigation.goBack();
              }
            } catch (error) {
              console.error("Approve error:", error);
              Alert.alert("Error", "Failed to approve");
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  // Custom Dropdown Component
  const CustomDropdown = ({
    options,
    selectedValue,
    onSelect,
    placeholder,
    label,
    error,
    disabled = false,
  }) => {
    const [showOptions, setShowOptions] = useState(false);

    const getLabel = () => {
      const selected = options.find(
        (opt) => String(opt.value) === String(selectedValue)
      );
      return selected ? selected.label : placeholder || "Select";
    };

    const handlePress = () => {
      if (disabled) return;

      if (Platform.OS === "ios") {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ["Cancel", ...options.map((o) => o.label)],
            cancelButtonIndex: 0,
            title: label || "Select Option",
          },
          (buttonIndex) => {
            if (buttonIndex > 0) {
              const selectedOption = options[buttonIndex - 1];
              if (selectedOption) {
                onSelect(selectedOption.value);
              }
            }
          }
        );
      } else {
        setShowOptions(true);
      }
    };

    const renderAndroidDropdown = () => {
      if (!showOptions || Platform.OS === "ios") return null;

      return (
        <Modal
          transparent={true}
          visible={showOptions}
          onRequestClose={() => setShowOptions(false)}
          animationType="fade"
          statusBarTranslucent={true}
        >
          <TouchableOpacity
            style={styles.dropdownModalOverlay}
            activeOpacity={1}
            onPress={() => setShowOptions(false)}
          >
            <View style={styles.dropdownModalContent}>
              <View style={styles.dropdownModalHeader}>
                <Text style={styles.dropdownModalTitle}>
                  {label || "Select Option"}
                </Text>
                <TouchableOpacity onPress={() => setShowOptions(false)}>
                  <Icon name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <View style={styles.dropdownListWrapper}>
                <FlatList
                  data={options}
                  keyExtractor={(item, index) => String(item.value) + index}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.dropdownOption,
                        String(selectedValue) === String(item.value) &&
                          styles.dropdownOptionSelected,
                      ]}
                      onPress={() => {
                        onSelect(item.value);
                        setShowOptions(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          String(selectedValue) === String(item.value) &&
                            styles.dropdownOptionTextSelected,
                        ]}
                        numberOfLines={2}
                      >
                        {item.label}
                      </Text>
                      {String(selectedValue) === String(item.value) && (
                        <Icon name="checkmark" size={18} color="#2e7d32" />
                      )}
                    </TouchableOpacity>
                  )}
                  showsVerticalScrollIndicator={true}
                  style={styles.dropdownFlatList}
                  contentContainerStyle={styles.dropdownListContent}
                  nestedScrollEnabled={true}
                  bounces={true}
                  overScrollMode="always"
                  removeClippedSubviews={false}
                  initialNumToRender={10}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                />
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      );
    };

    return (
      <View style={styles.dropdownContainer}>
        {label && (
          <Text style={styles.label}>
            {label} <Text style={styles.star}>*</Text>
          </Text>
        )}
        <TouchableOpacity
          style={[
            styles.dropdownButton,
            disabled && styles.dropdownDisabled,
            error && styles.dropdownError,
          ]}
          onPress={handlePress}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.dropdownButtonText,
              !selectedValue && styles.placeholderText,
            ]}
            numberOfLines={1}
          >
            {getLabel()}
          </Text>
          <Icon name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>

        {renderAndroidDropdown()}

        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  };

  const renderReceiversList = () => {
    if (!selectedData) return null;

    const getWasteTypeLabel = () => {
      const found = wasteTypes.find((n) => n.value === selectedType);
      return found ? found.label : "";
    };

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => {
                setShowReceivers(false);
                setSelectedData(null);
                setReceiversList([]);
                navigation.setParams({ rowData: null, type: null });
              }}
            >
              <Icon name="arrow-back" size={24} color="#1e3a5f" />
            </TouchableOpacity>
            <Text style={styles.cardTitle}>
              {getWasteTypeLabel()} Interested List
            </Text>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.panel}>
              <View style={styles.panelHeader}>
                <Text style={styles.panelHeaderText}>{CONTEXT_HEADING}</Text>
              </View>
              <View style={styles.panelBody}>
                {/* Waste Details */}
                {selectedType === "1" ? (
                  <View style={styles.detailCard}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Waste Details:</Text>
                      <Text style={styles.detailValue}>
                        {selectedData.waste_type_name}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Quantity for Disposal:</Text>
                      <Text style={styles.detailValue}>
                        {selectedData.quantity_ready_for_disposal}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.detailGrid}>
                    <View style={styles.detailBox}>
                      <Text style={styles.detailBoxLabel}>Process:</Text>
                      <Text style={styles.detailBoxValue}>
                        {selectedData.process_name}
                      </Text>
                      <Text style={styles.detailBoxLabel}>Permitted Quantity (TPA):</Text>
                      <Text style={styles.detailBoxValue}>
                        {selectedData.permitted_quantity}
                      </Text>
                    </View>
                    <View style={styles.detailBox}>
                      <Text style={styles.detailBoxLabel}>Stream:</Text>
                      <Text style={styles.detailBoxValue}>
                        {selectedData.stream_name}
                      </Text>
                      <Text style={styles.detailBoxLabel}>Permitted Disposal Option:</Text>
                      <Text style={styles.detailBoxValue}>
                        {selectedData.permitted_disposal_option}
                      </Text>
                    </View>
                    <View style={styles.detailBox}>
                      <Text style={styles.detailBoxLabel}>Name of Hazardous Waste:</Text>
                      <Text style={styles.detailBoxValue}>
                        {selectedData.waste_name}
                      </Text>
                      <Text style={styles.detailBoxLabel}>Quantity Ready For Disposal:</Text>
                      <Text style={styles.detailBoxValue}>
                        {selectedData.quantity_ready_for_disposal}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Receivers Table */}
                <View style={styles.receiversSection}>
                  <View style={styles.sectionHeader}>
                    <Icon name="people-outline" size={20} color="#2e7d32" />
                    <Text style={styles.sectionTitle}>INTERESTED RECEIVERS LIST</Text>
                  </View>

                  <View style={styles.tableContainer}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View>
                        <View style={styles.tableHeader}>
                          <Text style={[styles.tableCell, { width: 50 }]}>S.No</Text>
                          <Text style={[styles.tableCell, { width: 150 }]}>Industry Name</Text>
                          <Text style={[styles.tableCell, { width: 120 }]}>District</Text>
                          <Text style={[styles.tableCell, { width: 150 }]}>Contact Info</Text>
                          <Text style={[styles.tableCell, { width: 100 }]}>Interested Qty</Text>
                          <Text style={[styles.tableCell, { width: 120 }]}>Remarks</Text>
                          <Text style={[styles.tableCell, { width: 100 }]}>Action</Text>
                        </View>

                        {receiversList.length > 0 ? (
                          receiversList.map((item, index) => (
                            <View key={index} style={styles.tableRow}>
                              <Text style={[styles.tableCell, { width: 50, textAlign: "center" }]}>
                                {index + 1}
                              </Text>
                              <Text style={[styles.tableCell, { width: 150 }]} numberOfLines={1}>
                                {item.industry_name}
                              </Text>
                              <Text style={[styles.tableCell, { width: 120 }]} numberOfLines={1}>
                                {item.district_name}
                              </Text>
                              <Text style={[styles.tableCell, { width: 150 }]} numberOfLines={1}>
                                {item.industry_address}
                              </Text>
                              <Text style={[styles.tableCell, { width: 100, textAlign: "right" }]}>
                                {item.interest_qty}
                              </Text>
                              <Text style={[styles.tableCell, { width: 120 }]} numberOfLines={1}>
                                {item.remarks || "-"}
                              </Text>
                              <View style={[styles.tableCell, { width: 100 }]}>
                                <TouchableOpacity
                                  style={styles.approveButton}
                                  onPress={() => handleApprove(item.waste_disposal_interest_id)}
                                  disabled={loading}
                                >
                                  {loading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                  ) : (
                                    <Text style={styles.approveButtonText}>Approve</Text>
                                  )}
                                </TouchableOpacity>
                              </View>
                            </View>
                          ))
                        ) : (
                          <View style={styles.noDataContainer}>
                            <Text style={styles.noDataText}>No Receivers Found</Text>
                          </View>
                        )}
                      </View>
                    </ScrollView>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  };

  const renderWasteList = () => {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="list" size={24} color="#1e3a5f" />
            <Text style={styles.cardTitle}>Interested Waste List</Text>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.panel}>
              <View style={styles.panelHeader}>
                <Text style={styles.panelHeaderText}>{CONTEXT_HEADING}</Text>
              </View>
              <View style={styles.panelBody}>
                <FormikProvider value={formik}>
                  <View>
                    <View style={styles.row}>
                      <View style={styles.col12}>
                        <Text style={styles.label}>
                          Waste Type <Text style={styles.star}>*</Text>
                        </Text>
                        <View style={styles.row}>
                          <View style={styles.col10}>
                            <CustomDropdown
                              options={wasteTypes}
                              selectedValue={formik.values.wasteType}
                              onSelect={(value) => {
                                formik.setFieldValue("wasteType", value);
                              }}
                              placeholder="Select Waste Type"
                            />
                          </View>
                          <View style={styles.col2}>
                            <TouchableOpacity
                              style={styles.goButton}
                              onPress={() => {
                                if (formik.values.wasteType) {
                                  handleWasteTypeChange(formik.values.wasteType);
                                } else {
                                  Alert.alert("Error", "Please select Waste Type");
                                }
                              }}
                              disabled={loading}
                            >
                              <Text style={styles.goButtonText}>GO</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>

                    {loading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#2e7d32" />
                        <Text style={styles.loadingText}>Loading...</Text>
                      </View>
                    ) : wasteData.length > 0 && res === "datafound" ? (
                      <View style={styles.tableContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          <View>
                            <View style={styles.tableHeader}>
                              <Text style={[styles.tableCell, { width: 50 }]}>S.No</Text>
                              <Text style={[styles.tableCell, { width: 150 }]}>Name of Waste</Text>
                              <Text style={[styles.tableCell, { width: 120 }]}>Available Qty</Text>
                              <Text style={[styles.tableCell, { width: 120 }]}>Date</Text>
                              <Text style={[styles.tableCell, { width: 100 }]}>Interested</Text>
                              <Text style={[styles.tableCell, { width: 100 }]}>Action</Text>
                            </View>

                            {wasteData.map((ww, i) => (
                              <View key={i} style={styles.tableRow}>
                                <Text style={[styles.tableCell, { width: 50, textAlign: "center" }]}>
                                  {i + 1}
                                </Text>
                                <Text style={[styles.tableCell, { width: 150 }]} numberOfLines={1}>
                                  {ww.process_name || ww.waste_type_name}
                                </Text>
                                <Text style={[styles.tableCell, { width: 120, textAlign: "right" }]}>
                                  {ww.current_available_qty}
                                </Text>
                                <Text style={[styles.tableCell, { width: 120 }]} numberOfLines={1}>
                                  {ww.interest_submitted_date}
                                </Text>
                                <TouchableOpacity
                                  style={[styles.tableCell, { width: 100 }]}
                                  onPress={() => handleView(ww)}
                                >
                                  <Text style={styles.interestedCount}>
                                    {ww.no_of_interest_receivers || 0}
                                  </Text>
                                </TouchableOpacity>
                                <View style={[styles.tableCell, { width: 100 }]}>
                                  <TouchableOpacity
                                    style={styles.viewButton}
                                    onPress={() => handleView(ww)}
                                  >
                                    <Icon name="eye-outline" size={16} color="#fff" />
                                    <Text style={styles.viewButtonText}>View</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            ))}
                          </View>
                        </ScrollView>
                      </View>
                    ) : res === "nodata" ? (
                      <View style={styles.noDataContainer}>
                        <Icon name="warning-outline" size={40} color="#856404" />
                        <Text style={styles.noDataText}>No Data Found</Text>
                      </View>
                    ) : null}
                  </View>
                </FormikProvider>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  };

  if (showReceivers && selectedData) {
    return renderReceiversList();
  }

  return renderWasteList();
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
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  col12: {
    width: "100%",
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  col10: {
    width: "83.33%",
    paddingHorizontal: 4,
  },
  col2: {
    width: "16.67%",
    paddingHorizontal: 4,
    marginTop: -24,
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
  errorText: {
    color: "#dc3545",
    fontSize: 12,
    marginTop: 4,
  },
  goButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 26,
  },
  goButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
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
  interestedCount: {
    color: "#2e7d32",
    fontWeight: "600",
    textAlign: "center",
    textDecorationLine: "underline",
  },
  approveButton: {
    backgroundColor: "#28a745",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: "center",
    minWidth: 60,
  },
  approveButtonText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "500",
  },
  // Detail View Styles
  detailCard: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
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
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  detailBox: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 8,
    width: "33.33%",
    paddingHorizontal: 6,
  },
  detailBoxLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  detailBoxValue: {
    fontSize: 12,
    color: "#555",
    marginBottom: 8,
  },
  receiversSection: {
    marginTop: 12,
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
    fontSize: 14,
    fontWeight: "600",
    color: "#2e7d32",
    marginLeft: 8,
  },
  // Dropdown Styles
  dropdownContainer: {
    marginBottom: 8,
    zIndex: 1,
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    minHeight: 44,
  },
  dropdownDisabled: {
    backgroundColor: "#f0f0f0",
  },
  dropdownError: {
    borderColor: "#dc3545",
  },
  dropdownButtonText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  placeholderText: {
    color: "#999",
  },
  dropdownModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownModalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    width: "90%",
    maxHeight: "70%",
    minHeight: 200,
  },
  dropdownModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
  },
  dropdownModalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e3a5f",
    flex: 1,
  },
  dropdownListWrapper: {
    flex: 1,
    minHeight: 100,
    maxHeight: 300,
  },
  dropdownFlatList: {
    flex: 1,
  },
  dropdownListContent: {
    paddingVertical: 4,
  },
  dropdownOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
    minHeight: 44,
  },
  dropdownOptionSelected: {
    backgroundColor: "#e8f5e9",
  },
  dropdownOptionText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    marginRight: 8,
  },
  dropdownOptionTextSelected: {
    color: "#2e7d32",
    fontWeight: "600",
  },
});

export default InterestedWasteList;