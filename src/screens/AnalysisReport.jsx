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
  ActivityIndicator,
  Image,
  Linking,
  FlatList,
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
  ANALYSISREPORTS,
  ASSIGNDISCHARGEDUTY,
  commonAPICall,
  CONTEXT_HEADING,
  DISCHARGEFILTERFLAG,
  DISCHARGENOTICE,
  MARINEDISCHARGEDETAILS,
  UPLOADANALYSISREPORT,
} from '../utils/utils';
import ImageBucketRN from '../utils/ImageBucketRN';
 
const AnalysisReport = () => {
  const dispatch = useDispatch();
  const state = useSelector((state) => state.LoginReducer);
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [rowData, setRowData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [qrModal, setQrModal] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [filterType, setFilterType] = useState(1); // 1 = Assigned, 0 = Unassigned
 
  // Validation schema for Assign Duty
  const validationSchema = Yup.object({
    dischargeAssignedTeamLeaderId: Yup.string().required('Required'),
    dischargeAssignedDate: Yup.string().required('Required'),
  });
 
  // Validation schema for Notice
  const noticeValidationSchema = Yup.object({
    noticeRemarks: Yup.string().required('required').min(10, 'Remarks must be at least 10 characters'),
    noticeAttachment: Yup.string().required('required'),
  });
 
  const formik = useFormik({
    initialValues: {
      dischargeAssignedTeamLeaderId: '',
      dischargeAssignedDate: '',
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      HandleSubmit(values);
    },
  });
 
  const noticeFormik = useFormik({
    initialValues: {
      noticeRemarks: '',
      noticeAttachment: null,
    },
    validationSchema: noticeValidationSchema,
    onSubmit: (values) => {
      HandleNoticeSubmit(values);
    },
  });
 
  // API Calls
  const HandleSubmit = async (values) => {
    try {
      setLoading(true);
      const payload = {
        ...values,
        postingId: rowData?.posting_id,
        dischargeAssignmentRemarks: 'Assigned for treated water discharge verification.',
      };
      const res = await commonAPICall(ASSIGNDISCHARGEDUTY, payload, 'post', dispatch);
      if (res.status === 200) {
        formik.resetForm();
        GetData(filterType);
        setShowModal(false);
        Alert.alert('Success', 'Duty assigned successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to assign duty');
    } finally {
      setLoading(false);
    }
  };
 
  const HandleNoticeSubmit = async (values) => {
    try {
      setLoading(true);
      const payload = {
        ...values,
        postingId: rowData?.posting_id,
        // noticeRemarks: values.noticeRemarks,
        // noticeSubject: values.noticeSubject || 'Notice for discharge violation',
        // noticeDate: moment().format('YYYY-MM-DD'),
        // industryName: rowData?.discharge_request_industry,
        // noticeAttachment: values.noticeAttachment,
      };
     
      const res = await commonAPICall(DISCHARGENOTICE, payload, 'post', dispatch);
      if (res.status === 200) {
        noticeFormik.resetForm();
        setShowNoticeModal(false);
        Alert.alert('Success', 'Notice sent successfully!');
      } else {
        Alert.alert('Error', 'Failed to send notice. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send notice');
    } finally {
      setLoading(false);
    }
  };
 
  const GetData = async (flag) => {
    try {
      setLoading(true);
      const res = await commonAPICall(ANALYSISREPORTS + flag, {}, 'get', dispatch);
     
      if (res.status === 200) {
        setData(res.data.MarineDischargeSummary || []);
       
      } else {
        setData([]);
      }
    } catch (error) {
      setData([]);
      Alert.alert('Error', 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };
 
  useEffect(() => {
    GetData(1); // Initially load Assigned (1)
  }, []);
 
  // QR Code Scanning
  const handleBarCodeScanned = async ({ data: scannedData }) => {
    if (!scanning) return;
   
    setScanning(false);
    setQrModal(false);
   
    if (scannedData) {
      try {
        setLoading(true);
        const foundItem = data.find(item => item.posting_id === scannedData);
       
        if (foundItem) {
          setRowData(foundItem);
          setShowModal(true);
          Alert.alert('Success', 'QR Code validated successfully!');
        } else {
          Alert.alert('Invalid QR Code', 'No record found for this QR code');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to validate QR code');
      } finally {
        setLoading(false);
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
    formik.setFieldValue('dischargeAssignedDate', formattedDate);
  };
 
  // Handle Filter Change
  const handleFilterChange = (flag) => {
    setFilterType(flag);
    GetData(flag);
  };
 
  // Industry Limits
  const industryLimits = {
    "ANDHRA ORGANICS": {
      ph: { min: 5.5, max: 9.0 },
      tss: 100,
      cod: 250,
      fluoride: 15,
      phenols: 5,
      phosphate: 5,
      ammonical: 50,
      nitrate: 50,
      chromium: 0.1
    },
    "AETL": {
      ph: { min: 6.0, max: 9.0 },
      tss: 100,
      cod: 250,
      fluoride: 15,
      phenols: 5,
      ammonical: 50,
      nitrate: 50,
      chromium: 0.1
    },
    "APITORIA": {
      ph: { min: 6.5, max: 8.5 },
      tss: 100,
      cod: 250,
      fluoride: 15,
      phenols: 5,
      ammonical: 50,
      nitrate: 50,
      chromium: 0.1
    },
    "BRANDIX": {
      ph: { min: 6.0, max: 9.0 },
      tss: 100,
      cod: 250,
      fluoride: 15,
      phenols: 5,
      ammonical: 50,
      nitrate: 50,
      chromium: 0.1
    },
    "DECCAN": {
      ph: { min: 6.5, max: 8.5 },
      tss: 100,
      cod: 225,
      phenols: 1,
      phosphate: 5
    },
    "DIVI": {
      ph: { min: 6.5, max: 8.5 },
      tss: 100,
      cod: 225,
      fluoride: 15,
      phenols: 1,
      phosphate: 5,
      ammonical: 50,
      nitrate: 20,
      chromium: 0.1
    },
    "HETERO": {
      ph: { min: 6.0, max: 9.0 },
      tss: 100,
      cod: 250,
      fluoride: 15,
      phenols: 5,
      phosphate: 5,
      ammonical: 50,
      nitrate: 50,
      chromium: 0.1
    },
    "APARNA": {
      ph: { min: 6.0, max: 8.5 },
      tss: 100,
      cod: 250,
      fluoride: 15,
      phenols: 5,
      phosphate: 5,
      ammonical: 50,
      nitrate: 50,
      chromium: 0.1
    },
    "VISAKHA PHARMACITY": {
      ph: { min: 6.0, max: 9.0 },
      tss: 100,
      cod: 250,
      fluoride: 15,
      phenols: 5,
      ammonical: 50,
      nitrate: 50
    },
    "SMS": {
      ph: { min: 6.5, max: 8.5 },
      tss: 100,
      cod: 250,
      phenols: 1,
      phosphate: 5,
      ammonical: 100,
      chromium: 0.1
    },
    "SHREAS": {
      ph: { min: 5.5, max: 9.0 },
      tss: 100,
      cod: 250,
      phenols: 5,
      ammonical: 50,
      chromium: 1
    },
    "AUROACTIVE": {
      ph: { min: 5.5, max: 9.0 },
      tss: 100,
      cod: 250,
      fluoride: 15,
      phenols: 5,
      phosphate: 5,
      ammonical: 50,
      nitrate: 20,
      chromium: 0.1
    },
    "LYFIUS": {
      ph: { min: 5.5, max: 9.0 },
      tss: 100,
      cod: 250,
      fluoride: 15,
      phenols: 5,
      ammonical: 50,
      nitrate: 20,
      chromium: 1
    },
    "VIJAYANAGAR BIOTECH": {
      ph: { min: 6.5, max: 8.5 },
      tss: 100,
      cod: 250
    }
  };
 
  const defaultLimits = {
    ph: { min: 5.5, max: 9.0 },
    tds: 2100,
    tss: 100,
    cod: 250,
    fluoride: 15,
    phenols: 5,
    phosphate: 5,
    ammonical: 50,
    nitrate: 50,
    chromium: 0.1
  };
 
  const getIndustryLimitsByUsername = () => {
    const username = state?.username;
    if (!username) return defaultLimits;
 
    const normalizedUsername = username?.toUpperCase()?.trim();
    if (industryLimits[normalizedUsername]) {
      return industryLimits[normalizedUsername];
    }
 
    const matchedKey = Object.keys(industryLimits).find(
      (key) =>
        normalizedUsername.includes(key.toUpperCase()) ||
        key.toUpperCase().includes(normalizedUsername)
    );
 
    return matchedKey ? industryLimits[matchedKey] : defaultLimits;
  };
 
  const getValueColor = (value, limit, isPH = false) => {
    if (value === null || value === undefined || value === '' || value === '-' || limit === undefined) {
      return { isValid: true, color: 'green' };
    }
 
    const numericValue = parseFloat(value);
    let isValid = true;
 
    if (isPH) {
      isValid = numericValue >= limit?.min && numericValue <= limit?.max;
    } else {
      isValid = numericValue <= limit;
    }
 
    return {
      isValid: isValid,
      color: isValid ? 'green' : 'red'
    };
  };
 
  const showParameterInfo = (param) => {
    const value = param.value || "-";
 
    if (value === "-") {
      Alert.alert(
        param.key,
        "No value available."
      );
      return;
    }
 
    if (param.isPH) {
      const isValid =
        parseFloat(value) >= param.limit.min &&
        parseFloat(value) <= param.limit.max;
 
      Alert.alert(
        param.key,
        isValid
          ? `✅ Status: Normal\n\nCurrent Value: ${value}\n\nAllowed Range: ${param.limit.min} - ${param.limit.max}`
          : `❌ Status: Out of Range\n\nCurrent Value: ${value}\n\nAllowed Range: ${param.limit.min} - ${param.limit.max}`
      );
    } else {
      const isValid = parseFloat(value) <= param.limit;
 
      Alert.alert(
        param.key,
        isValid
          ? `✅ Status: Within Limit\n\nCurrent Value: ${value}\n\nMaximum Allowed: ${param.limit}`
          : `❌ Status: Exceeded Limit\n\nCurrent Value: ${value}\n\nMaximum Allowed: ${param.limit}\n\nExceeded By: ${(parseFloat(value) - param.limit).toFixed(2)}`
      );
    }
  };
 
  const userIndustryLimits = getIndustryLimitsByUsername();
 
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
                formik.errors.dischargeAssignedTeamLeaderId &&
                  formik.touched.dischargeAssignedTeamLeaderId &&
                  styles.inputError,
              ]}>
                <Picker
                  selectedValue={formik.values.dischargeAssignedTeamLeaderId}
                  onValueChange={(itemValue) => {
                    formik.setFieldValue('dischargeAssignedTeamLeaderId', itemValue);
                    formik.setFieldTouched('dischargeAssignedTeamLeaderId', true);
                  }}
                  style={styles.picker}
                  dropdownIconColor="#666"
                >
                  <Picker.Item label="Select Team Leader" value="" />
                  <Picker.Item label="TEAML" value="TEAML" />
                </Picker>
              </View>
              {formik.errors.dischargeAssignedTeamLeaderId &&
                formik.touched.dischargeAssignedTeamLeaderId && (
                  <Text style={styles.errorText}>
                    {formik.errors.dischargeAssignedTeamLeaderId}
                  </Text>
                )}
            </View>
 
            <View style={styles.formGroup}>
              <Text style={styles.label}>Assigning Date <Text style={styles.star}>*</Text></Text>
              <TouchableOpacity
                style={[
                  styles.dateInputWrapper,
                  formik.errors.dischargeAssignedDate &&
                    formik.touched.dischargeAssignedDate &&
                    styles.inputError,
                ]}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dateInputText,
                  !formik.values.dischargeAssignedDate && styles.datePlaceholder
                ]}>
                  {formik.values.dischargeAssignedDate || 'YYYY-MM-DD'}
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
             
              {formik.errors.dischargeAssignedDate &&
                formik.touched.dischargeAssignedDate && (
                  <Text style={styles.errorText}>
                    {formik.errors.dischargeAssignedDate}
                  </Text>
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
 
  // Render Notice Modal
  const renderNoticeModal = () => (
    <Modal
      visible={showNoticeModal}
      transparent
      animationType="slide"
      onRequestClose={() => {
        setShowNoticeModal(false);
        noticeFormik.resetForm();
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Send Notice</Text>
            <TouchableOpacity
              onPress={() => {
                setShowNoticeModal(false);
                noticeFormik.resetForm();
              }}
            >
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <ScrollView>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Remarks <Text style={styles.star}>*</Text></Text>
              <TextInput
                style={[
                  styles.textArea,
                  noticeFormik.errors.noticeRemarks &&
                    noticeFormik.touched.noticeRemarks &&
                    styles.inputError,
                ]}
                placeholder="Enter detailed remarks for the notice..."
                multiline
                numberOfLines={4}
                value={noticeFormik.values.noticeRemarks}
                onChangeText={noticeFormik.handleChange('noticeRemarks')}
                onBlur={noticeFormik.handleBlur('noticeRemarks')}
                textAlignVertical="top"
              />
              {noticeFormik.errors.noticeRemarks &&
                noticeFormik.touched.noticeRemarks && (
                  <Text style={styles.errorText}>
                    {noticeFormik.errors.noticeRemarks}
                  </Text>
                )}
            </View>
 
            <View style={styles.formGroup}>
              <Text style={styles.label}>Attachment <Text style={styles.star}>*</Text></Text>
              <TouchableOpacity
                style={[
                  styles.uploadButton,
                  noticeFormik.errors.noticeAttachment &&
                    noticeFormik.touched.noticeAttachment &&
                    styles.inputError,
                ]}
                onPress={() => {
                  const path = 'APEMCL/REGISTRATION/';
                  ImageBucketRN(
                    noticeFormik,
                    path,
                    'noticeAttachment',
                    20971520,
                    'camera',
                    dispatch
                  );
                }}
              >
                <Text style={styles.uploadButtonText}>Upload Attachment</Text>
              </TouchableOpacity>
              {noticeFormik.values.noticeAttachment && (
                <View style={styles.filePreview}>
                  {noticeFormik.values.noticeAttachment.match(/\.(jpg|jpeg|png)$/i) ? (
                    <Image
                      source={{ uri: noticeFormik.values.noticeAttachment }}
                      style={styles.imagePreview}
                    />
                  ) : noticeFormik.values.noticeAttachment.match(/\.pdf$/i) ? (
                    <TouchableOpacity
                      style={styles.pdfPreview}
                      onPress={() => Linking.openURL(noticeFormik.values.noticeAttachment)}
                    >
                      <Icon name="document-text-outline" size={24} color="red" />
                      <Text style={styles.pdfText}>Download PDF</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.fileNameText}>{noticeFormik.values.noticeAttachment}</Text>
                  )}
                </View>
              )}
              {noticeFormik.errors.noticeAttachment &&
                noticeFormik.touched.noticeAttachment && (
                  <Text style={styles.errorText}>
                    {noticeFormik.errors.noticeAttachment}
                  </Text>
                )}
              <Text style={styles.hintText}>
                Allowed formats: PDF, JPEG, PNG, DOC, DOCX (Max size: 5MB)
              </Text>
            </View>
 
            <TouchableOpacity
              style={styles.submitButton}
              onPress={noticeFormik.handleSubmit}
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
  );
 
  // Render QR Scanner Modal
  const renderQRScannerModal = () => {
    if (!permission?.granted) {
      return (
        <Modal visible={qrModal} transparent animationType="slide" onRequestClose={closeScanner}>
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
                <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                  <Text style={styles.permissionButtonText}>Grant Permission</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.cancelButton} onPress={closeScanner}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      );
    }
 
    return (
      <Modal visible={qrModal} transparent animationType="slide" onRequestClose={closeScanner}>
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
            <TouchableOpacity style={styles.cancelButton} onPress={closeScanner}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };
 
  // Render Filter Buttons
  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[
          styles.filterButton,
          filterType === 1 && styles.filterButtonActive,
        ]}
        onPress={() => handleFilterChange(1)}
      >
        <Icon
          name="checkmark-circle-outline"
          size={18}
          color={filterType === 1 ? '#fff' : '#2e7d32'}
        />
        <Text style={[
          styles.filterButtonText,
          filterType === 1 && styles.filterButtonTextActive,
        ]}>
          Assigned
        </Text>
      </TouchableOpacity>
     
      <TouchableOpacity
        style={[
          styles.filterButton,
          filterType === 0 && styles.filterButtonActive,
        ]}
        onPress={() => handleFilterChange(0)}
      >
        <Icon
          name="close-circle-outline"
          size={18}
          color={filterType === 0 ? '#fff' : '#d32f2f'}
        />
        <Text style={[
          styles.filterButtonText,
          filterType === 0 && styles.filterButtonTextActive,
        ]}>
          Unassigned
        </Text>
      </TouchableOpacity>
    </View>
  );
 
  // Render Card
  const renderCard = ({ item, index }) => {
    const limits = userIndustryLimits;
    const isAssigned = item.discharge_assigned_team_leader_id !== null;
    const getGuardPondName = (id) => {
      const pondMap = {
        '1': 'Pond-1',
        '2': 'Pond-2',
        '3': 'Pond-3',
        '4': 'Pond-4',
      };
      return pondMap[id] || pondMap[String(id)] || '-';
    };
 
    // Parameter configuration
    const parameters = [
      { key: 'TDS', value: item?.tds_value, limit: limits?.tds, isPH: false },
      { key: 'TSS', value: item?.tss_value, limit: limits?.tss, isPH: false },
      { key: 'COD', value: item?.cod_value, limit: limits?.cod, isPH: false },
      { key: 'PH', value: item?.ph_value, limit: limits?.ph, isPH: true },
      { key: 'Fluoride', value: item?.fluoride_value, limit: limits?.fluoride, isPH: false },
      { key: 'Phenols', value: item?.phenols_value, limit: limits?.phenols, isPH: false },
      { key: 'Phosphate', value: item?.ortho_phosphate_value, limit: limits?.phosphate, isPH: false },
      { key: 'Nitrate', value: item?.nitrate_nitrogen_value, limit: limits?.nitrate, isPH: false },
      { key: 'Ammonical', value: item?.ammonical_nitrogen_value, limit: limits?.ammonical, isPH: false },
      { key: 'Chromium', value: item?.hexavalent_chromium_value, limit: limits?.chromium, isPH: false },
    ];
 
    // Check if any parameter is invalid (red)
    const hasInvalidParameter = parameters.some(param => {
      const { isValid } = getValueColor(param.value, param.limit, param.isPH);
      return !isValid;
    });
 
    return (
      <View style={styles.cardItem}>
        <View style={styles.cardHeaderItem}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardIndustry}>{item?.discharge_request_industry || '-'}</Text>
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>#{index + 1}</Text>
            </View>
          </View>
        </View>
 
        <View style={styles.cardBodyItem}>
          <View style={styles.cardRow}>
            <View style={styles.cardLabelContainer}>
              <Text style={styles.cardLabel}>Collected Date</Text>
              <Text style={styles.cardValue}>{item?.sample_collected_date?.split(' ')[0] || '-'}</Text>
            </View>
            <View style={styles.cardLabelContainer}>
              <Text style={styles.cardLabel}>Analysis Date</Text>
              <Text style={styles.cardValue}>{item?.analysis_date?.split(' ')[0] || '-'}</Text>
            </View>
          </View>
 
          <View style={styles.cardRow}>
            <View style={styles.cardLabelContainer}>
              <Text style={styles.cardLabel}>Guard Pond</Text>
              <Text style={styles.cardValue}>{item?.guardpond_name}</Text>
            </View>
           
          </View>
 
          {/* Parameter Grid - 5 items per row with circles */}
          <View style={styles.parameterGrid}>
            {parameters.map((param, idx) => {
              const { isValid, color } = getValueColor(param.value, param.limit, param.isPH);
              const displayValue = param.value || '-';
             
              return (
                <View key={idx} style={styles.parameterItem}>
                  <TouchableOpacity onPress={() => showParameterInfo(param)}>
                    <View style={styles.parameterCircleContainer}>
                      <View style={[
                        styles.parameterCircle,
                        { borderColor: color }
                      ]}>
                        <Text style={[styles.parameterValue, { color: color }]}>
                          {displayValue}
                        </Text>
                      </View>
                      <Text style={styles.parameterLabel}>{param.key}</Text>
                      {!isValid && displayValue !== '-' && (
                        <View style={styles.warningDot} />
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
             {state.roleId!==2&&(
          <View style={styles.cardActions}>
            {isAssigned ? (
              <TouchableOpacity style={styles.disabledButton} disabled>
                <Icon name="person-add-outline" size={14} color="#fff" />
                <Text style={styles.disabledButtonText}>Assigned</Text>
              </TouchableOpacity>
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
            <TouchableOpacity
              style={[
                styles.noticeButton,
                !hasInvalidParameter && styles.noticeButtonDisabled
              ]}
              onPress={() => {
                if (hasInvalidParameter) {
                  setShowNoticeModal(true);
                  setRowData(item);
                  noticeFormik.resetForm();
                }
              }}
              disabled={!hasInvalidParameter}
            >
              <Icon name="notifications-outline" size={14} color={!hasInvalidParameter ? '#999' : '#000'} />
              <Text style={[
                styles.noticeButtonText,
                !hasInvalidParameter && styles.noticeButtonTextDisabled
              ]}>
                Notice
              </Text>
            </TouchableOpacity>
          </View>
             )}
          
        </View>
      </View>
    );
  };
 
  return (
    <View style={styles.container}>
      {renderAssignDutyModal()}
      {renderNoticeModal()}
      {renderQRScannerModal()}
 
      <View>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            <Icon name="list" size={20} color="#000" /> Analysis Report - {state?.username || 'Industry'}
          </Text>
        </View>
 
        <View style={styles.cardBody}>
          {renderFilterButtons()}
 
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="green" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            data.length > 0 ? (
    data.map((item, index) => (
      <View key={index}>
        {renderCard({ item, index })}
      </View>
    ))
  ) : (
    <View style={styles.noRecords}>
      <Text style={styles.noRecordsText}>No Records Found</Text>
    </View>
  )
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
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
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
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginBottom: 12,
    gap: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#2e7d32',
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#2e7d32',
    borderColor: '#2e7d32',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
    marginLeft: 6,
  },
  filterButtonTextActive: {
    color: '#fff',
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
  headerSubText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  headerSubTextBold: {
    fontWeight: 'bold',
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
  parameterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    marginBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 10,
    justifyContent: 'center',
  },
  parameterItem: {
    width: '20%', // 5 items per row
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    position: 'relative',
  },
  parameterCircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  parameterCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginBottom: 4,
  },
  parameterValue: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  parameterLabel: {
    fontSize: 9,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 2,
    fontWeight: '500',
  },
  warningDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'red',
    borderWidth: 1,
    borderColor: '#fff',
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
  noticeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffc107',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 0.45,
    justifyContent: 'center',
  },
  noticeButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
  noticeButtonText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  noticeButtonTextDisabled: {
    color: '#999',
  },
  disabledButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6c757d',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flex: 0.45,
    justifyContent: 'center',
  },
  disabledButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  noRecords: {
    padding: 40,
    alignItems: 'center',
  },
  noRecordsText: {
    color: 'red',
    fontSize: 14,
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
  hintText: {
    fontSize: 11,
    color: '#6c757d',
    marginTop: 5,
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
    marginTop: 20,
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
 
export default AnalysisReport;