const express = require('express');
const axios = require('axios');
const router = express.Router();

// AI 서버 URL
const AI_SERVER_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// 안전 상태 조회
router.get('/status', async (req, res) => {
  try {
    console.log('🛡️ 안전 상태 조회 요청');
    
    // TODO: 사용자별 안전 상태 조회 로직 구현
    
    res.json({ 
      message: '안전 상태 조회 완료',
      status: 'safe',
      lastUpdate: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ 안전 상태 조회 실패:', error);
    res.status(500).json({ error: '안전 상태 조회 중 오류가 발생했습니다.' });
  }
});

// AI 안전 분석 요청
router.post('/analyze', async (req, res) => {
  try {
    console.log('🔍 AI 안전 분석 요청 수신');
    
    const {
      appUsage,
      location,
      lastCheckIn,
      userId
    } = req.body;

    // AI 서버에 분석 요청
    const analysisRequest = {
      user_id: userId || 'anonymous',
      app_usage: {
        screen_time: appUsage?.screenTime || 0,
        app_open_count: appUsage?.appOpenCount || 0,
        last_activity: appUsage?.lastActivity || new Date().toISOString()
      },
      location: location ? {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy || 10.0,
        timestamp: location.timestamp || new Date().toISOString()
      } : null,
      last_checkin: lastCheckIn || null
    };

    console.log('📤 AI 서버로 분석 요청 전송:', AI_SERVER_URL);

    try {
      // AI 서버 호출
      const aiResponse = await axios.post(
        `${AI_SERVER_URL}/analyze/safety`,
        analysisRequest,
        {
          timeout: 10000, // 10초 타임아웃
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ AI 분석 결과 수신:', {
        riskLevel: aiResponse.data.risk_level,
        confidence: aiResponse.data.confidence
      });

      res.json({
        success: true,
        analysis: aiResponse.data,
        timestamp: new Date().toISOString()
      });

    } catch (aiError) {
      console.error('❌ AI 서버 연결 실패, 폴백 분석 사용:', aiError.message);
      
      // 폴백: 간단한 규칙 기반 분석
      const fallbackAnalysis = performFallbackAnalysis(analysisRequest);
      
      res.json({
        success: true,
        analysis: fallbackAnalysis,
        fallback: true,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('❌ 안전 분석 실패:', error);
    res.status(500).json({ error: '안전 분석 중 오류가 발생했습니다.' });
  }
});

// 체크인 기록
router.post('/checkin', async (req, res) => {
  try {
    console.log('✅ 안전 체크인 요청');
    
    const { mood, location, note } = req.body;
    
    // TODO: 데이터베이스에 체크인 기록 저장
    
    res.json({
      message: '체크인이 완료되었습니다.',
      checkin: {
        mood,
        location,
        note,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ 체크인 실패:', error);
    res.status(500).json({ error: '체크인 중 오류가 발생했습니다.' });
  }
});

// 응급 상황 신고
router.post('/emergency', async (req, res) => {
  try {
    console.log('🚨 응급 상황 신고 수신');
    
    const { location, type, description } = req.body;
    
    // TODO: 응급 상황 처리 로직
    // 1. 비상연락처에 알림
    // 2. 관리사무소에 통보
    // 3. 이웃에게 알림
    
    res.json({
      message: '응급 상황이 신고되었습니다. 도움이 곧 도착할 예정입니다.',
      emergency: {
        id: generateEmergencyId(),
        type,
        description,
        location,
        timestamp: new Date().toISOString(),
        status: 'reported'
      }
    });
    
  } catch (error) {
    console.error('❌ 응급 상황 신고 실패:', error);
    res.status(500).json({ error: '응급 상황 신고 중 오류가 발생했습니다.' });
  }
});

// 폴백 분석 함수 (AI 서버 장애 시 사용)
function performFallbackAnalysis(request) {
  let riskLevel = 0;
  const riskFactors = [];
  const recommendations = [];

  // 화면 시간 분석
  const screenTime = request.app_usage?.screen_time || 0;
  if (screenTime < 30) {
    riskLevel += 2;
    riskFactors.push('낮은 앱 사용량');
  }

  // 앱 실행 횟수 분석
  const appOpenCount = request.app_usage?.app_open_count || 0;
  if (appOpenCount < 5) {
    riskLevel += 2;
    riskFactors.push('낮은 앱 실행 빈도');
  }

  // 체크인 시간 분석
  if (request.last_checkin) {
    const lastCheckin = new Date(request.last_checkin);
    const hoursSince = (Date.now() - lastCheckin.getTime()) / (1000 * 60 * 60);
    
    if (hoursSince > 48) {
      riskLevel += 4;
      riskFactors.push('오랜 체크인 공백');
    } else if (hoursSince > 24) {
      riskLevel += 2;
      riskFactors.push('체크인 지연');
    }
  }

  // 추천사항 생성
  if (riskLevel >= 6) {
    recommendations.push('즉시 체크인을 해주세요');
    recommendations.push('비상연락처에 연락을 고려해보세요');
  } else if (riskLevel >= 3) {
    recommendations.push('정기 체크인을 해주세요');
  } else {
    recommendations.push('좋은 하루 보내세요!');
  }

  return {
    risk_level: Math.min(riskLevel, 10),
    confidence: 0.7,
    recommendations,
    risk_factors: riskFactors.length > 0 ? riskFactors : ['특별한 위험 요소 없음'],
    timestamp: new Date().toISOString(),
    model_version: 'fallback-1.0.0',
    analysis_details: {
      method: '폴백 규칙 기반 분석',
      features: request.app_usage
    }
  };
}

// 응급 상황 ID 생성
function generateEmergencyId() {
  return 'EMG-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
}

module.exports = router;
