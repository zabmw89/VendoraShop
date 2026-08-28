from django.urls import path
from .views import (
    ClientErrorLogView,
    AdminErrorLogsView,
    PerformanceLogView,
    AdminPerformanceView,
)

urlpatterns = [
    path('logs/error/', ClientErrorLogView.as_view(), name='log-error'),
    path('admin/error-logs/', AdminErrorLogsView.as_view(), name='admin-error-logs'),
    path('logs/performance/', PerformanceLogView.as_view(), name='log-performance'),
    path('admin/performance/', AdminPerformanceView.as_view(), name='admin-performance'),
]
