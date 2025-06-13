import ENV from '../config/env';

class ApiService {
  constructor() {
    this.baseURL = ENV.API_BASE_URL;
    this.token = null;
  }

  // 토큰 설정
  setAuthToken(token) {
    this.token = token;
  }

  // 토큰 제거
  clearAuthToken() {
    this.token = null;
  }

  // 기본 요청 메서드
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`API 요청: ${config.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API 응답 성공:', data);
      return data;
    } catch (error) {
      console.error('API 요청 실패:', error);
      throw error;
    }
  }

  // ========== 인증 관련 API ==========

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // ========== 안전 관련 API ==========

  async updateSafetyStatus(data) {
    return this.request('/safety/status', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async performCheckIn(checkInData) {
    return this.request('/safety/checkin', {
      method: 'POST',
      body: JSON.stringify(checkInData),
    });
  }

  async getEmergencyContacts() {
    return this.request('/safety/emergency-contacts');
  }

  async triggerEmergencyAlert(alertData) {
    return this.request('/safety/emergency', {
      method: 'POST',
      body: JSON.stringify(alertData),
    });
  }

  async getSafetyHistory(userId, startDate, endDate) {
    const params = new URLSearchParams({
      user_id: userId,
      start_date: startDate,
      end_date: endDate,
    });
    
    return this.request(`/safety/history?${params.toString()}`);
  }

  // ========== 커뮤니티 관련 API ==========

  async getCommunityPosts(apartment, category = 'all', page = 1, limit = 20) {
    const params = new URLSearchParams({
      apartment,
      category,
      page: page.toString(),
      limit: limit.toString(),
    });
    
    return this.request(`/community/posts?${params.toString()}`);
  }

  async createPost(postData) {
    return this.request('/community/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    });
  }

  async getPostDetail(postId) {
    return this.request(`/community/posts/${postId}`);
  }

  async likePost(postId) {
    return this.request(`/community/posts/${postId}/like`, {
      method: 'POST',
    });
  }

  async addComment(postId, commentData) {
    return this.request(`/community/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
  }

  // ========== 도움 요청/제공 관련 API ==========

  async getHelpRequests(apartment, category = 'all') {
    const params = new URLSearchParams({
      apartment,
      category,
    });
    
    return this.request(`/help/requests?${params.toString()}`);
  }

  async createHelpRequest(requestData) {
    return this.request('/help/requests', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
  }

  async acceptHelpRequest(requestId) {
    return this.request(`/help/requests/${requestId}/accept`, {
      method: 'POST',
    });
  }

  async completeHelpRequest(requestId, feedback) {
    return this.request(`/help/requests/${requestId}/complete`, {
      method: 'POST',
      body: JSON.stringify(feedback),
    });
  }

  // ========== AI 서비스 API ==========

  async requestSafetyAnalysis(analysisData) {
    const aiServiceURL = ENV.AI_SERVICE_URL;
    
    try {
      const response = await fetch(`${aiServiceURL}/analyze-safety`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: analysisData.userId,
          app_usage: analysisData.appUsage,
          location: analysisData.location,
          last_checkin: analysisData.lastCheckIn,
          user_history: analysisData.userHistory,
        }),
      });

      if (!response.ok) {
        throw new Error('AI 분석 요청 실패');
      }

      return await response.json();
    } catch (error) {
      console.error('AI 서비스 오류:', error);
      return this.fallbackSafetyAnalysis(analysisData);
    }
  }

  // 폴백 안전 분석
  fallbackSafetyAnalysis(data) {
    let riskLevel = 0;
    const now = new Date();
    
    if (data.lastCheckIn) {
      const lastCheckIn = new Date(data.lastCheckIn);
      const hoursSinceLastCheckIn = (now - lastCheckIn) / (1000 * 60 * 60);

      if (hoursSinceLastCheckIn > 48) riskLevel += 8;
      else if (hoursSinceLastCheckIn > 24) riskLevel += 6;
      else if (hoursSinceLastCheckIn > 12) riskLevel += 3;
    }

    if (data.appUsage?.screenTime < 30) riskLevel += 4;
    if (data.appUsage?.appOpenCount < 5) riskLevel += 2;

    return {
      risk_level: Math.min(riskLevel, 10),
      recommendations: this.generateRecommendations(riskLevel),
      next_check_time: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(),
      risk_factors: ['fallback_analysis']
    };
  }

  generateRecommendations(riskLevel) {
    if (riskLevel >= 8) {
      return ['즉시 안전 확인이 필요합니다', '비상연락처에 연락하세요'];
    } else if (riskLevel >= 6) {
      return ['안부를 확인해주세요', '가족/친구와 연락해보세요'];
    } else if (riskLevel >= 4) {
      return ['규칙적인 체크인을 권장합니다', '이웃과 소통해보세요'];
    }
    return ['안전한 상태입니다', '건강한 하루 되세요'];
  }
}

const apiService = new ApiService();
export default apiService;