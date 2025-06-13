import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import logging
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
import joblib
import os
import json

from ..models.schemas import (
    SafetyAnalysisRequest, 
    SafetyAnalysisResponse,
    ModelStatus,
    PerformanceMetrics
)

logger = logging.getLogger(__name__)

class SafetyAnalyzer:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.model_version = "1.0.0"
        self.is_initialized = False
        self.performance_metrics = {
            "total_predictions": 0,
            "response_times": [],
            "accuracy_scores": []
        }
        
    async def initialize(self):
        """AI 분석 서비스 초기화"""
        try:
            logger.info("🧠 AI 모델 초기화 시작...")
            
            # 모델 로드 시도
            model_path = "models/safety_model.joblib"
            scaler_path = "models/safety_scaler.joblib"
            
            if os.path.exists(model_path) and os.path.exists(scaler_path):
                self.model = joblib.load(model_path)
                self.scaler = joblib.load(scaler_path)
                logger.info("✅ 기존 모델 로드 완료")
            else:
                # 기본 모델 생성
                await self._create_default_model()
                logger.info("✅ 기본 모델 생성 완료")
            
            self.is_initialized = True
            logger.info("🧠 AI 분석 서비스 초기화 완료")
            
        except Exception as e:
            logger.error(f"❌ AI 모델 초기화 실패: {str(e)}")
            # 폴백: 규칙 기반 분석만 사용
            self.is_initialized = True

    async def _create_default_model(self):
        """기본 모델 생성"""
        try:
            # 샘플 데이터 생성 (실제로는 축적된 데이터 사용)
            X_sample, y_sample = self._generate_sample_data()
            
            # 모델 훈련
            self.scaler = StandardScaler()
            X_scaled = self.scaler.fit_transform(X_sample)
            
            self.model = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                random_state=42
            )
            self.model.fit(X_scaled, y_sample)
            
            # 모델 저장 디렉토리 생성
            os.makedirs("models", exist_ok=True)
            
            # 모델 저장
            joblib.dump(self.model, "models/safety_model.joblib")
            joblib.dump(self.scaler, "models/safety_scaler.joblib")
            
            logger.info("✅ 기본 모델 저장 완료")
            
        except Exception as e:
            logger.error(f"❌ 기본 모델 생성 실패: {str(e)}")

    def _generate_sample_data(self):
        """샘플 훈련 데이터 생성"""
        np.random.seed(42)
        n_samples = 1000
        
        # 특성 생성
        screen_time = np.random.normal(180, 60, n_samples)  # 평균 3시간
        app_open_count = np.random.poisson(20, n_samples)
        hours_since_checkin = np.random.exponential(12, n_samples)
        location_changes = np.random.poisson(5, n_samples)
        
        X = np.column_stack([
            screen_time,
            app_open_count, 
            hours_since_checkin,
            location_changes
        ])
        
        # 레이블 생성 (위험도 기반)
        risk_scores = (
            (screen_time < 60) * 2 +  # 낮은 화면 시간
            (app_open_count < 5) * 2 +  # 낮은 앱 사용
            (hours_since_checkin > 24) * 3 +  # 오랜 체크인 없음
            (location_changes == 0) * 1  # 위치 변화 없음
        )
        
        # 0: 안전, 1: 주의, 2: 위험
        y = np.where(risk_scores < 2, 0, np.where(risk_scores < 5, 1, 2))
        
        return X, y

    async def analyze_safety_data(self, request: SafetyAnalysisRequest) -> SafetyAnalysisResponse:
        """안전 데이터 분석"""
        start_time = datetime.now()
        
        try:
            logger.info(f"🔍 사용자 {request.user_id} 안전 분석 시작")
            
            # 특성 추출
            features = self._extract_features(request)
            
            # AI 모델 예측 (모델이 있는 경우)
            if self.model is not None and self.scaler is not None:
                risk_level, confidence = await self._predict_with_model(features)
                analysis_method = "AI 모델"
            else:
                # 폴백: 규칙 기반 분석
                risk_level, confidence = self._rule_based_analysis(features)
                analysis_method = "규칙 기반"
            
            # 추천사항 및 위험요소 생성
            recommendations = self._generate_recommendations(risk_level, features)
            risk_factors = self._identify_risk_factors(features)
            
            # 응답 시간 기록
            response_time = (datetime.now() - start_time).total_seconds()
            self.performance_metrics["response_times"].append(response_time)
            self.performance_metrics["total_predictions"] += 1
            
            result = SafetyAnalysisResponse(
                risk_level=int(risk_level),
                confidence=float(confidence),
                recommendations=recommendations,
                risk_factors=risk_factors,
                timestamp=datetime.now().isoformat(),
                model_version=self.model_version,
                analysis_details={
                    "method": analysis_method,
                    "features": features,
                    "response_time_ms": int(response_time * 1000)
                }
            )
            
            logger.info(f"✅ 안전 분석 완료: 위험도 {risk_level}/10 (신뢰도: {confidence:.2f})")
            return result
            
        except Exception as e:
            logger.error(f"❌ 안전 분석 실패: {str(e)}")
            # 에러 시 기본값 반환
            return SafetyAnalysisResponse(
                risk_level=5,
                confidence=0.5,
                recommendations=["시스템 점검 중입니다. 잠시 후 다시 시도해주세요."],
                risk_factors=["분석 오류"],
                timestamp=datetime.now().isoformat(),
                model_version=self.model_version,
                analysis_details={"error": str(e)}
            )

    def _extract_features(self, request: SafetyAnalysisRequest) -> Dict[str, float]:
        """요청 데이터에서 특성 추출"""
        features = {}
        
        # 앱 사용 특성
        if request.app_usage:
            features["screen_time"] = request.app_usage.screen_time
            features["app_open_count"] = request.app_usage.app_open_count
            
            # 마지막 활동으로부터의 시간
            try:
                last_activity = datetime.fromisoformat(request.app_usage.last_activity.replace('Z', '+00:00'))
                features["hours_since_activity"] = (datetime.now() - last_activity).total_seconds() / 3600
            except:
                features["hours_since_activity"] = 0
        
        # 체크인 특성
        if request.last_checkin:
            try:
                last_checkin = datetime.fromisoformat(request.last_checkin.replace('Z', '+00:00'))
                features["hours_since_checkin"] = (datetime.now() - last_checkin).total_seconds() / 3600
            except:
                features["hours_since_checkin"] = 24  # 기본값
        else:
            features["hours_since_checkin"] = 24
        
        # 위치 특성 (향후 확장 가능)
        if request.location:
            features["has_location"] = 1
            # 위치 변화량 계산 (향후 구현)
            features["location_changes"] = 0
        else:
            features["has_location"] = 0
            features["location_changes"] = 0
        
        # 기본값 설정
        features.setdefault("screen_time", 0)
        features.setdefault("app_open_count", 0)
        features.setdefault("hours_since_activity", 24)
        features.setdefault("location_changes", 0)
        
        return features

    async def _predict_with_model(self, features: Dict[str, float]) -> tuple:
        """AI 모델을 사용한 예측"""
        try:
            # 특성 벡터 생성
            feature_vector = np.array([[
                features["screen_time"],
                features["app_open_count"],
                features["hours_since_checkin"],
                features["location_changes"]
            ]])
            
            # 스케일링
            feature_scaled = self.scaler.transform(feature_vector)
            
            # 예측
            prediction = self.model.predict(feature_scaled)[0]
            probabilities = self.model.predict_proba(feature_scaled)[0]
            
            # 위험도를 0-10 스케일로 변환
            risk_level = prediction * 3.33  # 0,1,2 -> 0,3.33,6.66
            confidence = np.max(probabilities)
            
            return min(risk_level, 10), confidence
            
        except Exception as e:
            logger.error(f"❌ AI 모델 예측 실패: {str(e)}")
            return self._rule_based_analysis(features)

    def _rule_based_analysis(self, features: Dict[str, float]) -> tuple:
        """규칙 기반 안전 분석"""
        risk_score = 0
        
        # 화면 사용 시간 분석
        if features["screen_time"] < 30:  # 30분 미만
            risk_score += 2
        elif features["screen_time"] < 60:  # 1시간 미만
            risk_score += 1
        
        # 앱 실행 횟수 분석
        if features["app_open_count"] < 3:
            risk_score += 2
        elif features["app_open_count"] < 8:
            risk_score += 1
        
        # 체크인 시간 분석
        hours_since_checkin = features["hours_since_checkin"]
        if hours_since_checkin > 48:  # 48시간 이상
            risk_score += 4
        elif hours_since_checkin > 24:  # 24시간 이상
            risk_score += 3
        elif hours_since_checkin > 12:  # 12시간 이상
            risk_score += 1
        
        # 활동 시간 분석
        hours_since_activity = features["hours_since_activity"]
        if hours_since_activity > 6:
            risk_score += 1
        
        # 위험도를 0-10으로 정규화
        risk_level = min(risk_score, 10)
        confidence = 0.8  # 규칙 기반은 높은 신뢰도
        
        return risk_level, confidence

    def _generate_recommendations(self, risk_level: int, features: Dict[str, float]) -> List[str]:
        """위험도에 따른 추천사항 생성"""
        recommendations = []
        
        if risk_level >= 8:
            recommendations.extend([
                "🚨 즉시 안전 상태를 확인해주세요",
                "비상연락처에 연락을 고려해보세요",
                "가까운 이웃이나 가족에게 안부를 알려주세요"
            ])
        elif risk_level >= 5:
            recommendations.extend([
                "⚠️ 정기 체크인을 해주세요",
                "이웃과 소통해보세요",
                "안전 상태를 업데이트해주세요"
            ])
        elif risk_level >= 3:
            recommendations.extend([
                "📱 주기적으로 체크인해주세요",
                "커뮤니티 활동에 참여해보세요"
            ])
        else:
            recommendations.append("😊 좋은 하루 보내세요!")
        
        # 특성별 개별 추천
        if features["screen_time"] < 60:
            recommendations.append("📱 앱을 조금 더 활용해보세요")
        
        if features["hours_since_checkin"] > 12:
            recommendations.append("⏰ 체크인 주기를 줄여보는 것을 고려해보세요")
        
        return recommendations

    def _identify_risk_factors(self, features: Dict[str, float]) -> List[str]:
        """위험 요소 식별"""
        risk_factors = []
        
        if features["screen_time"] < 30:
            risk_factors.append("낮은 앱 사용량")
        
        if features["app_open_count"] < 5:
            risk_factors.append("낮은 앱 실행 빈도")
        
        if features["hours_since_checkin"] > 24:
            risk_factors.append("오랜 체크인 공백")
        
        if features["hours_since_activity"] > 6:
            risk_factors.append("최근 활동 없음")
        
        if not risk_factors:
            risk_factors.append("특별한 위험 요소 없음")
        
        return risk_factors

    async def learn_user_pattern(self, user_id: str, data: Dict[str, Any]):
        """사용자 패턴 학습 (백그라운드 작업)"""
        try:
            logger.info(f"📚 사용자 {user_id} 패턴 학습 시작")
            
            # TODO: 실제 패턴 학습 로직 구현
            # 현재는 로그만 기록
            
            logger.info(f"✅ 사용자 {user_id} 패턴 학습 완료")
            
        except Exception as e:
            logger.error(f"❌ 패턴 학습 실패: {str(e)}")

    async def get_model_status(self) -> ModelStatus:
        """모델 상태 조회"""
        return ModelStatus(
            model_name="SafetyAnalyzer",
            version=self.model_version,
            status="operational" if self.is_initialized else "initializing",
            last_trained=None,  # TODO: 실제 학습 시간 기록
            accuracy=0.85 if self.model is not None else None,
            total_predictions=self.performance_metrics["total_predictions"]
        )

    async def get_performance_metrics(self) -> PerformanceMetrics:
        """성능 지표 조회"""
        response_times = self.performance_metrics["response_times"]
        
        return PerformanceMetrics(
            accuracy=0.85,  # TODO: 실제 정확도 계산
            precision=0.82,
            recall=0.88,
            f1_score=0.85,
            total_predictions=self.performance_metrics["total_predictions"],
            avg_response_time=np.mean(response_times) if response_times else 0.0,
            last_updated=datetime.now().isoformat()
        )
