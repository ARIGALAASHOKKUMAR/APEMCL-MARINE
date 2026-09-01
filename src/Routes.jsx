import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "./screens/HomeScreen";
import { persistedStore, store } from "./reducers/allReducers";
import SessionChecking from "./sitelayout/SessionChecking";
import SiteLayout from "./sitelayout/SiteLayout";
import ChangePassword from "./sitelayout/ChangePassword";
import ProfileUpdate from "./sitelayout/ProfileUpdate";
import ModalPopup from "./sitelayout/ModalPopup";
import Overlay from "./sitelayout/Overlay";
import { ToastProvider } from "react-native-sprinkle-toast";

import GenerateQrCode from "./screens/GenerateQrCode";
import AssignQrcode from "./screens/AssignQrcode";
import Posting from "./screens/Posting";
import DischargeSummary from "./screens/DischargeScreen";
import AnalysisReport from "./screens/AnalysisReport";
import EditRequests from "./screens/EditRequests";
import LoginCommon from "./screens/LoginCommon";
import LabAnalysis from "./screens/LabAnalysis";
import Activities from "./screens/Activities";
import Notices from "./screens/Notices";
import MasterDataAddVehicleTypes from "./screens/MasterDataAddVehicleTypes";
import OpenRegistrations from "./screens/OpenRegistrations";
import ManagePermittedQuantity from "./screens/ManagePermittedQuantity";
import AddWasteDisposal from "./screens/AddWasteDisposal";
import RecentWasteDisposalList from "./screens/RecentWasteDisposalList";
import InterestedWasteList from "./screens/InterestedWasteList";
import GenApprovedList from "./screens/GenApprovedList";
import TransportVehicleSelection from "./screens/TransportVehicleSelection";
import TransportersList from "./screens/TransportersList";
import RegistrationPayment from "./screens/RegistrationPayment";
import ManifestConfirmation from "./screens/ManifestConfirmation";
import TransportAcknowledgement from "./screens/TransportAcknowledgement";
// import TransportRejected from "./screens/TransportRejected";
// import WebViewScreen from "./screens/WebViewScreen";
// import PaymentScreen from "./screens/PaymentScreen";

const Stack = createNativeStackNavigator();

