import pytest
from tests.conftest import make_admin, make_seller, register_and_login


async def create_delivered_order(client):
    admin_token = await register_and_login(client, "disp_admin@example.com")
    await make_admin("disp_admin@example.com")
    admin_token = await register_and_login(client, "disp_admin@example.com")

    await client.post("/admin/categories", json={"name": "DispCat", "slug": "dispcat"},
                      headers={"Authorization": f"Bearer {admin_token}"})
    cats = await client.get("/categories")
    cat_id = cats.json()[-1]["id"]

    seller_token = await register_and_login(client, "disp_seller@example.com")
    await make_seller("disp_seller@example.com")
    seller_token = await register_and_login(client, "disp_seller@example.com")

    product = await client.post("/seller/products", json={
        "category_id": cat_id, "title": "Dispute Test", "status": "active", "escrow_days": 2,
    }, headers={"Authorization": f"Bearer {seller_token}"})
    variant = await client.post(f"/seller/products/{product.json()['id']}/variants", json={
        "name": "DisputeVar", "price": 1000, "delivery_mode": "instant",
    }, headers={"Authorization": f"Bearer {seller_token}"})
    await client.post(f"/seller/variants/{variant.json()['id']}/resources", json={
        "items": ["uid|pass"],
    }, headers={"Authorization": f"Bearer {seller_token}"})

    buyer_token = await register_and_login(client, "disp_buyer@example.com")
    buyer_me = await client.get("/me", headers={"Authorization": f"Bearer {buyer_token}"})
    await client.post("/wallet/topup", json={"account_id": buyer_me.json()["id"], "amount": 50000},
                      headers={"Authorization": f"Bearer {admin_token}"})

    order = await client.post("/orders", json={"variant_id": variant.json()["id"], "quantity": 1},
                              headers={"Authorization": f"Bearer {buyer_token}"})
    return buyer_token, admin_token, order.json()["id"]


@pytest.mark.asyncio
async def test_buyer_can_dispute(client):
    buyer_token, _, order_id = await create_delivered_order(client)
    resp = await client.post(f"/orders/{order_id}/dispute", json={"reason": "Account not working"},
                             headers={"Authorization": f"Bearer {buyer_token}"})
    assert resp.status_code == 201
    assert resp.json()["status"] == "open"


@pytest.mark.asyncio
async def test_admin_refund_dispute(client):
    buyer_token, admin_token, order_id = await create_delivered_order(client)
    await client.post(f"/orders/{order_id}/dispute", json={"reason": "Broken"},
                      headers={"Authorization": f"Bearer {buyer_token}"})

    disputes = await client.get("/admin/disputes", headers={"Authorization": f"Bearer {admin_token}"})
    dispute_id = disputes.json()[-1]["id"]

    resp = await client.post(f"/admin/disputes/{dispute_id}/refund",
                             json={"admin_note": "Confirmed broken"},
                             headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "resolved_refund"


@pytest.mark.asyncio
async def test_admin_reject_dispute(client):
    buyer_token, admin_token, order_id = await create_delivered_order(client)
    await client.post(f"/orders/{order_id}/dispute", json={"reason": "I changed my mind"},
                      headers={"Authorization": f"Bearer {buyer_token}"})

    disputes = await client.get("/admin/disputes", headers={"Authorization": f"Bearer {admin_token}"})
    dispute_id = disputes.json()[-1]["id"]

    resp = await client.post(f"/admin/disputes/{dispute_id}/reject",
                             json={"admin_note": "Product works fine"},
                             headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "resolved_reject"
