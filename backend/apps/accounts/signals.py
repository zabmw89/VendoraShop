"""
Signals for django-allauth social login.
Populates user profile data (name, avatar) from Google/Apple on first login.
"""
from allauth.socialaccount.signals import social_account_added
from django.dispatch import receiver


@receiver(social_account_added)
def populate_profile_from_social(sender, request, sociallogin, **kwargs):
    """
    When a social account is added for the first time, populate the user's
    name and avatar from the provider's data.

    Apple only sends name/email on the very first login, so grab it now.
    Google always sends it, but we only update on first signup (not every login).
    """
    user = sociallogin.user
    extra_data = sociallogin.account.extra_data
    provider = sociallogin.account.provider

    if provider == 'google':
        # Google always sends these fields
        if not user.first_name:
            user.first_name = extra_data.get('given_name', '')
        if not user.last_name:
            user.last_name = extra_data.get('family_name', '')
        user.save(update_fields=['first_name', 'last_name'])

        # Set avatar if not already set
        profile = user.profile
        if not profile.avatar and extra_data.get('picture'):
            profile.avatar = extra_data['picture']
            profile.save(update_fields=['avatar'])

    elif provider == 'apple':
        # Apple only sends name on first login — grab it now or never
        name_data = extra_data.get('name', {})
        if isinstance(name_data, dict):
            if not user.first_name and name_data.get('firstName'):
                user.first_name = name_data['firstName']
            if not user.last_name and name_data.get('lastName'):
                user.last_name = name_data['lastName']
            user.save(update_fields=['first_name', 'last_name'])
