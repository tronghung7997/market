from abc import ABC, abstractmethod


class PricingStrategy(ABC):
    """Abstract base class for all pricing strategies."""

    @abstractmethod
    def get_options(self, params: dict) -> list[dict]:
        """Return form field definitions for the frontend."""
        ...

    @abstractmethod
    def calculate(self, params: dict, user_config: dict) -> int:
        """Calculate price in VND (integer) from provider params and user config."""
        ...

    @abstractmethod
    def validate(self, params: dict, user_config: dict) -> bool:
        """Validate that user_config is valid given the provider params."""
        ...

    def apply_volume_discount(
        self, amount: int, quantity: int, tiers: list[dict]
    ) -> tuple[int, float | None]:
        """Apply volume discount based on quantity tiers.

        Args:
            amount: Pre-discount total price in VND.
            quantity: Number of items purchased.
            tiers: List of {"min_qty": int, "discount": float} dicts,
                   e.g. [{"min_qty": 10, "discount": 0.05}].

        Returns:
            (discounted_amount, discount_pct) or (amount, None) if no tier matches.
        """
        applicable = [t for t in tiers if quantity >= t["min_qty"]]
        if not applicable:
            return amount, None
        best = max(applicable, key=lambda t: t["min_qty"])
        discount = best["discount"]
        return round(amount * (1 - discount)), discount
