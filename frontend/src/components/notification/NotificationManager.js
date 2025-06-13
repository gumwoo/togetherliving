import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import firebaseService from '../../config/firebase';

const NotificationManager = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector(state => state.user);
  const [fcmToken, setFcmToken] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(false);

  useEffect(() => {
    initializeNotifications();
  }, []);

  const initializeNotifications = async () => {
    try {
      console.log('📱 알림 관리자 초기화 시작');

      // FCM 토큰 가져오기
      const token = firebaseService.getFCMTokenSync();
      if (token) {
        setFcmToken(token);
        console.log('📱 FCM 토큰 설정 완료');
      }

      // 권한 상태 확인
      const hasPermission = await firebaseService.requestUserPermission();
      setNotificationPermission(hasPermission);

    } catch (error) {
      console.error('❌ 알림 초기화 실패:', error);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const granted = await firebaseService.requestUserPermission();
      setNotificationPermission(granted);

      if (granted) {
        Alert.alert('알림 권한', '알림 권한이 허용되었습니다.');
        
        // 토큰 다시 가져오기
        const token = await firebaseService.getFCMToken();
        setFcmToken(token);
        
      } else {
        Alert.alert('알림 권한', '알림 권한이 거부되었습니다.');
      }
    } catch (error) {
      console.error('❌ 알림 권한 요청 실패:', error);
      Alert.alert('오류', '알림 권한 요청 중 오류가 발생했습니다.');
    }
  };

  const testPushNotification = () => {
    Alert.alert(
      '테스트 알림',
      '푸시 알림 테스트입니다. 실제 서버에서 알림을 보내려면 FCM 토큰이 필요합니다.',
      [
        { text: '확인', onPress: () => console.log('테스트 알림 확인') }
      ]
    );
  };

  if (!userInfo) {
    return null; // 로그인된 사용자가 없으면 표시하지 않음
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔔 알림 설정</Text>
      
      <View style={styles.statusRow}>
        <Text style={styles.label}>알림 권한:</Text>
        <Text style={[styles.status, notificationPermission ? styles.enabled : styles.disabled]}>
          {notificationPermission ? '허용됨' : '거부됨'}
        </Text>
      </View>

      <View style={styles.statusRow}>
        <Text style={styles.label}>FCM 토큰:</Text>
        <Text style={[styles.status, fcmToken ? styles.enabled : styles.disabled]}>
          {fcmToken ? '획득됨' : '없음'}
        </Text>
      </View>

      {!notificationPermission && (
        <TouchableOpacity 
          style={styles.button} 
          onPress={requestNotificationPermission}
        >
          <Text style={styles.buttonText}>알림 권한 요청</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity 
        style={[styles.button, styles.testButton]} 
        onPress={testPushNotification}
      >
        <Text style={styles.buttonText}>알림 테스트</Text>
      </TouchableOpacity>

      {fcmToken && (
        <View style={styles.tokenContainer}>
          <Text style={styles.tokenLabel}>FCM 토큰 (개발용):</Text>
          <Text style={styles.tokenText} numberOfLines={3}>
            {fcmToken}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  enabled: {
    color: '#4CAF50',
  },
  disabled: {
    color: '#F44336',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#FF9500',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tokenContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  tokenLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  tokenText: {
    fontSize: 10,
    color: '#333',
    fontFamily: 'monospace',
  },
});

export default NotificationManager;
