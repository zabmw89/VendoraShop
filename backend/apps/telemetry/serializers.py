from rest_framework import serializers
from .models import ClientErrorLog, PerformanceMetric


class ClientErrorLogSerializer(serializers.ModelSerializer):
    userId = serializers.IntegerField(source='user.id', read_only=True, allow_null=True)
    componentStack = serializers.CharField(source='component_stack', required=False, allow_blank=True)
    errorType = serializers.CharField(source='error_type', required=False, allow_blank=True)
    userAgent = serializers.CharField(source='user_agent', required=False, allow_blank=True)

    class Meta:
        model = ClientErrorLog
        fields = [
            'id', 'userId', 'message', 'name', 'stack',
            'componentStack', 'component_stack', 'url',
            'userAgent', 'user_agent', 'errorType', 'error_type',
            'metadata', 'timestamp',
        ]


class PerformanceMetricSerializer(serializers.ModelSerializer):
    userId = serializers.IntegerField(source='user.id', read_only=True, allow_null=True)
    viewName = serializers.CharField(source='view_name', required=False, allow_blank=True)
    userAgent = serializers.CharField(source='user_agent', required=False, allow_blank=True)
    pageLoadTime = serializers.FloatField(source='page_load_time', required=False, allow_null=True)
    routeTransitionTime = serializers.FloatField(source='route_transition_time', required=False, allow_null=True)

    class Meta:
        model = PerformanceMetric
        fields = [
            'id', 'userId', 'url', 'viewName', 'view_name',
            'userAgent', 'user_agent',
            'fcp', 'lcp', 'cls', 'fid', 'inp', 'ttfb', 'dom_complete',
            'pageLoadTime', 'page_load_time',
            'routeTransitionTime', 'route_transition_time',
            'recorded_at',
        ]


class PerformanceSummarySerializer(serializers.Serializer):
    total_records = serializers.IntegerField()
    avg_fcp = serializers.FloatField(allow_null=True)
    avg_lcp = serializers.FloatField(allow_null=True)
    avg_cls = serializers.FloatField(allow_null=True)
    avg_fid = serializers.FloatField(allow_null=True)
    avg_inp = serializers.FloatField(allow_null=True)
    avg_ttfb = serializers.FloatField(allow_null=True)
    avg_page_load_time = serializers.FloatField(allow_null=True)
