from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import models, schemas
from app.services import test_lab_service
import datetime

router = APIRouter()

@router.get("/cases", response_model=list[schemas.TestCaseDefinition])
def get_all_test_cases():
    return test_lab_service.get_all_cases()

@router.get("/cases/{test_id}", response_model=schemas.TestCaseDefinition)
def get_test_case(test_id: str):
    cases = test_lab_service.get_all_cases()
    for case in cases:
        if case["test_id"] == test_id:
            return case
    raise HTTPException(status_code=404, detail="Test case not found")

@router.post("/run/{test_id}", response_model=schemas.TestResultResponse)
def run_single_test(test_id: str, db: Session = Depends(get_db)):
    run_record = models.TestExecutionRun(run_type="single", status="completed")
    db.add(run_record)
    db.commit()
    db.refresh(run_record)
    
    result_data = test_lab_service.run_test(test_id, db)
    
    result_record = models.TestResult(
        run_id=run_record.id,
        test_id=test_id,
        category=result_data["category"],
        status=result_data["status"],
        duration_ms=result_data["duration_ms"],
        expected_behavior=result_data["expected_behavior"],
        actual_response=result_data["actual_response"],
        error_message=result_data.get("error_message")
    )
    db.add(result_record)
    db.commit()
    db.refresh(result_record)
    
    return result_record

@router.post("/run-suite", response_model=schemas.TestRunResponse)
def run_test_suite(db: Session = Depends(get_db)):
    run_record = models.TestExecutionRun(run_type="suite", status="in_progress")
    db.add(run_record)
    db.commit()
    db.refresh(run_record)
    
    cases = test_lab_service.get_all_cases()
    
    for case in cases:
        result_data = test_lab_service.run_test(case["test_id"], db)
        result_record = models.TestResult(
            run_id=run_record.id,
            test_id=case["test_id"],
            category=result_data["category"],
            status=result_data["status"],
            duration_ms=result_data["duration_ms"],
            expected_behavior=result_data["expected_behavior"],
            actual_response=result_data["actual_response"],
            error_message=result_data.get("error_message")
        )
        db.add(result_record)
        
    run_record.status = "completed"
    db.commit()
    db.refresh(run_record)
    
    return run_record

@router.get("/runs", response_model=list[schemas.TestRunResponse])
def get_all_runs(db: Session = Depends(get_db)):
    return db.query(models.TestExecutionRun).order_by(models.TestExecutionRun.created_at.desc()).all()

@router.get("/runs/{run_id}", response_model=schemas.TestRunResponse)
def get_run_details(run_id: int, db: Session = Depends(get_db)):
    run_record = db.query(models.TestExecutionRun).filter(models.TestExecutionRun.id == run_id).first()
    if not run_record:
        raise HTTPException(status_code=404, detail="Run not found")
    return run_record

@router.post("/reset-session")
def reset_demo_session(db: Session = Depends(get_db)):
    # Deletes only demo test runs to preserve actual user history
    db.query(models.TestExecutionRun).delete()
    db.commit()
    return {"status": "success", "message": "Demo test session reset successfully."}
