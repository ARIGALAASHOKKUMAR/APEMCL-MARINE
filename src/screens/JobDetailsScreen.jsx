import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useDispatch } from "react-redux";
import { commonAPICall, JOBAPPLY } from "../utils/utils";
import { hideModal } from "../actions";

const JobDetailsCard = ({ data, handleSearch,from }) => {
  const dispatch = useDispatch();
  
  const ApplyJob = async (id) => {
    const response = await commonAPICall(
      JOBAPPLY,
      {
        jobPostingId: data.jobpostingid,
      },
      "post",
      dispatch,
    );
    if (response.status === 200) {
      dispatch(hideModal());
      if (handleSearch && typeof handleSearch === "function") {
        handleSearch();
      }
    }
  };

  // Parse JSON strings if they're strings
  const parseJsonField = (field) => {
    if (typeof field === "string") {
      try {
        return JSON.parse(field);
      } catch (e) {
        return field;
      }
    }
    return field;
  };

  // Parse facilities and jobcategories
  const facilities = parseJsonField(data.facilities);
  const jobcategories = parseJsonField(data.jobcategories);

  // Parse address components from the address string
  const parseAddress = (addressString) => {
    if (!addressString) return {};

    const parts = {};
    const addressParts = addressString.split(", ");

    addressParts.forEach((part) => {
      if (part.includes("Door No:")) {
        parts.doorNo = part.replace("Door No:", "").trim();
      } else if (part.includes("District:")) {
        parts.district = part.replace("District:", "").trim();
      } else if (part.includes("Mandal:")) {
        parts.mandal = part.replace("Mandal:", "").trim();
      } else if (part.includes("Village:")) {
        parts.village = part.replace("Village:", "").trim();
      } else if (part.includes("Landmark:")) {
        parts.landmark = part.replace("Landmark:", "").trim();
      } else if (part.includes("Pincode:")) {
        parts.pincode = part.replace("Pincode:", "").trim();
      }
    });

    return parts;
  };

  const addressParts = parseAddress(data.address);

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return "₹0";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Get status details
  const getStatusDetails = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { color: '#FF9800', icon: 'access-time', text: 'Application Pending' };
      case 'reviewed':
        return { color: '#2196F3', icon: 'visibility', text: 'Application Reviewed' };
      case 'shortlisted':
        return { color: '#4CAF50', icon: 'star', text: 'Shortlisted' };
      case 'rejected':
        return { color: '#F44336', icon: 'cancel', text: 'Not Selected' };
      case 'hired':
        return { color: '#9C27B0', icon: 'check-circle', text: 'Hired' };
      default:
        return { color: '#666', icon: 'pending', text: 'Application Submitted' };
    }
  };

  const statusDetails = getStatusDetails(data.applicationStatus);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>{data.jobtitle || "Job Title"}</Text>
          <View style={styles.timeBadge}>
            <Icon name="access-time" size={14} color="#fff" />
            <Text style={styles.timeText}>
              {data.jobpostedtime || "Recently"}
            </Text>
          </View>
        </View>

        {/* Salary Section */}
        <View style={styles.salaryCard}>
          <Text style={styles.salaryAmount}>
            {formatCurrency(data.workrateperday)}
            <Text style={styles.salaryUnit}>/day</Text>
          </Text>
          <Text style={styles.workType}>
            {data.preferredworktype || "Daily Wages"}
          </Text>
        </View>

        {/* Application Status Card - Only show if applied */}
        {data.isapplied && (
          <View style={[styles.statusCard, { backgroundColor: statusDetails.color + '10', borderColor: statusDetails.color + '30' }]}>
            <Icon name={statusDetails.icon} size={28} color={statusDetails.color} />
            <View style={styles.statusContent}>
              <Text style={[styles.statusTitle, { color: statusDetails.color }]}>
                Application Status
              </Text>
              <Text style={[styles.statusValue, { color: statusDetails.color }]}>
                {statusDetails.text}
              </Text>
            </View>
          </View>
        )}

        {/* Quick Info Grid */}
        <View style={styles.gridContainer}>
          <View style={styles.gridItem}>
            <Icon name="people" size={24} color="#4A90E2" />
            <Text style={styles.gridLabel}>Required People</Text>
            <Text style={styles.gridValue}>
              {data.requiredpeople || "Not specified"}
            </Text>
          </View>
          <View style={styles.gridItem}>
            <Icon name="schedule" size={24} color="#4A90E2" />
            <Text style={styles.gridLabel}>Work Duration</Text>
            <Text style={styles.gridValue}>
              {data.workduration || "Not specified"} days
            </Text>
          </View>
          <View style={styles.gridItem}>
            <Icon name="timer" size={24} color="#4A90E2" />
            <Text style={styles.gridLabel}>Work Time</Text>
            <Text style={styles.gridValue}>
              {data.worktime || "Not specified"} hrs
            </Text>
          </View>
          <View style={styles.gridItem}>
            <Icon name="build" size={24} color="#4A90E2" />
            <Text style={styles.gridLabel}>Tools Required</Text>
            <Text style={styles.gridValue}>
              {data.toolsrequired || "Not specified"}
            </Text>
          </View>
        </View>

        {/* Date Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Work Period</Text>
          <View style={styles.dateContainer}>
            <View style={styles.dateBox}>
              <Text style={styles.dateLabel}>Start Date</Text>
              <Text style={styles.dateValue}>
                {data.startdate ? formatDate(data.startdate) : "Not specified"}
              </Text>
            </View>
            <Icon name="arrow-forward" size={24} color="#999" />
            <View style={styles.dateBox}>
              <Text style={styles.dateLabel}>End Date</Text>
              <Text style={styles.dateValue}>
                {data.enddate ? formatDate(data.enddate) : "Not specified"}
              </Text>
            </View>
          </View>
        </View>

        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Location</Text>
          <View style={styles.locationCard}>
            {addressParts.doorNo && (
              <View style={styles.locationRow}>
                <Icon name="home" size={20} color="#FF6B6B" />
                <Text style={styles.locationText}>
                  Door No: {addressParts.doorNo || data.doorno}
                </Text>
              </View>
            )}
            <View style={styles.locationRow}>
              <Icon name="location-on" size={20} color="#FF6B6B" />
              <Text style={styles.locationText}>
                {addressParts.village || data.village_name}, {addressParts.mandal || data.mandalname},{" "}
                {addressParts.district || data.districtname}
              </Text>
            </View>
            {addressParts.landmark && addressParts.landmark !== "He" || data.landmark&& (
              <View style={styles.locationRow}>
                <Icon name="flag" size={20} color="#FF6B6B" />
                <Text style={styles.locationText}>
                  Near: {addressParts.landmark || data.landmark}
                </Text>
              </View>
            )}
            {addressParts.pincode || data.pincode&& (
              <View style={styles.locationRow}>
                <Icon name="pin-drop" size={20} color="#FF6B6B" />
                <Text style={styles.locationText}>
                  Pincode: {addressParts.pincode || data.pincode}
                </Text>
              </View>
            )}
            {data.latitude && data.longitude && (
              <View style={styles.locationRow}>
                <Icon name="map" size={20} color="#FF6B6B" />
                <Text style={styles.locationText}>
                  Coordinates: {data.latitude.toFixed(4)},{" "}
                  {data.longitude.toFixed(4)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Job Categories Section */}
        {jobcategories && jobcategories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔧 Job Categories</Text>
            <View style={styles.tagsContainer}>
              {jobcategories.map((category, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{category.jobCategoryName}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Facilities Section */}
        {facilities && facilities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✨ Facilities</Text>
            <View style={styles.tagsContainer}>
              {facilities.map((facility, index) => (
                <View key={index} style={styles.facilityTag}>
                  <Icon name="check-circle" size={14} color="#4CAF50" />
                  <Text style={styles.facilityText}>
                    {facility.facilityName}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Description</Text>
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionText}>
              {data.jobdescription && data.jobdescription !== "Hellow 1235"
                ? data.jobdescription
                : "No description provided"}
            </Text>
          </View>
        </View>

        {/* Action Button */}
        {(!data.isapplied && from!=="appliedjobs")&&(
          <TouchableOpacity style={styles.applyButton} onPress={() => ApplyJob(data.ApplyJob)}>
            <Icon name="send" size={20} color="#fff" />
            <Text style={styles.applyButtonText}>Apply Now</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    backgroundColor: "#4A90E2",
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  timeText: {
    color: "#fff",
    fontSize: 12,
    marginLeft: 4,
  },
  salaryCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: -20,
    padding: 20,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: "center",
  },
  salaryAmount: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#4A90E2",
  },
  salaryUnit: {
    fontSize: 16,
    fontWeight: "normal",
    color: "#666",
  },
  workType: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    textTransform: "capitalize",
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusContent: {
    marginLeft: 12,
    flex: 1,
  },
  statusTitle: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    marginTop: 16,
  },
  gridItem: {
    width: "50%",
    padding: 12,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  gridLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 6,
  },
  gridValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 2,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    elevation: 1,
  },
  dateBox: {
    flex: 1,
    alignItems: "center",
  },
  dateLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  locationCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    elevation: 1,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 12,
    flex: 1,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: "#E8F0FE",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: "#4A90E2",
    fontWeight: "500",
  },
  facilityTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  facilityText: {
    fontSize: 14,
    color: "#4CAF50",
    marginLeft: 6,
    fontWeight: "500",
  },
  descriptionCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    elevation: 1,
  },
  descriptionText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  applyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4A90E2",
    marginHorizontal: 16,
    marginVertical: 20,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 8,
  },
});

export default JobDetailsCard;