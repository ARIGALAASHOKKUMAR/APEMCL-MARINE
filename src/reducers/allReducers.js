import { createStore, combineReducers } from "redux";
import { persistStore, persistReducer } from "redux-persist";
import AsyncStorage from "@react-native-async-storage/async-storage";

import LoadingReducer from "./LoadingReducer";
import messageReducer from "./UserMessagesReducer";
import ModalReducer from "./ModalReucer";
import LoginReducer from "./LoginReducer";

const rootReducer = combineReducers({
  LoadingReducer,
  messageReducer,
  ModalReducer,
  LoginReducer,
});

const persistConfig = {
  key: "root",
  storage: AsyncStorage,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = createStore(persistedReducer);
export const persistedStore = persistStore(store);