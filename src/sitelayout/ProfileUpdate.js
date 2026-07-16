import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Image,
  Linking,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { FieldArray, FormikProvider, useFormik } from "formik";
import * as Yup from "yup";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";

import { login } from "../actions";
import {
  BASICPROFILE,
  commonAPICall,
  DIGITALLABOURCHOWKDETAILS,
  GETDISTSAPP,
  GETMANDALSAPP,
  GETSKILLS,
  GETVILLAGESAPP,
} from "../utils/utils";
import { profileMenu } from "../utils/CommonFunctions";
import ImageBucketRN from "../utils/ImageBucketRN";
import OldProfileUpdate from "./OldProfileUpdate";
import { globalStyes } from "../screens/GlobalStyles";

// ==================== Basic Details Component ====================

const BasicDetails = ({ userData, onUpdateSuccess }) => {
  const dispatch = useDispatch();
  const state = useSelector((state) => state.LoginReducer);

  const [showDatePicker, setShowDatePicker] = useState(false);

  const employerTypes = [
    { id: 1, label: "Individual / వ్యక్తిగత" },
    { id: 2, label: "Contractor / కాంట్రాక్టర్" },
    { id: 3, label: "Company / కంపెనీ" },
    { id: 4, label: "Agency / ఏజెన్సీ" },
  ];

  const validationSchema = Yup.object().shape({
    fullName: Yup.string().required("Required / అవసరం"),
    mobileNumber: Yup.string().required("Required / అవసరం"),
    // email: Yup.string().required("Required / అవసరం"),
    dateOfBirth: Yup.string()
      .required("Required / అవసరం")
      .test(
        "age-18",
        "You must be at least 18 years old / మీరు కనీసం 18 సంవత్సరాలు ఉండాలి",
        function (value) {
          if (!value) return false;

          const [day, month, year] = value.split("-");
          const dob = new Date(`${year}-${month}-${day}`);
          const today = new Date();

          let age = today.getFullYear() - dob.getFullYear();
          const monthDiff = today.getMonth() - dob.getMonth();

          // adjust age if birthday not yet occurred this year
          if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < dob.getDate())
          ) {
            age--;
          }

          return age >= 18;
        },
      ),
    gender: Yup.string().required("Required / అవసరం"),
    employerTypeId: Yup.string().when([], {
      is: () => state.roleName === "DLC Employer",
      then: (schema) => schema.required("Required / అవసరం"),
      otherwise: (schema) => schema.notRequired(),
    }),
  });

  const formatDateForPicker = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  const formatDate = (date) => {
    if (!date) return "";

    const parts = date.split("-");
    if (parts.length !== 3) return date;

    let day, month, year;

    // detect format
    if (parts[0].length === 4) {
      // YYYY-MM-DD
      [year, month, day] = parts;
    } else {
      // DD-MM-YYYY
      [day, month, year] = parts;
    }

    // ensure 2-digit day & month
    day = day.padStart(2, "0");
    month = month.padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      fullName: userData?.full_name || "",
      dateOfBirth: userData?.date_of_birth,
      gender: userData?.gender || "",
      mobileNumber: userData?.mobile_number || "",
      email: userData?.email || "",
      profileImage: userData?.profile_image || "base64imageorURL",
      userType: state.roleName,
      stageName: "BASIC_INFO",
      employerTypeId: userData?.employer_type_id
        ? String(userData.employer_type_id)
        : "",
    },
    validationSchema,
    onSubmit: handleSubmit,
  });

  async function handleSubmit(values, { setSubmitting }) {
    try {
      const payload = {
        ...values,
        dateOfBirth: formatDate(values.dateOfBirth),
        employerTypeId: values.employerTypeId
          ? Number(values.employerTypeId)
          : "",
      };

      const response = await commonAPICall(
        BASICPROFILE,
        payload,
        "POST",
        dispatch,
      );

      if (response?.status === 200) {
        onUpdateSuccess?.(); // refresh parent data
      }
    } catch (error) {
      console.log("Error:", error);
    } finally {
      setSubmitting(false);
    }
  }

  const showEmployerType = state.roleName === "DLC Employer";

  const reverseDate = (date) => {
    if (!date) return "";

    const parts = date.split(/[-/]/);
    if (parts.length !== 3) return date;

    let day, month, year;

    if (parts[0].length === 4) {
      // YYYY-MM-DD
      [year, month, day] = parts;
    } else {
      // DD-MM-YYYY
      [day, month, year] = parts;
    }

    return `${String(day).padStart(2, "0")}-${String(month).padStart(2, "0")}-${year}`;
  };

  return (
    <FormikProvider value={formik}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            Basic Details / ప్రాథమిక వివరాలు
          </Text>

          <View style={styles.inputBlock}>
            <Text style={styles.label}>
              Full Name / పూర్తి పేరు <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                formik.errors.fullName &&
                  formik.touched.fullName &&
                  styles.inputError,
              ]}
              value={formik.values.fullName}
              onChangeText={formik.handleChange("fullName")}
              onBlur={formik.handleBlur("fullName")}
              placeholder="Enter full name / పూర్తి పేరు నమోదు చేయండి"
            />
            {formik.errors.fullName && formik.touched.fullName && (
              <Text style={styles.errorText}>{formik.errors.fullName}</Text>
            )}
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.label}>
              Date of Birth / పుట్టిన తేదీ{" "}
              <Text style={styles.requiredStar}>*</Text>
            </Text>

            <TouchableOpacity
              style={[
                styles.datePickerButton,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                },
                formik.errors.dateOfBirth &&
                  formik.touched.dateOfBirth && {
                    borderColor: "red",
                  },
              ]}
              onPress={() => {
                formik.setFieldTouched("dateOfBirth", true);
                setShowDatePicker(true);
              }}
            >
              <Text>
                {reverseDate(formik.values.dateOfBirth) ||
                  "Select Date of Birth / పుట్టిన తేదీని ఎంచుకోండి"}
              </Text>{" "}
              <Ionicons name="calendar-outline" size={20} />
            </TouchableOpacity>

            {formik.errors.dateOfBirth && formik.touched.dateOfBirth && (
              <Text style={styles.errorText}>{formik.errors.dateOfBirth}</Text>
            )}

            {showDatePicker && (
              <DateTimePicker
                value={
                  formik.values.dateOfBirth
                    ? new Date(formatDateForPicker(formik.values.dateOfBirth))
                    : new Date()
                }
                mode="date"
                display="default"
                maximumDate={new Date()}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);

                  if (selectedDate) {
                    const day = String(selectedDate.getDate()).padStart(2, "0");
                    const month = String(selectedDate.getMonth() + 1).padStart(
                      2,
                      "0",
                    );
                    const year = selectedDate.getFullYear();

                    const formatted = `${day}-${month}-${year}`;
                    formik.setFieldValue("dateOfBirth", formatted);
                  }
                }}
              />
            )}
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.label}>
              Gender / లింగం <Text style={styles.requiredStar}>*</Text>
            </Text>

            <View style={styles.radioRow}>
              {["MALE", "FEMALE", "OTHER"].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={styles.radioItem}
                  onPress={() => {
                    formik.setFieldTouched("gender", true);
                    formik.setFieldValue("gender", g);
                  }}
                >
                  <Ionicons
                    name={
                      formik.values.gender === g
                        ? "radio-button-on"
                        : "radio-button-off"
                    }
                    size={22}
                  />
                  <Text>
                    {g === "MALE"
                      ? "MALE / పురుషుడు"
                      : g === "FEMALE"
                        ? "FEMALE / స్త్రీ"
                        : "OTHER / ఇతర"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {formik.errors.gender && formik.touched.gender && (
              <Text style={styles.errorText}>{formik.errors.gender}</Text>
            )}
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.label}>
              Mobile Number / మొబైల్ నంబర్{" "}
              <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                formik.errors.mobileNumber &&
                  formik.touched.mobileNumber &&
                  styles.inputError,
              ]}
              value={formik.values.mobileNumber}
              onChangeText={formik.handleChange("mobileNumber")}
              onBlur={formik.handleBlur("mobileNumber")}
              keyboardType="phone-pad"
              placeholder="Enter mobile number / మొబైల్ నంబర్ నమోదు చేయండి"
              maxLength={10}
            />
            {formik.errors.mobileNumber && formik.touched.mobileNumber && (
              <Text style={styles.errorText}>{formik.errors.mobileNumber}</Text>
            )}
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.label}>
              Email / ఇమెయిల్ <Text style={styles.requiredStar}></Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                formik.errors.email &&
                  formik.touched.email &&
                  styles.inputError,
              ]}
              value={formik.values.email}
              onChangeText={formik.handleChange("email")}
              onBlur={formik.handleBlur("email")}
              placeholder="Enter email / ఇమెయిల్ నమోదు చేయండి"
              keyboardType="email-address"
            />
            {formik.errors.email && formik.touched.email && (
              <Text style={styles.errorText}>{formik.errors.email}</Text>
            )}
          </View>

          {showEmployerType && (
            <View style={styles.inputBlock}>
              <Text style={styles.label}>
                Employer Type / యజమాని రకం{" "}
                <Text style={styles.requiredStar}>*</Text>
              </Text>
              <View
                style={[
                  globalStyes.selectBox,
                  formik.errors.employerTypeId &&
                    formik.touched.employerTypeId &&
                    styles.inputError,
                ]}
              >
                <Picker
                  style={globalStyes.pickerText}
                  selectedValue={formik.values.employerTypeId}
                  onValueChange={(itemValue) => {
                    formik.setFieldTouched("employerTypeId", true);
                    formik.setFieldValue("employerTypeId", String(itemValue));
                  }}
                >
                  <Picker.Item
                    label="Select Employer Type / యజమాని రకాన్ని ఎంచుకోండి"
                    value=""
                  />
                  {employerTypes.map((type) => (
                    <Picker.Item
                      key={type.id}
                      label={type.label}
                      value={String(type.id)}
                    />
                  ))}
                </Picker>
              </View>
              {formik.errors.employerTypeId &&
                formik.touched.employerTypeId && (
                  <Text style={styles.errorText}>
                    {formik.errors.employerTypeId}
                  </Text>
                )}
            </View>
          )}

          <TouchableOpacity
            style={styles.submitButton}
            onPress={formik.handleSubmit}
            disabled={formik.isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {formik.isSubmitting
                ? "UPDATING... / అప్డేట్ చేస్తోంది..."
                : "UPDATE PROFILE / ప్రొఫైల్ అప్డేట్ చేయండి"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </FormikProvider>
  );
};
// ==================== Identity Verification Component ====================

