import axios from "axios";
import { Alert } from "react-native";
import { store } from "../reducers/allReducers";
import { useDispatch } from "react-redux";
import { hideLoader, hideMessage, showLoader, showMessage } from "../actions";
import { Toast } from "react-native-sprinkle-toast";

export const base_url = "https://swapi.dev.nidhi.apcfss.in/apemcl";
export const IMG_UPLOAD_URL =
  "https://swapi.dev.nidhi.apcfss.in/socialwelfaredms/user-defined-path/file-upload/";
export const IMG_DOWNLOAD_URL =
  "https://swapi.dev.nidhi.apcfss.in/socialwelfaredms/user-defined-path/file-download/";

const state = store.getState();
const accessToken = state.LoginReducer.token;

export const myAxios = axios.create({
  baseURL: base_url,
  headers: {
    // Authorization: accessToken ? `Bearer ${accessToken}` : "",
  },
});

export const myAxiosLogin = axios.create({
  baseURL: base_url,
  headers: {},
});

myAxios.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const accessToken = state.LoginReducer.token;
    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

const getCurrentTimestamp = () => {
  const now = new Date();

  // This MAY or MAY NOT respect the timezone in React Native
  // It depends on the JavaScript engine (Hermes, JSC, V8)
  const date = now.toLocaleDateString("en-GB", { timeZone: "Asia/Kolkata" });
  const time = now.toLocaleTimeString("en-US", {
    timeZone: "Asia/Kolkata",
    hour12: true,
  });

  return `${date} ${time}`;
};

const ToastFunc = (msg, type) => {
  const toastType =
    type.toUpperCase() === "FAILURE" ? "error" : type.toLowerCase();

   Toast.show({
    message: msg,
    type: toastType,
    placement: "bottom",
    offsetTop: 200, // Increase this for more gap from the top
  });
};

export const commonAPICall = async (url, values, get_post, dispatch) => {
  let msg = null;
  let msgType = null;
  let responseStatus = null;
  let response = null;
  let data = null;
  dispatch(showLoader("Loading, Please Wait....."));

  try {
    if (
      get_post !== undefined &&
      get_post !== "undefined" &&
      get_post !== null &&
      get_post !== "null" &&
      get_post.toUpperCase() === "POST"
    ) {
      response = await myAxios.post(url, values);
    } else {
      response = await myAxios.get(url, values);
    }

    // console.log("response----..", response.data);

    responseStatus = response.status ?? "unknown status";
    msg =
      response.data.message !== undefined && response.data.message !== null
        ? response.data.message
        : "Operation completed successfully.";
    msgType = "success";
    data = response.data != null ? response.data : null;
  } catch (error) {
    msgType = "failure";

    if (error.response) {
      msg =
        error.response.data?.message === ""
          ? ""
          : error.response.data?.message
            ? `${error.response.data.message} (${error.response.data.status})`
            : "An error occurred";
      responseStatus = error.response.status;
    } else {
      msg = `An unexpected error occurred: ${error.message}`;
      responseStatus = 9999;
    }
  }

  // Show message if needed
  if ((msg || "").trim() !== "") {
    dispatch(showMessage(msg + " [" + getCurrentTimestamp() + "]", msgType));
    ToastFunc(msg, msgType);
  }

  // ALWAYS hide loader before returning
  dispatch(hideLoader());

  return { data, status: responseStatus };
};

const showNativeMessage = (msg, type) => {
  if (type?.toUpperCase() === "SUCCESS") {
    Alert.alert("Success", msg);
    return;
  } else if (type?.toUpperCase() === "FAILURE") {
    Alert.alert("Error", msg);
    return;
  } else {
    Alert.alert("Info", msg);
    return;
  }
};

export const CONTEXT_NAME = "APEMCL";
export const CONTEXT_HEADING = "APEMCL";
export const BASE_SERVER_URL = "https://forests.ap.gov.in/uploads/";
export const ACC_YEAR = new Date().getFullYear().toString();
export const LOGIN_END_POINT = "/api/open/login";
export const GENERATE_CAPTCHA = "/api/open/generate-captcha";
export const SERVICE_AUTH_END_POINT = "/api/open/validateToken";
export const LOGOUT_END_POINT = "/api/user/logout";
export const LOGOUT_ALL_END_POINT = "/api/user/logoutall";
export const LOGOUT_ALL_EXCEPT_THIS_END_POINT =
  "/api/user/logoutexceptcurrentsession";
