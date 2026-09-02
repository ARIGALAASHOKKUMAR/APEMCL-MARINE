import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Platform,
  KeyboardAvoidingView,
  ActionSheetIOS,
} from "react-native";
import { useDispatch } from "react-redux";
import { useFormik, FormikProvider } from "formik";
import * as Yup from "yup";
import Icon from "react-native-vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  commonAPICall,
  CONTEXT_HEADING,
  EFFLUENTDISPOSALDETAILS,
  EFFLUENTENDREADINGCHECK,
  POSTWASTEDISPOSALDETAILS,
  WASTEDISPOSALDETAILS,
} from "../utils/utils";
import { wasteTypes } from "../utils/CommonFunctions";



function AddWasteDisposal() {
  const [wasteData, setWasteData] = useState([]);
  const [res, setRes] = useState("");
  const [mode, setMode] = useState("");
  const [cetpMembership, setCetpMembership] = useState("");
  const [wasteType, setWasteType] = useState("");
  const [effluentType, setEffluentType] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [tankerData, setTankerData] = useState([]);
  const [endReadingStatus, setEndReadingStatus] = useState(false);
  const [cetps, setCetps] = useState([]);
  const [disposalName, setDisposalName] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  // Validation schemas
  const getHTDSValidationSchema = () => {
    return Yup.object({
      effluentType: Yup.string().required("Effluent Type is required"),
      quantity: Yup.number()
        .required("Quantity is required")
        .positive("Quantity must be positive")
        .typeError("Quantity must be a number"),
      ph: Yup.number()
        .required("pH is required")
        .min(0, "pH must be between 0 and 14")
        .max(14, "pH must be between 0 and 14")
        .typeError("pH must be a number"),
      tds: Yup.number()
        .required("TDS is required for HTDS")
        .min(12001, "TDS value must be above 12000 mg/L for HTDS")
        .typeError("TDS must be a number"),
      nh3: Yup.number()
        .required("NH3 is required for HTDS")
        .min(31, "NH3 value must be above 30 mg/L for HTDS")
        .typeError("NH3 must be a number"),
      cod: Yup.number()
        .required("COD is required for HTDS")
        .min(8001, "COD value must be above 8000 mg/L for HTDS")
        .typeError("COD must be a number"),
    });
  };

  const getLTDSValidationSchema = () => {
    return Yup.object({
      effluentType: Yup.string().required("Effluent Type is required"),
      quantity: Yup.number()
        .required("Quantity is required")
        .positive("Quantity must be positive")
        .typeError("Quantity must be a number"),
      ph: Yup.number()
        .required("pH is required")
        .min(0, "pH must be between 0 and 14")
        .max(14, "pH must be between 0 and 14")
        .typeError("pH must be a number"),
      tds: Yup.number()
        .required("TDS is required for LTDS")
        .max(11999, "TDS value must be below 12000 mg/L for LTDS")
        .typeError("TDS must be a number"),
      nh3: Yup.number()
        .required("NH3 is required for LTDS")
        .max(29, "NH3 value must be below 30 mg/L for LTDS")
        .typeError("NH3 must be a number"),
      cod: Yup.number()
        .required("COD is required for LTDS")
        .max(7999, "COD value must be below 8000 mg/L for LTDS")
        .typeError("COD must be a number"),
    });
  };

  const getNonEffluentValidationSchema = () => {
    return Yup.object({
      quantityReadyForDisposal: Yup.array()
        .of(
          Yup.number()
            .transform((value, originalValue) =>
              originalValue === "" ? null : value,
            )
            .nullable()
            .typeError("Enter valid number"),
        )
        .test(
          "at-least-one",
          "Enter Quantity Ready For Disposal in at least one row",
          function (value) {
            const hasValue = value?.some(
              (v) => v !== null && v !== undefined && v !== "",
            );
            if (!hasValue) {
              return this.createError({
                message:
                  "Enter Quantity Ready For Disposal in at least one row",
              });
            }
            return true;
          },
        ),
    });
  };

  const getTankerValidationSchema = () => {
    return Yup.object({
      tankerEntries: Yup.array()
        .of(
          Yup.object({
            qtyReady: Yup.number()
              .transform((value, originalValue) =>
                originalValue === "" ? null : value,
              )
              .nullable()
              .typeError("Enter valid number")
              .min(0, "Quantity cannot be negative"),
            ph: Yup.number()
              .transform((value, originalValue) =>
                originalValue === "" ? null : value,
              )
              .nullable()
              .when("qtyReady", {
                is: (val) => val !== null && val !== undefined && val !== "",
                then: (schema) =>
                  schema
                    .required("PH is required")
                    .min(0, "pH must be between 0 and 14")
                    .max(14, "pH must be between 0 and 14"),
              }),
            tdsMgL: Yup.number()
              .transform((value, originalValue) =>
                originalValue === "" ? null : value,
              )
              .nullable()
              .when("qtyReady", {
                is: (val) => val !== null && val !== undefined && val !== "",
                then: (schema) =>
                  schema
                    .required("TDS is required")
                    .test("tds-validation", function (value) {
                      const { effluentType, qtyReady } = this.parent;
                      if (!qtyReady || qtyReady === "" || qtyReady === null) {
                        return true;
                      }
                      if (
                        effluentType === "HTDS" ||
                        effluentType?.toUpperCase() === "HTDS"
                      ) {
                        if (value <= 12000) {
                          return this.createError({
                            message:
                              "For HTDS effluent, TDS value must be above 12000 mg/L",
                          });
                        }
                      }
                      if (
                        effluentType === "LTDS" ||
                        effluentType?.toUpperCase() === "LTDS"
                      ) {
                        if (value >= 12000) {
                          return this.createError({
                            message:
                              "For LTDS effluent, TDS value must be below 12000 mg/L",
                          });
                        }
                      }
                      return true;
                    }),
              }),
            nh3MgL: Yup.number()
              .transform((value, originalValue) =>
                originalValue === "" ? null : value,
              )
              .nullable()
              .when("qtyReady", {
                is: (val) => val !== null && val !== undefined && val !== "",
                then: (schema) =>
                  schema
                    .required("NH3 is required")
                    .test("nh3-validation", function (value) {
                      const { effluentType, qtyReady } = this.parent;
                      if (!qtyReady || qtyReady === "" || qtyReady === null) {
                        return true;
                      }
                      if (
                        effluentType === "HTDS" ||
                        effluentType?.toUpperCase() === "HTDS"
                      ) {
                        if (value <= 30) {
                          return this.createError({
                            message:
                              "For HTDS effluent, NH3 value must be above 30 mg/L",
                          });
                        }
                      }
                      if (
                        effluentType === "LTDS" ||
                        effluentType?.toUpperCase() === "LTDS"
                      ) {
                        if (value >= 30) {
                          return this.createError({
                            message:
                              "For LTDS effluent, NH3 value must be below 30 mg/L",
                          });
                        }
                      }
                      return true;
                    }),
              }),
            codMgL: Yup.number()
              .transform((value, originalValue) =>
                originalValue === "" ? null : value,
              )
              .nullable()
              .when("qtyReady", {
                is: (val) => val !== null && val !== undefined && val !== "",
                then: (schema) =>
                  schema
                    .required("COD is required")
                    .test("cod-validation", function (value) {
                      const { effluentType, qtyReady } = this.parent;
                      if (!qtyReady || qtyReady === "" || qtyReady === null) {
                        return true;
                      }
                      if (
                        effluentType === "HTDS" ||
                        effluentType?.toUpperCase() === "HTDS"
                      ) {
                        if (value <= 8000) {
                          return this.createError({
                            message:
                              "For HTDS effluent, COD value must be above 8000 mg/L",
                          });
                        }
                      }
                      if (
                        effluentType === "LTDS" ||
                        effluentType?.toUpperCase() === "LTDS"
                      ) {
                        if (value >= 8000) {
                          return this.createError({
                            message:
                              "For LTDS effluent, COD value must be below 8000 mg/L",
                          });
                        }
                      }
                      return true;
                    }),
              }),
          }),
        )
        .test(
          "at-least-one",
          "Enter Quantity Ready For Disposal in at least one row",
          function (value) {
            const hasValue = value?.some(
              (item) =>
                item.qtyReady !== null &&
                item.qtyReady !== undefined &&
                item.qtyReady !== "",
            );
            if (!hasValue) {
              return this.createError({
                message:
                  "Enter Quantity Ready For Disposal in at least one row",
              });
            }
            return true;
          },
        ),
    });
  };

  // Formik instances
  const nonEffluentFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      wasteType: "",
      quantityReadyForDisposal: [],
    },
    validationSchema: getNonEffluentValidationSchema(),
    onSubmit: async (values) => {
      const exceededItems = wasteData.filter((row, index) => {
        const enteredQty = Number(
          values.quantityReadyForDisposal?.[index] || 0,
        );
        const permittedQty = Number(row.permitted_qty || 0);
        const totalDisposed = Number(row.total_qty_disposed || 0);
        return (
          permittedQty > 0 && permittedQty - totalDisposed - enteredQty < 0
        );
      });

      if (exceededItems.length > 0) {
        Alert.alert(
          "Quantity Exceeded",
          "Some quantities exceed permitted quantity. Do you want to proceed?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Proceed",
              onPress: () => submitNonEffluent(values),
            },
          ],
        );
        return;
      }
      submitNonEffluent(values);
    },
  });

  const submitNonEffluent = async (values) => {
    const filteredRows = wasteData
      .map((row, index) => ({
        quantityReadyForDisposal: values.quantityReadyForDisposal?.[index],
        lineOfActivityId: row.process_id,
        categoryId: row.stream_id,
        hazardousWasteName: row.waste_name,
        permittedQuantity: row.permitted_qty,
        totalQtyDisposed: 0,
        permittedDisposalOption: row.disposal_option,
        permittedWasteDetailId: row.permitted_waste_detail_id,
        wasteTypeId: wasteType,
      }))
      .filter((item) => item.quantityReadyForDisposal);

    await HandleSubmit(filteredRows);
  };

  const effluentPipelineFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      effluentType: "",
      quantity: "",
      ph: "",
      tds: "",
      nh3: "",
      cod: "",
    },
    validationSchema:
      effluentType === "HTDS"
        ? getHTDSValidationSchema()
        : getLTDSValidationSchema(),
    onSubmit: (values) => {
      const payload = [
        {
          wasteTypeId: 1,
          modeOfConveyance: mode,
          industryId: cetpMembership,
          cetpMembershipId: parseInt(cetpMembership),
          permittedDisposalOption: "CETP",
          effluentItems: [
            {
              effluentType: effluentPipelineFormik.values.effluentType,
              effluentQuantityReadyForDisposal: parseFloat(values.quantity),
              effluentPermittedQuantity: 200.0,
              effluentTotalQtyDisposed: 80.0,
              effluentPermittedDisposalOption: "CETP",
              ph: parseFloat(values.ph),
              tdsMgL: parseFloat(values.tds),
              nh3MgL: parseFloat(values.nh3),
              codMgL: parseFloat(values.cod),
            },
          ],
        },
      ];
      HandleSubmit(payload);
    },
  });

  const effluentTankerFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      tankerEntries: tankerData.map((item) => ({
        ...item,
        qtyReady: "",
        ph: "",
        tdsMgL: "",
        nh3MgL: "",
        codMgL: "",
      })),
    },
    validationSchema: getTankerValidationSchema(),
    onSubmit: (values) => {
      const exceededItems = values.tankerEntries.filter(
        (item) =>
          Number(item.permittedQty) > 0 &&
          Number(item.qtyReady) > Number(item.permittedQty),
      );

      if (exceededItems.length > 0) {
        Alert.alert(
          "Quantity Exceeded",
          "Some quantities exceed permitted quantity. Do you want to proceed?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Proceed",
              onPress: () => submitTanker(values),
            },
          ],
        );
        return;
      }
      submitTanker(values);
    },
  });

  const submitTanker = async (values) => {
    const filteredEntries = values.tankerEntries
      .filter((entry) => entry.qtyReady && entry.qtyReady !== "")
      .map((entry) => ({
        effluentType: entry.effluentType,
        effluentPermittedQuantity: parseFloat(entry.permittedQty),
        effluentTotalQtyDisposed: parseFloat(entry.totalDisposed),
        effluentPermittedDisposalOption: entry.disposalOption,
        effluentQuantityReadyForDisposal: parseFloat(entry.qtyReady),
        ph: parseFloat(entry.ph || 0),
        tdsMgL: parseFloat(entry.tdsMgL || 0),
        nh3MgL: parseFloat(entry.nh3MgL || 0),
        codMgL: parseFloat(entry.codMgL || 0),
      }));

    const payload = [
      {
        wasteTypeId: 1,
        modeOfConveyance: 2,
        industryId: 101,
        cetpMembershipId: parseInt(cetpMembership),
        permittedDisposalOption: "CETP",
        effluentItems: filteredEntries,
      },
    ];

    await HandleSubmit(payload);
  };

  const otherCETPFormik = useFormik({
    enableReinitialize: true,
    initialValues: {
      tankerEntries: tankerData.map((item) => ({
        ...item,
        qtyReady: "",
        ph: "",
        tdsMgL: "",
        nh3MgL: "",
        codMgL: "",
      })),
    },
    validationSchema: getTankerValidationSchema(),
    onSubmit: (values) => {
      const filteredEntries = values.tankerEntries
        .filter((entry) => entry.qtyReady && entry.qtyReady !== "")
        .map((entry) => ({
          effluentType: entry.type,
          effluentPermittedQuantity: parseFloat(entry.permittedQty),
          effluentTotalQtyDisposed: parseFloat(entry.totalDisposed),
          effluentPermittedDisposalOption: entry.disposalOption,
          effluentQuantityReadyForDisposal: parseFloat(entry.qtyReady),
          ph: parseFloat(entry.ph || 0),
          tdsMgL: parseFloat(entry.tdsMgL || 0),
          nh3MgL: parseFloat(entry.nh3MgL || 0),
          codMgL: parseFloat(entry.codMgL || 0),
        }));

      const payload = [
        {
          wasteTypeId: 1,
          industryId: 101,
          modeOfConveyance: 2,
          cetpMembershipId: parseInt(cetpMembership),
          permittedDisposalOption: "CETP",
          effluentItems: filteredEntries,
        },
      ];

      HandleSubmit(payload);
    },
  });

  async function HandleSubmit(payload, resetForm) {
    try {
      setLoading(true);
      const response = await commonAPICall(
        POSTWASTEDISPOSALDETAILS,
        payload,
        "post",
        dispatch,
      );
      if (response.status === 200) {
        Alert.alert("Success", "Submitted successfully!");
        // Reset all forms and states
        nonEffluentFormik.resetForm();
        effluentPipelineFormik.resetForm();
        effluentTankerFormik.resetForm();
        otherCETPFormik.resetForm();
        setMode("");
        setCetpMembership("");
        setWasteType("");
        setEffluentType("");
        setRes("");
        setShowForm(false);
        setWasteData([]);
      }
    } catch (error) {
      console.error("Submit error:", error);
      Alert.alert("Error", "Submission failed! Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleWasteTypeChange = (selectedWasteType) => {
    if (selectedWasteType === "1") {
      EffluentData();
    }
    setShowForm(false);
    setMode("");
    setCetpMembership("");
    setEffluentType("");
    setWasteType(selectedWasteType);
    setRes("");
    setWasteData([]);

    nonEffluentFormik.resetForm();
    effluentPipelineFormik.resetForm();
    effluentTankerFormik.resetForm();
    otherCETPFormik.resetForm();
  };

  const handleNonEffluentGoClick = async () => {
    if (!wasteType) {
      Alert.alert("Error", "Please select Waste Type");
      return;
    }

    setShowForm(true);
    setLoading(true);
    try {
      const response = await commonAPICall(
        WASTEDISPOSALDETAILS + wasteType,
        {},
        "get",
        dispatch,
      );
      if (response.status === 200) {
        setWasteData(response.data.WasteDisposal_Details || []);
        setRes("datafound");
      } else {
        setRes("nodata");
      }
    } catch (error) {
      console.error("Error fetching waste data:", error);
      setRes("nodata");
    } finally {
      setLoading(false);
    }
  };

  const handleModeSelection = async () => {
    if (!mode) {
      Alert.alert("Error", "Please select Mode of Conveyance");
      return;
    }
    if (!cetpMembership) {
      Alert.alert("Error", "Please select CETP Membership");
      return;
    }

    setShowForm(true);

    if (mode === "1") {
      setRes("pipeline");
      setWasteData([]);
    } else if (mode === "2") {
      setRes("tanker");
      setWasteData([]);
    }
  };

  const handleOtherCETPSelection = async () => {
    if (!cetpMembership) {
      Alert.alert("Error", "Please select CETP Membership");
      return;
    }

    setShowForm(true);
    setRes("otherCETP");
    setWasteData([]);
  };

  const handleEffluentTypeChange = async (type) => {
    try {
      const response = await commonAPICall(
        EFFLUENTENDREADINGCHECK + cetpMembership + "&effluentType=" + type,
        {},
        "get",
        dispatch,
      );
      setEndReadingStatus(response.data.hasPendingReadings);
      setEffluentType(type);
      effluentPipelineFormik.setValues({
        effluentType: type,
        quantity: "",
        ph: "",
        tds: "",
        nh3: "",
        cod: "",
      });
    } catch (error) {
      console.error("Error checking end reading:", error);
    }
  };

  const handleCetpMembershipChange = (value) => {
    setCetpMembership(value);
    setShowForm(false);
    setRes("");
    setMode("");
  };

  const handleModeChange = (value) => {
    setMode(value);
    setShowForm(false);
    setRes("");
  };

  async function EffluentData() {
    try {
      const response = await commonAPICall(
        EFFLUENTDISPOSALDETAILS,
        {},
        "GET",
        dispatch,
      );
      if (response.status === 200) {
        const lastData =
          response?.data?.Effluent_Disposal_Details?.[
            response.data.Effluent_Disposal_Details.length - 1
          ];
        if (lastData) {
          const parsedCetps = JSON.parse(lastData.cetp_details || "[]");
          setCetps(parsedCetps);
          const parsedEffWaste = JSON.parse(lastData.effluentDetails || "[]");
          setTankerData(parsedEffWaste);
          setDisposalName(lastData.disposal_optionname);
          if (lastData.disposal_optionname !== "CETP") {
            setShowForm(true);
            setRes("ZLD");
          }
        }
      }
    } catch (error) {
      console.error("Error fetching effluent data:", error);
    }
  }

  // Custom Dropdown Component with proper scrolling
  const CustomDropdown = ({
    options,
    selectedValue,
    onSelect,
    placeholder,
    label,
    error,
    disabled = false,
  }) => {
    const [showOptions, setShowOptions] = useState(false);

    const getLabel = () => {
      const selected = options.find(
        (opt) => String(opt.value) === String(selectedValue),
      );
      return selected ? selected.label : placeholder || "Select";
    };

    const handlePress = () => {
      if (disabled) return;

      if (Platform.OS === "ios") {
        // Use ActionSheet for iOS for better scrolling
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ["Cancel", ...options.map((o) => o.label)],
            cancelButtonIndex: 0,
            title: label || "Select Option",
          },
          (buttonIndex) => {
            if (buttonIndex > 0) {
              const selectedOption = options[buttonIndex - 1];
              if (selectedOption) {
                onSelect(selectedOption.value);
              }
            }
          },
        );
      } else {
        // Android - show modal with FlatList
        setShowOptions(true);
      }
    };

    // Android Modal with FlatList
    const renderAndroidDropdown = () => {
      if (!showOptions || Platform.OS === "ios") return null;

      return (
        <Modal
          transparent={true}
          visible={showOptions}
          onRequestClose={() => setShowOptions(false)}
          animationType="fade"
          statusBarTranslucent={true}
        >
          <TouchableOpacity
            style={styles.dropdownModalOverlay}
            activeOpacity={1}
            onPress={() => setShowOptions(false)}
          >
            <View style={styles.dropdownModalContent}>
              <View style={styles.dropdownModalHeader}>
                <Text style={styles.dropdownModalTitle}>
                  {label || "Select Option"}
                </Text>
                <TouchableOpacity onPress={() => setShowOptions(false)}>
                  <Icon name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <View style={styles.dropdownListWrapper}>
                <FlatList
                  data={options}
                  keyExtractor={(item, index) => String(item.value) + index}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[
                        styles.dropdownOption,
                        String(selectedValue) === String(item.value) &&
                          styles.dropdownOptionSelected,
                      ]}
                      onPress={() => {
                        onSelect(item.value);
                        setShowOptions(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.dropdownOptionText,
                          String(selectedValue) === String(item.value) &&
                            styles.dropdownOptionTextSelected,
                        ]}
                        numberOfLines={2}
                      >
                        {item.label}
                      </Text>
                      {String(selectedValue) === String(item.value) && (
                        <Icon name="checkmark" size={18} color="#2e7d32" />
                      )}
                    </TouchableOpacity>
                  )}
                  showsVerticalScrollIndicator={true}
                  style={styles.dropdownFlatList}
                  contentContainerStyle={styles.dropdownListContent}
                  nestedScrollEnabled={true}
                  bounces={true}
                  overScrollMode="always"
                  removeClippedSubviews={false}
                  initialNumToRender={10}
                  maxToRenderPerBatch={10}
                  windowSize={5}
                />
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      );
    };

    return (
      <View style={styles.dropdownContainer}>
        {label && (
          <Text style={styles.label}>
            {label} <Text style={styles.star}>*</Text>
          </Text>
        )}
        <TouchableOpacity
          style={[
            styles.dropdownButton,
            disabled && styles.dropdownDisabled,
            error && styles.dropdownError,
          ]}
          onPress={handlePress}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.dropdownButtonText,
              !selectedValue && styles.placeholderText,
            ]}
            numberOfLines={1}
          >
            {getLabel()}
          </Text>
          <Icon name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>

        {renderAndroidDropdown()}

        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  };

  const totalPermittedQty = tankerData.reduce(
    (sum, item) => sum + (Number(item.permittedQty) || 0),
    0,
  );
  const totalToBeDisposed =
    effluentTankerFormik.values?.tankerEntries?.reduce(
      (sum, item) => sum + Number(item?.qtyReady ?? 0),
      0,
    ) || 0;

  const renderPipelineForm = () => {
    return (
      <FormikProvider value={effluentPipelineFormik}>
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelHeaderText}>Effluent Waste Details</Text>
          </View>
          <View style={styles.panelBody}>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>Permitted Disposal Option:</Text>{" "}
                CETP
              </Text>
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>CETP Membership:</Text> Visakha
                Pharmacity Limited
              </Text>
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>Mode of Conveyance:</Text>{" "}
                Pipeline
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Type of Effluent <Text style={styles.star}>*</Text>
              </Text>
              <CustomDropdown
                options={tankerData.map((tt) => ({
                  value: tt.effluentType,
                  label: tt.effluentType,
                }))}
                selectedValue={effluentPipelineFormik.values.effluentType}
                onSelect={(value) => handleEffluentTypeChange(value)}
                placeholder="Select Type"
                error={effluentPipelineFormik.errors.effluentType}
              />
            </View>

            {endReadingStatus ? (
              <View style={styles.endReadingWarning}>
                <Icon name="warning-outline" size={24} color="#dc3545" />
                <Text style={styles.endReadingText}>
                  Previous disposal entry has pending End Reading. Please
                  Update.
                </Text>
              </View>
            ) : (
              effluentPipelineFormik.values.effluentType !== "" && (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>
                      Qty. Ready For Disposal <Text style={styles.star}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={effluentPipelineFormik.values.quantity}
                      onChangeText={effluentPipelineFormik.handleChange(
                        "quantity",
                      )}
                      keyboardType="numeric"
                      maxLength={6}
                      placeholder="Enter quantity"
                    />
                    {effluentPipelineFormik.errors.quantity &&
                      effluentPipelineFormik.touched.quantity && (
                        <Text style={styles.errorText}>
                          {effluentPipelineFormik.errors.quantity}
                        </Text>
                      )}
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>
                      PH <Text style={styles.star}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={effluentPipelineFormik.values.ph}
                      onChangeText={effluentPipelineFormik.handleChange("ph")}
                      keyboardType="numeric"
                      maxLength={3}
                      placeholder="Enter pH"
                    />
                    {effluentPipelineFormik.errors.ph &&
                      effluentPipelineFormik.touched.ph && (
                        <Text style={styles.errorText}>
                          {effluentPipelineFormik.errors.ph}
                        </Text>
                      )}
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>
                      TDS (mg/L) <Text style={styles.star}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={effluentPipelineFormik.values.tds}
                      onChangeText={effluentPipelineFormik.handleChange("tds")}
                      keyboardType="numeric"
                      maxLength={9}
                      placeholder="Enter TDS"
                    />
                    {effluentPipelineFormik.errors.tds &&
                      effluentPipelineFormik.touched.tds && (
                        <Text style={styles.errorText}>
                          {effluentPipelineFormik.errors.tds}
                        </Text>
                      )}
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>
                      NH3 (mg/L) <Text style={styles.star}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={effluentPipelineFormik.values.nh3}
                      onChangeText={effluentPipelineFormik.handleChange("nh3")}
                      keyboardType="numeric"
                      maxLength={7}
                      placeholder="Enter NH3"
                    />
                    {effluentPipelineFormik.errors.nh3 &&
                      effluentPipelineFormik.touched.nh3 && (
                        <Text style={styles.errorText}>
                          {effluentPipelineFormik.errors.nh3}
                        </Text>
                      )}
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>
                      COD (mg/L) <Text style={styles.star}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={effluentPipelineFormik.values.cod}
                      onChangeText={effluentPipelineFormik.handleChange("cod")}
                      keyboardType="numeric"
                      maxLength={6}
                      placeholder="Enter COD"
                    />
                    {effluentPipelineFormik.errors.cod &&
                      effluentPipelineFormik.touched.cod && (
                        <Text style={styles.errorText}>
                          {effluentPipelineFormik.errors.cod}
                        </Text>
                      )}
                  </View>
                </>
              )
            )}
          </View>
        </View>

        {!endReadingStatus && (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={effluentPipelineFormik.handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit</Text>
            )}
          </TouchableOpacity>
        )}
      </FormikProvider>
    );
  };

  const renderTankerTable = (formikInstance, isOtherCETP) => {
    return (
      <FormikProvider value={formikInstance}>
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelHeaderText}>Effluent Waste Details</Text>
          </View>
          <View style={styles.panelBody}>
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>Permitted Disposal Option:</Text>{" "}
                {disposalName}
              </Text>
              {disposalName === "CETP" && wasteType === "1" && (
                <>
                  {!isOtherCETP && (
                    <Text style={styles.infoText}>
                      <Text style={styles.infoLabel}>Mode of Conveyance:</Text>{" "}
                      Tanker
                    </Text>
                  )}
                  <Text style={styles.infoText}>
                    <Text style={styles.infoLabel}>CETP Membership:</Text>{" "}
                    {cetpMembership === "1"
                      ? "Visakha Pharmacity Limited"
                      : "Atchuthapuram Effluent Treatment Plant"}
                  </Text>
                </>
              )}
            </View>

            <View style={styles.tableContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableCell, { width: 50 }]}>S.No</Text>
                    <Text style={[styles.tableCell, { width: 120 }]}>Type</Text>
                    <Text style={[styles.tableCell, { width: 100 }]}>
                      Permitted Qty
                    </Text>
                    <Text style={[styles.tableCell, { width: 120 }]}>
                      Total Disposed
                    </Text>
                    <Text style={[styles.tableCell, { width: 120 }]}>
                      Disposal Option
                    </Text>
                    {((mode === "2" && cetpMembership === "1") ||
                      cetpMembership !== "1") && (
                      <Text style={[styles.tableCell, { width: 120 }]}>
                        Qty Ready
                      </Text>
                    )}
                  </View>

                  {formikInstance.values.tankerEntries.map((item, index) => (
                    <View key={index} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { width: 50 }]}>
                        {String(index + 1).padStart(2, "0")}
                      </Text>
                      <Text style={[styles.tableCell, { width: 120 }]}>
                        {item.effluentType || "-"}
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          { width: 100, textAlign: "right" },
                        ]}
                      >
                        {item.permittedQty}
                      </Text>
                      <Text
                        style={[
                          styles.tableCell,
                          { width: 120, textAlign: "right" },
                        ]}
                      >
                        {item.totalDisposed?.toFixed(2) || "0"}
                      </Text>
                      <Text style={[styles.tableCell, { width: 120 }]}>
                        {item.disposalOption}
                      </Text>
                      {((mode === "2" && cetpMembership === "1") ||
                        cetpMembership !== "1") && (
                        <View style={{ width: 120 }}>
                          <TextInput
                            style={styles.tableInput}
                            value={String(
                              formikInstance.values.tankerEntries[index]
                                ?.qtyReady || "",
                            )}
                            onChangeText={(text) => {
                              formikInstance.setFieldValue(
                                `tankerEntries.${index}.qtyReady`,
                                text,
                              );
                            }}
                            keyboardType="numeric"
                            maxLength={5}
                            placeholder="Qty"
                          />
                          {formikInstance.errors.tankerEntries?.[index]
                            ?.qtyReady && (
                            <Text style={styles.errorTextSmall}>
                              {
                                formikInstance.errors.tankerEntries[index]
                                  .qtyReady
                              }
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                  ))}

                  <View style={[styles.tableRow, styles.totalRow]}>
                    <Text style={[styles.tableCell, { width: 170 }]}>
                      Total permitted Effluent Quantity (KL)
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        { width: 100, textAlign: "right" },
                      ]}
                    >
                      {totalPermittedQty}
                    </Text>
                    {((mode === "2" && cetpMembership === "1") ||
                      cetpMembership !== "1") && (
                      <>
                        <Text style={[styles.tableCell, { width: 220 }]}>
                          Total To be disposed (KL)
                        </Text>
                        <Text
                          style={[
                            styles.tableCell,
                            { width: 100, textAlign: "right" },
                          ]}
                        >
                          {totalToBeDisposed}
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              </ScrollView>

              {typeof formikInstance.errors.tankerEntries === "string" && (
                <Text style={[styles.errorText, styles.tableError]}>
                  {formikInstance.errors.tankerEntries}
                </Text>
              )}
            </View>
          </View>
        </View>

        {((mode === "2" && cetpMembership === "1") ||
          cetpMembership !== "1") && (
          <TouchableOpacity
            style={styles.submitButton}
            onPress={formikInstance.handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Submit</Text>
            )}
          </TouchableOpacity>
        )}
      </FormikProvider>
    );
  };

  const renderNonEffluentTable = () => {
    return (
      <FormikProvider value={nonEffluentFormik}>
        <View style={styles.tableContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, { width: 50 }]}>S.No</Text>
                <Text style={[styles.tableCell, { width: 120 }]}>
                  Line of Activity
                </Text>
                <Text style={[styles.tableCell, { width: 120 }]}>Category</Text>
                <Text style={[styles.tableCell, { width: 120 }]}>
                  Waste Name
                </Text>
                <Text style={[styles.tableCell, { width: 100 }]}>
                  Permitted Qty
                </Text>
                <Text style={[styles.tableCell, { width: 120 }]}>
                  Total Disposed
                </Text>
                <Text style={[styles.tableCell, { width: 120 }]}>
                  Disposal Option
                </Text>
                <Text style={[styles.tableCell, { width: 120 }]}>
                  Qty Ready
                </Text>
              </View>

              {wasteData.map((ww, i) => (
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { width: 50 }]}>{i + 1}</Text>
                  <Text style={[styles.tableCell, { width: 120 }]}>
                    {ww.process_name}
                  </Text>
                  <Text style={[styles.tableCell, { width: 120 }]}>
                    {ww.steam_name}
                  </Text>
                  <Text style={[styles.tableCell, { width: 120 }]}>
                    {ww.waste_name}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      { width: 100, textAlign: "right" },
                    ]}
                  >
                    {ww.permitted_qty}
                  </Text>
                  <Text
                    style={[
                      styles.tableCell,
                      { width: 120, textAlign: "right" },
                    ]}
                  >
                    {ww.total_qty_disposed || "-"}
                  </Text>
                  <Text style={[styles.tableCell, { width: 120 }]}>
                    {ww.disposal_option}
                  </Text>
                  <View style={{ width: 120 }}>
                    <TextInput
                      style={styles.tableInput}
                      value={String(
                        nonEffluentFormik.values.quantityReadyForDisposal?.[
                          i
                        ] || "",
                      )}
                      onChangeText={(text) => {
                        nonEffluentFormik.setFieldValue(
                          `quantityReadyForDisposal.${i}`,
                          text,
                        );
                      }}
                      keyboardType="numeric"
                      maxLength={10}
                      placeholder="Qty"
                    />
                    {nonEffluentFormik.errors.quantityReadyForDisposal?.[i] && (
                      <Text style={styles.errorTextSmall}>
                        {nonEffluentFormik.errors.quantityReadyForDisposal[i]}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>

          {typeof nonEffluentFormik.errors.quantityReadyForDisposal ===
            "string" && (
            <Text style={[styles.errorText, styles.tableError]}>
              {nonEffluentFormik.errors.quantityReadyForDisposal}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={nonEffluentFormik.handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit</Text>
          )}
        </TouchableOpacity>
      </FormikProvider>
    );
  };

  const renderActiveForm = () => {
    if (!showForm) {
      return null;
    }

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2e7d32" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    if (wasteType !== "1" && res === "datafound") {
      return renderNonEffluentTable();
    }

    if (wasteType === "1") {
      if (res === "pipeline") {
        return renderPipelineForm();
      }
      if (res === "tanker") {
        return renderTankerTable(effluentTankerFormik, false);
      }
      if (res === "otherCETP") {
        return renderTankerTable(otherCETPFormik, true);
      }
      if (res === "ZLD") {
        return renderTankerTable(otherCETPFormik, true);
      }
    }

    if (res === "nodata") {
      return (
        <View style={styles.noDataContainer}>
          <Icon name="warning-outline" size={40} color="#856404" />
          <Text style={styles.noDataText}>
            Permitted Quantity not entered by Admin
          </Text>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
        >
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Icon name="sync" size={24} color="#1e3a5f" />
              <Text style={styles.cardTitle}>Add Waste Disposal Details</Text>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.panel}>
                <View style={styles.panelHeader}>
                  <Text style={styles.panelHeaderText}>{CONTEXT_HEADING}</Text>
                </View>
                <View style={styles.panelBody}>
                  <View style={styles.row}>
                    <View style={styles.col12}>
                      <Text style={styles.label}>
                        Waste Type <Text style={styles.star}>*</Text>
                      </Text>
                      <View style={styles.row}>
                        <View style={(wasteType !== "" && wasteType !== "1")?styles.col10:styles.col12}>
                          <CustomDropdown
                            options={wasteTypes}
                            selectedValue={wasteType}
                            onSelect={(value) => handleWasteTypeChange(value)}
                            placeholder="Select Waste Type"
                          />
                        </View>
                        {wasteType !== "" && wasteType !== "1" && (
                          <View style={styles.col2}>
                            <TouchableOpacity
                              style={styles.goButton}
                              onPress={handleNonEffluentGoClick}
                              disabled={loading}
                            >
                              <Text style={styles.goButtonText}>GO</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {wasteType === "1" && disposalName === "CETP" && (
                    <View style={styles.row}>
                      <View style={styles.col12}>
                        <Text style={styles.label}>
                          CETP Membership <Text style={styles.star}>*</Text>
                        </Text>
                        <CustomDropdown
                          options={cetps.map((cc) => ({
                            value: String(cc.cetpMembershipId),
                            label: cc.cetpMembershipName,
                          }))}
                          selectedValue={cetpMembership}
                          onSelect={(value) =>
                            handleCetpMembershipChange(value)
                          }
                          placeholder="Select CETP Membership"
                        />
                      </View>

                      {cetpMembership === "1" && (
                        <>
                          <View style={styles.col12}>
                            <Text style={styles.label}>
                              Mode of Conveyance{" "}
                              <Text style={styles.star}>*</Text>
                            </Text>
                            <CustomDropdown
                              options={cetps
                                .filter(
                                  (cf) =>
                                    cf.cetpMembershipId ===
                                    parseInt(cetpMembership),
                                )
                                .flatMap((cc) =>
                                  cc.modeOfConveyanceId === 3
                                    ? [
                                        { value: "1", label: "Pipeline" },
                                        { value: "2", label: "Tanker" },
                                      ]
                                    : [
                                        {
                                          value: String(cc.modeOfConveyanceId),
                                          label: cc.modeOfConveyanceName,
                                        },
                                      ],
                                )}
                              selectedValue={mode}
                              onSelect={(value) => handleModeChange(value)}
                              placeholder="Select Mode"
                            />
                          </View>

                          <View style={styles.col12}>
                            <TouchableOpacity
                              style={[
                                styles.goButton,
                                (!cetpMembership || !mode) &&
                                  styles.goButtonDisabled,
                              ]}
                              onPress={handleModeSelection}
                              disabled={!cetpMembership || !mode || loading}
                            >
                              <Text style={styles.goButtonText}>GO</Text>
                            </TouchableOpacity>
                          </View>
                        </>
                      )}

                      {cetpMembership !== "1" &&
                        cetpMembership !== null &&
                        cetpMembership !== "" && (
                          <View style={styles.col12}>
                            <TouchableOpacity
                              style={styles.goButton}
                              onPress={handleOtherCETPSelection}
                              disabled={!cetpMembership || loading}
                            >
                              <Text style={styles.goButtonText}>GO</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                    </View>
                  )}
                </View>
              </View>

              {renderActiveForm()}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
  },
  scrollView: {
    flex: 1,
  },
  card: {
    flex: 1,
    margin: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e3a5f",
    marginLeft: 8,
  },
  cardBody: {
    padding: 16,
  },
  panel: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e8ecf1",
    borderRadius: 8,
    overflow: "hidden",
  },
  panelHeader: {
    backgroundColor: "#2e7d32",
    padding: 12,
  },
  panelHeaderText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  panelBody: {
    padding: 16,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  col12: {
    width: "100%",
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  col10: {
    width: "83.33%",
    paddingHorizontal: 4,
  },
  col2: {
    width: "16.67%",
    paddingHorizontal: 4,
    marginTop: -24,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  star: {
    color: "red",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: "#fff",
    color: "#333",
  },
  errorText: {
    color: "#dc3545",
    fontSize: 12,
    marginTop: 4,
  },
  errorTextSmall: {
    color: "#dc3545",
    fontSize: 10,
    marginTop: 2,
  },
  goButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 26,
  },
  goButtonDisabled: {
    opacity: 0.5,
  },
  goButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  infoBox: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
  },
  infoLabel: {
    fontWeight: "600",
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#d8ece8",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    alignItems: "center",
  },
  totalRow: {
    backgroundColor: "#f8fafc",
  },
  tableCell: {
    fontSize: 11,
    paddingHorizontal: 3,
    color: "#333",
  },
  tableInput: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    fontSize: 12,
    backgroundColor: "#fff",
    color: "#333",
  },
  tableError: {
    padding: 8,
    textAlign: "center",
  },
  noDataContainer: {
    padding: 30,
    alignItems: "center",
    backgroundColor: "#fff3cd",
    borderRadius: 8,
    marginTop: 8,
  },
  noDataText: {
    color: "#856404",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  endReadingWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8d7da",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  endReadingText: {
    color: "#721c24",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 14,
  },
  dropdownContainer: {
    marginBottom: 8,
    zIndex: 1,
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    minHeight: 44,
  },
  dropdownDisabled: {
    backgroundColor: "#f0f0f0",
  },
  dropdownError: {
    borderColor: "#dc3545",
  },
  dropdownButtonText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  placeholderText: {
    color: "#999",
  },
  dropdownModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownModalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    width: "90%",
    maxHeight: "100%",
    minHeight: 400,
  },
  dropdownModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
  },
  dropdownModalTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e3a5f",
    flex: 1,
  },
  dropdownListWrapper: {
    flex: 1,
    minHeight: 100,
    maxHeight: 300,
  },
  dropdownFlatList: {
    flex: 1,
  },
  dropdownListContent: {
    paddingVertical: 4,
  },
  dropdownOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
    minHeight: 44,
  },
  dropdownOptionSelected: {
    backgroundColor: "#e8f5e9",
  },
  dropdownOptionText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    marginRight: 8,
  },
  dropdownOptionTextSelected: {
    color: "#2e7d32",
    fontWeight: "600",
  },
});

export default AddWasteDisposal;
