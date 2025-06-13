import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import apiService from '../services/apiService';

const HelpScreen = ({ navigation }) => {
  const [helpRequests, setHelpRequests] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const { userApartment } = useSelector(state => state.user);

  const categories = [
    { id: 'all', name: '전체', icon: '📋' },
    { id: 'shopping', name: '장보기', icon: '🛒' },
    { id: 'delivery', name: '택배', icon: '📦' },
    { id: 'repair', name: '수리', icon: '🔧' },
    { id: 'tech', name: 'IT도움', icon: '💻' },
    { id: 'other', name: '기타', icon: '🤝' },
  ];

  useEffect(() => {
    console.log('HelpScreen: Component mounted');
    fetchHelpRequests();
  }, [selectedCategory, userApartment]);

  const fetchHelpRequests = async () => {
    try {
      console.log('HelpScreen: Fetching help requests', { 
        apartment: userApartment, 
        category: selectedCategory 
      });
      
      setLoading(true);
      
      const response = await apiService.getHelpRequests(userApartment, selectedCategory);
      console.log('HelpScreen: Help requests fetched successfully', response);
      
      setHelpRequests(response.requests || []);
    } catch (error) {
      console.error('HelpScreen: Failed to fetch help requests', error);
      
      // 폴백: 더미 데이터 사용
      setHelpRequests(getDummyRequests());
    } finally {
      setLoading(false);
    }
  };

  const getDummyRequests = () => {
    return [
      {
        id: '1',
        title: '마트에서 장보기 도움 요청',
        description: '무거운 물건들이 많아서 함께 가서 도와주실 분 구합니다.',
        category: 'shopping',
        urgency: 'medium',
        requester: '김이웃',
        estimatedDuration: 60,
        reward: { type: 'money', amount: 10000 },
        status: 'open',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1시간 전
        applicants: ['박도우미']
      },
      {
        id: '2',
        title: '택배 대신 받아주세요',
        description: '내일 오후에 택배가 오는데 회사에 있어서 받을 수 없습니다.',
        category: 'delivery',
        urgency: 'high',
        requester: '이직장인',
        estimatedDuration: 15,
        reward: { type: 'favor', amount: null },
        status: 'open',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3시간 전
        applicants: []
      }
    ];
  };

  const createNewRequest = () => {
    console.log('HelpScreen: Create new request');
    Alert.alert("알림", "도움 요청 작성 기능은 곧 추가될 예정입니다.");
  };

  const handleRequestPress = (request) => {
    console.log('HelpScreen: Request pressed', request.id);
    
    if (request.status === 'open') {
      Alert.alert(
        request.title,
        request.description,
        [
          { text: "취소", style: "cancel" },
          { text: "도움 신청", onPress: () => applyForHelp(request.id) }
        ]
      );
    } else {
      Alert.alert("알림", "이미 진행 중인 요청입니다.");
    }
  };

  const applyForHelp = async (requestId) => {
    try {
      console.log('HelpScreen: Applying for help', requestId);
      
      await apiService.acceptHelpRequest(requestId);
      Alert.alert("성공", "도움 신청이 완료되었습니다!");
      fetchHelpRequests();
      
    } catch (error) {
      console.error('HelpScreen: Failed to apply for help', error);
      Alert.alert("오류", "도움 신청에 실패했습니다.");
    }
  };

  const getCategoryIcon = (category) => {
    const categoryData = categories.find(cat => cat.id === category);
    return categoryData ? categoryData.icon : '🤝';
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return '#FF3B30';
      case 'medium': return '#FF9500';
      case 'low': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const getUrgencyText = (urgency) => {
    switch (urgency) {
      case 'high': return '긴급';
      case 'medium': return '보통';
      case 'low': return '여유';
      default: return '보통';
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return '방금 전';
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    return `${days}일 전`;
  };

  const renderRequest = ({ item }) => (
    <TouchableOpacity 
      style={styles.requestCard}
      onPress={() => handleRequestPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.requestHeader}>
        <Text style={styles.categoryIcon}>{getCategoryIcon(item.category)}</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.requesterName}>{item.requester}</Text>
          <Text style={styles.timestamp}>{formatTimeAgo(item.createdAt)}</Text>
        </View>
        <View style={[
          styles.urgencyBadge,
          { backgroundColor: getUrgencyColor(item.urgency) }
        ]}>
          <Text style={styles.urgencyText}>{getUrgencyText(item.urgency)}</Text>
        </View>
      </View>

      <Text style={styles.requestTitle} numberOfLines={1}>
        {item.title}
      </Text>

      <Text style={styles.requestDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.requestFooter}>
        <Text style={styles.duration}>⏱️ {item.estimatedDuration}분</Text>
        <Text style={styles.reward}>
          {item.reward.type === 'money' 
            ? `💰 ${item.reward.amount?.toLocaleString()}원`
            : item.reward.type === 'favor'
            ? '🤝 품앗이'
            : '🎁 선물'
          }
        </Text>
        <Text style={styles.applicants}>
          👥 {item.applicants?.length || 0}명 신청
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>도움 요청/제공</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={createNewRequest}
        >
          <Text style={styles.createButtonText}>+ 요청하기</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={helpRequests}
        renderItem={renderRequest}
        keyExtractor={item => item.id}
        refreshing={loading}
        onRefresh={fetchHelpRequests}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.requestsList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🤝</Text>
            <Text style={styles.emptyText}>
              아직 도움 요청이 없습니다.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  createButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  createButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  requestsList: {
    paddingVertical: 8,
  },
  requestCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  requesterName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  urgencyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  requestDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  duration: {
    fontSize: 12,
    color: '#666',
  },
  reward: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  applicants: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
});

export default HelpScreen;
