const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { generateToken, generateRefreshToken } = require('../middleware/auth');

// 회원가입
const register = async (req, res) => {
  try {
    console.log('🔐 회원가입 요청:', { email: req.body.email, nickname: req.body.nickname });

    const { email, password, nickname, phoneNumber, apartment } = req.body;

    // 필수 필드 검증
    if (!email || !password || !nickname) {
      return res.status(400).json({
        success: false,
        message: '이메일, 비밀번호, 닉네임은 필수입니다'
      });
    }

    // 기존 사용자 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: '이미 존재하는 이메일입니다'
      });
    }

    // 닉네임 중복 확인
    const existingNickname = await User.findOne({ nickname });
    if (existingNickname) {
      return res.status(409).json({
        success: false,
        message: '이미 존재하는 닉네임입니다'
      });
    }

    // 새 사용자 생성
    const userData = {
      email,
      password,
      nickname,
      phoneNumber,
      apartment: apartment || {}
    };

    const user = new User(userData);
    await user.save();

    // 토큰 생성
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    console.log('✅ 회원가입 성공:', { userId: user._id, email: user.email });

    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다',
      data: {
        user: {
          id: user._id,
          email: user.email,
          nickname: user.nickname,
          phoneNumber: user.phoneNumber,
          apartment: user.apartment,
          emergencyContacts: user.emergencyContacts,
          preferences: user.preferences,
          safetyProfile: user.safetyProfile,
          createdAt: user.createdAt
        },
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('❌ 회원가입 오류:', error);

    // MongoDB 중복 키 오류 처리
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(409).json({
        success: false,
        message: `이미 존재하는 ${field === 'email' ? '이메일' : field}입니다`
      });
    }

    // 유효성 검사 오류 처리
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: '입력 데이터가 유효하지 않습니다',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    });
  }
};

// 로그인
const login = async (req, res) => {
  try {
    console.log('🔐 로그인 요청:', { email: req.body.email });

    const { email, password } = req.body;

    // 필수 필드 검증
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '이메일과 비밀번호를 입력해주세요'
      });
    }

    // 사용자 찾기 (비밀번호 포함)
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다'
      });
    }

    // 계정 활성 상태 확인
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: '비활성화된 계정입니다'
      });
    }

    // 비밀번호 검증
    const isPasswordValid = await user.matchPassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다'
      });
    }

    // 토큰 생성
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // 마지막 접속 시간 업데이트
    await user.updateLastSeen();

    console.log('✅ 로그인 성공:', { userId: user._id, email: user.email });

    res.json({
      success: true,
      message: '로그인 성공',
      data: {
        user: {
          id: user._id,
          email: user.email,
          nickname: user.nickname,
          phoneNumber: user.phoneNumber,
          apartment: user.apartment,
          emergencyContacts: user.emergencyContacts,
          preferences: user.preferences,
          safetyProfile: user.safetyProfile,
          lastSeen: user.lastSeen
        },
        token,
        refreshToken
      }
    });

  } catch (error) {
    console.error('❌ 로그인 오류:', error);
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다'
    });
  }
};

// 토큰 갱신
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '리프레시 토큰이 없습니다'
      });
    }

    // 리프레시 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: '유효하지 않은 리프레시 토큰입니다'
      });
    }

    // 새 토큰 생성
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    console.error('❌ 토큰 갱신 오류:', error);
    res.status(401).json({
      success: false,
      message: '토큰 갱신에 실패했습니다'
    });
  }
};

// 현재 사용자 정보 조회
const getMe = async (req, res) => {
  try {
    const user = req.user; // authenticate 미들웨어에서 설정됨

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          nickname: user.nickname,
          phoneNumber: user.phoneNumber,
          apartment: user.apartment,
          emergencyContacts: user.emergencyContacts,
          preferences: user.preferences,
          safetyProfile: user.safetyProfile,
          lastSeen: user.lastSeen,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    console.error('❌ 사용자 정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 정보를 불러올 수 없습니다'
    });
  }
};

// 사용자 정보 수정
const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const allowedUpdates = ['nickname', 'phoneNumber', 'apartment', 'emergencyContacts', 'preferences'];
    const updates = {};

    // 허용된 필드만 업데이트 객체에 추가
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: '업데이트할 필드가 없습니다'
      });
    }

    // 닉네임 중복 확인
    if (updates.nickname) {
      const existingUser = await User.findOne({ 
        nickname: updates.nickname, 
        _id: { $ne: userId } 
      });
      
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: '이미 존재하는 닉네임입니다'
        });
      }
    }

    const user = await User.findByIdAndUpdate(userId, updates, { 
      new: true, 
      runValidators: true 
    });

    res.json({
      success: true,
      message: '프로필이 업데이트되었습니다',
      data: {
        user: user.toJSON()
      }
    });

  } catch (error) {
    console.error('❌ 프로필 업데이트 오류:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: '입력 데이터가 유효하지 않습니다',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: '프로필 업데이트에 실패했습니다'
    });
  }
};

// FCM 토큰 등록
const registerDeviceToken = async (req, res) => {
  try {
    const { deviceToken } = req.body;
    const userId = req.user._id;

    if (!deviceToken) {
      return res.status(400).json({
        success: false,
        message: '디바이스 토큰이 필요합니다'
      });
    }

    const user = await User.findById(userId);
    await user.addDeviceToken(deviceToken);

    res.json({
      success: true,
      message: '디바이스 토큰이 등록되었습니다'
    });

  } catch (error) {
    console.error('❌ 디바이스 토큰 등록 오류:', error);
    res.status(500).json({
      success: false,
      message: '디바이스 토큰 등록에 실패했습니다'
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  getMe,
  updateProfile,
  registerDeviceToken
};
