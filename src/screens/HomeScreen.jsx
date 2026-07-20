import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  StatusBar,
  RefreshControl,
  Dimensions,
  Animated,
  TouchableOpacity,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Icon from "react-native-vector-icons/MaterialIcons";
import { SafeAreaView } from "react-native-safe-area-context";
import { commonAPICall, MARINEMAINDASHBOARD } from "../utils/utils";

const { width } = Dimensions.get("window");

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const state = useSelector((state) => state.LoginReducer);
  const roleId = state.roleId;

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Card configurations with beautiful gradients
  const cardConfigs = {
    sample_assignment_pending: {
      label: "Assigned",
      icon: "assignment",
      gradient: ['#FF6B6B', '#FF8E53'],
      category: "samplings"
    },
    sample_assignment_completed: {
      label: "Completed",
      icon: "check-circle",
      gradient: ['#00B894', '#00CEC9'],
      category: "samplings"
    },
    sample_collection_pending: {
      label: "Pending Collection",
      icon: "pending",
      gradient: ['#FDCB6E', '#F39C12'],
      category: "samplings"
    },
    sample_collection_completed: {
      label: "Collection Completed",
      icon: "assignment-turned-in",
      gradient: ['#0984E3', '#74B9FF'],
      category: "samplings"
    },
    discharge_assignment_pending: {
      label: "Assigned",
      icon: "assignment-late",
      gradient: ['#E17055', '#D63031'],
      category: "discharge"
    },
    discharge_assignment_completed: {
      label: "Completed",
      icon: "assignment-turned-in",
      gradient: ['#0984E3', '#6C5CE7'],
      category: "discharge"
    },
    discharge_completed: {
      label: "Completed",
      icon: "check-circle",
      gradient: ['#00B894', '#00CEC9'],
      category: "discharge"
    },
    discharge_in_progress: {
      label: "In Progress",
      icon: "hourglass-empty",
      gradient: ['#FDCB6E', '#F39C12'],
      category: "discharge"
    },
    discharge_start_pending: {
      label: "Start Pending",
      icon: "pending",
      gradient: ['#E17055', '#D63031'],
      category: "discharge"
    },
    edit_request_approved: {
      label: "Approved",
      icon: "check-circle",
      gradient: ['#00B894', '#55EFC4'],
      category: "edit"
    },
    edit_request_pending: {
      label: "Pending",
      icon: "edit",
      gradient: ['#FDCB6E', '#F39C12'],
      category: "edit"
    },
    edit_request_rejected: {
      label: "Rejected",
      icon: "cancel",
      gradient: ['#E17055', '#D63031'],
      category: "edit"
    },
    analysis_completed: {
      label: "Completed",
      icon: "done-all",
      gradient: ['#0984E3', '#74B9FF'],
      category: "analysis"
    },
    analysis_pending: {
      label: "Pending",
      icon: "pending",
      gradient: ['#FDCB6E', '#F39C12'],
      category: "analysis"
    },
    continue_next_day_requests: {
      label: "Continue Next Day",
      icon: "today",
      gradient: ['#6C5CE7', '#A29BFE'],
      category: "continue"
    },
  };

  const getDefaultConfig = (key) => {
    const label = key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    const gradients = [
      ['#FF6B6B', '#FF8E53'],
      ['#00B894', '#00CEC9'],
      ['#0984E3', '#74B9FF'],
      ['#FDCB6E', '#F39C12'],
      ['#6C5CE7', '#A29BFE'],
      ['#E17055', '#D63031'],
    ];
    const hash = key.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const gradient = gradients[hash % gradients.length];
    
    return {
      label: label,
      icon: "dashboard",
      gradient: gradient,
      category: "other",
    };
  };

  const getConfig = (key) => {
    if (cardConfigs[key]) {
      return cardConfigs[key];
    }
    return getDefaultConfig(key);
  };

  // Animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await commonAPICall(MARINEMAINDASHBOARD, {}, "get", dispatch);
      if (res?.status === 200) {
        setDashboardData(res?.data || {});
        setLastUpdate(new Date());
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

  const getValue = (key) => {
    if (!dashboardData) return 0;
    return dashboardData[key] ?? 0;
  };

  const getGroupedData = () => {
    if (!dashboardData) return {};
    
    const grouped = {};
    const keys = Object.keys(dashboardData);
    
    keys.forEach(key => {
      const value = getValue(key);
      if (value === 0) return;
      
      const config = getConfig(key);
      const category = config.category || "other";
      
      if (!grouped[category]) {
        grouped[category] = [];
      }
      
      grouped[category].push({
        key,
        config,
        value
      });
    });
    
    return grouped;
  };

  const getCategoryInfo = (category) => {
    const categoryMap = {
      samplings: {
        title: "Samplings",
        icon: "science",
        gradient: ['#00B894', '#00CEC9'],
        emoji: "🧪"
      },
      discharge: {
        title: "Discharge",
        icon: "local-shipping",
        gradient: ['#0984E3', '#6C5CE7'],
        emoji: "🚢"
      },
      edit: {
        title: "Edit Requests",
        icon: "edit",
        gradient: ['#FDCB6E', '#F39C12'],
        emoji: "✏️"
      },
      analysis: {
        title: "Analysis",
        icon: "analytics",
        gradient: ['#6C5CE7', '#A29BFE'],
        emoji: "📊"
      },
      continue: {
        title: "Continue Next Day",
        icon: "today",
        gradient: ['#E17055', '#D63031'],
        emoji: "📅"
      },
      other: {
        title: "Other",
        icon: "more-horiz",
        gradient: ['#636E72', '#B2BEC3'],
        emoji: "📌"
      }
    };
    
    return categoryMap[category] || categoryMap.other;
  };

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const renderCategory = (category, items) => {
    const categoryInfo = getCategoryInfo(category);
    const total = items.reduce((sum, item) => sum + item.value, 0);
    
    if (items.length === 0) return null;

    return (
      <Animated.View 
        style={[
          styles.categorySection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
        key={category}
      >
        <View style={styles.categoryHeader}>
          <View style={styles.categoryTitleContainer}>
            <View style={[styles.categoryIconWrapper, { backgroundColor: categoryInfo.gradient[0] + '20' }]}>
              <Text style={styles.categoryEmoji}>{categoryInfo.emoji}</Text>
            </View>
            <View>
              <Text style={styles.categoryTitle}>{categoryInfo.title}</Text>
              <Text style={styles.categorySubtitle}>{items.length} items</Text>
            </View>
          </View>
          <View style={styles.updateContainer}>
            <Icon name="update" size={14} color="#999" />
            <Text style={styles.updateText}>{formatDate(lastUpdate)}</Text>
          </View>
        </View>
        
        <View style={styles.categoryCardsGrid}>
          {items.map((item, index) => (
            <Animated.View
              key={item.key}
              style={[
                styles.cardWrapper,
                {
                  opacity: fadeAnim,
                  transform: [
                    { 
                      scale: scaleAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.9, 1]
                      })
                    }
                  ]
                }
              ]}
            >
              {renderCard(item, index)}
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    );
  };

  const renderCard = (item, index) => {
    const { config, value } = item;
    
    return (
      <View style={[styles.card, { borderLeftColor: config.gradient[0], borderLeftWidth: 5 }]}>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconContainer, { backgroundColor: config.gradient[0] + '15' }]}>
              <Icon name={config.icon} size={28} color={config.gradient[0]} />
            </View>
            <Text style={styles.cardValue}>{value}</Text>
          </View>
          <Text style={styles.cardLabel}>{config.label}</Text>
          <View style={[styles.cardProgress, { backgroundColor: config.gradient[0] + '20' }]}>
            <View 
              style={[
                styles.cardProgressFill, 
                { 
                  width: `${Math.min((value / 100) * 100, 100)}%`,
                  backgroundColor: config.gradient[0]
                }
              ]} 
            />
          </View>
        </View>
      </View>
    );
  };

  const renderSummaryStats = () => {
    if (!dashboardData || Object.keys(dashboardData).length === 0) return null;
    
    const grouped = getGroupedData();
    let total = 0;
    const categoryTotals = {};
    
    Object.entries(grouped).forEach(([category, items]) => {
      const categoryTotal = items.reduce((sum, item) => sum + item.value, 0);
      categoryTotals[category] = categoryTotal;
      total += categoryTotal;
    });
    
    return (
      <Animated.View 
        style={[
          styles.summaryContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>📊 Overview</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Icon name="refresh" size={22} color="#6C5CE7" />
          </TouchableOpacity>
        </View>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: '#6C5CE7' }]}>
              <Icon name="assessment" size={24} color="#FFF" />
            </View>
            <Text style={styles.summaryValue}>{total}</Text>
            <Text style={styles.summaryLabel}>Total Tasks</Text>
          </View>
          {Object.entries(categoryTotals).map(([category, count]) => {
            const info = getCategoryInfo(category);
            if (count === 0) return null;
            return (
              <View style={styles.summaryCard} key={category}>
                <View style={[styles.summaryIcon, { backgroundColor: info.gradient[0] }]}>
                  <Text style={styles.summaryEmoji}>{info.emoji}</Text>
                </View>
                <Text style={[styles.summaryValue, { color: info.gradient[0] }]}>
                  {count}
                </Text>
                <Text style={styles.summaryLabel}>{info.title}</Text>
              </View>
            );
          })}
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#6C5CE7" />
      
      {/* Gradient Header */}
     

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#6C5CE7"
            colors={["#6C5CE7"]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerMessage}>
            <View style={styles.loadingContainer}>
              <View style={styles.loadingSpinner} />
              <Text style={styles.loadingText}>Loading dashboard...</Text>
            </View>
          </View>
        ) : !dashboardData || Object.keys(dashboardData).length === 0 ? (
          <View style={styles.centerMessage}>
            <Icon name="dashboard" size={60} color="#DDD" />
            <Text style={styles.messageText}>No data available</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {renderSummaryStats()}
            {Object.entries(getGroupedData()).map(([category, items]) => 
              renderCategory(category, items)
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerGradient: {
    backgroundColor: '#6C5CE7',
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF6B6B',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  centerMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#6C5CE7',
    borderTopColor: 'transparent',
    marginBottom: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#999',
  },
  messageText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: '#6C5CE7',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: '600',
  },
  summaryContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryCard: {
    alignItems: 'center',
    minWidth: '22%',
    paddingVertical: 6,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryEmoji: {
    fontSize: 20,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#7A8A9A',
    marginTop: 2,
    textAlign: 'center',
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryEmoji: {
    fontSize: 22,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  categorySubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 1,
  },
  updateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  updateText: {
    fontSize: 11,
    color: '#999',
    marginLeft: 4,
  },
  categoryCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: '48%',
    marginBottom: 14,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 110,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  cardLabel: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
    marginBottom: 10,
  },
  cardProgress: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  cardProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default HomeScreen;