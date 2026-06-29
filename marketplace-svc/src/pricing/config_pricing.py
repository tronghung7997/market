from .base import PricingStrategy


class ConfigPricing(PricingStrategy):
    """Config-based pricing: base_price x type_mult x network_mult x (days/30) x quantity."""

    def get_options(self, params: dict) -> list[dict]:
        fields: list[dict] = []

        if "type_mult" in params:
            fields.append({
                "field": "type",
                "type": "select",
                "label": "Type",
                "required": True,
                "choices": [
                    {"value": k, "label": k} for k in params["type_mult"]
                ],
            })

        if "network_mult" in params:
            fields.append({
                "field": "network",
                "type": "select",
                "label": "Network",
                "required": True,
                "choices": [
                    {"value": k, "label": k} for k in params["network_mult"]
                ],
            })

        if "duration_options" in params:
            fields.append({
                "field": "days",
                "type": "select",
                "label": "Duration",
                "required": True,
                "choices": [
                    {"value": d["days"], "label": d["label"]}
                    for d in params["duration_options"]
                ],
            })

        fields.append({
            "field": "quantity",
            "type": "number",
            "label": "Quantity",
            "required": True,
            "min": 1,
        })

        return fields

    def calculate(self, params: dict, user_config: dict) -> int:
        base_price = params["base_price"]
        type_key = user_config["type"]
        network_key = user_config["network"]
        days = user_config["days"]
        quantity = user_config["quantity"]

        type_mult = params["type_mult"][type_key]
        network_mult = params["network_mult"][network_key]

        subtotal = round(base_price * type_mult * network_mult * (days / 30) * quantity)

        volume_tiers = params.get("volume_tiers", [])
        if volume_tiers:
            subtotal, _ = self.apply_volume_discount(subtotal, quantity, volume_tiers)

        return subtotal

    def validate(self, params: dict, user_config: dict) -> bool:
        required = ["type", "network", "days", "quantity"]
        if not all(k in user_config for k in required):
            return False

        quantity = user_config["quantity"]
        if not isinstance(quantity, int) or quantity < 1:
            return False

        if user_config["type"] not in params.get("type_mult", {}):
            return False
        if user_config["network"] not in params.get("network_mult", {}):
            return False

        days = user_config["days"]
        if not isinstance(days, (int, float)) or days <= 0:
            return False

        return True
