import io
from pathlib import Path

import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile

from app.upload.analysis import dispatch
from app.upload.detector import detect_type

router = APIRouter(prefix="/upload", tags=["upload"])

SAMPLE_INPUT_DIR = Path(__file__).resolve().parents[1] / "upload" / "sample_inputs"
UPLOAD_SAMPLES = [
    {
        "id": "ohlcv-csv",
        "label": "OHLCV CSV 예시",
        "format": "csv",
        "data_type": "OHLCV",
        "description": "일자별 시가, 고가, 저가, 종가, 거래량으로 캔들 대시보드를 생성합니다.",
        "filename": "ohlcv.csv",
    },
    {
        "id": "portfolio-csv",
        "label": "포트폴리오 CSV 예시",
        "format": "csv",
        "data_type": "portfolio",
        "description": "종목과 비중 데이터로 자산 배분과 집중도 리스크를 보여줍니다.",
        "filename": "portfolio.csv",
    },
    {
        "id": "multi-asset-csv",
        "label": "다중 자산 CSV 예시",
        "format": "csv",
        "data_type": "multi_asset",
        "description": "여러 자산의 가격 흐름을 정규화해 성과 비교와 상관관계를 보여줍니다.",
        "filename": "multi_asset.csv",
    },
    {
        "id": "returns-csv",
        "label": "수익률 CSV 예시",
        "format": "csv",
        "data_type": "returns",
        "description": "일자별 수익률로 성과, 변동성, 낙폭, 월간 수익률을 분석합니다.",
        "filename": "returns.csv",
    },
    {
        "id": "price-series-csv",
        "label": "가격 시계열 CSV 예시",
        "format": "csv",
        "data_type": "price_series",
        "description": "일자와 종가만 있는 데이터에서 가격 추세와 하락 위험을 확인합니다.",
        "filename": "price_series.csv",
    },
    {
        "id": "ohlcv-json",
        "label": "OHLCV JSON 예시",
        "format": "json",
        "data_type": "OHLCV",
        "description": "CSV가 아닌 JSON 배열 데이터도 같은 업로드 분석 경로로 처리합니다.",
        "filename": "ohlcv.json",
    },
    {
        "id": "composite-portfolio-csv",
        "label": "종합 포트폴리오 CSV 예시",
        "format": "csv",
        "data_type": "composite_portfolio",
        "description": "삼성전자, AAPL, MSFT, SPY, BTC, GLD의 비중, 수익률, 가격, 기초 지표를 함께 분석합니다.",
        "filename": "composite_portfolio.csv",
    },
]


def _sample_by_id(sample_id: str) -> dict | None:
    return next((sample for sample in UPLOAD_SAMPLES if sample["id"] == sample_id), None)


def _read_sample_frame(sample: dict) -> pd.DataFrame:
    path = SAMPLE_INPUT_DIR / str(sample["filename"])
    try:
        if sample["format"] == "json":
            return pd.read_json(path)
        return pd.read_csv(path)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail=f"샘플 파일을 찾을 수 없습니다: {sample['filename']}") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"샘플 파일을 분석할 수 없습니다: {exc}") from exc


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


@router.get("/samples")
def list_samples():
    return [
        {key: sample[key] for key in ("id", "label", "format", "data_type", "description")}
        for sample in UPLOAD_SAMPLES
    ]


@router.get("/samples/{sample_id}")
def get_sample(sample_id: str):
    sample = _sample_by_id(sample_id)
    if sample is None:
        raise HTTPException(status_code=404, detail="샘플을 찾을 수 없습니다")
    df = _read_sample_frame(sample)
    return dispatch(df, filename=str(sample["filename"]))


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