const IdentityVerification = ({ userData, onUpdateSuccess }) => {
  const state = useSelector((state) => state.LoginReducer);
  const dispatch = useDispatch();

  const showLabourLicence = state.roleName === "DLC Employer";
  const conditionalFieldName = showLabourLicence
    ? "labourLicence"
    : "eshramCardNumber";
  const conditionalFieldLabel = showLabourLicence
    ? "Labour Licence Number / లేబర్ లైసెన్స్ నంబర్"
    : "e-Shram Card Number / ఇ-శ్రమ్ కార్డ్ నంబర్";

  const validationSchema = Yup.object().shape({
    documentType: Yup.string().required("Required / అవసరం"),

    documentNumber: Yup.string()
      .required("Required / అవసరం")
      .test(
        "doc-validation",
        "Invalid Document Number / తప్పు డాక్యుమెంట్ నంబర్",
        function (value) {
          const { documentType } = this.parent;

          if (!value) return false;

          switch (documentType) {
            case "PAN":
              return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value);

            case "AADHAR":
              return /^[0-9]{12}$/.test(value);

            case "DRIVING_LICENSE":
              return /^[A-Z0-9]{8,16}$/.test(value);

            case "VOTER_ID":
              return /^[A-Z]{3}[0-9]{7}$/.test(value);

            default:
              return true;
          }
        },
      ),
    uploadDocument: Yup.string().required("Required / అవసరం"),
    [conditionalFieldName]: Yup.string().required("Required / అవసరం"),
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      userType: state.roleName,
      stageName: "DOCUMENT_VERIFICATION",
      documentType: userData?.document_type || "",
      documentNumber: userData?.document_number || "",
      uploadDocument: userData?.upload_document || "",
      [conditionalFieldName]: showLabourLicence
        ? userData?.labour_licence || ""
        : userData?.e_shram_card_number || "",
    },
    validationSchema,
    onSubmit: handleSubmit,
  });

  async function handleSubmit(values, { setSubmitting }) {
    try {
      const response = await commonAPICall(
        BASICPROFILE,
        values,
        "POST",
        dispatch,
      );

      if (response?.status === 200) {
        const updatedPayload = {
          ...state,
          isProfileUpdated: "Y",
        };
        // dispatch(login(updatedPayload));

        onUpdateSuccess?.(); // refresh latest profile data from parent
      }
    } catch (error) {
      console.log("Error:", error);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <FormikProvider value={formik}>
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>
          Identity & Verification / గుర్తింపు & ధృవీకరణ
        </Text>

        <View style={styles.inputBlock}>
          <Text style={styles.label}>
            Document Type / డాక్యుమెంట్ రకం{" "}
            <Text style={styles.requiredStar}>*</Text>
          </Text>
          <View
            style={[
              globalStyes.selectBox,
              formik.errors.documentType &&
                formik.touched.documentType &&
                styles.inputError,
            ]}
          >
            <Picker
              style={globalStyes.pickerText}
              selectedValue={formik.values.documentType}
              onValueChange={(itemValue) => {
                formik.setFieldTouched("documentType", true);
                formik.setFieldValue("documentType", itemValue);
                formik.setFieldValue("documentNumber", ""); //
              }}
              enabled={!formik.isSubmitting}
            >
              <Picker.Item
                label="Select Document Type / డాక్యుమెంట్ రకాన్ని ఎంచుకోండి"
                value=""
              />
              <Picker.Item label="PAN / పాన్" value="PAN" />
              <Picker.Item
                label="Driving License / డ్రైవింగ్ లైసెన్స్"
                value="DRIVING_LICENSE"
              />
              <Picker.Item label="Voter ID / ఓటరు ID" value="VOTER_ID" />
              <Picker.Item label="Aadhar / అధార్" value="AADHAR" />
            </Picker>
          </View>
          {formik.errors.documentType && formik.touched.documentType && (
            <Text style={styles.errorText}>{formik.errors.documentType}</Text>
          )}
        </View>

        <View style={styles.inputBlock}>
          <Text style={styles.label}>
            Document Number / డాక్యుమెంట్ నంబర్{" "}
            <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              formik.errors.documentNumber &&
                formik.touched.documentNumber &&
                styles.inputError,
            ]}
            value={formik.values.documentNumber}
            onChangeText={formik.handleChange("documentNumber")}
            onBlur={formik.handleBlur("documentNumber")}
            placeholder="Enter Document Number / డాక్యుమెంట్ నంబర్ నమోదు చేయండి"
            editable={!formik.isSubmitting}
          />
          {formik.errors.documentNumber && formik.touched.documentNumber && (
            <Text style={styles.errorText}>{formik.errors.documentNumber}</Text>
          )}
        </View>

        <View style={styles.inputBlock}>
          <Text style={styles.label}>
            Upload Document / డాక్యుమెంట్ అప్లోడ్ చేయండి{" "}
            <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TouchableOpacity
            style={[
              styles.uploadButton,
              formik.errors.uploadDocument &&
                formik.touched.uploadDocument &&
                styles.inputError,
            ]}
            onPress={() => {
              formik.setFieldTouched("uploadDocument", true);

              let path = "APFD/SAWMILLS/";

              ImageBucketRN(
                formik,
                path,
                "uploadDocument",
                20971520, // 20MB
              );
            }}
          >
            <Text style={styles.uploadButtonText}>
              Upload Document / డాక్యుమెంట్ అప్లోడ్ చేయండి
            </Text>
          </TouchableOpacity>
          <View style={{ alignItems: "center" }}>
            {formik.values.uploadDocument
              ? (() => {
                  const fileUrl = formik.values.uploadDocument;

                  const isImage = /\.(jpg|jpeg|png)$/i.test(fileUrl);
                  const isPdf = /\.pdf$/i.test(fileUrl);

                  // ✅ IMAGE PREVIEW
                  if (isImage) {
                    return (
                      <View style={{ marginTop: 10 }}>
                        <Image
                          source={{ uri: fileUrl }}
                          style={{
                            width: 120,
                            height: 120,
                            borderRadius: 8,
                            resizeMode: "cover",
                          }}
                        />
                      </View>
                    );
                  }

                  // ✅ PDF DOWNLOAD ICON
                  if (isPdf) {
                    return (
                      <TouchableOpacity
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginTop: 10,
                        }}
                        onPress={() => Linking.openURL(fileUrl)}
                      >
                        <Ionicons
                          name="document-text-outline"
                          size={24}
                          color="red"
                        />
                        <Text style={{ marginLeft: 8, color: "blue" }}>
                          Download PDF
                        </Text>
                      </TouchableOpacity>
                    );
                  }

                  // ✅ DEFAULT (other files)
                  return <Text style={styles.fileNameText}>{fileUrl}</Text>;
                })()
              : null}
          </View>

          {formik.values.image_location && (
            <View
              style={{
                marginTop: 10,
                padding: 10,
                backgroundColor: "#f5f5f5",
                borderRadius: 8,
                width: "90%",
              }}
            >
              {/* Location Icon + Title */}
              <Text style={{ fontWeight: "bold", marginBottom: 5 }}>
                📍 Location Details
              </Text>

              {/* Address */}
              <Text style={{ fontSize: 13 }}>
                {formik.values.image_location.street},{"\n"}
                {formik.values.image_location.city},{"\n"}
                {formik.values.image_location.state} -{" "}
                {formik.values.image_location.pincode}
              </Text>

              {/* Lat Long (small & subtle) */}
              <Text style={{ fontSize: 11, color: "gray", marginTop: 5 }}>
                Lat: {formik.values.image_location.lat} | Lng:{" "}
                {formik.values.image_location.lng}
              </Text>
            </View>
          )}

          {formik.errors.uploadDocument && formik.touched.uploadDocument && (
            <Text style={styles.errorText}>{formik.errors.uploadDocument}</Text>
          )}
        </View>

        <View style={styles.inputBlock}>
          <Text style={styles.label}>
            {conditionalFieldLabel} <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              formik.errors[conditionalFieldName] &&
                formik.touched[conditionalFieldName] &&
                styles.inputError,
            ]}
            value={formik.values[conditionalFieldName]}
            onChangeText={formik.handleChange(conditionalFieldName)}
            onBlur={formik.handleBlur(conditionalFieldName)}
            placeholder={`Enter ${conditionalFieldLabel} / ${conditionalFieldLabel} నమోదు చేయండి`}
            editable={!formik.isSubmitting}
          />
          {formik.errors[conditionalFieldName] &&
            formik.touched[conditionalFieldName] && (
              <Text style={styles.errorText}>
                {formik.errors[conditionalFieldName]}
              </Text>
            )}
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            formik.isSubmitting && styles.disabledButton,
          ]}
          onPress={formik.handleSubmit}
          disabled={formik.isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {formik.isSubmitting
              ? "SAVING... / సేవ్ చేస్తోంది..."
              : "SAVE / సేవ్ చేయండి"}
          </Text>
        </TouchableOpacity>
      </View>
    </FormikProvider>
  );
};
// ==================== Location Information Component ====================

