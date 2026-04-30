import io

import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile

from app.upload.analysis import dispatch
from app.upload.detector import detect_type

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("/")
async def upload_data(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith((".csv", ".json")):
        raise HTTPException(status_code=400, detail="Only CSV / JSON files are supported")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File size must be 10MB or less")

    try:
        if file.filename.lower().endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
        else:
            df = pd.read_json(io.BytesIO(content))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {exc}") from exc

    return dispatch(df, filename=file.filename)


@router.post("/detect-only")
async def detect_only(file: UploadFile = File(...)):
    content = await file.read()
    try:
        if file.filename and file.filename.lower().endswith(".json"):
            df = pd.read_json(io.BytesIO(content))
        else:
            df = pd.read_csv(io.BytesIO(content))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {exc}") from exc

    return {
        "filename": file.filename,
        "detected_type": detect_type(df),
        "row_count": len(df),
        "columns": df.columns.tolist(),
        "preview": df.head(10).to_dict(orient="records"),
    }

