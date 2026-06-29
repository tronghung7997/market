from .base import PricingStrategy
from .fixed import FixedPricing
from .config_pricing import ConfigPricing
from .credit import CreditPricing
from .task import TaskPricing

_STRATEGIES: dict[str, type[PricingStrategy]] = {
    "fixed": FixedPricing,
    "config": ConfigPricing,
    "credit": CreditPricing,
    "task": TaskPricing,
}


def get_pricing_strategy(strategy_name: str) -> PricingStrategy:
    """Return a PricingStrategy instance for the given strategy name.

    Raises:
        ValueError: If strategy_name is not recognized.
    """
    cls = _STRATEGIES.get(strategy_name)
    if cls is None:
        raise ValueError(
            f"Unknown pricing strategy: {strategy_name!r}. "
            f"Available: {', '.join(_STRATEGIES)}"
        )
    return cls()
