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
        self.assertEqual(listed.data["results"], [])

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
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["title"], "Alice task")

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

    def test_list_paginates_ten_tasks_at_a_time(self):
        for index in range(1, 12):
            Task.objects.create(title=f"seed{index}", assignee=self.user)

        first = self.client.get("/api/tasks/")
        self.assertEqual(first.status_code, status.HTTP_200_OK)
        self.assertEqual(first.data["count"], 11)
        self.assertEqual(len(first.data["results"]), 10)
        self.assertIsNotNone(first.data["next"])
        self.assertIsNone(first.data["previous"])

        second = self.client.get("/api/tasks/?page=2")
        self.assertEqual(second.status_code, status.HTTP_200_OK)
        self.assertEqual(len(second.data["results"]), 1)
        self.assertIsNone(second.data["next"])
        self.assertIsNotNone(second.data["previous"])

        first_ids = [task["id"] for task in first.data["results"]]
        second_ids = [task["id"] for task in second.data["results"]]
        self.assertEqual(len(set(first_ids + second_ids)), 11)

    def test_list_pages_do_not_repeat_tasks_with_the_same_timestamp(self):
        Task.objects.bulk_create(
            Task(title=f"seed{index}", assignee=self.user)
            for index in range(1, 41)
        )

        seen = []
        for page in (1, 2, 3, 4):
            response = self.client.get(f"/api/tasks/?page={page}")
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            titles = [task["title"] for task in response.data["results"]]
            seen.extend(titles)

        self.assertEqual(len(seen), 40)
        self.assertEqual(len(set(seen)), 40)

    def test_list_can_filter_by_status(self):
        Task.objects.create(title="Ready", assignee=self.user, status=Task.Status.NEW)
        Task.objects.create(
            title="Working",
            assignee=self.user,
            status=Task.Status.IN_PROGRESS,
        )

        response = self.client.get("/api/tasks/?status=in_progress")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["title"], "Working")
