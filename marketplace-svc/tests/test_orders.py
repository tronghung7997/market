import pytest
from sqlalchemy import update

from src.database import SessionLocal
from src.models.pricing_config import PricingConfig
from src.models.product import Product
from src.models.provider import Provider
from tests.conftest import make_admin, make_seller, register_and_login


async def setup_buyable_product(client):
    """Create admin, seller with product+variant+resources, buyer with credit."""
    admin_token = await register_and_login(client, "ord_admin@example.com")
    await make_admin("ord_admin@example.com")
    admin_token = await register_and_login(client, "ord_admin@example.com")

    await client.post("/admin/categories", json={"name": "OrdCat", "slug": "ordcat"},
                      headers={"Authorization": f"Bearer {admin_token}"})
    cats = await client.get("/categories")
    cat_id = cats.json()[-1]["id"]

    seller_token = await register_and_login(client, "ord_seller@example.com")
    await make_seller("ord_seller@example.com")
    seller_token = await register_and_login(client, "ord_seller@example.com")

    product = await client.post("/seller/products", json={
        "category_id": cat_id, "title": "Order Test", "status": "active", "escrow_days": 2,
    }, headers={"Authorization": f"Bearer {seller_token}"})
    product_id = product.json()["id"]

    instant_variant = await client.post(f"/seller/products/{product_id}/variants", json={
        "name": "Instant Var", "price": 1000, "delivery_mode": "instant",
    }, headers={"Authorization": f"Bearer {seller_token}"})
    instant_variant_id = instant_variant.json()["id"]

    manual_variant = await client.post(f"/seller/products/{product_id}/variants", json={
        "name": "Manual Var", "price": 5000, "delivery_mode": "manual", "sla_hours": 24,
    }, headers={"Authorization": f"Bearer {seller_token}"})
    manual_variant_id = manual_variant.json()["id"]

    await client.post(f"/seller/variants/{instant_variant_id}/resources", json={
        "items": ["uid1|pass1", "uid2|pass2", "uid3|pass3"],
    }, headers={"Authorization": f"Bearer {seller_token}"})

    buyer_token = await register_and_login(client, "ord_buyer@example.com")
    buyer_me = await client.get("/me", headers={"Authorization": f"Bearer {buyer_token}"})
    buyer_id = buyer_me.json()["id"]

    await client.post("/wallet/topup", json={"account_id": buyer_id, "amount": 100000},
                      headers={"Authorization": f"Bearer {admin_token}"})

    return buyer_token, seller_token, admin_token, instant_variant_id, manual_variant_id


