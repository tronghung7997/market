import pytest
from tests.conftest import make_admin, register_and_login


@pytest.mark.asyncio
async def test_list_alerts_admin(client):
    token = await register_and_login(client, "alert_admin@example.com")
    await make_admin("alert_admin@example.com")
    token = await register_and_login(client, "alert_admin@example.com")
    resp = await client.get("/admin/alerts", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
