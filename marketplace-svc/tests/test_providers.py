import pytest
from tests.conftest import make_admin, register_and_login


@pytest.mark.asyncio
async def test_create_provider(client):
    token = await register_and_login(client, "prov_admin@example.com")
    await make_admin("prov_admin@example.com")
    token = await register_and_login(client, "prov_admin@example.com")
    resp = await client.post("/admin/providers", json={
        "name": "TestProvider", "type": "proxy",
        "config": {"health_endpoint": "http://example.com/health"},
    }, headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 201
    assert resp.json()["name"] == "TestProvider"


@pytest.mark.asyncio
async def test_list_providers(client):
    token = await register_and_login(client, "prov_admin2@example.com")
    await make_admin("prov_admin2@example.com")
    token = await register_and_login(client, "prov_admin2@example.com")
    resp = await client.get("/providers", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
