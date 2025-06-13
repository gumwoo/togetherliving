# 백엔드 API 및 AI 서비스 구현

## AI 분석 서비스

### AI 서비스 구현
```javascript
// services/aiService.js
const axios = require('axios');

class AIService {
  constructor() {
    this.pythonServiceURL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  }

  // 안전 위험도 분석
  async analyzeSafetyRisk(data) {
    try {
      const response = await axios.post(`${this.pythonServiceURL}/analyze-safety`, {
        user_id: data.userId,
        app_usage: data.appUsage,
        location: data.location,
        last_checkin: data.lastCheckIn,
        user_history: data.userHistory
      });

      return {
        riskLevel: response.data.risk_level,
        recommendations: response.data.recommendations,
        nextCheckTime: response.data.next_check_time,
        factors: response.data.risk_factors
      };
    } catch (error) {
      console.error('AI 분석 서비스 오류:', error);
      // 폴백: 간단한 규칙 기반 분석
      return this.fallbackSafetyAnalysis(data);
    }
  }

  // 폴백 안전 분석 (AI 서비스 장애 시)
  fallbackSafetyAnalysis(data) {
    let riskLevel = 0;
    const now = new Date();
    const lastCheckIn = new Date(data.lastCheckIn);
    const hoursSinceLastCheckIn = (now - lastCheckIn) / (1000 * 60 * 60);

    // 마지막 체크인 시간에 따른 위험도
    if (hoursSinceLastCheckIn > 48) riskLevel += 8;
    else if (hoursSinceLastCheckIn > 24) riskLevel += 6;
    else if (hoursSinceLastCheckIn > 12) riskLevel += 3;

    // 앱 사용 패턴에 따른 위험도
    if (data.appUsage?.screenTime < 30) riskLevel += 4; // 30분 미만
    if (data.appUsage?.appOpenCount < 5) riskLevel += 2; // 하루 5회 미만

    // 위치 변화에 따른 위험도
    if (data.location && this.isLocationStagnant(data.location)) {
      riskLevel += 3;
    }

    return {
      riskLevel: Math.min(riskLevel, 10),
      recommendations: this.generateRecommendations(riskLevel),
      nextCheckTime: new Date(now.getTime() + 6 * 60 * 60 * 1000), // 6시간 후
      factors: ['fallback_analysis']
    };
  }

  // 위치 정체 확인
  isLocationStagnant(location) {
    // 24시간 동안 같은 위치(100m 반경)에 있는지 확인
    // 실제로는 이전 위치 데이터와 비교 필요
    return false; // 간단한 구현
  }

  // 추천 사항 생성
  generateRecommendations(riskLevel) {
    if (riskLevel >= 8) {
      return ['즉시 안전 확인이 필요합니다', '비상연락처에 연락하세요'];
    } else if (riskLevel >= 6) {
      return ['안부를 확인해주세요', '가족/친구와 연락해보세요'];
    } else if (riskLevel >= 4) {
      return ['규칙적인 체크인을 권장합니다', '이웃과 소통해보세요'];
    }
    return ['안전한 상태입니다', '건강한 하루 되세요'];
  }
}

module.exports = new AIService();

// services/notificationService.js
const admin = require('firebase-admin');
const serviceAccount = require('../config/firebase-service-account.json');

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

class NotificationService {
  // 응급상황 확인 알림
  async sendEmergencyConfirmation(user) {
    const message = {
      notification: {
        title: '🚨 안전 확인',
        body: '지금 괜찮으신가요? 3분 내에 응답해주세요.'
      },
      data: {
        type: 'emergency_confirmation',
        userId: user._id.toString()
      },
      tokens: user.deviceTokens
    };

    try {
      const response = await admin.messaging().sendMulticast(message);
      console.log('응급 확인 알림 발송:', response.successCount);
      return response;
    } catch (error) {
      console.error('알림 발송 실패:', error);
      throw error;
    }
  }

  // 비상연락처에 응급 알림
  async sendEmergencyAlert(user, riskAnalysis) {
    const alertMessage = `${user.nickname}님의 안전 상태를 확인해주세요. 
    위험도: ${riskAnalysis.riskLevel}/10
    위치: ${user.apartment.name} ${user.apartment.building}동 ${user.apartment.unit}호
    시간: ${new Date().toLocaleString('ko-KR')}`;

    // SMS 발송 (외부 SMS 서비스 연동 필요)
    for (const contact of user.emergencyContacts) {
      try {
        await this.sendSMS(contact.phone, alertMessage);
        console.log(`응급 알림 SMS 발송: ${contact.phone}`);
      } catch (error) {
        console.error(`SMS 발송 실패: ${contact.phone}`, error);
      }
    }

    // 관리사무소에도 알림 (선택사항)
    await this.notifyManagementOffice(user, riskAnalysis);
  }

  // SMS 발송 (예시 - 실제 SMS 서비스 연동 필요)
  async sendSMS(phone, message) {
    // 실제로는 Twilio, AWS SNS, 또는 국내 SMS 서비스 연동
    console.log(`SMS to ${phone}: ${message}`);
    return Promise.resolve();
  }

  // 관리사무소 알림
  async notifyManagementOffice(user, riskAnalysis) {
    // 관리사무소 시스템 연동 (선택사항)
    console.log(`관리사무소 알림: ${user.apartment.name} ${user.apartment.building}동 ${user.apartment.unit}호 안전 확인 요청`);
  }

  // 체크인 리마인더
  async sendCheckInReminder(user) {
    const message = {
      notification: {
        title: '😊 안부 확인',
        body: '오늘 하루는 어떻게 보내고 계신가요?'
      },
      data: {
        type: 'checkin_reminder',
        userId: user._id.toString()
      },
      tokens: user.deviceTokens
    };

    try {
      const response = await admin.messaging().sendMulticast(message);
      console.log('체크인 리마인더 발송:', response.successCount);
      return response;
    } catch (error) {
      console.error('리마인더 발송 실패:', error);
      throw error;
    }
  }

  // 커뮤니티 알림
  async sendCommunityNotification(apartmentName, postData) {
    // 같은 아파트 사용자들에게 새 게시글 알림
    const message = {
      notification: {
        title: `${postData.category === 'emergency' ? '🚨' : '📢'} 새 게시글`,
        body: `${postData.title}`
      },
      data: {
        type: 'new_post',
        postId: postData.id,
        apartment: apartmentName
      },
      topic: `apartment_${apartmentName.replace(/\s+/g, '_')}`
    };

    try {
      const response = await admin.messaging().send(message);
      console.log('커뮤니티 알림 발송:', response);
      return response;
    } catch (error) {
      console.error('커뮤니티 알림 발송 실패:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
```

