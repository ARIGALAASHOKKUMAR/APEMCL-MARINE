import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Icon from "react-native-vector-icons/MaterialIcons";
import { SafeAreaView } from "react-native-safe-area-context";
import { commonAPICall, DASHBOARD_COUNTS, MARINEMAINDASHBOARD } from "../utils/utils"; // Assume DASHBOARD_COUNTS is the endpoint constant

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const state = useSelector((state) => state.LoginReducer);
  const roleId = state.roleId;

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Define card configuration: label, icon, color for each key
  const cardConfigs = [
    {
      key: "discharge_assignment_pending",
      label: "Discharge Pending",
      icon: "assignment-late",
      color: "#FF9800",
    },
    {
      key: "edit_request_approved",
      label: "Edit Approved",
      icon: "check-circle",
      color: "#4CAF50",
    },
    {
      key: "discharge_assignment_completed",
      label: "Discharge Completed",
      icon: "assignment-turned-in",
      color: "#2196F3",
    },
    {
      key: "continue_next_day_requests",
      label: "Continue Next Day",
      icon: "today",
      color: "#9C27B0",
    },
    {
      key: "sample_assignment_completed",
      label: "Sample Completed",
      icon: "done-all",
      color: "#00BCD4",
    },
    {
      key: "edit_request_pending",
      label: "Edit Pending",
      icon: "edit",
      color: "#FF5722",
    },
    {
      key: "sample_assignment_pending",
      label: "Sample Pending",
      icon: "pending",
      color: "#FFC107",
    },
    {
      key: "edit_request_rejected",
      label: "Edit Rejected",
      icon: "cancel",
      color: "#F44336",
    },
  ];

  const fetchDashboardData = async () => {
    try {
      const res = await commonAPICall(MARINEMAINDASHBOARD, {}, "get", dispatch);
      if (res?.status === 200) {
        setDashboardData(res?.data || {});
        console.log("rrr",res.data);
        
      } else {
        setDashboardData(null);
      }
    } catch (error) {
      console.log("Error fetching dashboard counts:", error);
      setDashboardData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Helper to get value safely
  const getValue = (key) => {
    if (!dashboardData) return 0;
    return dashboardData[key] ?? 0;
  };

  // Render a single card
  const renderCard = (config) => {
    const value = getValue(config.key);
    return (
      <View style={styles.card} key={config.key}>
        <View style={[styles.iconContainer, { backgroundColor: config.color }]}>
          <Icon name={config.icon} size={28} color="#fff" />
        </View>
        <Text style={styles.cardValue}>{value}</Text>
        <Text style={styles.cardLabel}>{config.label}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome to APEMCL Marine</Text>
          <Text style={styles.subText}>Dashboard Overview</Text>
        </View>

        {/* Loading / Error State */}
        {loading ? (
          <View style={styles.centerMessage}>
            <Text style={styles.messageText}>Loading dashboard...</Text>
          </View>
        ) : !dashboardData || Object.keys(dashboardData).length === 0 ? (
          <View style={styles.centerMessage}>
            <Text style={styles.messageText}>No data available</Text>
          </View>
        ) : (
          <View style={styles.cardsGrid}>
            {cardConfigs.map((config) => renderCard(config))}
          </View>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  header: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A2A3A",
    marginBottom: 4,
  },
  subText: {
    fontSize: 16,
    color: "#7A8A9A",
    fontWeight: "500",
  },
  centerMessage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  messageText: {
    fontSize: 16,
    color: "#999",
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%", // two columns with gap
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 12,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A2A3A",
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 13,
    color: "#6B7A8A",
    textAlign: "center",
    fontWeight: "500",
  },
});

export default HomeScreen;