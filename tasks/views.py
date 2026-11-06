from django.db.models import Case, IntegerField, Value, When
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from .models import Task
from .serializers import TaskSerializer

SORT_FIELDS = {
    "created_at": ("created_at", "pk"),
    "name": ("title", "pk"),
    "id": ("pk",),
    "priority": ("priority_rank", "pk"),
}
ORDER_OPTIONS = {"asc", "desc"}


class TaskPagination(PageNumberPagination):
    page_size = 10


def _flip(field):
    return field[1:] if field.startswith("-") else f"-{field}"


def _ordered_tasks(queryset, sort, order):
    fields = SORT_FIELDS[sort]
    if sort == "priority":
        queryset = queryset.annotate(
            priority_rank=Case(
                When(priority=Task.Priority.LOW, then=Value(0)),
                When(priority=Task.Priority.MEDIUM, then=Value(1)),
                When(priority=Task.Priority.HIGH, then=Value(2)),
                default=Value(3),
                output_field=IntegerField(),
            )
        )
    if order == "desc":
        fields = tuple(_flip(field) for field in fields)
    return queryset.order_by(*fields)


@api_view(["GET", "POST"])
def task_list(request):
    if request.method == "GET":
        sort = request.query_params.get("sort", "created_at")
        if sort not in SORT_FIELDS:
            return Response(
                {"sort": ["Invalid sort. Use created_at, name, id, or priority."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order = request.query_params.get("order", "desc" if sort == "created_at" else "asc")
        if order not in ORDER_OPTIONS:
            return Response(
                {"order": ["Invalid order. Use asc or desc."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        tasks = Task.objects.filter(assignee=request.user)
        status_filter = request.query_params.get("status")
        if status_filter:
            if status_filter not in Task.Status.values:
                return Response(
                    {"status": ["Invalid status."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            tasks = tasks.filter(status=status_filter)

        tasks = _ordered_tasks(tasks, sort, order)
        paginator = TaskPagination()
        page = paginator.paginate_queryset(tasks, request)
        return paginator.get_paginated_response(TaskSerializer(page, many=True).data)

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
