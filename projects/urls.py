from django.urls import path

from . import views

urlpatterns = [
    path("hello/", views.hello, name="hello"),
    path("auth/register/", views.register, name="register"),
    path("auth/login/", views.login_view, name="login"),
    path("auth/logout/", views.logout_view, name="logout"),
    path("auth/me/", views.me, name="me"),
    path("tasks/", views.task_list, name="task-list"),
    path("tasks/<object_id:pk>/", views.task_detail, name="task-detail"),
]
