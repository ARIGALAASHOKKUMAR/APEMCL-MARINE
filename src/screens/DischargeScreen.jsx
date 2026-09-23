import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  FlatList,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import moment from "moment";
import Icon from "react-native-vector-icons/Ionicons";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  ASSIGNDISCHARGEDUTY,
  commonAPICall,
  CONTEXT_HEADING,
  DISCHARGEFILTERFLAG,
  MARINEDISCHARGEDETAILS,
} from "../utils/utils";
import { GetTeamLeaders } from "../utils/CommonFunctions";
import ImageBucketRN from "../utils/ImageBucketRN";

const DischargeSummary = () => {
  const dispatch = useDispatch();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [rowData, setRowData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState(0); // 'all', 'assigned', 'pending'
  const [teamLeaders, setTeamLeaders] = useState([]);
  // Validation Schema
  const validationSchema = Yup.object({
    dischargeAssignedTeamLeaderId: Yup.string().required("Required"),
    dischargeAssignedDate: Yup.string().required("Required"),
  });
  // Formik instance
  const formik = useFormik({
    initialValues: {
      dischargeAssignedTeamLeaderId: "",
      dischargeAssignedDate: "",
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      HandleSubmit(values);
    },
  });

  // API Calls
  const HandleSubmit = async (values) => {
    try {
      setLoading(true);
      const payload = {
        ...values,
        postingId: rowData?.posting_id,
        dischargeAssignmentRemarks:
          "Assigned for treated water discharge verification.",
      };
      const res = await commonAPICall(
        ASSIGNDISCHARGEDUTY,
        payload,
        "post",
        dispatch,
      );
      if (res.status === 200) {
        formik.resetForm();
        filterData(0);
        setShowModal(false);
        Alert.alert("Success", "Duty assigned successfully");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to assign duty");
    } finally {
      setLoading(false);
    }
  };
  const noticeValidationSchema = Yup.object({
    noticeRemarks: Yup.string()
      .required("required")
      .min(10, "Remarks must be at least 10 characters"),
    noticeAttachment: Yup.string().required("required"),
  });
  const noticeFormik = useFormik({
    initialValues: {
      noticeRemarks: "",
      noticeAttachment: null,
    },
    validationSchema: noticeValidationSchema,
    onSubmit: (values) => {
      HandleNoticeSubmit(values);
    },
  });

  const HandleNoticeSubmit = async (values) => {
    try {
      setLoading(true);
      const payload = {
        ...values,
        postingId: rowData?.posting_id,
        // noticeRemarks: values.noticeRemarks,
        // noticeSubject: values.noticeSubject || 'Notice for discharge violation',
        // noticeDate: moment().format('YYYY-MM-DD'),
        // industryName: rowData?.discharge_request_industry,
        // noticeAttachment: values.noticeAttachment,
      };

      const res = await commonAPICall(
        DISCHARGENOTICE,
        payload,
        "post",
        dispatch,
      );
      if (res.status === 200) {
        noticeFormik.resetForm();
        setShowNoticeModal(false);
        Alert.alert("Success", "Notice sent successfully!");
      } else {
        Alert.alert("Error", "Failed to send notice. Please try again.");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to send notice");
    } finally {
      setLoading(false);
    }
  };
  // Handle Date Change
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || tempDate;
    setShowDatePicker(Platform.OS === "ios");
    setTempDate(currentDate);

    const formattedDate = currentDate.toISOString().split("T")[0];
    formik.setFieldValue("dischargeAssignedDate", formattedDate);
  };

  // Filter Data
  const filterData = async (id) => {
    const res = await commonAPICall(
      DISCHARGEFILTERFLAG + id,
      {},
      "get",
      dispatch,
    );
    if (res.status === 200) {
      setData(res.data.MarineDischargeSummary);
    } else {
      setData([]);
    }
    setActiveFilter(id);
  };

  // Industry Limits
  const industryLimits = {
    "ANDHRA ORGANICS": {
      ph: { min: 5.5, max: 9.0 },
      tss: 100,
      cod: 250,
      fluoride: 15,
      phenols: 5,
      phosphate: 5,
      ammonical: 50,
      nitrate: 50,
      chromium: 0.1,
    },
    AETL: {
      ph: { min: 6.0, max: 9.0 },
      tss: 100,
      cod: 250,
      fluoride: 15,
      phenols: 5,
      ammonical: 50,
      nitrate: 50,
      chromium: 0.1,
    },
    APITORIA: {
      ph: { min: 6.5, max: 8.5 },
      tss: 100,
      cod: 250,
      fluoride: 15,
      phenols: 5,
      ammonical: 50,
      nitrate: 50,
      chromium: 0.1,
    },
    BRANDIX: {
      ph: { min: 6.0, max: 9.0 },
      tss: 100,
      cod: 250,
      fluoride: 15,
      phenols: 5,
      ammonical: 50,
      nitrate: 50,
      chromium: 0.1,
    },
    DECCAN: {
      ph: { min: 6.5, max: 8.5 },
      tss: 100,
      cod: 225,
      phenols: 1,
      phosphate: 5,
    },
    DIVI: {
      ph: { min: 6.5, max: 8.5 },
      tss: 100,
      cod: 225,
      fluoride: 15,
      phenols: 1,
      phosphate: 5,
      ammonical: 50,
      nitrate: 20,
      chromium: 0.1,
    },
    HETERO: {
      ph: { min: 6.0, max: 9.0 },
      tss: 100,
      cod: 250,
      fluoride: 15,
      phenols: 5,
      phosphate: 5,
      ammonical: 50,
      nitrate: 50,
      chromium: 0.1,
    },
    APARNA: {
      ph: { min: 6.0, max: 8.5 },
      tss: 100,
      cod: 250,
      fluoride: 15,
      phenols: 5,
      phosphate: 5,
      ammonical: 50,
      nitrate: 50,
      chromium: 0.1,
    },
    "VISAKHA PHARMACITY": {
      ph: { min: 6.0, max: 9.0 },
      tss: 100,
      cod: 250,
      fluoride: 15,
      phenols: 5,
      ammonical: 50,
      nitrate: 50,
    },
    SMS: {
      ph: { min: 6.5, max: 8.5 },
      tss: 100,
      cod: 250,
      phenols: 1,
      phosphate: 5,
      ammonical: 100,
      chromium: 0.1,
    },
    SHREAS: {
      ph: { min: 5.5, max: 9.0 },
      tss: 100,
      cod: 250,
      phenols: 5,
      ammonical: 50,
      chromium: 1,
    },
    AUROACTIVE: {
      ph: { min: 5.5, max: 9.0 },
      tss: 100,
      cod: 250,
      fluoride: 15,
      phenols: 5,
      phosphate: 5,
      ammonical: 50,
      nitrate: 20,
      chromium: 0.1,
    },
    LYFIUS: {
      ph: { min: 5.5, max: 9.0 },
      tss: 100,
      cod: 250,
      fluoride: 15,
      phenols: 5,
      ammonical: 50,
      nitrate: 20,
      chromium: 1,
    },
    "VIJAYANAGAR BIOTECH": {
      ph: { min: 6.5, max: 8.5 },
      tss: 100,
      cod: 250,
    },
  };

  const defaultLimits = {
    ph: { min: 5.5, max: 9.0 },
    tds: 2100,
    tss: 100,
    cod: 250,
    fluoride: 15,
    phenols: 5,
    phosphate: 5,
    ammonical: 50,
    nitrate: 50,
    chromium: 0.1,
  };

  const getIndustryLimitsByUsername = () => {
    const username = state?.username;
    if (!username) return defaultLimits;

    const normalizedUsername = username?.toUpperCase()?.trim();
    if (industryLimits[normalizedUsername]) {
      return industryLimits[normalizedUsername];
    }

    const matchedKey = Object.keys(industryLimits).find(
      (key) =>
        normalizedUsername.includes(key.toUpperCase()) ||
        key.toUpperCase().includes(normalizedUsername),
    );

    return matchedKey ? industryLimits[matchedKey] : defaultLimits;
  };

  const getValueColor = (value, limit, isPH = false) => {
    if (
      value === null ||
      value === undefined ||
      value === "" ||
      value === "-" ||
      limit === undefined
    ) {
      return { isValid: true, color: "green" };
    }

    const numericValue = parseFloat(value);
    let isValid = true;

    if (isPH) {
      isValid = numericValue >= limit?.min && numericValue <= limit?.max;
    } else {
      isValid = numericValue <= limit;
    }

    return {
      isValid: isValid,
      color: isValid ? "green" : "red",
    };
  };

  const showParameterInfo = (param) => {
    const value = param.value || "-";

    if (value === "-") {
      Alert.alert(param.key, "No value available.");
      return;
    }

    if (param.isPH) {
      const isValid =
        parseFloat(value) >= param.limit.min &&
        parseFloat(value) <= param.limit.max;

      Alert.alert(
        param.key,
        isValid
          ? `✅ Status: Normal\n\nCurrent Value: ${value}\n\nAllowed Range: ${param.limit.min} - ${param.limit.max}`
          : `❌ Status: Out of Range\n\nCurrent Value: ${value}\n\nAllowed Range: ${param.limit.min} - ${param.limit.max}`,
      );
    } else {
      const isValid = parseFloat(value) <= param.limit;

      Alert.alert(
        param.key,
        isValid
          ? `✅ Status: Within Limit\n\nCurrent Value: ${value}\n\nMaximum Allowed: ${param.limit}`
          : `❌ Status: Exceeded Limit\n\nCurrent Value: ${value}\n\nMaximum Allowed: ${param.limit}\n\nExceeded By: ${(parseFloat(value) - param.limit).toFixed(2)}`,
      );
    }
  };

  const userIndustryLimits = getIndustryLimitsByUsername();

  useEffect(() => {
    GetTeamLeaders(teamLeaders, setTeamLeaders, dispatch);
    filterData(0);
  }, []);

  // Get Assigned and Pending Counts
  const getAssignedCount = () =>
    data.filter((item) => item?.discharge_assigned_team_leader_id !== null)
      .length;
  const getPendingCount = () =>
    data.filter((item) => item?.discharge_assigned_team_leader_id === null)
      .length;

  // Render Assign Duty Modal
  const renderAssignDutyModal = () => (
    <Modal
      visible={showModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Assign Duty</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <ScrollView>
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Team Leader <Text style={styles.star}>*</Text>
              </Text>
              <View
                style={[
                  styles.pickerWrapper,
                  formik.errors.dischargeAssignedTeamLeaderId &&
                    formik.touched.dischargeAssignedTeamLeaderId &&
                    styles.inputError,
                ]}
              >
                <Picker
                  selectedValue={formik.values.dischargeAssignedTeamLeaderId}
                  onValueChange={(itemValue) => {
                    formik.setFieldValue(
                      "dischargeAssignedTeamLeaderId",
                      itemValue,
                    );
                    formik.setFieldTouched(
                      "dischargeAssignedTeamLeaderId",
                      true,
                    );
                  }}
                  style={styles.picker}
                  dropdownIconColor="#666"
                >
                  <Picker.Item label="Select Team Leader" value="" />
                  {teamLeaders.map((leader) => (
                    <Picker.Item
                      key={leader.userid}
                      label={leader.employeename}
                      value={leader.userid}
                    />
                  ))}
                </Picker>
              </View>
              {formik.errors.dischargeAssignedTeamLeaderId &&
                formik.touched.dischargeAssignedTeamLeaderId && (
                  <Text style={styles.errorText}>
                    {formik.errors.dischargeAssignedTeamLeaderId}
                  </Text>
                )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Assigning Date <Text style={styles.star}>*</Text>
              </Text>
              <TouchableOpacity
                style={[
                  styles.dateInputWrapper,
                  formik.errors.dischargeAssignedDate &&
                    formik.touched.dischargeAssignedDate &&
                    styles.inputError,
                ]}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dateInputText,
                    !formik.values.dischargeAssignedDate &&
                      styles.datePlaceholder,
                  ]}
                >
                  {formik.values.dischargeAssignedDate || "YYYY-MM-DD"}
                </Text>
                <Icon name="calendar-outline" size={22} color="#666" />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={onDateChange}
                  minimumDate={new Date()}
                />
              )}

              {formik.errors.dischargeAssignedDate &&
                formik.touched.dischargeAssignedDate && (
                  <Text style={styles.errorText}>
                    {formik.errors.dischargeAssignedDate}
                  </Text>
                )}
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={formik.handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Render Card

  const userId = useSelector((state) => state.LoginReducer.userId);
  const state = useSelector((state) => state.LoginReducer);
  // console.log("role", state.roleId);
  const renderNoticeModal = () => (
    <Modal
      visible={showNoticeModal}
      transparent
      animationType="slide"
      onRequestClose={() => {
        setShowNoticeModal(false);
        noticeFormik.resetForm();
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Send Notice</Text>
            <TouchableOpacity
              onPress={() => {
                setShowNoticeModal(false);
                noticeFormik.resetForm();
              }}
            >
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <ScrollView>
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Remarks <Text style={styles.star}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  noticeFormik.errors.noticeRemarks &&
                    noticeFormik.touched.noticeRemarks &&
                    styles.inputError,
                ]}
                placeholder="Enter detailed remarks for the notice..."
                multiline
                numberOfLines={4}
                value={noticeFormik.values.noticeRemarks}
                onChangeText={noticeFormik.handleChange("noticeRemarks")}
                onBlur={noticeFormik.handleBlur("noticeRemarks")}
                textAlignVertical="top"
              />
              {noticeFormik.errors.noticeRemarks &&
                noticeFormik.touched.noticeRemarks && (
                  <Text style={styles.errorText}>
                    {noticeFormik.errors.noticeRemarks}
                  </Text>
                )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Attachment <Text style={styles.star}>*</Text>
              </Text>
              <TouchableOpacity
                style={[
                  styles.uploadButton,
                  noticeFormik.errors.noticeAttachment &&
                    noticeFormik.touched.noticeAttachment &&
                    styles.inputError,
                ]}
                onPress={() => {
                  const path = "APEMCL/REGISTRATION/";
                  ImageBucketRN(
                    noticeFormik,
                    path,
                    "noticeAttachment",
                    20971520,
                    "camera",
                    dispatch,
                  );
                }}
              >
                <Text style={styles.uploadButtonText}>Upload Attachment</Text>
              </TouchableOpacity>
              {noticeFormik.values.noticeAttachment && (
                <View style={styles.filePreview}>
                  {noticeFormik.values.noticeAttachment.match(
                    /\.(jpg|jpeg|png)$/i,
                  ) ? (
                    <Image
                      source={{ uri: noticeFormik.values.noticeAttachment }}
                      style={styles.imagePreview}
                    />
                  ) : noticeFormik.values.noticeAttachment.match(/\.pdf$/i) ? (
                    <TouchableOpacity
                      style={styles.pdfPreview}
                      onPress={() =>
                        Linking.openURL(noticeFormik.values.noticeAttachment)
                      }
                    >
                      <Icon
                        name="document-text-outline"
                        size={24}
                        color="red"
                      />
                      <Text style={styles.pdfText}>Download PDF</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.fileNameText}>
                      {noticeFormik.values.noticeAttachment}
                    </Text>
                  )}
                </View>
              )}
              {noticeFormik.errors.noticeAttachment &&
                noticeFormik.touched.noticeAttachment && (
                  <Text style={styles.errorText}>
                    {noticeFormik.errors.noticeAttachment}
                  </Text>
                )}
              <Text style={styles.hintText}>
                Allowed formats: PDF, JPEG, PNG, DOC, DOCX (Max size: 5MB)
              </Text>
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={noticeFormik.handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
  const renderCard = ({ item, index }) => {
    const limits = userIndustryLimits;
    const isAssigned = item?.discharge_assigned_team_leader_id !== null;

    // console.log(
    //   "tem?.discharge_assigned_team_leader_id ",
    //   item?.discharge_assigned_team_leader_id,
    // );
    const parameters = [
      { key: "TDS", value: item?.tds_value, limit: limits?.tds, isPH: false },
      { key: "TSS", value: item?.tss_value, limit: limits?.tss, isPH: false },
      { key: "COD", value: item?.cod_value, limit: limits?.cod, isPH: false },
      { key: "PH", value: item?.ph_value, limit: limits?.ph, isPH: true },
      {
        key: "Fluoride",
        value: item?.fluoride_value,
        limit: limits?.fluoride,
        isPH: false,
      },
      {
        key: "Phenols",
        value: item?.phenols_value,
        limit: limits?.phenols,
        isPH: false,
      },
      {
        key: "Phosphate",
        value: item?.ortho_phosphate_value,
        limit: limits?.phosphate,
        isPH: false,
      },
      {
        key: "Nitrate",
        value: item?.nitrate_nitrogen_value,
        limit: limits?.nitrate,
        isPH: false,
      },
      {
        key: "Ammonical",
        value: item?.ammonical_nitrogen_value,
        limit: limits?.ammonical,
        isPH: false,
      },
      {
        key: "Chromium",
        value: item?.hexavalent_chromium_value,
        limit: limits?.chromium,
        isPH: false,
      },
    ];

    // Check if any parameter is invalid (red)
    const hasInvalidParameter = parameters.some((param) => {
      const { isValid } = getValueColor(param.value, param.limit, param.isPH);
      return !isValid;
    });
    return (
      <View style={styles.cardItem}>
        <View style={styles.cardHeaderItem}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardIndustry}>
              {item?.discharge_request_industry || "-"}
            </Text>
            <View
              style={[
                styles.statusBadge,
                isAssigned ? styles.statusAssigned : styles.statusPending,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  isAssigned
                    ? styles.statusTextAssigned
                    : styles.statusTextPending,
                ]}
              >
                {item.current_status}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardBodyItem}>
          {/* Row 1: Collected Date, Analysis Date, Guard Pond */}
          <View style={styles.cardRow}>
            <View style={styles.cardLabelContainer}>
              <Text style={styles.cardLabel}>📅 Collected Date</Text>
              <Text style={styles.cardValue}>
                {item?.sample_collected_date?.split(" ")[0] || "-"}
              </Text>
            </View>
            <View style={styles.cardLabelContainer}>
              <Text style={styles.cardLabel}>🔬 Analysis Date</Text>
              <Text style={styles.cardValue}>
                {item?.analysis_date?.split(" ")[0] || "-"}
              </Text>
            </View>
            <View style={styles.cardLabelContainer}>
              <Text style={styles.cardLabel}>🏊 Guard Pond</Text>
              <Text style={styles.cardValue}>{item?.guardpond_name}</Text>
            </View>
          </View>

          {/* Row 2: Parameters - 5 per row */}
          <View style={styles.parameterGrid}>
            <View style={styles.parameterItem}>
              <Text style={styles.parameterLabel}>TDS</Text>
              <Text style={styles.parameterValue}>
                {item?.tds_value || "-"}
              </Text>
            </View>
            <View style={styles.parameterItem}>
              <Text style={styles.parameterLabel}>TSS</Text>
              <Text style={styles.parameterValue}>
                {item?.tss_value || "-"}
              </Text>
            </View>
            <View style={styles.parameterItem}>
              <Text style={styles.parameterLabel}>COD</Text>
              <Text style={styles.parameterValue}>
                {item?.cod_value || "-"}
              </Text>
            </View>
            <View style={styles.parameterItem}>
              <Text style={styles.parameterLabel}>PH</Text>
              <Text style={styles.parameterValue}>{item?.ph_value || "-"}</Text>
            </View>
            <View style={styles.parameterItem}>
              <Text style={styles.parameterLabel}>Fluoride</Text>
              <Text style={styles.parameterValue}>
                {item?.fluoride_value || "-"}
              </Text>
            </View>
            <View style={styles.parameterItem}>
              <Text style={styles.parameterLabel}>Phenols</Text>
              <Text style={styles.parameterValue}>
                {item?.phenols_value || "-"}
              </Text>
            </View>
            <View style={styles.parameterItem}>
              <Text style={styles.parameterLabel}>Phosphate</Text>
              <Text style={styles.parameterValue}>
                {item?.ortho_phosphate_value || "-"}
              </Text>
            </View>
            <View style={styles.parameterItem}>
              <Text style={styles.parameterLabel}>Nitrate</Text>
              <Text style={styles.parameterValue}>
                {item?.nitrate_nitrogen_value || "-"}
              </Text>
            </View>
            <View style={styles.parameterItem}>
              <Text style={styles.parameterLabel}>Ammonical</Text>
              <Text style={styles.parameterValue}>
                {item?.ammonical_nitrogen_value || "-"}
              </Text>
            </View>
            <View style={styles.parameterItem}>
              <Text style={styles.parameterLabel}>Chromium</Text>
              <Text style={styles.parameterValue}>
                {item?.hexavalent_chromium_value || "-"}
              </Text>
            </View>
          </View>
          {state.roleId !== 2 && (
            <View style={[styles.cardActions]}>
              {isAssigned && activeFilter !== 2 ? (
                <TouchableOpacity style={styles.disabledButton} disabled>
                  <Icon name="checkmark-circle" size={16} color="#fff" />
                  <Text style={styles.disabledButtonText}>Assigned</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.assignButton}
                  onPress={() => {
                    setShowModal(true);
                    setRowData(item);
                  }}
                >
                  <Icon name="person-add-outline" size={16} color="#fff" />
                  <Text style={styles.assignButtonText}>
                    {activeFilter === 2 ? "Re Assign Duty" : "Assign Duty"}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.noticeButton,
                  (!hasInvalidParameter || isAssigned) &&
                    styles.noticeButtonDisabled,
                ]}
                onPress={() => {
                  if (hasInvalidParameter && !isAssigned) {
                    setShowNoticeModal(true);
                    setRowData(item);
                    noticeFormik.resetForm();
                  }
                }}
                disabled={!hasInvalidParameter || isAssigned}
              >
                <Icon
                  name="notifications-outline"
                  size={14}
                  color={!hasInvalidParameter || isAssigned ? "#999" : "#000"}
                />
                <Text
                  style={[
                    styles.noticeButtonText,
                    (!hasInvalidParameter || isAssigned) &&
                      styles.noticeButtonTextDisabled,
                  ]}
                >
                  Notice
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderAssignDutyModal()}
      {renderNoticeModal()}
      <View>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            <Icon name="list" size={20} color="#000" /> Discharge Summary
          </Text>
        </View>

        <View style={styles.cardBody}>
          {/* Filter Section */}
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === 0 && styles.filterButtonActive,
              ]}
              onPress={() => filterData(0)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  activeFilter === 0 && styles.filterButtonTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === 3 && styles.filterButtonActive,
              ]}
              onPress={() => filterData(3)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  activeFilter === 3 && styles.filterButtonTextActive,
                ]}
              >
                Completed
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === 1 && styles.filterButtonActive,
              ]}
              onPress={() => filterData(1)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  activeFilter === 1 && styles.filterButtonTextActive,
                ]}
              >
                Pending
              </Text>
            </TouchableOpacity>
            {userId !== "TEAML" && (
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  activeFilter === 2 && styles.filterButtonActive,
                ]}
                onPress={() => filterData(2)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    activeFilter === 2 && styles.filterButtonTextActive,
                  ]}
                >
                  Continue
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="green" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <FlatList
              data={data}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderCard}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={
                <View style={styles.noRecords}>
                  <Icon name="document-text-outline" size={50} color="#ccc" />
                  <Text style={styles.noRecordsText}>No Records Found</Text>
                  <Text style={styles.noRecordsSubText}>
                    {activeFilter === "all"
                      ? "No records available"
                      : activeFilter === "assigned"
                        ? "No assigned records"
                        : "No pending records"}
                  </Text>
                </View>
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  cardHeader: {
    padding: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    textAlign: "center",
  },
  cardBody: {
    flex: 1,
    padding: 10,
  },
  // Filter Styles
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#fff",
    padding: 8,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  filterButtonActive: {
    backgroundColor: "green",
    borderColor: "green",
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6c757d",
  },
  filterButtonTextActive: {
    color: "#fff",
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
  // Card Styles
  cardItem: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
  cardIndustry: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e3a5f",
    flex: 1,
  },
  cardBodyItem: {
    padding: 12,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardLabelContainer: {
    flex: 1,
    marginHorizontal: 2,
  },
  cardLabel: {
    fontSize: 11,
    color: "#6c757d",
    marginBottom: 2,
    fontWeight: "500",
  },
  cardValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusAssigned: {
    backgroundColor: "#d4edda",
  },
  statusPending: {
    backgroundColor: "#f8d7da",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusTextAssigned: {
    color: "#155724",
  },
  statusTextPending: {
    color: "#721c24",
  },
  parameterGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    marginBottom: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    paddingTop: 10,
  },
  parameterItem: {
    width: "20%", // 5 items per row
    paddingVertical: 4,
    alignItems: "center",
  },
  parameterLabel: {
    fontSize: 9,
    color: "#6c757d",
    textAlign: "center",
    fontWeight: "500",
  },
  parameterValue: {
    fontSize: 13,
    color: "#333",
    fontWeight: "700",
    textAlign: "center",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  assignButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#28a745",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 0.45,
    justifyContent: "center",
  },
  assignButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
  },
  noticeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffc107",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 0.45,
    justifyContent: "center",
  },
  noticeButtonText: {
    color: "#000",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
  },
  disabledButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6c757d",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 0.45,
    justifyContent: "center",
  },
  disabledButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
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
    borderRadius: 10,
    padding: 20,
    width: "90%",
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 5,
  },
  star: {
    color: "red",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
    color: "#333",
  },
  dateInputWrapper: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: "#fff",
  },
  dateInputText: {
    fontSize: 14,
    color: "#333",
  },
  datePlaceholder: {
    color: "#999",
  },
  inputError: {
    borderColor: "red",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 5,
  },
  submitButton: {
    backgroundColor: "#28a745",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  noRecords: {
    padding: 40,
    alignItems: "center",
  },
  noRecordsText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
  },
  noRecordsSubText: {
    color: "#999",
    fontSize: 13,
    marginTop: 4,
  },
    textArea: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#fff",
    minHeight: 100,
    textAlignVertical: "top",
  },
    uploadButton: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  uploadButtonText: {
    color: "#333",
    fontSize: 14,
  },
});

export default DischargeSummary;
