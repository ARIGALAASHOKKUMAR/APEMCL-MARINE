import React, { useEffect, useState, useRef } from "react";
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
} from "react-native";
import { useDispatch } from "react-redux";
import { useFormik } from "formik";
import * as Yup from "yup";
import Icon from "react-native-vector-icons/Ionicons";
import {
  commonAPICall,
  CONTEXT_HEADING,
  DELETEMANAGEPERMITTEDQTY,
  GENERATORS,
  MANAGEPERMITTEDQUANTITY,
  MANAGEPERMITTEDQUANTITYDETAILS,
  PROCESSES,
  RECEIVERS,
  STREAMS,
  CETPS,
} from "../utils/utils";
import { SafeAreaView } from "react-native-safe-area-context";
import { wasteTypes } from "../utils/CommonFunctions";

const ITEMS_PER_PAGE = 10;

const effluentData = [
  { sno: "1", effluentType: "LTDS", permittedQty: "", disposalOption: "" },
  { sno: "2", effluentType: "HTDS", permittedQty: "", disposalOption: "" },
  { sno: "3", effluentType: "Domestic", permittedQty: "", disposalOption: "" },
  { sno: "4", effluentType: "Others", permittedQty: "", disposalOption: "" },
];

const disposalOptions = [
  { value: "", label: "Select Permitted Disposal Option" },
  { value: "1", label: "ZLD" },
  { value: "2", label: "CETP" },
  { value: "3", label: "Onland for Irrigation" },
  { value: "4", label: "Marine Outfall" },
  { value: "5", label: "Domestic" },
];

const modeOfConveyanceOptions = [
  { value: "", label: "Select Mode" },
  { value: "1", label: "Pipeline" },
  { value: "2", label: "Tanker" },
  { value: "3", label: "Both" },
];

const categoryOptions = [
  { value: "", label: "Select Category" },
  { value: "1", label: "Fly Ash" },
  { value: "2", label: "Reuse" },
  { value: "3", label: "Others" },
];

