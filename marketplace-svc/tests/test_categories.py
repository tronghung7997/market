import pytest
from tests.conftest import make_admin, register_and_login


@pytest.mark.asyncio
async def test_list_categories_public(client):
    resp = await client.get("/categories")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_create_category_requires_admin(client):
    token = await register_and_login(client, "cat_nonadmin@example.com")
    resp = await client.post("/admin/categories", json={"name": "Test", "slug": "test"},
                             headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_create_root_category(client):
    token = await register_and_login(client, "cat_admin@example.com")
    await make_admin("cat_admin@example.com")
    token = await register_and_login(client, "cat_admin@example.com")
    resp = await client.post("/admin/categories", json={"name": "Twitter", "slug": "twitter"},
                             headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 201
    assert resp.json()["name"] == "Twitter"
    assert resp.json()["parent_id"] is None


@pytest.mark.asyncio
async def test_create_child_category(client):
    token = await register_and_login(client, "cat_admin2@example.com")
    await make_admin("cat_admin2@example.com")
    token = await register_and_login(client, "cat_admin2@example.com")

    parent = await client.post("/admin/categories", json={"name": "Telegram", "slug": "telegram"},
                               headers={"Authorization": f"Bearer {token}"})
    parent_id = parent.json()["id"]

    child = await client.post("/admin/categories", json={"name": "Telegram USA", "slug": "telegram-usa", "parent_id": parent_id},
                              headers={"Authorization": f"Bearer {token}"})
    assert child.status_code == 201
    assert child.json()["parent_id"] == parent_id


@pytest.mark.asyncio
async def test_list_categories_returns_tree(client):
    resp = await client.get("/categories")
    assert resp.status_code == 200
