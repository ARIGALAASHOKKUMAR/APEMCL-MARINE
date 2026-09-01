// screens/TransportVehicleSelection.js
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
import { useFormik, FormikProvider } from "formik";
import * as Yup from "yup";
import Icon from "react-native-vector-icons/Ionicons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { WebView } from "react-native-webview";
import {
  commonAPICall,
  ADDTRANSPORTVEHICLESELECTION,
  CONTEXT_HEADING,
  TRANSPORTERLIST,
  TRANSPORTVEHICLESELECTIONGET,
} from "../utils/utils";

// Validation Schema
const validationSchema = Yup.object({
  selectedRouteNo: Yup.string().required("Please select a route"),
  totalKms: Yup.number()
    .required("Route distance is required")
    .min(0, "Distance must be positive"),
  estimatedTimeMinutes: Yup.number()
    .required("Estimated time is required")
    .min(0, "Time must be positive"),
  transporterSelectionId: Yup.string().required("Please select a transporter"),
  vehicleSelectionId: Yup.string().required("Please select a vehicle"),
  agreedToTerms: Yup.boolean().oneOf(
    [true],
    "You must agree to the terms and conditions",
  ),
  exposureHazards: Yup.string().required("Please select exposure hazards"),
  firstAidRequirements: Yup.string().required(
    "Please select first aid requirements",
  ),
  fireProcedure: Yup.string().required("Please select fire procedure"),
  spillageProcedure: Yup.string().required(
    "Please select spillage/explosion procedure",
  ),
  specialHandlingInstructions: Yup.string().required(
    "Please select special handling instructions",
  ),
  wastes: Yup.array()
    .min(1, "At least one waste entry is required")
    .of(
      Yup.object().shape({
        wasteType: Yup.string().required("Waste type is required"),
        interestedQty: Yup.number()
          .typeError("Enter valid quantity")
          .required("Interested quantity is required")
          .positive("Quantity must be positive")
          .min(0.01, "Quantity must be greater than 0"),
        dispatchQty: Yup.number()
          .typeError("Enter valid quantity")
          .required("Dispatch quantity is required")
          .positive("Quantity must be positive")
          .min(0.01, "Quantity must be greater than 0")
          .test(
            "not-greater-than-interested",
            "Dispatch quantity cannot exceed interested quantity",
            function (value) {
              const { interestedQty } = this.parent;
              if (!value || !interestedQty) return true;
              return Number(value) <= Number(interestedQty);
            },
          ),
        unit: Yup.string().required("Please select a unit"),
        wasteDescription: Yup.string().required(
          "Please select waste description",
        ),
        wasteConsistency: Yup.string().required(
          "Please select waste consistency",
        ),
        ph: Yup.number()
          .typeError("Enter valid pH value")
          .required("pH value is required")
          .min(0, "pH must be between 0 and 14")
          .max(14, "pH must be between 0 and 14"),
        calorificValue: Yup.number()
          .typeError("Enter valid calorific value")
          .required("Calorific value is required")
          .positive("Calorific value must be positive"),
        packageType: Yup.string().required("Please select package type"),
        noOfPackage: Yup.number()
          .typeError("Enter valid number")
          .required("Number of packages is required")
          .integer("Number of packages must be a whole number")
          .positive("Number of packages must be positive")
          .min(1, "At least 1 package is required"),
      }),
    ),
});

