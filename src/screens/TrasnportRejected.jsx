import React, { useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Platform
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import { CONTEXT_HEADING } from "../utils/utils";

const { width, height } = Dimensions.get("window");

function TransportRejected() {
  const route = useRoute();
  const navigation = useNavigation();
  const componentRef = useRef(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const data = route.params?.data;

  if (!data) {
    return (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataText}>No Data Found</Text>
      </View>
    );
  }

  let waste = {};
  try {
    const parsed = JSON.parse(data.waste_details || "[]");
    waste = parsed[0] || {};
  } catch (e) {
    console.error("Error parsing waste details:", e);
  }

  const handlePrint = async () => {
    if (!componentRef.current) {
      Alert.alert("Error", "Content not ready for printing");
      return;
    }

    setIsPrinting(true);

    try {
      // Capture the view as image
      const uri = await captureRef(componentRef, {
        format: "png",
        quality: 0.8,
        width: 800,
        height: 1200,
      });

      // Generate HTML content for printing
      const htmlContent = generatePrintHTML();
      
      // For iOS/Android native print dialog
      if (Platform.OS === "ios" || Platform.OS === "android") {
        await Print.printAsync({
          html: htmlContent,
          baseUrl: Platform.select({
            ios: undefined,
            android: "file:///android_asset/",
          }),
        });
      } else {
        // For web or sharing
        const { uri: pdfUri } = await Print.printToFileAsync({
          html: htmlContent,
          base64: false,
        });
        
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(pdfUri);
        } else {
          Alert.alert("Print", "Print option is not available on this device");
        }
      }
    } catch (error) {
      console.error("Print error:", error);
      Alert.alert("Error", "Failed to generate print content");
    } finally {
      setIsPrinting(false);
    }
  };

  const generatePrintHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              margin: 0;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              font-size: 20px;
              font-weight: bold;
              padding: 15px;
              background-color: #f0f0f0;
              margin-bottom: 20px;
            }
            .table {
              width: 100%;
              border-collapse: collapse;
              font-size: 14px;
            }
            .table td {
              border: 1px solid #000;
              padding: 8px;
              vertical-align: top;
            }
            .table td:first-child {
              width: 5%;
              text-align: center;
            }
            .table td:nth-child(2) {
              width: 35%;
              font-weight: bold;
            }
            .table td:nth-child(3) {
              width: 60%;
            }
            .status {
              color: #dc3545;
              font-weight: bold;
            }
            .subheading {
              font-weight: normal;
            }
            @media print {
              .no-print {
                display: none;
              }
              body {
                padding: 0;
              }
            }
            @media (max-width: 600px) {
              .table {
                font-size: 12px;
              }
              .table td {
                padding: 5px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">VEHICLE TRANSACTION DETAILS</div>
            <table class="table">
              <tbody>
                <tr>
                  <td>1</td>
                  <td>Transaction Date</td>
                  <td>${data.manifest_generated_on?.split(" ")[0] || "-"}</td>
                </tr>
                <tr>
                  <td>2</td>
                  <td>Sender's Name & Mailing Address (including PhoneNo. and email)</td>
                  <td>
                    <b>Name:</b> ${data.generator_industry_name || "-"} <br />
                    <b>Address:</b> ${data.generator_industry_address || "-"} <br />
                    <b>Phone:</b> ${data.generator_contact_mobile || "-"} <br />
                    <b>Email:</b> ${data.generator_contact_email || "-"}
                  </td>
                </tr>
                <tr>
                  <td>3</td>
                  <td>Sender Authorization No</td>
                  <td>${data.generator_authorization_no || "-"}</td>
                </tr>
                <tr>
                  <td>4</td>
                  <td>Manifest Document No :</td>
                  <td>${data.manifest_number || "-"}</td>
                </tr>
                <tr>
                  <td>5</td>
                  <td>TransporterName & Mailing Address : (including PhoneNo. and email) :</td>
                  <td>
                    <b>Name:</b> ${data.transporter_company_name || "-"} <br />
                    <b>Address:</b> ${data.transporter_address || "-"} <br />
                    <b>Phone:</b> ${data.transporter_mobile || "-"} <br />
                    <b>Email:</b> ${data.transporter_email || "-"}
                  </td>
                </tr>
                <tr>
                  <td>6</td>
                  <td>Type of Vehicle :</td>
                  <td>${data.vehicle_type || "-"}</td>
                </tr>
                <tr>
                  <td>7</td>
                  <td>VehicleRegistration No :</td>
                  <td>${data.vehicle_registration_number || "-"}</td>
                </tr>
                <tr>
                  <td>8</td>
                  <td>Receiver's Name& mailingAddress, (including PhoneNo. and Email) :</td>
                  <td>
                    <b>Name:</b> ${data.receiver_industry_name || "-"} <br />
                    <b>Address:</b> ${data.receiver_industry_address || "-"} <br />
                    <b>Phone:</b> ${data.receiver_contact_mobile || "-"} <br />
                    <b>Email:</b> ${data.receiver_contact_email || "-"}
                  </td>
                </tr>
                <tr>
                  <td>9</td>
                  <td>Receiver Authorization No :</td>
                  <td>${data.receiver_authorization_no || "-"}</td>
                </tr>
                <tr>
                  <td>10</td>
                  <td>Waste Description :</td>
                  <td>${data.waste_type_name || "-"} - ${waste.waste_description || "-"}</td>
                </tr>
                <tr>
                  <td>11</td>
                  <td>Total Quantity<br />No. of Containers:</td>
                  <td>${data.total_disposal_quantity || "-"}</td>
                </tr>
                <tr>
                  <td>12</td>
                  <td>Total KM</td>
                  <td>${data.total_kms || "-"}</td>
                </tr>
                <tr>
                  <td>13</td>
                  <td>Physical Form :</td>
                  <td>${waste.waste_consistence || "-"}</td>
                </tr>
                <tr>
                  <td>14</td>
                  <td>Special HandlingInstructions & AdditionalInformation :</td>
                  <td>${data.special_handling_instruction || "-"}</td>
                </tr>
                <tr>
                  <td>15</td>
                  <td>Transport Status :</td>
                  <td class="status">${data.current_status || "-"}</td>
                </tr>
                <tr>
                  <td>16</td>
                  <td>Rejected Date :</td>
                  <td>${data.transporter_action_on?.split(" ")[0] || "-"}</td>
                </tr>
                <tr>
                  <td>17</td>
                  <td>Rejected Reason :</td>
                  <td class="status">${data.transporter_rejection_remarks || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>VEHICLE TRANSACTION DETAILS</Text>
      </View>

      <ScrollView style={styles.scrollView} ref={componentRef}>

        <View style={styles.contentContainer}>
          <View style={styles.panel}>
            <Text style={styles.panelHeading}>{CONTEXT_HEADING}</Text>

            <View style={styles.tableContainer}>
              {/* Row 1 - Transaction Date */}
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, styles.cellSno]}>
                  <Text style={styles.cellText}>1</Text>
                </View>
                <View style={[styles.tableCell, styles.cellLabel]}>
                  <Text style={styles.cellText}>Transaction Date</Text>
                </View>
                <View style={[styles.tableCell, styles.cellValue]}>
                  <Text style={styles.cellText}>
                    {data.manifest_generated_on?.split(" ")[0] || "-"}
                  </Text>
                </View>
              </View>

              {/* Row 2 - Sender Details */}
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, styles.cellSno]}>
                  <Text style={styles.cellText}>2</Text>
                </View>
                <View style={[styles.tableCell, styles.cellLabel]}>
                  <Text style={styles.cellText}>Sender's Name & Mailing Address</Text>
                </View>
                <View style={[styles.tableCell, styles.cellValue]}>
                  <Text style={styles.cellText}>
                    <Text style={styles.boldText}>Name:</Text> {data.generator_industry_name || "-"}{"\n"}
                    <Text style={styles.boldText}>Address:</Text> {data.generator_industry_address || "-"}{"\n"}
                    <Text style={styles.boldText}>Phone:</Text> {data.generator_contact_mobile || "-"}{"\n"}
                    <Text style={styles.boldText}>Email:</Text> {data.generator_contact_email || "-"}
                  </Text>
                </View>
              </View>

              {/* Row 3 - Sender Authorization */}
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, styles.cellSno]}>
                  <Text style={styles.cellText}>3</Text>
                </View>
                <View style={[styles.tableCell, styles.cellLabel]}>
                  <Text style={styles.cellText}>Sender Authorization No</Text>
                </View>
                <View style={[styles.tableCell, styles.cellValue]}>
                  <Text style={styles.cellText}>{data.generator_authorization_no || "-"}</Text>
                </View>
              </View>

              {/* Row 4 - Manifest Document No */}
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, styles.cellSno]}>
                  <Text style={styles.cellText}>4</Text>
                </View>
                <View style={[styles.tableCell, styles.cellLabel]}>
                  <Text style={styles.cellText}>Manifest Document No :</Text>
                </View>
                <View style={[styles.tableCell, styles.cellValue]}>
                  <Text style={styles.cellText}>{data.manifest_number || "-"}</Text>
                </View>
              </View>

              {/* Row 5 - Transporter Details */}
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, styles.cellSno]}>
                  <Text style={styles.cellText}>5</Text>
                </View>
                <View style={[styles.tableCell, styles.cellLabel]}>
                  <Text style={styles.cellText}>Transporter Name & Mailing Address</Text>
                </View>
                <View style={[styles.tableCell, styles.cellValue]}>
                  <Text style={styles.cellText}>
                    <Text style={styles.boldText}>Name:</Text> {data.transporter_company_name || "-"}{"\n"}
                    <Text style={styles.boldText}>Address:</Text> {data.transporter_address || "-"}{"\n"}
                    <Text style={styles.boldText}>Phone:</Text> {data.transporter_mobile || "-"}{"\n"}
                    <Text style={styles.boldText}>Email:</Text> {data.transporter_email || "-"}
                  </Text>
                </View>
              </View>

              {/* Row 6 - Type of Vehicle */}
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, styles.cellSno]}>
                  <Text style={styles.cellText}>6</Text>
                </View>
                <View style={[styles.tableCell, styles.cellLabel]}>
                  <Text style={styles.cellText}>Type of Vehicle :</Text>
                </View>
                <View style={[styles.tableCell, styles.cellValue]}>
                  <Text style={styles.cellText}>{data.vehicle_type || "-"}</Text>
                </View>
              </View>

              {/* Row 7 - Vehicle Registration No */}
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, styles.cellSno]}>
                  <Text style={styles.cellText}>7</Text>
                </View>
                <View style={[styles.tableCell, styles.cellLabel]}>
                  <Text style={styles.cellText}>Vehicle Registration No :</Text>
                </View>
                <View style={[styles.tableCell, styles.cellValue]}>
                  <Text style={styles.cellText}>{data.vehicle_registration_number || "-"}</Text>
                </View>
              </View>

              {/* Row 8 - Receiver Details */}
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, styles.cellSno]}>
                  <Text style={styles.cellText}>8</Text>
                </View>
                <View style={[styles.tableCell, styles.cellLabel]}>
                  <Text style={styles.cellText}>Receiver's Name & Mailing Address</Text>
                </View>
                <View style={[styles.tableCell, styles.cellValue]}>
                  <Text style={styles.cellText}>
                    <Text style={styles.boldText}>Name:</Text> {data.receiver_industry_name || "-"}{"\n"}
                    <Text style={styles.boldText}>Address:</Text> {data.receiver_industry_address || "-"}{"\n"}
                    <Text style={styles.boldText}>Phone:</Text> {data.receiver_contact_mobile || "-"}{"\n"}
                    <Text style={styles.boldText}>Email:</Text> {data.receiver_contact_email || "-"}
                  </Text>
                </View>
              </View>

              {/* Row 9 - Receiver Authorization */}
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, styles.cellSno]}>
                  <Text style={styles.cellText}>9</Text>
                </View>
                <View style={[styles.tableCell, styles.cellLabel]}>
                  <Text style={styles.cellText}>Receiver Authorization No :</Text>
                </View>
                <View style={[styles.tableCell, styles.cellValue]}>
                  <Text style={styles.cellText}>{data.receiver_authorization_no || "-"}</Text>
                </View>
              </View>

              {/* Row 10 - Waste Description */}
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, styles.cellSno]}>
                  <Text style={styles.cellText}>10</Text>
                </View>
                <View style={[styles.tableCell, styles.cellLabel]}>
                  <Text style={styles.cellText}>Waste Description :</Text>
                </View>
                <View style={[styles.tableCell, styles.cellValue]}>
                  <Text style={styles.cellText}>
                    {data.waste_type_name || "-"} - {waste.waste_description || "-"}
                  </Text>
                </View>
              </View>

              {/* Row 11 - Total Quantity */}
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, styles.cellSno]}>
                  <Text style={styles.cellText}>11</Text>
                </View>
                <View style={[styles.tableCell, styles.cellLabel]}>
                  <Text style={styles.cellText}>Total Quantity No. of Containers:</Text>
                </View>
                <View style={[styles.tableCell, styles.cellValue]}>
                  <Text style={styles.cellText}>{data.total_disposal_quantity || "-"}</Text>
                </View>
              </View>

              {/* Row 12 - Total KM */}
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, styles.cellSno]}>
                  <Text style={styles.cellText}>12</Text>
                </View>
                <View style={[styles.tableCell, styles.cellLabel]}>
                  <Text style={styles.cellText}>Total KM</Text>
                </View>
                <View style={[styles.tableCell, styles.cellValue]}>
                  <Text style={styles.cellText}>{data.total_kms || "-"}</Text>
                </View>
              </View>

              {/* Row 13 - Physical Form */}
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, styles.cellSno]}>
                  <Text style={styles.cellText}>13</Text>
                </View>
                <View style={[styles.tableCell, styles.cellLabel]}>
                  <Text style={styles.cellText}>Physical Form :</Text>
                </View>
                <View style={[styles.tableCell, styles.cellValue]}>
                  <Text style={styles.cellText}>{waste.waste_consistence || "-"}</Text>
                </View>
              </View>

              {/* Row 14 - Special Handling Instructions */}
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, styles.cellSno]}>
                  <Text style={styles.cellText}>14</Text>
                </View>
                <View style={[styles.tableCell, styles.cellLabel]}>
                  <Text style={styles.cellText}>Special Handling Instructions & Additional Information :</Text>
                </View>
                <View style={[styles.tableCell, styles.cellValue]}>
                  <Text style={styles.cellText}>{data.special_handling_instruction || "-"}</Text>
                </View>
              </View>

              {/* Row 15 - Transport Status */}
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, styles.cellSno]}>
                  <Text style={styles.cellText}>15</Text>
                </View>
                <View style={[styles.tableCell, styles.cellLabel]}>
                  <Text style={styles.cellText}>Transport Status :</Text>
                </View>
                <View style={[styles.tableCell, styles.cellValue]}>
                  <Text style={[styles.cellText, styles.statusText]}>
                    {data.current_status || "-"}
                  </Text>
                </View>
              </View>

              {/* Row 16 - Rejected Date */}
              <View style={styles.tableRow}>
                <View style={[styles.tableCell, styles.cellSno]}>
                  <Text style={styles.cellText}>16</Text>
                </View>
                <View style={[styles.tableCell, styles.cellLabel]}>
                  <Text style={styles.cellText}>Rejected Date :</Text>
                </View>
                <View style={[styles.tableCell, styles.cellValue]}>
                  <Text style={styles.cellText}>
                    {data.transporter_action_on?.split(" ")[0] || "-"}
                  </Text>
                </View>
              </View>

              {/* Row 17 - Rejected Reason */}
              <View style={[styles.tableRow, styles.lastRow]}>
                <View style={[styles.tableCell, styles.cellSno]}>
                  <Text style={styles.cellText}>17</Text>
                </View>
                <View style={[styles.tableCell, styles.cellLabel]}>
                  <Text style={styles.cellText}>Rejected Reason :</Text>
                </View>
                <View style={[styles.tableCell, styles.cellValue]}>
                  <Text style={[styles.cellText, styles.rejectedReasonText]}>
                    {data.transporter_rejection_remarks || "-"}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Print Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.printButton}
          onPress={handlePrint}
          disabled={isPrinting}
        >
          {isPrinting ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.printButtonText}>
              <Text style={styles.printIcon}>🖨️</Text> PRINT MANIFEST
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noDataText: {
    fontSize: 18,
    color: "#666",
  },
  header: {
    backgroundColor: "#004b8d",
    padding: 15,
    alignItems: "center",
  },
  headerText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
    padding: 10,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  panel: {
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  panelHeading: {
    backgroundColor: "#e9ecef",
    padding: 12,
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  tableContainer: {
    padding: 8,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
    minHeight: 40,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  tableCell: {
    padding: 8,
    justifyContent: "center",
  },
  cellSno: {
    width: "8%",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  cellLabel: {
    width: "32%",
    backgroundColor: "#f8f9fa",
  },
  cellValue: {
    width: "60%",
  },
  cellText: {
    fontSize: width < 375 ? 12 : 14,
    color: "#333",
    lineHeight: width < 375 ? 16 : 20,
  },
  boldText: {
    fontWeight: "bold",
  },
  statusText: {
    color: "#dc3545",
    fontWeight: "bold",
  },
  rejectedReasonText: {
    color: "#dc3545",
  },
  buttonContainer: {
    padding: 15,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#dee2e6",
    alignItems: "center",
  },
  printButton: {
    backgroundColor: "#004b8d",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    minWidth: 200,
    alignItems: "center",
  },
  printButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  printIcon: {
    marginRight: 8,
  },
});

export default TransportRejected;