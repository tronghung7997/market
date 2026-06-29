import pytest
from tests.conftest import make_admin, register_and_login


@pytest.mark.asyncio
async def test_get_wallet_zero_balance(client):
    token = await register_and_login(client, "wallet1@example.com")
    resp = await client.get("/wallet", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["balance"] == 0


@pytest.mark.asyncio
async def test_topup_requires_admin(client):
    token = await register_and_login(client, "wallet2@example.com")
    resp = await client.post("/wallet/topup", json={"account_id": 1, "amount": 10000},
                             headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_admin_topup_success(client):
    buyer_token = await register_and_login(client, "wallet3@example.com")
    buyer_me = await client.get("/me", headers={"Authorization": f"Bearer {buyer_token}"})
    buyer_id = buyer_me.json()["id"]

    admin_token = await register_and_login(client, "walletadmin@example.com")
    await make_admin("walletadmin@example.com")
    admin_token = await register_and_login(client, "walletadmin@example.com")

    resp = await client.post("/wallet/topup", json={"account_id": buyer_id, "amount": 50000},
                             headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 200
    assert resp.json()["balance"] == 50000


@pytest.mark.asyncio
async def test_transaction_history(client):
    token = await register_and_login(client, "wallet4@example.com")
    resp = await client.get("/wallet/transactions", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