export const CHANGE_PASSWORD = "/api/auth/changepassword";
export const UpdateProfile = "/api/auth/UpdateProfile";
export const EMPLOYEEREGOTP =
  "/api/open/digital-labour-chowk/generate-otp?mobileNumber=";
export const EMPLOYEEREG = "/api/open/digital-labour-chowk/register";
export const BASICPROFILE = "/api/user/digital-labour-chowk/updateBasicInfo";
export const GETSKILLS = "api/user/digital-labour-chowk/skillInfo";
export const GETDISTSAPP = "/api/user/v1/districts";
export const GETMANDALSAPP = "/api/user/v1/mandals?distCode=";
export const GETVILLAGESAPP = "/api/user/v1/villages";
export const DIGITALLABOURCHOWKDETAILS =
  
  "/api/user/digitalLabourChowkRegDetails";
export const EMPLOYERJOBPOST =
  
  "/api/user/digital-labour-chowk/createJobPosting";
export const JOBSEARCH = "/api/user/digitalLabourChowkJobPostings/search";
export const JOBAPPLY = "/api/user/digital-labour-chowk/applyJob";
export const FINDWORKER = "/api/user/digitalLabourChowkRegDetails";
export const MYJOBSOFWORKER = "/api/user/digitalLabourChowkJobPostings";
export const GEOTAGGINGPOST = "/api/user/createGeoTagging";
export const GEOTAGGINGGET = "/api/user/geo-tagging-details";
export const FRSREGISTRATION = "/api/user/createEmployeeRegistration";


// worker reg api

export const GET_DISTRICTS = "/api/open/new-villages"; // Note: This seems to be for villages, you may need a dedicated districts API
export const GET_MANDALS = "api/open/mandals?";
export const GET_VILLAGES = "/api/open/new-villages";

// Aadhaar Verification APIs
export const GENERATE_AADHAAR_OTP = "api/open/generateOtp";
export const VERIFY_AADHAAR_OTP = "api/open/ekycOtp";

// Worker Registration API
export const WORKER_REGISTRATION = "/api/worker/worker-registration";
export const AADHAAR_OTP = "api/open/generateOtp";
export const GET_STATES_API = "/api/open/states";
export const CASTE_API = "api/worker/api/open/castesubcaste";
export const BANK_DETAILS = "/api/worker/api/open/rbibanks";
export const GET_DISTRICT_REPORT = "api/open/listofdistricts"
export const GET_VILLAGESs = "/api/open/new-villages";
export const WORKER_REG_API = "/api/worker/worker-registration";
export const PAYMENT_API = "/api/open/create-payment";

export const TicketBookingDetails = "api/user/spotbookingdetails"
export const TicketBookingEntryDetails = "api/user/ticketbookingdetails"
export const REPRINT = "api/user/ticketPrintDetails?"


export const GENERATEQRSAMPLE = "api/user/generateSampleQrStock?noOfQrs=20"
export const ASSIGNDUTYTEAMLEADER = "api/user/assignDutyToTeamLeader"
export const COLLECTSAMPLEANDSENDTOLAB = "api/user/collectSampleAndSendToLab"
export const MARINEDISCHARGEDETAILS = "api/user/marine-discharge-posting-details"
export const UPDATEASSIGNDUTY = "api/user/updateAssignedDuty"

export const GENERATEQRCODES = "/api/user/generateSampleQrStock"
export const CREATEMARINEDISCHARGEPOSTING = "api/user/createMarineDischargePosting"

export const ASSIGNDISCHARGEDUTY = "api/user/assignDischargeDutyToTeamLeader"
export const EDITAPPROVALACTION = "api/user/startReadingEditRequestApprovalAction"

export const COMPLETEDISCHARGE = "api/user/completeDischarge"
export const STARTDISCHARGE = "api/user/startDischarge"
export const STARTREADINGEDITREQUEST = "api/user/raiseStartReadingEditRequest"


export const UPLOADANALYSISREPORT = "api/user/uploadAnalysisReport"

export const VALIDATEQRINLAB = "api/user/validateSampleQr?qrCode="

