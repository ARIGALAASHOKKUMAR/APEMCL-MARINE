import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  commonAPICall,
  CONTEXT_HEADING,
  TRANSPORTVEHICLESELECTIONDETAILS,
} from '../utils/utils';
import ManifestConfirmation from './ManifestConfirmation';
import { useDispatch } from 'react-redux';


const { width, height } = Dimensions.get('window');

function TransportAcknowledgement({ screenType: propScreenType, path: propPath }) {
  const navigation = useNavigation();
  const route = useRoute();
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
const dispatch = useDispatch();
  // Get screen type from props or route params
  const screenType = propScreenType || route?.params?.screenType || 'PendingList';
  const path = propPath || route?.params?.path || '';

  let status = "";

  if (screenType === "AcceptedList" || screenType === "Accepted") {
    status = "ACCEPTED";
  } else if (screenType === "PendingList" || screenType === "Pending") {
    status = "PENDING";
  } else if (screenType === "RejectedList" || screenType === "Rejected") {
    status = "REJECTED";
  } else if (screenType === "ManifestList" || screenType === "Manifest") {
    status = "MANIFEST";
  }

  const isManifestList = status === "MANIFEST";
  const id = route?.params?.id || '';

  async function GetInterestedList() {
    setLoading(true);
    try {
      let res = await commonAPICall(TRANSPORTVEHICLESELECTIONDETAILS, {}, "GET", dispatch);
      if (res.status === 200) {
        setData(res.data.Transport_Vehicle_Selection_Details || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    GetInterestedList();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await GetInterestedList();
    setRefreshing(false);
  };

  const flattenedData = data.flatMap((item) => {
    let wasteDetails = [];

    try {
      wasteDetails = JSON.parse(item.waste_details || "[]");
    } catch (err) {
      console.error("Invalid waste_details JSON", err);
    }

    if (isManifestList) {
      return wasteDetails.map((waste) => ({
        ...item,
        ...waste,
      }));
    }

    return wasteDetails
      .filter(() => item.transporter_status === status)
      .map((waste) => ({
        ...item,
        ...waste,
      }));
  });

  const formatStatus = (value) => {
    if (!value) return "-";
    return value.toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  };

  const filteredData = flattenedData?.filter((item) => {
    if (!searchTerm) return true;
    return Object.values(item).some(
      (value) =>
        value &&
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleGeneratorView = (row) => {
    navigation.navigate('GenApprovedList', {
      id: '3',
      data: row,
      key: 'generator',
    });
  };

  const handlePayment = (row) => {
    if (row.current_status === "Redirection Approved By Admin") {
      navigation.navigate('GenApprovedList', {
        id: '2',
        data: row,
        key: 'generator',
      });
    }
  };

  const handleTransporterView = (row) => {
    const isRejected = row.transporter_status?.toUpperCase() === "REJECTED";

    if (isRejected) {
      navigation.navigate('TransportRejected', {
        data: row,
        screen: 'rejected',
      });
    } else {
      navigation.navigate('ManifestConfirmation', {
        data: row,
        screen: 'manifest',
        key: 'transport',
      });
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Manifest Not Generated':
        return styles.statusDefault;
      case 'Transporter PENDING':
      case 'Receiver PENDING':
        return styles.statusPending;
      case 'Manifest Closed':
      case 'Manifest Closed By Admin':
      case 'Redirection Approved By Admin':
        return styles.statusReceived;
      default:
        return styles.statusDefault;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Manifest Not Generated':
        return 'description';
      case 'Transporter PENDING':
      case 'Receiver PENDING':
        return 'access-time';
      case 'Manifest Closed':
      case 'Manifest Closed By Admin':
        return 'check-circle';
      case 'Redirection Approved By Admin':
        return 'check-circle';
      default:
        return 'info';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return '#28a745';
      case 'PENDING':
        return '#ffc107';
      case 'REJECTED':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  // If id is 1, render child component
  if (id === "1") {
    const screen = route?.params?.screen;
    // if (screen === "rejected") {
    //   return <TransportRejected />;
    // }
    return <ManifestConfirmation />;
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2e7d32" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getTitle = () => {
    if (isManifestList) {
      return "Manifest Initiated & Processed List";
    }
    return `Transportation Acknowledgement - ${formatStatus(status)} List`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#2e7d32" barStyle="light-content" />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="list" size={24} color="#2e7d32" />
            <Text style={styles.cardTitle}>{getTitle()}</Text>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.panel}>
              <View style={styles.panelHeading}>
                <Text style={styles.panelHeadingText}>{CONTEXT_HEADING}</Text>
              </View>

              <View style={styles.panelBody}>
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                  <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search..."
                    placeholderTextColor="#999"
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                  />
                  {searchTerm !== "" && (
                    <TouchableOpacity onPress={() => setSearchTerm("")}>
                      <Icon name="close" size={20} color="#999" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.tableContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View>
                      {/* Table Header */}
                      <View style={styles.tableHeader}>
                        <Text style={[styles.headerCell, { width: 50 }]}>S.No</Text>
                        {isManifestList ? (
                          <>
                            <Text style={[styles.headerCell, { width: 100 }]}>Date</Text>
                            <Text style={[styles.headerCell, { width: 120 }]}>Manifest No</Text>
                            <Text style={[styles.headerCell, { width: 120 }]}>Trnx No</Text>
                            <Text style={[styles.headerCell, { width: 100 }]}>Waste Type</Text>
                            <Text style={[styles.headerCell, { width: 120 }]}>Waste Name</Text>
                            <Text style={[styles.headerCell, { width: 150 }]}>Receiver Name</Text>
                            <Text style={[styles.headerCell, { width: 80 }]}>Qty</Text>
                            <Text style={[styles.headerCell, { width: 110 }]}>Vehicle No</Text>
                            <Text style={[styles.headerCell, { width: 80 }]}>Amount</Text>
                            <Text style={[styles.headerCell, { width: 130 }]}>Status</Text>
                            <Text style={[styles.headerCell, { width: 80 }]}>Action</Text>
                          </>
                        ) : (
                          <>
                            <Text style={[styles.headerCell, { width: 100 }]}>
                              {status !== "PENDING" && `${formatStatus(status)} Date`}
                            </Text>
                            <Text style={[styles.headerCell, { width: 150 }]}>Sender Name</Text>
                            <Text style={[styles.headerCell, { width: 150 }]}>Receiver Name</Text>
                            <Text style={[styles.headerCell, { width: 80 }]}>Qty (T)</Text>
                            <Text style={[styles.headerCell, { width: 60 }]}>KM</Text>
                            <Text style={[styles.headerCell, { width: 110 }]}>Vehicle No</Text>
                            <Text style={[styles.headerCell, { width: 100 }]}>Status</Text>
                            <Text style={[styles.headerCell, { width: 80 }]}>Action</Text>
                          </>
                        )}
                      </View>

                      {/* Table Rows */}
                      {filteredData && filteredData.length > 0 ? (
                        filteredData.map((row, index) => (
                          <View key={index} style={styles.tableRow}>
                            <Text style={[styles.rowCell, { width: 50, textAlign: 'center' }]}>
                              {index + 1}
                            </Text>

                            {isManifestList ? (
                              <>
                                <Text style={[styles.rowCell, { width: 100, textAlign: 'center' }]}>
                                  {row.manifest_generated_on?.split(" ")[0] || "-"}
                                </Text>
                                <Text style={[styles.rowCell, { width: 120 }]}>
                                  {row.manifest_number || "-"}
                                </Text>
                                <Text style={[styles.rowCell, { width: 120 }]}>
                                  {row.generator_approval_transaction_number || "-"}
                                </Text>
                                <Text style={[styles.rowCell, { width: 100 }]}>
                                  {row.receiver_type_name || "-"}
                                </Text>
                                <Text style={[styles.rowCell, { width: 120 }]}>
                                  {row.waste_type_name || "-"}
                                </Text>
                                <Text style={[styles.rowCell, { width: 150 }]}>
                                  {row.receiver_industry_name || "-"}
                                </Text>
                                <Text style={[styles.rowCell, { width: 80, textAlign: 'right' }]}>
                                  {row.total_disposal_quantity || "-"}
                                </Text>
                                <Text style={[styles.rowCell, { width: 110 }]}>
                                  {row.vehicle_registration_number || "-"}
                                </Text>
                                <Text style={[styles.rowCell, { width: 80, textAlign: 'right' }]}>
                                  {row.amount || "-"}
                                </Text>
                                <View style={[styles.rowCell, { width: 130 }]}>
                                  <View style={[styles.statusBadge, getStatusBadgeStyle(row.current_status)]}>
                                    <Icon name={getStatusIcon(row.current_status)} size={12} color="#fff" />
                                    <Text style={styles.statusBadgeText}>
                                      {formatStatus(row.current_status) || "-"}
                                    </Text>
                                  </View>
                                </View>
                                <View style={[styles.rowCell, { width: 80 }]}>
                                  {(row.current_status === "Manifest Not Generated" ||
                                    (row.current_status === "Receiver REJECTED" &&
                                      row?.admin_redirection_requested !== true)) ? (
                                    <TouchableOpacity
                                      style={styles.actionButton}
                                      onPress={() => handleGeneratorView(row)}
                                    >
                                      <Icon name="visibility" size={14} color="#fff" />
                                      <Text style={styles.actionButtonText}>Details</Text>
                                    </TouchableOpacity>
                                  ) : (
                                    <>
                                      {row.current_status === "Redirection Approved By Admin" ? (
                                        <TouchableOpacity
                                          style={[styles.actionButton, styles.payButton]}
                                          onPress={() => handlePayment(row)}
                                        >
                                          <Icon name="credit-card" size={14} color="#fff" />
                                          <Text style={styles.actionButtonText}>Pay</Text>
                                        </TouchableOpacity>
                                      ) : (
                                        <TouchableOpacity
                                          style={styles.actionButton}
                                          onPress={() => handleGeneratorView(row)}
                                        >
                                          <Icon name="visibility" size={14} color="#fff" />
                                          <Text style={styles.actionButtonText}>Details</Text>
                                        </TouchableOpacity>
                                      )}
                                    </>
                                  )}
                                </View>
                              </>
                            ) : (
                              <>
                                <Text style={[styles.rowCell, { width: 100, textAlign: 'center' }]}>
                                  {row.manifest_generated_on ? row.manifest_generated_on.split(" ")[0] : ""}
                                </Text>
                                <Text style={[styles.rowCell, { width: 150 }]}>
                                  {row.generator_industry_name || "-"}
                                </Text>
                                <Text style={[styles.rowCell, { width: 150 }]}>
                                  {row.receiver_industry_name || "-"}
                                </Text>
                                <Text style={[styles.rowCell, { width: 80, textAlign: 'right' }]}>
                                  {row.disposal_quantity || "-"}
                                </Text>
                                <Text style={[styles.rowCell, { width: 60, textAlign: 'right' }]}>
                                  {row.total_kms || "-"}
                                </Text>
                                <Text style={[styles.rowCell, { width: 110 }]}>
                                  {row.vehicle_registration_number || "-"}
                                </Text>
                                <View style={[styles.rowCell, { width: 100 }]}>
                                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(row.transporter_status) }]}>
                                    <Icon
                                      name={row.transporter_status === "ACCEPTED" ? "check-circle" : "info"}
                                      size={12}
                                      color="#fff"
                                    />
                                    <Text style={styles.statusBadgeText}>
                                      {formatStatus(row.transporter_status) || "-"}
                                    </Text>
                                  </View>
                                </View>
                                <View style={[styles.rowCell, { width: 80 }]}>
                                  <TouchableOpacity
                                    style={[styles.actionButton, styles.viewButton]}
                                    onPress={() => handleTransporterView(row)}
                                  >
                                    <Text style={styles.actionButtonText}>View</Text>
                                  </TouchableOpacity>
                                </View>
                              </>
                            )}
                          </View>
                        ))
                      ) : (
                        <View style={styles.noDataRow}>
                          <Text style={styles.noDataText}>No Records Found</Text>
                        </View>
                      )}
                    </View>
                  </ScrollView>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e8ecf1',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginLeft: 8,
    flex: 1,
    textAlign: 'center',
  },
  cardBody: {
    padding: 12,
  },
  panel: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e8ecf1',
    borderRadius: 8,
    overflow: 'hidden',
  },
  panelHeading: {
    backgroundColor: '#2e7d32',
    padding: 12,
  },
  panelHeadingText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  panelBody: {
    padding: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e3a5f',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  headerCell: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 4,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 6,
    paddingHorizontal: 4,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  rowCell: {
    fontSize: 11,
    color: '#333',
    paddingHorizontal: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 10,
    marginLeft: 2,
  },
  statusDefault: {
    backgroundColor: '#6c757d',
  },
  statusPending: {
    backgroundColor: '#ffc107',
  },
  statusReceived: {
    backgroundColor: '#28a745',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#17a2b8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 10,
    marginLeft: 2,
  },
  payButton: {
    backgroundColor: '#28a745',
  },
  viewButton: {
    backgroundColor: '#17a2b8',
  },
  noDataRow: {
    padding: 20,
    alignItems: 'center',
  },
  noDataText: {
    color: '#dc3545',
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
});

export default TransportAcknowledgement;