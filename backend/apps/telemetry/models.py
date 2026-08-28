from django.db import models
from django.contrib.auth.models import User


class ClientErrorLog(models.Model):
    """
    Client-side error log — captures browser/React errors for admin review.
    Maps to db.ts errorLogs array.
    """
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='error_logs')
    message = models.TextField()
    name = models.CharField(max_length=255, blank=True, default='Error')
    stack = models.TextField(blank=True, default='')
    component_stack = models.TextField(blank=True, default='')
    url = models.URLField(max_length=1000, blank=True, default='')
    user_agent = models.TextField(blank=True, default='')
    error_type = models.CharField(max_length=100, blank=True, default='custom')
    metadata = models.JSONField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name_plural = 'Client Error Logs'

    def __str__(self):
        return f"[{self.error_type}] {self.name}: {self.message[:80]}"


class PerformanceMetric(models.Model):
    """
    Web Vitals and performance telemetry recording.
    Maps to db.ts performanceMetrics array.
    """
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='performance_metrics')
    url = models.URLField(max_length=1000, blank=True, default='/')
    view_name = models.CharField(max_length=255, blank=True, default='App')
    user_agent = models.TextField(blank=True, default='')

    # Core Web Vitals (ms or unitless ratios)
    fcp = models.FloatField(null=True, blank=True, help_text='First Contentful Paint (ms)')
    lcp = models.FloatField(null=True, blank=True, help_text='Largest Contentful Paint (ms)')
    cls = models.FloatField(null=True, blank=True, help_text='Cumulative Layout Shift (unitless)')
    fid = models.FloatField(null=True, blank=True, help_text='First Input Delay (ms)')
    inp = models.FloatField(null=True, blank=True, help_text='Interaction to Next Paint (ms)')
    ttfb = models.FloatField(null=True, blank=True, help_text='Time to First Byte (ms)')
    dom_complete = models.FloatField(null=True, blank=True, help_text='DOM Complete (ms)')

    # Derived / custom metrics
    page_load_time = models.FloatField(null=True, blank=True, help_text='Total page load time (ms)')
    route_transition_time = models.FloatField(null=True, blank=True, help_text='Client-side route transition (ms)')
    device_memory = models.FloatField(null=True, blank=True, help_text='Device memory (GB)')
    effective_connection_type = models.CharField(max_length=20, blank=True, default='4g')

    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name_plural = 'Performance Metrics'

    def __str__(self):
        return f"{self.view_name} — LCP {self.lcp}ms, FCP {self.fcp}ms"
