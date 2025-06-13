const express = require('express');
const router = express.Router();

// 더미 게시글 데이터 (나중에 MongoDB로 대체)
const dummyPosts = [
  {
    id: 1,
    title: "엘리베이터 수리 공지",
    content: "내일(14일) 오전 10시부터 12시까지 엘리베이터 정기점검이 있습니다. 불편을 드려 죄송합니다.",
    category: "notice",
    author: "관리사무소",
    apartment: "시범아파트",
    likeCount: 8,
    commentCount: 3,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2시간 전
    tags: ["공지", "엘리베이터"]
  },
  {
    id: 2,
    title: "김치냉장고 나눠드려요",
    content: "이사로 인해 사용하던 김치냉장고 나눠드립니다. 202동 1505호로 연락주세요!",
    category: "sharing",
    author: "이웃주민A",
    apartment: "시범아파트",
    likeCount: 15,
    commentCount: 7,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5시간 전
    tags: ["나눔", "가전제품"]
  },
  {
    id: 3,
    title: "아이 돌봄 품앗이 하실 분?",
    content: "초등학교 1학년 아이 둘이서 품앗이 돌봄 하실 분 찾습니다. 시간 협의 가능해요.",
    category: "question",
    author: "맘카페",
    apartment: "시범아파트",
    likeCount: 12,
    commentCount: 5,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8시간 전
    tags: ["육아", "품앗이"]
  },
  {
    id: 4,
    title: "택배 대신 받아주실 분",
    content: "내일 오후에 중요한 택배가 오는데 부재중입니다. 101동 1201호 대신 받아주실 분 계신가요?",
    category: "question",
    author: "직장인B",
    apartment: "시범아파트",
    likeCount: 6,
    commentCount: 9,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12시간 전
    tags: ["택배", "도움요청"]
  },
  {
    id: 5,
    title: "분리수거 요일 변경 안내",
    content: "12월부터 재활용품 분리수거 요일이 화요일에서 수요일로 변경됩니다.",
    category: "notice",
    author: "관리사무소",
    apartment: "시범아파트",
    likeCount: 22,
    commentCount: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1일 전
    tags: ["공지", "분리수거"]
  }
];

// 게시글 목록 조회
router.get('/posts', async (req, res) => {
  try {
    console.log('📋 커뮤니티 게시글 목록 요청');
    
    const { apartment, category = 'all', page = 1, limit = 20 } = req.query;
    
    let filteredPosts = dummyPosts;
    
    // 아파트별 필터링
    if (apartment && apartment !== 'all') {
      filteredPosts = filteredPosts.filter(post => 
        post.apartment === apartment
      );
    }
    
    // 카테고리별 필터링
    if (category && category !== 'all') {
      filteredPosts = filteredPosts.filter(post => 
        post.category === category
      );
    }
    
    // 최신순 정렬
    filteredPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // 페이지네이션
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      posts: paginatedPosts,
      totalCount: filteredPosts.length,
      currentPage: parseInt(page),
      totalPages: Math.ceil(filteredPosts.length / limit),
      hasNextPage: endIndex < filteredPosts.length
    });
    
    console.log(`✅ 게시글 ${paginatedPosts.length}개 조회 완료`);
    
  } catch (error) {
    console.error('❌ 게시글 조회 실패:', error);
    res.status(500).json({ 
      success: false,
      error: '게시글 조회 중 오류가 발생했습니다.' 
    });
  }
});

// 게시글 상세 조회
router.get('/posts/:id', async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const post = dummyPosts.find(p => p.id === postId);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '게시글을 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      post: post
    });
    
  } catch (error) {
    console.error('❌ 게시글 상세 조회 실패:', error);
    res.status(500).json({ 
      success: false,
      error: '게시글 조회 중 오류가 발생했습니다.' 
    });
  }
});

// 게시글 작성
router.post('/posts', async (req, res) => {
  try {
    console.log('✍️ 새 게시글 작성 요청');
    
    const { title, content, category, apartment, author, tags } = req.body;
    
    // 유효성 검사
    if (!title || !content || !category) {
      return res.status(400).json({
        success: false,
        message: '필수 필드가 누락되었습니다.'
      });
    }
    
    // 새 게시글 생성
    const newPost = {
      id: Math.max(...dummyPosts.map(p => p.id)) + 1,
      title,
      content,
      category,
      apartment: apartment || '시범아파트',
      author: author || '익명',
      tags: tags || [],
      likeCount: 0,
      commentCount: 0,
      createdAt: new Date().toISOString()
    };
    
    dummyPosts.unshift(newPost); // 맨 앞에 추가
    
    res.status(201).json({
      success: true,
      message: '게시글이 작성되었습니다.',
      post: newPost
    });
    
    console.log(`✅ 새 게시글 작성 완료: ${title}`);
    
  } catch (error) {
    console.error('❌ 게시글 작성 실패:', error);
    res.status(500).json({ 
      success: false,
      error: '게시글 작성 중 오류가 발생했습니다.' 
    });
  }
});

// 게시글 좋아요
router.post('/posts/:id/like', async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const post = dummyPosts.find(p => p.id === postId);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '게시글을 찾을 수 없습니다.'
      });
    }
    
    post.likeCount += 1;
    
    res.json({
      success: true,
      message: '좋아요가 추가되었습니다.',
      likeCount: post.likeCount
    });
    
  } catch (error) {
    console.error('❌ 좋아요 처리 실패:', error);
    res.status(500).json({ 
      success: false,
      error: '좋아요 처리 중 오류가 발생했습니다.' 
    });
  }
});

// 카테고리 목록 조회
router.get('/categories', (req, res) => {
  const categories = [
    { id: 'all', name: '전체', icon: '📋' },
    { id: 'notice', name: '공지', icon: '📢' },
    { id: 'sharing', name: '나눔', icon: '🤝' },
    { id: 'question', name: '질문', icon: '❓' },
    { id: 'emergency', name: '긴급', icon: '🚨' }
  ];
  
  res.json({
    success: true,
    categories: categories
  });
});

module.exports = router;
