from django.contrib import admin
from django.urls import include, path

from users.views import hello

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/hello/", hello, name="hello"),
    path("api/auth/", include("users.urls")),
    path("api/", include("projects.urls")),
    path("api/", include("tasks.urls")),
]
