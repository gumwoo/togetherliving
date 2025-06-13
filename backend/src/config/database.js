const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('🔌 MongoDB 연결 시도:', process.env.MONGODB_URI);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // 최신 MongoDB 드라이버 옵션들
      maxPoolSize: 10, // 연결 풀 최대 크기
      serverSelectionTimeoutMS: 5000, // 서버 선택 타임아웃
      socketTimeoutMS: 45000, // 소켓 타임아웃
    });

    console.log(`✅ MongoDB 연결 성공: ${conn.connection.host}`);
    
    // 연결 이벤트 리스너들
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB 연결 오류:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB 연결 끊어짐');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB 재연결됨');
    });

    return conn;
  } catch (error) {
    console.error('❌ MongoDB 연결 실패:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
