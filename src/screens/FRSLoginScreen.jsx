import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFormik } from "formik";
import { useDispatch } from "react-redux";
import ImageBucketRN from "../utils/ImageBucketRN";
import { useNavigation } from "@react-navigation/native";

const FRSLogin = () => {
  const dispatch = useDispatch();

  const navigation = useNavigation()

  const [loginType, setLoginType] = useState("password");
  const [showPassword, setShowPassword] = useState(false);

  const formik = useFormik({
    initialValues: {
      empId: "",
      password: "",
      faceImage: "",
    },
    onSubmit: (values) => {
      if (loginType === "password") {
        if (!values.empId || !values.password) {
          alert("Enter Employee ID and Password");
          return;
        }
        console.log("Login with Password:", values);
      } else {
        if (!values.faceImage) {
          alert("Please capture face");
          return;
        }
        console.log("Login with Face:", values);
      }
    },
  });

  // ✅ Auto camera + dummy API
  const handleFaceLogin = async () => {
    setLoginType("face");

    setTimeout(async () => {
      await ImageBucketRN(
        formik,
        "FRS/FACES/",
        "faceImage",
        20971520,
        "camera",
        dispatch,
      );

      // Dummy API / Alert after capture
      setTimeout(() => {
        if (formik.values.faceImage) {
          alert("Face detected & login success (Dummy API)");
          console.log("Dummy Face API Call:", formik.values.faceImage);
        } else {
          alert("Face capture failed");
        }
      }, 1000);
    }, 300);
  };

  return (
    <ImageBackground
      source={{
        uri: "https://images.unsplash.com/photo-1506744038136-46273834b3fb",
      }}
      style={styles.bg}
      blurRadius={3}
    >
      <View style={styles.overlay}>
        {/* Avatar */}
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={50} color="green" />
        </View>

        <Text style={styles.title}>FRS Login</Text>

        {/* Employee ID */}
        <TextInput
          placeholder="Enter Employee ID"
          placeholderTextColor="#aaa"
          style={styles.input}
          value={formik.values.empId}
          onChangeText={formik.handleChange("empId")}
        />

        {/* Password */}
        <View style={{ position: "relative" }}>
          <TextInput
            placeholder="Enter Password"
            placeholderTextColor="#aaa"
            style={styles.input}
            secureTextEntry={!showPassword}
            value={formik.values.password}
            onChangeText={formik.handleChange("password")}
          />
          <TouchableOpacity
            style={styles.eyeIcon}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} />
          </TouchableOpacity>
        </View>

        {/* Face Login Button */}
        <TouchableOpacity style={styles.faceBtn} onPress={handleFaceLogin}>
          <Ionicons name="scan" size={18} color="#fff" />
          <Text style={styles.faceText}>Use Face Login</Text>
        </TouchableOpacity>

        {/* Face Preview */}
        {loginType === "face" && (
          <>
            {formik.values.faceImage ? (
              <Image
                source={{ uri: formik.values.faceImage }}
                style={styles.preview}
              />
            ) : (
              <Text style={styles.placeholder}>Opening camera...</Text>
            )}
          </>
        )}

        {/* Login Button */}

        <TouchableOpacity style={styles.loginBtn} onPress={formik.handleSubmit}>
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.registerBtn}
          onPress={()=>navigation.navigate("RegisterFrs")}
        >
          <Text style={styles.registerText}>New user? Register here</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

export default FRSLogin;

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
    justifyContent: "center",
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#fff",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 25,
  },
  input: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    top: 16,
  },
  faceBtn: {
    flexDirection: "row",
    backgroundColor: "#6c63ff",
    padding: 12,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  faceText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "600",
  },
  preview: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignSelf: "center",
    marginTop: 15,
    borderWidth: 2,
    borderColor: "#28a745",
  },
  placeholder: {
    textAlign: "center",
    marginTop: 10,
    color: "#ddd",
  },
  loginBtn: {
    backgroundColor: "green",
    padding: 14,
    borderRadius: 10,
    marginTop: 25,
  },
  loginText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "bold",
  },
  registerBtn: {
    marginTop: 15,
    alignItems: "center",
  },

  registerText: {
    color: "#fff",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});
