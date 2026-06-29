"""Tests for pricing strategy layer — pure Python, no DB required."""

import pytest

from src.pricing.base import PricingStrategy
from src.pricing.fixed import FixedPricing
from src.pricing.config_pricing import ConfigPricing
from src.pricing.credit import CreditPricing
from src.pricing.task import TaskPricing
from src.pricing.factory import get_pricing_strategy


# ---------------------------------------------------------------------------
# Fixtures — sample params mimicking pricing_configs.params
# ---------------------------------------------------------------------------

FIXED_PARAMS = {
    "variants": [
        {"id": "basic", "label": "Email only", "price": 15000},
        {"id": "premium", "label": "Email + cookies", "price": 25000},
    ],
    "volume_tiers": [
        {"min_qty": 10, "discount": 0.05},
        {"min_qty": 50, "discount": 0.10},
    ],
}

CONFIG_PARAMS = {
    "base_price": 75000,
    "type_mult": {
        "residential_static": 1.6,
        "residential_rotating": 1.2,
        "datacenter": 1.0,
    },
    "network_mult": {
        "viettel": 1.0,
        "fpt": 0.9,
        "vnpt": 0.85,
    },
    "duration_options": [
        {"days": 7, "label": "7 ngay"},
        {"days": 30, "label": "30 ngay"},
    ],
    "volume_tiers": [
        {"min_qty": 5, "discount": 0.05},
        {"min_qty": 20, "discount": 0.10},
    ],
}

CREDIT_PARAMS = {
    "credit_price": 10,
    "packages": [
        {"size": 1000, "label": "1K requests"},
        {"size": 5000, "label": "5K requests"},
        {"size": 10000, "label": "10K requests"},
    ],
    "volume_tiers": [
        {"min_qty": 5000, "discount": 0.05},
        {"min_qty": 10000, "discount": 0.10},
    ],
}

TASK_PARAMS = {
    "base_price": 500000,
    "platform_mult": {
        "facebook": 1.0,
        "instagram": 1.0,
        "tiktok": 1.2,
        "youtube": 1.5,
    },
    "volume_tiers": [
        {"min_qty": 5, "discount": 0.05},
        {"min_qty": 10, "discount": 0.10},
    ],
}


# ---------------------------------------------------------------------------
# Volume discount (base class helper)
# ---------------------------------------------------------------------------

class TestVolumeDiscount:
    def setup_method(self):
        self.strategy = FixedPricing()  # any concrete subclass works

    def test_no_tiers(self):
        assert self.strategy.apply_volume_discount(100000, 5, []) == (100000, None)

    def test_below_all_tiers(self):
        tiers = [{"min_qty": 10, "discount": 0.05}]
        assert self.strategy.apply_volume_discount(100000, 3, tiers) == (100000, None)

    def test_matches_first_tier(self):
        tiers = [{"min_qty": 10, "discount": 0.05}, {"min_qty": 50, "discount": 0.10}]
        result = self.strategy.apply_volume_discount(100000, 15, tiers)
        assert result == (95000, 0.05)

    def test_matches_highest_tier(self):
        tiers = [{"min_qty": 10, "discount": 0.05}, {"min_qty": 50, "discount": 0.10}]
        result = self.strategy.apply_volume_discount(100000, 60, tiers)
        assert result == (90000, 0.10)

    def test_exact_boundary(self):
        tiers = [{"min_qty": 10, "discount": 0.05}]
        result = self.strategy.apply_volume_discount(100000, 10, tiers)
        assert result == (95000, 0.05)

    def test_rounds_to_int(self):
        tiers = [{"min_qty": 1, "discount": 0.03}]
        # 99999 * 0.97 = 96999.03 -> rounds to 96999
        result = self.strategy.apply_volume_discount(99999, 1, tiers)
        assert result == (96999, 0.03)


# ---------------------------------------------------------------------------
# FixedPricing
# ---------------------------------------------------------------------------