const LocationInformation = ({ userData, onUpdateSuccess }) => {
  const state = useSelector((state) => state.LoginReducer);
  const dispatch = useDispatch();

  const [dists, setDists] = useState([]);
  const [mandal, setMandal] = useState([]);
  const [village, setVillage] = useState([]);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  const getdists = async () => {
    const response = await commonAPICall(GETDISTSAPP, {}, "get", dispatch);
    if (response?.status === 200) {
      setDists(response?.data?.District_List || []);
    }
  };

  const getmandals = async (distcode) => {
    try {
      const response = await commonAPICall(
        GETMANDALSAPP + distcode,
        {},
        "get",
        dispatch,
      );
      if (response?.status === 200) {
        setMandal(response?.data?.Mandal_List || []);
      } else {
        setMandal([]);
      }
    } catch (error) {
      console.log("Error fetching mandals:", error);
      setMandal([]);
    }
  };

  const getVillages = async (distcode, mandalcode) => {
    try {
      const cleanMandalCode = String(mandalcode || "").replace(/,/g, "");

      const response = await commonAPICall(
        `${GETVILLAGESAPP}?distCode=${distcode}&mandalCode=${cleanMandalCode}`,
        {},
        "get",
        dispatch,
      );

      if (response?.status === 200) {
        setVillage(response?.data?.Village_List || []);
      } else {
        setVillage([]);
      }
    } catch (error) {
      console.log("Error fetching villages:", error);
      setVillage([]);
    }
  };

  // Load initial mandals and villages based on user data
  useEffect(() => {
    const loadInitialData = async () => {
      if (userData?.district && !initialDataLoaded) {
        await getmandals(userData.district);

        if (userData?.mandal) {
          await getVillages(userData.district, userData.mandal);
        }

        setInitialDataLoaded(true);
      }
    };

    if (dists.length > 0) {
      loadInitialData();
    }
  }, [userData, dists, initialDataLoaded]);

  const validationSchema = Yup.object().shape({
    district: Yup.string().required("Required / అవసరం"),
    mandal: Yup.string().required("Required / అవసరం"),
    village: Yup.string().required("Required / అవసరం"),
    plotOrHouseNumber: Yup.string().required("Required / అవసరం"),
    landmark: Yup.string().required("Required / అవసరం"),
    pincode: Yup.string().required("Required / అవసరం"),
    latitude: Yup.string().required("Required / అవసరం"),
    longitude: Yup.string().required("Required / అవసరం"),
  });

  // ✅ initialValues now populated from API data
  const formik = useFormik({
    initialValues: {
      userType: state.roleName,
      stageName: "LOCATION_ADDRESS",
      district: userData?.district?.toString() || "",
      mandal: userData?.mandal?.toString() || "",
      village: userData?.village?.toString() || "",
      plotOrHouseNumber: userData?.plot_or_house_number || "",
      landmark: userData?.landmark || "",
      pincode: userData?.pincode?.toString() || "",
      latitude: userData?.latitude?.toString() || "",
      longitude: userData?.longitude?.toString() || "",
    },
    validationSchema,
    onSubmit: handleSubmit,
    enableReinitialize: true, // This allows form to update when userData changes
  });

  async function handleSubmit(values, { setSubmitting, resetForm }) {
    try {
      // ✅ USING VALUES DIRECTLY AS PAYLOAD - NO MODIFICATIONS NEEDED

      const response = await commonAPICall(
        BASICPROFILE,
        values,
        "POST",
        dispatch,
      );

      if (response?.status === 200) {
        resetForm();
        onUpdateSuccess?.(); // refresh parent data

        setMandal([]);
        setVillage([]);
      }
    } catch (error) {
      console.log("Error:", error);
    } finally {
      setSubmitting(false);
    }
  }

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission denied / అనుమతి నిరాకరించబడింది",
          "Location permission is required / స్థాన అనుమతి అవసరం",
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      // Only set if fields are empty
      if (!formik.values.latitude) {
        formik.setFieldValue(
          "latitude",
          String(location?.coords?.latitude || ""),
        );
      }
      if (!formik.values.longitude) {
        formik.setFieldValue(
          "longitude",
          String(location?.coords?.longitude || ""),
        );
      }
    } catch (error) {
      console.log("Location error:", error);
      Alert.alert(
        "Error / లోపం",
        "Unable to fetch location / స్థానాన్ని పొందడం సాధ్యం కాలేదు",
      );
    }
  };

  useEffect(() => {
    getdists();
    getLocation();
  }, []);

  return (
    <FormikProvider value={formik}>
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>
          Location Information / స్థాన సమాచారం
        </Text>

        <View style={styles.inputBlock}>
          <Text style={styles.label}>
            District / జిల్లా <Text style={styles.requiredStar}>*</Text>
          </Text>
          <View
            style={[
              globalStyes.selectBox,
              formik.errors.district &&
                formik.touched.district &&
                styles.inputError,
            ]}
          >
            <Picker
              style={globalStyes.pickerText}
              selectedValue={formik.values.district}
              onValueChange={(itemValue) => {
                formik.setFieldTouched("district", true);
                formik.setFieldValue("district", itemValue);
                formik.setFieldValue("mandal", "");
                formik.setFieldValue("village", "");
                setMandal([]);
                setVillage([]);

                if (itemValue) {
                  getmandals(itemValue);
                }
              }}
            >
              <Picker.Item
                label="---Select District / జిల్లాను ఎంచుకోండి---"
                value=""
              />
              {dists.map((dist) => (
                <Picker.Item
                  key={String(dist.dist_code)}
                  label={dist.dist_name}
                  value={String(dist.dist_code)}
                />
              ))}
            </Picker>
          </View>
          {formik.errors.district && formik.touched.district && (
            <Text style={styles.errorText}>{formik.errors.district}</Text>
          )}
        </View>

        <View style={styles.inputBlock}>
          <Text style={styles.label}>
            Mandal / మండలం <Text style={styles.requiredStar}>*</Text>
          </Text>
          <View
            style={[
              globalStyes.selectBox,
              formik.errors.mandal &&
                formik.touched.mandal &&
                styles.inputError,
            ]}
          >
            <Picker
              style={globalStyes.pickerText}
              selectedValue={formik.values.mandal}
              onValueChange={(itemValue) => {
                formik.setFieldTouched("mandal", true);
                formik.setFieldValue("mandal", itemValue);
                formik.setFieldValue("village", "");
                setVillage([]);

                if (itemValue && formik.values.district) {
                  getVillages(formik.values.district, itemValue);
                }
              }}
              enabled={!!formik.values.district}
            >
              <Picker.Item
                label="---Select Mandal / మండలాన్ని ఎంచుకోండి---"
                value=""
              />
              {mandal.map((item) => (
                <Picker.Item
                  key={String(item.mandal_code)}
                  label={item.mandal_name}
                  value={String(item.mandal_code)}
                />
              ))}
            </Picker>
          </View>
          {formik.errors.mandal && formik.touched.mandal && (
            <Text style={styles.errorText}>{formik.errors.mandal}</Text>
          )}
        </View>

        <View style={styles.inputBlock}>
          <Text style={styles.label}>
            Village / గ్రామం <Text style={styles.requiredStar}>*</Text>
          </Text>
          <View
            style={[
              globalStyes.selectBox,
              formik.errors.village &&
                formik.touched.village &&
                styles.inputError,
            ]}
          >
            <Picker
              style={globalStyes.pickerText}
              selectedValue={formik.values.village}
              onValueChange={(itemValue) => {
                formik.setFieldTouched("village", true);
                formik.setFieldValue("village", itemValue);
              }}
              enabled={!!formik.values.mandal}
            >
              <Picker.Item
                label="---Select Village / గ్రామాన్ని ఎంచుకోండి---"
                value=""
              />
              {village.map((item) => (
                <Picker.Item
                  key={String(item.village_code)}
                  label={item.village_name}
                  value={String(item.village_code)}
                />
              ))}
            </Picker>
          </View>
          {formik.errors.village && formik.touched.village && (
            <Text style={styles.errorText}>{formik.errors.village}</Text>
          )}
        </View>

        <View style={styles.inputBlock}>
          <Text style={styles.label}>
            Door No. / డోర్ నంబర్ <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              formik.errors.plotOrHouseNumber &&
                formik.touched.plotOrHouseNumber &&
                styles.inputError,
            ]}
            value={formik.values.plotOrHouseNumber}
            onChangeText={formik.handleChange("plotOrHouseNumber")}
            onBlur={formik.handleBlur("plotOrHouseNumber")}
            placeholder="Enter Door No. / ద్వారం నంబర్ నమోదు చేయండి"
            maxLength={20}
          />
          {formik.errors.plotOrHouseNumber &&
            formik.touched.plotOrHouseNumber && (
              <Text style={styles.errorText}>
                {formik.errors.plotOrHouseNumber}
              </Text>
            )}
        </View>

        <View style={styles.inputBlock}>
          <Text style={styles.label}>
            Land mark / ల్యాండ్ మార్క్{" "}
            <Text style={styles.requiredStar}>*</Text>{" "}
          </Text>
          <TextInput
            style={[
              styles.input,
              formik.errors.landmark &&
                formik.touched.landmark &&
                styles.inputError,
            ]}
            value={formik.values.landmark}
            onChangeText={formik.handleChange("landmark")}
            onBlur={formik.handleBlur("landmark")}
            placeholder="Enter Landmark / ల్యాండ్మార్క్ నమోదు చేయండి"
            maxLength={100}
          />
          {formik.errors.landmark && formik.touched.landmark && (
            <Text style={styles.errorText}>{formik.errors.landmark}</Text>
          )}
        </View>

        <View style={styles.inputBlock}>
          <Text style={styles.label}>
            Pin Code / పిన్ కోడ్ <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              formik.errors.pincode &&
                formik.touched.pincode &&
                styles.inputError,
            ]}
            value={formik.values.pincode}
            onChangeText={formik.handleChange("pincode")}
            onBlur={formik.handleBlur("pincode")}
            placeholder="Enter Pin Code / పిన్ కోడ్ నమోదు చేయండి"
            keyboardType="numeric"
            maxLength={6}
          />
          {formik.errors.pincode && formik.touched.pincode && (
            <Text style={styles.errorText}>{formik.errors.pincode}</Text>
          )}
        </View>

        <View style={styles.inputBlock}>
          <Text style={styles.label}>
            Latitude / అక్షాంశం <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              formik.errors.latitude &&
                formik.touched.latitude &&
                styles.inputError,
            ]}
            value={formik.values.latitude}
            onChangeText={formik.handleChange("latitude")}
            onBlur={formik.handleBlur("latitude")}
            placeholder="Latitude / అక్షాంశం"
          />
          {formik.errors.latitude && formik.touched.latitude && (
            <Text style={styles.errorText}>{formik.errors.latitude}</Text>
          )}
        </View>

        <View style={styles.inputBlock}>
          <Text style={styles.label}>
            Longitude / రేఖాంశం <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              formik.errors.longitude &&
                formik.touched.longitude &&
                styles.inputError,
            ]}
            value={formik.values.longitude}
            onChangeText={formik.handleChange("longitude")}
            onBlur={formik.handleBlur("longitude")}
            placeholder="Longitude / రేఖాంశం"
          />
          {formik.errors.longitude && formik.touched.longitude && (
            <Text style={styles.errorText}>{formik.errors.longitude}</Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            formik.isSubmitting && styles.disabledButton,
          ]}
          onPress={formik.handleSubmit}
          disabled={formik.isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {formik.isSubmitting
              ? "SAVING... / సేవ్ చేస్తోంది..."
              : "SAVE / సేవ్ చేయండి"}
          </Text>
        </TouchableOpacity>
      </View>
    </FormikProvider>
  );
};
const SkillDetails = ({ userData, onUpdateSuccess }) => {
  const state = useSelector((state) => state.LoginReducer);
  const dispatch = useDispatch();

  const [skillsList, setSkillsList] = useState([]);
  const [showSkillsDropdown, setShowSkillsDropdown] = useState(false);

  // Parse skills from API (stored as string "[1, 3, 5]")
  const parseSkills = () => {
    try {
      if (userData?.skills) {
        const parsedSkills = JSON.parse(userData.skills);
        console.log("userData?.skills", parsedSkills);

        return parsedSkills.map((item) => item.skillId);
      }
      return [];
    } catch (e) {
      console.log("Error parsing skills:", e);
      return [];
    }
  };

  const validationSchema = Yup.object().shape({
    skillIds: Yup.array()
      .min(1, "Required / అవసరం")
      .required("Required / అవసరం"),
    experienceYears: Yup.string().required("Required / అవసరం"),
    preferredWorkType: Yup.string().required("Required / అవసరం"),
    dailyRate: Yup.string().required("Required / అవసరం"),
    workType: Yup.string().required("Required / అవసరం"),
  });

  // ✅ initialValues now populated from API data
  const formik = useFormik({
    initialValues: {
      userType: state.roleName,
      stageName: "SKILL_INFO",
      skillIds: parseSkills(),
      experienceYears: userData?.skill_experience_years?.toString() || "",
      preferredWorkType: userData?.skill_preferred_work_type || "",
      dailyRate: userData?.skill_daily_rate?.toString() || "",
      workType: userData?.skill_work_type || "",
    },
    validationSchema,
    onSubmit: handleSubmit,
    enableReinitialize: true, // Allow form to update when userData changes
  });

  const getSkillsData = async () => {
    try {
      const response = await commonAPICall(GETSKILLS, {}, "get", dispatch);

      if (response?.status === 200) {
        const skillData = response?.data?.Skill_Info_Details || [];
        setSkillsList(skillData);
      }
    } catch (error) {
      console.log("Error fetching skills:", error);
    }
  };

  useEffect(() => {
    getSkillsData();
  }, []);

  async function handleSubmit(values, { resetForm, setSubmitting }) {
    try {
      // ✅ USING VALUES DIRECTLY AS PAYLOAD

      const response = await commonAPICall(
        BASICPROFILE,
        values,
        "POST",
        dispatch,
      );

      if (response?.status === 200) {
        const updatedPayload = {
          ...state,
          isProfileUpdated: "Y",
        };
        // dispatch(login(updatedPayload));
        setShowSkillsDropdown(false);

        resetForm();
        onUpdateSuccess();
      }
    } catch (error) {
      console.log("Error:", error);
    } finally {
      setSubmitting(false);
    }
  }

  const toggleSkill = (skillId) => {
    formik.setFieldTouched("skillIds", true);
    const selectedIds = formik.values.skillIds || [];

    if (selectedIds.includes(skillId)) {
      formik.setFieldValue(
        "skillIds",
        selectedIds.filter((id) => id !== skillId),
      );
    } else {
      formik.setFieldValue("skillIds", [...selectedIds, skillId]);
    }
  };

  const selectedSkillNames = skillsList
    .filter((item) => formik.values.skillIds.includes(item.id))
    .map((item) => item.skill_name)
    .join(", ");

  return (
    <FormikProvider value={formik}>
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Skill Details / నైపుణ్య వివరాలు</Text>

        <View style={styles.inputBlock}>
          <Text style={styles.label}>
            Select Skills / నైపుణ్యాలను ఎంచుకోండి{" "}
            <Text style={styles.requiredStar}>*</Text>
          </Text>

          <TouchableOpacity
            style={[
              styles.selectBox,
              styles.skillsSelectBoxNew,
              showSkillsDropdown && styles.skillsSelectBoxOpenNew,
              formik.touched.skillIds &&
                formik.errors.skillIds &&
                styles.inputError,
            ]}
            onPress={() => {
              formik.setFieldTouched("skillIds", true);
              setShowSkillsDropdown(!showSkillsDropdown);
            }}
            activeOpacity={0.8}
          >
            <Text
              numberOfLines={2}
              style={[
                styles.skillsSelectedTextNew,
                { color: selectedSkillNames ? "#000" : "#999" },
              ]}
            >
              {selectedSkillNames || "Select Skills / నైపుణ్యాలను ఎంచుకోండి"}
            </Text>

            <Ionicons
              name={showSkillsDropdown ? "chevron-up" : "chevron-down"}
              size={20}
              color="#333"
            />
          </TouchableOpacity>

          {showSkillsDropdown && (
            <View style={[styles.dropdownBox, styles.skillsDropdownBoxNew]}>
              {skillsList.map((item, index) => {
                const selected = formik.values.skillIds.includes(item.id);

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.skillItem,
                      styles.skillsDropdownItemNew,
                      selected && styles.skillsDropdownItemSelectedNew,
                      index === skillsList.length - 1 &&
                        styles.skillsDropdownLastItemNew,
                    ]}
                    onPress={() => toggleSkill(item.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.skillText,
                        styles.skillsDropdownTextNew,
                        selected && styles.skillsDropdownTextSelectedNew,
                      ]}
                    >
                      {item.skill_name}
                    </Text>

                    <Ionicons
                      name={selected ? "checkbox" : "square-outline"}
                      size={22}
                      color={selected ? "#1e3a5f" : "#999"}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {formik.touched.skillIds && formik.errors.skillIds ? (
            <Text style={styles.errorText}>{formik.errors.skillIds}</Text>
          ) : null}
        </View>

        <View style={styles.inputBlock}>
          <Text style={styles.label}>
            Experience / అనుభవం <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              formik.errors.experienceYears &&
                formik.touched.experienceYears &&
                styles.inputError,
            ]}
            value={formik.values.experienceYears}
            onChangeText={formik.handleChange("experienceYears")}
            onBlur={formik.handleBlur("experienceYears")}
            placeholder="Enter experience in years / సంవత్సరాలలో అనుభవం నమోదు చేయండి"
            keyboardType="numeric"
            maxLength={2}
          />
          {formik.errors.experienceYears && formik.touched.experienceYears && (
            <Text style={styles.errorText}>
              {formik.errors.experienceYears}
            </Text>
          )}
        </View>

        <View style={styles.inputBlock}>
          <Text style={styles.label}>
            Preferred Work Type / ప్రాధాన్య పని రకం{" "}
            <Text style={styles.requiredStar}>*</Text>
          </Text>
          <View style={styles.radioColumn}>
            <TouchableOpacity
              style={styles.radioItem}
              onPress={() => {
                formik.setFieldTouched("preferredWorkType", true);
                formik.setFieldValue("preferredWorkType", "daily_wage");
              }}
            >
              <Ionicons
                name={
                  formik.values.preferredWorkType === "daily_wage"
                    ? "radio-button-on"
                    : "radio-button-off"
                }
                size={22}
                color="#0d6efd"
              />
              <Text style={styles.radioText}>Daily Wage / రోజువారీ వేతనం</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.radioItem}
              onPress={() => {
                formik.setFieldTouched("preferredWorkType", true);
                formik.setFieldValue("preferredWorkType", "contract");
              }}
            >
              <Ionicons
                name={
                  formik.values.preferredWorkType === "contract"
                    ? "radio-button-on"
                    : "radio-button-off"
                }
                size={22}
                color="#0d6efd"
              />
              <Text style={styles.radioText}>Contract / కాంట్రాక్ట్</Text>
            </TouchableOpacity>
          </View>
          {formik.errors.preferredWorkType &&
            formik.touched.preferredWorkType && (
              <Text style={styles.errorText}>
                {formik.errors.preferredWorkType}
              </Text>
            )}
        </View>

        <View style={styles.inputBlock}>
          <Text style={styles.label}>
            Daily Rate / రోజువారీ రేటు{" "}
            <Text style={styles.requiredStar}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              formik.errors.dailyRate &&
                formik.touched.dailyRate &&
                styles.inputError,
            ]}
            value={formik.values.dailyRate}
            onChangeText={formik.handleChange("dailyRate")}
            onBlur={formik.handleBlur("dailyRate")}
            placeholder="Enter daily rate / రోజువారీ రేటు నమోదు చేయండి"
            keyboardType="numeric"
            maxLength={6}
          />
          {formik.errors.dailyRate && formik.touched.dailyRate && (
            <Text style={styles.errorText}>{formik.errors.dailyRate}</Text>
          )}
        </View>

        <View style={styles.inputBlock}>
          <Text style={styles.label}>
            Select Availability for Work / పని కోసం లభ్యతను ఎంచుకోండి{" "}
            <Text style={styles.requiredStar}>*</Text>
          </Text>
          <View
            style={[
              globalStyes.selectBox,
              formik.errors.workType &&
                formik.touched.workType &&
                styles.inputError,
            ]}
          >
            <Picker
              style={globalStyes.pickerText}
              selectedValue={formik.values.workType}
              onValueChange={(itemValue) => {
                formik.setFieldTouched("workType", true);
                formik.setFieldValue("workType", itemValue);
              }}
            >
              <Picker.Item
                label="Select Availability / లభ్యతను ఎంచుకోండి"
                value=""
              />
              <Picker.Item label="Yes / అవును" value="yes" />
              <Picker.Item label="No / లేదు" value="no" />
            </Picker>
          </View>
          {formik.errors.workType && formik.touched.workType && (
            <Text style={styles.errorText}>{formik.errors.workType}</Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            formik.isSubmitting && styles.disabledButton,
          ]}
          onPress={formik.handleSubmit}
          disabled={formik.isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {formik.isSubmitting
              ? "SAVING... / సేవ్ చేస్తోంది..."
              : "SAVE / సేవ్ చేయండి"}
          </Text>
        </TouchableOpacity>
      </View>
    </FormikProvider>
  );
};

