const express = require('express');
const router = express.Router();

// 더미 도움 요청 데이터
const dummyHelpRequests = [
  {
    id: 1,
    title: "택배 대신 받아주실 분",
    description: "내일 오후 2시경에 중요한 서류가 택배로 오는데 회사에 있어서 받을 수 없습니다. 대신 받아주실 분 계신가요?",
    category: "delivery",
    urgency: "medium",
    requesterId: "user1",
    requesterName: "김직장인",
    apartment: "시범아파트",
    location: {
      type: "apartment",
      details: "101동 1205호"
    },
    estimatedDuration: 10, // 10분
    reward: {
      type: "favor",
      amount: null
    },
    status: "open",
    applicants: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3시간 전
    tags: ["택배", "대신수령"]
  },
  {
    id: 2,
    title: "전구 교체 도와주세요",
    description: "거실 천장 전구가 나갔는데 키가 작아서 교체하기 어렵습니다. 5분 정도 도움 주실 수 있나요?",
    category: "repair",
    urgency: "low",
    requesterId: "user2",
    requesterName: "이혼자",
    apartment: "시범아파트",
    location: {
      type: "apartment",
      details: "102동 805호"
    },
    estimatedDuration: 15,
    reward: {
      type: "money",
      amount: 5000
    },
    status: "open",
    applicants: ["user3"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6시간 전
    tags: ["수리", "전구교체"]
  },
  {
    id: 3,
    title: "장보기 함께 가실 분",
    description: "마트 장보기 함께 가실 분 찾습니다. 무거운 물건들 나눠서 들고 올 수 있어요. 차량 있습니다.",
    category: "shopping",
    urgency: "low",
    requesterId: "user4",
    requesterName: "박이웃",
    apartment: "시범아파트",
    location: {
      type: "outside",
      details: "근처 이마트"
    },
    estimatedDuration: 90,
    reward: {
      type: "none",
      amount: null
    },
    status: "accepted",
    helperId: "user5",
    applicants: ["user5", "user6"],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12시간 전
    tags: ["장보기", "함께"]
  },
  {
    id: 4,
    title: "컴퓨터 문제 해결 도움",
    description: "컴퓨터가 갑자기 느려져서 인터넷도 잘 안되네요. 컴퓨터 잘 아시는 분 도움 부탁드립니다.",
    category: "tech",
    urgency: "medium",
    requesterId: "user7",
    requesterName: "최시니어",
    apartment: "시범아파트",
    location: {
      type: "apartment",
      details: "103동 1502호"
    },
    estimatedDuration: 30,
    reward: {
      type: "gift",
      amount: null
    },
    status: "open",
    applicants: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), // 18시간 전
    tags: ["컴퓨터", "IT지원"]
  }
];

// 도움 요청 목록 조회
router.get('/requests', async (req, res) => {
  try {
    console.log('🤝 도움 요청 목록 조회');
    
    const { apartment, category = 'all', status = 'all', page = 1, limit = 20 } = req.query;
    
    let filteredRequests = dummyHelpRequests;
    
    // 아파트별 필터링
    if (apartment && apartment !== 'all' && apartment !== 'undefined') {
      filteredRequests = filteredRequests.filter(request => 
        request.apartment === apartment
      );
    }
    
    // 카테고리별 필터링
    if (category && category !== 'all') {
      filteredRequests = filteredRequests.filter(request => 
        request.category === category
      );
    }
    
    // 상태별 필터링
    if (status && status !== 'all') {
      filteredRequests = filteredRequests.filter(request => 
        request.status === status
      );
    }
    
    // 최신순 정렬
    filteredRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // 페이지네이션
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedRequests = filteredRequests.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      requests: paginatedRequests,
      totalCount: filteredRequests.length,
      currentPage: parseInt(page),
      totalPages: Math.ceil(filteredRequests.length / limit),
      hasNextPage: endIndex < filteredRequests.length
    });
    
    console.log(`✅ 도움 요청 ${paginatedRequests.length}개 조회 완료`);
    
  } catch (error) {
    console.error('❌ 도움 요청 조회 실패:', error);
    res.status(500).json({ 
      success: false,
      error: '도움 요청 조회 중 오류가 발생했습니다.' 
    });
  }
});

// 도움 요청 상세 조회
router.get('/requests/:id', async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const helpRequest = dummyHelpRequests.find(r => r.id === requestId);
    
    if (!helpRequest) {
      return res.status(404).json({
        success: false,
        message: '도움 요청을 찾을 수 없습니다.'
      });
    }
    
    res.json({
      success: true,
      request: helpRequest
    });
    
  } catch (error) {
    console.error('❌ 도움 요청 상세 조회 실패:', error);
    res.status(500).json({ 
      success: false,
      error: '도움 요청 조회 중 오류가 발생했습니다.' 
    });
  }
});

