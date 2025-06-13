const express = require('express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🚀 간단한 테스트 서버 시작...');

// 기본 라우트만
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '테스트 서버 작동 중'
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy'
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`✅ 테스트 서버가 포트 ${PORT}에서 실행 중입니다`);
});
