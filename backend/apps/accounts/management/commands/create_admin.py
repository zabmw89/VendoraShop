"""
Management command to create an admin user.

Usage:
  python manage.py create_admin
  python manage.py create_admin --email admin@vendorashop.com --password MyPass123!
  python manage.py create_admin --email admin@vendorashop.com  # generates random password
"""
import secrets
import string

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from apps.accounts.models import UserProfile


def generate_random_password(length=16):
    """Generate a cryptographically secure random password."""
    alphabet = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(alphabet) for _ in range(length))


class Command(BaseCommand):
    help = 'Create an admin user for VendoraShop.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            default='admin@vendorashop.com',
            help='Email for the admin account (default: admin@vendorashop.com)',
        )
        parser.add_argument(
            '--password',
            type=str,
            default='',
            help='Password for the admin account. If omitted, a random password is generated.',
        )
        parser.add_argument(
            '--first-name',
            type=str,
            default='Vendora',
            help='First name (default: Vendora)',
        )
        parser.add_argument(
            '--last-name',
            type=str,
            default='Admin',
            help='Last name (default: Admin)',
        )

    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        first_name = options['first_name']
        last_name = options['last_name']

        if not password:
            password = generate_random_password()
            self.stdout.write(self.style.WARNING(
                f'🔑 Generated random password: {password}\n'
                '   Save this now — it won\'t be shown again.'
            ))

        if User.objects.filter(email=email).exists():
            raise CommandError(f'User with email "{email}" already exists.')

        user = User.objects.create_superuser(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )

        profile = user.profile
        profile.role = 'admin'
        profile.is_email_verified = True
        profile.save()

        self.stdout.write(self.style.SUCCESS(
            f'\n✅ Admin user created successfully!\n'
            f'   Email:    {email}\n'
            f'   Password: {password}\n'
            f'   Role:     admin\n'
            f'   Verified: yes'
        ))
