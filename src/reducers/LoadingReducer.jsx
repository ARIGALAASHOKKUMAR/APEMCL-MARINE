export const initialState = {
  loading: false,
  loadingText: "Loading, Please Wait...",
};

const LoadingReducer = (state = initialState, action) => {
  switch (action.type) {
    case "SHOW_LOADER":
      return {
        ...state,
        loading: true,
        loadingText:action.payload,
      };

    case "HIDE_LOADER":
      return {
        ...state,
        loading: false,
        loadingText: "",
      };

    default:
      return state;
  }
};

export default LoadingReducer;