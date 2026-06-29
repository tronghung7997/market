import pytest
from tests.conftest import make_admin, make_seller, register_and_login

INTERNAL_HEADERS = {"X-Internal-Key": "test-internal-key"}


async def setup_variant(client):
    admin_token = await register_and_login(client, "res_admin@example.com")
    await make_admin("res_admin@example.com")
    admin_token = await register_and_login(client, "res_admin@example.com")

    await client.post("/admin/categories", json={"name": "ResCat", "slug": "rescat"},
                      headers={"Authorization": f"Bearer {admin_token}"})

    seller_token = await register_and_login(client, "res_seller@example.com")
    await make_seller("res_seller@example.com")
    seller_token = await register_and_login(client, "res_seller@example.com")

    cats = await client.get("/categories")
    cat_id = cats.json()[-1]["id"]

    product = await client.post("/seller/products", json={
        "category_id": cat_id, "title": "Resource Test Product", "status": "active",
    }, headers={"Authorization": f"Bearer {seller_token}"})
    product_id = product.json()["id"]

    variant = await client.post(f"/seller/products/{product_id}/variants", json={
        "name": "Test Variant", "price": 1000, "delivery_mode": "instant",
    }, headers={"Authorization": f"Bearer {seller_token}"})
    variant_id = variant.json()["id"]

    return seller_token, variant_id


@pytest.mark.asyncio
async def test_bulk_add_resources(client):
    seller_token, variant_id = await setup_variant(client)
    resp = await client.post(f"/seller/variants/{variant_id}/resources", json={
        "items": ["uid1|pass1|2fa1", "uid2|pass2|2fa2", "uid3|pass3|2fa3"],
    }, headers={"Authorization": f"Bearer {seller_token}"})
    assert resp.status_code == 201
    assert resp.json()["count"] == 3


@pytest.mark.asyncio
async def test_list_resources(client):
    seller_token, variant_id = await setup_variant(client)
    await client.post(f"/seller/variants/{variant_id}/resources", json={
        "items": ["data1", "data2"],
    }, headers={"Authorization": f"Bearer {seller_token}"})
    resp = await client.get(f"/seller/variants/{variant_id}/resources",
                            headers={"Authorization": f"Bearer {seller_token}"})
    assert resp.status_code == 200
    assert len(resp.json()) >= 2


@pytest.mark.asyncio
async def test_delete_resource(client):
    seller_token, variant_id = await setup_variant(client)
    await client.post(f"/seller/variants/{variant_id}/resources", json={
        "items": ["to_delete"],
    }, headers={"Authorization": f"Bearer {seller_token}"})
    resources = await client.get(f"/seller/variants/{variant_id}/resources",
                                 headers={"Authorization": f"Bearer {seller_token}"})
    res_id = resources.json()[-1]["id"]
    resp = await client.delete(f"/seller/resources/{res_id}",
                               headers={"Authorization": f"Bearer {seller_token}"})
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_internal_acquire(client):
    """Regression: /internal/resources/acquire must pass order_id=None, duration_days=None."""
    seller_token, variant_id = await setup_variant(client)
    await client.post(f"/seller/variants/{variant_id}/resources", json={
        "items": ["acq1|pw1", "acq2|pw2"],
    }, headers={"Authorization": f"Bearer {seller_token}"})

    resp = await client.post("/internal/resources/acquire", json={
        "variant_id": variant_id, "quantity": 2,
    }, headers=INTERNAL_HEADERS)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["resources"]) == 2
    assert all("resource_id" in r and "data" in r for r in data["resources"])
