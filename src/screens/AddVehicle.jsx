import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  Image,
  Linking,
  Platform,
  ActionSheetIOS,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useDispatch } from "react-redux";
import Ionicons from "react-native-vector-icons/Ionicons";
import moment from "moment";
import { useFormik } from "formik";
import * as Yup from "yup";

import {
  ADDFLYASHVEHICLEDETAILS,
  ADDVEHICLEDETAILS,
  commonAPICall,
  VEHICLETYPES,
} from "../utils/utils";
import ImageBucketRN from "../utils/ImageBucketRN";
import { allowAlphaNumeric, allowNumbersOnly } from "../utils/CommonFunctions";

const UPLOAD_PATH = "APEMCL/MARNINEPOSTING/";

// ─── Validation Schema ───────────────────────────────────────────────────────
const buildValidationSchema = (isFieldRequired) => {
  const baseSchema = {
    vehicleNo: Yup.string()
      .required("Vehicle Registration Number is required")
      .matches(
        /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}$/i,
        "Enter valid Vehicle Registration Number",
      ),
    vehicleType: Yup.string().required("Vehicle Type is required"),
    gpsVendor: Yup.string().required("GPS Vendor is required"),
  };

  if (!isFieldRequired) {
    return Yup.object().shape(baseSchema);
  }

  return Yup.object().shape({
    ...baseSchema,
    capacity: Yup.string().required("Capacity is required"),
    permitNo: Yup.string().required("Vehicle Permit No is required"),
    chassisNo: Yup.string()
      .required("Chassis Number is required")
      .max(17, "Chassis Number must not exceed 17 characters")
      .matches(/^[A-HJ-NPR-Z0-9]{17}$/, "Invalid Chassis Number"),
    rcExpiryDate: Yup.string().required("RC Expiry Date is required"),
    pucExpiryDate: Yup.string().required("PUC Expiry Date is required"),
    permitExpiryDate: Yup.string().required("Permit Expiry Date is required"),
    gpsImeiNo: Yup.string()
      .required("GPS IMEI Number is required")
      .matches(/^[0-9]+$/, "IMEI must contain only digits")
      .min(8, "IMEI number must be at least 8 digits"),
    gpsSimNo: Yup.string()
      .required("GPS SIM Number is required")
      .min(9, "GPS SIM Number must be at least 9 digits")
      .max(15, "GPS SIM Number must not exceed 15 digits"),
    vehicleRcCopy: Yup.string().required("Vehicle RC Copy is required"),
    pucCertificate: Yup.string().required("PUC Certificate is required"),
    permitDocument: Yup.string().required("Permit Document is required"),
    gpsImage: Yup.string().required("GPS Device Image is required"),
    vehicleFrontPhoto: Yup.string().required("Front View photo is required"),
    vehicleDiagonalPhoto: Yup.string().required(
      "Diagonal View photo is required",
    ),
    vehicleBackPhoto: Yup.string().required("Back View photo is required"),
    unladenWeight: Yup.string().test(
      "unladen-gross",
      "Unladen Weight should not exceed Gross Weight",
      function (value) {
        const { grossWeight } = this.parent;
        if (!value || !grossWeight) return true;
        return Number(value) <= Number(grossWeight);
      },
    ),
  });
};

