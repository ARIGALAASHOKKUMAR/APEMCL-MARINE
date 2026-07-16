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
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Icon from 'react-native-vector-icons/Ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  commonAPICall,
  CONTEXT_HEADING,
  MARINEDISCHARGEDETAILS,
  UPLOADANALYSISREPORT,
  VALIDATEQRINLAB,
} from '../utils/utils';
import ImageBucketRN from '../utils/ImageBucketRN';

const LabAnalysis = () => {
  const dispatch = useDispatch();
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [rowData, setRowData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [qrModal, setQrModal] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedPostingId, setScannedPostingId] = useState(null);

  // Validation Schema
  const validationSchema = Yup.object({
    phValue: Yup.string().required('Required'),
    tssValue: Yup.string().required('Required'),
    tdsValue: Yup.string().required('Required'),
    codValue: Yup.string().required('Required'),
    fluorideValue: Yup.string().required('Required'),
    phenolsValue: Yup.string().required('Required'),
    orthoPhosphateValue: Yup.string().required('Required'),
    ammonicalNitrogenValue: Yup.string().required('Required'),
    nitrateNitrogenValue: Yup.string().required('Required'),
    hexavalentChromiumValue: Yup.string().required('Required'),
    analysisReportFile: Yup.string().required('Required'),
  });

  // Formik instance
  const formik = useFormik({
    initialValues: {
      phValue: '',
      tssValue: '',
      tdsValue: '',
      codValue: '',
      fluorideValue: '',
      phenolsValue: '',
      orthoPhosphateValue: '',
      ammonicalNitrogenValue: '',
      nitrateNitrogenValue: '',
      hexavalentChromiumValue: '',
      analysisReportFile: null,
    },
    validationSchema: validationSchema,
    onSubmit: (values) => {
      HandleSubmit(values);
    },
  });

  // API Calls
  const HandleSubmit = async (values) => {
    try {
      setLoading(true);
      const payload = {
        ...values,
        postingId: rowData ,
        sampleQrCode:scannedPostingId
      };
      const res = await commonAPICall(UPLOADANALYSISREPORT, payload, 'post', dispatch);
      console.log("test",payload);
      
      if (res.status === 200) {
        formik.resetForm();
        GetData();
        setShowModal(false);
        setScannedPostingId(null);
        Alert.alert('Success', 'Analysis report uploaded successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload analysis report');
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
      Alert.alert('Error', 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // QR Code Scanning
  const handleBarCodeScanned = async ({ data: scannedData }) => {
    if (!scanning) return;
    
    setScanning(false);
    setQrModal(false);
    
    if (scannedData) {
      // Dummy API call to validate QR code
      try {
        setLoading(true);
        // Replace with your actual validation API
        const validationPayload = {
          qrCode: scannedData,
        };
        
        // Dummy API call - replace with actual endpoint
        const response = await commonAPICall(
          VALIDATEQRINLAB+scannedData, // Replace with your actual endpoint
          {},
          'get',
          dispatch
        );
        
        // For demo purposes, we'll assume the QR code is valid
        // if (response.status === 200 && response.data.valid) {
        if (response.status === 200) { // Remove this condition once you have real API
          setScannedPostingId(scannedData);
          setRowData(response.data.postingId)
          setShowModal(true);
          Alert.alert('Success', 'QR Code validated successfully!');
        } else {
          Alert.alert('Invalid QR Code', 'Please scan a valid QR code');
        }
      } catch (error) {
        // For demo - if API fails, still allow for testing
        // Remove this fallback once API is ready
        setScannedPostingId(scannedData);
        setShowModal(true);
        Alert.alert('Info', 'QR Code scanned (Demo mode)');
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

  useEffect(() => {
    GetData();
  }, []);

  // Render Upload Modal
  const renderUploadModal = () => (
    <Modal
      visible={showModal}
      transparent
      animationType="slide"
      onRequestClose={() => {
        setShowModal(false);
        setScannedPostingId(null);
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Upload Analysis Report</Text>
            <TouchableOpacity onPress={() => {
              setShowModal(false);
              setScannedPostingId(null);
            }}>
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Display Scanned ID */}
            {scannedPostingId && (
              <View style={styles.scannedIdContainer}>
                <Icon name="checkmark-circle" size={20} color="green" />
                <Text style={styles.scannedIdText}>
                  Posting ID: {scannedPostingId}
                </Text>
              </View>
            )}

            {/* PH Value */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>PH Value <Text style={styles.star}>*</Text></Text>
              <TextInput
                style={[
                  styles.input,
                  formik.errors.phValue && formik.touched.phValue && styles.inputError,
                ]}
                placeholder="Enter PH Value"
                keyboardType="numeric"
                value={formik.values.phValue}
                onChangeText={formik.handleChange('phValue')}
                onBlur={formik.handleBlur('phValue')}
              />
              {formik.errors.phValue && formik.touched.phValue && (
                <Text style={styles.errorText}>{formik.errors.phValue}</Text>
              )}
            </View>

            {/* TSS Value */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>TSS Value <Text style={styles.star}>*</Text></Text>
              <TextInput
                style={[
                  styles.input,
                  formik.errors.tssValue && formik.touched.tssValue && styles.inputError,
                ]}
                placeholder="Enter TSS Value"
                keyboardType="numeric"
                value={formik.values.tssValue}
                onChangeText={formik.handleChange('tssValue')}
                onBlur={formik.handleBlur('tssValue')}
              />
              {formik.errors.tssValue && formik.touched.tssValue && (
                <Text style={styles.errorText}>{formik.errors.tssValue}</Text>
              )}
            </View>

            {/* TDS Value */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>TDS Value <Text style={styles.star}>*</Text></Text>
              <TextInput
                style={[
                  styles.input,
                  formik.errors.tdsValue && formik.touched.tdsValue && styles.inputError,
                ]}
                placeholder="Enter TDS Value"
                keyboardType="numeric"
                value={formik.values.tdsValue}
                onChangeText={formik.handleChange('tdsValue')}
                onBlur={formik.handleBlur('tdsValue')}
              />
              {formik.errors.tdsValue && formik.touched.tdsValue && (
                <Text style={styles.errorText}>{formik.errors.tdsValue}</Text>
              )}
            </View>

            {/* COD Value */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>COD Value <Text style={styles.star}>*</Text></Text>
              <TextInput
                style={[
                  styles.input,
                  formik.errors.codValue && formik.touched.codValue && styles.inputError,
                ]}
                placeholder="Enter COD Value"
                keyboardType="numeric"
                value={formik.values.codValue}
                onChangeText={formik.handleChange('codValue')}
                onBlur={formik.handleBlur('codValue')}
              />
              {formik.errors.codValue && formik.touched.codValue && (
                <Text style={styles.errorText}>{formik.errors.codValue}</Text>
              )}
            </View>

            {/* Fluoride Value */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Fluoride Value <Text style={styles.star}>*</Text></Text>
              <TextInput
                style={[
                  styles.input,
                  formik.errors.fluorideValue && formik.touched.fluorideValue && styles.inputError,
                ]}
                placeholder="Enter Fluoride Value"
                keyboardType="numeric"
                value={formik.values.fluorideValue}
                onChangeText={formik.handleChange('fluorideValue')}
                onBlur={formik.handleBlur('fluorideValue')}
              />
              {formik.errors.fluorideValue && formik.touched.fluorideValue && (
                <Text style={styles.errorText}>{formik.errors.fluorideValue}</Text>
              )}
            </View>

            {/* Phenols Value */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Phenols Value <Text style={styles.star}>*</Text></Text>
              <TextInput
                style={[
                  styles.input,
                  formik.errors.phenolsValue && formik.touched.phenolsValue && styles.inputError,
                ]}
                placeholder="Enter Phenols Value"
                keyboardType="numeric"
                value={formik.values.phenolsValue}
                onChangeText={formik.handleChange('phenolsValue')}
                onBlur={formik.handleBlur('phenolsValue')}
              />
              {formik.errors.phenolsValue && formik.touched.phenolsValue && (
                <Text style={styles.errorText}>{formik.errors.phenolsValue}</Text>
              )}
            </View>

            {/* Ortho Phosphate Value */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Ortho Phosphate Value <Text style={styles.star}>*</Text></Text>
              <TextInput
                style={[
                  styles.input,
                  formik.errors.orthoPhosphateValue && formik.touched.orthoPhosphateValue && styles.inputError,
                ]}
                placeholder="Enter Ortho Phosphate Value"
                keyboardType="numeric"
                value={formik.values.orthoPhosphateValue}
                onChangeText={formik.handleChange('orthoPhosphateValue')}
                onBlur={formik.handleBlur('orthoPhosphateValue')}
              />
              {formik.errors.orthoPhosphateValue && formik.touched.orthoPhosphateValue && (
                <Text style={styles.errorText}>{formik.errors.orthoPhosphateValue}</Text>
              )}
            </View>

            {/* Ammonical Nitrogen Value */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Ammonical Nitrogen Value <Text style={styles.star}>*</Text></Text>
              <TextInput
                style={[
                  styles.input,
                  formik.errors.ammonicalNitrogenValue && formik.touched.ammonicalNitrogenValue && styles.inputError,
                ]}
                placeholder="Enter Ammonical Nitrogen Value"
                keyboardType="numeric"
                value={formik.values.ammonicalNitrogenValue}
                onChangeText={formik.handleChange('ammonicalNitrogenValue')}
                onBlur={formik.handleBlur('ammonicalNitrogenValue')}
              />
              {formik.errors.ammonicalNitrogenValue && formik.touched.ammonicalNitrogenValue && (
                <Text style={styles.errorText}>{formik.errors.ammonicalNitrogenValue}</Text>
              )}
            </View>

            {/* Nitrate Nitrogen Value */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nitrate Nitrogen Value <Text style={styles.star}>*</Text></Text>
              <TextInput
                style={[
                  styles.input,
                  formik.errors.nitrateNitrogenValue && formik.touched.nitrateNitrogenValue && styles.inputError,
                ]}
                placeholder="Enter Nitrate Nitrogen Value"
                keyboardType="numeric"
                value={formik.values.nitrateNitrogenValue}
                onChangeText={formik.handleChange('nitrateNitrogenValue')}
                onBlur={formik.handleBlur('nitrateNitrogenValue')}
              />
              {formik.errors.nitrateNitrogenValue && formik.touched.nitrateNitrogenValue && (
                <Text style={styles.errorText}>{formik.errors.nitrateNitrogenValue}</Text>
              )}
            </View>

            {/* Hexavalent Chromium Value */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Hexavalent Chromium Value <Text style={styles.star}>*</Text></Text>
              <TextInput
                style={[
                  styles.input,
                  formik.errors.hexavalentChromiumValue && formik.touched.hexavalentChromiumValue && styles.inputError,
                ]}
                placeholder="Enter Hexavalent Chromium Value"
                keyboardType="numeric"
                value={formik.values.hexavalentChromiumValue}
                onChangeText={formik.handleChange('hexavalentChromiumValue')}
                onBlur={formik.handleBlur('hexavalentChromiumValue')}
              />
              {formik.errors.hexavalentChromiumValue && formik.touched.hexavalentChromiumValue && (
                <Text style={styles.errorText}>{formik.errors.hexavalentChromiumValue}</Text>
              )}
            </View>

            {/* Analysis Report File Upload */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Analysis Report File <Text style={styles.star}>*</Text></Text>
              <TouchableOpacity
                style={[
                  styles.uploadButton,
                  formik.errors.analysisReportFile && formik.touched.analysisReportFile && styles.inputError,
                ]}
                onPress={() => {
                  const path = 'APEMCL/MARINE/';
                  ImageBucketRN(
                    formik,
                    path,
                    'analysisReportFile',
                    20971520,
                    'all',
                    dispatch
                  );
                }}
              >
                <Text style={styles.uploadButtonText}>Upload Analysis Report</Text>
              </TouchableOpacity>
              {formik.values.analysisReportFile && (
                <View style={styles.filePreview}>
                  {formik.values.analysisReportFile.match(/\.(jpg|jpeg|png)$/i) ? (
                    <Image
                      source={{ uri: formik.values.analysisReportFile }}
                      style={styles.imagePreview}
                    />
                  ) : formik.values.analysisReportFile.match(/\.pdf$/i) ? (
                    <TouchableOpacity
                      style={styles.pdfPreview}
                      onPress={() => Linking.openURL(formik.values.analysisReportFile)}
                    >
                      <Icon name="document-text-outline" size={24} color="red" />
                      <Text style={styles.pdfText}>Download PDF</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.fileNameText}>{formik.values.analysisReportFile}</Text>
                  )}
                </View>
              )}
              {formik.errors.analysisReportFile && formik.touched.analysisReportFile && (
                <Text style={styles.errorText}>{formik.errors.analysisReportFile}</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={formik.handleSubmit}
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

  return (
    <ScrollView style={styles.container}>
      {renderUploadModal()}
      {renderQRScannerModal()}

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            <Icon name="list" size={20} color="#000" /> Lab Analysis
          </Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.headerPanel}>
            <Text style={styles.headerText}>{CONTEXT_HEADING}</Text>
          </View>

          <View style={styles.scanButtonContainer}>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={openScanner}
              activeOpacity={0.8}
            >
              <Icon name="qr-code-outline" size={24} color="#fff" />
              <Text style={styles.scanButtonText}>Scan QR Code</Text>
            </TouchableOpacity>
            <Text style={styles.scanHint}>
              Scan the QR code to fetch sample details
            </Text>
          </View>

          {/* {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="green" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              <View>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, { width: 40 }]}>S.No</Text>
                  <Text style={[styles.tableHeaderText, { width: 130 }]}>Industry</Text>
                  <Text style={[styles.tableHeaderText, { width: 120 }]}>Request Date</Text>
                  <Text style={[styles.tableHeaderText, { width: 100 }]}>Sample Id</Text>
                  <Text style={[styles.tableHeaderText, { width: 100 }]}>Guard Pond</Text>
                  <Text style={[styles.tableHeaderText, { width: 120 }]}>Assigned Date</Text>
                  <Text style={[styles.tableHeaderText, { width: 80 }]}>Action</Text>
                </View>

                {data.length > 0 ? (
                  data.map((item, index) => (
                    <View key={index} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { width: 40, textAlign: 'center' }]}>
                        {index + 1}
                      </Text>
                      <Text style={[styles.tableCell, { width: 130 }]}>
                        {item?.discharge_request_industry || '-'}
                      </Text>
                      <Text style={[styles.tableCell, { width: 120 }]}>
                        {item?.discharge_request_date || '-'}
                      </Text>
                      <Text style={[styles.tableCell, { width: 100, textAlign: 'right' }]}>
                        {item?.posting_id || '-'}
                      </Text>
                      <Text style={[styles.tableCell, { width: 100 }]}>
                        {item?.guard_pond_id === 1 || item?.guard_pond_id === '1'
                          ? 'Guard Pond-1'
                          : item?.guard_pond_id === 2 || item?.guard_pond_id === '2'
                          ? 'Guard Pond-2'
                          : item?.guard_pond_id === 3 || item?.guard_pond_id === '3'
                          ? 'Guard Pond-3'
                          : item?.guard_pond_id === 4 || item?.guard_pond_id === '4'
                          ? 'Guard Pond-4'
                          : '-'}
                      </Text>
                      <Text style={[styles.tableCell, { width: 120 }]}>
                        {item?.sample_collection_assigned_date || '-'}
                      </Text>
                      <View style={[styles.tableCell, { width: 80, alignItems: 'center' }]}>
                        <TouchableOpacity
                          style={styles.editIcon}
                          onPress={() => {
                            setScannedPostingId(item?.posting_id);
                            setShowModal(true);
                          }}
                        >
                          <Icon name="create-outline" size={22} color="green" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.noRecords}>
                    <Text style={styles.noRecordsText}>No Records Found</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          )} */}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
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
  scanButtonContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderStyle: 'dashed',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'green',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  scanHint: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
  scannedIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d4edda',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  scannedIdText: {
    fontSize: 14,
    color: '#155724',
    fontWeight: '600',
    marginLeft: 8,
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
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
    paddingVertical: 8,
  },
  tableHeaderText: {
    fontWeight: 'bold',
    paddingHorizontal: 6,
    fontSize: 11,
    color: '#000',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderTopWidth: 0,
    paddingVertical: 8,
    alignItems: 'center',
  },
  tableCell: {
    paddingHorizontal: 6,
    fontSize: 11,
    color: '#000',
  },
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
    width: '95%',
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
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
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
  editIcon: {
    padding: 6,
  },
  noRecords: {
    padding: 20,
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

export default LabAnalysis;