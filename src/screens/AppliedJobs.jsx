import React, { useEffect, useState } from "react";
import { commonAPICall, JOBSEARCH, MYJOBSOFWORKER } from "../utils/utils";
import { useDispatch } from "react-redux";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { FontAwesome5 } from "@expo/vector-icons";
import { showModal } from "../actions";
import JobDetailsCard from "./JobDetailsScreen";

const AppliedJobs = ({ navigation }) => {
  const [jobsList, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const dispatch = useDispatch();


  const getjobs = async () => {
    try {
      const response = await commonAPICall(MYJOBSOFWORKER, {}, "get", dispatch);
      console.log("reeeworker", response.data);

      if (response.status === 200) {
        console.log(
          "response.data",
          response.data.DigitalLabourChowkJobPosting_Details,
        );

        setJobs(response.data.DigitalLabourChowkJobPosting_Details);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    getjobs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    getjobs();
  };

  const formatTimeAgo = (value) => {
    if (!value) return "Recently posted / ఇటీవల పోస్ట్ చేయబడింది";
    return value;
  };

  const formatSalary = (value) => {
    if (value === null || value === undefined || value === "")
      return "Not mentioned / పేర్కొనబడలేదు";
    return `${value}/month / నెలకు`;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "#FF9800";
      case "reviewed":
        return "#2196F3";
      case "accepted":
        return "#4CAF50";
      case "rejected":
        return "#F44336";
      case "hired":
        return "#9C27B0";
      default:
        return "#666";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "time-outline";
      case "reviewed":
        return "eye-outline";
      case "accepted":
        return "star-outline";
      case "rejected":
        return "close-circle-outline";
      case "hired":
        return "checkmark-circle-outline";
      default:
        return "document-text-outline";
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "Application Under Review / దరఖాస్తు సమీక్షలో ఉంది";
      case "accepted":
        return "Application Reviewed / దరఖాస్తు సమీక్షించబడింది";
      case "shortlisted":
        return "Shortlisted / షార్ట్లిస్ట్ చేయబడింది";
      case "rejected":
        return "Not Selected / ఎంచుకోబడలేదు";
      case "hired":
        return "Hired / నియమించబడింది";
      default:
        return status || "Application Submitted / దరఖాస్తు సమర్పించబడింది";
    }
  };

  const appliedJobs = jobsList || [];

  console.log("showInfoToast", appliedJobs);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2d7fd3" />
        <Text style={styles.loadingText}>Loading your applications... / మీ దరఖాస్తులు లోడ్ అవుతున్నాయి...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#2d7fd3"]}
        />
      }
    >
      {appliedJobs.length > 0 ? (
        <>
          <View style={styles.headerSection}>
            <Text style={styles.headerTitle}>My Applications / నా దరఖాస్తులు</Text>
            <Text style={styles.headerSubtitle}>
              You have applied for {appliedJobs.length} job
              {appliedJobs.length !== 1 ? "s" : ""} / మీరు {appliedJobs.length} ఉద్యోగానికి దరఖాస్తు చేసుకున్నారు
            </Text>
          </View>

          {appliedJobs.map((item, index) => {
            const workerDetails =
              typeof item?.worker_details === "string"
                ? JSON.parse(item.worker_details || "[]")
                : item?.worker_details || [];

            const applicationStatus =
              workerDetails?.[0]?.applicationStatus || "";

            return (
              <TouchableOpacity
                key={item?.id ? String(item.id) : String(index)}
                style={styles.jobCard}
                activeOpacity={0.85}
                onPress={() => {
                  if (navigation) {
                    navigation.navigate("JobDetails", { jobData: item });
                  }
                }}
              >
                <View style={styles.jobLeftIconWrap}>
                  <View style={styles.jobLeftIconCircle}>
                    <MaterialIcons name="work" size={22} color="#2d7fd3" />
                  </View>
                </View>

                <View style={styles.jobContent}>
                  <Text style={styles.jobTitle} numberOfLines={1}>
                    {item.jobtitle}
                  </Text>

                  <View style={styles.jobMetaRow}>
                    <Ionicons name="location-sharp" size={13} color="#e75480" />
                    <Text style={styles.jobMetaText} numberOfLines={1}>
                      {item.village_name}-{item.mandalname}-{item.districtname}
                    </Text>
                  </View>

                  <View style={styles.jobMetaRow}>
                    <Ionicons name="calendar-outline" size={13} color="#666" />
                    <Text style={styles.jobMetaText}>
                      {formatTimeAgo(item.jobpostedtime)}
                    </Text>
                  </View>

                  <View style={styles.jobMetaRow}>
                    <FontAwesome5 name="rupee-sign" size={11} color="#c58543" />
                    <Text style={styles.jobMetaText}>
                      {formatSalary(item.workrateperday)}
                    </Text>
                  </View>

                  <View style={styles.statusBadgeContainer}>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            getStatusColor(applicationStatus) + "15",
                        },
                      ]}
                    >
                      <Ionicons
                        name={getStatusIcon(applicationStatus)}
                        size={12}
                        color={getStatusColor(applicationStatus)}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(applicationStatus) },
                        ]}
                      >
                        {getStatusText(applicationStatus)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.jobArrowWrap}>
                  <TouchableOpacity
                    style={styles.arrowButton}
                    onPress={() => {
                      dispatch(
                        showModal(
                          <JobDetailsCard data={item} from="appliedjobs" />,
                          true,
                          true,
                        ),
                      );
                    }}
                  >
                    <Ionicons name="chevron-forward" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </>
      ) : (
        <View style={styles.noDataCard}>
          <MaterialIcons name="work-off" size={60} color="#ccc" />
          <Text style={styles.noDataText}>No applications found / దరఖాస్తులు ఏమీ లేవు</Text>
          <Text style={styles.noDataSubText}>
            You haven't applied for any jobs yet. Start exploring and apply now! / 
            మీరు ఇంకా ఏ ఉద్యోగానికి దరఖాస్తు చేసుకోలేదు. అన్వేషణ ప్రారంభించండి మరియు ఇప్పుడే దరఖాస్తు చేసుకోండి!
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

export default AppliedJobs;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  jobCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 12,
    marginHorizontal: 16,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  jobLeftIconWrap: {
    marginRight: 12,
  },
  jobLeftIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E3F2FD",
    alignItems: "center",
    justifyContent: "center",
  },
  jobContent: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  jobMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  jobMetaText: {
    marginLeft: 6,
    fontSize: 12,
    color: "#666",
  },
  statusBadgeContainer: {
    marginTop: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "500",
    marginLeft: 4,
  },
  jobArrowWrap: {
    marginLeft: 10,
    alignSelf: "center",
  },
  arrowButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#2d7fd3",
    alignItems: "center",
    justifyContent: "center",
  },
  noDataCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
    marginHorizontal: 16,
  },
  noDataText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 16,
  },
  noDataSubText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
});
