import pytest
from tests.conftest import make_admin, make_seller, register_and_login


@pytest.mark.asyncio
async def test_buyer_can_apply_for_seller(client):
    token = await register_and_login(client, "apply1@example.com")
    resp = await client.post("/seller/apply", json={
        "business_name": "My Shop",
        "description": "Selling accounts",
        "contact": "telegram @myshop",
    }, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 201
    assert resp.json()["status"] == "pending"


@pytest.mark.asyncio
async def test_admin_can_list_applications(client):
    token = await register_and_login(client, "admin_list@example.com")
    await make_admin("admin_list@example.com")
    token = await register_and_login(client, "admin_list@example.com")
    resp = await client.get("/admin/seller-applications", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_admin_approve_application(client):
    buyer_token = await register_and_login(client, "toapprove@example.com")
    await client.post("/seller/apply", json={
        "business_name": "Approve Me",
    }, headers={"Authorization": f"Bearer {buyer_token}"})

    admin_token = await register_and_login(client, "admin_approve@example.com")
    await make_admin("admin_approve@example.com")
    admin_token = await register_and_login(client, "admin_approve@example.com")

    apps = await client.get("/admin/seller-applications", headers={"Authorization": f"Bearer {admin_token}"})
    app_id = apps.json()[-1]["id"]

    resp = await client.post(f"/admin/seller-applications/{app_id}/approve",
                             headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "approved"

    # Verify buyer now has seller role
    buyer_token2 = await register_and_login(client, "toapprove@example.com")
    me = await client.get("/me", headers={"Authorization": f"Bearer {buyer_token2}"})
    assert "seller" in me.json()["roles"]


@pytest.mark.asyncio
async def test_non_admin_cannot_approve(client):
    token = await register_and_login(client, "nonadmin@example.com")
    resp = await client.post("/admin/seller-applications/1/approve",
                             headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403
