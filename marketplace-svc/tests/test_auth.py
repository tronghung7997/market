import pytest


@pytest.mark.asyncio
async def test_register_success(client):
    response = await client.post("/auth/register", json={
        "email": "test@example.com",
        "password": "StrongPass123!",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "id" in data
    assert "buyer" in data["roles"]
    assert "password" not in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client):
    payload = {"email": "dup@example.com", "password": "StrongPass123!"}
    await client.post("/auth/register", json=payload)
    response = await client.post("/auth/register", json=payload)
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_login_success(client):
    await client.post("/auth/register", json={"email": "login@example.com", "password": "StrongPass123!"})
    response = await client.post("/auth/login", json={"email": "login@example.com", "password": "StrongPass123!"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    await client.post("/auth/register", json={"email": "wp@example.com", "password": "StrongPass123!"})
    response = await client.post("/auth/login", json={"email": "wp@example.com", "password": "wrong"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_me_requires_auth(client):
    response = await client.get("/me")
    # Missing credentials → 401 Unauthorized (FastAPI/Starlette current behavior).
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_me_returns_account(client):
    await client.post("/auth/register", json={"email": "me@example.com", "password": "StrongPass123!"})
    login = await client.post("/auth/login", json={"email": "me@example.com", "password": "StrongPass123!"})
    token = login.json()["access_token"]
    response = await client.get("/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "me@example.com"
