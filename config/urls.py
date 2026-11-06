from django.contrib import admin
from django.urls import include, path, re_path

from config.views import spa
from users.views import hello

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/hello/", hello, name="hello"),
    path("api/auth/", include("users.urls")),
    path("api/", include("projects.urls")),
    path("api/", include("tasks.urls")),
    re_path(r"^(?!api/|admin/|static/).*$", spa),
]
