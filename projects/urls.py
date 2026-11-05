from django.urls import path
from . import views

urlpatterns = [
    path("hello/", views.hello, name="hello"),
    path("projects/", views.project_list, name="project-list"),
    path("projects/<object_id:pk>/", views.project_detail, name="project-detail"),
]