"""
Management command to configure allauth social login.

Sets the Sites framework domain and optionally registers SocialApp DB entries.
If SOCIALACCOUNT_PROVIDERS already has APP credentials in settings.py,
this command skips DB registration (avoids MultipleObjectsReturned).

Run once after deployment:
    python manage.py setup_social_auth
"""
import os
from django.core.management.base import BaseCommand
from django.contrib.sites.models import Site
from django.conf import settings
from allauth.socialaccount.models import SocialApp


class Command(BaseCommand):
    help = 'Configure Sites domain and register allauth SocialApp entries if needed.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--domain',
            default=os.environ.get('SITE_DOMAIN', 'localhost:8000'),
            help='Domain for the Sites framework (default: from SITE_DOMAIN env or localhost:8000)',
        )

    def handle(self, *args, **options):
        domain = options['domain']

        # 1. Fix Sites domain
        site = Site.objects.get_current()
        old_domain = site.domain
        site.domain = domain
        site.name = 'VendoraShop'
        site.save()
        self.stdout.write(self.style.SUCCESS(f'Site domain: {old_domain} → {domain}'))

        # 2. Register SocialApps only if NOT already configured in settings
        providers_config = getattr(settings, 'SOCIALACCOUNT_PROVIDERS', {})

        for provider_name, env_key, env_secret, label in [
            ('google', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'Google'),
            ('apple', 'APPLE_CLIENT_ID', 'APPLE_CLIENT_SECRET', 'Apple'),
        ]:
            client_id = os.environ.get(env_key, '')
            secret = os.environ.get(env_secret, '')

            # Check if SOCIALACCOUNT_PROVIDERS already has this provider's APP config
            settings_has_app = (
                provider_name in providers_config
                and 'APP' in providers_config[provider_name]
                and providers_config[provider_name]['APP'].get('client_id')
            )

            if settings_has_app:
                self.stdout.write(self.style.WARNING(
                    f'{label}: credentials configured in SOCIALACCOUNT_PROVIDERS settings. '
                    f'Skipping DB SocialApp (avoids duplicate).'
                ))
                # Clean up any stale DB entries
                deleted, _ = SocialApp.objects.filter(provider=provider_name).delete()
                if deleted:
                    self.stdout.write(f'  Cleaned up {deleted} stale DB entry(ies)')
                continue

            if client_id and secret:
                app, created = SocialApp.objects.get_or_create(
                    provider=provider_name,
                    defaults={'name': label, 'client_id': client_id, 'secret': secret}
                )
                if not created:
                    app.client_id = client_id
                    app.secret = secret
                    app.save()
                app.sites.add(site)
                status = 'created' if created else 'updated'
                self.stdout.write(self.style.SUCCESS(f'{label} SocialApp (DB): {status}'))
            else:
                self.stdout.write(self.style.WARNING(
                    f'{label}: credentials not in env ({env_key}). Skipping.'
                ))

        self.stdout.write(self.style.SUCCESS('Social auth setup complete.'))
