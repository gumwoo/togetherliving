const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./src/config/database');

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🚀 함께살이 백엔드 서버 시작...');

// 데이터베이스 연결
connectDB();

// 보안 미들웨어
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS 설정
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [
    'http://localhost:3000',
    'http://localhost:19006',
    'http://localhost:8081'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
app.use(cors(corsOptions));

// 요청 압축
app.use(compression());

// 로깅
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 헬스 체크 엔드포인트
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '함께살이 API 서버가 정상 작동 중입니다',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// API 라우트
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/safety', require('./src/routes/safety'));
app.use('/api/community', require('./src/routes/community'));
app.use('/api/help', require('./src/routes/help'));

// 404 핸들러
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `경로를 찾을 수 없습니다: ${req.originalUrl}`
  });
});

// 글로벌 에러 핸들러
app.use((error, req, res, next) => {
  console.error('❌ 서버 오류:', error);

  // Mongoose 유효성 검사 오류
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      success: false,
      message: '데이터 유효성 검사 실패',
      errors
    });
  }

  // Mongoose 중복 키 오류
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `중복된 ${field}입니다`
    });
  }

  // JWT 오류
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: '유효하지 않은 토큰입니다'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: '토큰이 만료되었습니다'
    });
  }

  // 기본 서버 오류
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || '서버 내부 오류가 발생했습니다',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 서버 시작
const server = app.listen(PORT, () => {
  console.log(`✅ 서버가 포트 ${PORT}에서 실행 중입니다`);
  console.log(`🌍 환경: ${process.env.NODE_ENV}`);
  console.log(`📡 API 베이스 URL: http://localhost:${PORT}/api`);
  console.log(`🏥 헬스 체크: http://localhost:${PORT}/health`);
});

// Socket.io 서버 설정
const io = new Server(server, {
  cors: corsOptions,
  pingTimeout: 60000,
  pingInterval: 25000
});

console.log('💬 Socket.io 서버가 초기화되었습니다');

// 기본 네임스페이스 연결 처리
io.on('connection', (socket) => {
  console.log(`🔌 사용자 연결됨: ${socket.id}`);
  
  socket.on('disconnect', (reason) => {
    console.log(`🔌 사용자 연결 해제: ${socket.id}, 이유: ${reason}`);
  });
});

// 채팅 네임스페이스 생성
const chatNamespace = io.of('/chat');
console.log('💬 채팅 네임스페이스 (/chat) 생성됨');

chatNamespace.on('connection', (socket) => {
  console.log(`💬 채팅 연결됨: ${socket.id}`);
  
  // 사용자 인증 처리 (나중에 JWT 토큰 검증 추가)
  socket.on('authenticate', (data) => {
    console.log(`🔐 사용자 인증 요청: ${socket.id}`);
    // TODO: JWT 토큰 검증 로직 추가
    socket.emit('authenticated', { success: true });
  });
  
  // 채팅방 참여
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`🏠 사용자 ${socket.id}가 채팅방 ${roomId}에 참여했습니다`);
    socket.to(roomId).emit('user-joined', { userId: socket.id });
  });
  
  // 채팅방 나가기
  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    console.log(`🚪 사용자 ${socket.id}가 채팅방 ${roomId}에서 나갔습니다`);
    socket.to(roomId).emit('user-left', { userId: socket.id });
  });
  
  // 연결 해제
  socket.on('disconnect', (reason) => {
    console.log(`💬 채팅 연결 해제: ${socket.id}, 이유: ${reason}`);
  });
});

// Socket.io 인스턴스를 전역에서 사용할 수 있도록 app에 추가
app.set('io', io);
app.set('chatNamespace', chatNamespace);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM 신호 수신. Graceful shutdown 시작...');
  server.close(() => {
    console.log('✅ HTTP 서버가 종료되었습니다');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT 신호 수신. Graceful shutdown 시작...');
  server.close(() => {
    console.log('✅ HTTP 서버가 종료되었습니다');
    process.exit(0);
  });
});

// 예상치 못한 오류 처리
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;
