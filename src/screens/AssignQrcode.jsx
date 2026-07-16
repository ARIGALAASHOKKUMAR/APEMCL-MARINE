import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Image,
  Linking,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import moment from 'moment';
import Icon from 'react-native-vector-icons/Ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  ASSIGNDUTYTEAMLEADER,
  COLLECTSAMPLEANDSENDTOLAB,
  commonAPICall,
  CONTEXT_HEADING,
  MARINEDISCHARGEDETAILS,
  UPDATEASSIGNDUTY,
} from '../utils/utils';
import ImageBucketRN from '../utils/ImageBucketRN';

const SampleCollectionRequests = () => {
  const dispatch = useDispatch();
  const state = useSelector((state) => state.LoginReducer);
  const { roleId } = state;
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [updateModal, setUpdateModal] = useState(false);
  const [sampleModal, setSampleModal] = useState(false);
  const [qrModal, setQrModal] = useState(false);
  const [rowData, setRowData] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showUpdateDatePicker, setShowUpdateDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [tempUpdateDate, setTempUpdateDate] = useState(new Date());

  console.log("renderCardrenderCard",data);
  

  // Validation Schemas
  const validationSchema = Yup.object({
    assignedTeamLeaderId: Yup.string().required('required'),
    assignedDate: Yup.string().required('required'),
  });

  const updateValidationSchema = Yup.object({
    assignedTeamLeaderId: Yup.string().required('required'),
    assignedDate: Yup.string().required('required'),
  });

  const sampleValidationSchema = Yup.object({
    inletSealImage: Yup.string().required('required'),
    levelMeterImage: Yup.string().required('required'),
    sampleCollectionRemarks: Yup.string().required('required'),
  });

  // Formik instances
  const formik = useFormik({
    initialValues: {
      assignedTeamLeaderId: '',
      assignedDate: '',
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      HandleSubmit(values);
    },
  });

  const updateFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      assignedTeamLeaderId: rowData?.sample_collection_team_leader_id || '',
      assignedDate: rowData?.sample_collection_assigned_date
        ? moment(rowData.sample_collection_assigned_date, "DD-MM-YYYY").format("YYYY-MM-DD")
        : '',
    },
    validationSchema: updateValidationSchema,
    onSubmit: (values) => {
      HandleUpdateSubmit(values);
    },
  });

  const sampleFormik = useFormik({
    initialValues: {
      inletSealImage: null,
      levelMeterImage: null,
      sampleCollectionRemarks: '',
      sampleQrCode: '',
    },
    validationSchema: sampleValidationSchema,
    onSubmit: (values) => {
      HandleSampleSubmit(values);
    },
  });

  // API Calls
  const HandleSubmit = async (values) => {
    try {
      setLoading(true);
      const payload = {
        postingId: rowData.posting_id,
        assignedTeamLeaderId: values.assignedTeamLeaderId,
        assignedDate: values.assignedDate,
        assignmentRemarks: 'Assigned for sample collection at Marine Discharge Point.',
      };
      const res = await commonAPICall(ASSIGNDUTYTEAMLEADER, payload, 'post', dispatch);
      if (res.status === 200) {
        setShowModal(false);
        GetData();
        formik.resetForm();
        Alert.alert('Success', 'Duty assigned successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to assign duty');
    } finally {
      setLoading(false);
    }
  };

  const HandleUpdateSubmit = async (values) => {
    try {
      setLoading(true);
      const payload = {
        postingId: rowData.posting_id,
        assignedTeamLeaderId: values.assignedTeamLeaderId,
        assignedDate: values.assignedDate,
        assignmentRemarks: 'Team Leader changed due to unavailability of previously assigned officer.',
      };
      const res = await commonAPICall(UPDATEASSIGNDUTY, payload, 'post', dispatch);
      if (res.status === 200) {
        setUpdateModal(false);
        GetData();
        updateFormik.resetForm();
        Alert.alert('Success', 'Duty updated successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update duty');
    } finally {
      setLoading(false);
    }
  };

  const HandleSampleSubmit = async (values) => {
    try {
      setLoading(true);
      const payload = {
        postingId: rowData.posting_id,
        inletSealImage: values.inletSealImage,
        levelMeterImage: values.levelMeterImage,
        sampleCollectionRemarks: values.sampleCollectionRemarks,
        sampleQrCode: values.sampleQrCode || "QR059",
      };
      const res = await commonAPICall(COLLECTSAMPLEANDSENDTOLAB, payload, 'post', dispatch);
      if (res.status === 200) {
        setSampleModal(false);
        GetData();
        sampleFormik.resetForm();
        Alert.alert('Success', 'Sample submitted successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit sample');
    } finally {
      setLoading(false);
    }
  };

  const GetData = async () => {
    try {
      setLoading(true);
      const res = await commonAPICall(MARINEDISCHARGEDETAILS, {}, 'get', dispatch);
      if (res.status === 200) {
        setData(res.data.MarineDischargePostingDetails);
        
      } else {
        setData([]);
      }
    } catch (error) {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // QR Code Scanning
  const handleBarCodeScanned = ({ data }) => {
    if (!scanning) return;
    
    setScanning(false);
    setQrModal(false);
    
    if (data) {
      sampleFormik.setFieldValue('sampleQrCode', data);
      Alert.alert('QR Code Scanned', `QR Code: ${data}`);
      
      if (!sampleModal) {
        setSampleModal(true);
      }
    }
  };

  const openScanner = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Permission Required', 'Camera permission is needed to scan QR codes');
        return;
      }
    }
    setScanning(true);
    setQrModal(true);
  };

  const closeScanner = () => {
    setScanning(false);
    setQrModal(false);
  };

  // Handle Date Change
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || tempDate;
    setShowDatePicker(Platform.OS === 'ios');
    setTempDate(currentDate);
    const formattedDate = currentDate.toISOString().split('T')[0];
    formik.setFieldValue('assignedDate', formattedDate);
  };

  const onUpdateDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || tempUpdateDate;
    setShowUpdateDatePicker(Platform.OS === 'ios');
    setTempUpdateDate(currentDate);
    const formattedDate = currentDate.toISOString().split('T')[0];
    updateFormik.setFieldValue('assignedDate', formattedDate);
  };

  useEffect(() => {
    GetData();
  }, []);

  // Render Assign Duty Modal
  const renderAssignDutyModal = () => (
    <Modal
      visible={showModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Assign Duty</Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <ScrollView>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Team Leader <Text style={styles.star}>*</Text></Text>
              <View style={[
                styles.pickerWrapper,
                formik.errors.assignedTeamLeaderId && formik.touched.assignedTeamLeaderId && styles.inputError
              ]}>
                <Picker
                  selectedValue={formik.values.assignedTeamLeaderId}
                  onValueChange={(itemValue) => {
                    formik.setFieldValue('assignedTeamLeaderId', itemValue);
                    formik.setFieldTouched('assignedTeamLeaderId', true);
                  }}
                  style={styles.picker}
                  dropdownIconColor="#666"
                >
                  <Picker.Item label="Select Team Leader" value="" />
                  <Picker.Item label="TEAML" value="TEAML" />
                </Picker>
              </View>
              {formik.errors.assignedTeamLeaderId && formik.touched.assignedTeamLeaderId && (
                <Text style={styles.errorText}>{formik.errors.assignedTeamLeaderId}</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Assigning Date <Text style={styles.star}>*</Text></Text>
              <TouchableOpacity
                style={[
                  styles.dateInputWrapper,
                  formik.errors.assignedDate && formik.touched.assignedDate && styles.inputError,
                ]}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dateInputText,
                  !formik.values.assignedDate && styles.datePlaceholder
                ]}>
                  {formik.values.assignedDate || 'YYYY-MM-DD'}
                </Text>
                <Icon name="calendar-outline" size={22} color="#666" />
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                  minimumDate={new Date()}
                />
              )}
              
              {formik.errors.assignedDate && formik.touched.assignedDate && (
                <Text style={styles.errorText}>{formik.errors.assignedDate}</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={formik.handleSubmit}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Render Update Duty Modal
  const renderUpdateDutyModal = () => (
    <Modal
      visible={updateModal}
      transparent
      animationType="slide"
      onRequestClose={() => setUpdateModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Update Duty</Text>
            <TouchableOpacity onPress={() => setUpdateModal(false)}>
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <ScrollView>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Team Leader <Text style={styles.star}>*</Text></Text>
              <View style={[
                styles.pickerWrapper,
                updateFormik.errors.assignedTeamLeaderId && updateFormik.touched.assignedTeamLeaderId && styles.inputError
              ]}>
                <Picker
                  selectedValue={updateFormik.values.assignedTeamLeaderId}
                  onValueChange={(itemValue) => {
                    updateFormik.setFieldValue('assignedTeamLeaderId', itemValue);
                    updateFormik.setFieldTouched('assignedTeamLeaderId', true);
                  }}
                  style={styles.picker}
                  dropdownIconColor="#666"
                >
                  <Picker.Item label="Select Team Leader" value="" />
                  <Picker.Item label="TEAML" value="TEAML" />
                </Picker>
              </View>
              {updateFormik.errors.assignedTeamLeaderId && updateFormik.touched.assignedTeamLeaderId && (
                <Text style={styles.errorText}>{updateFormik.errors.assignedTeamLeaderId}</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Assigning Date <Text style={styles.star}>*</Text></Text>
              <TouchableOpacity
                style={[
                  styles.dateInputWrapper,
                  updateFormik.errors.assignedDate && updateFormik.touched.assignedDate && styles.inputError,
                ]}
                onPress={() => setShowUpdateDatePicker(true)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dateInputText,
                  !updateFormik.values.assignedDate && styles.datePlaceholder
                ]}>
                  {updateFormik.values.assignedDate || 'YYYY-MM-DD'}
                </Text>
                <Icon name="calendar-outline" size={22} color="#666" />
              </TouchableOpacity>
              
              {showUpdateDatePicker && (
                <DateTimePicker
                  value={tempUpdateDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onUpdateDateChange}
                  maximumDate={new Date()}
                />
              )}
              
              {updateFormik.errors.assignedDate && updateFormik.touched.assignedDate && (
                <Text style={styles.errorText}>{updateFormik.errors.assignedDate}</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={updateFormik.handleSubmit}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Render Sample Collection Modal
  const renderSampleCollectionModal = () => (
    <Modal
      visible={sampleModal}
      transparent
      animationType="slide"
      onRequestClose={() => setSampleModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: '90%' }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sample Collection</Text>
            <TouchableOpacity onPress={() => setSampleModal(false)}>
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Inlet Seal Image <Text style={styles.star}>*</Text></Text>
              <TouchableOpacity
                style={[
                  styles.uploadButton,
                  sampleFormik.errors.inletSealImage && sampleFormik.touched.inletSealImage && styles.inputError
                ]}
                onPress={() => {
                  const path = "APEMCL/MARINE/";
                  ImageBucketRN(
                    sampleFormik,
                    path,
                    "inletSealImage",
                    20971520,
                    "all",
                    dispatch
                  );
                }}
              >
                <Text style={styles.uploadButtonText}>Upload Inlet Seal Image</Text>
              </TouchableOpacity>
              {sampleFormik.values.inletSealImage && (
                <View style={styles.filePreview}>
                  {sampleFormik.values.inletSealImage.match(/\.(jpg|jpeg|png)$/i) ? (
                    <Image
                      source={{ uri: sampleFormik.values.inletSealImage }}
                      style={styles.imagePreview}
                    />
                  ) : sampleFormik.values.inletSealImage.match(/\.pdf$/i) ? (
                    <TouchableOpacity
                      style={styles.pdfPreview}
                      onPress={() => Linking.openURL(sampleFormik.values.inletSealImage)}
                    >
                      <Icon name="document-text-outline" size={24} color="red" />
                      <Text style={styles.pdfText}>Download PDF</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.fileNameText}>{sampleFormik.values.inletSealImage}</Text>
                  )}
                </View>
              )}
              {sampleFormik.errors.inletSealImage && sampleFormik.touched.inletSealImage && (
                <Text style={styles.errorText}>{sampleFormik.errors.inletSealImage}</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Level Meter Image <Text style={styles.star}>*</Text></Text>
              <TouchableOpacity
                style={[
                  styles.uploadButton,
                  sampleFormik.errors.levelMeterImage && sampleFormik.touched.levelMeterImage && styles.inputError
                ]}
                onPress={() => {
                  const path = "APEMCL/MARINE/";
                  ImageBucketRN(
                    sampleFormik,
                    path,
                    "levelMeterImage",
                    20971520,
                    "all",
                    dispatch
                  );
                }}
              >
                <Text style={styles.uploadButtonText}>Upload Level Meter Image</Text>
              </TouchableOpacity>
              {sampleFormik.values.levelMeterImage && (
                <View style={styles.filePreview}>
                  {sampleFormik.values.levelMeterImage.match(/\.(jpg|jpeg|png)$/i) ? (
                    <Image
                      source={{ uri: sampleFormik.values.levelMeterImage }}
                      style={styles.imagePreview}
                    />
                  ) : sampleFormik.values.levelMeterImage.match(/\.pdf$/i) ? (
                    <TouchableOpacity
                      style={styles.pdfPreview}
                      onPress={() => Linking.openURL(sampleFormik.values.levelMeterImage)}
                    >
                      <Icon name="document-text-outline" size={24} color="red" />
                      <Text style={styles.pdfText}>Download PDF</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.fileNameText}>{sampleFormik.values.levelMeterImage}</Text>
                  )}
                </View>
              )}
              {sampleFormik.errors.levelMeterImage && sampleFormik.touched.levelMeterImage && (
                <Text style={styles.errorText}>{sampleFormik.errors.levelMeterImage}</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>QR Code</Text>
              <TouchableOpacity
                style={styles.qrButton}
                onPress={openScanner}
              >
                <Icon name="qr-code-outline" size={24} color="#fff" />
                <Text style={styles.qrButtonText}>Scan QR Code</Text>
              </TouchableOpacity>
              {sampleFormik.values.sampleQrCode && (
                <View style={styles.qrPreview}>
                  <Icon name="checkmark-circle" size={20} color="green" />
                  <Text style={styles.qrCodeText}>QR Code: {sampleFormik.values.sampleQrCode}</Text>
                </View>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Remarks <Text style={styles.star}>*</Text></Text>
              <TextInput
                style={[
                  styles.textArea,
                  sampleFormik.errors.sampleCollectionRemarks && sampleFormik.touched.sampleCollectionRemarks && styles.inputError
                ]}
                placeholder="Enter remarks"
                multiline
                numberOfLines={4}
                value={sampleFormik.values.sampleCollectionRemarks}
                onChangeText={sampleFormik.handleChange('sampleCollectionRemarks')}
                onBlur={sampleFormik.handleBlur('sampleCollectionRemarks')}
                textAlignVertical="top"
              />
              {sampleFormik.errors.sampleCollectionRemarks && sampleFormik.touched.sampleCollectionRemarks && (
                <Text style={styles.errorText}>{sampleFormik.errors.sampleCollectionRemarks}</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={sampleFormik.handleSubmit}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Render QR Scanner Modal
  const renderQRScannerModal = () => {
    if (!permission?.granted) {
      return (
        <Modal
          visible={qrModal}
          transparent
          animationType="slide"
          onRequestClose={closeScanner}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.qrModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Scan QR Code</Text>
                <TouchableOpacity onPress={closeScanner}>
                  <Icon name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <View style={styles.permissionContainer}>
                <Icon name="camera-outline" size={60} color="#94a3b8" />
                <Text style={styles.permissionText}>Camera permission is required</Text>
                <TouchableOpacity 
                  style={styles.permissionButton}
                  onPress={requestPermission}
                >
                  <Text style={styles.permissionButtonText}>Grant Permission</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeScanner}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      );
    }

    return (
      <Modal
        visible={qrModal}
        transparent
        animationType="slide"
        onRequestClose={closeScanner}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.qrModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Scan QR Code</Text>
              <TouchableOpacity onPress={closeScanner}>
                <Icon name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <View style={styles.cameraContainer}>
              <CameraView
                style={styles.camera}
                onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
                barcodeScannerSettings={{
                  barcodeTypes: ['qr'],
                }}
              >
                <View style={styles.overlay}>
                  <View style={styles.scannerFrame} />
                  <Text style={styles.scanInstruction}>Align QR code within the frame</Text>
                </View>
              </CameraView>
            </View>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={closeScanner}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Render Card
  const renderCard = ({ item, index }) => {
    const isAssigned = item.sample_collection_team_leader_id !== null;
    const getGuardPondName = (id) => {
      const pondMap = {
        '1': 'Guard Pond-1',
        '2': 'Guard Pond-2',
        '3': 'Guard Pond-3',
        '4': 'Guard Pond-4',
      };
      return pondMap[id] || pondMap[String(id)] || '-';
    };

    return (
      <View style={styles.cardItem}>
        <View style={styles.cardHeaderItem}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardIndustry}>{item?.discharge_request_industry || '-'}</Text>
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>#{index + 1}</Text>
            </View>
          </View>
          <Text style={styles.cardPond}>{item?.guardpond_name}{item?.capacity}</Text>
        </View>

        <View style={styles.cardBodyItem}>
          {/* <View style={styles.cardRow}>
            <View style={styles.cardLabelContainer}>
              <Text style={styles.cardLabel}>Sample ID</Text>
              <Text style={styles.cardValue}>{item?.posting_id || '-'}</Text>
            </View>
            <View style={styles.cardLabelContainer}>
              <Text style={styles.cardLabel}>Status</Text>
              <View style={[
                styles.statusBadge,
                isAssigned ? styles.statusAssigned : styles.statusPending
              ]}>
                <Text style={[
                  styles.statusText,
                  isAssigned ? styles.statusTextAssigned : styles.statusTextPending
                ]}>
                  {isAssigned ? 'Assigned' : 'Pending'}
                </Text>
              </View>
            </View>
          </View> */}

          <View style={styles.cardRow}>
            <View style={styles.cardLabelContainer}>
              <Text style={styles.cardLabel}>Sample Request Date</Text>
              <Text style={styles.cardValue}>{item?.discharge_request_date || '-'}</Text>
            </View>
            {roleId === 9 && (
              <View style={styles.cardLabelContainer}>
                <Text style={styles.cardLabel}>Assigned Date</Text>
                <Text style={styles.cardValue}>{item?.sample_collection_assigned_date || '-'}</Text>
              </View>
            )}
          </View>

          <View style={styles.cardActions}>
            {roleId === 8 && (
              <>
                {isAssigned ? (
                  <>
                    <TouchableOpacity style={styles.disabledButton} disabled>
                      <Text style={styles.disabledButtonText}>Assigned</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => {
                        setUpdateModal(true);
                        setRowData(item);
                      }}
                    >
                      <Icon name="create-outline" size={14} color="#fff" />
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.assignButton}
                    onPress={() => {
                      setShowModal(true);
                      setRowData(item);
                    }}
                  >
                    <Icon name="person-add-outline" size={14} color="#fff" />
                    <Text style={styles.assignButtonText}>Assign Duty</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
            {roleId === 9 && (
              item.current_status === "SAMPLE COLLECTED & SENT TO LAB"?<TouchableOpacity
                style={styles.collectedButton}
              >
                <Icon name="flask-outline" size={14} color="#fff" />
                <Text style={styles.collectButtonText}>{ item.current_status}</Text>
              </TouchableOpacity>:<TouchableOpacity
                style={styles.collectButton}
                onPress={() => {
                  setSampleModal(true);
                  setRowData(item);
                  sampleFormik.setFieldValue('sampleQrCode', '');
                }}
              >
                <Icon name="flask-outline" size={14} color="#fff" />
                <Text style={styles.collectButtonText}>Collect Sample</Text>
              </TouchableOpacity>
              
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderAssignDutyModal()}
      {renderUpdateDutyModal()}
      {renderSampleCollectionModal()}
      {renderQRScannerModal()}

      <View >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            <Icon name="list" size={20} color="#000" /> Sample Collection Requests
          </Text>
        </View>

        <View style={styles.cardBody}>
          {/* <View style={styles.headerPanel}>
            <Text style={styles.headerText}>{CONTEXT_HEADING}</Text>
          </View> */}

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="green" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <FlatList
              data={data}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderCard}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={
                <View style={styles.noRecords}>
                  <Text style={styles.noRecordsText}>No Records Found</Text>
                </View>
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    flex: 1,
    margin: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    padding: 15,
    // borderBottomWidth: 1,
    // borderBottomColor: '#e0e0e0',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  cardBody: {
    flex: 1,
    padding: 10,
  },
  headerPanel: {
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 4,
    marginBottom: 10,
  },
  headerText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
  listContainer: {
    paddingBottom: 20,
  },
  // Card Styles
  cardItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeaderItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardIndustry: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e3a5f',
    flex: 1,
  },
  cardBadge: {
    backgroundColor: 'green',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  cardBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  cardPond: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
  },
  cardBodyItem: {
    padding: 12,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardLabelContainer: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 11,
    color: '#6c757d',
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusAssigned: {
    backgroundColor: '#d4edda',
  },
  statusPending: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextAssigned: {
    color: '#155724',
  },
  statusTextPending: {
    color: '#721c24',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'green',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 0.45,
    justifyContent: 'center',
  },
  assignButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  collectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 0.9,
    justifyContent: 'center',
  },
   collectedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6c716d',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 0.9,
    justifyContent: 'center',
  },
  collectButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#17a2b8',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flex: 0.45,
    justifyContent: 'center',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  disabledButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flex: 0.45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxHeight: '90%',
  },
  qrModalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '95%',
    height: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  formGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  star: {
    color: 'red',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#333',
  },
  dateInputWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#fff',
  },
  dateInputText: {
    fontSize: 14,
    color: '#333',
  },
  datePlaceholder: {
    color: '#999',
  },
  uploadButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#333',
    fontSize: 14,
  },
  filePreview: {
    marginTop: 10,
    alignItems: 'center',
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
  },
  pdfPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  pdfText: {
    marginLeft: 8,
    color: 'blue',
  },
  fileNameText: {
    fontSize: 12,
    color: '#666',
  },
  qrButton: {
    flexDirection: 'row',
    backgroundColor: 'green',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrButtonText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 8,
  },
  qrPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 8,
    backgroundColor: '#e8f5e9',
    borderRadius: 4,
  },
  qrCodeText: {
    marginLeft: 8,
    color: 'green',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  noRecords: {
    padding: 40,
    alignItems: 'center',
  },
  noRecordsText: {
    color: 'red',
    fontSize: 14,
  },
  cameraContainer: {
    flex: 1,
    marginTop: 10,
    position: 'relative',
    backgroundColor: '#000',
    borderRadius: 10,
    overflow: 'hidden',
    minHeight: 400,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: 'green',
    backgroundColor: 'transparent',
    borderRadius: 10,
  },
  scanInstruction: {
    color: '#fff',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 15,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    minHeight: 400,
  },
  permissionText: {
    color: '#333',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: 'green',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SampleCollectionRequests;