import React from 'react';
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

const SafetyScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { safetyLevel, lastCheckIn } = useSelector(state => state.safety);
  const { user } = useSelector(state => state.user);

  console.log('SafetyScreen: Component mounted');

  const handleEmergencyCall = () => {
    console.log('SafetyScreen: Emergency call triggered');
    Alert.alert(
      "응급 상황",
      "정말로 응급 상황인가요? 비상연락처에 알림이 전송됩니다.",
      [
        { text: "취소", style: "cancel" },
        { text: "응급상황 신고", style: "destructive", onPress: confirmEmergency }
      ]
    );
  };

  const confirmEmergency = () => {
    console.log('SafetyScreen: Emergency confirmed');
    // TODO: 실제 응급상황 처리 로직
    Alert.alert("응급 신고 완료", "비상연락처에 알림이 전송되었습니다.");
  };

  const showSafetyHistory = () => {
    console.log('SafetyScreen: Showing safety history');
    // TODO: 안전 히스토리 화면 네비게이션
    Alert.alert("알림", "안전 히스토리 기능은 곧 추가될 예정입니다.");
  };

  const manageSafetySettings = () => {
    console.log('SafetyScreen: Managing safety settings');
    // TODO: 안전 설정 화면 네비게이션
    Alert.alert("알림", "안전 설정 기능은 곧 추가될 예정입니다.");
  };

  const getSafetyLevelColor = (level) => {
    if (level <= 2) return '#4CAF50'; // 초록
    if (level <= 5) return '#FF9800'; // 주황
    if (level <= 7) return '#F44336'; // 빨강
    return '#9C27B0'; // 보라 (위험)
  };

  const getSafetyStatusText = (level) => {
    if (level <= 2) return '안전';
    if (level <= 5) return '보통';
    if (level <= 7) return '주의';
    return '위험';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 안전 상태 헤더 */}
      <View style={styles.statusHeader}>
        <Text style={styles.headerTitle}>안전 모니터링</Text>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: getSafetyLevelColor(safetyLevel) }
        ]}>
          <Text style={styles.statusText}>
            {getSafetyStatusText(safetyLevel)}
          </Text>
        </View>
      </View>

      {/* 안전 모니터 컴포넌트 */}
      <View style={styles.monitorSection}>
        <SafetyMonitor />
      </View>

      {/* 응급 버튼 */}
      <View style={styles.emergencySection}>
        <Text style={styles.sectionTitle}>응급 상황</Text>
        <TouchableOpacity 
          style={styles.emergencyButton}
          onPress={handleEmergencyCall}
          activeOpacity={0.8}
        >
          <Text style={styles.emergencyIcon}>🚨</Text>
          <Text style={styles.emergencyText}>응급 상황 신고</Text>
          <Text style={styles.emergencySubtext}>
            즉시 비상연락처에 알림이 전송됩니다
          </Text>
        </TouchableOpacity>
      </View>

      {/* 안전 관리 메뉴 */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>안전 관리</Text>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={showSafetyHistory}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>📊</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>안전 히스토리</Text>
            <Text style={styles.menuDescription}>지난 안전 기록 확인</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={manageSafetySettings}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>⚙️</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>안전 설정</Text>
            <Text style={styles.menuDescription}>알림 주기 및 비상연락처 관리</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* 사용자 정보 */}
      <View style={styles.userInfoSection}>
        <Text style={styles.sectionTitle}>내 정보</Text>
        <View style={styles.userInfo}>
          <Text style={styles.userInfoLabel}>닉네임</Text>
          <Text style={styles.userInfoValue}>{user?.nickname || '사용자'}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userInfoLabel}>거주지</Text>
          <Text style={styles.userInfoValue}>
            {user?.apartment?.name || '미설정'}
            {user?.apartment?.building && ` ${user.apartment.building}`}
            {user?.apartment?.unit && ` ${user.apartment.unit}`}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statusHeader: {
    backgroundColor: '#007AFF',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  monitorSection: {
    margin: 16,
  },
  emergencySection: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  emergencyButton: {
    backgroundColor: '#FF3B30',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  emergencyIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  emergencyText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  emergencySubtext: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
    textAlign: 'center',
  },
  menuSection: {
    margin: 16,
  },
  menuItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  menuIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  menuDescription: {
    fontSize: 12,
    color: '#666',
  },
  menuArrow: {
    fontSize: 20,
    color: '#ccc',
  },
  userInfoSection: {
    margin: 16,
    marginBottom: 32,
  },
  userInfo: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  userInfoLabel: {
    fontSize: 14,
    color: '#666',
  },
  userInfoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
});

export default SafetyScreen;