@pytest.mark.asyncio
async def test_instant_purchase(client):
    buyer_token, _, _, instant_vid, _ = await setup_buyable_product(client)
    resp = await client.post("/orders", json={"variant_id": instant_vid, "quantity": 2},
                             headers={"Authorization": f"Bearer {buyer_token}"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "delivered"
    assert data["total_amount"] == 2000
    assert data["delivered_data"] is not None


@pytest.mark.asyncio
async def test_instant_purchase_insufficient_credit(client):
    buyer_token = await register_and_login(client, "ord_broke@example.com")

    admin_token = await register_and_login(client, "ord_admin2@example.com")
    await make_admin("ord_admin2@example.com")
    admin_token = await register_and_login(client, "ord_admin2@example.com")
    await client.post("/admin/categories", json={"name": "OrdCat2", "slug": "ordcat2"},
                      headers={"Authorization": f"Bearer {admin_token}"})
    cats = await client.get("/categories")
    cat_id = cats.json()[-1]["id"]

    seller_token = await register_and_login(client, "ord_seller2@example.com")
    await make_seller("ord_seller2@example.com")
    seller_token = await register_and_login(client, "ord_seller2@example.com")

    product = await client.post("/seller/products", json={
        "category_id": cat_id, "title": "Expensive", "status": "active",
    }, headers={"Authorization": f"Bearer {seller_token}"})
    variant = await client.post(f"/seller/products/{product.json()['id']}/variants", json={
        "name": "Pricey", "price": 999999, "delivery_mode": "instant",
    }, headers={"Authorization": f"Bearer {seller_token}"})
    await client.post(f"/seller/variants/{variant.json()['id']}/resources", json={
        "items": ["data1"],
    }, headers={"Authorization": f"Bearer {seller_token}"})

    resp = await client.post("/orders", json={"variant_id": variant.json()["id"], "quantity": 1},
                             headers={"Authorization": f"Bearer {buyer_token}"})
    assert resp.status_code == 402


@pytest.mark.asyncio
async def test_manual_order_flow(client):
    buyer_token, seller_token, _, _, manual_vid = await setup_buyable_product(client)

    order = await client.post("/orders", json={"variant_id": manual_vid, "quantity": 1},
                              headers={"Authorization": f"Bearer {buyer_token}"})
    assert order.status_code == 201
    assert order.json()["status"] == "pending"
    order_id = order.json()["id"]

    accept = await client.post(f"/seller/orders/{order_id}/accept",
                               headers={"Authorization": f"Bearer {seller_token}"})
    assert accept.status_code == 200
    assert accept.json()["status"] == "processing"

    deliver = await client.post(f"/seller/orders/{order_id}/deliver",
                                json={"data": "custom_uid|custom_pass"},
                                headers={"Authorization": f"Bearer {seller_token}"})
    assert deliver.status_code == 200
    assert deliver.json()["status"] == "delivered"


@pytest.mark.asyncio
async def test_buyer_list_orders(client):
    buyer_token, _, _, instant_vid, _ = await setup_buyable_product(client)
    await client.post("/orders", json={"variant_id": instant_vid, "quantity": 1},
                      headers={"Authorization": f"Bearer {buyer_token}"})
    resp = await client.get("/orders", headers={"Authorization": f"Bearer {buyer_token}"})
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


# ---------------------------------------------------------------------------
# New adapter-based flow tests
# ---------------------------------------------------------------------------

async def setup_adapter_product(client):
    """Create admin, seller with product linked to a mock provider + pricing config, buyer with credit."""
    admin_token = await register_and_login(client, "adp_admin@example.com")
    await make_admin("adp_admin@example.com")
    admin_token = await register_and_login(client, "adp_admin@example.com")

    # Create category
    await client.post("/admin/categories", json={"name": "AdpCat", "slug": "adpcat"},
                      headers={"Authorization": f"Bearer {admin_token}"})
    cats = await client.get("/categories")
    cat_id = cats.json()[-1]["id"]

    # Create provider (mock adapter)
    provider_resp = await client.post("/admin/providers", json={
        "name": "Test Mock Provider", "type": "proxy", "config": {},
        "priority": 1,
    }, headers={"Authorization": f"Bearer {admin_token}"})
    assert provider_resp.status_code == 201, provider_resp.text
    provider_id = provider_resp.json()["id"]

    # Ensure adapter_type is 'mock' (should be default)
    async with SessionLocal() as db:
        await db.execute(
            update(Provider).where(Provider.id == provider_id).values(adapter_type="mock")
        )
        await db.commit()

    # Create seller + product with service_type and provider_id
    seller_token = await register_and_login(client, "adp_seller@example.com")
    await make_seller("adp_seller@example.com")
    seller_token = await register_and_login(client, "adp_seller@example.com")

    product_resp = await client.post("/seller/products", json={
        "category_id": cat_id, "title": "Proxy Package", "status": "active",
        "escrow_days": 2, "service_type": "proxy",
    }, headers={"Authorization": f"Bearer {seller_token}"})
    assert product_resp.status_code == 201, product_resp.text
    product_id = product_resp.json()["id"]

    # Link product to provider (not in the create schema, so set directly)
    async with SessionLocal() as db:
        await db.execute(
            update(Product).where(Product.id == product_id).values(provider_id=provider_id)
        )
        await db.commit()

    # Create pricing config for service_type "proxy" using config strategy
    async with SessionLocal() as db:
        pc = PricingConfig(
            service_type="proxy",
            strategy="config",
            params={
                "base_price": 10000,
                "type_mult": {"residential": 1.5, "datacenter": 1.0},
                "network_mult": {"shared": 1.0, "dedicated": 2.0},
                "duration_options": [
                    {"days": 30, "label": "1 month"},
                    {"days": 90, "label": "3 months"},
                ],
            },
            is_active=True,
        )
        db.add(pc)
        await db.commit()

    # Create buyer with credit
    buyer_token = await register_and_login(client, "adp_buyer@example.com")
    buyer_me = await client.get("/me", headers={"Authorization": f"Bearer {buyer_token}"})
    buyer_id = buyer_me.json()["id"]

    await client.post("/wallet/topup", json={"account_id": buyer_id, "amount": 500000},
                      headers={"Authorization": f"Bearer {admin_token}"})

    return buyer_token, seller_token, admin_token, product_id


@pytest.mark.asyncio
async def test_adapter_order_success(client):
    """New flow: product_id + user_config -> adapter provision -> delivered."""
    buyer_token, _, _, product_id = await setup_adapter_product(client)

    resp = await client.post("/orders", json={
        "product_id": product_id,
        "user_config": {
            "type": "residential",
            "network": "shared",
            "days": 30,
            "quantity": 1,
        },
        "quantity": 1,
    }, headers={"Authorization": f"Bearer {buyer_token}"})

    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["status"] == "delivered"
    assert data["delivered_data"] is not None
    assert data["product_id"] == product_id
    # Config pricing: 10000 * 1.5 (residential) * 1.0 (shared) * (30/30) * 1 = 15000
    assert data["total_amount"] == 15000


@pytest.mark.asyncio
async def test_adapter_order_invalid_config(client):
    """New flow with invalid user_config should return 400."""
    buyer_token, _, _, product_id = await setup_adapter_product(client)

    resp = await client.post("/orders", json={
        "product_id": product_id,
        "user_config": {
            "type": "nonexistent_type",
            "network": "shared",
            "days": 30,
            "quantity": 1,
        },
        "quantity": 1,
    }, headers={"Authorization": f"Bearer {buyer_token}"})

    assert resp.status_code == 400
    assert "Invalid" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_schema_rejects_both_variant_and_product(client):
    """Cannot provide both variant_id and product_id."""
    buyer_token = await register_and_login(client, "adp_both@example.com")

    resp = await client.post("/orders", json={
        "variant_id": 1,
        "product_id": 1,
        "user_config": {"type": "residential", "network": "shared", "days": 30, "quantity": 1},
        "quantity": 1,
    }, headers={"Authorization": f"Bearer {buyer_token}"})

    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_schema_rejects_neither_variant_nor_product(client):
    """Must provide variant_id or product_id."""
    buyer_token = await register_and_login(client, "adp_neither@example.com")

    resp = await client.post("/orders", json={
        "quantity": 1,
    }, headers={"Authorization": f"Bearer {buyer_token}"})

    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_schema_rejects_product_without_config(client):
    """product_id without user_config should be rejected."""
    buyer_token = await register_and_login(client, "adp_noconf@example.com")

    resp = await client.post("/orders", json={
        "product_id": 1,
        "quantity": 1,
    }, headers={"Authorization": f"Bearer {buyer_token}"})

    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_old_flow_still_works_after_refactor(client):
    """Regression test: variant_id flow continues to work exactly as before."""
    buyer_token, _, _, instant_vid, _ = await setup_buyable_product(client)

    resp = await client.post("/orders", json={"variant_id": instant_vid, "quantity": 1},
                             headers={"Authorization": f"Bearer {buyer_token}"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["status"] == "delivered"
    assert data["total_amount"] == 1000
    assert data["delivered_data"] is not None
    assert data["variant_id"] == instant_vid