// ─── Custom Dropdown ─────────────────────────────────────────────────────────
const CustomDropdown = ({
  options = [],
  selectedValue,
  onSelect,
  placeholder = "Select",
  disabled = false,
}) => {
  const [showOptions, setShowOptions] = useState(false);

  const getLabel = () => {
    if (!options || options.length === 0) return placeholder;
    const selected = options.find(
      (opt) => String(opt.value) === String(selectedValue),
    );
    return selected ? selected.label : placeholder;
  };

  const handlePress = () => {
    if (disabled) return;
    if (!options || options.length === 0) {
      Alert.alert("No Options", "No options available to select.");
      return;
    }

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", ...options.map((o) => o.label)],
          cancelButtonIndex: 0,
          title: placeholder,
        },
        (buttonIndex) => {
          if (buttonIndex > 0) {
            const selectedOption = options[buttonIndex - 1];
            if (selectedOption) onSelect(selectedOption.value);
          }
        },
      );
    } else {
      setShowOptions(true);
    }
  };

  const renderAndroidDropdown = () => {
    if (!showOptions || Platform.OS === "ios") return null;

    return (
      <Modal
        transparent
        visible={showOptions}
        onRequestClose={() => setShowOptions(false)}
        animationType="fade"
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.dropdownModalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptions(false)}
        >
          <View style={styles.dropdownModalContent}>
            <View style={styles.dropdownModalHeader}>
              <Text style={styles.dropdownModalTitle}>{placeholder}</Text>
              <TouchableOpacity onPress={() => setShowOptions(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.dropdownListWrapper}>
              <FlatList
                data={options}
                keyExtractor={(item, index) => String(item.value) + "_" + index}
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
                      <Ionicons name="checkmark" size={18} color="#2e7d32" />
                    )}
                  </TouchableOpacity>
                )}
                nestedScrollEnabled
                showsVerticalScrollIndicator
              />
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.dropdownButton, disabled && styles.dropdownDisabled]}
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
        <Ionicons name="chevron-down" size={20} color="#666" />
      </TouchableOpacity>
      {renderAndroidDropdown()}
    </>
  );
};

// ─── Reusable Field Wrapper ──────────────────────────────────────────────────
const FieldWrapper = ({ label, isRequired, error, touched, children }) => (
  <View style={styles.formGroup}>
    <Text style={styles.label}>
      {label} {isRequired && <Text style={styles.star}>*</Text>}
    </Text>
    {children}
    {touched && error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

// ─── Text Field ──────────────────────────────────────────────────────────────
const TextField = ({
  label,
  value,
  onChangeText,
  onBlur,
  placeholder,
  error,
  touched,
  isRequired,
  maxLength,
  textTransform = "none",
  numericOnly = false,
  alphaNumericOnly = false,
  editable = true,
}) => {
  return (
    <FieldWrapper
      label={label}
      isRequired={isRequired}
      error={error}
      touched={touched}
    >
      <TextInput
        style={[
          styles.input,
          touched && error && styles.inputError,
          textTransform === "uppercase" && { textTransform: "uppercase" },
        ]}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        editable={editable}
        maxLength={maxLength}
        keyboardType={numericOnly ? "numeric" : "default"}
        onBlur={onBlur}
        onChangeText={(text) => {
          let newText = text;
          if (textTransform === "uppercase") newText = newText.toUpperCase();
          if (numericOnly) newText = allowNumbersOnly(newText);
          if (alphaNumericOnly) newText = allowAlphaNumeric(newText);
          onChangeText(newText);
        }}
      />
    </FieldWrapper>
  );
};

// ─── Picker Field ────────────────────────────────────────────────────────────
const PickerField = ({
  label,
  value,
  onSelect,
  options,
  placeholder = "Select",
  error,
  touched,
  isRequired,
  disabled = false,
}) => {
  return (
    <FieldWrapper
      label={label}
      isRequired={isRequired}
      error={error}
      touched={touched}
    >
      <View
        style={[styles.pickerContainer, touched && error && styles.inputError]}
      >
        <CustomDropdown
          options={options}
          selectedValue={value}
          onSelect={onSelect}
          placeholder={placeholder}
          disabled={disabled}
        />
      </View>
    </FieldWrapper>
  );
};

// ─── Date Field ──────────────────────────────────────────────────────────────
const DateField = ({
  label,
  value,
  placeholder,
  error,
  touched,
  isRequired,
  showPicker,
  onOpenPicker,
  onPickerChange,
  editable = true,
}) => {
  return (
    <FieldWrapper
      label={label}
      isRequired={isRequired}
      error={error}
      touched={touched}
    >
      <TouchableOpacity
        style={[
          styles.input,
          styles.dateInput,
          touched && error && styles.inputError,
        ]}
        onPress={onOpenPicker}
        disabled={!editable}
        activeOpacity={0.7}
      >
        <Text style={value ? styles.dateText : styles.placeholderText}>
          {value ? moment(value).format("DD/MM/YYYY") : placeholder}
        </Text>
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onPickerChange}
          minimumDate={new Date()}
        />
      )}
    </FieldWrapper>
  );
};

