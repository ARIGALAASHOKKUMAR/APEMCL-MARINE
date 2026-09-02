import React, { useEffect, useState, useRef } from 'react';
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
  FlatList,
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
import TransportRejected from './TrasnportRejected';

const { width, height } = Dimensions.get('window');
const ITEMS_PER_PAGE = 10;

function TransportAcknowledgement({ screenType: propScreenType, path: propPath }) {
  const navigation = useNavigation();
  const route = useRoute();
  const flatListRef = useRef(null);
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [displayData, setDisplayData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
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
        const dataList = res.data.Transport_Vehicle_Selection_Details || [];
        setData(dataList);
        const flattened = flattenData(dataList);
        setFilteredData(flattened);
        updatePagination(flattened);
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

  const flattenData = (dataList) => {
    const flattened = dataList.flatMap((item) => {
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

    return flattened;
  };

  const updatePagination = (dataArray) => {
    const total = Math.ceil(dataArray.length / ITEMS_PER_PAGE);
    setTotalPages(total);
    setCurrentPage(1);
    const start = 0;
    const end = ITEMS_PER_PAGE;
    setDisplayData(dataArray.slice(start, end));
  };

  const handleSearch = (text) => {
    setSearchTerm(text);
    if (text.trim() === "") {
      const flattened = flattenData(data);
      setFilteredData(flattened);
      updatePagination(flattened);
      scrollToTop();
      return;
    }
    const flattened = flattenData(data);
    const filtered = flattened.filter((item) =>
      Object.values(item).some(
        (value) =>
          value &&
          value.toString().toLowerCase().includes(text.toLowerCase())
      )
    );
    setFilteredData(filtered);
    updatePagination(filtered);
    scrollToTop();
  };

  const scrollToTop = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  };

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    setDisplayData(filteredData.slice(start, end));
    requestAnimationFrame(() => {
      scrollToTop();
    });
  };

  const formatStatus = (value) => {
    if (!value) return "-";
    return value.toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  };

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
    if (screen === "rejected") {
      return <TransportRejected />;
    }
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

  // Render Pagination Controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    let pageNumbers = [];
    if (currentPage - 1 >= 1) {
      pageNumbers.push(currentPage - 1);
    }
    pageNumbers.push(currentPage);
    if (currentPage + 1 <= totalPages) {
      pageNumbers.push(currentPage + 1);
    }

    if (pageNumbers.length === 1) {
      if (currentPage < totalPages) {
        pageNumbers.push(currentPage + 1);
        if (currentPage + 2 <= totalPages) {
          pageNumbers.push(currentPage + 2);
        }
      } else if (currentPage > 1) {
        pageNumbers.unshift(currentPage - 1);
        if (currentPage - 2 >= 1) {
          pageNumbers.unshift(currentPage - 2);
        }
      }
    }

    if (pageNumbers.length === 2) {
      if (pageNumbers[pageNumbers.length - 1] < totalPages) {
        pageNumbers.push(pageNumbers[pageNumbers.length - 1] + 1);
      } else if (pageNumbers[0] > 1) {
        pageNumbers.unshift(pageNumbers[0] - 1);
      }
    }

    return (
      <View style={styles.paginationWrapper}>
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            style={[styles.paginationButton, currentPage === 1 && styles.paginationDisabled]}
            onPress={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <Icon name="chevron-left" size={16} color={currentPage === 1 ? "#ccc" : "#2e7d32"} />
            <Text style={[styles.paginationText, currentPage === 1 && styles.paginationTextDisabled]}>Prev</Text>
          </TouchableOpacity>

          {pageNumbers[0] > 1 && (
            <>
              <TouchableOpacity style={styles.paginationNumber} onPress={() => goToPage(1)}>
                <Text style={styles.paginationNumberText}>1</Text>
              </TouchableOpacity>
              {pageNumbers[0] > 2 && <Text style={styles.paginationDots}>...</Text>}
            </>
          )}

          {pageNumbers.map((page) => (
            <TouchableOpacity
              key={page}
              style={[styles.paginationNumber, currentPage === page && styles.paginationNumberActive]}
              onPress={() => goToPage(page)}
            >
              <Text style={[styles.paginationNumberText, currentPage === page && styles.paginationNumberTextActive]}>
                {page}
              </Text>
            </TouchableOpacity>
          ))}

          {pageNumbers[pageNumbers.length - 1] < totalPages && (
            <>
              {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                <Text style={styles.paginationDots}>...</Text>
              )}
              <TouchableOpacity style={styles.paginationNumber} onPress={() => goToPage(totalPages)}>
                <Text style={styles.paginationNumberText}>{totalPages}</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[styles.paginationButton, currentPage === totalPages && styles.paginationDisabled]}
            onPress={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <Text style={[styles.paginationText, currentPage === totalPages && styles.paginationTextDisabled]}>Next</Text>
            <Icon name="chevron-right" size={16} color={currentPage === totalPages ? "#ccc" : "#2e7d32"} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render Card Item
  const renderCardItem = ({ item, index }) => {
    const actualIndex = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;

    if (isManifestList) {
      return (
        <View style={styles.itemCard}>
          <View style={styles.itemCardHeader}>
            <View style={styles.itemCardNumber}>
              <Text style={styles.itemCardNumberText}>{actualIndex}</Text>
            </View>
            <View style={[styles.statusBadge, getStatusBadgeStyle(item.current_status)]}>
              <Icon name={getStatusIcon(item.current_status)} size={12} color="#fff" />
              <Text style={styles.statusBadgeText}>
                {formatStatus(item.current_status) || "-"}
              </Text>
            </View>
          </View>

          <View style={styles.itemCardBody}>
            <View style={styles.itemCardRow}>
              <View style={styles.itemCardCol6}>
                <Text style={styles.itemCardLabel}>Manifest No</Text>
                <Text style={styles.itemCardValue}>{item.manifest_number || "-"}</Text>
              </View>
              <View style={styles.itemCardCol6}>
                <Text style={styles.itemCardLabel}>Date</Text>
                <Text style={styles.itemCardValue}>
                  {item.manifest_generated_on?.split(" ")[0] || "-"}
                </Text>
              </View>
            </View>

            <View style={styles.itemCardRow}>
              <View style={styles.itemCardCol6}>
                <Text style={styles.itemCardLabel}>Waste Type</Text>
                <Text style={styles.itemCardValue}>{item.receiver_type_name || "-"}</Text>
              </View>
              <View style={styles.itemCardCol6}>
                <Text style={styles.itemCardLabel}>Waste Name</Text>
                <Text style={styles.itemCardValue}>{item.waste_type_name || "-"}</Text>
              </View>
            </View>

            <View style={styles.itemCardRow}>
              <View style={styles.itemCardCol6}>
                <Text style={styles.itemCardLabel}>Receiver</Text>
                <Text style={styles.itemCardValue} numberOfLines={1}>
                  {item.receiver_industry_name || "-"}
                </Text>
              </View>
              <View style={styles.itemCardCol6}>
                <Text style={styles.itemCardLabel}>Qty</Text>
                <Text style={styles.itemCardValue}>{item.total_disposal_quantity || "-"}</Text>
              </View>
            </View>

            <View style={styles.itemCardRow}>
              <View style={styles.itemCardCol6}>
                <Text style={styles.itemCardLabel}>Vehicle No</Text>
                <Text style={styles.itemCardValue}>{item.vehicle_registration_number || "-"}</Text>
              </View>
              <View style={styles.itemCardCol6}>
                <Text style={styles.itemCardLabel}>Amount</Text>
                <Text style={styles.itemCardValue}>₹ {item.amount || "-"}</Text>
              </View>
            </View>

            <View style={styles.itemCardRow}>
              <View style={styles.itemCardCol12}>
                <Text style={styles.itemCardLabel}>Trnx No</Text>
                <Text style={styles.itemCardValue}>{item.generator_approval_transaction_number || "-"}</Text>
              </View>
            </View>
          </View>

          <View style={styles.itemCardFooter}>
            {(item.current_status === "Manifest Not Generated" ||
              (item.current_status === "Receiver REJECTED" &&
                item?.admin_redirection_requested !== true)) ? (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleGeneratorView(item)}
              >
                <Icon name="visibility" size={14} color="#fff" />
                <Text style={styles.actionButtonText}>Details</Text>
              </TouchableOpacity>
            ) : (
              <>
                {item.current_status === "Redirection Approved By Admin" ? (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.payButton]}
                    onPress={() => handlePayment(item)}
                  >
                    <Icon name="credit-card" size={14} color="#fff" />
                    <Text style={styles.actionButtonText}>Pay</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleGeneratorView(item)}
                  >
                    <Icon name="visibility" size={14} color="#fff" />
                    <Text style={styles.actionButtonText}>Details</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      );
    }

    // Non-Manifest List View
    return (
      <View style={styles.itemCard}>
        <View style={styles.itemCardHeader}>
          <View style={styles.itemCardNumber}>
            <Text style={styles.itemCardNumberText}>{actualIndex}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.transporter_status) }]}>
            <Icon
              name={item.transporter_status === "ACCEPTED" ? "check-circle" : "info"}
              size={12}
              color="#fff"
            />
            <Text style={styles.statusBadgeText}>
              {formatStatus(item.transporter_status) || "-"}
            </Text>
          </View>
        </View>

        <View style={styles.itemCardBody}>
          <View style={styles.itemCardRow}>
            <View style={styles.itemCardCol6}>
              <Text style={styles.itemCardLabel}>Sender</Text>
              <Text style={styles.itemCardValue} numberOfLines={1}>
                {item.generator_industry_name || "-"}
              </Text>
            </View>
            <View style={styles.itemCardCol6}>
              <Text style={styles.itemCardLabel}>Receiver</Text>
              <Text style={styles.itemCardValue} numberOfLines={1}>
                {item.receiver_industry_name || "-"}
              </Text>
            </View>
          </View>

          <View style={styles.itemCardRow}>
            <View style={styles.itemCardCol6}>
              <Text style={styles.itemCardLabel}>Qty (T)</Text>
              <Text style={styles.itemCardValue}>{item.disposal_quantity || "-"}</Text>
            </View>
            <View style={styles.itemCardCol6}>
              <Text style={styles.itemCardLabel}>KM</Text>
              <Text style={styles.itemCardValue}>{item.total_kms || "-"}</Text>
            </View>
          </View>

          <View style={styles.itemCardRow}>
            <View style={styles.itemCardCol6}>
              <Text style={styles.itemCardLabel}>Vehicle No</Text>
              <Text style={styles.itemCardValue}>{item.vehicle_registration_number || "-"}</Text>
            </View>
            <View style={styles.itemCardCol6}>
              <Text style={styles.itemCardLabel}>Date</Text>
              <Text style={styles.itemCardValue}>
                {item.manifest_generated_on ? item.manifest_generated_on.split(" ")[0] : ""}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.itemCardFooter}>
          <TouchableOpacity
            style={[styles.actionButton, styles.viewButton]}
            onPress={() => handleTransporterView(item)}
          >
            <Text style={styles.actionButtonText}>View</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // List Header Component
  const ListHeaderComponent = () => (
    <>
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          placeholderTextColor="#999"
          value={searchTerm}
          onChangeText={handleSearch}
        />
        {searchTerm !== "" && (
          <TouchableOpacity onPress={() => handleSearch("")}>
            <Icon name="close" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>
    </>
  );

  // List Footer Component
  const ListFooterComponent = () => (
    <>
      {renderPagination()}
      <View style={styles.pageInfoContainer}>
        <Text style={styles.pageInfoText}>
          Page {currentPage} of {totalPages} ({filteredData.length} records)
        </Text>
      </View>
    </>
  );

  // Empty List Component
  const ListEmptyComponent = () => (
    <View style={styles.noDataContainer}>
      <Icon name="info" size={40} color="#856404" />
      <Text style={styles.noDataText}>No Records Found</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#2e7d32" barStyle="light-content" />
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
              <FlatList
                ref={flatListRef}
                data={displayData}
                renderItem={renderCardItem}
                keyExtractor={(item, index) => 
                  (item.waste_disposal_id || item.manifest_number || "") + index.toString()
                }
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                refreshing={refreshing}
                onRefresh={onRefresh}
                ListHeaderComponent={ListHeaderComponent}
                ListFooterComponent={ListFooterComponent}
                ListEmptyComponent={ListEmptyComponent}
                getItemLayout={(data, index) => ({
                  length: 280,
                  offset: 280 * index,
                  index,
                })}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                keyboardShouldPersistTaps="handled"
              />
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
    flex: 1,
  },
  cardHeader: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e8ecf1',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginLeft: 8,
    flex: 1,
    textAlign: 'center',
  },
  cardBody: {
    padding: 10,
    flex: 1,
  },
  panel: {
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e8ecf1',
    borderRadius: 8,
    overflow: 'hidden',
    flex: 1,
  },
  panelHeading: {
    backgroundColor: '#2e7d32',
    padding: 10,
  },
  panelHeadingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  panelBody: {
    padding: 10,
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 13,
    color: '#333',
  },
  listContainer: {
    paddingBottom: 10,
  },
  // Item Card
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e8ecf1',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  itemCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e8ecf1',
  },
  itemCardNumber: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
  },
  itemCardNumberText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  itemCardBody: {
    padding: 12,
  },
  itemCardRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  itemCardCol6: {
    flex: 1,
    paddingHorizontal: 4,
  },
  itemCardCol12: {
    flex: 1,
    paddingHorizontal: 4,
  },
  itemCardLabel: {
    fontSize: 10,
    color: '#888',
    fontWeight: '500',
    marginBottom: 2,
  },
  itemCardValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  itemCardFooter: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: '#e8ecf1',
    backgroundColor: '#fafbfc',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  // Status Badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 10,
    marginLeft: 3,
    fontWeight: '500',
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
  // Action Buttons
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#17a2b8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 4,
  },
  payButton: {
    backgroundColor: '#28a745',
  },
  viewButton: {
    backgroundColor: '#17a2b8',
  },
  // No Data
  noDataContainer: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    borderRadius: 6,
    marginTop: 6,
  },
  noDataText: {
    color: '#856404',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  // Pagination
  paginationWrapper: {
    borderTopWidth: 1,
    borderTopColor: '#e8ecf1',
    paddingVertical: 8,
    marginTop: 4,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'nowrap',
    paddingHorizontal: 4,
  },
  paginationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f5f7fa',
    marginHorizontal: 2,
  },
  paginationDisabled: {
    opacity: 0.5,
  },
  paginationText: {
    fontSize: 11,
    color: '#2e7d32',
    fontWeight: '500',
  },
  paginationTextDisabled: {
    color: '#ccc',
  },
  paginationNumber: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginHorizontal: 2,
    minWidth: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paginationNumberActive: {
    backgroundColor: '#2e7d32',
  },
  paginationNumberText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  paginationNumberTextActive: {
    color: '#fff',
  },
  paginationDots: {
    fontSize: 12,
    color: '#666',
    paddingHorizontal: 2,
  },
  pageInfoContainer: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingBottom: 8,
  },
  pageInfoText: {
    fontSize: 11,
    color: '#888',
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