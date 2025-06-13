import React, { useState, useEffect } from 'react';
import { View, Text, Alert, StyleSheet, TouchableOpacity, ActivityIndicator, PermissionsAndroid, Platform } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Geolocation from '@react-native-community/geolocation';
import { updateSafetyStatus } from '../../store/slices/safetySlice';
import { ENV } from '../../config/env';

const SafetyMonitor = () => {
  const dispatch = useDispatch();
  const { safetyLevel, lastCheckIn, riskFactors, recommendations } = useSelector(state => state.safety);
  const { token, userInfo } = useSelector(state => state.user);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);

  useEffect(() => {
    console.log('SafetyMonitor: Component mounted');
    
    // 위치 추적 시작
    startLocationTracking();
    
    // 컴포넌트 마운트 시 초기 분석 수행
    performSafetyCheck();
    
    // 안전 체크 스케줄링 (30분마다)
    const safetyCheckInterval = setInterval(performSafetyCheck, 1000 * 60 * 30);
    
    return () => {
      console.log('SafetyMonitor: Component unmounted');
      clearInterval(safetyCheckInterval);
    };
  }, []);

  const startLocationTracking = async () => {
    console.log('SafetyMonitor: Starting location tracking');
    
    // Android에서 위치 권한 요청
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: '위치 권한 필요',
            message: '안전 모니터링을 위해 위치 권한이 필요합니다.',
            buttonNeutral: '나중에',
            buttonNegative: '거부',
            buttonPositive: '허용',
          }
        );
        
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('SafetyMonitor: Location permission denied');
          Alert.alert(
            '위치 권한 필요',
            '안전 모니터링 기능을 사용하려면 위치 권한이 필요합니다. 설정에서 권한을 허용해주세요.',
            [{ text: '확인' }]
          );
          return;
        }
      } catch (err) {
        console.warn('SafetyMonitor: Permission request error', err);
        return;
      }
    }
    
    // 위치 추적 시작
    Geolocation.watchPosition(
      (position) => {
        console.log('SafetyMonitor: Location updated', position.coords);
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: new Date()
        });
      },
      (error) => {
        console.error('SafetyMonitor: Location error', error);
        if (error.code === 1) { // PERMISSION_DENIED
          Alert.alert(
            '위치 권한 오류',
            '위치 서비스 권한이 거부되었습니다. 설정에서 권한을 허용해주세요.',
            [{ text: '확인' }]
          );
        }
      },
      { 
        enableHighAccuracy: false, 
        timeout: 20000, 
        maximumAge: 1000 * 60 * 5 // 5분
      }
    );
  };

  const performSafetyCheck = async () => {
    if (isAnalyzing) {
      console.log('SafetyMonitor: Analysis already in progress, skipping');
      return;
    }

    try {
      console.log('SafetyMonitor: Performing safety check');
      setIsAnalyzing(true);
      
      // 1. 앱 사용 패턴 체크
      const appUsageData = await getAppUsageData();
      
      // 2. 위치 변화 체크
      const locationData = currentLocation;
      
      // 3. AI 서버로 데이터 전송 및 분석
      const safetyAnalysis = await analyzeSafetyData({
        appUsage: appUsageData,
        location: locationData,
        lastCheckIn: lastCheckIn,
        userId: userInfo?.id || 'anonymous'
      });
      
      // 4. 분석 결과 저장
      setLastAnalysis({
        ...safetyAnalysis,
        timestamp: new Date().toISOString()
      });
      
      // 5. 분석 히스토리에 추가
      setAnalysisHistory(prev => [
        {
          riskLevel: safetyAnalysis.riskLevel,
          timestamp: new Date().toISOString(),
          confidence: safetyAnalysis.confidence
        },
        ...prev.slice(0, 9) // 최근 10개만 유지
      ]);
      
      // 6. 위험도에 따른 알림 처리
      if (safetyAnalysis.riskLevel > 7) {
        triggerEmergencyAlert(safetyAnalysis);
      } else if (safetyAnalysis.riskLevel > 5) {
        sendCheckInReminder(safetyAnalysis);
      }
      
      // 7. Redux 상태 업데이트
      dispatch(updateSafetyStatus({
        safetyLevel: safetyAnalysis.riskLevel,
        confidence: safetyAnalysis.confidence,
        recommendations: safetyAnalysis.recommendations,
        riskFactors: safetyAnalysis.riskFactors,
        lastAnalysis: new Date().toISOString(),
        fallbackUsed: safetyAnalysis.fallback || false
      }));
      
    } catch (error) {
      console.error('SafetyMonitor: Safety check failed', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 수동 체크인 기능
  const performManualCheckIn = async () => {
    console.log('SafetyMonitor: Manual check-in triggered');
    await performSafetyCheck();
    
    // 체크인 완료 알림
    Alert.alert(
      "체크인 완료! 😊",
      "안전 상태가 업데이트되었습니다.",
      [{ text: "확인", style: "default" }]
    );
  };

  const getAppUsageData = async () => {
    console.log('SafetyMonitor: Collecting app usage data');
    
    // 앱 사용 패턴 수집
    return {
      screenTime: await getScreenTime(),
      appOpenCount: await getAppOpenCount(),
      lastActivity: new Date()
    };
  };

  const getScreenTime = async () => {
    // TODO: 실제 화면 시간 수집 로직 구현
    return Math.floor(Math.random() * 480); // 임시 데이터 (분 단위)
  };

  const getAppOpenCount = async () => {
    // TODO: 앱 실행 횟수 수집 로직 구현
    return Math.floor(Math.random() * 20);
  };

  const analyzeSafetyData = async (data) => {
    try {
      console.log('SafetyMonitor: AI 서버로 분석 요청', data);
      
      // 백엔드 API 호출 (백엔드에서 AI 서버로 전달)
      const response = await fetch(`${ENV.API_BASE_URL}/safety/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          appUsage: data.appUsage,
          location: data.location,
          lastCheckIn: data.lastCheckIn,
          userId: data.userId
        })
      });
      
      if (!response.ok) {
        throw new Error(`API 호출 실패: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('SafetyMonitor: AI 분석 결과 수신', result);
      
      // 응답 데이터 형식 맞추기
      return {
        riskLevel: result.analysis.risk_level,
        confidence: result.analysis.confidence || 0.8,
        recommendations: result.analysis.recommendations || ['안전한 상태입니다'],
        riskFactors: result.analysis.risk_factors || ['분석 완료'],
        timestamp: result.analysis.timestamp || new Date().toISOString(),
        fallback: result.fallback || false,
        modelVersion: result.analysis.model_version || 'unknown'
      };
      
    } catch (error) {
      console.error('SafetyMonitor: AI 분석 오류, 클라이언트 폴백 사용', error);
      
      // 클라이언트 측 폴백 분석
      return performClientFallbackAnalysis(data);
    }
  };

  const performClientFallbackAnalysis = (data) => {
    console.log('SafetyMonitor: Using client-side fallback analysis');
    
    let riskLevel = 0;
    const riskFactors = [];
    
    // 마지막 체크인 시간 검사
    if (data.lastCheckIn) {
      const timeSinceLastCheckIn = Date.now() - new Date(data.lastCheckIn).getTime();
      const hoursSince = timeSinceLastCheckIn / (1000 * 60 * 60);
      
      if (hoursSince > 48) {
        riskLevel += 6;
        riskFactors.push('오랜 체크인 공백');
      } else if (hoursSince > 24) {
        riskLevel += 4;
        riskFactors.push('체크인 지연');
      } else if (hoursSince > 12) {
        riskLevel += 2;
        riskFactors.push('체크인 필요');
      }
    } else {
      riskLevel += 3;
      riskFactors.push('체크인 기록 없음');
    }
    
    // 앱 사용 패턴 검사
    if (data.appUsage) {
      if (data.appUsage.screenTime < 30) {
        riskLevel += 2;
        riskFactors.push('낮은 앱 사용량');
      }
      if (data.appUsage.appOpenCount < 5) {
        riskLevel += 1;
        riskFactors.push('낮은 앱 실행 빈도');
      }
    }
    
    // 위치 정보 검사
    if (!data.location) {
      riskLevel += 1;
      riskFactors.push('위치 정보 없음');
    }
    
    const finalRiskLevel = Math.min(riskLevel, 10);
    
    return {
      riskLevel: finalRiskLevel,
      confidence: 0.6, // 폴백 분석의 신뢰도는 낮음
      recommendations: getClientRecommendations(finalRiskLevel),
      riskFactors: riskFactors.length > 0 ? riskFactors : ['특별한 위험 요소 없음'],
      timestamp: new Date().toISOString(),
      fallback: true,
      modelVersion: 'client-fallback-1.0'
    };
  };

  const getClientRecommendations = (riskLevel) => {
    if (riskLevel >= 8) {
      return [
        '즉시 안전을 확인해주세요 🚨',
        '비상연락처에 연락하세요 📞',
        '안전한 장소로 이동하세요 🏠'
      ];
    } else if (riskLevel >= 6) {
      return [
        '체크인을 해주세요 ✅',
        '가족이나 친구와 연락해보세요 💬',
        '이웃과 소통해보세요 👥'
      ];
    } else if (riskLevel >= 4) {
      return [
        '정기 체크인을 권장합니다 ⏰',
        '커뮤니티 활동에 참여해보세요 🏘️',
        '건강한 생활 패턴을 유지하세요 💪'
      ];
    } else if (riskLevel >= 2) {
      return [
        '좋은 상태를 유지하고 계세요! 😊',
        '꾸준한 체크인을 해주세요 📝'
      ];
    } else {
      return [
        '완벽한 상태입니다! 🎉',
        '안전한 하루 보내세요 ☀️'
      ];
    }
  };

  const triggerEmergencyAlert = (analysisResult) => {
    console.log('SafetyMonitor: Emergency alert triggered');
    
    Alert.alert(
      "🚨 안전 확인 필요",
      `위험도가 높게 감지되었습니다.\n\n${analysisResult.recommendations[0]}\n\n3분 내에 응답하지 않으면 비상연락처에 알림이 전송됩니다.`,
      [
        { text: "괜찮아요", onPress: () => handleSafeConfirmation() },
        { text: "도움 필요", onPress: () => requestEmergencyHelp(), style: "destructive" }
      ]
    );
  };

  const sendCheckInReminder = (analysisResult) => {
    console.log('SafetyMonitor: Check-in reminder sent');
    
    const mainRecommendation = analysisResult.recommendations[0] || "안부 확인이 필요합니다.";
    
    Alert.alert(
      "📋 안부 확인",
      `${mainRecommendation}\n\n오늘 하루는 어떻게 보내고 계신가요?`,
      [
        { text: "좋아요 😊", onPress: () => handleCheckIn('good') },
        { text: "그냥 그래요 😐", onPress: () => handleCheckIn('normal') },
        { text: "힘들어요 😔", onPress: () => handleCheckIn('bad') }
      ]
    );
  };

  const handleSafeConfirmation = () => {
    console.log('SafetyMonitor: Safe confirmation received');
    handleCheckIn('safe');
  };

  const requestEmergencyHelp = () => {
    console.log('SafetyMonitor: Emergency help requested');
    // TODO: 비상 도움 요청 로직 구현
  };

  const handleCheckIn = (mood) => {
    console.log('SafetyMonitor: Check-in with mood:', mood);
    
    dispatch(updateSafetyStatus({
      lastCheckIn: new Date(),
      mood: mood,
      riskLevel: mood === 'good' ? 1 : mood === 'normal' ? 3 : 6
    }));
  };

  const getSafetyStatusText = (level) => {
    if (level <= 2) return '안전 😊';
    if (level <= 5) return '보통 😐';
    if (level <= 7) return '주의 😟';
    return '위험 😨';
  };

  const getSafetyColor = (level) => {
    if (level <= 2) return '#4CAF50'; // 녹색
    if (level <= 5) return '#FF9800'; // 주황색
    if (level <= 7) return '#FF5722'; // 빨간주황색
    return '#F44336'; // 빨간색
  };

  const getSafetyBackgroundColor = (level) => {
    if (level <= 2) return '#E8F5E8'; // 연한 녹색
    if (level <= 5) return '#FFF3E0'; // 연한 주황색
    if (level <= 7) return '#FFEBEE'; // 연한 빨간색
    return '#FFCDD2'; // 연한 빨간색
  };

  const formatTime = (dateString) => {
    if (!dateString) return '없음';
    
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return '방금 전';
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    return `${days}일 전`;
  };

  return (
    <View style={[styles.container, { backgroundColor: getSafetyBackgroundColor(safetyLevel) }]}>
      {/* 안전 상태 헤더 */}
      <View style={styles.headerSection}>
        <View style={styles.statusRow}>
          <Text style={[styles.statusText, { color: getSafetyColor(safetyLevel) }]}>
            {getSafetyStatusText(safetyLevel)}
          </Text>
          <View style={[styles.riskLevelBadge, { backgroundColor: getSafetyColor(safetyLevel) }]}>
            <Text style={styles.riskLevelText}>{safetyLevel}/10</Text>
          </View>
        </View>
        
        {lastAnalysis && (
          <Text style={styles.confidenceText}>
            신뢰도: {Math.round((lastAnalysis.confidence || 0.8) * 100)}%
            {lastAnalysis.fallback && ' (폴백 분석)'}
          </Text>
        )}
      </View>

      {/* 체크인 정보 */}
      <View style={styles.checkInSection}>
        <Text style={styles.lastCheckText}>
          마지막 체크인: {formatTime(lastCheckIn)}
        </Text>
        {currentLocation && (
          <Text style={styles.locationText}>
            위치 업데이트: {formatTime(currentLocation.timestamp)}
          </Text>
        )}
      </View>

      {/* AI 추천사항 */}
      {recommendations && recommendations.length > 0 && (
        <View style={styles.recommendationsSection}>
          <Text style={styles.recommendationsTitle}>💡 추천사항</Text>
          {recommendations.slice(0, 3).map((recommendation, index) => (
            <Text key={index} style={styles.recommendationItem}>
              • {recommendation}
            </Text>
          ))}
        </View>
      )}

      {/* 위험 요소 */}
      {riskFactors && riskFactors.length > 0 && safetyLevel > 3 && (
        <View style={styles.riskFactorsSection}>
          <Text style={styles.riskFactorsTitle}>⚠️ 주의사항</Text>
          {riskFactors.slice(0, 2).map((factor, index) => (
            <Text key={index} style={styles.riskFactorItem}>
              • {factor}
            </Text>
          ))}
        </View>
      )}

      {/* 액션 버튼들 */}
      <View style={styles.actionSection}>
        <TouchableOpacity 
          style={[styles.checkInButton, isAnalyzing && styles.disabledButton]}
          onPress={performManualCheckIn}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.checkInButtonText}>✅ 지금 체크인</Text>
          )}
        </TouchableOpacity>

        {safetyLevel > 5 && (
          <TouchableOpacity 
            style={styles.emergencyButton}
            onPress={() => requestEmergencyHelp()}
          >
            <Text style={styles.emergencyButtonText}>🚨 도움 요청</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 분석 히스토리 미니 차트 */}
      {analysisHistory.length > 1 && (
        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>📊 최근 위험도 변화</Text>
          <View style={styles.historyChart}>
            {analysisHistory.slice(0, 7).reverse().map((item, index) => (
              <View key={index} style={styles.historyBar}>
                <View 
                  style={[
                    styles.historyBarFill,
                    { 
                      height: `${(item.riskLevel / 10) * 100}%`,
                      backgroundColor: getSafetyColor(item.riskLevel)
                    }
                  ]}
                />
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 마지막 분석 시간 */}
      {lastAnalysis && (
        <Text style={styles.lastAnalysisText}>
          마지막 분석: {formatTime(lastAnalysis.timestamp)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  headerSection: {
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  riskLevelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  riskLevelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confidenceText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  checkInSection: {
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  lastCheckText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#999',
  },
  recommendationsSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  recommendationItem: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
    lineHeight: 20,
  },
  riskFactorsSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  riskFactorsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  riskFactorItem: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
    lineHeight: 20,
  },
  actionSection: {
    marginBottom: 16,
    gap: 12,
  },
  checkInButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  checkInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emergencyButton: {
    backgroundColor: '#F44336',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  emergencyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historySection: {
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  historyChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 40,
    gap: 4,
  },
  historyBar: {
    flex: 1,
    height: '100%',
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    justifyContent: 'flex-end',
  },
  historyBarFill: {
    width: '100%',
    borderRadius: 2,
    minHeight: 4,
  },
  lastAnalysisText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default SafetyMonitor;
