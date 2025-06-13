import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/userSlice';
import apiService from '../services/apiService';

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.user);

  console.log('ProfileScreen: Component mounted');

  const handleLogout = () => {
    console.log('ProfileScreen: Logout requested');
    Alert.alert(
      "로그아웃",
      "정말로 로그아웃 하시겠습니까?",
      [
        { text: "취소", style: "cancel" },
        { text: "로그아웃", style: "destructive", onPress: confirmLogout }
      ]
    );
  };

  const confirmLogout = () => {
    console.log('ProfileScreen: Logout confirmed');
    dispatch(logout());
    apiService.clearAuthToken();
  };

  const editProfile = () => {
    console.log('ProfileScreen: Edit profile requested');
    Alert.alert("알림", "프로필 편집 기능은 곧 추가될 예정입니다.");
  };

  const manageEmergencyContacts = () => {
    console.log('ProfileScreen: Manage emergency contacts');
    Alert.alert("알림", "비상연락처 관리 기능은 곧 추가될 예정입니다.");
  };

  const managePrivacySettings = () => {
    console.log('ProfileScreen: Manage privacy settings');
    Alert.alert("알림", "개인정보 설정 기능은 곧 추가될 예정입니다.");
  };

  const showAppInfo = () => {
    console.log('ProfileScreen: Show app info');
    Alert.alert(
      "앱 정보",
      "함께살이 v1.0.0\n1인가구 안전 케어 플랫폼",
      [{ text: "확인" }]
    );
  };

  const contactSupport = () => {
    console.log('ProfileScreen: Contact support');
    Alert.alert("알림", "고객지원 기능은 곧 추가될 예정입니다.");
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 프로필 헤더 */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>👤</Text>
        </View>
        <Text style={styles.nickname}>{user?.nickname || '사용자'}</Text>
        <Text style={styles.email}>{user?.email || 'user@example.com'}</Text>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={editProfile}
          activeOpacity={0.7}
        >
          <Text style={styles.editButtonText}>프로필 편집</Text>
        </TouchableOpacity>
      </View>

      {/* 거주지 정보 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>거주지 정보</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>아파트</Text>
            <Text style={styles.infoValue}>
              {user?.apartment?.name || '미설정'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>동/호수</Text>
            <Text style={styles.infoValue}>
              {user?.apartment?.building && user?.apartment?.unit 
                ? `${user.apartment.building} ${user.apartment.unit}`
                : '미설정'
              }
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>휴대폰</Text>
            <Text style={styles.infoValue}>
              {user?.phoneNumber || '미설정'}
            </Text>
          </View>
        </View>
      </View>

      {/* 안전 설정 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>안전 설정</Text>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={manageEmergencyContacts}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>📞</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>비상연락처</Text>
            <Text style={styles.menuDescription}>응급상황 시 연락받을 사람들</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={managePrivacySettings}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>🔒</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>개인정보 설정</Text>
            <Text style={styles.menuDescription}>위치 정보 및 데이터 사용 설정</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* 앱 정보 및 지원 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>앱 정보</Text>
        
        <TouchableOpacity 
          style={styles.menuItem}
          onPress={showAppInfo}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>ℹ️</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>앱 정보</Text>
            <Text style={styles.menuDescription}>버전 정보 및 라이센스</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.menuItem}
          onPress={contactSupport}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>💬</Text>
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>고객지원</Text>
            <Text style={styles.menuDescription}>문의사항 및 피드백</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* 로그아웃 */}
      <View style={styles.section}>
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileHeader: {
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatar: {
    fontSize: 40,
    color: '#fff',
  },
  nickname: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  section: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
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
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 32,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;