## Python AI 분석 서버

### AI 분석 서버 구현
```python
# ai_server/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import joblib
import logging
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

app = FastAPI(title="함께살이 AI 분석 서비스")

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 데이터 모델 정의
class AppUsageData(BaseModel):
    screen_time: float  # 분 단위
    app_open_count: int
    last_activity: datetime

class LocationData(BaseModel):
    latitude: float
    longitude: float
    timestamp: datetime
    accuracy: Optional[float] = None

class SafetyAnalysisRequest(BaseModel):
    user_id: str
    app_usage: AppUsageData
    location: LocationData
    last_checkin: datetime
    user_history: List[Dict[str, Any]]

class SafetyAnalysisResponse(BaseModel):
    risk_level: int
    recommendations: List[str]
    next_check_time: datetime
    risk_factors: List[str]

class SafetyAnalyzer:
    def __init__(self):
        self.scaler = StandardScaler()
        self.anomaly_detector = IsolationForest(contamination=0.1, random_state=42)
        self.is_trained = False
        
    def extract_features(self, data: SafetyAnalysisRequest) -> np.array:
        """사용자 데이터에서 특징 추출"""
        now = datetime.now()
        
        # 시간 관련 특징
        hours_since_checkin = (now - data.last_checkin).total_seconds() / 3600
        hours_since_last_activity = (now - data.app_usage.last_activity).total_seconds() / 3600
        
        # 앱 사용 관련 특징
        screen_time_normalized = min(data.app_usage.screen_time / 480, 2.0)  # 8시간 기준 정규화
        app_usage_frequency = min(data.app_usage.app_open_count / 50, 2.0)   # 하루 50회 기준
        
        # 위치 관련 특징 (간단한 구현)
        location_staleness = self.calculate_location_staleness(data.location, data.user_history)
        
        # 시간대 특징
        current_hour = now.hour
        is_night_time = 1 if 22 <= current_hour or current_hour <= 6 else 0
        is_work_hours = 1 if 9 <= current_hour <= 18 else 0
        
        features = np.array([
            hours_since_checkin,
            hours_since_last_activity,
            screen_time_normalized,
            app_usage_frequency,
            location_staleness,
            is_night_time,
            is_work_hours
        ])
        
        return features.reshape(1, -1)
    
    def calculate_location_staleness(self, current_location: LocationData, history: List[Dict]) -> float:
        """위치 정체도 계산"""
        if not history:
            return 0.0
            
        # 최근 24시간 위치 데이터 분석
        recent_locations = []
        for record in history[-24:]:  # 최근 24개 기록
            if 'location' in record.get('data', {}):
                loc = record['data']['location']
                recent_locations.append((loc.get('latitude'), loc.get('longitude')))
        
        if len(recent_locations) < 2:
            return 0.0
        
        # 위치 변화량 계산
        movements = []
        for i in range(1, len(recent_locations)):
            prev_lat, prev_lng = recent_locations[i-1]
            curr_lat, curr_lng = recent_locations[i]
            
            if all(v is not None for v in [prev_lat, prev_lng, curr_lat, curr_lng]):
                # 간단한 거리 계산 (실제로는 haversine 공식 사용 권장)
                distance = ((curr_lat - prev_lat) ** 2 + (curr_lng - prev_lng) ** 2) ** 0.5
                movements.append(distance)
        
        if not movements:
            return 0.0
            
        avg_movement = np.mean(movements)
        return 1.0 / (1.0 + avg_movement * 1000)  # 정체도 점수 (0-1)
    
    def analyze_risk(self, data: SafetyAnalysisRequest) -> SafetyAnalysisResponse:
        """위험도 분석 메인 함수"""
        try:
            # 특징 추출
            features = self.extract_features(data)
            
            # 규칙 기반 분석
            risk_level, risk_factors = self.rule_based_analysis(data)
            
            # 이상 탐지 (훈련된 모델이 있는 경우)
            if self.is_trained:
                anomaly_score = self.anomaly_detector.decision_function(features)[0]
                if anomaly_score < -0.5:  # 임계값
                    risk_level = min(risk_level + 2, 10)
                    risk_factors.append('unusual_pattern')
            
            # 추천 사항 생성
            recommendations = self.generate_recommendations(risk_level, risk_factors)
            
            # 다음 체크 시간 계산
            next_check_time = self.calculate_next_check_time(risk_level)
            
            return SafetyAnalysisResponse(
                risk_level=risk_level,
                recommendations=recommendations,
                next_check_time=next_check_time,
                risk_factors=risk_factors
            )
            
        except Exception as e:
            logger.error(f"Risk analysis error: {str(e)}")
            raise HTTPException(status_code=500, detail="위험도 분석 중 오류 발생")
    
    def rule_based_analysis(self, data: SafetyAnalysisRequest) -> tuple:
        """규칙 기반 위험도 분석"""
        risk_level = 0
        risk_factors = []
        
        now = datetime.now()
        
        # 1. 마지막 체크인 시간 분석
        hours_since_checkin = (now - data.last_checkin).total_seconds() / 3600
        if hours_since_checkin > 48:
            risk_level += 6
            risk_factors.append('long_time_no_checkin')
        elif hours_since_checkin > 24:
            risk_level += 4
            risk_factors.append('daily_checkin_missed')
        elif hours_since_checkin > 12:
            risk_level += 2
            risk_factors.append('delayed_checkin')
        
        # 2. 앱 사용 패턴 분석
        hours_since_activity = (now - data.app_usage.last_activity).total_seconds() / 3600
        if hours_since_activity > 12:
            risk_level += 4
            risk_factors.append('no_recent_activity')
        elif hours_since_activity > 6:
            risk_level += 2
            risk_factors.append('reduced_activity')
        
        # 3. 스크린 타임 분석
        if data.app_usage.screen_time < 30:  # 30분 미만
            risk_level += 3
            risk_factors.append('very_low_screen_time')
        elif data.app_usage.screen_time < 60:  # 1시간 미만
            risk_level += 1
            risk_factors.append('low_screen_time')
        
        # 4. 앱 실행 빈도 분석
        if data.app_usage.app_open_count < 5:
            risk_level += 2
            risk_factors.append('low_app_usage')
        
        # 5. 시간대 고려
        current_hour = now.hour
        if 22 <= current_hour or current_hour <= 6:  # 밤시간
            if hours_since_activity > 3:
                risk_level += 1
                risk_factors.append('night_time_inactivity')
        
        return min(risk_level, 10), risk_factors
    
    def generate_recommendations(self, risk_level: int, risk_factors: List[str]) -> List[str]:
        """위험도에 따른 추천 사항 생성"""
        recommendations = []
        
        if risk_level >= 8:
            recommendations.extend([
                "즉시 안전 확인이 필요합니다",
                "비상연락처에 연락하세요",
                "관리사무소에 문의하세요"
            ])
        elif risk_level >= 6:
            recommendations.extend([
                "안부를 확인해주세요",
                "가족이나 친구와 연락해보세요",
                "이웃에게 도움을 요청하세요"
            ])
        elif risk_level >= 4:
            recommendations.extend([
                "규칙적인 체크인을 권장합니다",
                "이웃과 소통해보세요",
                "산책이나 외출을 해보세요"
            ])
        else:
            recommendations.extend([
                "안전한 상태입니다",
                "건강한 하루 되세요",
                "이웃들과 인사해보세요"
            ])
        
        # 위험 요소별 맞춤 추천
        if 'long_time_no_checkin' in risk_factors:
            recommendations.append("정기적인 안부 확인을 위해 알림을 설정하세요")
        
        if 'low_screen_time' in risk_factors or 'no_recent_activity' in risk_factors:
            recommendations.append("스마트폰을 통한 일상 활동을 늘려보세요")
        
        return recommendations[:5]  # 최대 5개 추천
    
    def calculate_next_check_time(self, risk_level: int) -> datetime:
        """다음 체크 시간 계산"""
        now = datetime.now()
        
        if risk_level >= 8:
            return now + timedelta(hours=1)   # 1시간 후
        elif risk_level >= 6:
            return now + timedelta(hours=3)   # 3시간 후
        elif risk_level >= 4:
            return now + timedelta(hours=6)   # 6시간 후
        else:
            return now + timedelta(hours=12)  # 12시간 후

# 전역 분석기 인스턴스
analyzer = SafetyAnalyzer()

@app.post("/analyze-safety", response_model=SafetyAnalysisResponse)
async def analyze_safety(request: SafetyAnalysisRequest):
    """안전 상태 분석 API"""
    try:
        result = analyzer.analyze_risk(request)
        logger.info(f"Safety analysis completed for user {request.user_id}: risk_level={result.risk_level}")
        return result
    except Exception as e:
        logger.error(f"Safety analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail="안전 분석 중 오류가 발생했습니다")

@app.get("/health")
async def health_check():
    """서비스 상태 확인"""
    return {"status": "healthy", "service": "함께살이 AI 분석 서비스"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## 데이터베이스 스키마 및 인덱스 최적화

### MongoDB 인덱스 설정
```javascript
// config/database.js
const mongoose = require('mongoose');

