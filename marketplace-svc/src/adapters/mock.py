import hashlib
import random
import uuid

from src.adapters.base import ProviderAdapter, ProvisionResult


class MockAdapter(ProviderAdapter):
    """Mock adapter that generates fake provision data for development/testing."""

    async def provision(self, order_id: int, user_config: dict) -> ProvisionResult:
        service_type = user_config.get("service_type", "default")
        data = self._generate_data(service_type, order_id)
        return ProvisionResult(
            success=True,
            data=data,
            resource_id=f"mock_{uuid.uuid4().hex[:12]}",
            metadata={"provider": "mock", "service_type": service_type},
        )

    async def check_health(self) -> dict:
        return {"status": "healthy", "latency_ms": 12, "message": "Mock provider"}

    async def get_usage(self, resource_id: str) -> dict | None:
        return {
            "requests_today": 89,
            "credits_used": 1153,
            "credits_remaining": 3847,
        }

    async def revoke(self, resource_id: str) -> bool:
        return True

    # ------------------------------------------------------------------

    @staticmethod
    def _generate_data(service_type: str, order_id: int) -> str:
        seed = f"{order_id}_{uuid.uuid4().hex}"
        h = hashlib.md5(seed.encode()).hexdigest()

        if service_type == "proxy":
            r1, r2 = random.randint(1, 254), random.randint(1, 254)
            return f"103.45.{r1}.{r2}:8080:px_user_{h[:8]}:px_pass_{h[8:16]}"

        if service_type == "endpoint":
            return f"px_sk_live_{uuid.uuid4().hex}"

        if service_type == "takedown":
            return f"task_{uuid.uuid4()}"

        if service_type == "cloud":
            r1, r2 = random.randint(1, 254), random.randint(1, 254)
            return f"vps_{random.randint(10, 99)} | 103.45.{r1}.{r2} | root | P@ss{h[:8]}"

        return f"resource_{uuid.uuid4().hex}"
