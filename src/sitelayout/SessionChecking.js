import React, { useEffect, useRef } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import { useSelector } from "react-redux";
import { useRoute } from "@react-navigation/native";

const SessionChecking = ({ navigation, children }) => {
  const state = useSelector((state) => state.LoginReducer);

  const {
    isLoggedIn,
    isDefaultPassword,
    isProfileUpdated,
    passwordSinceUpdated,
  } = state;

  const route = useRoute();
  const currentScreen = route.name;
  const hasRedirected = useRef(false);

  let targetScreen = null;
  let alertMessage = "";

  const passwordDays = parseInt(passwordSinceUpdated || 0, 10);
  const isPasswordExpired = passwordDays >= 90;

  let changePasswordMsg =
    "For your security, please update your password. It was initially set by the system and should be personalized to ensure the safety of your account.";

  if (isPasswordExpired) {
    changePasswordMsg =
      "Your password has expired. Please change it immediately to continue accessing your account.";
  }

  if (!isLoggedIn) {
    if (currentScreen !== "Login") {
      targetScreen = "Login";
      alertMessage = "Your session has expired. Please login again.";
    }
  } else if (
    ((typeof isDefaultPassword === "string" &&
      isDefaultPassword.trim().toUpperCase() === "Y") ||
      isPasswordExpired) &&
    currentScreen !== "ChangePassword"
  ) {
    targetScreen = "ChangePassword";
    alertMessage = changePasswordMsg;
  } else if (
    typeof isProfileUpdated === "string" &&
    isProfileUpdated.trim().toUpperCase() === "N" &&
    currentScreen !== "ProfileUpdate"
  ) {
    targetScreen = "ProfileUpdate";
    alertMessage = "Please update your profile before proceeding.";
  }

  useEffect(() => {
    if (targetScreen && !hasRedirected.current) {
      hasRedirected.current = true;

      Alert.alert("Notice", alertMessage, [
        {
          text: "OK",
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: targetScreen }],
            });
          },
        },
      ]);
    }

    if (!targetScreen) {
      hasRedirected.current = false;
    }
  }, [targetScreen, alertMessage, navigation]);

  if (targetScreen) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4a6cf7" />
      </View>
    );
  }


  console.log("isProfileUpdated",isProfileUpdated);
  

  return <>{children}</>;
};

export default SessionChecking;

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    backgroundColor: "#f2f5ff",
    justifyContent: "center",
    alignItems: "center",
  },
});