// 새로운 도움 요청 작성
router.post('/requests', async (req, res) => {
  try {
    console.log('✍️ 새 도움 요청 작성');
    
    const { 
      title, 
      description, 
      category, 
      urgency = 'medium',
      apartment,
      location,
      estimatedDuration,
      reward,
      requesterName,
      tags 
    } = req.body;
    
    // 유효성 검사
    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: '필수 필드가 누락되었습니다.'
      });
    }
    
    // 새 도움 요청 생성
    const newRequest = {
      id: Math.max(...dummyHelpRequests.map(r => r.id)) + 1,
      title,
      description,
      category,
      urgency,
      requesterId: 'current_user', // TODO: 실제 사용자 ID 사용
      requesterName: requesterName || '익명',
      apartment: apartment || '시범아파트',
      location: location || { type: 'apartment', details: '위치 미정' },
      estimatedDuration: estimatedDuration || 30,
      reward: reward || { type: 'favor', amount: null },
      status: 'open',
      applicants: [],
      tags: tags || [],
      createdAt: new Date().toISOString()
    };
    
    dummyHelpRequests.unshift(newRequest); // 맨 앞에 추가
    
    res.status(201).json({
      success: true,
      message: '도움 요청이 등록되었습니다.',
      request: newRequest
    });
    
    console.log(`✅ 새 도움 요청 등록 완료: ${title}`);
    
  } catch (error) {
    console.error('❌ 도움 요청 등록 실패:', error);
    res.status(500).json({ 
      success: false,
      error: '도움 요청 등록 중 오류가 발생했습니다.' 
    });
  }
});

// 도움 요청 지원하기
router.post('/requests/:id/apply', async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const helpRequest = dummyHelpRequests.find(r => r.id === requestId);
    
    if (!helpRequest) {
      return res.status(404).json({
        success: false,
        message: '도움 요청을 찾을 수 없습니다.'
      });
    }
    
    if (helpRequest.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: '이미 마감된 요청입니다.'
      });
    }
    
    const applicantId = 'current_user'; // TODO: 실제 사용자 ID 사용
    
    if (!helpRequest.applicants.includes(applicantId)) {
      helpRequest.applicants.push(applicantId);
    }
    
    res.json({
      success: true,
      message: '도움 요청에 지원하였습니다.',
      applicantCount: helpRequest.applicants.length
    });
    
    console.log(`✅ 도움 요청 지원 완료: ${requestId}`);
    
  } catch (error) {
    console.error('❌ 도움 요청 지원 실패:', error);
    res.status(500).json({ 
      success: false,
      error: '도움 요청 지원 중 오류가 발생했습니다.' 
    });
  }
});

// 도움 요청 수락
router.post('/requests/:id/accept', async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const { helperId } = req.body;
    
    const helpRequest = dummyHelpRequests.find(r => r.id === requestId);
    
    if (!helpRequest) {
      return res.status(404).json({
        success: false,
        message: '도움 요청을 찾을 수 없습니다.'
      });
    }
    
    helpRequest.status = 'accepted';
    helpRequest.helperId = helperId;
    helpRequest.acceptedAt = new Date().toISOString();
    
    res.json({
      success: true,
      message: '도움 요청이 수락되었습니다.',
      request: helpRequest
    });
    
    console.log(`✅ 도움 요청 수락 완료: ${requestId}`);
    
  } catch (error) {
    console.error('❌ 도움 요청 수락 실패:', error);
    res.status(500).json({ 
      success: false,
      error: '도움 요청 수락 중 오류가 발생했습니다.' 
    });
  }
});

// 도움 완료
router.post('/requests/:id/complete', async (req, res) => {
  try {
    const requestId = parseInt(req.params.id);
    const { feedback } = req.body;
    
    const helpRequest = dummyHelpRequests.find(r => r.id === requestId);
    
    if (!helpRequest) {
      return res.status(404).json({
        success: false,
        message: '도움 요청을 찾을 수 없습니다.'
      });
    }
    
    helpRequest.status = 'completed';
    helpRequest.completedAt = new Date().toISOString();
    if (feedback) {
      helpRequest.feedback = feedback;
    }
    
    res.json({
      success: true,
      message: '도움이 완료되었습니다.',
      request: helpRequest
    });
    
    console.log(`✅ 도움 완료: ${requestId}`);
    
  } catch (error) {
    console.error('❌ 도움 완료 처리 실패:', error);
    res.status(500).json({ 
      success: false,
      error: '도움 완료 처리 중 오류가 발생했습니다.' 
    });
  }
});

// 카테고리 목록 조회
router.get('/categories', (req, res) => {
  const categories = [
    { id: 'all', name: '전체', icon: '🏠' },
    { id: 'delivery', name: '택배/배송', icon: '📦' },
    { id: 'shopping', name: '장보기', icon: '🛒' },
    { id: 'repair', name: '수리', icon: '🔧' },
    { id: 'tech', name: 'IT도움', icon: '💻' },
    { id: 'other', name: '기타', icon: '❓' }
  ];
  
  res.json({
    success: true,
    categories: categories
  });
});

module.exports = router;
