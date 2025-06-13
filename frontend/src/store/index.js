import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';

// Slices (나중에 생성할 예정)
import userSlice from './slices/userSlice';
import safetySlice from './slices/safetySlice';
import communitySlice from './slices/communitySlice';

// Persist 설정
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['user', 'safety'], // 유지할 상태들
  blacklist: ['community'], // 유지하지 않을 상태들
};

// 루트 리듀서
const rootReducer = combineReducers({
  user: userSlice,
  safety: safetySlice,
  community: communitySlice,
});

// Persist 리듀서
const persistedReducer = persistReducer(persistConfig, rootReducer);

// 스토어 설정
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: __DEV__,
});

// Persistor
export const persistor = persistStore(store);

// 타입 정의
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;