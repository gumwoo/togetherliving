import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ENV from '../../config/env';

// 초기 상태
const initialState = {
  // 사용자 정보
  isLoggedIn: false,
  userInfo: null,
  token: null,
  
  // 아파트 정보
  apartment: {
    name: '',
    address: '',
    building: '',
    unit: '',
    verificationStatus: 'pending', // pending, verified, rejected
  },
  
  // 비상연락처
  emergencyContacts: [],
  
  // 설정
  preferences: {
    notificationSettings: {
      safetyAlerts: true,
      communityUpdates: true,
      helpRequests: true,
      nightMode: false,
    },
    privacySettings: {
      locationSharing: true,
      profileVisibility: 'apartment', // apartment, all, none
      activityStatus: true,
    },
    safetySettings: {
      checkInFrequency: 'daily', // daily, weekly, custom
      emergencyMode: false,
      autoCheckIn: true,
    },
  },
  
  // 로딩 상태
  loading: false,
  error: null,
};

// 비동기 액션: 로그인
export const loginUser = createAsyncThunk(
  'user/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      console.log('userSlice: 로그인 API 호출 시도', { email });
      
      const response = await fetch(`${ENV.API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '로그인 실패');
      }
      
      console.log('userSlice: 로그인 성공', data);
      
      // AsyncStorage에 토큰 저장
      if (data.data.token) {
        await AsyncStorage.setItem('userToken', data.data.token);
        console.log('userSlice: 토큰 AsyncStorage 저장 완료');
      }
      
      if (data.data.refreshToken) {
        await AsyncStorage.setItem('refreshToken', data.data.refreshToken);
        console.log('userSlice: 리프레시 토큰 AsyncStorage 저장 완료');
      }
      
      return data.data;
    } catch (error) {
      console.error('userSlice: 로그인 실패', error);
      return rejectWithValue(error.message);
    }
  }
);

// 비동기 액션: 토큰으로 자동 로그인
export const loadStoredAuth = createAsyncThunk(
  'user/loadStoredAuth',
  async (_, { rejectWithValue }) => {
    try {
      console.log('userSlice: 저장된 토큰으로 자동 로그인 시도');
      
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        console.log('userSlice: 저장된 토큰 없음');
        return rejectWithValue('저장된 토큰이 없습니다');
      }
      
      // 토큰으로 사용자 정보 가져오기
      const response = await fetch(`${ENV.API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.log('userSlice: 토큰 만료 또는 유효하지 않음');
        // 저장된 토큰 삭제
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('refreshToken');
        throw new Error(data.message || '토큰이 유효하지 않습니다');
      }
      
      console.log('userSlice: 자동 로그인 성공', data);
      
      return {
        user: data.data.user,
        token: token
      };
    } catch (error) {
      console.error('userSlice: 자동 로그인 실패', error);
      return rejectWithValue(error.message);
    }
  }
);
export const registerUser = createAsyncThunk(
  'user/register',
  async (userData, { rejectWithValue }) => {
    try {
      console.log('userSlice: 회원가입 API 호출 시도', { email: userData.email });
      
      const response = await fetch(`${ENV.API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '회원가입 실패');
      }
      
      console.log('userSlice: 회원가입 성공', data);
      
      // AsyncStorage에 토큰 저장
      if (data.data.token) {
        await AsyncStorage.setItem('userToken', data.data.token);
        console.log('userSlice: 토큰 AsyncStorage 저장 완료');
      }
      
      if (data.data.refreshToken) {
        await AsyncStorage.setItem('refreshToken', data.data.refreshToken);
        console.log('userSlice: 리프레시 토큰 AsyncStorage 저장 완료');
      }
      
      return data.data;
    } catch (error) {
      console.error('userSlice: 회원가입 실패', error);
      return rejectWithValue(error.message);
    }
  }
);

// User Slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // 로그아웃
    logout: (state) => {
      console.log('userSlice: 로그아웃 처리');
      state.isLoggedIn = false;
      state.userInfo = null;
      state.token = null;
      state.apartment = initialState.apartment;
      state.emergencyContacts = [];
      
      // AsyncStorage에서 토큰 삭제
      AsyncStorage.removeItem('userToken').catch(console.error);
      AsyncStorage.removeItem('refreshToken').catch(console.error);
    },
    
    // 사용자 정보 업데이트
    updateUserInfo: (state, action) => {
      state.userInfo = { ...state.userInfo, ...action.payload };
    },
    
    // 아파트 정보 업데이트
    updateApartmentInfo: (state, action) => {
      state.apartment = { ...state.apartment, ...action.payload };
    },
    
    // 비상연락처 추가
    addEmergencyContact: (state, action) => {
      state.emergencyContacts.push(action.payload);
    },
    
    // 비상연락처 제거
    removeEmergencyContact: (state, action) => {
      state.emergencyContacts = state.emergencyContacts.filter(
        contact => contact.id !== action.payload
      );
    },
    
    // 설정 업데이트
    updatePreferences: (state, action) => {
      const { category, settings } = action.payload;
      state.preferences[category] = { ...state.preferences[category], ...settings };
    },
    
    // 에러 초기화
    clearError: (state) => {
      state.error = null;
    },
  },
  
  extraReducers: (builder) => {
    // 로그인
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isLoggedIn = true;
        state.userInfo = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
    
    // 회원가입
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isLoggedIn = true;
        state.userInfo = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
    
    // 자동 로그인
    builder
      .addCase(loadStoredAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        state.loading = false;
        state.isLoggedIn = true;
        state.userInfo = action.payload.user;
        state.token = action.payload.token;
        console.log('userSlice: 자동 로그인 상태 업데이트 완료');
      })
      .addCase(loadStoredAuth.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isLoggedIn = false;
        state.userInfo = null;
        state.token = null;
        console.log('userSlice: 자동 로그인 실패, 로그아웃 상태로 설정');
      });
  },
});

// 액션 내보내기
export const {
  logout,
  updateUserInfo,
  updateApartmentInfo,
  addEmergencyContact,
  removeEmergencyContact,
  updatePreferences,
  clearError,
} = userSlice.actions;

// 셀렉터
export const selectUser = (state) => state.user;
export const selectIsLoggedIn = (state) => state.user.isLoggedIn;
export const selectUserInfo = (state) => state.user.userInfo;
export const selectApartment = (state) => state.user.apartment;
export const selectEmergencyContacts = (state) => state.user.emergencyContacts;
export const selectPreferences = (state) => state.user.preferences;

export default userSlice.reducer;