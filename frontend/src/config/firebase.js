import messaging from '@react-native-firebase/messaging';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { ENV } from './env';

class FirebaseService {
  constructor() {
    this.isInitialized = false;
    this.fcmToken = null;
  }

  // Firebase 서비스 초기화
  async initialize() {
    try {
      console.log('🔥 Firebase 서비스 초기화 시작...');

      // Google Sign-In 설정
      GoogleSignin.configure({
        webClientId: ENV.GOOGLE_WEB_CLIENT_ID,
        offlineAccess: true,
      });

      // FCM 권한 요청
      await this.requestUserPermission();

      // FCM 토큰 가져오기
      await this.getFCMToken();

      // 메시지 리스너 설정
      this.setupMessageListeners();

      this.isInitialized = true;
      console.log('✅ Firebase 서비스 초기화 완료');

    } catch (error) {
      console.error('❌ Firebase 초기화 실패:', error);
    }
  }

  // FCM 권한 요청
  async requestUserPermission() {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('✅ FCM 권한 허용됨:', authStatus);
        return true;
      } else {
        console.log('❌ FCM 권한 거부됨:', authStatus);
        return false;
      }
    } catch (error) {
      console.error('❌ FCM 권한 요청 실패:', error);
      return false;
    }
  }

  // FCM 토큰 가져오기
  async getFCMToken() {
    try {
      const token = await messaging().getToken();
      if (token) {
        this.fcmToken = token;
        console.log('✅ FCM 토큰 획득:', token.substring(0, 50) + '...');
        return token;
      } else {
        console.log('❌ FCM 토큰 획득 실패');
        return null;
      }
    } catch (error) {
      console.error('❌ FCM 토큰 가져오기 실패:', error);
      return null;
    }
  }

  // 메시지 리스너 설정
  setupMessageListeners() {
    // 포그라운드 메시지 처리
    messaging().onMessage(async remoteMessage => {
      console.log('📱 포그라운드 FCM 메시지 수신:', remoteMessage);
      this.handleForegroundMessage(remoteMessage);
    });

    // 백그라운드에서 앱이 열릴 때 메시지 처리
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('📱 백그라운드에서 앱 열림:', remoteMessage);
      this.handleNotificationOpen(remoteMessage);
    });

    // 앱이 종료된 상태에서 알림으로 앱이 열릴 때
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log('📱 종료 상태에서 앱 열림:', remoteMessage);
          this.handleNotificationOpen(remoteMessage);
        }
      });

    // 토큰 갱신 리스너
    messaging().onTokenRefresh(token => {
      console.log('🔄 FCM 토큰 갱신:', token.substring(0, 50) + '...');
      this.fcmToken = token;
      this.updateTokenOnServer(token);
    });
  }

  // 포그라운드 메시지 처리
  handleForegroundMessage(remoteMessage) {
    // TODO: 알림 표시 로직 구현
    console.log('📬 포그라운드 메시지 처리:', {
      title: remoteMessage.notification?.title,
      body: remoteMessage.notification?.body,
      data: remoteMessage.data
    });
  }

  // 알림 클릭 처리
  handleNotificationOpen(remoteMessage) {
    // TODO: 네비게이션 로직 구현
    console.log('🔗 알림 클릭 처리:', {
      title: remoteMessage.notification?.title,
      body: remoteMessage.notification?.body,
      data: remoteMessage.data
    });
  }

  // 서버에 토큰 업데이트
  async updateTokenOnServer(token) {
    try {
      // TODO: API 호출로 서버에 토큰 전송
      console.log('📤 서버에 FCM 토큰 업데이트 예정:', token.substring(0, 50) + '...');
    } catch (error) {
      console.error('❌ 서버 토큰 업데이트 실패:', error);
    }
  }

  // Google 로그인
  async signInWithGoogle() {
    try {
      console.log('🔐 Google 로그인 시도...');

      // Google Sign-In 체크
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Google 로그인 실행
      const { idToken } = await GoogleSignin.signIn();

      // Firebase 인증
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      const userCredential = await auth().signInWithCredential(googleCredential);

      console.log('✅ Google 로그인 성공:', userCredential.user.email);
      return {
        success: true,
        user: userCredential.user
      };

    } catch (error) {
      console.error('❌ Google 로그인 실패:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Firebase 로그아웃
  async signOut() {
    try {
      await auth().signOut();
      await GoogleSignin.signOut();
      console.log('✅ 로그아웃 완료');
      return { success: true };
    } catch (error) {
      console.error('❌ 로그아웃 실패:', error);
      return { success: false, error: error.message };
    }
  }

  // 현재 사용자 가져오기
  getCurrentUser() {
    return auth().currentUser;
  }

  // 인증 상태 리스너
  onAuthStateChanged(callback) {
    return auth().onAuthStateChanged(callback);
  }

  // FCM 토큰 반환
  getFCMTokenSync() {
    return this.fcmToken;
  }
}

// 싱글톤 인스턴스 생성
const firebaseService = new FirebaseService();

export default firebaseService;