// ─── File Upload Field (Wrapper for individual inline blocks) ────────────────
const FileUploadField = ({
  label,
  value,
  error,
  touched,
  isRequired,
  children,
}) => {
  const isImageUrl = (url) =>
    !!url && /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(url);
  const isPdfUrl = (url) => !!url && /\.pdf$/i.test(url);

  const downloadFile = (fileUrl) => {
    if (!fileUrl) {
      Alert.alert("Error", "No file available to download");
      return;
    }
    try {
      Linking.openURL(fileUrl);
    } catch (e) {
      Alert.alert("Error", "Failed to open file");
    }
  };

  return (
    <FieldWrapper
      label={label}
      isRequired={isRequired}
      error={error}
      touched={touched}
    >
      {children}

      {value ? (
        <View style={styles.previewWrap}>
          {isImageUrl(value) ? (
            <Image
              source={{ uri: value }}
              style={styles.previewImage}
              resizeMode="cover"
            />
          ) : isPdfUrl(value) ? (
            <TouchableOpacity
              style={styles.pdfRow}
              onPress={() => downloadFile(value)}
            >
              <Ionicons name="document-text-outline" size={24} color="red" />
              <Text style={styles.pdfText}>View PDF</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.fileNameText}>{value}</Text>
          )}
        </View>
      ) : null}
    </FieldWrapper>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
const AddVehicle = ({ isFieldRequired = true }) => {
  const dispatch = useDispatch();

  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState({
    rcExpiryDate: false,
    pucExpiryDate: false,
    permitExpiryDate: false,
  });

  // ─── Vehicle Types fetch ───────────────────────────────────────────────────
  const GetVehicles = async () => {
    setIsLoadingVehicles(true);
    try {
      const res = await commonAPICall(VEHICLETYPES, {}, "get", dispatch);

      if (res && res.status === 200) {
        const rawList =
          res.data?.VehicleTypeDetails ||
          res.data?.vehicleTypeDetails ||
          res.data?.VehicleTypes ||
          res.data?.vehicleTypes ||
          res.data?.data ||
          (Array.isArray(res.data) ? res.data : []);

        const normalized = rawList
          .map((vv) => ({
            id:
              vv.vehicleTypeId ??
              vv.VehicleTypeId ??
              vv.vehicle_type_id ??
              vv.id ??
              vv.Id,
            name:
              vv.vehicleTypeName ??
              vv.VehicleTypeName ??
              vv.vehicle_type_name ??
              vv.name ??
              vv.Name,
            status:
              vv.status ?? vv.Status ?? vv.isActive ?? vv.IsActive ?? true,
          }))
          .filter(
            (vv) =>
              vv.status === true &&
              vv.id !== undefined &&
              vv.id !== null &&
              vv.name !== undefined &&
              vv.name !== null,
          );

        setVehicleTypes(normalized);
      } else {
        setVehicleTypes([]);
      }
    } catch (e) {
      console.log("GetVehicles error:", e);
      setVehicleTypes([]);
    } finally {
      setIsLoadingVehicles(false);
    }
  };

  useEffect(() => {
    GetVehicles();
  }, []);

  // ─── Submit Handler ────────────────────────────────────────────────────────
  const HandleSubmit = async (values) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        vehicleType: parseInt(values.vehicleType) || 0,
        grossWeight: parseInt(values.grossWeight) || 0,
        unladenWeight: parseInt(values.unladenWeight) || 0,
        gpsVendor: parseInt(values.gpsVendor) || 0,
        gpsImeiNo: parseInt(values.gpsImeiNo) || 0,
        gpsSimNo: parseInt(values.gpsSimNo) || 0,
      };

      const api =
        isFieldRequired === false ? ADDFLYASHVEHICLEDETAILS : ADDVEHICLEDETAILS;

      const res = await commonAPICall(api, payload, "post", dispatch);

      if (res.status === 200) {
        vehicleFormik.resetForm();
        Alert.alert("Success", "Vehicle details submitted successfully");
      }
    } catch (err) {
      console.log("Submit error:", err);
      Alert.alert("Error", "Failed to submit vehicle details");
    } finally {
      setLoading(false);
    }
  };

  // ─── Formik ────────────────────────────────────────────────────────────────
  const vehicleFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      vehicleNo: "",
      vehicleType: "",
      capacity: "",
      permitNo: "",
      grossWeight: "",
      unladenWeight: "",
      nightHaltPlace: "",
      chassisNo: "",
      rcExpiryDate: "",
      pucExpiryDate: "",
      permitExpiryDate: "",
      gpsVendor: "",
      gpsImeiNo: "",
      gpsSimNo: "",
      vehicleRcCopy: null,
      pucCertificate: null,
      permitDocument: null,
      gpsImage: null,
      vehicleFrontPhoto: null,
      vehicleDiagonalPhoto: null,
      vehicleBackPhoto: null,
    },
    validationSchema: buildValidationSchema(isFieldRequired),
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: (values) => {
      HandleSubmit(values);
    },
    context: {
      isFieldRequired,
    },
  });

  const {
    values,
    errors,
    touched,
    handleBlur,
    setFieldValue,
    setTouched,
    handleSubmit,
    resetForm,
  } = vehicleFormik;

  // ─── Date handlers ─────────────────────────────────────────────────────────
  const handleDateChange = (event, selectedDate, fieldName) => {
    setShowDatePicker((prev) => ({ ...prev, [fieldName]: false }));
    if (event?.type === "dismissed") return;
    if (selectedDate) {
      const formatted = moment(selectedDate).format("YYYY-MM-DD");
      setFieldValue(fieldName, formatted);
      setTouched({ ...touched, [fieldName]: true });
    }
  };

  const showDatePickerFor = (fieldName) => {
    setShowDatePicker((prev) => ({ ...prev, [fieldName]: true }));
  };

  // ─── Upload helper ─────────────────────────────────────────────────────────
  const handleFileUpload = (fieldName, mode = "camera") => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));

    // Build a minimal formik-like object — DO NOT pass the full vehicleFormik
    const formikLike = {
      values: values,
      setFieldValue: (field, value) => {
        setFieldValue(field, value);
      },
    };

    ImageBucketRN(formikLike, UPLOAD_PATH, fieldName, 20971520, mode, dispatch);
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="car" size={24} color="#1e3a5f" />
            <Text style={styles.cardTitle}>
              {isFieldRequired ? "Add Vehicle" : "FlyAsh Add Vehicle"}
            </Text>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.panel}>
              <View style={styles.panelHeaderStyle}>
                <Text style={styles.panelHeaderText}>APEMCL</Text>
              </View>

              <View style={styles.panelBody}>
                <TextField
                  label="Vehicle Registration Number"
                  value={values.vehicleNo}
                  onChangeText={(t) => setFieldValue("vehicleNo", t)}
                  onBlur={handleBlur("vehicleNo")}
                  placeholder="Enter Vehicle Number"
                  error={errors.vehicleNo}
                  touched={touched.vehicleNo}
                  isRequired={isFieldRequired}
                  maxLength={10}
                  textTransform="uppercase"
                  editable={!loading}
                />

                <PickerField
                  label="Type of Vehicle"
                  value={values.vehicleType}
                  onSelect={(v) => {
                    setFieldValue("vehicleType", v);
                    setTouched({ ...touched, vehicleType: true });
                  }}
                  options={vehicleTypes.map((vv) => ({
                    label: vv.name,
                    value: String(vv.id),
                  }))}
                  placeholder={isLoadingVehicles ? "Loading..." : "Select"}
                  error={errors.vehicleType}
                  touched={touched.vehicleType}
                  isRequired={isFieldRequired}
                  disabled={loading || isLoadingVehicles}
                />

                <TextField
                  label="Gross Weight"
                  value={values.grossWeight}
                  onChangeText={(t) => setFieldValue("grossWeight", t)}
                  onBlur={handleBlur("grossWeight")}
                  placeholder="Enter Gross Weight"
                  error={errors.grossWeight}
                  touched={touched.grossWeight}
                  isRequired={false}
                  maxLength={2}
                  numericOnly
                  editable={!loading}
                />

                <TextField
                  label="Unladen Weight"
                  value={values.unladenWeight}
                  onChangeText={(t) => setFieldValue("unladenWeight", t)}
                  onBlur={handleBlur("unladenWeight")}
                  placeholder="Enter Unladen Weight"
                  error={errors.unladenWeight}
                  touched={touched.unladenWeight}
                  isRequired={false}
                  maxLength={2}
                  numericOnly
                  editable={!loading}
                />

                <TextField
                  label="Capacity (Tonnes)"
                  value={values.capacity}
                  onChangeText={(t) => setFieldValue("capacity", t)}
                  onBlur={handleBlur("capacity")}
                  placeholder="Enter Capacity"
                  error={errors.capacity}
                  touched={touched.capacity}
                  isRequired={isFieldRequired}
                  maxLength={2}
                  numericOnly
                  editable={!loading}
                />

                <TextField
                  label="Night Halt Place"
                  value={values.nightHaltPlace}
                  onChangeText={(t) => setFieldValue("nightHaltPlace", t)}
                  onBlur={handleBlur("nightHaltPlace")}
                  placeholder="Enter Night Halt Place"
                  error={errors.nightHaltPlace}
                  touched={touched.nightHaltPlace}
                  isRequired={false}
                  maxLength={20}
                  editable={!loading}
                />

                <TextField
                  label="Vehicle Permit No"
                  value={values.permitNo}
                  onChangeText={(t) => setFieldValue("permitNo", t)}
                  onBlur={handleBlur("permitNo")}
                  placeholder="Enter Vehicle Permit No"
                  error={errors.permitNo}
                  touched={touched.permitNo}
                  isRequired={isFieldRequired}
                  maxLength={30}
                  textTransform="uppercase"
                  editable={!loading}
                />

                <TextField
                  label="Chassis Number"
                  value={values.chassisNo}
                  onChangeText={(t) => setFieldValue("chassisNo", t)}
                  onBlur={handleBlur("chassisNo")}
                  placeholder="Enter Chassis Number"
                  error={errors.chassisNo}
                  touched={touched.chassisNo}
                  isRequired={isFieldRequired}
                  maxLength={17}
                  textTransform="uppercase"
                  alphaNumericOnly
                  editable={!loading}
                />

                <DateField
                  label="RC Expiry Date"
                  value={values.rcExpiryDate}
                  placeholder="Select RC Expiry Date"
                  error={errors.rcExpiryDate}
                  touched={touched.rcExpiryDate}
                  isRequired={isFieldRequired}
                  showPicker={showDatePicker.rcExpiryDate}
                  onOpenPicker={() => showDatePickerFor("rcExpiryDate")}
                  onPickerChange={(event, date) =>
                    handleDateChange(event, date, "rcExpiryDate")
                  }
                  editable={!loading}
                />

                {/* ─── Vehicle RC Copy Upload ───────────────────────────── */}
                <FileUploadField
                  label="Vehicle RC Copy"
                  value={values.vehicleRcCopy}
                  error={errors.vehicleRcCopy}
                  touched={touched.vehicleRcCopy}
                  isRequired={isFieldRequired}
                >
                  <TouchableOpacity
                    style={[
                      styles.uploadButton,
                      errors.vehicleRcCopy &&
                        touched.vehicleRcCopy &&
                        styles.inputError,
                    ]}
                    disabled={loading}
                    onPress={() => handleFileUpload("vehicleRcCopy", "camera")}
                  >
                    <Text style={styles.uploadButtonText}>
                      {values.vehicleRcCopy
                        ? "✓ File Selected (Tap to change)"
                        : "📎 Upload Vehicle RC Copy"}
                    </Text>
                  </TouchableOpacity>
                </FileUploadField>

                <DateField
                  label="PUC Expiry Date"
                  value={values.pucExpiryDate}
                  placeholder="Select PUC Expiry Date"
                  error={errors.pucExpiryDate}
                  touched={touched.pucExpiryDate}
                  isRequired={isFieldRequired}
                  showPicker={showDatePicker.pucExpiryDate}
                  onOpenPicker={() => showDatePickerFor("pucExpiryDate")}
                  onPickerChange={(event, date) =>
                    handleDateChange(event, date, "pucExpiryDate")
                  }
                  editable={!loading}
                />

                {/* ─── PUC Certificate Upload ───────────────────────────── */}
                <FileUploadField
                  label="PUC Certificate"
                  value={values.pucCertificate}
                  error={errors.pucCertificate}
                  touched={touched.pucCertificate}
                  isRequired={isFieldRequired}
                >
                  <TouchableOpacity
                    style={[
                      styles.uploadButton,
                      errors.pucCertificate &&
                        touched.pucCertificate &&
                        styles.inputError,
                    ]}
                    disabled={loading}
                    onPress={() => {
                      setTouched({ ...touched, pucCertificate: true });

                      ImageBucketRN(
                        vehicleFormik,
                        UPLOAD_PATH,
                        "pucCertificate",
                        20971520,
                        "camera",
                        dispatch,
                      );
                    }}
                  >
                    <Text style={styles.uploadButtonText}>
                      {values.pucCertificate
                        ? "✓ File Selected (Tap to change)"
                        : "📎 Upload PUC Certificate"}
                    </Text>
                  </TouchableOpacity>
                </FileUploadField>

                <DateField
                  label="Permit Expiry Date"
                  value={values.permitExpiryDate}
                  placeholder="Select Permit Expiry Date"
                  error={errors.permitExpiryDate}
                  touched={touched.permitExpiryDate}
                  isRequired={isFieldRequired}
                  showPicker={showDatePicker.permitExpiryDate}
                  onOpenPicker={() => showDatePickerFor("permitExpiryDate")}
                  onPickerChange={(event, date) =>
                    handleDateChange(event, date, "permitExpiryDate")
                  }
                  editable={!loading}
                />

                {/* ─── Permit Document Upload ───────────────────────────── */}
                <FileUploadField
                  label="Permit Document"
                  value={values.permitDocument}
                  error={errors.permitDocument}
                  touched={touched.permitDocument}
                  isRequired={isFieldRequired}
                >
                  <TouchableOpacity
                    style={[
                      styles.uploadButton,
                      errors.permitDocument &&
                        touched.permitDocument &&
                        styles.inputError,
                    ]}
                    disabled={loading}
                    onPress={() => {
                      setTouched({ ...touched, permitDocument: true });

                      const formikLike = {
                        values: values,
                        setFieldValue: (field, value) => {
                          setFieldValue(field, value);
                        },
                      };

                      ImageBucketRN(
                        formikLike,
                        UPLOAD_PATH,
                        "permitDocument",
                        20971520,
                        "all",
                        dispatch,
                      );
                    }}
                  >
                    <Text style={styles.uploadButtonText}>
                      {values.permitDocument
                        ? "✓ File Selected (Tap to change)"
                        : "📎 Upload Permit Document"}
                    </Text>
                  </TouchableOpacity>
                </FileUploadField>

                <PickerField
                  label="GPS Vendor"
                  value={values.gpsVendor}
                  onSelect={(v) => {
                    setFieldValue("gpsVendor", v);
                    setTouched({ ...touched, gpsVendor: true });
                  }}
                  options={[
                    { label: "Acute", value: "1" },
                    { label: "BlackBox", value: "2" },
                    { label: "RDME", value: "3" },
                    { label: "Atlanta", value: "4" },
                    { label: "Arya-Omnitalk", value: "5" },
                    { label: "Amaravathi", value: "6" },
                    { label: "MapMyIndia", value: "7" },
                  ]}
                  placeholder="Select GPS Vendor"
                  error={errors.gpsVendor}
                  touched={touched.gpsVendor}
                  isRequired={isFieldRequired}
                  disabled={loading}
                />

                <TextField
                  label="GPS Device IMEI No"
                  value={values.gpsImeiNo}
                  onChangeText={(t) => setFieldValue("gpsImeiNo", t)}
                  onBlur={handleBlur("gpsImeiNo")}
                  placeholder="Enter GPS Device IMEI No"
                  error={errors.gpsImeiNo}
                  touched={touched.gpsImeiNo}
                  isRequired={isFieldRequired}
                  maxLength={19}
                  numericOnly
                  editable={!loading}
                />

                <TextField
                  label="Sim Number"
                  value={values.gpsSimNo}
                  onChangeText={(t) => setFieldValue("gpsSimNo", t)}
                  onBlur={handleBlur("gpsSimNo")}
                  placeholder="Enter Sim Number"
                  error={errors.gpsSimNo}
                  touched={touched.gpsSimNo}
                  isRequired={isFieldRequired}
                  maxLength={15}
                  numericOnly
                  editable={!loading}
                />

                {/* ─── GPS Device Image Upload ──────────────────────────── */}
                <FileUploadField
                  label="GPS Device Image"
                  value={values.gpsImage}
                  error={errors.gpsImage}
                  touched={touched.gpsImage}
                  isRequired={isFieldRequired}
                >
                  <TouchableOpacity
                    style={[
                      styles.uploadButton,
                      errors.gpsImage && touched.gpsImage && styles.inputError,
                    ]}
                    disabled={loading}
                    onPress={() => {
                      setTouched({ ...touched, gpsImage: true });

                      const formikLike = {
                        values: values,
                        setFieldValue: (field, value) => {
                          setFieldValue(field, value);
                        },
                      };

                      ImageBucketRN(
                        formikLike,
                        UPLOAD_PATH,
                        "gpsImage",
                        20971520,
                        "camera",
                        dispatch,
                      );
                    }}
                  >
                    <Text style={styles.uploadButtonText}>
                      {values.gpsImage
                        ? "✓ File Selected (Tap to change)"
                        : "📎 Upload GPS Device Image"}
                    </Text>
                  </TouchableOpacity>
                </FileUploadField>

                <View style={styles.divider} />

                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    Color Photographs of Vehicles
                  </Text>
                </View>

                {/* ─── Front View Photo Upload ──────────────────────────── */}
                <FileUploadField
                  label="Front View"
                  value={values.vehicleFrontPhoto}
                  error={errors.vehicleFrontPhoto}
                  touched={touched.vehicleFrontPhoto}
                  isRequired={isFieldRequired}
                >
                  <TouchableOpacity
                    style={[
                      styles.uploadButton,
                      errors.vehicleFrontPhoto &&
                        touched.vehicleFrontPhoto &&
                        styles.inputError,
                    ]}
                    disabled={loading}
                    onPress={() => {
                      setTouched({ ...touched, vehicleFrontPhoto: true });

                      const formikLike = {
                        values: values,
                        setFieldValue: (field, value) => {
                          setFieldValue(field, value);
                        },
                      };

                      ImageBucketRN(
                        formikLike,
                        UPLOAD_PATH,
                        "vehicleFrontPhoto",
                        20971520,
                        "camera",
                        dispatch,
                      );
                    }}
                  >
                    <Text style={styles.uploadButtonText}>
                      {values.vehicleFrontPhoto
                        ? "✓ Photo Selected (Tap to change)"
                        : "📷 Upload Front View Photo"}
                    </Text>
                  </TouchableOpacity>
                </FileUploadField>

                {/* ─── Diagonal View Photo Upload ───────────────────────── */}
                <FileUploadField
                  label="Diagonal View"
                  value={values.vehicleDiagonalPhoto}
                  error={errors.vehicleDiagonalPhoto}
                  touched={touched.vehicleDiagonalPhoto}
                  isRequired={isFieldRequired}
                >
                  <TouchableOpacity
                    style={[
                      styles.uploadButton,
                      errors.vehicleDiagonalPhoto &&
                        touched.vehicleDiagonalPhoto &&
                        styles.inputError,
                    ]}
                    disabled={loading}
                    onPress={() => {
                      setTouched({ ...touched, vehicleDiagonalPhoto: true });

                      const formikLike = {
                        values: values,
                        setFieldValue: (field, value) => {
                          setFieldValue(field, value);
                        },
                      };

                      ImageBucketRN(
                        formikLike,
                        UPLOAD_PATH,
                        "vehicleDiagonalPhoto",
                        20971520,
                        "camera",
                        dispatch,
                      );
                    }}
                  >
                    <Text style={styles.uploadButtonText}>
                      {values.vehicleDiagonalPhoto
                        ? "✓ Photo Selected (Tap to change)"
                        : "📷 Upload Diagonal View Photo"}
                    </Text>
                  </TouchableOpacity>
                </FileUploadField>

                {/* ─── Back View Photo Upload ───────────────────────────── */}
                <FileUploadField
                  label="Back View"
                  value={values.vehicleBackPhoto}
                  error={errors.vehicleBackPhoto}
                  touched={touched.vehicleBackPhoto}
                  isRequired={isFieldRequired}
                >
                  <TouchableOpacity
                    style={[
                      styles.uploadButton,
                      errors.vehicleBackPhoto &&
                        touched.vehicleBackPhoto &&
                        styles.inputError,
                    ]}
                    disabled={loading}
                    onPress={() => {
                      setTouched({ ...touched, vehicleBackPhoto: true });

                      const formikLike = {
                        values: values,
                        setFieldValue: (field, value) => {
                          setFieldValue(field, value);
                        },
                      };

                      ImageBucketRN(
                        formikLike,
                        UPLOAD_PATH,
                        "vehicleBackPhoto",
                        20971520,
                        "camera",
                        dispatch,
                      );
                    }}
                  >
                    <Text style={styles.uploadButtonText}>
                      {values.vehicleBackPhoto
                        ? "✓ Photo Selected (Tap to change)"
                        : "📷 Upload Back View Photo"}
                    </Text>
                  </TouchableOpacity>
                </FileUploadField>

                <View style={styles.noteContainer}>
                  <Ionicons
                    name="information-circle-outline"
                    size={20}
                    color="#856404"
                  />
                  <Text style={styles.noteText}>
                    <Text style={styles.noteBold}>Note:</Text> For Front and
                    Back view photos, make sure the vehicle registration number
                    is clearly visible and readable.
                  </Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    loading && styles.disabledButton,
                  ]}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      ✓ Submit Vehicle Details
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 16 },
  scrollView: { flex: 1 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flex: 1,
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
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
  cardBody: { padding: 16, flex: 1 },

  panel: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e8ecf1",
    borderRadius: 8,
    overflow: "hidden",
  },
  panelHeaderStyle: { backgroundColor: "#2e7d32", padding: 12 },
  panelHeaderText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  panelBody: { padding: 16 },

  // Form
  formGroup: { marginBottom: 16 },
  label: { fontSize: 14, color: "#333", marginBottom: 4 },
  star: { color: "red" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: "#fff",
    minHeight: 44,
    color: "#333",
  },
  inputError: { borderColor: "red", borderWidth: 2 },
  dateInput: { justifyContent: "center" },
  dateText: { fontSize: 14, color: "#333" },
  placeholderText: { color: "#999" },
  errorText: { color: "red", fontSize: 12, marginTop: 4 },

  // File upload
  uploadButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f9f9f9",
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  uploadButtonText: { color: "#555", fontSize: 14, fontWeight: "500" },
  previewWrap: { marginTop: 10, alignItems: "center" },
  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  pdfRow: { flexDirection: "row", alignItems: "center" },
  pdfText: { marginLeft: 8, color: "blue" },
  fileNameText: {
    color: "green",
    fontSize: 12,
    textDecorationLine: "underline",
    marginTop: 4,
  },

  divider: { height: 1, backgroundColor: "#e8ecf1", marginVertical: 16 },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#2e7d32" },

  noteContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    padding: 12,
    backgroundColor: "#fff3cd",
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#ffc107",
  },
  noteText: {
    fontSize: 12,
    color: "#856404",
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  noteBold: { fontWeight: "bold", color: "#856404" },

  submitButton: {
    backgroundColor: "#28a745",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  disabledButton: { opacity: 0.7 },
  submitButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  // Dropdown
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    backgroundColor: "#fff",
  },
  dropdownDisabled: { backgroundColor: "#f0f0f0" },
  dropdownButtonText: { fontSize: 14, color: "#333", flex: 1 },
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
    maxHeight: "80%",
    minHeight: 300,
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
  dropdownListWrapper: { flex: 1, minHeight: 100, maxHeight: 300 },
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
  dropdownOptionSelected: { backgroundColor: "#e8f5e9" },
  dropdownOptionText: { fontSize: 14, color: "#333", flex: 1, marginRight: 8 },
  dropdownOptionTextSelected: { color: "#2e7d32", fontWeight: "600" },
});

export default AddVehicle;
