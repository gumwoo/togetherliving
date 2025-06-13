const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const emergencyContactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  relationship: {
    type: String,
    required: true,
    enum: ['가족', '친구', '동료', '이웃', '기타']
  }
});

const apartmentSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  building: {
    type: String,
    trim: true
  },
  unit: {
    type: String,
    trim: true
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  }
});

const preferencesSchema = new mongoose.Schema({
  notificationSettings: {
    safetyAlerts: {
      type: Boolean,
      default: true
    },
    communityUpdates: {
      type: Boolean,
      default: true
    },
    helpRequests: {
      type: Boolean,
      default: true
    },
    nightMode: {
      type: Boolean,
      default: false
    }
  },
  privacySettings: {
    locationSharing: {
      type: Boolean,
      default: true
    },
    profileVisibility: {
      type: String,
      enum: ['apartment', 'all', 'none'],
      default: 'apartment'
    },
    activityStatus: {
      type: Boolean,
      default: true
    }
  },
  safetySettings: {
    checkInFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'custom'],
      default: 'daily'
    },
    emergencyMode: {
      type: Boolean,
      default: false
    },
    autoCheckIn: {
      type: Boolean,
      default: true
    }
  }
});

const safetyProfileSchema = new mongoose.Schema({
  riskLevel: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  },
  lastCheckIn: {
    type: Date,
    default: Date.now
  },
  checkInFrequency: {
    type: String,
    enum: ['daily', 'weekly', 'custom'],
    default: 'daily'
  },
  activityPattern: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, '이메일은 필수입니다'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '올바른 이메일 형식이 아닙니다']
  },
  password: {
    type: String,
    required: [true, '비밀번호는 필수입니다'],
    minlength: [6, '비밀번호는 최소 6자 이상이어야 합니다']
  },
  nickname: {
    type: String,
    required: [true, '닉네임은 필수입니다'],
    trim: true,
    maxlength: [20, '닉네임은 20자를 초과할 수 없습니다']
  },
  phoneNumber: {
    type: String,
    trim: true,
    match: [/^01[0-9]-?[0-9]{4}-?[0-9]{4}$/, '올바른 휴대폰 번호 형식이 아닙니다']
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer_not_to_say']
  },
  apartment: apartmentSchema,
  emergencyContacts: [emergencyContactSchema],
  preferences: {
    type: preferencesSchema,
    default: () => ({})
  },
  safetyProfile: {
    type: safetyProfileSchema,
    default: () => ({})
  },
  deviceTokens: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  lastSeen: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 비밀번호 해싱 미들웨어
userSchema.pre('save', async function(next) {
  // 비밀번호가 수정되지 않았으면 다음으로
  if (!this.isModified('password')) return next();
  
  try {
    // 비밀번호 해싱
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 비밀번호 검증 메서드
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// 마지막 접속 시간 업데이트 메서드
userSchema.methods.updateLastSeen = function() {
  this.lastSeen = new Date();
  return this.save();
};

// FCM 토큰 추가 메서드
userSchema.methods.addDeviceToken = function(token) {
  if (!this.deviceTokens.includes(token)) {
    this.deviceTokens.push(token);
  }
  return this.save();
};

// FCM 토큰 제거 메서드
userSchema.methods.removeDeviceToken = function(token) {
  this.deviceTokens = this.deviceTokens.filter(t => t !== token);
  return this.save();
};

// 비밀번호 필드를 JSON에서 제외
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// 인덱스 설정
userSchema.index({ email: 1 });
userSchema.index({ 'apartment.name': 1 });
userSchema.index({ nickname: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', userSchema);
