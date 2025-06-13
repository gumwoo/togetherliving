from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class AppUsageData(BaseModel):
    screen_time: int = Field(..., description="화면 사용 시간 (분)")
    app_open_count: int = Field(..., description="앱 실행 횟수")
    last_activity: str = Field(..., description="마지막 활동 시간 (ISO format)")

class LocationData(BaseModel):
    latitude: float = Field(..., description="위도")
    longitude: float = Field(..., description="경도")
    accuracy: float = Field(..., description="위치 정확도 (미터)")
    timestamp: str = Field(..., description="위치 기록 시간 (ISO format)")

class SafetyAnalysisRequest(BaseModel):
    user_id: str = Field(..., description="사용자 ID")
    app_usage: AppUsageData = Field(..., description="앱 사용 데이터")
    location: Optional[LocationData] = Field(None, description="위치 데이터")
    last_checkin: Optional[str] = Field(None, description="마지막 체크인 시간 (ISO format)")
    additional_data: Optional[Dict[str, Any]] = Field(None, description="추가 데이터")

class SafetyAnalysisResponse(BaseModel):
    risk_level: int = Field(..., description="위험도 (0-10)", ge=0, le=10)
    confidence: float = Field(..., description="예측 신뢰도 (0-1)", ge=0, le=1)
    recommendations: List[str] = Field(..., description="추천 사항")
    risk_factors: List[str] = Field(..., description="위험 요소")
    timestamp: str = Field(..., description="분석 시간 (ISO format)")
    model_version: str = Field(..., description="사용된 모델 버전")
    analysis_details: Optional[Dict[str, Any]] = Field(None, description="분석 상세 정보")

class UserPatternData(BaseModel):
    user_id: str = Field(..., description="사용자 ID")
    activity_pattern: Dict[str, Any] = Field(..., description="활동 패턴 데이터")
    behavioral_data: Dict[str, Any] = Field(..., description="행동 데이터")
    timestamp: str = Field(..., description="데이터 수집 시간")

class ModelStatus(BaseModel):
    model_name: str = Field(..., description="모델 이름")
    version: str = Field(..., description="모델 버전")
    status: str = Field(..., description="모델 상태")
    last_trained: Optional[str] = Field(None, description="마지막 학습 시간")
    accuracy: Optional[float] = Field(None, description="모델 정확도")
    total_predictions: int = Field(0, description="총 예측 횟수")

class PerformanceMetrics(BaseModel):
    accuracy: float = Field(..., description="정확도")
    precision: float = Field(..., description="정밀도")
    recall: float = Field(..., description="재현율")
    f1_score: float = Field(..., description="F1 점수")
    total_predictions: int = Field(..., description="총 예측 횟수")
    avg_response_time: float = Field(..., description="평균 응답 시간 (초)")
    last_updated: str = Field(..., description="마지막 업데이트 시간")
