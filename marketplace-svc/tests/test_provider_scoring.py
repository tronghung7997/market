import pytest

pytestmark = pytest.mark.anyio


async def test_compute_quality_score_from_health(client):
    from src.database import SessionLocal
    from src.models.provider import Provider, ProviderHealth
    from src.providers.service import compute_quality_score, apply_scores

    async with SessionLocal() as db:
        p = Provider(name="P1", type="proxy", config={}, priority=1, is_active=True)
        db.add(p); await db.flush()
        # 10 healthy checks, low latency → high score
        for _ in range(10):
            db.add(ProviderHealth(provider_id=p.id, latency_ms=100, success_rate=1.0, status="healthy"))
        await db.commit()
        score = await compute_quality_score(p, db)
        assert score is not None and score >= 90

        n = await apply_scores(db)
        await db.commit()
        assert n >= 1
        refreshed = await db.get(Provider, p.id)
        assert refreshed.quality_score == score
        assert refreshed.priority == max(1, round(score / 10))


async def test_score_none_without_health(client):
    from src.database import SessionLocal
    from src.models.provider import Provider
    from src.providers.service import compute_quality_score

    async with SessionLocal() as db:
        p = Provider(name="P2", type="proxy", config={}, priority=3, is_active=True)
        db.add(p); await db.flush()
        score = await compute_quality_score(p, db)
        assert score is None


async def test_provider_scoring_job_updates_score(client):
    from src.database import SessionLocal
    from src.models.provider import Provider, ProviderHealth
    from src.scheduler import provider_scoring_job

    async with SessionLocal() as db:
        p = Provider(name="P3", type="proxy", config={}, priority=1, is_active=True)
        db.add(p); await db.flush()
        for _ in range(5):
            db.add(ProviderHealth(provider_id=p.id, latency_ms=50, success_rate=1.0, status="healthy"))
        await db.commit(); pid = p.id

    await provider_scoring_job()

    async with SessionLocal() as db:
        p = await db.get(Provider, pid)
        assert p.quality_score is not None and p.quality_score >= 90
        assert p.priority >= 9
