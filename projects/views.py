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

        else:
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
