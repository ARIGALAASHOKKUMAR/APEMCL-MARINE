import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Platform
} from "react-native";
import { Picker } from '@react-native-picker/picker';
import { BLEPrinter, requestPermissions, ColumnAlign } from '@porlone/rn-thermal-print';
import Swal from 'sweetalert2';

// Mock your existing imports - adjust these based on your actual files
const TicketBookingDetails = 'TicketBookingDetails';
const TicketBookingEntryDetails = 'TicketBookingEntryDetails';
const REPRINT = 'REPRINT';
const CONTEXT_HEADING = 'CONTEXT_HEADING';

// Mock functions - replace with your actual implementations
const commonAPICall = async (endpoint, data, method) => {
  // Your API call implementation
  return { status: 200, data: { spotBookingDetails: [] } };
};

const numberToWordsWithPrecision = (num) => {
  return `${num} rupees only`;
};

const showModal = (content) => {
  // Your modal implementation
  console.log('Show modal:', content);
};

const useDispatch = () => {
  return (action) => console.log('Dispatch:', action);
};

const TicketBooking = () => {
  const [data, setData] = useState([]);
  const dispatch = useDispatch();
  
  // Thermal printer states
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [printerError, setPrinterError] = useState(null);
  const [currentTicketData, setCurrentTicketData] = useState(null);
  const [mode, setMode] = useState("offline");
  const [orderId, setOrderId] = useState("");
  
  // Form state
  const [formValues, setFormValues] = useState({ spots: [] });

  // Initialize Bluetooth Printer
  const initBluetoothPrinter = async () => {
    try {
      setPrinterError(null);
      if (Platform.OS === 'android') {
        const hasPermission = await requestPermissions();
        if (!hasPermission) {
          setPrinterError('Bluetooth permission denied');
          Alert.alert('Error', 'Bluetooth permission is required for thermal printing');
          return false;
        }
      }

      await BLEPrinter.init();
      return true;
    } catch (error) {
      console.error('Failed to initialize printer:', error);
      setPrinterError(error.message);
      Alert.alert('Error', `Failed to initialize printer: ${error.message}`);
      return false;
    }
  };

  // Scan for Bluetooth printers
  const scanForPrinters = async () => {
    setIsScanning(true);
    setPrinterError(null);
    
    try {
      const initSuccess = await initBluetoothPrinter();
      if (!initSuccess) {
        setIsScanning(false);
        return;
      }

      const printerList = await BLEPrinter.getDeviceList();
      setDevices(printerList);
      
      if (printerList.length === 0) {
        setPrinterError('No Bluetooth printers found. Make sure your printer is paired and turned on.');
        Alert.alert('No Printers', 'No Bluetooth printers found. Please pair your printer first.');
      }
    } catch (error) {
      console.error('Error scanning printers:', error);
      setPrinterError(`Scan error: ${error.message}`);
      Alert.alert('Error', `Failed to scan printers: ${error.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  // Connect to selected printer
  const connectToPrinter = async (device) => {
    try {
      setPrinterError(null);
      await BLEPrinter.connect(device.inner_mac_address);
      setConnectedDevice(device);
      Alert.alert('Success', `Connected to ${device.device_name || 'Printer'}`);
      setShowPrinterModal(false);
      return true;
    } catch (error) {
      console.error('Connection failed:', error);
      setPrinterError(`Connection failed: ${error.message}`);
      Alert.alert('Error', `Failed to connect: ${error.message}`);
      return false;
    }
  };

  // Disconnect from printer
  const disconnectPrinter = async () => {
    try {
      await BLEPrinter.disconnect();
      setConnectedDevice(null);
      Alert.alert('Disconnected', 'Printer disconnected successfully');
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  // Format and print ticket to thermal printer
  const printToThermalPrinter = async (ticketData) => {
    if (!connectedDevice) {
      Alert.alert(
        'No Printer Connected',
        'Would you like to connect to a printer now?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Yes, Connect', 
            onPress: () => {
              setCurrentTicketData(ticketData);
              setShowPrinterModal(true);
              scanForPrinters();
            }
          }
        ]
      );
      return false;
    }

    setIsPrinting(true);
    
    try {
      const ticketDetails = ticketData.data.TicketDetails[0];
      
      // Print header with center alignment and bold
      await BLEPrinter.printText('<CB>' + ticketDetails.spotName + '</CB>\n');
      await BLEPrinter.printText('<C>AP FOREST DEVELOPMENT CORPORATION</C>\n');
      await BLEPrinter.printText('<C>Booking Confirmation</C>\n\n');
      
      // Print separator
      await BLEPrinter.printText('--------------------------------\n');
      
      // Print order details
      await BLEPrinter.printText(`Order ID: ${ticketDetails.OrderId}\n`);
      await BLEPrinter.printText(`Booking Date: ${ticketDetails.BookingDate}\n`);
      await BLEPrinter.printText(`Payment Mode: ${mode.toUpperCase()}\n`);
      await BLEPrinter.printText('--------------------------------\n\n');
      
      // Print items table header
      await BLEPrinter.printText('<B>Items Details:</B>\n');
      await BLEPrinter.printText('--------------------------------\n');
      
      // Print each category item
      for (const item of ticketDetails.categoryList) {
        const itemLine = `${item.categoryName}\n  Qty: ${item.quantity || 0}  ×  ₹${item.categoryAmount}  =  ₹${item.Total}\n`;
        await BLEPrinter.printText(itemLine);
      }
      
      await BLEPrinter.printText('--------------------------------\n');
      
      // Print total
      await BLEPrinter.printText(`<B>Total Amount: ₹${ticketDetails.totalPrice}</B>\n`);
      
      // Print amount in words if available
      const amountInWords = numberToWordsWithPrecision(ticketDetails.totalPrice);
      if (amountInWords) {
        await BLEPrinter.printText(`\n${amountInWords}\n`);
      }
      
      await BLEPrinter.printText('--------------------------------\n\n');
      
      // Print footer
      await BLEPrinter.printText('<C>Thank you for your booking!</C>\n');
      await BLEPrinter.printText('<C>Please show this ticket at the entrance</C>\n');
      await BLEPrinter.printText('<C>Visit again!</C>\n\n');
      
      // Print QR code with order ID for verification
      await BLEPrinter.printQRCode(`ORDER:${ticketDetails.OrderId}`, { size: 150 });
      await BLEPrinter.printText('\n');
      
      // Cut the paper
      await BLEPrinter.printText('\n\n', { cut: true });
      
      Alert.alert('Success', 'Ticket printed successfully!');
      return true;
      
    } catch (error) {
      console.error('Printing failed:', error);
      Alert.alert('Error', `Printing failed: ${error.message}`);
      return false;
    } finally {
      setIsPrinting(false);
    }
  };

  // Show ticket modal with options
  const TicketPopup = (response) => {
    setOrderId("");
    setCurrentTicketData(response);
    
    // Create custom modal view
    Alert.alert(
      'Ticket Booked Successfully!',
      `Order ID: ${response.data.TicketDetails[0].OrderId}\nAmount: ₹${response.data.TicketDetails[0].totalPrice}`,
      [
        {
          text: 'Print Thermal',
          onPress: () => printToThermalPrinter(response)
        },
        {
          text: 'OK',
          style: 'cancel'
        }
      ]
    );
  };

  // Calculate total for a spot
  const calculateSpotTotal = (categoryList) => {
    return categoryList.reduce((total, category) => {
      return total + category.categoryAmount * (category.quantity ? parseInt(category.quantity, 10) : 0);
    }, 0);
  };

  // Handle input change
  const handleQuantityChange = (spotIndex, categoryIndex, value) => {
    const newSpots = [...formValues.spots];
    newSpots[spotIndex].categoryList[categoryIndex].quantity = value;
    setFormValues({ ...formValues, spots: newSpots });
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const modifiedValues = {
        spots: formValues.spots
          .map((spot) => ({
            spotId: spot.spotId,
            paymentMode: mode,
            totalPrice: calculateSpotTotal(spot.categoryList),
            categoryList: spot.categoryList
              .filter((category) => category.quantity && parseInt(category.quantity, 10) > 0)
              .map((category) => ({
                categoryId: category.categoryId,
                categoryAmount: category.categoryAmount,
                quantity: parseInt(category.quantity, 10),
                categoryName: category.categoryName,
              })),
          }))
          .filter((spot) => spot.categoryList.length > 0),
      };

      const response = await commonAPICall(TicketBookingEntryDetails, modifiedValues, "POST");

      if (response.status === 200) {
        fetchSpotBookingDetails();
        TicketPopup(response);
        
        // Auto-print if printer is connected
        if (connectedDevice) {
          setTimeout(() => {
            printToThermalPrinter(response);
          }, 500);
        }
      } else {
        console.error("Submission failed:", response);
        Alert.alert('Error', 'Failed to book ticket');
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      Alert.alert('Error', 'An error occurred while booking');
    }
  };

  // Fetch spot booking details
  const fetchSpotBookingDetails = async () => {
    try {
      const response = await commonAPICall(TicketBookingDetails, {}, "GET");
      if (response.status === 200) {
        const fetchedData = response.data.spotBookingDetails.map((spot) => ({
          spotId: spot.spotId,
          spotName: spot.spotName,
          categoryList: spot.categoryList.map((category) => ({
            categoryId: category.categoryId,
            categoryName: category.categoryName,
            categoryAmount: parseFloat(category.categoryAmount),
            quantity: "",
          })),
        }));

        setData(response.data.spotBookingDetails);
        setFormValues({ spots: fetchedData });
      } else {
        console.error("Failed to fetch data:", response.statusText);
      }
    } catch (error) {
      console.error("An error occurred while fetching data:", error);
    }
  };

  // Handle reprint
  const handleReprint = async () => {
    if (!orderId || orderId === "") {
      Alert.alert("Error", "Order Id should not be empty");
    } else {
      const response = await commonAPICall(REPRINT + `orderId=${orderId}`, {}, "get");
      if (response.status === 200) {
        TicketPopup(response);
      }
    }
  };

  useEffect(() => {
    fetchSpotBookingDetails();
    initBluetoothPrinter();
  }, []);

  // Printer Selection Modal Component
  const PrinterSelectionModal = () => {
    return (
      <Modal
        visible={showPrinterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPrinterModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              <Text>🔵 Connect Bluetooth Printer</Text>
            </Text>
            
            {printerError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{printerError}</Text>
              </View>
            )}
            
            {connectedDevice && (
              <View style={styles.connectedContainer}>
                <Text style={styles.successText}>✓ Connected to: {connectedDevice.device_name || 'Printer'}</Text>
                <TouchableOpacity 
                  style={styles.disconnectButton}
                  onPress={disconnectPrinter}
                >
                  <Text style={styles.buttonText}>Disconnect</Text>
                </TouchableOpacity>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.scanButton}
              onPress={scanForPrinters}
              disabled={isScanning}
            >
              <Text style={styles.buttonText}>
                {isScanning ? 'Scanning...' : 'Scan for Printers'}
              </Text>
            </TouchableOpacity>
            
            <ScrollView style={styles.deviceList}>
              {devices.map((device, index) => (
                <View key={index} style={styles.deviceItem}>
                  <View>
                    <Text style={styles.deviceName}>{device.device_name || 'Unknown Printer'}</Text>
                    <Text style={styles.deviceAddress}>{device.inner_mac_address}</Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.connectButton}
                    onPress={() => connectToPrinter(device)}
                    disabled={connectedDevice?.inner_mac_address === device.inner_mac_address}
                  >
                    <Text style={styles.buttonText}>
                      {connectedDevice?.inner_mac_address === device.inner_mac_address ? 'Connected' : 'Connect'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
            
            {isScanning && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
                <Text>Scanning for Bluetooth printers...</Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowPrinterModal(false)}
            >
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <PrinterSelectionModal />
      
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>
            📘 Ticket Booking
          </Text>
          {connectedDevice && (
            <View style={styles.printerStatus}>
              <Text style={styles.statusText}>🔵 Printer Connected</Text>
            </View>
          )}
        </View>
        
        <View style={styles.reprintContainer}>
          <Text style={styles.label}>Order ID:</Text>
          <View style={styles.reprintInputContainer}>
            <TextInput
              style={styles.input}
              value={orderId}
              onChangeText={setOrderId}
              placeholder="Enter Order ID"
            />
            <TouchableOpacity 
              style={styles.reprintButton}
              onPress={handleReprint}
            >
              <Text style={styles.buttonText}>Reprint</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {formValues.spots.length > 0 ? (
        formValues.spots.map((spot, spotIndex) => (
          <View key={spotIndex} style={styles.spotCard}>
            <Text style={styles.spotName}>{spot.spotName}</Text>
            
            <View style={styles.categoriesContainer}>
              {spot.categoryList.map((category, categoryIndex) => (
                <View key={categoryIndex} style={styles.categoryItem}>
                  <Text style={styles.categoryLabel}>
                    {category.categoryName} (₹{category.categoryAmount})
                  </Text>
                  <TextInput
                    style={styles.quantityInput}
                    keyboardType="numeric"
                    value={category.quantity}
                    onChangeText={(value) => handleQuantityChange(spotIndex, categoryIndex, value)}
                    placeholder="Qty"
                  />
                </View>
              ))}
            </View>
            
            <View style={styles.paymentContainer}>
              <Text style={styles.label}>Mode of Payment:</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={mode}
                  onValueChange={(itemValue) => setMode(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="Offline" value="offline" />
                  <Picker.Item label="Online" value="online" />
                </Picker>
              </View>
            </View>
            
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total Price:</Text>
              <Text style={styles.totalAmount}>₹{calculateSpotTotal(spot.categoryList)}</Text>
              <Text style={styles.amountInWords}>
                {numberToWordsWithPrecision(calculateSpotTotal(spot.categoryList))}
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.bookButton}
              onPress={handleSubmit}
            >
              <Text style={styles.bookButtonText}>Book Ticket</Text>
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>
            ⚠️ No Data Found
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  printerStatus: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
  },
  reprintContainer: {
    marginTop: 8,
  },
  reprintInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    backgroundColor: '#fff',
  },
  reprintButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    justifyContent: 'center',
  },
  spotCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  spotName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  categoriesContainer: {
    marginBottom: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryLabel: {
    fontSize: 14,
    flex: 1,
  },
  quantityInput: {
    width: 60,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    textAlign: 'center',
  },
  paymentContainer: {
    marginBottom: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    marginTop: 4,
  },
  picker: {
    height: 50,
  },
  totalContainer: {
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976D2',
    marginTop: 4,
  },
  amountInWords: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  bookButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  noDataText: {
    fontSize: 16,
    color: '#f44336',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 4,
    marginBottom: 12,
  },
  errorText: {
    color: '#c62828',
  },
  connectedContainer: {
    backgroundColor: '#e8f5e9',
    padding: 12,
    borderRadius: 4,
    marginBottom: 12,
  },
  successText: {
    color: '#2e7d32',
    marginBottom: 8,
  },
  disconnectButton: {
    backgroundColor: '#f44336',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  scanButton: {
    backgroundColor: '#1976D2',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 16,
  },
  deviceList: {
    maxHeight: 300,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '500',
  },
  deviceAddress: {
    fontSize: 12,
    color: '#666',
  },
  connectButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  closeButton: {
    backgroundColor: '#9e9e9e',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
});

export default TicketBooking;