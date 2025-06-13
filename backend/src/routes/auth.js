const express = require('express');
const router = express.Router();
const {
  register,
  login,
  refreshToken,
  getMe,
  updateProfile,
  registerDeviceToken
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// 공개 라우트 (인증 불필요)
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);

// 보호된 라우트 (인증 필요)
router.use(authenticate); // 이 아래 모든 라우트는 인증이 필요함

router.get('/me', getMe);
router.put('/profile', updateProfile);
router.post('/device-token', registerDeviceToken);

module.exports = router;
