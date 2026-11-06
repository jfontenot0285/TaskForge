from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from projects.models import Project

from .models import Task

User = get_user_model()

PASSWORD = "Taskforge-test-pass-1"


class TaskAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password=PASSWORD)
        self.other = User.objects.create_user(username="bob", password=PASSWORD)
        self.client.force_authenticate(user=self.user)

    def test_unauthenticated_cannot_list_tasks(self):
        self.client.force_authenticate(user=None)
        response = self.client.get("/api/tasks/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_create_task_defaults_assignee_to_current_user(self):
        response = self.client.post(
            "/api/tasks/",
            {"title": "Write tests", "description": "Cover the API"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Write tests")
        self.assertEqual(response.data["status"], Task.Status.NEW)
        self.assertEqual(response.data["priority"], Task.Priority.MEDIUM)
        self.assertEqual(response.data["assignee"], "alice")
        self.assertEqual(response.data["projects"], [])
        self.assertEqual(Task.objects.get().assignee, self.user)

    def test_create_task_assigned_to_another_user(self):
        response = self.client.post(
            "/api/tasks/",
            {"title": "Bob's work", "assignee": "bob"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["assignee"], "bob")
        self.assertEqual(Task.objects.get().assignee, self.other)

        listed = self.client.get("/api/tasks/")
        self.assertEqual(listed.data, [])

    def test_create_task_in_multiple_projects(self):
        website = Project.objects.create(name="Website", created_by=self.user)
        mobile = Project.objects.create(name="Mobile", created_by=self.user)

        response = self.client.post(
            "/api/tasks/",
            {
                "title": "Shared design",
                "projects": [str(website.pk), str(mobile.pk)],
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertCountEqual(response.data["projects"], [str(website.pk), str(mobile.pk)])
        task = Task.objects.get()
        self.assertEqual(task.projects.count(), 2)
        self.assertEqual(website.tasks.count(), 1)
        self.assertEqual(mobile.tasks.count(), 1)

    def test_create_task_requires_title(self):
        response = self.client.post(
            "/api/tasks/",
            {"description": "Missing title"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Task.objects.count(), 0)

    def test_list_only_assigned_tasks(self):
        Task.objects.create(title="Alice task", assignee=self.user)
        Task.objects.create(title="Bob task", assignee=self.other)

        response = self.client.get("/api/tasks/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["title"], "Alice task")

    def test_get_assigned_task(self):
        task = Task.objects.create(title="Alice task", assignee=self.user)
        response = self.client.get(f"/api/tasks/{task.pk}/")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["title"], "Alice task")

    def test_update_assigned_task(self):
        task = Task.objects.create(title="Draft", assignee=self.user)
        response = self.client.patch(
            f"/api/tasks/{task.pk}/",
            {"status": Task.Status.DONE, "priority": Task.Priority.HIGH},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], Task.Status.DONE)
        self.assertEqual(response.data["priority"], Task.Priority.HIGH)
        task.refresh_from_db()
        self.assertEqual(task.status, Task.Status.DONE)
        self.assertEqual(task.priority, Task.Priority.HIGH)

    def test_cannot_update_other_users_task(self):
        task = Task.objects.create(title="Bob task", assignee=self.other)
        response = self.client.patch(
            f"/api/tasks/{task.pk}/",
            {"status": Task.Status.DONE, "priority": Task.Priority.HIGH},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_assigned_task(self):
        task = Task.objects.create(title="Temp", assignee=self.user)
        response = self.client.delete(f"/api/tasks/{task.pk}/")

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Task.objects.count(), 0)

    def test_cannot_delete_other_users_task(self):
        task = Task.objects.create(title="Bob task", assignee=self.other)
        response = self.client.delete(f"/api/tasks/{task.pk}/")

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(Task.objects.count(), 1)
