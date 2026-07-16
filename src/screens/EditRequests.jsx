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
  FlatList,
} from 'react-native';
import { useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  commonAPICall,
  CONTEXT_HEADING,
  EDITAPPROVALACTION,
  MARINEDISCHARGEDETAILS,
} from '../utils/utils';

const EditRequests = () => {
  const dispatch = useDispatch();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [selectedPostingId, setSelectedPostingId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const GetData = async () => {
    try {
      setLoading(true);
      const res = await commonAPICall(MARINEDISCHARGEDETAILS, {}, 'get', dispatch);
      if (res.status === 200) {
        setData(res.data.MarineDischargePostingDetails || []);
      } else {
        setData([]);
        Alert.alert('Error', 'Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setData([]);
      Alert.alert('Error', 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  // Handle Approve with confirmation
  const handleApprove = (postingId) => {
    Alert.alert(
      'Confirm Approval',
      'Are you sure you want to approve this request?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes, Approve',
          onPress: () => submitAction(postingId, 2, ''),
          style: 'default',
        },
      ]
    );
  };

  // Handle Reject - open modal
  const handleReject = (postingId) => {
    setSelectedPostingId(postingId);
    setRejectRemarks('');
    setShowRejectModal(true);
  };

  // Submit rejection with remarks
  const handleRejectSubmit = async () => {
    if (!rejectRemarks.trim()) {
      Alert.alert('Warning', 'Please enter rejection remarks');
      return;
    }
    await submitAction(selectedPostingId, 3, rejectRemarks);
    setShowRejectModal(false);
    setRejectRemarks('');
    setSelectedPostingId(null);
  };

  // Common function to submit action
  const submitAction = async (postingId, actionFlag, remarks) => {
    try {
      setActionLoading(true);
      const payload = {
        postingId: postingId,
        actionFlag: actionFlag,
        ...(actionFlag === 3 && { startReadingEditRejectionRemarks: remarks }),
      };

      const res = await commonAPICall(EDITAPPROVALACTION, payload, 'post', dispatch);

      if (res.status === 200) {
        Alert.alert(
          'Success',
          actionFlag === 2 ? 'Request approved successfully!' : 'Request rejected successfully!'
        );
        await GetData();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit action');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    GetData();
  }, []);

  // Format guard pond display
  const getGuardPondName = (id) => {
    const pondMap = {
      '1': 'Guard Pond-1',
      '2': 'Guard Pond-2',
      '3': 'Guard Pond-3',
      '4': 'Guard Pond-4',
    };
    return pondMap[id] || pondMap[String(id)] || '-';
  };

  // Check if buttons should be disabled
  const isButtonDisabled = (flag) => {
    return flag === 2 || flag === 3;
  };

  // Render Rejection Modal
  const renderRejectModal = () => (
    <Modal
      visible={showRejectModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowRejectModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Rejection Remarks</Text>
            <TouchableOpacity onPress={() => setShowRejectModal(false)}>
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.modalLabel}>
              Please provide remarks for rejection:
            </Text>
            <TextInput
              style={styles.textArea}
              multiline
              numberOfLines={4}
              value={rejectRemarks}
              onChangeText={setRejectRemarks}
              placeholder="Enter rejection remarks..."
              textAlignVertical="top"
            />
          </View>
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowRejectModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitRejectButton, !rejectRemarks.trim() && styles.disabledButton]}
              onPress={handleRejectSubmit}
              disabled={!rejectRemarks.trim() || actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitRejectButtonText}>Submit Rejection</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Render Card
  const renderCard = ({ item, index }) => {
    const disabled = isButtonDisabled(item.start_reading_edit_request_flag);

    return (
      <View style={styles.cardItem}>
        <View style={styles.cardHeaderItem}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardIndustry}>{item?.discharge_request_industry || '-'}</Text>
            <View style={styles.cardBadge}>
              <Text style={styles.cardBadgeText}>#{index + 1}</Text>
            </View>
          </View>
          <Text style={styles.cardPond}>{getGuardPondName(item?.guard_pond_id)}</Text>
        </View>

        <View style={styles.cardBodyItem}>
          <View style={styles.cardRow}>
            <View style={styles.cardLabelContainer}>
              <Text style={styles.cardLabel}>Discharge Date</Text>
              <Text style={styles.cardValue}>{item?.discharge_request_date || '-'}</Text>
            </View>
            <View style={styles.cardLabelContainer}>
              <Text style={styles.cardLabel}>TL Name</Text>
              <Text style={styles.cardValue}>{item?.discharge_started_by || '-'}</Text>
            </View>
          </View>

          <View style={styles.cardRow}>
            <View style={styles.cardLabelContainer}>
              <Text style={styles.cardLabel}>Status</Text>
              <View style={[
                styles.statusBadge,
                disabled ? styles.statusCompleted : styles.statusPending
              ]}>
                <Text style={[
                  styles.statusText,
                  disabled ? styles.statusTextCompleted : styles.statusTextPending
                ]}>
                  {disabled ? 'Completed' : 'Pending'}
                </Text>
              </View>
            </View>
            <View style={styles.cardLabelContainer}>
              <Text style={styles.cardLabel}>Request ID</Text>
              <Text style={styles.cardValue}>{item?.posting_id || '-'}</Text>
            </View>
          </View>

          {item?.discharge_request_remarks && (
            <View style={styles.cardRemarksContainer}>
              <Text style={styles.cardLabel}>Remarks</Text>
              <Text style={styles.cardRemarks}>{item?.discharge_request_remarks}</Text>
            </View>
          )}

          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.approveButton, disabled && styles.disabledButton]}
              onPress={() => handleApprove(item?.posting_id)}
              disabled={disabled || actionLoading}
            >
              <Icon name="checkmark-outline" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.rejectButton, disabled && styles.disabledButton]}
              onPress={() => handleReject(item?.posting_id)}
              disabled={disabled || actionLoading}
            >
              <Icon name="close-outline" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderRejectModal()}

      <View>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            <Icon name="list" size={20} color="#000" /> Edit Request
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
  statusCompleted: {
    backgroundColor: '#d4edda',
  },
  statusPending: {
    backgroundColor: '#f8d7da',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextCompleted: {
    color: '#155724',
  },
  statusTextPending: {
    color: '#721c24',
  },
  cardRemarksContainer: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cardRemarks: {
    fontSize: 13,
    color: '#333',
    marginTop: 4,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  approveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
    flex: 0.45,
    justifyContent: 'center',
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d03723',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 6,
    flex: 0.45,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  disabledButton: {
    opacity: 0.5,
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
  modalBody: {
    marginBottom: 15,
  },
  modalLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 15,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  submitRejectButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  submitRejectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default EditRequests;