from rest_framework import serializers

from .models import Project


class ProjectSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    created_by = serializers.CharField(source="created_by.username", read_only=True)

    class Meta:
        model = Project
        fields = ("id", "name", "description", "created_by", "created_at", "updated_at")
        read_only_fields = ("id", "created_by", "created_at", "updated_at")
