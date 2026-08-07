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
  Platform,
  FlatList,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import moment from 'moment';
import Icon from 'react-native-vector-icons/Ionicons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  ASSIGNDISCHARGEDUTY,
  commonAPICall,
  CONTEXT_HEADING,
  DISCHARGEFILTERFLAG,
  MARINEDISCHARGEDETAILS,
} from '../utils/utils';

const DischargeSummary = () => {
  const dispatch = useDispatch();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [rowData, setRowData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState(0); // 'all', 'assigned', 'pending'

  // Validation Schema
  const validationSchema = Yup.object({
    dischargeAssignedTeamLeaderId: Yup.string().required('Required'),
    dischargeAssignedDate: Yup.string().required('Required'),
  });

  // Formik instance
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
        GetData();
        setShowModal(false);
        Alert.alert('Success', 'Duty assigned successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to assign duty');
    } finally {
      setLoading(false);
    }
  };

  

  

  // Handle Date Change
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || tempDate;
    setShowDatePicker(Platform.OS === 'ios');
    setTempDate(currentDate);
    
    const formattedDate = currentDate.toISOString().split('T')[0];
    formik.setFieldValue('dischargeAssignedDate', formattedDate);
  };

  // Filter Data
  const filterData = async(id) => {
    const res = await commonAPICall(DISCHARGEFILTERFLAG+id,{},"get",dispatch)
    if(res.status === 200){
      setData(res.data.MarineDischargeSummary)
    }
    else{
      setData([])
    }
    setActiveFilter(id)
  };

  useEffect(() => {
    filterData(0);
  }, []);

  // Get Assigned and Pending Counts
  const getAssignedCount = () => data.filter(item => item?.discharge_assigned_team_leader_id !== null).length;
  const getPendingCount = () => data.filter(item => item?.discharge_assigned_team_leader_id === null).length;

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
              <Text style={styles.label}>
                Team Leader <Text style={styles.star}>*</Text>
              </Text>
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
              <Text style={styles.label}>
                Assigning Date <Text style={styles.star}>*</Text>
              </Text>
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

  // Render Card

  const userId = useSelector((state)=>state.LoginReducer.userId)
    const state = useSelector((state)=>state.LoginReducer)

  const renderCard = ({ item, index }) => {
    const isAssigned = item?.discharge_assigned_team_leader_id !== null;

    console.log("tem?.discharge_assigned_team_leader_id ",item?.discharge_assigned_team_leader_id );
    

    return (
      <View style={styles.cardItem}>
        <View style={styles.cardHeaderItem}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardIndustry}>{item?.discharge_request_industry || '-'}</Text>
            <View style={[
              styles.statusBadge,
              isAssigned ? styles.statusAssigned : styles.statusPending
            ]}>
              <Text style={[
                styles.statusText,
                isAssigned ? styles.statusTextAssigned : styles.statusTextPending
              ]}>
                {item.current_status}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cardBodyItem}>
          {/* Row 1: Collected Date, Analysis Date, Guard Pond */}
          <View style={styles.cardRow}>
            <View style={styles.cardLabelContainer}>
              <Text style={styles.cardLabel}>📅 Collected Date</Text>
              <Text style={styles.cardValue}>{item?.sample_collected_date?.split(' ')[0] || '-'}</Text>
            </View>
            <View style={styles.cardLabelContainer}>
              <Text style={styles.cardLabel}>🔬 Analysis Date</Text>
              <Text style={styles.cardValue}>{item?.analysis_date?.split(' ')[0] || '-'}</Text>
            </View>
            <View style={styles.cardLabelContainer}>
              <Text style={styles.cardLabel}>🏊 Guard Pond</Text>
              <Text style={styles.cardValue}>
                {item?.guardpond_name}
              </Text>
            </View>
          </View>

          {/* Row 2: Parameters - 5 per row */}
          <View style={styles.parameterGrid}>
            <View style={styles.parameterItem}>
              <Text style={styles.parameterLabel}>TDS</Text>
              <Text style={styles.parameterValue}>{item?.tds_value || '-'}</Text>
            </View>
            <View style={styles.parameterItem}>
              <Text style={styles.parameterLabel}>TSS</Text>
              <Text style={styles.parameterValue}>{item?.tss_value || '-'}</Text>
            </View>
            <View style={styles.parameterItem}>
              <Text style={styles.parameterLabel}>COD</Text>
              <Text style={styles.parameterValue}>{item?.cod_value || '-'}</Text>
            </View>
            <View style={styles.parameterItem}>
              <Text style={styles.parameterLabel}>PH</Text>
              <Text style={styles.parameterValue}>{item?.ph_value || '-'}</Text>
            </View>
            <View style={styles.parameterItem}>
              <Text style={styles.parameterLabel}>Fluoride</Text>
              <Text style={styles.parameterValue}>{item?.fluoride_value || '-'}</Text>
            </View>
            <View style={styles.parameterItem}>
              <Text style={styles.parameterLabel}>Phenols</Text>
              <Text style={styles.parameterValue}>{item?.phenols_value || '-'}</Text>
            </View>
            <View style={styles.parameterItem}>
              <Text style={styles.parameterLabel}>Phosphate</Text>
              <Text style={styles.parameterValue}>{item?.ortho_phosphate_value || '-'}</Text>
            </View>
            <View style={styles.parameterItem}>
              <Text style={styles.parameterLabel}>Nitrate</Text>
              <Text style={styles.parameterValue}>{item?.nitrate_nitrogen_value || '-'}</Text>
            </View>
            <View style={styles.parameterItem}>
              <Text style={styles.parameterLabel}>Ammonical</Text>
              <Text style={styles.parameterValue}>{item?.ammonical_nitrogen_value || '-'}</Text>
            </View>
            <View style={styles.parameterItem}>
              <Text style={styles.parameterLabel}>Chromium</Text>
              <Text style={styles.parameterValue}>{item?.hexavalent_chromium_value || '-'}</Text>
            </View>
          </View>
{userId!=="TEAML"&&state.roleId!==2&&(  <View style={[styles.cardActions]}>
            {isAssigned &&activeFilter!==2? (
              <TouchableOpacity style={styles.disabledButton} disabled>
                <Icon name="checkmark-circle" size={16} color="#fff" />
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
                <Icon name="person-add-outline" size={16} color="#fff" />
                <Text style={styles.assignButtonText}>{activeFilter === 2?"Re Assign Duty":"Assign Duty"}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.noticeButton}>
              <Icon name="notifications-outline" size={16} color="#000" />
              <Text style={styles.noticeButtonText}>Notice</Text>
            </TouchableOpacity>
          </View>)}
        
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderAssignDutyModal()}

      <View>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            <Icon name="list" size={20} color="#000" /> Discharge Summary
          </Text>
        </View>

        <View style={styles.cardBody}>
          {/* Filter Section */}
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === 0 && styles.filterButtonActive
              ]}
              onPress={() => filterData(0)}
            >
              <Text style={[
                styles.filterButtonText,
                activeFilter === 0 && styles.filterButtonTextActive
              ]}>
                All 
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === 3&& styles.filterButtonActive
              ]}
              onPress={() => filterData(3)}
            >
              <Text style={[
                styles.filterButtonText,
                activeFilter === 3 && styles.filterButtonTextActive
              ]}>
                Completed 
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === 1 && styles.filterButtonActive
              ]}
              onPress={() => filterData(1)}
            >
              <Text style={[
                styles.filterButtonText,
                activeFilter === 1 && styles.filterButtonTextActive
              ]}>
                Pending 
              </Text>
            </TouchableOpacity>
            {userId!=="TEAML"&&(
<TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === 2 && styles.filterButtonActive
              ]}
              onPress={() => filterData(2)}
            >
              <Text style={[
                styles.filterButtonText,
                activeFilter === 2 && styles.filterButtonTextActive
              ]}>
                Continue 
              </Text>
            </TouchableOpacity>
            )}
              
          </View>

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
                  <Icon name="document-text-outline" size={50} color="#ccc" />
                  <Text style={styles.noRecordsText}>No Records Found</Text>
                  <Text style={styles.noRecordsSubText}>
                    {activeFilter === 'all' 
                      ? 'No records available' 
                      : activeFilter === 'assigned' 
                      ? 'No assigned records' 
                      : 'No pending records'}
                  </Text>
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
  cardHeader: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  cardBody: {
    flex: 1,
    padding: 10,
  },
  // Filter Styles
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  filterButtonActive: {
    backgroundColor: 'green',
    borderColor: 'green',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6c757d',
  },
  filterButtonTextActive: {
    color: '#fff',
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
  cardBodyItem: {
    padding: 12,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardLabelContainer: {
    flex: 1,
    marginHorizontal: 2,
  },
  cardLabel: {
    fontSize: 11,
    color: '#6c757d',
    marginBottom: 2,
    fontWeight: '500',
  },
  cardValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusAssigned: {
    backgroundColor: '#d4edda',
  },
  statusPending: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 12,
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
    marginTop: 8,
    marginBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 10,
  },
  parameterItem: {
    width: '20%', // 5 items per row
    paddingVertical: 4,
    alignItems: 'center',
  },
  parameterLabel: {
    fontSize: 9,
    color: '#6c757d',
    textAlign: 'center',
    fontWeight: '500',
  },
  parameterValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '700',
    textAlign: 'center',
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
    backgroundColor: '#28a745',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 0.45,
    justifyContent: 'center',
  },
  assignButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
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
  noticeButtonText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  disabledButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6c757d',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 0.45,
    justifyContent: 'center',
  },
  disabledButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
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
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 12,
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
  noRecords: {
    padding: 40,
    alignItems: 'center',
  },
  noRecordsText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
  },
  noRecordsSubText: {
    color: '#999',
    fontSize: 13,
    marginTop: 4,
  },
});

export default DischargeSummary;