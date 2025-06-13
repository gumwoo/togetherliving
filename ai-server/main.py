from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
import logging
from contextlib import asynccontextmanager

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 서비스 import
from src.services.safety_analyzer import SafetyAnalyzer
from src.models.schemas import SafetyAnalysisRequest, SafetyAnalysisResponse

# AI 서비스 인스턴스
safety_analyzer = SafetyAnalyzer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 시작 시 초기화
    logger.info("🤖 AI 분석 서버 초기화 중...")
    await safety_analyzer.initialize()
    logger.info("✅ AI 분석 서버 초기화 완료")
    
    yield
    
    # 종료 시 정리
    logger.info("🤖 AI 분석 서버 종료 중...")

# FastAPI 앱 생성
app = FastAPI(
    title="함께살이 AI 분석 서버",
    description="1인가구 안전 모니터링을 위한 AI 분석 서비스",
    version="1.0.0",
    lifespan=lifespan
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 개발용, 운영 시 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 상태 확인 엔드포인트
@app.get("/")
async def root():
    return {
        "service": "함께살이 AI 분석 서버",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "ai_service": "operational",
        "timestamp": datetime.now().isoformat()
    }

# 안전 분석 엔드포인트
@app.post("/analyze/safety", response_model=SafetyAnalysisResponse)
async def analyze_safety(request: SafetyAnalysisRequest):
    """
    사용자의 안전 데이터를 분석하여 위험도를 평가합니다.
    """
    try:
        logger.info(f"🔍 안전 분석 요청 수신: 사용자 ID {request.user_id}")
        
        # AI 분석 수행
        analysis_result = await safety_analyzer.analyze_safety_data(request)
        
        logger.info(f"✅ 안전 분석 완료: 위험도 {analysis_result.risk_level}/10")
        
        return analysis_result
        
    except Exception as e:
        logger.error(f"❌ 안전 분석 실패: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"안전 분석 중 오류가 발생했습니다: {str(e)}"
        )

# 패턴 학습 엔드포인트
@app.post("/learn/pattern")
async def learn_user_pattern(
    user_id: str,
    data: Dict[str, Any],
    background_tasks: BackgroundTasks
):
    """
    사용자의 행동 패턴을 학습합니다.
    """
    try:
        logger.info(f"📚 패턴 학습 요청: 사용자 ID {user_id}")
        
        # 백그라운드에서 패턴 학습 수행
        background_tasks.add_task(
            safety_analyzer.learn_user_pattern, 
            user_id, 
            data
        )
        
        return {
            "message": "패턴 학습이 시작되었습니다.",
            "user_id": user_id,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"❌ 패턴 학습 실패: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"패턴 학습 중 오류가 발생했습니다: {str(e)}"
        )

# 모델 상태 조회 엔드포인트
@app.get("/model/status")
async def get_model_status():
    """
    AI 모델의 현재 상태를 조회합니다.
    """
    try:
        status = await safety_analyzer.get_model_status()
        return status
        
    except Exception as e:
        logger.error(f"❌ 모델 상태 조회 실패: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"모델 상태 조회 중 오류가 발생했습니다: {str(e)}"
        )

# 예측 성능 지표 엔드포인트
@app.get("/metrics/performance")
async def get_performance_metrics():
    """
    AI 모델의 성능 지표를 조회합니다.
    """
    try:
        metrics = await safety_analyzer.get_performance_metrics()
        return metrics
        
    except Exception as e:
        logger.error(f"❌ 성능 지표 조회 실패: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"성능 지표 조회 중 오류가 발생했습니다: {str(e)}"
        )

# 테스트 엔드포인트
@app.post("/test/analyze")
async def test_analysis():
    """
    테스트용 분석 엔드포인트
    """
    # 테스트 데이터
    test_request = SafetyAnalysisRequest(
        user_id="test_user",
        app_usage={
            "screen_time": 120,  # 2시간
            "app_open_count": 15,
            "last_activity": datetime.now().isoformat()
        },
        location={
            "latitude": 37.5665,
            "longitude": 126.9780,
            "accuracy": 10.0,
            "timestamp": datetime.now().isoformat()
        },
        last_checkin=datetime.now().isoformat()
    )
    
    return await analyze_safety(test_request)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    
    logger.info(f"🚀 AI 서버 시작 중... 포트: {port}")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
