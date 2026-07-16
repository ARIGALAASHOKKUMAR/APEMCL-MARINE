import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";
import axios from "axios";
import * as Location from "expo-location";
import { hideLoader, showLoader } from "../actions";

// ✅ IMPORT YOUR LOADER ACTIONS

// ✅ CONSTANTS
export const IMG_UPLOAD_URL =
  "https://swapi.dev.nidhi.apcfss.in/socialwelfaredms/user-defined-path/file-upload/";
export const IMG_DOWNLOAD_URL =
  "https://swapi.dev.nidhi.apcfss.in/socialwelfaredms/user-defined-path/file-download/";

const SUPPORTED_FORMATS = [
  "image/jpg",
  "image/jpeg",
  "image/png",
  "application/pdf",
  "text/javascript",
  "video/mp4",
  "application/json",
  "application/vnd.google-earth.kml+xml",
  "image/svg+xml",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/x-zip-compressed",
  "",
];

const MAX_FILE_SIZE = 20971520;

// ✅ COMMON AXIOS POST
const CommonAxiosPost = async (url, values) => {
  try {
    let res = await axios({
      url: url,
      method: "post",
      data: values,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (res.status === 200) {
      return res;
    }
  } catch (err) {
    Alert.alert("Error", "Upload failed");
  }
};

// ✅ VALIDATION
function validateFileTypeAndSize(file, size) {
  const maxSizeMB = size / (1024 * 1024);

  const fileSize = file.size || file.fileSize || 0;
  const fileType = file.mimeType || file.type || "";

  if (fileSize > size) {
    Alert.alert(
      "Error",
      `Please check your file size, it should be less than ${maxSizeMB}MB`,
    );
    return false;
  }

  if (
    !SUPPORTED_FORMATS.includes(fileType) &&
    file.name?.split(".").pop()?.toLowerCase() !== "geojson"
  ) {
    Alert.alert(
      "Error",
      `Invalid file format. Your file type is ${file.name
        ?.split(".")
        .pop()
        ?.toLowerCase()}`,
    );
    return false;
  }

  return true;
}

export const getLocation = async (name, formik) => {
  let addressText = "";

  const locPermission = await Location.requestForegroundPermissionsAsync();

  if (!locPermission.granted) {
    console.log("Permission denied");
    return;
  }

  const loc = await Location.getCurrentPositionAsync({});

  const address = await Location.reverseGeocodeAsync({
    latitude: loc.coords.latitude,
    longitude: loc.coords.longitude,
  });

  if (address.length > 0) {
    const place = address[0];

    addressText = [
      place.formattedAddress,
      `Lat:${loc.coords.latitude}`,
      `Lng:${loc.coords.longitude}`,
    ]
      .filter(Boolean)
      .join(" - ");
  }

  if (addressText) {
    formik.setFieldValue(`${name}Location`, addressText);
  }
};

export const getDistanceFromCurrent = async (pastLat, pastLng) => {
  try {
    // 1. Permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.log("Permission denied");
      return null;
    }

    // 2. Current location
    const current = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const { latitude, longitude } = current.coords;

    // 3. Haversine Formula
    const toRad = (value) => (value * Math.PI) / 180;

    const R = 6371; // Earth radius in KM
    const dLat = toRad(pastLat - latitude);
    const dLon = toRad(pastLng - longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(latitude)) *
        Math.cos(toRad(pastLat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distanceKm = R * c;

    return distanceKm; // in KM
  } catch (error) {
    console.log("Error:", error);
    return null;
  }
};

// ✅ UPLOAD
async function uploadFile(file, formik, path, name, size, dispatch) {
  if (!validateFileTypeAndSize(file, size)) return;
  dispatch(showLoader("Please Wait"));

  try {
    const formData = new FormData();

    formData.append("file", {
      uri: file.uri,
      name: file.fileName || file.name,
      type: file.mimeType || file.type || "application/octet-stream",
    });

    const response = await CommonAxiosPost(IMG_UPLOAD_URL + path, formData);

    if (response?.status === 200) {
      const uploadedPath = IMG_DOWNLOAD_URL + response?.data;

      formik.setFieldValue(name, uploadedPath);

      Alert.alert("Success", "File Uploaded Successfully");
    }
  } catch (error) {
    formik.setFieldValue(name, null);
    Alert.alert(
      "Error",
      "Unfortunately, we encountered an error while uploading",
    );
  }
  dispatch(hideLoader());
}

// ✅ CAMERA WITH REDUX LOADER
async function openCamera(formik, path, name, size, dispatch) {
  try {
    // ✅ OPEN CAMERA FIRST (NO DELAY)
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission required", "Camera access is needed");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (result.canceled) return;

    const file = result.assets[0];

    // ✅ SHOW LOADER AFTER CAPTURE (better UX)
    dispatch(showLoader("Fetching location..."));

    let addressText = null;

    try {
      // const locPermission = await Location.requestForegroundPermissionsAsync();
      // if (locPermission.granted) {
      //   const loc = await Location.getCurrentPositionAsync({});
      //   const address = await Location.reverseGeocodeAsync({
      //     latitude: loc.coords.latitude,
      //     longitude: loc.coords.longitude,
      //   });
      //   if (address.length > 0) {
      //     const place = address[0];
      //     addressText = [
      //       place.formattedAddress,
      //       `Lat:${loc.coords.latitude}`,
      //       `Lng:${loc.coords.longitude}`,
      //     ]
      //       .filter(Boolean)
      //       .join(" - ");
      //   }
      // }
    } catch (e) {
      console.log("Location error", e);
    }

    dispatch(hideLoader());

    // if (addressText) {
    //   formik.setFieldValue(`${name}Location`, addressText);
    // }

    await uploadFile(file, formik, path, name, size, dispatch);
  } catch (err) {
    dispatch(hideLoader());
    Alert.alert("Error", "Something went wrong");
  }
}

// ✅ GALLERY
async function openGallery(formik, path, name, size,dispatch) {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    Alert.alert("Permission required", "Gallery access is needed");
    return;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.All,
    quality: 0.7,
  });

  if (result.canceled) return;

  const file = result.assets[0];

  await uploadFile(file, formik, path, name, size, dispatch);
}

// ✅ DOCUMENT
async function pickDocument(formik, path, name, size,dispatch) {
  const result = await DocumentPicker.getDocumentAsync({});

  if (result.canceled) return;

  const file = result.assets[0];

  await uploadFile(file, formik, path, name, size, dispatch);
}

// ✅ MAIN FUNCTION
export default async function ImageBucketRN(
  formik,
  path,
  name,
  size = MAX_FILE_SIZE,
  mode = "all",
  dispatch,
) {
  try {
    if (mode === "document") {
      return pickDocument(formik, path, name, size,dispatch);
    }

    if (mode === "camera") {
      return openCamera(formik, path, name, size, dispatch);
    }

    if (mode === "gallery") {
      return openGallery(formik, path, name, size,dispatch);
    }

    Alert.alert("Upload", "Choose option", [
      {
        text: "Camera",
        onPress: () => openCamera(formik, path, name, size, dispatch),
      },
      {
        text: "Gallery",
        onPress: () => openGallery(formik, path, name, size,dispatch),
      },
      {
        text: "Files",
        onPress: () => pickDocument(formik, path, name, size,dispatch),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  } catch (error) {
    dispatch(hideLoader());
    Alert.alert("Error", "Something went wrong");
  }
}
