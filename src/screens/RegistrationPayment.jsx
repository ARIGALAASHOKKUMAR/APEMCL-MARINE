import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  Alert,
  Linking,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  commonAPICall, 
  CONTEXT_HEADING, 
  PAYMENTAPEMCL, 
  RECYCLABLE, 
  RECYCLABLEVEHICLID 
} from '../utils/utils';
import { showModal } from '../actions';
import { TermsAndConditions, wasteTypes } from '../utils/CommonFunctions';
// import StepperProgress from './services/Test';

// ─── Constants ───────────────────────────────────────────────────────────────
const VEHICLE_FEE = 500;
const TRANSPORTER_REGISTRATION_FEE = 1000;
const GST_RATE = 0.09;
const TDS_RATE = 0.02;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Returns waste-type service charge (a), distance charge (b), margin (c), and per-ton subtotal. */
const calcWasteCharges = (data) => {
  const wasteLabel = wasteTypes
    .find((i) => String(i.value) === String(data?.receiverWasteTypeId))
    ?.label?.split("-")[1]
    ?.trim();
  let a = 5;
  if (data?.redirected_waste_type_id !== 4) {
    if (wasteLabel === "Incinerable" || wasteLabel === "Utilizable") a = 20;
    else if (
      wasteLabel === "Land Fillable" ||
      data?.receiver_type_name === "HW Land Fillable"
    )
      a = 10;
  }

  const kms = data?.totalKms || data?.total_kms || 0;
  let b = 0.1;
  if (kms <= 100) b = 0.2;
  else if (kms <= 250) b = 0.18;
  else if (kms <= 400) b = 0.16;
  else if (kms <= 550) b = 0.14;
  else if (kms <= 700) b = 0.12;

  const c = 0.05 * (a + b);
  return { a, b, c, subTotalPerTon: a + b + c };
};

/** Applies GST on a net amount and returns a full tax breakdown. */
const applyGst = (netAmount, data) => {
  if (data?.isSez) {
    return {
      netAmount,
      sgst: 0,
      cgst: 0,
      totalAmount: netAmount,
    };
  }

  const sgst = netAmount * GST_RATE;
  const cgst = netAmount * GST_RATE;

  return {
    netAmount,
    sgst,
    cgst,
    totalAmount: netAmount + sgst + cgst,
  };
};

// ─── Shared UI sub-components ────────────────────────────────────────────────

