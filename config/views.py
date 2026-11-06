from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404


def spa(_request, rest=None):
    index = Path(settings.FRONTEND_DIST) / "index.html"
    if not index.exists():
        raise Http404("Frontend build is missing. Run npm run build in frontend/.")
    return FileResponse(index.open("rb"), content_type="text/html")
