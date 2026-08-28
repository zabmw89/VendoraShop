"""
Single-Page-App fallback view.

In production a single Django service serves both the REST API (under /api/…)
and the compiled React app (frontend `npm run build` → repo-root `dist/`).
WhiteNoise serves the hashed static assets; this view returns dist/index.html
for every other (non-API) path so client-side routing works on hard refresh.
"""
from django.conf import settings
from django.http import HttpResponse, HttpResponseNotFound
from django.views import View


class SPAView(View):
    """Serve the built React index.html as the SPA entry point."""

    def get(self, request, *args, **kwargs):
        dist_dir = getattr(settings, 'SPA_DIST_DIR', None)
        if not dist_dir:
            return HttpResponseNotFound(
                "SPA build not found. Run `npm run build` to generate dist/."
            )

        index_file = dist_dir / 'index.html'
        if not index_file.exists():
            return HttpResponseNotFound(
                "SPA build not found. Run `npm run build` to generate dist/."
            )

        return HttpResponse(index_file.read_text(encoding='utf-8'), content_type='text/html')
