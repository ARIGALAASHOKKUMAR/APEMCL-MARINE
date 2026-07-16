import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  TextInput,
} from "react-native";

import { useFormik, FormikProvider } from "formik";
import * as Yup from "yup";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons"; // or react-native-vector-icons/Ionicons

import {
  commonAPICall,
  GEOTAGGINGGET,
  GEOTAGGINGPOST,
  GETDISTSAPP,
} from "../utils/utils";
import { useDispatch, useSelector } from "react-redux";
import ImageBucketRN, {
  getCurrentLatLongs,
  getDistanceFromCurrent,
  getLocation,
} from "../utils/ImageBucketRN";
import { dists28 } from "../utils/CommonFunctions";
import * as Location from "expo-location";
import { showErrorToast } from "../utils/showToast";
import { hideLoader, showLoader } from "../actions";
import { globalStyes } from "./GlobalStyles";

const GeoTagging = () => {
  const dispatch = useDispatch();
  const roleId = useSelector((state) => state.LoginReducer.roleId);

  const [existingData, setExistingData] = useState(null);

  const SubmitDetails = async (values) => {
    // Prepare payload with ground truthing images
    let payload = {};

    if (roleId === 4) {
      // Only ground truthing data
      payload = {
        agencyId: existingData?.geotagid || 1,

        groundTruthingFrontImage: values.groundTruthFrontImageLocation || "",
        groundTruthingBackImage: values.groundTruthBackImageLocation || "",
        groundTruthingSideImage: values.groundTruthSideImageLocation || "",

        groundTruthingFrontLocation:
          values.groundTruthFrontImageLocationLocation || "",
        groundTruthingBackLocation:
          values.groundTruthFrontImageLocationLocation || "",
        groundTruthingSideLocation:
          values.groundTruthFrontImageLocationLocation || "",

        remarks: values.remarks || "",
      };
    } else if (roleId === 11) {
      // Full payload
      payload = {
        districtId: values.districtId,
        categoryId: values.categoryId,
        landmark: values.landmark,
        frontImage: values.frontImage || "",
        frontImageLocation: values.frontImageLocation || "",
        backImage: values.backImage || "",
        backImageLocation: values.backImageLocation || "",
        sideImage: values.sideImage || "",
        sideImageLocation: values.sideImageLocation || "",
      };
    }

    const response = await commonAPICall(
      GEOTAGGINGPOST,
      payload,
      "post",
      dispatch,
    );
    if (response.status === 201 || response.status === 200) {
      formik.resetForm();
      if (roleId === 4) {
        // Refresh existing data to show updated ground truth images
        getGeoTaggingDetails();
        setStatus(false);
      }
    }
  };

  // Validation based on role
  const validationSchema = Yup.object().shape({
    districtId: Yup.string().required("District is required"),
    categoryId: Yup.string().required("Category is required"),
    ...(roleId === 11 && {
      frontImage: Yup.string().required("Front image required"),
      backImage: Yup.string().required("Back image required"),
      sideImage: Yup.string().required("Side image required"),
      landmark: Yup.string().required("Landmark required"),
    }),
    ...(roleId === 4 && {
      groundTruthFrontImageLocation: Yup.string().required(
        "Ground truth front image required",
      ),
      groundTruthBackImageLocation: Yup.string().required(
        "Ground truth back image required",
      ),
      groundTruthSideImageLocation: Yup.string().required(
        "Ground truth side image required",
      ),
      remarks: Yup.string().required("Remarks required"),
    }),
  });

  const [wholedata, setWholeData] = useState([]);

  const [status, setStatus] = useState(false);

  const getGeoTaggingDetails = async () => {
    const response = await commonAPICall(GEOTAGGINGGET, {}, "get", dispatch);

    if (response.status === 200) {
      const data = response?.data.Geo_Tagging_Details?.[0];
      setWholeData(response?.data.Geo_Tagging_Details || []);
    }
  };

  useEffect(() => {
    if (roleId === 11) {
      // getGeoTaggingDetails();
      formik.resetForm();
    }
    if (roleId === 4) {
      getGeoTaggingDetails();
    }
  }, []);

  useEffect(() => {
    if (roleId === 4) {
      formik.setValues({
        districtId: existingData?.district_id?.toString() || "",
        categoryId: existingData?.category_id?.toString() || "",
        landmark: existingData?.landmark,
        // Existing images (read-only)
        existingFrontImage: existingData?.front_image || "",
        existingFrontLocation: existingData?.front_image_location || "",
        existingBackImage: existingData?.back_image || "",
        existingBackLocation: existingData?.back_image_location || "",
        existingSideImage: existingData?.side_image || "",
        existingSideLocation: existingData?.side_image_location || "",
        // Ground truth images (to be filled)
        groundTruthFrontImageLocation: "",
        groundTruthFrontLocation: "",
        groundTruthBackImageLocation: "",
        groundTruthBackLocation: "",
        groundTruthSideImageLocation: "",
        groundTruthSideLocation: "",
        remarks: "",
      });
    }
  }, [existingData]);

  const formik = useFormik({
    initialValues: {
      districtId: "",
      categoryId: "",
      landmark: "",
      // For roleId 4
      frontImage: "",
      frontImageLocation: "",
      backImage: "",
      backImageLocation: "",
      sideImage: "",
      sideImageLocation: "",
      // For roleId 11 (existing data display)
      existingFrontImage: "",
      existingFrontLocation: "",
      existingBackImage: "",
      existingBackLocation: "",
      existingSideImage: "",
      existingSideLocation: "",
      // For roleId 11 (ground truth images)
      groundTruthFrontImageLocation: "",
      groundTruthFrontLocation: "",
      groundTruthBackImageLocation: "",
      groundTruthBackLocation: "",
      groundTruthSideImageLocation: "",
      groundTruthSideLocation: "",
      remarks: "",
    },
    validationSchema,
    onSubmit: SubmitDetails,
  });

  const [selectedid, setSelectedId] = useState({});

  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    const fetchLocations = async () => {
      let fields = [];

      if (roleId === 4) {
        fields = [
          "groundTruthFrontImageLocation",
          "groundTruthBackImageLocation",
          "groundTruthSideImageLocation",
        ];
      } else if (roleId === 11) {
        fields = ["frontImage", "backImage", "sideImage"];
      }

      for (const name of fields) {
        await getLocation(name, formik);
      }
    };

    fetchLocations();
  }, [roleId, existingData]);

  const checkDistance = async () => {
    try {
      dispatch(showLoader("Getting current location..."));

      const pastLat = 17.385;
      const pastLng = 78.4867;

      const lat = existingData?.front_image_location
        .split(" - ")[1]
        .split(":")[1];

      const lon = existingData?.front_image_location
        .split(" - ")[2]
        .split(":")[1];

      const distance = await getDistanceFromCurrent(lat, lon);

      if (distance !== null) {
        console.log("Distance (KM):", distance);
        console.log("Distance (Meters):", distance * 1000);

        if (distance * 1000 > 50) {
          const distanceInMeters = distance * 1000;

          const formattedDistance =
            distanceInMeters >= 1000
              ? `${(distanceInMeters / 1000).toFixed(2)} km`
              : `${distanceInMeters.toFixed(2)} meters`;

          Alert.alert(
            "Distance Alert",
            `You are ${formattedDistance} away from current location, it should be less than 50m`,
          );
          setStatus(false);
          setExistingData({});
        }
      }
    } catch (err) {
      console.log(err);
    } finally {
      dispatch(hideLoader()); // 👈 IMPORTANT
    }
  };

  useEffect(() => {
    if (roleId === 4 && wholedata?.length > 0 && existingData && status) {
      checkDistance();
    }
  }, [existingData, status]);

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {roleId === 4 && !status && wholedata.length > 0 && (
        <View>
          {wholedata.length === 0 && <Text>No Data Found</Text>}
          <View style={{ marginTop: 10 }}>
            {/* HEADER */}
            <View style={styles.tableHeader}>
              {/* <Text style={styles.headerCell}>District</Text>
      <Text style={styles.headerCell}>Category</Text> */}
              <Text style={styles.headerCell}>S.NO</Text>
              <Text style={styles.headerCell}>Image</Text>
              <Text style={styles.headerCell}>Landmark</Text>
              <Text style={styles.headerCell}>Action</Text>
            </View>

            {/* ROWS */}
            {wholedata.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                {/* <Text style={styles.cell}>{item.dist_name}</Text>
        <Text style={styles.cell}>{item.category_name}</Text> */}
                <Text style={[styles.cell, { textAlign: "center" }]}>
                  {index + 1}
                </Text>
                <View style={styles.cell}>
                  <Image
                    source={{ uri: item.front_image }}
                    style={{ width: 50, height: 50, borderRadius: 4 }}
                  />
                </View>

                <Text style={styles.cell}>{item.landmark}</Text>
                <View style={styles.cell}>
                  <TouchableOpacity
                    disabled={item.verification_status === "APPROVED"}
                    onPress={() => {
                      if (item.verification_status !== "APPROVED") {
                        setExistingData(item);
                        setStatus(true);
                      }
                    }}
                    style={{
                      backgroundColor:
                        item.verification_status === "APPROVED"
                          ? "#6c757d"
                          : "#28a745",
                      paddingVertical: 4,
                      paddingHorizontal: 8,
                      borderRadius: 4,
                      alignSelf: "center",
                      opacity:
                        item.verification_status === "APPROVED" ? 0.6 : 1,
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 12 }}>
                      {item.verification_status === "APPROVED"
                        ? "Verified"
                        : "Verify"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {(roleId === 11 || status) && (
        <FormikProvider value={formik}>
          <Text style={styles.title}>GEO TAGGING</Text>

          {roleId === 4 && (
            <TouchableOpacity
              onPress={() => {
                setStatus(false);
                setExistingData({});
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                alignSelf: "flex-start",
                backgroundColor: "black",
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 20,
                marginBottom: 12,
                elevation: 3, // Android shadow
                shadowColor: "#000", // iOS shadow
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 3,
              }}
              activeOpacity={0.7}
            >
              <Text style={{ color: "#fff", fontSize: 16, marginRight: 6 }}>
                ←
              </Text>
              <Text
                style={{
                  color: "#fff",
                  fontWeight: "600",
                  fontSize: 14,
                }}
              >
                Back
              </Text>
            </TouchableOpacity>
          )}

          {/* DISTRICT */}
          <Text style={styles.label}>District / జిల్లా</Text>
          <View style={globalStyes.selectBox}>
            <Picker
              selectedValue={formik.values.districtId}
              onValueChange={(value) =>
                formik.setFieldValue("districtId", value)
              }
              style={globalStyes.pickerText}
              enabled={roleId !== 4 || !existingData} // Disable for roleId 11 if data exists
            >
              <Picker.Item label="Select District" value="" />
              {dists28.map((dist) => (
                <Picker.Item
                  key={String(dist.dist_code)}
                  label={dist.dist_name}
                  value={String(dist.dist_code)}
                />
              ))}
            </Picker>
          </View>
          {formik.touched.districtId && formik.errors.districtId && (
            <Text style={styles.error}>{formik.errors.districtId}</Text>
          )}

          {/* CATEGORY */}
          <Text style={styles.label}>Category / వర్గం</Text>
          <View style={globalStyes.selectBox}>
            <Picker
              selectedValue={formik.values.categoryId}
              onValueChange={(value) =>
                formik.setFieldValue("categoryId", value)
              }
              style={globalStyes.pickerText}
              enabled={roleId !== 4 || !existingData} // Disable for roleId 11 if data exists
            >
              <Picker.Item label="Select Category" value="" />
              <Picker.Item label="Bus Shelters & Hoardings" value="1" />
              <Picker.Item
                label="Hospital TV Screens & Anna Canteens"
                value="2"
              />
              <Picker.Item
                label="CCTV Screens at APSRTC Bus Stations"
                value="3"
              />
              <Picker.Item
                label="Auto Backs & Digital Wall Paintings"
                value="4"
              />
              <Picker.Item label="Pillar Boards" value="5" />
            </Picker>
          </View>
          {formik.touched.categoryId && formik.errors.categoryId && (
            <Text style={styles.error}>{formik.errors.categoryId}</Text>
          )}

          <View>
            <Text style={styles.label}>Landmark / ల్యాండ్‌మార్క్</Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#ccc",
                borderRadius: 5,
                padding: 10,
                marginBottom: 10,
              }}
              enabled={roleId !== 4 || !existingData}
              placeholder="Enter Landmark"
              value={formik.values.landmark}
              onChangeText={(text) => formik.setFieldValue("landmark", text)}
            />
            {formik.touched.landmark && formik.errors.landmark && (
              <Text style={styles.error}>{formik.errors.landmark}</Text>
            )}
          </View>

          {/* FOR ROLE ID 4 - Normal Image Upload */}
          {roleId === 11 && (
            <>
              {["frontImage", "backImage", "sideImage"].map((name) => {
                const label = name.replace("Image", "");
                return (
                  <View key={name}>
                    <Text style={styles.label}>{label} Image</Text>
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={async () => {
                        formik.setFieldTouched(name, true);

                        ImageBucketRN(
                          formik,
                          "APFD/SAWMILLS/",
                          name,
                          20971520,
                          "camera",
                          dispatch,
                        );

                        // await getLocation(name);
                      }}
                    >
                      <View style={styles.uploadButton}>
                        <Ionicons
                          name="camera"
                          size={20}
                          color="#fff"
                          style={{ marginRight: 6 }}
                        />
                        <Text style={styles.uploadButtonText}>
                          Capture {label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    {formik.touched[name] && formik.errors[name] && (
                      <Text style={styles.error}>{formik.errors[name]}</Text>
                    )}
                    {formik.values[name] && (
                      <View style={styles.rowContainer}>
                        <Image
                          source={{ uri: formik.values[name] }}
                          style={styles.previewImage}
                        />
                        {formik.values[`${name}Location`] && (
                          <View style={styles.locationBox}>
                            <Text style={{ fontWeight: "bold" }}>
                              📍 Location
                            </Text>
                            <Text style={{ fontSize: 13, color: "#333" }}>
                              {formik.values[`${name}Location`]}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </>
          )}

          {/* FOR ROLE ID 11 - Show Existing Images (Read-only) + Ground Truth Upload */}
          {roleId === 4 && (
            <>
              {/* Read-only Existing Images Section */}
              {existingData && (
                <>
                  <View style={styles.readOnlySection}>
                    <Text style={styles.sectionTitle}>
                      📋 Existing Images (Read Only)
                    </Text>

                    {/* Existing Front Image */}
                    <Text style={styles.label}>Existing Front Image</Text>
                    {formik.values.existingFrontImage ? (
                      <View style={styles.rowContainer}>
                        <Image
                          source={{ uri: formik.values.existingFrontImage }}
                          style={styles.previewImage}
                        />
                        {formik.values.existingFrontLocation && (
                          <View style={styles.locationBox}>
                            <Text style={{ fontWeight: "bold" }}>
                              📍 Location
                            </Text>
                            <Text style={{ fontSize: 13, color: "#333" }}>
                              {formik.values.existingFrontLocation}
                            </Text>
                          </View>
                        )}
                      </View>
                    ) : (
                      <Text style={styles.noDataText}>
                        No front image available
                      </Text>
                    )}

                    {/* Existing Back Image */}
                    <Text style={styles.label}>Existing Back Image</Text>
                    {formik.values.existingBackImage ? (
                      <View style={styles.rowContainer}>
                        <Image
                          source={{ uri: formik.values.existingBackImage }}
                          style={styles.previewImage}
                        />
                        {formik.values.existingBackLocation && (
                          <View style={styles.locationBox}>
                            <Text style={{ fontWeight: "bold" }}>
                              📍 Location
                            </Text>
                            <Text style={{ fontSize: 13, color: "#333" }}>
                              {formik.values.existingBackLocation}
                            </Text>
                          </View>
                        )}
                      </View>
                    ) : (
                      <Text style={styles.noDataText}>
                        No back image available
                      </Text>
                    )}

                    {/* Existing Side Image */}
                    <Text style={styles.label}>Existing Side Image</Text>
                    {formik.values.existingSideImage ? (
                      <View style={styles.rowContainer}>
                        <Image
                          source={{ uri: formik.values.existingSideImage }}
                          style={styles.previewImage}
                        />
                        {formik.values.existingSideLocation && (
                          <View style={styles.locationBox}>
                            <Text style={{ fontWeight: "bold" }}>
                              📍 Location
                            </Text>
                            <Text style={{ fontSize: 13, color: "#333" }}>
                              {formik.values.existingSideLocation}
                            </Text>
                          </View>
                        )}
                      </View>
                    ) : (
                      <Text style={styles.noDataText}>
                        No side image available
                      </Text>
                    )}
                  </View>

                  <View style={styles.divider} />

                  {/* Ground Truth Images Upload Section */}
                  <View style={styles.groundTruthSection}>
                    <Text style={styles.sectionTitle}>
                      ✅ Ground Truth Images (Upload New)
                    </Text>

                    {[
                      "groundTruthFrontImageLocation",
                      "groundTruthBackImageLocation",
                      "groundTruthSideImageLocation",
                    ].map((name) => {
                      const label = name
                        .replace("groundTruth", "")
                        .replace("Image", "");
                      return (
                        <View key={name}>
                          <Text style={styles.label}>
                            Ground Truth {label} Image
                          </Text>
                          <TouchableOpacity
                            style={styles.uploadButton}
                            onPress={() => {
                              formik.setFieldTouched(name, true);
                              ImageBucketRN(
                                formik,
                                "APFD/SAWMILLS/GROUNDTRUTH/",
                                name,
                                20971520,
                                "camera",
                                dispatch,
                              );
                            }}
                          >
                            <View style={styles.uploadButton}>
                              <Ionicons
                                name="camera"
                                size={20}
                                color="#fff"
                                style={{ marginRight: 6 }}
                              />
                              <Text style={styles.uploadButtonText}>
                                Capture {label}
                              </Text>
                            </View>
                          </TouchableOpacity>
                          {formik.touched[name] && formik.errors[name] && (
                            <Text style={styles.error}>
                              {formik.errors[name]}
                            </Text>
                          )}
                          {formik.values[name] && (
                            <View style={styles.rowContainer}>
                              <Image
                                source={{ uri: formik.values[name] }}
                                style={styles.previewImage}
                              />
                              {formik.values[`${name}Location`] && (
                                <View style={styles.locationBox}>
                                  <Text style={{ fontWeight: "bold" }}>
                                    📍 Location
                                  </Text>
                                  <Text style={{ fontSize: 13, color: "#333" }}>
                                    {formik.values[`${name}Location`]}
                                  </Text>
                                </View>
                              )}
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </>
              )}

              {/* If no existing data, show message */}
              {!existingData && (
                <Text style={styles.noDataMessage}>
                  No existing data found. Please contact administrator.
                </Text>
              )}
            </>
          )}

          {/* REMARKS - For both roles */}

          {roleId === 4 && (
            <View>
              <Text style={styles.label}>Remarks</Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 6,
                  padding: 10,
                  marginTop: 8,
                }}
                placeholder="Enter any remarks here..."
                value={formik.values.remarks}
                onChangeText={(text) => formik.setFieldValue("remarks", text)}
              />
              {formik.touched.remarks && formik.errors.remarks && (
                <Text style={styles.error}>{formik.errors.remarks}</Text>
              )}
            </View>
          )}

          {/* SUBMIT BUTTON */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              // {
              //   opacity: formik.isValid ? 1 : 0.6,
              // },
            ]}
            onPress={formik.handleSubmit}
            // disabled={!formik.isValid}
          >
            <Text style={styles.submitText}>
              {roleId === 4 ? "Submit Ground Truth Images" : "Submit"}
            </Text>
          </TouchableOpacity>

          {roleId === 4 && existingData && (
            <Text style={styles.infoText}>
              ℹ️ Please capture 3 new ground truth images for verification
            </Text>
          )}
        </FormikProvider>
      )}
    </ScrollView>
  );
};

export default GeoTagging;

const styles = StyleSheet.create({
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "green",
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  headerCell: {
    flex: 1,
    padding: 8,
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
    textAlign: "center",
    borderRightWidth: 1,
    borderColor: "#ddd",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  cell: {
    flex: 1,
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderColor: "#eee",
  },
  actionBtn: {
    backgroundColor: "#28a745",
    borderRadius: 4,
    // width:20,
    // height:20
  },
  container: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 120, // 👈 important
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    color: "#2e7d32",
  },

  label: {
    marginTop: 12,
    marginBottom: 5,
    fontWeight: "600",
  },

  selectBox: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    backgroundColor: "#fff",
  },

  uploadButton: {
    backgroundColor: "#0288d1",
    padding: 2,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 3,
  },

  uploadButtonText: {
    color: "#fff",
    fontWeight: "600",
  },

  rowContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },

  previewImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },

  locationBox: {
    flex: 1,
    padding: 8,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },

  latLng: {
    fontSize: 12,
    color: "gray",
    marginTop: 5,
  },

  submitButton: {
    marginTop: 20,
    backgroundColor: "#2e7d32",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },

  submitText: {
    color: "#fff",
    fontWeight: "bold",
  },

  error: {
    color: "red",
    fontSize: 12,
    marginTop: 2,
  },
  pickerText: {
    color: "#000", // Force black text in all modes
  },
});
