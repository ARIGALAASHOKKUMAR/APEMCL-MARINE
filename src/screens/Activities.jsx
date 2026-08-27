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
} from 'react-native';
import { useDispatch } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  commonAPICall,
  COMPLETEDISCHARGE,
  CONTEXT_HEADING,
  MARINEDISCHARGEDETAILS,
  STARTDISCHARGE,
  STARTREADINGEDITREQUEST,
} from '../utils/utils';
import ImageBucketRN from '../utils/ImageBucketRN';
import { Picker } from '@react-native-picker/picker';

const Activities = () => {
  const dispatch = useDispatch();
  const [data, setData] = useState([]);
  const [rowData, setRowData] = useState(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // ================= START VALIDATION =================
  // ================= START VALIDATION =================
const startValidationSchema = Yup.object().shape({
  startReading: Yup.string().required('Start Reading is required'),
  marineSealImage: Yup.string().required('Marine Seal Image is required'),
  startFlowMeterImage: Yup.string().required('Flow Meter Image is required'),
  // Flow Meter 2 fields - conditional validation using test
  startReading2: Yup.string().test(
    'startReading2-required',
    'Start Reading 2 is required',
    function(value) {
      const hasSecondFlowMeter = this.options.context?.hasSecondFlowMeter || false;
      if (hasSecondFlowMeter) {
        return value && value.trim().length > 0;
      }
      return true;
    }
  ),
  marineSealImage2: Yup.string().test(
    'marineSealImage2-required',
    'Marine Seal Image 2 is required',
    function(value) {
      const hasSecondFlowMeter = this.options.context?.hasSecondFlowMeter || false;
      if (hasSecondFlowMeter) {
        return value && value.trim().length > 0;
      }
      return true;
    }
  ),
  startFlowMeterImage2: Yup.string().test(
    'startFlowMeterImage2-required',
    'Flow Meter Image 2 is required',
    function(value) {
      const hasSecondFlowMeter = this.options.context?.hasSecondFlowMeter || false;
      if (hasSecondFlowMeter) {
        return value && value.trim().length > 0;
      }
      return true;
    }
  ),
});

// ================= END VALIDATION =================
const endValidationSchema = Yup.object().shape({
  dischargeAction: Yup.string().required('Discharge Type is required'),
  endReading: Yup.string().required('End Reading is required'),
  endFlowMeterImage: Yup.string().required('Flow Meter Image is required'),
  // Flow Meter 2 fields - conditional validation using test
  dischargeAction2: Yup.string().test(
    'dischargeAction2-required',
    'Discharge Type 2 is required',
    function(value) {
      const hasSecondFlowMeter = this.options.context?.hasSecondFlowMeter || false;
      if (hasSecondFlowMeter) {
        return value && value.trim().length > 0;
      }
      return true;
    }
  ),
  endReading2: Yup.string().test(
    'endReading2-required',
    'End Reading 2 is required',
    function(value) {
      const hasSecondFlowMeter = this.options.context?.hasSecondFlowMeter || false;
      if (hasSecondFlowMeter) {
        return value && value.trim().length > 0;
      }
      return true;
    }
  ),
  endFlowMeterImage2: Yup.string().test(
    'endFlowMeterImage2-required',
    'Flow Meter Image 2 is required',
    function(value) {
      const hasSecondFlowMeter = this.options.context?.hasSecondFlowMeter || false;
      if (hasSecondFlowMeter) {
        return value && value.trim().length > 0;
      }
      return true;
    }
  ),
});

  // ================= START FORMIK =================
  const startFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      startReading: rowData?.start_reading || '',
      marineSealImage: null,
      startFlowMeterImage: null,
      startReading2: rowData?.start_reading2 || '',
      marineSealImage2: null,
      startFlowMeterImage2: null,
    },
    validationSchema: startValidationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: (values) => {
      HandleStartSubmit(values);
    },
    context: {
      hasSecondFlowMeter: rowData?.has_second_flow_meter || false,
    },
  });

  // ================= END FORMIK =================
  const endFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      dischargeAction: '',
      endReading: '',
      endFlowMeterImage: null,
      dischargeAction2: '',
      endReading2: '',
      endFlowMeterImage2: null,
    },
    validationSchema: endValidationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: (values) => {
      HandleEndSubmit(values);
    },
    context: {
      hasSecondFlowMeter: rowData?.has_second_flow_meter || false,
    },
  });

  // ================= START SUBMIT =================
  const HandleStartSubmit = async (values) => {
    try {
      setLoading(true);
      const payload = {
        postingId: rowData?.posting_id,
        startReading: values.startReading,
        marineSealImage: values.marineSealImage,
        startFlowMeterImage: values.startFlowMeterImage,
      };

      // Add Flow Meter 2 fields if has_second_flow_meter is true
      if (rowData?.has_second_flow_meter) {
        payload.startReading2 = values.startReading2;
        payload.marineSealImage2 = values.marineSealImage2;
        payload.startFlowMeterImage2 = values.startFlowMeterImage2;
      }

      const res = await commonAPICall(STARTDISCHARGE, payload, 'post', dispatch);
      if (res.status === 200) {
        startFormik.resetForm();
        GetData();
        setShowStartModal(false);
        Alert.alert('Success', 'Start reading submitted successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit start reading');
    } finally {
      setLoading(false);
    }
  };

  // ================= END SUBMIT =================
  const HandleEndSubmit = async (values) => {
    try {
      setLoading(true);
      const payload = {
        postingId: rowData?.posting_id,
        dischargeAction: values.dischargeAction,
        endReading: values.endReading,
        endFlowMeterImage: values.endFlowMeterImage,
      };

      // Add Flow Meter 2 fields if has_second_flow_meter is true
      if (rowData?.has_second_flow_meter) {
        payload.dischargeAction2 = values.dischargeAction2;
        payload.endReading2 = values.endReading2;
        payload.endFlowMeterImage2 = values.endFlowMeterImage2;
      }

      const res = await commonAPICall(COMPLETEDISCHARGE, payload, 'post', dispatch);
      if (res.status === 200) {
        endFormik.resetForm();
        GetData();
        setShowEndModal(false);
        Alert.alert('Success', 'End reading submitted successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit end reading');
    } finally {
      setLoading(false);
    }
  };

  // ================= GET DATA =================
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

  // ================= EDIT REQUEST =================
  const EditRequest = async () => {
    try {
      setLoading(true);
      const payload = {
        postingId: rowData?.posting_id,
        startReadingEditRequestRemarks: 'Incorrect start reading entered. Requesting permission to modify the reading.',
      };
      const res = await commonAPICall(STARTREADINGEDITREQUEST, payload, 'post', dispatch);
      if (res.status === 200) {
        GetData();
        Alert.alert('Success', 'Edit request submitted successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit edit request');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    GetData();
  }, []);

  console.log("| rowData?.start_reading_edit_request_flag",rowData?.start_reading_edit_request_flag);

  // ================= RENDER START MODAL =================
  const renderStartModal = () => (
    <Modal
      visible={showStartModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowStartModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Start Reading</Text>
            <TouchableOpacity onPress={() => setShowStartModal(false)}>
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {/* Flow Meter 1 Section */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Icon name="speedometer-outline" size={22} color="#007AFF" />
                <Text style={styles.sectionTitle}>Flow Meter 1</Text>
              </View>
              <View style={styles.sectionContent}>
                <View style={styles.formGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Start Reading <Text style={styles.star}>*</Text></Text>
                    <TouchableOpacity onPress={EditRequest}>
                      <Icon name="create-outline" size={18} color="#6c757d" />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={[
                      styles.input,
                      startFormik.errors.startReading &&
                        startFormik.touched.startReading &&
                        styles.inputError,
                    ]}
                    placeholder="Enter Start Reading"
                    keyboardType="numeric"
                    value={String(startFormik.values.startReading || '')}
                    onChangeText={startFormik.handleChange('startReading')}
                    onBlur={startFormik.handleBlur('startReading')}
                    editable={rowData?.start_reading === null || rowData?.start_reading === "" || rowData?.start_reading_edit_request_flag === 2}
                  />
                  {startFormik.errors.startReading && startFormik.touched.startReading && (
                    <Text style={styles.errorText}>{startFormik.errors.startReading}</Text>
                  )}
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Marine Seal Image <Text style={styles.star}>*</Text></Text>
                  <TouchableOpacity
                    style={[
                      styles.uploadButton,
                      startFormik.errors.marineSealImage &&
                        startFormik.touched.marineSealImage &&
                        styles.inputError,
                    ]}
                    onPress={() => {
                      const path = 'APEMCL/MARINE/';
                      ImageBucketRN(
                        startFormik,
                        path,
                        'marineSealImage',
                        20971520,
                        'camera',
                        dispatch
                      );
                    }}
                  >
                    <Text style={styles.uploadButtonText}>Upload Marine Seal Image</Text>
                  </TouchableOpacity>
                  {startFormik.values.marineSealImage && (
                    <View style={styles.filePreview}>
                      {startFormik.values.marineSealImage.match(/\.(jpg|jpeg|png)$/i) ? (
                        <Image
                          source={{ uri: startFormik.values.marineSealImage }}
                          style={styles.imagePreview}
                        />
                      ) : startFormik.values.marineSealImage.match(/\.pdf$/i) ? (
                        <TouchableOpacity
                          style={styles.pdfPreview}
                          onPress={() => Linking.openURL(startFormik.values.marineSealImage)}
                        >
                          <Icon name="document-text-outline" size={24} color="red" />
                          <Text style={styles.pdfText}>Download PDF</Text>
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.fileNameText}>{startFormik.values.marineSealImage}</Text>
                      )}
                    </View>
                  )}
                  {startFormik.errors.marineSealImage && startFormik.touched.marineSealImage && (
                    <Text style={styles.errorText}>{startFormik.errors.marineSealImage}</Text>
                  )}
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Flow Meter Image <Text style={styles.star}>*</Text></Text>
                  <TouchableOpacity
                    style={[
                      styles.uploadButton,
                      startFormik.errors.startFlowMeterImage &&
                        startFormik.touched.startFlowMeterImage &&
                        styles.inputError,
                    ]}
                    onPress={() => {
                      const path = 'APEMCL/MARINE/';
                      ImageBucketRN(
                        startFormik,
                        path,
                        'startFlowMeterImage',
                        20971520,
                        'camera',
                        dispatch
                      );
                    }}
                  >
                    <Text style={styles.uploadButtonText}>Upload Flow Meter Image</Text>
                  </TouchableOpacity>
                  {startFormik.values.startFlowMeterImage && (
                    <View style={styles.filePreview}>
                      {startFormik.values.startFlowMeterImage.match(/\.(jpg|jpeg|png)$/i) ? (
                        <Image
                          source={{ uri: startFormik.values.startFlowMeterImage }}
                          style={styles.imagePreview}
                        />
                      ) : startFormik.values.startFlowMeterImage.match(/\.pdf$/i) ? (
                        <TouchableOpacity
                          style={styles.pdfPreview}
                          onPress={() => Linking.openURL(startFormik.values.startFlowMeterImage)}
                        >
                          <Icon name="document-text-outline" size={24} color="red" />
                          <Text style={styles.pdfText}>Download PDF</Text>
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.fileNameText}>{startFormik.values.startFlowMeterImage}</Text>
                      )}
                    </View>
                  )}
                  {startFormik.errors.startFlowMeterImage && startFormik.touched.startFlowMeterImage && (
                    <Text style={styles.errorText}>{startFormik.errors.startFlowMeterImage}</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Flow Meter 2 Section - Conditional */}
            {rowData?.has_second_flow_meter && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Icon name="speedometer-outline" size={22} color="#007AFF" />
                  <Text style={styles.sectionTitle}>Flow Meter 2</Text>
                </View>
                <View style={styles.sectionContent}>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Start Reading 2 <Text style={styles.star}>*</Text></Text>
                    <TextInput
                      style={[
                        styles.input,
                        startFormik.errors.startReading2 &&
                          startFormik.touched.startReading2 &&
                          styles.inputError,
                      ]}
                      placeholder="Enter Start Reading 2"
                      keyboardType="numeric"
                      value={String(startFormik.values.startReading2 || '')}
                      onChangeText={startFormik.handleChange('startReading2')}
                      onBlur={startFormik.handleBlur('startReading2')}
                    />
                    {startFormik.errors.startReading2 && startFormik.touched.startReading2 && (
                      <Text style={styles.errorText}>{startFormik.errors.startReading2}</Text>
                    )}
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Marine Seal Image 2 <Text style={styles.star}>*</Text></Text>
                    <TouchableOpacity
                      style={[
                        styles.uploadButton,
                        startFormik.errors.marineSealImage2 &&
                          startFormik.touched.marineSealImage2 &&
                          styles.inputError,
                      ]}
                      onPress={() => {
                        const path = 'APEMCL/MARINE/';
                        ImageBucketRN(
                          startFormik,
                          path,
                          'marineSealImage2',
                          20971520,
                          'camera',
                          dispatch
                        );
                      }}
                    >
                      <Text style={styles.uploadButtonText}>Upload Marine Seal Image 2</Text>
                    </TouchableOpacity>
                    {startFormik.values.marineSealImage2 && (
                      <View style={styles.filePreview}>
                        {startFormik.values.marineSealImage2.match(/\.(jpg|jpeg|png)$/i) ? (
                          <Image
                            source={{ uri: startFormik.values.marineSealImage2 }}
                            style={styles.imagePreview}
                          />
                        ) : startFormik.values.marineSealImage2.match(/\.pdf$/i) ? (
                          <TouchableOpacity
                            style={styles.pdfPreview}
                            onPress={() => Linking.openURL(startFormik.values.marineSealImage2)}
                          >
                            <Icon name="document-text-outline" size={24} color="red" />
                            <Text style={styles.pdfText}>Download PDF</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={styles.fileNameText}>{startFormik.values.marineSealImage2}</Text>
                        )}
                      </View>
                    )}
                    {startFormik.errors.marineSealImage2 && startFormik.touched.marineSealImage2 && (
                      <Text style={styles.errorText}>{startFormik.errors.marineSealImage2}</Text>
                    )}
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Flow Meter Image 2 <Text style={styles.star}>*</Text></Text>
                    <TouchableOpacity
                      style={[
                        styles.uploadButton,
                        startFormik.errors.startFlowMeterImage2 &&
                          startFormik.touched.startFlowMeterImage2 &&
                          styles.inputError,
                      ]}
                      onPress={() => {
                        const path = 'APEMCL/MARINE/';
                        ImageBucketRN(
                          startFormik,
                          path,
                          'startFlowMeterImage2',
                          20971520,
                          'camera',
                          dispatch
                        );
                      }}
                    >
                      <Text style={styles.uploadButtonText}>Upload Flow Meter Image 2</Text>
                    </TouchableOpacity>
                    {startFormik.values.startFlowMeterImage2 && (
                      <View style={styles.filePreview}>
                        {startFormik.values.startFlowMeterImage2.match(/\.(jpg|jpeg|png)$/i) ? (
                          <Image
                            source={{ uri: startFormik.values.startFlowMeterImage2 }}
                            style={styles.imagePreview}
                          />
                        ) : startFormik.values.startFlowMeterImage2.match(/\.pdf$/i) ? (
                          <TouchableOpacity
                            style={styles.pdfPreview}
                            onPress={() => Linking.openURL(startFormik.values.startFlowMeterImage2)}
                          >
                            <Icon name="document-text-outline" size={24} color="red" />
                            <Text style={styles.pdfText}>Download PDF</Text>
                          </TouchableOpacity>
                        ) : (
                          <Text style={styles.fileNameText}>{startFormik.values.startFlowMeterImage2}</Text>
                        )}
                      </View>
                    )}
                    {startFormik.errors.startFlowMeterImage2 && startFormik.touched.startFlowMeterImage2 && (
                      <Text style={styles.errorText}>{startFormik.errors.startFlowMeterImage2}</Text>
                    )}
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.submitButton}
              onPress={startFormik.handleSubmit}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // ================= RENDER END MODAL =================
  const renderEndModal = () => (
    <Modal
      visible={showEndModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowEndModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>End Reading</Text>
            <TouchableOpacity onPress={() => setShowEndModal(false)}>
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {/* Start Reading Display */}
            <View style={styles.startReadingDisplay}>
              <View style={styles.startReadingRow}>
                <Text style={styles.startReadingLabel}>Start Reading 1:</Text>
                <Text style={styles.startReadingValue}>{rowData?.start_reading || '-'}</Text>
              </View>
            </View>

            {rowData?.has_second_flow_meter && (
              <View style={styles.startReadingDisplay}>
                <View style={styles.startReadingRow}>
                  <Text style={styles.startReadingLabel}>Start Reading 2:</Text>
                  <Text style={styles.startReadingValue}>{rowData?.start_reading2 || '-'}</Text>
                </View>
              </View>
            )}

            {/* Discharge Type for Flow Meter 1 */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Discharge Type 1 <Text style={styles.star}>*</Text></Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={endFormik.values.dischargeAction}
                  onValueChange={(itemValue) => {
                    endFormik.setFieldValue('dischargeAction', itemValue);
                    endFormik.setFieldTouched('dischargeAction', true);
                  }}
                  style={styles.picker}
                  dropdownIconColor="#666"
                >
                  <Picker.Item label="Select" value="" />
                  <Picker.Item label="Completed" value="1" />
                  <Picker.Item label="Continue to Next day" value="2" />
                  <Picker.Item label="Abort" value="3" />
                </Picker>
              </View>
              {endFormik.errors.dischargeAction && endFormik.touched.dischargeAction && (
                <Text style={styles.errorText}>{endFormik.errors.dischargeAction}</Text>
              )}
            </View>

            {/* Flow Meter 1 Section */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeader}>
                <Icon name="speedometer-outline" size={22} color="#007AFF" />
                <Text style={styles.sectionTitle}>Flow Meter 1</Text>
              </View>
              <View style={styles.sectionContent}>
                <View style={styles.formGroup}>
                  <Text style={styles.label}>End Reading <Text style={styles.star}>*</Text></Text>
                  <TextInput
                    style={[
                      styles.input,
                      endFormik.errors.endReading &&
                        endFormik.touched.endReading &&
                        styles.inputError,
                    ]}
                    placeholder="Enter End Reading"
                    keyboardType="numeric"
                    value={endFormik.values.endReading}
                    onChangeText={endFormik.handleChange('endReading')}
                    onBlur={endFormik.handleBlur('endReading')}
                  />
                  {endFormik.errors.endReading && endFormik.touched.endReading && (
                    <Text style={styles.errorText}>{endFormik.errors.endReading}</Text>
                  )}
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Flow Meter Image <Text style={styles.star}>*</Text></Text>
                  <TouchableOpacity
                    style={[
                      styles.uploadButton,
                      endFormik.errors.endFlowMeterImage &&
                        endFormik.touched.endFlowMeterImage &&
                        styles.inputError,
                    ]}
                    onPress={() => {
                      const path = 'APEMCL/MARINE/';
                      ImageBucketRN(
                        endFormik,
                        path,
                        'endFlowMeterImage',
                        20971520,
                        'camera',
                        dispatch
                      );
                    }}
                  >
                    <Text style={styles.uploadButtonText}>Upload Flow Meter Image</Text>
                  </TouchableOpacity>
                  {endFormik.values.endFlowMeterImage && (
                    <View style={styles.filePreview}>
                      {endFormik.values.endFlowMeterImage.match(/\.(jpg|jpeg|png)$/i) ? (
                        <Image
                          source={{ uri: endFormik.values.endFlowMeterImage }}
                          style={styles.imagePreview}
                        />
                      ) : endFormik.values.endFlowMeterImage.match(/\.pdf$/i) ? (
                        <TouchableOpacity
                          style={styles.pdfPreview}
                          onPress={() => Linking.openURL(endFormik.values.endFlowMeterImage)}
                        >
                          <Icon name="document-text-outline" size={24} color="red" />
                          <Text style={styles.pdfText}>Download PDF</Text>
                        </TouchableOpacity>
                      ) : (
                        <Text style={styles.fileNameText}>{endFormik.values.endFlowMeterImage}</Text>
                      )}
                    </View>
                  )}
                  {endFormik.errors.endFlowMeterImage && endFormik.touched.endFlowMeterImage && (
                    <Text style={styles.errorText}>{endFormik.errors.endFlowMeterImage}</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Flow Meter 2 Section - Conditional */}
            {rowData?.has_second_flow_meter && (
              <>
                {/* Discharge Type for Flow Meter 2 */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Discharge Type 2 <Text style={styles.star}>*</Text></Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={endFormik.values.dischargeAction2}
                      onValueChange={(itemValue) => {
                        endFormik.setFieldValue('dischargeAction2', itemValue);
                        endFormik.setFieldTouched('dischargeAction2', true);
                      }}
                      style={styles.picker}
                      dropdownIconColor="#666"
                    >
                      <Picker.Item label="Select" value="" />
                      <Picker.Item label="Completed" value="1" />
                      <Picker.Item label="Continue to Next day" value="2" />
                      <Picker.Item label="Abort" value="3" />
                    </Picker>
                  </View>
                  {endFormik.errors.dischargeAction2 && endFormik.touched.dischargeAction2 && (
                    <Text style={styles.errorText}>{endFormik.errors.dischargeAction2}</Text>
                  )}
                </View>

                <View style={styles.sectionContainer}>
                  <View style={styles.sectionHeader}>
                    <Icon name="speedometer-outline" size={22} color="#007AFF" />
                    <Text style={styles.sectionTitle}>Flow Meter 2</Text>
                  </View>
                  <View style={styles.sectionContent}>
                    <View style={styles.formGroup}>
                      <Text style={styles.label}>End Reading 2 <Text style={styles.star}>*</Text></Text>
                      <TextInput
                        style={[
                          styles.input,
                          endFormik.errors.endReading2 &&
                            endFormik.touched.endReading2 &&
                            styles.inputError,
                        ]}
                        placeholder="Enter End Reading 2"
                        keyboardType="numeric"
                        value={endFormik.values.endReading2}
                        onChangeText={endFormik.handleChange('endReading2')}
                        onBlur={endFormik.handleBlur('endReading2')}
                      />
                      {endFormik.errors.endReading2 && endFormik.touched.endReading2 && (
                        <Text style={styles.errorText}>{endFormik.errors.endReading2}</Text>
                      )}
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.label}>Flow Meter Image 2 <Text style={styles.star}>*</Text></Text>
                      <TouchableOpacity
                        style={[
                          styles.uploadButton,
                          endFormik.errors.endFlowMeterImage2 &&
                            endFormik.touched.endFlowMeterImage2 &&
                            styles.inputError,
                        ]}
                        onPress={() => {
                          const path = 'APEMCL/MARINE/';
                          ImageBucketRN(
                            endFormik,
                            path,
                            'endFlowMeterImage2',
                            20971520,
                            'camera',
                            dispatch
                          );
                        }}
                      >
                        <Text style={styles.uploadButtonText}>Upload Flow Meter Image 2</Text>
                      </TouchableOpacity>
                      {endFormik.values.endFlowMeterImage2 && (
                        <View style={styles.filePreview}>
                          {endFormik.values.endFlowMeterImage2.match(/\.(jpg|jpeg|png)$/i) ? (
                            <Image
                              source={{ uri: endFormik.values.endFlowMeterImage2 }}
                              style={styles.imagePreview}
                            />
                          ) : endFormik.values.endFlowMeterImage2.match(/\.pdf$/i) ? (
                            <TouchableOpacity
                              style={styles.pdfPreview}
                              onPress={() => Linking.openURL(endFormik.values.endFlowMeterImage2)}
                            >
                              <Icon name="document-text-outline" size={24} color="red" />
                              <Text style={styles.pdfText}>Download PDF</Text>
                            </TouchableOpacity>
                          ) : (
                            <Text style={styles.fileNameText}>{endFormik.values.endFlowMeterImage2}</Text>
                          )}
                        </View>
                      )}
                      {endFormik.errors.endFlowMeterImage2 && endFormik.touched.endFlowMeterImage2 && (
                        <Text style={styles.errorText}>{endFormik.errors.endFlowMeterImage2}</Text>
                      )}
                    </View>
                  </View>
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.submitButton}
              onPress={endFormik.handleSubmit}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Submit</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // ================= RENDER CARD =================
  const renderCard = ({ item, index }) => {
    const hasStartReading = item?.start_reading !== null && item?.start_reading !== undefined;
    const hasEndReading = item?.end_reading !== null && item?.end_reading !== undefined;
    const hasMarineSealImage = item?.marine_seal_image !== null && item?.marine_seal_image !== undefined;
    const isCompleted = hasStartReading && hasEndReading;
    const isStarted = hasStartReading && !hasEndReading;

    const totalDischarged = hasStartReading && hasEndReading
      ? (Number(item.end_reading || 0) - Number(item.start_reading || 0)).toFixed(2)
      : '-';

    const getGuardPondName = (id) => {
      const pondMap = {
        '1': 'Guard Pond-1',
        '2': 'Guard Pond-2',
        '3': 'Guard Pond-3',
        '4': 'Guard Pond-4',
      };
      return pondMap[id] || pondMap[String(id)] || '-';
    };

    const getStatusText = () => {
      if (isCompleted) return 'Completed';
      if (isStarted) return 'In Progress';
      return 'Pending';
    };

    const getStatusColor = () => {
      if (isCompleted) return '#28a745';
      if (isStarted) return '#ffc107';
      return '#dc3545';
    };

    const getStatusBgColor = () => {
      if (isCompleted) return '#d4edda';
      if (isStarted) return '#fff3cd';
      return '#f8d7da';
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
          <Text style={styles.cardPond}>{item?.guardpond_name}</Text>
        </View>

        <View style={styles.cardBodyItem}>
          <View style={styles.cardRow}>
            <View style={styles.cardLabelContainer}>
              <Text style={styles.cardLabel}>Discharge Date</Text>
              <Text style={styles.cardValue}>{item?.discharge_request_date?.split(' ')[0] || '-'}</Text>
            </View>
            <View style={styles.cardLabelContainer}>
              <Text style={styles.cardLabel}>Status</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor() }]}>
                <Text style={[styles.statusText, { color: getStatusColor() }]}>
                  {getStatusText()}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.cardRow}>
            <View style={styles.cardLabelContainer}>
              <Text style={styles.cardLabel}>Start Reading</Text>
              <Text style={styles.cardValue}>{item?.start_reading || '-'}</Text>
            </View>
            <View style={styles.cardLabelContainer}>
              <Text style={styles.cardLabel}>End Reading</Text>
              <Text style={styles.cardValue}>{item?.end_reading || '-'}</Text>
            </View>
          </View>

          <View style={styles.totalQtyContainer}>
            <Text style={styles.totalQtyLabel}>Total Quantity Discharged</Text>
            <Text style={styles.totalQtyValue}>{totalDischarged}</Text>
          </View>

          <View style={styles.cardActions}>
            {isCompleted ? (
              <View style={styles.completedContainer}>
                <Icon name="checkmark-circle" size={20} color="#28a745" />
                <Text style={styles.completedText}>Completed</Text>
              </View>
            ) : (
              <View style={styles.buttonRow}>
                {!item.marine_seal_image ? (
                  <TouchableOpacity
                    style={[styles.actionButton]}
                    onPress={() => {
                      setShowStartModal(true);
                      setRowData(item);
                    }}
                  >
                    <Text style={styles.arrowButtonText}>→</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionButton]}
                    onPress={() => {
                      setShowEndModal(true);
                      setRowData(item);
                    }}
                    disabled={!isStarted}
                  >
                    <Text style={styles.arrowButtonText}>→</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderStartModal()}
      {renderEndModal()}

      <View>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            <Icon name="list" size={20} color="#000" /> Activities
          </Text>
        </View>

        <View style={styles.cardBody}>
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
    marginBottom: 8,
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
  totalQtyContainer: {
    backgroundColor: '#e8f4fd',
    padding: 10,
    borderRadius: 6,
    marginVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalQtyLabel: {
    fontSize: 12,
    color: '#495057',
    fontWeight: '500',
  },
  totalQtyValue: {
    fontSize: 16,
    color: 'green',
    fontWeight: 'bold',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: "green",
    borderRadius: 50,
    width: 40,
    height: 40,
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },
  completedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  arrowButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: "center",
    display: "flex",
    alignItems: "center",
    marginBottom: 5
  },
  completedText: {
    color: '#28a745',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
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
    width: '90%',
    maxHeight: '90%',
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
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
  startReadingDisplay: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  startReadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  startReadingLabel: {
    fontSize: 14,
    color: '#666',
  },
  startReadingValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0d6efd',
  },
  flowMeterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  flowMeterContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    alignItems: 'center',
  },
  flowMeterText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  flowMeterName: {
    fontWeight: 'bold',
    color: '#333',
  },
  pickerContainer: {
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
  // Section Styles
  sectionContainer: {
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#e9ecef',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  sectionContent: {
    padding: 15,
    backgroundColor: '#ffffff',
  },
  divider: {
    height: 1,
    backgroundColor: '#dee2e6',
    marginVertical: 20,
  },
});

export default Activities;