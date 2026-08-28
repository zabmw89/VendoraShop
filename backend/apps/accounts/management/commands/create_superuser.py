"""
Management command to create a Django admin superuser with full admin panel access.

Assigns is_staff, is_superuser, and ALL model permissions so the admin panel
works immediately without manual permission configuration.

Usage:
  python manage.py create_superuser
  python manage.py create_superuser --email admin@vendorashop.com --password MyPass123!
  python manage.py create_superuser --email admin@vendorashop.com  # generates random password
  python manage.py create_superuser --upgrade existing@email.com   # upgrade existing user
"""
import secrets
import string

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User, Permission
from django.contrib.contenttypes.models import ContentType


def generate_random_password(length=16):
    """Generate a cryptographically secure random password."""
    alphabet = string.ascii_letters + string.digits + string.punctuation
    return ''.join(secrets.choice(alphabet) for _ in range(length))


class Command(BaseCommand):
    help = 'Create a Django admin superuser with full admin panel permissions.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            default='admin@vendorashop.com',
            help='Email for the superuser (default: admin@vendorashop.com)',
        )
        parser.add_argument(
            '--password',
            type=str,
            default='',
            help='Password for the superuser. If omitted, a random password is generated.',
        )
        parser.add_argument(
            '--first-name',
            type=str,
            default='Super',
            help='First name (default: Super)',
        )
        parser.add_argument(
            '--last-name',
            type=str,
            default='Admin',
            help='Last name (default: Admin)',
        )
        parser.add_argument(
            '--upgrade',
            type=str,
            default='',
            help='Email of an existing user to upgrade to superuser status.',
        )

    def handle(self, *args, **options):
        password = options['password']
        first_name = options['first_name']
        last_name = options['last_name']
        upgrade_email = options['upgrade']

        # Upgrade existing user
        if upgrade_email:
            try:
                user = User.objects.get(email__iexact=upgrade_email)
            except User.DoesNotExist:
                raise CommandError(f'No user found with email "{upgrade_email}".')

            self._upgrade_to_superuser(user)
            return

        # Create new superuser
        email = options['email']

        if not password:
            password = generate_random_password()
            self.stdout.write(self.style.WARNING(
                f'🔑 Generated random password: {password}\n'
                '   Save this now — it won\'t be shown again.'
            ))

        if User.objects.filter(email=email).exists():
            raise CommandError(
                f'User with email "{email}" already exists.\n'
                f'Use --upgrade {email} to grant superuser access to this account.'
            )

        user = User.objects.create_superuser(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )

        # Ensure profile is set up
        profile = user.profile
        profile.role = 'admin'
        profile.is_email_verified = True
        profile.save()

        # Assign all model permissions
        self._assign_all_permissions(user)

        self.stdout.write(self.style.SUCCESS(
            f'\n✅ Superuser created successfully!\n'
            f'   Email:     {email}\n'
            f'   Password:  {password}\n'
            f'   Staff:     yes\n'
            f'   Superuser: yes\n'
            f'   Role:      admin\n'
            f'   Verified:  yes\n'
            f'   Permissions: all (view, add, change, delete for every model)\n'
            f'\n   Admin panel: /admin/'
        ))

    def _upgrade_to_superuser(self, user):
        """Upgrade an existing user to superuser with full permissions."""
        user.is_staff = True
        user.is_superuser = True
        user.save()

        profile = user.profile
        profile.role = 'admin'
        profile.is_email_verified = True
        profile.save()

        self._assign_all_permissions(user)

        self.stdout.write(self.style.SUCCESS(
            f'\n✅ User upgraded to superuser!\n'
            f'   Email:     {user.email}\n'
            f'   Staff:     yes\n'
            f'   Superuser: yes\n'
            f'   Role:      admin\n'
            f'   Permissions: all (view, add, change, delete for every model)\n'
            f'\n   Admin panel: /admin/'
        ))

    def _assign_all_permissions(self, user):
        """
        Assign ALL model permissions (view, add, change, delete) for every
        registered model so the Django admin panel works immediately.
        """
        all_permissions = Permission.objects.all()
        count = 0
        for perm in all_permissions:
            if not user.user_permissions.filter(pk=perm.pk).exists():
                user.user_permissions.add(perm)
                count += 1

        self.stdout.write(f'   Assigned {count} permissions to {user.email}.')
