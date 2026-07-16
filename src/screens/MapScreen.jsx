import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LeafletMap } from 'expo-leaflet-navigation-map';

const MapScreen = ({ results }) => {
  // Helper: extract latitude and longitude from an item
  const getLatLng = (item) => {
    // Try common field names; adjust based on your API response
    const lat = item.latitude || item.lat || item.coordinates?.lat || null;
    const lng = item.longitude || item.lng || item.coordinates?.lng || null;
    return { lat, lng };
  };

  // Filter results that have valid coordinates
  const validLocations = results.filter(item => {
    const { lat, lng } = getLatLng(item);
    return lat != null && lng != null && !isNaN(lat) && !isNaN(lng);
  });

  // Build markers array for LeafletMap
  const markers = validLocations.map((item, idx) => {
    const { lat, lng } = getLatLng(item);
    let title = 'Location';
    if (item.full_name) title = item.full_name;      // worker name
    else if (item.jobtitle) title = item.jobtitle;  // job title
    else if (item.address) title = item.address;     // fallback
    return { id: idx, lat, lng, title };
  });

  // Default center: first marker, or dummy coordinates
  const center = markers.length
    ? [markers[0].lat, markers[0].lng]
    : [37.7749, -122.4194]; // dummy (San Francisco)

  // Zoom level: if multiple markers, zoom out to show more area
  const zoom = markers.length > 1 ? 10 : 13;

  if (!markers.length) {
    return (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataText}>
          No valid coordinates found for these results.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.mapContainer}>
      <LeafletMap
        coordinates={center}
        markers={markers}
        zoom={zoom}
        // Optional props: themes="light", showDirectionsPanel={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    height: 400,          // Fixed height; adjust as needed
    marginVertical: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginVertical: 12,
  },
  noDataText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default MapScreen;