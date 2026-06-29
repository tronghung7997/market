from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class ProvisionResult:
    success: bool
    data: str | None = None
    resource_id: str | None = None
    metadata: dict | None = field(default_factory=dict)
    error: str | None = None


class ProviderAdapter(ABC):
    def __init__(self, config: dict):
        self.config = config

    @abstractmethod
    async def provision(self, order_id: int, user_config: dict) -> ProvisionResult:
        ...

    @abstractmethod
    async def check_health(self) -> dict:
        ...

    @abstractmethod
    async def get_usage(self, resource_id: str) -> dict | None:
        ...

    @abstractmethod
    async def revoke(self, resource_id: str) -> bool:
        ...
