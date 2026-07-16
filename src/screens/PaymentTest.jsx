import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal,
  Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import { commonAPICall, PAYMENT_API } from "../utils/utils";
import { useDispatch } from "react-redux";

const PaymentScreen = () => {
  const [loading, setLoading] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [orderDetails, setOrderDetails] = useState(null);

  const dispatch = useDispatch();

  // Static payload
  const paymentPayload = {
    orderAmount: 1.0,
    orderRefNumber: "SBI200058",
    returnUrl:
      "https://swapi.dev.nidhi.apcfss.in/labour/api/open/payment/callback",
    payMode: "DC",
  };

  // Generate unique order number
  const generateOrderRefNumber = () => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);

    return `SBI${timestamp}${randomStr}`;
  };

  // Create Payment
  const createPayment = async (payMode) => {
    setLoading(true);

    try {
      const uniqueOrderRef = generateOrderRefNumber();

      const payload = {
        ...paymentPayload,
        orderRefNumber: uniqueOrderRef,
        payMode: payMode,
      };

      const response = await commonAPICall(
        PAYMENT_API,
        payload,
        "post",
        dispatch,
      );

      console.log("Payment API Response:", response);

      const data = response.data;

      if (data?.status === "CREATED" && data?.transactionUrl) {
        setOrderDetails(data);
        setPaymentUrl(data.transactionUrl);
        setShowWebView(true);
      } else {
        Alert.alert("Payment Error", "Failed to create payment session.");
      }
    } catch (error) {
      console.log("Payment Error:", error);

      Alert.alert("Network Error", "Unable to connect to payment server.");
    } finally {
      setLoading(false);
    }
  };

  // Navigation Handler
  const handleWebViewNavigationStateChange = (navState) => {
    console.log("Navigation URL:", navState.url);

    // Callback URL
    if (navState.url.includes("/labour/api/open/payment/callback")) {
      setShowWebView(false);

      Alert.alert("Payment Completed", "Please verify your payment status.", [
        {
          text: "OK",
          onPress: () => {
            setPaymentUrl("");
            setOrderDetails(null);
          },
        },
      ]);
    }

    // Success
    if (
      navState.url.includes("payment=success") ||
      navState.url.includes("status=success")
    ) {
      Alert.alert("Success", "Payment completed successfully!");
    }

    // Failure
    if (
      navState.url.includes("payment=failure") ||
      navState.url.includes("status=failure")
    ) {
      Alert.alert("Failed", "Payment failed. Please try again.");
    }
  };

  // Payment Buttons
  const renderPaymentOptions = () => {
    return (
      <View style={styles.optionsContainer}>
        <Text style={styles.optionsTitle}>Select Payment Method</Text>

        <TouchableOpacity
          style={[styles.optionButton, { backgroundColor: "#F44336" }]}
          onPress={() => createPayment("WALLET")}
        >
          <Text style={styles.optionText}>Make Payment</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // WebView Modal
  if (showWebView && paymentUrl) {
    return (
      <Modal
        visible={showWebView}
        animationType="slide"
        onRequestClose={() => {
          setShowWebView(false);
          setPaymentUrl("");
        }}
      >
        <View style={styles.webViewContainer}>
          {/* Header */}
          <View style={styles.webViewHeader}>
            <Text style={styles.headerTitle}>Secure Payment Gateway</Text>

            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  "Cancel Payment",
                  "Are you sure you want to cancel payment?",
                  [
                    {
                      text: "No",
                      style: "cancel",
                    },
                    {
                      text: "Yes",
                      onPress: () => {
                        setShowWebView(false);
                        setPaymentUrl("");
                      },
                    },
                  ],
                );
              }}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* WebView */}
          <WebView
            originWhitelist={["*"]}
            source={{
              uri: paymentUrl,
              headers: {
                "x-referrer": "https://swapi.dev.nidhi.apcfss.in",
                Referer: "https://swapi.dev.nidhi.apcfss.in",
                Origin: "https://swapi.dev.nidhi.apcfss.in",
                Accept: "text/html,application/xhtml+xml,application/xml",
              },
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            thirdPartyCookiesEnabled={true}
            sharedCookiesEnabled={true}
            mixedContentMode="always"
            cacheEnabled={false}
            incognito={false}
            allowsInlineMediaPlayback={true}
            startInLoadingState={true}
          />
        </View>
      </Modal>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Labour App Payment</Text>

        <Text style={styles.subtitle}>Complete your payment securely</Text>
      </View>

      {/* Payment Options */}
      {renderPaymentOptions()}

      {/* Security Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Secure Payment Information</Text>

        <Text style={styles.infoText}>✓ Powered by SBIePay Secure Gateway</Text>

        <Text style={styles.infoText}>✓ 128-bit SSL Encryption</Text>

        <Text style={styles.infoText}>
          ✓ All major Cards, UPI & NetBanking accepted
        </Text>

        <Text style={styles.infoText}>✓ PCI-DSS Compliant</Text>
      </View>

      {/* Loader */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#2196F3" />

          <Text style={styles.loadingText}>Creating payment session...</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  header: {
    backgroundColor: "#2196F3",
    padding: 20,
    alignItems: "center",
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },

  subtitle: {
    fontSize: 14,
    color: "white",
    marginTop: 5,
  },

  optionsContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
  },

  optionsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },

  optionButton: {
    padding: 16,
    borderRadius: 10,
    elevation: 2,
  },

  optionText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },

  infoCard: {
    backgroundColor: "#E3F2FD",
    margin: 20,
    padding: 15,
    borderRadius: 10,
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#1976D2",
  },

  infoText: {
    fontSize: 12,
    color: "#555",
    marginBottom: 5,
  },

  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#555",
  },

  webViewContainer: {
    flex: 1,
    backgroundColor: "white",
  },

  webViewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#2196F3",
    paddingTop: Platform.OS === "ios" ? 50 : 40,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },

  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },

  closeButtonText: {
    fontSize: 18,
    color: "white",
    fontWeight: "bold",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default PaymentScreen;