/** Payment gateway radio selector (Razorpay / BillDesk). */
const GatewaySelector = ({ paymentMode, onChange }) => (
  <View style={styles.gatewayContainer}>
    {[
      { value: "RAZORPAY", label: "Razorpay" },
      { value: "BILLDESK", label: "BillDesk" },
    ].map(({ value, label }) => (
      <TouchableOpacity
        key={value}
        style={[
          styles.gatewayOption,
          paymentMode === value && styles.gatewayOptionSelected,
        ]}
        onPress={() => onChange(value)}
      >
        <View style={styles.radioCircle}>
          {paymentMode === value && <View style={styles.radioSelected} />}
        </View>
        <Text style={styles.gatewayLabel}>{label}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

/** Shared GST summary rows appended to any payment table. */
const GstRows = ({
  subtotal,
  tdsAmount,
  netAmount,
  sgst,
  cgst,
  totalWithGst,
  applyTds,
  onTdsChange,
}) => (
  <View>
    <View style={styles.row}>
      <View style={styles.tdsContainer}>
        <TouchableOpacity 
          style={styles.checkboxContainer} 
          onPress={() => onTdsChange(!applyTds)}
        >
          <View style={[styles.checkbox, applyTds && styles.checkboxChecked]} />
          <Text style={styles.tdsText}>TDS Deduction {(TDS_RATE * 100)}%</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.rowValue, styles.textAlignRight]}>
        {applyTds ? tdsAmount.toFixed(2) : "0.00"}
      </Text>
    </View>
    
    <View style={styles.row}>
      <View style={styles.tdsContainer}>
        <Text style={styles.rowLabel}>
          Net Amount {applyTds && <Text style={styles.tdsNote}>(After TDS Deduction)</Text>}
        </Text>
      </View>
      <Text style={[styles.rowValue, styles.textAlignRight]}>
        {applyTds ? (netAmount - tdsAmount).toFixed(2) : netAmount.toFixed(2)}
      </Text>
    </View>
    
    <View style={styles.row}>
      <Text style={styles.rowLabel}>SGST (9%)</Text>
      <Text style={[styles.rowValue, styles.textAlignRight]}>{sgst.toFixed(2)}</Text>
    </View>
    
    <View style={styles.row}>
      <Text style={styles.rowLabel}>CGST (9%)</Text>
      <Text style={[styles.rowValue, styles.textAlignRight]}>{cgst.toFixed(2)}</Text>
    </View>
    
    <View style={[styles.row, styles.totalRow]}>
      <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
      <Text style={[styles.totalValue, styles.textAlignRight]}>
        {applyTds ? (netAmount - tdsAmount + sgst + cgst).toFixed(2) : totalWithGst.toFixed(2)}
      </Text>
    </View>
  </View>
);

/** Shared service-charge legend used in manifest / recyclable / effluent panels. */
const ServiceChargeRef = ({ a, b, c, kms, label = "Service Charge Reference" }) => (
  <View style={styles.serviceRefContainer}>
    <Text style={styles.serviceRefTitle}>{label}</Text>
    <Text style={styles.serviceRefText}>(A) Service Charges : ₹{typeof a === 'number' ? a.toFixed(2) : a}</Text>
    <Text style={styles.serviceRefText}>
      (B) Waste Monitoring & Vehicle Tracking Charges
      {kms ? ` ${kms} KM` : ""} : ₹{typeof b === 'number' ? b.toFixed(2) : b}
    </Text>
    <Text style={styles.serviceRefText}>
      (C) 5% Margin on (A + B) : ₹{typeof c === "number" ? c.toFixed(2) : c}
    </Text>
  </View>
);

// ─── Main Component ───────────────────────────────────────────────────────────

function RegistrationPayment({ type, vehicleList, onPayNow: propOnPayNow }) {
  const navigation = useNavigation();
  const route = useRoute();
  const data = route?.params?.data;
  const { officerName, mobile, userId } = useSelector((s) => s.LoginReducer);
  const dispatch = useDispatch();
  const [transporterModuleReferenceId, setTransporterModuleReferenceId] = useState("");
  const [flag, setFlag] = useState(false);
  const [recyclable, setRecyclable] = useState(false);
  const [confirmPayment, setConfirmPayment] = useState(false);
  const [paymentMode, setPaymentMode] = useState("RAZORPAY");
  const [paymentData, setPaymentData] = useState(null);
  const [vehicle, setVehicle] = useState([]);
  const [applyTds, setApplyTds] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getModuleReferenceId = async () => {
      const id = await AsyncStorage.getItem("moduleReferenceId");
      setTransporterModuleReferenceId(id || "");
    };
    getModuleReferenceId();
  }, []);

  const descriptions = {
    MANIFEST_PAYMENT: "Manifest payment",
    VEHICLE_REGISTRATION: "Vehicle registration payment",
    TRANSPORT_REGISTRATION: "Transport registration payment",
    EFFLUENT_PIPELINE_PAYMENT: "Effluent pipeline payment",
    RECYCLABLE_PAYMENT: "Recyclable payment",
    FLY_ASH_DISPOSAL_PAYMENT: "Fly Ash disposal payment",
    MARINE_DISCHARGE: "Marine discharge payment",
    OTHER_STATE_INDUSTRY_MAPPING: "Other state industry mapping payment",
  };

  let description = descriptions[type] || "Payment";

  // ── Parsed waste details ──
  let parsedwasteDetails = [];
  try {
    parsedwasteDetails = data?.waste_details
      ? JSON.parse(data.waste_details)
      : [];
  } catch {
    parsedwasteDetails = [];
  }

  // ── Subtotal calculation ──
  let subtotal = 0;
  let wasteDetails = null;

  if (type === "MANIFEST_PAYMENT" || type === "RECYCLABLE_PAYMENT") {
    wasteDetails = calcWasteCharges(data);
    const wastes = data?.wastes?.length ? data.wastes : parsedwasteDetails;
    subtotal = wastes.reduce((acc, w) => {
      const qty = Number(w?.disposalQuantity || w?.disposal_quantity || 0);
      return acc + qty * wasteDetails.subTotalPerTon;
    }, 0);
  } else if (type === "VEHICLE_REGISTRATION") {
    subtotal = (vehicleList?.length || 0) * VEHICLE_FEE;
  } else if (type === "TRANSPORT_REGISTRATION") {
    subtotal = TRANSPORTER_REGISTRATION_FEE;
  }

  // ── Effluent helpers ──
  const effluentQuantity = Number(data?.total_volume || 0);
  const effluentBaseRate = 15;
  const effluentCessRate = 0.75;
  const effluentTotalRate = effluentBaseRate + effluentCessRate;
  const effluentSubtotal = effluentTotalRate * effluentQuantity;
  const effluentGstResult = applyGst(effluentSubtotal);
  const effluentTotalWithGst = effluentGstResult.totalAmount;
  const effluentTdsAmount = applyTds ? effluentSubtotal * TDS_RATE : 0;
  const effluentTotalAfterTds = effluentTotalWithGst - effluentTdsAmount;

  const marineQuantity = Number(data?.totaldischargevolume || 0);
  const marineBaseRate = 10;
  const marineTotalRate = marineBaseRate + effluentCessRate;
  const marineSubtotal = marineTotalRate * marineQuantity;
  const marineGstResult = applyGst(marineSubtotal);
  const marineTotalWithGst = marineGstResult.totalAmount;
  const marineTdsAmount = applyTds ? marineSubtotal * TDS_RATE : 0;
  const marineTotalAfterTds = marineTotalWithGst - marineTdsAmount;

  // ── Effects ──
  useEffect(() => {
    if (type === "RECYCLABLE_PAYMENT" || type === "MANIFEST_PAYMENT") {
      commonAPICall(RECYCLABLEVEHICLID, {}, "get").then((res) => {
        if (res.status === 200)
          setVehicle(res?.data?.Transport_Vehicle_Selection_Details || []);
      });
    }
  }, [type]);

  // ── Build items array per payment type ──
  const buildItems = (payType) => {
    if (payType === "TRANSPORT_REGISTRATION") {
      return [
        {
          moduleReferenceId: transporterModuleReferenceId,
          itemName: "Transport Registration Fee",
          quantity: 1,
          unit: "NOS",
          serviceCharge: 1000.0,
          monitoringCharge: 0.0,
          marginCharge: 0.0,
          itemTotal: 1180.0,
        },
      ];
    }
    if (payType === "EFFLUENT_PIPELINE_PAYMENT") {
      return [
        {
          itemName: data?.effluent_type,
          transactionId: "",
          quantity: data?.disposal_quantity,
          unit: "KL",
          serviceCharge: effluentBaseRate,
          monitoringCharge: 0,
          marginCharge: effluentCessRate,
          subTotalPerKL: effluentTotalRate,
          itemTotal: effluentSubtotal,
          moduleReferenceId: data?.effluent_disposal_item_id,
        },
      ];
    }
    if (payType === "MARINE_DISCHARGE") {
      return [
        {
          itemName: "Marine Discharge",
          transactionId: "",
          quantity: data?.totaldischargevolume,
          unit: "KL",
          serviceCharge: marineBaseRate,
          monitoringCharge: 0,
          marginCharge: effluentCessRate,
          subTotalPerKL: marineTotalRate,
          itemTotal: marineSubtotal,
          moduleReferenceId: data?.postingid,
        },
      ];
    }

    if (payType === "MANIFEST_GENERATION" || payType === "MANIFEST_PAYMENT") {
      const { a, b, c, subTotalPerTon } =
        wasteDetails || calcWasteCharges(data);
      return data?.wastes?.map((ww) => ({
        itemName: `${data.wasteTypeName} - ${
          wasteTypes
            .find((i) => String(i.value) === String(ww.wasteTypeId))
            ?.label?.split("-")[1]
            ?.trim() || ""
        }`,
        transactionId:
          ww?.generatorApprovalTransactionNumber ||
          ww?.generator_approval_transaction_number,
        quantity: ww.disposalQuantity,
        unit: ww.unitId === 1 ? "KL" : "Tonnes",
        serviceCharge: a,
        monitoringCharge: b,
        marginCharge: c,
        subTotalPerKL: subTotalPerTon,
        itemTotal: ww.disposalQuantity * subTotalPerTon,
        moduleReferenceId: data?.waste_disposal_id || data?.wasteDisposalId,
      }));
    }
    if (payType === "VEHICLE_REGISTRATION") {
      return vehicleList.map((vv) => ({
        itemName: "Vehicle Registration Fee",
        vehicleNumber: vv.vehicle_no,
        vehicleType: vv.vehicle_type_name,
        serviceCharge: 500,
        itemTotal: 500,
        moduleReferenceId: vehicleList[0]?.vehicleid,
      }));
    }

    if (payType === "RECYCLABLE_PAYMENT") {
      const { b, c, subTotalPerTon } = wasteDetails || calcWasteCharges(data);
      return [
        {
          itemName: data.waste_type_name,
          transactionId: data?.wastes[0]?.generator_approval_transaction_number,
          quantity: data?.wastes[0]?.disposal_quantity,
          unit: data?.unitId === 1 ? "KL" : "Tonnes",
          serviceCharge: 5,
          monitoringCharge: b,
          marginCharge: c,
          subTotalPerKL: subTotalPerTon,
          itemTotal: (
            (5 + b + c) *
            data?.wastes[0]?.disposal_quantity
          )?.toFixed(2),
          moduleReferenceId:
            data?.transportVehicleSelectionId ||
            data?.transportvehicleselectionid,
        },
      ];
    }
    if (payType === "OTHER_STATE_INDUSTRY_MAPPING") {
      return [
        {
          moduleReferenceId: data?.detail_id || data?.detail_id,
        },
      ];
    }
    return [];
  };

  // ── Fly ash amounts ──
  const getFlyAshAmounts = () => {
    const list = vehicleList || [];

    const totalQuantity = list.reduce(
      (sum, item) => sum + Number(item?.quantity || 0),
      0,
    );

    const flyAshSubtotal = list.reduce(
      (sum, item) => sum + Number(item?.amount || 0),
      0,
    );

    const gstResult = applyGst(flyAshSubtotal);
    const flyAshTotalWithGst = gstResult.totalAmount;
    const flyAshTdsAmount = applyTds ? flyAshSubtotal * TDS_RATE : 0;
    const flyAshTotalAfterTds = flyAshTotalWithGst - flyAshTdsAmount;

    return {
      flyAshSubtotal,
      flyAshSgst: gstResult.sgst,
      flyAshCgst: gstResult.cgst,
      flyAshTotalWithGst,
      flyAshTdsAmount,
      flyAshTotalAfterTds,
      totalQuantity,
    };
  };

  // ── Build base payload ──
  const buildPayload = (payType, gateway, payLater) => {
    const isFlyAsh = payType === "FLY_ASH_DISPOSAL_PAYMENT";
    const {
      flyAshSubtotal,
      flyAshSgst,
      flyAshCgst,
      flyAshTotalWithGst,
      flyAshTdsAmount,
      flyAshTotalAfterTds,
    } = isFlyAsh ? getFlyAshAmounts() : {};

    let baseSubtotal, baseSgst, baseCgst, baseTotalWithGst, baseTdsAmount, baseTotalAfterTds;

    if (isFlyAsh) {
      baseSubtotal = flyAshSubtotal;
      baseSgst = flyAshSgst;
      baseCgst = flyAshCgst;
      baseTotalWithGst = flyAshTotalWithGst;
      baseTdsAmount = flyAshTdsAmount;
      baseTotalAfterTds = flyAshTotalAfterTds;
    } else {
      const gstResult = applyGst(subtotal);
      const totalWithGst = gstResult.totalAmount;
      const tdsAmount = applyTds ? subtotal * TDS_RATE : 0;
      const totalAfterTds = totalWithGst - tdsAmount;
      
      baseSubtotal = subtotal;
      baseSgst = gstResult.sgst;
      baseCgst = gstResult.cgst;
      baseTotalWithGst = totalWithGst;
      baseTdsAmount = tdsAmount;
      baseTotalAfterTds = totalAfterTds;
    }

    const items = isFlyAsh
      ? (vehicleList || []).map((vehicle) => ({
          itemName: "Fly Ash Payment",
          transactionId: "",
          quantity: Number(vehicle?.quantity || 0),
          unit: "Tonnes",
          serviceCharge: 5,
          monitoringCharge: 0,
          marginCharge: 0,
          subTotalPerKL: Number(vehicle?.amount || 0).toFixed(2),
          itemTotal: Number(vehicle?.amount || 0).toFixed(2),
          moduleReferenceId: vehicle?.fly_ash_disposal_id,
        }))
      : buildItems(payType);

    return {
      paymentFor: payType,
      referenceId: 1001,
      gatewayType: gateway,
      customerName: officerName,
      mobileNumber: mobile,
      email: "test@gmail.com",
      userId,
      subTotal: baseSubtotal,
      sgstAmount: baseSgst,
      cgstAmount: baseCgst,
      totalAmount: baseTotalWithGst,
      tdsAmount: baseTdsAmount,
      netPayableAmount: baseTotalAfterTds,
      payLater,
      description: description,
      remarks: `Online payment through ${gateway === "RAZORPAY" ? "Razorpay" : "BillDesk"}`,
      items,
    };
  };

  // ── Razorpay form submit ──
  const submitRazorpayForm = (orderData, payload) => {
    if (!orderData?.orderId) {
      Alert.alert("Error", "Order not created yet");
      return;
    }
    // For React Native, we need to use Linking or WebView
    const razorpayUrl = `https://api.razorpay.com/v1/checkout/embedded?key_id=${orderData.gatewayKey}&amount=${payload.netPayableAmount * 100}&currency=${orderData.currency || "INR"}&order_id=${orderData.orderId}&name=AP ENVIRONMENT MANAGEMENT&description=${payload.description}&prefill[name]=${payload.customerName}&prefill[contact]=${payload.mobileNumber}&prefill[email]=${payload.email}&notes[paymentFor]=${payload.paymentFor}&notes[referenceId]=${payload.referenceId}&notes[userId]=${payload.userId}&callback_url=https://swapi.dev.nidhi.apcfss.in/apemcl/api/open/payment-callback`;
    
    Linking.openURL(razorpayUrl).catch(err => {
      Alert.alert("Error", "Failed to open payment gateway");
    });
  };

  // ── BillDesk: create order & collect redirect data ──
  const initBillDesk = async (payType) => {
    setLoading(true);
    const payload = buildPayload(payType, "BILLDESK", false);
    try {
      const res = await commonAPICall(PAYMENTAPEMCL, payload, "post");
      if (res.status === 200) {
        const d = res.data.data;
        const redirect = d.links.find((l) => l.rel === "redirect");
        setPaymentData({
          mercid: d.mercid,
          bdorderid: d.bdorderid,
          rdata: redirect?.parameters?.rdata,
          href: redirect?.href,
        });
      }
    } catch (err) {
      console.error("BillDesk error", err);
      Alert.alert("Error", "BillDesk payment initialization failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Unified Pay Now ──
  const handlePayNow = async (payType) => {
    try {
      setLoading(true);
      if (paymentMode === "RAZORPAY") {
        const payload = buildPayload(payType, "RAZORPAY", false);
        const res = await commonAPICall(PAYMENTAPEMCL, payload, "post");
        if (res?.status === 200 || res?.status === 201)
          submitRazorpayForm(res.data, payload);
      } else {
        await initBillDesk(payType);
      }
    } catch (err) {
      console.error("Payment Error:", err);
      Alert.alert("Error", "Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Unified Pay Later ──
  const handlePayLater = async (payType) => {
    try {
      setLoading(true);
      if (paymentMode === "RAZORPAY") {
        const payload = buildPayload(payType, "RAZORPAY", true);
        const res = await commonAPICall(PAYMENTAPEMCL, payload, "post");
        if (res?.status === 200) {
          if (payType === "RECYCLABLE_PAYMENT") {
            navigation.navigate("ConfirmationRequired");
          } else if (payType === "EFFLUENT_PIPELINE_PAYMENT") {
            navigation.navigate("EffluentPipelineDischarge", { data });
          } else if (payType === "MARINE_DISCHARGE") {
            navigation.navigate("ListMarineDischarges", { data });
          } else {
            navigation.navigate("GenApprovedList", { data });
          }
        }
      } else {
        await initBillDesk(payType);
      }
    } catch (err) {
      console.error("Payment Error:", err);
      Alert.alert("Error", "Payment later failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Recyclable accept / reject ──
  const handleRecyclableAction = async (transportvehicleselectionid, action) => {
    Alert.alert(
      "Are you sure?",
      `Do you want to ${action === "ACCEPTED" ? "accept" : "reject"} this request?`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            const res = await commonAPICall(
              RECYCLABLE,
              {
                transportVehicleSelectionId: transportvehicleselectionid,
                recyclableReceiverPaymentAction: action,
              },
              "post",
            );
            if (res.status === 200) {
              action === "ACCEPTED" ? setRecyclable(true) : navigation.goBack();
            }
          },
        },
      ]
    );
  };

  const submitRecyclableDetails = async () => {
    const res = await commonAPICall(
      RECYCLABLE,
      {
        transportVehicleSelectionId: vehicle[0]?.id,
        recyclablePaymentConfirmation: true,
      },
      "post",
    );
    if (res.status === 200) navigation.navigate("ManifestList");
  };

  // ── Terms & Conditions modal ──
  const ShowTerms = () => {
    dispatch(showModal(<TermsAndConditions />));
  };

  // ── Pay Buttons component ──
  const PayButtons = ({ onPayLater, onPayNow, showPayLater = true }) => (
    <View style={styles.payButtonsContainer}>
      {showPayLater && (
        <TouchableOpacity style={[styles.button, styles.payLaterButton]} onPress={onPayLater}>
          <Text style={styles.buttonText}>PAY LATER</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={[styles.button, styles.payNowButton]} onPress={onPayNow}>
        <Text style={styles.buttonText}>PAY NOW</Text>
      </TouchableOpacity>
    </View>
  );

  // ── BillDesk redirect ──
  if (paymentData) {
    // Open BillDesk URL in browser or WebView
    Linking.openURL(paymentData.href).catch(err => {
      Alert.alert("Error", "Failed to open payment gateway");
    });
    setPaymentData(null);
    return null;
  }

  // ─── Render: Manifest Payment ────────────────────────────────────────────
  const renderTransportSelectionPayment = () => {
    const { a, b, c, subTotalPerTon } = wasteDetails;
    const wastes = data?.wastes?.length ? data.wastes : parsedwasteDetails;
    const gstResult = applyGst(subtotal);
    const totalWithGst = gstResult.totalAmount;
    const tdsAmount = applyTds ? subtotal * TDS_RATE : 0;
    const totalAfterTds = totalWithGst - tdsAmount;
    
    return (
      <View style={styles.cardBody}>
        <View style={styles.panel}>
          <View style={styles.panelHeading}>
            <Text style={styles.panelHeadingText}>{CONTEXT_HEADING}</Text>
          </View>
          <View style={styles.panelBody}>
            <ScrollView horizontal>
              <View style={styles.tableContainer}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCell, styles.headerCell, { width: 30 }]}>#</Text>
                  <Text style={[styles.tableCell, styles.headerCell, { width: 150 }]}>Waste Details</Text>
                  <Text style={[styles.tableCell, styles.headerCell, { width: 70 }]}>Quantity</Text>
                  <Text style={[styles.tableCell, styles.headerCell, { width: 70 }]}>Unit</Text>
                  <Text style={[styles.tableCell, styles.headerCell, { width: 50 }]}>(A)</Text>
                  <Text style={[styles.tableCell, styles.headerCell, { width: 50 }]}>(B)</Text>
                  <Text style={[styles.tableCell, styles.headerCell, { width: 50 }]}>(C)</Text>
                  <Text style={[styles.tableCell, styles.headerCell, { width: 80 }]}>Sub Total</Text>
                  <Text style={[styles.tableCell, styles.headerCell, { width: 70 }]}>Total</Text>
                </View>
                {wastes.map((waste, i) => {
                  const quantity = Number(
                    waste?.disposal_quantity || waste?.disposalQuantity || 0,
                  );
                  const wasteType = wasteTypes
                    .find(
                      (item) =>
                        String(item.value) ===
                        String(data?.receiverWasteTypeId),
                    )
                    ?.label?.split("-")[1];
                  return (
                    <View key={i} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { width: 30 }]}>{i + 1}</Text>
                      <View style={[styles.tableCell, { width: 150 }]}>
                        <Text>{data?.waste_type_name ||
                          `${waste?.wasteType?.split("-")[0]} - ${wasteType || ""}`}</Text>
                        <Text style={styles.transactionId}>
                          Transaction Id:{" "}
                          {waste?.generatorApprovalTransactionNumber ||
                            waste?.wasteType?.split("-")[2] ||
                            data?.generator_approval_transaction_number ||
                            "-"}
                        </Text>
                      </View>
                      <Text style={[styles.tableCell, styles.textAlignRight, { width: 70 }]}>{quantity}</Text>
                      <Text style={[styles.tableCell, { width: 70 }]}>
                        {waste?.unit || (waste?.unitId === 1 ? "KL" : "Tonnes")}
                      </Text>
                      <Text style={[styles.tableCell, styles.textAlignRight, { width: 50 }]}>{a?.toFixed(2)}</Text>
                      <Text style={[styles.tableCell, styles.textAlignRight, { width: 50 }]}>{b?.toFixed(2)}</Text>
                      <Text style={[styles.tableCell, styles.textAlignRight, { width: 50 }]}>{c?.toFixed(2)}</Text>
                      <Text style={[styles.tableCell, styles.textAlignRight, { width: 80 }]}>
                        {subTotalPerTon?.toFixed(2)}
                      </Text>
                      <Text style={[styles.tableCell, styles.textAlignRight, { width: 70 }]}>
                        {(quantity * subTotalPerTon)?.toFixed(2)}
                      </Text>
                    </View>
                  );
                })}
                <GstRows
                  subtotal={subtotal}
                  tdsAmount={tdsAmount}
                  netAmount={gstResult.netAmount}
                  sgst={gstResult.sgst}
                  cgst={gstResult.cgst}
                  totalWithGst={totalWithGst}
                  applyTds={applyTds}
                  onTdsChange={setApplyTds}
                />
              </View>
            </ScrollView>

            <View style={styles.flexRow}>
              {a === 5 ? (
                <>
                  <View style={styles.noteContainer}>
                    <Text style={styles.noteText}>Note: Shall be Paid by Receiver</Text>
                    <Text style={styles.noteTitle}>Proceed for Receiver Payment Confirmation</Text>
                  </View>
                  <TouchableOpacity style={styles.submitButton} onPress={() => submitRecyclableDetails(vehicle)}>
                    <Text style={styles.buttonText}>SUBMIT</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.paymentActionsContainer}>
                  <ServiceChargeRef a={a} b={b} c={c} kms={data?.totalKms} />
                  <View style={styles.paymentActions}>
                    <GatewaySelector paymentMode={paymentMode} onChange={setPaymentMode} />
                    <PayButtons
                      onPayLater={() => handlePayLater("MANIFEST_PAYMENT")}
                      onPayNow={() => handlePayNow("MANIFEST_PAYMENT")}
                    />
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>
        {loading && <ActivityIndicator size="large" style={styles.loader} />}
      </View>
    );
  };

  // ─── Render: Effluent Payment ────────────────────────────────────────────
  const renderEffluentPayment = () => {
    const totalWithGst = effluentTotalWithGst;
    const tdsAmount = effluentTdsAmount;
    const gstResult = applyGst(effluentSubtotal);
    
    return (
      <>
        <ScrollView horizontal>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.headerCell, { width: 30 }]}>#</Text>
              <Text style={[styles.tableCell, styles.headerCell, { width: 150 }]}>Waste Details</Text>
              <Text style={[styles.tableCell, styles.headerCell, { width: 70 }]}>Quantity</Text>
              <Text style={[styles.tableCell, styles.headerCell, { width: 70 }]}>Unit</Text>
              <Text style={[styles.tableCell, styles.headerCell, { width: 50 }]}>(A)</Text>
              <Text style={[styles.tableCell, styles.headerCell, { width: 50 }]}>(B)</Text>
              <Text style={[styles.tableCell, styles.headerCell, { width: 50 }]}>(C)</Text>
              <Text style={[styles.tableCell, styles.headerCell, { width: 80 }]}>Sub Total</Text>
              <Text style={[styles.tableCell, styles.headerCell, { width: 70 }]}>Total</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.textCenter, { width: 30 }]}>1</Text>
              <Text style={[styles.tableCell, { width: 150 }]}>{data?.effluent_type}</Text>
              <Text style={[styles.tableCell, styles.textAlignRight, { width: 70 }]}>{effluentQuantity.toFixed(2)}</Text>
              <Text style={[styles.tableCell, { width: 70 }]}>KL</Text>
              <Text style={[styles.tableCell, styles.textAlignRight, { width: 50 }]}>{effluentBaseRate.toFixed(2)}</Text>
              <Text style={[styles.tableCell, styles.textAlignRight, { width: 50 }]}>0.00</Text>
              <Text style={[styles.tableCell, styles.textAlignRight, { width: 50 }]}>{effluentCessRate.toFixed(2)}</Text>
              <Text style={[styles.tableCell, styles.textAlignRight, { width: 80 }]}>{effluentTotalRate.toFixed(2)}</Text>
              <Text style={[styles.tableCell, styles.textAlignRight, { width: 70 }]}>{effluentSubtotal.toFixed(2)}</Text>
            </View>
            <GstRows
              subtotal={effluentSubtotal}
              tdsAmount={tdsAmount}
              netAmount={gstResult.netAmount}
              sgst={gstResult.sgst}
              cgst={gstResult.cgst}
              totalWithGst={totalWithGst}
              applyTds={applyTds}
              onTdsChange={setApplyTds}
            />
          </View>
        </ScrollView>

        <View style={styles.paymentActionsContainer}>
          <ServiceChargeRef
            a="15.00"
            b="0.00"
            c="0.75"
            label="Service Charge Reference"
          />
          <View style={styles.paymentActions}>
            <GatewaySelector paymentMode={paymentMode} onChange={setPaymentMode} />
            <PayButtons
              onPayLater={() => handlePayLater("EFFLUENT_PIPELINE_PAYMENT")}
              onPayNow={() => handlePayNow("EFFLUENT_PIPELINE_PAYMENT")}
            />
          </View>
        </View>
        {loading && <ActivityIndicator size="large" style={styles.loader} />}
      </>
    );
  };

  const renderMarinePayment = () => {
    const totalWithGst = marineTotalWithGst;
    const tdsAmount = marineTdsAmount;
    const gstResult = applyGst(marineSubtotal);
    
    return (
      <>
        <View style={styles.cardBody}>
          <View style={styles.panel}>
            <View style={styles.panelHeading}>
              <Text style={styles.panelHeadingText}>{CONTEXT_HEADING}</Text>
            </View>
            <View style={styles.panelBody}>
              <ScrollView horizontal>
                <View style={styles.tableContainer}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableCell, styles.headerCell, { width: 30 }]}>#</Text>
                    <Text style={[styles.tableCell, styles.headerCell, { width: 150 }]}>Waste Details</Text>
                    <Text style={[styles.tableCell, styles.headerCell, { width: 70 }]}>Quantity</Text>
                    <Text style={[styles.tableCell, styles.headerCell, { width: 70 }]}>Unit</Text>
                    <Text style={[styles.tableCell, styles.headerCell, { width: 50 }]}>(A)</Text>
                    <Text style={[styles.tableCell, styles.headerCell, { width: 50 }]}>(B)</Text>
                    <Text style={[styles.tableCell, styles.headerCell, { width: 50 }]}>(C)</Text>
                    <Text style={[styles.tableCell, styles.headerCell, { width: 80 }]}>Sub Total</Text>
                    <Text style={[styles.tableCell, styles.headerCell, { width: 70 }]}>Total</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.textCenter, { width: 30 }]}>1</Text>
                    <Text style={[styles.tableCell, { width: 150 }]}>Marine Discharge</Text>
                    <Text style={[styles.tableCell, styles.textAlignRight, { width: 70 }]}>{marineQuantity.toFixed(2)}</Text>
                    <Text style={[styles.tableCell, { width: 70 }]}>KL</Text>
                    <Text style={[styles.tableCell, styles.textAlignRight, { width: 50 }]}>{marineBaseRate.toFixed(2)}</Text>
                    <Text style={[styles.tableCell, styles.textAlignRight, { width: 50 }]}>0.00</Text>
                    <Text style={[styles.tableCell, styles.textAlignRight, { width: 50 }]}>{effluentCessRate.toFixed(2)}</Text>
                    <Text style={[styles.tableCell, styles.textAlignRight, { width: 80 }]}>{marineTotalRate.toFixed(2)}</Text>
                    <Text style={[styles.tableCell, styles.textAlignRight, { width: 70 }]}>{marineSubtotal.toFixed(2)}</Text>
                  </View>
                  <GstRows
                    subtotal={marineSubtotal}
                    tdsAmount={tdsAmount}
                    netAmount={gstResult.netAmount}
                    sgst={gstResult.sgst}
                    cgst={gstResult.cgst}
                    totalWithGst={totalWithGst}
                    applyTds={applyTds}
                    onTdsChange={setApplyTds}
                  />
                </View>
              </ScrollView>

              <View style={styles.paymentActionsContainer}>
                <ServiceChargeRef
                  a="10.00"
                  b="0.00"
                  c="0.75"
                  label="Service Charge Reference"
                />
                <View style={styles.paymentActions}>
                  <GatewaySelector paymentMode={paymentMode} onChange={setPaymentMode} />
                  <PayButtons
                    onPayLater={() => handlePayLater("MARINE_DISCHARGE")}
                    onPayNow={() => handlePayNow("MARINE_DISCHARGE")}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
        {loading && <ActivityIndicator size="large" style={styles.loader} />}
      </>
    );
  };

  // ─── Render: Recyclable Payment ──────────────────────────────────────────
  const renderRecyclablePayment = () => {
    const { a, b, c, subTotalPerTon } = wasteDetails;
    const gstResult = applyGst(subtotal);
    const totalWithGst = gstResult.totalAmount;
    const tdsAmount = applyTds ? subtotal * TDS_RATE : 0;
    const totalAfterTds = totalWithGst - tdsAmount;
    
    return (
      <View style={styles.cardBody}>
        <View style={styles.panel}>
          <View style={styles.panelHeading}>
            <Text style={styles.panelHeadingText}>{CONTEXT_HEADING}</Text>
          </View>
          <View style={styles.panelBody}>
            <ScrollView horizontal>
              <View style={styles.tableContainer}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableCell, styles.headerCell, { width: 30 }]}>#</Text>
                  <Text style={[styles.tableCell, styles.headerCell, { width: 150 }]}>Waste Details</Text>
                  <Text style={[styles.tableCell, styles.headerCell, { width: 70 }]}>Quantity</Text>
                  <Text style={[styles.tableCell, styles.headerCell, { width: 70 }]}>Unit</Text>
                  <Text style={[styles.tableCell, styles.headerCell, { width: 50 }]}>(A)</Text>
                  <Text style={[styles.tableCell, styles.headerCell, { width: 50 }]}>(B)</Text>
                  <Text style={[styles.tableCell, styles.headerCell, { width: 50 }]}>(C)</Text>
                  <Text style={[styles.tableCell, styles.headerCell, { width: 80 }]}>Sub Total</Text>
                  <Text style={[styles.tableCell, styles.headerCell, { width: 70 }]}>Total</Text>
                </View>
                {data?.wastes?.map((waste, i) => {
                  const quantity = Number(waste?.disposal_quantity || 0);
                  return (
                    <View key={i} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { width: 30 }]}>{i + 1}</Text>
                      <View style={[styles.tableCell, { width: 150 }]}>
                        <Text>{data?.waste_type_name || "-"}</Text>
                        <Text style={styles.transactionId}>
                          Transaction Id:{" "}
                          {waste?.generator_approval_transaction_number &&
                          waste?.generator_approval_transaction_number !== "null"
                            ? waste?.generator_approval_transaction_number
                            : "-"}
                        </Text>
                      </View>
                      <Text style={[styles.tableCell, styles.textAlignRight, { width: 70 }]}>{quantity}</Text>
                      <Text style={[styles.tableCell, { width: 70 }]}>{waste?.unit || "-"}</Text>
                      <Text style={[styles.tableCell, styles.textAlignRight, { width: 50 }]}>{a}</Text>
                      <Text style={[styles.tableCell, styles.textAlignRight, { width: 50 }]}>{b?.toFixed(2)}</Text>
                      <Text style={[styles.tableCell, styles.textAlignRight, { width: 50 }]}>{c?.toFixed(2)}</Text>
                      <Text style={[styles.tableCell, styles.textAlignRight, { width: 80 }]}>{subTotalPerTon}</Text>
                      <Text style={[styles.tableCell, styles.textAlignRight, { width: 70 }]}>
                        {(subTotalPerTon * quantity)?.toFixed(2)}
                      </Text>
                    </View>
                  );
                })}
                <GstRows
                  subtotal={subtotal}
                  tdsAmount={tdsAmount}
                  netAmount={gstResult.netAmount}
                  sgst={gstResult.sgst}
                  cgst={gstResult.cgst}
                  totalWithGst={totalWithGst}
                  applyTds={applyTds}
                  onTdsChange={setApplyTds}
                />
              </View>
            </ScrollView>

            <View style={styles.recyclableActionsContainer}>
              <ServiceChargeRef
                a={5.0}
                b={b}
                c={((a || 0) + (b || 0)) * 0.05}
                kms={data?.totalKms}
              />

              {!recyclable ? (
                <View style={styles.recyclableButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.rejectButton]}
                    onPress={() =>
                      handleRecyclableAction(
                        data?.transportvehicleselectionid,
                        "REJECTED",
                      )
                    }
                  >
                    <Text style={styles.buttonText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.acceptButton]}
                    onPress={() =>
                      handleRecyclableAction(
                        data?.transportvehicleselectionid,
                        "ACCEPTED",
                      )
                    }
                  >
                    <Text style={styles.buttonText}>Accept for Payment</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.paymentActions}>
                  <GatewaySelector paymentMode={paymentMode} onChange={setPaymentMode} />
                  <PayButtons
                    onPayLater={() => handlePayLater("RECYCLABLE_PAYMENT")}
                    onPayNow={() => handlePayNow("RECYCLABLE_PAYMENT")}
                  />
                </View>
              )}
            </View>
          </View>
        </View>
        {loading && <ActivityIndicator size="large" style={styles.loader} />}
      </View>
    );
  };

  // ─── Render: Fly Ash Payment ─────────────────────────────────────────────
  const renderFlyashPayment = () => {
    const {
      flyAshSubtotal,
      flyAshSgst,
      flyAshCgst,
      flyAshTotalWithGst,
      flyAshTdsAmount,
      flyAshTotalAfterTds,
    } = getFlyAshAmounts();

    return (
      <View style={styles.cardBody}>
        <View style={styles.panel}>
          <View style={styles.panelHeading}>
            <Text style={styles.panelHeadingText}>{CONTEXT_HEADING}</Text>
          </View>
          <View style={styles.panelBody}>
            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, styles.headerCell, { width: 50 }]}>S.No</Text>
                <Text style={[styles.tableCell, styles.headerCell, { width: 120 }]}>Payment Type</Text>
                <Text style={[styles.tableCell, styles.headerCell, { width: 80 }]}>Quantity (T)</Text>
                <Text style={[styles.tableCell, styles.headerCell, { width: 120 }]}>Service Charge (T)</Text>
                <Text style={[styles.tableCell, styles.headerCell, { width: 80 }]}>Price</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.textCenter, { width: 50 }]}>1</Text>
                <Text style={[styles.tableCell, { width: 120 }]}>Fly Ash Payment</Text>
                <Text style={[styles.tableCell, styles.textAlignRight, { width: 80 }]}>
                  {vehicleList
                    ?.reduce(
                      (total, waste) => total + Number(waste?.quantity || 0),
                      0,
                    )
                    .toFixed(2)}
                </Text>
                <Text style={[styles.tableCell, { width: 120 }]}>Rs. 5</Text>
                <Text style={[styles.tableCell, styles.textAlignRight, { width: 80 }]}>
                  {vehicleList
                    ?.reduce(
                      (total, waste) => total + Number(waste?.amount || 0),
                      0,
                    )
                    .toFixed(2)}
                </Text>
              </View>
              <View style={[styles.tableRow, styles.totalRow]}>
                <Text style={[styles.tableCell, { width: 370, textAlign: 'right' }]}>
                  <Text style={styles.bold}>Sub Total</Text>
                </Text>
                <Text style={[styles.tableCell, styles.textAlignRight, { width: 80 }]}>
                  <Text style={styles.bold}>{flyAshSubtotal?.toFixed(2)}</Text>
                </Text>
              </View>
              <GstRows
                subtotal={flyAshSubtotal}
                tdsAmount={flyAshTdsAmount}
                netAmount={flyAshSubtotal}
                sgst={flyAshSgst}
                cgst={flyAshCgst}
                totalWithGst={flyAshTotalWithGst}
                applyTds={applyTds}
                onTdsChange={setApplyTds}
              />
            </View>

            <View style={styles.flyashActions}>
              {!confirmPayment ? (
                <TouchableOpacity
                  style={[styles.button, styles.confirmButton]}
                  onPress={() => setConfirmPayment(true)}
                >
                  <Text style={styles.buttonText}>Confirm & Proceed</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.paymentActions}>
                  <GatewaySelector paymentMode={paymentMode} onChange={setPaymentMode} />
                  <TouchableOpacity
                    style={[styles.button, styles.payNowButton]}
                    onPress={() => handlePayNow("FLY_ASH_DISPOSAL_PAYMENT")}
                  >
                    <Text style={styles.buttonText}>PAY NOW</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={ShowTerms} style={styles.termsLink}>
          <Text style={styles.termsText}>* Terms & Conditions for your reference</Text>
        </TouchableOpacity>
        {loading && <ActivityIndicator size="large" style={styles.loader} />}
      </View>
    );
  };

  // ─── Render: Vehicle Registration ────────────────────────────────────────
  const renderVehiclePayment = () => {
    const gstResult = applyGst(subtotal);
    const totalWithGst = gstResult.totalAmount;
    const tdsAmount = applyTds ? subtotal * TDS_RATE : 0;
    const totalAfterTds = totalWithGst - tdsAmount;
    
    return (
      <>
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderText}>
            Make your vehicle payment for your full access
          </Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.headerCell, { width: 60 }]}>Sl.No</Text>
              <Text style={[styles.tableCell, styles.headerCell, { width: 150 }]}>Vehicle Number</Text>
              <Text style={[styles.tableCell, styles.headerCell, { width: 120 }]}>Vehicle Type</Text>
              <Text style={[styles.tableCell, styles.headerCell, styles.textAlignRight, { width: 80 }]}>Price</Text>
            </View>
            {vehicleList?.map((vv, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: 60 }]}>{i + 1}</Text>
                <View style={[styles.tableCell, { width: 150 }]}>
                  <Text>{vv.vehicle_no}</Text>
                  <Text style={styles.vehicleDate}>
                    {new Date().toLocaleDateString("en-GB")} –{" "}
                    {new Date(
                      new Date().setFullYear(new Date().getFullYear() + 1),
                    ).toLocaleDateString("en-GB")}
                  </Text>
                </View>
                <Text style={[styles.tableCell, { width: 120 }]}>{vv.vehicle_type_name}</Text>
                <Text style={[styles.tableCell, styles.textAlignRight, { width: 80 }]}>{VEHICLE_FEE}</Text>
              </View>
            ))}
            <GstRows
              subtotal={subtotal}
              tdsAmount={tdsAmount}
              netAmount={gstResult.netAmount}
              sgst={gstResult.sgst}
              cgst={gstResult.cgst}
              totalWithGst={totalWithGst}
              applyTds={applyTds}
              onTdsChange={setApplyTds}
            />
          </View>

          <View style={styles.vehiclePaymentActions}>
            <GatewaySelector paymentMode={paymentMode} onChange={setPaymentMode} />
            <TouchableOpacity
              style={[styles.button, styles.payNowButton]}
              onPress={() => handlePayNow("VEHICLE_REGISTRATION")}
            >
              <Text style={styles.buttonText}>PAY NOW</Text>
            </TouchableOpacity>
          </View>
        </View>
        {loading && <ActivityIndicator size="large" style={styles.loader} />}
      </>
    );
  };

  // ─── Render: Transporter Registration ────────────────────────────────────
  const renderTransporterPayment = () => {
    const gstResult = applyGst(subtotal);
    const totalWithGst = gstResult.totalAmount;
    const tdsAmount = applyTds ? subtotal * TDS_RATE : 0;
    const totalAfterTds = totalWithGst - tdsAmount;
    
    return (
      <>
        <View style={styles.cardHeader}>
          <Text style={styles.cardHeaderText}>Registration Payment Fee</Text>
          <Text style={styles.transporterInfo}>
            Its the Registration/Annual payment for every Transporters who
            registered with us. Once this payment has been done, you will have the
            access to add the vehicle details.
          </Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.headerCell, { width: 60 }]}>Sl.No</Text>
              <Text style={[styles.tableCell, styles.headerCell, { width: 200 }]}>Description</Text>
              <Text style={[styles.tableCell, styles.headerCell, styles.textAlignRight, { width: 80 }]}>Price</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: 60 }]}>1</Text>
              <Text style={[styles.tableCell, { width: 200 }]}>Registration Fee</Text>
              <Text style={[styles.tableCell, styles.textAlignRight, { width: 80 }]}>{subtotal?.toFixed(2)}</Text>
            </View>
            <GstRows
              subtotal={subtotal}
              tdsAmount={tdsAmount}
              netAmount={gstResult.netAmount}
              sgst={gstResult.sgst}
              cgst={gstResult.cgst}
              totalWithGst={totalWithGst}
              applyTds={applyTds}
              onTdsChange={setApplyTds}
            />
          </View>

          <View style={styles.transporterActions}>
            {flag && (
              <GatewaySelector paymentMode={paymentMode} onChange={setPaymentMode} />
            )}
            <View>
              {!flag ? (
                <TouchableOpacity
                  style={[styles.button, styles.confirmButton]}
                  onPress={() => setFlag(true)}
                >
                  <Text style={styles.buttonText}>CONFIRM & PROCEED</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.button, styles.payNowButton]}
                  onPress={() => handlePayNow("TRANSPORT_REGISTRATION")}
                >
                  <Text style={styles.buttonText}>PAY NOW</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
        {loading && <ActivityIndicator size="large" style={styles.loader} />}
      </>
    );
  };

  // **************************** Other State Industry Mapping ***********************************
  const renderOtherStateIndustryMappingPayment = () => {
    const subtotalAmount = data?.annual_fee || 0;
    const gstResult = applyGst(subtotalAmount);
    const totalWithGst = gstResult.totalAmount;
    const tdsAmount = applyTds ? subtotalAmount * TDS_RATE : 0;
    const totalAfterTds = totalWithGst - tdsAmount;
    
    return (
      <>
        <View style={styles.cardBody}>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.headerCell, { width: 60 }]}>Sl.No</Text>
              <Text style={[styles.tableCell, styles.headerCell, { width: 150 }]}>Industry Name</Text>
              <Text style={[styles.tableCell, styles.headerCell, { width: 120 }]}>Payment Status</Text>
              <Text style={[styles.tableCell, styles.headerCell, styles.textAlignRight, { width: 80 }]}>Price</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: 60 }]}>1</Text>
              <Text style={[styles.tableCell, { width: 150 }]}>{data?.industry_name}</Text>
              <Text style={[styles.tableCell, { width: 120 }]}>Pending</Text>
              <Text style={[styles.tableCell, styles.textAlignRight, { width: 80 }]}>
                {data.annual_fee?.toFixed(2)}
              </Text>
            </View>
            <GstRows
              subtotal={subtotalAmount}
              tdsAmount={tdsAmount}
              netAmount={gstResult.netAmount}
              sgst={gstResult.sgst}
              cgst={gstResult.cgst}
              totalWithGst={totalWithGst}
              applyTds={applyTds}
              onTdsChange={setApplyTds}
            />
          </View>

          <View style={styles.transporterActions}>
            {flag && (
              <GatewaySelector paymentMode={paymentMode} onChange={setPaymentMode} />
            )}
            <View>
              {!flag ? (
                <TouchableOpacity
                  style={[styles.button, styles.confirmButton]}
                  onPress={() => setFlag(true)}
                >
                  <Text style={styles.buttonText}>CONFIRM & PROCEED</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.button, styles.payNowButton]}
                  onPress={() => handlePayNow("OTHER_STATE_INDUSTRY_MAPPING")}
                >
                  <Text style={styles.buttonText}>PAY NOW</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
        {loading && <ActivityIndicator size="large" style={styles.loader} />}
      </>
    );
  };

  // ─── Root render ─────────────────────────────────────────────────────────
  const hasPaymentHeader = [
    "MANIFEST_PAYMENT",
    "RECYCLABLE_PAYMENT",
    "FLY_ASH_DISPOSAL_PAYMENT",
    "MARINE_DISCHARGE",
    "OTHER_STATE_INDUSTRY_MAPPING",
  ].includes(type);

  return (
    <ScrollView style={styles.container}>
      {/* {type === "MANIFEST_PAYMENT" &&
        data?.current_status !== "Redirection Approved By Admin" && (
          <StepperProgress step={2} />
        )} */}
      <View style={styles.card}>
        {hasPaymentHeader && (
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>
              <Text>₹ </Text> Payment Details
            </Text>
          </View>
        )}

        {type === "MANIFEST_PAYMENT" && renderTransportSelectionPayment()}
        {type === "VEHICLE_REGISTRATION" && renderVehiclePayment()}
        {type === "TRANSPORT_REGISTRATION" && renderTransporterPayment()}
        {type === "EFFLUENT_PIPELINE_PAYMENT" && renderEffluentPayment()}
        {type === "RECYCLABLE_PAYMENT" && renderRecyclablePayment()}
        {type === "FLY_ASH_DISPOSAL_PAYMENT" && renderFlyashPayment()}
        {type === "MARINE_DISCHARGE" && renderMarinePayment()}
        {type === "OTHER_STATE_INDUSTRY_MAPPING" &&
          renderOtherStateIndustryMappingPayment()}
      </View>
    </ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: '#fff',
    margin: 10,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cardHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cardBody: {
    padding: 15,
  },
  panel: {
    marginBottom: 15,
  },
  panelHeading: {
    backgroundColor: '#007bff',
    padding: 10,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  panelHeadingText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  panelBody: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderTopWidth: 0,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  tableContainer: {
    marginVertical: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderTopWidth: 0,
    paddingVertical: 5,
  },
  tableCell: {
    paddingHorizontal: 5,
    paddingVertical: 3,
    fontSize: 12,
  },
  headerCell: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  textAlignRight: {
    textAlign: 'right',
  },
  textCenter: {
    textAlign: 'center',
  },
  transactionId: {
    fontSize: 10,
    color: '#666',
  },
  vehicleDate: {
    fontSize: 10,
    color: '#6c757d',
  },
  bold: {
    fontWeight: 'bold',
  },
  totalRow: {
    backgroundColor: '#f8f9fa',
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rowLabel: {
    flex: 1,
    fontSize: 14,
  },
  rowValue: {
    fontSize: 14,
    minWidth: 80,
  },
  tdsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#007bff',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007bff',
  },
  tdsText: {
    fontSize: 14,
  },
  tdsNote: {
    color: '#dc3545',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  serviceRefContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: '#f8f9fa',
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
    minWidth: 300,
    marginVertical: 10,
  },
  serviceRefTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#007bff',
  },
  serviceRefText: {
    fontSize: 13,
  },
  gatewayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 8,
    borderRadius: 4,
  },
  gatewayOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  gatewayOptionSelected: {
    backgroundColor: '#e3f2fd',
    borderRadius: 4,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007bff',
  },
  gatewayLabel: {
    fontSize: 14,
  },
  payButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 10,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  payNowButton: {
    backgroundColor: '#28a745',
  },
  payLaterButton: {
    backgroundColor: '#007bff',
  },
  confirmButton: {
    backgroundColor: '#28a745',
  },
  acceptButton: {
    backgroundColor: '#28a745',
  },
  rejectButton: {
    backgroundColor: '#dc3545',
  },
  submitButton: {
    backgroundColor: '#17a2b8',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 4,
  },
  flexRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    gap: 20,
    marginVertical: 10,
  },
  paymentActions: {
    alignItems: 'flex-end',
    gap: 12,
  },
  recyclableActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    gap: 20,
    marginVertical: 10,
  },
  recyclableButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
  },
  vehiclePaymentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 80,
    marginVertical: 10,
  },
  transporterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  flyashActions: {
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  noteContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    backgroundColor: '#f8f9fa',
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  noteText: {
    fontSize: 13,
  },
  noteTitle: {
    fontWeight: 'bold',
    color: '#007bff',
    marginTop: 4,
  },
  termsLink: {
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  termsText: {
    fontSize: 15,
    color: '#007bff',
    textAlign: 'right',
  },
  transporterInfo: {
    marginBottom: 0,
    fontSize: 13,
    color: '#007bff',
  },
  loader: {
    marginVertical: 20,
  },
});

export default RegistrationPayment;