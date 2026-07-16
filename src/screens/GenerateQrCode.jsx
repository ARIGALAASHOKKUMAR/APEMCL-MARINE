import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
  ToastAndroid,
  Modal,
  FlatList,
} from 'react-native';
import { commonAPICall, CONTEXT_HEADING, GENERATEQRCODES } from '../utils/utils';
import { useDispatch } from 'react-redux';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import Icon from 'react-native-vector-icons/Ionicons';

const { width } = Dimensions.get('window');

function GenerateQrCode() {
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showQRCodes, setShowQRCodes] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [selectedQR, setSelectedQR] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showQRDetailModal, setShowQRDetailModal] = useState(false);
  const dispatch = useDispatch();

  // Generate QR codes
  const generateQRs = async () => {
    setLoading(true);
    try {
      const generatedQRs = [];
      for (let i = 0; i < 10; i++) {
        const uniqueId = `QR_${Date.now()}_${i}_${Math.random().toString(36).substring(7)}`;
        generatedQRs.push({
          id: uniqueId,
          timestamp: new Date().toISOString(),
          type: 'PRODUCT_QR'
        });
      }
      
      const payload = {
        qrIds: generatedQRs.map(qr => qr.id),
      };

      const res = await commonAPICall(GENERATEQRCODES, payload, "post", dispatch);
      
      if (res.status === 200) {
        console.log("resdsdsds",res);
        
        const qrCodesWithImages = generatedQRs.map((qr, index) => ({
          ...qr,
          qrImageUrl: res.data.qrCodes?.[index]?.qrImageUrl || 
            `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr.id)}`,
          qrCodeId: res.data.qrCodes?.[index]?.id || qr.id,
        }));
        
        setQrCodes(qrCodesWithImages);
        setShowQRCodes(true);
      }
    } catch (error) {
      console.error('Error generating QR codes:', error);
      Alert.alert('Error', 'Failed to generate QR codes');
    } finally {
      setLoading(false);
    }
  };

  // Generate PDF with all QR codes
  const generatePDF = async () => {
    try {
      setDownloading(true);
      
      // Create HTML content for PDF
      let qrImagesHTML = '';
      qrCodes.forEach((qr, index) => {
        qrImagesHTML += `
          <div style="page-break-after: always; text-align: center; padding: 20px;">
            <h2 style="color: #1e3a5f; margin-bottom: 10px;">QR Code ${index + 1}</h2>
            <img src="${qr.qrImageUrl}" style="width: 300px; height: 300px; border: 2px solid green; border-radius: 10px;" />
            <p style="margin-top: 10px; font-size: 14px; color: #666;">
              <strong>ID:</strong> ${qr.id}
            </p>
            <p style="font-size: 12px; color: #999;">
              Generated: ${new Date(qr.timestamp).toLocaleString()}
            </p>
          </div>
        `;
      });

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>QR Codes - APEMCL Marine</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                background: #f5f5f5;
                padding: 20px;
              }
              .header {
                text-align: center;
                padding: 20px;
                background: green;
                color: white;
                border-radius: 10px;
                margin-bottom: 30px;
              }
              .header h1 {
                font-size: 24px;
                margin: 0;
              }
              .header p {
                margin: 5px 0 0;
                opacity: 0.9;
              }
              .qr-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 20px;
                margin-top: 20px;
              }
              .qr-item {
                background: white;
                border-radius: 10px;
                padding: 20px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                text-align: center;
                border: 1px solid #e0e0e0;
              }
              .qr-item img {
                width: 100%;
                max-width: 200px;
                height: auto;
                border: 2px solid green;
                border-radius: 8px;
              }
              .qr-item h3 {
                margin: 10px 0 5px;
                color: #1e3a5f;
                font-size: 16px;
              }
              .qr-item p {
                margin: 0;
                color: #666;
                font-size: 12px;
                word-break: break-all;
              }
              .footer {
                text-align: center;
                margin-top: 30px;
                padding: 20px;
                color: #666;
                border-top: 1px solid #e0e0e0;
                font-size: 12px;
              }
              @media print {
                .qr-item {
                  break-inside: avoid;
                  page-break-inside: avoid;
                }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>📱 APEMCL Marine - QR Codes</h1>
              <p>Generated: ${new Date().toLocaleString()}</p>
              <p>Total QR Codes: ${qrCodes.length}</p>
            </div>
            <div class="qr-grid">
              ${qrCodes.map((qr, index) => `
                <div class="qr-item">
                  <img src="${qr.qrImageUrl}" alt="QR Code ${index + 1}" />
                  <h3>QR Code ${index + 1}</h3>
                </div>
              `).join('')}
            </div>
            <div class="footer">
              <p>Generated by APEMCL Marine App</p>
              <p>© ${new Date().getFullYear()} All Rights Reserved</p>
            </div>
          </body>
        </html>
      `;

      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      // Share PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'QR Codes PDF',
          UTI: 'com.adobe.pdf',
        });
      } else {
        // Fallback: share as file
        await Share.share({
          message: `QR Codes PDF generated. Total: ${qrCodes.length} QR Codes`,
          url: uri,
          title: 'QR Codes PDF',
        });
      }

    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  // Download single QR code image to gallery
  const downloadQRImage = async (qr, index) => {
    try {
      setDownloading(true);
      
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Cannot save QR code without storage permission');
        return;
      }

      const imageUrl = qr.qrImageUrl;
      const fileUri = FileSystem.documentDirectory + `QR_Code_${index + 1}.png`;
      
      const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri);
      
      if (downloadResult.status === 200) {
        const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
        await MediaLibrary.createAlbumAsync('QR Codes', asset, false);
        
        if (Platform.OS === 'android') {
          ToastAndroid.show(`QR Code ${index + 1} saved to gallery`, ToastAndroid.SHORT);
        } else {
          Alert.alert('Success', `QR Code ${index + 1} saved to gallery`);
        }
      }
    } catch (error) {
      console.error('Error downloading QR code:', error);
      Alert.alert('Error', 'Failed to download QR code');
    } finally {
      setDownloading(false);
    }
  };

  // Share single QR code as image
  const shareQRImage = async (qr, index) => {
    try {
      const imageUrl = qr.qrImageUrl;
      const fileUri = FileSystem.documentDirectory + `QR_Code_${index + 1}.png`;
      
      const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri);
      
      if (downloadResult.status === 200 && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: 'image/png',
          dialogTitle: `QR Code ${index + 1}`,
        });
      } else {
        await Share.share({
          message: `QR Code ${index + 1}\nID: ${qr.id}\nImage URL: ${imageUrl}`,
          title: `QR Code ${index + 1}`,
        });
      }
    } catch (error) {
      console.error('Error sharing QR code:', error);
      try {
        await Share.share({
          message: `QR Code ${index + 1}\nID: ${qr.id}`,
          title: `QR Code ${index + 1}`,
        });
      } catch (shareError) {
        Alert.alert('Error', 'Failed to share QR code');
      }
    }
  };

  // Download all QR codes to gallery
  const downloadAllQRCodes = async () => {
    if (qrCodes.length === 0) {
      Alert.alert('Info', 'Please generate QR codes first');
      return;
    }

    try {
      setDownloading(true);
      
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Cannot save QR codes without storage permission');
        return;
      }

      let downloaded = 0;
      for (let i = 0; i < qrCodes.length; i++) {
        const fileUri = FileSystem.documentDirectory + `QR_Code_${i + 1}.png`;
        const downloadResult = await FileSystem.downloadAsync(qrCodes[i].qrImageUrl, fileUri);
        
        if (downloadResult.status === 200) {
          const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
          await MediaLibrary.createAlbumAsync('QR Codes', asset, false);
          downloaded++;
        }
      }
      
      Alert.alert('Success', `${downloaded} QR Codes saved to gallery`);
      if (Platform.OS === 'android') {
        ToastAndroid.show(`${downloaded} QR Codes saved to gallery`, ToastAndroid.LONG);
      }
    } catch (error) {
      console.error('Error downloading QR codes:', error);
      Alert.alert('Error', 'Failed to download QR codes');
    } finally {
      setDownloading(false);
    }
  };

  // View QR code detail
  const viewQRCodeDetail = (qr, index) => {
    setSelectedQR({ ...qr, index });
    setShowQRDetailModal(true);
  };

  // Render QR Code Detail Modal
  const renderQRDetailModal = () => (
    <Modal
      visible={showQRDetailModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowQRDetailModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.detailModalContent}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowQRDetailModal(false)}
          >
            <Icon name="close" size={24} color="#333" />
          </TouchableOpacity>
          
          {selectedQR && (
            <>
              <Text style={styles.modalTitle}>QR Code {selectedQR.index + 1}</Text>
              <Image
                source={{ uri: selectedQR.qr.qrImageUrl }}
                style={styles.detailQRImage}
                resizeMode="contain"
              />
              <View style={styles.detailInfoContainer}>
                <View style={styles.detailInfoRow}>
                  <Text style={styles.detailInfoLabel}>QR ID:</Text>
                  <Text style={styles.detailInfoValue}>{selectedQR.qr.id}</Text>
                </View>
                <View style={styles.detailInfoRow}>
                  <Text style={styles.detailInfoLabel}>Generated:</Text>
                  <Text style={styles.detailInfoValue}>
                    {new Date(selectedQR.qr.timestamp).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.detailInfoRow}>
                  <Text style={styles.detailInfoLabel}>Type:</Text>
                  <Text style={styles.detailInfoValue}>{selectedQR.qr.type || 'PRODUCT_QR'}</Text>
                </View>
              </View>
              
              <View style={styles.modalActionContainer}>
                <TouchableOpacity
                  style={[styles.modalActionButton, styles.modalShareButton]}
                  onPress={() => {
                    setShowQRDetailModal(false);
                    shareQRImage(selectedQR.qr, selectedQR.index);
                  }}
                >
                  <Icon name="share-outline" size={20} color="#fff" />
                  <Text style={styles.modalActionText}>Share</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalActionButton, styles.modalDownloadButton]}
                  onPress={() => {
                    setShowQRDetailModal(false);
                    downloadQRImage(selectedQR.qr, selectedQR.index);
                  }}
                >
                  <Icon name="download-outline" size={20} color="#fff" />
                  <Text style={styles.modalActionText}>Download</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  // Render QR Code Grid Item
  const renderQRCodeItem = (qr, i) => (
    <TouchableOpacity
      key={i}
      style={styles.gridItem}
      // onPress={() => viewQRCodeDetail(qr, i)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: qr.qrImageUrl }}
        style={styles.qrImage}
        resizeMode="contain"
      />
      <Text style={styles.qrLabel}>QR {i + 1}</Text>
      {/* <Text style={styles.tapHint}>Tap to view</Text> */}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {renderQRDetailModal()}
      
      <View>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>
            <Icon name="water-outline" size={24} color="#333" /> Marine Industry
          </Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.panel}>
            {/* <View style={styles.panelHeading}>
              <Text style={styles.panelTitle}>{CONTEXT_HEADING}</Text>
            </View> */}

            <View style={styles.panelBody}>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.generateButton}
                  onPress={generateQRs}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Icon name="qr-code-outline" size={20} color="#fff" />
                      <Text style={styles.buttonText}>Generate QR Codes</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {qrCodes.length > 0 && (
                <View style={styles.statsContainer}>
                  <Text style={styles.statsText}>
                    Total QR Codes Generated: {qrCodes.length}
                  </Text>
                  <Text style={styles.statsSubText}>
                    Generated at: {new Date(qrCodes[0]?.timestamp).toLocaleString()}
                  </Text>
                </View>
              )}

              {showQRCodes && qrCodes.length > 0 && (
                <>
                  <View style={styles.gridContainer}>
                    {qrCodes.map((qr, i) => renderQRCodeItem(qr, i))}
                  </View>

                  <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.pdfButton]}
                      onPress={generatePDF}
                      disabled={downloading}
                    >
                      {downloading ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <>
                          <Icon name="document-text-outline" size={16} color="#fff" />
                          <Text style={styles.actionButtonText}>PDF</Text>
                        </>
                      )}
                    </TouchableOpacity>

                  </View>
                </>
              )}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    padding: 16,
    // borderBottomWidth: 1,
    // borderBottomColor: '#e0e0e0',
    // backgroundColor: '#f8f9fa',
    // borderTopLeftRadius: 8,
    // borderTopRightRadius: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
  },
  cardBody: {
    padding: 16,
  },
  panel: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  panelHeading: {
    backgroundColor: 'green',
    padding: 12,
  },
  panelTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  panelBody: {
    padding: 16,
  },
  buttonContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'green',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
    minWidth: 200,
    justifyContent: 'center',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 8,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    minWidth: 100,
    justifyContent: 'center',
    marginHorizontal: 4,
    marginVertical: 4,
  },
  pdfButton: {
    backgroundColor: '#dc3545',
  },
  shareAllButton: {
    backgroundColor: '#17a2b8',
  },
  downloadAllButton: {
    backgroundColor: '#28a745',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  statsContainer: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    marginVertical: 10,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statsSubText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  gridItem: {
    width: width / 4 - 16,
    padding: 4,
    marginBottom: 8,
    alignItems: 'center',
  },
  qrImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  qrLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  tapHint: {
    fontSize: 9,
    color: '#17a2b8',
    textAlign: 'center',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  detailQRImage: {
    width: 250,
    height: 250,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  detailInfoContainer: {
    width: '100%',
    marginBottom: 16,
  },
  detailInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailInfoLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  detailInfoValue: {
    fontSize: 13,
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  modalActionContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    width: '100%',
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    justifyContent: 'center',
  },
  modalShareButton: {
    backgroundColor: '#17a2b8',
  },
  modalDownloadButton: {
    backgroundColor: '#28a745',
  },
  modalActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default GenerateQrCode;