from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Task

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


class TaskAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password=PASSWORD)
        self.other = User.objects.create_user(username="bob", password=PASSWORD)
        self.client.force_authenticate(user=self.user)

    def test_unauthenticated_cannot_list_tasks(self):
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/tasks/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_task(self):
        response = self.client.post(
            "/api/tasks/",
            {"title": "Write tests", "description": "Cover the API"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Write tests")
        self.assertEqual(response.data["status"], Task.Status.TODO)
        self.assertEqual(response.data["owner"], "alice")
        self.assertEqual(Task.objects.count(), 1)
        self.assertEqual(Task.objects.get().owner, self.user)

    def test_create_task_requires_title(self):
        response = self.client.post(
            "/api/tasks/",
            {"description": "Missing title"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Task.objects.count(), 0)

    def test_list_only_own_tasks(self):
        Task.objects.create(title="Alice task", owner=self.user)
        Task.objects.create(title="Bob task", owner=self.other)

        response = self.client.get("/api/tasks/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Alice task")

    def test_get_own_task(self):
        task = Task.objects.create(title="Alice task", owner=self.user)
        response = self.client.get(f"/api/tasks/{task.pk}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Alice task")

    def test_update_own_task(self):
        task = Task.objects.create(title="Draft", owner=self.user)
        response = self.client.patch(
            f"/api/tasks/{task.pk}/",
            {"status": Task.Status.DONE},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], Task.Status.DONE)
        task.refresh_from_db()
        self.assertEqual(task.status, Task.Status.DONE)

    def test_cannot_update_other_users_task(self):
        task = Task.objects.create(title="Bob task", owner=self.other)
        response = self.client.patch(
            f"/api/tasks/{task.pk}/",
            {"status": Task.Status.DONE},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_own_task(self):
        task = Task.objects.create(title="Temp", owner=self.user)
        response = self.client.delete(f"/api/tasks/{task.pk}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Task.objects.count(), 0)

    def test_cannot_delete_other_users_task(self):
        task = Task.objects.create(title="Bob task", owner=self.other)
        response = self.client.delete(f"/api/tasks/{task.pk}/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(Task.objects.count(), 1)
