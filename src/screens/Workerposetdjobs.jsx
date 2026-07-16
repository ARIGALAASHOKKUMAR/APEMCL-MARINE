import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Dimensions,
  Image,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { commonAPICall, JOBAPPLY, MYJOBSOFWORKER } from "../utils/utils";
import { useDispatch } from "react-redux";
import { showModal } from "../actions";

const { width, height } = Dimensions.get("window");

const Workerposetdjobs = ({ navigation }) => {
  const dispatch = useDispatch();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [applicantsModalVisible, setApplicantsModalVisible] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [applicantDetailsModalVisible, setApplicantDetailsModalVisible] =
    useState(false);

  const getWorkerJobs = async () => {
    try {
      setError(null);
      const response = await commonAPICall(MYJOBSOFWORKER, {}, "get", dispatch);

      if (
        response?.status === 200 &&
        response?.data?.DigitalLabourChowkJobPosting_Details
      ) {
        // Parse JSON strings for jobcategories, facilities, and worker_details
        const parsedJobs =
          response.data.DigitalLabourChowkJobPosting_Details.map((job) => ({
            ...job,
            jobcategories: job.jobcategories
              ? JSON.parse(job.jobcategories)
              : [],
            facilities: job.facilities ? JSON.parse(job.facilities) : [],
            worker_details: job.worker_details
              ? JSON.parse(job.worker_details)
              : [],
          }));
        setJobs(parsedJobs);
      } else {
        setError(response?.data?.message || "No jobs found");
        setJobs([]);
      }
    } catch (err) {
      setError("Failed to fetch jobs");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    getWorkerJobs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    getWorkerJobs();
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Helper function to get work type display
  const getWorkTypeDisplay = (type) => {
    if (type === "daily wages") return "Daily Wages";
    if (type === "monthly") return "Monthly";
    return type;
  };

  // Helper function to get work time display
  const getWorkTimeDisplay = (time) => {
    if (time === "T") return "Full Time";
    if (time === "P") return "Part Time";
    if (time === "9am") return "9:00 AM";
    if (time === "9AM-10PM") return "9:00 AM - 10:00 PM";
    return time;
  };

  const openJobDetails = (job) => {
    setSelectedJob(job);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedJob(null);
  };

  const openApplicantsModal = (job) => {
    setSelectedJob(job);
    setApplicantsModalVisible(true);
  };

  const closeApplicantsModal = () => {
    setApplicantsModalVisible(false);
    setSelectedJob(null);
  };

  const openApplicantDetails = (applicant) => {
    setSelectedApplicant(applicant);
    setApplicantDetailsModalVisible(true);
  };

  const closeApplicantDetails = () => {
    setApplicantDetailsModalVisible(false);
    setSelectedApplicant(null);
  };

  const handleCall = async (phoneNumber) => {
    try {
      await Linking.openURL(`tel:${phoneNumber}`);
    } catch (e) {
      Alert.alert("Error", "Unable to open phone dialer");
      console.log("Call error:", e);
    }
  };

  const handleEmail = async (email) => {
    try {
      await Linking.openURL(`mailto:${email}`);
    } catch (e) {
      Alert.alert("Error", "Unable to open email app");
      console.log("Email error:", e);
    }
  };

  const handleJobAcceptReject = async (mobile, status, jobid) => {
    const payload = {
      jobPostingId: jobid,
      workerMobileNumber: mobile,
      applicationStatus: status,
    };
    const res = await commonAPICall(JOBAPPLY, payload, "post", dispatch);
    if (res.status === 200) {
      setApplicantsModalVisible(false);
    }
  };

  // Modern Job Card Component
  const ModernJobCard = ({ job }) => {
    console.log("submitButtonText", job);

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.companyIcon}>
              <Text style={styles.companyIconText}>💼</Text>
            </View>
            <View style={styles.cardTitleContainer}>
              <Text style={styles.jobTitle}>{job.jobtitle}</Text>
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={12} color="#666" />
                <Text style={styles.locationText}>
                  {job.village_name}, {job.mandalname}
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              openApplicantsModal(job);
            }}
            style={styles.workTypeBadgeModern}
          >
            <Text style={styles.workTypeTextModern}>
              View Applicants: {job.worker_count}+
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailItemModern}>
            <Ionicons name="cash-outline" size={16} color="#4CAF50" />
            <Text style={styles.detailValueModern}>
              ₹{job.workrateperday}{" "}
              {job.preferredworktype === "monthly"
                ? "/month"
                : job.preferredworktype === "contract"
                  ? "contract basis"
                  : "/day"}
            </Text>
          </View>
          <View style={styles.detailItemModern}>
            <Ionicons name="calendar-outline" size={16} color="#4CAF50" />
            <Text style={styles.detailValueModern}>
              {job.workduration} days
            </Text>
          </View>
          <View style={styles.detailItemModern}>
            <Ionicons name="people-outline" size={16} color="#4CAF50" />
            <Text style={styles.detailValueModern}>
              {job.requiredpeople} required
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.dateRangeContainer}>
            <Ionicons name="time-outline" size={12} color="#999" />
            <Text style={styles.dateRangeText}>
              {formatDate(job.startdate)} - {formatDate(job.enddate)}
            </Text>
          </View>
          <View style={styles.viewDetailsButton}>
            <Text
              style={styles.viewDetailsText}
              onPress={() => navigation.navigate("JobPosting", { job })}
            >
              Edit
            </Text>
            <Ionicons name="create-outline" size={14} color="#4CAF50" />{" "}
          </View>
          <View style={styles.viewDetailsButton}  onPress={() => openJobDetails(job)}>
            <Text style={styles.viewDetailsText}>View </Text>
            <Ionicons name="arrow-forward" size={14} color="#4CAF50" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Applicants List Modal
  const ApplicantsModal = () => {
    if (!selectedJob) return null;

    const applicants = selectedJob.worker_details || [];

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={applicantsModalVisible}
        onRequestClose={closeApplicantsModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={closeApplicantsModal}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>Applicants</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {applicants.length === 0 ? (
                <View style={styles.emptyApplicantsContainer}>
                  <Ionicons name="people-outline" size={48} color="#ccc" />
                  <Text style={styles.noJobsText}>No applicants yet</Text>
                </View>
              ) : (
                applicants.map((applicant, index) => (
                  <View key={index} style={styles.applicantCard}>
                    <View style={styles.applicantHeader}>
                      <View style={styles.applicantAvatar}>
                        {applicant.profileImage &&
                        applicant.profileImage !== "base64imageorURL" ? (
                          <Image
                            source={{ uri: applicant.profileImage }}
                            style={styles.applicantImage}
                          />
                        ) : (
                          <Text style={styles.applicantAvatarText}>
                            {applicant.fullName
                              ? applicant.fullName.charAt(0).toUpperCase()
                              : "?"}
                          </Text>
                        )}
                      </View>
                      <View style={styles.applicantInfo}>
                        <Text style={styles.applicantName}>
                          {applicant.fullName || "N/A"}
                        </Text>
                        <Text style={styles.applicantContact}>
                          {applicant.mobileNumber || "N/A"}
                        </Text>
                        <Text style={styles.applicantEmail}>
                          {applicant.email || "N/A"}
                        </Text>
                      </View>
                    </View>
                    // Inside ApplicantsModal component, replace the
                    applicantActions View with this:
                    <View style={styles.applicantActions}>
                      {applicant.mobileNumber && (
                        <TouchableOpacity
                          style={[styles.actionButton, styles.callButton]}
                          onPress={() => handleCall(applicant.mobileNumber)}
                        >
                          <Ionicons
                            name="call-outline"
                            size={18}
                            color="#fff"
                          />
                          <Text style={styles.actionButtonText}>Call</Text>
                        </TouchableOpacity>
                      )}
                      {applicant.email && (
                        <TouchableOpacity
                          style={[styles.actionButton, styles.emailButton]}
                          onPress={() => handleEmail(applicant.email)}
                        >
                          <Ionicons
                            name="mail-outline"
                            size={18}
                            color="#fff"
                          />
                          <Text style={styles.actionButtonText}>Email</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.actionButton, styles.detailsButton]}
                        onPress={() => openApplicantDetails(applicant)}
                      >
                        <Ionicons name="eye-outline" size={18} color="#fff" />
                        <Text style={styles.actionButtonText}>Details</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.acceptButton]}
                        onPress={() =>
                          handleJobAcceptReject(
                            applicant.mobileNumber,
                            "ACCEPTED",
                            selectedJob.jobpostingid,
                          )
                        }
                      >
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={18}
                          color="#fff"
                        />
                        <Text style={styles.actionButtonText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() =>
                          handleJobAcceptReject(
                            applicant.mobileNumber,
                            "REJECTED",
                            selectedJob.jobpostingid,
                          )
                        }
                      >
                        <Ionicons
                          name="close-circle-outline"
                          size={18}
                          color="#fff"
                        />
                        <Text style={styles.actionButtonText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={closeApplicantsModal}
              >
                <Text style={styles.closeModalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Applicant Details Modal
  const ApplicantDetailsModal = () => {
    if (!selectedApplicant) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={applicantDetailsModalVisible}
        onRequestClose={closeApplicantDetails}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: height * 0.85 }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={closeApplicantDetails}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>Applicant Profile</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Profile Header */}
              <View style={styles.profileHeader}>
                <View style={styles.profileAvatarLarge}>
                  {selectedApplicant.profileImage &&
                  selectedApplicant.profileImage !== "base64imageorURL" ? (
                    <Image
                      source={{ uri: selectedApplicant.profileImage }}
                      style={styles.profileImageLarge}
                    />
                  ) : (
                    <Text style={styles.profileAvatarLargeText}>
                      {selectedApplicant.fullName
                        ? selectedApplicant.fullName.charAt(0).toUpperCase()
                        : "?"}
                    </Text>
                  )}
                </View>
                <Text style={styles.profileName}>
                  {selectedApplicant.fullName || "N/A"}
                </Text>
                <View style={styles.contactInfo}>
                  <TouchableOpacity
                    style={styles.contactChip}
                    onPress={() => handleCall(selectedApplicant.mobileNumber)}
                  >
                    <Ionicons name="call" size={16} color="#4CAF50" />
                    <Text style={styles.contactChipText}>
                      {selectedApplicant.mobileNumber || "N/A"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.contactChip}
                    onPress={() => handleEmail(selectedApplicant.email)}
                  >
                    <Ionicons name="mail" size={16} color="#4CAF50" />
                    <Text style={styles.contactChipText}>
                      {selectedApplicant.email || "N/A"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Skills Section */}
              {selectedApplicant.skills &&
                selectedApplicant.skills.length > 0 && (
                  <View style={styles.detailSection}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="briefcase" size={20} color="#4CAF50" />
                      <Text style={styles.sectionTitle}>Skills</Text>
                    </View>
                    <View style={styles.tagsContainer}>
                      {selectedApplicant.skills.map((skill, index) => (
                        <View key={index} style={styles.skillTag}>
                          <Text style={styles.skillTagText}>
                            {skill.skillName}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

              {/* Education Section */}
              {selectedApplicant.education &&
                selectedApplicant.education.length > 0 && (
                  <View style={styles.detailSection}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="school" size={20} color="#4CAF50" />
                      <Text style={styles.sectionTitle}>Education</Text>
                    </View>
                    {selectedApplicant.education.map((edu, index) => (
                      <View key={index} style={styles.educationItem}>
                        <Text style={styles.educationLevel}>
                          {edu.educationLevel || "N/A"}
                        </Text>
                        <Text style={styles.educationDetail}>
                          {edu.institutionName || "N/A"} •{" "}
                          {edu.passingYear || "N/A"}
                        </Text>
                        {edu.certificate &&
                          edu.certificate !== "certificate-uploaded" && (
                            <Text style={styles.certificateText}>
                              Certificate: {edu.certificate}
                            </Text>
                          )}
                      </View>
                    ))}
                  </View>
                )}

              {/* Work History Section */}
              {selectedApplicant.workHistory &&
                selectedApplicant.workHistory.length > 0 && (
                  <View style={styles.detailSection}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="time" size={20} color="#4CAF50" />
                      <Text style={styles.sectionTitle}>Work History</Text>
                    </View>
                    {selectedApplicant.workHistory.map((work, index) => (
                      <View key={index} style={styles.workHistoryItem}>
                        <View style={styles.workHeader}>
                          <Text style={styles.projectName}>
                            {work.projectName || "N/A"}
                          </Text>
                          {work.rating && (
                            <View style={styles.ratingBadge}>
                              <Ionicons name="star" size={12} color="#FFD700" />
                              <Text style={styles.ratingText}>
                                {work.rating}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.workDetail}>
                          {work.workPlace || "N/A"} • {work.workType || "N/A"}
                        </Text>
                        <Text style={styles.workDetail}>
                          {formatDate(work.startDate)} -{" "}
                          {formatDate(work.endDate)}
                        </Text>
                        <Text style={styles.workDetail}>
                          Days Worked: {work.daysWorked || 0} • Daily Wage: ₹
                          {work.dailyWage || 0}
                        </Text>
                        {work.taskDescription && (
                          <Text style={styles.taskDescription}>
                            {work.taskDescription}
                          </Text>
                        )}
                        {work.remarks && (
                          <Text style={styles.remarksText}>
                            Remarks: {work.remarks}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={closeApplicantDetails}
              >
                <Text style={styles.closeModalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Naukri-style Job Details Modal
  const JobDetailsModal = () => {
    if (!selectedJob) return null;

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header with gradient effect */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalHeaderTitle}>Job Details</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
            >
              {/* Job Title Section */}
              <View style={styles.jobTitleSection}>
                <Text style={styles.modalJobTitle}>{selectedJob.jobtitle}</Text>
                <View style={styles.badgeContainer}>
                  <View style={[styles.badge, styles.workTypeBadgeModal]}>
                    <Text style={styles.badgeText}>
                      {getWorkTypeDisplay(selectedJob.preferredworktype)}
                    </Text>
                  </View>
                  <View style={[styles.badge, styles.jobIdBadge]}>
                    <Text style={styles.jobIdText}>
                      ID: {selectedJob.jobpostingid}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Key Metrics Cards */}
              <View style={styles.metricsContainer}>
                <View style={styles.metricCard}>
                  <Ionicons name="cash-outline" size={24} color="#4CAF50" />
                  <Text style={styles.metricValue}>
                    ₹{selectedJob.workrateperday}
                  </Text>
                  <Text style={styles.metricLabel}>Per Day</Text>
                </View>
                <View style={styles.metricCard}>
                  <Ionicons name="calendar-outline" size={24} color="#4CAF50" />
                  <Text style={styles.metricValue}>
                    {selectedJob.workduration}
                  </Text>
                  <Text style={styles.metricLabel}>Days</Text>
                </View>
                <View style={styles.metricCard}>
                  <Ionicons name="people-outline" size={24} color="#4CAF50" />
                  <Text style={styles.metricValue}>
                    {selectedJob.requiredpeople}
                  </Text>
                  <Text style={styles.metricLabel}>Required</Text>
                </View>
              </View>

              {/* Location Section */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="location" size={20} color="#4CAF50" />
                  <Text style={styles.sectionTitle}>Location Details</Text>
                </View>
                <View style={styles.locationDetails}>
                  <Text style={styles.addressText}>
                    {selectedJob.village_name}, {selectedJob.mandalname}
                  </Text>
                  <Text style={styles.addressText}>
                    {selectedJob.districtname} - {selectedJob.pincode}
                  </Text>
                  {selectedJob.landmark && (
                    <Text style={styles.landmarkText}>
                      Landmark: {selectedJob.landmark}
                    </Text>
                  )}
                </View>
              </View>

              {/* Date Range Section */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="calendar" size={20} color="#4CAF50" />
                  <Text style={styles.sectionTitle}>Duration</Text>
                </View>
                <View style={styles.dateRange}>
                  <View style={styles.dateItem}>
                    <Text style={styles.dateLabel}>Start Date</Text>
                    <Text style={styles.dateValue}>
                      {formatDate(selectedJob.startdate)}
                    </Text>
                  </View>
                  <View style={styles.dateDivider} />
                  <View style={styles.dateItem}>
                    <Text style={styles.dateLabel}>End Date</Text>
                    <Text style={styles.dateValue}>
                      {formatDate(selectedJob.enddate)}
                    </Text>
                  </View>
                </View>
                <View style={styles.workTimeContainer}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <Text style={styles.workTimeText}>
                    Work Time: {getWorkTimeDisplay(selectedJob.worktime)}
                  </Text>
                </View>
              </View>

              {/* Job Categories */}
              {selectedJob.jobcategories &&
                selectedJob.jobcategories.length > 0 && (
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="briefcase" size={20} color="#4CAF50" />
                      <Text style={styles.sectionTitle}>Job Categories</Text>
                    </View>
                    <View style={styles.tagsContainer}>
                      {selectedJob.jobcategories.map((cat, index) => (
                        <View key={index} style={styles.categoryTag}>
                          <Text style={styles.categoryTagText}>
                            {cat.jobCategoryName}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

              {/* Facilities */}
              {selectedJob.facilities && selectedJob.facilities.length > 0 && (
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="gift" size={20} color="#4CAF50" />
                    <Text style={styles.sectionTitle}>Facilities Provided</Text>
                  </View>
                  <View style={styles.tagsContainer}>
                    {selectedJob.facilities.map((fac, index) => (
                      <View key={index} style={styles.facilityTag}>
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color="#7b1fa2"
                        />
                        <Text style={styles.facilityTagText}>
                          {fac.facilityName}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Job Description */}
              {selectedJob.jobdescription && (
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="document-text" size={20} color="#4CAF50" />
                    <Text style={styles.sectionTitle}>Job Description</Text>
                  </View>
                  <Text style={styles.descriptionText}>
                    {selectedJob.jobdescription}
                  </Text>
                </View>
              )}

              {/* Tools Required */}
              {selectedJob.toolsrequired && (
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="construct" size={20} color="#4CAF50" />
                    <Text style={styles.sectionTitle}>Tools Required</Text>
                  </View>
                  <Text style={styles.toolsText}>
                    {selectedJob.toolsrequired}
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={closeModal}
              >
                <Text style={styles.closeModalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading your jobs...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={48} color="#f44336" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={getWorkerJobs}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4CAF50"]}
            tintColor="#4CAF50"
          />
        }
      >
        {jobs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="briefcase-outline" size={64} color="#ccc" />
            <Text style={styles.noJobsText}>No jobs found</Text>
            <Text style={styles.noJobsSubText}>Pull down to refresh</Text>
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>My Job Postings</Text>
              <View style={styles.headerCount}>
                <Text style={styles.headerCountText}>
                  {jobs.length} {jobs.length === 1 ? "Job" : "Jobs"}
                </Text>
              </View>
            </View>
            {jobs.map((job) => (
              <ModernJobCard key={job.jobpostingid} job={job} />
            ))}
          </>
        )}
      </ScrollView>
      <JobDetailsModal />
      <ApplicantsModal />
      <ApplicantDetailsModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContent: {
    paddingBottom: 70,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212529",
  },
  headerCount: {
    backgroundColor: "#e9ecef",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  headerCountText: {
    fontSize: 14,
    color: "#495057",
    fontWeight: "600",
  },
  // Modern Card Styles
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    flex: 1,
  },
  companyIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#e8f5e9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  companyIconText: {
    fontSize: 24,
  },
  cardTitleContainer: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 12,
    color: "#6c757d",
    marginLeft: 4,
  },
  workTypeBadgeModern: {
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  workTypeTextModern: {
    fontSize: 11,
    color: "#4CAF50",
    fontWeight: "600",
  },
  cardDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#f1f3f5",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f5",
  },
  detailItemModern: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailValueModern: {
    fontSize: 13,
    color: "#495057",
    marginLeft: 6,
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateRangeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateRangeText: {
    fontSize: 11,
    color: "#868e96",
    marginLeft: 4,
  },
  viewDetailsButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewDetailsText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
    marginRight: 4,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: height * 0.9,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
    backgroundColor: "#fff",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f3f5",
    justifyContent: "center",
    alignItems: "center",
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212529",
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  jobTitleSection: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  modalJobTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 12,
  },
  badgeContainer: {
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  workTypeBadgeModal: {
    backgroundColor: "#e8f5e9",
  },
  jobIdBadge: {
    backgroundColor: "#f1f3f5",
  },
  badgeText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
  },
  jobIdText: {
    fontSize: 12,
    color: "#6c757d",
    fontWeight: "500",
  },
  metricsContainer: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212529",
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 11,
    color: "#6c757d",
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginLeft: 8,
  },
  locationDetails: {
    gap: 6,
  },
  addressText: {
    fontSize: 14,
    color: "#495057",
    lineHeight: 20,
  },
  landmarkText: {
    fontSize: 14,
    color: "#6c757d",
    fontStyle: "italic",
    marginTop: 4,
  },
  dateRange: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dateItem: {
    flex: 1,
    alignItems: "center",
  },
  dateLabel: {
    fontSize: 12,
    color: "#6c757d",
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212529",
  },
  dateDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#e9ecef",
    marginHorizontal: 16,
  },
  workTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  workTimeText: {
    fontSize: 13,
    color: "#495057",
    marginLeft: 8,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryTag: {
    backgroundColor: "#e3f2fd",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  categoryTagText: {
    fontSize: 12,
    color: "#1976d2",
    fontWeight: "500",
  },
  facilityTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3e5f5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  facilityTagText: {
    fontSize: 12,
    color: "#7b1fa2",
    fontWeight: "500",
  },
  descriptionText: {
    fontSize: 14,
    color: "#495057",
    lineHeight: 22,
  },
  toolsText: {
    fontSize: 14,
    color: "#495057",
    lineHeight: 20,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    backgroundColor: "#fff",
  },
  closeModalButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  closeModalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6c757d",
  },
  errorText: {
    fontSize: 16,
    color: "#f44336",
    marginTop: 12,
    marginBottom: 16,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  noJobsText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6c757d",
    marginTop: 16,
    marginBottom: 8,
  },
  noJobsSubText: {
    fontSize: 14,
    color: "#adb5bd",
  },
  // Applicant Modal Styles
  emptyApplicantsContainer: {
    padding: 40,
    alignItems: "center",
  },
  applicantCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  applicantHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  applicantAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#e8f5e9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  applicantImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  applicantAvatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  applicantInfo: {
    flex: 1,
    justifyContent: "center",
  },
  applicantName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 4,
  },
  applicantContact: {
    fontSize: 14,
    color: "#495057",
    marginBottom: 2,
  },
  applicantEmail: {
    fontSize: 12,
    color: "#6c757d",
  },
  applicantActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  callButton: {
    backgroundColor: "#4CAF50",
  },
  emailButton: {
    backgroundColor: "#2196F3",
  },
  detailsButton: {
    backgroundColor: "#FF9800",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  // Applicant Details Modal Styles
  profileHeader: {
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  profileAvatarLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#e8f5e9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  profileImageLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileAvatarLargeText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 12,
  },
  contactInfo: {
    flexDirection: "row",
    gap: 12,
  },
  contactChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f3f5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  contactChipText: {
    fontSize: 12,
    color: "#495057",
  },
  detailSection: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  skillTag: {
    backgroundColor: "#e8f5e9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  skillTagText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "500",
  },
  educationItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  educationLevel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 4,
  },
  educationDetail: {
    fontSize: 12,
    color: "#6c757d",
    marginBottom: 4,
  },
  certificateText: {
    fontSize: 11,
    color: "#4CAF50",
  },
  workHistoryItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  workHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  projectName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212529",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3e0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    fontSize: 11,
    color: "#FF9800",
    fontWeight: "600",
  },
  workDetail: {
    fontSize: 12,
    color: "#6c757d",
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 12,
    color: "#495057",
    marginTop: 6,
    fontStyle: "italic",
  },
  remarksText: {
    fontSize: 11,
    color: "#f44336",
    marginTop: 4,
  },
  // Add these styles to your existing styles object
  applicantActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 6,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    gap: 4,
  },
  callButton: {
    backgroundColor: "#4CAF50",
  },
  emailButton: {
    backgroundColor: "#2196F3",
  },
  detailsButton: {
    backgroundColor: "#FF9800",
  },
  acceptButton: {
    backgroundColor: "#4CAF50",
  },
  rejectButton: {
    backgroundColor: "#f44336",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
});

export default Workerposetdjobs;
