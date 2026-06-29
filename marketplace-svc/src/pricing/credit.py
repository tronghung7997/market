from .base import PricingStrategy


class CreditPricing(PricingStrategy):
    """Credit-based pricing: credit_price x package_size, with optional volume discount."""

    def get_options(self, params: dict) -> list[dict]:
        fields: list[dict] = []

        packages = params.get("packages", [])
        if packages:
            fields.append({
                "field": "package_size",
                "type": "select",
                "label": "Package size",
                "required": True,
                "choices": [
                    {"value": p["size"], "label": p.get("label", f"{p['size']} credits")}
                    for p in packages
                ],
            })
        else:
            fields.append({
                "field": "package_size",
                "type": "number",
                "label": "Package size",
                "required": True,
                "min": 1,
            })

        return fields

    def calculate(self, params: dict, user_config: dict) -> int:
        credit_price = params["credit_price"]
        package_size = user_config["package_size"]

        subtotal = round(credit_price * package_size)

        volume_tiers = params.get("volume_tiers", [])
        if volume_tiers:
            subtotal, _ = self.apply_volume_discount(
                subtotal, package_size, volume_tiers
            )

        return subtotal

    def validate(self, params: dict, user_config: dict) -> bool:
        if "package_size" not in user_config:
            return False
        package_size = user_config["package_size"]
        if not isinstance(package_size, int) or package_size < 1:
            return False
        return True
