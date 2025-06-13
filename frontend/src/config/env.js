import Config from 'react-native-config';
import { Platform } from 'react-native';

export const ENV = {
  // 개발 환경
  NODE_ENV: Config.NODE_ENV || 'development',
  API_VERSION: Config.API_VERSION || 'v1',
  
  // API 기본 URL (Android 에뮬레이터 대응)
  API_BASE_URL: __DEV__ 
    ? Platform.OS === 'android' 
      ? 'http://10.0.2.2:5000/api'  // Android 에뮬레이터용
      : 'http://localhost:5000/api'  // iOS 시뮬레이터용
    : 'https://api.togetherliving.kr/api',
  AI_SERVICE_URL: __DEV__
    ? Platform.OS === 'android'
      ? 'http://10.0.2.2:8000'      // Android 에뮬레이터용
      : 'http://localhost:8000'      // iOS 시뮬레이터용
    : 'https://ai.togetherliving.kr',
  
  // Firebase 설정
  FIREBASE_PROJECT_ID: Config.FIREBASE_PROJECT_ID || 'togetherliving-f1dc0',
  
  // Google Maps
  GOOGLE_MAPS_API_KEY: Config.GOOGLE_MAPS_API_KEY || 'AIzaSyDAWiLOD_1_5TLY86I6jDWaYA9PWeQJbAs',
  
  // 카카오 API
  KAKAO: {
    NATIVE_KEY: Config.KAKAO_NATIVE_KEY || 'b2e95c6492b9870732832dc7b43acb65',
    REST_API_KEY: Config.KAKAO_REST_API_KEY || '7701f2db95dee002678aca5ff06a7a99',
    JAVASCRIPT_KEY: Config.KAKAO_JAVASCRIPT_KEY || '3ed1b0b336dc13de3594823b0f3a2885',
    ADMIN_KEY: Config.KAKAO_ADMIN_KEY || 'fd731d1be8d02e4629f1d409e095e742',
  },
  
  // 네이버 API
  NAVER: {
    CLIENT_ID: Config.NAVER_CLIENT_ID || '_ZBFp4SUISiHGJpVfmF5',
    CLIENT_SECRET: Config.NAVER_CLIENT_SECRET || 'VB6mppLWvi',
  },
  
  // Google 로그인용 Web Client ID 추가
  GOOGLE_WEB_CLIENT_ID: '856749131754-qijv63vfd3okam499tdva8vfqmtb5plm.apps.googleusercontent.com',

  // 앱 정보
  APP_NAME: Config.APP_NAME || '함께살이',
  APP_VERSION: Config.APP_VERSION || '1.0.0',
  PACKAGE_NAME: Config.PACKAGE_NAME || 'com.frontend',
  
  // Firebase 설정 객체
  FIREBASE_CONFIG: {
    apiKey: "your_firebase_api_key",
    authDomain: "togetherliving-f1dc0.firebaseapp.com",
    projectId: "togetherliving-f1dc0",
    storageBucket: "togetherliving-f1dc0.appspot.com",
    messagingSenderId: "123456789",
    appId: "your_firebase_app_id"
  }
};

export default ENV;