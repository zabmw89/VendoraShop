"""
Custom allauth adapter for controlling signup behavior.

To enable social-only signup (no email/password registration), set in settings.py:
    ACCOUNT_ADAPTER = 'apps.accounts.adapters.SocialOnlySignupAdapter'
"""
from allauth.account.adapter import DefaultAccountAdapter


class SocialOnlySignupAdapter(DefaultAccountAdapter):
    """
    Blocks local email/password signup. Users must authenticate via Google/Apple.

    Enable by adding to settings.py:
        ACCOUNT_ADAPTER = 'apps.accounts.adapters.SocialOnlySignupAdapter'
    """

    def is_open_for_signup(self, request):
        """Block local signup — only social login allowed."""
        return False
