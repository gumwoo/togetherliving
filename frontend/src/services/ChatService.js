import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../config/env';

console.log('💬 ChatService 로드됨');

class ChatService {
  constructor() {
    this.socket = null;
    this.chatSocket = null;
    this.isConnected = false;
    this.isAuthenticated = false;
    this.currentRooms = new Set();
    this.eventListeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    
    // 이벤트 콜백들
    this.onMessage = null;
    this.onUserJoined = null;
    this.onUserLeft = null;
    this.onTyping = null;
    this.onMessageRead = null;
    this.onReaction = null;
    this.onConnectionChange = null;
    this.onError = null;
  }

  /**
   * 채팅 서버에 연결
   */
  async connect() {
    try {
      console.log('🔌 채팅 서버 연결 시도...');
      
      // JWT 토큰 가져오기
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('인증 토큰이 없습니다');
      }

      // Socket.io 기본 연결
      this.socket = io(ENV.API_BASE_URL, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      // 채팅 네임스페이스 연결
      this.chatSocket = io(`${ENV.API_BASE_URL}/chat`, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        auth: {
          token: token
        }
      });

      // 연결 이벤트 리스너 설정
      this.setupConnectionListeners();
      
      // 채팅 이벤트 리스너 설정
      this.setupChatListeners();

      // 연결 대기
      await this.waitForConnection();
      
      console.log('✅ 채팅 서버 연결 성공');
      return true;
      
    } catch (error) {
      console.error('❌ 채팅 서버 연결 실패:', error);
      this.handleError(error);
      return false;
    }
  }

  /**
   * 연결 완료까지 대기
   */
  waitForConnection() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('연결 시간 초과'));
      }, 10000);

      this.chatSocket.on('connected', () => {
        clearTimeout(timeout);
        this.isConnected = true;
        this.isAuthenticated = true;
        this.reconnectAttempts = 0;
        resolve();
      });

      this.chatSocket.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  /**
   * 연결 상태 이벤트 리스너 설정
   */
  setupConnectionListeners() {
    // 기본 소켓 연결 이벤트
    this.socket.on('connect', () => {
      console.log('🔌 기본 소켓 연결됨');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 기본 소켓 연결 해제:', reason);
    });

    // 채팅 소켓 연결 이벤트
    this.chatSocket.on('connect', () => {
      console.log('💬 채팅 소켓 연결됨');
      this.isConnected = true;
      this.notifyConnectionChange(true);
    });

    this.chatSocket.on('disconnect', (reason) => {
      console.log('💬 채팅 소켓 연결 해제:', reason);
      this.isConnected = false;
      this.isAuthenticated = false;
      this.notifyConnectionChange(false);
      
      // 자동 재연결 시도
      if (reason !== 'io client disconnect' && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`🔄 재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
        setTimeout(() => this.connect(), 2000 * this.reconnectAttempts);
      }
    });

    this.chatSocket.on('connect_error', (error) => {
      console.error('💬 채팅 소켓 연결 오류:', error);
      this.handleError(error);
    });
  }

  /**
   * 채팅 이벤트 리스너 설정
   */
  setupChatListeners() {
    // 인증 완료
    this.chatSocket.on('connected', (data) => {
      console.log('✅ 채팅 인증 완료:', data);
      this.isAuthenticated = true;
    });

    // 채팅방 참여 성공
    this.chatSocket.on('joined-room', (data) => {
      console.log('🏠 채팅방 참여 성공:', data);
      this.currentRooms.add(data.roomId);
    });

    // 채팅방 나가기 성공
    this.chatSocket.on('left-room', (data) => {
      console.log('🚪 채팅방 나가기 성공:', data);
      this.currentRooms.delete(data.roomId);
    });

    // 새 메시지 수신
    this.chatSocket.on('new-message', (data) => {
      console.log('📨 새 메시지 수신:', data.message.content);
      if (this.onMessage) {
        this.onMessage(data.message);
      }
    });

    // 메시지 전송 성공
    this.chatSocket.on('message-sent', (data) => {
      console.log('✅ 메시지 전송 성공:', data);
      if (this.onMessageSent) {
        this.onMessageSent(data);
      }
    });

    // 메시지 전송 실패
    this.chatSocket.on('message-error', (data) => {
      console.error('❌ 메시지 전송 실패:', data);
      if (this.onMessageError) {
        this.onMessageError(data);
      }
    });

    // 사용자 입장
    this.chatSocket.on('user-joined', (data) => {
      console.log('👤 사용자 입장:', data.nickname);
      if (this.onUserJoined) {
        this.onUserJoined(data);
      }
    });

    // 사용자 퇴장
    this.chatSocket.on('user-left', (data) => {
      console.log('👤 사용자 퇴장:', data.nickname);
      if (this.onUserLeft) {
        this.onUserLeft(data);
      }
    });

    // 타이핑 상태
    this.chatSocket.on('user-typing', (data) => {
      console.log(`⌨️ ${data.nickname} 타이핑 중: ${data.isTyping}`);
      if (this.onTyping) {
        this.onTyping(data);
      }
    });

    // 메시지 읽음
    this.chatSocket.on('messages-read', (data) => {
      console.log('👁️ 메시지 읽음:', data);
      if (this.onMessageRead) {
        this.onMessageRead(data);
      }
    });

    // 리액션 업데이트
    this.chatSocket.on('reaction-updated', (data) => {
      console.log('😊 리액션 업데이트:', data);
      if (this.onReaction) {
        this.onReaction(data);
      }
    });

    // 온라인 사용자 목록
    this.chatSocket.on('online-users', (data) => {
      console.log('👥 온라인 사용자:', data.count);
      if (this.onOnlineUsers) {
        this.onOnlineUsers(data);
      }
    });

    // 에러 처리
    this.chatSocket.on('error', (data) => {
      console.error('💬 채팅 에러:', data);
      this.handleError(new Error(data.message));
    });
  }

  /**
   * 채팅방 참여
   */
  joinRoom(roomId) {
    if (!this.isConnected || !this.isAuthenticated) {
      console.error('❌ 채팅 서버에 연결되지 않음');
      return false;
    }

    console.log(`🏠 채팅방 참여 요청: ${roomId}`);
    this.chatSocket.emit('join-room', { roomId });
    return true;
  }

  /**
   * 채팅방 나가기
   */
  leaveRoom(roomId) {
    if (!this.isConnected) {
      console.error('❌ 채팅 서버에 연결되지 않음');
      return false;
    }

    console.log(`🚪 채팅방 나가기 요청: ${roomId}`);
    this.chatSocket.emit('leave-room', { roomId });
    this.currentRooms.delete(roomId);
    return true;
  }

  /**
   * 메시지 전송
   */
  sendMessage(roomId, content, options = {}) {
    if (!this.isConnected || !this.isAuthenticated) {
      console.error('❌ 채팅 서버에 연결되지 않음');
      return false;
    }

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const messageData = {
      roomId,
      content,
      type: options.type || 'text',
      replyTo: options.replyTo || null,
      attachments: options.attachments || [],
      tempId
    };

    console.log(`📨 메시지 전송: ${content.substring(0, 50)}...`);
    this.chatSocket.emit('send-message', messageData);
    
    return tempId;
  }

  /**
   * 타이핑 시작
   */
  startTyping(roomId) {
    if (!this.isConnected || !this.isAuthenticated) {
      return false;
    }

    this.chatSocket.emit('typing-start', { roomId });
    return true;
  }

  /**
   * 타이핑 중지
   */
  stopTyping(roomId) {
    if (!this.isConnected || !this.isAuthenticated) {
      return false;
    }

    this.chatSocket.emit('typing-stop', { roomId });
    return true;
  }

  /**
   * 메시지 읽음 표시
   */
  markMessagesAsRead(roomId, messageIds = null) {
    if (!this.isConnected || !this.isAuthenticated) {
      return false;
    }

    console.log(`👁️ 메시지 읽음 표시: ${roomId}`);
    this.chatSocket.emit('mark-messages-read', { roomId, messageIds });
    return true;
  }

  /**
   * 리액션 토글
   */
  toggleReaction(messageId, reaction) {
    if (!this.isConnected || !this.isAuthenticated) {
      return false;
    }

    console.log(`😊 리액션 토글: ${reaction}`);
    this.chatSocket.emit('toggle-reaction', { messageId, reaction });
    return true;
  }

  /**
   * 온라인 사용자 목록 요청
   */
  getOnlineUsers(roomId) {
    if (!this.isConnected || !this.isAuthenticated) {
      return false;
    }

    this.chatSocket.emit('get-online-users', { roomId });
    return true;
  }

  /**
   * 연결 해제
   */
  disconnect() {
    console.log('🔌 채팅 서버 연결 해제 중...');
    
    if (this.chatSocket) {
      this.chatSocket.disconnect();
      this.chatSocket = null;
    }
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.isAuthenticated = false;
    this.currentRooms.clear();
    this.eventListeners.clear();
    
    console.log('✅ 채팅 서버 연결 해제 완료');
  }

  /**
   * 이벤트 콜백 설정
   */
  setEventCallbacks(callbacks) {
    this.onMessage = callbacks.onMessage || null;
    this.onMessageSent = callbacks.onMessageSent || null;
    this.onMessageError = callbacks.onMessageError || null;
    this.onUserJoined = callbacks.onUserJoined || null;
    this.onUserLeft = callbacks.onUserLeft || null;
    this.onTyping = callbacks.onTyping || null;
    this.onMessageRead = callbacks.onMessageRead || null;
    this.onReaction = callbacks.onReaction || null;
    this.onOnlineUsers = callbacks.onOnlineUsers || null;
    this.onConnectionChange = callbacks.onConnectionChange || null;
    this.onError = callbacks.onError || null;
  }

  /**
   * 연결 상태 변경 알림
   */
  notifyConnectionChange(isConnected) {
    if (this.onConnectionChange) {
      this.onConnectionChange(isConnected);
    }
  }

  /**
   * 에러 처리
   */
  handleError(error) {
    console.error('💬 ChatService 에러:', error);
    if (this.onError) {
      this.onError(error);
    }
  }

  /**
   * 연결 상태 확인
   */
  isConnectedAndAuthenticated() {
    return this.isConnected && this.isAuthenticated;
  }

  /**
   * 현재 참여 중인 채팅방 목록
   */
  getCurrentRooms() {
    return Array.from(this.currentRooms);
  }

  /**
   * 재연결 시도
   */
  async reconnect() {
    console.log('🔄 수동 재연결 시도...');
    this.disconnect();
    await new Promise(resolve => setTimeout(resolve, 1000));
    return this.connect();
  }
}

// 싱글톤 인스턴스 생성
const chatService = new ChatService();

export default chatService;