const WorkExperience = ({ userData, onUpdateSuccess }) => {
  const state = useSelector((state) => state.LoginReducer);
  const dispatch = useDispatch();

  const [skillsList, setSkillsList] = useState([]);
  const [showSkillsDropdown, setShowSkillsDropdown] = useState(false);
  const [currentSkillIndex, setCurrentSkillIndex] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [currentField, setCurrentField] = useState("");
  const [currentIndex, setCurrentIndex] = useState(null);
  const [pickerDate, setPickerDate] = useState(new Date());

  // Format date from API (YYYY-MM-DD) to display format (DD-MM-YYYY)
  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return "";

    const ddmmyyyyPattern = /^\d{2}-\d{2}-\d{4}$/;
    if (ddmmyyyyPattern.test(dateStr)) {
      return dateStr;
    }

    const yyyymmddPattern = /^\d{4}-\d{2}-\d{2}$/;
    if (yyyymmddPattern.test(dateStr)) {
      const [yyyy, mm, dd] = dateStr.split("-");
      return `${dd}-${mm}-${yyyy}`;
    }

    return "";
  };

  // Parse work history from API (stored as JSON string)
  const parseWorkHistory = () => {
    try {
      if (userData?.work_history) {
        const parsedData = JSON.parse(userData.work_history);

        return parsedData.map((item) => ({
          employeeName: item.employeeName || "",
          projectName: item.projectName || "",
          workPlace: item.workPlace || "",
          workType: item.workType || "",
          skillIds: item.skillId ? item.skillId : [],
          taskDescription: item.taskDescription || "",
          startDate: item.startDate ? formatDateForDisplay(item.startDate) : "",
          endDate: item.endDate ? formatDateForDisplay(item.endDate) : "",
          daysWorked: item.daysWorked?.toString() || "",
          dailyWage: item.dailyWage?.toString() || "",
          totalAmount: item.totalAmount?.toString() || "",
          paymentStatus: item.paymentStatus || "",
          remarks: item.remarks || "",
          rating: item.rating?.toString() || "",
        }));
      }
      return [];
    } catch (e) {
      console.log("Error parsing work history:", e);
      return [];
    }
  };

  const emptyExperience = {
    employeeName: "",
    projectName: "",
    workPlace: "",
    workType: "",
    skillIds: [],
    taskDescription: "",
    startDate: "",
    endDate: "",
    daysWorked: "",
    dailyWage: "",
    totalAmount: "",
    paymentStatus: "",
    remarks: "",
    rating: "",
  };

  const getSkillsData = async () => {
    try {
      const response = await commonAPICall(GETSKILLS, {}, "get", dispatch);
      if (response?.status === 200) {
        setSkillsList(response?.data?.Skill_Info_Details || []);
      }
    } catch (error) {
      console.log("Error fetching skills:", error);
    }
  };

  useEffect(() => {
    getSkillsData();
  }, []);

  const validationSchema = Yup.object().shape({
    workerExperienceList: Yup.array().of(
      Yup.object().shape({
        // employeeName: Yup.string().required("Required / అవసరం"),
        // projectName: Yup.string().required("Required / అవసరం"),
        // workPlace: Yup.string().required("Required / అవసరం"),
        // workType: Yup.string().required("Required / అవసరం"),
        // skillIds: Yup.array()
        //   .min(1, "Required / అవసరం")
        //   .required("Required / అవసరం"),
        // taskDescription: Yup.string().required("Required / అవసరం"),
        // startDate: Yup.string().required("Required / అవసరం"),
        // endDate: Yup.string().required("Required / అవసరం"),
        // daysWorked: Yup.string().required("Required / అవసరం"),
        // dailyWage: Yup.string().required("Required / అవసరం"),
        // totalAmount: Yup.string().required("Required / అవసరం"),
        // paymentStatus: Yup.string().required("Required / అవసరం"),
        // remarks: Yup.string().required("Required / అవసరం"),
        // rating: Yup.string().required("Required / అవసరం"),
      }),
    ),
  });

  // Initialize with parsed work history data
  const initialExperiences = parseWorkHistory();

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatDateToApi = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return "";
    const [dd, mm, yyyy] = parts;
    return `${yyyy}-${mm}-${dd}`;
  };

  const parseDisplayDateToDate = (dateStr) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split("-");
    if (parts.length !== 3) return new Date();
    const [dd, mm, yyyy] = parts;
    return new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  };

  const formik = useFormik({
    initialValues: {
      userType: state.roleName || "",
      stageName: "WORK_HISTORY",
      workerExperienceList:
        initialExperiences.length > 0
          ? initialExperiences
          : [{ ...emptyExperience }],
    },
    validationSchema,
    onSubmit: handleSubmit,
    enableReinitialize: true,
  });

  async function handleSubmit(values, { resetForm, setSubmitting }) {
    try {
      const payload = {
        ...values,
        workerExperienceList: values.workerExperienceList.map((item) => ({
          ...item,
          startDate: formatDateToApi(item.startDate),
          endDate: formatDateToApi(item.endDate),
        })),
      };

      const response = await commonAPICall(
        BASICPROFILE,
        payload,
        "POST",
        dispatch,
      );

      if (response?.status === 200) {
        const updatedPayload = {
          ...state,
          isProfileUpdated: "Y",
        };
        // dispatch(login(updatedPayload));
        resetForm();
        onUpdateSuccess();
      } else {
        console.log("API failed =>", response);
      }
    } catch (error) {
      console.log("Submit Error =>", error);
    } finally {
      setSubmitting(false);
    }
  }

  const addExperience = () => {
    formik.setFieldValue("workerExperienceList", [
      ...formik.values.workerExperienceList,
      { ...emptyExperience },
    ]);
  };

  const removeExperience = (index) => {
    const newExperiences = formik.values.workerExperienceList.filter(
      (_, i) => i !== index,
    );
    formik.setFieldValue("workerExperienceList", newExperiences);
  };

  // Toggle skill selection for multi-select
  const toggleSkill = (expIndex, skillId) => {
    formik.setFieldTouched(`workerExperienceList[${expIndex}].skillIds`, true);
    const currentSkillIds =
      formik.values.workerExperienceList[expIndex]?.skillIds || [];

    let newSkillIds;
    if (currentSkillIds.includes(skillId)) {
      newSkillIds = currentSkillIds.filter((id) => id !== skillId);
    } else {
      newSkillIds = [...currentSkillIds, skillId];
    }

    formik.setFieldValue(
      `workerExperienceList[${expIndex}].skillIds`,
      newSkillIds,
    );
  };

  // Get selected skill names for display
  const getSelectedSkillNames = (expIndex) => {
    const skillIds =
      formik.values.workerExperienceList[expIndex]?.skillIds || [];
    return skillsList
      .filter((item) => skillIds.includes(item.id))
      .map((item) => item.skill_name)
      .join(", ");
  };

  const calculateTotalAmount = (index, days, wage) => {
    const daysNum = Number(days || 0);
    const wageNum = Number(wage || 0);

    if (daysNum > 0 && wageNum > 0) {
      formik.setFieldValue(
        `workerExperienceList[${index}].totalAmount`,
        String(daysNum * wageNum),
      );
    } else {
      formik.setFieldValue(`workerExperienceList[${index}].totalAmount`, "");
    }
  };

  const openDatePicker = (field, index) => {
    const currentValue = formik.values.workerExperienceList[index]?.[field];
    formik.setFieldTouched(`workerExperienceList[${index}].${field}`, true);
    setCurrentField(field);
    setCurrentIndex(index);
    setPickerDate(parseDisplayDateToDate(currentValue));
    setShowDatePicker(true);
  };

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (event?.type === "dismissed") {
      setShowDatePicker(false);
      return;
    }

    const chosenDate = selectedDate || pickerDate;
    setPickerDate(chosenDate);

    if (currentIndex !== null && currentField) {
      const formatted = formatDate(chosenDate);
      const exp = formik.values.workerExperienceList[currentIndex];

      if (currentField === "startDate") {
        formik.setFieldValue(
          `workerExperienceList[${currentIndex}].startDate`,
          formatted,
        );

        if (exp.endDate) {
          const start = new Date(
            chosenDate.getFullYear(),
            chosenDate.getMonth(),
            chosenDate.getDate(),
          );
          const end = parseDisplayDateToDate(exp.endDate);

          if (end < start) {
            formik.setFieldValue(
              `workerExperienceList[${currentIndex}].endDate`,
              "",
            );
          }
        }
      } else if (currentField === "endDate") {
        if (exp.startDate) {
          const start = parseDisplayDateToDate(exp.startDate);
          const end = new Date(
            chosenDate.getFullYear(),
            chosenDate.getMonth(),
            chosenDate.getDate(),
          );

          if (end < start) {
            Alert.alert(
              "Invalid Date / చెల్లని తేదీ",
              "End date cannot be before Start date / ముగింపు తేదీ ప్రారంభ తేదీకి ముందు ఉండకూడదు",
            );
            return;
          }
        }

        formik.setFieldValue(
          `workerExperienceList[${currentIndex}].endDate`,
          formatted,
        );
      }
    }
  };

  return (
    <FormikProvider value={formik}>
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>
          Experience / Work Experience / అనుభవం / పని అనుభవం
        </Text>

        {formik.values.workerExperienceList.map((item, index) => (
          <View key={index} style={styles.experienceCard}>
            <View style={styles.expHeader}>
              <Text style={styles.expTitle}>
                Experience {index + 1} / అనుభవం {index + 1}
              </Text>

              {formik.values.workerExperienceList.length > 1 && (
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => removeExperience(index)}
                >
                  <Ionicons name="trash-outline" size={18} color="#fff" />
                  <Text style={styles.deleteBtnText}>Delete / తొలగించు</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.label}>
                Employer Name / యజమాని పేరు{" "}
                {/* <Text style={styles.requiredStar}>*</Text> */}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  formik.touched.workerExperienceList?.[index]?.employeeName &&
                    formik.errors.workerExperienceList?.[index]?.employeeName &&
                    styles.inputError,
                ]}
                value={item.employeeName}
                onChangeText={formik.handleChange(
                  `workerExperienceList[${index}].employeeName`,
                )}
                onBlur={formik.handleBlur(
                  `workerExperienceList[${index}].employeeName`,
                )}
                placeholder="Enter Employer Name / యజమాని పేరు నమోదు చేయండి"
              />
              {formik.touched.workerExperienceList?.[index]?.employeeName &&
                formik.errors.workerExperienceList?.[index]?.employeeName && (
                  <Text style={styles.errorText}>
                    {formik.errors.workerExperienceList[index].employeeName}
                  </Text>
                )}
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.label}>
                Project Name / ప్రాజెక్ట్ పేరు{" "}
                {/* <Text style={styles.requiredStar}>*</Text> */}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  formik.touched.workerExperienceList?.[index]?.projectName &&
                    formik.errors.workerExperienceList?.[index]?.projectName &&
                    styles.inputError,
                ]}
                value={item.projectName}
                onChangeText={formik.handleChange(
                  `workerExperienceList[${index}].projectName`,
                )}
                onBlur={formik.handleBlur(
                  `workerExperienceList[${index}].projectName`,
                )}
                placeholder="Enter Project Name / ప్రాజెక్ట్ పేరు నమోదు చేయండి"
              />
              {formik.touched.workerExperienceList?.[index]?.projectName &&
                formik.errors.workerExperienceList?.[index]?.projectName && (
                  <Text style={styles.errorText}>
                    {formik.errors.workerExperienceList[index].projectName}
                  </Text>
                )}
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.label}>
                Work Place / పని స్థలం{" "}
                {/* <Text style={styles.requiredStar}>*</Text> */}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  formik.touched.workerExperienceList?.[index]?.workPlace &&
                    formik.errors.workerExperienceList?.[index]?.workPlace &&
                    styles.inputError,
                ]}
                value={item.workPlace}
                onChangeText={formik.handleChange(
                  `workerExperienceList[${index}].workPlace`,
                )}
                onBlur={formik.handleBlur(
                  `workerExperienceList[${index}].workPlace`,
                )}
                placeholder="Enter Work Place / పని స్థలం నమోదు చేయండి"
              />
              {formik.touched.workerExperienceList?.[index]?.workPlace &&
                formik.errors.workerExperienceList?.[index]?.workPlace && (
                  <Text style={styles.errorText}>
                    {formik.errors.workerExperienceList[index].workPlace}
                  </Text>
                )}
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.label}>
                Work Type / పని రకం
                {/* <Text style={styles.requiredStar}>*</Text> */}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  formik.touched.workerExperienceList?.[index]?.workType &&
                    formik.errors.workerExperienceList?.[index]?.workType &&
                    styles.inputError,
                ]}
                value={item.workType}
                onChangeText={formik.handleChange(
                  `workerExperienceList[${index}].workType`,
                )}
                onBlur={formik.handleBlur(
                  `workerExperienceList[${index}].workType`,
                )}
                placeholder="Enter Work Type / పని రకం నమోదు చేయండి"
              />
              {formik.touched.workerExperienceList?.[index]?.workType &&
                formik.errors.workerExperienceList?.[index]?.workType && (
                  <Text style={styles.errorText}>
                    {formik.errors.workerExperienceList[index].workType}
                  </Text>
                )}
            </View>

            {/* Skills Multi-select */}
            <View style={styles.inputBlock}>
              <Text style={styles.label}>
                Skills / నైపుణ్యాలు
                {/* <Text style={styles.requiredStar}>*</Text> */}
              </Text>

              <TouchableOpacity
                style={[
                  styles.selectBox,
                  styles.skillsSelectBoxNew,
                  showSkillsDropdown &&
                    currentSkillIndex === index &&
                    styles.skillsSelectBoxOpenNew,
                  formik.touched.workerExperienceList?.[index]?.skillIds &&
                    formik.errors.workerExperienceList?.[index]?.skillIds &&
                    styles.inputError,
                ]}
                onPress={() => {
                  formik.setFieldTouched(
                    `workerExperienceList[${index}].skillIds`,
                    true,
                  );
                  setCurrentSkillIndex(
                    currentSkillIndex === index ? null : index,
                  );
                  setShowSkillsDropdown(currentSkillIndex !== index);
                }}
                activeOpacity={0.8}
              >
                <Text
                  numberOfLines={2}
                  style={[
                    styles.skillsSelectedTextNew,
                    { color: getSelectedSkillNames(index) ? "#000" : "#999" },
                  ]}
                >
                  {getSelectedSkillNames(index) ||
                    "Select Skills / నైపుణ్యాలను ఎంచుకోండి"}
                </Text>

                <Ionicons
                  name={
                    showSkillsDropdown && currentSkillIndex === index
                      ? "chevron-up"
                      : "chevron-down"
                  }
                  size={20}
                  color="#333"
                />
              </TouchableOpacity>

              {showSkillsDropdown && currentSkillIndex === index && (
                <View style={[styles.dropdownBox, styles.skillsDropdownBoxNew]}>
                  {skillsList.map((skill, idx) => {
                    const selected = formik.values.workerExperienceList[
                      index
                    ]?.skillIds?.includes(skill.id);

                    return (
                      <TouchableOpacity
                        key={skill.id}
                        style={[
                          styles.skillItem,
                          styles.skillsDropdownItemNew,
                          selected && styles.skillsDropdownItemSelectedNew,
                          idx === skillsList.length - 1 &&
                            styles.skillsDropdownLastItemNew,
                        ]}
                        onPress={() => toggleSkill(index, skill.id)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.skillText,
                            styles.skillsDropdownTextNew,
                            selected && styles.skillsDropdownTextSelectedNew,
                          ]}
                        >
                          {skill.skill_name}
                        </Text>

                        <Ionicons
                          name={selected ? "checkbox" : "square-outline"}
                          size={22}
                          color={selected ? "#1e3a5f" : "#999"}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {formik.touched.workerExperienceList?.[index]?.skillIds &&
                formik.errors.workerExperienceList?.[index]?.skillIds && (
                  <Text style={styles.errorText}>
                    {formik.errors.workerExperienceList[index].skillIds}
                  </Text>
                )}
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.label}>
                Task Description / పని వివరణ{" "}
                {/* <Text style={styles.requiredStar}>*</Text> */}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  formik.touched.workerExperienceList?.[index]
                    ?.taskDescription &&
                    formik.errors.workerExperienceList?.[index]
                      ?.taskDescription &&
                    styles.inputError,
                ]}
                value={item.taskDescription}
                onChangeText={formik.handleChange(
                  `workerExperienceList[${index}].taskDescription`,
                )}
                onBlur={formik.handleBlur(
                  `workerExperienceList[${index}].taskDescription`,
                )}
                placeholder="Enter Task Description / పని వివరణ నమోదు చేయండి"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              {formik.touched.workerExperienceList?.[index]?.taskDescription &&
                formik.errors.workerExperienceList?.[index]
                  ?.taskDescription && (
                  <Text style={styles.errorText}>
                    {formik.errors.workerExperienceList[index].taskDescription}
                  </Text>
                )}
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.label}>
                Start Date / ప్రారంభ తేదీ{" "}
                {/* <Text style={styles.requiredStar}>*</Text> */}
              </Text>
              <TouchableOpacity
                style={[
                  styles.input,
                  formik.touched.workerExperienceList?.[index]?.startDate &&
                    formik.errors.workerExperienceList?.[index]?.startDate &&
                    styles.inputError,
                ]}
                onPress={() => openDatePicker("startDate", index)}
              >
                <Text style={{ color: item.startDate ? "#000" : "#999" }}>
                  {item.startDate ||
                    "Select Start Date / ప్రారంభ తేదీని ఎంచుకోండి"}
                </Text>
              </TouchableOpacity>
              {formik.touched.workerExperienceList?.[index]?.startDate &&
                formik.errors.workerExperienceList?.[index]?.startDate && (
                  <Text style={styles.errorText}>
                    {formik.errors.workerExperienceList[index].startDate}
                  </Text>
                )}
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.label}>
                End Date / ముగింపు తేదీ{" "}
                {/* <Text style={styles.requiredStar}>*</Text> */}
              </Text>
              <TouchableOpacity
                style={[
                  styles.input,
                  formik.touched.workerExperienceList?.[index]?.endDate &&
                    formik.errors.workerExperienceList?.[index]?.endDate &&
                    styles.inputError,
                ]}
                onPress={() => openDatePicker("endDate", index)}
              >
                <Text style={{ color: item.endDate ? "#000" : "#999" }}>
                  {item.endDate || "Select End Date / ముగింపు తేదీని ఎంచుకోండి"}
                </Text>
              </TouchableOpacity>
              {formik.touched.workerExperienceList?.[index]?.endDate &&
                formik.errors.workerExperienceList?.[index]?.endDate && (
                  <Text style={styles.errorText}>
                    {formik.errors.workerExperienceList[index].endDate}
                  </Text>
                )}
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.label}>
                Days Worked / పని చేసిన రోజులు{" "}
                {/* <Text style={styles.requiredStar}>*</Text> */}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  formik.touched.workerExperienceList?.[index]?.daysWorked &&
                    formik.errors.workerExperienceList?.[index]?.daysWorked &&
                    styles.inputError,
                ]}
                value={item.daysWorked}
                onChangeText={(text) => {
                  formik.setFieldValue(
                    `workerExperienceList[${index}].daysWorked`,
                    text,
                  );
                  calculateTotalAmount(index, text, item.dailyWage);
                }}
                onBlur={formik.handleBlur(
                  `workerExperienceList[${index}].daysWorked`,
                )}
                keyboardType="numeric"
                placeholder="Enter Days Worked / పని చేసిన రోజులు నమోదు చేయండి"
              />
              {formik.touched.workerExperienceList?.[index]?.daysWorked &&
                formik.errors.workerExperienceList?.[index]?.daysWorked && (
                  <Text style={styles.errorText}>
                    {formik.errors.workerExperienceList[index].daysWorked}
                  </Text>
                )}
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.label}>
                Daily Wage / రోజువారీ వేతనం{" "}
                {/* <Text style={styles.requiredStar}>*</Text> */}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  formik.touched.workerExperienceList?.[index]?.dailyWage &&
                    formik.errors.workerExperienceList?.[index]?.dailyWage &&
                    styles.inputError,
                ]}
                value={item.dailyWage}
                onChangeText={(text) => {
                  formik.setFieldValue(
                    `workerExperienceList[${index}].dailyWage`,
                    text,
                  );
                  calculateTotalAmount(index, item.daysWorked, text);
                }}
                onBlur={formik.handleBlur(
                  `workerExperienceList[${index}].dailyWage`,
                )}
                keyboardType="numeric"
                placeholder="Enter Daily Wage / రోజువారీ వేతనం నమోదు చేయండి"
              />
              {formik.touched.workerExperienceList?.[index]?.dailyWage &&
                formik.errors.workerExperienceList?.[index]?.dailyWage && (
                  <Text style={styles.errorText}>
                    {formik.errors.workerExperienceList[index].dailyWage}
                  </Text>
                )}
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.label}>
                Total Amount / మొత్తం మొత్తం{" "}
                {/* <Text style={styles.requiredStar}>*</Text> */}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.readOnlyInput,
                  formik.touched.workerExperienceList?.[index]?.totalAmount &&
                    formik.errors.workerExperienceList?.[index]?.totalAmount &&
                    styles.inputError,
                ]}
                value={item.totalAmount}
                editable={false}
                placeholder="Total Amount / మొత్తం మొత్తం"
              />
              {formik.touched.workerExperienceList?.[index]?.totalAmount &&
                formik.errors.workerExperienceList?.[index]?.totalAmount && (
                  <Text style={styles.errorText}>
                    {formik.errors.workerExperienceList[index].totalAmount}
                  </Text>
                )}
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.label}>
                Payment Status / చెల్లింపు స్థితి{" "}
                {/* <Text style={styles.requiredStar}>*</Text> */}
              </Text>
              <View
                style={[
                  globalStyes.selectBox,
                  formik.touched.workerExperienceList?.[index]?.paymentStatus &&
                    formik.errors.workerExperienceList?.[index]
                      ?.paymentStatus &&
                    styles.inputError,
                ]}
              >
                <Picker
                  style={globalStyes.pickerText}
                  selectedValue={item.paymentStatus}
                  onValueChange={(itemValue) => {
                    formik.setFieldTouched(
                      `workerExperienceList[${index}].paymentStatus`,
                      true,
                    );
                    formik.setFieldValue(
                      `workerExperienceList[${index}].paymentStatus`,
                      itemValue,
                    );
                  }}
                >
                  <Picker.Item
                    label="Select Payment Status / చెల్లింపు స్థితిని ఎంచుకోండి"
                    value=""
                  />
                  <Picker.Item label="Paid / చెల్లించబడింది" value="paid" />
                  <Picker.Item label="Pending / పెండింగ్" value="pending" />
                  <Picker.Item label="Partial / పాక్షికం" value="partial" />
                </Picker>
              </View>
              {formik.touched.workerExperienceList?.[index]?.paymentStatus &&
                formik.errors.workerExperienceList?.[index]?.paymentStatus && (
                  <Text style={styles.errorText}>
                    {formik.errors.workerExperienceList[index].paymentStatus}
                  </Text>
                )}
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.label}>
                Remarks / వ్యాఖ్యలు
                {/* <Text style={styles.requiredStar}>*</Text> */}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  formik.touched.workerExperienceList?.[index]?.remarks &&
                    formik.errors.workerExperienceList?.[index]?.remarks &&
                    styles.inputError,
                ]}
                value={item.remarks}
                onChangeText={formik.handleChange(
                  `workerExperienceList[${index}].remarks`,
                )}
                onBlur={formik.handleBlur(
                  `workerExperienceList[${index}].remarks`,
                )}
                placeholder="Enter Remarks / వ్యాఖ్యలు నమోదు చేయండి"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
              {formik.touched.workerExperienceList?.[index]?.remarks &&
                formik.errors.workerExperienceList?.[index]?.remarks && (
                  <Text style={styles.errorText}>
                    {formik.errors.workerExperienceList[index].remarks}
                  </Text>
                )}
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.label}>
                Rating / రేటింగ్
                {/* <Text style={styles.requiredStar}>*</Text> */}
              </Text>
              <View
                style={[
                  globalStyes.selectBox,
                  formik.touched.workerExperienceList?.[index]?.rating &&
                    formik.errors.workerExperienceList?.[index]?.rating &&
                    styles.inputError,
                ]}
              >
                <Picker
                  style={globalStyes.pickerText}
                  selectedValue={item.rating}
                  onValueChange={(itemValue) => {
                    formik.setFieldTouched(
                      `workerExperienceList[${index}].rating`,
                      true,
                    );
                    formik.setFieldValue(
                      `workerExperienceList[${index}].rating`,
                      itemValue,
                    );
                  }}
                >
                  <Picker.Item
                    label="Select Rating / రేటింగ్ ఎంచుకోండి"
                    value=""
                  />
                  <Picker.Item label="1" value="1" />
                  <Picker.Item label="2" value="2" />
                  <Picker.Item label="3" value="3" />
                  <Picker.Item label="4" value="4" />
                  <Picker.Item label="5" value="5" />
                </Picker>
              </View>
              {formik.touched.workerExperienceList?.[index]?.rating &&
                formik.errors.workerExperienceList?.[index]?.rating && (
                  <Text style={styles.errorText}>
                    {formik.errors.workerExperienceList[index].rating}
                  </Text>
                )}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addMoreBtn} onPress={addExperience}>
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.addMoreBtnText}>
            Add Experience / అనుభవాన్ని జోడించండి
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.submitButton,
            formik.isSubmitting && styles.disabledButton,
          ]}
          onPress={formik.handleSubmit}
          disabled={formik.isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {formik.isSubmitting
              ? "SAVING... / సేవ్ చేస్తోంది..."
              : "SAVE / సేవ్ చేయండి"}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={pickerDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}
      </View>
    </FormikProvider>
  );
};

