// WorkerRegistration.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  ActivityIndicator,
  Modal,
  Linking,
  Alert,
  Dimensions,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useFormik, FormikProvider } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { currentLanguageData } from "../utils/te";
import ImageBucketRN from "../utils/ImageBucketRN";
import {
  commonAPICall,
  WORKER_REGISTRATION,
  GET_DISTRICTS,
  GET_MANDALS,
  GET_VILLAGESS,
  GENERATE_AADHAAR_OTP,
  VERIFY_AADHAAR_OTP,
  AADHAAR_OTP,
  GET_STATES_API,
  CASTE_API,
  BANK_DETAILS,
  GET_DISTRICT_REPORT,
  GET_VILLAGES,
} from "../utils/utils";
import { showErrorToast, showInfoToast } from "../utils/showToast";
import { dists28 } from "../utils/CommonFunctions";
import { styles } from "./WorkerRegStyles";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Image } from "react-native";
import { globalStyes } from "./GlobalStyles";

const WorkerRegistration = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState(0);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [showMemberDobPicker, setShowMemberDobPicker] = useState(false);
  const [selectedMemberIndex, setSelectedMemberIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [otpVisible, setOtpVisible] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [txnNo, setTxnNo] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [aadhaarOtp, setAadhaarOtp] = useState("");

  // Tabs configuration with section-wise grouping
  const tabs = [
    {
      id: 0,
      name: currentLanguageData?.personalDetails || "Personal Details",
      icon: "person-outline",
    },
    {
      id: 1,
      name: currentLanguageData?.field?.familyDetaile || "Family Details",
      icon: "people-outline",
    },
    {
      id: 2,
      name: currentLanguageData?.field?.bankDetailes || "Bank Details",
      icon: "business-outline",
    },
    {
      id: 3,
      name: currentLanguageData?.field?.address || "Address Details",
      icon: "home-outline",
    },
    {
      id: 4,
      name: currentLanguageData?.field?.otherDetailes || "Employment Details",
      icon: "briefcase-outline",
    },
    {
      id: 5,
      name: currentLanguageData?.field?.workDetails || "Work Details",
      icon: "construct-outline",
    },
    {
      id: 6,
      name: currentLanguageData?.field?.documents || "Documents",
      icon: "document-text-outline",
    },
    {
      id: 7,
      name: currentLanguageData?.field?.payment || "Payment",
      icon: "time-outline",
    },
  ];

  // Get field label based on language
  const getFieldLabel = (fieldKey) => {
    return currentLanguageData?.field?.[fieldKey] || fieldKey;
  };

  // Helper functions
  // API calls

  const generateOtpForAadhaar = async (aadhaarNo) => {
    try {
      const response = await commonAPICall(
        AADHAAR_OTP,
        { aadharNo: aadhaarNo },
        "POST",
        dispatch,
      );

      const isSuccess = response?.status === 200;

      if (isSuccess) {
        const txn = response?.data?.txnNo || "";
        setTxnNo(txn);
        setOtpVisible(true);
        setIsOtpSent(true);
      } else {
        setOtpVisible(false);
        setIsOtpSent(false);
        setTxnNo("");
      }
    } catch (error) {
      console.error("OTP ERROR:", error);
      setOtpVisible(false);
      setIsOtpSent(false);
      setTxnNo("");
    }
  };

  const verifyOtp = async (aadhaarNumber, setFieldValue, value) => {
    if (!aadhaarOtp) {
      showInfoToast("Please enter OTP", "error");
      return;
    }

    setIsLoading(true);

    try {
      const response = await commonAPICall(
        VERIFY_AADHAAR_OTP,
        {
          txnNo,
          otp: value.toString(),
          aadharNo: aadhaarNumber || "",
        },
        "post",
        dispatch,
      );
      if (response?.status === 200 && response?.data?.status === "success") {
        setOtpVerified(true); // ✅ mark OTP verified
        setOtpVisible(false);

        // 🔥 parse ekyc response
        let ekycData = {};

        try {
          ekycData =
            typeof response?.data?.response === "string"
              ? JSON.parse(response.data.response)
              : response.data.response || {};
        } catch (err) {
          console.error("EKYC JSON parse error:", err);
        }

        // name
        setFieldValue("firstName", ekycData?.name || "");

        // father name cleanup
        let father = ekycData?.co || "";
        father = father
          .replace("S/O,", "")
          .replace("D/O,", "")
          .replace("W/O,", "");

        setFieldValue("fatherName", father);

        // gender
        const genderMap = {
          M: "M",
          F: "F",
          MALE: "M",
          FEMALE: "F",
          O: "O",
        };

        setFieldValue(
          "gender",
          genderMap?.[ekycData?.gender?.toUpperCase()] || "",
        );
        // DOB convert (01-07-2002 → 2002-07-01)
        let formattedDob = "";
        if (ekycData?.dob?.includes("-")) {
          const [dd, mm, yyyy] = ekycData.dob.split("-");
          formattedDob = `${yyyy}-${mm}-${dd}`;
        }
        setFieldValue("dob", formattedDob);
      }
    } catch (error) {
      console.error("OTP verify error:", error);
    }
  };

  // Validation Schema

  const validationSchema = Yup.object().shape({
    // ========== TAB 0: PERSONAL INFORMATION ==========
    aadhaarNo: Yup.string()
      .length(12, "Aadhaar number must be exactly 12 digits")
      .matches(/^\d+$/, "Aadhaar number must contain only digits")
      .required("Required"),

    firstName: Yup.string().required("Required"),

    // soWo: Yup.string().required("Required"),

    fatherName: Yup.string().required("Required"),

    gender: Yup.string().required("Required"),

    dob: Yup.string().required("Required"),

    phoneNo: Yup.string()
      .matches(/^\d{10}$/, "Enter valid 10 digit mobile number")
      .required("Required"),

    otherContactNo: Yup.string()
      .matches(/^\d{10}$/, "Enter valid 10 digit mobile number")
      .nullable(),

    religion: Yup.string().required("Required"),

    caste: Yup.string().when("religion", {
      is: (val) => val && val !== "Other",
      then: () => Yup.string().required("Required"),
      otherwise: () => Yup.string().nullable(),
    }),

    casteText: Yup.string().when("religion", {
      is: "Other",
      then: () => Yup.string().required("Required"),
      otherwise: () => Yup.string().nullable(),
    }),

    subCaste: Yup.string().when("religion", {
      is: (val) => val && val !== "Other",
      then: () => Yup.string().required("Required"),
      otherwise: () => Yup.string().nullable(),
    }),

    subCasteText: Yup.string().when("religion", {
      is: "Other",
      then: () => Yup.string().required("Required"),
      otherwise: () => Yup.string().nullable(),
    }),

    maritalStatus: Yup.string().required("Required"),

    aadhaarVerified: Yup.boolean(),

    // ========== TAB 1: FAMILY DETAILS ==========
    // familyDetails: Yup.array().of(
    //   Yup.object().shape({
    //     familyMemberName: Yup.string().required("Family member name required"),
    //     relation: Yup.string().required("Relation required"),
    //     memberDob: Yup.string().nullable(),
    //     aadhaarNo: Yup.string()
    //       .length(12, "Aadhaar must be 12 digits")
    //       .matches(/^\d+$/, "Only digits allowed")
    //       .nullable(),
    //     isNomine: Yup.string(),
    //     nominePer: Yup.string().when("isNomine", {
    //       is: "yes",
    //       then: () => Yup.string().required("Nominee percentage required"),
    //       otherwise: () => Yup.string().nullable(),
    //     }),
    //   }),
    // ),

    familyDetails: Yup.array()
      .of(
        Yup.object().shape({
          familyMemberName: Yup.string()
            .required("Member name is required")
            .min(2, "Name must be at least 2 characters")
            .max(100, "Name must not exceed 100 characters"),

          relation: Yup.string().required("Relation is required"),
          // .min(2, "Relation must be at least 2 characters"),

          memberDob: Yup.string().required("Date of birth is required"),

          aadhaarNo: Yup.string()
            .required("Aadhaar number is required")
            .matches(/^\d{12}$/, "Aadhaar number must be exactly 12 digits"),

          isNomine: Yup.string()
            .required("Please select whether this member is a nominee")
            .oneOf(["yes", "no"], "Invalid selection"),

          nominePer: Yup.string().test({
            name: "nominePer-validation",
            message: "Nominee percentage is required when member is a nominee",
            test: function (value) {
              const { isNomine } = this.parent;
              if (isNomine === "yes") {
                if (!value) {
                  return this.createError({
                    message:
                      "Nominee percentage is required when member is a nominee",
                  });
                }
                const num = parseInt(value, 10);
                if (isNaN(num) || num < 5 || num > 100 || num % 5 !== 0) {
                  return this.createError({
                    message:
                      "Percentage must be between 5% and 100% in multiples of 5",
                  });
                }
              }
              return true;
            },
          }),
        }),
      )
      .min(1, "At least one family member is required"),

    // ========== TAB 2: BANK DETAILS ==========
    ifscCode: Yup.string()
      .required("Required")
      .matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code"),

    bankName: Yup.string().required("Required"),

    branchName: Yup.string().required("Required"),

    bankAccountNo: Yup.string()
      .required("Required")
      .matches(/^\d+$/, "Only digits allowed"),

    rbankAccountNo: Yup.string()
      .required("Required")
      .oneOf(
        [Yup.ref("bankAccountNo"), null],
        "Bank account numbers must match",
      ),

    nameInBank: Yup.string().required("Required"),

    // ========== TAB 3: PERMANENT ADDRESS ==========
    permanentState: Yup.string().required("Required"),

    permanentDistrictCode: Yup.string().required("Required"),

    permanentMadalCode: Yup.string().required("Required"),

    permanentVillageCode: Yup.string().required("Required"),

    permanentPincode: Yup.string()
      .matches(/^\d{6}$/, "Enter valid pincode")
      .nullable(),

    permanentDoorNo: Yup.string().nullable(),

    permanentAddress: Yup.string().nullable(),

    permanentDivision: Yup.string().nullable(),

    permanentLandMark: Yup.string().nullable(),

    permanentCity: Yup.string().nullable(),

    // ========== TAB 3: PRESENT ADDRESS ==========
    isPermanent: Yup.boolean(),

    presentState: Yup.string().when("isPermanent", {
      is: false,
      then: () => Yup.string().required("Required"),
      otherwise: () => Yup.string().nullable(),
    }),

    presentDistrictCode: Yup.string().when("isPermanent", {
      is: false,
      then: () => Yup.string().required("Required"),
      otherwise: () => Yup.string().nullable(),
    }),

    presentMadalCode: Yup.string().when("isPermanent", {
      is: false,
      then: () => Yup.string().required("Required"),
      otherwise: () => Yup.string().nullable(),
    }),

    presentVillageCode: Yup.string().when("isPermanent", {
      is: false,
      then: () => Yup.string().required("Required"),
      otherwise: () => Yup.string().nullable(),
    }),

    presentPincode: Yup.string().when("isPermanent", {
      is: false,
      then: () =>
        Yup.string()
          .required("Required")
          .matches(/^\d{6}$/, "Enter valid pincode"),
      otherwise: () => Yup.string().nullable(),
    }),

    presentDoorNo: Yup.string().nullable(),

    presentAddress: Yup.string().nullable(),

    presentDivision: Yup.string().nullable(),

    presentLandMark: Yup.string().nullable(),

    presentCity: Yup.string().nullable(),

    // ========== TAB 4: EMPLOYMENT DETAILS ==========
    // isNregs: Yup.string().required("required"),

    jobCardNo: Yup.string().when("isNregs", {
      is: "Y",
      then: () => Yup.string().required("Job card number required"),
      otherwise: () => Yup.string().nullable(),
    }),

    isUnionMember: Yup.string(),

    unionName: Yup.string().when("isUnionMember", {
      is: "Y",
      then: () => Yup.string().required("Union name required"),
      otherwise: () => Yup.string().nullable(),
    }),

    regNo: Yup.string().when("isUnionMember", {
      is: "Y",
      then: () => Yup.string().required("Registration number required"),
      otherwise: () => Yup.string().nullable(),
    }),

    // ========== TAB 5: WORK DETAILS ==========
    empName: Yup.string().required("Required"),

    presentOfficeName: Yup.string().required("Required"),

    typeOfWork: Yup.string().required("Required"),

    otherTradeWork: Yup.string().nullable(),

    workCapability: Yup.string().required("Required"),

    isMigrant: Yup.string().nullable(),

    // Work Location Fields
    workDistrict: Yup.string().nullable(),

    workMandal: Yup.string().nullable(),

    workVillage: Yup.string().nullable(),

    workDoorNo: Yup.string().nullable(),

    workPincode: Yup.string()
      .matches(/^\d{6}$/, "Enter valid pincode")
      .nullable(),

    // ========== TAB 6: DOCUMENTS ==========
    photoDesc: Yup.mixed().required("Photo is required"),

    signatureDesc: Yup.mixed().required("Signature is required"),

    selfAffidavitDesc: Yup.mixed().required("Self declaration is required"),

    // ========== TAB 7: PAYMENT & DECLARATION ==========
    years: Yup.string()
      .required("Required")
      .matches(/^\d+$/, "Must be a number"),

    amount: Yup.string()
      .required("Required")
      .matches(/^\d+$/, "Must be a number"),

    selfDeclaration: Yup.boolean().oneOf(
      [true],
      "Must accept self declaration",
    ),

    // Additional field
    workerId: Yup.string().nullable(),
  });

  const loginData = useSelector((state) => state.LoginReducer);

  const mobileNo = loginData?.mobile;
  // Formik initialization
  const formik = useFormik({
    enableReinitialize: true,

    initialValues: {
      workerId: "",
      workerRegId: "",

      // ===== PERSONAL =====
      aadhaarNo: "",
      firstName: "",
      lastName: "",
      soWo: "",
      fatherName: "",
      gender: "",
      dob: "",
      phoneNo: String(loginData?.mobile) || "",
      otherContactNo: "",
      religion: "",
      caste: "",
      casteText: "",
      subCaste: "",
      subCasteText: "",
      maritalStatus: "",
      aadhaarVerified: false,

      // ===== FAMILY (OLD NAMES KEPT) =====
      familyDetails: [
        {
          familyMemberName: "",
          relation: "",
          memberDob: "",
          aadhaarNo: "",
          isNomine: "",
          nominePer: "",
        },
      ],

      // ===== BANK =====
      ifscCode: "",
      bankName: "",
      branchName: "",
      bankAccountNo: "",
      rbankAccountNo: "",
      nameInBank: "",
      bankPhotoDesc: null,

      // ===== PERMANENT ADDRESS =====
      permanentState: "",
      permanentDistrictCode: "",
      permanentMadalCode: "",
      permanentVillageCode: "",
      permanentPincode: "",
      permanentDoorNo: "",
      permanentAddress: "",
      permanentDivision: "",
      permanentLandMark: "",
      permanentCity: "",

      // ===== PRESENT ADDRESS =====
      isPermanent: false,
      presentState: "",
      presentDistrictCode: "",
      presentMadalCode: "",
      presentVillageCode: "",
      presentPincode: "",
      presentDoorNo: "",
      presentAddress: "",
      presentDivision: "",
      presentLandMark: "",
      presentCity: "",

      // ===== FLAGS =====
      isNregs: "",
      jobCardNo: "",
      wordDaysCopyDesc: "",
      isUnionMember: "",
      unionName: "",
      regNo: "",

      // ===== WORK =====
      empName: "",
      presentOfficeName: "",
      typeOfWork: "",
      otherTradeWork: "",
      workCapability: "",
      isMigrant: "",

      // OLD WORK LOCATION NAMES
      workDistrict: "",
      workMandal: "",
      workVillage: "",
      workDoorNo: "",
      workPincode: "",

      // ===== FILES =====
      photoDesc: null,
      aadhaarPhotoDesc: null,
      selfAffidavitDesc: null,

      // ===== PAYMENT =====
      years: "",
      amount: "",
      selfDeclaration: false,
    },

    validationSchema,

    onSubmit: async (values) => {
      setIsLoading(true);

      try {
        // ✅ MAPPING OLD → NEW
        const mappedValues = {
          ...values,

          // FAMILY MAPPING
          familydetails: (values.familyDetails || []).map((f) => ({
            memberName: f.familyMemberName,
            relation: f.relation,
            memberDob: f.memberDob,
            memberUid: f.aadhaarNo,
            isNomine: f.isNomine,
            nominePer: f.nominePer,
          })),

          // WORK LOCATION MAPPING
          officeDistrictCode: values.workDistrict,
          officeMadalCode: values.workMandal,
          officeVillageCode: values.workVillage,
          officeDoorNo: values.workDoorNo,
          officePincode: values.workPincode,

          // PAYMENT MAPPING
          workYears: values.years,
          selfCheck: values.selfDeclaration,

          // STATE FIX
          state: values.permanentState || "AP",
        };

        // ✅ FINAL PAYLOAD
        const payload = {
          ...mappedValues,

          otherContactNo: values.otherContactNo
            ? Number(values.otherContactNo)
            : null,

          phoneNo: values.phoneNo ? Number(values.phoneNo) : null,
          caste: values.caste ? Number(values.caste) : null,
          subCaste: values.subCaste ? Number(values.subCaste) : null,
          state: mappedValues.state ? Number(mappedValues.state) : null,

          permanentDistrictCode: values.permanentDistrictCode
            ? Number(values.permanentDistrictCode)
            : null,

          permanentMadalCode: values.permanentMadalCode
            ? Number(values.permanentMadalCode)
            : null,

          permanentVillageCode: values.permanentVillageCode
            ? Number(values.permanentVillageCode)
            : null,

          officeDistrictCode: mappedValues.officeDistrictCode
            ? Number(mappedValues.officeDistrictCode)
            : null,

          officeMadalCode: mappedValues.officeMadalCode
            ? Number(mappedValues.officeMadalCode)
            : null,

          officeVillageCode: mappedValues.officeVillageCode
            ? Number(mappedValues.officeVillageCode)
            : null,

          workYears: mappedValues.workYears
            ? Number(mappedValues.workYears)
            : null,

          amount: values.amount ? String(values.amount) : "0",

          familydetails: mappedValues.familydetails.map((f) => ({
            ...f,
            relation: f.relation ? Number(f.relation) : null,
            memberUid: f.memberUid ? Number(f.memberUid) : null,
            nominePer: Number(f.nominePer || 0),
          })),

          entryBy: "ADMIN",
          registeredBy: "OWN",

          workerId: null,
          workerRegId: null,
          // workerId: isEditMode ? data?.[0]?.worker_id : null,
          // workerRegId: isEditMode ? data?.[0]?.worker_reg_id : null,
        };

        // const formData = new FormData();

        // // ✅ SEND PAYLOAD
        // formData.append("data", JSON.stringify(payload));

        // ✅ FILES

        const response = await commonAPICall(
          WORKER_REGISTRATION,
          payload,
          "post",
          dispatch,
        );

        console.log("reee", payload);
        console.log("reseeeponse0", response);

        if (response.status === 200) {
          navigation.goBack();
        }
      } catch (error) {
        console.error("Error submitting form:", error);
      } finally {
        setIsLoading(false);
      }
    },
  });

  console.log("formikkkk", formik.values.permanentState);
  console.log("satteliost", statesList);

  // Handle adding/removing family members
  const addFamilyMember = () => {
    formik.setFieldValue("familyDetails", [
      ...formik.values.familyDetails,
      {
        familyMemberName: "",
        relation: "",
        memberDob: "",
        aadhaar: "",
        isNomine: "",
        nominePer: "",
      },
    ]);
  };

  const removeFamilyMember = (index) => {
    const familyDetails = [...formik.values.familyDetails];
    familyDetails.splice(index, 1);
    formik.setFieldValue("familyDetails", familyDetails);
  };

  // Handle permanent address copy to present address

  useEffect(() => {
    loadCasteData();
    // getStates();
  }, []);

  const [allSubCastes, setAllSubCastes] = useState([]);
  const [casteList, setCasteList] = useState([]);
  const [subCasteList, setSubCasteList] = useState([]);
  const [allCastes, setAllCastes] = useState([]);
  const [showerror, setShowerror] = useState("");
  const [religionList, setReligionList] = useState([]);

  const AadharClearValues = (setFieldValue) => {
    setFieldValue("firstName", "");
    setFieldValue("fatherName", "");
    setFieldValue("gender", "");
    setFieldValue("dob", "");
    // setFieldValue("phoneNo", "");
    setOtpVerified(false);
  };

  const RELIGION_CODE_MAP = {
    Buddhist: "BUD",
    Christian: "CHR",
    Hindu: "HIN",
    Jain: "JAI",
    Muslim: "MUS",
    Parsi: "PAR",
    Sikh: "SIK",
    Other: "OTH",
  };

  const loadCasteData = async () => {
    try {
      const response = await commonAPICall(CASTE_API, {}, "GET", dispatch);

      if (response?.status === 200) {
        // Set religions from API response
        setReligionList(response.data.religions || []);
        // Set castes from API response
        setAllCastes(response.data.castes || []);
        setCasteList(response.data.castes || []);
        // Set sub castes from API response
        setAllSubCastes(response.data.sub_castes || []);
      }
    } catch (err) {
      console.error("Failed to load caste data", err);
      setShowerror("Failed to load caste data");
    }
  };

  // Religion mapping for filtering castes
  const getReligionCode = (religionName) => {
    const religion = religionList.find((r) => r.religiondesc === religionName);
    return religion?.religionid || "";
  };

  // Handle religion change
  const handleReligionChange = (religionName, setFieldValue) => {
    setFieldValue("religion", religionName);
    setFieldValue("caste", "");
    setFieldValue("subCaste", "");
    setFieldValue("casteText", "");
    setFieldValue("subCasteText", "");
    setSubCasteList([]);

    const religionCode = getReligionCode(religionName);
    const filteredCastes = allCastes.filter((c) => c.religion === religionCode);
    setCasteList(filteredCastes);
  };

  const handleCasteChange = (casteCode, setFieldValue) => {
    setFieldValue("caste", casteCode);
    setFieldValue("subCaste", "");
    setFieldValue("subCasteText", "");

    const filteredSubCastes = allSubCastes.filter(
      (sub) => sub.caste_code === parseInt(casteCode),
    );
    setSubCasteList(filteredSubCastes);
  };

  // Get pure sub caste name (without numbering)
  const getPureSubCasteName = (subCasteDesc) => {
    if (!subCasteDesc) return "";
    // Remove numbering like "1)", "2)", etc. from start
    const cleaned = subCasteDesc.replace(/^\d+\)\s*/, "");
    return cleaned.split("-")[0]?.trim() || cleaned;
  };

  useEffect(() => {
    loadCasteData();
  }, []);

  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 80);

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);

  const formatDateForPicker = (dateStr) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date();
  };

  const formatDateToApi = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Render Personal Info Tab
  const renderPersonalInfoTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>
        {getFieldLabel("personalDetails")}
      </Text>

      {/* Aadhaar Number Field */}
      {/* Aadhaar Field */}
      <View style={styles.inputBlock}>
        <Text style={styles.label}>
          {getFieldLabel("aadhaarNo")}{" "}
          <Text style={styles.requiredStar}>*</Text>
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TextInput
            style={[
              styles.input,
              { flex: 1 },
              formik.errors.aadhaarNo &&
                formik.touched.aadhaarNo &&
                styles.inputError,
            ]}
            value={formik.values.aadhaarNo}
            onChangeText={(text) => {
              const value = text.replace(/\D/g, "").slice(0, 12);
              AadharClearValues(formik.setFieldValue);
              formik.setFieldValue("aadhaarNo", value);
              setOtpVerified(false);

              if (value.length < 12) {
                setOtpVisible(false);
                setIsOtpSent(false);
                setTxnNo("");
              }
            }}
            onBlur={formik.handleBlur("aadhaarNo")}
            placeholder={`Enter ${getFieldLabel("aadhaarNo")}`}
            keyboardType="numeric"
            maxLength={12}
          />

          <TouchableOpacity
            style={{
              marginLeft: 8,
              backgroundColor: "green",
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 6,
              opacity: formik.values.aadhaarNo?.length === 12 ? 1 : 0.5,
            }}
            disabled={formik.values.aadhaarNo?.length !== 12 || isOtpSent}
            onPress={() => {
              setIsOtpSent(true);
              generateOtpForAadhaar(formik.values.aadhaarNo);
            }}
          >
            <Text style={{ color: "#fff", fontSize: 12 }}>
              {isOtpSent ? "OTP Sent" : "Get OTP"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* {formik.errors.aadhaarNo && formik.touched.aadhaarNo && (
          <Text style={styles.errorText}>{formik.errors.aadhaarNo}</Text>
        )} */}
      </View>

      {/* OTP Field */}
      {otpVisible && (
        <View style={styles.inputBlock}>
          <Text style={styles.label}>
            Enter OTP <Text style={styles.requiredStar}>*</Text>
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={aadhaarOtp}
              onChangeText={(text) => {
                const value = text.replace(/\D/g, "").slice(0, 6);
                setAadhaarOtp(value);
              }}
              placeholder="Enter OTP"
              keyboardType="numeric"
              maxLength={6}
            />

            <TouchableOpacity
              style={{
                marginLeft: 8,
                backgroundColor: "green",
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 6,
                opacity: aadhaarOtp?.length === 6 ? 1 : 0.5,
              }}
              disabled={aadhaarOtp?.length !== 6}
              onPress={() =>
                verifyOtp(
                  formik.values.aadhaarNo,
                  formik.setFieldValue,
                  aadhaarOtp,
                )
              }
            >
              <Text style={{ color: "#fff", fontSize: 12 }}>Verify OTP</Text>
            </TouchableOpacity>
          </View>

          {showerror !== "" && (
            <Text style={styles.errorText}>{showerror}</Text>
          )}
        </View>
      )}

      {/* Verified Badge */}
      {otpVerified && (
        <Text style={[styles.successText, { marginTop: 8 }]}>
          ✓ Aadhaar Verified
        </Text>
      )}

      {/* First Name - Disabled until Aadhaar verified */}
      <View style={styles.inputBlock}>
        <Text style={styles.label}>
          {getFieldLabel("firstName")}{" "}
          <Text style={styles.requiredStar}>*</Text>
        </Text>
        <TextInput
          style={[
            styles.input,
            formik.errors.firstName &&
              formik.touched.firstName &&
              styles.inputError,
          ]}
          value={formik.values.firstName}
          onChangeText={formik.handleChange("firstName")}
          onBlur={formik.handleBlur("firstName")}
          placeholder={`Enter ${getFieldLabel("firstName")}`}
          editable={false}
        />
        {/* {formik.errors.firstName && formik.touched.firstName && (
          <Text style={styles.errorText}>{formik.errors.firstName}</Text>
        )} */}
      </View>

      {/* Father Name - Disabled until Aadhaar verified */}
      <View style={styles.inputBlock}>
        <Text style={styles.label}>
          {getFieldLabel("fatherName")}{" "}
          <Text style={styles.requiredStar}>*</Text>
        </Text>
        <TextInput
          style={[
            styles.input,
            formik.errors.fatherName &&
              formik.touched.fatherName &&
              styles.inputError,
          ]}
          value={formik.values.fatherName}
          onChangeText={formik.handleChange("fatherName")}
          onBlur={formik.handleBlur("fatherName")}
          placeholder={`Enter ${getFieldLabel("fatherName")}`}
          editable={false}
        />
        {/* {formik.errors.fatherName && formik.touched.fatherName && (
          <Text style={styles.errorText}>{formik.errors.fatherName}</Text>
        )} */}
      </View>

      {/* Gender - Disabled until Aadhaar verified */}
      <View style={styles.inputBlock}>
        <Text style={styles.label}>
          {getFieldLabel("gender")} <Text style={styles.requiredStar}>*</Text>
        </Text>
        <View style={styles.radioGroup}>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => formik.setFieldValue("gender", "M")}
            disabled={true}
          >
            <View
              style={[
                styles.radioCircle,
                formik.values.gender === "M" && styles.radioSelected,
              ]}
            />
            <Text style={styles.radioLabel}>{getFieldLabel("male")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => formik.setFieldValue("gender", "F")}
            disabled={true}
          >
            <View
              style={[
                styles.radioCircle,
                formik.values.gender === "F" && styles.radioSelected,
              ]}
            />
            <Text style={styles.radioLabel}>{getFieldLabel("female")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => formik.setFieldValue("gender", "T")}
            disabled={true}
          >
            <View
              style={[
                styles.radioCircle,
                formik.values.gender === "T" && styles.radioSelected,
              ]}
            />
            <Text style={styles.radioLabel}>{getFieldLabel("others")}</Text>
          </TouchableOpacity>
        </View>
        {/* {formik.errors.gender && formik.touched.gender && (
          <Text style={styles.errorText}>{formik.errors.gender}</Text>
        )} */}
      </View>

      {/* Date of Birth - Disabled until Aadhaar verified */}
      <View style={styles.inputBlock}>
        <Text style={styles.label}>
          {getFieldLabel("dob")} <Text style={styles.requiredStar}>*</Text>
        </Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => {
            if (otpVerified) {
              formik.setFieldTouched("dob", true);
              setShowDobPicker(true);
            }
          }}
          disabled={!otpVerified}
        >
          <Text style={styles.dateText}>
            {formik.values.dob || `Select ${getFieldLabel("dob")}`}
          </Text>
          <Ionicons name="calendar-outline" size={20} color="#555" />
        </TouchableOpacity>
        {/* {formik.errors.dob && formik.touched.dob && (
          <Text style={styles.errorText}>{formik.errors.dob}</Text>
        )} */}
      </View>

      {/* Phone Number - Disabled until Aadhaar verified */}
      <View style={styles.inputBlock}>
        <Text style={styles.label}>
          {getFieldLabel("phoneNo")} <Text style={styles.requiredStar}>*</Text>
        </Text>
        <TextInput
          style={[
            styles.input,
            formik.errors.phoneNo &&
              formik.touched.phoneNo &&
              styles.inputError,
          ]}
          value={formik.values.phoneNo}
          onBlur={formik.handleBlur("phoneNo")}
          placeholder={`Enter ${getFieldLabel("phoneNo")}`}
          keyboardType="numeric"
          maxLength={10}
          editable={false}
        />
        {/* {formik.errors.phoneNo && formik.touched.phoneNo && (
          <Text style={styles.errorText}>{formik.errors.phoneNo}</Text>
        )} */}
      </View>

      {/* Religion Field */}
      <View style={styles.inputBlock}>
        <Text style={styles.label}>
          {getFieldLabel("religion")} <Text style={styles.requiredStar}>*</Text>
        </Text>
        <View style={globalStyes.selectBox}>
          <Picker
            style={globalStyes.pickerText}
            selectedValue={formik.values.religion}
            onValueChange={(itemValue) => {
              formik.setFieldTouched("religion", true);
              formik.setFieldValue("religion", itemValue);
              formik.setFieldValue("caste", "");
              formik.setFieldValue("subCaste", "");
              formik.setFieldValue("casteText", "");
              formik.setFieldValue("subCasteText", "");
              setSubCasteList([]);

              // Fix: Use getReligionCode instead of RELIGION_CODE_MAP for consistency with API data
              const religionCode = getReligionCode(itemValue);
              const filteredCastes = allCastes.filter(
                (c) => c.religion === religionCode,
              );
              setCasteList(filteredCastes);
            }}
          >
            <Picker.Item label="---- Select Religion ----" value="" />
            {religionList.length > 0 ? (
              religionList.map((religion) => (
                <Picker.Item
                  key={religion.religionid}
                  label={religion.religiondesc}
                  value={religion.religiondesc}
                />
              ))
            ) : (
              <>
                <Picker.Item label="Buddhist" value="Buddhist" />
                <Picker.Item label="Christian" value="Christian" />
                <Picker.Item label="Hindu" value="Hindu" />
                <Picker.Item label="Jain" value="Jain" />
                <Picker.Item label="Muslim" value="Muslim" />
                <Picker.Item label="Parsi" value="Parsi" />
                <Picker.Item label="Sikh" value="Sikh" />
                <Picker.Item label="Other" value="Other" />
              </>
            )}
          </Picker>
        </View>
        {/* {formik.errors.religion && formik.touched.religion && (
          <Text style={styles.errorText}>{formik.errors.religion}</Text>
        )} */}
      </View>

      {/* Caste Field */}
      <View style={styles.inputBlock}>
        <Text style={styles.label}>
          {getFieldLabel("caste")} <Text style={styles.requiredStar}>*</Text>
        </Text>
        {formik.values.religion === "Other" ? (
          <TextInput
            style={styles.input}
            value={formik.values.casteText}
            onChangeText={(text) => {
              formik.handleChange("casteText")(text);
              // Clear any validation errors when user types
              if (formik.errors.casteText) {
                formik.setFieldError("casteText", "");
              }
            }}
            onBlur={formik.handleBlur("casteText")}
            placeholder="Enter Caste"
          />
        ) : (
          <View style={globalStyes.selectBox}>
            <Picker
              style={globalStyes.pickerText}
              selectedValue={formik.values.caste}
              onValueChange={(itemValue) => {
                handleCasteChange(itemValue, formik.setFieldValue);
                formik.setFieldTouched("caste", true);
              }}
              enabled={!!formik.values.religion}
            >
              <Picker.Item label="---- Select Caste ----" value="" />
              {casteList.length > 0 ? (
                casteList.map((caste) => (
                  <Picker.Item
                    key={caste.caste_code}
                    label={caste.caste_desc}
                    value={caste.caste_code.toString()}
                  />
                ))
              ) : (
                <Picker.Item label="No castes available" value="" />
              )}
            </Picker>
          </View>
        )}
        {/* {formik.errors.caste && formik.touched.caste && (
          <Text style={styles.errorText}>{formik.errors.caste}</Text>
        )} */}
        {formik.values.religion === "Other" &&
          formik.errors.casteText &&
          formik.touched.casteText && (
            <Text style={styles.errorText}>{formik.errors.casteText}</Text>
          )}
      </View>

      {/* Sub Caste Field */}
      <View style={styles.inputBlock}>
        <Text style={styles.label}>
          {getFieldLabel("subCaste")} <Text style={styles.requiredStar}>*</Text>
        </Text>
        {formik.values.religion === "Other" ? (
          <TextInput
            style={styles.input}
            value={formik.values.subCasteText}
            onChangeText={(text) => {
              formik.handleChange("subCasteText")(text);
              // Clear any validation errors when user types
              if (formik.errors.subCasteText) {
                formik.setFieldError("subCasteText", "");
              }
            }}
            onBlur={formik.handleBlur("subCasteText")}
            placeholder="Enter Sub Caste"
          />
        ) : (
          <View style={globalStyes.selectBox}>
            <Picker
              style={globalStyes.pickerText}
              selectedValue={formik.values.subCaste}
              onValueChange={(itemValue) => {
                formik.setFieldValue("subCaste", itemValue);
                formik.setFieldTouched("subCaste", true);
              }}
              enabled={!!formik.values.caste && casteList.length > 0}
            >
              <Picker.Item label="---- Select Sub Caste ----" value="" />
              {subCasteList.length > 0 ? (
                subCasteList.map((sub) => (
                  <Picker.Item
                    key={sub.sub_caste_code}
                    label={getPureSubCasteName(sub.sub_caste_desc)}
                    value={sub.sub_caste_code.toString()}
                  />
                ))
              ) : (
                <Picker.Item label="No sub castes available" value="" />
              )}
            </Picker>
          </View>
        )}
        {/* {formik.errors.subCaste && formik.touched.subCaste && (
          <Text style={styles.errorText}>{formik.errors.subCaste}</Text>
        )} */}
        {formik.values.religion === "Other" &&
          formik.errors.subCasteText &&
          formik.touched.subCasteText && (
            <Text style={styles.errorText}>{formik.errors.subCasteText}</Text>
          )}
      </View>

      {/* Marital Status */}
      <View style={styles.inputBlock}>
        <Text style={styles.label}>
          {getFieldLabel("maritalStatus")}{" "}
          <Text style={styles.requiredStar}>*</Text>
        </Text>
        <View style={globalStyes.selectBox}>
          <Picker
            style={globalStyes.pickerText}
            selectedValue={formik.values.maritalStatus}
            onValueChange={(itemValue) => {
              formik.setFieldTouched("maritalStatus", true);
              formik.setFieldValue("maritalStatus", itemValue);
            }}
          >
            <Picker.Item label="----Select-----" value="" />
            <Picker.Item label="Unmarried" value="Single" />
            <Picker.Item label="Married" value="Married" />
            <Picker.Item label="Divorced" value="Divorced" />
            <Picker.Item label="Widower" value="Widower" />
            <Picker.Item label="Widow" value="Widow" />
          </Picker>
        </View>
        {/* {formik.errors.maritalStatus && formik.touched.maritalStatus && (
          <Text style={styles.errorText}>{formik.errors.maritalStatus}</Text>
        )} */}
      </View>

      {/* Other Contact Number */}
      <View style={styles.inputBlock}>
        <Text style={styles.label}>{getFieldLabel("otherContactNumber")}</Text>
        <TextInput
          style={styles.input}
          value={formik.values.otherContactNo}
          onChangeText={(text) => {
            let value = text.replace(/\D/g, "").slice(0, 10);
            // Block if first digit is 1–5
            if (value.length === 1 && !/[6-9]/.test(value)) {
              value = "";
            }
            formik.setFieldValue("otherContactNo", value);
          }}
          onBlur={formik.handleBlur("otherContactNo")}
          placeholder="Enter alternate number"
          keyboardType="numeric"
          maxLength={10}
        />
        {/* {formik.errors.otherContactNo && formik.touched.otherContactNo && (
          <Text style={styles.errorText}>{formik.errors.otherContactNo}</Text>
        )} */}
      </View>

      {/* Date Picker Modal */}
      <Modal visible={showDobPicker} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <DateTimePicker
              value={formatDateForPicker(formik.values.dob)}
              mode="date"
              display="spinner"
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  const age =
                    new Date().getFullYear() - selectedDate.getFullYear();
                  if (age >= 18 && age <= 80) {
                    formik.setFieldValue("dob", formatDateToApi(selectedDate));
                  } else {
                    Alert.alert("Error", "Age must be between 18 and 80 years");
                  }
                }
                setShowDobPicker(false);
              }}
              minimumDate={minDate}
              maximumDate={maxDate}
            />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowDobPicker(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
  // Render Family Tab
  const renderFamilyTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>{getFieldLabel("familyDetaile")}*</Text>

      {formik.values.familyDetails.map((member, index) => (
        <View key={index} style={styles.familyCard}>
          <Text style={styles.cardTitle}>
            {getFieldLabel("familyMember")} {index + 1}
          </Text>

          <View style={styles.inputBlock}>
            <Text style={styles.label}>{getFieldLabel("memberName")}*</Text>
            <TextInput
              style={[
                styles.input,
                formik.errors.familyDetails?.[index]?.familyMemberName &&
                  formik.touched.familyDetails?.[index]?.familyMemberName &&
                  styles.errorInput,
              ]}
              value={member.familyMemberName}
              onChangeText={(text) => {
                const familyDetails = [...formik.values.familyDetails];
                familyDetails[index].familyMemberName = text;
                formik.setFieldValue("familyDetails", familyDetails);
              }}
              onBlur={() => {
                formik.setFieldTouched(
                  `familyDetails[${index}].familyMemberName`,
                  true,
                );
              }}
              placeholder={`Enter ${getFieldLabel("memberName")}`}
            />
            {formik.errors.familyDetails?.[index]?.familyMemberName &&
              formik.touched.familyDetails?.[index]?.familyMemberName && (
                <Text style={styles.errorText}>
                  {formik.errors.familyDetails[index].familyMemberName}
                </Text>
              )}
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.label}>{getFieldLabel("relation")} *</Text>

            <View
              style={[
                styles.input,
                globalStyes.selectBox,
                formik.errors.familyDetails?.[index]?.relation &&
                  formik.touched.familyDetails?.[index]?.relation &&
                  styles.errorInput,
              ]}
            >
              <Picker
              style={globalStyes.pickerText}
                selectedValue={member.relation}
                onValueChange={(value) => {
                  const familyDetails = [...formik.values.familyDetails];
                  familyDetails[index].relation = value;
                  formik.setFieldValue("familyDetails", familyDetails);
                }}
                onBlur={() => {
                  formik.setFieldTouched(
                    `familyDetails[${index}].relation`,
                    true,
                  );
                }}
              >
                <Picker.Item label="--- Select ---" value="" />
                <Picker.Item label="Mother" value="1" />
                <Picker.Item label="Father" value="2" />
                <Picker.Item label="Brother" value="3" />
                <Picker.Item label="Sister" value="4" />
                <Picker.Item label="Grand Father" value="5" />
                <Picker.Item label="Grand Mother" value="6" />
                <Picker.Item label="Spouse" value="7" />
                <Picker.Item label="Daughter" value="8" />
                <Picker.Item label="Son" value="9" />
              </Picker>
            </View>

            {formik.errors.familyDetails?.[index]?.relation &&
              formik.touched.familyDetails?.[index]?.relation && (
                <Text style={styles.errorText}>
                  {formik.errors.familyDetails[index].relation}
                </Text>
              )}
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.label}>{getFieldLabel("memberDob")}*</Text>
            <TouchableOpacity
              style={[
                styles.datePickerButton,
                formik.errors.familyDetails?.[index]?.memberDob &&
                  formik.touched.familyDetails?.[index]?.memberDob &&
                  styles.errorInput,
              ]}
              onPress={() => {
                setSelectedMemberIndex(index);
                setShowMemberDobPicker(true);
              }}
              onBlur={() => {
                formik.setFieldTouched(
                  `familyDetails[${index}].memberDob`,
                  true,
                );
              }}
            >
              <Text style={styles.dateText}>
                {member.memberDob || `Select ${getFieldLabel("memberDob")}`}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#555" />
            </TouchableOpacity>
            {formik.errors.familyDetails?.[index]?.memberDob &&
              formik.touched.familyDetails?.[index]?.memberDob && (
                <Text style={styles.errorText}>
                  {formik.errors.familyDetails[index].memberDob}
                </Text>
              )}
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.label}>{getFieldLabel("aadhaarNo")}*</Text>
            <TextInput
              style={[
                styles.input,
                formik.errors.familyDetails?.[index]?.aadhaarNo &&
                  formik.touched.familyDetails?.[index]?.aadhaarNo &&
                  styles.errorInput,
              ]}
              value={member.aadhaarNo}
              onChangeText={(text) => {
                const familyDetails = [...formik.values.familyDetails];
                familyDetails[index].aadhaarNo = text
                  .replace(/\D/g, "")
                  .slice(0, 12);
                formik.setFieldValue("familyDetails", familyDetails);
              }}
              onBlur={() => {
                formik.setFieldTouched(
                  `familyDetails[${index}].aadhaarNo`,
                  true,
                );
              }}
              placeholder={`Enter ${getFieldLabel("aadhaarNo")}`}
              keyboardType="numeric"
              maxLength={12}
            />
            {formik.errors.familyDetails?.[index]?.aadhaarNo &&
              formik.touched.familyDetails?.[index]?.aadhaarNo && (
                <Text style={styles.errorText}>
                  {formik.errors.familyDetails[index].aadhaarNo}
                </Text>
              )}
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.label}>{getFieldLabel("isNomine")}*</Text>
            <View
              style={[
                globalStyes.selectBox,
                formik.errors.familyDetails?.[index]?.isNomine &&
                  formik.touched.familyDetails?.[index]?.isNomine &&
                  styles.errorSelect,
              ]}
            >
              <Picker
                selectedValue={member.isNomine}
                onValueChange={(itemValue) => {
                  const familyDetails = [...formik.values.familyDetails];
                  familyDetails[index].isNomine = itemValue;
                  if (itemValue !== "yes") {
                    familyDetails[index].nominePer = "";
                  }
                  formik.setFieldValue("familyDetails", familyDetails);
                  formik.setFieldTouched(
                    `familyDetails[${index}].isNomine`,
                    true,
                  );
                }}
              >
                <Picker.Item label="---Select---" value="" />
                <Picker.Item label="Yes" value="yes" />
                <Picker.Item label="No" value="no" />
              </Picker>
            </View>
            {formik.errors.familyDetails?.[index]?.isNomine &&
              formik.touched.familyDetails?.[index]?.isNomine && (
                <Text style={styles.errorText}>
                  {formik.errors.familyDetails[index].isNomine}
                </Text>
              )}
          </View>

          {formik.values.familyDetails[index].isNomine === "yes" && (
            <View style={styles.inputBlock}>
              <Text style={styles.label}>{getFieldLabel("nominePer")}*</Text>
              <View
                style={[
                  globalStyes.selectBox,
                  formik.errors.familyDetails?.[index]?.nominePer &&
                    formik.touched.familyDetails?.[index]?.nominePer &&
                    styles.errorSelect,
                ]}
              >
                <Picker
                  selectedValue={member.nominePer}
                  onValueChange={(itemValue) => {
                    const familyDetails = [...formik.values.familyDetails];
                    familyDetails[index].nominePer = itemValue;
                    formik.setFieldValue("familyDetails", familyDetails);
                    formik.setFieldTouched(
                      `familyDetails[${index}].nominePer`,
                      true,
                    );
                  }}
                >
                  <Picker.Item label="----Select-----" value="" />
                  {Array.from({ length: 20 }, (_, i) => (i + 1) * 5).map(
                    (value) => (
                      <Picker.Item
                        key={value}
                        label={value.toString()}
                        value={value.toString()}
                      />
                    ),
                  )}
                </Picker>
              </View>
              {formik.errors.familyDetails?.[index]?.nominePer &&
                formik.touched.familyDetails?.[index]?.nominePer && (
                  <Text style={styles.errorText}>
                    {formik.errors.familyDetails[index].nominePer}
                  </Text>
                )}
            </View>
          )}

          {formik.values.familyDetails.length > 1 && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeFamilyMember(index)}
            >
              <Text style={styles.removeButtonText}>Remove Member</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      <TouchableOpacity style={styles.addButton} onPress={addFamilyMember}>
        <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
        <Text style={styles.addButtonText}>Add Family Member</Text>
      </TouchableOpacity>

      {showMemberDobPicker && (
        <DateTimePicker
          value={formatDateForPicker(
            selectedMemberIndex !== null
              ? formik.values.familyDetails[selectedMemberIndex]?.memberDob
              : null,
          )}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowMemberDobPicker(false);
            if (selectedDate && selectedMemberIndex !== null) {
              const familyDetails = [...formik.values.familyDetails];
              familyDetails[selectedMemberIndex].memberDob =
                formatDateToApi(selectedDate);
              formik.setFieldValue("familyDetails", familyDetails);
              formik.setFieldTouched(
                `familyDetails[${selectedMemberIndex}].memberDob`,
                true,
              );
              setSelectedMemberIndex(null);
            }
          }}
        />
      )}
    </View>
  );

  const getBankByIFSC = async (ifsc, setFieldValue) => {
    if (!ifsc || ifsc.length < 11) {
      setFieldValue("bankName", "");
      setFieldValue("branchName", "");
      return;
    }

    try {
      const res = await commonAPICall(
        `${BANK_DETAILS}?ifscCode=${ifsc}`,
        {},
        "GET",
        dispatch,
      );

      if (res.data?.status === "success" && res.data.Banks?.length > 0) {
        const bank = res.data.Banks[0];

        setFieldValue("bankName", bank.bankname || "");
        setFieldValue("branchName", bank.branch_name || "");
      } else {
        setFieldValue("bankName", "");
        setFieldValue("branchName", "");
      }
    } catch (error) {
      console.error("IFSC API error", error);

      setFieldValue("bankName", "");
      setFieldValue("branchName", "");
    }
  };

  // Render Bank Tab
  const renderBankTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>{getFieldLabel("bankDetailes")}</Text>

      <View style={styles.inputBlock}>
        <Text style={styles.label}>
          {getFieldLabel("ifscCode")} <Text style={styles.requiredStar}>*</Text>
        </Text>
        <TextInput
          style={[
            styles.input,
            formik.errors.ifscCode &&
              formik.touched.ifscCode &&
              styles.inputError,
          ]}
          value={formik.values.ifscCode?.toUpperCase() || ""}
          onChangeText={(text) => {
            const val = text.toUpperCase();

            formik.setFieldValue("ifscCode", val);

            if (val.length < 11) {
              getBankByIFSC(val, formik.setFieldValue);
            }

            if (val.length === 11) {
              getBankByIFSC(val, formik.setFieldValue);
            }
          }}
          onBlur={formik.handleBlur("ifscCode")}
          placeholder={`Enter ${getFieldLabel("ifscCode")}`}
          maxLength={11}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        {formik.errors.ifscCode && formik.touched.ifscCode && (
          <Text style={styles.errorText}>{formik.errors.ifscCode}</Text>
        )}
      </View>

      <View style={styles.inputBlock}>
        <Text style={styles.label}>{getFieldLabel("bankName")}</Text>
        <TextInput
          style={styles.input}
          value={formik.values.bankName}
          onChangeText={formik.handleChange("bankName")}
          onBlur={formik.handleBlur("bankName")}
          placeholder={`Enter ${getFieldLabel("bankName")}`}
        />
      </View>

      <View style={styles.inputBlock}>
        <Text style={styles.label}>{getFieldLabel("branchName")}</Text>
        <TextInput
          style={styles.input}
          value={formik.values.branchName}
          onChangeText={formik.handleChange("branchName")}
          onBlur={formik.handleBlur("branchName")}
          placeholder={`Enter ${getFieldLabel("branchName")}`}
        />
      </View>

      <View style={styles.inputBlock}>
        <Text style={styles.label}>
          {getFieldLabel("bankAccountNo")}{" "}
          <Text style={styles.requiredStar}>*</Text>
        </Text>
        <TextInput
          style={[
            styles.input,
            formik.errors.bankAccountNo &&
              formik.touched.bankAccountNo &&
              styles.inputError,
          ]}
          value={formik.values.bankAccountNo}
          onChangeText={formik.handleChange("bankAccountNo")}
          onBlur={formik.handleBlur("bankAccountNo")}
          placeholder={`Enter ${getFieldLabel("bankAccountNo")}`}
          keyboardType="numeric"
        />
        {formik.errors.bankAccountNo && formik.touched.bankAccountNo && (
          <Text style={styles.errorText}>{formik.errors.bankAccountNo}</Text>
        )}
      </View>

      <View style={styles.inputBlock}>
        <Text style={styles.label}>
          {getFieldLabel("rbankAccountNo")}{" "}
          <Text style={styles.requiredStar}>*</Text>
        </Text>
        <TextInput
          style={[
            styles.input,
            formik.errors.rbankAccountNo &&
              formik.touched.rbankAccountNo &&
              styles.inputError,
          ]}
          value={formik.values.rbankAccountNo}
          onChangeText={formik.handleChange("rbankAccountNo")}
          onBlur={formik.handleBlur("rbankAccountNo")}
          placeholder={`Re-enter ${getFieldLabel("bankAccountNo")}`}
          keyboardType="numeric"
        />
        {formik.errors.rbankAccountNo && formik.touched.rbankAccountNo && (
          <Text style={styles.errorText}>{formik.errors.rbankAccountNo}</Text>
        )}
      </View>

      <View style={styles.inputBlock}>
        <Text style={styles.label}>{getFieldLabel("nameInBank")}</Text>
        <TextInput
          style={styles.input}
          value={formik.values.nameInBank}
          onChangeText={formik.handleChange("nameInBank")}
          onBlur={formik.handleBlur("nameInBank")}
          placeholder={`Enter ${getFieldLabel("nameInBank")}`}
        />
      </View>
    </View>
  );

  const [statesList, setStatesList] = useState([]);

  const getStates = async () => {
    const res = await commonAPICall(GET_STATES_API, null, "GET", dispatch);

    if (res?.status === 200) {
      setStatesList(res.data?.States || []);
    }
  };

  useEffect(() => {
    getStates();
  }, []);

  const copyPermanentToPresent = (value) => {
    if (value) {
      formik.setFieldValue("presentState", formik.values.permanentState);
      formik.setFieldValue(
        "presentDistrictCode",
        formik.values.permanentDistrictCode,
      );
      formik.setFieldValue(
        "presentMadalCode",
        formik.values.permanentMadalCode,
      );
      formik.setFieldValue(
        "presentVillageCode",
        formik.values.permanentVillageCode,
      );
      formik.setFieldValue("presentPincode", formik.values.permanentPincode);
      formik.setFieldValue("presentDoorNo", formik.values.permanentDoorNo);
      formik.setFieldValue("presentAddress", formik.values.permanentAddress);
      formik.setFieldValue("presentDivision", formik.values.permanentDivision);
      formik.setFieldValue("presentLandMark", formik.values.permanentLandMark);
      formik.setFieldValue("presentCity", formik.values.permanentCity);
    }
  };

  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [mandals, setMandals] = useState([]);
  const [mandals2, setMandals2] = useState([]);
  const [villages, setVillages] = useState([]);
  const [villages2, setVillages2] = useState([]);
  const [mandals3, setMandals3] = useState([]);
  const [villages3, setVillages3] = useState([]);

  useEffect(() => {
    loadDistricts();
  }, []);

  const [perDist, setPerDist] = useState([]);

  const loadDistricts = async () => {
    const response = await commonAPICall(
      GET_DISTRICT_REPORT,
      {},
      "GET",
      dispatch,
    );

    if (response?.status === 200) {
      const districts = response.data?.districts || [];

      setPerDist(districts);
      //   setEmpDist(districts);
      //   setEstDist(districts);
    }
  };
  const getMandals = (distCode, from) => {
    const distId = Number(distCode);

    const selectedDistrict = perDist.find((d) => d.districtId === distId);
    if (from === "per") {
      setMandals(selectedDistrict?.mandals || []);
    } else if (from === "pre") {
      setMandals2(selectedDistrict?.mandals || []);
    } else {
      setMandals3(selectedDistrict?.mandals || []);
    }
  };
  const getVillages = async (mandalCode, distCode, from) => {
    const query = `?dist_code=${distCode}&mandal_code=${mandalCode}`;

    const response = await commonAPICall(
      `${GET_VILLAGES}${query}`,
      {},
      "GET",
      dispatch,
    );

    if (response?.status === 200) {
      if (from === "per") {
        setVillages(response.data?.villages || []);
      } else if (from === "pre") {
        setVillages2(response.data?.villages || []);
      } else {
        setVillages3(response.data?.villages || []);
      }
    }
  };

  // Render Address Tab
  const renderAddressTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>
        {getFieldLabel("paddress") || "శాశ్వత చిరునామా"}
      </Text>

      {/* State */}
      <View style={styles.inputBlock}>
        <Text style={styles.label}>
          {getFieldLabel("state") || "రాష్ట్రం"}{" "}
          <Text style={styles.requiredStar}>*</Text>
        </Text>
        <View style={globalStyes.selectBox}>
          <Picker
            style={globalStyes.pickerText}
            selectedValue={formik.values.permanentState}
            onValueChange={(itemValue) => {
              formik.setFieldValue("permanentState", itemValue);
              formik.setFieldValue("permanentDistrictCode", "");
              formik.setFieldValue("permanentMadalCode", "");
              formik.setFieldValue("permanentVillageCode", "");
              //   if (itemValue) {
              //     fetchDistricts(itemValue);
              //   }
            }}
          >
            <Picker.Item label="---Select State---" value="" />
            {statesList.map((state) => (
              <Picker.Item
                key={state.state_id}
                label={state.state_name}
                value={String(state.state_id)}
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* District - Conditional rendering based on state code */}
      <View style={styles.inputBlock}>
        <Text style={styles.label}>
          {getFieldLabel("permanentDistrictCode") || "జిల్లా"}{" "}
          <Text style={styles.requiredStar}>*</Text>
        </Text>
        {formik.values.permanentState === "2" ? (
          <View style={globalStyes.selectBox}>
            <Picker
              style={globalStyes.pickerText}
              selectedValue={formik.values.permanentDistrictCode}
              onValueChange={(itemValue) => {
                formik.setFieldValue("permanentDistrictCode", itemValue);
                formik.setFieldValue("permanentMadalCode", "");
                formik.setFieldValue("permanentVillageCode", "");

                setMandals([]);
                setVillages([]);

                if (itemValue) {
                  getMandals(itemValue, "per");
                }
              }}
              enabled={!!formik.values.permanentState}
            >
              <Picker.Item label="---Select District---" value="" />
              {dists28.map((district) => (
                <Picker.Item
                  key={district.dist_code}
                  label={district.dist_name}
                  value={String(district.dist_code)}
                />
              ))}
            </Picker>
          </View>
        ) : (
          <TextInput
            style={styles.input}
            value={formik.values.permanentDistrictCode}
            onChangeText={formik.handleChange("permanentDistrictCode")}
            placeholder="Enter District"
            editable={!!formik.values.permanentState}
          />
        )}
      </View>

      {/* Mandal - Conditional rendering based on state code */}
      <View style={styles.inputBlock}>
        <Text style={styles.label}>
          {getFieldLabel("permanentMadalCode") || "మండలం"}{" "}
          <Text style={styles.requiredStar}>*</Text>
        </Text>
        {formik.values.permanentState === "2" ? (
          <View style={globalStyes.selectBox}>
            <Picker
              style={globalStyes.pickerText}
              selectedValue={formik.values.permanentMadalCode}
              onValueChange={(itemValue) => {
                formik.setFieldValue("permanentMadalCode", itemValue);
                formik.setFieldValue("permanentVillageCode", "");

                setVillages([]);

                if (itemValue && formik.values.permanentDistrictCode) {
                  getVillages(
                    itemValue,
                    formik.values.permanentDistrictCode,
                    "per",
                  );
                }
              }}
              enabled={!!formik.values.permanentDistrictCode}
            >
              <Picker.Item label="---Select Mandal---" value="" />
              {mandals.map((mandal) => (
                <Picker.Item
                  key={mandal.mandalCode}
                  label={mandal.mandalName}
                  value={String(mandal.mandalCode)}
                />
              ))}
            </Picker>
          </View>
        ) : (
          <TextInput
            style={styles.input}
            value={formik.values.permanentMadalCode}
            onChangeText={formik.handleChange("permanentMadalCode")}
            placeholder="Enter Mandal"
            editable={!!formik.values.permanentDistrictCode}
          />
        )}
      </View>

      {/* Village - Conditional rendering based on state code */}
      <View style={styles.inputBlock}>
        <Text style={styles.label}>
          {getFieldLabel("permanentVillageCode") || "గ్రామం"}{" "}
          <Text style={styles.requiredStar}>*</Text>
        </Text>
        {formik.values.permanentState === "2" ? (
          <View style={globalStyes.selectBox}>
            <Picker
              style={globalStyes.pickerText}
              selectedValue={formik.values.permanentVillageCode}
              onValueChange={(itemValue) => {
                formik.setFieldValue("permanentVillageCode", itemValue);
              }}
              enabled={!!formik.values.permanentMadalCode}
            >
              <Picker.Item label="---Select Village---" value="" />
              {villages.map((village) => (
                <Picker.Item
                  key={village.village_code}
                  label={village.village_name}
                  value={String(village.village_code)}
                />
              ))}
            </Picker>
          </View>
        ) : (
          <TextInput
            style={styles.input}
            value={formik.values.permanentVillageCode}
            onChangeText={formik.handleChange("permanentVillageCode")}
            placeholder="Enter Village"
            editable={!!formik.values.permanentMadalCode}
          />
        )}
      </View>

      {/* Pincode */}
      <View style={styles.inputBlock}>
        <Text style={styles.label}>
          {getFieldLabel("presentPincode") || "పిన్ కోడ్"}
        </Text>
        <TextInput
          style={styles.input}
          value={formik.values.permanentPincode}
          onChangeText={(text) => {
            const value = text.replace(/\D/g, "").slice(0, 6);
            formik.setFieldValue("permanentPincode", value);
          }}
          placeholder="Enter Pincode"
          keyboardType="numeric"
          maxLength={6}
        />
      </View>

      {/* Division / Ward Number */}
      <View style={styles.inputBlock}>
        <Text style={styles.label}>
          {getFieldLabel("presentDivision") || "డివిజన్ / వార్డు నంబర్"}
        </Text>
        <TextInput
          style={styles.input}
          value={formik.values.permanentDivision}
          onChangeText={formik.handleChange("permanentDivision")}
          placeholder={`Enter ${getFieldLabel("presentDivision") || "Division / Ward Number"}`}
        />
      </View>

      {/* Landmark / Area */}
      <View style={styles.inputBlock}>
        <Text style={styles.label}>
          {getFieldLabel("presentLandMark") || "ల్యాండ్ మార్క్ / ప్రాంతం"}
        </Text>
        <TextInput
          style={styles.input}
          value={formik.values.permanentLandMark}
          onChangeText={formik.handleChange("permanentLandMark")}
          placeholder={`Enter ${getFieldLabel("presentLandMark") || "Landmark / Area"}`}
        />
      </View>

      {/* Town / City */}
      <View style={styles.inputBlock}>
        <Text style={styles.label}>
          {getFieldLabel("presentCity") || "పట్టణం / నగరం"}
        </Text>
        <TextInput
          style={styles.input}
          value={formik.values.permanentCity}
          onChangeText={formik.handleChange("permanentCity")}
          placeholder={`Enter ${getFieldLabel("presentCity") || "Town / City"}`}
        />
      </View>

      {/* Same as Permanent Address Switch */}
      <View style={styles.inputBlock}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              flex: 1,
              flexShrink: 1,
              fontSize: 14,
              marginRight: 10,
            }}
          >
            {getFieldLabel("isPermanent") ||
              "ప్రస్తుత చిరునామా శాశ్వత చిరునామా లాగే ఉందా?"}
          </Text>

          <Switch
            value={formik.values.isPermanent}
            onValueChange={(value) => {
              formik.setFieldValue("isPermanent", value);
              copyPermanentToPresent(value);
            }}
            trackColor={{ false: "#767577", true: "#007AFF" }}
          />
        </View>
      </View>

      {/* Present Address Section - Only show if isPermanent is false */}
      {!formik.values.isPermanent && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
            {getFieldLabel("PresentAddress") || "ప్రస్తుత చిరునామా"}
          </Text>

          <View style={styles.inputBlock}>
            <Text style={styles.label}>
              {getFieldLabel("state") || "రాష్ట్రం"}
            </Text>
            <View style={globalStyes.selectBox}>
              <Picker
                style={globalStyes.pickerText}
                selectedValue={formik.values.presentState}
                onValueChange={(itemValue) => {
                  formik.setFieldValue("presentState", itemValue);
                  formik.setFieldValue("presentDistrictCode", "");
                  formik.setFieldValue("presentMadalCode", "");
                  formik.setFieldValue("presentVillageCode", "");
                }}
              >
                <Picker.Item label="---Select State---" value="" />
                {statesList.map((state) => (
                  <Picker.Item
                    key={state.state_id}
                    label={state.state_name}
                    value={String(state.state_id)}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.label}>
              {getFieldLabel("permanentDistrictCode") || "జిల్లా"}
            </Text>
            {formik.values.presentState === "2" ? (
              <View style={globalStyes.selectBox}>
                <Picker
                  style={globalStyes.pickerText}
                  selectedValue={formik.values.presentDistrictCode}
                  onValueChange={(itemValue) => {
                    formik.setFieldValue("presentDistrictCode", itemValue);
                    formik.setFieldValue("presentMadalCode", "");
                    formik.setFieldValue("presentVillageCode", "");
                    if (itemValue) {
                      getMandals(itemValue, "pre");
                    }
                  }}
                >
                  <Picker.Item label="---Select District---" value="" />
                  {dists28.map((district) => (
                    <Picker.Item
                      key={district.dist_code}
                      label={district.dist_name}
                      value={String(district.dist_code)}
                    />
                  ))}
                </Picker>
              </View>
            ) : (
              <TextInput
                style={styles.input}
                value={formik.values.presentDistrictCode}
                onChangeText={formik.handleChange("presentDistrictCode")}
                placeholder="Enter District"
              />
            )}
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.label}>
              {getFieldLabel("presentMadalCode") || "మండలం"}
            </Text>
            {formik.values.presentState === "2" ? (
              <View style={globalStyes.selectBox}>
                <Picker
                  style={globalStyes.pickerText}
                  selectedValue={formik.values.presentMadalCode}
                  onValueChange={(itemValue) => {
                    formik.setFieldValue("presentMadalCode", itemValue);
                    formik.setFieldValue("presentVillageCode", "");
                    if (itemValue && formik.values.presentDistrictCode) {
                      getVillages(
                        itemValue,
                        formik.values.presentDistrictCode,
                        "pre",
                      );
                    }
                  }}
                >
                  <Picker.Item label="---Select Mandal---" value="" />
                  {mandals2.map((mandal) => (
                    <Picker.Item
                      key={mandal.mandalCode}
                      label={mandal.mandalName}
                      value={String(mandal.mandalCode)}
                    />
                  ))}
                </Picker>
              </View>
            ) : (
              <TextInput
                style={styles.input}
                value={formik.values.presentMadalCode}
                onChangeText={formik.handleChange("presentMadalCode")}
                placeholder="Enter Mandal"
              />
            )}
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.label}>
              {getFieldLabel("presentVillageCode") || "గ్రామం"}
            </Text>
            {formik.values.presentState === "2" ? (
              <View style={globalStyes.selectBox}>
                <Picker
                  style={globalStyes.pickerText}
                  selectedValue={formik.values.presentVillageCode}
                  onValueChange={(itemValue) => {
                    formik.setFieldValue("presentVillageCode", itemValue);
                  }}
                >
                  <Picker.Item label="---Select Village---" value="" />
                  {villages2.map((village) => (
                    <Picker.Item
                      key={village.village_code}
                      label={village.village_name}
                      value={String(village.village_code)}
                    />
                  ))}
                </Picker>
              </View>
            ) : (
              <TextInput
                style={styles.input}
                value={formik.values.presentVillageCode}
                onChangeText={formik.handleChange("presentVillageCode")}
                placeholder="Enter Village"
              />
            )}
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.label}>
              {getFieldLabel("presentPincode") || "పిన్ కోడ్"}
            </Text>
            <TextInput
              style={styles.input}
              value={formik.values.presentPincode}
              onChangeText={(text) => {
                const value = text.replace(/\D/g, "").slice(0, 6);
                formik.setFieldValue("presentPincode", value);
              }}
              placeholder="Enter Pincode"
              keyboardType="numeric"
              maxLength={6}
            />
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.label}>
              {getFieldLabel("presentDoorNo") || "డోర్ నంబర్"}
            </Text>
            <TextInput
              style={styles.input}
              value={formik.values.presentDoorNo}
              onChangeText={formik.handleChange("presentDoorNo")}
              placeholder="Enter Door No"
            />
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.label}>
              {getFieldLabel("presentDivision") || "డివిజన్ / వార్డు నంబర్"}
            </Text>
            <TextInput
              style={styles.input}
              value={formik.values.presentDivision}
              onChangeText={formik.handleChange("presentDivision")}
              placeholder="Enter Division / Ward Number"
            />
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.label}>
              {getFieldLabel("presentLandMark") || "ల్యాండ్ మార్క్ / ప్రాంతం"}
            </Text>
            <TextInput
              style={styles.input}
              value={formik.values.presentLandMark}
              onChangeText={formik.handleChange("presentLandMark")}
              placeholder="Enter Landmark / Area"
            />
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.label}>
              {getFieldLabel("presentCity") || "పట్టణం / నగరం"}
            </Text>
            <TextInput
              style={styles.input}
              value={formik.values.presentCity}
              onChangeText={formik.handleChange("presentCity")}
              placeholder="Enter Town / City"
            />
          </View>
        </>
      )}
    </View>
  );

  // Render Employment Tab
  const renderEmploymentTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>{getFieldLabel("otherDetailes")}</Text>

      {/* isNregs Question with Yes/No and conditional jobCardNo */}
      <View style={styles.inputBlock}>
        <Text style={styles.label}>{getFieldLabel("isNregs")}</Text>
        <View style={styles.radioGroup}>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => formik.setFieldValue("isNregs", "Y")}
          >
            <View
              style={[
                styles.radioCircle,
                formik.values.isNregs === "Y" && styles.radioSelected,
              ]}
            />
            <Text style={styles.radioLabel}>Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => formik.setFieldValue("isNregs", "N")}
          >
            <View
              style={[
                styles.radioCircle,
                formik.values.isNregs === "N" && styles.radioSelected,
              ]}
            />
            <Text style={styles.radioLabel}>No</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Job Card No - Conditional (only shows if isNregs is "Y") */}
      {formik.values.isNregs === "Y" && (
        <View style={styles.inputBlock}>
          <Text style={styles.label}>{getFieldLabel("jobCardNo")}</Text>
          <TextInput
            style={styles.input}
            value={formik.values.jobCardNo}
            onChangeText={formik.handleChange("jobCardNo")}
            onBlur={formik.handleBlur("jobCardNo")}
            placeholder={`Enter ${getFieldLabel("jobCardNo")}`}
            maxLength={12}
          />
        </View>
      )}

      {/* isUnionMember Question with Yes/No and conditional fields */}
      <View style={styles.inputBlock}>
        <Text style={styles.label}>{getFieldLabel("isUnionMember")}</Text>
        <View style={styles.radioGroup}>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => formik.setFieldValue("isUnionMember", "Y")}
          >
            <View
              style={[
                styles.radioCircle,
                formik.values.isUnionMember === "Y" && styles.radioSelected,
              ]}
            />
            <Text style={styles.radioLabel}>Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => formik.setFieldValue("isUnionMember", "N")}
          >
            <View
              style={[
                styles.radioCircle,
                formik.values.isUnionMember === "N" && styles.radioSelected,
              ]}
            />
            <Text style={styles.radioLabel}>No</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Union Name and Reg No - Conditional (only shows if isUnionMember is "Y") */}
      {formik.values.isUnionMember === "Y" && (
        <>
          <View style={styles.inputBlock}>
            <Text style={styles.label}>{getFieldLabel("unionName")}</Text>
            <TextInput
              style={styles.input}
              value={formik.values.unionName}
              onChangeText={formik.handleChange("unionName")}
              onBlur={formik.handleBlur("unionName")}
              placeholder={`Enter ${getFieldLabel("unionName")}`}
            />
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.label}>{getFieldLabel("regNo")}</Text>
            <TextInput
              style={styles.input}
              value={formik.values.regNo}
              onChangeText={formik.handleChange("regNo")}
              onBlur={formik.handleBlur("regNo")}
              placeholder={`Enter ${getFieldLabel("regNo")}`}
              maxLength={12}
            />
          </View>
        </>
      )}
    </View>
  );

  const renderWorkTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>{getFieldLabel("workPlace")}</Text>

      <View style={styles.inputBlock}>
        <Text style={styles.label}>{getFieldLabel("empName")}</Text>
        <TextInput
          style={styles.input}
          value={formik.values.empName}
          onChangeText={formik.handleChange("empName")}
          onBlur={formik.handleBlur("empName")}
          placeholder={`Enter ${getFieldLabel("empName") || "Employer Name"}`}
        />
      </View>

      <View style={styles.inputBlock}>
        <Text style={styles.label}>{getFieldLabel("presentOfficeName")}</Text>
        <TextInput
          style={styles.input}
          value={formik.values.presentOfficeName}
          onChangeText={formik.handleChange("presentOfficeName")}
          onBlur={formik.handleBlur("presentOfficeName")}
          placeholder={`Enter ${getFieldLabel("presentOfficeName") || "Construction Company Name"}`}
        />
      </View>

      <View style={styles.inputBlock}>
        <Text style={styles.label}>{getFieldLabel("typeOfWork")}</Text>
        <View style={globalStyes.selectBox}>
          <Picker
            style={globalStyes.pickerText}
            selectedValue={formik.values.typeOfWork}
            onValueChange={(itemValue) => {
              formik.setFieldTouched("typeOfWork", true);
              formik.setFieldValue("typeOfWork", itemValue);
            }}
          >
            <Picker.Item label="---Select Work Type---" value="" />
            <Picker.Item label="Construction" value="construction" />
            <Picker.Item label="Agriculture" value="agriculture" />
            <Picker.Item label="Manufacturing" value="manufacturing" />
            <Picker.Item label="Services" value="services" />
            <Picker.Item label="Other" value="other" />
          </Picker>
        </View>
      </View>

      <View style={styles.inputBlock}>
        <Text style={styles.label}>{getFieldLabel("workCapability")}</Text>
        <View style={styles.radioGroup}>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => formik.setFieldValue("workCapability", "yes")}
          >
            <View
              style={[
                styles.radioCircle,
                formik.values.workCapability === "yes" && styles.radioSelected,
              ]}
            />
            <Text style={styles.radioLabel}>Yes / అవును</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.radioOption}
            onPress={() => formik.setFieldValue("workCapability", "no")}
          >
            <View
              style={[
                styles.radioCircle,
                formik.values.workCapability === "no" && styles.radioSelected,
              ]}
            />
            <Text style={styles.radioLabel}>No / కాదు</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputBlock}>
        <Text style={styles.label}>{getFieldLabel("district")}</Text>
        <View style={globalStyes.selectBox}>
          <Picker
            style={globalStyes.pickerText}
            selectedValue={formik.values.workDistrict}
            onValueChange={(itemValue) => {
              formik.setFieldValue("workDistrict", itemValue);
              formik.setFieldValue("workMandal", "");
              formik.setFieldValue("workVillage", "");
              if (itemValue) {
                getMandals(itemValue, "work");
              }
            }}
          >
            <Picker.Item label="---Select District---" value="" />
            {dists28.map((district) => (
              <Picker.Item
                key={district.dist_code}
                label={district.dist_name}
                value={String(district.dist_code)}
              />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.inputBlock}>
        <Text style={styles.label}>{getFieldLabel("mandal")}</Text>
        <View style={globalStyes.selectBox}>
          <Picker
            style={globalStyes.pickerText}
            selectedValue={formik.values.workMandal}
            onValueChange={(itemValue) => {
              formik.setFieldValue("workMandal", itemValue);
              formik.setFieldValue("workVillage", "");
              if (itemValue) {
                getVillages(itemValue, formik.values.workDistrict, "work");
              }
            }}
            enabled={!!formik.values.workDistrict}
          >
            <Picker.Item label="---Select Mandal---" value="" />
            {mandals3.map((mandal) => (
              <Picker.Item
                key={mandal.mandalCode}
                label={mandal.mandalName}
                value={String(mandal.mandalCode)}
              />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.inputBlock}>
        <Text style={styles.label}>{getFieldLabel("village")}</Text>
        <View style={globalStyes.selectBox}>
          <Picker
            style={globalStyes.pickerText}
            selectedValue={formik.values.workVillage}
            onValueChange={(itemValue) => {
              formik.setFieldValue("workVillage", itemValue);
            }}
            enabled={!!formik.values.workMandal}
          >
            <Picker.Item label="---Select Village---" value="" />
            {villages3.map((village) => (
              <Picker.Item
                key={village.village_code}
                label={village.village_name}
                value={String(village.village_code)}
              />
            ))}
          </Picker>
        </View>
      </View>

      {/* Door No - Added */}
      <View style={styles.inputBlock}>
        <Text style={styles.label}>
          {getFieldLabel("doorNo") || "డోర్ నంబర్"}
        </Text>
        <TextInput
          style={styles.input}
          value={formik.values.workDoorNo}
          onChangeText={formik.handleChange("workDoorNo")}
          onBlur={formik.handleBlur("workDoorNo")}
          placeholder={`Enter ${getFieldLabel("doorNo") || "Door No"}`}
        />
      </View>

      {/* Pincode - Added */}
      <View style={styles.inputBlock}>
        <Text style={styles.label}>
          {getFieldLabel("pincode") || "పిన్ కోడ్"}
        </Text>
        <TextInput
          style={styles.input}
          value={formik.values.workPincode}
          onChangeText={(text) => {
            const value = text.replace(/\D/g, "").slice(0, 6);
            formik.setFieldValue("workPincode", value);
          }}
          onBlur={formik.handleBlur("workPincode")}
          placeholder={`Enter ${getFieldLabel("pincode") || "Pincode"}`}
          keyboardType="numeric"
          maxLength={6}
        />
      </View>
    </View>
  );

  // Render Documents Tab
  const renderDocumentsTab = () => {
    const openPDF = (url) => {
      Linking.openURL(url).catch((err) => {
        console.error("Failed to open URL:", err);
        showErrorToast("Failed to open document", "error");
      });
    };

    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>{getFieldLabel("upload")}</Text>

        {/* NOTE Section for Self Declaration */}
        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            <Text style={styles.noteLabel}>NOTE: </Text>
            <Text
              style={styles.noteLink}
              onPress={() =>
                openPDF(
                  "https://swapi.dev.nidhi.apcfss.in/socialwelfaredms/user-defined-path/file-download/labour/1776922353301_selfAffidavitDesc-english.pdf",
                )
              }
            >
              Click Here{" "}
              <Ionicons name="download-outline" size={14} color="#28a745" />
            </Text>
            <Text>
              {" "}
              to Download Self Declaration. Sign the document & upload{" "}
            </Text>
            <Text style={styles.noteHighlight}>(In English)</Text>
          </Text>
          <Text style={[styles.noteText, { marginTop: 8 }]}>
            <Text
              style={styles.noteLink}
              onPress={() =>
                openPDF(
                  "https://swapi.dev.nidhi.apcfss.in/socialwelfaredms/user-defined-path/file-download/labour/1776774368863_RegistrationSelfDeclaration-telugu.pdf",
                )
              }
            >
              Click Here{" "}
              <Ionicons name="download-outline" size={14} color="#28a745" />
            </Text>
            <Text>
              {" "}
              స్వీయ ధృవీకరణ డౌన్లోడ్ చేసుకోండి. డాక్యుమెంట్ సంతకం చేసి అప్‌లోడ్
              చేయండి.{" "}
            </Text>
            <Text style={styles.noteHighlight}>(In Telugu)</Text>
          </Text>
        </View>

        {/* Row 1: Photo, Signature, Self Declaration - 3 columns */}
        <View style={styles.docRow}>
          {/* Photo Upload */}
          <View style={styles.docColumn}>
            <View style={styles.inputBlock}>
              <Text style={styles.label}>
                {getFieldLabel("photoDesc")}{" "}
                <Text style={styles.requiredStar}>*</Text>
              </Text>

              <TouchableOpacity
                style={styles.uploadButton}
                onPress={async () => {
                  ImageBucketRN(
                    formik,
                    "APFD/WORKER/PHOTO/",
                    "photoDesc",
                    20971520,
                    "all",
                    dispatch,
                  );
                }}
              >
                <View style={styles.uploadButtonContent}>
                  <Ionicons
                    name="camera"
                    size={20}
                    color="#fff"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.uploadButtonText}>
                    Choose {getFieldLabel("photoDesc")}
                  </Text>
                </View>
              </TouchableOpacity>

              {formik.touched.photoDesc && formik.errors.photoDesc && (
                <Text style={styles.errorText}>{formik.errors.photoDesc}</Text>
              )}

              {formik?.values?.photoDesc &&
                typeof formik?.values?.photoDesc === "string" && (
                  <View style={styles.previewContainer}>
                    <Image
                      source={{ uri: formik.values.photoDesc }}
                      style={{ width: 150, height: 150, borderRadius: 8 }}
                      onError={(e) =>
                        console.log("Image load error:", e.nativeEvent)
                      }
                    />
                  </View>
                )}
            </View>
          </View>

          {/* Signature Upload */}
          <View style={styles.docColumn}>
            <View style={styles.inputBlock}>
              <Text style={styles.label}>
                {getFieldLabel("signatureDesc")}{" "}
                <Text style={styles.requiredStar}>*</Text>
              </Text>

              <TouchableOpacity
                style={styles.uploadButton}
                onPress={async () => {
                  formik.setFieldTouched("signatureDesc", true);
                  await ImageBucketRN(
                    formik,
                    "APFD/WORKER/SIGNATURE/",
                    "signatureDesc",
                    20971520,
                    "all",
                    dispatch,
                  );
                }}
              >
                <View style={styles.uploadButtonContent}>
                  <Ionicons
                    name="camera"
                    size={20}
                    color="#fff"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.uploadButtonText}>
                    Capture {getFieldLabel("signatureDesc")}
                  </Text>
                </View>
              </TouchableOpacity>

              {formik.touched.signatureDesc && formik.errors.signatureDesc && (
                <Text style={styles.errorText}>
                  {formik.errors.signatureDesc}
                </Text>
              )}

              {formik.values.signatureDesc &&
                typeof formik.values.signatureDesc === "string" && (
                  <View style={styles.previewContainer}>
                    <Image
                      source={{ uri: formik.values.signatureDesc }}
                      style={{ width: 150, height: 150, borderRadius: 8 }}
                    />
                  </View>
                )}
            </View>
          </View>

          {/* Self Declaration Upload */}
          <View style={styles.docColumn}>
            <View style={styles.inputBlock}>
              <Text style={styles.label}>
                {getFieldLabel("selfAffidavitDesc")}{" "}
                <Text style={styles.requiredStar}>*</Text>
              </Text>

              <TouchableOpacity
                style={styles.uploadButton}
                onPress={async () => {
                  formik.setFieldTouched("selfAffidavitDesc", true);
                  await ImageBucketRN(
                    formik,
                    "APFD/WORKER/DECLARATION/",
                    "selfAffidavitDesc",
                    20971520,
                    "document",
                    dispatch,
                  );
                }}
              >
                <View style={styles.uploadButtonContent}>
                  <Ionicons
                    name="document-text"
                    size={20}
                    color="#fff"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.uploadButtonText}>
                    Upload {getFieldLabel("selfAffidavitDesc")}
                  </Text>
                </View>
              </TouchableOpacity>

              {formik.touched.selfAffidavitDesc &&
                formik.errors.selfAffidavitDesc && (
                  <Text style={styles.errorText}>
                    {formik.errors.selfAffidavitDesc}
                  </Text>
                )}

              {formik.values.selfAffidavitDesc &&
                typeof formik.values.selfAffidavitDesc === "string" && (
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={async () => {
                      const url = formik.values.selfAffidavitDesc;

                      if (!url) {
                        console.log("No URL found");
                        return;
                      }

                      const supported = await Linking.canOpenURL(url);

                      if (supported) {
                        await Linking.openURL(url);
                      } else {
                        console.log("Invalid URL:", url);
                      }
                    }}
                  >
                    <Text
                      style={{
                        marginTop: 10,
                        textAlign: "center",
                        color: "blue",
                        textDecorationLine: "underline",
                      }}
                    >
                      Download File
                    </Text>
                  </TouchableOpacity>
                )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Render Payment Tab
  const renderPaymentTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>{getFieldLabel("payment")}</Text>

      <View style={styles.inputBlock}>
        <Text style={styles.label}>{getFieldLabel("fee")}</Text>
        <Text style={styles.feeText}>
          Registration Fee: ₹50 (one time) + ₹12 annual subscription
        </Text>
      </View>

      <View style={styles.inputBlock}>
        <Text style={styles.label}>{getFieldLabel("years")}</Text>

        <View style={globalStyes.selectBox}>
          <Picker
            selectedValue={formik.values.years}
            style={globalStyes.pickerText}
            onValueChange={(value) => {
              formik.setFieldValue("years", value);

              // ✅ calculate amount here
              const amount = value ? Number(value) * 12 + 50 : "";
              formik.setFieldValue("amount", amount.toString());
            }}
          >
            <Picker.Item label="--- Select ---" value="" />
            <Picker.Item label="1 Year" value="1" />
            <Picker.Item label="2 Years" value="2" />
            <Picker.Item label="3 Years" value="3" />
            <Picker.Item label="4 Years" value="4" />
            <Picker.Item label="5 Years" value="5" />
          </Picker>
        </View>
      </View>
      {console.log("formikkkkkkkkkkk", formik.values.amount)}
      <View style={styles.inputBlock}>
        <Text style={styles.label}>{getFieldLabel("amount")}</Text>

        <TextInput
          style={[styles.input, { backgroundColor: "#eee" }]}
          value={formik.values.amount}
          editable={false} // ✅ prevent manual editing
          placeholder={`Enter ${getFieldLabel("amount")}`}
        />
      </View>

      <View style={styles.inputBlock}>
        <View style={styles.checkboxContainer}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() =>
              formik.setFieldValue(
                "selfDeclaration",
                !formik.values.selfDeclaration,
              )
            }
          >
            <View
              style={[
                styles.checkboxBox,
                formik.values.selfDeclaration && styles.checkboxChecked,
              ]}
            >
              {formik.values.selfDeclaration && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </View>
            <Text style={styles.checkboxLabel}>
              {getFieldLabel("selfCheck")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return renderPersonalInfoTab();
      case 1:
        return renderFamilyTab();
      case 2:
        return renderBankTab();
      case 3:
        return renderAddressTab();
      case 4:
        return renderEmploymentTab();
      case 5:
        return renderWorkTab();
      case 6:
        return renderDocumentsTab();
      case 7:
        return renderPaymentTab();
      default:
        return null;
    }
  };

  const getFieldsForTab = (tabIndex) => {
    const tabFields = {
      0: [
        // PERSONAL INFORMATION
        "aadhaarNo",
        "firstName",
        "soWo",
        "fatherName",
        "gender",
        "dob",
        "phoneNo",
        "religion",
        "caste",
        "casteText",
        "subCaste",
        "subCasteText",
        "maritalStatus",
      ],
      1: [
        // FAMILY DETAILS
        "familyDetails",
      ],
      2: [
        // BANK DETAILS
        "ifscCode",
        "bankName",
        "branchName",
        "bankAccountNo",
        "rbankAccountNo",
        "nameInBank",
      ],
      3: [
        // ADDRESS DETAILS
        "permanentState",
        "permanentDistrictCode",
        "permanentMadalCode",
        "permanentVillageCode",
        "permanentPincode",
        "permanentDoorNo",
        "permanentAddress",
        "permanentDivision",
        "permanentLandMark",
        "permanentCity",
        "isPermanent",
        "presentState",
        "presentDistrictCode",
        "presentMadalCode",
        "presentVillageCode",
        "presentPincode",
        "presentDoorNo",
        "presentAddress",
        "presentDivision",
        "presentLandMark",
        "presentCity",
      ],
      4: [
        // EMPLOYMENT DETAILS
        "isNregs",
        "jobCardNo",
        "isUnionMember",
        "unionName",
        "regNo",
      ],
      5: [
        // WORK DETAILS
        "empName",
        "presentOfficeName",
        "typeOfWork",
        "otherTradeWork",
        "workCapability",
        "isMigrant",
        "workDistrict",
        "workMandal",
        "workVillage",
        "workDoorNo",
        "workPincode",
      ],
      6: [
        // DOCUMENTS
        "photoDesc",
        "signatureDesc",
        "selfAffidavitDesc",
      ],
      7: [
        // PAYMENT & DECLARATION
        "years",
        "amount",
        "selfDeclaration",
      ],
    };
    return tabFields[tabIndex] || [];
  };

  // Function to validate specific fields
  const validateTabFields = async (tabIndex) => {
    const fieldsToValidate = getFieldsForTab(tabIndex);
    const values = formik.values;
    const errors = {};

    for (const field of fieldsToValidate) {
      try {
        if (field === "familyDetails") {
          // Special validation for familyDetails array
          if (values.familyDetails && values.familyDetails.length > 0) {
            for (let i = 0; i < values.familyDetails.length; i++) {
              const memberErrors = await Yup.object()
                .shape({
                  familyMemberName: Yup.string()
                    .required("Member name is required")
                    .min(2, "Name must be at least 2 characters")
                    .max(100, "Name must not exceed 100 characters"),
                  relation: Yup.string()
                    .required("Relation is required"),
                    // .min(2, "Relation must be at least 2 characters"),
                  memberDob: Yup.string()
                    .required("Date of birth is required")
                    .matches(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
                  aadhaarNo: Yup.string()
                    .required("Aadhaar number is required")
                    .matches(
                      /^\d{12}$/,
                      "Aadhaar number must be exactly 12 digits",
                    ),
                  isNomine: Yup.string()
                    .required("Please select whether this member is a nominee")
                    .oneOf(["yes", "no"], "Invalid selection"),
                  nominePer: Yup.string().test({
                    name: "nominePer-validation",
                    message:
                      "Nominee percentage is required when member is a nominee",
                    test: function (value) {
                      const { isNomine } = this.parent;
                      if (isNomine === "yes") {
                        if (!value) return false;
                        const num = parseInt(value, 10);
                        if (isNaN(num) || num < 5 || num > 100 || num % 5 !== 0)
                          return false;
                      }
                      return true;
                    },
                  }),
                })
                .validate(values.familyDetails[i], { abortEarly: false });

              if (memberErrors?.errors?.length) {
                errors[`familyDetails[${i}]`] = memberErrors.errors;
              }
            }
          }
        } else {
          await validationSchema.validateAt(field, values);
        }
      } catch (error) {
        if (error?.path) {
          errors[error.path] = error.message;
        } else if (error?.inner) {
          error.inner.forEach((err) => {
            errors[err.path] = err.message;
          });
        }
      }
    }

    return errors;
  };

  // Format error messages for modal display
  const formatErrorsForModal = (errors) => {
    const errorMessages = [];

    for (const [field, message] of Object.entries(errors)) {
      if (Array.isArray(message)) {
        // Handle array errors (family details)
        message.forEach((msg) => errorMessages.push(`• ${msg}`));
      } else {
        // Get human-readable field name
        const fieldName = getFieldLabel(field);
        // .replace(/([A-Z])/g, " $1")
        // .replace(/^./, (str) => str.toUpperCase())
        // .replace(/(\d+)/g, " #$1");
        errorMessages.push(`• ${fieldName}: ${message}`);
      }
    }

    return errorMessages;
  };

  const { width, height } = Dimensions.get("window");

  // Show error modal
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorMessagesList, setErrorMessagesList] = useState([]);

  // Updated showErrorModal function with custom modal
  const showErrorModal = (errorMessages) => {
    setErrorMessagesList(errorMessages);
    setErrorModalVisible(true);
  };

  // Error Modal Component
  const ErrorModalComponent = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={errorModalVisible}
      onRequestClose={() => setErrorModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Validation Error</Text>
          <Text style={styles.modalSubtitle}>
            Please fix the following errors in the current tab:
          </Text>

          {/* Error List */}
          <ScrollView
            style={styles.errorScroll}
            showsVerticalScrollIndicator={false}
          >
            {errorMessagesList.map((error, index) => (
              <View key={index} style={styles.errorItem}>
                <View style={styles.errorBullet}>
                  <Text style={styles.bulletText}>{index + 1}</Text>
                </View>
                <Text style={styles.errorMsg}>{getFieldLabel(error)}</Text>
              </View>
            ))}
          </ScrollView>

          {/* Action Button */}
          <TouchableOpacity
            style={styles.okButton}
            onPress={() => setErrorModalVisible(false)}
          >
            <Text style={styles.okButtonText}>OK, I'll Fix It</Text>
            <Icon name="check" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <FormikProvider value={formik}>
      <ErrorModalComponent />

      <View style={styles.container}>
        <Text style={styles.mainTitle}>
          {currentLanguageData?.title || "Worker Registration"}
        </Text>

        {/* Tab Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{
            backgroundColor: "#fff",
            maxHeight: 80,
            minWidth: 120,
            padding: 10,
          }}
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 2,
                  paddingVertical: 8,
                  marginHorizontal: 1,
                }}
              >
                {/* Circle container */}
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 22.5, // Half of width/height for perfect circle
                    backgroundColor: isActive ? "#007AFF" : "#f0f0f0",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 4,
                    minHeight: 30,
                  }}
                >
                  <Ionicons
                    name={tab.icon}
                    size={18}
                    color={isActive ? "#fff" : "#666"}
                  />
                </View>

                <Text
                  style={{
                    fontSize: 10,
                    color: isActive ? "#007AFF" : "#666",
                    textAlign: "center",
                    width: 75,
                    flexWrap: "wrap",
                    minHeight: 30,
                  }}
                >
                  {tab.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Tab Content */}
        <ScrollView
          style={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.sectionCard}>{renderTabContent()}</View>
          <TouchableOpacity
            style={[styles.submitButton]}
            onPress={async () => {
              if (activeTab === 7) {
                // Final submission - validate all fields
                formik.handleSubmit();
              } else {
                // Validate only current tab fields
                const tabErrors = await validateTabFields(activeTab);

                if (Object.keys(tabErrors).length === 0) {
                  // No errors, move to next tab
                  setActiveTab((curr) => curr + 1);
                } else {
                  // Show errors in modal
                  const formattedErrors = formatErrorsForModal(tabErrors);
                  showErrorModal(formattedErrors);
                }
              }
            }}
          >
            <Text style={styles.submitButtonText}>
              {isLoading
                ? "REGISTERING..."
                : activeTab === 7
                  ? "REGISTER WORKER"
                  : "NEXT"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Loading Modal */}
    </FormikProvider>
  );
};

export default WorkerRegistration;
