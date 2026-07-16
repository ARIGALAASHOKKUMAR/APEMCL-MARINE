// toast.js - Compact Version with more top gap
import { Toast } from 'react-native-sprinkle-toast';
import { Platform, StatusBar, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// Get proper top offset based on platform and header - INCREASED GAP
const getTopOffset = () => {
  return Platform.select({
    ios: 85, // Increased to 85
    android: (StatusBar.currentHeight || 25) + 40, // Increased to +40
    default: 75,
  });
};

// Compact toast configuration
const compactToastConfig = {
  textStyle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#ffffff',
    textAlign: 'center',
  },
  style: {
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 30,
    minWidth: width * 0.6,
    maxWidth: width * 0.85,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 0,
  },
};

export const showSuccessToast = (msg) => {
  Toast.show({
    message: msg,
    type: 'success',
    showSprinkles: true,
    sprinkleStyle: 'stars',
    position: 'top',
    topOffset: getTopOffset(),
    duration: 3000,
    textStyle: {
      ...compactToastConfig.textStyle,
    },
    style: {
      ...compactToastConfig.style,
      backgroundColor: '#10b981',
    },
  });
};

export const showErrorToast = (msg) => {
  Toast.show({
    message: msg,
    type: 'error',
    position: 'top',
    topOffset: getTopOffset(),
    showProgress: true,
    duration: 4000,
    textStyle: {
      ...compactToastConfig.textStyle,
    },
    style: {
      ...compactToastConfig.style,
      backgroundColor: '#ef4444',
    },
    progressStyle: {
      backgroundColor: '#ffffff',
      height: 2,
      borderRadius: 1,
    },
  });
};

export const showInfoToast = (msg) => {
  Toast.show({
    message: msg,
    type: 'info',
    position: 'top',
    topOffset: getTopOffset(),
    duration: 3000,
    textStyle: {
      ...compactToastConfig.textStyle,
    },
    style: {
      ...compactToastConfig.style,
      backgroundColor: '#3b82f6',
    },
  });
};

// Bottom positioning
export const showSuccessToastBottom = (msg) => {
  Toast.show({
    message: msg,
    type: 'success',
    showSprinkles: true,
    sprinkleStyle: 'stars',
    position: 'bottom',
    bottomOffset: 85,
    duration: 3000,
    textStyle: {
      ...compactToastConfig.textStyle,
    },
    style: {
      ...compactToastConfig.style,
      backgroundColor: '#10b981',
    },
  });
};

export const showErrorToastBottom = (msg) => {
  Toast.show({
    message: msg,
    type: 'error',
    position: 'bottom',
    bottomOffset: 85,
    showProgress: true,
    duration: 4000,
    textStyle: {
      ...compactToastConfig.textStyle,
    },
    style: {
      ...compactToastConfig.style,
      backgroundColor: '#ef4444',
    },
    progressStyle: {
      backgroundColor: '#ffffff',
      height: 2,
      borderRadius: 1,
    },
  });
};

export const showInfoToastBottom = (msg) => {
  Toast.show({
    message: msg,
    type: 'info',
    position: 'bottom',
    bottomOffset: 85,
    duration: 3000,
    textStyle: {
      ...compactToastConfig.textStyle,
    },
    style: {
      ...compactToastConfig.style,
      backgroundColor: '#3b82f6',
    },
  });
};