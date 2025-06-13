import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ENV } from '../../config/env';

// 초기 상태
const initialState = {
  // 안전 상태
  safetyLevel: 0, // 0-10 (0: 매우 안전, 10: 매우 위험)
  lastCheckIn: null,
  currentLocation: null,
  
  // 체크인 기록
  checkInHistory: [],
  
  // 앱 사용 패턴
  appUsageData: {
    screenTime: 0,
    appOpenCount: 0,
    lastActivity: null,
  },
  
  // AI 분석 결과
  aiAnalysis: {
    riskLevel: 0,
    riskFactors: [],
    recommendations: [],
    confidence: 0,
    lastAnalysis: null,
  },
  
  // 알림 설정
  notifications: {
    nextCheckTime: null,
    reminderEnabled: true,
    emergencyAlertEnabled: true,
  },
  
  // 상태
  loading: false,
  error: null,
  isMonitoring: false,
};

// 비동기 액션: 안전 상태 분석
export const analyzeSafetyStatus = createAsyncThunk(
  'safety/analyze',
  async (data, { rejectWithValue }) => {
    try {
      const response = await fetch(`${ENV.AI_SERVICE_URL}/analyze-safety`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: data.userId,
          app_usage: data.appUsage,
          location: data.location,
          last_checkin: data.lastCheckIn,
          user_history: data.userHistory,
        }),
      });
      
      if (!response.ok) {
        throw new Error('안전 분석 실패');
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 비동기 액션: 체크인 수행
export const performCheckIn = createAsyncThunk(
  'safety/checkIn',
  async ({ mood, message }, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const checkInData = {
        timestamp: new Date().toISOString(),
        mood, // 'good', 'normal', 'bad'
        message: message || '',
        location: state.safety.currentLocation,
        type: 'manual',
      };
      
      // API 호출 (나중에 구현)
      const response = await fetch(`${ENV.API_BASE_URL}/safety/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.user.token}`,
        },
        body: JSON.stringify(checkInData),
      });
      
      if (!response.ok) {
        throw new Error('체크인 실패');
      }
      
      const result = await response.json();
      return { ...checkInData, ...result };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Safety Slice
const safetySlice = createSlice({
  name: 'safety',
  initialState,
  reducers: {
    // 위치 업데이트
    updateLocation: (state, action) => {
      state.currentLocation = {
        latitude: action.payload.latitude,
        longitude: action.payload.longitude,
        timestamp: new Date().toISOString(),
        accuracy: action.payload.accuracy,
      };
    },
    
    // 앱 사용 패턴 업데이트
    updateAppUsage: (state, action) => {
      state.appUsageData = { ...state.appUsageData, ...action.payload };
    },
    
    // 안전 모니터링 시작/중지
    toggleMonitoring: (state) => {
      state.isMonitoring = !state.isMonitoring;
    },
    
    // 모니터링 시작
    startMonitoring: (state) => {
      state.isMonitoring = true;
    },
    
    // 모니터링 중지
    stopMonitoring: (state) => {
      state.isMonitoring = false;
    },
    
    // 안전 상태 업데이트
    updateSafetyStatus: (state, action) => {
      const { riskLevel, recommendations, nextCheckTime, factors } = action.payload;
      
      state.safetyLevel = riskLevel;
      state.aiAnalysis = {
        riskLevel,
        riskFactors: factors || [],
        recommendations: recommendations || [],
        confidence: action.payload.confidence || 0,
        lastAnalysis: new Date().toISOString(),
      };
      state.notifications.nextCheckTime = nextCheckTime;
    },
    
    // 체크인 기록 추가
    addCheckInRecord: (state, action) => {
      state.checkInHistory.unshift(action.payload);
      state.lastCheckIn = action.payload.timestamp;
      
      // 최근 50개 기록만 유지
      if (state.checkInHistory.length > 50) {
        state.checkInHistory = state.checkInHistory.slice(0, 50);
      }
    },
    
    // 알림 설정 업데이트
    updateNotificationSettings: (state, action) => {
      state.notifications = { ...state.notifications, ...action.payload };
    },
    
    // 에러 초기화
    clearError: (state) => {
      state.error = null;
    },
    
    // 안전 데이터 초기화
    resetSafetyData: (state) => {
      state.safetyLevel = 0;
      state.checkInHistory = [];
      state.aiAnalysis = initialState.aiAnalysis;
    },
  },
  
  extraReducers: (builder) => {
    // 안전 상태 분석
    builder
      .addCase(analyzeSafetyStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(analyzeSafetyStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.aiAnalysis = {
          riskLevel: action.payload.risk_level,
          riskFactors: action.payload.risk_factors || [],
          recommendations: action.payload.recommendations || [],
          confidence: action.payload.confidence || 0,
          lastAnalysis: new Date().toISOString(),
        };
        state.safetyLevel = action.payload.risk_level;
        state.notifications.nextCheckTime = action.payload.next_check_time;
      })
      .addCase(analyzeSafetyStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
    
    // 체크인 수행
    builder
      .addCase(performCheckIn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(performCheckIn.fulfilled, (state, action) => {
        state.loading = false;
        state.checkInHistory.unshift(action.payload);
        state.lastCheckIn = action.payload.timestamp;
        
        // 최근 50개 기록만 유지
        if (state.checkInHistory.length > 50) {
          state.checkInHistory = state.checkInHistory.slice(0, 50);
        }
      })
      .addCase(performCheckIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// 액션 내보내기
export const {
  updateLocation,
  updateAppUsage,
  toggleMonitoring,
  startMonitoring,
  stopMonitoring,
  updateSafetyStatus,
  addCheckInRecord,
  updateNotificationSettings,
  clearError,
  resetSafetyData,
} = safetySlice.actions;

// 셀렉터
export const selectSafety = (state) => state.safety;
export const selectSafetyLevel = (state) => state.safety.safetyLevel;
export const selectLastCheckIn = (state) => state.safety.lastCheckIn;
export const selectCurrentLocation = (state) => state.safety.currentLocation;
export const selectCheckInHistory = (state) => state.safety.checkInHistory;
export const selectAiAnalysis = (state) => state.safety.aiAnalysis;
export const selectIsMonitoring = (state) => state.safety.isMonitoring;

export default safetySlice.reducer;