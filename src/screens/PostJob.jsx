import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { FormikProvider, useFormik } from "formik";
import * as Yup from "yup";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import Ionicons from "react-native-vector-icons/Ionicons";
import * as Location from "expo-location";
import {
  commonAPICall,
  EMPLOYERJOBPOST,
  GETDISTSAPP,
  GETMANDALSAPP,
  GETSKILLS,
  GETVILLAGESAPP,
} from "../utils/utils";
import { globalStyes } from "./GlobalStyles";


const PostJob = ({ route, navigation }) => {
  const dispatch = useDispatch();

  const handleAccessScreen = () => {
    Alert.alert(
      "Notice",
      "Please post the job only if you are at the work location / మీరు పనిస్థలంలో ఉన్నప్పుడే జాబ్ పోస్ట్ చేయండి",
      [{ text: "OK" }],
      { cancelable: false },
    );
  };

  useEffect(() => {
    handleAccessScreen();
  }, []);

  const job = route?.params?.job || null;
  const [dists, setDists] = useState([]);
  const [mandal, setMandal] = useState([]);
  const [village, setVillage] = useState([]);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const [skillsList, setSkillsList] = useState([]);

  const getSkillsData = async () => {
    try {
      const response = await commonAPICall(GETSKILLS, {}, "get", dispatch);

      if (response?.status === 200) {
        const skillData = response?.data?.Skill_Info_Details || [];
        setSkillsList(skillData);
      } else {
        setSkillsList([]);
      }
    } catch (error) {
      console.log("Error fetching skills:", error);
      setSkillsList([]);
    }
  };

  useEffect(() => {
    getSkillsData();
  }, []);
  const facilityOptions = [
    { id: 1, label: "Financial Aid" },
    { id: 2, label: "Health Insurance" },
    { id: 3, label: "Housing Assistance" },
    { id: 4, label: "Pension Scheme" },
    { id: 5, label: "Skill Development" },
  ];

  const preferredWorkTypes = [
    { id: "daily wages", label: "Daily Wages" },
    { id: "contract", label: "Contract" },
    { id: "monthly", label: "Monthly" },
  ];

  const getdists = async () => {
    try {
      const response = await commonAPICall(GETDISTSAPP, {}, "get", dispatch);
      if (response?.status === 200) {
        setDists(response?.data?.District_List || []);
      } else {
        setDists([]);
      }
    } catch (error) {
      console.log("Error fetching districts:", error);
      setDists([]);
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

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permission denied", "Location permission is required");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

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
      Alert.alert("Error", "Unable to fetch location");
    }
  };

  useEffect(() => {
    getdists();
    getLocation();
  }, []);

  const validationSchema = Yup.object().shape({
    jobTitle: Yup.string().required("Required"),
    jobCategory: Yup.array().min(1, "Select at least one category"),
    startDate: Yup.string().required("Required"),
    endDate: Yup.string().required("Required"),
    workDuration: Yup.string().required("Required"),
    district: Yup.string().required("Required"),
    mandal: Yup.string().required("Required"),
    village: Yup.string().required("Required"),
    doorNo: Yup.string().required("Required"),
    landmark: Yup.string().required("Required"),
    pincode: Yup.string()
      .required("Required")
      .matches(/^\d{6}$/, "Enter valid pincode"),
    latitude: Yup.string().required("Required"),
    longitude: Yup.string().required("Required"),
    jobDescription: Yup.string().required("Required"),
    toolsRequired: Yup.string().required("Required"),
    requiredPeople: Yup.string().required("Required"),
    workTime: Yup.string().required("Required"),
    preferredWorkType: Yup.string().required("Required"),
    workRatePerDay: Yup.string().required("Required"),
    facilities: Yup.array().min(1, "Select at least one facility"),
  });


  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      jobTitle: job?.jobtitle || "",
      jobCategory: job?.jobcategories?.map((i) => i.jobCategoryId) || [],
      startDate: job?.startdate || "",
      endDate: job?.enddate || "",
      workDuration: job?.workduration ? String(job.workduration) : "",
      district: job?.district ? String(job.district) : "",
      mandal: job?.mandal ? String(job.mandal) : "",
      village: job?.village ? String(job.village) : "",
      doorNo: job?.doorno || "",
      landmark: job?.landmark || "",
      pincode: job?.pincode ? String(job.pincode) : "",
      latitude: job?.latitude ? String(job.latitude) : "",
      longitude: job?.longitude ? String(job.longitude) : "",
      jobDescription: job?.jobdescription || "",
      toolsRequired: job?.toolsrequired || "",
      requiredPeople: job?.requiredpeople ? String(job.requiredpeople) : "",
      workTime: job?.worktime || "",
      preferredWorkType: job?.preferredworktype || "",
      workRatePerDay: job?.workrateperday ? String(job.workrateperday) : "",
      facilities: job?.facilities?.map((i) => i.facilityId) || [],
    },
    validationSchema,
    onSubmit: handleSubmit,
  });

  useEffect(() => {
    if (job?.district) {
      getmandals(job.district);
    }

    if (job?.district && job?.mandal) {
      getVillages(job.district, job.mandal);
    }
  }, [job]);

  async function handleSubmit(values, { setSubmitting, resetForm }) {
    try {
      let payload = {
        ...values,
        workDuration: Number(values.workDuration),
        district: Number(values.district),
        mandal: Number(String(values.mandal).replace(/,/g, "")),
        village: Number(values.village),
        pincode: Number(values.pincode),
        latitude: Number(values.latitude),
        longitude: Number(values.longitude),
        requiredPeople: Number(values.requiredPeople),
        workRatePerDay: Number(values.workRatePerDay),
      };
      if (job?.jobpostingid != null) {
        payload = { ...payload, jobPostingId: job.jobpostingid };
      }

      console.log("Sending job post payload:", payload);

      const response = await commonAPICall(
        EMPLOYERJOBPOST,
        payload,
        "POST",
        dispatch,
      );

      if (response?.status === 200 || response?.data?.status === "success") {
        resetForm();
        setMandal([]);
        setVillage([]);
        navigation.navigate("EmployerJob");
      }
    } catch (error) {
      console.log("Error:", error);
    } finally {
      setSubmitting(false);
    }
  }

  const formatDateForPicker = (dateString) => {
    if (!dateString) return new Date();
    return new Date(dateString);
  };

  const formatDateToApi = (selectedDate) => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(selectedDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const toggleMultiSelect = (fieldName, value) => {
    const currentValues = formik.values[fieldName] || [];
    const exists = currentValues.includes(value);

    if (exists) {
      formik.setFieldValue(
        fieldName,
        currentValues.filter((item) => item !== value),
      );
    } else {
      formik.setFieldValue(fieldName, [...currentValues, value]);
    }
  };

  return (
    <FormikProvider value={formik}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Post a New Job</Text>

          <View style={styles.inputBlock}>
            <Text style={styles.label}>
              Job Title <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                formik.errors.jobTitle &&
                  formik.touched.jobTitle &&
                  styles.inputError,
              ]}
              value={formik.values.jobTitle}
              onChangeText={formik.handleChange("jobTitle")}
              onBlur={formik.handleBlur("jobTitle")}
              placeholder="Enter Job Title"
            />
            {formik.errors.jobTitle && formik.touched.jobTitle && (
              <Text style={styles.errorText}>{formik.errors.jobTitle}</Text>
            )}
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.label}>
              Job Category <Text style={styles.requiredStar}>*</Text>
            </Text>

            <View style={styles.multiWrap}>
              {skillsList.map((item) => {
                const selected = formik.values.jobCategory.includes(item.id);

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.multiChip,
                      selected && styles.multiChipSelected,
                    ]}
                    onPress={() => toggleMultiSelect("jobCategory", item.id)}
                  >
                    <Text
                      style={[
                        styles.multiChipText,
                        selected && styles.multiChipTextSelected,
                      ]}
                    >
                      {item.skill_name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {formik.errors.jobCategory && formik.touched.jobCategory && (
              <Text style={styles.errorText}>{formik.errors.jobCategory}</Text>
            )}
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.label}>
             Application Start Date <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => {
                formik.setFieldTouched("startDate", true);
                setShowStartDatePicker(true);
              }}
            >
              <Text style={styles.dateText}>
                {formik.values.startDate || "Select Start Date"}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#555" />
            </TouchableOpacity>
            {formik.errors.startDate && formik.touched.startDate && (
              <Text style={styles.errorText}>{formik.errors.startDate}</Text>
            )}
          </View>

          {showStartDatePicker && (
            <DateTimePicker
              value={formatDateForPicker(formik.values.startDate)}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowStartDatePicker(false);
                if (selectedDate) {
                  formik.setFieldValue(
                    "startDate",
                    formatDateToApi(selectedDate),
                  );
                }
              }}
            />
          )}

          <View style={styles.inputBlock}>
            <Text style={styles.label}>
             Application End Date <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => {
                formik.setFieldTouched("endDate", true);
                setShowEndDatePicker(true);
              }}
            >
              <Text style={styles.dateText}>
                {formik.values.endDate || "Select End Date"}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#555" />
            </TouchableOpacity>
            {formik.errors.endDate && formik.touched.endDate && (
              <Text style={styles.errorText}>{formik.errors.endDate}</Text>
            )}
          </View>

          {showEndDatePicker && (
            <DateTimePicker
              value={formatDateForPicker(formik.values.endDate)}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowEndDatePicker(false);
                if (selectedDate) {
                  formik.setFieldValue(
                    "endDate",
                    formatDateToApi(selectedDate),
                  );
                }
              }}
            />
          )}

          <View style={styles.inputBlock}>
            <Text style={styles.label}>
              Work Duration <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                formik.errors.workDuration &&
                  formik.touched.workDuration &&
                  styles.inputError,
              ]}
              value={formik.values.workDuration}
              onChangeText={formik.handleChange("workDuration")}
              onBlur={formik.handleBlur("workDuration")}
              placeholder="Enter work duration in days"
              keyboardType="numeric"
            />
            {formik.errors.workDuration && formik.touched.workDuration && (
              <Text style={styles.errorText}>{formik.errors.workDuration}</Text>
            )}
          </View>

          <Text style={styles.subTitle}>Location Information</Text>

          <View style={styles.inputBlock}>
            <Text style={styles.label}>
              District <Text style={styles.requiredStar}>*</Text>
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
                <Picker.Item label="---Select District---" value="" />
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
              Mandal <Text style={styles.requiredStar}>*</Text>
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
                <Picker.Item label="---Select Mandal---" value="" />
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
              Village <Text style={styles.requiredStar}>*</Text>
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
                selectedValue={formik.values.village}
                onValueChange={(itemValue) => {
                  formik.setFieldTouched("village", true);
                  formik.setFieldValue("village", itemValue);
                }}
                enabled={!!formik.values.mandal}
              >
                <Picker.Item label="---Select Village---" value="" />
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
              Door No <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                formik.errors.doorNo &&
                  formik.touched.doorNo &&
                  styles.inputError,
              ]}
              value={formik.values.doorNo}
              onChangeText={formik.handleChange("doorNo")}
              onBlur={formik.handleBlur("doorNo")}
              placeholder="Enter Door No"
            />
            {formik.errors.doorNo && formik.touched.doorNo && (
              <Text style={styles.errorText}>{formik.errors.doorNo}</Text>
            )}
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.label}>
              Landmark <Text style={styles.requiredStar}>*</Text>
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
              placeholder="Enter Landmark"
            />
            {formik.errors.landmark && formik.touched.landmark && (
              <Text style={styles.errorText}>{formik.errors.landmark}</Text>
            )}
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.label}>
              Pincode <Text style={styles.requiredStar}>*</Text>
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
              placeholder="Enter Pincode"
              keyboardType="numeric"
              maxLength={6}
            />
            {formik.errors.pincode && formik.touched.pincode && (
              <Text style={styles.errorText}>{formik.errors.pincode}</Text>
            )}
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.label}>
              Latitude <Text style={styles.requiredStar}>*</Text>
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
              placeholder="Enter Latitude"
            />
            {formik.errors.latitude && formik.touched.latitude && (
              <Text style={styles.errorText}>{formik.errors.latitude}</Text>
            )}
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.label}>
              Longitude <Text style={styles.requiredStar}>*</Text>
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
              placeholder="Enter Longitude"
            />
            {formik.errors.longitude && formik.touched.longitude && (
              <Text style={styles.errorText}>{formik.errors.longitude}</Text>
            )}
          </View>

          <Text style={styles.subTitle}>Work Description</Text>

          <View style={styles.inputBlock}>
            <Text style={styles.label}>
              Job Description <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                formik.errors.jobDescription &&
                  formik.touched.jobDescription &&
                  styles.inputError,
              ]}
              value={formik.values.jobDescription}
              onChangeText={formik.handleChange("jobDescription")}
              onBlur={formik.handleBlur("jobDescription")}
              placeholder="Enter Job Description"
              multiline
            />
            {formik.errors.jobDescription && formik.touched.jobDescription && (
              <Text style={styles.errorText}>
                {formik.errors.jobDescription}
              </Text>
            )}
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.label}>
              Tools Required <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                formik.errors.toolsRequired &&
                  formik.touched.toolsRequired &&
                  styles.inputError,
              ]}
              value={formik.values.toolsRequired}
              onChangeText={formik.handleChange("toolsRequired")}
              onBlur={formik.handleBlur("toolsRequired")}
              placeholder="Enter Tools Required"
            />
            {formik.errors.toolsRequired && formik.touched.toolsRequired && (
              <Text style={styles.errorText}>
                {formik.errors.toolsRequired}
              </Text>
            )}
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.label}>
              Required People <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                formik.errors.requiredPeople &&
                  formik.touched.requiredPeople &&
                  styles.inputError,
              ]}
              value={formik.values.requiredPeople}
              onChangeText={formik.handleChange("requiredPeople")}
              onBlur={formik.handleBlur("requiredPeople")}
              placeholder="Enter Required People"
              keyboardType="numeric"
            />
            {formik.errors.requiredPeople && formik.touched.requiredPeople && (
              <Text style={styles.errorText}>
                {formik.errors.requiredPeople}
              </Text>
            )}
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.label}>
              Work Time <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                formik.errors.workTime &&
                  formik.touched.workTime &&
                  styles.inputError,
              ]}
              value={formik.values.workTime}
              onChangeText={formik.handleChange("workTime")}
              onBlur={formik.handleBlur("workTime")}
              placeholder="e.g. 9AM-5PM"
            />
            {formik.errors.workTime && formik.touched.workTime && (
              <Text style={styles.errorText}>{formik.errors.workTime}</Text>
            )}
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.label}>
              Preferred Work Type <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View
              style={[
                globalStyes.selectBox,
                formik.errors.preferredWorkType &&
                  formik.touched.preferredWorkType &&
                  styles.inputError,
              ]}
            >
              <Picker
                selectedValue={formik.values.preferredWorkType}
                onValueChange={(itemValue) => {
                  formik.setFieldTouched("preferredWorkType", true);
                  formik.setFieldValue("preferredWorkType", itemValue);
                }}
              >
                <Picker.Item label="---Select Work Type---" value="" />
                {preferredWorkTypes.map((item) => (
                  <Picker.Item
                    key={item.id}
                    label={item.label}
                    value={item.id}
                  />
                ))}
              </Picker>
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
              Work Rate{" "}
              {formik.values.preferredWorkType === "daily wages"
                ? "Per Day"
                : formik.values.preferredWorkType === "monthly"
                  ? "Per Month"
                  : formik.values.preferredWorkType === "contract"
                    ? "Per Contract"
                    : ""}{" "}
              <Text style={styles.requiredStar}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                formik.errors.workRatePerDay &&
                  formik.touched.workRatePerDay &&
                  styles.inputError,
              ]}
              value={formik.values.workRatePerDay}
              onChangeText={formik.handleChange("workRatePerDay")}
              onBlur={formik.handleBlur("workRatePerDay")}
              placeholder={
                formik.values.preferredWorkType === "daily wages"
                  ? "Enter Rate Per Day"
                  : formik.values.preferredWorkType === "monthly"
                    ? "Enter Monthly Salary"
                    : formik.values.preferredWorkType === "contract"
                      ? "Enter Contract Amount"
                      : "Enter Rate"
              }
              keyboardType="numeric"
            />
            {formik.errors.workRatePerDay && formik.touched.workRatePerDay && (
              <Text style={styles.errorText}>
                {formik.errors.workRatePerDay}
              </Text>
            )}
          </View>

          <View style={styles.inputBlock}>
            <Text style={styles.label}>
              Facilities <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={styles.multiWrap}>
              {facilityOptions.map((item) => {
                const selected = formik.values.facilities.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.multiChip,
                      selected && styles.multiChipSelected,
                    ]}
                    onPress={() => toggleMultiSelect("facilities", item.id)}
                  >
                    <Text
                      style={[
                        styles.multiChipText,
                        selected && styles.multiChipTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {formik.errors.facilities && formik.touched.facilities && (
              <Text style={styles.errorText}>{formik.errors.facilities}</Text>
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
                ? "POSTING..."
                : job?.jobpostingid != null
                  ? "UPDATE JOB"
                  : "POST JOB"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </FormikProvider>
  );
};

export default PostJob;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eaf2f8",
  },
  sectionCard: {
    backgroundColor: "#fff",
    margin: 12,
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    paddingBottom: 150,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
    marginBottom: 18,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222",
    marginTop: 10,
    marginBottom: 14,
  },
  inputBlock: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    color: "#444",
    marginBottom: 6,
    fontWeight: "500",
  },
  requiredStar: {
    color: "red",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d8d8d8",
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: "#222",
  },
  inputError: {
    borderColor: "red",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
  },
  selectBox: {
    borderWidth: 1,
    borderColor: "#d8d8d8",
    borderRadius: 10,
    backgroundColor: "#f8f8f8",
    overflow: "hidden",
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: "#d8d8d8",
    borderRadius: 10,
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateText: {
    fontSize: 15,
    color: "#222",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    marginTop: 16,
    backgroundColor: "#1976d2",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  multiWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  multiChip: {
    borderWidth: 1,
    borderColor: "#1976d2",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  multiChipSelected: {
    backgroundColor: "#1976d2",
  },
  multiChipText: {
    color: "#1976d2",
    fontSize: 13,
    fontWeight: "600",
  },
  multiChipTextSelected: {
    color: "#fff",
  },
});
