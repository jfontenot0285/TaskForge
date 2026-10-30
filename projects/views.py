from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Project

@api_view(['GET'])
def hello(request):
        return Response({'message': 'hello from taskforge!'})

@api_view(["GET"])
def project_list(project):
        projects = Project.objects.all()

        data = [
                {
                        "id": project.id,
                        "name": project.name,
                        "description": project.description,
                }
                for project in projects
        ]

        return Response(data)