function TransportVehicleSelection() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const webViewRef = useRef(null);

  // Get data from navigation params
  const rowData = route?.params?.rowData;
  const wasteList = route?.params?.wasteList || [];

  const [transporters, setTransporters] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [expandedRoute, setExpandedRoute] = useState(null);
  const [address, setAddress] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [vehicleDistance, setVehicleDistance] = useState(null);
  const [isVehicleTooFar, setIsVehicleTooFar] = useState(false);
  const [vehicleLocation, setVehicleLocation] = useState(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState(false);
  const [routeData, setRouteData] = useState([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isFirstRender, setIsFirstRender] = useState(true);

  // Route colors
  const routeColors = ["#2196F3", "#4CAF50", "#F44336"];

  // Get coordinates
  const startLat = parseFloat(rowData?.genLatitude || 17.2);
  const startLng = parseFloat(rowData?.genLongitude || 82);
  const endLat = parseFloat(rowData?.recLatitude || 17.4);
  const endLng = parseFloat(rowData?.recLongitude || 82.2);

  const formik = useFormik({
    initialValues: {
      transporterSelectionId: "",
      vehicleSelectionId: "",
      agreedToTerms: false,
      route: "",
      selectedRouteNo: "",
      totalKms: "",
      estimatedTimeMinutes: "",
      exposureHazards: "",
      firstAidRequirements: "",
      fireProcedure: "",
      spillageProcedure: "",
      specialHandlingInstructions: "",
      wastes: [
        {
          wasteType: "",
          interestedQty: "",
          generatorApprovalTransactionNumber: "",
          dispatchQty: "",
          unit: "",
          wasteDescription: "",
          wasteConsistency: "",
          ph: "",
          calorificValue: "",
          packageType: "",
          noOfPackage: "",
        },
      ],
    },
    validationSchema,
    onSubmit: (values) => {
      handleSubmit(values);
    },
  });

  // Get Transporter List
  async function getTransporterList() {
    try {
      const res = await commonAPICall(
        TRANSPORTERLIST + "0",
        {},
        "GET",
        dispatch,
      );
      if (res.status === 200) {
        setTransporters(
          res.data.Transportation_Vehicle_Selection_Details || [],
        );
      }
    } catch (error) {
      console.error("Error fetching transporters:", error);
    }
  }

  // Get Vehicles
  async function getVehicles(vehicleId) {
    try {
      const res = await commonAPICall(
        TRANSPORTERLIST + vehicleId,
        {},
        "GET",
        dispatch,
      );
      if (res.status === 200) {
        setVehicles(res.data.Transportation_Vehicle_Selection_Details || []);
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    }
  }

  // Calculate distance
  function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Get Vehicle Location (simulated)
  function getVehicleLocation(vehicleId) {
    const vehicleLat = startLat + (Math.random() - 0.5) * 0.01;
    const vehicleLng = startLng + (Math.random() - 0.5) * 0.01;

    setVehicleLocation({ lat: vehicleLat, lng: vehicleLng });

    if (startLat && startLng) {
      const distance = calculateDistance(
        startLat,
        startLng,
        vehicleLat,
        vehicleLng,
      );
      setVehicleDistance(distance);
      setIsVehicleTooFar(distance > 1000);
    }
  }

  // Handle Submit
  async function handleSubmit(values) {
    try {
      setLoading(true);
      const payload = {
        ...values,
        wasteDisposalId: rowData?.wasteDisposalId,
        wasteTypeName: rowData?.wasteName,
        wasteDisposalInterestId: rowData?.wasteDisposalInterestId,
        receiverUserId: rowData?.registrationCode,
        receiverWasteTypeId: rowData?.receiverWasteTypeId,
        transporterAddress: address,
        transporterContactNo: contactNo,
        distanceInMeters: parseFloat(values.totalKms) * 1000,
        wastes: values.wastes.map((waste, index) => ({
          wasteTypeId: rowData?.receiverWasteTypeId,
          wasteType: waste.wasteType,
          interestedQuantity: waste.interestedQty,
          disposalQuantity: waste.dispatchQty,
          unitId: waste.unit,
          wasteDescriptionId: waste.wasteDescription,
          wasteConsistence: waste.wasteConsistency,
          phValue: waste.ph,
          calorificValue: waste.calorificValue,
          packageTypeId: waste.packageType,
          noOfPackages: waste.noOfPackage,
          generatorApprovalTransactionNumber:
            waste.generatorApprovalTransactionNumber,
        })),
      };

      const res = await commonAPICall(
        ADDTRANSPORTVEHICLESELECTION,
        payload,
        "POST",
        dispatch,
      );

      if (res.status === 200) {
        const stateRes = await commonAPICall(
          TRANSPORTVEHICLESELECTIONGET +
            res.data.wasteDisposalId +
            "&wasteDisposalInterestId=" +
            res.data.wasteDisposalInterestId,
          {},
          "get",
          dispatch,
        );

        const generatorApprovalTransactionNumber =
          stateRes.data.Transport_Vehicle_Selection_Details[0]
            .generator_approval_transaction_number;

        const updatedWastes = payload.wastes.map((waste) => ({
          ...waste,
          generatorApprovalTransactionNumber:
            generatorApprovalTransactionNumber,
        }));

        const updatedPayload = {
          ...payload,
          wastes: updatedWastes,
          isSez:
            stateRes.data.Transport_Vehicle_Selection_Details[0]
              .is_sez_industry,
        };

        navigation.navigate("GenApprovedList", {
          id: "2",
          state: { data: updatedPayload },
        });
      }
    } catch (error) {
      console.error("Submit error:", error);
      Alert.alert("Error", "Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Get available waste list
  const getAvailableWasteList = (currentIndex) => {
    if (!formik.values.wastes) return wasteList;
    const selectedValues = formik.values.wastes
      .filter((_, idx) => idx !== currentIndex)
      .map((waste) => waste?.wasteType)
      .filter(Boolean);
    return wasteList.filter((item) => !selectedValues.includes(item));
  };

  // Show all transporters
  const showAllTransporters = () => {
    navigation.navigate("GenApprovedList", { id: "transporters" });
  };

  // Fetch route from OSRM
  const fetchRoute = async (startLat, startLng, endLat, endLng, routeId) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson&steps=true`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.code === "Ok" && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map((coord) => ({
          lat: coord[1],
          lng: coord[0],
        }));

        // Extract directions/instructions
        const instructions = [];
        if (route.legs && route.legs.length > 0) {
          route.legs[0].steps.forEach((step, index) => {
            const distance = (step.distance / 1000).toFixed(1);
            const time = Math.round(step.duration / 60);
            instructions.push({
              text: step.maneuver.instruction || `Step ${index + 1}`,
              distance: step.distance > 0 ? `${distance} km` : "",
              time: step.duration > 0 ? `${time} mins` : "",
              road: step.name || "",
            });
          });
        }

        const distanceKm = route.distance / 1000;
        const timeMin = Math.round(route.duration / 60);

        return {
          id: routeId,
          coordinates: coordinates,
          distance: distanceKm.toFixed(2),
          time: timeMin,
          distanceString: `${distanceKm.toFixed(2)} km`,
          timeString: `${Math.floor(timeMin / 60)}h ${timeMin % 60}m`,
          directions:
            instructions.length > 0
              ? instructions
              : [
                  { text: "Start Location", distance: "", time: "" },
                  { text: "Destination", distance: "", time: "" },
                ],
          color: routeColors[routeId - 1] || routeColors[0],
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching route:", error);
      return null;
    }
  };

  // Generate routes with real road routing
  const generateRoutes = async () => {
    setMapLoading(true);
    setMapLoaded(false);

    // Fetch main route
    const mainRoute = await fetchRoute(startLat, startLng, endLat, endLng, 1);

    // Fetch alternative routes with different waypoints
    const midLat = (startLat + endLat) / 2;
    const midLng = (startLng + endLng) / 2;

    // Route 2: Via a point slightly off the direct path
    const viaLat1 = midLat + 0.03;
    const viaLng1 = midLng;
    const route2Data = await fetchRoute(
      startLat,
      startLng,
      viaLat1,
      viaLng1,
      2,
    );
    let route2 = null;
    if (route2Data) {
      const route2Full = await fetchRoute(viaLat1, viaLng1, endLat, endLng, 2);
      if (route2Full) {
        // Combine the two routes
        route2 = {
          ...route2Full,
          coordinates: [...route2Data.coordinates, ...route2Full.coordinates],
          distance: (
            parseFloat(route2Data.distance) + parseFloat(route2Full.distance)
          ).toFixed(2),
          time: route2Data.time + route2Full.time,
          distanceString: `${(parseFloat(route2Data.distance) + parseFloat(route2Full.distance)).toFixed(2)} km`,
          timeString: `${Math.floor((route2Data.time + route2Full.time) / 60)}h ${(route2Data.time + route2Full.time) % 60}m`,
          directions: [...route2Data.directions, ...route2Full.directions],
          color: routeColors[1],
          id: 2,
        };
      }
    }

    // Route 3: Via different waypoints
    const viaLat2 = midLat - 0.04;
    const viaLng2 = midLng + 0.03;
    const route3Data = await fetchRoute(
      startLat,
      startLng,
      viaLat2,
      viaLng2,
      3,
    );
    let route3 = null;
    if (route3Data) {
      const route3Full = await fetchRoute(viaLat2, viaLng2, endLat, endLng, 3);
      if (route3Full) {
        route3 = {
          ...route3Full,
          coordinates: [...route3Data.coordinates, ...route3Full.coordinates],
          distance: (
            parseFloat(route3Data.distance) + parseFloat(route3Full.distance)
          ).toFixed(2),
          time: route3Data.time + route3Full.time,
          distanceString: `${(parseFloat(route3Data.distance) + parseFloat(route3Full.distance)).toFixed(2)} km`,
          timeString: `${Math.floor((route3Data.time + route3Full.time) / 60)}h ${(route3Data.time + route3Full.time) % 60}m`,
          directions: [...route3Data.directions, ...route3Full.directions],
          color: routeColors[2],
          id: 3,
        };
      }
    }

    // Use main route if available, otherwise use dummy
    const finalRoutes = [];

    if (mainRoute) {
      finalRoutes.push(mainRoute);
    } else {
      // Fallback to dummy route
      const distanceKm =
        calculateDistance(startLat, startLng, endLat, endLng) / 1000 || 10;
      finalRoutes.push({
        id: 1,
        color: routeColors[0],
        distance: distanceKm.toFixed(2),
        time: Math.round((distanceKm / 40) * 60),
        distanceString: `${distanceKm.toFixed(2)} km`,
        timeString: `${Math.round((distanceKm / 40) * 60)} mins`,
        directions: [
          { text: "Start Location", distance: "", time: "" },
          { text: "Destination", distance: "", time: "" },
        ],
        startAddress: "Generator Location",
        endAddress: "Receiver Location",
        coordinates: [
          { lat: startLat, lng: startLng },
          { lat: (startLat + endLat) / 2, lng: (startLng + endLng) / 2 },
          { lat: endLat, lng: endLng },
        ],
      });
    }

    if (route2) {
      finalRoutes.push(route2);
    } else {
      // Fallback dummy for route 2
      const distanceKm =
        calculateDistance(startLat, startLng, endLat, endLng) / 1000 || 10;
      finalRoutes.push({
        id: 2,
        color: routeColors[1],
        distance: (distanceKm * 1.15 + 5).toFixed(2),
        time: Math.round(((distanceKm * 1.15 + 5) / 35) * 60),
        distanceString: `${(distanceKm * 1.15 + 5).toFixed(2)} km`,
        timeString: `${Math.round(((distanceKm * 1.15 + 5) / 35) * 60)} mins`,
        directions: [
          { text: "Start Location", distance: "", time: "" },
          { text: "Via Point 1", distance: "", time: "" },
          { text: "Destination", distance: "", time: "" },
        ],
        startAddress: "Generator Location",
        endAddress: "Receiver Location",
        coordinates: [
          { lat: startLat, lng: startLng },
          { lat: (startLat + endLat) / 2 + 0.02, lng: (startLng + endLng) / 2 },
          { lat: endLat, lng: endLng },
        ],
      });
    }

    if (route3) {
      finalRoutes.push(route3);
    } else {
      // Fallback dummy for route 3
      const distanceKm =
        calculateDistance(startLat, startLng, endLat, endLng) / 1000 || 10;
      finalRoutes.push({
        id: 3,
        color: routeColors[2],
        distance: (distanceKm * 1.3 + 10).toFixed(2),
        time: Math.round(((distanceKm * 1.3 + 10) / 30) * 60),
        distanceString: `${(distanceKm * 1.3 + 10).toFixed(2)} km`,
        timeString: `${Math.round(((distanceKm * 1.3 + 10) / 30) * 60)} mins`,
        directions: [
          { text: "Start Location", distance: "", time: "" },
          { text: "Via Point 1", distance: "", time: "" },
          { text: "Via Point 2", distance: "", time: "" },
          { text: "Destination", distance: "", time: "" },
        ],
        startAddress: "Generator Location",
        endAddress: "Receiver Location",
        coordinates: [
          { lat: startLat, lng: startLng },
          {
            lat: (startLat + endLat) / 2 + 0.04,
            lng: (startLng + endLng) / 2 - 0.02,
          },
          {
            lat: (startLat + endLat) / 2 - 0.02,
            lng: (startLng + endLng) / 2 + 0.03,
          },
          { lat: endLat, lng: endLng },
        ],
      });
    }

    setRoutes(finalRoutes);
    setRouteData(finalRoutes);

    // Set default selection - Route 1
    if (finalRoutes.length > 0) {
      setSelectedRoute(1);
      formik.setFieldValue("selectedRouteNo", "1");
      formik.setFieldValue("totalKms", finalRoutes[0]?.distance || "");
      formik.setFieldValue("estimatedTimeMinutes", finalRoutes[0]?.time || "");
    }

    setMapLoading(false);
    setMapLoaded(true);
    setIsFirstRender(false);
  };

  // Generate Leaflet Map HTML with road routes
  const generateMapHTML = () => {
    if (!startLat || !startLng || !endLat || !endLng) {
      return `<html><body><div style="display:flex;justify-content:center;align-items:center;height:100%;font-family:sans-serif;color:#999;">Map coordinates not available</div></body></html>`;
    }

    const selectedRouteId = selectedRoute || 1;

    // Get the selected route data
    const selectedRouteData = routeData.find(r => r.id === selectedRouteId);
    
    // If no route data, show fallback
    if (!selectedRouteData || !selectedRouteData.coordinates || selectedRouteData.coordinates.length === 0) {
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
            <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
            <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { margin: 0; padding: 0; overflow: hidden; background: #f0f0f0; }
              #map { height: 100vh; width: 100vw; }
            </style>
          </head>
          <body>
            <div id="map"></div>
            <script>
              const map = L.map('map').setView([${(startLat + endLat) / 2}, ${(startLng + endLng) / 2}], 8);
              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap'
              }).addTo(map);
              
              // Add markers
              L.marker([${startLat}, ${startLng}])
                .addTo(map)
                .bindPopup('Start Location');
              L.marker([${endLat}, ${endLng}])
                .addTo(map)
                .bindPopup('Destination');
              
              // Draw simple line
              L.polyline([
                [${startLat}, ${startLng}],
                [${endLat}, ${endLng}]
              ], {
                color: '#2196F3',
                weight: 4,
                opacity: 1
              }).addTo(map);
              
              map.fitBounds([
                [${startLat}, ${startLng}],
                [${endLat}, ${endLng}]
              ], { padding: [50, 50] });
            </script>
          </body>
        </html>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { margin: 0; padding: 0; overflow: hidden; background: #f0f0f0; }
            #map { height: 100vh; width: 100vw; }
            .custom-marker {
              background: transparent;
              border: none;
            }
            .leaflet-control-zoom {
              display: block !important;
            }
            .leaflet-control-attribution {
              font-size: 8px !important;
            }
          </style>
        </head>
        <body>
          <div id="map"></div>
          
          <script>
            // Initialize map
            const map = L.map('map', {
              center: [${(startLat + endLat) / 2}, ${(startLng + endLng) / 2}],
              zoom: 10,
              zoomControl: true,
              attributionControl: true,
            });

            // Add OpenStreetMap tiles
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              maxZoom: 19,
              attribution: '© OpenStreetMap'
            }).addTo(map);

            // Create custom icons
            const startIcon = L.divIcon({
              className: 'custom-marker',
              html: '<div style="background-color: #4CAF50; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 12px; color: white; font-weight: bold;">S</div>',
              iconSize: [28, 28],
              iconAnchor: [14, 14],
            });

            const endIcon = L.divIcon({
              className: 'custom-marker',
              html: '<div style="background-color: #F44336; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 12px; color: white; font-weight: bold;">E</div>',
              iconSize: [28, 28],
              iconAnchor: [14, 14],
            });

            ${
              vehicleLocation
                ? `
              const vehicleIcon = L.divIcon({
                className: 'custom-marker',
                html: '<div style="background-color: #FF9800; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 10px; color: white; font-weight: bold;">V</div>',
                iconSize: [24, 24],
                iconAnchor: [12, 12],
              });
            `
                : ""
            }

            // Add markers
            L.marker([${startLat}, ${startLng}], { icon: startIcon })
              .addTo(map)
              .bindPopup('Start Location');

            L.marker([${endLat}, ${endLng}], { icon: endIcon })
              .addTo(map)
              .bindPopup('Destination');

            ${
              vehicleLocation
                ? `
              L.marker([${vehicleLocation.lat}, ${vehicleLocation.lng}], { icon: vehicleIcon })
                .addTo(map)
                .bindPopup('Vehicle Location');
            `
                : ""
            }

            // Add routes with actual road paths
            const routeData = ${JSON.stringify(
              routeData.map((route) => ({
                id: route.id,
                color: route.color,
                coordinates: route.coordinates || [],
              })),
            )};
            const selectedRouteId = ${selectedRouteId};
            
            // Draw all routes
            routeData.forEach(route => {
              if (!route.coordinates || route.coordinates.length === 0) return;
              
              const isSelected = route.id === selectedRouteId;
              const color = isSelected ? route.color : '#cccccc';
              const weight = isSelected ? 5 : 2;
              const opacity = isSelected ? 1 : 0.4;
              const dashArray = isSelected ? null : '8, 8';
              
              // Convert coordinates to Leaflet format
              const latlngs = route.coordinates.map(coord => [coord.lat, coord.lng]);
              
              L.polyline(latlngs, {
                color: color,
                weight: weight,
                opacity: opacity,
                dashArray: dashArray,
                smoothFactor: 1,
              }).addTo(map);
            });

            // Fit bounds to show all routes
            const allCoords = [];
            routeData.forEach(route => {
              if (route.coordinates && route.coordinates.length > 0) {
                route.coordinates.forEach(coord => {
                  allCoords.push([coord.lat, coord.lng]);
                });
              }
            });
            
            if (allCoords.length > 0) {
              map.fitBounds(allCoords, { padding: [60, 60] });
            } else {
              map.fitBounds([
                [${startLat}, ${startLng}],
                [${endLat}, ${endLng}]
              ], { padding: [60, 60] });
            }

            // Send message to React Native when map is ready
            setTimeout(function() {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage('mapReady');
              }
            }, 500);
          </script>
        </body>
      </html>
    `;
  };

  // Handle WebView messages
  const handleWebViewMessage = (event) => {
    const data = event.nativeEvent.data;
    if (data === "mapReady") {
      setMapLoading(false);
      setMapError(false);
    }
  };

  // Handle WebView error
  const handleWebViewError = () => {
    setMapLoading(false);
    setMapError(true);
  };

  // Initialize
  useEffect(() => {
    getTransporterList();
    generateRoutes();
  }, []);

  // Reload map when routes or selected route changes
  useEffect(() => {
    if (webViewRef.current && routes.length > 0 && !mapLoading) {
      // Reload only if not first render or if selected route changed
      if (!isFirstRender) {
        webViewRef.current.reload();
      }
    }
  }, [routes, selectedRoute, vehicleLocation, mapLoading]);

  // Custom Dropdown Component
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
          onPress={() => !disabled && setShowOptions(true)}
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
                  nestedScrollEnabled={true}
                />
              </View>
            </TouchableOpacity>
          </Modal>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  };

  // Render Route Selection with integrated Leaflet map
  const renderRouteSelection = () => {
    return (
      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Icon name="navigate-outline" size={20} color="#fff" />
          <Text style={[styles.panelHeaderText, { marginLeft: 8 }]}>
            Route Selection
          </Text>
        </View>
        <View style={styles.panelBody}>
          <Text style={styles.routeInfoText}>
            Select the route you prefer to travel the vehicle to reach the
            receiver destination.
          </Text>

          {/* Leaflet Map via WebView */}
          <View style={styles.mapContainer}>
            {mapLoading && (
              <View style={styles.mapLoadingContainer}>
                <ActivityIndicator size="large" color="#2e7d32" />
                <Text style={styles.mapLoadingText}>Loading Routes...</Text>
              </View>
            )}
            {mapError && (
              <View style={styles.mapErrorContainer}>
                <Icon name="alert-circle-outline" size={40} color="#dc3545" />
                <Text style={styles.mapErrorText}>Failed to load map</Text>
                <TouchableOpacity
                  style={styles.mapRetryButton}
                  onPress={() => {
                    setMapError(false);
                    setMapLoading(true);
                    generateRoutes();
                    if (webViewRef.current) {
                      webViewRef.current.reload();
                    }
                  }}
                >
                  <Text style={styles.mapRetryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            )}
            <WebView
              ref={webViewRef}
              source={{ html: generateMapHTML() }}
              style={[styles.webview, mapLoading && { display: "none" }]}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              onMessage={handleWebViewMessage}
              onError={handleWebViewError}
              startInLoadingState={true}
              scalesPageToFit={true}
              originWhitelist={["*"]}
              allowsInlineMediaPlayback={true}
              mixedContentMode="always"
            />
          </View>

          {/* Route Options */}
          {routes.map((route, index) => (
            <View key={route.id} style={styles.routeOption}>
              <TouchableOpacity
                style={styles.routeSelectRow}
                onPress={() => {
                  setSelectedRoute(route.id);
                  formik.setFieldValue("selectedRouteNo", String(route.id));
                  formik.setFieldValue("totalKms", route.distance);
                  formik.setFieldValue(
                    "estimatedTimeMinutes",
                    String(route.time),
                  );
                }}
              >
                <View style={styles.routeRadio}>
                  <View
                    style={[
                      styles.routeRadioOuter,
                      selectedRoute === route.id && styles.routeRadioSelected,
                    ]}
                  >
                    {selectedRoute === route.id && (
                      <View style={styles.routeRadioInner} />
                    )}
                  </View>
                  <View
                    style={[
                      styles.routeColorDot,
                      {
                        backgroundColor:
                          routeColors[index % routeColors.length],
                      },
                    ]}
                  />
                  <Text style={styles.routeLabel}>Route #{route.id}</Text>
                </View>
                <View style={styles.routeDetails}>
                  <Text style={styles.routeDistance}>{route.distance} Kms</Text>
                  <Text style={styles.routeTime}>
                    {(route.time / 60).toFixed(1)} hrs
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.viewDirectionsButton}
                onPress={() => {
                  if (expandedRoute === route.id) {
                    setExpandedRoute(null);
                  } else {
                    setExpandedRoute(route.id);
                  }
                }}
              >
                <Text style={styles.viewDirectionsText}>
                  {expandedRoute === route.id ? "Hide" : "View"} Directions
                </Text>
                <Icon
                  name={
                    expandedRoute === route.id ? "chevron-up" : "chevron-down"
                  }
                  size={16}
                  color="#2e7d32"
                />
              </TouchableOpacity>

              {expandedRoute === route.id && route.directions && (
                <View style={styles.directionsContainer}>
                  <View style={styles.directionHeader}>
                    <Text style={styles.directionTitle}>
                      Route #{route.id} Directions
                    </Text>
                    <Text style={styles.directionDistance}>
                      Distance: {route.distanceString}
                    </Text>
                    <Text style={styles.directionTime}>
                      Time: {route.timeString}
                    </Text>
                  </View>
                  {route.directions.slice(0, 20).map((direction, idx) => (
                    <View key={idx} style={styles.directionItem}>
                      <Text style={styles.directionNumber}>{idx + 1}.</Text>
                      <Text style={styles.directionText}>{direction.text}</Text>
                      {direction.distance && (
                        <Text style={styles.directionMeta}>
                          {direction.distance}
                          {direction.time && ` • ${direction.time}`}
                        </Text>
                      )}
                    </View>
                  ))}
                  {route.directions.length > 20 && (
                    <Text style={styles.directionMore}>
                      + {route.directions.length - 20} more steps
                    </Text>
                  )}
                </View>
              )}

              <View style={styles.divider} />
            </View>
          ))}

          {formik.errors.selectedRouteNo && formik.touched.selectedRouteNo && (
            <Text style={styles.errorText}>
              {formik.errors.selectedRouteNo}
            </Text>
          )}

          <Text style={styles.selectedRouteText}>
            <Text style={styles.selectedRouteLabel}>Selected Route:</Text>{" "}
            {selectedRoute ? `Route #${selectedRoute}` : "Not Selected"}
          </Text>

          <Text style={styles.routeNote}>
            <Text style={styles.bold}>Note:</Text> The vehicle has to be
            travelled on the selected route. If there is any deviation,
            additional KM charges will be adjusted separately.
          </Text>
        </View>
      </View>
    );
  };

  // Render Transporter & Vehicle Selection
  const renderTransporterVehicle = () => {
    const transporterOptions = transporters.map((tt) => ({
      value: tt.registrationcode,
      label: tt.transport_company_name,
    }));

    const vehicleOptions = vehicles.map((vv) => ({
      value: String(vv.vehicle_id),
      label: vv.vehicle_selection,
    }));

    return (
      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Icon name="car-outline" size={20} color="#fff" />
          <Text style={[styles.panelHeaderText, { marginLeft: 8 }]}>
            Transporter & Vehicle Selection
          </Text>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={showAllTransporters}
          >
            <Text style={styles.viewAllButtonText}>VIEW ALL</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.panelBody}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Transport Selection <Text style={styles.star}>*</Text>
            </Text>
            <CustomDropdown
              options={transporterOptions}
              selectedValue={formik.values.transporterSelectionId}
              onSelect={(value) => {
                formik.setFieldValue("transporterSelectionId", value);
                const selectedTransporter = transporters.find(
                  (tt) => tt.registrationcode === value,
                );
                setAddress(selectedTransporter?.address || "");
                setContactNo(selectedTransporter?.mobile_number || "");
                const vehicleList =
                  selectedTransporter?.vehicle_selection || "[]";
                setVehicles(JSON.parse(vehicleList));
              }}
              placeholder="Select Transporter"
              error={formik.errors.transporterSelectionId}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Vehicle Selection <Text style={styles.star}>*</Text>
            </Text>
            <CustomDropdown
              options={vehicleOptions}
              selectedValue={formik.values.vehicleSelectionId}
              onSelect={(value) => {
                formik.setFieldValue("vehicleSelectionId", value);
                getVehicleLocation(value);
              }}
              placeholder="Select Vehicle"
              error={formik.errors.vehicleSelectionId}
            />
          </View>

          {/* Address & Contact Info */}
          {vehicles.length > 0 && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>Address:</Text>{" "}
                {address || "N/A"}
              </Text>
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>Contact No:</Text>{" "}
                {contactNo || "N/A"}
              </Text>
            </View>
          )}

          {/* Vehicle Distance */}
          {vehicleDistance !== null && (
            <View
              style={[
                styles.distanceBox,
                isVehicleTooFar
                  ? styles.distanceBoxDanger
                  : styles.distanceBoxSuccess,
              ]}
            >
              <Text style={styles.distanceText}>
                Distance between Industry and Vehicle:
              </Text>
              <Text
                style={[
                  styles.distanceValue,
                  isVehicleTooFar
                    ? styles.distanceDanger
                    : styles.distanceSuccess,
                ]}
              >
                {(vehicleDistance / 1000).toFixed(2)} km (
                {Math.round(vehicleDistance)} meters)
              </Text>
              {isVehicleTooFar && (
                <View style={styles.distanceWarning}>
                  <Icon name="warning-outline" size={20} color="#dc3545" />
                  <Text style={styles.distanceWarningText}>
                    Vehicle is more than 1000 meters away. Please select a
                    closer vehicle.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Terms */}
          <View style={styles.termsContainer}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() =>
                formik.setFieldValue(
                  "agreedToTerms",
                  !formik.values.agreedToTerms,
                )
              }
            >
              <View
                style={[
                  styles.checkbox,
                  formik.values.agreedToTerms && styles.checkboxChecked,
                ]}
              >
                {formik.values.agreedToTerms && (
                  <Icon name="checkmark" size={16} color="#fff" />
                )}
              </View>
              <Text style={styles.termsText}>
                I agree to the{" "}
                <Text style={styles.termsLink}>Terms & Conditions</Text>
              </Text>
            </TouchableOpacity>
            {formik.errors.agreedToTerms && formik.touched.agreedToTerms && (
              <Text style={styles.errorText}>
                {formik.errors.agreedToTerms}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  // Render Additional Information
  const renderAdditionalInfo = () => {
    const exposureOptions = [
      { value: "", label: "Select" },
      { value: "1", label: "Reactive" },
      { value: "2", label: "Toxic" },
      { value: "3", label: "Flammable" },
      { value: "4", label: "Explosive" },
      { value: "5", label: "Corrosive" },
      { value: "6", label: "Ignitable" },
      { value: "7", label: "Odour compounds" },
      { value: "8", label: "Others" },
    ];

    const firstAidOptions = [
      { value: "", label: "Select" },
      { value: "1", label: "To use safety gloves for emergency handling" },
      { value: "2", label: "Gently flush the eye with cool or lukewarm water" },
      {
        value: "3",
        label: "Get the person into fresh air as soon as possible",
      },
      { value: "4", label: "Loosen any tight clothing at the neck" },
      { value: "5", label: "Prolonged rinsing/washing" },
      {
        value: "6",
        label: "Keep Medical and first-aid kits readily accessible",
      },
      { value: "7", label: "Others" },
    ];

    const fireOptions = [
      { value: "", label: "Select" },
      { value: "1", label: "Spraying of water" },
      { value: "2", label: "Co2 fire extinguisher" },
      { value: "3", label: "Reporting / intimating to the fire department" },
      { value: "4", label: "Intimation to the state pollution control board" },
      { value: "5", label: "Mechanical foam fire extinguisher" },
      { value: "6", label: "Dry chemical powder extinguisher" },
      { value: "7", label: "Mechanical foam & Co2 and Dry chemical powder" },
      { value: "8", label: "Others" },
    ];

    const spillageOptions = [
      { value: "", label: "Select" },
      {
        value: "1",
        label:
          "Immediately intimate to the state pollution control board through telephone, e-mail & report in form 11.",
      },
      {
        value: "2",
        label:
          "Reporting to the nearest police station and also informing to the owner of the goods carriage/ waste generator regarding the accident.",
      },
      { value: "3", label: "Others" },
    ];

    const handlingOptions = [
      { value: "", label: "Select" },
      { value: "1", label: "Use PPE, use hand glove, use helmet" },
      {
        value: "2",
        label: "Use PPE while loading, unloading & Transit handling",
      },
      { value: "3", label: "Others" },
    ];

    return (
      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Icon name="information-circle-outline" size={20} color="#fff" />
          <Text style={[styles.panelHeaderText, { marginLeft: 8 }]}>
            Additional Information
          </Text>
        </View>
        <View style={styles.panelBody}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Exposure Hazards <Text style={styles.star}>*</Text>
            </Text>
            <CustomDropdown
              options={exposureOptions}
              selectedValue={formik.values.exposureHazards}
              onSelect={(value) =>
                formik.setFieldValue("exposureHazards", value)
              }
              placeholder="Select"
              error={formik.errors.exposureHazards}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              First Aid Requirements <Text style={styles.star}>*</Text>
            </Text>
            <CustomDropdown
              options={firstAidOptions}
              selectedValue={formik.values.firstAidRequirements}
              onSelect={(value) =>
                formik.setFieldValue("firstAidRequirements", value)
              }
              placeholder="Select"
              error={formik.errors.firstAidRequirements}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Procedure to be followed in case of fire{" "}
              <Text style={styles.star}>*</Text>
            </Text>
            <CustomDropdown
              options={fireOptions}
              selectedValue={formik.values.fireProcedure}
              onSelect={(value) => formik.setFieldValue("fireProcedure", value)}
              placeholder="Select"
              error={formik.errors.fireProcedure}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Procedure to be followed in case of spillage/accident/explosion{" "}
              <Text style={styles.star}>*</Text>
            </Text>
            <CustomDropdown
              options={spillageOptions}
              selectedValue={formik.values.spillageProcedure}
              onSelect={(value) =>
                formik.setFieldValue("spillageProcedure", value)
              }
              placeholder="Select"
              error={formik.errors.spillageProcedure}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>
              Special Handling Instructions & Additional Information{" "}
              <Text style={styles.star}>*</Text>
            </Text>
            <CustomDropdown
              options={handlingOptions}
              selectedValue={formik.values.specialHandlingInstructions}
              onSelect={(value) =>
                formik.setFieldValue("specialHandlingInstructions", value)
              }
              placeholder="Select"
              error={formik.errors.specialHandlingInstructions}
            />
          </View>
        </View>
      </View>
    );
  };

  // Render Waste Details
  const renderWasteDetails = () => {
    return (
      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Icon name="trash-outline" size={20} color="#fff" />
          <Text style={[styles.panelHeaderText, { marginLeft: 8 }]}>
            Waste Type & Quantity
          </Text>
        </View>
        <View style={styles.panelBody}>
          {formik.values.wastes.map((waste, index) => (
            <View key={index} style={styles.wasteCard}>
              <View style={styles.wasteCardHeader}>
                <Text style={styles.wasteCardTitle}>Waste #{index + 1}</Text>
                {formik.values.wastes.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => {
                      const newWastes = formik.values.wastes.filter(
                        (_, i) => i !== index,
                      );
                      formik.setFieldValue("wastes", newWastes);
                    }}
                  >
                    <Icon name="trash-outline" size={16} color="#fff" />
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Waste Type <Text style={styles.star}>*</Text>
                </Text>
                <CustomDropdown
                  options={getAvailableWasteList(index).map((item) => {
                    const parts = item.split("-");
                    return {
                      value: item,
                      label: `${parts[0]?.trim()} - ${parts[1]?.trim()}`,
                    };
                  })}
                  selectedValue={formik.values.wastes[index]?.wasteType}
                  onSelect={(value) => {
                    const parts = value.split("-");
                    formik.setFieldValue(`wastes.${index}.wasteType`, value);
                    formik.setFieldValue(
                      `wastes.${index}.interestedQty`,
                      parts[1]?.trim() || "",
                    );
                    formik.setFieldValue(
                      `wastes.${index}.generatorApprovalTransactionNumber`,
                      parts[2]?.trim() || "",
                    );
                  }}
                  placeholder="Select Waste Type"
                  error={
                    formik.errors.wastes?.[index]?.wasteType &&
                    formik.touched.wastes?.[index]?.wasteType
                      ? formik.errors.wastes[index].wasteType
                      : null
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Interested Quantity <Text style={styles.star}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={String(
                    formik.values.wastes[index]?.interestedQty || "",
                  )}
                  editable={false}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Quantity to be Dispatched <Text style={styles.star}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={String(
                    formik.values.wastes[index]?.dispatchQty || "",
                  )}
                  onChangeText={(text) =>
                    formik.setFieldValue(`wastes.${index}.dispatchQty`, text)
                  }
                  keyboardType="numeric"
                  maxLength={9}
                  placeholder="Enter quantity"
                />
                {formik.errors.wastes?.[index]?.dispatchQty &&
                  formik.touched.wastes?.[index]?.dispatchQty && (
                    <Text style={styles.errorText}>
                      {formik.errors.wastes[index].dispatchQty}
                    </Text>
                  )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Unit <Text style={styles.star}>*</Text>
                </Text>
                <CustomDropdown
                  options={[
                    { value: "", label: "Select Here" },
                    { value: "1", label: "KL" },
                    { value: "2", label: "Tonnes" },
                  ]}
                  selectedValue={formik.values.wastes[index]?.unit}
                  onSelect={(value) =>
                    formik.setFieldValue(`wastes.${index}.unit`, value)
                  }
                  placeholder="Select"
                  error={
                    formik.errors.wastes?.[index]?.unit &&
                    formik.touched.wastes?.[index]?.unit
                      ? formik.errors.wastes[index].unit
                      : null
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Description of Waste <Text style={styles.star}>*</Text>
                </Text>
                <CustomDropdown
                  options={[
                    { value: "", label: "Select Here" },
                    { value: "1", label: "Explosive" },
                    { value: "2", label: "Ignitable" },
                    { value: "3", label: "Corrosive" },
                    { value: "4", label: "Toxic" },
                    { value: "5", label: "Odour Compounds" },
                    { value: "6", label: "Flammable" },
                  ]}
                  selectedValue={
                    formik.values.wastes[index]?.wasteDescription
                  }
                  onSelect={(value) =>
                    formik.setFieldValue(
                      `wastes.${index}.wasteDescription`,
                      value,
                    )
                  }
                  placeholder="Select"
                  error={
                    formik.errors.wastes?.[index]?.wasteDescription &&
                    formik.touched.wastes?.[index]?.wasteDescription
                      ? formik.errors.wastes[index].wasteDescription
                      : null
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Consistance for waste <Text style={styles.star}>*</Text>
                </Text>
                <CustomDropdown
                  options={[
                    { value: "", label: "Select Here" },
                    { value: "1", label: "Solid" },
                    { value: "2", label: "Semi Solid" },
                    { value: "3", label: "Sludge" },
                    { value: "4", label: "Oily" },
                    { value: "5", label: "Tarry" },
                    { value: "6", label: "Slurry" },
                    { value: "7", label: "Liquid" },
                  ]}
                  selectedValue={
                    formik.values.wastes[index]?.wasteConsistency
                  }
                  onSelect={(value) =>
                    formik.setFieldValue(
                      `wastes.${index}.wasteConsistency`,
                      value,
                    )
                  }
                  placeholder="Select"
                  error={
                    formik.errors.wastes?.[index]?.wasteConsistency &&
                    formik.touched.wastes?.[index]?.wasteConsistency
                      ? formik.errors.wastes[index].wasteConsistency
                      : null
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  PH <Text style={styles.star}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={String(formik.values.wastes[index]?.ph || "")}
                  onChangeText={(text) =>
                    formik.setFieldValue(`wastes.${index}.ph`, text)
                  }
                  keyboardType="numeric"
                  placeholder="Enter PH"
                />
                {formik.errors.wastes?.[index]?.ph &&
                  formik.touched.wastes?.[index]?.ph && (
                    <Text style={styles.errorText}>
                      {formik.errors.wastes[index].ph}
                    </Text>
                  )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Calorific Value <Text style={styles.star}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={String(
                    formik.values.wastes[index]?.calorificValue || "",
                  )}
                  onChangeText={(text) =>
                    formik.setFieldValue(
                      `wastes.${index}.calorificValue`,
                      text,
                    )
                  }
                  keyboardType="numeric"
                  placeholder="Calorific Value"
                />
                {formik.errors.wastes?.[index]?.calorificValue &&
                  formik.touched.wastes?.[index]?.calorificValue && (
                    <Text style={styles.errorText}>
                      {formik.errors.wastes[index].calorificValue}
                    </Text>
                  )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Type of Package <Text style={styles.star}>*</Text>
                </Text>
                <CustomDropdown
                  options={[
                    { value: "", label: "Select Here" },
                    { value: "1", label: "Container" },
                    { value: "2", label: "Drum" },
                    { value: "3", label: "Bags" },
                  ]}
                  selectedValue={formik.values.wastes[index]?.packageType}
                  onSelect={(value) =>
                    formik.setFieldValue(`wastes.${index}.packageType`, value)
                  }
                  placeholder="Select"
                  error={
                    formik.errors.wastes?.[index]?.packageType &&
                    formik.touched.wastes?.[index]?.packageType
                      ? formik.errors.wastes[index].packageType
                      : null
                  }
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  No of Package <Text style={styles.star}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={String(formik.values.wastes[index]?.noOfPackage || "")}
                  onChangeText={(text) =>
                    formik.setFieldValue(`wastes.${index}.noOfPackage`, text)
                  }
                  keyboardType="numeric"
                  maxLength={9}
                  placeholder="Enter No Package"
                />
                {formik.errors.wastes?.[index]?.noOfPackage &&
                  formik.touched.wastes?.[index]?.noOfPackage && (
                    <Text style={styles.errorText}>
                      {formik.errors.wastes[index].noOfPackage}
                    </Text>
                  )}
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={styles.addWasteButton}
            onPress={() => {
              const newWaste = {
                wasteType: "",
                interestedQty: "",
                dispatchQty: "",
                unit: "",
                wasteDescription: "",
                wasteConsistency: "",
                ph: "",
                calorificValue: "",
                packageType: "",
                noOfPackage: "",
              };
              formik.setFieldValue("wastes", [
                ...formik.values.wastes,
                newWaste,
              ]);
            }}
          >
            <Icon name="add-circle" size={20} color="#fff" />
            <Text style={styles.addWasteButtonText}>Add Another Waste</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // If vehicle is too far, hide additional fields
  const showAdditionalFields = !isVehicleTooFar;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
        >
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Icon name="arrow-back" size={24} color="#1e3a5f" />
              </TouchableOpacity>
              <Icon name="car-outline" size={24} color="#1e3a5f" />
              <Text style={styles.cardTitle}>
                Transport - Vehicle Selection
              </Text>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.panel}>
                <View style={styles.panelHeader}>
                  <Text style={styles.panelHeaderText}>{CONTEXT_HEADING}</Text>
                </View>
                <View style={styles.panelBody}>
                  {/* Waste Details */}
                  <View style={styles.detailSection}>
                    <View style={styles.detailHeader}>
                      <Icon name="trash-outline" size={18} color="#2e7d32" />
                      <Text style={styles.detailTitle}>
                        {rowData?.wasteTypeName || "Waste"} Waste Details
                      </Text>
                    </View>
                    <View style={styles.detailCard}>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Process:</Text>{" "}
                        {rowData?.processName || "N/A"}
                      </Text>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>
                          Total Quantity Available:
                        </Text>{" "}
                        {rowData?.pendingDispatch || "0"} Tonnes
                      </Text>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Stream:</Text>{" "}
                        {rowData?.streamName || "N/A"}
                      </Text>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Name of Waste:</Text>{" "}
                        {rowData?.wasteName || "N/A"}
                      </Text>
                    </View>
                  </View>

                  {/* Receiver Details */}
                  <View style={styles.detailSection}>
                    <View style={styles.detailHeader}>
                      <Icon name="person-outline" size={18} color="#2e7d32" />
                      <Text style={styles.detailTitle}>Receiver Details</Text>
                    </View>
                    <View style={styles.detailCard}>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Company Name:</Text>{" "}
                        {rowData?.receiverName || "N/A"}
                      </Text>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>
                          Industry Address:
                        </Text>{" "}
                        {rowData?.industryAddress || "N/A"}
                      </Text>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Pincode:</Text>{" "}
                        {rowData?.pinCode || "N/A"}
                      </Text>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Receiver Type:</Text>{" "}
                        {rowData?.wasteType || "N/A"}
                      </Text>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>
                          Authorized Person:
                        </Text>{" "}
                        {rowData?.authorizedPerson || "N/A"}
                      </Text>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Email:</Text>{" "}
                        {rowData?.authorizedPersonEmail || "N/A"}
                      </Text>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>Mobile:</Text>{" "}
                        {rowData?.authorizedPersonMobile || "N/A"}
                      </Text>
                      <Text style={styles.detailText}>
                        <Text style={styles.detailLabel}>GST:</Text>{" "}
                        {rowData?.gstNumber || "N/A"}
                      </Text>
                    </View>
                  </View>

                  {/* Route Selection */}
                  {renderRouteSelection()}

                  {/* Transporter & Vehicle */}
                  {renderTransporterVehicle()}

                  {/* Additional Information - Only show if vehicle is not too far */}
                  {showAdditionalFields && renderAdditionalInfo()}

                  {/* Waste Details - Only show if vehicle is not too far */}
                  {showAdditionalFields && renderWasteDetails()}

                  {/* Submit Button */}
                  {showAdditionalFields && (
                    <TouchableOpacity
                      style={styles.submitButton}
                      onPress={formik.handleSubmit}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.submitButtonText}>Submit</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
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
  backButton: {
    position: "absolute",
    left: 16,
    padding: 4,
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
    flexDirection: "row",
    alignItems: "center",
  },
  panelHeaderText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  panelBody: {
    padding: 16,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e8f5e9",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2e7d32",
    marginLeft: 8,
  },
  detailCard: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 8,
  },
  detailText: {
    fontSize: 13,
    color: "#333",
    paddingVertical: 3,
  },
  detailLabel: {
    fontWeight: "600",
  },
  mapContainer: {
    height: 300,
    borderRadius: 8,
    overflow: "hidden",
    marginVertical: 12,
    backgroundColor: "#f0f0f0",
    position: "relative",
  },
  webview: {
    flex: 1,
  },
  mapLoadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    zIndex: 10,
  },
  mapLoadingText: {
    marginTop: 10,
    color: "#666",
    fontSize: 14,
  },
  mapErrorContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    zIndex: 10,
  },
  mapErrorText: {
    marginTop: 8,
    color: "#dc3545",
    fontSize: 16,
    fontWeight: "500",
  },
  mapRetryButton: {
    marginTop: 12,
    backgroundColor: "#2e7d32",
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
  },
  mapRetryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  routeInfoText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
  },
  routeOption: {
    marginBottom: 8,
  },
  routeSelectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  routeRadio: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  routeRadioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  routeRadioSelected: {
    borderColor: "#2e7d32",
  },
  routeRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2e7d32",
  },
  routeColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  routeLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  routeDetails: {
    flexDirection: "row",
    alignItems: "center",
  },
  routeDistance: {
    fontSize: 13,
    color: "#333",
    marginRight: 12,
  },
  routeTime: {
    fontSize: 13,
    color: "#666",
  },
  viewDirectionsButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  viewDirectionsText: {
    fontSize: 12,
    color: "#2e7d32",
    fontWeight: "500",
  },
  directionsContainer: {
    marginTop: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    backgroundColor: "#f9f9f9",
  },
  directionHeader: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  directionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  directionDistance: {
    fontSize: 12,
    color: "#666",
  },
  directionTime: {
    fontSize: 12,
    color: "#666",
  },
  directionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 2,
  },
  directionNumber: {
    width: 24,
    fontSize: 12,
    color: "#666",
  },
  directionText: {
    flex: 1,
    fontSize: 12,
    color: "#333",
  },
  directionMeta: {
    fontSize: 10,
    color: "#888",
  },
  directionMore: {
    fontSize: 11,
    color: "#666",
    fontStyle: "italic",
    paddingVertical: 4,
    paddingLeft: 28,
  },
  selectedRouteText: {
    fontSize: 14,
    marginVertical: 8,
  },
  selectedRouteLabel: {
    fontWeight: "bold",
  },
  routeNote: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  bold: {
    fontWeight: "bold",
  },
  divider: {
    height: 1,
    backgroundColor: "#e8ecf1",
    marginVertical: 8,
  },
  viewAllButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  viewAllButtonText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "500",
  },
  infoBox: {
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#333",
    paddingVertical: 2,
  },
  infoLabel: {
    fontWeight: "600",
  },
  distanceBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 8,
  },
  distanceBoxSuccess: {
    backgroundColor: "#d4edda",
    borderColor: "#28a745",
  },
  distanceBoxDanger: {
    backgroundColor: "#f8d7da",
    borderColor: "#dc3545",
  },
  distanceText: {
    fontSize: 13,
    color: "#333",
  },
  distanceValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  distanceSuccess: {
    color: "#28a745",
  },
  distanceDanger: {
    color: "#dc3545",
  },
  distanceWarning: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  distanceWarningText: {
    fontSize: 12,
    color: "#dc3545",
    marginLeft: 4,
    flex: 1,
  },
  termsContainer: {
    marginVertical: 8,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#ced4da",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: "#2e7d32",
    borderColor: "#2e7d32",
  },
  termsText: {
    fontSize: 14,
    color: "#333",
  },
  termsLink: {
    color: "#2e7d32",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  wasteCard: {
    borderWidth: 1,
    borderColor: "#e8ecf1",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  wasteCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  wasteCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dc3545",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  removeButtonText: {
    color: "#fff",
    fontSize: 11,
    marginLeft: 4,
  },
  addWasteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2e7d32",
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  addWasteButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
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
  inputDisabled: {
    backgroundColor: "#f0f0f0",
  },
  errorText: {
    color: "#dc3545",
    fontSize: 12,
    marginTop: 4,
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
    maxHeight: "70%",
    minHeight: 200,
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

export default TransportVehicleSelection;