function ManagePermittedQuantity() {
  const [view, setView] = useState([]);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [displayData, setDisplayData] = useState([]);
  const [processes, setProcesses] = useState([]);
  const [streams, setStreams] = useState([]);
  const [cetp, setCetp] = useState([]);
  const [receivers, setReceivers] = useState([]);
  const [selectedIndustry, setSelectedIndustry] = useState(null);
  const [showSecondForm, setShowSecondForm] = useState(false);
  const [wasteTypeValue, setWasteTypeValue] = useState("");
  const [editDisable, setEditDisable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showReceiversModal, setShowReceiversModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const flatListRef = useRef(null);
  const dispatch = useDispatch();

  // Validation Schema for Top Form
  const validationSchemaTop = Yup.object().shape({
    industryId: Yup.string().required("Industry is required"),
    receiverTypeId: Yup.string().required("Waste Type is required"),
  });

  // Validation Schema for Bottom Form
  const validationSchemaBottom = Yup.object({
    industryId: Yup.string().required("Required"),
    receiverTypeId: Yup.string().required("Required"),

    effluentDisposalOption: Yup.string().when("receiverTypeId", {
      is: "1",
      then: (s) => s.required("Required"),
      otherwise: (s) => s.notRequired(),
    }),

    cetpMembershipId1: Yup.string().when(
      ["receiverTypeId", "effluentDisposalOption"],
      {
        is: (receiverTypeId, disposalOption) =>
          receiverTypeId === "1" && disposalOption === "2",
        then: (s) => s.required("Required"),
        otherwise: (s) => s.notRequired(),
      }
    ),
    modeOfConveyance1: Yup.string().when(["cetpMembershipId1"], {
      is: (cetpMembershipId1) => cetpMembershipId1 === "1",
      then: (s) => s.required("Required"),
      otherwise: (s) => s.notRequired(),
    }),
    modeOfConveyance2: Yup.string().when(["cetpMembershipId1"], {
      is: (cetpMembershipId1) => cetpMembershipId1 === "1",
      then: (s) => s.required("Required"),
      otherwise: (s) => s.notRequired(),
    }),
    modeOfConveyance3: Yup.string().when(["cetpMembershipId1"], {
      is: (cetpMembershipId1) => cetpMembershipId1 === "1",
      then: (s) => s.required("Required"),
      otherwise: (s) => s.notRequired(),
    }),

    effluentRows: Yup.array()
      .of(
        Yup.object({
          sno: Yup.string(),
          effluentType: Yup.string(),
          permittedQty: Yup.string(),
          disposalOption: Yup.string(),
        })
      )
      .when("$receiverTypeId", {
        is: "1",
        then: (schema) =>
          schema.test(
            "at-least-one-row",
            "At least one effluent row must have Permitted Quantity and Disposal Option",
            (rows) => {
              if (!rows || rows.length === 0) return false;
              return rows.some(
                (row) =>
                  row?.permittedQty?.toString().trim() &&
                  row?.disposalOption?.toString().trim()
              );
            }
          ),
        otherwise: (schema) => schema,
      }),

    categoryId: Yup.string().when("receiverTypeId", {
      is: "6",
      then: (s) => s.required("Required"),
      otherwise: (s) => s.notRequired(),
    }),

    processId: Yup.string().when("receiverTypeId", {
      is: (v) => ["2", "3", "4", "5"].includes(v),
      then: (s) => s.required("Required"),
      otherwise: (s) => s.notRequired(),
    }),

    streamId: Yup.string().when("receiverTypeId", {
      is: (v) => ["2", "3", "4", "5"].includes(v),
      then: (s) => s.required("Required"),
      otherwise: (s) => s.notRequired(),
    }),

    wasteName: Yup.string().when("receiverTypeId", {
      is: (v) => ["2", "3", "4", "5", "6"].includes(v),
      then: (s) => s.required("Required"),
      otherwise: (s) => s.notRequired(),
    }),

    permittedQty: Yup.string().when("receiverTypeId", {
      is: (v) => ["2", "3", "4", "5", "6"].includes(v),
      then: (s) => s.required("Required"),
      otherwise: (s) => s.notRequired(),
    }),

    disposalOption: Yup.string().when("receiverTypeId", {
      is: (v) => ["2", "3", "4", "5", "6"].includes(v),
      then: (s) => s.required("Required"),
      otherwise: (s) => s.notRequired(),
    }),

    receiverIds: Yup.array().when("receiverTypeId", {
      is: (val) => Number(val) === 4,
      then: (s) => s.min(1, "Required"),
      otherwise: (s) => s.notRequired(),
    }),
  });

  // Top Form
  const formikTop = useFormik({
    initialValues: {
      industryId: "",
      receiverTypeId: "",
    },
    validationSchema: validationSchemaTop,
    onSubmit: (values) => {
      setEditDisable(false);
      setWasteTypeValue(values.receiverTypeId);
      setShowSecondForm(true);
      GetIndustriesData();
    },
  });

  // Bottom Form
  const formikBottom = useFormik({
    initialValues: {
      cetpMembershipId1: "",
      cetpMembershipId2: "",
      cetpMembershipId3: "",
      modeOfConveyance1: "",
      modeOfConveyance2: "",
      modeOfConveyance3: "",
      effluentDisposalOption: "",
      effluentRows: effluentData.map((e) => ({
        sno: e.sno,
        effluentDetailId: "",
        effluentType: e.effluentType,
        permittedQty: "",
        disposalOption: "",
      })),
      receiverType: "",
      categoryId: "",
      wasteName: "",
      processId: "",
      streamId: "",
      permittedQty: "",
      receiverIds: [],
      disposalOption: "",
      effluentId: "",
      industryId: "",
      receiverTypeId: "",
    },
    validationSchema: validationSchemaBottom,
    enableReinitialize: true,
    onSubmit: (values) => {
      HandleSubmit(values);
    },
  });

  // Update bottom form when top form changes
  useEffect(() => {
    if (formikTop.values.industryId && formikTop.values.receiverTypeId) {
      formikBottom.setFieldValue("industryId", formikTop.values.industryId);
      formikBottom.setFieldValue(
        "receiverTypeId",
        formikTop.values.receiverTypeId
      );
    }
  }, [formikTop.values.industryId, formikTop.values.receiverTypeId]);

  const HandleSubmit = async (values) => {
    try {
      setLoading(true);

      const payload = {
        industryId: values.industryId,
        receiverTypeId: values.receiverTypeId,
        wasteName: values.wasteName || "",
        permittedQty: values.permittedQty || "",
        disposalOption: values.disposalOption || "",
        processId: values.processId || "",
        streamId: values.streamId || "",
        categoryId: values.categoryId || "",
        receiverIds: values.receiverIds || [],
        effluentDisposalOption: values.effluentDisposalOption || "",
        cetpMembershipId1: values.cetpMembershipId1 || "",
        cetpMembershipId2: values.cetpMembershipId2 || "",
        cetpMembershipId3: values.cetpMembershipId3 || "",
        modeOfConveyance1: values.modeOfConveyance1 || "",
        modeOfConveyance2: values.modeOfConveyance2 || "",
        modeOfConveyance3: values.modeOfConveyance3 || "",
        effluentRows: values.effluentRows.filter(
          (row) =>
            row.permittedQty !== "" &&
            row.permittedQty !== null &&
            row.permittedQty !== undefined
        ),
        effluentId: values.effluentId || "",
        wasteId: values.wasteId || "",
      };

      const response = await commonAPICall(
        MANAGEPERMITTEDQUANTITY,
        payload,
        "post",
        dispatch
      );

      if (response.status === 200 || response.status === 201) {
        Alert.alert("Success", "Data saved successfully");
        GetIndustriesData();
        formikBottom.resetForm();
        setEditDisable(false);
      } else {
        Alert.alert("Error", response.message || "Failed to save data");
      }
    } catch (error) {
      console.log("Submit error:", error);
      Alert.alert("Error", error.message || "Failed to save data");
    } finally {
      setLoading(false);
    }
  };

  const GetGeneratorsNames = async () => {
    try {
      const response = await commonAPICall(GENERATORS, {}, "get", dispatch);
      if (response.status === 200) {
        setView(response.data.Industry_List || []);
      }
    } catch (error) {
      console.log("Error fetching generators:", error);
    }
  };

  const GetProcesses = async () => {
    try {
      const response = await commonAPICall(PROCESSES, {}, "get", dispatch);
      if (response.status === 200) {
        setProcesses(response.data.Processes || []);
      }
    } catch (error) {
      console.log("Error fetching processes:", error);
    }
  };

  const GetStreams = async (processId) => {
    try {
      formikBottom.setFieldValue("processId", processId);
      const response = await commonAPICall(
        STREAMS + processId,
        {},
        "get",
        dispatch
      );
      if (response.status === 200) {
        setStreams(response.data.Steam || []);
      }
    } catch (error) {
      console.log("Error fetching streams:", error);
    }
  };

  const GetCetp = async () => {
    try {
      const response = await commonAPICall(CETPS, {}, "get", dispatch);
      if (response.status === 200) {
        setCetp(response.data.CETPs || []);
      }
    } catch (error) {
      console.log("Error fetching CETP:", error);
    }
  };

  const GetReceiversNames = async () => {
    try {
      const response = await commonAPICall(RECEIVERS, {}, "get", dispatch);
      if (response.status === 200) {
        setReceivers(response.data.Industry_List || []);
      }
    } catch (error) {
      console.log("Error fetching receivers:", error);
    }
  };

  const GetIndustriesData = async () => {
    try {
      setLoading(true);
      const response = await commonAPICall(
        MANAGEPERMITTEDQUANTITYDETAILS +
          "industryId=" +
          formikTop.values.industryId +
          "&receiverTypeId=" +
          formikTop.values.receiverTypeId,
        {},
        "get",
        dispatch
      );

      if (response.status === 200) {
        const apiData = response.data.data || [];
        setData(apiData);
        setFilteredData(apiData);
        updatePagination(apiData);

        if (formikTop.values.receiverTypeId === "1" && apiData.length > 0) {
          const d = apiData[0];
          if (d?.effluentDetails) {
            formikBottom.setFieldValue(
              "effluentDisposalOption",
              d.disposal_option || ""
            );
            formikBottom.setFieldValue(
              "cetpMembershipId1",
              d.cetp_membership_id1 || ""
            );
            formikBottom.setFieldValue(
              "cetpMembershipId2",
              d.cetp_membership_id2 || ""
            );
            formikBottom.setFieldValue(
              "cetpMembershipId3",
              d.cetp_membership_id3 || ""
            );
            formikBottom.setFieldValue(
              "modeOfConveyance1",
              d.mode_of_conveyance_1 || ""
            );
            formikBottom.setFieldValue(
              "modeOfConveyance2",
              d.mode_of_conveyance_2 || ""
            );
            formikBottom.setFieldValue(
              "modeOfConveyance3",
              d.mode_of_conveyance_3 || ""
            );

            const parsedEffluent = JSON.parse(d.effluentDetails);
            const existingRows = formikBottom.values.effluentRows || [];
            const updatedRows = existingRows.map((row) => {
              const matched = parsedEffluent.find(
                (x) =>
                  x.effluentType?.toLowerCase() ===
                  row.effluentType?.toLowerCase()
              );
              return matched
                ? {
                    ...row,
                    effluentDetailId: matched?.effluentDetailId || "",
                    permittedQty: matched?.permittedQty || "",
                    disposalOption: matched?.disposalOption || "",
                  }
                : { ...row, permittedQty: "", disposalOption: "" };
            });
            formikBottom.setFieldValue("effluentRows", updatedRows);
          }
        }
      }
    } catch (error) {
      console.log("Error fetching industry data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updatePagination = (dataArray) => {
    const total = Math.ceil(dataArray.length / ITEMS_PER_PAGE);
    setTotalPages(total);
    setCurrentPage(1);
    const start = 0;
    const end = ITEMS_PER_PAGE;
    setDisplayData(dataArray.slice(start, end));
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

  const handleDeleteEffluent = async (receiverType, recordId) => {
    Alert.alert(
      "Are you sure?",
      "You want to delete this record.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await commonAPICall(
                DELETEMANAGEPERMITTEDQTY +
                  receiverType +
                  "&recordId=" +
                  recordId,
                {},
                "POST",
                dispatch
              );
              if (res.status === 200) {
                Alert.alert("Success", "Record deleted successfully");
                GetIndustriesData();
                formikBottom.resetForm();
                setEditDisable(false);
              }
            } catch (error) {
              console.log("Delete error:", error);
              Alert.alert("Error", "Failed to delete record");
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const handleEditEffluent = (d, eff) => {
    setEditDisable(true);
    formikBottom.setFieldValue("effluentDisposalOption", d.disposal_option);
    formikBottom.setFieldValue(
      "cetpMembershipId1",
      d.cetp_membership_id1 || ""
    );
    formikBottom.setFieldValue(
      "cetpMembershipId2",
      d.cetp_membership_id2 || ""
    );
    formikBottom.setFieldValue(
      "cetpMembershipId3",
      d.cetp_membership_id3 || ""
    );
    formikBottom.setFieldValue(
      "modeOfConveyance1",
      d.mode_of_conveyance_1 || ""
    );
    formikBottom.setFieldValue(
      "modeOfConveyance2",
      d.mode_of_conveyance_2 || ""
    );
    formikBottom.setFieldValue(
      "modeOfConveyance3",
      d.mode_of_conveyance_3 || ""
    );
    formikBottom.setFieldValue("effluentId", d.effluentid || "");

    const effList = JSON.parse(d.effluentDetails || "[]");
    const rows = effluentData.map((effluent, index) => {
      const existingRow = effList.find(
        (item) => item.effluentType === effluent.effluentType
      );
      return {
        sno: index + 1,
        effluentDetailId: existingRow?.effluentDetailId || "",
        effluentType: effluent.effluentType,
        permittedQty: existingRow?.permittedQty || "",
        disposalOption: existingRow?.disposalOption || "",
      };
    });
    formikBottom.setFieldValue("effluentRows", rows);
    setWasteTypeValue("1");
  };

  const handleEdit = (d) => {
    const rtype = Number(formikTop.values.receiverTypeId || 0);
    GetStreams(d.process_id);
    setEditDisable(true);
    setWasteTypeValue(String(rtype));

    formikBottom.setFieldValue("processId", d.process_id || "");
    formikBottom.setFieldValue("streamId", d.stream_id || "");
    formikBottom.setFieldValue("wasteName", d.waste_name || "");
    formikBottom.setFieldValue("permittedQty", d.permitted_qty || "");
    formikBottom.setFieldValue("disposalOption", d.disposal_option || "");
    formikBottom.setFieldValue("wasteId", d.waste_id);

    if (rtype === 4) {
      const receiverList = JSON.parse(d.receiver_info || "[]");
      formikBottom.setFieldValue(
        "receiverIds",
        receiverList.map((item) => item.receiver_id)
      );
    }
  };

  const handleEditCategory = (d) => {
    setWasteTypeValue("6");
    setEditDisable(true);
    formikBottom.setFieldValue("categoryId", d.category_id || "");
    formikBottom.setFieldValue("wasteName", d.waste_name || "");
    formikBottom.setFieldValue("permittedQty", d.permitted_qty || "");
    formikBottom.setFieldValue("disposalOption", d.disposal_option || "");
    formikBottom.setFieldValue("wasteId", d.waste_id);
  };

  const handleWasteTypeChange = (value) => {
    if (value === "4") {
      GetReceiversNames();
    }
    setShowSecondForm(false);
    formikTop.setFieldValue("receiverTypeId", value);
  };

  // Custom Dropdown Component
  const CustomDropdown = ({
    options,
    selectedValue,
    onSelect,
    placeholder,
    label,
    error,
    touched,
    disabled = false,
    dropdownKey = "dropdown",
  }) => {
    const [showOptions, setShowOptions] = useState(false);

    const getLabel = () => {
      const selected = options.find(
        (opt) => String(opt.value) === String(selectedValue)
      );
      return selected ? selected.label : placeholder || "Select";
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
            error && touched && styles.dropdownError,
          ]}
          onPress={() => !disabled && setShowOptions(true)}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.dropdownButtonText,
              !selectedValue && styles.placeholderText,
            ]}
          >
            {getLabel()}
          </Text>
          <Icon name="chevron-down" size={20} color="#666" />
        </TouchableOpacity>

        {showOptions && (
          <Modal
            transparent={true}
            visible={showOptions}
            onRequestClose={() => setShowOptions(false)}
            animationType="fade"
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
                  nestedScrollEnabled={true}
                />
              </View>
            </TouchableOpacity>
          </Modal>
        )}

        {error && touched && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  };

  const renderIndustrySelect = () => {
    const industryOptions = [
      { value: "", label: "Select Industry" },
      ...view.map((item) => ({
        value: String(item.industryid),
        label: item.industry_name,
      })),
    ];

    return (
      <CustomDropdown
        options={industryOptions}
        selectedValue={String(formikTop.values.industryId)}
        onSelect={(value) => {
          formikTop.setFieldValue("industryId", value);
          setShowSecondForm(false);
          const industry = view.find(
            (item) => String(item.industryid) === value
          );
          setSelectedIndustry(industry);
        }}
        placeholder="Select Industry"
        label="Industry"
        error={formikTop.errors.industryId}
        touched={formikTop.touched.industryId}
        dropdownKey="industry"
      />
    );
  };

  const renderWasteTypeSelect = () => {
    const wasteTypeOptions = [
      { value: "", label: "Select Waste Type" },
      ...wasteTypes,
    ];

    return (
      <CustomDropdown
        options={wasteTypeOptions}
        selectedValue={formikTop.values.receiverTypeId}
        onSelect={(value) => handleWasteTypeChange(value)}
        placeholder="Select Waste Type"
        label="Waste Type"
        error={formikTop.errors.receiverTypeId}
        touched={formikTop.touched.receiverTypeId}
        dropdownKey="wasteType"
      />
    );
  };

  const renderEffluentForm = () => {
    return (
      <View style={styles.formSection}>
        <View style={styles.formGroup}>
          <CustomDropdown
            options={disposalOptions}
            selectedValue={formikBottom.values.effluentDisposalOption}
            onSelect={(value) =>
              formikBottom.setFieldValue("effluentDisposalOption", value)
            }
            placeholder="Select Permitted Disposal Option"
            label="Permitted Disposal Option"
            error={formikBottom.errors.effluentDisposalOption}
            touched={formikBottom.touched.effluentDisposalOption}
            dropdownKey="disposal"
          />
        </View>

        {formikBottom.values.effluentDisposalOption === "2" && (
          <View>
            {[1, 2, 3].map((num) => {
              const cetpOptions = [
                { value: "", label: `Select CETP Membership ${num}` },
                ...cetp
                  .filter(
                    (c) =>
                      c.cetpid !==
                        parseInt(
                          formikBottom.values[
                            `cetpMembershipId${num === 1 ? 2 : num === 2 ? 1 : 1}`
                          ] || "0"
                        ) &&
                      c.cetpid !==
                        parseInt(
                          formikBottom.values[
                            `cetpMembershipId${num === 3 ? 1 : num === 1 ? 3 : 3}`
                          ] || "0"
                        )
                  )
                  .map((c) => ({
                    value: String(c.cetpid),
                    label: c.cetpname,
                  })),
              ];

              return (
                <View key={num} style={styles.formGroup}>
                  <CustomDropdown
                    options={cetpOptions}
                    selectedValue={
                      formikBottom.values[`cetpMembershipId${num}`]
                    }
                    onSelect={(value) =>
                      formikBottom.setFieldValue(
                        `cetpMembershipId${num}`,
                        value
                      )
                    }
                    placeholder={`Select CETP Membership ${num}`}
                    label={`CETP Membership ${num}${num === 1 ? " *" : ""}`}
                    error={formikBottom.errors[`cetpMembershipId${num}`]}
                    touched={formikBottom.touched[`cetpMembershipId${num}`]}
                    dropdownKey={`cetp${num}`}
                  />

                  {formikBottom.values[`cetpMembershipId${num}`] === "1" && (
                    <View style={styles.formGroup}>
                      <CustomDropdown
                        options={modeOfConveyanceOptions}
                        selectedValue={
                          formikBottom.values[`modeOfConveyance${num}`]
                        }
                        onSelect={(value) =>
                          formikBottom.setFieldValue(
                            `modeOfConveyance${num}`,
                            value
                          )
                        }
                        placeholder="Select Mode"
                        label="Mode of Conveyance"
                        error={formikBottom.errors[`modeOfConveyance${num}`]}
                        touched={formikBottom.touched[`modeOfConveyance${num}`]}
                        dropdownKey={`mode${num}`}
                      />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { flex: 0.5 }]}>S.No</Text>
            <Text style={[styles.tableCell, { flex: 2 }]}>
              Type of Effluent
            </Text>
            <Text style={[styles.tableCell, { flex: 1.5 }]}>
              Permitted Qty (KLD)
            </Text>
            <Text style={[styles.tableCell, { flex: 1.5 }]}>
              Disposal Option
            </Text>
          </View>
          {formikBottom.values?.effluentRows?.map((row, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 0.5 }]}>{row.sno}</Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>
                {row.effluentType}
              </Text>
              <View style={{ flex: 1.5 }}>
                <TextInput
                  style={styles.tableInput}
                  value={row.permittedQty}
                  onChangeText={(text) =>
                    formikBottom.setFieldValue(
                      `effluentRows[${index}].permittedQty`,
                      text
                    )
                  }
                  keyboardType="numeric"
                  maxLength={5}
                  placeholder="Qty"
                />
              </View>
              <View style={{ flex: 1.5 }}>
                <TextInput
                  style={styles.tableInput}
                  value={row.disposalOption}
                  onChangeText={(text) =>
                    formikBottom.setFieldValue(
                      `effluentRows[${index}].disposalOption`,
                      text
                    )
                  }
                  maxLength={40}
                  placeholder="Disposal"
                />
              </View>
            </View>
          ))}
          {formikBottom.errors.effluentRows &&
            typeof formikBottom.errors.effluentRows === "string" && (
              <Text style={[styles.errorText, styles.tableError]}>
                {formikBottom.errors.effluentRows}
              </Text>
            )}
          <View style={[styles.tableRow, styles.totalRow]}>
            <Text style={[styles.tableCell, { flex: 2.5, fontWeight: "bold" }]}>
              Total permitted Effluent Quantity (KLD)
            </Text>
            <Text style={[styles.tableCell, { flex: 1.5, fontWeight: "bold" }]}>
              {formikBottom.values.effluentRows
                .reduce((sum, v) => sum + (parseFloat(v.permittedQty) || 0), 0)
                .toFixed(1)}
            </Text>
            <Text style={[styles.tableCell, { flex: 1.5 }]}></Text>
          </View>
        </View>
      </View>
    );
  };

  const renderHazardousForm = () => {
    const processOptions = [
      { value: "", label: "Select Process" },
      ...(processes?.map((pp) => ({
        value: String(pp?.processid),
        label: pp?.processname,
      })) || []),
    ];

    const streamOptions = [
      { value: "", label: "Select Stream" },
      ...(streams?.map((ss) => ({
        value: String(ss?.steamid),
        label: ss?.steamname,
      })) || []),
    ];

    return (
      <View style={styles.formSection}>
        {["2", "3", "4", "5"].includes(wasteTypeValue) && (
          <>
            <View style={styles.formGroup}>
              <CustomDropdown
                options={processOptions}
                selectedValue={formikBottom.values.processId}
                onSelect={(value) => {
                  formikBottom.setFieldValue("processId", value);
                  if (value) GetStreams(value);
                }}
                placeholder="Select Process"
                label="Process"
                error={formikBottom.errors.processId}
                touched={formikBottom.touched.processId}
                disabled={editDisable}
                dropdownKey="process"
              />
            </View>

            <View style={styles.formGroup}>
              <CustomDropdown
                options={streamOptions}
                selectedValue={formikBottom.values.streamId}
                onSelect={(value) =>
                  formikBottom.setFieldValue("streamId", value)
                }
                placeholder="Select Stream"
                label="Stream"
                error={formikBottom.errors.streamId}
                touched={formikBottom.touched.streamId}
                disabled={editDisable}
                dropdownKey="stream"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Name of Hazardous Waste <Text style={styles.star}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, editDisable && styles.inputDisabled]}
                value={formikBottom.values.wasteName}
                onChangeText={formikBottom.handleChange("wasteName")}
                editable={!editDisable}
                maxLength={40}
                placeholder="Enter hazardous waste name"
              />
              {formikBottom.errors.wasteName &&
                formikBottom.touched.wasteName && (
                  <Text style={styles.errorText}>
                    {formikBottom.errors.wasteName}
                  </Text>
                )}
            </View>
          </>
        )}

        {wasteTypeValue === "6" && (
          <>
            <View style={styles.formGroup}>
              <CustomDropdown
                options={categoryOptions}
                selectedValue={formikBottom.values.categoryId}
                onSelect={(value) =>
                  formikBottom.setFieldValue("categoryId", value)
                }
                placeholder="Select Category"
                label="Category"
                error={formikBottom.errors.categoryId}
                touched={formikBottom.touched.categoryId}
                disabled={editDisable}
                dropdownKey="category"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Name of Waste <Text style={styles.star}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, editDisable && styles.inputDisabled]}
                value={formikBottom.values.wasteName}
                onChangeText={formikBottom.handleChange("wasteName")}
                editable={!editDisable}
                maxLength={30}
                placeholder="Enter waste name"
              />
              {formikBottom.errors.wasteName &&
                formikBottom.touched.wasteName && (
                  <Text style={styles.errorText}>
                    {formikBottom.errors.wasteName}
                  </Text>
                )}
            </View>
          </>
        )}

        {["2", "3", "4", "5", "6"].includes(wasteTypeValue) && (
          <>
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Permitted Quantity (TPA) <Text style={styles.star}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={formikBottom.values.permittedQty}
                onChangeText={formikBottom.handleChange("permittedQty")}
                keyboardType="numeric"
                maxLength={5}
                placeholder="Enter permitted quantity"
              />
              {formikBottom.errors.permittedQty &&
                formikBottom.touched.permittedQty && (
                  <Text style={styles.errorText}>
                    {formikBottom.errors.permittedQty}
                  </Text>
                )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Permitted Disposal Option <Text style={styles.star}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={formikBottom.values.disposalOption}
                onChangeText={formikBottom.handleChange("disposalOption")}
                maxLength={30}
                placeholder="Enter disposal option"
              />
              {formikBottom.errors.disposalOption &&
                formikBottom.touched.disposalOption && (
                  <Text style={styles.errorText}>
                    {formikBottom.errors.disposalOption}
                  </Text>
                )}
            </View>
          </>
        )}

        {wasteTypeValue === "4" && (
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Receivers <Text style={styles.star}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowReceiversModal(true)}
            >
              <Text
                style={
                  formikBottom.values.receiverIds?.length > 0
                    ? styles.selectedText
                    : styles.placeholderText
                }
              >
                {formikBottom.values.receiverIds?.length > 0
                  ? `${formikBottom.values.receiverIds.length} receiver(s) selected`
                  : "Select Receivers"}
              </Text>
              <Icon
                name="chevron-forward"
                size={20}
                color="#666"
                style={styles.inputIcon}
              />
            </TouchableOpacity>
            {formikBottom.errors.receiverIds &&
              formikBottom.touched.receiverIds && (
                <Text style={styles.errorText}>
                  {formikBottom.errors.receiverIds}
                </Text>
              )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitButton, loading && { opacity: 0.6 }]}
          onPress={async () => {
            const touchedFields = {
              industryId: true,
              receiverTypeId: true,
              effluentDisposalOption: true,
              cetpMembershipId1: true,
              cetpMembershipId2: true,
              cetpMembershipId3: true,
              modeOfConveyance1: true,
              modeOfConveyance2: true,
              modeOfConveyance3: true,
              categoryId: true,
              processId: true,
              streamId: true,
              wasteName: true,
              permittedQty: true,
              disposalOption: true,
              receiverIds: true,
              effluentRows: true,
            };

            formikBottom.setTouched(touchedFields, true);

            const errors = await formikBottom.validateForm();

            if (Object.keys(errors).length > 0) {
              return;
            }

            await formikBottom.submitForm();
          }}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>
              {data.length > 0
                ? "Update Waste Details"
                : "Submit Waste Details"}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
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
            style={[
              styles.paginationButton,
              currentPage === 1 && styles.paginationDisabled,
            ]}
            onPress={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <Icon
              name="chevron-back"
              size={16}
              color={currentPage === 1 ? "#ccc" : "#2e7d32"}
            />
            <Text
              style={[
                styles.paginationText,
                currentPage === 1 && styles.paginationTextDisabled,
              ]}
            >
              Prev
            </Text>
          </TouchableOpacity>

          {pageNumbers[0] > 1 && (
            <>
              <TouchableOpacity
                style={styles.paginationNumber}
                onPress={() => goToPage(1)}
              >
                <Text style={styles.paginationNumberText}>1</Text>
              </TouchableOpacity>
              {pageNumbers[0] > 2 && (
                <Text style={styles.paginationDots}>...</Text>
              )}
            </>
          )}

          {pageNumbers.map((page) => (
            <TouchableOpacity
              key={page}
              style={[
                styles.paginationNumber,
                currentPage === page && styles.paginationNumberActive,
              ]}
              onPress={() => goToPage(page)}
            >
              <Text
                style={[
                  styles.paginationNumberText,
                  currentPage === page && styles.paginationNumberTextActive,
                ]}
              >
                {page}
              </Text>
            </TouchableOpacity>
          ))}

          {pageNumbers[pageNumbers.length - 1] < totalPages && (
            <>
              {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                <Text style={styles.paginationDots}>...</Text>
              )}
              <TouchableOpacity
                style={styles.paginationNumber}
                onPress={() => goToPage(totalPages)}
              >
                <Text style={styles.paginationNumberText}>{totalPages}</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[
              styles.paginationButton,
              currentPage === totalPages && styles.paginationDisabled,
            ]}
            onPress={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <Text
              style={[
                styles.paginationText,
                currentPage === totalPages && styles.paginationTextDisabled,
              ]}
            >
              Next
            </Text>
            <Icon
              name="chevron-forward"
              size={16}
              color={currentPage === totalPages ? "#ccc" : "#2e7d32"}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render Card Item for Submitted Details
  const renderCardItem = ({ item, index }) => {
    const rtype = Number(formikTop.values.receiverTypeId || 0);
    const actualIndex = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;

    // Effluent Type (1)
    if (rtype === 1) {
      let effluentList = [];
      try {
        effluentList = JSON.parse(item?.effluentDetails || "[]");
        if (!Array.isArray(effluentList)) {
          effluentList = [];
        }
      } catch (error) {
        effluentList = [];
      }

      return effluentList.map((eff, i) => (
        <View key={`${index}-${i}`} style={styles.resultCard}>
          <View style={styles.resultCardHeader}>
            <View style={styles.resultCardNumber}>
              <Text style={styles.resultCardNumberText}>{actualIndex}</Text>
            </View>
            <Text style={styles.resultCardTitle}>Effluent Waste</Text>
          </View>

          <View style={styles.resultCardBody}>
            <View style={styles.resultCardRow}>
              <View style={styles.resultCardCol6}>
                <Text style={styles.resultCardLabel}>Industry Name</Text>
                <Text style={styles.resultCardValue}>
                  {item?.industry_name || "-"}
                </Text>
              </View>
              <View style={styles.resultCardCol6}>
                <Text style={styles.resultCardLabel}>Waste Type</Text>
                <Text style={styles.resultCardValue}>
                  {item?.receiver_type_name || "-"}
                </Text>
              </View>
            </View>

            <View style={styles.resultCardRow}>
              <View style={styles.resultCardCol6}>
                <Text style={styles.resultCardLabel}>Waste Name</Text>
                <Text style={styles.resultCardValue}>
                  {item?.waste_name || "-"}
                </Text>
              </View>
              <View style={styles.resultCardCol6}>
                <Text style={styles.resultCardLabel}>Disposal Option</Text>
                <Text style={styles.resultCardValue}>
                  {item?.disposal_optionname || "-"}
                </Text>
              </View>
            </View>

            <View style={styles.resultCardRow}>
              <View style={styles.resultCardCol6}>
                <Text style={styles.resultCardLabel}>Effluent Type</Text>
                <Text style={styles.resultCardValue}>
                  {eff?.effluentType || "-"}
                </Text>
              </View>
              <View style={styles.resultCardCol6}>
                <Text style={styles.resultCardLabel}>Permitted Qty</Text>
                <Text style={styles.resultCardValue}>
                  {eff?.permittedQty || "0"}
                </Text>
              </View>
            </View>

            <View style={styles.resultCardRow}>
              <View style={styles.resultCardCol12}>
                <Text style={styles.resultCardLabel}>Disposal Option</Text>
                <Text style={styles.resultCardValue}>
                  {eff?.disposalOption || "-"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.resultCardFooter}>
            <TouchableOpacity
              style={styles.resultActionButton}
              onPress={() => handleEditEffluent(item, eff)}
            >
              <Icon name="create-outline" size={16} color="#2d6386" />
              <Text style={styles.resultActionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.resultActionButton, styles.resultDeleteButton]}
              onPress={() =>
                handleDeleteEffluent(
                  formikTop.values.receiverTypeId,
                  eff?.effluentDetailId
                )
              }
            >
              <Icon name="trash-outline" size={16} color="#f7331e" />
              <Text style={[styles.resultActionText, styles.resultDeleteText]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ));
    }

    // Types 2, 3, 5
    if ([2, 3, 5].includes(rtype)) {
      return (
        <View style={styles.resultCard}>
          <View style={styles.resultCardHeader}>
            <View style={styles.resultCardNumber}>
              <Text style={styles.resultCardNumberText}>{actualIndex}</Text>
            </View>
            <Text style={styles.resultCardTitle}>Waste Details</Text>
          </View>

          <View style={styles.resultCardBody}>
            <View style={styles.resultCardRow}>
              <View style={styles.resultCardCol6}>
                <Text style={styles.resultCardLabel}>Industry Name</Text>
                <Text style={styles.resultCardValue}>
                  {item?.industry_name || "-"}
                </Text>
              </View>
              <View style={styles.resultCardCol6}>
                <Text style={styles.resultCardLabel}>Waste Type</Text>
                <Text style={styles.resultCardValue}>
                  {item?.receiver_type_name || "-"}
                </Text>
              </View>
            </View>

            <View style={styles.resultCardRow}>
              <View style={styles.resultCardCol6}>
                <Text style={styles.resultCardLabel}>Waste Name</Text>
                <Text style={styles.resultCardValue}>
                  {item?.waste_name || "-"}
                </Text>
              </View>
              <View style={styles.resultCardCol6}>
                <Text style={styles.resultCardLabel}>Process</Text>
                <Text style={styles.resultCardValue}>
                  {item?.processname || "-"}
                </Text>
              </View>
            </View>

            <View style={styles.resultCardRow}>
              <View style={styles.resultCardCol6}>
                <Text style={styles.resultCardLabel}>Stream</Text>
                <Text style={styles.resultCardValue}>
                  {item?.steamname || "-"}
                </Text>
              </View>
              <View style={styles.resultCardCol6}>
                <Text style={styles.resultCardLabel}>Permitted Qty</Text>
                <Text style={styles.resultCardValue}>
                  {item?.permitted_qty || "0"}
                </Text>
              </View>
            </View>

            <View style={styles.resultCardRow}>
              <View style={styles.resultCardCol12}>
                <Text style={styles.resultCardLabel}>Disposal Option</Text>
                <Text style={styles.resultCardValue}>
                  {item?.disposal_option || "-"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.resultCardFooter}>
            <TouchableOpacity
              style={styles.resultActionButton}
              onPress={() => handleEdit(item)}
            >
              <Icon name="create-outline" size={16} color="#2d6386" />
              <Text style={styles.resultActionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.resultActionButton, styles.resultDeleteButton]}
              onPress={() =>
                handleDeleteEffluent(
                  formikTop.values.receiverTypeId,
                  item?.waste_id
                )
              }
            >
              <Icon name="trash-outline" size={16} color="#f7331e" />
              <Text style={[styles.resultActionText, styles.resultDeleteText]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Type 4 - Receivers
    if (rtype === 4) {
      let receiverList = [];
      try {
        receiverList = JSON.parse(item?.receiver_info || "[]");
        if (!Array.isArray(receiverList)) {
          receiverList = [];
        }
      } catch (error) {
        receiverList = [];
      }

      const receiverNames =
        receiverList.length > 0
          ? receiverList
              .map((r) => r?.receiver_industry_name || "-")
              .join("\n")
          : "-";

      return (
        <View style={styles.resultCard}>
          <View style={styles.resultCardHeader}>
            <View style={styles.resultCardNumber}>
              <Text style={styles.resultCardNumberText}>{actualIndex}</Text>
            </View>
            <Text style={styles.resultCardTitle}>Waste Details</Text>
          </View>

          <View style={styles.resultCardBody}>
            <View style={styles.resultCardRow}>
              <View style={styles.resultCardCol6}>
                <Text style={styles.resultCardLabel}>Industry Name</Text>
                <Text style={styles.resultCardValue}>
                  {item?.industry_name || "-"}
                </Text>
              </View>
              <View style={styles.resultCardCol6}>
                <Text style={styles.resultCardLabel}>Waste Type</Text>
                <Text style={styles.resultCardValue}>
                  {item?.receiver_type_name || "-"}
                </Text>
              </View>
            </View>

            <View style={styles.resultCardRow}>
              <View style={styles.resultCardCol6}>
                <Text style={styles.resultCardLabel}>Waste Name</Text>
                <Text style={styles.resultCardValue}>
                  {item?.waste_name || "-"}
                </Text>
              </View>
              <View style={styles.resultCardCol6}>
                <Text style={styles.resultCardLabel}>Process</Text>
                <Text style={styles.resultCardValue}>
                  {item?.processname || "-"}
                </Text>
              </View>
            </View>

            <View style={styles.resultCardRow}>
              <View style={styles.resultCardCol6}>
                <Text style={styles.resultCardLabel}>Stream</Text>
                <Text style={styles.resultCardValue}>
                  {item?.steamname || "-"}
                </Text>
              </View>
              <View style={styles.resultCardCol6}>
                <Text style={styles.resultCardLabel}>Permitted Qty</Text>
                <Text style={styles.resultCardValue}>
                  {item?.permitted_qty || "0"}
                </Text>
              </View>
            </View>

            <View style={styles.resultCardRow}>
              <View style={styles.resultCardCol6}>
                <Text style={styles.resultCardLabel}>Disposal Option</Text>
                <Text style={styles.resultCardValue}>
                  {item?.disposal_option || "-"}
                </Text>
              </View>
              <View style={styles.resultCardCol6}>
                <Text style={styles.resultCardLabel}>Receivers</Text>
                <Text style={styles.resultCardValue} numberOfLines={3}>
                  {receiverNames}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.resultCardFooter}>
            <TouchableOpacity
              style={styles.resultActionButton}
              onPress={() => handleEdit(item)}
            >
              <Icon name="create-outline" size={16} color="#2d6386" />
              <Text style={styles.resultActionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.resultActionButton, styles.resultDeleteButton]}
              onPress={() =>
                handleDeleteEffluent(
                  formikTop.values.receiverTypeId,
                  item?.waste_id
                )
              }
            >
              <Icon name="trash-outline" size={16} color="#f7331e" />
              <Text style={[styles.resultActionText, styles.resultDeleteText]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Type 6 - Category
    if (rtype === 6) {
      const categoryMap = {
        1: "Fly Ash",
        2: "Reuse",
        3: "Others",
      };

      return (
        <View style={styles.resultCard}>
          <View style={styles.resultCardHeader}>
            <View style={styles.resultCardNumber}>
              <Text style={styles.resultCardNumberText}>{actualIndex}</Text>
            </View>
            <Text style={styles.resultCardTitle}>Waste Details</Text>
          </View>

          <View style={styles.resultCardBody}>
            <View style={styles.resultCardRow}>
              <View style={styles.resultCardCol6}>
                <Text style={styles.resultCardLabel}>Industry Name</Text>
                <Text style={styles.resultCardValue}>
                  {item?.industry_name || "-"}
                </Text>
              </View>
              <View style={styles.resultCardCol6}>
                <Text style={styles.resultCardLabel}>Waste Type</Text>
                <Text style={styles.resultCardValue}>
                  {item?.receiver_type_name || "-"}
                </Text>
              </View>
            </View>

            <View style={styles.resultCardRow}>
              <View style={styles.resultCardCol6}>
                <Text style={styles.resultCardLabel}>Category</Text>
                <Text style={styles.resultCardValue}>
                  {categoryMap[item?.category_id] || "-"}
                </Text>
              </View>
              <View style={styles.resultCardCol6}>
                <Text style={styles.resultCardLabel}>Waste Name</Text>
                <Text style={styles.resultCardValue}>
                  {item?.waste_name || "-"}
                </Text>
              </View>
            </View>

            <View style={styles.resultCardRow}>
              <View style={styles.resultCardCol6}>
                <Text style={styles.resultCardLabel}>Permitted Qty</Text>
                <Text style={styles.resultCardValue}>
                  {item?.permitted_qty || "0"}
                </Text>
              </View>
              <View style={styles.resultCardCol6}>
                <Text style={styles.resultCardLabel}>Disposal Option</Text>
                <Text style={styles.resultCardValue}>
                  {item?.disposal_option || "-"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.resultCardFooter}>
            <TouchableOpacity
              style={styles.resultActionButton}
              onPress={() => handleEditCategory(item)}
            >
              <Icon name="create-outline" size={16} color="#2d6386" />
              <Text style={styles.resultActionText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.resultActionButton, styles.resultDeleteButton]}
              onPress={() =>
                handleDeleteEffluent(
                  formikTop.values.receiverTypeId,
                  item?.waste_id
                )
              }
            >
              <Icon name="trash-outline" size={16} color="#f7331e" />
              <Text style={[styles.resultActionText, styles.resultDeleteText]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return null;
  };

  // List Header Component for Result Cards
  const ResultListHeader = () => (
    <View style={styles.resultSearchContainer}>
      <View style={styles.searchWrapper}>
        <Icon name="search" size={18} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          value={searchTerm}
          onChangeText={(text) => {
            setSearchTerm(text);
            const filtered = data.filter((item) =>
              Object.values(item).some(
                (value) =>
                  value && String(value).toLowerCase().includes(text.toLowerCase())
              )
            );
            setFilteredData(filtered);
            updatePagination(filtered);
          }}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchTerm("");
              setFilteredData(data);
              updatePagination(data);
            }}
          >
            <Icon name="close-circle" size={18} color="#999" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  // List Footer Component for Result Cards
  const ResultListFooter = () => (
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
  const ResultListEmpty = () => (
    <View style={styles.noDataContainer}>
      <Icon name="warning-outline" size={40} color="#856404" />
      <Text style={styles.noDataText}>No Data Found</Text>
    </View>
  );

  // Receivers Modal
  const renderReceiversModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showReceiversModal}
        onRequestClose={() => setShowReceiversModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Receivers</Text>
              <TouchableOpacity onPress={() => setShowReceiversModal(false)}>
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalSearchContainer}>
              <Icon
                name="search"
                size={20}
                color="#666"
                style={styles.modalSearchIcon}
              />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search receivers..."
                value={searchTerm}
                onChangeText={setSearchTerm}
              />
            </View>
            <FlatList
              data={receivers.filter((r) =>
                r.industry_name
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase())
              )}
              keyExtractor={(item) => String(item.industryid)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.modalItem,
                    formikBottom.values.receiverIds?.includes(
                      item.industryid
                    ) && styles.modalItemSelected,
                  ]}
                  onPress={() => {
                    const currentIds = formikBottom.values.receiverIds || [];
                    if (currentIds.includes(item.industryid)) {
                      formikBottom.setFieldValue(
                        "receiverIds",
                        currentIds.filter((id) => id !== item.industryid)
                      );
                    } else {
                      formikBottom.setFieldValue("receiverIds", [
                        ...currentIds,
                        item.industryid,
                      ]);
                    }
                  }}
                >
                  <View style={styles.modalItemContent}>
                    <View style={styles.modalCheckbox}>
                      {formikBottom.values.receiverIds?.includes(
                        item.industryid
                      ) && (
                        <Icon
                          name="checkmark-circle"
                          size={22}
                          color="#2e7d32"
                        />
                      )}
                      {!formikBottom.values.receiverIds?.includes(
                        item.industryid
                      ) && <View style={styles.modalCheckboxEmpty} />}
                    </View>
                    <Text
                      style={[
                        styles.modalItemText,
                        formikBottom.values.receiverIds?.includes(
                          item.industryid
                        ) && styles.modalItemTextSelected,
                      ]}
                    >
                      {item.industry_name}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              style={styles.modalList}
              showsVerticalScrollIndicator={true}
            />
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowReceiversModal(false);
                  setSearchTerm("");
                }}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={() => {
                  setShowReceiversModal(false);
                  setSearchTerm("");
                }}
              >
                <Text style={styles.modalSaveButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  useEffect(() => {
    GetGeneratorsNames();
    GetProcesses();
    GetCetp();
  }, []);

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
              <Text style={styles.cardTitle}>Manage Permitted Quantity</Text>
            </View>

            <View style={styles.cardBody}>
              {/* Top Form */}
              <View style={styles.panel}>
                <View style={styles.panelHeader}>
                  <Text style={styles.panelHeaderText}>{CONTEXT_HEADING}</Text>
                </View>
                <View style={styles.panelBody}>
                  <View style={styles.formGroup}>{renderIndustrySelect()}</View>
                  <View style={styles.formGroup}>
                    {renderWasteTypeSelect()}
                  </View>
                  <TouchableOpacity
                    style={styles.goButton}
                    onPress={() => {
                      formikTop.handleSubmit();
                    }}
                  >
                    <Text style={styles.goButtonText}>GO</Text>
                  </TouchableOpacity>

                  {formikTop.values.industryId !== "" && selectedIndustry && (
                    <View style={styles.industryInfo}>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Category:</Text>
                        <Text style={styles.infoValue}>
                          {selectedIndustry.category_name}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>CTO:</Text>
                        <Text style={styles.infoValue}>
                          {selectedIndustry.cto_order_number}
                        </Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Address:</Text>
                        <Text style={styles.infoValue}>
                          {selectedIndustry.correspondence_address}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Bottom Form */}
              {showSecondForm && (
                <View style={styles.panel}>
                  <View style={styles.panelHeader}>
                    <Icon name="document-text" size={20} color="#fff" />
                    <Text style={[styles.panelHeaderText, { marginLeft: 8 }]}>
                      {wasteTypes
                        .filter((f) => f.value === wasteTypeValue)
                        .map((dd) => dd.label)}{" "}
                      Waste Details
                    </Text>
                  </View>
                  <View style={styles.panelBody}>
                    {wasteTypeValue === "1" && renderEffluentForm()}
                    {["2", "3", "4", "5", "6"].includes(wasteTypeValue) &&
                      renderHazardousForm()}
                  </View>
                </View>
              )}

              {/* Result Cards */}
              {showSecondForm && formikTop.values.receiverTypeId !== "1" && (
                <View style={styles.resultSection}>
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#2e7d32" />
                      <Text style={styles.loadingText}>Loading...</Text>
                    </View>
                  ) : filteredData.length > 0 ? (
                    <FlatList
                      ref={flatListRef}
                      data={displayData}
                      renderItem={renderCardItem}
                      keyExtractor={(item, index) => 
                        (item.waste_id || item.effluentid || "") + index.toString()
                      }
                      contentContainerStyle={styles.resultListContainer}
                      showsVerticalScrollIndicator={false}
                      ListHeaderComponent={ResultListHeader}
                      ListFooterComponent={ResultListFooter}
                      ListEmptyComponent={ResultListEmpty}
                      initialNumToRender={10}
                      maxToRenderPerBatch={10}
                      windowSize={5}
                      keyboardShouldPersistTaps="handled"
                    />
                  ) : (
                    <ResultListEmpty />
                  )}
                </View>
              )}
            </View>
          </View>

          {renderReceiversModal()}
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
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e3a5f",
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
    flexDirection: "row",
    alignItems: "center",
  },
  panelHeaderText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  panelBody: {
    padding: 16,
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputDisabled: {
    backgroundColor: "#f0f0f0",
  },
  inputIcon: {
    position: "absolute",
    right: 12,
  },
  errorText: {
    color: "#dc3545",
    fontSize: 12,
    marginTop: 4,
  },
  goButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 4,
  },
  goButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  industryInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    width: 80,
  },
  infoValue: {
    fontSize: 13,
    color: "#555",
    flex: 1,
  },
  formSection: {
    marginTop: 4,
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
  // Result Cards Styles
  resultSection: {
    marginTop: 16,
  },
  resultListContainer: {
    paddingBottom: 10,
  },
  resultCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e8ecf1",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    overflow: "hidden",
  },
  resultCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
  },
  resultCardNumber: {
    backgroundColor: "#2e7d32",
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 10,
  },
  resultCardNumberText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  resultCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e3a5f",
    flex: 1,
  },
  resultCardBody: {
    padding: 12,
  },
  resultCardRow: {
    flexDirection: "row",
    marginBottom: 6,
  },
  resultCardCol6: {
    flex: 1,
    paddingHorizontal: 4,
  },
  resultCardCol12: {
    flex: 1,
    paddingHorizontal: 4,
  },
  resultCardLabel: {
    fontSize: 10,
    color: "#888",
    fontWeight: "500",
    marginBottom: 2,
  },
  resultCardValue: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
  },
  resultCardFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: "#e8ecf1",
    backgroundColor: "#fafbfc",
    gap: 8,
  },
  resultActionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#f0f0f0",
  },
  resultDeleteButton: {
    backgroundColor: "#fde8e8",
  },
  resultActionText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
    marginLeft: 4,
  },
  resultDeleteText: {
    color: "#dc3545",
  },
  resultSearchContainer: {
    marginBottom: 12,
  },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 6,
    backgroundColor: "#fff",
    paddingHorizontal: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 6,
    fontSize: 13,
    color: "#333",
  },
  // Pagination
  paginationWrapper: {
    borderTopWidth: 1,
    borderTopColor: "#e8ecf1",
    paddingVertical: 8,
    marginTop: 4,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "nowrap",
    paddingHorizontal: 4,
  },
  paginationButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#f5f7fa",
    marginHorizontal: 2,
  },
  paginationDisabled: {
    opacity: 0.5,
  },
  paginationText: {
    fontSize: 11,
    color: "#2e7d32",
    fontWeight: "500",
  },
  paginationTextDisabled: {
    color: "#ccc",
  },
  paginationNumber: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginHorizontal: 2,
    minWidth: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  paginationNumberActive: {
    backgroundColor: "#2e7d32",
  },
  paginationNumberText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
  paginationNumberTextActive: {
    color: "#fff",
  },
  paginationDots: {
    fontSize: 12,
    color: "#666",
    paddingHorizontal: 2,
  },
  pageInfoContainer: {
    alignItems: "center",
    paddingVertical: 4,
    paddingBottom: 8,
  },
  pageInfoText: {
    fontSize: 11,
    color: "#888",
  },
  // No Data
  noDataContainer: {
    padding: 30,
    alignItems: "center",
    backgroundColor: "#fff3cd",
    borderRadius: 6,
    marginTop: 6,
  },
  noDataText: {
    color: "#856404",
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
  },
  loadingContainer: {
    padding: 30,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    color: "#666",
    fontSize: 13,
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
  // Dropdown Styles
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
    maxHeight: "70%",
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
  },
  dropdownFlatList: {
    maxHeight: 300,
  },
  dropdownOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
  },
  dropdownOptionSelected: {
    backgroundColor: "#e8f5e9",
  },
  dropdownOptionText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  dropdownOptionTextSelected: {
    color: "#2e7d32",
    fontWeight: "600",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "92%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e3a5f",
  },
  modalSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  modalSearchIcon: {
    marginRight: 8,
  },
  modalSearchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 14,
    color: "#333",
  },
  modalList: {
    maxHeight: 300,
  },
  modalItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
  },
  modalItemSelected: {
    backgroundColor: "#e8f5e9",
  },
  modalItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalCheckbox: {
    width: 24,
    height: 24,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  modalCheckboxEmpty: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: "#ced4da",
    borderRadius: 12,
  },
  modalItemText: {
    fontSize: 14,
    color: "#333",
    flex: 1,
  },
  modalItemTextSelected: {
    color: "#2e7d32",
    fontWeight: "500",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e8ecf1",
    marginTop: 8,
  },
  modalCancelButton: {
    backgroundColor: "#6c757d",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  modalCancelButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  modalSaveButton: {
    backgroundColor: "#2e7d32",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  modalSaveButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
  selectedText: {
    color: "#333",
  },
});

export default ManagePermittedQuantity;