export const APPROVEREJECTSEE = "api/user/startReadingEditRequestApprovalAction"
export const GUARDPONDSGET="api/user/guard-pond-details"

export const MARINEMAINDASHBOARD="api/user/marine-discharge-dashboard-counts"
export const DISCHARGEFILTERFLAG="/api/user/marine-discharge-summary?summaryFlag="
export const ANALYSISREPORTS = "api/user/marine-discharge-summary?assignmentFlag="
export const DISCHARGENOTICE = "api/user/saveMarineDischargeNotice"

export const GETNOTICES = "api/user/marine-discharge-notice-details"




export const MASTERDATAADDVEHICLEDETAILS = "api/user/vehicle-type-details"
export const MASTERDATAADDVEHICLE = "api/user/createVehicleType"
export const LISTALLGENATOR = "api/user/registered-generators-list?"
export const LISTALLRECEIVERS = "api/user/registered-receivers-list?"
export const MANAGEPERMITTEDQUANTITY = "api/user/createManagePermittedQuantity"
export const GENERATORS = "api/user/industries?industryTypeId=1"
export const PROCESSES = "api/open/processes"
export const STREAMS = "api/open/steam?processId="
export const CETPS = "api/open/cetps"
export const MANAGEPERMITTEDQUANTITYDETAILS = "api/user/managePermittedQuantityDetails?"
export const RECEIVERS = "api/user/industries?industryTypeId=2&isRecycleReceiver=true"
export const DELETEMANAGEPERMITTEDQTY = "api/user/deleteManagePermittedQuantity?receiverTypeId="
export const POSTWASTEDISPOSALDETAILS = "api/user/add-waste-disposal-details"
export const WASTEDISPOSALDETAILS = "api/user/waste-disposal-details?wasteTypeId="
export const EFFLUENTENDREADINGCHECK = "api/user/check-pending-effluent-readings?cetpMembershipId="
export const EFFLUENTDISPOSALDETAILS = "api/user/effluent-disposal-details"
export const ADDWASTEDISPOSALDETAILS = "api/user/add-waste-disposal-details"
export const GETWASTEDISPOSALDETAILS = "api/user/waste-disposal-details/all"
export const GENAPPROVEDDISPOSALDATA = "api/user/waste-disposal-interest-details?wasteTypeId=0&approved=true"
export const TRANSPORTERLIST = "api/user/transportationVehicleSelectionDetails?vehicleId="
export const ADDTRANSPORTVEHICLESELECTION = "api/user/add-transport-vehicle-selection"
export const TRANSPORTVEHICLESELECTIONGET = "api/user/transport-vehicle-selection-details?wasteDisposalId="
export const ALLREGISTRATIONS = "api/open/registration-details/all"
export const RECYCLABLEVEHICLID = "api/user/transport-vehicle-selection-details"
export const PAYMENTAPEMCL = "api/open/initiate"
export const RECYCLABLE = "api/user/add-transport-vehicle-selection"
export const WASTEDISPOSALINTERESTDETAILS = "api/user/waste-disposal-interest-details?wasteTypeId="
export const RECEIVERDISPOSALMETHODS = "api/user/receiver-disposal-methods?receiverTypeId="
export const GETMANIFEST = "api/user/transport-vehicle-selection-details?wasteDisposalId="
export const REDIRECTIONREQUESTTOADMIN = "api/user/requestRedirectionToAdmin"
export const REDIRECTIONRECEIVERS = "api/user/receiver-industries?receiverWasteType="
export const POSTMANIFEST = "api/user/add-transport-vehicle-selection"
export const RECEIVERREQUESTMANIFESTCLOSEADMIN = "api/user/requestManifestCloseToAdmin"
export const TRANSPORTVEHICLESELECTIONDETAILS = "api/user/transport-vehicle-selection-details"
export const FLOWMETERREADINGPOST = "api/user/effluent-receiver-action"
export const EFFPIPELINEDISCHARGEDETAILS = "api/user/effluent-pipeline-discharge-details"
export const EFFPIPELINEDISCHARGEDETAILSREC = "api/user/effluent-waste-generator-details"
// Add this to your utils.js file
export const MARINEDISCHARGEDRILLDOWN = "/api/user/marine-discharge-dashboard-drilldown";

