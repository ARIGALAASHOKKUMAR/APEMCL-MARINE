import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import { useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { commonAPICall, GETNOTICES } from '../utils/utils';
import moment from 'moment';

const Notices = () => {
  const dispatch = useDispatch();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);

  const getNotices = async () => {
    
      const res = await commonAPICall(GETNOTICES, {}, 'GET', dispatch);
      console.log("GEE",GETNOTICES);
      
      if (res.status === 200) {
        setNotices(res.data.MarineDischargeNoticeDetails || []);
      } else {
        setNotices([]);
      }
    
  };

  useEffect(() => {
    getNotices();
  }, []);

  // View file function
  const viewFile = (fileUrl) => {
    if (!fileUrl) {
      Alert.alert('Info', 'No file available');
      return;
    }
    // Remove extra quotes if present
    const cleanUrl = fileUrl.replace(/"/g, '');
    Linking.openURL(cleanUrl).catch(() => {
      Alert.alert('Error', 'Failed to open file');
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    if (status === 'NOTICE GENERATED') return '#28a745';
    if (status === 'NOTICE SENT') return '#007bff';
    if (status === 'NOTICE PENDING') return '#ffc107';
    return '#6c757d';
  };

  const getStatusBgColor = (status) => {
    if (status === 'NOTICE GENERATED') return '#d4edda';
    if (status === 'NOTICE SENT') return '#cce5ff';
    if (status === 'NOTICE PENDING') return '#fff3cd';
    return '#e9ecef';
  };

  // Render Card
  const renderCard = ({ item, index }) => {
    return (
      <View style={styles.cardItem}>
        <View style={styles.cardHeaderItem}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Notice #{index + 1}</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusBgColor(item?.notice_status) }
            ]}>
              <Text style={[
                styles.statusText,
                { color: getStatusColor(item?.notice_status) }
              ]}>
                {item?.notice_status || 'Pending'}
              </Text>
            </View>
          </View>
          <Text style={styles.cardIndustry}>{item?.industry_name || '-'}</Text>
        </View>

        <View style={styles.cardBodyItem}>
          <View style={styles.cardRow}>
            
            <View style={styles.cardLabelContainer}>
              <Text style={styles.cardLabel}>Request ID</Text>
              <Text style={styles.cardValue}>{item?.discharge_request_id || '-'}</Text>
            </View>
            <View style={styles.cardLabelContainer}>
              <Text style={styles.cardLabel}>Guard Pond</Text>
              <Text style={styles.cardValue}>{item?.guardpond_name || '-'}</Text>
            </View>
          </View>
          <View style={styles.cardRow}>
            <View style={styles.cardLabelContainer}>
              <Text style={styles.cardLabel}>Discharge Date</Text>
              <Text style={styles.cardValue}>
                {item?.discharge_request_date ? 
                  moment(item.discharge_request_date, 'DD-MM-YYYY HH:mm:ss').format('DD MMM YYYY') : 
                  '-'
                }
              </Text>
            </View>
            <View style={styles.cardLabelContainer}>
              <Text style={styles.cardLabel}>Notice Date</Text>
              <Text style={styles.cardValue}>
                {item?.notice_date ? 
                  moment(item.notice_date, 'DD-MM-YYYY HH:mm:ss').format('DD MMM YYYY HH:mm') : 
                  '-'
                }
              </Text>
            </View>
          </View>

         

          {/* Remarks */}
          {item?.notice_remarks && (
            <View style={styles.remarksContainer}>
              <Text style={styles.cardLabel}>Notice Remarks</Text>
              <Text style={styles.remarksText}>{item?.notice_remarks}</Text>
            </View>
          )}

          {/* Notice Attachment */}
           <View style={{display:"flex",flexDirection:"row",justifyContent:"space-between"}}>
          {item?.notice_attachment && (
            <TouchableOpacity
              style={styles.viewFileButton}
              onPress={() => viewFile(item?.notice_attachment)}
            >
              <Icon name="document-text-outline" size={18} color="#fff" />
              <Text style={styles.viewFileButtonText}>Notice Attachment</Text>
            </TouchableOpacity>
          )}
          {item?.analysis_report_file && (
            <TouchableOpacity
              style={styles.viewFileButton}
              onPress={() => viewFile(item?.analysis_report_file)}
            >
              <Icon name="document-text-outline" size={18} color="#fff" />
              <Text style={styles.viewFileButtonText}>Analaysis Report File</Text>
            </TouchableOpacity>
          )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            <Icon name="notifications-outline" size={20} color="#fff" /> Notices
          </Text>
        </View>

        <View style={styles.cardBody}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text style={styles.loadingText}>Loading notices...</Text>
            </View>
          ) : (
            <FlatList
              data={notices}
              keyExtractor={(item, index) => index.toString()}
              renderItem={renderCard}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Icon name="notifications-off-outline" size={60} color="#ccc" />
                  <Text style={styles.emptyText}>No Notices Found</Text>
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
    backgroundColor: 'green',
    padding: 15,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  cardBody: {
    flex: 1,
    padding: 10,
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
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  cardIndustry: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
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
    marginRight: 4,
  },
  cardLabel: {
    fontSize: 11,
    color: '#6c757d',
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  remarksContainer: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  remarksText: {
    fontSize: 13,
    color: '#333',
    marginTop: 2,
  },
  viewFileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#17a2b8',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  viewFileButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '500',
    marginLeft: 6,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
});

export default Notices;