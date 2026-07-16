import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
  FlatList,
  Image,
  Linking,
  Dimensions,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useDispatch } from "react-redux";
import {
  commonAPICall,
  CONTEXT_HEADING,
  CREATEMARINEDISCHARGEPOSTING,
  GUARDPONDSGET,
  MARINEDISCHARGEDETAILS,
} from "../utils/utils";
import ImageBucketRN from "../utils/ImageBucketRN";
import Ionicons from "react-native-vector-icons/Ionicons";
import { globalStyes } from "./GlobalStyles";

const { width, height } = Dimensions.get('window');

const Posting = () => {
  const [showModal, setShowModal] = useState(false);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageTitle, setSelectedImageTitle] = useState("");
  const [formData, setFormData] = useState({
    guardPondId: "",
    qtyReadyForDischarge: "",
    remarks: "",
    gpLevelMeterImage: null,
    guardPondImage: null,
  });
  const [errors, setErrors] = useState({});
  const dispatch = useDispatch();
  const [touched, setTouched] = useState({});

  const [ponds,setPonds] = useState([])


  const getData = async()=>{
     const res = await commonAPICall(GUARDPONDSGET,{},"get",dispatch)
     if(res.status === 200){
      setPonds(res.data.GuardPondDetails)
     }
  }

  useEffect(()=>{
    getData()
  },[])
  // Validation function
  const validateForm = () => {
    const newErrors = {};
    if (!formData.guardPondId) newErrors.guardPondId = "required";
    if (!formData.qtyReadyForDischarge)
      newErrors.qtyReadyForDischarge = "required";
    if (!formData.remarks) newErrors.remarks = "required";
    if (!formData.gpLevelMeterImage) newErrors.gpLevelMeterImage = "required";
    if (!formData.guardPondImage) newErrors.guardPondImage = "required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Allow numbers and dot only
  const allowNumbersOnlyDot = (text) => {
    const regex = /^\d*\.?\d*$/;
    return regex.test(text);
  };

  // Check if URL is an image
  const isImageUrl = (url) => {
    if (!url) return false;
    const imageExtensions = /\.(jpg|jpeg|png|gif|webp|bmp)$/i;
    return imageExtensions.test(url);
  };

  // Check if URL is a PDF
  const isPdfUrl = (url) => {
    if (!url) return false;
    return /\.pdf$/i.test(url);
  };

  // View Image in Modal
  const viewImage = (imageUrl, title) => {
    if (!imageUrl) {
      Alert.alert('Error', 'No image available');
      return;
    }
    setSelectedImage(imageUrl);
    setSelectedImageTitle(title);
    setImageModalVisible(true);
  };

  // Download file using Linking
  const downloadFile = (fileUrl) => {
    if (!fileUrl) {
      Alert.alert('Error', 'No file available to download');
      return;
    }

    try {
      Linking.openURL(fileUrl);
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to open file');
    }
  };

  const HandleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        guardPondId: formData.guardPondId,
        qtyReadyForDischarge: formData.qtyReadyForDischarge,
        remarks: formData.remarks,
        gpLevelMeterImage: formData.gpLevelMeterImage,
        guardPondImage: formData.guardPondImage,
      };

      const res = await commonAPICall(
        CREATEMARINEDISCHARGEPOSTING,
        payload,
        "post",
        dispatch,
      );
      if (res.status === 201) {
        setShowModal(false);
        resetForm();
        GetData();
        Alert.alert("Success", "Posting created successfully");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to create posting");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      guardPondId: "",
      qtyReadyForDischarge: "",
      remarks: "",
      gpLevelMeterImage: null,
      guardPondImage: null,
    });
    setErrors({});
    setTouched({});
  };

  const GetData = async () => {
    try {
      const res = await commonAPICall(
        MARINEDISCHARGEDETAILS,
        {},
        "get",
        dispatch,
      );

      if (res.status === 200) {
        setData(res.data.MarineDischargePostingDetails || []);
      } else {
        setData([]);
      }
    } catch (error) {
      setData([]);
    }
  };

  // Render Card
  const renderCard = ({ item, index }) => {
    const getGuardPondName = (id) => {
      const pondMap = {
        1: "Guard Pond-1",
        2: "Guard Pond-2",
        3: "Guard Pond-3",
        4: "Guard Pond-4",
      };
      return pondMap[id] || "-";
    };

    const getStatusColor = (status) => {
      if (status === "Completed" || status === "Approved") return "#28a745";
      if (status === "Pending" || status === "Submitted") return "#ffc107";
      if (status === "Rejected") return "#dc3545";
      return "#6c757d";
    };

    const getStatusBgColor = (status) => {
      if (status === "Completed" || status === "Approved") return "#d4edda";
      if (status === "Pending" || status === "Submitted") return "#fff3cd";
      if (status === "Rejected") return "#f8d7da";
      return "#e9ecef";
    };

    const gpMeterImage = item?.discharge_request_gp_level_meter_image;
    const guardPondImage = item?.discharge_request_guard_pond_image;

    return (
      <View style={styles.cardItem}>
        <View style={styles.cardHeaderItem}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardId}>Sample #{item?.discharge_request_id || '-'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(item?.current_status) }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item?.current_status),display:"block" }]}>
                {item?.current_status || 'Pending'}
              </Text>
            </View>
          <Text style={styles.cardPond}>{item?.guard_pond_id}</Text>
        </View>

        <View style={styles.cardBodyItem}>
          <View style={styles.cardRow}>
            <View style={styles.cardLabelContainer}>
              <Text style={styles.cardLabel}>Requested Date</Text>
              <Text style={styles.cardValue}>{item?.discharge_request_date || '-'}</Text>
            </View>
            <View style={styles.cardLabelContainer}>
              <Text style={styles.cardLabel}>Volume (KL)</Text>
              <Text style={styles.cardValue}>{item?.qty_ready_for_discharge || '-'}</Text>
            </View>
          </View>

          {item?.discharge_request_remarks && (
            <View style={styles.cardRemarksContainer}>
              <Text style={styles.cardLabel}>Remarks</Text>
              <Text style={styles.cardRemarks}>{item?.discharge_request_remarks}</Text>
            </View>
          )}

          <View style={styles.cardFilesContainer}>
            {/* GP Meter Image */}
            <View style={styles.cardFileItem}>
              <Ionicons name="document-text-outline" size={20} color="green" />
              <Text style={styles.cardFileLabel}>GP Meter Image</Text>
              {gpMeterImage ? (
                <View style={styles.fileActions}>
                  {isImageUrl(gpMeterImage) ? (
                    <TouchableOpacity
                      style={styles.viewButton}
                      onPress={() => viewImage(gpMeterImage, `GP Meter - ${item?.discharge_request_id}`)}
                    >
                      <Ionicons name="eye-outline" size={16} color="#fff" />
                      <Text style={styles.viewButtonText}>View</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.downloadButton}
                      onPress={() => downloadFile(gpMeterImage)}
                    >
                      <Ionicons name="download-outline" size={16} color="#fff" />
                      <Text style={styles.downloadButtonText}>Download</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={() => downloadFile(gpMeterImage)}
                  >
                    <Ionicons name="download-outline" size={16} color="#fff" />
                    <Text style={styles.downloadButtonText}>Download</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.noFileText}>No file</Text>
              )}
            </View>

            {/* Guard Pond Image */}
            <View style={styles.cardFileItem}>
              <Ionicons name="image-outline" size={20} color="green" />
              <Text style={styles.cardFileLabel}>Guard Pond Image</Text>
              {guardPondImage ? (
                <View style={styles.fileActions}>
                  {isImageUrl(guardPondImage) ? (
                    <TouchableOpacity
                      style={styles.viewButton}
                      onPress={() => viewImage(guardPondImage, `Guard Pond - ${item?.discharge_request_id}`)}
                    >
                      <Ionicons name="eye-outline" size={16} color="#fff" />
                      <Text style={styles.viewButtonText}>View</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.downloadButton}
                      onPress={() => downloadFile(guardPondImage)}
                    >
                      <Ionicons name="download-outline" size={16} color="#fff" />
                      <Text style={styles.downloadButtonText}>Download</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={() => downloadFile(guardPondImage)}
                  >
                    <Ionicons name="download-outline" size={16} color="#fff" />
                    <Text style={styles.downloadButtonText}>Download</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.noFileText}>No file</Text>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  useEffect(() => {
    GetData();
  }, []);

  return (
    <View style={styles.container}>
      {/* Image Preview Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.imageModalOverlay}>
          <View style={styles.imageModalContent}>
            <View style={styles.imageModalHeader}>
              <Text style={styles.imageModalTitle}>{selectedImageTitle || 'Image'}</Text>
              <TouchableOpacity onPress={() => setImageModalVisible(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.imageModalBody}>
              {selectedImage ? (
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.imageModalImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.noImageContainer}>
                  <Text style={styles.noImageText}>No image available</Text>
                </View>
              )}
              <View style={styles.imageModalFooter}>
                <TouchableOpacity
                  style={styles.imageModalDownloadButton}
                  onPress={() => {
                    if (selectedImage) {
                      downloadFile(selectedImage);
                    }
                  }}
                >
                  <Ionicons name="download-outline" size={20} color="#fff" />
                  <Text style={styles.imageModalDownloadText}>Download</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal for Add Posting */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Posting</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              {/* Guard Pond Picker */}
              <View style={styles.inputBlock}>
                <Text style={styles.label}>
                  Guard Pond <Text style={styles.star}>*</Text>
                </Text>
                <View style={globalStyes.selectBox}>
                  <Picker
                    selectedValue={formData.guardPondId}
                    onValueChange={(itemValue) => {
                      setFormData({ ...formData, guardPondId: itemValue });
                      setErrors({ ...errors, guardPondId: null });
                    }}
                                  style={globalStyes.pickerText}
                    
                  >
                    <Picker.Item label="Select" value="" />
                    {ponds.map((each)=>(
 <Picker.Item label={each.guardpond_name} value={each.guardpond_id}/>
                    ))}
                   
                   
                  </Picker>
                </View>
                {errors.guardPondId && (
                  <Text style={styles.errorText}>{errors.guardPondId}</Text>
                )}
              </View>

              {/* Qty Ready for Discharge */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Qty ready for Discharge(KL) <Text style={styles.star}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.qtyReadyForDischarge}
                  onChangeText={(text) => {
                    if (allowNumbersOnlyDot(text)) {
                      setFormData({ ...formData, qtyReadyForDischarge: text });
                      setErrors({ ...errors, qtyReadyForDischarge: null });
                    }
                  }}
                  maxLength={10}
                  keyboardType="decimal-pad"
                />
                {errors.qtyReadyForDischarge && (
                  <Text style={styles.errorText}>
                    {errors.qtyReadyForDischarge}
                  </Text>
                )}
              </View>

              {/* Remarks */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Remarks <Text style={styles.star}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.remarks}
                  onChangeText={(text) => {
                    setFormData({ ...formData, remarks: text });
                    setErrors({ ...errors, remarks: null });
                  }}
                  maxLength={50}
                  multiline
                  numberOfLines={3}
                />
                {errors.remarks && (
                  <Text style={styles.errorText}>{errors.remarks}</Text>
                )}
              </View>

              {/* GP Level Meter Image */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  GP level meter image <Text style={styles.star}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.uploadButton,
                    errors.gpLevelMeterImage &&
                      touched.gpLevelMeterImage &&
                      styles.inputError,
                  ]}
                  onPress={() => {
                    setTouched({ ...touched, gpLevelMeterImage: true });

                    let path = "APEMCL/MARNINEPOSTING/";

                    const formikLike = {
                      values: formData,
                      setFieldValue: (field, value) => {
                        setFormData((prev) => ({ ...prev, [field]: value }));
                        setErrors((prev) => ({ ...prev, [field]: null }));
                      },
                    };

                    ImageBucketRN(
                      formikLike,
                      path,
                      "gpLevelMeterImage",
                      20971520,
                      "camera",
                      dispatch,
                    );
                  }}
                >
                  <Text style={styles.uploadButtonText}>
                    Upload GP Meter Image
                  </Text>
                </TouchableOpacity>

                <View style={{ alignItems: "center" }}>
                  {formData.gpLevelMeterImage
                    ? (() => {
                        const fileUrl = formData.gpLevelMeterImage;

                        const isImage = /\.(jpg|jpeg|png)$/i.test(fileUrl);
                        const isPdf = /\.pdf$/i.test(fileUrl);

                        if (isImage) {
                          return (
                            <TouchableOpacity 
                              style={{ marginTop: 10 }}
                              onPress={() => viewImage(fileUrl, "GP Meter Image")}
                            >
                              <Image
                                source={{ uri: fileUrl }}
                                style={{
                                  width: 100,
                                  height: 100,
                                  borderRadius: 8,
                                  resizeMode: "cover",
                                }}
                              />
                            </TouchableOpacity>
                          );
                        }

                        if (isPdf) {
                          return (
                            <TouchableOpacity
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                marginTop: 10,
                              }}
                              onPress={() => downloadFile(fileUrl)}
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

                        return (
                          <Text style={styles.fileNameText}>{fileUrl}</Text>
                        );
                      })()
                    : null}
                </View>

                {errors.gpLevelMeterImage && touched.gpLevelMeterImage && (
                  <Text style={styles.errorText}>
                    {errors.gpLevelMeterImage}
                  </Text>
                )}
              </View>

              {/* Guard Pond Image */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Guard Pond image <Text style={styles.star}>*</Text>
                </Text>
                <TouchableOpacity
                  style={[
                    styles.uploadButton,
                    errors.guardPondImage &&
                      touched.guardPondImage &&
                      styles.inputError,
                  ]}
                  onPress={() => {
                    setTouched({ ...touched, guardPondImage: true });

                    let path = "APEMCL/MARNINEPOSTING/";

                    const formikLike = {
                      values: formData,
                      setFieldValue: (field, value) => {
                        setFormData((prev) => ({ ...prev, [field]: value }));
                        setErrors((prev) => ({ ...prev, [field]: null }));
                      },
                    };

                    ImageBucketRN(
                      formikLike,
                      path,
                      "guardPondImage",
                      20971520,
                      "camera",
                      dispatch,
                    );
                  }}
                >
                  <Text style={styles.uploadButtonText}>
                    Upload Guard Pond Image
                  </Text>
                </TouchableOpacity>

                <View style={{ alignItems: "center" }}>
                  {formData.guardPondImage
                    ? (() => {
                        const fileUrl = formData.guardPondImage;

                        const isImage = /\.(jpg|jpeg|png)$/i.test(fileUrl);
                        const isPdf = /\.pdf$/i.test(fileUrl);

                        if (isImage) {
                          return (
                            <TouchableOpacity 
                              style={{ marginTop: 10 }}
                              onPress={() => viewImage(fileUrl, "Guard Pond Image")}
                            >
                              <Image
                                source={{ uri: fileUrl }}
                                style={{
                                  width: 120,
                                  height: 120,
                                  borderRadius: 8,
                                  resizeMode: "cover",
                                }}
                              />
                            </TouchableOpacity>
                          );
                        }

                        if (isPdf) {
                          return (
                            <TouchableOpacity
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                marginTop: 10,
                              }}
                              onPress={() => downloadFile(fileUrl)}
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

                        return (
                          <Text style={styles.fileNameText}>{fileUrl}</Text>
                        );
                      })()
                    : null}
                </View>

                {errors.guardPondImage && touched.guardPondImage && (
                  <Text style={styles.errorText}>{errors.guardPondImage}</Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.disabledButton]}
                onPress={HandleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Submit</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Main Content */}
      <View>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            <Ionicons name="list-outline" size={20} color="#333" /> Posting
          </Text>
        </View>

        <View style={styles.cardBody}>
          <View style={{marginBottom:5}}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowModal(true)}
            >
              <Ionicons name="add-outline" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Add Posting</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2196F3" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : data.length > 0 ? (
            <FlatList
              data={data}
              renderItem={renderCard}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.noRecords}>
              <Ionicons name="document-text-outline" size={50} color="#ccc" />
              <Text style={styles.noRecordsText}>No Records Found</Text>
              <Text style={styles.noRecordsSubText}>
                Click "Add Posting" to create a new entry
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  inputBlock: {
    marginBottom: 16,
  },
   selectBox: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flex: 1,
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  cardBody: {
    padding: 16,
    flex: 1,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2196F3",
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  contextHeading: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#009688",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
    marginLeft: 4,
  },
  // Card styles
  cardItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeaderItem: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardId: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e3a5f",
  },
  cardPond: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 2,
  },
  cardBodyItem: {
    padding: 12,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardLabelContainer: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 11,
    color: "#6c757d",
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  cardRemarksContainer: {
    backgroundColor: "#f8f9fa",
    padding: 8,
    borderRadius: 4,
    marginBottom: 10,
  },
  cardRemarks: {
    fontSize: 13,
    color: "#333",
    marginTop: 2,
  },
  cardFilesContainer: {
    marginTop: 4,
  },
  cardFileItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  cardFileLabel: {
    fontSize: 12,
    color: "#495057",
    flex: 1,
    marginLeft: 8,
  },
  fileActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "green",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 4,
  },
  viewButtonText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "500",
    marginLeft: 2,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#28a745",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  downloadButtonText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "500",
    marginLeft: 2,
  },
  noFileText: {
    color: "#999",
    fontSize: 11,
  },
  // Image Modal styles
  imageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalContent: {
    width: "95%",
    height: "90%",
    backgroundColor: "#000",
    borderRadius: 10,
    overflow: "hidden",
  },
  imageModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  imageModalTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  imageModalBody: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalImage: {
    width: "100%",
    height: "100%",
  },
  imageModalFooter: {
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.8)",
    alignItems: "center",
  },
  imageModalDownloadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#28a745",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  imageModalDownloadText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  noImageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noImageText: {
    color: "#fff",
    fontSize: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    width: "100%",
    maxHeight: "80%",
    minHeight: "40%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "green",
    padding: 16,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "normal",
  },
  closeButton: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  modalBody: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  modalBodyContent: {
    paddingVertical: 16,
    paddingBottom: 24,
  },
  // Form styles
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  star: {
    color: "red",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  uploadButton: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f9f9f9",
    alignItems: "center",
  },
  uploadButtonText: {
    color: "#555",
    fontSize: 14,
  },
  inputError: {
    borderColor: "red",
    borderWidth: 2,
  },
  fileNameText: {
    color: "green",
    fontSize: 12,
    textDecorationLine: "underline",
    marginTop: 10,
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: "#28a745",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 14,
  },
  listContainer: {
    paddingBottom: 20,
  },
  noRecords: {
    padding: 40,
    alignItems: "center",
  },
  noRecordsText: {
    color: "#dc3545",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 8,
  },
  noRecordsSubText: {
    color: "#999",
    fontSize: 12,
    marginTop: 4,
  },
});

export default Posting;