from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Project
from .serializers import ProjectSerializer
from rest_framework import status

@api_view(['GET'])
def hello(request):
        return Response({'message': 'hello from taskforge!'})

@api_view(["GET", "POST"])
def project_list(request):
        if request.method == 'GET':
                projects = Project.objects.all()
                serializer = ProjectSerializer(projects, many=True)

                return Response(serializer.data)

        else: # POST tells serializer to default to create without instance argument
                serializer = ProjectSerializer(data=request.data)

                if serializer.is_valid():
                        serializer.save()
                        return Response(
                                serializer.data,
                                status=status.HTTP_201_CREATED
                        )

                return Response(
                        serializer.errors,
                        status=status.HTTP_400_BAD_REQUEST
                )

@api_view(["PUT", "PATCH", "DELETE"])
def project_detail(request, pk):
    project = get_object_or_404(Project, pk=pk)

    if request.method == "DELETE":
        project.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = ProjectSerializer(
        instance=project,
        data=request.data,
        partial=(request.method == "PATCH")
    )

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    return Response(
        serializer.errors,
        status=status.HTTP_400_BAD_REQUEST
    )