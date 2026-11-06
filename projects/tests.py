from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase

from tasks.models import Task

from .models import Project

User = get_user_model()

PASSWORD = "Taskforge-test-pass-1"


class ProjectAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="alice", password=PASSWORD)
        self.other = User.objects.create_user(username="bob", password=PASSWORD)
        self.client.force_authenticate(user=self.user)

    def test_create_project(self):
        response = self.client.post(
            "/api/projects/",
            {"name": "Website", "description": "Launch work"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "Website")
        self.assertEqual(response.data["created_by"], "alice")
        self.assertEqual(Project.objects.get().created_by, self.user)

    def test_list_only_visible_projects(self):
        mine = Project.objects.create(name="Alice project", created_by=self.user)
        other = Project.objects.create(name="Bob project", created_by=self.other)
        shared = Project.objects.create(name="Shared", created_by=self.other)
        Task.objects.create(title="Alice on shared", assignee=self.user).projects.add(shared)

        response = self.client.get("/api/projects/")
        names = {project["name"] for project in response.data}

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(names, {mine.name, shared.name})
        self.assertNotIn(other.name, names)

    def test_cannot_update_someone_elses_project(self):
        project = Project.objects.create(name="Bob project", created_by=self.other)
        Task.objects.create(title="Assigned", assignee=self.user).projects.add(project)

        response = self.client.patch(
            f"/api/projects/{project.pk}/",
            {"name": "Hijacked"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        project.refresh_from_db()
        self.assertEqual(project.name, "Bob project")