const EmployerWorkDetails = ({ userData, onUpdateSuccess }) => {
  const state = useSelector((state) => state.LoginReducer);
  const dispatch = useDispatch();

  const [skillsList, setSkillsList] = useState([]);
  const [showSkillsDropdown, setShowSkillsDropdown] = useState(false);

  console.log("userDatauserData", userData.average_workers_hired_per_month);

  const averageWorkersOptions = [
    { label: "1-10", value: 10 },
    { label: "11-50", value: 50 },
    { label: "51-100", value: 100 },
    { label: "100+", value: 101 },
  ];

  const normalizeCategoryIds = (categoriesValue) => {
    try {
      let parsed = categoriesValue;

      if (!parsed) return [];

      if (typeof parsed === "string") {
        parsed = JSON.parse(parsed);
      }

      if (!Array.isArray(parsed)) return [];

      return parsed
        .map((item) => {
          if (typeof item === "number") return item;
          if (typeof item === "string") return Number(item);
          if (item && typeof item === "object") {
            return Number(item.categoryId ?? item.id);
          }
          return NaN;
        })
        .filter((id) => !isNaN(id));
    } catch (e) {
      console.log("Error parsing categories:", e);
      return [];
    }
  };

  const initialCategoryIds = useMemo(() => {
    return normalizeCategoryIds(userData?.categories);
  }, [userData?.categories]);

  const validationSchema = Yup.object().shape({
    workCategoryIds: Yup.array()
      .min(1, "Required / అవసరం")
      .required("Required / అవసరం"),
    averageWorkersHiredPerMonth: Yup.string().required("Required / అవసరం"),
  });

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      userType: state.roleName,
      stageName: "EMPLOYER_WORK_DETAILS",
      workCategoryIds: initialCategoryIds,
      averageWorkersHiredPerMonth:
        userData?.average_workers_hired_per_month || "",
    },
    validationSchema,
    onSubmit: handleSubmit,
  });

  const getSkillsData = async () => {
    try {
      const response = await commonAPICall(GETSKILLS, {}, "get", dispatch);

      if (response?.status === 200) {
        setSkillsList(response?.data?.Skill_Info_Details || []);
      }
    } catch (error) {
      console.log("Error fetching skills:", error);
    }
  };

  useEffect(() => {
    getSkillsData();
  }, []);

  async function handleSubmit(values, { resetForm, setSubmitting }) {
    try {
      const payload = {
        userType: state.roleName,
        stageName: "EMPLOYER_WORK_DETAILS",
        workCategoryIds: normalizeCategoryIds(values.workCategoryIds),
        averageWorkersHiredPerMonth: Number(values.averageWorkersHiredPerMonth),
      };

      const response = await commonAPICall(
        BASICPROFILE,
        payload,
        "POST",
        dispatch,
      );

      if (response?.status === 200) {
        const updatedPayload = {
          ...state,
          isProfileUpdated: "Y",
        };
        // dispatch(login(updatedPayload));
        resetForm();
        onUpdateSuccess?.();
        setShowSkillsDropdown(false);
      }
    } catch (error) {
      console.log("Error:", error);
    } finally {
      setSubmitting(false);
    }
  }

  const toggleSkill = (skillId) => {
    const numericSkillId = Number(skillId);
    formik.setFieldTouched("workCategoryIds", true);

    const selectedIds = normalizeCategoryIds(formik.values.workCategoryIds);

    if (selectedIds.includes(numericSkillId)) {
      formik.setFieldValue(
        "workCategoryIds",
        selectedIds.filter((id) => id !== numericSkillId),
      );
    } else {
      formik.setFieldValue("workCategoryIds", [...selectedIds, numericSkillId]);
    }
  };

  const selectedSkillNames = skillsList
    .filter((item) =>
      normalizeCategoryIds(formik.values.workCategoryIds).includes(
        Number(item.id),
      ),
    )
    .map((item) => item.skill_name)
    .join(", ");

  return (
    <FormikProvider value={formik}>
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>
          Employer Work Details / యజమాని పని వివరాలు
        </Text>

        <View style={styles.inputBlock}>
          <Text style={styles.label}>
            Work Categories / పని వర్గాలు{" "}
            <Text style={styles.requiredStar}>*</Text>
          </Text>

          <TouchableOpacity
            style={[
              styles.selectBox,
              styles.skillsSelectBoxNew,
              showSkillsDropdown && styles.skillsSelectBoxOpenNew,
              formik.touched.workCategoryIds &&
                formik.errors.workCategoryIds &&
                styles.inputError,
            ]}
            onPress={() => {
              formik.setFieldTouched("workCategoryIds", true);
              setShowSkillsDropdown(!showSkillsDropdown);
            }}
            activeOpacity={0.8}
          >
            <Text
              numberOfLines={2}
              style={[
                styles.skillsSelectedTextNew,
                { color: selectedSkillNames ? "#000" : "#999" },
              ]}
            >
              {selectedSkillNames ||
                "Select Work Categories / పని వర్గాలను ఎంచుకోండి"}
            </Text>

            <Ionicons
              name={showSkillsDropdown ? "chevron-up" : "chevron-down"}
              size={20}
              color="#333"
            />
          </TouchableOpacity>

          {showSkillsDropdown && (
            <View style={[styles.dropdownBox, styles.skillsDropdownBoxNew]}>
              {skillsList.map((item, index) => {
                const selected = normalizeCategoryIds(
                  formik.values.workCategoryIds,
                ).includes(Number(item.id));

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.skillItem,
                      styles.skillsDropdownItemNew,
                      selected && styles.skillsDropdownItemSelectedNew,
                      index === skillsList.length - 1 &&
                        styles.skillsDropdownLastItemNew,
                    ]}
                    onPress={() => toggleSkill(item.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.skillText,
                        styles.skillsDropdownTextNew,
                        selected && styles.skillsDropdownTextSelectedNew,
                      ]}
                    >
                      {item.skill_name}
                    </Text>

                    <Ionicons
                      name={selected ? "checkbox" : "square-outline"}
                      size={22}
                      color={selected ? "#1e3a5f" : "#999"}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {formik.touched.workCategoryIds && formik.errors.workCategoryIds ? (
            <Text style={styles.errorText}>
              {formik.errors.workCategoryIds}
            </Text>
          ) : null}
        </View>

        <View style={styles.inputBlock}>
          <Text style={styles.label}>
            Average Workers Hired Per Month / నెలకు సగటు కార్మికులు
            నియమించబడ్డారు <Text style={styles.requiredStar}>*</Text>
          </Text>

          <View
            style={[
              globalStyes.selectBox,
              formik.errors.averageWorkersHiredPerMonth &&
                formik.touched.averageWorkersHiredPerMonth &&
                styles.inputError,
            ]}
          >
            <Picker
              style={globalStyes.pickerText}
              selectedValue={formik.values.averageWorkersHiredPerMonth}
              onValueChange={(itemValue) => {
                formik.setFieldTouched("averageWorkersHiredPerMonth", true);
                formik.setFieldValue("averageWorkersHiredPerMonth", itemValue);
              }}
            >
              <Picker.Item label="Select Range / పరిధిని ఎంచుకోండి" value="" />
              {averageWorkersOptions.map((option) => (
                <Picker.Item
                  key={option.value}
                  label={option.label}
                  value={option.value}
                />
              ))}
            </Picker>
          </View>

          {formik.errors.averageWorkersHiredPerMonth &&
            formik.touched.averageWorkersHiredPerMonth && (
              <Text style={styles.errorText}>
                {formik.errors.averageWorkersHiredPerMonth}
              </Text>
            )}
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            formik.isSubmitting && styles.disabledButton,
          ]}
          onPress={formik.handleSubmit}
          disabled={formik.isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {formik.isSubmitting
              ? "SAVING... / సేవ్ చేస్తోంది..."
              : "SAVE / సేవ్ చేయండి"}
          </Text>
        </TouchableOpacity>
      </View>
    </FormikProvider>
  );
};

const Education = ({ userData, onUpdateSuccess }) => {
  const state = useSelector((state) => state.LoginReducer);
  const dispatch = useDispatch();

  // Parse education from API (stored as JSON string)
  const parseEducation = () => {
    try {
      if (userData?.education) {
        const parsedData = JSON.parse(userData.education);

        return parsedData.map((item) => ({
          educationLevel: item.educationLevel || "",
          institutionName: item.institutionName || "",
          passingYear: item.passingYear?.toString() || "",
          uploadCertificate: item.certificate || "",
        }));
      }
      return [];
    } catch (e) {
      console.log("Error parsing education:", e);
      return [];
    }
  };

  const emptyEducation = {
    educationLevel: "",
    institutionName: "",
    passingYear: "",
    uploadCertificate: "",
  };

  const validationSchema = Yup.object().shape({
    // workerEducationList: Yup.array()
    //   .of(
    //     Yup.object().shape({
    //       educationLevel: Yup.string().required("Required / అవసరం"),
    //       institutionName: Yup.string().required("Required / అవసరం"),
    //       passingYear: Yup.string().required("Required / అవసరం"),
    //       // uploadCertificate: Yup.string().required("Required"),
    //     }),
    //   )
    //   .min(1, "Required / అవసరం"),
  });

  // Initialize with parsed education data
  const initialEducation = parseEducation();

  const formik = useFormik({
    initialValues: {
      userType: state.roleName,
      stageName: "EDUCATION",
      workerEducationList:
        initialEducation.length > 0 ? initialEducation : [emptyEducation],
    },
    validationSchema,
    onSubmit: handleSubmit,
    enableReinitialize: true, // Allow form to update when userData changes
  });

  async function handleSubmit(values, { resetForm, setSubmitting }) {
    try {
      // ✅ USING VALUES DIRECTLY AS PAYLOAD

      const response = await commonAPICall(
        BASICPROFILE,
        values,
        "POST",
        dispatch,
      );

      if (response?.status === 200) {
        const updatedPayload = {
          ...state,
          isProfileUpdated: "Y",
        };
        // dispatch(login(updatedPayload));
        resetForm();
        onUpdateSuccess();
      }
    } catch (error) {
      console.log("Submit Error =>", error);
    } finally {
      setSubmitting(false);
    }
  }

  const getError = (index, field) =>
    formik.touched?.workerEducationList?.[index]?.[field] &&
    formik.errors?.workerEducationList?.[index]?.[field];

  return (
    <FormikProvider value={formik}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Education / విద్య</Text>

          <FieldArray
            name="workerEducationList"
            render={(arrayHelpers) => (
              <>
                {formik.values.workerEducationList.map((item, index) => (
                  <View key={index} style={styles.educationCard}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.subTitle}>
                        Qualification {index + 1} / అర్హత {index + 1}
                      </Text>
                      {formik.values.workerEducationList.length > 1 && (
                        <TouchableOpacity
                          style={styles.deleteBtn}
                          onPress={() => arrayHelpers.remove(index)}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={18}
                            color="#fff"
                          />
                          <Text style={styles.deleteBtnText}>
                            Delete / తొలగించు
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={styles.inputBlock}>
                      <Text style={styles.label}>
                        Education Level / విద్యా స్థాయి{" "}
                        {/* <Text style={styles.requiredStar}>*</Text> */}
                      </Text>
                      <View
                        style={[
                          globalStyes.selectBox,
                          getError(index, "educationLevel") &&
                            styles.inputError,
                        ]}
                      >
                        <Picker
                          style={globalStyes.pickerText}
                          selectedValue={item.educationLevel}
                          onValueChange={(itemValue) => {
                            formik.setFieldTouched(
                              `workerEducationList[${index}].educationLevel`,
                              true,
                            );
                            formik.setFieldValue(
                              `workerEducationList[${index}].educationLevel`,
                              itemValue,
                            );
                          }}
                        >
                          <Picker.Item
                            label="Select Education Level / విద్యా స్థాయిని ఎంచుకోండి"
                            value=""
                          />
                          <Picker.Item label="8th / 8వ తరగతి" value="8th" />
                          <Picker.Item label="10th / 10వ తరగతి" value="10th" />
                          <Picker.Item label="12th / 12వ తరగతి" value="12th" />
                          <Picker.Item
                            label="Graduation / డిగ్రీ"
                            value="graduation"
                          />
                          <Picker.Item
                            label="Post Graduation / పోస్ట్ గ్రాడ్యుయేషన్"
                            value="post_graduation"
                          />
                          <Picker.Item
                            label="Diploma / డిప్లొమా"
                            value="diploma"
                          />
                        </Picker>
                      </View>
                      {getError(index, "educationLevel") ? (
                        <Text style={styles.errorText}>
                          {
                            formik.errors.workerEducationList[index]
                              .educationLevel
                          }
                        </Text>
                      ) : null}
                    </View>

                    <View style={styles.inputBlock}>
                      <Text style={styles.label}>
                        Institute / School / College / సంస్థ / పాఠశాల / కళాశాల{" "}
                        {/* <Text style={styles.requiredStar}>*</Text> */}
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          getError(index, "institutionName") &&
                            styles.inputError,
                        ]}
                        value={item.institutionName}
                        onChangeText={formik.handleChange(
                          `workerEducationList[${index}].institutionName`,
                        )}
                        onBlur={formik.handleBlur(
                          `workerEducationList[${index}].institutionName`,
                        )}
                        placeholder="Enter Institute / School / College Name / సంస్థ / పాఠశాల / కళాశాల పేరు నమోదు చేయండి"
                      />
                      {getError(index, "institutionName") ? (
                        <Text style={styles.errorText}>
                          {
                            formik.errors.workerEducationList[index]
                              .institutionName
                          }
                        </Text>
                      ) : null}
                    </View>

                    <View style={styles.inputBlock}>
                      <Text style={styles.label}>
                        Passing Year / ఉత్తీర్ణత సంవత్సరం{" "}
                        {/* <Text style={styles.requiredStar}>*</Text> */}
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          getError(index, "passingYear") && styles.inputError,
                        ]}
                        value={item.passingYear}
                        onChangeText={formik.handleChange(
                          `workerEducationList[${index}].passingYear`,
                        )}
                        onBlur={formik.handleBlur(
                          `workerEducationList[${index}].passingYear`,
                        )}
                        placeholder="Enter Passing Year / ఉత్తీర్ణత సంవత్సరం నమోదు చేయండి"
                        keyboardType="numeric"
                        maxLength={4}
                      />
                      {getError(index, "passingYear") ? (
                        <Text style={styles.errorText}>
                          {formik.errors.workerEducationList[index].passingYear}
                        </Text>
                      ) : null}
                    </View>

                    <View style={styles.inputBlock}>
                      <Text style={styles.label}>
                        Upload Certificate / సర్టిఫికేట్ అప్లోడ్ చేయండి{" "}
                        {/* <Text style={styles.requiredStar}>*</Text> */}
                      </Text>
                      <TouchableOpacity
                        style={[
                          styles.uploadButton,
                          getError(index, "uploadCertificate") &&
                            styles.inputError,
                        ]}
                        onPress={async () => {
                          formik.setFieldTouched(
                            `workerEducationList[${index}].uploadCertificate`,
                            true,
                          );

                          // replace with actual picker
                          Alert.alert(
                            "Upload Certificate / సర్టిఫికేట్ అప్లోడ్ చేయండి",
                            `Upload certificate for row ${index + 1} / వరుస ${index + 1} కోసం సర్టిఫికేట్ అప్లోడ్ చేయండి`,
                          );

                          formik.setFieldValue(
                            `workerEducationList[${index}].uploadCertificate`,
                            "certificate-uploaded",
                          );
                        }}
                      >
                        <Text style={styles.uploadButtonText}>
                          Upload Certificate / సర్టిఫికేట్ అప్లోడ్ చేయండి
                        </Text>
                      </TouchableOpacity>

                      {item.uploadCertificate ? (
                        <Text style={styles.fileNameText}>
                          {item.uploadCertificate === "certificate-uploaded"
                            ? "Certificate selected / సర్టిఫికేట్ ఎంచుకోబడింది"
                            : "Certificate available / సర్టిఫికేట్ అందుబాటులో ఉంది"}
                        </Text>
                      ) : null}

                      {getError(index, "uploadCertificate") ? (
                        <Text style={styles.errorText}>
                          {
                            formik.errors.workerEducationList[index]
                              .uploadCertificate
                          }
                        </Text>
                      ) : null}
                    </View>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => arrayHelpers.push({ ...emptyEducation })}
                >
                  <Text style={styles.addButtonText}>
                    + Add Qualification / అర్హతను జోడించండి
                  </Text>
                </TouchableOpacity>
              </>
            )}
          />

          <TouchableOpacity
            style={[
              styles.submitButton,
              formik.isSubmitting && styles.disabledButton,
            ]}
            onPress={formik.handleSubmit}
            disabled={formik.isSubmitting}
          >
            <Text style={styles.submitButtonText}>
              {formik.isSubmitting
                ? "SAVING... / సేవ్ చేస్తోంది..."
                : "SAVE / సేవ్ చేయండి"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </FormikProvider>
  );
};

// ==================== Change Password Component ====================
const ChangePassword = () => {
  const validationSchema = Yup.object().shape({
    currentPassword: Yup.string().required("Current password is required"),
    newPassword: Yup.string()
      .required("New password is required")
      .min(6, "Password must be at least 6 characters"),
    confirmPassword: Yup.string()
      .required("Please confirm your password")
      .oneOf([Yup.ref("newPassword")], "Passwords must match"),
  });

  const formik = useFormik({
    initialValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validationSchema: validationSchema,
    onSubmit: handleSubmit,
  });

  async function handleSubmit(values) {
    console.log("Change Password Values:", values);
    // API call here
  }

  return (
    <FormikProvider value={formik}>
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Change Password</Text>

        <View style={styles.inputBlock}>
          <Text style={styles.label}>Current Password</Text>
          <TextInput
            style={[
              styles.input,
              formik.errors.currentPassword &&
                formik.touched.currentPassword &&
                styles.inputError,
            ]}
            value={formik.values.currentPassword}
            onChangeText={formik.handleChange("currentPassword")}
            onBlur={formik.handleBlur("currentPassword")}
            placeholder="Enter Current Password"
            secureTextEntry
          />
          {formik.errors.currentPassword && formik.touched.currentPassword && (
            <Text style={styles.errorText}>
              {formik.errors.currentPassword}
            </Text>
          )}
        </View>

        <View style={styles.inputBlock}>
          <Text style={styles.label}>New Password</Text>
          <TextInput
            style={[
              styles.input,
              formik.errors.newPassword &&
                formik.touched.newPassword &&
                styles.inputError,
            ]}
            value={formik.values.newPassword}
            onChangeText={formik.handleChange("newPassword")}
            onBlur={formik.handleBlur("newPassword")}
            placeholder="Enter New Password"
            secureTextEntry
          />
          {formik.errors.newPassword && formik.touched.newPassword && (
            <Text style={styles.errorText}>{formik.errors.newPassword}</Text>
          )}
        </View>

        <View style={styles.inputBlock}>
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={[
              styles.input,
              formik.errors.confirmPassword &&
                formik.touched.confirmPassword &&
                styles.inputError,
            ]}
            value={formik.values.confirmPassword}
            onChangeText={formik.handleChange("confirmPassword")}
            onBlur={formik.handleBlur("confirmPassword")}
            placeholder="Enter Confirm Password"
            secureTextEntry
          />
          {formik.errors.confirmPassword && formik.touched.confirmPassword && (
            <Text style={styles.errorText}>
              {formik.errors.confirmPassword}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={formik.handleSubmit}
        >
          <Text style={styles.submitButtonText}>SAVE</Text>
        </TouchableOpacity>
      </View>
    </FormikProvider>
  );
};

// ==================== Help Component ====================
const Help = () => {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>Help / సహాయం</Text>

      <View style={styles.helpBox}>
        <Text style={styles.helpText}>
          Email / ఇమెయిల్: support@example.com
        </Text>
        <Text style={styles.helpText}>Phone / ఫోన్: +91 9999999999</Text>
        <Text style={styles.helpText}>
          For profile update issues, contact support team. / ప్రొఫైల్ అప్డేట్
          సమస్యల కోసం, సపోర్ట్ టీమ్ను సంప్రదించండి.
        </Text>
      </View>
    </View>
  );
};

// ==================== Main ProfileUpdate Component ====================
const ProfileUpdate = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const state = useSelector((state) => state.LoginReducer);
  const { isLoggedIn } = state;

  const [selectedSection, setSelectedSection] = useState(null);
  const [overalldata, setOveralldata] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) {
      navigation.replace("Login");
    }
  }, [isLoggedIn, navigation]);

  const overalldetails = async () => {
    try {
      const res = await commonAPICall(
        DIGITALLABOURCHOWKDETAILS,
        {},
        "get",
        dispatch,
      );

      if (res?.status === 200) {
        setOveralldata(res?.data?.DigitalLabourChowkRegistration_Details || []);
      }
    } catch (error) {
      console.log("Error fetching profile details:", error);
    }
  };

  useEffect(() => {
    {
      (state.roleName == "DLC Employer" || state.roleName === "DLC Worker") &&
        overalldetails();
    }
  }, [refreshKey]);

  const handleRefreshProfile = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const renderSelectedSection = () => {
    const userData = overalldata[0] || {};

    switch (selectedSection) {
      case "basic_details":
        return (
          <BasicDetails
            userData={userData}
            onUpdateSuccess={handleRefreshProfile}
          />
        );

      case "identity_verification":
        return (
          <IdentityVerification
            userData={userData}
            onUpdateSuccess={handleRefreshProfile}
          />
        );

      case "location_information":
        return (
          <LocationInformation
            userData={userData}
            onUpdateSuccess={handleRefreshProfile}
          />
        );

      case "skill_details":
        return (
          <SkillDetails
            userData={userData}
            onUpdateSuccess={handleRefreshProfile}
          />
        );

      case "work_experience":
        return (
          <WorkExperience
            userData={userData}
            onUpdateSuccess={handleRefreshProfile}
          />
        );

      case "education":
        return (
          <Education
            userData={userData}
            onUpdateSuccess={handleRefreshProfile}
          />
        );

      case "change_password":
        return (
          <ChangePassword
            userData={userData}
            onUpdateSuccess={handleRefreshProfile}
          />
        );

      case "work_details":
        return (
          <EmployerWorkDetails
            userData={userData}
            onUpdateSuccess={handleRefreshProfile}
          />
        );

      case "help":
        return <Help userData={userData} />;

      default:
        return null;
    }
  };

  if (!isLoggedIn) return null;

  const userData = overalldata[0] || {};

  const isCompleted = (key) => {
    if (!key) return false;

    const value = userData?.[key];

    console.log(`Checking completion for `, value);

    if (key === "education" || key === "work_history" || key === "skills") {
      try {
        const parsed = JSON.parse(value || "[]");
        return Array.isArray(parsed) && parsed.length > 0;
      } catch (e) {
        return false;
      }
    }

    return !!value;
  };

  // Helper function to translate section titles
  const getSectionTitle = (section) => {
    if (!section) return "My Profile / నా ప్రొఫైల్";

    const titles = {
      basic_details: "Basic Details / ప్రాథమిక వివరాలు",
      identity_verification: "Identity Verification / గుర్తింపు ధృవీకరణ",
      location_information: "Location Information / స్థాన సమాచారం",
      skill_details: "Skill Details / నైపుణ్య వివరాలు",
      work_experience: "Work Experience / పని అనుభవం",
      education: "Education / విద్య",
      change_password: "Change Password / పాస్వర్డ్ మార్చండి",
      work_details: "Work Details / పని వివరాలు",
      help: "Help / సహాయం",
    };

    return (
      titles[section] ||
      section.replace(/_/g, " ").toUpperCase() +
        " / " +
        section.replace(/_/g, " ").toUpperCase()
    );
  };

  console.log("state.roleName state.roleName ", state.roleId);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {(state.roleId === 13 || state.roleName === "DLC Worker") && (
        <View style={styles.card}>
          <Text style={styles.header}>
            {selectedSection
              ? getSectionTitle(selectedSection)
              : "My Profile / నా ప్రొఫైల్"}
          </Text>

          <View style={styles.panel}>
            {!selectedSection ? (
              <View>
                {profileMenu
                  .filter((item) => {
                    if (state.roleName === "DLC Employer") {
                      return ![
                        "skill_details",
                        "education",
                        "work_experience",
                      ].includes(item.value);
                    } else if (state.roleName === "DLC Worker") {
                      return item.value !== "work_details";
                    }
                    return true;
                  })
                  .map((item) => {
                    const completed = isCompleted(item.key);
                    console.log("tessss", item);

                    // Translate menu titles
                    let menuTitle = item.title;
                    if (item.value === "basic_details")
                      menuTitle = "Basic Details / ప్రాథమిక వివరాలు";
                    else if (item.value === "identity_verification")
                      menuTitle = "Identity Verification / గుర్తింపు ధృవీకరణ";
                    else if (item.value === "location_information")
                      menuTitle = "Location Information / స్థాన సమాచారం";
                    else if (item.value === "skill_details")
                      menuTitle = "Skill Details / నైపుణ్య వివరాలు";
                    else if (item.value === "work_experience")
                      menuTitle = "Work Experience / పని అనుభవం";
                    else if (item.value === "education")
                      menuTitle = "Education / విద్య";
                    else if (item.value === "change_password")
                      menuTitle = "Change Password / పాస్వర్డ్ మార్చండి";
                    else if (item.value === "work_details")
                      menuTitle = "Work Details / పని వివరాలు";
                    else if (item.value === "help") menuTitle = "Help / సహాయం";

                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.menuItem}
                        onPress={() => setSelectedSection(item.value)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.menuLeft}>
                          <Ionicons
                            name={item.icon}
                            size={22}
                            color="#1e3a5f"
                            style={styles.menuIcon}
                          />
                          <Text style={styles.menuTitle}>{menuTitle}</Text>
                        </View>

                        {item.value !== "help" && (
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            {completed ? (
                              <Ionicons
                                name="checkmark-circle"
                                size={16}
                                color="green"
                              />
                            ) : (
                              <Ionicons
                                name="close-circle"
                                size={16}
                                color="red"
                              />
                            )}
                            {/* <Text>
                            {completed ? "Completed / పూర్తయింది" : "Not Completed / పూర్తి కాలేదు"}
                          </Text> */}
                          </View>
                        )}

                        <Ionicons
                          name="chevron-forward"
                          size={22}
                          color="#1e3a5f"
                        />
                      </TouchableOpacity>
                    );
                  })}
              </View>
            ) : (
              <View>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setSelectedSection(null)}
                >
                  <Ionicons name="arrow-back" size={20} color="#0d6efd" />
                  <Text style={styles.backButtonText}>
                    Back to Profile Menu / ప్రొఫైల్ మెనూకి తిరిగి వెళ్ళు
                  </Text>
                </TouchableOpacity>

                {renderSelectedSection()}
              </View>
            )}
          </View>
        </View>
      )}
      {state.roleName !== "DLC Employer" && state.roleName !== "DLC Worker" && (
        <OldProfileUpdate />
      )}
    </ScrollView>
  );
};
export default ProfileUpdate;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: "#f5f6fa",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
  },
  header: {
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "left",
    backgroundColor: "#0d6efd",
    paddingVertical: 14,
    color: "white",
    padding: "14",
  },
  panel: {
    padding: 16,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    elevation: 1,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
    flexShrink: 1,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  backButtonText: {
    fontSize: 15,
    color: "#0d6efd",
    fontWeight: "600",
    marginLeft: 6,
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 16,
  },
  inputBlock: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    color: "#222",
  },
  requiredStar: {
    color: "red",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: "#000",
  },
  inputError: {
    borderColor: "red",
  },
  errorText: {
    color: "red",
    marginTop: 6,
    fontSize: 13,
  },
  submitButton: {
    backgroundColor: "#198754",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    minHeight: 45,
    justifyContent: "center",
  },
  datePickerButtonText: {
    fontSize: 16,
    color: "#333",
  },
  placeholderText: {
    color: "#999",
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    flexWrap: "wrap",
  },
  radioColumn: {
    marginTop: 5,
  },
  radioItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
    marginBottom: 8,
  },
  radioText: {
    marginLeft: 6,
    fontSize: 15,
    color: "#333",
  },
  selectBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  photoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#3856b5",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f0f4ff",
  },
  photoButtonText: {
    marginLeft: 8,
    color: "#3856b5",
    fontWeight: "600",
  },
  uploadButton: {
    backgroundColor: "#0d6efd",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  uploadButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  fileInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    padding: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 6,
  },
  fileNameText: {
    flex: 1,
    marginLeft: 6,
    fontSize: 13,
    color: "#333",
  },
  removeFileButton: {
    padding: 4,
  },
  locationButton: {
    backgroundColor: "#0d6efd",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  locationButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  helpBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 12,
  },
  helpText: {
    fontSize: 15,
    color: "#374151",
    marginBottom: 8,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  readOnlyInput: {
    backgroundColor: "#f5f5f5",
  },
  experienceCard: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: "#fafafa",
  },
  expHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  expTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dc3545",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteBtnText: {
    color: "#fff",
    fontSize: 13,
    marginLeft: 4,
  },
  addMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0d6efd",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  addMoreBtnText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 8,
  },
  skillItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#fff",
  },

  skillText: {
    fontSize: 14,
    color: "#333",
  },
  addButton: {
    backgroundColor: "#e6f0ff",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  addButtonText: {
    color: "#1e3a5f",
    fontWeight: "700",
  },
  deleteButton: {
    backgroundColor: "#ffe5e5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: "#c53030",
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#1e3a5f",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  skillsSelectBoxNew: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 50,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#fff",
  },

  skillsSelectBoxOpenNew: {
    borderColor: "#1e3a5f",
  },

  skillsSelectedTextNew: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    marginRight: 10,
  },

  skillsDropdownBoxNew: {
    marginTop: 6,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },

  skillsDropdownItemNew: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    backgroundColor: "#fff",
  },

  skillsDropdownItemSelectedNew: {
    backgroundColor: "#f4f8ff",
  },

  skillsDropdownTextNew: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    marginRight: 10,
  },

  skillsDropdownTextSelectedNew: {
    color: "#1e3a5f",
    fontWeight: "600",
  },

  skillsDropdownLastItemNew: {
    borderBottomWidth: 0,
  },
  rowBetween: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
