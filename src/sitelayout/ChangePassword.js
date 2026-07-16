import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Ionicons } from "@expo/vector-icons";
import { CHANGE_PASSWORD, commonAPICall, CONTEXT_HEADING, myAxios } from "../utils/utils";
import { hideLoader, showLoader, login, showMessage } from "../actions";
import { store } from "../reducers/allReducers";

const ChangePassword = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const state = useSelector((state) => state.LoginReducer);
  const { isLoggedIn } = state;

  const [showPasswords, setShowPasswords] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [passwordChecks, setPasswordChecks] = useState({
    minLength: false,
    lowerCase: false,
    upperCase: false,
    number: false,
    specialChar: false,
  });

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handlePasswordChange = (value) => {
    setPasswordChecks({
      minLength: value.length >= 8,
      lowerCase: /[a-z]/.test(value),
      upperCase: /[A-Z]/.test(value),
      number: /\d/.test(value),
      specialChar: /[!@#$%^&*()\-_=+{};:,<.>]/.test(value),
    });
  };

  const userValidationSchema = Yup.object().shape({
    oldPassword: Yup.string()
      .required("Please enter old password")
      .min(5, "Minimum 5 characters required"),
    newPassword: Yup.string()
      .required("Please enter your password")
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+{};:,<.>]).{8,}$/,
        "Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character"
      ),
    confirmPassword: Yup.string()
      .required("Please confirm your password")
      .oneOf([Yup.ref("newPassword")], "Passwords don't match."),
  });

  const submitDetails = async (values, { resetForm }) => {

      const response = await commonAPICall(CHANGE_PASSWORD, values,"post",dispatch);
      

      if (response.status === 200) {
        const existingPayload = state;

        const updatedPayload = {
          ...existingPayload,
          isDefaultPassword: "N",
          passwordSinceUpdated: 0,
        };

        dispatch(login(updatedPayload));
        resetForm();
        setPasswordChecks({
          minLength: false,
          lowerCase: false,
          upperCase: false,
          number: false,
          specialChar: false,
        });
      } 
    } 


  const formik = useFormik({
    initialValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    validationSchema: userValidationSchema,
    onSubmit: submitDetails,
  });

  if (!isLoggedIn) {
    navigation.replace("Login");
    return null;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.header}>CHANGE PASSWORD</Text>

        <View style={styles.panel}>
          <Text style={styles.panelHeading}>{CONTEXT_HEADING}</Text>

          <View style={styles.formSection}>
            <View style={styles.inputBlock}>
              <Text style={styles.label}>Old Password *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.input}
                  secureTextEntry={!showPasswords.oldPassword}
                  value={formik.values.oldPassword}
                  onChangeText={formik.handleChange("oldPassword")}
                  onBlur={formik.handleBlur("oldPassword")}
                  maxLength={20}
                  placeholder="Enter old password"
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  onPress={() => togglePasswordVisibility("oldPassword")}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={
                      showPasswords.oldPassword
                        ? "eye-outline"
                        : "eye-off-outline"
                    }
                    size={22}
                    color="#555"
                  />
                </TouchableOpacity>
              </View>
              {formik.touched.oldPassword && formik.errors.oldPassword && (
                <Text style={styles.errorText}>
                  {formik.errors.oldPassword}
                </Text>
              )}
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.label}>New Password *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.input}
                  secureTextEntry={!showPasswords.newPassword}
                  value={formik.values.newPassword}
                  onChangeText={(value) => {
                    formik.setFieldValue("newPassword", value);
                    handlePasswordChange(value);
                  }}
                  onBlur={formik.handleBlur("newPassword")}
                  maxLength={20}
                  placeholder="Enter new password"
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  onPress={() => togglePasswordVisibility("newPassword")}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={
                      showPasswords.newPassword
                        ? "eye-outline"
                        : "eye-off-outline"
                    }
                    size={22}
                    color="#555"
                  />
                </TouchableOpacity>
              </View>
              {formik.touched.newPassword && formik.errors.newPassword && (
                <Text style={styles.errorText}>
                  {formik.errors.newPassword}
                </Text>
              )}
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.label}>Confirm Password *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.input}
                  secureTextEntry={!showPasswords.confirmPassword}
                  value={formik.values.confirmPassword}
                  onChangeText={formik.handleChange("confirmPassword")}
                  onBlur={formik.handleBlur("confirmPassword")}
                  maxLength={20}
                  placeholder="Confirm password"
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  onPress={() => togglePasswordVisibility("confirmPassword")}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={
                      showPasswords.confirmPassword
                        ? "eye-outline"
                        : "eye-off-outline"
                    }
                    size={22}
                    color="#555"
                  />
                </TouchableOpacity>
              </View>
              {formik.touched.confirmPassword &&
                formik.errors.confirmPassword && (
                  <Text style={styles.errorText}>
                    {formik.errors.confirmPassword}
                  </Text>
                )}
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={formik.handleSubmit}
              disabled={!formik.isValid || !formik.dirty}
            >
              <Text style={styles.submitButtonText}>SUBMIT</Text>
            </TouchableOpacity>
          </View>

          

          <View style={styles.rulesContainer}>
            <Text style={styles.rulesTitle}>Your password must contain:</Text>

            <Text
              style={[
                styles.ruleText,
                { color: passwordChecks.upperCase ? "#28a745" : "#dc3545" },
              ]}
            >
              • Upper case letters (A-Z)
            </Text>

            <Text
              style={[
                styles.ruleText,
                { color: passwordChecks.lowerCase ? "#28a745" : "#dc3545" },
              ]}
            >
              • Lower case letters (a-z)
            </Text>

            <Text
              style={[
                styles.ruleText,
                { color: passwordChecks.specialChar ? "#28a745" : "#dc3545" },
              ]}
            >
              • Special characters (!@#$%^&*().-_=+{};:,)
            </Text>

            <Text
              style={[
                styles.ruleText,
                { color: passwordChecks.number ? "#28a745" : "#dc3545" },
              ]}
            >
              • Numbers (0-9)
            </Text>

            <Text
              style={[
                styles.ruleText,
                { color: passwordChecks.minLength ? "#28a745" : "#dc3545" },
              ]}
            >
              • At least 8 characters
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f5f6fa",
    flexGrow: 1,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: "#e9ecef",
    paddingVertical: 14,
    color: "#222",
  },
  panel: {
    padding: 16,
  },
  panelHeading: {
    backgroundColor: "green",
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  formSection: {
    marginBottom: 20,
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
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: "#000",
  },
  eyeButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    color: "#dc3545",
    marginTop: 6,
    fontSize: 13,
  },
  submitButton: {
    backgroundColor: "#198754",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
    opacity: 1,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  imageWrapper: {
    alignItems: "center",
    marginVertical: 20,
  },
  image: {
    width: "100%",
    height: 220,
  },
  rulesContainer: {
    marginTop: 10,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  rulesTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
    textDecorationLine: "underline",
    color: "#222",
  },
  ruleText: {
    fontSize: 14,
    marginBottom: 6,
  },
});

export default ChangePassword;