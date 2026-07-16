import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Picker } from "@react-native-picker/picker";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  commonAPICall,
  GETDISTSAPP,
  GETMANDALSAPP,
  GETVILLAGESAPP,
  GETSKILLS,
  JOBSEARCH,
  JOBAPPLY,
  FINDWORKER,
} from "../utils/utils";
import { showModal } from "../actions";
import JobDetailsCard from "./JobDetailsScreen";
import UserInfoDisplay from "./UserInfoDisplay";
import MapScreen from "./MapScreen";
import { globalStyes } from "./GlobalStyles";

const JobSearchScreen = ({ navigation }) => {
  const [showMap, setShowMap] = useState(false);
  const dispatch = useDispatch();
  const state = useSelector((state) => state.LoginReducer);

  // Determine if user is employer (roleId = 13) or worker (roleId = 12)
  const isEmployer = state?.roleId === 13;
  const isWorker = state?.roleId === 12;

  const [dists, setDists] = useState([]);
  const [mandal, setMandal] = useState([]);
  const [village, setVillage] = useState([]);

  const [skillsList, setSkillsList] = useState([]);
  const [showSkillsDropdown, setShowSkillsDropdown] = useState(false);

  const [districtId, setDistrictId] = useState("");
  const [mandalId, setMandalId] = useState("");
  const [villageId, setVillageId] = useState("");
  const [skillIds, setSkillIds] = useState([]);
  const [workRate, setWorkRate] = useState("");

  const [loading, setLoading] = useState(false);
  const [resultsList, setResultsList] = useState([]);

  console.log("User Role:", state?.roleId, isEmployer ? "Employer" : "Worker");

  const getdists = async () => {
    try {
      const response = await commonAPICall(GETDISTSAPP, {}, "get", dispatch);
      if (response?.status === 200) {
        setDists(response?.data?.District_List || []);
      } else {
        setDists([]);
      }
    } catch (error) {
      console.log("Error fetching districts:", error);
      setDists([]);
    }
  };

  const getmandals = async (distcode) => {
    try {
      const response = await commonAPICall(
        GETMANDALSAPP + distcode,
        {},
        "get",
        dispatch,
      );

      if (response?.status === 200) {
        setMandal(response?.data?.Mandal_List || []);
      } else {
        setMandal([]);
      }
    } catch (error) {
      console.log("Error fetching mandals:", error);
      setMandal([]);
    }
  };

  const getVillages = async (distcode, mandalcode) => {
    try {
      const cleanMandalCode = String(mandalcode || "").replace(/,/g, "");

      const response = await commonAPICall(
        `${GETVILLAGESAPP}?distCode=${distcode}&mandalCode=${cleanMandalCode}`,
        {},
        "get",
        dispatch,
      );

      if (response?.status === 200) {
        setVillage(response?.data?.Village_List || []);
      } else {
        setVillage([]);
      }
    } catch (error) {
      console.log("Error fetching villages:", error);
      setVillage([]);
    }
  };

  const getSkillsData = async () => {
    try {
      const response = await commonAPICall(GETSKILLS, {}, "get", dispatch);

      if (response?.status === 200) {
        const skillData = response?.data?.Skill_Info_Details || [];
        setSkillsList(skillData);
      } else {
        setSkillsList([]);
      }
    } catch (error) {
      console.log("Error fetching skills:", error);
      setSkillsList([]);
    }
  };

  useEffect(() => {
    getdists();
    getSkillsData();
  }, []);

  const toggleSkill = (id) => {
    setSkillIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

  const selectedSkillNames = useMemo(() => {
    if (!skillIds.length) return "";
    return skillsList
      .filter((item) => skillIds.includes(item.id))
      .map((item) => item.skill_name)
      .join(", ");
  }, [skillIds, skillsList]);

  const handleSearch = async () => {
    try {
      setLoading(true);
      setShowSkillsDropdown(false);

      const queryParams = new URLSearchParams();
      queryParams.append("districtId", districtId);
      queryParams.append("mandalId", mandalId);
      queryParams.append("villageId", villageId);

      skillIds.forEach((id) => {
        queryParams.append("jobCategoryList", id);
      });

      queryParams.append("workRate", workRate);

      // Use different API endpoints based on user role
      const apiUrl = JOBSEARCH;
      const url = `${apiUrl}?${queryParams.toString()}`;

      const response = await commonAPICall(url, {}, "get", dispatch);

      console.log("response", response.data);

      if (response?.status === 200) {
        let results = [];

        if (isEmployer) {
          // For employers: worker search results
          results =
            response?.data?.DigitalLabourChowkJobPosting_SearchResults || [];
          setResultsList(Array.isArray(results) ? results : []);
        } else {
          // For workers: job search results
          results =
            response?.data?.DigitalLabourChowkJobPosting_SearchResults || [];
          setResultsList(Array.isArray(results) ? results : []);
        }

        if (results.length === 0) {
          Alert.alert(
            "Info",
            isEmployer ? "No workers found" : "No jobs found",
          );
        }
      } else {
        setResultsList([]);
        Alert.alert("Info", isEmployer ? "No workers found" : "No jobs found");
      }
    } catch (error) {
      console.log("Search error:", error);
      setResultsList([]);
      Alert.alert(
        "Error",
        isEmployer ? "Unable to fetch workers" : "Unable to fetch jobs",
      );
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (value) => {
    if (!value) return "Recently posted / ఇటీవల పోస్ట్ చేయబడింది";
    return value;
  };

  const formatSalary = (value) => {
    if (value === null || value === undefined || value === "")
      return "Not mentioned / పేర్కొనబడలేదు";
    return `₹ ${value}/month / నెలకు`;
  };

  const ApplyJob = async (id) => {
    const response = await commonAPICall(
      JOBAPPLY,
      {
        jobPostingId: id,
      },
      "post",
      dispatch,
    );
    if (response.status === 200) {
      Alert.alert(
        "Success",
        "Job applied successfully / ఉద్యోగం విజయవంతంగా దరఖాస్తు చేయబడింది",
      );
      handleSearch();
      // setResultsList([]);
    }
  };

  // Render job card for workers
  const renderJobCard = (item, index) => (
    <TouchableOpacity
      key={item?.jobpostingid ? String(item.jobpostingid) : String(index)}
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
          <MaterialIcons name="work" size={22} color="#000" />
        </View>
      </View>

      <View style={styles.jobContent}>
        <Text style={styles.jobTitle} numberOfLines={1}>
          {item.jobtitle}
        </Text>

        <View style={styles.jobMetaRow}>
          <Ionicons name="location-sharp" size={13} color="#e75480" />
          <Text style={styles.jobMetaText} numberOfLines={1}>
            {item.address}
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

        <View style={styles.jobActionRow}>
          <TouchableOpacity
            style={[
              styles.applyJobButton,
              item.isapplied && styles.appliedButton, // 👈 change UI
            ]}
            onPress={() => {
              if (!item.isapplied) {
                ApplyJob(item.jobpostingid);
              }
            }}
            disabled={item.isapplied} // 👈 disable click
          >
            <Ionicons
              name={
                item.isapplied ? "checkmark-done" : "checkmark-circle-outline"
              }
              size={16}
              color="#fff"
            />

            <Text style={styles.applyJobButtonText}>
              {item.isapplied
                ? "Applied / ఇప్పటికే దరఖాస్తు చేశారు"
                : "Apply Job / ఉద్యోగానికి దరఖాస్తు చేయండి"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.jobArrowWrap}>
        <TouchableOpacity
          style={styles.arrowButton}
          onPress={() => {
            dispatch(
              showModal(
                <JobDetailsCard data={item} handleSearch={handleSearch} />,
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

  // Render worker card for employers
  const getWorkerSkills = (skills) => {
    try {
      const parsed = JSON.parse(skills || "[]");
      return parsed
        .slice(0, 2)
        .map((s) => s.skillName)
        .join(", ");
    } catch {
      return "";
    }
  };

  const renderWorkerCard = (worker, index) => {
    console.log("worker", worker);

    return (
      <TouchableOpacity
        key={worker?.labour_id ? String(worker.labour_id) : String(index)}
        style={styles.jobCard}
        activeOpacity={0.85}
      >
        {/* Left Icon */}
        <View style={styles.jobLeftIconWrap}>
          <View style={styles.jobLeftIconCircle}>
            <MaterialIcons name="person" size={22} color="#000" />
          </View>
        </View>

        {/* Content */}
        <View style={styles.jobContent}>
          {/* Name */}
          <Text style={styles.jobTitle} numberOfLines={1}>
            {worker.full_name}
          </Text>

          {/* Location */}
          <View style={styles.jobMetaRow}>
            <Ionicons name="location-sharp" size={13} color="#e75480" />
            <Text style={styles.jobMetaText} numberOfLines={1}>
              {worker.village_name}, {worker.mandal_name}, {worker.dist_name}
            </Text>
          </View>

          {/* Experience */}
          <View style={styles.jobMetaRow}>
            <MaterialIcons name="work-outline" size={13} color="#666" />
            <Text style={styles.jobMetaText}>
              {worker.skill_experience_years || 0} yrs experience / సంవత్సరాల
              అనుభవం
            </Text>
          </View>

          {/* Wage */}
          <View style={styles.jobMetaRow}>
            <Text style={styles.detailValueModern}>
              ₹{worker.skill_daily_rate}/
              {worker.skill_preferred_work_type === "daily_wage"
                ? "day"
                : worker.skill_preferred_work_type === "contract"
                  ? "contract"
                  : ""}
            </Text>
          </View>

          {/* Skills (optional short) */}
          {worker.skills && (
            <View style={styles.jobMetaRow}>
              <Ionicons name="star" size={13} color="#ffc107" />
              <Text style={styles.jobMetaText} numberOfLines={1}>
                {getWorkerSkills(worker.skills)}
              </Text>
            </View>
          )}

          {/* Button */}
          <View style={styles.jobActionRow}>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => handleContactWorker(worker)}
            >
              <Ionicons name="call-outline" size={16} color="#fff" />
              <Text style={styles.applyJobButtonText}>
                Contact / సంప్రదించండి
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Arrow */}
        <View style={styles.jobArrowWrap}>
          <TouchableOpacity style={styles.arrowButton}>
            <Ionicons
              name="chevron-forward"
              size={18}
              color="#fff"
              onPress={() =>
                dispatch(
                  showModal(<UserInfoDisplay data={worker} />, true, true),
                )
              }
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

 const handleContactWorker = (worker) => {
  if (worker?.mobile_number) {
    Linking.openURL(`tel:${worker.mobile_number}`);
  } else {
    console.log("No mobile number available");
  }
};

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.pageTitle}>
          {isEmployer
            ? "Find Workers / కార్మికులను కనుగొనండి"
            : "Find Work / Jobs / ఉద్యోగాలు కనుగొనండి"}
        </Text>

        <View style={styles.formCard}>
          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.fieldLabel}>District / జిల్లా</Text>
              <View style={globalStyes.selectBox}>
                <Picker
                  style={globalStyes.pickerText}
                  selectedValue={districtId}
                  onValueChange={(itemValue) => {
                    setDistrictId(itemValue);
                    setMandalId("");
                    setVillageId("");
                    setMandal([]);
                    setVillage([]);

                    if (itemValue) {
                      getmandals(itemValue);
                    }
                  }}
                >
                  <Picker.Item
                    label="Select District / జిల్లాను ఎంచుకోండి"
                    value=""
                  />
                  {dists.map((dist) => (
                    <Picker.Item
                      key={String(dist.dist_code)}
                      label={dist.dist_name}
                      value={String(dist.dist_code)}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.halfWidth}>
              <Text style={styles.fieldLabel}>Mandal / మండలం</Text>
              <View style={globalStyes.selectBox}>
                <Picker
                 style={globalStyes.pickerText}
                  selectedValue={mandalId}
                  enabled={!!districtId}
                  onValueChange={(itemValue) => {
                    setMandalId(itemValue);
                    setVillageId("");
                    setVillage([]);

                    if (itemValue && districtId) {
                      getVillages(districtId, itemValue);
                    }
                  }}
                >
                  <Picker.Item
                    label="Select Mandal / మండలాన్ని ఎంచుకోండి"
                    value=""
                  />
                  {mandal.map((item) => (
                    <Picker.Item
                      key={String(item.mandal_code)}
                      label={item.mandal_name}
                      value={String(item.mandal_code)}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.fieldLabel}>Village / గ్రామం</Text>
              <View style={globalStyes.selectBox}>
                <Picker
                 style={globalStyes.pickerText}
                  selectedValue={villageId}
                  enabled={!!mandalId}
                  onValueChange={(itemValue) => {
                    setVillageId(itemValue);
                  }}
                >
                  <Picker.Item
                    label="Select Village / గ్రామాన్ని ఎంచుకోండి"
                    value=""
                  />
                  {village.map((item) => (
                    <Picker.Item
                      key={String(item.village_code)}
                      label={item.village_name}
                      value={String(item.village_code)}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.halfWidth}>
              <Text style={styles.fieldLabel}>
                {isEmployer
                  ? "Expected Rate (₹) / ఆశించిన రేటు (₹)"
                  : "Range (₹) / పరిధి (₹)"}
              </Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="cash-outline" size={18} color="#666" />
                <TextInput
                  style={styles.iconInput}
                  value={workRate}
                  onChangeText={(text) =>
                    setWorkRate(text.replace(/[^0-9]/g, ""))
                  }
                  placeholder="Enter amount / మొత్తాన్ని నమోదు చేయండి"
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
            </View>
          </View>

          <View style={styles.fullWidthBlock}>
            <Text style={styles.fieldLabel}>
              {isEmployer
                ? "Required Skills / అవసరమైన నైపుణ్యాలు"
                : "Skills / నైపుణ్యాలు"}
            </Text>

            <TouchableOpacity
              style={[
                globalStyes.selectBox,
                styles.skillsSelectBoxNew,
                showSkillsDropdown && styles.skillsSelectBoxOpenNew,
              ]}
              onPress={() => setShowSkillsDropdown(!showSkillsDropdown)}
              activeOpacity={0.8}
            >
              <Text
                numberOfLines={2}
                style={[
                  styles.skillsSelectedTextNew,
                  { color: selectedSkillNames ? "#000" : "#999" },
                ]}
              >
                {selectedSkillNames || "Select Skills / నైపుణ్యాలను ఎంచుకోండి"}
              </Text>

              <Ionicons
                name={showSkillsDropdown ? "chevron-up" : "chevron-down"}
                size={20}
                color="#333"
              />
            </TouchableOpacity>

            {showSkillsDropdown && (
              <View style={[styles.dropdownBox, styles.skillsDropdownBoxNew]}>
                <ScrollView nestedScrollEnabled style={{ maxHeight: 220 }}>
                  {skillsList.map((item, index) => {
                    const selected = skillIds.includes(item.id);

                    return (
                      <TouchableOpacity
                        key={String(item.id)}
                        style={[
                          styles.skillItem,
                          styles.skillsDropdownItemNew,
                          selected && styles.skillsDropdownItemSelectedNew,
                          index === skillsList.length - 1 &&
                            styles.skillsDropdownLastItemNew,
                        ]}
                        onPress={() => toggleSkill(item.id)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.skillText,
                            styles.skillsDropdownTextNew,
                            selected && styles.skillsDropdownTextSelectedNew,
                          ]}
                        >
                          {item.skill_name}
                        </Text>

                        <Ionicons
                          name={selected ? "checkbox" : "square-outline"}
                          size={22}
                          color={selected ? "#1e3a5f" : "#999"}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearch}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="search" size={16} color="#fff" />
                  <Text style={styles.searchButtonText}>SEARCH / వెతకండి</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mapButton}
              onPress={() => {
                if (resultsList && resultsList.length > 0) {
                  setShowMap(!showMap);
                } else {
                  Alert.alert("No data", "No results to display on the map.");
                }
              }}
            >
              {/* <Ionicons name="map-outline" size={16} color="#2d7fd3" />F */}
              <Text style={styles.mapButtonText}>
                {showMap ? "LIST VIEW / జాబితా " : "MAP VIEW / మ్యాప్ "}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.resultsHeading}>
          {isEmployer
            ? "Worker Results / కార్మికుల ఫలితాలు"
            : "Search Results / శోధన ఫలితాలు"}
        </Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#2d7fd3"
            style={{ marginTop: 20 }}
          />
        ) : showMap ? (
          <MapScreen results={resultsList} />
        ) : resultsList?.length > 0 ? (
          isEmployer ? (
            resultsList.map((item, index) => renderWorkerCard(item, index))
          ) : (
            resultsList
              // .filter((job) => !job.isapplied)
              .map((item, index) => renderJobCard(item, index))
          )
        ) : (
          <View style={styles.noDataCard}>
            <Text style={styles.noDataText}>
              {isEmployer
                ? "No workers found / కార్మికులు ఏరీ లేరు"
                : "No jobs found / ఉద్యోగాలు ఏమీ లేవు"}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default JobSearchScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#2d7fd3",
  },
  appliedButton: {
    backgroundColor: "#6c757d", // grey
    opacity: 0.7,
  },
  topHeader: {
    backgroundColor: "#2d7fd3",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  logoText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#2d7fd3",
  },
  headerGovText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  headerGovSubText: {
    color: "#fff",
    fontSize: 11,
  },
  logoutWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  logoutText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  container: {
    flex: 1,
    backgroundColor: "#eaf3fb",
  },
  contentContainer: {
    padding: 12,
    paddingBottom: 30,
  },
  pageTitle: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: "#222",
    marginVertical: 10,
  },
  formCard: {
    backgroundColor: "#eaf3fb",
    borderRadius: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 10,
  },
  halfWidth: {
    flex: 1,
  },
  fullWidthBlock: {
    marginBottom: 12,
    zIndex: 99,
  },
  fieldLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
    marginLeft: 2,
  },
  selectBox: {
    borderWidth: 1,
    borderColor: "#cfd8e3",
    borderRadius: 4,
    backgroundColor: "#fff",
    overflow: "hidden",
    minHeight: 48,
    justifyContent: "center",
  },
  inputWithIcon: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#cfd8e3",
    borderRadius: 4,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  iconInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#222",
  },
  skillsSelectBoxNew: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 50,
  },
  skillsSelectBoxOpenNew: {
    borderColor: "#2d7fd3",
  },
  skillsSelectedTextNew: {
    flex: 1,
    fontSize: 14,
    marginRight: 10,
  },
  dropdownBox: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#cfd8e3",
    borderRadius: 6,
    backgroundColor: "#fff",
  },
  skillsDropdownBoxNew: {
    maxHeight: 220,
  },
  skillItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  skillsDropdownItemNew: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f7",
  },
  skillsDropdownItemSelectedNew: {
    backgroundColor: "#f1f7ff",
  },
  skillsDropdownLastItemNew: {
    borderBottomWidth: 0,
  },
  skillText: {
    flex: 1,
  },
  skillsDropdownTextNew: {
    fontSize: 14,
    color: "#333",
    paddingRight: 10,
  },
  skillsDropdownTextSelectedNew: {
    color: "#1e3a5f",
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
    gap: 10,
  },
  searchButton: {
    flex: 1,
    backgroundColor: "#2d7fd3",
    height: 42,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  searchButtonText: {
    color: "#fff",
    fontWeight: "700",
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  mapButton: {
    width: 105,
    height: 42,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#bfd4ea",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  mapButtonText: {
    color: "#2d7fd3",
    fontWeight: "700",
    fontSize: 12,
    marginLeft: 5,
  },
  resultsHeading: {
    marginTop: 14,
    marginBottom: 10,
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  jobCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 10,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  jobLeftIconWrap: {
    marginRight: 10,
  },
  jobLeftIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#d9efff",
    alignItems: "center",
    justifyContent: "center",
  },
  jobContent: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: "#333",
    marginBottom: 6,
  },
  jobMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  jobMetaText: {
    marginLeft: 6,
    fontSize: 13,
    color: "#666",
    flex: 1,
  },
  jobArrowWrap: {
    marginLeft: 10,
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
    borderRadius: 10,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  noDataText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  jobActionRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  applyJobButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#28a745",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: "flex-end",
    gap: 6,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "green",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: "flex-end",
    gap: 6,
  },
  applyJobButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
});
