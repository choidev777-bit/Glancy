from fastapi import APIRouter, Query

from app.models import AssetSearchResult
from app.sources.search_source import search_assets

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/assets", response_model=list[AssetSearchResult])
def asset_search(
    q: str = Query(..., min_length=1),
    markets: str | None = Query(None, description="Comma-separated: kr,us,etf,crypto,index"),
    limit: int = Query(10, ge=1, le=30),
):
    return search_assets(q, markets=markets, limit=limit)
