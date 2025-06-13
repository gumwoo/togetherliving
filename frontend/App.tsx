import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { Provider, useDispatch } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { store, persistor } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import LoadingScreen from './src/screens/LoadingScreen';
import firebaseService from './src/config/firebase';
import { loadStoredAuth } from './src/store/slices/userSlice';

// 내부 앱 컴포넌트 (Redux 접근 가능)
const AppContent = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const initializeApp = async () => {
      console.log('App: 앱 초기화 시작');
      
      try {
        // 1. Firebase 서비스 초기화
        console.log('App: Firebase 초기화 시작');
        await firebaseService.initialize();
        
        // 2. 저장된 인증 정보 복원
        console.log('App: 자동 로그인 시도');
        await dispatch(loadStoredAuth());
        
      } catch (error) {
        console.error('App: 초기화 중 오류 발생', error);
      }
    };

    initializeApp();
  }, [dispatch]);

  return <AppNavigator />;
};

function App(): React.JSX.Element {
  console.log('App: Starting 함께살이 application');

  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingScreen />} persistor={persistor}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="#007AFF"
          translucent={false}
        />
        <AppContent />
      </PersistGate>
    </Provider>
  );
}

export default App;
