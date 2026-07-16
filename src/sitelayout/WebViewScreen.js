// WebViewScreen.js
import React, { useRef, useState } from 'react';
import { 
  View, 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  SafeAreaView,
  Platform 
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';

const WebViewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { url } = route.params;
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(true);

  // Optimized loading component
  const LoadingIndicator = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Loading webpage...</Text>
    </View>
  );


  const token = useSelector((state) => state.LoginReducer.token);

    const getSource = () => {
    if (token) {
      return {
        uri: url,
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Auth-Token': token,
        }
      };
    }
    return { uri: url };
  };
  

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <WebView
          ref={webViewRef}
          ource={getSource()}
          startInLoadingState={true}
          renderLoading={LoadingIndicator}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          
          // CRITICAL PERFORMANCE OPTIMIZATIONS
          cacheEnabled={true}
          cacheMode={Platform.OS === 'android' ? 'LOAD_DEFAULT' : 'LOAD_CACHE_ELSE_NETWORK'}
          domStorageEnabled={true}
          javaScriptEnabled={true}
          javaScriptCanOpenWindowsAutomatically={false}
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          
          // RENDERING OPTIMIZATIONS
          scalesPageToFit={true}
          bounces={false}
          scrollEnabled={true}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={true}
          
          // ANDROID SPECIFIC OPTIMIZATIONS
          androidLayerType={Platform.OS === 'android' ? 'hardware' : 'none'}
          androidHardwareAccelerationDisabled={false}
          
          // IOS SPECIFIC OPTIMIZATIONS
          allowsBackForwardNavigationGestures={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          
          // INJECT PERFORMANCE SCRIPTS
          injectedJavaScript={`
            // Disable heavy animations and effects
            document.body.style.animation = 'none';
            document.body.style.transition = 'none';
            
            // Optimize images loading
            const images = document.querySelectorAll('img');
            images.forEach(img => {
              img.loading = 'lazy';
              img.decode().catch(() => {});
            });
            
            // Disable non-critical CSS
            const styleSheets = document.styleSheets;
            for (let i = 0; i < styleSheets.length; i++) {
              try {
                const rules = styleSheets[i].cssRules;
                if (rules) {
                  for (let j = 0; j < rules.length; j++) {
                    const rule = rules[j];
                    if (rule.style && (rule.style.animation || rule.style.transition)) {
                      rule.style.animation = 'none';
                      rule.style.transition = 'none';
                    }
                  }
                }
              } catch(e) {}
            }
            
            true;
          `}
          
          // Error handling
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error: ', nativeEvent);
            Alert.alert(
              'Error', 
              'Failed to load the webpage. Please check your internet connection.',
              [
                { text: 'Go Back', onPress: () => navigation.goBack() },
                { text: 'Retry', onPress: () => webViewRef.current?.reload() }
              ]
            );
          }}
          
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('HTTP error: ', nativeEvent.statusCode);
            if (nativeEvent.statusCode >= 400) {
              Alert.alert('Error', `HTTP Error ${nativeEvent.statusCode}: Failed to load the webpage`);
            }
          }}
          
          // Performance monitoring
          onLoadProgress={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            if (nativeEvent.progress === 1) {
              console.log('WebView loaded completely');
            }
          }}
          
          style={styles.webview}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
});

export default WebViewScreen;