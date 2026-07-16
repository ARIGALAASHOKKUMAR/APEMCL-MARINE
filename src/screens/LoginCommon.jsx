import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  Alert,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { commonAPICall, LOGIN_END_POINT, GENERATE_CAPTCHA } from '../utils/utils';
import { login } from '../actions';
import { showErrorToast, showSuccessToast } from '../utils/showToast';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const LoginCommon = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [captchaImage, setCaptchaImage] = useState('');
  const [storedCaptchaId, setStoredCaptchaId] = useState('');

  const navigation = useNavigation();

  // Validation Schema
  const validationSchema = Yup.object({
    username: Yup.string()
      .required('Username is required')
      .min(4, 'Username must be at least 4 characters')
      .max(18, 'Username must be less than 18 characters'),
    password: Yup.string()
      .required('Password is required')
      .min(6, 'Password must be at least 6 characters'),
    captcha: Yup.string()
      .required('Captcha is required')
      .length(6, 'Captcha must be exactly 6 characters'),
  });

  const formik = useFormik({
    initialValues: {
      username: '',
      password: '',
      captcha: '',
    },
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: handleLogin,
  });

  // Generate Captcha
  const generateCaptcha = async () => {
    try {
      const response = await commonAPICall(GENERATE_CAPTCHA, {}, 'get', dispatch);
      setCaptchaImage(response?.data?.captcha || '');
      setStoredCaptchaId(response?.data?.captchaId || '');
    } catch (error) {
      console.log('Captcha error:', error);
    }
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  // Handle Login
  async function handleLogin(values) {
    // Validate all fields
    const errors = await formik.validateForm();
    if (Object.keys(errors).length > 0) {
      // Set touched for all fields to show errors
      formik.setTouched({
        username: true,
        password: true,
        captcha: true,
      });
      return;
    }

    try {
      setLoading(true);

      const payload = {
        username: values.username.trim(),
        password: btoa(values.password), // Base64 encode password
        deptCaptcha: values.captcha.trim(),
        storedCaptchaId: storedCaptchaId,
        latitude: null,
        longitude: null,
        loginSource: 'mobile',
      };

      const response = await commonAPICall(LOGIN_END_POINT, payload, 'post', dispatch);

      if (response.status === 200) {
        const payload = {
          isLoggedIn: true,
          isDefaultPassword: response.data.isDefaultPassword,
          isProfileUpdated: response.data.isProfileUpdated,
          officerName: response.data.officerName,
          mobile: response.data.mobile,
          parents: response.data.parents,
          services: response.data.services,
          roleId: response.data.roleId,
          userId: response.data.userId,
          username: response.data.username,
          token: response.data.token,
          roleName: response.data.roleName,
          photoPath: response.data.photoPath,
          lastLoginTime: response.data.lastLoginTime,
          uuid: response.data.uuid,
          lastLogoutTime: response.data.lastLogoutTime,
          lastFailureAttemptTime: response.data.lastFailureAttemptTime,
          passwordSinceUpdated: response.data.passwordSinceUpdated,
          latitude: response.data.latitude,
          longitude: response.data.longitude,
          loginLocation: response.data.location,
        };

        dispatch(login(payload));

        const currentTime = new Date().getHours();
        let welcomeMsg = currentTime >= 5 && currentTime < 12
          ? 'Good morning! Welcome to Marine Discharge'
          : currentTime >= 12 && currentTime < 18
            ? 'Good afternoon! Welcome to Marine Discharge'
            : 'Good evening! Welcome to Marine Discharge';

        showSuccessToast(welcomeMsg);
        navigation.navigate('HOME');
      }
    } catch (error) {
      if (error.response) {
        setCaptchaImage(error.response?.data?.captcha || '');
        setStoredCaptchaId(error.response?.data?.captchaId || '');
        showErrorToast(error.response?.data?.message || 'Please enter valid credentials');
      } else {
        showErrorToast(error.message || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  }

  // Handle Forgot Password
  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Please contact your administrator');
  };

  return (
    <View style={styles.screen}>
      <ImageBackground 
source={require('../../assets/MARINEBG.png')}
  style={styles.screen}
  contentFit="cover"
>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Background Decorations */}
          
          {/* Card */}
          <View style={{marginTop:350}}>
            {/* Logo */}
            

            {/* Username */}
            <View style={styles.fieldBlock}>
              <View style={[
                styles.inputWrapper,
                formik.touched.username && formik.errors.username && styles.inputWrapperError
              ]}>
                <Ionicons name="person-outline" size={20} color="#64748b" style={styles.leftIcon} />
                <TextInput
                  placeholder="Username"
                  placeholderTextColor="#94a3b8"
                  style={styles.input}
                  value={formik.values.username}
                  onChangeText={formik.handleChange('username')}
                  onBlur={formik.handleBlur('username')}
                  maxLength={18}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
              {formik.touched.username && formik.errors.username && (
                <Text style={styles.errorText}>{formik.errors.username}</Text>
              )}
            </View>

            {/* Password */}
            <View style={styles.fieldBlock}>
              <View style={[
                styles.inputWrapper,
                formik.touched.password && formik.errors.password && styles.inputWrapperError
              ]}>
                <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.leftIcon} />
                <TextInput
                  placeholder="Password"
                  placeholderTextColor="#94a3b8"
                  style={styles.input}
                  value={formik.values.password}
                  onChangeText={formik.handleChange('password')}
                  onBlur={formik.handleBlur('password')}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={22}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>
              {formik.touched.password && formik.errors.password && (
                <Text style={styles.errorText}>{formik.errors.password}</Text>
              )}
            </View>

            {/* Captcha */}
            <View style={styles.fieldBlock}>
              <View style={styles.captchaRow}>
                <View style={[
                  styles.captchaInputWrapper,
                  formik.touched.captcha && formik.errors.captcha && styles.inputWrapperError
                ]}>
                  <TextInput
                    placeholder="Enter Captcha"
                    placeholderTextColor="#94a3b8"
                    style={styles.input}
                    value={formik.values.captcha}
                    onChangeText={formik.handleChange('captcha')}
                    onBlur={formik.handleBlur('captcha')}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>

                <View style={styles.captchaBox}>
                  {captchaImage ? (
                    <Image
                      source={{ uri: captchaImage }}
                      style={styles.captchaImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={styles.captchaPlaceholderText}>Captcha</Text>
                  )}
                </View>

                <TouchableOpacity
                  onPress={generateCaptcha}
                  style={styles.refreshBtn}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh-circle" size={34} color="green" />
                </TouchableOpacity>
              </View>
              {formik.touched.captcha && formik.errors.captcha && (
                <Text style={styles.errorText}>{formik.errors.captcha}</Text>
              )}
            </View>

            {/* Forgot Password */}
            {/* <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity> */}

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                loading && styles.loginButtonDisabled
              ]}
              onPress={formik.handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              
                  <Text style={styles.loginText}>SIGN IN</Text>
                  <Ionicons name="arrow-forward" size={22} color="#fff" style={{ marginLeft: 10 }} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  flexOne: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  glowOrb1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
  },
  glowOrb2: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  glowOrb3: {
    position: 'absolute',
    top: '40%',
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 40,
    elevation: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  welcomeText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 2,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  subtitleText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 28,
    letterSpacing: 0.3,
  },
  fieldBlock: {
    marginBottom: 16,
  },
  inputWrapper: {
    minHeight: 54,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  captchaInputWrapper: {
    flex: 1.2,
    minHeight: 54,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrapperError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  leftIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: '#0f172a',
    fontSize: 15,
    paddingVertical: 12,
    fontWeight: '500',
  },
  eyeButton: {
    paddingLeft: 10,
    paddingVertical: 6,
  },
  captchaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  captchaBox: {
    flex: 1,
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  captchaImage: {
    width: '100%',
    height: 42,
  },
  captchaPlaceholderText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 13,
  },
  refreshBtn: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
    paddingVertical: 4,
  },
  forgotPasswordText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  loginButton: {
    width: '100%',
    height: 56,
    backgroundColor: 'green',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
    backgroundColor: '#94a3b8',
  },
  loginText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  errorText: {
    color: '#ef4444',
    marginTop: 6,
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default LoginCommon;