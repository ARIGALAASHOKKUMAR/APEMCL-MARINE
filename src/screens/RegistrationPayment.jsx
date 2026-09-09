import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialIcons";
import {
  commonAPICall,
  CONTEXT_HEADING,
  PAYMENTAPEMCL,
  RECYCLABLE,
  RECYCLABLEVEHICLID,
} from "../utils/utils";
import { showModal } from "../actions";
import { TermsAndConditions, wasteTypes } from "../utils/CommonFunctions";

const { width, height } = Dimensions.get("window");

// ─── Constants ───────────────────────────────────────────────────────────────
const VEHICLE_FEE = 500;
const TRANSPORTER_REGISTRATION_FEE = 1000;
const GST_RATE = 0.09;
const TDS_RATE = 0.02;

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── Main Component ───────────────────────────────────────────────────────────

function RegistrationPayment({ type: propType }) {
  const navigation = useNavigation();
  const route = useRoute();

  const routeData = route?.params?.data;
  const routeVehicleList = route?.params?.vehicleList || [];
  const routeType = route?.params?.type || propType || "MANIFEST_PAYMENT";

  const data = routeData;
  const vehicleList = routeVehicleList;
  const type = routeType;

  const { officerName, mobile, userId } = useSelector((s) => s.LoginReducer);
  const dispatch = useDispatch();
  const [transporterModuleReferenceId, setTransporterModuleReferenceId] =
    useState("");
  const [flag, setFlag] = useState(false);
  const [recyclable, setRecyclable] = useState(false);
  const [confirmPayment, setConfirmPayment] = useState(false);
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

  let parsedwasteDetails = [];
  try {
    parsedwasteDetails = data?.waste_details
      ? JSON.parse(data.waste_details)
      : [];
  } catch {
    parsedwasteDetails = [];
  }

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

  const effluentQuantity = Number(data?.total_volume || 0);
  const effluentBaseRate = 15;
  const effluentCessRate = 0.75;
  const effluentTotalRate = effluentBaseRate + effluentCessRate;
  const effluentSubtotal = effluentTotalRate * effluentQuantity;
  const effluentGstResult = applyGst(effluentSubtotal);
  const effluentTotalWithGst = effluentGstResult.totalAmount;
  const effluentTdsAmount = applyTds ? effluentSubtotal * TDS_RATE : 0;

  const marineQuantity = Number(data?.totaldischargevolume || 0);
  const marineBaseRate = 10;
  const marineTotalRate = marineBaseRate + effluentCessRate;
  const marineSubtotal = marineTotalRate * marineQuantity;
  const marineGstResult = applyGst(marineSubtotal);
  const marineTotalWithGst = marineGstResult.totalAmount;
  const marineTdsAmount = applyTds ? marineSubtotal * TDS_RATE : 0;

  useEffect(() => {
    if (type === "RECYCLABLE_PAYMENT" || type === "MANIFEST_PAYMENT") {
      commonAPICall(RECYCLABLEVEHICLID, {}, "get", dispatch).then((res) => {
        if (res.status === 200)
          setVehicle(res?.data?.Transport_Vehicle_Selection_Details || []);
      });
    }
  }, [type, dispatch]);

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
      return [{ moduleReferenceId: data?.detail_id || data?.detail_id }];
    }
    return [];
  };

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

    let baseSubtotal,
      baseSgst,
      baseCgst,
      baseTotalWithGst,
      baseTdsAmount,
      baseTotalAfterTds;

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

  const handlePayLater = async (payType) => {
    try {
      setLoading(true);
      const payload = buildPayload(payType, "RAZORPAY", true);
      const res = await commonAPICall(PAYMENTAPEMCL, payload, "post", dispatch);
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
    } catch (err) {
      console.error("Payment Error:", err);
      Alert.alert("Error", "Payment later failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRecyclableAction = async (
    transportvehicleselectionid,
    action,
  ) => {
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
              dispatch,
            );
            if (res.status === 200) {
              action === "ACCEPTED" ? setRecyclable(true) : navigation.goBack();
            }
          },
        },
      ],
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
      dispatch,
    );
    if (res.status === 200) navigation.navigate("ManifestList");
  };

  const ShowTerms = () => {
    dispatch(showModal(<TermsAndConditions />));
  };

  // ─── Mobile-Friendly Render Functions ────────────────────────────────────

  // Render Waste Item Card
  const WasteItemCard = ({ item, index, a, b, c, subTotalPerTon }) => (
    <View style={styles.wasteCard}>
      <View style={styles.wasteCardHeader}>
        <Text style={styles.wasteCardNumber}>#{index + 1}</Text>
        <Text style={styles.wasteCardTitle} numberOfLines={2}>
          {item?.wasteType?.split("-")[0] || data?.waste_type_name || "Waste"}
        </Text>
      </View>
      <View style={styles.wasteCardBody}>
        <View style={styles.wasteCardRow}>
          <Text style={styles.wasteCardLabel}>Transaction:</Text>
          <Text style={styles.wasteCardValue} numberOfLines={1}>
            {item?.generatorApprovalTransactionNumber || "-"}
          </Text>
        </View>
        <View style={styles.wasteCardRow}>
          <Text style={styles.wasteCardLabel}>Quantity:</Text>
          <Text style={styles.wasteCardValue}>
            {Number(item?.disposal_quantity || item?.disposalQuantity || 0)}{" "}
            {item?.unit || (item?.unitId === 1 ? "KL" : "Tonnes")}
          </Text>
        </View>
        <View style={styles.wasteCardRow}>
          <Text style={styles.wasteCardLabel}>Rate Breakdown:</Text>
          <View style={styles.rateBreakdown}>
            <Text style={styles.rateText}>A: ₹{a?.toFixed(2)}</Text>
            <Text style={styles.rateText}>B: ₹{b?.toFixed(2)}</Text>
            <Text style={styles.rateText}>C: ₹{c?.toFixed(2)}</Text>
          </View>
        </View>
        <View style={[styles.wasteCardRow, styles.totalRow]}>
          <Text style={styles.wasteCardLabel}>Sub Total:</Text>
          <Text style={styles.wasteCardValueBold}>
            ₹{subTotalPerTon?.toFixed(2)}
          </Text>
        </View>
        <View style={[styles.wasteCardRow, styles.grandTotalRow]}>
          <Text style={styles.wasteCardLabel}>Total:</Text>
          <Text style={styles.wasteCardValueGrand}>
            ₹
            {(
              Number(item?.disposal_quantity || item?.disposalQuantity || 0) *
              subTotalPerTon
            )?.toFixed(2)}
          </Text>
        </View>
      </View>
    </View>
  );

  // Render GST Section
  const GstSection = ({
    subtotal,
    tdsAmount,
    netAmount,
    sgst,
    cgst,
    totalWithGst,
    applyTds,
    onTdsChange,
  }) => (
    <View style={styles.gstSection}>
      <TouchableOpacity
        style={styles.tdsCheckboxContainer}
        onPress={() => onTdsChange(!applyTds)}
        activeOpacity={0.7}
      >
        <View style={[styles.checkbox, applyTds && styles.checkboxChecked]}>
          {applyTds && <Icon name="check" size={14} color="#fff" />}
        </View>
        <Text style={styles.tdsText}>TDS Deduction {TDS_RATE * 100}%</Text>
      </TouchableOpacity>

      <View style={styles.gstRow}>
        <Text style={styles.gstLabel}>
          Net Amount{" "}
          {applyTds && <Text style={styles.tdsNote}>(After TDS)</Text>}
        </Text>
        <Text style={styles.gstValue}>
          ₹
          {applyTds ? (netAmount - tdsAmount).toFixed(2) : netAmount.toFixed(2)}
        </Text>
      </View>

      <View style={styles.gstRow}>
        <Text style={styles.gstLabel}>SGST (9%)</Text>
        <Text style={styles.gstValue}>₹{sgst.toFixed(2)}</Text>
      </View>

      <View style={styles.gstRow}>
        <Text style={styles.gstLabel}>CGST (9%)</Text>
        <Text style={styles.gstValue}>₹{cgst.toFixed(2)}</Text>
      </View>

      <View style={[styles.gstRow, styles.totalGstRow]}>
        <Text style={styles.totalGstLabel}>TOTAL AMOUNT</Text>
        <Text style={styles.totalGstValue}>
          ₹
          {applyTds
            ? (netAmount - tdsAmount + sgst + cgst).toFixed(2)
            : totalWithGst.toFixed(2)}
        </Text>
      </View>
    </View>
  );

  const ServiceChargeCard = ({
    a,
    b,
    c,
    kms,
    label = "Service Charge Reference",
  }) => (
    <View style={styles.serviceCard}>
      <Text style={styles.serviceCardTitle}>{label}</Text>
      <View style={styles.serviceCardItem}>
        <Text style={styles.serviceCardLabel}>(A) Service Charges</Text>
        <Text style={styles.serviceCardValue}>
          ₹{typeof a === "number" ? a.toFixed(2) : a}
        </Text>
      </View>
      <View style={styles.serviceCardItem}>
        <Text style={styles.serviceCardLabel}>
          (B) Waste Monitoring & Tracking{kms ? ` ${kms} KM` : ""}
        </Text>
        <Text style={styles.serviceCardValue}>
          ₹{typeof b === "number" ? b.toFixed(2) : b}
        </Text>
      </View>
      <View style={styles.serviceCardItem}>
        <Text style={styles.serviceCardLabel}>(C) 5% Margin on (A + B)</Text>
        <Text style={styles.serviceCardValue}>
          ₹{typeof c === "number" ? c.toFixed(2) : c}
        </Text>
      </View>
    </View>
  );

  const PayLaterButton = ({ onPress, label = "PAY LATER" }) => (
    <TouchableOpacity
      style={styles.payLaterButton}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={styles.payLaterButtonText}>{label}</Text>
    </TouchableOpacity>
  );

  // ─── Render: Manifest Payment ────────────────────────────────────────────
  const renderTransportSelectionPayment = () => {
    const { a, b, c, subTotalPerTon } = wasteDetails;
    const wastes = data?.wastes?.length ? data.wastes : parsedwasteDetails;
    const gstResult = applyGst(subtotal);
    const totalWithGst = gstResult.totalAmount;
    const tdsAmount = applyTds ? subtotal * TDS_RATE : 0;

    return (
      <View style={styles.cardBody}>
        <View style={styles.panel}>
          <View style={styles.panelHeading}>
            <Text style={styles.panelHeadingText}>{CONTEXT_HEADING}</Text>
          </View>
          <View style={styles.panelBody}>
            {wastes.map((waste, i) => (
              <WasteItemCard
                key={i}
                item={waste}
                index={i}
                a={a}
                b={b}
                c={c}
                subTotalPerTon={subTotalPerTon}
              />
            ))}

            <GstSection
              subtotal={subtotal}
              tdsAmount={tdsAmount}
              netAmount={gstResult.netAmount}
              sgst={gstResult.sgst}
              cgst={gstResult.cgst}
              totalWithGst={totalWithGst}
              applyTds={applyTds}
              onTdsChange={setApplyTds}
            />

            {a === 5 ? (
              <View style={styles.submitContainer}>
                <View style={styles.noteContainer}>
                  <Icon name="info-outline" size={20} color="#2e7d32" />
                  <View style={styles.noteTextContainer}>
                    <Text style={styles.noteText}>
                      Note: Shall be Paid by Receiver
                    </Text>
                    <Text style={styles.noteTitle}>
                      Proceed for Receiver Payment Confirmation
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={() => submitRecyclableDetails(vehicle)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.submitButtonText}>SUBMIT</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.paymentActionsContainer}>
                <ServiceChargeCard a={a} b={b} c={c} kms={data?.totalKms} />
                <View style={styles.paymentActions}>
                  <PayLaterButton
                    onPress={() => handlePayLater("MANIFEST_PAYMENT")}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
        {loading && (
          <ActivityIndicator
            size="large"
            color="#2e7d32"
            style={styles.loader}
          />
        )}
      </View>
    );
  };

  // ─── Render: Effluent Payment (Simplified - Only Inner Cards) ──────────
  const renderEffluentPayment = () => {
    const totalWithGst = effluentTotalWithGst;
    const tdsAmount = effluentTdsAmount;
    const gstResult = applyGst(effluentSubtotal);

    return (
      <View>
        <View style={styles.panelBody}>
          {/* Effluent Details - Only the detail card, no extra wrapper */}
          <View style={styles.detailCard}>
            <View style={styles.detailCardHeader}>
              <Text style={styles.detailCardTitle}>
                {data?.effluent_type || "Effluent"}
              </Text>
              <View style={styles.detailBadge}>
                <Text style={styles.detailBadgeText}>KL</Text>
              </View>
            </View>
            <View style={styles.detailCardBody}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Quantity</Text>
                <Text style={styles.detailValue}>
                  {effluentQuantity.toFixed(2)} KL
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Rate</Text>
                <Text style={styles.detailValue}>
                  ₹{effluentTotalRate.toFixed(2)}/KL
                </Text>
              </View>
              <View style={[styles.detailRow, styles.detailTotalRow]}>
                <Text style={styles.detailLabel}>Sub Total</Text>
                <Text style={styles.detailValueBold}>
                  ₹{effluentSubtotal.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>

          <GstSection
            subtotal={effluentSubtotal}
            tdsAmount={tdsAmount}
            netAmount={gstResult.netAmount}
            sgst={gstResult.sgst}
            cgst={gstResult.cgst}
            totalWithGst={totalWithGst}
            applyTds={applyTds}
            onTdsChange={setApplyTds}
          />

          <View style={styles.paymentActionsContainer}>
            <ServiceChargeCard
              a="15.00"
              b="0.00"
              c="0.75"
              label="Service Charge Reference"
            />
            <View style={styles.paymentActions}>
              <PayLaterButton
                onPress={() => handlePayLater("EFFLUENT_PIPELINE_PAYMENT")}
              />
            </View>
          </View>
        </View>
        {loading && (
          <ActivityIndicator
            size="large"
            color="#2e7d32"
            style={styles.loader}
          />
        )}
      </View>
    );
  };

  // ─── Render: Marine Payment (Simplified - Only Inner Cards) ──────────────
  const renderMarinePayment = () => {
    const totalWithGst = marineTotalWithGst;
    const tdsAmount = marineTdsAmount;
    const gstResult = applyGst(marineSubtotal);

    return (
      <View style={styles.cardBody}>
        <View style={styles.panel}>
          <View style={styles.panelHeading}>
            <Text style={styles.panelHeadingText}>{CONTEXT_HEADING}</Text>
          </View>
          <View style={styles.panelBody}>
            {/* Marine Details - Only the detail card, no extra wrapper */}
            <View style={styles.detailCard}>
              <View style={styles.detailCardHeader}>
                <Text style={styles.detailCardTitle}>Marine Discharge</Text>
                <View style={styles.detailBadge}>
                  <Text style={styles.detailBadgeText}>KL</Text>
                </View>
              </View>
              <View style={styles.detailCardBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Quantity</Text>
                  <Text style={styles.detailValue}>
                    {marineQuantity.toFixed(2)} KL
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Rate</Text>
                  <Text style={styles.detailValue}>
                    ₹{marineTotalRate.toFixed(2)}/KL
                  </Text>
                </View>
                <View style={[styles.detailRow, styles.detailTotalRow]}>
                  <Text style={styles.detailLabel}>Sub Total</Text>
                  <Text style={styles.detailValueBold}>
                    ₹{marineSubtotal.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>

            <GstSection
              subtotal={marineSubtotal}
              tdsAmount={tdsAmount}
              netAmount={gstResult.netAmount}
              sgst={gstResult.sgst}
              cgst={gstResult.cgst}
              totalWithGst={totalWithGst}
              applyTds={applyTds}
              onTdsChange={setApplyTds}
            />

            <View style={styles.paymentActionsContainer}>
              <ServiceChargeCard
                a="10.00"
                b="0.00"
                c="0.75"
                label="Service Charge Reference"
              />
              <View style={styles.paymentActions}>
                <PayLaterButton
                  onPress={() => handlePayLater("MARINE_DISCHARGE")}
                />
              </View>
            </View>
          </View>
        </View>
        {loading && (
          <ActivityIndicator
            size="large"
            color="#2e7d32"
            style={styles.loader}
          />
        )}
      </View>
    );
  };

  // ─── Render: Recyclable Payment ──────────────────────────────────────────
  const renderRecyclablePayment = () => {
    const { a, b, c, subTotalPerTon } = wasteDetails;
    const gstResult = applyGst(subtotal);
    const totalWithGst = gstResult.totalAmount;
    const tdsAmount = applyTds ? subtotal * TDS_RATE : 0;

    return (
      <View style={styles.cardBody}>
        <View style={styles.panel}>
          <View style={styles.panelHeading}>
            <Text style={styles.panelHeadingText}>{CONTEXT_HEADING}</Text>
          </View>
          <View style={styles.panelBody}>
            {data?.wastes?.map((waste, i) => (
              <WasteItemCard
                key={i}
                item={waste}
                index={i}
                a={a}
                b={b}
                c={c}
                subTotalPerTon={subTotalPerTon}
              />
            ))}

            <GstSection
              subtotal={subtotal}
              tdsAmount={tdsAmount}
              netAmount={gstResult.netAmount}
              sgst={gstResult.sgst}
              cgst={gstResult.cgst}
              totalWithGst={totalWithGst}
              applyTds={applyTds}
              onTdsChange={setApplyTds}
            />

            <View style={styles.recyclableActionsContainer}>
              <ServiceChargeCard
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
                    activeOpacity={0.8}
                  >
                    <Icon name="close" size={18} color="#fff" />
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
                    activeOpacity={0.8}
                  >
                    <Icon name="check" size={18} color="#fff" />
                    <Text style={styles.buttonText}>Accept for Payment</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.paymentActions}>
                  <PayLaterButton
                    onPress={() => handlePayLater("RECYCLABLE_PAYMENT")}
                  />
                </View>
              )}
            </View>
          </View>
        </View>
        {loading && (
          <ActivityIndicator
            size="large"
            color="#2e7d32"
            style={styles.loader}
          />
        )}
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
    } = getFlyAshAmounts();

    return (
      <View style={styles.cardBody}>
        <View style={styles.panel}>
          <View style={styles.panelHeading}>
            <Text style={styles.panelHeadingText}>{CONTEXT_HEADING}</Text>
          </View>
          <View style={styles.panelBody}>
            {/* Fly Ash Details - Using unified detail card */}
            <View style={styles.detailCard}>
              <View style={styles.detailCardHeader}>
                <Text style={styles.detailCardTitle}>Fly Ash Payment</Text>
                <View style={styles.detailBadge}>
                  <Text style={styles.detailBadgeText}>Tonnes</Text>
                </View>
              </View>
              <View style={styles.detailCardBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total Quantity</Text>
                  <Text style={styles.detailValue}>
                    {vehicleList
                      ?.reduce(
                        (total, waste) => total + Number(waste?.quantity || 0),
                        0,
                      )
                      .toFixed(2)}{" "}
                    T
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Service Charge</Text>
                  <Text style={styles.detailValue}>₹5 / T</Text>
                </View>
                <View style={[styles.detailRow, styles.detailTotalRow]}>
                  <Text style={styles.detailLabel}>Sub Total</Text>
                  <Text style={styles.detailValueBold}>
                    ₹{flyAshSubtotal?.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>

            <GstSection
              subtotal={flyAshSubtotal}
              tdsAmount={flyAshTdsAmount}
              netAmount={flyAshSubtotal}
              sgst={flyAshSgst}
              cgst={flyAshCgst}
              totalWithGst={flyAshTotalWithGst}
              applyTds={applyTds}
              onTdsChange={setApplyTds}
            />

            <View style={styles.flyashActions}>
              {!confirmPayment ? (
                <TouchableOpacity
                  style={[styles.button, styles.confirmButton]}
                  onPress={() => setConfirmPayment(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonText}>Confirm & Proceed</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.paymentActions}>
                  <PayLaterButton
                    onPress={() => handlePayLater("FLY_ASH_DISPOSAL_PAYMENT")}
                  />
                </View>
              )}
            </View>
          </View>
        </View>
        <TouchableOpacity
          onPress={ShowTerms}
          style={styles.termsLink}
          activeOpacity={0.7}
        >
          <Text style={styles.termsText}>
            * Terms & Conditions for your reference
          </Text>
        </TouchableOpacity>
        {loading && (
          <ActivityIndicator
            size="large"
            color="#2e7d32"
            style={styles.loader}
          />
        )}
      </View>
    );
  };

  // ─── Render: Vehicle Registration ────────────────────────────────────────
  const renderVehiclePayment = () => {
    const gstResult = applyGst(subtotal);
    const totalWithGst = gstResult.totalAmount;
    const tdsAmount = applyTds ? subtotal * TDS_RATE : 0;

    return (
      <View style={styles.cardBody}>
        <View style={styles.panel}>
          <View style={styles.panelHeading}>
            <Text style={styles.panelHeadingText}>
              Vehicle Registration Payment
            </Text>
          </View>
          <View style={styles.panelBody}>
            <Text style={styles.vehicleInfoText}>
              Make your vehicle payment for your full access
            </Text>

            {vehicleList?.map((vv, i) => (
              <View key={i} style={styles.vehicleCard}>
                <View style={styles.vehicleCardHeader}>
                  <Text style={styles.vehicleCardNumber}>#{i + 1}</Text>
                  <Text style={styles.vehicleCardTitle}>{vv.vehicle_no}</Text>
                </View>
                <View style={styles.vehicleCardBody}>
                  <View style={styles.vehicleCardRow}>
                    <Text style={styles.vehicleCardLabel}>Type:</Text>
                    <Text style={styles.vehicleCardValue}>
                      {vv.vehicle_type_name}
                    </Text>
                  </View>
                  <View style={styles.vehicleCardRow}>
                    <Text style={styles.vehicleCardLabel}>Validity:</Text>
                    <Text style={styles.vehicleCardValue}>
                      {new Date().toLocaleDateString("en-GB")} –{" "}
                      {new Date(
                        new Date().setFullYear(new Date().getFullYear() + 1),
                      ).toLocaleDateString("en-GB")}
                    </Text>
                  </View>
                  <View style={[styles.vehicleCardRow, styles.vehicleTotalRow]}>
                    <Text style={styles.vehicleCardLabel}>Price:</Text>
                    <Text style={styles.vehicleCardValueBold}>
                      ₹{VEHICLE_FEE}
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            <GstSection
              subtotal={subtotal}
              tdsAmount={tdsAmount}
              netAmount={gstResult.netAmount}
              sgst={gstResult.sgst}
              cgst={gstResult.cgst}
              totalWithGst={totalWithGst}
              applyTds={applyTds}
              onTdsChange={setApplyTds}
            />

            <View style={styles.vehiclePaymentActions}>
              <PayLaterButton
                onPress={() => handlePayLater("VEHICLE_REGISTRATION")}
              />
            </View>
          </View>
        </View>
        {loading && (
          <ActivityIndicator
            size="large"
            color="#2e7d32"
            style={styles.loader}
          />
        )}
      </View>
    );
  };

  // ─── Render: Transporter Registration ────────────────────────────────────
  const renderTransporterPayment = () => {
    const gstResult = applyGst(subtotal);
    const totalWithGst = gstResult.totalAmount;
    const tdsAmount = applyTds ? subtotal * TDS_RATE : 0;

    return (
      <View style={styles.cardBody}>
        <View style={styles.panel}>
          <View style={styles.panelHeading}>
            <Text style={styles.panelHeadingText}>
              Registration Payment Fee
            </Text>
          </View>
          <View style={styles.panelBody}>
            <View style={styles.infoCard}>
              <Icon name="info-outline" size={24} color="#2e7d32" />
              <Text style={styles.transporterInfoText}>
                It's the Registration/Annual payment for every Transporter who
                registered with us. Once this payment has been done, you will
                have the access to add the vehicle details.
              </Text>
            </View>

            <View style={styles.transporterCard}>
              <View style={styles.transporterCardHeader}>
                <Text style={styles.transporterCardTitle}>
                  Registration Fee
                </Text>
              </View>
              <View style={styles.transporterCardBody}>
                <View
                  style={[
                    styles.transporterCardRow,
                    styles.transporterTotalRow,
                  ]}
                >
                  <Text style={styles.transporterCardLabel}>Amount:</Text>
                  <Text style={styles.transporterCardValueBold}>
                    ₹{subtotal?.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>

            <GstSection
              subtotal={subtotal}
              tdsAmount={tdsAmount}
              netAmount={gstResult.netAmount}
              sgst={gstResult.sgst}
              cgst={gstResult.cgst}
              totalWithGst={totalWithGst}
              applyTds={applyTds}
              onTdsChange={setApplyTds}
            />

            <View style={styles.transporterActions}>
              {!flag ? (
                <TouchableOpacity
                  style={[styles.button, styles.confirmButton]}
                  onPress={() => setFlag(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonText}>CONFIRM & PROCEED</Text>
                </TouchableOpacity>
              ) : (
                <PayLaterButton
                  onPress={() => handlePayLater("TRANSPORT_REGISTRATION")}
                />
              )}
            </View>
          </View>
        </View>
        {loading && (
          <ActivityIndicator
            size="large"
            color="#2e7d32"
            style={styles.loader}
          />
        )}
      </View>
    );
  };

  // ─── Render: Other State Industry Mapping ──────────────────────────────
  const renderOtherStateIndustryMappingPayment = () => {
    const subtotalAmount = data?.annual_fee || 0;
    const gstResult = applyGst(subtotalAmount);
    const totalWithGst = gstResult.totalAmount;
    const tdsAmount = applyTds ? subtotalAmount * TDS_RATE : 0;

    return (
      <View style={styles.cardBody}>
        <View style={styles.panel}>
          <View style={styles.panelHeading}>
            <Text style={styles.panelHeadingText}>
              Other State Industry Mapping Payment
            </Text>
          </View>
          <View style={styles.panelBody}>
            <View style={styles.industryCard}>
              <View style={styles.industryCardHeader}>
                <Text style={styles.industryCardTitle}>
                  {data?.industry_name || "Industry"}
                </Text>
                <View style={styles.industryStatusBadge}>
                  <Text style={styles.industryStatusText}>Pending</Text>
                </View>
              </View>
              <View style={styles.industryCardBody}>
                <View style={[styles.industryCardRow, styles.industryTotalRow]}>
                  <Text style={styles.industryCardLabel}>Annual Fee:</Text>
                  <Text style={styles.industryCardValueBold}>
                    ₹{data.annual_fee?.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>

            <GstSection
              subtotal={subtotalAmount}
              tdsAmount={tdsAmount}
              netAmount={gstResult.netAmount}
              sgst={gstResult.sgst}
              cgst={gstResult.cgst}
              totalWithGst={totalWithGst}
              applyTds={applyTds}
              onTdsChange={setApplyTds}
            />

            <View style={styles.transporterActions}>
              {!flag ? (
                <TouchableOpacity
                  style={[styles.button, styles.confirmButton]}
                  onPress={() => setFlag(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.buttonText}>CONFIRM & PROCEED</Text>
                </TouchableOpacity>
              ) : (
                <PayLaterButton
                  onPress={() => handlePayLater("OTHER_STATE_INDUSTRY_MAPPING")}
                />
              )}
            </View>
          </View>
        </View>
        {loading && (
          <ActivityIndicator
            size="large"
            color="#2e7d32"
            style={styles.loader}
          />
        )}
      </View>
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#2e7d32" barStyle="light-content" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {hasPaymentHeader && (
            <View style={styles.cardHeader}>
              <Icon name="payment" size={24} color="#2e7d32" />
              <Text style={styles.cardTitle}>Payment Details</Text>
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
    </SafeAreaView>
  );
}

// ─── Mobile-Friendly Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  card: {
    backgroundColor: "#fff",
    margin: 12,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
    marginBottom: 20,
  },
  cardHeader: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2e7d32",
    marginLeft: 8,
  },
  cardBody: {
    padding: 12,
  },
  panel: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e8ecf1",
    borderRadius: 8,
    overflow: "hidden",
  },
  panelHeading: {
    backgroundColor: "#2e7d32",
    padding: 14,
  },
  panelHeadingText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  panelBody: {
    padding: 12,
  },

  // Waste Item Card
  wasteCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e8ecf1",
    marginBottom: 12,
    overflow: "hidden",
  },
  wasteCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
  },
  wasteCardNumber: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#2e7d32",
    marginRight: 10,
  },
  wasteCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  wasteCardBody: {
    padding: 12,
  },
  wasteCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  wasteCardLabel: {
    fontSize: 12,
    color: "#666",
  },
  wasteCardValue: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
  wasteCardValueBold: {
    fontSize: 14,
    color: "#333",
    fontWeight: "bold",
  },
  wasteCardValueGrand: {
    fontSize: 16,
    color: "#2e7d32",
    fontWeight: "bold",
  },
  rateBreakdown: {
    flexDirection: "row",
    gap: 8,
  },
  rateText: {
    fontSize: 11,
    color: "#555",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    marginTop: 4,
    paddingTop: 8,
  },
  grandTotalRow: {
    borderTopWidth: 2,
    borderTopColor: "#2e7d32",
    marginTop: 4,
    paddingTop: 8,
  },

  // GST Section
  gstSection: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 14,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#e8ecf1",
  },
  gstRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  totalGstRow: {
    borderBottomWidth: 0,
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 2,
    borderTopColor: "#2e7d32",
  },
  gstLabel: {
    fontSize: 13,
    color: "#333",
  },
  gstValue: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
  },
  totalGstLabel: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#1e3a5f",
  },
  totalGstValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2e7d32",
  },
  tdsCheckboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    marginBottom: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: "#2e7d32",
    borderRadius: 4,
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: "#2e7d32",
  },
  tdsText: {
    fontSize: 13,
    color: "#333",
  },
  tdsNote: {
    color: "#dc3545",
    fontSize: 11,
  },

  // Detail Card (Unified for Effluent, Marine, Fly Ash)
  detailCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e8ecf1",
    marginBottom: 12,
    overflow: "hidden",
  },
  detailCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
  },
  detailCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  detailBadge: {
    backgroundColor: "#2e7d32",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  detailBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  detailCardBody: {
    padding: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  detailLabel: {
    fontSize: 13,
    color: "#666",
  },
  detailValue: {
    fontSize: 13,
    color: "#333",
  },
  detailValueBold: {
    fontSize: 15,
    color: "#333",
    fontWeight: "bold",
  },
  detailTotalRow: {
    borderBottomWidth: 0,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    marginTop: 4,
    paddingTop: 8,
  },

  // Service Card
  serviceCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e8ecf1",
    borderLeftWidth: 4,
    borderLeftColor: "#2e7d32",
    marginVertical: 8,
  },
  serviceCardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2e7d32",
    marginBottom: 8,
  },
  serviceCardItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 3,
  },
  serviceCardLabel: {
    fontSize: 12,
    color: "#555",
  },
  serviceCardValue: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },

  // Payment Actions
  paymentActionsContainer: {
    marginTop: 12,
  },
  paymentActions: {
    alignItems: "flex-end",
    marginTop: 8,
  },
  payLaterButton: {
    backgroundColor: "#1976d2",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
    minWidth: 140,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  payLaterButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },

  // Buttons
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    minWidth: 120,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
  confirmButton: {
    backgroundColor: "#2e7d32",
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  acceptButton: {
    backgroundColor: "#2e7d32",
  },
  rejectButton: {
    backgroundColor: "#dc3545",
  },
  submitButton: {
    backgroundColor: "#2e7d32",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
    alignSelf: "flex-end",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },

  // Submit Container
  submitContainer: {
    marginTop: 12,
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e8ecf1",
    borderLeftWidth: 4,
    borderLeftColor: "#2e7d32",
    marginBottom: 12,
  },
  noteTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  noteText: {
    fontSize: 12,
    color: "#333",
  },
  noteTitle: {
    fontWeight: "bold",
    color: "#2e7d32",
    marginTop: 2,
    fontSize: 13,
  },

  // Recyclable Actions
  recyclableActionsContainer: {
    marginTop: 8,
  },
  recyclableButtons: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    marginTop: 12,
  },

  // Vehicle Cards
  vehicleCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e8ecf1",
    marginBottom: 10,
    overflow: "hidden",
  },
  vehicleCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
  },
  vehicleCardNumber: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#2e7d32",
    marginRight: 10,
  },
  vehicleCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  vehicleCardBody: {
    padding: 12,
  },
  vehicleCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  vehicleCardLabel: {
    fontSize: 12,
    color: "#666",
  },
  vehicleCardValue: {
    fontSize: 12,
    color: "#333",
  },
  vehicleCardValueBold: {
    fontSize: 14,
    color: "#333",
    fontWeight: "bold",
  },
  vehicleTotalRow: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    marginTop: 4,
    paddingTop: 8,
  },
  vehicleInfoText: {
    fontSize: 14,
    color: "#2e7d32",
    marginBottom: 12,
    fontWeight: "500",
  },
  vehiclePaymentActions: {
    alignItems: "flex-end",
    marginTop: 12,
  },

  // Transporter
  transporterCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e8ecf1",
    marginBottom: 10,
    overflow: "hidden",
  },
  transporterCardHeader: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
  },
  transporterCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  transporterCardBody: {
    padding: 12,
  },
  transporterCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  transporterCardLabel: {
    fontSize: 12,
    color: "#666",
  },
  transporterCardValueBold: {
    fontSize: 14,
    color: "#333",
    fontWeight: "bold",
  },
  transporterTotalRow: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    marginTop: 4,
    paddingTop: 8,
  },
  transporterInfoText: {
    fontSize: 13,
    color: "#2e7d32",
    lineHeight: 20,
    flex: 1,
    marginLeft: 10,
  },
  transporterActions: {
    marginTop: 12,
    alignItems: "center",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#e8f5e9",
    borderRadius: 8,
    marginBottom: 12,
  },

  // Fly Ash Actions
  flyashActions: {
    alignItems: "flex-end",
    marginTop: 12,
  },

  // Industry Card
  industryCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e8ecf1",
    marginBottom: 10,
    overflow: "hidden",
  },
  industryCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e8ecf1",
  },
  industryCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  industryStatusBadge: {
    backgroundColor: "#ffc107",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  industryStatusText: {
    color: "#333",
    fontSize: 10,
    fontWeight: "bold",
  },
  industryCardBody: {
    padding: 12,
  },
  industryCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  industryCardLabel: {
    fontSize: 12,
    color: "#666",
  },
  industryCardValueBold: {
    fontSize: 14,
    color: "#333",
    fontWeight: "bold",
  },
  industryTotalRow: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    marginTop: 4,
    paddingTop: 8,
  },

  termsLink: {
    marginTop: 12,
    paddingRight: 4,
  },
  termsText: {
    fontSize: 13,
    color: "#2e7d32",
    textAlign: "right",
    textDecorationLine: "underline",
  },
  loader: {
    marginVertical: 20,
    alignSelf: "center",
  },
});

export default RegistrationPayment;