export default function Routes() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistedStore}>
        <ToastProvider>
          <NavigationContainer>
            <ModalPopup />
            <Overlay />
            <Stack.Navigator
              initialRouteName="Login"
              screenOptions={{ headerShown: false }}
            >
              {/* Login Screen */}
              <Stack.Screen name="Login" component={LoginCommon} />

              <Stack.Screen name="WebViewScreen">
                {(props) => (
                  <SiteLayout
                    navigation={props.navigation}
                    currentScreenName="WebViewScreen"
                  >
                    <WebViewScreen {...props} />
                  </SiteLayout>
                )}
              </Stack.Screen>

              <Stack.Screen name="ProfileUpdate">
                {(props) => (
                  <SiteLayout
                    navigation={props.navigation}
                    currentScreenName="ProfileUpdate"
                  >
                    <ProfileUpdate {...props} />
                  </SiteLayout>
                )}
              </Stack.Screen>

              <Stack.Screen name="ChangePassword">
                {(props) => (
                  <SiteLayout
                    navigation={props.navigation}
                    currentScreenName="ChangePassword"
                  >
                    <PaymentScreen {...props} />
                  </SiteLayout>
                )}
              </Stack.Screen>

              <Stack.Screen name="HOME">
                {(props) => (
                  <SessionChecking navigation={props.navigation}>
                    <SiteLayout
                      navigation={props.navigation}
                      currentScreenName="HOME"
                      scrollEnabled={false}
                    >
                      <HomeScreen {...props} />
                    </SiteLayout>
                  </SessionChecking>
                )}
              </Stack.Screen>

              <Stack.Screen name="GenerateQrCode">
                {(props) => (
                  <SessionChecking navigation={props.navigation}>
                    <SiteLayout
                      navigation={props.navigation}
                      currentScreenName="GenerateQrCode"
                      scrollEnabled={false}
                    >
                      <GenerateQrCode {...props} />
                    </SiteLayout>
                  </SessionChecking>
                )}
              </Stack.Screen>

              <Stack.Screen name="SampleCollectionRequests">
                {(props) => (
                  <SessionChecking navigation={props.navigation}>
                    <SiteLayout
                      navigation={props.navigation}
                      currentScreenName="SampleCollectionRequests"
                      scrollEnabled={false}
                    >
                      <AssignQrcode {...props} />
                    </SiteLayout>
                  </SessionChecking>
                )}
              </Stack.Screen>

              <Stack.Screen name="DischargeSummary">
                {(props) => (
                  <SessionChecking navigation={props.navigation}>
                    <SiteLayout
                      navigation={props.navigation}
                      currentScreenName="DischargeSummary"
                      scrollEnabled={false}
                    >
                      <DischargeSummary {...props} />
                    </SiteLayout>
                  </SessionChecking>
                )}
              </Stack.Screen>

              <Stack.Screen name="Notices">
                {(props) => (
                  <SessionChecking navigation={props.navigation}>
                    <SiteLayout
                      navigation={props.navigation}
                      currentScreenName="Notices"
                      scrollEnabled={false}
                    >
                      <Notices {...props} />
                    </SiteLayout>
                  </SessionChecking>
                )}
              </Stack.Screen>

              <Stack.Screen name="AnalysisReports">
                {(props) => (
                  <SessionChecking navigation={props.navigation}>
                    <SiteLayout
                      navigation={props.navigation}
                      currentScreenName="SampleCollectionRequests"
                      scrollEnabled={false}
                    >
                      <AnalysisReport {...props} />
                    </SiteLayout>
                  </SessionChecking>
                )}
              </Stack.Screen>

              <Stack.Screen name="AnalysisReport">
                {(props) => (
                  <SessionChecking navigation={props.navigation}>
                    <SiteLayout
                      navigation={props.navigation}
                      currentScreenName="AnalysisReport"
                      scrollEnabled={false}
                    >
                      <LabAnalysis {...props} />
                    </SiteLayout>
                  </SessionChecking>
                )}
              </Stack.Screen>

              <Stack.Screen name="Activities">
                {(props) => (
                  <SessionChecking navigation={props.navigation}>
                    <SiteLayout
                      navigation={props.navigation}
                      currentScreenName="Activities"
                      scrollEnabled={false}
                    >
                      <Activities {...props} />
                    </SiteLayout>
                  </SessionChecking>
                )}
              </Stack.Screen>

              <Stack.Screen name="EditRequests">
                {(props) => (
                  <SessionChecking navigation={props.navigation}>
                    <SiteLayout
                      navigation={props.navigation}
                      currentScreenName="SampleCollectionRequests"
                      scrollEnabled={false}
                    >
                      <EditRequests {...props} />
                    </SiteLayout>
                  </SessionChecking>
                )}
              </Stack.Screen>

              <Stack.Screen name="Posting">
                {(props) => (
                  <SessionChecking navigation={props.navigation}>
                    <SiteLayout
                      navigation={props.navigation}
                      currentScreenName="Posting"
                      scrollEnabled={false}
                    >
                      <Posting {...props} />
                    </SiteLayout>
                  </SessionChecking>
                )}
              </Stack.Screen>

              <Stack.Screen name="MasterDataAddVehicleTypes">
                {(props) => (
                  <SessionChecking navigation={props.navigation}>
                    <SiteLayout
                      navigation={props.navigation}
                      currentScreenName="MasterDataAddVehicleTypes"
                      scrollEnabled={false}
                    >
                      <MasterDataAddVehicleTypes {...props} />
                    </SiteLayout>
                  </SessionChecking>
                )}
              </Stack.Screen>

              <Stack.Screen name="OpenRegistrations">
                {(props) => (
                  <SessionChecking navigation={props.navigation}>
                    <SiteLayout
                      navigation={props.navigation}
                      currentScreenName="OpenRegistrations"
                      scrollEnabled={false}
                    >
                      <OpenRegistrations {...props} />
                    </SiteLayout>
                  </SessionChecking>
                )}
              </Stack.Screen>

              <Stack.Screen name="ManagePermittedQuantity">
                {(props) => (
                  <SessionChecking navigation={props.navigation}>
                    <SiteLayout
                      navigation={props.navigation}
                      currentScreenName="ManagePermittedQuantity"
                      scrollEnabled={false}
                    >
                      <ManagePermittedQuantity {...props} />
                    </SiteLayout>
                  </SessionChecking>
                )}
              </Stack.Screen>

              <Stack.Screen name="AddWasteDisposal">
                {(props) => (
                  <SessionChecking navigation={props.navigation}>
                    <SiteLayout
                      navigation={props.navigation}
                      currentScreenName="AddWasteDisposal"
                      scrollEnabled={false}
                    >
                      <AddWasteDisposal {...props} />
                    </SiteLayout>
                  </SessionChecking>
                )}
              </Stack.Screen>

              <Stack.Screen name="RecentWasteDisposalList">
                {(props) => (
                  <SessionChecking navigation={props.navigation}>
                    <SiteLayout
                      navigation={props.navigation}
                      currentScreenName="RecentWasteDisposalList"
                      scrollEnabled={false}
                    >
                      <RecentWasteDisposalList {...props} />
                    </SiteLayout>
                  </SessionChecking>
                )}
              </Stack.Screen>

              <Stack.Screen name="InterestedWasteList">
                {(props) => (
                  <SessionChecking navigation={props.navigation}>
                    <SiteLayout
                      navigation={props.navigation}
                      currentScreenName="InterestedWasteList"
                      scrollEnabled={false}
                    >
                      <InterestedWasteList {...props} />
                    </SiteLayout>
                  </SessionChecking>
                )}
              </Stack.Screen>

              <Stack.Screen name="GenApprovedList">
                {(props) => (
                  <SessionChecking navigation={props.navigation}>
                    <SiteLayout
                      navigation={props.navigation}
                      currentScreenName="GenApprovedList"
                      scrollEnabled={false}
                    >
                      <GenApprovedList {...props} />
                    </SiteLayout>
                  </SessionChecking>
                )}
              </Stack.Screen>

              <Stack.Screen name="TransportVehicleSelection">
                {(props) => (
                  <SessionChecking navigation={props.navigation}>
                    <SiteLayout
                      navigation={props.navigation}
                      currentScreenName="TransportVehicleSelection"
                      scrollEnabled={false}
                    >
                      <TransportVehicleSelection {...props} />
                    </SiteLayout>
                  </SessionChecking>
                )}
              </Stack.Screen>

              <Stack.Screen name="TransportersList">
                {(props) => (
                  <SessionChecking navigation={props.navigation}>
                    <SiteLayout
                      navigation={props.navigation}
                      currentScreenName="TransportersList"
                      scrollEnabled={false}
                    >
                      <TransportersList {...props} />
                    </SiteLayout>
                  </SessionChecking>
                )}
              </Stack.Screen>

              <Stack.Screen name="RegistrationPayment">
                {(props) => (
                  <SessionChecking navigation={props.navigation}>
                    <SiteLayout
                      navigation={props.navigation}
                      currentScreenName="RegistrationPayment"
                      scrollEnabled={false}
                    >
                      <RegistrationPayment {...props} />
                    </SiteLayout>
                  </SessionChecking>
                )}
              </Stack.Screen>

              <Stack.Screen name="ManifestConfirmation">
                {(props) => (
                  <SessionChecking navigation={props.navigation}>
                    <SiteLayout
                      navigation={props.navigation}
                      currentScreenName="ManifestConfirmation"
                      scrollEnabled={false}
                    >
                      <ManifestConfirmation {...props} />
                    </SiteLayout>
                  </SessionChecking>
                )}
              </Stack.Screen>

              {/* Transport Acknowledgement Screens */}
              {/* Pending List */}
              <Stack.Screen name="PendingList">
                {(props) => (
                  <SessionChecking navigation={props.navigation}>
                    <SiteLayout
                      navigation={props.navigation}
                      currentScreenName="PendingList"
                      scrollEnabled={false}
                    >
                      <TransportAcknowledgement 
                        {...props} 
                        screenType="PendingList"
                        path="/PendingList"
                      />
                    </SiteLayout>
                  </SessionChecking>
                )}
              </Stack.Screen>

              {/* Accepted List */}
              <Stack.Screen name="AcceptedList">
                {(props) => (
                  <SessionChecking navigation={props.navigation}>
                    <SiteLayout
                      navigation={props.navigation}
                      currentScreenName="AcceptedList"
                      scrollEnabled={false}
                    >
                      <TransportAcknowledgement 
                        {...props} 
                        screenType="AcceptedList"
                        path="/AcceptedList"
                      />
                    </SiteLayout>
                  </SessionChecking>
                )}
              </Stack.Screen>

              {/* Rejected List */}
              <Stack.Screen name="RejectedList">
                {(props) => (
                  <SessionChecking navigation={props.navigation}>
                    <SiteLayout
                      navigation={props.navigation}
                      currentScreenName="RejectedList"
                      scrollEnabled={false}
                    >
                      <TransportAcknowledgement 
                        {...props} 
                        screenType="RejectedList"
                        path="/RejectedList"
                      />
                    </SiteLayout>
                  </SessionChecking>
                )}
              </Stack.Screen>

              {/* Manifest List */}
              <Stack.Screen name="ManifestList">
                {(props) => (
                  <SessionChecking navigation={props.navigation}>
                    <SiteLayout
                      navigation={props.navigation}
                      currentScreenName="ManifestList"
                      scrollEnabled={false}
                    >
                      <TransportAcknowledgement 
                        {...props} 
                        screenType="ManifestList"
                        path="/ManifestList"
                      />
                    </SiteLayout>
                  </SessionChecking>
                )}
              </Stack.Screen>

              {/* Transport Rejected Screen */}
              <Stack.Screen name="TransportRejected">
                {(props) => (
                  <SessionChecking navigation={props.navigation}>
                    <SiteLayout
                      navigation={props.navigation}
                      currentScreenName="TransportRejected"
                      scrollEnabled={false}
                    >
                      <TransportRejected {...props} />
                    </SiteLayout>
                  </SessionChecking>
                )}
              </Stack.Screen>

              {/* Confirmation Required */}
              <Stack.Screen name="ConfirmationRequired">
                {(props) => (
                  <SessionChecking navigation={props.navigation}>
                    <SiteLayout
                      navigation={props.navigation}
                      currentScreenName="ConfirmationRequired"
                      scrollEnabled={false}
                    >
                      <ConfirmationRequired {...props} />
                    </SiteLayout>
                  </SessionChecking>
                )}
              </Stack.Screen>

              {/* Effluent Pipeline Discharge */}
              <Stack.Screen name="EffluentPipelineDischarge">
                {(props) => (
                  <SessionChecking navigation={props.navigation}>
                    <SiteLayout
                      navigation={props.navigation}
                      currentScreenName="EffluentPipelineDischarge"
                      scrollEnabled={false}
                    >
                      <EffluentPipelineDischarge {...props} />
                    </SiteLayout>
                  </SessionChecking>
                )}
              </Stack.Screen>

              {/* List Marine Discharges */}
              <Stack.Screen name="ListMarineDischarges">
                {(props) => (
                  <SessionChecking navigation={props.navigation}>
                    <SiteLayout
                      navigation={props.navigation}
                      currentScreenName="ListMarineDischarges"
                      scrollEnabled={false}
                    >
                      <ListMarineDischarges {...props} />
                    </SiteLayout>
                  </SessionChecking>
                )}
              </Stack.Screen>

            </Stack.Navigator>
          </NavigationContainer>
        </ToastProvider>
      </PersistGate>
    </Provider>
  );
}