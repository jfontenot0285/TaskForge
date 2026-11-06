from django.urls import path

from . import views

urlpatterns = [
    path("tasks/", views.task_list, name="task-list"),
    path("tasks/<object_id:pk>/", views.task_detail, name="task-detail"),
]
