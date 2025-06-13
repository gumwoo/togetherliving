import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ENV } from '../../config/env';

// 초기 상태
const initialState = {
  // 게시글 관련
  posts: [],
  selectedCategory: 'all',
  postDetail: null,
  
  // 카테고리
  categories: [
    { id: 'all', name: '전체', icon: '📋' },
    { id: 'notice', name: '공지', icon: '📢' },
    { id: 'sharing', name: '나눔', icon: '🤝' },
    { id: 'question', name: '질문', icon: '❓' },
    { id: 'emergency', name: '긴급', icon: '🚨' },
    { id: 'event', name: '이벤트', icon: '🎉' },
  ],
  
  // 페이지네이션
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalPosts: 0,
    hasMore: true,
  },
  
  // 상태
  loading: false,
  error: null,
  refreshing: false,
};

// 비동기 액션: 게시글 목록 조회
export const fetchCommunityPosts = createAsyncThunk(
  'community/fetchPosts',
  async ({ apartment, category = 'all', page = 1 }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${ENV.API_BASE_URL}/community/posts?apartment=${apartment}&category=${category}&page=${page}&limit=20`
      );
      
      if (!response.ok) {
        throw new Error('게시글 조회 실패');
      }
      
      const data = await response.json();
      return { ...data, page, category };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 비동기 액션: 게시글 상세 조회
export const fetchPostDetail = createAsyncThunk(
  'community/fetchPostDetail',
  async (postId, { rejectWithValue }) => {
    try {
      const response = await fetch(`${ENV.API_BASE_URL}/community/posts/${postId}`);
      
      if (!response.ok) {
        throw new Error('게시글 상세 조회 실패');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 비동기 액션: 게시글 작성
export const createPost = createAsyncThunk(
  'community/createPost',
  async (postData, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const response = await fetch(`${ENV.API_BASE_URL}/community/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.user.token}`,
        },
        body: JSON.stringify(postData),
      });
      
      if (!response.ok) {
        throw new Error('게시글 작성 실패');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// 비동기 액션: 좋아요 토글
export const toggleLike = createAsyncThunk(
  'community/toggleLike',
  async (postId, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const response = await fetch(`${ENV.API_BASE_URL}/community/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${state.user.token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('좋아요 처리 실패');
      }
      
      const data = await response.json();
      return { postId, ...data };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Community Slice
const communitySlice = createSlice({
  name: 'community',
  initialState,
  reducers: {
    // 카테고리 변경
    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
      state.posts = []; // 카테고리 변경 시 게시글 초기화
      state.pagination.currentPage = 1;
      state.pagination.hasMore = true;
    },
    
    // 게시글 목록 초기화
    clearPosts: (state) => {
      state.posts = [];
      state.pagination = initialState.pagination;
    },
    
    // 게시글 상세 초기화
    clearPostDetail: (state) => {
      state.postDetail = null;
    },
    
    // 에러 초기화
    clearError: (state) => {
      state.error = null;
    },
    
    // 로컬 좋아요 업데이트 (optimistic update)
    updatePostLike: (state, action) => {
      const { postId, isLiked, likeCount } = action.payload;
      
      // 게시글 목록에서 업데이트
      const postIndex = state.posts.findIndex(post => post.id === postId);
      if (postIndex !== -1) {
        state.posts[postIndex].isLiked = isLiked;
        state.posts[postIndex].likeCount = likeCount;
      }
      
      // 상세 페이지에서 업데이트
      if (state.postDetail && state.postDetail.id === postId) {
        state.postDetail.isLiked = isLiked;
        state.postDetail.likeCount = likeCount;
      }
    },
  },
  
  extraReducers: (builder) => {
    // 게시글 목록 조회
    builder
      .addCase(fetchCommunityPosts.pending, (state, action) => {
        if (action.meta.arg.page === 1) {
          state.loading = true;
        }
        state.refreshing = action.meta.arg.page === 1;
        state.error = null;
      })
      .addCase(fetchCommunityPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.refreshing = false;
        
        const { posts, pagination, page } = action.payload;
        
        if (page === 1) {
          state.posts = posts;
        } else {
          state.posts = [...state.posts, ...posts];
        }
        
        state.pagination = {
          currentPage: page,
          totalPages: pagination.totalPages,
          totalPosts: pagination.total,
          hasMore: page < pagination.totalPages,
        };
      })
      .addCase(fetchCommunityPosts.rejected, (state, action) => {
        state.loading = false;
        state.refreshing = false;
        state.error = action.payload;
      });
    
    // 게시글 상세 조회
    builder
      .addCase(fetchPostDetail.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPostDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.postDetail = action.payload;
      })
      .addCase(fetchPostDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
    
    // 게시글 작성
    builder
      .addCase(createPost.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.loading = false;
        // 새 게시글을 목록 맨 앞에 추가
        state.posts.unshift(action.payload);
        state.pagination.totalPosts += 1;
      })
      .addCase(createPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
    
    // 좋아요 토글
    builder
      .addCase(toggleLike.fulfilled, (state, action) => {
        const { postId, isLiked, likeCount } = action.payload;
        
        // 게시글 목록에서 업데이트
        const postIndex = state.posts.findIndex(post => post.id === postId);
        if (postIndex !== -1) {
          state.posts[postIndex].isLiked = isLiked;
          state.posts[postIndex].likeCount = likeCount;
        }
        
        // 상세 페이지에서 업데이트
        if (state.postDetail && state.postDetail.id === postId) {
          state.postDetail.isLiked = isLiked;
          state.postDetail.likeCount = likeCount;
        }
      });
  },
});

// 액션 내보내기
export const {
  setSelectedCategory,
  clearPosts,
  clearPostDetail,
  clearError,
  updatePostLike,
} = communitySlice.actions;

// 셀렉터
export const selectCommunity = (state) => state.community;
export const selectPosts = (state) => state.community.posts;
export const selectSelectedCategory = (state) => state.community.selectedCategory;
export const selectPostDetail = (state) => state.community.postDetail;
export const selectCategories = (state) => state.community.categories;
export const selectPagination = (state) => state.community.pagination;

export default communitySlice.reducer;