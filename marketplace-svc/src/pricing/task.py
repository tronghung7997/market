from .base import PricingStrategy


class TaskPricing(PricingStrategy):
    """Task-based pricing: base_price x platform_mult x quantity (number of URLs)."""

    def get_options(self, params: dict) -> list[dict]:
        fields: list[dict] = []

        if "platform_mult" in params:
            fields.append({
                "field": "platform",
                "type": "select",
                "label": "Platform",
                "required": True,
                "choices": [
                    {"value": k, "label": k} for k in params["platform_mult"]
                ],
            })

        fields.append({
            "field": "target_urls",
            "type": "textarea",
            "label": "Target URLs",
            "required": True,
        })

        fields.append({
            "field": "quantity",
            "type": "number",
            "label": "Number of URLs",
            "required": True,
            "min": 1,
        })

        return fields

    def calculate(self, params: dict, user_config: dict) -> int:
        base_price = params["base_price"]
        platform_key = user_config["platform"]
        quantity = user_config["quantity"]

        platform_mult = params["platform_mult"][platform_key]

        subtotal = round(base_price * platform_mult * quantity)

        volume_tiers = params.get("volume_tiers", [])
        if volume_tiers:
            subtotal, _ = self.apply_volume_discount(subtotal, quantity, volume_tiers)

        return subtotal

    def validate(self, params: dict, user_config: dict) -> bool:
        required = ["platform", "quantity", "target_urls"]
        if not all(k in user_config for k in required):
            return False

        if not user_config.get("target_urls"):
            return False

        quantity = user_config["quantity"]
        if not isinstance(quantity, int) or quantity < 1:
            return False

        if user_config["platform"] not in params.get("platform_mult", {}):
            return False

        return True
