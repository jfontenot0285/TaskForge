from django.contrib.auth import get_user_model
from rest_framework import serializers

from projects.models import Project

from .models import Task

User = get_user_model()


class TaskSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    assignee = serializers.SlugRelatedField(
        slug_field="username",
        queryset=User.objects.all(),
        required=False,
    )
    projects = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Project.objects.all(),
        pk_field=serializers.CharField(),
        required=False,
    )

    class Meta:
        model = Task
        fields = (
            "id",
            "title",
            "description",
            "status",
            "priority",
            "assignee",
            "projects",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def create(self, validated_data):
        request = self.context.get("request")
        if "assignee" not in validated_data and request and request.user.is_authenticated:
            validated_data["assignee"] = request.user
        return super().create(validated_data)
