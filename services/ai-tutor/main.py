"""
FastAPI application for AI Tutor Service (Role 4).
Exposes REST endpoints for Next.js frontend, API gateway, and LMS modules.
"""
from __future__ import annotations
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware

try:
    from .config import settings
    from .core.tutor import QuantumAITutor
    from .models.api import (
        TutorChatRequest,
        TutorChatResponse,
        ExplainRequest,
        ExplainResponse,
        DebugRequest,
        DebugResponse,
        OptimizeRequest,
        OptimizeResponse,
    )
    from .tools.learner_profile_tool import get_learner_profile, DEMO_PROFILES
except (ImportError, ValueError):
    from config import settings
    from core.tutor import QuantumAITutor
    from models.api import (
        TutorChatRequest,
        TutorChatResponse,
        ExplainRequest,
        ExplainResponse,
        DebugRequest,
        DebugResponse,
        OptimizeRequest,
        OptimizeResponse,
    )
    from tools.learner_profile_tool import get_learner_profile, DEMO_PROFILES

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("ai-tutor-service")

# Global tutor instance
tutor_instance: QuantumAITutor = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global tutor_instance
    logger.info("Initializing Quantum AI Tutor service...")
    logger.info("Initializing QMentor AI Tutor service...")
    tutor_instance = QuantumAITutor()
    if tutor_instance.is_gemini_connected():
        logger.info(f"Connected to Google AI Studio with model: {tutor_instance.model}")
    else:
        logger.info("Running in autonomous simulation-guided mode (set GEMINI_API_KEY to connect to live Gemini)")
    yield
    logger.info("Shutting down QMentor AI Tutor service...")


app = FastAPI(
    title="QMentor — AI Tutor Service",
    description="Intelligent AI Tutor for quantum learning, powered by Google AI Studio (Gemini) and Qiskit simulation tool calling.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration for Next.js frontend and Gateway
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_tutor() -> QuantumAITutor:
    global tutor_instance
    if tutor_instance is None:
        tutor_instance = QuantumAITutor()
    return tutor_instance


@app.get("/api/tutor/health", tags=["System"])
async def health_check(tutor: QuantumAITutor = Depends(get_tutor)):
    """Health check and provider status."""
    return {
        "status": "healthy",
        "service": "ai-tutor",
        "gemini_connected": tutor.is_gemini_connected(),
        "model": tutor.model,
        "supported_features": [
            "socratic_chat",
            "circuit_simulation_tool_calling",
            "circuit_debugger",
            "step_by_step_explainer",
            "circuit_optimizer",
            "personalized_learning_profiles"
        ]
    }


@app.post("/api/tutor/chat", response_model=TutorChatResponse, tags=["Tutoring"])
async def chat_with_tutor(
    req: TutorChatRequest,
    tutor: QuantumAITutor = Depends(get_tutor)
):
    """
    Conversational AI tutor endpoint with circuit awareness and automatic simulation.
    """
    try:
        response = tutor.chat(
            message=req.message,
            circuit=req.circuit,
            history=req.history,
            user_id=req.user_id or "beginner_alex",
            skill_override=req.skill_level_override,
            style_override=req.learning_style_override
        )
        return response
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/tutor/explain", response_model=ExplainResponse, tags=["Tutoring"])
async def explain_concept_or_circuit(
    req: ExplainRequest,
    tutor: QuantumAITutor = Depends(get_tutor)
):
    """
    Explain a circuit's state evolution or a quantum concept tailored to learner skill level.
    """
    try:
        response = tutor.explain_circuit(
            circuit=req.circuit,
            user_id=req.user_id or "beginner_alex",
            query=req.concept_or_circuit_query,
            skill_override=req.skill_level,
            style_override=req.learning_style
        )
        return response
    except Exception as e:
        logger.error(f"Error in explain endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/tutor/debug", response_model=DebugResponse, tags=["Debugging"])
async def debug_circuit_submission(
    req: DebugRequest,
    tutor: QuantumAITutor = Depends(get_tutor)
):
    """
    Debug a student circuit against a target goal, using simulation to spot errors.
    """
    try:
        response = tutor.debug_circuit(
            circuit=req.circuit,
            target_objective=req.target_objective,
            user_id=req.user_id or "beginner_alex",
            reference_circuit=req.reference_circuit
        )
        return response
    except Exception as e:
        logger.error(f"Error in debug endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/tutor/optimize", response_model=OptimizeResponse, tags=["Optimization"])
async def optimize_circuit(
    req: OptimizeRequest,
    tutor: QuantumAITutor = Depends(get_tutor)
):
    """
    Analyze circuit for gate cancellations, rotation mergers, and depth reduction.
    """
    try:
        response = tutor.optimize_circuit(
            circuit=req.circuit,
            target_criteria=req.target_criteria or "Reduce gate count and depth"
        )
        return response
    except Exception as e:
        logger.error(f"Error in optimize endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/tutor/profiles/{user_id}", tags=["Personalization"])
async def get_profile(user_id: str):
    """
    Inspect learner mastery profile and quiz records.
    """
    profile = get_learner_profile(user_id)
    return profile


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.host, port=settings.port, reload=True)
