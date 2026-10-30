from rest_framework.test import APITestCase
from rest_framework import status
from .models import Project

class ProjectAPITests(APITestCase):

    def test_create_project(self):
        response = self.client.post(
            '/api/projects/',
            {
                "name": "Test Project",
                "description": "Testing project creation",
            },
            format="json"
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_201_CREATED,
        )

        self.assertEqual(Project.objects.count(), 1)

    def test_create_project_invalid_data(self):
        response = self.client.post(
            '/api/projects/',
            {
                "description": "Testing project creation",
            }
        )

        self.assertEqual(
            response.status_code,
            status.HTTP_400_BAD_REQUEST,
        )

        self.assertEqual(Project.objects.count(), 0)
