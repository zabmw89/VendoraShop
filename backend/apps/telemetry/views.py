from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.db.models import Avg

from .models import ClientErrorLog, PerformanceMetric
from .serializers import (
    ClientErrorLogSerializer,
    PerformanceMetricSerializer,
)


def _is_admin(user):
    return (
        user.is_authenticated
        and hasattr(user, 'profile')
        and user.profile.role == 'admin'
    )


class ClientErrorLogView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = request.data or {}
        log = ClientErrorLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            message=data.get('message', 'Unknown error message'),
            name=data.get('name', 'Error'),
            stack=data.get('stack', ''),
            component_stack=data.get('componentStack', ''),
            url=data.get('url', ''),
            user_agent=data.get('userAgent', request.headers.get('User-Agent', '')),
            error_type=data.get('errorType', 'custom'),
            metadata=data.get('metadata'),
        )
        return Response({'success': True, 'logId': log.id}, status=status.HTTP_201_CREATED)


class AdminErrorLogsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user):
            return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
        logs = ClientErrorLog.objects.all()[:200]
        return Response(ClientErrorLogSerializer(logs, many=True).data)

    def delete(self, request):
        if not _is_admin(request.user):
            return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
        ClientErrorLog.objects.all().delete()
        return Response({'message': 'Error logs cleared successfully.'})


class PerformanceLogView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        data = request.data or {}
        metric = PerformanceMetric.objects.create(
            user=request.user if request.user.is_authenticated else None,
            url=data.get('url', '/'),
            view_name=data.get('viewName', data.get('view_name', 'App')),
            user_agent=data.get('userAgent', request.headers.get('User-Agent', '')),
            fcp=data.get('fcp'),
            lcp=data.get('lcp'),
            cls=data.get('cls'),
            fid=data.get('fid'),
            inp=data.get('inp'),
            ttfb=data.get('ttfb'),
            dom_complete=data.get('domComplete', data.get('dom_complete')),
            page_load_time=data.get('pageLoadTime', data.get('page_load_time')),
            route_transition_time=data.get('routeTransitionTime', data.get('route_transition_time')),
        )
        return Response({'success': True, 'metricId': metric.id}, status=status.HTTP_201_CREATED)


class AdminPerformanceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not _is_admin(request.user):
            return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
        qs = PerformanceMetric.objects.all()
        summary = qs.aggregate(
            total_records=Avg('id'),  # placeholder for count
            avg_fcp=Avg('fcp'),
            avg_lcp=Avg('lcp'),
            avg_cls=Avg('cls'),
            avg_fid=Avg('fid'),
            avg_inp=Avg('inp'),
            avg_ttfb=Avg('ttfb'),
            avg_page_load_time=Avg('page_load_time'),
        )
        summary['total_records'] = qs.count()
        return Response(summary)

    def delete(self, request):
        if not _is_admin(request.user):
            return Response({'error': 'Admin access required.'}, status=status.HTTP_403_FORBIDDEN)
        PerformanceMetric.objects.all().delete()
        return Response({'message': 'Performance metrics reset successfully.'})