class TestFixedPricing:
    def setup_method(self):
        self.strategy = FixedPricing()

    def test_calculate_basic(self):
        config = {"variant_id": "premium", "quantity": 3}
        assert self.strategy.calculate(FIXED_PARAMS, config) == 75000  # 25000 * 3

    def test_calculate_with_volume_discount(self):
        config = {"variant_id": "premium", "quantity": 10}
        # 25000 * 10 = 250000, 5% off = 237500
        assert self.strategy.calculate(FIXED_PARAMS, config) == 237500

    def test_calculate_no_discount_below_tier(self):
        config = {"variant_id": "basic", "quantity": 5}
        assert self.strategy.calculate(FIXED_PARAMS, config) == 75000  # 15000 * 5

    def test_validate_valid(self):
        config = {"variant_id": "basic", "quantity": 1}
        assert self.strategy.validate(FIXED_PARAMS, config) is True

    def test_validate_missing_variant(self):
        config = {"quantity": 1}
        assert self.strategy.validate(FIXED_PARAMS, config) is False

    def test_validate_invalid_variant_id(self):
        config = {"variant_id": "nonexistent", "quantity": 1}
        assert self.strategy.validate(FIXED_PARAMS, config) is False

    def test_validate_zero_quantity(self):
        config = {"variant_id": "basic", "quantity": 0}
        assert self.strategy.validate(FIXED_PARAMS, config) is False

    def test_validate_negative_quantity(self):
        config = {"variant_id": "basic", "quantity": -1}
        assert self.strategy.validate(FIXED_PARAMS, config) is False

    def test_get_options_returns_fields(self):
        fields = self.strategy.get_options(FIXED_PARAMS)
        assert len(fields) == 2
        assert fields[0]["field"] == "variant_id"
        assert fields[0]["type"] == "select"
        assert len(fields[0]["choices"]) == 2
        assert fields[1]["field"] == "quantity"


# ---------------------------------------------------------------------------
# ConfigPricing
# ---------------------------------------------------------------------------

class TestConfigPricing:
    def setup_method(self):
        self.strategy = ConfigPricing()

    def test_calculate_basic(self):
        config = {
            "type": "residential_static",
            "network": "viettel",
            "days": 30,
            "quantity": 1,
        }
        # 75000 * 1.6 * 1.0 * (30/30) * 1 = 120000
        assert self.strategy.calculate(CONFIG_PARAMS, config) == 120000

    def test_calculate_partial_month(self):
        config = {
            "type": "datacenter",
            "network": "fpt",
            "days": 7,
            "quantity": 2,
        }
        # 75000 * 1.0 * 0.9 * (7/30) * 2 = 31500
        assert self.strategy.calculate(CONFIG_PARAMS, config) == 31500

    def test_calculate_with_volume_discount(self):
        config = {
            "type": "datacenter",
            "network": "viettel",
            "days": 30,
            "quantity": 5,
        }
        # 75000 * 1.0 * 1.0 * 1.0 * 5 = 375000, 5% off = 356250
        assert self.strategy.calculate(CONFIG_PARAMS, config) == 356250

    def test_validate_valid(self):
        config = {
            "type": "residential_static",
            "network": "viettel",
            "days": 30,
            "quantity": 1,
        }
        assert self.strategy.validate(CONFIG_PARAMS, config) is True

    def test_validate_missing_field(self):
        config = {"type": "datacenter", "network": "viettel", "quantity": 1}
        assert self.strategy.validate(CONFIG_PARAMS, config) is False

    def test_validate_invalid_type(self):
        config = {
            "type": "nonexistent",
            "network": "viettel",
            "days": 30,
            "quantity": 1,
        }
        assert self.strategy.validate(CONFIG_PARAMS, config) is False

    def test_validate_invalid_network(self):
        config = {
            "type": "datacenter",
            "network": "nonexistent",
            "days": 30,
            "quantity": 1,
        }
        assert self.strategy.validate(CONFIG_PARAMS, config) is False

    def test_validate_zero_days(self):
        config = {
            "type": "datacenter",
            "network": "viettel",
            "days": 0,
            "quantity": 1,
        }
        assert self.strategy.validate(CONFIG_PARAMS, config) is False

    def test_get_options_returns_fields(self):
        fields = self.strategy.get_options(CONFIG_PARAMS)
        field_names = [f["field"] for f in fields]
        assert "type" in field_names
        assert "network" in field_names
        assert "days" in field_names
        assert "quantity" in field_names


# ---------------------------------------------------------------------------
# CreditPricing
# ---------------------------------------------------------------------------

