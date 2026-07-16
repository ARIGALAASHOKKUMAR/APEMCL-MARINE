import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Platform,
  ImageBackground,
} from "react-native";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import ImageBucketRN from "../utils/ImageBucketRN";
import { useDispatch } from "react-redux";
import { commonAPICall, FRSREGISTRATION } from "../utils/utils";
import { useNavigation } from "@react-navigation/native";

const FRSRegistration = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const validationSchema = Yup.object().shape({
    employeeName: Yup.string()
      .required("Employee Name is required")
      .min(3, "Minimum 3 characters"),
    employeeCode: Yup.string().required("Employee Code is required"),
    mobileNumber: Yup.string()
      .required("Mobile Number is required")
      .matches(/^[0-9]{10}$/, "Enter valid 10-digit mobile number"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    gender: Yup.string().required("Select gender"),
    dateOfBirth: Yup.string().required("Date of Birth is required"),
    department: Yup.string().required("Department is required"),
    workLocation: Yup.string().required("Work Location is required"),
    faceFrontImage: Yup.string().required("Front face image is required"),
    faceLeftImage: Yup.string().required("Left face image is required"),
    faceRightImage: Yup.string().required("Right face image is required"),
  });

  const submitDetails = async (values) => {
    const response = await commonAPICall(
      FRSREGISTRATION,
      values,
      "post",
      dispatch,
    );
    if (response.status === 200) {
      formik.resetForm();
      navigation.navigate("LoginFrs");
    }
  };

  const formik = useFormik({
    initialValues: {
      employeeCode: "",
      employeeName: "",
      mobileNumber: "",
      email: "",
      gender: "",
      dateOfBirth: "",
      department: "",
      workLocation: "",
      faceFrontImage: "",
      faceLeftImage: "",
      faceRightImage: "",
      authMode: "FACE",
    },
    validationSchema,
    onSubmit: submitDetails,
  });

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split("T")[0];
      formik.setFieldValue("dateOfBirth", formattedDate);
    }
  };

  const renderInput = (icon, placeholder, field, keyboardType = "default") => (
    <View>
      <View style={styles.inputContainer}>
        <Ionicons name={icon} size={18} color="#64748b" />
        <TextInput
          placeholder={placeholder}
          style={styles.input}
          keyboardType={keyboardType}
          value={formik.values[field]}
          onChangeText={formik.handleChange(field)}
          onBlur={formik.handleBlur(field)}
        />
      </View>
      {formik.touched[field] && formik.errors[field] && (
        <Text style={styles.error}>{formik.errors[field]}</Text>
      )}
    </View>
  );

  const renderImageBlock = (label, field) => (
    <View style={{ marginBottom: 15 }}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        style={styles.captureBtn}
        onPress={async () => {
          await ImageBucketRN(
            formik,
            "FRS/FACES/",
            field,
            20971520,
            "camera",
            dispatch,
          );
        }}
      >
        <Ionicons name="camera" size={18} color="#fff" />
        <Text style={styles.captureText}>Capture</Text>
      </TouchableOpacity>

      {formik.values[field] ? (
        <Image source={{ uri: formik.values[field] }} style={styles.preview} />
      ) : (
        <Text style={styles.placeholder}>No image</Text>
      )}

      {formik.touched[field] && formik.errors[field] && (
        <Text style={styles.error}>{formik.errors[field]}</Text>
      )}
    </View>
  );

  return (
    <ImageBackground
      source={{
        uri: "https://images.unsplash.com/photo-1503387762-592deb58ef4e",
      }}
      style={styles.bgImage}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Face Registration</Text>
          </View>

          {/* Basic Details */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Basic Details</Text>
            {renderInput("person-outline", "Employee Name", "employeeName")}
            {renderInput("card-outline", "Employee Code", "employeeCode")}
            {renderInput(
              "call-outline",
              "Mobile Number",
              "mobileNumber",
              "numeric",
            )}
            {renderInput("mail-outline", "Email", "email")}
          </View>

          {/* Personal Info */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Personal Info</Text>

            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={18} color="#64748b" />
              <Text style={{ marginLeft: 10 }}>
                {formik.values.dateOfBirth || "Select Date of Birth"}
              </Text>
            </TouchableOpacity>

            {formik.touched.dateOfBirth && formik.errors.dateOfBirth && (
              <Text style={styles.error}>{formik.errors.dateOfBirth}</Text>
            )}

            {showDatePicker && (
              <DateTimePicker
                value={
                  formik.values.dateOfBirth
                    ? new Date(formik.values.dateOfBirth)
                    : new Date()
                }
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}

            <View style={styles.genderContainer}>
              {["Male", "Female", "Other"].map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.genderBtn,
                    formik.values.gender === g && styles.genderSelected,
                  ]}
                  onPress={() => formik.setFieldValue("gender", g)}
                >
                  <Text
                    style={[
                      styles.genderText,
                      formik.values.gender === g && { color: "#fff" },
                    ]}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {formik.touched.gender && formik.errors.gender && (
              <Text style={styles.error}>{formik.errors.gender}</Text>
            )}
          </View>

          {/* Work Info */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Work Details</Text>
            {renderInput("briefcase-outline", "Department", "department")}
            {renderInput("location-outline", "Work Location", "workLocation")}
          </View>

          {/* Face Capture */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Face Capture</Text>
            {renderImageBlock("Front Face", "faceFrontImage")}
            {renderImageBlock("Left Face", "faceLeftImage")}
            {renderImageBlock("Right Face", "faceRightImage")}
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={formik.handleSubmit}
          >
            <Text style={styles.submitText}>Register</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </ImageBackground>
  );
};

export default FRSRegistration;

const styles = StyleSheet.create({
  bgImage: { flex: 1 },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  container: {
    padding: 16,
    paddingBottom: 120,
  },

  header: {
    backgroundColor: "#4f46e5",
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },

  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },

  headerSub: {
    color: "#c7d2fe",
    fontSize: 13,
    marginTop: 4,
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 18,
    padding: 16,
    marginBottom: 15,
    elevation: 5,
  },

  sectionTitle: {
    fontWeight: "700",
    marginBottom: 12,
    color: "#1e293b",
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 10,
    marginBottom: 6,
  },

  input: {
    flex: 1,
    padding: 12,
  },

  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },

  genderContainer: {
    flexDirection: "row",
    marginTop: 10,
  },

  genderBtn: {
    flex: 1,
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 10,
    backgroundColor: "#eef2ff",
    alignItems: "center",
  },

  genderSelected: {
    backgroundColor: "#4f46e5",
  },

  genderText: {
    color: "#4f46e5",
    fontWeight: "600",
  },

  label: {
    fontWeight: "600",
    marginBottom: 6,
  },

  captureBtn: {
    flexDirection: "row",
    backgroundColor: "#16a34a",
    padding: 12,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  captureText: {
    color: "#fff",
    marginLeft: 6,
    fontWeight: "700",
  },

  preview: {
    width: 120,
    height: 120,
    borderRadius: 16,
    marginTop: 10,
  },

  placeholder: {
    color: "#94a3b8",
    marginTop: 6,
  },

  submitBtn: {
    backgroundColor: "#4f46e5",
    padding: 18,
    borderRadius: 16,
    marginTop: 25,
  },

  submitText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "800",
    fontSize: 16,
  },

  error: {
    color: "#ef4444",
    fontSize: 12,
    marginBottom: 6,
  },
});
