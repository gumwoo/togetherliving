import React, { useState, useEffect } from 'react';
import { 
  View, 
  FlatList, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  RefreshControl 
} from 'react-native';
import { useSelector } from 'react-redux';
import { ENV } from '../../config/env';

const CommunityBoard = ({ navigation }) => {
  const [posts, setPosts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const { userInfo, token } = useSelector(state => state.user);
  const userApartment = userInfo?.apartment?.name;

  const categories = [
    { id: 'all', name: '전체', icon: '📋' },
    { id: 'notice', name: '공지', icon: '📢' },
    { id: 'sharing', name: '나눔', icon: '🤝' },
    { id: 'question', name: '질문', icon: '❓' },
    { id: 'emergency', name: '긴급', icon: '🚨' }
  ];

  useEffect(() => {
    console.log('CommunityBoard: Component mounted');
    fetchCommunityPosts();
  }, [selectedCategory, userApartment]);

  const fetchCommunityPosts = async () => {
    try {
      console.log('CommunityBoard: Fetching posts', { 
        apartment: userApartment, 
        category: selectedCategory 
      });
      
      setLoading(true);
      
      const response = await fetch(
        `${ENV.API_BASE_URL}/community/posts?apartment=${userApartment}&category=${selectedCategory}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('CommunityBoard: Posts fetched successfully', data);
      
      setPosts(data.posts || []);
    } catch (error) {
      console.error('CommunityBoard: Failed to fetch posts', error);
      
      // 폴백: 더미 데이터 사용
      setPosts(getDummyPosts());
    } finally {
      setLoading(false);
    }
  };

  const getDummyPosts = () => {
    return [
      {
        id: '1',
        title: '아파트 공지사항',
        content: '엘리베이터 점검으로 인해 내일 오전 9시부터 12시까지 운행이 중단됩니다.',
        category: 'notice',
        author: '관리사무소',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2시간 전
        commentCount: 5,
        likeCount: 12
      },
      {
        id: '2',
        title: '김치 나눔합니다',
        content: '어머니가 담가주신 김치가 너무 많아서 나눔합니다. 필요하신 분 댓글 남겨주세요!',
        category: 'sharing',
        author: '김이웃',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4시간 전
        commentCount: 8,
        likeCount: 15
      },
      {
        id: '3',
        title: '택배 대신 받아주실 분',
        content: '내일 오후에 택배가 오는데 회사에 있어서 받을 수 없습니다. 도움 주실 분 있나요?',
        category: 'question',
        author: '박직장인',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6시간 전
        commentCount: 3,
        likeCount: 7
      }
    ];
  };

  const navigateToPost = (postId) => {
    console.log('CommunityBoard: Navigating to post', postId);
    // TODO: 실제 네비게이션 구현
    if (navigation) {
      navigation.navigate('PostDetail', { postId });
    }
  };

  const getCategoryIcon = (category) => {
    const categoryData = categories.find(cat => cat.id === category);
    return categoryData ? categoryData.icon : '📋';
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

  const handleCategorySelect = (categoryId) => {
    console.log('CommunityBoard: Category selected', categoryId);
    setSelectedCategory(categoryId);
  };

  const renderPost = ({ item }) => (
    <TouchableOpacity 
      style={styles.postCard} 
      onPress={() => navigateToPost(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.postHeader}>
        <Text style={styles.category}>{getCategoryIcon(item.category)}</Text>
        <Text style={styles.author}>{item.author}</Text>
        <Text style={styles.timestamp}>{formatTimeAgo(item.createdAt)}</Text>
      </View>
      
      <Text style={styles.title} numberOfLines={1}>
        {item.title}
      </Text>
      
      <Text style={styles.preview} numberOfLines={2}>
        {item.content}
      </Text>
      
      <View style={styles.postFooter}>
        <Text style={styles.commentCount}>💬 {item.commentCount}</Text>
        <Text style={styles.likeCount}>👍 {item.likeCount}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === item.id && styles.selectedCategory
      ]}
      onPress={() => handleCategorySelect(item.id)}
      activeOpacity={0.7}
    >
      <Text style={styles.categoryIcon}>{item.icon}</Text>
      <Text style={[
        styles.categoryText,
        selectedCategory === item.id && styles.selectedCategoryText
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 카테고리 필터 */}
      <View style={styles.categoryFilterContainer}>
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryFilter}
        />
      </View>

      {/* 게시글 리스트 */}
      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchCommunityPosts}
            colors={['#007AFF']}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.postsContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              아직 게시글이 없습니다.
            </Text>
            <Text style={styles.emptySubText}>
              첫 번째 게시글을 작성해보세요!
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
  categoryFilterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryFilter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  selectedCategory: {
    backgroundColor: '#007AFF',
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  selectedCategoryText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  postsContainer: {
    paddingVertical: 8,
  },
  postCard: {
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
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  category: {
    fontSize: 16,
    marginRight: 8,
  },
  author: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  preview: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  commentCount: {
    fontSize: 12,
    color: '#999',
  },
  likeCount: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
  },
});

export default CommunityBoard;
