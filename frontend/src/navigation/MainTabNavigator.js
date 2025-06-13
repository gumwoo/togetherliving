import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text, View, StyleSheet } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import CommunityScreen from '../screens/CommunityScreen';
import SafetyScreen from '../screens/SafetyScreen';
import ProfileScreen from '../screens/ProfileScreen';
import HelpScreen from '../screens/HelpScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// 각 탭의 스택 네비게이터들
const HomeStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen}
        options={{ title: '함께살이' }}
      />
      <Stack.Screen 
        name="Help" 
        component={HelpScreen}
        options={{ title: '도움 요청/제공' }}
      />
    </Stack.Navigator>
  );
};

const CommunityStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="CommunityMain" 
        component={CommunityScreen}
        options={{ title: '이웃 커뮤니티' }}
      />
    </Stack.Navigator>
  );
};

const SafetyStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="SafetyMain" 
        component={SafetyScreen}
        options={{ title: '안전 모니터링' }}
      />
    </Stack.Navigator>
  );
};

const ProfileStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="ProfileMain" 
        component={ProfileScreen}
        options={{ title: '내 프로필' }}
      />
    </Stack.Navigator>
  );
};

// 커스텀 탭 바 아이콘 컴포넌트
const TabIcon = ({ focused, color, size, icon, label }) => {
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIcon, { color, fontSize: size }]}>
        {icon}
      </Text>
      <Text style={[styles.tabLabel, { color, fontSize: 10 }]}>
        {label}
      </Text>
    </View>
  );
};

const MainTabNavigator = () => {
  console.log('MainTabNavigator: Rendering main tab navigation');

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#F2F2F7',
          borderTopWidth: 1,
          borderTopColor: '#C6C6C8',
          height: 85,
          paddingTop: 5,
          paddingBottom: 25,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              icon="🏠"
              label="홈"
            />
          ),
          tabBarLabel: '',
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityStackNavigator}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              icon="👥"
              label="커뮤니티"
            />
          ),
          tabBarLabel: '',
        }}
      />
      <Tab.Screen
        name="Safety"
        component={SafetyStackNavigator}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              icon="🛡️"
              label="안전"
            />
          ),
          tabBarLabel: '',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={size}
              icon="👤"
              label="프로필"
            />
          ),
          tabBarLabel: '',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 5,
  },
  tabIcon: {
    marginBottom: 2,
  },
  tabLabel: {
    fontWeight: '500',
  },
});

export default MainTabNavigator;
