import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AppState,
  Dimensions,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  FlatList,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import {
  hideLoader,
  hideMessage,
  logOut,
  showModal,
  hideModal,
} from "../actions";

import {
  LOGOUT_ALL_END_POINT,
  LOGOUT_ALL_EXCEPT_THIS_END_POINT,
  LOGOUT_END_POINT,
  SERVICE_AUTH_END_POINT,
  commonAPICall,
  myAxios,
} from "../utils/utils";

import SessionTime from "./SessionTime";
import UserMessage from "./UserMessage";

import Icon from "react-native-vector-icons/Feather";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import labour_logo from "../../assets/logo2.png";
import { ToastProvider } from "react-native-sprinkle-toast";
import { useFocusEffect, useNavigationState, CommonActions } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");

const FALLBACK_PROFILE =
  "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const SiteLayout = ({
  children,
  navigation,
  route,
  currentScreenName = "HOME",
  showProfile = true,
}) => {
  const dispatch = useDispatch();

  const state = useSelector((s) => s.LoginReducer);

  const {
    username,
    userId,
    roleName,
    roleId,
    parents = [],
    photoPath,
    lastLoginTime,
    lastLogoutTime,
    lastFailureAttemptTime,
    loginLocation,
    activeUsers,
    token,
    uuid,
  } = state;

  const [selectedParent, setSelectedParent] = useState(null);
  const [selectedChild, setSelectedChild] = useState(null);
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const [activeUsersCount, setActiveUsersCount] = useState(
    Number(activeUsers || 0),
  );

  const [remainingTime, setRemainingTime] = useState(0);

  const [randomTrigger, setRandomTrigger] = useState(Math.random());

  const profileButtonRef = useRef(null);
  const intervalRef = useRef(null);
  const isNavigatingRef = useRef(false);
  const navigationStackRef = useRef([]);

  const profileSource = useMemo(() => {
    if (photoPath && typeof photoPath === "string") {
      return { uri: photoPath };
    }
    return { uri: FALLBACK_PROFILE };
  }, [photoPath]);

  // Track navigation state
  const currentRouteName = useNavigationState(state => state?.routes[state.index]?.name);

  // Reset state when navigating to Home
  useEffect(() => {
    if (currentRouteName === "Home" || currentRouteName === "HOME" || currentRouteName === "Dashboard") {
      setSelectedParent(null);
      setSelectedChild(null);
    }
  }, [currentRouteName]);

  // Handle hardware/gesture back button
  const handleBackPress = useCallback(() => {
    if (isNavigatingRef.current) {
      return true;
    }

    if (selectedChild) {
      // If child is selected, go back to children list
      goBackToChildren();
      return true;
    } else if (selectedParent) {
      // If parent is selected, go back to dashboard
      goBackToDashboard();
      return true;
    }
    return false;
  }, [selectedChild, selectedParent]);

  // Add hardware back button listener for Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress,
    );

    return () => backHandler.remove();
  }, [handleBackPress]);

  // Handle navigation back gestures (iOS and Android)
  useEffect(() => {
    let isBackHandled = false;

    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      // If we have a selected parent or child, prevent default navigation
      if ((selectedParent || selectedChild) && !isBackHandled && !isNavigatingRef.current) {
        e.preventDefault();

        // Handle the back action manually
        if (selectedChild) {
          goBackToChildren();
        } else if (selectedParent) {
          goBackToDashboard();
        }
        
        isBackHandled = true;
        setTimeout(() => {
          isBackHandled = false;
        }, 300);
      }
    });

    return unsubscribe;
  }, [navigation, selectedParent, selectedChild]);

  // Restore navigation state when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Check if we have navigation params with selected child/parent
      if (route?.params?.selectedChild) {
        setSelectedChild(route.params.selectedChild);
        setSelectedParent(route.params.selectedParent || null);
      } else if (route?.params?.selectedParent) {
        setSelectedParent(route.params.selectedParent);
        setSelectedChild(null);
      } else {
        // If no params, reset both selections only if we're on the main screen
        const routeName = route?.name || currentScreenName;
        if (routeName === "Home" || routeName === "HOME" || routeName === "Dashboard") {
          setSelectedParent(null);
          setSelectedChild(null);
        }
      }
    }, [route?.params, route?.name, currentScreenName]),
  );

  useEffect(() => {
    dispatch(hideLoader());
    dispatch(hideMessage());
  }, []);

  const formatSimpleHtmlText = (value) => {
    if (!value) return "-";
    return String(value)
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/?[^>]+(>|$)/g, "");
  };

  const serviceAuthentication = useCallback(async () => {
    try {
      const response = await myAxios.get(SERVICE_AUTH_END_POINT);

      if (response.status === 200) {
        const usersCount = parseInt(
          response?.data?.activeusers?.count || 0,
          10,
        );

        let remainingSeconds = parseInt(response.data.remainingSeconds);

        setActiveUsersCount(usersCount);
        setRemainingTime(remainingSeconds);
        setRandomTrigger(Math.random());
      }
    } catch (error) {}
  }, []);

  const concurrentLoginDetection = useCallback(async () => {
    try {
      const response = await myAxios.get(SERVICE_AUTH_END_POINT);
      if (response.status === 200) {
        const activeCount = parseInt(
          response?.data?.activeusers?.count || 0,
          10,
        );
        setActiveUsersCount(activeCount);
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong";
      navigation?.reset?.({
        index: 0,
        routes: [{ name: "Login" }],
      });
    }
  }, [navigation]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      concurrentLoginDetection();
    }, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [concurrentLoginDetection]);

  useEffect(() => {
    serviceAuthentication();
  }, []);

  const handleLogout = async () => {
    try {
      await myAxios.get(
        `${LOGOUT_END_POINT}?uuid=${uuid}&roleName=${roleName}&type=USER`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      dispatch(logOut());
      setLogoutVisible(false);
      setProfileMenuVisible(false);
      setSidebarVisible(false);
      dispatch(hideModal());
      navigation?.reset?.({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (e) {}
  };

  const getIconName = (menuName) => {
    const iconMap = {
      Home: "home",
      "Grievance Registration": "alert-circle",
      "Trade Union Registration": "users",
      "Online Cess Payment": "credit-card",
      "Skill Development": "briefcase",
      "Worker Registration": "user-plus",
      "Establishment Registration": "building",
      "User Services": "user",
      "Change Password": "lock",
      "Profile Update": "edit",
    };

    return iconMap[menuName] || "grid";
  };

  const parentColors = [
    "#4F46E5",
    "#0EA5E9",
    "#10B981",
    "#F97316",
    "#EC4899",
    "#14B8A6",
    "#8B5CF6",
    "#E11D48",
    "#06B6D4",
    "#84CC16",
  ];

  const handleParentPress = (parent) => {
    const hasChildren = parent.childs && parent.childs.length > 0;

    if (hasChildren) {
      setSelectedParent(parent);
      setSelectedChild(null);
      setSidebarVisible(false);

      navigation.setParams({
        selectedParent: parent,
        selectedChild: null,
      });
    } else {
      if (parent.targeturl) {
        if (parent.targeturl.startsWith("https")) {
          navigation.navigate("WebViewScreen", {
            url: parent.targeturl,
          });
        } else {
          navigation.navigate(parent.targeturl, {
            selectedParent: parent,
            selectedChild: null,
          });
        }
      }
    }
  };

  const handleChildPress = (child) => {
    const hasNoChildren = !child.childs || child.childs.length === 0;

    if (hasNoChildren) {
      if (child?.targeturl_c) {
        if (child.targeturl_c.startsWith("https")) {
          navigation.navigate("WebViewScreen", {
            url: child.targeturl_c,
          });
        } else {
          navigation.navigate(child.targeturl_c, {
            selectedChild: child,
            selectedParent: selectedParent,
          });
        }
      }
    } else {
      setSelectedParent(child);
      setSelectedChild(null);
      setSidebarVisible(false);

      navigation.setParams({
        selectedParent: child,
        selectedChild: null,
      });
    }
  };

  const goBackToDashboard = () => {
    if (isNavigatingRef.current) {
      return;
    }

    isNavigatingRef.current = true;
    
    // Clear state immediately
    setSelectedParent(null);
    setSelectedChild(null);
    
    // Clear navigation params
    navigation.setParams({
      selectedParent: null,
      selectedChild: null,
    });
    
    // Use CommonActions.reset to go back to Home
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: currentScreenName || "Home" }],
      })
    );
    
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 500);
  };

  const goBackToChildren = () => {
    setSelectedChild(null);
    navigation.setParams({
      selectedChild: null,
      selectedParent: selectedParent,
    });
  };

  const openLogoutPopup = () => {
    setProfileMenuVisible(false);
    setLogoutVisible(true);
  };

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const isChildSelected = !!selectedChild;
  const isParentSelected = !!selectedParent && !selectedChild;

  const getBackButtonText = () => {
    if (isChildSelected) return "Back to Services";
    if (isParentSelected) return "Back to Dashboard";
    return "";
  };

  const getCurrentSelectionName = () => {
    if (isChildSelected) return selectedChild?.menuitemname_c;
    if (isParentSelected) return selectedParent?.menuitemname;
    return "";
  };

  const getCurrentSelectionType = () => {
    if (isChildSelected) return "Service";
    if (isParentSelected) return "Category";
    return "";
  };

  const renderSidebar = () => (
    <Modal
      visible={sidebarVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setSidebarVisible(false)}
    >
      <View style={styles.sidebarOverlay}>
        <TouchableOpacity
          style={styles.sidebarBackdrop}
          activeOpacity={1}
          onPress={() => setSidebarVisible(false)}
        />
        <View style={styles.sidebarContainer}>
          <View style={styles.sidebarHeader}>
            <Image source={labour_logo} style={styles.sidebarLogo} />
            <Text style={styles.sidebarHeaderTitle}>APEMCL</Text>
            <TouchableOpacity
              style={styles.sidebarCloseBtn}
              onPress={() => setSidebarVisible(false)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.sidebarUserInfo}>
            <Image source={profileSource} style={styles.sidebarUserImage} />
            <Text style={styles.sidebarUserName}>{username || "User"}</Text>
            <Text style={styles.sidebarUserRole}>{roleName || "Role"}</Text>
          </View>

          <ScrollView
            style={styles.sidebarMenu}
            showsVerticalScrollIndicator={false}
          >
            {parents.map((parent, index) => {
              const bg = parentColors[index % parentColors.length];
              const hasChildren = parent.childs && parent.childs.length > 0;

              return (
                <TouchableOpacity
                  key={index}
                  style={styles.sidebarMenuItem}
                  onPress={() => handleParentPress(parent)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[styles.sidebarMenuIcon, { backgroundColor: bg }]}
                  >
                    <Icon
                      name={getIconName(parent.menuitemname)}
                      size={18}
                      color="#fff"
                    />
                  </View>
                  <Text style={styles.sidebarMenuText} numberOfLines={2}>
                    {parent.menuitemname}
                  </Text>
                  {hasChildren && (
                    <View style={styles.sidebarMenuBadge}>
                      <Text style={styles.sidebarMenuBadgeText}>
                        {parent.childs.length}
                      </Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.sidebarFooter}>
            <TouchableOpacity
              style={styles.sidebarFooterItem}
              onPress={openLogoutPopup}
            >
              <Icon name="log-out" size={20} color="#DC2626" />
              <Text style={styles.sidebarFooterLogoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#0F172A" barStyle="light-content" />
      <ToastProvider>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={toggleSidebar}>
                <Ionicons name="menu" size={28} color="#fff" />
              </TouchableOpacity>
              <View>
                <Text style={styles.headerTitle}>APEMCL</Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              <Text style={{ color: "white", fontWeight: "bold" }}>
                Welcome:{username}
              </Text>
            </View>
          </View>

          {renderSidebar()}

          {profileMenuVisible && (
            <View style={styles.profileMenu}>
              <TouchableOpacity
                style={styles.profileMenuItem}
                onPress={() =>
                  dispatch(
                    showModal(
                      <View>
                        <Text style={styles.modalTitle}>Profile Details</Text>
                        <Image
                          source={profileSource}
                          style={styles.modalImage}
                        />
                        <Text style={styles.profileText}>
                          USER ID : {userId || "-"}
                        </Text>
                        <Text style={styles.profileText}>
                          Name : {username || "-"}
                        </Text>
                        <Text style={styles.profileText}>
                          Role : {roleName || "-"}
                        </Text>
                        <Text style={styles.profileText}>
                          Last Login : {formatSimpleHtmlText(lastLoginTime)}
                        </Text>
                        <Text style={styles.profileText}>
                          Last Logout : {formatSimpleHtmlText(lastLogoutTime)}
                        </Text>
                        <Text style={styles.profileText}>
                          Last Failure Attempt :{" "}
                          {formatSimpleHtmlText(lastFailureAttemptTime)}
                        </Text>
                        {!!loginLocation && roleId === 1 && (
                          <Text style={styles.profileText}>
                            Login Location : {loginLocation}
                          </Text>
                        )}
                      </View>,
                    ),
                  )
                }
              >
                <Icon name="user" size={18} color="#111827" />
                <Text style={styles.profileMenuText}>Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.profileMenuItem}
                onPress={openLogoutPopup}
              >
                <Icon name="log-out" size={18} color="#DC2626" />
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          )}

          <UserMessage />

          {/* BODY - Use ScrollView with proper contentContainerStyle */}
          <ScrollView 
            style={styles.bodyScrollView}
            contentContainerStyle={styles.bodyContentContainer}
            showsVerticalScrollIndicator={true}
          >
            {(selectedParent || selectedChild) && (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={selectedChild ? goBackToChildren : goBackToDashboard}
              >
                <Ionicons name="arrow-back" size={18} color="#fff" />
                <Text style={styles.backBtnText}>{getBackButtonText()}</Text>
              </TouchableOpacity>
            )}

            {selectedChild && (
              <View style={styles.selectedItemContainer}>
                <Text style={styles.selectedItemLabel}>
                  {getCurrentSelectionType()}:
                </Text>
                <Text style={styles.selectedItemName}>
                  {getCurrentSelectionName()}
                </Text>
              </View>
            )}

            {selectedParent && !selectedChild && (
              <>
                <View style={styles.parentHeaderCard}>
                  <Text style={styles.parentHeaderText}>
                    {selectedParent.menuitemname}
                  </Text>
                </View>

                <View style={styles.childrenGrid}>
                  {selectedParent?.childs?.map((child, index) => {
                    const hasSubChildren =
                      child.childs && child.childs.length > 0;
                    return (
                      <TouchableOpacity
                        key={index}
                        style={styles.childCard}
                        onPress={() => handleChildPress(child)}
                        activeOpacity={0.85}
                      >
                        <View style={styles.childLeft}>
                          <View style={styles.childIcon}>
                            <Ionicons
                              name={
                                hasSubChildren
                                  ? "folder-open"
                                  : "chevron-forward"
                              }
                              size={16}
                              color="#4F46E5"
                            />
                          </View>
                          <Text style={styles.childText} numberOfLines={2}>
                            {child.menuitemname_c}
                          </Text>
                        </View>
                        {hasSubChildren ? (
                          <Ionicons
                            name="chevron-forward"
                            size={18}
                            color="#94A3B8"
                          />
                        ) : (
                          <Ionicons
                            name="open-outline"
                            size={18}
                            color="#94A3B8"
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {selectedChild && (
              <View style={styles.childrenWrapper}>{children}</View>
            )}

            {!selectedParent && !selectedChild && (
              <View style={styles.childrenWrapper}>{children}</View>
            )}
            
            {/* Add extra bottom padding to ensure content isn't cut off */}
            <View style={styles.bottomSpacer} />
          </ScrollView>
        </View>
      </ToastProvider>
      
      <Modal
        visible={logoutVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setLogoutVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Logout</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to logout?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setLogoutVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleLogout}
              >
                <Text style={styles.confirmButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default SiteLayout;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "green",
  },

  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },

  header: {
    backgroundColor: "green",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 60,
  },

  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },

  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
  },

  headerTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },

  headerSubTitle: {
    color: "#CBD5E1",
    fontSize: 11,
    marginTop: 3,
  },

  headerRight: {
    flexDirection: "column",
    alignItems: "center",
    gap: 1,
  },

  userCountCard: {
    backgroundColor: "#2563EB",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },

  userCountText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },

  profileImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "#fff",
  },

  sidebarOverlay: {
    flex: 1,
    flexDirection: "row",
  },

  sidebarBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  sidebarContainer: {
    width: width * 0.75,
    backgroundColor: "#0F172A",
    height: "100%",
    paddingTop: 20,
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },

  sidebarHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },

  sidebarLogo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#fff",
  },

  sidebarHeaderTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    marginLeft: 12,
    flex: 1,
  },

  sidebarCloseBtn: {
    padding: 4,
  },

  sidebarUserInfo: {
    alignItems: "center",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },

  sidebarUserImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#4F46E5",
  },

  sidebarUserName: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
  },

  sidebarUserRole: {
    color: "#94A3B8",
    fontSize: 12,
    marginTop: 2,
  },

  sidebarMenu: {
    flex: 1,
    paddingTop: 10,
  },

  sidebarMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },

  sidebarMenuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  sidebarMenuText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },

  sidebarMenuBadge: {
    backgroundColor: "#4F46E5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 8,
  },

  sidebarMenuBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },

  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingVertical: 12,
  },

  sidebarFooterItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  sidebarFooterLogoutText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 12,
  },

  profileMenu: {
    position: "absolute",
    top: 80,
    right: 14,
    backgroundColor: "#fff",
    width: 180,
    borderRadius: 18,
    paddingVertical: 10,
    zIndex: 999,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },

  profileMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },

  profileMenuText: {
    color: "#111827",
    fontWeight: "600",
  },

  logoutText: {
    color: "#DC2626",
    fontWeight: "700",
  },

  bodyScrollView: {
    flex: 1,
  },

  bodyContentContainer: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 40, // Increased bottom padding
    flexGrow: 1,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 14,
  },

  parentHeaderCard: {
    backgroundColor: "#057e1d",
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
  },

  parentHeaderText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },

  childrenGrid: {
    gap: 12,
    paddingBottom: 20,
  },

  childCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    minHeight: 60, // Ensure minimum height for touch targets
  },

  childLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },

  childIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },

  childText: {
    flex: 1,
    color: "#0F172A",
    fontWeight: "700",
    fontSize: 13,
  },

  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F172A",
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginBottom: 16,
    gap: 6,
  },

  backBtnText: {
    color: "#fff",
    fontWeight: "700",
  },

  contentContainer: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 16,
    marginBottom: 20,
  },

  contentHeader: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingBottom: 12,
  },

  contentTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },

  childrenWrapper: {
    minHeight: 200,
    marginTop: -16,
    paddingBottom: 20,
  },

  bottomSpacer: {
    height: 30, // Extra space at the bottom
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 14,
    color: "#111827",
  },

  modalImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignSelf: "center",
    marginBottom: 16,
  },

  profileText: {
    fontSize: 14,
    color: "#334155",
    marginBottom: 10,
    fontWeight: "500",
  },

  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#0F172A",
    paddingVertical: 10,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
  },

  navItem: {
    alignItems: "center",
    gap: 4,
  },

  navLabel: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },

  centerButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    marginTop: -30,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: width - 48,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },

  modalMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  cancelButton: {
    backgroundColor: "#f5f5f5",
  },

  confirmButton: {
    backgroundColor: "#DC2626",
  },

  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },

  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },

  selectedItemContainer: {
    backgroundColor: "#E0E7FF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },

  selectedItemLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4F46E5",
    marginRight: 8,
  },

  selectedItemName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E1B4B",
    flexShrink: 1,
  },
});