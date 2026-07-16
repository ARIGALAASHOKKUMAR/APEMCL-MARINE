export const initialState = {
  modal: false,
  modalText: "",
  closeButton: true,
  fullscreen: false
};

const ModalReducer = (state = initialState, action) => {
  switch (action.type) {
    case "SHOW_MODAL":
      return { ...state, modal: true, modalText: action.payload.modalText, closeButton: action.payload.closeButton, fullscreen: action.payload.fullscreen };

    case "HIDE_MODAL":
      return { ...state, modal: false, modalText: '', closeButton: true };

    default:
      return state;
  }
};
export default ModalReducer;
