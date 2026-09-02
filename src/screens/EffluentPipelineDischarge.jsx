// screens/EffluentPipelineDischarge.js
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
  Modal,
  Dimensions,
  KeyboardAvoidingView,
  FlatList,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useDispatch, useSelector } from "react-redux";
import { useFormik, FormikProvider } from "formik";
import * as Yup from "yup";
import Icon from "react-native-vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  commonAPICall,
  CONTEXT_HEADING,
  EFFPIPELINEDISCHARGEDETAILS,
  EFFPIPELINEDISCHARGEDETAILSREC,
  FLOWMETERREADINGPOST,
} from "../utils/utils";
import moment from "moment";
import ImageBucketRN from "../utils/ImageBucketRN";

const { width, height } = Dimensions.get("window");

// Format status helper
const formatStatus = (value) => {
  if (!value) return "-";
  return value.toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
};

// Status badge component
const StatusBadge = ({ status, paymentStatus }) => {
  const getStatusConfig = () => {
    if (paymentStatus) {
      const statusMap = {
        PENDING: {
          backgroundColor: "#fff3cd",
          color: "#856404",
          icon: "time-outline",
        },
        SUCCESS: {
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
    }
    return {
      backgroundColor: "#e9ecef",
      color: "#6c757d",
      icon: "information-circle-outline",
    };
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
        {paymentStatus ? formatStatus(status) : formatStatus(status)}
      </Text>
    </View>
  );
};

function EffluentPipelineDischarge() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const state = useSelector((state) => state.LoginReducer);
  const { roleId } = state;

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [startReadingAdded, setStartReadingAdded] = useState(false);
  const [endReadingAdded, setEndReadingAdded] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [editFlag, setEditFlag] = useState(false);
  const [startEditFlag, setStartEditFlag] = useState(false);
  const [disableEndReading, setDisableEndReading] = useState(false);
  const [detailedDataFlag, setDetailedDataFlag] = useState(false);
  const [detailedData, setDetailedData] = useState(null);
  const [paymentFlag, setPaymentFlag] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [accept, setAccept] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [rejectError, setRejectError] = useState("");
  const [showPaymentModalView, setShowPaymentModalView] = useState(false);

  // Get route params
  const queryParams = route.params || {};
  const detailId = queryParams.id;

  // Check if we should show detailed view
  useEffect(() => {
    if (detailId === "1" && queryParams.details) {
      setDetailedData(queryParams.details);
      setDetailedDataFlag(true);
    } else if (detailId === "2" && queryParams.data) {
      setPaymentData(queryParams.data);
      setPaymentFlag(true);
    } else if (detailId === "3") {
      // Show RecManifestConfirmation
    } else {
      setDetailedDataFlag(false);
      setDetailedData(null);
      setPaymentFlag(false);
    }
  }, [detailId, queryParams]);

  // Flow meter format options
  const flowMeterFormat = [
    { value: "", label: "Select Format" },
    { value: "1.2", label: "1.2" },
    { value: "2.2", label: "2.2" },
    { value: "3.2", label: "3.2" },
    { value: "4.2", label: "4.2" },
    { value: "5.2", label: "5.2" },
  ];

  // Start Reading Validation Schema
  const startValidationSchema = Yup.object({
    typeOfWaste: Yup.string(),
    flowMeterFormat: Yup.string().required("required"),
    startReading: Yup.string()
      .required("required")
      .when("flowMeterFormat", (flowMeterFormat, schema) => {
        const format = Array.isArray(flowMeterFormat)
          ? flowMeterFormat[0]
          : flowMeterFormat;
        if (!format) return schema;
        const [beforeDecimal, afterDecimal] = String(format)
          .split(".")
          .map(Number);
        const regex = new RegExp(
          `^\\d{${beforeDecimal}}\\.\\d{${afterDecimal}}$`
        );
        return schema.matches(
          regex,
          `Format must be ${"0".repeat(beforeDecimal)}.${"0".repeat(afterDecimal)}`
        );
      }),
    startReadingRemarks: Yup.string().max(
      500,
      "Remarks cannot exceed 500 characters"
    ),
    ph: Yup.string()
      .required("required")
      .matches(/^([0-9]|1[0-4])(\.\d{1,2})?$/, "PH must be between 0 and 14"),
    tds: Yup.string()
      .required("required")
      .matches(/^\d+(\.\d{1,2})?$/, "TDS must be a valid number")
      .test("tds-validation", function (value) {
        const { wasteType } = this.parent;
        if (!value) return true;
        const num = Number(value);
        if (wasteType === "HTDS" && num <= 12000) {
          return this.createError({
            message: "For HTDS, TDS must be above 12000 mg/L",
          });
        }
        if (wasteType === "LTDS" && num > 12000) {
          return this.createError({
            message: "For LTDS, TDS must be 12000 mg/L or below",
          });
        }
        return true;
      }),
    nh3: Yup.string()
      .required("required")
      .matches(/^\d+(\.\d{1,2})?$/, "NH3 must be a valid number")
      .test("nh3-validation", function (value) {
        const { wasteType } = this.parent;
        if (!value) return true;
        const num = Number(value);
        if (wasteType === "HTDS" && num <= 30) {
          return this.createError({
            message: "For HTDS, NH3 must be above 30 mg/L",
          });
        }
        if (wasteType === "LTDS" && num > 30) {
          return this.createError({
            message: "For LTDS, NH3 must be 30 mg/L or below",
          });
        }
        return true;
      }),
    cod: Yup.string()
      .required("required")
      .matches(/^\d+(\.\d{1,2})?$/, "COD must be a valid number")
      .test("cod-validation", function (value) {
        const { wasteType } = this.parent;
        if (!value) return true;
        const num = Number(value);
        if (wasteType === "HTDS" && num <= 8000) {
          return this.createError({
            message: "For HTDS, COD must be above 8000 mg/L",
          });
        }
        if (wasteType === "LTDS" && num > 8000) {
          return this.createError({
            message: "For LTDS, COD must be 8000 mg/L or below",
          });
        }
        return true;
      }),
    startReadingImage: startEditFlag
      ? Yup.mixed().nullable().required("required")
      : Yup.mixed().nullable(),
  });

  // End Reading Validation Schema
  const endValidationSchema = Yup.object({
    endReadingFlowMeterFormat: Yup.string().required("required"),
    endReading: Yup.string()
      .required("required")
      .when(
        "endReadingFlowMeterFormat",
        (endReadingFlowMeterFormat, schema) => {
          const format = Array.isArray(endReadingFlowMeterFormat)
            ? endReadingFlowMeterFormat[0]
            : endReadingFlowMeterFormat;
          let updatedSchema = schema;
          if (format) {
            const [beforeDecimal, afterDecimal] = String(format)
              .split(".")
              .map(Number);
            const regex = new RegExp(
              `^\\d{${beforeDecimal}}\\.\\d{${afterDecimal}}$`
            );
            updatedSchema = updatedSchema.matches(
              regex,
              `Format must be ${"0".repeat(beforeDecimal)}.${"0".repeat(afterDecimal)}`
            );
          }
          updatedSchema = updatedSchema.test(
            "is-greater-than-start",
            "End Reading must be greater than Start Reading",
            function (value) {
              const startReading = Number(selectedRow?.start_reading || 0);
              if (!value) return true;
              return Number(value) > startReading;
            }
          );
          return updatedSchema;
        }
      ),
  });

  // Interest Formik
  const formik = useFormik({
    initialValues: {
      interestQty: "",
      remarks: "",
      receiverPh: "",
      receiverTds: "",
      receiverNh3: "",
      receiverCod: "",
      rejectRemarks: "",
    },
    validationSchema: Yup.object({
      interestQty: Yup.number()
        .required("required")
        .positive("Quantity must be positive")
        .max(
          detailedData?.quantity_ready_for_disposal || 0,
          `Quantity cannot exceed ${detailedData?.quantity_ready_for_disposal || 0} Tonnes`
        ),
      receiverPh: Yup.number()
        .typeError("TDS must be a number")
        .required("required"),
      receiverTds: Yup.number()
        .typeError("TDS must be a number")
        .required("required")
        .test("tds-limit", function (value) {
          const isHtds = detailedData?.effluent_type === "HTDS";
          if (value === undefined || value === null) return true;
          if (isHtds) {
            if (value < 12000) {
              return this.createError({
                message: "HTDS TDS should be above 12000 mg/L",
              });
            }
          } else {
            if (value > 12000) {
              return this.createError({
                message: "LTDS TDS should not exceed 12000 mg/L",
              });
            }
          }
          return true;
        }),
      receiverNh3: Yup.number()
        .typeError("NH3 must be a number")
        .required("required")
        .test("nh3-limit", function (value) {
          const isHtds = detailedData?.effluent_type === "HTDS";
          if (value === undefined || value === null) return true;
          if (isHtds) {
            if (value < 30) {
              return this.createError({
                message: "HTDS NH3 should be above 30 mg/L",
              });
            }
          } else {
            if (value > 30) {
              return this.createError({
                message: "LTDS NH3 should not exceed 30 mg/L",
              });
            }
          }
          return true;
        }),
      receiverCod: Yup.number()
        .typeError("COD must be a number")
        .required("required")
        .test("cod-limit", function (value) {
          const isHtds = detailedData?.effluent_type === "HTDS";
          if (value === undefined || value === null) return true;
          if (isHtds) {
            if (value < 8000) {
              return this.createError({
                message: "HTDS COD should be above 8000 mg/L",
              });
            }
          } else {
            if (value > 8000) {
              return this.createError({
                message: "LTDS COD should not exceed 8000 mg/L",
              });
            }
          }
          return true;
        }),
    }),
    onSubmit: (values) => {
      setShowInterestModal(false);
      formik.resetForm();
    },
  });

  // Start Reading Formik
  const startFormik = useFormik({
    initialValues: {
      effluentDisposalItemId: "",
      actionType: "",
      flowMeterFormat: "2.2",
      startReading: "00.00",
      startReadingRemarks: "",
      startReadingImage: null,
    },
    validationSchema: startValidationSchema,
    onSubmit: (values) => {
      const payload = {
        effluentDisposalItemId: values.effluentDisposalItemId,
        actionType: "ACCEPT",
        flowMeterFormat: values.flowMeterFormat,
        startReading: values.startReading,
        startReadingRemarks: values.startReadingRemarks,
        startReadingImage: values.startReadingImage,
      };
      StartReadingSubmit(payload);
      setStartReadingAdded(true);
      setShowStartModal(false);
    },
  });

  // End Reading Formik
  const endFormik = useFormik({
    initialValues: {
      effluentDisposalItemId: "",
      endReadingFlowMeterFormat: "",
      endReading: "",
      endReadingImage: null,
      endReadingRemarks: "",
    },
    validationSchema: endValidationSchema,
    onSubmit: (values) => {
      const payload = {
        effluentDisposalItemId: values.effluentDisposalItemId,
        actionType: "ACCEPT",
        endReading: values.endReading,
        endReadingFlowMeterFormat: values.endReadingFlowMeterFormat,
        endReadingRemarks: values.endReadingRemarks,
        endReadingImage: values.endReadingImage,
      };
      StartReadingSubmit(payload);
      setShowEndModal(false);
    },
  });

  // Start Reading Submit
  async function StartReadingSubmit(payload) {
    try {
      setLoading(true);
      let finalPayload = { ...payload };
      const res = await commonAPICall(
        FLOWMETERREADINGPOST,
        finalPayload,
        "POST",
        dispatch
      );
      if (res.status === 200) {
        Alert.alert("Success", "Reading submitted successfully");
        GetData();
        startFormik.resetForm();
        endFormik.resetForm();
        setShowStartModal(false);
        setShowEndModal(false);
      }
    } catch (error) {
      console.error("Submit error:", error);
      Alert.alert("Error", "Failed to submit reading");
    } finally {
      setLoading(false);
    }
  }

  // Submit Action (Accept/Reject)
  const submitAction = async () => {
    const payload = {
      effluentDisposalItemId: selectedItem?.effluent_disposal_item_id || 0,
      actionType: accept ? "ACCEPT" : "REJECT",
      companyName: selectedItem?.industry_name || "",
      category: selectedItem?.category_name || "",
      districtState: `${selectedItem?.dist_name || ""}, ${selectedItem?.state_name || ""}`,
      activity: selectedItem?.activity || "",
      industryAddress: selectedItem?.industry_location_address || "",
      correspondenceAddress: selectedItem?.correspondence_address || "",
      pincode: selectedItem?.pin_code || "",
      authorizedPerson: selectedItem?.authorized_person || "",
      authorizedMobileNumber: selectedItem?.authorized_person_mobile || "",
      authorizedEmailId: selectedItem?.authorized_person_email || "",
      wasteDetails: selectedItem?.type_of_waste || "",
      quantityForDisposal: selectedItem?.disposal_quantity || "",
      generatorPh: selectedItem?.ph || "0",
      generatorTds: selectedItem?.tds_mg_l || "0",
      generatorNh3: selectedItem?.nh3_mg_l || "0",
      generatorCod: selectedItem?.cod_mg_l || "0",
      rejectRemarks: !accept ? formik.values.rejectRemarks || "" : "",
      receiverPh: accept ? formik.values.receiverPh || "0" : "0",
      receiverTds: accept ? formik.values.receiverTds || "0" : "0",
      receiverNh3: accept ? formik.values.receiverNh3 || "0" : "0",
      receiverCod: accept ? formik.values.receiverCod || "0" : "0",
    };

    StartReadingSubmit(payload);
  };

  // Get Data
  async function GetData() {
    try {
      setLoading(true);
      let res;
      if (roleId === 2) {
        res = await commonAPICall(
          EFFPIPELINEDISCHARGEDETAILS,
          {},
          "GET",
          dispatch
        );
      } else {
        res = await commonAPICall(
          EFFPIPELINEDISCHARGEDETAILSREC,
          {},
          "GET",
          dispatch
        );
      }
      if (res.status === 200) {
        const dataList =
          roleId === 2
            ? res.data.EffluentPipelineDischarge_Details || []
            : res.data.EffluentWasteGenerator_Details || [];
        setData(dataList);
        setFilteredData(dataList);
      } else {
        setData([]);
        setFilteredData([]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  }

  // Search handler
  const handleSearch = useCallback(
    (text) => {
      setSearchTerm(text);
      if (text.trim() === "") {
        setFilteredData(data);
      } else {
        const filtered = data.filter((item) =>
          Object.values(item).some(
            (value) =>
              value &&
              value.toString().toLowerCase().includes(text.toLowerCase())
          )
        );
        setFilteredData(filtered);
      }
    },
    [data]
  );

  // Refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await GetData();
    setRefreshing(false);
  };

  // Handle view details
  const handleViewDetails = (item) => {
    navigation.navigate("EffluentPipelineDischarge", {
      id: "1",
      details: item,
    });
  };

  // Handle payment redirect
  const handlePaymentRedirect = (item) => {
    navigation.navigate("EffluentPipelineDischarge", {
      id: "2",
      data: item,
    });
  };

  // Handle manifest redirect
  const handleManifestRedirect = (item) => {
    navigation.navigate("EffluentPipelineDischarge", { id: "3" });
  };

  // Handle accept modal
  const handleAcceptModal = (rowData) => {
    setSelectedItem(rowData);
    setAccept(true);
    formik.setFieldValue("receiverPh", rowData?.ph || "");
    formik.setFieldValue("receiverTds", rowData?.tds_mg_l || "");
    formik.setFieldValue("receiverNh3", rowData?.nh3_mg_l || "");
    formik.setFieldValue("receiverCod", rowData?.cod_mg_l || "");
    setShowInterestModal(true);
  };

  // Handle reject modal
  const handleRejectModal = () => {
    setAccept(false);
    setShowInterestModal(true);
  };

  // Calculate total volume
  const calculateTotalVolume = () => {
    const start = Number(selectedRow?.start_reading);
    const end = Number(endFormik.values.endReading);
    if (isNaN(start) || isNaN(end)) return "";
    return (end - start).toFixed(2);
  };

  // Handle close interest modal
  const handleCloseInterestModal = () => {
    setShowInterestModal(false);
    formik.resetForm();
    setRejectError("");
  };

  // Handle close payment modal
  const handleClosePaymentModal = () => {
    setShowPaymentModalView(false);
  };

  useEffect(() => {
    GetData();
  }, []);

  // If in detailed view
  if (detailedDataFlag && detailedData) {
    return renderDetailedView();
  }

  // If in payment view
  if (paymentFlag && paymentData) {
    return renderPaymentView();
  }

  // If in manifest confirmation
  if (detailId === "3") {
    return <RecManifestConfirmation />;
  }

  // Main list view
  return renderMainList();

  // Render Detailed View
  function renderDetailedView() {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} nestedScrollEnabled={true}>
          <View style={styles.cardContainer}>
            <View style={styles.cardHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setDetailedDataFlag(false);
                  setDetailedData(null);
                  navigation.setParams({ id: undefined, details: undefined });
                }}
              >
                <Icon name="arrow-back" size={24} color="#1e3a5f" />
              </TouchableOpacity>
              <Icon name="list" size={24} color="#1e3a5f" />
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
                      <Icon name="business-outline" size={18} color="#2e7d32" />
                      <Text style={styles.sectionTitle}>Generator Details</Text>
                    </View>
                    <View style={styles.detailCard}>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Company Name:</Text>{" "}
                        {detailedData.industry_name}
                      </Text>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>District - State:</Text>{" "}
                        {detailedData.dist_name} - {detailedData.state_name}
                      </Text>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Industry Address:</Text>{" "}
                        {detailedData.industry_location_address}
                      </Text>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Pincode:</Text>{" "}
                        {detailedData.pin_code}
                      </Text>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Authorized Person:</Text>{" "}
                        {detailedData.authorized_person}
                      </Text>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Authorized Email:</Text>{" "}
                        {detailedData.authorized_person_email}
                      </Text>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Category:</Text>{" "}
                        {detailedData.category_name}
                      </Text>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Activity:</Text>{" "}
                        {detailedData.activity}
                      </Text>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Correspondence Address:</Text>{" "}
                        {detailedData.correspondence_address}
                      </Text>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Authorized Mobile:</Text>{" "}
                        {detailedData.authorized_person_mobile}
                      </Text>
                    </View>
                  </View>

                  {/* Waste Details */}
                  <View style={styles.detailSection}>
                    <View style={styles.sectionHeader}>
                      <Icon name="trash-outline" size={18} color="#2e7d32" />
                      <Text style={styles.sectionTitle}>
                        {detailedData.type_of_waste} - Waste Details
                      </Text>
                    </View>
                    <View style={styles.detailCard}>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Waste Details:</Text>{" "}
                        {detailedData?.effluent_type}
                      </Text>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>PH:</Text>{" "}
                        {detailedData.ph}
                      </Text>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Quantity for Disposal:</Text>{" "}
                        {detailedData.disposal_quantity}
                      </Text>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>TDS(mg/L):</Text>{" "}
                        {detailedData.tds_mg_l}
                      </Text>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>NH3(mg/L):</Text>{" "}
                        {detailedData.nh3_mg_l}
                      </Text>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>COD(mg/L):</Text>{" "}
                        {detailedData.cod_mg_l}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={handleRejectModal}
                    >
                      <Text style={styles.actionButtonText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.acceptButton]}
                      onPress={() => handleAcceptModal(detailedData)}
                    >
                      <Text style={styles.actionButtonText}>Accept</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Interest Modal */}
          {renderInterestModal()}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Render Payment View
  function renderPaymentView() {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} nestedScrollEnabled={true}>
          <View style={styles.cardContainer}>
            <View style={styles.cardHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setPaymentFlag(false);
                  setPaymentData(null);
                  navigation.setParams({ id: undefined, data: undefined });
                }}
              >
                <Icon name="arrow-back" size={24} color="#1e3a5f" />
              </TouchableOpacity>
              <Icon name="list" size={24} color="#1e3a5f" />
              <Text style={styles.cardTitle}>Effluent Discharge List</Text>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.panel}>
                <View style={styles.panelHeader}>
                  <Text style={styles.panelHeaderText}>{CONTEXT_HEADING}</Text>
                </View>
                <View style={styles.panelBody}>
                  {/* Effluent Waste Details */}
                  <View style={styles.detailSection}>
                    <View style={styles.sectionHeader}>
                      <Icon name="business-outline" size={18} color="#2e7d32" />
                      <Text style={styles.sectionTitle}>Effluent Waste Details</Text>
                    </View>
                    <View style={styles.detailCard}>
                      <View style={styles.row}>
                        <View style={styles.col4}>
                          <Text style={styles.detailText}>
                            <Text style={styles.detailLabel}>Waste Details:</Text>{" "}
                            {paymentData?.effluent_type}
                          </Text>
                          <Text style={styles.detailText}>
                            <Text style={styles.detailLabel}>PH:</Text>{" "}
                            {paymentData.generator_ph}
                          </Text>
                          <Text style={styles.detailText}>
                            <Text style={styles.detailLabel}>Receiver PH:</Text>{" "}
                            {paymentData.receiver_ph}
                          </Text>
                        </View>
                        <View style={styles.col4}>
                          <Text style={styles.detailText}>
                            <Text style={styles.detailLabel}>Quantity for Disposal:</Text>{" "}
                            {paymentData?.disposal_quantity}
                          </Text>
                          <Text style={styles.detailText}>
                            <Text style={styles.detailLabel}>TDS (mg/L):</Text>{" "}
                            {paymentData.generator_tds}
                          </Text>
                          <Text style={styles.detailText}>
                            <Text style={styles.detailLabel}>Receiver TDS:</Text>{" "}
                            {paymentData.receiver_tds}
                          </Text>
                        </View>
                        <View style={styles.col4}>
                          <Text style={styles.detailText}>
                            <Text style={styles.detailLabel}>NH3 (mg/L):</Text>{" "}
                            {paymentData.generator_nh3}
                          </Text>
                          <Text style={styles.detailText}>
                            <Text style={styles.detailLabel}>Receiver NH3:</Text>{" "}
                            {paymentData.receiver_nh3}
                          </Text>
                          <Text style={styles.detailText}>
                            <Text style={styles.detailLabel}>COD (mg/L):</Text>{" "}
                            {paymentData.generator_cod}
                          </Text>
                          <Text style={styles.detailText}>
                            <Text style={styles.detailLabel}>Receiver COD:</Text>{" "}
                            {paymentData.receiver_cod}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Effluent Discharge List */}
                  <View style={styles.detailSection}>
                    <View style={styles.sectionHeader}>
                      <Icon name="list" size={18} color="#2e7d32" />
                      <Text style={styles.sectionTitle}>Effluent Discharge List</Text>
                    </View>
                    <View style={styles.detailCard}>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Date of Discharge:</Text>{" "}
                        {paymentData.disposal_date || "-"}
                      </Text>
                      <View style={styles.row}>
                        <View style={styles.col4}>
                          <Text style={styles.detailText}>
                            <Text style={styles.detailLabel}>PH:</Text>{" "}
                            {paymentData.receiver_ph || "-"}
                          </Text>
                          <Text style={styles.detailText}>
                            <Text style={styles.detailLabel}>COD:</Text>{" "}
                            {paymentData.receiver_cod || "-"}
                          </Text>
                          <Text style={styles.detailText}>
                            <Text style={styles.detailLabel}>TDS:</Text>{" "}
                            {paymentData.receiver_tds || "-"}
                          </Text>
                          <Text style={styles.detailText}>
                            <Text style={styles.detailLabel}>NH3:</Text>{" "}
                            {paymentData.receiver_nh3 || "-"}
                          </Text>
                        </View>
                        <View style={styles.col4}>
                          <Text style={styles.detailText}>
                            <Text style={styles.detailLabel}>Start Reading:</Text>{" "}
                            {paymentData.start_reading || "-"}
                          </Text>
                          <Text style={styles.detailText}>
                            <Text style={styles.detailLabel}>Start Reading IP:</Text>{" "}
                            {paymentData.start_reading_ip_address || "-"}
                          </Text>
                        </View>
                        <View style={styles.col4}>
                          <Text style={styles.detailText}>
                            <Text style={styles.detailLabel}>End Reading:</Text>{" "}
                            {paymentData.end_reading || "-"}
                          </Text>
                          <Text style={styles.detailText}>
                            <Text style={styles.detailLabel}>End Reading IP:</Text>{" "}
                            {paymentData.end_reading_ip_address || "-"}
                          </Text>
                          <Text style={styles.detailText}>
                            <Text style={styles.detailLabel}>Total Volume:</Text>{" "}
                            {paymentData.total_volume || "-"}
                          </Text>
                          <Text style={styles.detailText}>
                            <Text style={styles.detailLabel}>Payment Status:</Text>{" "}
                            <StatusBadge
                              status={paymentData?.payment_status}
                              paymentStatus={true}
                            />
                          </Text>
                          <Text style={styles.detailText}>
                            <Text style={styles.detailLabel}>Effluent Type:</Text>{" "}
                            {paymentData?.effluent_type || "-"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Payment Confirmation */}
                  <View style={styles.detailSection}>
                    <View style={styles.sectionHeader}>
                      <Icon name="card-outline" size={18} color="#2e7d32" />
                      <Text style={styles.sectionTitle}>Payment Confirmation</Text>
                    </View>
                    <View style={styles.detailCard}>
                      <Text style={styles.paymentPlaceholder}>
                        Payment details would be rendered here
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Render Interest Modal - Mobile Optimized
  function renderInterestModal() {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showInterestModal}
        onRequestClose={handleCloseInterestModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{CONTEXT_HEADING}</Text>
                <TouchableOpacity onPress={handleCloseInterestModal}>
                  <Icon name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.modalBody}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <FormikProvider value={formik}>
                  <View>
                    {/* Reject Fields */}
                    {!accept && (
                      <View style={styles.formGroup}>
                        <Text style={styles.label}>Remarks</Text>
                        <TextInput
                          style={[styles.input, styles.textArea]}
                          value={formik.values.rejectRemarks}
                          onChangeText={formik.handleChange("rejectRemarks")}
                          onBlur={formik.handleBlur("rejectRemarks")}
                          placeholder="Enter rejection reason"
                          placeholderTextColor="#999"
                          multiline={true}
                          numberOfLines={3}
                          textAlignVertical="top"
                        />
                        {rejectError && (
                          <Text style={styles.errorText}>{rejectError}</Text>
                        )}
                      </View>
                    )}

                    {/* Accept Fields */}
                    {accept && (
                      <>
                        <Text style={styles.sectionSubtitle}>Parameters Values</Text>
                        <View style={styles.row}>
                          <View style={styles.col6}>
                            <Text style={styles.label}>
                              PH <Text style={styles.star}>*</Text>
                            </Text>
                            <TextInput
                              style={styles.input}
                              value={formik.values.receiverPh}
                              onChangeText={formik.handleChange("receiverPh")}
                              onBlur={formik.handleBlur("receiverPh")}
                              keyboardType="numeric"
                              placeholder="Enter PH value"
                              placeholderTextColor="#999"
                            />
                            {formik.errors.receiverPh && formik.touched.receiverPh && (
                              <Text style={styles.errorText}>
                                {formik.errors.receiverPh}
                              </Text>
                            )}
                          </View>
                          <View style={styles.col6}>
                            <Text style={styles.label}>
                              TDS(mg/L) <Text style={styles.star}>*</Text>
                            </Text>
                            <TextInput
                              style={styles.input}
                              value={formik.values.receiverTds}
                              onChangeText={formik.handleChange("receiverTds")}
                              onBlur={formik.handleBlur("receiverTds")}
                              keyboardType="numeric"
                              placeholder="Enter TDS value"
                              placeholderTextColor="#999"
                            />
                            {formik.errors.receiverTds && formik.touched.receiverTds && (
                              <Text style={styles.errorText}>
                                {formik.errors.receiverTds}
                              </Text>
                            )}
                          </View>
                        </View>

                        <View style={styles.row}>
                          <View style={styles.col6}>
                            <Text style={styles.label}>
                              NH3(mg/L) <Text style={styles.star}>*</Text>
                            </Text>
                            <TextInput
                              style={styles.input}
                              value={formik.values.receiverNh3}
                              onChangeText={formik.handleChange("receiverNh3")}
                              onBlur={formik.handleBlur("receiverNh3")}
                              keyboardType="numeric"
                              placeholder="Enter NH3 value"
                              placeholderTextColor="#999"
                            />
                            {formik.errors.receiverNh3 && formik.touched.receiverNh3 && (
                              <Text style={styles.errorText}>
                                {formik.errors.receiverNh3}
                              </Text>
                            )}
                          </View>
                          <View style={styles.col6}>
                            <Text style={styles.label}>
                              COD(mg/L) <Text style={styles.star}>*</Text>
                            </Text>
                            <TextInput
                              style={styles.input}
                              value={formik.values.receiverCod}
                              onChangeText={formik.handleChange("receiverCod")}
                              onBlur={formik.handleBlur("receiverCod")}
                              keyboardType="numeric"
                              placeholder="Enter COD value"
                              placeholderTextColor="#999"
                            />
                            {formik.errors.receiverCod && formik.touched.receiverCod && (
                              <Text style={styles.errorText}>
                                {formik.errors.receiverCod}
                              </Text>
                            )}
                          </View>
                        </View>
                      </>
                    )}

                    <View style={styles.modalFooter}>
                      <TouchableOpacity
                        style={[styles.footerButton, styles.cancelButton]}
                        onPress={handleCloseInterestModal}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.footerButton,
                          accept ? styles.acceptButton : styles.rejectButton,
                        ]}
                        onPress={async () => {
                          if (accept) {
                            formik.setTouched({
                              receiverPh: true,
                              receiverTds: true,
                              receiverNh3: true,
                              receiverCod: true,
                            });
                            const errors = await formik.validateForm();
                            if (
                              errors.receiverPh ||
                              errors.receiverTds ||
                              errors.receiverNh3 ||
                              errors.receiverCod
                            ) {
                              return;
                            }
                          }
                          submitAction();
                        }}
                      >
                        <Text style={styles.footerButtonText}>
                          {accept ? "Accept" : "Reject"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </FormikProvider>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }

  // Render Main List - Android Card Format
  function renderMainList() {
    return (
      <SafeAreaView style={styles.container}>
        {/* Main Card Container */}
        <View style={styles.cardContainer}>
          {/* Card Header */}
          <View style={styles.cardHeader}>
            <Icon name="list" size={22} color="#1e3a5f" />
            <Text style={styles.cardTitle}>Effluent - Pipeline Discharge</Text>
          </View>

          {/* Card Body */}
          <View style={styles.cardBody}>
            {/* Panel */}
            <View style={styles.panel}>
              {/* Panel Header */}
              <View style={styles.panelHeader}>
                <Text style={styles.panelHeaderText}>{CONTEXT_HEADING}</Text>
              </View>

              {/* Panel Body */}
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
                      <TouchableOpacity onPress={() => handleSearch("")}>
                        <Icon name="close-circle" size={20} color="#999" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {loading && data.length === 0 ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#2e7d32" />
                    <Text style={styles.loadingText}>Loading...</Text>
                  </View>
                ) : filteredData.length > 0 ? (
                  <ScrollView 
                    style={styles.cardListContainer}
                    showsVerticalScrollIndicator={false}
                  >
                    {filteredData.map((item, index) => (
                      <View key={index} style={styles.itemCard}>
                        {/* Card Header with S.No and Status */}
                        <View style={styles.itemCardHeader}>
                          <View style={styles.itemCardNumber}>
                            <Text style={styles.itemCardNumberText}>{index + 1}</Text>
                          </View>
                          <StatusBadge
                            status={item?.payment_status}
                            paymentStatus={true}
                          />
                        </View>

                        {/* Card Body */}
                        <View style={styles.itemCardBody}>
                          {/* Row 1: Date & Type of Waste */}
                          <View style={styles.itemCardRow}>
                            <View style={styles.itemCardCol6}>
                              <Text style={styles.itemCardLabel}>Date</Text>
                              <Text style={styles.itemCardValue}>
                                {item?.disposal_date || "-"}
                              </Text>
                            </View>
                            <View style={styles.itemCardCol6}>
                              <Text style={styles.itemCardLabel}>Type of Waste</Text>
                              <Text style={styles.itemCardValue}>
                                {item?.type_of_waste || "-"}
                              </Text>
                            </View>
                          </View>

                          {/* Row 2: Name of Effluent & Status */}
                          <View style={styles.itemCardRow}>
                            <View style={styles.itemCardCol6}>
                              <Text style={styles.itemCardLabel}>Name of Effluent</Text>
                              <Text style={styles.itemCardValue}>
                                {item?.effluent_type === "1" ? "HTDS" : 
                                 item?.effluent_type === "2" ? "LTDS" : 
                                 item?.effluent_type || "-"}
                              </Text>
                            </View>
                            <View style={styles.itemCardCol6}>
                              <Text style={styles.itemCardLabel}>Status</Text>
                              <Text style={styles.itemCardValue}>
                                {formatStatus(item?.disposal_status) || "-"}
                              </Text>
                            </View>
                          </View>

                          {/* Row 3: Start Reading & End Reading */}
                          <View style={styles.itemCardRow}>
                            <View style={styles.itemCardCol6}>
                              <Text style={styles.itemCardLabel}>Start Reading</Text>
                              <Text style={styles.itemCardValue}>
                                {item?.start_reading || "-"}
                              </Text>
                            </View>
                            <View style={styles.itemCardCol6}>
                              <Text style={styles.itemCardLabel}>End Reading</Text>
                              <Text style={styles.itemCardValue}>
                                {item?.end_reading || "-"}
                              </Text>
                            </View>
                          </View>

                          {/* Row 4: Qty (KL) & Payment Status */}
                          <View style={styles.itemCardRow}>
                            <View style={styles.itemCardCol6}>
                              <Text style={styles.itemCardLabel}>Qty (KL)</Text>
                              <Text style={styles.itemCardValue}>
                                {item?.total_volume ? Number(item.total_volume).toFixed(2) : "-"}
                              </Text>
                            </View>
                            <View style={styles.itemCardCol6}>
                              <Text style={styles.itemCardLabel}>Payment Status</Text>
                              <StatusBadge
                                status={item?.payment_status}
                                paymentStatus={true}
                              />
                            </View>
                          </View>
                        </View>

                        {/* Card Footer - Action Button */}
                        <View style={styles.itemCardFooter}>
                          {item?.payment_status === "SUCCESS" ? (
                            <TouchableOpacity
                              style={styles.detailsButton}
                              onPress={() => handleManifestRedirect(item)}
                            >
                              <Icon name="folder-open" size={16} color="#fff" />
                              <Text style={styles.detailsButtonText}>Details</Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              style={styles.payButton}
                              onPress={() => handlePaymentRedirect(item)}
                            >
                              <Icon name="card" size={16} color="#fff" />
                              <Text style={styles.payButtonText}>Pay</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.noDataContainer}>
                    <Icon name="warning-outline" size={40} color="#856404" />
                    <Text style={styles.noDataText}>No Records Found</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Start/End Reading Modal */}
        {renderReadingModal()}
      </SafeAreaView>
    );
  }

  // Render Reading Modal (Start/End) - Mobile Optimized
  function renderReadingModal() {
    const isStartModal = showStartModal;
    const isEndModal = showEndModal;

    if (!isStartModal && !isEndModal) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={isStartModal || isEndModal}
        onRequestClose={() => {
          setShowStartModal(false);
          setShowEndModal(false);
          startFormik.resetForm();
          endFormik.resetForm();
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.readingModalContainer}
        >
          <View style={styles.readingModalOverlay}>
            <View style={styles.readingModalContent}>
              <View style={styles.readingModalHeader}>
                <Text style={styles.readingModalTitle}>APEMCL</Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowStartModal(false);
                    setShowEndModal(false);
                    startFormik.resetForm();
                    endFormik.resetForm();
                  }}
                >
                  <Icon name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.readingModalBody}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.readingCard}>
                  {/* Header */}
                  <View style={styles.readingHeader}>
                    <Text style={styles.readingSectionTitle}>Effluent Waste Details</Text>
                    <View style={styles.readingDateBox}>
                      <Icon name="calendar" size={14} color="#1e3a5f" />
                      <Text style={styles.readingDateText}>
                        {moment().format("DD-MM-YYYY")}
                      </Text>
                    </View>
                  </View>

                  {/* Details Row - Mobile optimized */}
                  <View style={styles.readingDetailsRow}>
                    <View style={styles.readingDetailItem}>
                      <Text style={styles.readingDetailLabel}>Permitted Disposal Option:</Text>
                      <Text style={styles.readingDetailValue}>
                        {selectedRow?.effluent_permitted_disposal_option || "-"}
                      </Text>
                    </View>
                    <View style={styles.readingDetailItem}>
                      <Text style={styles.readingDetailLabel}>CETP Membership:</Text>
                      <Text style={styles.readingDetailValue}>
                        {selectedRow?.cetp || "-"}
                      </Text>
                    </View>
                    <View style={styles.readingDetailItem}>
                      <Text style={styles.readingDetailLabel}>Mode of Conveyance:</Text>
                      <Text style={styles.readingDetailValue}>
                        {selectedRow?.mode_name || "-"}
                      </Text>
                    </View>
                  </View>

                  {/* Start Reading Section */}
                  {isStartModal && (
                    <View style={styles.readingSection}>
                      <Text style={styles.readingSectionSubtitle}>
                        <Icon name="pencil" size={16} color="#2e7d32" />
                        <Text style={{ marginLeft: 8 }}>Start Reading</Text>
                      </Text>
                      <FormikProvider value={startFormik}>
                        <View>
                          <View style={styles.readingRow}>
                            <View style={styles.readingCol12}>
                              <Text style={styles.readingLabel}>Type of Waste</Text>
                              <TextInput
                                style={[styles.readingInput, styles.readingInputDisabled]}
                                value={startFormik.values.wasteType}
                                editable={false}
                              />
                            </View>
                          </View>

                          <View style={styles.readingRow}>
                            <View style={styles.readingCol6}>
                              <Text style={styles.readingLabel}>Flow Meter Format</Text>
                              <CustomDropdown
                                options={flowMeterFormat}
                                selectedValue={startFormik.values.flowMeterFormat}
                                onSelect={(value) => startFormik.setFieldValue("flowMeterFormat", value)}
                                disabled={editFlag && !startEditFlag}
                                placeholder="Select"
                              />
                              {startFormik.errors.flowMeterFormat && startFormik.touched.flowMeterFormat && (
                                <Text style={styles.readingError}>{startFormik.errors.flowMeterFormat}</Text>
                              )}
                            </View>
                            <View style={styles.readingCol6}>
                              <Text style={styles.readingLabel}>
                                Start Reading <Text style={styles.star}>*</Text>
                              </Text>
                              <View style={styles.readingInputWrapper}>
                                {editFlag && (
                                  <TouchableOpacity
                                    style={styles.editIcon}
                                    onPress={() => setStartEditFlag(true)}
                                  >
                                    <Icon name="create" size={16} color="#1e3a5f" />
                                  </TouchableOpacity>
                                )}
                                <TextInput
                                  style={[styles.readingInput, editFlag && !startEditFlag && styles.readingInputDisabled]}
                                  value={startFormik.values.startReading}
                                  onChangeText={startFormik.handleChange("startReading")}
                                  onBlur={startFormik.handleBlur("startReading")}
                                  editable={!(editFlag && !startEditFlag)}
                                  maxLength={9}
                                  placeholder="Enter Reading"
                                  placeholderTextColor="#999"
                                />
                              </View>
                              {startFormik.errors.startReading && startFormik.touched.startReading && (
                                <Text style={styles.readingError}>{startFormik.errors.startReading}</Text>
                              )}
                            </View>
                          </View>

                          <View style={styles.readingRow}>
                            <View style={styles.readingCol12}>
                              <Text style={styles.readingLabel}>Remarks</Text>
                              <TextInput
                                style={[styles.readingInput, styles.readingTextArea]}
                                value={startFormik.values.startReadingRemarks}
                                onChangeText={startFormik.handleChange("startReadingRemarks")}
                                onBlur={startFormik.handleBlur("startReadingRemarks")}
                                editable={!(editFlag && !startEditFlag)}
                                maxLength={100}
                                placeholder="Enter remarks (optional)"
                                placeholderTextColor="#999"
                                multiline={true}
                                numberOfLines={2}
                              />
                              {startFormik.errors.startReadingRemarks && startFormik.touched.startReadingRemarks && (
                                <Text style={styles.readingError}>{startFormik.errors.startReadingRemarks}</Text>
                              )}
                            </View>
                          </View>

                          <View style={styles.readingRow}>
                            <View style={styles.readingCol6}>
                              <Text style={styles.readingLabel}>
                                PH <Text style={styles.star}>*</Text>
                              </Text>
                              <TextInput
                                style={styles.readingInput}
                                value={startFormik.values.ph}
                                onChangeText={startFormik.handleChange("ph")}
                                onBlur={startFormik.handleBlur("ph")}
                                editable={!(editFlag && !startEditFlag)}
                                keyboardType="numeric"
                                placeholder="0-14"
                                placeholderTextColor="#999"
                              />
                              {startFormik.errors.ph && startFormik.touched.ph && (
                                <Text style={styles.readingError}>{startFormik.errors.ph}</Text>
                              )}
                            </View>
                            <View style={styles.readingCol6}>
                              <Text style={styles.readingLabel}>
                                TDS <Text style={styles.star}>*</Text>
                              </Text>
                              <TextInput
                                style={styles.readingInput}
                                value={startFormik.values.tds}
                                onChangeText={startFormik.handleChange("tds")}
                                onBlur={startFormik.handleBlur("tds")}
                                editable={!(editFlag && !startEditFlag)}
                                keyboardType="numeric"
                                placeholder="Enter TDS"
                                placeholderTextColor="#999"
                              />
                              {startFormik.errors.tds && startFormik.touched.tds && (
                                <Text style={styles.readingError}>{startFormik.errors.tds}</Text>
                              )}
                            </View>
                          </View>

                          <View style={styles.readingRow}>
                            <View style={styles.readingCol6}>
                              <Text style={styles.readingLabel}>
                                NH3 <Text style={styles.star}>*</Text>
                              </Text>
                              <TextInput
                                style={styles.readingInput}
                                value={startFormik.values.nh3}
                                onChangeText={startFormik.handleChange("nh3")}
                                onBlur={startFormik.handleBlur("nh3")}
                                editable={!(editFlag && !startEditFlag)}
                                keyboardType="numeric"
                                placeholder="Enter NH3"
                                placeholderTextColor="#999"
                              />
                              {startFormik.errors.nh3 && startFormik.touched.nh3 && (
                                <Text style={styles.readingError}>{startFormik.errors.nh3}</Text>
                              )}
                            </View>
                            <View style={styles.readingCol6}>
                              <Text style={styles.readingLabel}>
                                COD <Text style={styles.star}>*</Text>
                              </Text>
                              <TextInput
                                style={styles.readingInput}
                                value={startFormik.values.cod}
                                onChangeText={startFormik.handleChange("cod")}
                                onBlur={startFormik.handleBlur("cod")}
                                editable={!(editFlag && !startEditFlag)}
                                keyboardType="numeric"
                                placeholder="Enter COD"
                                placeholderTextColor="#999"
                              />
                              {startFormik.errors.cod && startFormik.touched.cod && (
                                <Text style={styles.readingError}>{startFormik.errors.cod}</Text>
                              )}
                            </View>
                          </View>

                          <View style={styles.readingRow}>
                            <View style={styles.readingCol12}>
                              <Text style={styles.readingLabel}>
                                Upload Reading Image {editFlag && <Text style={styles.star}>*</Text>}
                              </Text>
                              <TouchableOpacity
                                style={styles.uploadButton}
                                onPress={() => {
                                  const path = "APEMCL/MARINE/";
                                  ImageBucketRN(
                                    startFormik,
                                    path,
                                    "startReadingImage",
                                    20971520,
                                    "camera",
                                    dispatch
                                  );
                                }}
                                disabled={editFlag && !startEditFlag}
                              >
                                <Icon name="cloud-upload" size={20} color="#2e7d32" />
                                <Text style={styles.uploadButtonText}>Choose File</Text>
                              </TouchableOpacity>
                              {startFormik.errors.startReadingImage && startFormik.touched.startReadingImage && (
                                <Text style={styles.readingError}>{startFormik.errors.startReadingImage}</Text>
                              )}
                              <Text style={styles.uploadNote}>
                                Allowed: JPEG, PNG, JPG (Max 5MB)
                              </Text>
                            </View>
                          </View>
                        </View>
                      </FormikProvider>
                    </View>
                  )}

                  {/* End Reading Section */}
                  {isEndModal && (
                    <View style={styles.readingSection}>
                      {/* Start Reading Details */}
                      <View>
                        <Text style={styles.readingSectionSubtitle}>
                          <Icon name="information-circle" size={16} color="#2e7d32" />
                          <Text style={{ marginLeft: 8 }}>Start Reading Details</Text>
                        </Text>
                        <View style={styles.readingDetailsGrid}>
                          <View style={styles.readingDetailGridItem}>
                            <Text style={styles.readingDetailLabel}>Date:</Text>
                            <Text style={styles.readingDetailValue}>
                              {moment().format("DD-MM-YYYY")}
                            </Text>
                          </View>
                          <View style={styles.readingDetailGridItem}>
                            <Text style={styles.readingDetailLabel}>Officer:</Text>
                            <Text style={styles.readingDetailValue}>
                              {state?.username || "-"}
                            </Text>
                          </View>
                          <View style={styles.readingDetailGridItem}>
                            <Text style={styles.readingDetailLabel}>PH:</Text>
                            <Text style={styles.readingDetailValue}>
                              {selectedRow?.generator_ph || "-"}
                            </Text>
                          </View>
                          <View style={styles.readingDetailGridItem}>
                            <Text style={styles.readingDetailLabel}>NH3:</Text>
                            <Text style={styles.readingDetailValue}>
                              {selectedRow?.generator_nh3 || "-"}
                            </Text>
                          </View>
                          <View style={styles.readingDetailGridItem}>
                            <Text style={styles.readingDetailLabel}>Start Reading:</Text>
                            <Text style={styles.readingDetailValue}>
                              {selectedRow?.start_reading || "-"}
                            </Text>
                          </View>
                          <View style={styles.readingDetailGridItem}>
                            <Text style={styles.readingDetailLabel}>TDS:</Text>
                            <Text style={styles.readingDetailValue}>
                              {selectedRow?.generator_tds || "-"}
                            </Text>
                          </View>
                          <View style={styles.readingDetailGridItem}>
                            <Text style={styles.readingDetailLabel}>COD:</Text>
                            <Text style={styles.readingDetailValue}>
                              {selectedRow?.generator_cod || "-"}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* End Reading Form - Mobile optimized */}
                      <View>
                        <Text style={styles.readingSectionSubtitle}>
                          <Icon name="flag" size={16} color="#2e7d32" />
                          <Text style={{ marginLeft: 8 }}>End Reading</Text>
                        </Text>
                        <FormikProvider value={endFormik}>
                          <View>
                            <View style={styles.endReadingContainer}>
                              <View style={styles.endReadingField}>
                                <Text style={styles.readingLabel}>
                                  Flow Meter Format <Text style={styles.star}>*</Text>
                                </Text>
                                <CustomDropdown
                                  options={flowMeterFormat}
                                  selectedValue={endFormik.values.endReadingFlowMeterFormat}
                                  onSelect={(value) => endFormik.setFieldValue("endReadingFlowMeterFormat", value)}
                                  placeholder="Select"
                                />
                                {endFormik.errors.endReadingFlowMeterFormat && endFormik.touched.endReadingFlowMeterFormat && (
                                  <Text style={styles.readingError}>{endFormik.errors.endReadingFlowMeterFormat}</Text>
                                )}
                              </View>

                              <View style={styles.endReadingField}>
                                <Text style={styles.readingLabel}>
                                  End Reading <Text style={styles.star}>*</Text>
                                </Text>
                                <TextInput
                                  style={styles.endReadingInput}
                                  value={endFormik.values.endReading}
                                  onChangeText={endFormik.handleChange("endReading")}
                                  onBlur={endFormik.handleBlur("endReading")}
                                  placeholder="Enter Reading"
                                  placeholderTextColor="#999"
                                />
                                {endFormik.errors.endReading && endFormik.touched.endReading && (
                                  <Text style={styles.readingError}>{endFormik.errors.endReading}</Text>
                                )}
                              </View>

                              <View style={styles.endReadingField}>
                                <Text style={styles.readingLabel}>Upload Image</Text>
                                <TouchableOpacity
                                  style={styles.uploadButton}
                                  onPress={() => {
                                    const path = "APEMCL/MARINE/";
                                    ImageBucketRN(
                                      endFormik,
                                      path,
                                      "endReadingImage",
                                      20971520,
                                      "camera",
                                      dispatch
                                    );
                                  }}
                                >
                                  <Icon name="cloud-upload" size={16} color="#2e7d32" />
                                  <Text style={styles.uploadButtonText}>Choose File</Text>
                                </TouchableOpacity>
                                <Text style={styles.uploadNote}>
                                  Allowed: JPEG, PNG, PDF (Max 5MB)
                                </Text>
                              </View>

                              <View style={styles.endReadingField}>
                                <Text style={styles.readingLabel}>Remarks</Text>
                                <TextInput
                                  style={[styles.endReadingInput, styles.endReadingTextArea]}
                                  value={endFormik.values.endReadingRemarks}
                                  onChangeText={endFormik.handleChange("endReadingRemarks")}
                                  onBlur={endFormik.handleBlur("endReadingRemarks")}
                                  placeholder="Enter remarks"
                                  placeholderTextColor="#999"
                                  multiline={true}
                                  numberOfLines={2}
                                />
                                {endFormik.errors.endReadingRemarks && endFormik.touched.endReadingRemarks && (
                                  <Text style={styles.readingError}>{endFormik.errors.endReadingRemarks}</Text>
                                )}
                              </View>

                              <View style={styles.endReadingField}>
                                <Text style={styles.readingLabel}>Total Volume</Text>
                                <TextInput
                                  style={[styles.endReadingInput, styles.endReadingTotal]}
                                  value={calculateTotalVolume() || ""}
                                  editable={false}
                                />
                              </View>
                            </View>
                          </View>
                        </FormikProvider>
                      </View>
                    </View>
                  )}
                </View>
              </ScrollView>

              <View style={styles.readingModalFooter}>
                <TouchableOpacity
                  style={[styles.readingFooterButton, styles.readingSubmitButton]}
                  onPress={() => {
                    if (isStartModal) {
                      startFormik.handleSubmit();
                    }
                    if (isEndModal) {
                      endFormik.handleSubmit();
                    }
                  }}
                >
                  <Text style={styles.readingSubmitButtonText}>Submit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.readingFooterButton, styles.readingCloseButton]}
                  onPress={() => {
                    setShowStartModal(false);
                    setShowEndModal(false);
                    startFormik.resetForm();
                    endFormik.resetForm();
                  }}
                >
                  <Text style={styles.readingCloseButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  }
}

