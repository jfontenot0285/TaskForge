from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Task
from .serializers import TaskSerializer


@api_view(["GET", "POST"])
def task_list(request):
    if request.method == "GET":
        tasks = Task.objects.filter(assignee=request.user)
        return Response(TaskSerializer(tasks, many=True).data)

    serializer = TaskSerializer(data=request.data, context={"request": request})
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "PATCH", "DELETE"])
def task_detail(request, pk):
    task = get_object_or_404(Task, pk=pk, assignee=request.user)

    if request.method == "GET":
        return Response(TaskSerializer(task).data)

    if request.method == "DELETE":
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = TaskSerializer(
        instance=task,
        data=request.data,
        partial=(request.method == "PATCH"),
        context={"request": request},
    )
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
