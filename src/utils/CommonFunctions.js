import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { CommonActions, useNavigation } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import { FontAwesome } from "@expo/vector-icons";

import {
  commonAPICall,
  GENERATE_CAPTCHA,
  LOGOUT_END_POINT,
  MANDALSNEW,
  myAxios,
  SUBMIT_FEEDBACK,
  VILLAGESNEW,
} from "./utils";

import {
  hideLoader,
  hideMessage,
  hideModal,
  logOut,
  showLoader,
} from "../actions";
// At the bottom of the file:
// import { NEWMANDALS, NEWVILLAGES } from "./utils/utils";


export const Commonfeedback = ({ setModalStatus2, label, height = 4 }) => {
  const state = useSelector((state) => state.LoginReducer);
  const dispatch = useDispatch();
  const { username, userId } = state;

  const [status, setStatus] = useState("");
  const [remarks, setRemarks] = useState("");

  const handleClose = () => {
    setModalStatus2(false);
  };

  const submitFeedback = async () => {
    if (!status || !remarks.trim()) {
      Alert.alert("Validation", "Please fill in both feedback and remarks.");
      return;
    }

    try {
      const response = await commonAPICall(
        SUBMIT_FEEDBACK,
        {
          status,
          remarks,
          username,
          userId,
        },
        "post"
      );

      if (response?.status === 200) {
        Alert.alert("Success", "Feedback submitted successfully.");
        dispatch(hideModal());
        setModalStatus2?.(false);
        setStatus("");
        setRemarks("");
      } else {
        Alert.alert("Error", "Failed to submit feedback.");
      }
    } catch (error) {
      console.log("submitFeedback error", error);
      Alert.alert("Error", "Something went wrong while submitting feedback.");
    }
  };

  const feedbackOptions = ["excellent", "good", "average", "poor"];

  return (
    <ScrollView contentContainerStyle={styles.feedbackContainer}>
      {label === "true" && (
        <View style={styles.feedbackHeader}>
          <Text style={styles.feedbackTitle}>
            <FontAwesome name="comments-o" size={20} color="#fb641b" /> Provide
            feedback to enhance the software experience.
          </Text>
        </View>
      )}

      <View style={styles.radioGroup}>
        {feedbackOptions.map((item) => {
          const selected = status === item;
          return (
            <TouchableOpacity
              key={item}
              style={styles.radioRow}
              onPress={() => setStatus(item)}
            >
              <View style={[styles.radioOuter, selected && styles.radioSelected]}>
                {selected && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.radioLabel}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TextInput
        style={[
          styles.textArea,
          {
            minHeight: Math.max(100, height * 24),
          },
        ]}
        value={remarks}
        onChangeText={(text) => {
          const trimmed = text.slice(0, 200);
          setRemarks(trimmed);
        }}
        maxLength={200}
        multiline
        placeholder="Give your valuable feedback"
        textAlignVertical="top"
      />

      <TouchableOpacity style={styles.submitBtn} onPress={submitFeedback}>
        <Text style={styles.submitBtnText}>
        <FontAwesome name="check" size={16} color="#fff" /> Submit Feedback
      </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export const CommonLogout = async (
  dispatch,
  uuid,
  roleName,
  token,
  navigation,
  type,
  from
) => {
  try {
    // 1. call API first while token is still available
    if (uuid && roleName && token) {
      await myAxios.get(
        `${LOGOUT_END_POINT}?uuid=${uuid}&roleName=${roleName}&type=${from}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    }
  } catch (error) {
    console.log("Logout skipped:", error?.message);
  } finally {
    // 2. then clear redux state
    dispatch(logOut());
dispatch(hideLoader());
    dispatch(hideMessage());

    if (navigation) {
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    }
  }
};

export const LogoutListener = () => {
  // BroadcastChannel is browser-specific.
  // In React Native, this is usually not needed.
  // Returning null to keep compatibility with your imports.
  return null;
};

export const generateCaptcha = async (
  setCaptchaId,
  setCaptchaImage,
  setCount
) => {

  console.log("testtasaja");
  
  try {
    const response = await commonAPICall(GENERATE_CAPTCHA, {}, "get");
    if (response?.status === 200) {
      setCaptchaId(response.data.captchaId);
      setCaptchaImage(response.data.captcha);
      setCount(response.data.activeSessions);
    }
  } catch (error) {
    console.log("generateCaptcha error", error);
    Alert.alert("Error", "Failed to generate captcha.");
  }
};

export const numberToWordsWithPrecision = (num) => {
  const words = {
    en: {
      a: [
        "",
        "One",
        "Two",
        "Three",
        "Four",
        "Five",
        "Six",
        "Seven",
        "Eight",
        "Nine",
        "Ten",
        "Eleven",
        "Twelve",
        "Thirteen",
        "Fourteen",
        "Fifteen",
        "Sixteen",
        "Seventeen",
        "Eighteen",
        "Nineteen",
      ],
      b: [
        "",
        "",
        "Twenty",
        "Thirty",
        "Forty",
        "Fifty",
        "Sixty",
        "Seventy",
        "Eighty",
        "Ninety",
      ],
      crore: "Crore",
      lakh: "Lakh",
      thousand: "Thousand",
      hundred: "Hundred",
      point: "Point",
      zero: "Zero",
    },
    te: {
      a: [
        "",
        "ఒకటి",
        "రెండు",
        "మూడు",
        "నాలుగు",
        "ఐదు",
        "ఆరు",
        "ఏడు",
        "ఎనిమిది",
        "తొమ్మిది",
        "పది",
        "పదకొండు",
        "పన్నెండు",
        "పదమూడు",
        "పదనాలుగు",
        "పదిహేను",
        "పదహారు",
        "పదిహేడు",
        "పద్ధెనిమిది",
        "పంతొమ్మిది",
      ],
      b: [
        "",
        "",
        "ఇరవై",
        "ముప్పై",
        "నలభై",
        "యాభై",
        "అరవై",
        "డెబ్బై",
        "ఎనభై",
        "తొంభై",
      ],
      crore: "కోటి",
      lakh: "లక్ష(ల)",
      thousand: "వేల",
      hundred: "వంద(ల)",
      point: "పాయింట్",
      zero: "సున్నా",
    },
  };

  const toWordsBelowThousand = (n, lang) => {
    const { a, b, hundred } = words[lang];
    if (n === 0) return "";
    if (n < 20) return a[n];
    if (n < 100) {
      return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    }
    return (
      a[Math.floor(n / 100)] +
      " " +
      hundred +
      (n % 100 !== 0 ? " " + toWordsBelowThousand(n % 100, lang) : "")
    );
  };

  const toWords = (n, lang) => {
    const { crore, lakh, thousand, zero } = words[lang];
    if (n === 0) return zero;

    let result = "";

    if (n >= 10000000) {
      result +=
        toWordsBelowThousand(Math.floor(n / 10000000), lang) +
        " " +
        crore +
        " ";
      n = n % 10000000;
    }

    if (n >= 100000) {
      result +=
        toWordsBelowThousand(Math.floor(n / 100000), lang) +
        " " +
        lakh +
        " ";
      n = n % 100000;
    }

    if (n >= 1000) {
      result +=
        toWordsBelowThousand(Math.floor(n / 1000), lang) +
        " " +
        thousand +
        " ";
      n = n % 1000;
    }

    if (n > 0) {
      result += toWordsBelowThousand(n, lang);
    }

    return result.trim();
  };

  const [integerPart, decimalPart] = num.toString().split(".");
  let wordsEnglish = toWords(Number(integerPart), "en");
  let wordsTelugu = toWords(Number(integerPart), "te");

  if (decimalPart) {
    const decimalWordsEnglish = decimalPart
      .split("")
      .map((digit) => words.en.a[Number(digit)] || words.en.zero)
      .join(" ");

    const decimalWordsTelugu = decimalPart
      .split("")
      .map((digit) => words.te.a[Number(digit)] || words.te.zero)
      .join(" ");

    wordsEnglish += " " + words.en.point + " " + decimalWordsEnglish;
    wordsTelugu += " " + words.te.point + " " + decimalWordsTelugu;
  }

  return {
    english: wordsEnglish,
    telugu: wordsTelugu,
    combined: `${wordsEnglish}\n${wordsTelugu}`,
  };
};

export const Districts = [
  { dist_code: 749, dist_name: "NTR" },
  { dist_code: 505, dist_name: "EAST GODAVARI" },
  { dist_code: 503, dist_name: "CHITTOOR" },
  { dist_code: 506, dist_name: "GUNTUR" },
  { dist_code: 748, dist_name: "ELURU" },
  { dist_code: 746, dist_name: "KAKINADA" },
  { dist_code: 523, dist_name: "WEST GODAVARI" },
  { dist_code: 521, dist_name: "VIZIANAGARAM" },
  { dist_code: 502, dist_name: "ANANTAPUR" },
  { dist_code: 753, dist_name: "ANNAMAYYA" },
  { dist_code: 750, dist_name: "BAPATLA" },
  { dist_code: 517, dist_name: "PRAKASAM" },
  { dist_code: 744, dist_name: "ANAKAPALLI" },
  { dist_code: 511, dist_name: "KURNOOL" },
  { dist_code: 752, dist_name: "TIRUPATI" },
  { dist_code: 519, dist_name: "SRIKAKULAM" },
  { dist_code: 510, dist_name: "KRISHNA" },
  { dist_code: 755, dist_name: "NANDYAL" },
  { dist_code: 751, dist_name: "PALNADU" },
  { dist_code: 515, dist_name: "SPSR NELLORE" },
  { dist_code: 520, dist_name: "VISAKHAPATANAM" },
  { dist_code: 754, dist_name: "SRI SATHYA SAI" },
  { dist_code: 743, dist_name: "PARVATHIPURAM MANYAM" },
  { dist_code: 745, dist_name: "ALLURI SITHARAMA RAJU" },
  { dist_code: 747, dist_name: "DR.B.R.AMBEDKAR KONASEEMA" },
  { dist_code: 504, dist_name: "Y.S.R." },
];

export const GetMandals = async (code, setMandals) => {
  try {
    if (code !== "00") {
      const response = await commonAPICall(
        GETMANDALS + "distCode=" + code,
        {},
        "get"
      );

      if (response?.status === 200) {
        setMandals(response.data.Mandals || []);
      } else {
        setMandals([]);
      }
    } else {
      setMandals([]);
    }
  } catch (error) {
    console.log("GetMandals error", error);
    setMandals([]);
  }
};

export const districts = [
  { dist_code: 99, dist_name: "Other State" },
  { dist_code: 502, dist_name: "ANANTAPUR" },
  { dist_code: 503, dist_name: "CHITTOOR" },
  { dist_code: 504, dist_name: "Y.S.R." },
  { dist_code: 505, dist_name: "EAST GODAVARI" },
  { dist_code: 506, dist_name: "GUNTUR" },
  { dist_code: 510, dist_name: "KRISHNA" },
  { dist_code: 511, dist_name: "KURNOOL" },
  { dist_code: 515, dist_name: "SPSR NELLORE" },
  { dist_code: 517, dist_name: "PRAKASAM" },
  { dist_code: 519, dist_name: "SRIKAKULAM" },
  { dist_code: 520, dist_name: "VISAKHAPATANAM" },
  { dist_code: 521, dist_name: "VIZIANAGARAM" },
  { dist_code: 523, dist_name: "WEST GODAVARI" },
  { dist_code: 743, dist_name: "PARVATHIPURAM MANYAM" },
  { dist_code: 744, dist_name: "ANAKAPALLI" },
  { dist_code: 745, dist_name: "ALLURI SITHARAMA RAJU" },
  { dist_code: 746, dist_name: "KAKINADA" },
  { dist_code: 747, dist_name: "DR.B.R.AMBEDKAR KONASEEMA" },
  { dist_code: 748, dist_name: "ELURU" },
  { dist_code: 749, dist_name: "NTR" },
  { dist_code: 750, dist_name: "BAPATLA" },
  { dist_code: 751, dist_name: "PALNADU" },
  { dist_code: 752, dist_name: "TIRUPATI" },
  { dist_code: 753, dist_name: "ANNAMAYYA" },
  { dist_code: 754, dist_name: "SRI SATHYA SAI" },
  { dist_code: 755, dist_name: "NANDYAL" },
];

export const GetMandalsNew = async (distcode, setMandals) => {
  try {
    if (distcode !== "00") {
      const effectiveDistCode = distcode || "0";

      const response = await commonAPICall(
        `${MANDALSNEW}zoneCode=${effectiveDistCode}&mandalCode=0`,
        {},
        "get"
      );

      if (response?.status === 200) {
        setMandals(response.data.Regions || []);
      } else {
        setMandals([]);
      }
    } else {
      setMandals([]);
    }
  } catch (error) {
    console.log("GetMandalsNew error", error);
    setMandals([]);
  }
};

export const GetVillagesNew = async (dist, mandal, setVillages) => {
  try {
    if (mandal !== "00") {
      const effectiveMandalCode = mandal === null ? "0" : mandal;

      const response = await commonAPICall(
        `${VILLAGESNEW}distCode=${dist}&mandalCode=${effectiveMandalCode}`,
        {},
        "get"
      );

      if (response?.status === 200) {
        setVillages(response.data.Villages || []);
      } else {
        setVillages([]);
      }
    } else {
      setVillages([]);
    }
  } catch (error) {
    console.log("GetVillagesNew error", error);
    setVillages([]);
  }
};

export const profileMenu = [
  {
    id: 1,
    title: "Basic Details",
    icon: "person-outline",
    value: "basic_details",
    key: "basic_details_completed",
  },
  {
    id: 2,
    title: "Identity & Verification",
    icon: "card-outline",
    value: "identity_verification",
    key: "verification_status", // ✅ from API
  },
  {
    id: 3,
    title: "Location Information",
    icon: "location-outline",
    value: "location_information",
    key: "location_info_completed", // ✅
  },
  {
    id: 4,
    title: "Skill Details",
    icon: "construct-outline",
    value: "skill_details",
    key: "skill_info_completed", // ✅
  },
  {
    id: 5,
    title: "Experience / Work Experience",
    icon: "briefcase-outline",
    value: "work_experience",
    key: "work_history", // ✅ (check array length)
  },
  {
    id: 99,
    title: "Work Details",
    icon: "briefcase-outline",
    value: "work_details",
    key: "employer_work_details_completed", // ✅
  },
  {
    id: 6,
    title: "Education",
    icon: "school-outline",
    value: "education",
    key: "education", // ✅ (check parsed array)
  },
  {
    id: 7,
    title: "Help",
    icon: "help-circle-outline",
    value: "help",
    key: null, // no API dependency
  },
];


export const dists28 =  [
	{
		"dist_code" : 502,
		"dist_name" : "ANANTAPUR"
	},
	{
		"dist_code" : 503,
		"dist_name" : "CHITTOOR"
	},
	{
		"dist_code" : 504,
		"dist_name" : "Y.S.R."
	},
	{
		"dist_code" : 505,
		"dist_name" : "EAST GODAVARI"
	},
	{
		"dist_code" : 506,
		"dist_name" : "GUNTUR"
	},
	{
		"dist_code" : 510,
		"dist_name" : "KRISHNA"
	},
	{
		"dist_code" : 511,
		"dist_name" : "KURNOOL"
	},
	{
		"dist_code" : 515,
		"dist_name" : "SPSR NELLORE"
	},
	{
		"dist_code" : 517,
		"dist_name" : "PRAKASAM"
	},
	{
		"dist_code" : 519,
		"dist_name" : "SRIKAKULAM"
	},
	{
		"dist_code" : 520,
		"dist_name" : "VISAKHAPATANAM"
	},
	{
		"dist_code" : 521,
		"dist_name" : "VIZIANAGARAM"
	},
	{
		"dist_code" : 523,
		"dist_name" : "WEST GODAVARI"
	},
	{
		"dist_code" : 743,
		"dist_name" : "PARVATHIPURAM MANYAM"
	},
	{
		"dist_code" : 744,
		"dist_name" : "ANAKAPALLI"
	},
	{
		"dist_code" : 745,
		"dist_name" : "ALLURI SITHARAMA RAJU"
	},
	{
		"dist_code" : 746,
		"dist_name" : "KAKINADA"
	},
	{
		"dist_code" : 747,
		"dist_name" : "DR.B.R.AMBEDKAR KONASEEMA"
	},
	{
		"dist_code" : 748,
		"dist_name" : "ELURU"
	},
	{
		"dist_code" : 749,
		"dist_name" : "NTR"
	},
	{
		"dist_code" : 750,
		"dist_name" : "BAPATLA"
	},
	{
		"dist_code" : 751,
		"dist_name" : "PALNADU"
	},
	{
		"dist_code" : 752,
		"dist_name" : "TIRUPATI"
	},
	{
		"dist_code" : 753,
		"dist_name" : "ANNAMAYYA"
	},
	{
		"dist_code" : 754,
		"dist_name" : "SRI SATHYA SAI"
	},
	{
		"dist_code" : 755,
		"dist_name" : "NANDYAL"
	},
	{
		"dist_code" : 756,
		"dist_name" : "MARKAPURAM"
	},
	{
		"dist_code" : 757,
		"dist_name" : "POLAVARAM"
	}
]





const styles = StyleSheet.create({
  feedbackContainer: {
    padding: 16,
    backgroundColor: "#fff",
  },
  feedbackHeader: {
    marginBottom: 16,
  },
  feedbackTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fb641b",
    lineHeight: 28,
  },
  radioGroup: {
    marginBottom: 16,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#666",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  radioSelected: {
    borderColor: "#20b22d",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#20b22d",
  },
  radioLabel: {
    fontSize: 18,
    color: "#222",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  submitBtn: {
    backgroundColor: "#28a745",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});