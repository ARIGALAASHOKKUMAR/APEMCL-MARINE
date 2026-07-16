// BluetoothPrinter.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  Modal,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { BLEPrinter } = require("react-native-thermal-receipt-printer-image-qr");

const BluetoothPrinter = ({
  visible,
  onClose,
  printData,
  onPrintComplete,
  onPrintError,
  setBluetoothname,
  pendingPrintData,
  onPrintAnyway,
  autoPrint = false,
}) => {
  const [devices, setDevices] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState(null);

  useEffect(() => {
    if (visible) {
      if (autoPrint && printData) {
        autoPrintWithConnectedDevice();
      } else {
        initializePrinter();
      }
    }
  }, [visible]);

  const autoPrintWithConnectedDevice = async () => {
    try {
      const savedPrinter = await AsyncStorage.getItem("LAST_CONNECTED_PRINTER");
      if (savedPrinter) {
        setIsConnecting(true);
        await BLEPrinter.init();
        await BLEPrinter.connectPrinter(savedPrinter);
        await performPrint();
      } else {
        scanDevices();
      }
    } catch (error) {
      console.log("Auto print error:", error);
      scanDevices();
    } finally {
      setIsConnecting(false);
    }
  };

  const requestPermissions = async () => {
    try {
      if (Platform.OS !== "android") {
        return true;
      }

      if (Platform.Version >= 31) {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        return (
          granted["android.permission.BLUETOOTH_SCAN"] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted["android.permission.BLUETOOTH_CONNECT"] ===
            PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    } catch (error) {
      console.log("Permission Error:", error);
      return false;
    }
  };

  const initializePrinter = async () => {
    try {
      const permissionGranted = await requestPermissions();
      if (!permissionGranted) {
        Alert.alert("Permission Denied", "Bluetooth permission required");
        return;
      }
      scanDevices();
    } catch (error) {
      console.log("INIT ERROR:", error);
    }
  };

  const scanDevices = async () => {
    try {
      setIsScanning(true);
      setDevices([]);
      await BLEPrinter.init();
      const printerList = await BLEPrinter.getDeviceList();
      console.log("Printers:", printerList);

      if (printerList && Array.isArray(printerList)) {
        setDevices(printerList);
      } else {
        setDevices([]);
      }
    } catch (error) {
      console.log("SCAN ERROR:", error);
      Alert.alert("Error", "Unable to scan printers");
    } finally {
      setIsScanning(false);
    }
  };

  const generatePrintContent = () => {
    try {
      const printDataSource = printData || pendingPrintData;
      const ticket = printDataSource?.data?.TicketDetails?.[0] || printDataSource?.data?.TicketDetails?.[0];

      if (!ticket) {
        return "NO DATA\n\n";
      }

      const LINE_WIDTH = 32;
      const ITEM_WIDTH = 14;
      const QTY_WIDTH = 4;
      const PRICE_WIDTH = 6;
      const TOTAL_WIDTH = 8;

      const centerText = (text = "") => {
        text = String(text);
        if (text.length >= LINE_WIDTH) {
          return text + "\n";
        }
        const leftPadding = Math.floor((LINE_WIDTH - text.length) / 2);
        return " ".repeat(leftPadding) + text + "\n";
      };

      const divider = () => "=".repeat(LINE_WIDTH) + "\n";
      const thinLine = () => "-".repeat(LINE_WIDTH) + "\n";

      const leftRight = (left = "", right = "") => {
        left = String(left);
        right = String(right);
        const space = LINE_WIDTH - left.length - right.length;
        return left + " ".repeat(Math.max(1, space)) + right + "\n";
      };

      const wrapText = (text, width) => {
        const lines = [];
        let current = "";
        text.split(" ").forEach((word) => {
          if ((current + word).length < width) {
            current += word + " ";
          } else {
            lines.push(current.trim());
            current = word + " ";
          }
        });
        if (current.trim()) {
          lines.push(current.trim());
        }
        return lines;
      };

      const formatTableRow = (item, qty, price, total) => {
        let output = "";
        const wrappedItems = wrapText(String(item || ""), ITEM_WIDTH);
        wrappedItems.forEach((line, index) => {
          if (index === 0) {
            output +=
              line.padEnd(ITEM_WIDTH) +
              String(qty).padStart(QTY_WIDTH) +
              String(price).padStart(PRICE_WIDTH) +
              String(total).padStart(TOTAL_WIDTH) +
              "\n";
          } else {
            output +=
              line.padEnd(ITEM_WIDTH + QTY_WIDTH + PRICE_WIDTH + TOTAL_WIDTH) +
              "\n";
          }
        });
        return output;
      };

      let content = "";
      content += "\n";
      content += centerText("APFDCL");
      content += centerText(ticket.spotName || "ENTRY TICKET");
      content += centerText("ENTRY TICKET");
      content += divider();
      content += leftRight("Order ID", ticket.OrderId || "-");
      content += leftRight("Date", ticket.BookingDate || "-");
      content += leftRight("Time", ticket.BookingTime || "-");
      content += divider();
      content +=
        "Item".padEnd(ITEM_WIDTH) +
        "Qty".padStart(QTY_WIDTH) +
        "Price".padStart(PRICE_WIDTH) +
        "Total".padStart(TOTAL_WIDTH) +
        "\n";
      content += thinLine();

      let grandTotal = 0;
      if (ticket.categoryList && ticket.categoryList.length > 0) {
        ticket.categoryList.forEach((item) => {
          const qty = Number(item.quantity || 0);
          const price = Number(item.categoryAmount || 0);
          const subtotal = qty * price;
          grandTotal += subtotal;
          content += formatTableRow(
            item.categoryName || "",
            qty,
            price,
            subtotal,
          );
        });
      }

      content += thinLine();
      content += leftRight("TOTAL", `Rs.${grandTotal}/-`);

      if (ticket.discountAmount && ticket.discountAmount > 0) {
        content += leftRight("Discount", `-Rs.${ticket.discountAmount}`);
        content += leftRight(
          "NET TOTAL",
          `Rs.${grandTotal - ticket.discountAmount}/-`,
        );
      }

      if (ticket.paidAmount) {
        content += leftRight("Paid", `Rs.${ticket.paidAmount}/-`);
      }

      content += divider();

      if (ticket.visitorName) {
        content += leftRight("Visitor", ticket.visitorName);
      }

      if (ticket.visitorMobile) {
        content += leftRight("Mobile", ticket.visitorMobile);
      }

      content += divider();
      content += centerText("Thank You! Visit Again");
      content += centerText("Have a Nice Day");
      content += "\n\n\n";

      return content;
    } catch (error) {
      console.log("PRINT CONTENT ERROR:", error);
      return "PRINT ERROR\n\n";
    }
  };

  const performPrint = async () => {
    try {
      const printText = generatePrintContent();
      
      await BLEPrinter.printText(printText, {
        encoding: "UTF-8",
        codepage: 0,
        widthtimes: 0,
        heigthtimes: 0,
        fonttype: 1,
        cut: true,
      });

      Alert.alert("Success", "Printed Successfully");
      
      if (onPrintComplete) {
        onPrintComplete();
      }
      
      onClose();
    } catch (error) {
      console.log("PRINT ERROR:", error);
      Alert.alert("Print Failed", error?.message || "Unable to print");
      if (onPrintError) {
        onPrintError(error);
      }
    }
  };

  const connectPrinter = async (device) => {
    try {
      setIsConnecting(true);
      const macAddress = device?.inner_mac_address || device?.macAddress || device?.address;
      const deviceName = device?.device_name || device?.name || "Unknown Printer";

      if (!macAddress) {
        Alert.alert("Error", "Printer MAC address not found");
        return;
      }

      await AsyncStorage.setItem("LAST_CONNECTED_PRINTER", macAddress);
      await BLEPrinter.init();
      await BLEPrinter.connectPrinter(macAddress);
      
      setBluetoothname(deviceName);
      setConnectedDevice(device);
      
      Alert.alert("Success", `Connected to ${deviceName}`);

      // If there's pending print data, print immediately
      if (printData || pendingPrintData) {
        await performPrint();
      } else {
        onClose();
      }
    } catch (error) {
      console.log("CONNECT ERROR:", error);
      Alert.alert("Connection Failed", error?.message || "Unable to connect to printer");
      if (onPrintError) {
        onPrintError(error);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const renderDevice = ({ item }) => {
    const isThermalPrinter = item.device_name?.toLowerCase().includes("thermal") ||
                           item.name?.toLowerCase().includes("thermal");
    
    return (
      <TouchableOpacity
        style={styles.deviceItem}
        onPress={() => connectPrinter(item)}
        disabled={isConnecting}
      >
        <Text style={styles.deviceName}>
          {item.device_name || item.name || "Unknown Printer"}
          {isThermalPrinter && <Text style={styles.thermalBadge}> Thermal</Text>}
        </Text>
        <Text style={styles.deviceId}>
          {item.inner_mac_address || item.macAddress || item.address || ""}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Select Bluetooth Printer</Text>

          {isScanning || isConnecting ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" />
              <Text style={styles.scanText}>
                {isConnecting
                  ? "Connecting to Printer..."
                  : "Scanning for Printers..."}
              </Text>
            </View>
          ) : (
            <>
              {connectedDevice && (
                <View style={styles.connectedInfo}>
                  <Text style={styles.connectedText}>
                    ✅ Connected: {connectedDevice.device_name || connectedDevice.name}
                  </Text>
                </View>
              )}
              
              <FlatList
                data={devices}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderDevice}
                ListEmptyComponent={
                  <Text style={styles.noDevice}>No Printers Found</Text>
                }
              />

              <TouchableOpacity style={styles.scanButton} onPress={scanDevices}>
                <Text style={styles.buttonText}>Scan Again</Text>
              </TouchableOpacity>
            </>
          )}

          {pendingPrintData && onPrintAnyway && (
            <TouchableOpacity
              style={styles.printAnywayButton}
              onPress={onPrintAnyway}
              disabled={isConnecting}
            >
              <Text style={styles.buttonText}>Print Anyway (Without Bluetooth)</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            disabled={isConnecting}
          >
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    maxHeight: "80%",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },
  scanText: {
    marginTop: 10,
    fontSize: 16,
  },
  deviceItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  deviceId: {
    fontSize: 12,
    color: "#777",
    marginTop: 5,
  },
  thermalBadge: {
    color: "#4CAF50",
    fontSize: 12,
    fontWeight: "normal",
  },
  noDevice: {
    textAlign: "center",
    marginVertical: 20,
    fontSize: 16,
  },
  scanButton: {
    backgroundColor: "#1976D2",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  printAnywayButton: {
    backgroundColor: "#FF9800",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  closeButton: {
    backgroundColor: "#f44336",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  connectedInfo: {
    backgroundColor: "#e8f5e9",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  connectedText: {
    color: "#2e7d32",
    fontWeight: "bold",
  },
});

export default BluetoothPrinter;