export const increment = (params) => {
  return {
    type: "INCREMENT",
    payload: params,
  };
};

export const decrement = () => {
  return {
    type: "DECREMENT",
  };
};

export const showLoader = (loadingText) => {
  return {
    type: "SHOW_LOADER",
    payload: loadingText,
  };
};

export const hideLoader = () => {
  return {
    type: "HIDE_LOADER",
  };
};

export const showMessage = (messageText, classType) => {
  return {
    type: "SHOW_MESSAGE",
    payload: messageText,
    classType: classType,
  };
};

export const hideMessage = () => {
  return {
    type: "HIDE_MESSAGE",
  };
};

export const showModal = (modalText, closeButton, fullscreen) => {
  return {
    type: "SHOW_MODAL",
    payload: { modalText, closeButton, fullscreen },
  };
};

export const hideModal = () => {
  return {
    type: "HIDE_MODAL",
  };
};

export const refreshSession = () => {
  return {
    type: "REFRESH_SESSION",
  };
};

export const stopSession = () => {
  return {
    type: "STOP_SESSION",
  };
};

export const login = (payload_params) => {
  return {
    type: "LOGIN",
    payload: payload_params,
  };
};

export const logOut = () => {
  return {
    type: "LOGOUT",
  };
};

export const defaultPassword = () => {
  return {
    type: "DEFAULT_PASSWORD",
  };
};
