import axios from "axios";
import { toast } from "react-toastify";
import { store } from "../reducers/allReducers";
import { hideLoader, showLoader } from "../actions";
import { IMAGE_UPLOAD2, myAxios } from "./utils";
const SUPPORTED_FORMATS = [
  "image/jpg",
  "image/jpeg",
  "image/png",
  "application/pdf",
  "text/javascript",
  "video/mp4",
  "application/json",
  "application/vnd.google-earth.kml+xml",
  "image/svg+xml",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "",
];
const MAX_FILE_SIZE = 20971520;
export const IMG_UPLOAD_URL = process.env.REACT_APP_IMG_UPLOAD_URL;
export const IMG_DOWNLOAD_URL = process.env.REACT_APP_IMG_DOWNLOAD_URL;

const CommonAxiosPost = async (url, values) => {
  try {
    let data = "";
    let res = await axios({ url: url, method: "post", data: values });
    if (res.status === 200) {
      data = res;
    }
    return data;
  } catch (err) {
    toast.error(err);
  }
};

function validateFileTypeAndSize(customefile, size) {
  const maxSizeMB = size / (1024 * 1024); // Convert size from bytes to MB
  let errormsg = "";

  if (customefile?.size > size) {
    errormsg = `Please check your file size, it should be less than ${maxSizeMB}MB`;
    toast.error(errormsg);
    return false;
  }
  if (!SUPPORTED_FORMATS.includes(customefile?.type)) {
    if (customefile.name.split(".").pop().toLowerCase() === "geojson")
      return true;
    errormsg = `File format is invalid. Please upload only .jpg, .jpeg, .png, .pdf, .js, .json, .geojson, .xlsx or .mp4. Your file type is ${customefile.name
      .split(".")
      .pop()
      .toLowerCase()}`;
    toast.error(errormsg);
    return false;
  }

  return true;
}


export  default function ImageBucket(e, formik, path, name, size,dispatch){
  dispatch(showLoader("Uploading ..."));
    e.preventDefault();
    const file = e.target.files[0];
    if (validateFileTypeAndSize(file, size)) {
        return new Promise((resolve, reject) => {
            const formData = new FormData();
            formData.append("file", file);
            CommonAxiosPost(IMG_UPLOAD_URL + path, formData).then((response) =>
                {
                resolve(response.data)
                formik.setFieldValue(name, IMG_DOWNLOAD_URL + response?.data);
                toast.success("File Uploaded Successfully");
            dispatch(hideLoader());
               }).catch((error) =>
                {
                formik.setFieldValue(name, null);
                toast.error("Unfortunately, we encountered an error while attempting to upload a file to 'imagebucket'.", error);
                resolve(null);
            dispatch(hideLoader());
               });
 
        });
    }
dispatch(hideLoader());
 
 
}



export   function ImageBucket2(e, formik, path, name, size) {
  const dispatch = store.dispatch;
  dispatch(showLoader("Uploading ..."));
  e.preventDefault();
  const file = e.target.files[0];
  if (validateFileTypeAndSize(file, size)) {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);
      myAxios
        .post(
          IMAGE_UPLOAD2 +
            path,
          formData
        )
        .then((response) => {
          resolve(response.data);
          formik.setFieldValue(name, IMG_DOWNLOAD_URL + response?.data);
          toast.success("File Uploaded Successfully");
      dispatch(hideLoader());
        })
        .catch((error) => {
          formik.setFieldValue(name, null);
          toast.error(
            "Unfortunately, we encountered an error while attempting to upload a file to 'imagebucket'.",
            error
          );
          resolve(null);
      dispatch(hideLoader());
        });
    });
  }
  dispatch(hideLoader());
}
// aws bucket
function ImageBucketBackupBySatish(e, formik, path, name, filename, size) {
  // ImageBucket(e, formik, path, 'sawmillLicenseupload', filename);
  e.preventDefault();
  const file = e.target.files[0];
  console.log("photoupload", file);
  const type = file.type.split("/")[1];
  const newFileName = filename + "." + type;
  const modifiedFile = new File([file], newFileName, { type: file.type });

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    CommonAxiosPost(IMG_UPLOAD_URL + path, formData)
      .then((response) => {
        resolve(response.data);
        formik.setFieldValue(name, response?.data);
      })
      .catch((error) => {
        console.log("error at imagebucket", error);
        resolve(null);
      });
  });
}
