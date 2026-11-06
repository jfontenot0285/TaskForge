from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()

PASSWORD = "Taskforge-test-pass-1"


class AuthAPITests(APITestCase):
    def test_register_creates_user_and_logs_in(self):
        response = self.client.post(
            "/api/auth/register/",
            {"username": "alice", "password": PASSWORD},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)

        me = self.client.get("/api/auth/me/")
        self.assertEqual(me.status_code, status.HTTP_200_OK)
        self.assertEqual(me.data["username"], "alice")

    def test_register_duplicate_username(self):
        User.objects.create_user(username="alice", password=PASSWORD)
        response = self.client.post(
            "/api/auth/register/",
            {"username": "alice", "password": PASSWORD},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_and_logout(self):
        User.objects.create_user(username="alice", password=PASSWORD)
        response = self.client.post(
            "/api/auth/login/",
            {"username": "alice", "password": PASSWORD},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.get("/api/auth/me/").status_code, status.HTTP_200_OK)

        logout = self.client.post("/api/auth/logout/")
        self.assertEqual(logout.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(self.client.get("/api/auth/me/").status_code, status.HTTP_403_FORBIDDEN)

    def test_invalid_login(self):
        response = self.client.post(
            "/api/auth/login/",
            {"username": "alice", "password": "nope"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
