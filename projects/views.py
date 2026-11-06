from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Project
from .serializers import ProjectSerializer


def _visible_projects(user):
    return Project.objects.filter(
        Q(created_by=user) | Q(tasks__assignee=user)
    ).distinct()


@api_view(["GET", "POST"])
def project_list(request):
    if request.method == "GET":
        projects = _visible_projects(request.user)
        return Response(ProjectSerializer(projects, many=True).data)

    serializer = ProjectSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(created_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "PATCH", "DELETE"])
def project_detail(request, pk):
    project = get_object_or_404(_visible_projects(request.user), pk=pk)

    if request.method == "GET":
        return Response(ProjectSerializer(project).data)

    if project.created_by_id != request.user.pk:
        return Response(status=status.HTTP_403_FORBIDDEN)

    if request.method == "DELETE":
        project.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = ProjectSerializer(
        instance=project,
        data=request.data,
        partial=(request.method == "PATCH"),
    )
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
