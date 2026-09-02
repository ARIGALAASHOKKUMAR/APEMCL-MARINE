import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFormik, FormikProvider } from 'formik';
import * as Yup from 'yup';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  commonAPICall,
  GETMANIFEST,
  CONTEXT_HEADING,
  POSTMANIFEST,
  RECEIVERDISPOSALMETHODS,
  REDIRECTIONREQUESTTOADMIN,
  REDIRECTIONRECEIVERS,
  UPDATETRANSPORTSELECTION,
  TRACKVEHICLE,
  RECEIVERREQUESTMANIFESTCLOSEADMIN,
} from '../utils/utils';
import { OpenLoader, TermsAndConditions, allowNumbersOnly, allowNumbersOnlyDot } from '../utils/CommonFunctions';
import { showModal } from '../actions';
// import StepperProgress from './Test';

const { width, height } = Dimensions.get('window');

function ManifestConfirmation() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  
  const data = route?.params?.data;
  const key = route?.params?.key;
  const path = route?.params?.path || '';
  
  const state = useSelector((state) => state.LoginReducer);
  const { roleId } = state;
  
  const [manifest, setManifest] = useState([]);
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rejected, setRejected] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [wasteType, setWasteType] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const [redirectReceivers, setRedirectReceivers] = useState([]);
  const [loader, setLoader] = useState(false);
  const [vehicleDistance, setVehicleDistance] = useState(null);
  const [isVehicleTooFar, setIsVehicleTooFar] = useState(false);
  const [vehicleLocation, setVehicleLocation] = useState(null);
  const [vehicleData, setVehicleData] = useState();
  const [recModal, setRecModal] = useState(false);
  const [reasonForRequest, setReasonForRequest] = useState();
  const [recApprove, setRecApprove] = useState(false);
  const [selectedWasteOptions, setSelectedWasteOptions] = useState([]);
  const [disposalMethod, setDisposalMethod] = useState([]);
  const [wasteDetails, setWasteDetails] = useState([]);

  let wasteId = data?.waste_disposal_id || route?.params?.wasteDisposalId || '';
  let wasteInterestId = data?.waste_disposal_interest_id || route?.params?.wasteDisposalInterestId || '';

  const wasteTypes = [];
  const receivers = [];

  const wasteOptions = {
    "Land": [
      "The waste is directly disposed of in a secured landfill.",
      "The waste is disposed of in a secured landfill after treatment."
    ],
    "Incinerable": [
      "The waste is disposed of in an incinerator."
    ],
    "Recyclable": [
      "Reprocessing / reclamation / recycling of waste or used oil.",
      "Recycling of HDPE/LDPE containers, drums, and bags to produce plastic granules.",
      "Recycling of spent catalysts.",
      "Recycling of waste batteries."
    ],
    "Utilizable": [
      "Used as alternative fuel in cement kilns for coprocessing. (Cement industries)",
      "Send to cement industries for coprocessing (Pre-processing units)",
      "Used in Solvent recovery units and produced fresh solvents (solvent recovery units)",
      "Utilizing the Spent acid/waste in alternative usage."
    ],
  };

  async function DisposalMethods(receiver_type_id) {
    let res = await commonAPICall(RECEIVERDISPOSALMETHODS + receiver_type_id, {}, 'GET', dispatch);
    if (res.status === 200) {
      setDisposalMethod(res.data.Receiver_Disposal_Methods || []);
    }
  }

  const GetReceivers = async (type) => {
    let typeId = 0;

    if (type === "SAME_TYPE") {
      const receiverType = manifest?.[0]?.receiver_type_name
        ?.replace(/-/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();

      typeId =
        receiverType === "HW LAND FILLABLE" ? 2 :
        receiverType === "HW INCINERABLE" ? 3 :
        receiverType === "HW RECYCLABLE" ? 4 :
        receiverType === "HW UTILIZABLE" ? 5 : 0;
    } else {
      typeId = type;
    }

    if (!typeId) return;

    const res = await commonAPICall(
      REDIRECTIONRECEIVERS + typeId,
      {},
      "get",
      dispatch
    );

    setRedirectReceivers(res.data.Receiver_Industries || []);
  };

  useEffect(() => {
    async function GetManifest() {
      try {
        let manifestData = [];

        if (key === "transport") {
          manifestData = [data];
        } else {
          let res = await commonAPICall(
            GETMANIFEST + wasteId + "&wasteDisposalInterestId=" + wasteInterestId,
            {},
            "GET",
            dispatch
          );

          if (
            res.status === 200 &&
            res.data?.Transport_Vehicle_Selection_Details?.length > 0
          ) {
            manifestData = [res.data.Transport_Vehicle_Selection_Details[0]];
            let unparsed = manifestData[0].waste_details;
            let wastesDetails = JSON.parse(unparsed);
            setWasteDetails(wastesDetails);
          }
        }

        setManifest(manifestData);
        if (manifestData[0]?.receiver_type_id) {
          DisposalMethods(manifestData[0].receiver_type_id);
        }

        const rawType = manifestData?.[0]?.receiver_type_name || "";
        const receiverType = rawType.split(" ")[1]?.trim();
        const options = wasteOptions?.[receiverType] || [];
        setSelectedWasteOptions(options);

      } catch (error) {
        console.error("Error fetching manifest:", error);
        setManifest([]);
        setSelectedWasteOptions([]);
      } finally {
        setLoading(false);
      }
    }

    GetManifest();
  }, []);

  const handleTermsChange = () => {
    setIsTermsAccepted(!isTermsAccepted);
  };

  const formik = useFormik({
    initialValues: {
      wastes: wasteDetails?.map((item) => ({
        receiverPhValue: "",
        receiverCalorificValues: "",
        interestedQuantity: item?.interested_quantity || "",
        receiverReceivedQuantity: "",
        receiverDisposalMethodIds: "",
        receiverGpsDistance: "770 M",
        receiverWasteName: manifest[0]?.waste_type_name,
        wasteTypeId: manifest[0]?.receiver_type_id,
      }))
    },
    enableReinitialize: true,
    onSubmit: (values) => {
      handleConfirmSubmit("ACCEPTED");
    }
  });

  const redirectionFormik = useFormik({
    initialValues: {
      redirectionType: "",
      wasteType: "",
      receiverId: "",
    },
    validationSchema: Yup.object({
      redirectionType: Yup.string().required("Please select redirection type"),
      wasteType: Yup.string().when("redirectionType", {
        is: "OTHER_TYPE",
        then: (schema) => schema.required("Please select waste type"),
        otherwise: (schema) => schema.notRequired(),
      }),
      receiverId: Yup.string().required("Please select receiver"),
    }),
    onSubmit: async (values) => {
      let payload = {
        manifestNumber: manifest[0]?.manifest_number,
        redirectionType: values.redirectionType,
        redirectedReceiverUserId: values.receiverId,
        redirectionRemarks: "Receiver rejected the manifest",
        redirectedWasteTypeId: values?.wasteType
      };
      
      let res = await commonAPICall(REDIRECTIONREQUESTTOADMIN, payload, 'post', dispatch);
      if (res.status === 200) {
        navigation.navigate('GenApprovedList', {
          id: '4',
          state: {
            rowData: manifest,
          }
        });
      }
    },
  });

  function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const handleApprove = async () => {
    setLoader(true);
    try {
      const res = await commonAPICall(TRACKVEHICLE, {}, 'get', dispatch);
      if (res.status === 200) {
        setLoader(false);
        setVehicleData(res.data.result);
        
        const vehicleLat = res.data.result?.latitude || res.data.result?.lat;
        const vehicleLng = res.data.result?.longitude || res.data.result?.lng || res.data.result?.lon;

        if (vehicleLat && vehicleLng) {
          setVehicleLocation({ lat: vehicleLat, lng: vehicleLng });
          const industryLat = Number(data?.receiver_latitude);
          const industryLng = Number(data?.receiver_longitude);

          if (industryLat && industryLng) {
            const distance = calculateDistance(
              industryLat,
              industryLng,
              vehicleLat,
              vehicleLng
            );

            setVehicleDistance(distance);
            if (distance > 1000) {
              setRecApprove(true);
              setIsVehicleTooFar(false);
              setRecModal(true);
            } else {
              setRecApprove(true);
              setIsVehicleTooFar(false);
              setRecModal(false);
            }
          }
        }
      }
    } catch (error) {
      setLoader(false);
      console.error("Error fetching vehicle location:", error);
      Alert.alert("Error", "Failed to fetch vehicle location");
    }
  };

  const handleConfirmSubmit = async (status) => {
    if (!isTermsAccepted && status === 'ACCEPTED') {
      Alert.alert("Error", "Please agree to the Terms & Conditions before submitting.");
      return;
    }
    if (!remarks.trim() && status === 'REJECTED') return;

    const payload = {
      receiverStatus: status,
      manifestNumber: manifest[0]?.manifest_number,
      transportVehicleSelectionId: manifest[0]?.id,
      receiverWasteDetails: formik.values.wastes,
      receiverAgreedTerms: true,
      receiverRejectionRemarks: remarks,
    };

    const transportPayload = {
      transportVehicleSelectionId: manifest[0]?.id,
      manifestNumber: manifest[0]?.manifest_number,
      transporterStatus: status,
      transporterAgreedTerms: true,
      transporterRejectionRemarks: remarks
    };

    const finalPayload = key === 'transport' ? transportPayload : payload;
    let res = await commonAPICall(POSTMANIFEST, finalPayload, "POST", dispatch);
    if (res.status === 200) {
      if (key === 'transport') {
        navigation.navigate('PendingList');
      } else if (key === 'receiver') {
        navigation.navigate('ManifestListRec');
      } else {
        navigation.navigate('ManifestList');
      }
    }
  };

  async function CloseManifest() {
    let payload = {
      manifestNumber: manifest[0]?.manifest_number,
      manifestCloseReason: reasonForRequest,
      manifestCloseRemarks: remarks
    };
    let res = await commonAPICall(RECEIVERREQUESTMANIFESTCLOSEADMIN, payload, 'post', dispatch);
    if (res.status === 200) {
      if (key === 'transport') {
        navigation.navigate('PendingList');
      } else if (key === 'receiver') {
        navigation.navigate('ManifestListRec');
      } else {
        navigation.navigate('ManifestList');
      }
    }
  }

  const handleReConfirmSubmit = async (item) => {
    const wasteDetails = item?.waste_details ? JSON.parse(item.waste_details) : [];
    const finalPayload = {
      transportVehicleSelectionId: item.id || 0,
      wasteDisposalId: item.waste_disposal_id,
      wasteTypeName: item.waste_type_name,
      wasteDisposalInterestId: item.waste_disposal_interest_id,
      receiverUserId: item.redirected_receiver_user_id || item.receiver_user_id,
      selectedRouteNo: item.selected_route_no,
      totalKms: item.total_kms,
      estimatedTimeMinutes: item.estimated_time_minutes,
      transporterSelectionId: item.transporter_selection_id,
      vehicleSelectionId: item.vehicle_selection_id,
      transporterAddress: item.transporter_address,
      transporterContactNo: item.transporter_contact_no,
      distanceInMeters: item.distance_in_meters,
      agreedToTerms: item.agreed_to_terms,
      exposureHazards: item.exposure_hazard_id,
      firstAidRequirements: item.first_aid_id,
      fireProcedure: item.fire_procedure_id,
      spillageProcedure: item.spillage_procedure_id,
      specialHandlingInstructions: item.special_handling_id,
      receiverWasteTypeId: item.redirected_waste_type_id || 0,
      generatorApprovalTransactionNumber: item.generator_approval_transaction_number,
      wastes: wasteDetails.map((waste) => ({
        wasteTypeId: waste.waste_type_id || 0,
        interestedQuantity: waste.interested_quantity || 0,
        disposalQuantity: waste.disposal_quantity || 0,
        unitId: waste.unit_id || 0,
        wasteDescriptionId: waste.waste_description_id || 0,
        wasteConsistence: waste.waste_consistence_id || 0,
        phValue: waste.ph_value || 0,
        calorificValue: waste.calorific_value || 0,
        packageTypeId: waste.package_type_id || 0,
        noOfPackages: waste.no_of_packages || 0,
        generatorApprovalTransactionNumber: waste.generator_approval_transaction_number || ""
      }))
    };
    
    let res = await commonAPICall(POSTMANIFEST, finalPayload, 'post', dispatch);
    if (res.status === 200) {
      navigation.navigate('ManifestList');
    }
  };

  // Render loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="#2e7d32" barStyle="light-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2e7d32" />
          <Text style={styles.loadingText}>Loading manifest data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!manifest || manifest.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="#2e7d32" barStyle="light-content" />
        <ScrollView style={styles.container}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="list" size={24} color="#2e7d32" />
              <Text style={styles.cardTitle}>Preview Trem Card and Manifest</Text>
            </View>
            <View style={styles.noDataContainer}>
              <Icon name="info-outline" size={40} color="#856404" />
              <Text style={styles.noDataText}>No manifest data available.</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#2e7d32" barStyle="light-content" />
      
      {loader && <OpenLoader />}
      
      {/* Rejection Modal */}
      <Modal
        visible={rejected}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setRejected(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderText}>{CONTEXT_HEADING}</Text>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Remarks</Text>
              <TextInput
                style={styles.modalTextInput}
                multiline
                numberOfLines={3}
                placeholder="Enter remarks"
                value={remarks}
                onChangeText={setRemarks}
              />
              {!remarks.trim() && (
                <Text style={styles.errorText}>* Remarks are Required</Text>
              )}
              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setRejected(false)}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.submitButton]} onPress={() => handleConfirmSubmit('REJECTED')}>
                  <Text style={styles.buttonText}>Submit</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Admin Request Modal */}
      <Modal
        visible={recModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setRecModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderText}>Admin Request</Text>
              <TouchableOpacity onPress={() => setRecModal(false)}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.warningBox}>
                <Icon name="warning" size={20} color="#dc3545" />
                <View style={styles.warningContent}>
                  <Text style={styles.warningTitle}>Vehicle Outside Permitted Range</Text>
                  <Text style={styles.warningText}>
                    The vehicle is more than <Text style={styles.bold}>1000 meters</Text> away from the industry location.
                    If the waste has already been received, you may request the administrator to close the manifest by selecting an appropriate reason.
                  </Text>
                </View>
              </View>

              <Text style={styles.modalLabel}>Reason for Admin Request <Text style={styles.star}>*</Text></Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => {
                    // Show picker options
                    Alert.alert(
                      "Select Reason",
                      "",
                      [
                        { text: "Missed to Close the Manifest by mistake - Vehicle Left the Facility", onPress: () => setReasonForRequest("1") },
                        { text: "Application Down", onPress: () => setReasonForRequest("2") },
                        { text: "Others", onPress: () => setReasonForRequest("3") },
                        { text: "Cancel", style: "cancel" }
                      ]
                    );
                  }}
                >
                  <Text style={[styles.pickerText, !reasonForRequest && styles.placeholderText]}>
                    {reasonForRequest === "1" ? "Missed to Close the Manifest by mistake - Vehicle Left the Facility" :
                     reasonForRequest === "2" ? "Application Down" :
                     reasonForRequest === "3" ? "Others" :
                     "Select Reason"}
                  </Text>
                  <Icon name="arrow-drop-down" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              {!reasonForRequest && (
                <Text style={styles.errorText}>Please select a reason.</Text>
              )}

              {reasonForRequest === "3" && (
                <View>
                  <Text style={styles.modalLabel}>Remarks <Text style={styles.star}>*</Text></Text>
                  <TextInput
                    style={styles.modalTextInput}
                    multiline
                    numberOfLines={3}
                    placeholder="Please specify the reason..."
                    value={remarks}
                    onChangeText={setRemarks}
                  />
                </View>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setRecModal(false)}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.button, styles.primaryButton, !reasonForRequest && styles.disabledButton]} 
                  onPress={CloseManifest}
                  disabled={!reasonForRequest}
                >
                  <Text style={styles.buttonText}>Submit Request</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="list" size={24} color="#2e7d32" />
            <Text style={styles.cardTitle}>
              {key === 'transport' ? 'Transport Acceptance' : 'Preview Trem Card and Manifest'}
            </Text>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.panel}>
              <View style={styles.panelHeading}>
                <Text style={styles.panelHeadingText}>{CONTEXT_HEADING}</Text>
              </View>
              <View style={styles.panelBody}>
                {manifest.map((item, index) => {
                  let wasteDetailsData = [];
                  try {
                    const parsed = JSON.parse(item.waste_details || "[]");
                    wasteDetailsData = Array.isArray(parsed) ? parsed : [];
                  } catch (e) {
                    wasteDetailsData = [];
                  }

                  return (
                    <View key={index} style={styles.manifestContainer}>
                      {/* FORM 9 - TREM CARD */}
                      <View style={styles.formContainer}>
                        <View style={styles.formHeader}>
                          <Text style={styles.formTitle}>FORM 9</Text>
                          <Text style={styles.formSubTitle}>[See Rule 18 (2)]</Text>
                          <Text style={styles.formMainTitle}>TRANSPORT EMERGENCY (TREM) CARD</Text>
                          <Text style={styles.formDescription}>
                            [To Be Carried By The Transporter During Transportation Of Hazardous And Other Wastes Provided By The Sender Of Waste]
                          </Text>
                        </View>

                        <Text style={styles.sectionTitle}>1. Characteristics of hazardous and other wastes:</Text>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          <View style={styles.tremTableContainer}>
                            <View style={styles.tremTableHeader}>
                              <Text style={[styles.tremCell, styles.tremHeaderCell, { width: 40 }]}>S.No</Text>
                              <Text style={[styles.tremCell, styles.tremHeaderCell, { width: 100 }]}>Type Of Waste</Text>
                              <Text style={[styles.tremCell, styles.tremHeaderCell, { width: 80 }]}>Physical Properties</Text>
                              <Text style={[styles.tremCell, styles.tremHeaderCell, { width: 80 }]}>Chemical Constituents</Text>
                              <Text style={[styles.tremCell, styles.tremHeaderCell, { width: 80 }]}>Exposure Hazards</Text>
                              <Text style={[styles.tremCell, styles.tremHeaderCell, { width: 100 }]}>First Aid Requirements</Text>
                            </View>
                            {wasteDetailsData.length > 0 ? (
                              wasteDetailsData.map((waste, idx) => (
                                <View key={idx} style={styles.tremTableRow}>
                                  <Text style={[styles.tremCell, { width: 40 }]}>{idx + 1}</Text>
                                  <Text style={[styles.tremCell, { width: 100 }]}>
                                    <Text style={styles.bold}>{manifest[0]?.receiver_type_name} - {item.waste_type_name || 'N/A'}</Text>
                                  </Text>
                                  <Text style={[styles.tremCell, { width: 80 }]}>{waste?.waste_consistence || 'N/A'}</Text>
                                  <Text style={[styles.tremCell, { width: 80 }]}>{waste?.waste_description || 'N/A'}</Text>
                                  <Text style={[styles.tremCell, { width: 80 }]}>{item.exposure_hazard_name || item.exposure_hazards || 'N/A'}</Text>
                                  <Text style={[styles.tremCell, { width: 100 }]}>{item.first_aid_name || item.first_aid_requirements || 'N/A'}</Text>
                                </View>
                              ))
                            ) : (
                              <View style={styles.tremTableRow}>
                                <Text style={[styles.tremCell, { textAlign: 'center', width: 480 }]}>No Waste Details Available</Text>
                              </View>
                            )}
                          </View>
                        </ScrollView>

                        <View style={styles.divider} />

                        <Text style={styles.infoText}>
                          <Text style={styles.bold}>2. Procedure to be followed in case of fire:</Text> {item.fire_procedure_name || item.fire_procedure || 'N/A'}
                        </Text>

                        <View style={styles.divider} />

                        <Text style={styles.infoText}>
                          <Text style={styles.bold}>3. Procedure to be followed in case of Spillage/accident/explosion:</Text> {item.spillage_procedure_name || item.spillage_procedure || 'N/A'}
                        </Text>

                        <View style={styles.divider} />

                        <View>
                          <Text style={styles.bold}>4. For expert Services, please Contact:</Text>
                          <Text style={styles.infoText}>
                            <Text style={styles.bold}>i) Name and Address:</Text> {item.generator_industry_name || 'N/A'}{item.generator_industry_address ? `, ${item.generator_industry_address}` : ''}
                          </Text>
                          <Text style={styles.infoText}>
                            <Text style={styles.bold}>ii) Telephone No:</Text> {item.generator_contact_mobile || 'N/A'}
                          </Text>
                        </View>

                        <View style={styles.tremFooter}>
                          <Text style={styles.tremFooterText}>
                            <Text style={styles.bold}>Manifest Document No:</Text> {item.manifest_number || "-"}
                          </Text>
                          <Text style={styles.tremFooterText}>
                            <Text style={styles.bold}>Vehicle Number:</Text> {item.vehicle_registration_number || "-"}
                          </Text>
                        </View>

                        <TouchableOpacity style={styles.printButton} onPress={() => Alert.alert("Print", "Print TREM CARD")}>
                          <Icon name="print" size={16} color="#fff" />
                          <Text style={styles.printButtonText}>PRINT TREMCARD</Text>
                        </TouchableOpacity>
                      </View>

                      {/* FORM 10 - MANIFEST */}
                      <View style={[styles.formContainer, { marginTop: 16 }]}>
                        <View style={styles.formHeader}>
                          <Text style={styles.formTitle}>FORM 10</Text>
                          <Text style={styles.formSubTitle}>[See Rule 19 (1)]</Text>
                          <Text style={styles.formMainTitle}>MANIFEST FOR HAZARDOUS AND OTHER WASTE</Text>
                        </View>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          <View style={styles.manifestTableContainer}>
                            {/* Row 1 - Sender */}
                            <View style={styles.manifestRow}>
                              <Text style={[styles.manifestCell, { width: 30 }]}>1</Text>
                              <Text style={[styles.manifestCell, styles.bold, { width: 120 }]}>Sender's Name & Mailing Address</Text>
                              <View style={[styles.manifestCell, { width: 250 }]}>
                                <Text><Text style={styles.bold}>Name:</Text> {item.generator_industry_name || 'N/A'}</Text>
                                <Text><Text style={styles.bold}>Address:</Text> {item.generator_industry_address || 'N/A'}</Text>
                                <Text><Text style={styles.bold}>Phone No.:</Text> {item.generator_contact_mobile || 'N/A'}</Text>
                                <Text><Text style={styles.bold}>Email:</Text> {item.generator_contact_email || 'N/A'}</Text>
                              </View>
                            </View>

                            {/* Row 2 - Authorization No */}
                            <View style={styles.manifestRow}>
                              <Text style={[styles.manifestCell, { width: 30 }]}>2</Text>
                              <Text style={[styles.manifestCell, styles.bold, { width: 120 }]}>Sender's Authorisation No:</Text>
                              <Text style={[styles.manifestCell, { width: 250 }]}>{item.generator_authorization_no || "-"}</Text>
                            </View>

                            {/* Row 3 - Manifest No */}
                            <View style={styles.manifestRow}>
                              <Text style={[styles.manifestCell, { width: 30 }]}>3</Text>
                              <Text style={[styles.manifestCell, styles.bold, { width: 120 }]}>Manifest Document No:</Text>
                              <Text style={[styles.manifestCell, { width: 250 }]}>{item.manifest_number || "-"}</Text>
                            </View>

                            {/* Row 4 - Transporter */}
                            <View style={styles.manifestRow}>
                              <Text style={[styles.manifestCell, { width: 30 }]}>4</Text>
                              <Text style={[styles.manifestCell, styles.bold, { width: 120 }]}>Transporter Name & Mailing Address</Text>
                              <View style={[styles.manifestCell, { width: 250 }]}>
                                <Text><Text style={styles.bold}>Name:</Text> {item.transporter_company_name || 'N/A'}</Text>
                                <Text><Text style={styles.bold}>Address:</Text> {item.transporter_address || 'N/A'}</Text>
                                <Text><Text style={styles.bold}>Phone No.:</Text> {item.transporter_contact_no || 'N/A'}</Text>
                                <Text><Text style={styles.bold}>Email:</Text> {item.transporter_email || 'N/A'}</Text>
                              </View>
                            </View>

                            {/* Row 5 - Vehicle Type */}
                            <View style={styles.manifestRow}>
                              <Text style={[styles.manifestCell, { width: 30 }]}>5</Text>
                              <Text style={[styles.manifestCell, styles.bold, { width: 120 }]}>Type of Vehicle:</Text>
                              <Text style={[styles.manifestCell, { width: 250 }]}>{item.vehicle_type || 'N/A'}</Text>
                            </View>

                            {/* Row 6 - Registration No */}
                            <View style={styles.manifestRow}>
                              <Text style={[styles.manifestCell, { width: 30 }]}>6</Text>
                              <Text style={[styles.manifestCell, styles.bold, { width: 120 }]}>Vehicle Registration No:</Text>
                              <Text style={[styles.manifestCell, { width: 250 }]}>{item.vehicle_registration_number || 'N/A'}</Text>
                            </View>

                            {/* Row 7 - Receiver */}
                            <View style={styles.manifestRow}>
                              <Text style={[styles.manifestCell, { width: 30 }]}>7</Text>
                              <Text style={[styles.manifestCell, styles.bold, { width: 120 }]}>Receiver's Name & Mailing Address</Text>
                              <View style={[styles.manifestCell, { width: 250 }]}>
                                <Text><Text style={styles.bold}>Name:</Text> {item.redirect_receiver_industry_name || item.receiver_industry_name || 'N/A'}</Text>
                                <Text><Text style={styles.bold}>Address:</Text> {item.redirect_receiver_industry_address || item.receiver_industry_address || 'N/A'}</Text>
                                <Text><Text style={styles.bold}>Phone No.:</Text> {item.redirect_receiver_contact_mobile || item.receiver_contact_mobile || 'N/A'}</Text>
                                <Text><Text style={styles.bold}>Email:</Text> {item.redirect_receiver_contact_mobile || item.receiver_contact_email || 'N/A'}</Text>
                              </View>
                            </View>

                            {/* Row 8 - Receiver Authorization */}
                            <View style={styles.manifestRow}>
                              <Text style={[styles.manifestCell, { width: 30 }]}>8</Text>
                              <Text style={[styles.manifestCell, styles.bold, { width: 120 }]}>Receiver's Authorisation No:</Text>
                              <Text style={[styles.manifestCell, { width: 250 }]}>{item.redirect_receiver_authorization_no || item.receiver_authorization_no || "-"}</Text>
                            </View>

                            {/* Row 9 - Waste Description */}
                            <View style={styles.manifestRow}>
                              <Text style={[styles.manifestCell, { width: 30 }]}>9</Text>
                              <Text style={[styles.manifestCell, styles.bold, { width: 120 }]}>Waste Description:</Text>
                              <Text style={[styles.manifestCell, { width: 250 }]}>
                                <Text style={styles.bold}>{manifest[0]?.receiver_type_name} - {item.waste_type_name || 'N/A'}</Text>
                              </Text>
                            </View>

                            {/* Row 10 - Total Quantity */}
                            <View style={styles.manifestRow}>
                              <Text style={[styles.manifestCell, { width: 30 }]}>10</Text>
                              <Text style={[styles.manifestCell, styles.bold, { width: 120 }]}>Total Quantity / No. of Containers:</Text>
                              <View style={[styles.manifestCell, { width: 250 }]}>
                                {wasteDetailsData && wasteDetailsData.length > 0 ? (
                                  wasteDetailsData.map((w, idx) => (
                                    <Text key={idx}>
                                      <Text style={styles.bold}>{String.fromCharCode(97 + idx)})</Text> {w?.disposal_quantity || 'N/A'} {w?.unit || ''}, {w?.no_of_packages || '0'} {w?.package_type || ''}
                                    </Text>
                                  ))
                                ) : (
                                  <Text>N/A</Text>
                                )}
                              </View>
                            </View>

                            {/* Row 11 - Physical Form */}
                            <View style={styles.manifestRow}>
                              <Text style={[styles.manifestCell, { width: 30 }]}>11</Text>
                              <Text style={[styles.manifestCell, styles.bold, { width: 120 }]}>Physical Form:</Text>
                              <View style={[styles.manifestCell, { width: 250 }]}>
                                {wasteDetailsData && wasteDetailsData.length > 0 ? (
                                  wasteDetailsData.map((w, idx) => (
                                    <Text key={idx}>
                                      <Text style={styles.bold}>{String.fromCharCode(97 + idx)})</Text> {w?.waste_consistence || 'N/A'}
                                    </Text>
                                  ))
                                ) : (
                                  <Text>N/A</Text>
                                )}
                              </View>
                            </View>

                            {/* Row 12 - Special Handling */}
                            <View style={styles.manifestRow}>
                              <Text style={[styles.manifestCell, { width: 30 }]}>12</Text>
                              <Text style={[styles.manifestCell, styles.bold, { width: 120 }]}>Special Handling Instructions:</Text>
                              <Text style={[styles.manifestCell, { width: 250 }]}>{item.special_handling_instruction || "Use PPE while loading, unloading & Transit handling"}</Text>
                            </View>

                            {/* Row 13 - Sender's Certificate */}
                            <View style={styles.manifestRow}>
                              <Text style={[styles.manifestCell, { width: 30 }]}>13</Text>
                              <Text style={[styles.manifestCell, styles.bold, { width: 120 }]}>Sender's Certificate:</Text>
                              <Text style={[styles.manifestCell, { width: 250, fontSize: 10 }]}>
                                I hereby declare that the contents of the consignment are fully and accurately described above by proper shipping name and are categorised, packed, marked and labelled, and are in all respects in proper conditions for transport by road according to applicable national government regulations.
                              </Text>
                            </View>

                            {/* Row 13a - Name and stamp */}
                            <View style={styles.manifestRow}>
                              <Text style={[styles.manifestCell, { width: 30 }]}></Text>
                              <Text style={[styles.manifestCell, styles.bold, { width: 120 }]}>Name and stamp:</Text>
                              <View style={[styles.manifestCell, { width: 250 }]}>
                                <Text><Text style={styles.bold}>Signature:</Text> {item.manifest_ip_address ? `Acknowledged from IP: ${item.manifest_ip_address}` : ''}</Text>
                                <Text><Text style={styles.bold}>Date:</Text> {item.manifest_generated_on ? item.manifest_generated_on.split(' ')[0] : ''}</Text>
                              </View>
                            </View>

                            {/* Row 15 - Receiver's certification */}
                            <View style={styles.manifestRow}>
                              <Text style={[styles.manifestCell, { width: 30 }]}>15</Text>
                              <Text style={[styles.manifestCell, styles.bold, { width: 120 }]}>Receiver's certification:</Text>
                              <View style={[styles.manifestCell, { width: 250 }]}>
                                <Text><Text style={styles.bold}>Signature:</Text> {(item.admin_redirection_action_ip === null && item?.receiver_action_ip) ? `Acknowledged from IP: ${item.receiver_action_ip}` : ''}</Text>
                                <Text><Text style={styles.bold}>Date:</Text> {(item.admin_redirection_action_ip === null && item?.receiver_action_on) ? item.receiver_action_on.split(' ')[0] : ''}</Text>
                              </View>
                            </View>
                          </View>
                        </ScrollView>

                        <TouchableOpacity style={styles.printButton} onPress={() => Alert.alert("Print", "Print MANIFEST")}>
                          <Icon name="print" size={16} color="#fff" />
                          <Text style={styles.printButtonText}>PRINT MANIFEST</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Redirection Approved By Admin Section */}
                      {item.current_status === "Redirection Approved By Admin" && (
                        <View style={styles.redirectContainer}>
                          <Text style={styles.redirectTitle}>
                            This is the regenerated Manifest of Manifest Document No: <Text style={styles.redirectHighlight}>{item?.manifest_number}</Text>
                          </Text>

                          <View style={styles.redirectGrid}>
                            <View style={styles.redirectBox}>
                              <Text style={styles.redirectBoxTitle}>Original Sender</Text>
                              <Text style={styles.redirectBoxName}>{item.generator_industry_name}</Text>
                              <Text style={styles.redirectBoxText}>
                                <Text style={styles.bold}>Address:</Text> {item.generator_industry_address}
                              </Text>
                              <Text style={styles.redirectBoxText}>
                                <Text style={styles.bold}>Mobile:</Text> {item.generator_contact_mobile}
                              </Text>
                              <Text style={styles.redirectBoxText}>
                                <Text style={styles.bold}>Email:</Text> {item.generator_contact_email}
                              </Text>
                            </View>

                            <View style={[styles.redirectBox, styles.redirectBoxGreen]}>
                              <Text style={styles.redirectBoxTitle}>Dispatched From</Text>
                              <Text style={styles.redirectBoxName}>{item.receiver_industry_name}</Text>
                              <Text style={styles.redirectBoxText}>
                                <Text style={styles.bold}>Address:</Text> {item.receiver_industry_address}
                              </Text>
                              <Text style={styles.redirectBoxText}>
                                <Text style={styles.bold}>Mobile:</Text> {item.receiver_contact_mobile}
                              </Text>
                              <Text style={styles.redirectBoxText}>
                                <Text style={styles.bold}>Email:</Text> {item.receiver_contact_email}
                              </Text>
                            </View>
                          </View>

                          <View style={styles.termsContainer}>
                            <View style={styles.checkboxContainer}>
                              <TouchableOpacity style={styles.checkbox} onPress={handleTermsChange}>
                                <View style={[styles.checkboxBox, isTermsAccepted && styles.checkboxChecked]}>
                                  {isTermsAccepted && <Icon name="check" size={16} color="#fff" />}
                                </View>
                                <Text style={styles.checkboxLabel}>
                                  I agree to the <Text style={styles.termsLink} onPress={() => dispatch(showModal(<TermsAndConditions />))}>Terms & Conditions</Text>
                                </Text>
                              </TouchableOpacity>
                            </View>
                            <TouchableOpacity 
                              style={[styles.acceptButton, !isTermsAccepted && styles.disabledButton]} 
                              onPress={() => handleReConfirmSubmit(item)}
                              disabled={!isTermsAccepted}
                            >
                              <Icon name="check-circle" size={18} color="#fff" />
                              <Text style={styles.acceptButtonText}>Accept</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}

                      {/* Main Accept/Reject Section */}
                      {(roleId !== 5 && item?.current_status !== "Redirection Approved By Admin") && (
                        <View style={styles.termsContainer}>
                          {(path !== '/AcceptedList' &&
                            path !== '/RejectedList' &&
                            ((roleId === 3 && item?.receiver_action_ip === null) ||
                             (roleId === 2 && item?.manifest_ip_address === null) ||
                             (roleId === 4 && item.transporter_action_ip === null))) && (
                            <View style={styles.checkboxContainer}>
                              <TouchableOpacity style={styles.checkbox} onPress={handleTermsChange}>
                                <View style={[styles.checkboxBox, isTermsAccepted && styles.checkboxChecked]}>
                                  {isTermsAccepted && <Icon name="check" size={16} color="#fff" />}
                                </View>
                                <Text style={styles.checkboxLabel}>
                                  I agree to the <Text style={styles.termsLink} onPress={() => dispatch(showModal(<TermsAndConditions />))}>Terms & Conditions</Text>
                                </Text>
                              </TouchableOpacity>
                            </View>
                          )}

                          {!(item?.receiver_action_ip && item?.receiver_action_on) && (
                            <View style={styles.actionButtons}>
                              {(path === '/PendingList' || path === '/ManifestListRec') && (
                                <TouchableOpacity style={[styles.button, styles.rejectButton]} onPress={() => setRejected(true)}>
                                  <Icon name="cancel" size={18} color="#fff" />
                                  <Text style={styles.buttonText}>Reject</Text>
                                </TouchableOpacity>
                              )}

                              {(path !== '/AcceptedList' && path !== '/RejectedList' && roleId === 3) && (
                                <TouchableOpacity 
                                  style={[styles.acceptButton, !isTermsAccepted && styles.disabledButton]} 
                                  onPress={() => handleApprove(item.vehicle_registration_number)}
                                  disabled={!isTermsAccepted}
                                >
                                  <Icon name="check-circle" size={18} color="#fff" />
                                  <Text style={styles.acceptButtonText}>Accept</Text>
                                </TouchableOpacity>
                              )}

                              {(path !== '/AcceptedList' && path !== '/RejectedList' && ((roleId === 2 && item?.manifest_ip_address === null) || (roleId === 4 && item?.receiver_action_ip === null))) && (
                                <TouchableOpacity 
                                  style={[styles.acceptButton, !isTermsAccepted && styles.disabledButton]} 
                                  onPress={() => handleConfirmSubmit('ACCEPTED')}
                                  disabled={!isTermsAccepted}
                                >
                                  <Icon name="check-circle" size={18} color="#fff" />
                                  <Text style={styles.acceptButtonText}>Accept</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          )}
                        </View>
                      )}

                      {/* Vehicle Distance Display */}
                      {vehicleDistance !== null && (
                        <View style={[styles.distanceContainer, isVehicleTooFar ? styles.distanceDanger : styles.distanceSuccess]}>
                          <Text style={styles.distanceText}>
                            <Text style={styles.bold}>Distance between Industry and Vehicle:</Text>
                            <Text style={[styles.distanceValue, isVehicleTooFar ? styles.distanceDangerText : styles.distanceSuccessText]}>
                              {(vehicleDistance / 1000).toFixed(2)} km ({Math.round(vehicleDistance)} meters)
                            </Text>
                          </Text>
                          {isVehicleTooFar && (
                            <View style={styles.distanceWarning}>
                              <Icon name="warning" size={18} color="#dc3545" />
                              <Text style={styles.distanceWarningText}>
                                <Text style={styles.bold}>Error:</Text> Vehicle is more than 1000 meters away from the industry location.
                              </Text>
                            </View>
                          )}
                        </View>
                      )}

                      {/* Redirection Section for Rejected Manifest */}
                      {(item?.current_status === "Receiver REJECTED" && roleId === 2) && (
                        <View style={styles.redirectFormContainer}>
                          <Text style={styles.rejectedInfo}>
                            This Manifest was Rejected by the Receiver on {item?.receiver_action_on?.split(' ')[0]}
                            {'\n'}Reason: {item?.receiver_rejection_remarks}
                          </Text>

                          <FormikProvider value={redirectionFormik}>
                            <View style={styles.redirectForm}>
                              <Text style={styles.redirectFormTitle}>Request for Redirection to Admin</Text>

                              <View style={styles.radioGroup}>
                                <TouchableOpacity 
                                  style={styles.radioOption} 
                                  onPress={() => {
                                    redirectionFormik.setFieldValue('redirectionType', 'SAME_TYPE');
                                    GetReceivers('SAME_TYPE');
                                  }}
                                >
                                  <View style={[styles.radioCircle, redirectionFormik.values.redirectionType === 'SAME_TYPE' && styles.radioSelected]} />
                                  <Text style={styles.radioLabel}>Same as Type</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                  style={styles.radioOption} 
                                  onPress={() => redirectionFormik.setFieldValue('redirectionType', 'OTHER_TYPE')}
                                >
                                  <View style={[styles.radioCircle, redirectionFormik.values.redirectionType === 'OTHER_TYPE' && styles.radioSelected]} />
                                  <Text style={styles.radioLabel}>As Other Type</Text>
                                </TouchableOpacity>
                              </View>

                              {redirectionFormik.values.redirectionType === "OTHER_TYPE" && (
                                <View style={styles.formGroup}>
                                  <Text style={styles.label}>Type of Waste <Text style={styles.star}>*</Text></Text>
                                  <View style={styles.pickerContainer}>
                                    <TouchableOpacity
                                      style={styles.pickerButton}
                                      onPress={() => {
                                        const options = [
                                          { value: "2", label: "HW - Land Fillable" },
                                          { value: "3", label: "HW - Incinerable" },
                                          { value: "4", label: "HW - Recyclable" },
                                          { value: "5", label: "HW - Utilizable" },
                                        ].filter(item => 
                                          item.label.replace(/-/g, "").replace(/\s+/g, " ").trim().toUpperCase() !==
                                          manifest?.[0]?.receiver_type_name?.trim().toUpperCase()
                                        );
                                        
                                        Alert.alert(
                                          "Select Waste Type",
                                          "",
                                          options.map(opt => ({
                                            text: opt.label,
                                            onPress: () => {
                                              redirectionFormik.setFieldValue('wasteType', opt.value);
                                              GetReceivers(opt.value);
                                            }
                                          })).concat([{ text: "Cancel", style: "cancel" }])
                                        );
                                      }}
                                    >
                                      <Text style={[styles.pickerText, !redirectionFormik.values.wasteType && styles.placeholderText]}>
                                        {redirectionFormik.values.wasteType ? 
                                          options.find(o => o.value === redirectionFormik.values.wasteType)?.label || "Select" 
                                          : "Select"}
                                      </Text>
                                      <Icon name="arrow-drop-down" size={24} color="#666" />
                                    </TouchableOpacity>
                                  </View>
                                  {redirectionFormik.errors.wasteType && redirectionFormik.touched.wasteType && (
                                    <Text style={styles.errorText}>{redirectionFormik.errors.wasteType}</Text>
                                  )}
                                </View>
                              )}

                              <View style={styles.formGroup}>
                                <Text style={styles.label}>Select Receiver <Text style={styles.star}>*</Text></Text>
                                <View style={styles.pickerContainer}>
                                  <TouchableOpacity
                                    style={styles.pickerButton}
                                    onPress={() => {
                                      if (redirectReceivers.length === 0) {
                                        Alert.alert("Info", "No receivers available");
                                        return;
                                      }
                                      Alert.alert(
                                        "Select Receiver",
                                        "",
                                        redirectReceivers.map(item => ({
                                          text: item.receivername,
                                          onPress: () => redirectionFormik.setFieldValue('receiverId', item.registrationcode)
                                        })).concat([{ text: "Cancel", style: "cancel" }])
                                      );
                                    }}
                                  >
                                    <Text style={[styles.pickerText, !redirectionFormik.values.receiverId && styles.placeholderText]}>
                                      {redirectionFormik.values.receiverId ? 
                                        redirectReceivers.find(r => r.registrationcode === redirectionFormik.values.receiverId)?.receivername || "Select" 
                                        : "Select"}
                                    </Text>
                                    <Icon name="arrow-drop-down" size={24} color="#666" />
                                  </TouchableOpacity>
                                </View>
                                {redirectionFormik.errors.receiverId && redirectionFormik.touched.receiverId && (
                                  <Text style={styles.errorText}>{redirectionFormik.errors.receiverId}</Text>
                                )}
                              </View>

                              <TouchableOpacity style={styles.submitRedirectButton} onPress={redirectionFormik.handleSubmit}>
                                <Text style={styles.submitRedirectText}>SUBMIT</Text>
                              </TouchableOpacity>
                            </View>
                          </FormikProvider>
                        </View>
                      )}

                      {/* Receiver Approval Form */}
                      {recApprove && (
                        <FormikProvider value={formik}>
                          <View>
                            {manifest.map((item, idx) => (
                              <View key={idx} style={styles.receiverFormContainer}>
                                <Text style={styles.receiverFormTitle}>
                                  {idx + 1}) Waste Name - {manifest[0]?.waste_type_name}
                                </Text>

                                <View style={styles.receiverFormRow}>
                                  <View style={styles.receiverFormGroup}>
                                    <Text style={styles.label}>Received Qty (Tonnes)</Text>
                                    <TextInput
                                      style={styles.input}
                                      placeholder="Received Qty"
                                      keyboardType="numeric"
                                      value={formik.values.wastes?.[idx]?.receiverReceivedQuantity || ''}
                                      onChangeText={(text) => formik.setFieldValue(`wastes[${idx}].receiverReceivedQuantity`, text)}
                                      maxLength={9}
                                    />
                                  </View>

                                  <View style={styles.receiverFormGroup}>
                                    <Text style={styles.label}>PH</Text>
                                    <TextInput
                                      style={styles.input}
                                      placeholder="PH"
                                      keyboardType="numeric"
                                      value={formik.values.wastes?.[idx]?.receiverPhValue || ''}
                                      onChangeText={(text) => formik.setFieldValue(`wastes[${idx}].receiverPhValue`, text)}
                                      maxLength={2}
                                    />
                                  </View>

                                  <View style={styles.receiverFormGroup}>
                                    <Text style={styles.label}>Calorific Value</Text>
                                    <TextInput
                                      style={styles.input}
                                      placeholder="Calorific Value"
                                      keyboardType="numeric"
                                      value={formik.values.wastes?.[idx]?.receiverCalorificValues || ''}
                                      onChangeText={(text) => formik.setFieldValue(`wastes[${idx}].receiverCalorificValues`, text)}
                                      maxLength={9}
                                    />
                                  </View>

                                  <View style={styles.receiverFormGroup}>
                                    <Text style={styles.label}>Method of Dispose/Recycle/Utilize</Text>
                                    <View style={styles.pickerContainer}>
                                      <TouchableOpacity
                                        style={styles.pickerButton}
                                        onPress={() => {
                                          if (disposalMethod.length === 0) {
                                            Alert.alert("Info", "No disposal methods available");
                                            return;
                                          }
                                          Alert.alert(
                                            "Select Disposal Method",
                                            "",
                                            disposalMethod.map(opt => ({
                                              text: opt.disposalmethodname,
                                              onPress: () => formik.setFieldValue(`wastes[${idx}].receiverDisposalMethodIds`, opt.disposalmethodid)
                                            })).concat([{ text: "Cancel", style: "cancel" }])
                                          );
                                        }}
                                      >
                                        <Text style={[styles.pickerText, !formik.values.wastes?.[idx]?.receiverDisposalMethodIds && styles.placeholderText]}>
                                          {formik.values.wastes?.[idx]?.receiverDisposalMethodIds ? 
                                            disposalMethod.find(m => m.disposalmethodid === formik.values.wastes[idx].receiverDisposalMethodIds)?.disposalmethodname || "Select" 
                                            : "-- Select Method Of Dispose --"}
                                        </Text>
                                        <Icon name="arrow-drop-down" size={24} color="#666" />
                                      </TouchableOpacity>
                                    </View>
                                  </View>
                                </View>
                              </View>
                            ))}

                            <View style={styles.receiverFormButtons}>
                              <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => navigation.navigate('ManifestListRec')}>
                                <Text style={styles.buttonText}>Back to list</Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={[styles.button, styles.successButton]} onPress={formik.handleSubmit}>
                                <Text style={styles.buttonText}>Submit</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </FormikProvider>
                      )}
                    </View>
                  );
                })}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
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
  noDataContainer: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    margin: 16,
  },
  noDataText: {
    color: '#856404',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  manifestContainer: {
    marginBottom: 16,
  },
  formContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  formSubTitle: {
    fontSize: 13,
    color: '#666',
  },
  formMainTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  formDescription: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tremTableContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 8,
  },
  tremTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#e8f5e9',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tremTableRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tremCell: {
    fontSize: 10,
    paddingHorizontal: 2,
    color: '#333',
  },
  tremHeaderCell: {
    fontWeight: 'bold',
    color: '#1e3a5f',
    textAlign: 'center',
  },
  manifestTableContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 8,
    minWidth: 420,
  },
  manifestRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 4,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  manifestCell: {
    fontSize: 10,
    paddingHorizontal: 2,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 8,
  },
  bold: {
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 13,
    color: '#333',
    marginVertical: 2,
  },
  tremFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  tremFooterText: {
    fontSize: 11,
    color: '#333',
  },
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#004b8d',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  printButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 4,
  },
  redirectContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    backgroundColor: '#f8f9fa',
  },
  redirectTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  redirectHighlight: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  redirectGrid: {
    marginBottom: 12,
  },
  redirectBox: {
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#2e7d32',
    marginBottom: 8,
  },
  redirectBoxGreen: {
    borderLeftColor: '#28a745',
  },
  redirectBoxTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6c757d',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  redirectBoxName: {
    fontWeight: '600',
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 2,
  },
  redirectBoxText: {
    fontSize: 12,
    color: '#555',
  },
  termsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#2e7d32',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#2e7d32',
  },
  checkboxLabel: {
    fontSize: 13,
    color: '#333',
  },
  termsLink: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  disabledButton: {
    opacity: 0.5,
  },
  distanceContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 8,
  },
  distanceSuccess: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
  },
  distanceDanger: {
    backgroundColor: '#f8d7da',
    borderColor: '#dc3545',
  },
  distanceText: {
    fontSize: 13,
    color: '#333',
  },
  distanceValue: {
    fontWeight: 'bold',
  },
  distanceSuccessText: {
    color: '#28a745',
  },
  distanceDangerText: {
    color: '#dc3545',
  },
  distanceWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  distanceWarningText: {
    fontSize: 12,
    color: '#dc3545',
    marginLeft: 4,
    flex: 1,
  },
  redirectFormContainer: {
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  rejectedInfo: {
    color: '#dc3545',
    fontSize: 13,
    marginBottom: 12,
  },
  redirectForm: {
    marginTop: 8,
  },
  redirectFormTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2f2f4f',
    marginBottom: 12,
  },
  radioGroup: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 8,
  },
  radioSelected: {
    borderColor: '#2e7d32',
    backgroundColor: '#2e7d32',
  },
  radioLabel: {
    fontSize: 14,
    color: '#333',
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  star: {
    color: 'red',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#333',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    overflow: 'hidden',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  pickerText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 4,
  },
  submitRedirectButton: {
    backgroundColor: '#2e7d32',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  submitRedirectText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  receiverFormContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  receiverFormTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  receiverFormRow: {
    marginBottom: 8,
  },
  receiverFormGroup: {
    marginBottom: 8,
  },
  receiverFormButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
  },
  successButton: {
    backgroundColor: '#28a745',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  submitButton: {
    backgroundColor: '#28a745',
  },
  primaryButton: {
    backgroundColor: '#2e7d32',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '92%',
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    backgroundColor: '#2e7d32',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeaderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalBody: {
    padding: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#f8d7da',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  warningContent: {
    flex: 1,
    marginLeft: 8,
  },
  warningTitle: {
    fontWeight: 'bold',
    color: '#dc3545',
    fontSize: 14,
  },
  warningText: {
    color: '#721c24',
    fontSize: 13,
    marginTop: 2,
  },
});

export default ManifestConfirmation;