const express = require('express');
const router = express.Router();

// TODO: 사용자 프로필 관련 라우트 구현 예정

router.get('/profile', (req, res) => {
  res.json({ message: 'User profile endpoint - 구현 예정' });
});

module.exports = router;
