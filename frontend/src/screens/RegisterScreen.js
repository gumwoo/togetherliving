import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { registerUser } from '../store/slices/userSlice';
import apiService from '../services/apiService';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    phoneNumber: '',
    apartmentName: '',
    building: '',
    unit: '',
  });
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleInputChange = (field, value) => {
    console.log('RegisterScreen: Input changed', { field, value });
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.nickname) {
      Alert.alert('오류', '필수 항목을 모두 입력해주세요.');
      return false;
    }

    if (!validateEmail(formData.email)) {
      Alert.alert('오류', '올바른 이메일 형식을 입력해주세요.');
      return false;
    }

    if (formData.password.length < 6) {
      Alert.alert('오류', '비밀번호는 6자 이상이어야 합니다.');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
      return false;
    }

    return true;
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      console.log('RegisterScreen: Attempting registration', { 
        email: formData.email,
        nickname: formData.nickname 
      });
      
      setLoading(true);

      const userData = {
        email: formData.email,
        password: formData.password,
        nickname: formData.nickname,
        phoneNumber: formData.phoneNumber,
        apartment: {
          name: formData.apartmentName,
          building: formData.building,
          unit: formData.unit,
        }
      };

      const resultAction = await dispatch(registerUser(userData));

      if (registerUser.fulfilled.match(resultAction)) {
        console.log('RegisterScreen: Registration successful', resultAction.payload);
        Alert.alert('성공', '회원가입이 완료되었습니다!');
        // 네비게이션은 AppNavigator에서 자동으로 처리됨
      } else {
        throw new Error(resultAction.payload || '회원가입에 실패했습니다.');
      }

    } catch (error) {
      console.error('RegisterScreen: Registration failed', error);
      Alert.alert('회원가입 실패', error.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    console.log('RegisterScreen: Navigating to login');
    navigation.navigate('Login');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={styles.title}>회원가입</Text>
          <Text style={styles.subtitle}>함께살이에 오신 것을 환영합니다!</Text>
        </View>

        {/* 폼 */}
        <View style={styles.form}>
          <Text style={styles.sectionTitle}>기본 정보</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>이메일 *</Text>
            <TextInput
              style={styles.input}
              placeholder="이메일을 입력하세요"
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>닉네임 *</Text>
            <TextInput
              style={styles.input}
              placeholder="닉네임을 입력하세요"
              value={formData.nickname}
              onChangeText={(value) => handleInputChange('nickname', value)}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>휴대폰 번호</Text>
            <TextInput
              style={styles.input}
              placeholder="010-0000-0000"
              value={formData.phoneNumber}
              onChangeText={(value) => handleInputChange('phoneNumber', value)}
              keyboardType="phone-pad"
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>비밀번호 *</Text>
            <TextInput
              style={styles.input}
              placeholder="비밀번호를 입력하세요 (6자 이상)"
              value={formData.password}
              onChangeText={(value) => handleInputChange('password', value)}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>비밀번호 확인 *</Text>
            <TextInput
              style={styles.input}
              placeholder="비밀번호를 다시 입력하세요"
              value={formData.confirmPassword}
              onChangeText={(value) => handleInputChange('confirmPassword', value)}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <Text style={styles.sectionTitle}>거주지 정보 (선택)</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>아파트명</Text>
            <TextInput
              style={styles.input}
              placeholder="예: 래미안월드메르디앙"
              value={formData.apartmentName}
              onChangeText={(value) => handleInputChange('apartmentName', value)}
              editable={!loading}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>동</Text>
              <TextInput
                style={styles.input}
                placeholder="101동"
                value={formData.building}
                onChangeText={(value) => handleInputChange('building', value)}
                editable={!loading}
              />
            </View>

            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>호수</Text>
              <TextInput
                style={styles.input}
                placeholder="1001호"
                value={formData.unit}
                onChangeText={(value) => handleInputChange('unit', value)}
                editable={!loading}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.registerButton, loading && styles.disabledButton]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.registerButtonText}>
              {loading ? '가입 중...' : '회원가입'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 로그인 링크 */}
        <View style={styles.loginSection}>
          <Text style={styles.loginPrompt}>이미 계정이 있으신가요?</Text>
          <TouchableOpacity onPress={navigateToLogin}>
            <Text style={styles.loginLink}>로그인</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    marginTop: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  row: {
    flexDirection: 'row',
  },
  registerButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginPrompt: {
    fontSize: 16,
    color: '#666',
    marginRight: 8,
  },
  loginLink: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