const createIndexes = async () => {
  try {
    // User 컬렉션 인덱스
    await mongoose.connection.collection('users').createIndex({ email: 1 }, { unique: true });
    await mongoose.connection.collection('users').createIndex({ 'apartment.name': 1 });
    await mongoose.connection.collection('users').createIndex({ lastSeen: 1 });

    // SafetyLog 컬렉션 인덱스
    await mongoose.connection.collection('safetylogs').createIndex({ userId: 1, createdAt: -1 });
    await mongoose.connection.collection('safetylogs').createIndex({ status: 1, createdAt: -1 });
    await mongoose.connection.collection('safetylogs').createIndex({ riskLevel: 1 });

    // Post 컬렉션 인덱스
    await mongoose.connection.collection('posts').createIndex({ apartment: 1, createdAt: -1 });
    await mongoose.connection.collection('posts').createIndex({ category: 1, createdAt: -1 });
    await mongoose.connection.collection('posts').createIndex({ author: 1 });
    await mongoose.connection.collection('posts').createIndex({ isActive: 1 });

    console.log('데이터베이스 인덱스 생성 완료');
  } catch (error) {
    console.error('인덱스 생성 실패:', error);
  }
};

module.exports = { createIndexes };
```

이렇게 구현된 기술적 구조를 바탕으로 다음 단계인 구체적인 개발 계획을 제시해드리겠습니다!