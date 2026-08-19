import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Linking,
  ScrollView,
  TextInput,
  Alert,
  Modal,
} from "react-native";
import {
  commonAPICall,
  LISTALLGENATOR,
  LISTALLRECEIVERS,
} from "../utils/utils";
import Icon from "react-native-vector-icons/Ionicons";
import { useDispatch } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import { isImageUrl } from "../utils/CommonFunctions";
import CommonImageViewer from "./CommonImageViewer";

function OpenRegistrations() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("generator");
  const [showForm, setShowForm] = useState(false);
  const [selectedData, setSelectedData] = useState(null);
  const [isViewMode, setIsViewMode] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusAction, setStatusAction] = useState(""); // 'approve', 'reject', 'followup'
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const dispatch = useDispatch();

  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageTitle, setSelectedImageTitle] = useState("");
  const [imageModalVisible, setImageModalVisible] = useState(false);

  const viewImage = (imageUrl, title) => {
    if (!imageUrl) {
      Alert.alert("Info", "No image available");
      return;
    }
    setSelectedImage(imageUrl);
    setSelectedImageTitle(title || "Image Viewer");
    setImageModalVisible(true);
  };

  const onClose = () => {
    setImageModalVisible(false);
    setSelectedImage(null);
    setSelectedImageTitle("");
  };

  // Status update validation schema
  const statusValidationSchema = Yup.object().shape({
    status: Yup.string().required("Please select a status"),
    remarks: Yup.string().when("status", {
      is: (val) => val === "2" || val === "3", // Follow Up or Reject
      then: Yup.string().required("Remarks are required for this action"),
      otherwise: Yup.string(),
    }),
  });

  const statusFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      status: "",
      remarks: "",
    },
    validationSchema: statusValidationSchema,
    onSubmit: (values) => {
      handleStatusUpdate(values);
    },
  });

  const GetData = async () => {
    try {
      setLoading(true);
      await HandleGeneratorClick();
    } catch (error) {
      console.log("Error loading initial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const HandleGeneratorClick = async () => {
    try {
      setLoading(true);
      setActiveTab("generator");
      const response = await commonAPICall(LISTALLGENATOR, {}, "get", dispatch);
      if (response?.status === 200) {
        const list = response?.data?.Registered_Generators_List || [];
        setData(list);
        const filtered = list.filter(
          (item) => item?.status_name === "Approved & Active",
        );
        setFilteredData(filtered);
      } else {
        setData([]);
        setFilteredData([]);
      }
    } catch (error) {
      console.log("Generator API Error:", error);
      setData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  const HandleReceiverClick = async () => {
    try {
      setLoading(true);
      setActiveTab("receiver");
      const response = await commonAPICall(
        LISTALLRECEIVERS + "stateId=0",
        {},
        "get",
        dispatch,
      );
      if (response?.status === 200) {
        const list = response?.data?.Registered_Receivers_List || [];
        setData(list);
        const filtered = list.filter(
          (item) => item?.status_name === "Approved & Active",
        );
        setFilteredData(filtered);
      } else {
        setData([]);
        setFilteredData([]);
      }
    } catch (error) {
      console.log("Receiver API Error:", error);
      setData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (item) => {
    setSelectedData(item);
    setIsViewMode(true);
    setShowForm(false);
    setShowStatusModal(false);
  };

  const handleEdit = (item) => {
    setSelectedData(item);
    setIsViewMode(false);
    setShowForm(true);
  };

  const handleBack = () => {
    setShowForm(false);
    setIsViewMode(true);
    setSelectedData(null);
    setShowStatusModal(false);
  };

  const handlePhonePress = (phoneNumber) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  const handleEmailPress = (email) => {
    if (email) {
      Linking.openURL(`mailto:${email}`);
    }
  };

  const handleStatusUpdate = async (values) => {
    try {
      setSubmitting(true);

      const payload = {
        industryType: selectedData?.industry_type_id,
        industryName: selectedData?.industry_name,
        gstNumber: selectedData?.gst_number,
        authorizedPerson: selectedData?.authorized_person,
        authorizedPersonEmail: selectedData?.authorized_person_email,
        authorizedPersonMobileNo: selectedData?.authorized_person_mobile,
        registrationCode: selectedData?.registrationcode,
        status: values.status,
        remarks: values.remarks || "",
      };

      console.log("Status update payload:", payload);

      // Call your API here
      // const response = await commonAPICall(
      //   UPDATE_REGISTRATION_STATUS,
      //   payload,
      //   "post",
      //   dispatch
      // );

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      Alert.alert(
        "Success",
        `Registration ${values.status === "1" ? "approved" : values.status === "2" ? "followed up" : "rejected"} successfully`,
      );

      setShowStatusModal(false);
      setStatusAction("");
      setRemarks("");
      statusFormik.resetForm();
      GetData();
    } catch (error) {
      console.log("Status update error:", error);
      Alert.alert("Error", "Failed to update status");
    } finally {
      setSubmitting(false);
    }
  };

  const openStatusModal = (action) => {
    setStatusAction(action);
    statusFormik.setFieldValue("status", action);
    setShowStatusModal(true);
  };

  const getStatusConfig = (status) => {
    const statusUpper = status?.toUpperCase() || "";
    switch (statusUpper) {
      case "APPROVED & ACTIVE":
        return {
          icon: "checkmark-circle",
          color: "#28a745",
          bgColor: "#d4edda",
          label: "Approved & Active",
          statusId: 1,
        };
      case "REGISTERED & PENDING":
        return {
          icon: "time-outline",
          color: "#ffc107",
          bgColor: "#fff3cd",
          label: "Registered & Pending",
          statusId: 2,
        };
      case "REJECTED":
        return {
          icon: "close-circle",
          color: "#dc3545",
          bgColor: "#f8d7da",
          label: "Rejected",
          statusId: 3,
        };
      case "FOLLOW UP":
        return {
          icon: "refresh-outline",
          color: "#17a2b8",
          bgColor: "#d1ecf1",
          label: "Follow Up",
          statusId: 4,
        };
      default:
        return {
          icon: "information-circle",
          color: "#17a2b8",
          bgColor: "#d1ecf1",
          label: status || "Unknown",
          statusId: 0,
        };
    }
  };

  const renderWasteDetails = () => {
    if (!selectedData?.waste_details) return null;

    let wasteData;
    try {
      wasteData =
        typeof selectedData.waste_details === "string"
          ? JSON.parse(selectedData.waste_details)
          : selectedData.waste_details;
    } catch (e) {
      return null;
    }

    return (
      <View style={styles.wasteTable}>
        <View style={styles.wasteHeader}>
          <Text
            style={[styles.wasteCell, styles.wasteHeaderText, { flex: 0.5 }]}
          >
            S.No
          </Text>
          <Text style={[styles.wasteCell, styles.wasteHeaderText, { flex: 2 }]}>
            Waste Type
          </Text>
          <Text
            style={[styles.wasteCell, styles.wasteHeaderText, { flex: 1.5 }]}
          >
            Permitted Qty
          </Text>
        </View>
        {wasteData?.map((item, index) => (
          <View key={index} style={styles.wasteRow}>
            <Text style={[styles.wasteCell, { flex: 0.5 }]}>{index + 1}</Text>
            <Text style={[styles.wasteCell, { flex: 2 }]}>
              {item?.wasteType}
            </Text>
            <Text style={[styles.wasteCell, { flex: 1.5 }]}>
              {item?.permittedQuantity}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderStatusSection = () => {
    const statusConfig = getStatusConfig(selectedData?.status_name);
    const isPending =
      selectedData?.status_name === "Registered & Pending" ||
      selectedData?.status_name === "Follow Up";

    return (
      <View style={styles.statusSection}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Current Status:</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusConfig.bgColor },
            ]}
          >
            <Icon
              name={statusConfig.icon}
              size={14}
              color={statusConfig.color}
            />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {selectedData?.status_name}
            </Text>
          </View>
        </View>

        {isPending && (
          <View style={styles.statusUpdateContainer}>
            <Text style={styles.statusUpdateLabel}>Update Status:</Text>
            <View style={styles.statusButtonRow}>
              <TouchableOpacity
                style={[styles.statusActionButton, styles.approveButton]}
                onPress={() => openStatusModal("1")}
                disabled={submitting}
              >
                <Icon name="checkmark-circle-outline" size={18} color="#fff" />
                <Text style={styles.statusActionButtonText}>Approve</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusActionButton, styles.followupButton]}
                onPress={() => openStatusModal("2")}
                disabled={submitting}
              >
                <Icon name="refresh-outline" size={18} color="#fff" />
                <Text style={styles.statusActionButtonText}>Follow Up</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.statusActionButton, styles.rejectButton]}
                onPress={() => openStatusModal("3")}
                disabled={submitting}
              >
                <Icon name="close-circle-outline" size={18} color="#fff" />
                <Text style={styles.statusActionButtonText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {selectedData?.status_name === "Follow Up" &&
          selectedData?.status_remarks && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Remarks:</Text>
              <Text style={styles.detailValue}>
                {selectedData?.status_remarks}
              </Text>
            </View>
          )}

        {selectedData?.status_name === "Approved & Active" && (
          <>
            {selectedData?.status_approved_user_id && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Approved By:</Text>
                <Text style={styles.detailValue}>
                  {selectedData?.status_approved_user_id}
                </Text>
              </View>
            )}
            {selectedData?.status_approved_date && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Approved Date:</Text>
                <Text style={styles.detailValue}>
                  {selectedData?.status_approved_date}
                </Text>
              </View>
            )}
          </>
        )}

        {selectedData?.status_name === "Rejected" && (
          <>
            {selectedData?.status_remarks && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Remarks:</Text>
                <Text style={styles.detailValue}>
                  {selectedData?.status_remarks}
                </Text>
              </View>
            )}
            {selectedData?.status_approved_user_id && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Rejected By:</Text>
                <Text style={styles.detailValue}>
                  {selectedData?.status_approved_user_id}
                </Text>
              </View>
            )}
            {selectedData?.status_approved_date && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Rejection Date:</Text>
                <Text style={styles.detailValue}>
                  {selectedData?.status_approved_date}
                </Text>
              </View>
            )}
            {selectedData?.rejection_reason && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Rejection Reason:</Text>
                <Text style={styles.detailValue}>
                  {selectedData?.rejection_reason}
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    );
  };

  const renderDetailView = () => {
    const isGeneratorMode = activeTab === "generator";

    return (
      <ScrollView style={styles.detailContainer}>
        <View style={styles.backHeader}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Icon name="arrow-back" size={20} color="#2d6386" />
            <Text style={styles.backButtonText}>Back to list</Text>
          </TouchableOpacity>
          <Text style={styles.detailTitle}>
            {isGeneratorMode ? "Generator Details" : "Receiver Details"}
          </Text>
          {/* <TouchableOpacity
            style={styles.editIconButton}
            onPress={() => handleEdit(selectedData)}
          >
            <Icon name="create-outline" size={22} color="#2e7d32" />
          </TouchableOpacity> */}
        </View>

        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Industry Name:</Text>
            <Text style={styles.detailValue}>
              {selectedData?.industry_name}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>
              {selectedData?.dist_name}, {selectedData?.state_name}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Authorized Person:</Text>
            <Text style={styles.detailValue}>
              {selectedData?.authorized_person}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Mobile:</Text>
            <TouchableOpacity
              onPress={() =>
                handlePhonePress(selectedData?.authorized_person_mobile)
              }
            >
              <Text style={[styles.detailValue, styles.contactLink]}>
                {selectedData?.authorized_person_mobile}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email:</Text>
            <TouchableOpacity
              onPress={() =>
                handleEmailPress(selectedData?.authorized_person_email)
              }
            >
              <Text style={[styles.detailValue, styles.contactLink]}>
                {selectedData?.authorized_person_email}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Address:</Text>
            <Text style={styles.detailValue}>
              {selectedData?.industry_location_address}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pincode:</Text>
            <Text style={styles.detailValue}>{selectedData?.pin_code}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Correspondence Address:</Text>
            <Text style={styles.detailValue}>
              {selectedData?.correspondence_address}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Latitude & Longitude:</Text>
            <Text style={styles.detailValue}>
              {selectedData?.latitude} & {selectedData?.longitude}
            </Text>
          </View>

          {!isGeneratorMode && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>CETP:</Text>
              <Text style={styles.detailValue}>
                {selectedData?.is_cetp_industry ? "Yes" : "No"}
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Marine Industry:</Text>
            <Text style={styles.detailValue}>
              {selectedData?.is_marine_industry ? "Yes" : "No"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>SEZ Industry:</Text>
            <Text style={styles.detailValue}>
              {selectedData?.is_sez_industry ? "Yes" : "No"}
            </Text>
          </View>

          {isGeneratorMode ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category:</Text>
              <Text style={styles.detailValue}>
                {selectedData?.category_name}
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Receiver Type:</Text>
                <Text style={styles.detailValue}>
                  {selectedData?.receiver_type_name}
                </Text>
              </View>
              {selectedData?.receiver_type === 5 &&
                selectedData?.sub_receiver_type_name && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Sub Receiver Type:</Text>
                    <Text style={styles.detailValue}>
                      {selectedData?.sub_receiver_type_name}
                    </Text>
                  </View>
                )}
              {renderWasteDetails()}
            </>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>GST Number:</Text>
            <Text style={styles.detailValue}>{selectedData?.gst_number}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>GST Document:</Text>
            {isImageUrl(selectedData?.gst_upload) ? (
              <TouchableOpacity
                onPress={() =>
                  viewImage(selectedData?.gst_upload, "GST Attachment")
                }
              >
                <Text style={[styles.detailValue, styles.linkText]}>View</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  if (selectedData?.gst_upload) {
                    downloadFile(selectedData.gst_upload);
                  }
                }}
              >
                {/* <Icon name="download-outline" size={20} color="#fff" /> */}
                <Text style={[styles.detailValue, styles.linkText]}>
                  Download
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>CTO Order Number:</Text>
            <Text style={styles.detailValue}>
              {selectedData?.cto_order_number}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>CTO Issue Date:</Text>
            <Text style={styles.detailValue}>
              {selectedData?.cto_issue_date}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>CTO Expiry Date:</Text>
            <Text style={styles.detailValue}>
              {selectedData?.cto_expiry_date}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>CTO Document:</Text>
            {isImageUrl(selectedData?.cto_attachment) ? (
              <TouchableOpacity
                onPress={() =>
                  viewImage(selectedData?.cto_attachment, "CTO Attachment")
                }
              >
                <Text style={[styles.detailValue, styles.linkText]}>View</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  if (selectedData?.cto_attachment) {
                    downloadFile(selectedData.cto_attachment);
                  }
                }}
              >
                {/* <Icon name="download-outline" size={20} color="#fff" /> */}
                <Text style={[styles.detailValue, styles.linkText]}>
                  Download
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <CommonImageViewer
            visible={imageModalVisible}
            imageUrl={selectedImage}
            title={selectedImageTitle}
            onClose={onClose}
          />
          {isGeneratorMode && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Line Of Activity:</Text>
              <Text style={styles.detailValue}>
                {selectedData?.line_of_activity_name}
              </Text>
            </View>
          )}

          {renderStatusSection()}
        </View>

        {/* Status Update Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showStatusModal}
          onRequestClose={() => {
            setShowStatusModal(false);
            statusFormik.resetForm();
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <Icon
                    name={
                      statusAction === "1"
                        ? "checkmark-circle-outline"
                        : statusAction === "2"
                          ? "refresh-outline"
                          : "close-circle-outline"
                    }
                    size={24}
                    color={
                      statusAction === "1"
                        ? "#28a745"
                        : statusAction === "2"
                          ? "#17a2b8"
                          : "#dc3545"
                    }
                  />
                  <Text style={styles.modalTitle}>
                    {statusAction === "1"
                      ? "Approve Registration"
                      : statusAction === "2"
                        ? "Follow Up"
                        : "Reject Registration"}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setShowStatusModal(false);
                    statusFormik.resetForm();
                  }}
                  disabled={submitting}
                >
                  <Icon name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={styles.modalLabel}>
                  {statusAction === "1"
                    ? "Are you sure you want to approve this registration?"
                    : statusAction === "2"
                      ? "Add follow up remarks:"
                      : "Are you sure you want to reject this registration?"}
                </Text>

                {(statusAction === "2" || statusAction === "3") && (
                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>
                      Remarks <Text style={styles.star}>*</Text>
                    </Text>
                    <TextInput
                      style={[
                        styles.modalTextArea,
                        statusFormik.errors.remarks &&
                          statusFormik.touched.remarks &&
                          styles.inputError,
                      ]}
                      value={statusFormik.values.remarks}
                      onChangeText={statusFormik.handleChange("remarks")}
                      onBlur={statusFormik.handleBlur("remarks")}
                      placeholder={
                        statusAction === "2"
                          ? "Enter follow up remarks..."
                          : "Enter rejection reason..."
                      }
                      placeholderTextColor="#999"
                      multiline={true}
                      numberOfLines={4}
                      editable={!submitting}
                    />
                    {statusFormik.errors.remarks &&
                      statusFormik.touched.remarks && (
                        <Text style={styles.errorText}>
                          {statusFormik.errors.remarks}
                        </Text>
                      )}
                  </View>
                )}

                {statusAction === "1" && (
                  <View style={styles.confirmMessage}>
                    <Icon name="warning-outline" size={24} color="#ffc107" />
                    <Text style={styles.confirmText}>
                      This action will approve the registration and make it
                      active.
                    </Text>
                  </View>
                )}

                {statusAction === "3" && (
                  <View style={styles.confirmMessage}>
                    <Icon name="warning-outline" size={24} color="#dc3545" />
                    <Text style={[styles.confirmText, { color: "#dc3545" }]}>
                      This action will reject the registration. This cannot be
                      undone.
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.footerButton, styles.cancelButton]}
                  onPress={() => {
                    setShowStatusModal(false);
                    statusFormik.resetForm();
                  }}
                  disabled={submitting}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.footerButton,
                    statusAction === "1"
                      ? styles.approveButton
                      : statusAction === "2"
                        ? styles.followupButton
                        : styles.rejectButton,
                  ]}
                  onPress={statusFormik.handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {statusAction === "1"
                        ? "Approve"
                        : statusAction === "2"
                          ? "Submit"
                          : "Reject"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    );
  };

  const renderCard = ({ item, index }) => {
    const statusConfig = getStatusConfig(item?.status_name);

    return (
      <TouchableOpacity
        style={styles.cardItem}
        onPress={() => handleView(item)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View style={styles.serialNumber}>
              <Text style={styles.serialText}>#{index + 1}</Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusConfig.bgColor },
            ]}
          >
            <Icon
              name={statusConfig.icon}
              size={14}
              color={statusConfig.color}
            />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Icon name="business-outline" size={16} color="#1e3a5f" />
            <Text style={styles.companyName}>
              {item?.industry_name || "N/A"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Icon name="location-outline" size={16} color="#666" />
            <Text style={styles.infoLabel}>District:</Text>
            <Text style={styles.infoValue}>
              {item?.district_name || item?.dist_name || "N/A"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Icon name="document-text-outline" size={16} color="#666" />
            <Text style={styles.infoLabel}>Reg No:</Text>
            <Text style={styles.infoValue}>
              {item?.registrationcode || "N/A"}
            </Text>
          </View>

          <View style={styles.contactRow}>
            <Icon name="call-outline" size={14} color="#666" />
            <Text style={styles.contactText}>
              {item?.authorized_person_mobile || "N/A"}
            </Text>
            <Icon
              name="mail-outline"
              size={14}
              color="#666"
              style={styles.emailIcon}
            />
            <Text style={styles.contactText}>
              {item?.authorized_person_email || "N/A"}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <TouchableOpacity
            style={[styles.actionButton, styles.viewButton]}
            onPress={() => handleView(item)}
          >
            <Icon name="eye-outline" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>View</Text>
          </TouchableOpacity>

          {/* <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEdit(item)}
          >
            <Icon name="create-outline" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity> */}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="people-outline" size={60} color="#ccc" />
      <Text style={styles.emptyText}>
        No {activeTab === "generator" ? "Generators" : "Receivers"} Found
      </Text>
    </View>
  );

  useEffect(() => {
    GetData();
  }, []);

  if (selectedData && !showForm) {
    return renderDetailView();
  }

  if (showForm) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <View style={styles.backHeader}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Icon name="arrow-back" size={20} color="#2d6386" />
              <Text style={styles.backButtonText}>Back to list</Text>
            </TouchableOpacity>
            <Text style={styles.detailTitle}>
              {activeTab === "generator" ? "Edit Generator" : "Edit Receiver"}
            </Text>
          </View>
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Edit Form</Text>
            <Text style={styles.formPlaceholder}>
              Form fields would be rendered here
            </Text>
            <Text style={styles.formNote}>
              This is a placeholder for the edit form
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "generator" && styles.activeTabButton,
          ]}
          onPress={HandleGeneratorClick}
          disabled={loading}
        >
          <Icon
            name="flash-outline"
            size={20}
            color={activeTab === "generator" ? "#fff" : "#2e7d32"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "generator" && styles.activeTabText,
            ]}
          >
            Generators
          </Text>
          {activeTab === "generator" && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{data.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "receiver" && styles.activeTabButton,
          ]}
          onPress={HandleReceiverClick}
          disabled={loading}
        >
          <Icon
            name="download-outline"
            size={20}
            color={activeTab === "receiver" ? "#fff" : "#2e7d32"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "receiver" && styles.activeTabText,
            ]}
          >
            Receivers
          </Text>
          {activeTab === "receiver" && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{data.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2e7d32" />
          <Text style={styles.loadingText}>
            Loading {activeTab === "generator" ? "Generators" : "Receivers"}...
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, index) =>
            (activeTab === "generator"
              ? item?.generatorId || item?.id
              : item?.receiverId || item?.id
            )?.toString() || index.toString()
          }
          renderItem={renderCard}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
          onRefresh={() => {
            if (activeTab === "generator") {
              HandleGeneratorClick();
            } else {
              HandleReceiverClick();
            }
          }}
          refreshing={loading}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: "#e8f5e9",
    position: "relative",
  },
  activeTabButton: {
    backgroundColor: "#2e7d32",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2e7d32",
    marginLeft: 6,
  },
  activeTabText: {
    color: "#fff",
  },
  tabBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  tabBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  cardItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e8ecf1",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  serialNumber: {
    backgroundColor: "#2e7d32",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  serialText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  cardBody: {
    padding: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: "#666",
    marginLeft: 6,
    width: 70,
  },
  infoValue: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
    flex: 1,
  },
  companyName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e3a5f",
    marginLeft: 6,
    flex: 1,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    flexWrap: "wrap",
  },
  contactText: {
    fontSize: 12,
    color: "#555",
    marginLeft: 4,
  },
  emailIcon: {
    marginLeft: 12,
  },
  cardFooter: {
    flexDirection: "row",
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: "#e8ecf1",
    backgroundColor: "#fafbfc",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  viewButton: {
    backgroundColor: "#2e7d32",
  },
  editButton: {
    backgroundColor: "#43a047",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 14,
  },
  emptyContainer: {
    padding: 60,
    alignItems: "center",
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },

  // Detail View Styles
  detailContainer: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  backHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
  },
  backButtonText: {
    color: "#2d6386",
    fontSize: 13,
    marginLeft: 4,
    fontWeight: "500",
  },
  detailTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d6386",
  },
  detailCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    margin: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  detailRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    alignItems: "flex-start",
  },
  detailLabel: {
    width: 120,
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    color: "#555",
  },
  contactLink: {
    color: "#2d6386",
    textDecorationLine: "underline",
  },
  linkText: {
    color: "#2d6386",
    textDecorationLine: "underline",
    fontSize: 14,
  },

  // Waste Table Styles
  wasteTable: {
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
    width: "100%",
  },
  wasteHeader: {
    flexDirection: "row",
    backgroundColor: "#d8ece8",
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  wasteRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  wasteCell: {
    fontSize: 12,
    paddingHorizontal: 4,
    color: "#333",
  },
  wasteHeaderText: {
    fontWeight: "600",
    color: "#333",
    fontSize: 12,
  },

  // Form Styles
  formContainer: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    margin: 16,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e3a5f",
    marginBottom: 20,
    textAlign: "center",
  },
  formSection: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  star: {
    color: "red",
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#fff",
    color: "#333",
  },
  formTextArea: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#fff",
    color: "#333",
    minHeight: 80,
    textAlignVertical: "top",
  },
  formPicker: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  formError: {
    color: "#dc3545",
    fontSize: 12,
    marginTop: 4,
  },
  radioGroup: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  radioLabel: {
    fontSize: 14,
    color: "#333",
    marginLeft: 4,
  },
  fileInput: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#fff",
    color: "#333",
  },
  fileNote: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  bold: {
    fontWeight: "bold",
  },
  updateButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  updateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  addWasteButton: {
    backgroundColor: "#43a047",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: "flex-end",
    marginTop: 8,
  },
  addWasteButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  removeButton: {
    backgroundColor: "#dc3545",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignItems: "center",
  },
  removeButtonText: {
    color: "#fff",
    fontSize: 12,
  },
  actionButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e8ecf1",
  },

  // View Attachment Styles
  attachmentContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  attachmentLink: {
    color: "#2d6386",
    textDecorationLine: "underline",
    fontSize: 13,
    marginLeft: 4,
  },
  attachmentImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginTop: 4,
  },

  // Status Section Styles
  statusSection: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e8ecf1",
    paddingTop: 12,
  },
  statusUpdateContainer: {
    marginTop: 8,
  },
  statusUpdateLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  statusButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  statusActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  approveButton: {
    backgroundColor: "#28a745",
  },
  followupButton: {
    backgroundColor: "#17a2b8",
  },
  rejectButton: {
    backgroundColor: "#dc3545",
  },
  statusActionButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 4,
  },
  editIconButton: {
    padding: 6,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e3a5f",
    marginLeft: 10,
  },
  modalBody: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  modalField: {
    marginTop: 12,
  },
  modalTextArea: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#f8fafc",
    color: "#333",
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: "#f8fafc",
  },
  inputError: {
    borderColor: "#dc3545",
    borderWidth: 2,
  },
  errorText: {
    color: "#dc3545",
    fontSize: 12,
    marginTop: 4,
  },
  confirmMessage: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3cd",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  confirmText: {
    fontSize: 14,
    color: "#856404",
    marginLeft: 8,
    flex: 1,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#e8ecf1",
    paddingTop: 16,
  },
  footerButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: "#6c757d",
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "500",
  },

  // Responsive/Utility Styles
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  col6: {
    width: "50%",
    paddingHorizontal: 4,
  },
  col12: {
    width: "100%",
    paddingHorizontal: 4,
  },
  mt1: {
    marginTop: 4,
  },
  mt2: {
    marginTop: 8,
  },
  mt3: {
    marginTop: 16,
  },
  mb1: {
    marginBottom: 4,
  },
  mb2: {
    marginBottom: 8,
  },
  mb3: {
    marginBottom: 16,
  },
  dFlex: {
    flexDirection: "row",
    alignItems: "center",
  },
  justifyContentEnd: {
    justifyContent: "flex-end",
  },
  alignItemsCenter: {
    alignItems: "center",
  },
  gap2: {
    gap: 8,
  },
  gap3: {
    gap: 16,
  },
  p2: {
    padding: 8,
  },
  p3: {
    padding: 16,
  },
  textCenter: {
    textAlign: "center",
  },
  textDanger: {
    color: "#dc3545",
  },

  // Additional Status Display Styles
  currentStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    flexWrap: "wrap",
  },
  currentStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  currentStatusText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
  },
  blockButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#dc3545",
  },
  unblockButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#28a745",
  },
  blockButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
  },

  // Disabled state
  disabledButton: {
    opacity: 0.6,
  },
});

export default OpenRegistrations;