// Custom Dropdown Component
const CustomDropdown = ({
  options,
  selectedValue,
  onSelect,
  placeholder,
  disabled = false,
}) => {
  const [showOptions, setShowOptions] = useState(false);

  const getLabel = () => {
    const selected = options.find((opt) => opt.value === selectedValue);
    return selected ? selected.label : placeholder || "Select";
  };

  return (
    <View style={styles.customDropdownContainer}>
      <TouchableOpacity
        style={[
          styles.customDropdownButton,
          disabled && styles.customDropdownDisabled,
        ]}
        onPress={() => !disabled && setShowOptions(true)}
        disabled={disabled}
      >
        <Text
          style={[
            styles.customDropdownText,
            !selectedValue && styles.customDropdownPlaceholder,
          ]}
        >
          {getLabel()}
        </Text>
        <Icon name="chevron-down" size={16} color="#666" />
      </TouchableOpacity>

      {showOptions && (
        <Modal
          transparent={true}
          visible={showOptions}
          onRequestClose={() => setShowOptions(false)}
        >
          <TouchableOpacity
            style={styles.customDropdownOverlay}
            activeOpacity={1}
            onPress={() => setShowOptions(false)}
          >
            <View style={styles.customDropdownModal}>
              <FlatList
                data={options}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.customDropdownOption,
                      selectedValue === item.value &&
                        styles.customDropdownOptionSelected,
                    ]}
                    onPress={() => {
                      onSelect(item.value);
                      setShowOptions(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.customDropdownOptionText,
                        selectedValue === item.value &&
                          styles.customDropdownOptionTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {selectedValue === item.value && (
                      <Icon name="checkmark" size={16} color="#2e7d32" />
                    )}
                  </TouchableOpacity>
                )}
                style={styles.customDropdownList}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};

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
  // Card Header
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
  backButton: {
    position: "absolute",
    left: 12,
    padding: 4,
  },
  // Card Body
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
  },
  // Search
  searchContainer: {
    marginBottom: 10,
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
  // Card List
  cardListContainer: {
    flex: 1,
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
  // Item Card Header
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
  // Item Card Body
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
  // Item Card Footer
  itemCardFooter: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: "#e8ecf1",
    backgroundColor: "#fafbfc",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  // Status Badge
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusIcon: {
    marginRight: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "500",
  },
  // Action Buttons
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#17a2b8",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  detailsButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  payButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#28a745",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  payButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
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
  // Detail View
  detailSection: {
    marginBottom: 10,
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
    fontSize: 13,
    fontWeight: "600",
    color: "#2e7d32",
    marginLeft: 6,
  },
  detailCard: {
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 6,
  },
  detailText: {
    fontSize: 11,
    color: "#333",
    paddingVertical: 2,
  },
  detailLabel: {
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  col4: {
    width: "33.33%",
    paddingHorizontal: 3,
  },
  col6: {
    width: "50%",
    paddingHorizontal: 3,
  },
  col12: {
    width: "100%",
    paddingHorizontal: 3,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 6,
  },
  rejectButton: {
    backgroundColor: "#dc3545",
  },
  acceptButton: {
    backgroundColor: "#28a745",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
  },
  // Modal
  modalContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    width: "95%",
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e3a5f",
  },
  modalBody: {
    marginBottom: 4,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e8ecf1",
  },
  footerButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 6,
  },
  cancelButton: {
    backgroundColor: "#6c757d",
  },
  cancelButtonText: {
    color: "#fff",
    fontSize: 13,
  },
  footerButtonText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 13,
  },
  // Reading Modal
  readingModalContainer: {
    flex: 1,
  },
  readingModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  readingModalContent: {
    backgroundColor: "#fff",
    borderRadius: 14,
    width: "95%",
    maxHeight: "90%",
    overflow: "hidden",
  },
  readingModalHeader: {
    backgroundColor: "#2e7d32",
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  readingModalTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
  },
  readingModalBody: {
    padding: 10,
    maxHeight: 450,
  },
  readingModalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#e8ecf1",
  },
  readingFooterButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 6,
  },
  readingSubmitButton: {
    backgroundColor: "#28a745",
  },
  readingSubmitButtonText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 13,
  },
  readingCloseButton: {
    backgroundColor: "#6c757d",
  },
  readingCloseButtonText: {
    color: "#fff",
    fontSize: 13,
  },
  readingCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 10,
  },
  readingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    flexWrap: "wrap",
  },
  readingSectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1e3a5f",
  },
  readingDateBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 14,
  },
  readingDateText: {
    fontSize: 10,
    color: "#333",
    marginLeft: 3,
  },
  readingDetailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 6,
  },
  readingDetailItem: {
    width: "33.33%",
    paddingHorizontal: 3,
    marginBottom: 2,
  },
  readingDetailLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: "#666",
  },
  readingDetailValue: {
    fontSize: 9,
    color: "#333",
  },
  readingSection: {
    marginTop: 6,
  },
  readingSectionSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2e7d32",
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  readingRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 4,
  },
  readingCol6: {
    width: "50%",
    paddingHorizontal: 3,
  },
  readingCol12: {
    width: "100%",
    paddingHorizontal: 3,
  },
  readingLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: "#333",
    marginBottom: 2,
  },
  readingInput: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    fontSize: 10,
    backgroundColor: "#fff",
    color: "#333",
    minHeight: 30,
  },
  readingInputDisabled: {
    backgroundColor: "#f0f0f0",
  },
  readingInputWrapper: {
    position: "relative",
  },
  editIcon: {
    position: "absolute",
    right: 6,
    top: 6,
    zIndex: 1,
  },
  readingTextArea: {
    minHeight: 50,
    textAlignVertical: "top",
  },
  readingError: {
    color: "#dc3545",
    fontSize: 8,
    marginTop: 2,
  },
  readingDetailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    backgroundColor: "#f8fafc",
    padding: 6,
    borderRadius: 4,
    marginBottom: 4,
  },
  readingDetailGridItem: {
    width: "33.33%",
    paddingHorizontal: 3,
    marginBottom: 2,
  },
  endReadingContainer: {
    marginTop: 4,
  },
  endReadingField: {
    marginBottom: 6,
  },
  endReadingInput: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    fontSize: 10,
    backgroundColor: "#fff",
    color: "#333",
    minHeight: 30,
  },
  endReadingTextArea: {
    minHeight: 40,
    textAlignVertical: "top",
  },
  endReadingTotal: {
    backgroundColor: "#f8f9fa",
    fontWeight: "bold",
    textAlign: "center",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderStyle: "dashed",
  },
  uploadButtonText: {
    fontSize: 10,
    color: "#2e7d32",
    marginLeft: 3,
  },
  uploadNote: {
    fontSize: 8,
    color: "#999",
    marginTop: 2,
  },
  // Custom Dropdown
  customDropdownContainer: {
    position: "relative",
    zIndex: 1,
  },
  customDropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: "#fff",
    minHeight: 30,
  },
  customDropdownDisabled: {
    backgroundColor: "#f0f0f0",
  },
  customDropdownText: {
    fontSize: 10,
    color: "#333",
  },
  customDropdownPlaceholder: {
    color: "#999",
  },
  customDropdownOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  customDropdownModal: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 6,
    width: "80%",
    maxHeight: 220,
  },
  customDropdownList: {
    maxHeight: 180,
  },
  customDropdownOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
  },
  customDropdownOptionSelected: {
    backgroundColor: "#e8f5e9",
  },
  customDropdownOptionText: {
    fontSize: 10,
    color: "#333",
  },
  customDropdownOptionTextSelected: {
    color: "#2e7d32",
    fontWeight: "500",
  },
  // Common
  star: {
    color: "red",
  },
  formGroup: {
    marginBottom: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
    marginBottom: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    backgroundColor: "#fff",
    color: "#333",
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  errorText: {
    color: "#dc3545",
    fontSize: 10,
    marginTop: 2,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e3a5f",
    marginBottom: 8,
  },
  paymentPlaceholder: {
    color: "#999",
    fontSize: 13,
    textAlign: "center",
    padding: 16,
  },
});

export default EffluentPipelineDischarge;