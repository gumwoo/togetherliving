import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert 
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { SafetyMonitor } from '../components/safety';
import NotificationManager from '../components/notification/NotificationManager';

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { userInfo, isLoggedIn } = useSelector(state => state.user);
  const { safetyLevel } = useSelector(state => state.safety);

  useEffect(() => {
    console.log('HomeScreen: Component mounted');
    
    if (!isLoggedIn) {
      console.log('HomeScreen: User not authenticated, redirecting to login');
      navigation.replace('Login');
      return;
    }

    loadInitialData();
  }, [isLoggedIn]);

  const loadInitialData = async () => {
    try {
      console.log('HomeScreen: Loading initial data');
      // TODO: 실제 데이터 로딩 로직 구현
      
    } catch (error) {
      console.error('HomeScreen: Failed to load initial data', error);
      Alert.alert('오류', '데이터를 불러오는데 실패했습니다.');
    }
  };

  const navigateToSafety = () => {
    console.log('HomeScreen: Navigating to Safety screen');
    navigation.navigate('Safety');
  };

  const navigateToCommunity = () => {
    console.log('HomeScreen: Navigating to Community screen');
    navigation.navigate('Community');
  };

  const navigateToHelp = () => {
    console.log('HomeScreen: Navigating to Help screen');
    navigation.navigate('Help');
  };

  const quickCheckIn = () => {
    console.log('HomeScreen: Quick check-in performed');
    Alert.alert(
      "빠른 체크인",
      "지금 기분은 어떤가요?",
      [
        { text: "좋아요 😊", onPress: () => handleQuickCheckIn('good') },
        { text: "보통이에요 😐", onPress: () => handleQuickCheckIn('normal') },
        { text: "힘들어요 😔", onPress: () => handleQuickCheckIn('bad') }
      ]
    );
  };

  const handleQuickCheckIn = (mood) => {
    console.log('HomeScreen: Quick check-in with mood:', mood);
    // TODO: Redux 액션 디스패치
  };

  if (!isLoggedIn) {
    return (
      <View style={styles.loadingContainer}>
        <Text>로그인 중...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 헤더 영역 */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          안녕하세요, {userInfo?.nickname || '사용자'}님!
        </Text>
        <Text style={styles.apartmentText}>
          {userInfo?.apartment?.name || '아파트 정보 없음'}
        </Text>
      </View>

      {/* 안전 상태 요약 */}
      <View style={styles.safetySection}>
        <Text style={styles.sectionTitle}>안전 상태</Text>
        <SafetyMonitor />
        
        <TouchableOpacity 
          style={styles.quickActionButton}
          onPress={quickCheckIn}
        >
          <Text style={styles.quickActionText}>빠른 체크인</Text>
        </TouchableOpacity>
      </View>

      {/* 퀵 액션 메뉴 */}
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>빠른 메뉴</Text>
        
        <View style={styles.actionGrid}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={navigateToSafety}
          >
            <Text style={styles.actionIcon}>🛡️</Text>
            <Text style={styles.actionTitle}>안전 모니터링</Text>
            <Text style={styles.actionSubtitle}>상세 안전 정보</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={navigateToCommunity}
          >
            <Text style={styles.actionIcon}>👥</Text>
            <Text style={styles.actionTitle}>이웃 커뮤니티</Text>
            <Text style={styles.actionSubtitle}>소통하고 나누기</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={navigateToHelp}
          >
            <Text style={styles.actionIcon}>🤝</Text>
            <Text style={styles.actionTitle}>도움 요청/제공</Text>
            <Text style={styles.actionSubtitle}>서로 도와주기</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionCard, styles.emergencyCard]}
          >
            <Text style={styles.actionIcon}>🚨</Text>
            <Text style={styles.actionTitle}>응급 상황</Text>
            <Text style={styles.actionSubtitle}>즉시 도움 요청</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 최근 커뮤니티 활동 */}
      <View style={styles.recentActivity}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>이웃 소식</Text>
          <TouchableOpacity onPress={navigateToCommunity}>
            <Text style={styles.seeMoreText}>더보기</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.communityPreview}>
          <View style={styles.previewItem}>
            <Text style={styles.previewIcon}>📢</Text>
            <View style={styles.previewContent}>
              <Text style={styles.previewTitle}>엘리베이터 수리 공지</Text>
              <Text style={styles.previewTime}>2시간 전</Text>
            </View>
          </View>
          
          <View style={styles.previewItem}>
            <Text style={styles.previewIcon}>🤝</Text>
            <View style={styles.previewContent}>
              <Text style={styles.previewTitle}>김치냉장고 나눠드려요</Text>
              <Text style={styles.previewTime}>5시간 전</Text>
            </View>
          </View>
          
          <View style={styles.previewItem}>
            <Text style={styles.previewIcon}>❓</Text>
            <View style={styles.previewContent}>
              <Text style={styles.previewTitle}>택배 대신 받아주실 분</Text>
              <Text style={styles.previewTime}>8시간 전</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 알림 설정 */}
      <NotificationManager />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 50,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  apartmentText: {
    fontSize: 16,
    color: '#E3F2FD',
  },
  safetySection: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  quickActionButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  quickActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  quickActions: {
    margin: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: '#fff',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emergencyCard: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  recentActivity: {
    margin: 16,
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeMoreText: {
    color: '#007AFF',
    fontSize: 14,
  },
  communityPreview: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  previewIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  previewContent: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  previewTime: {
    fontSize: 12,
    color: '#666',
  },
});

export default HomeScreen;