class TestCreditPricing:
    def setup_method(self):
        self.strategy = CreditPricing()

    def test_calculate_basic(self):
        config = {"package_size": 1000}
        # 10 * 1000 = 10000 (below 5000 min_qty, no discount)
        assert self.strategy.calculate(CREDIT_PARAMS, config) == 10000

    def test_calculate_with_volume_discount(self):
        config = {"package_size": 5000}
        # 10 * 5000 = 50000, 5% off = 47500
        assert self.strategy.calculate(CREDIT_PARAMS, config) == 47500

    def test_calculate_high_tier_discount(self):
        config = {"package_size": 10000}
        # 10 * 10000 = 100000, 10% off = 90000
        assert self.strategy.calculate(CREDIT_PARAMS, config) == 90000

    def test_calculate_no_discount(self):
        params_no_tiers = {"credit_price": 10}
        config = {"package_size": 1000}
        assert self.strategy.calculate(params_no_tiers, config) == 10000

    def test_validate_valid(self):
        config = {"package_size": 1000}
        assert self.strategy.validate(CREDIT_PARAMS, config) is True

    def test_validate_missing_package_size(self):
        config = {}
        assert self.strategy.validate(CREDIT_PARAMS, config) is False

    def test_validate_zero_package(self):
        config = {"package_size": 0}
        assert self.strategy.validate(CREDIT_PARAMS, config) is False

    def test_validate_float_package(self):
        config = {"package_size": 1.5}
        assert self.strategy.validate(CREDIT_PARAMS, config) is False

    def test_get_options_with_packages(self):
        fields = self.strategy.get_options(CREDIT_PARAMS)
        assert len(fields) == 1
        assert fields[0]["field"] == "package_size"
        assert fields[0]["type"] == "select"
        assert len(fields[0]["choices"]) == 3

    def test_get_options_without_packages(self):
        fields = self.strategy.get_options({"credit_price": 10})
        assert len(fields) == 1
        assert fields[0]["field"] == "package_size"
        assert fields[0]["type"] == "number"


# ---------------------------------------------------------------------------
# TaskPricing
# ---------------------------------------------------------------------------

class TestTaskPricing:
    def setup_method(self):
        self.strategy = TaskPricing()

    def test_calculate_basic(self):
        config = {"platform": "facebook", "quantity": 3}
        # 500000 * 1.0 * 3 = 1500000
        assert self.strategy.calculate(TASK_PARAMS, config) == 1500000

    def test_calculate_with_multiplier(self):
        config = {"platform": "youtube", "quantity": 2}
        # 500000 * 1.5 * 2 = 1500000
        assert self.strategy.calculate(TASK_PARAMS, config) == 1500000

    def test_calculate_tiktok(self):
        config = {"platform": "tiktok", "quantity": 1}
        # 500000 * 1.2 * 1 = 600000
        assert self.strategy.calculate(TASK_PARAMS, config) == 600000

    def test_calculate_with_volume_discount(self):
        config = {"platform": "facebook", "quantity": 5}
        # 500000 * 1.0 * 5 = 2500000, 5% off = 2375000
        assert self.strategy.calculate(TASK_PARAMS, config) == 2375000

    def test_validate_valid(self):
        config = {"platform": "facebook", "quantity": 1}
        assert self.strategy.validate(TASK_PARAMS, config) is True

    def test_validate_missing_platform(self):
        config = {"quantity": 1}
        assert self.strategy.validate(TASK_PARAMS, config) is False

    def test_validate_invalid_platform(self):
        config = {"platform": "nonexistent", "quantity": 1}
        assert self.strategy.validate(TASK_PARAMS, config) is False

    def test_validate_zero_quantity(self):
        config = {"platform": "facebook", "quantity": 0}
        assert self.strategy.validate(TASK_PARAMS, config) is False

    def test_get_options_returns_fields(self):
        fields = self.strategy.get_options(TASK_PARAMS)
        field_names = [f["field"] for f in fields]
        assert "platform" in field_names
        assert "target_urls" in field_names
        assert "quantity" in field_names


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------

class TestFactory:
    def test_get_fixed(self):
        s = get_pricing_strategy("fixed")
        assert isinstance(s, FixedPricing)

    def test_get_config(self):
        s = get_pricing_strategy("config")
        assert isinstance(s, ConfigPricing)

    def test_get_credit(self):
        s = get_pricing_strategy("credit")
        assert isinstance(s, CreditPricing)

    def test_get_task(self):
        s = get_pricing_strategy("task")
        assert isinstance(s, TaskPricing)

    def test_unknown_raises(self):
        with pytest.raises(ValueError, match="Unknown pricing strategy"):
            get_pricing_strategy("nonexistent")
