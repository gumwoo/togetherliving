const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT 토큰 생성
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m'
  });
};

// 리프레시 토큰 생성
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  });
};

// 토큰 검증 미들웨어
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Authorization 헤더에서 토큰 추출
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '액세스 토큰이 없습니다'
      });
    }

    try {
      // 토큰 검증
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // 사용자 정보 조회
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: '유효하지 않은 토큰입니다'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: '비활성화된 계정입니다'
        });
      }

      // 마지막 접속 시간 업데이트
      user.updateLastSeen();

      // req 객체에 사용자 정보 추가
      req.user = user;
      next();

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: '토큰이 만료되었습니다',
          code: 'TOKEN_EXPIRED'
        });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: '유효하지 않은 토큰입니다',
          code: 'INVALID_TOKEN'
        });
      } else {
        throw error;
      }
    }

  } catch (error) {
    console.error('인증 미들웨어 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    });
  }
};

// 선택적 인증 미들웨어 (토큰이 있으면 사용자 정보 추가, 없어도 통과)
const optionalAuthenticate = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        
        if (user && user.isActive) {
          req.user = user;
          user.updateLastSeen();
        }
      } catch (error) {
        // 토큰이 유효하지 않아도 계속 진행
        console.log('선택적 인증 실패:', error.message);
      }
    }

    next();
  } catch (error) {
    console.error('선택적 인증 미들웨어 오류:', error);
    next(); // 오류가 있어도 계속 진행
  }
};

// 토큰 검증 (미들웨어 없이)
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  generateRefreshToken,
  authenticate,
  optionalAuthenticate,
  verifyToken
};
