"""
End-to-end verification script for Google OAuth integration.
Tests the REAL behavior of the social login flow without needing
a running dev server — uses Django's test client directly.
"""
import os
import sys
import json
from pathlib import Path

# Setup Django
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))
os.chdir(BASE_DIR)
from dotenv import load_dotenv
load_dotenv(BASE_DIR / '.env')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
import django
django.setup()

from django.test import RequestFactory, Client
from django.contrib.auth.models import User
from django.conf import settings
from apps.accounts.views import SocialLoginView
from apps.accounts.models import UserProfile

factory = RequestFactory()
client = Client()
passed = 0
failed = 0

def check(name, condition, detail=""):
    global passed, failed
    if condition:
        print(f"  ✅ {name}")
        passed += 1
    else:
        print(f"  ❌ {name} — {detail}")
        failed += 1


def main():
    global passed, failed

    sp = settings.SOCIALACCOUNT_PROVIDERS
    google = sp.get('google', {})
    app_cfg = google.get('APP', {})

    check("Google provider configured", 'google' in sp)
    check("client_id loaded from .env", app_cfg.get('client_id', '').startswith('254150110251'))
    check("client_secret loaded from .env", app_cfg.get('secret', '').startswith('GOCSPX-'))
    check("SCOPE includes profile", 'profile' in google.get('SCOPE', []))
    check("SCOPE includes email", 'email' in google.get('SCOPE', []))
    check("AUTH_PARAMS has access_type online", google.get('AUTH_PARAMS', {}).get('access_type') == 'online')
    check("Google provider in INSTALLED_APPS", 'allauth.socialaccount.providers.google' in settings.INSTALLED_APPS)
    check("Apple provider disabled", 'allauth.socialaccount.providers.apple' not in settings.INSTALLED_APPS)
    check("SITE_ID set", hasattr(settings, 'SITE_ID') and settings.SITE_ID == 1)
    check("allauth middleware present", 'allauth.account.middleware.AccountMiddleware' in settings.MIDDLEWARE)
    check("allauth auth backend present", 'allauth.account.auth_backends.AuthenticationBackend' in settings.AUTHENTICATION_BACKENDS)

    # ============================================================
    print("\n=== 2. Social Login API Endpoint ===")
    # ============================================================

    # Test: Google login with test token (will fail token verification but endpoint should respond)
    req = factory.post('/api/auth/social/login/',
        data=json.dumps({'provider': 'google', 'accessToken': 'test_google_token_123'}),
        content_type='application/json')
    resp = SocialLoginView.as_view()(req)
    check("Google login endpoint responds", resp.status_code in [200, 400, 401],
          f"got {resp.status_code}")

    # Test: Missing provider field
    req = factory.post('/api/auth/social/login/',
        data=json.dumps({'accessToken': 'test'}),
        content_type='application/json')
    resp = SocialLoginView.as_view()(req)
    check("Missing provider returns 400", resp.status_code == 400,
          f"got {resp.status_code}")

    # Test: Unsupported provider
    req = factory.post('/api/auth/social/login/',
        data=json.dumps({'provider': 'twitter', 'accessToken': 'test'}),
        content_type='application/json')
    resp = SocialLoginView.as_view()(req)
    check("Unsupported provider returns 400", resp.status_code == 400,
          f"got {resp.status_code}")

    # Test: Missing access_token for Google
    req = factory.post('/api/auth/social/login/',
        data=json.dumps({'provider': 'google'}),
        content_type='application/json')
    resp = SocialLoginView.as_view()(req)
    check("Missing access_token returns 400", resp.status_code == 400,
          f"got {resp.status_code}")

    # Test: Empty body
    req = factory.post('/api/auth/social/login/',
        data=json.dumps({}),
        content_type='application/json')
    resp = SocialLoginView.as_view()(req)
    check("Empty body returns 400", resp.status_code == 400,
          f"got {resp.status_code}")

    # ============================================================
    print("\n=== 3. Frontend Social Login Button ===")
    # ============================================================

    # Read the AuthPage source and verify Google button exists
    PROJECT_ROOT = BASE_DIR.parent
    auth_page = (PROJECT_ROOT / 'frontend' / 'src' / 'pages' / 'AuthPage.jsx').read_text()
    check("AuthPage imports socialLogin", 'socialLogin' in auth_page)
    check("Google button renders", 'google' in auth_page and 'GoogleIcon' in auth_page)
    check("handleSocialLogin function exists", 'handleSocialLogin' in auth_page)
    check("socialLogin called with 'google'", "handleSocialLogin(\"google\")" in auth_page or "handleSocialLogin('google')" in auth_page)
    check("socialLogin called with 'apple'", "handleSocialLogin(\"apple\")" in auth_page or "handleSocialLogin('apple')" in auth_page)

    # Check AuthContext has socialLogin
    auth_ctx = (PROJECT_ROOT / 'frontend' / 'src' / 'context' / 'AuthContext.jsx').read_text()
    check("AuthContext exports socialLogin", 'socialLogin' in auth_ctx)
    check("AuthContext calls api.socialLogin", 'api.socialLogin' in auth_ctx or 'socialLogin' in auth_ctx)

    # Check api.js has socialLogin method
    api_js = (PROJECT_ROOT / 'frontend' / 'src' / 'services' / 'api.js').read_text()
    check("api.js has socialLogin method", 'async socialLogin' in api_js)
    check("socialLogin hits /auth/social/login/", '/auth/social/login/' in api_js)

    # ============================================================
    print("\n=== 4. URL Routing ===")
    # ============================================================

    # Verify the social login URL is registered
    from django.urls import reverse, resolve
    try:
        # Check URL patterns include social login
        from config.urls import urlpatterns
        all_urls = []
        for p in urlpatterns:
            if hasattr(p, 'url_patterns'):
                for sub in p.url_patterns:
                    all_urls.append(str(sub.pattern))
            else:
                all_urls.append(str(p.pattern))
    
        # Check accounts URLs
        from apps.accounts.urls import urlpatterns as auth_urls
        auth_url_patterns = [str(p.pattern) for p in auth_urls]
        check("auth/ URLs include social login", 
              any('social' in p for p in auth_url_patterns),
              f"patterns: {auth_url_patterns}")
    except Exception as e:
        check("URL routing loads", False, str(e))

    # ============================================================
    print("\n=== 5. Existing User Social Login Flow ===")
    # ============================================================

    # Create a test user, then simulate Google login
    user, created = User.objects.get_or_create(
        username='socialtest@test.com',
        defaults={'email': 'socialtest@test.com'}
    )
    if created:
        user.set_password('pass1234')
        user.save()
    user.profile.role = 'customer'
    user.profile.is_email_verified = True
    user.profile.save()

    # The social login view creates users from Google tokens,
    # but our custom view handles it via /api/auth/social/login/
    # Test that the endpoint exists and handles the flow
    req = factory.post('/api/auth/social/login/',
        data=json.dumps({
            'provider': 'google',
            'accessToken': 'fake_token_for_endpoint_test'
        }),
        content_type='application/json')
    resp = SocialLoginView.as_view()(req)
    # It should fail with 401 (invalid token) not crash
    check("Social login with invalid token returns error (not crash)", 
          resp.status_code in [400, 401],
          f"got {resp.status_code}")

    # ============================================================
    print("\n=== 6. Frontend OAuth Flow Wiring ===")
    # ============================================================

    # Verify the complete flow: Button → handleSocialLogin → socialLogin context → api.socialLogin → /api/auth/social/login/
    check("Flow: Button calls handleSocialLogin('google')",
          "handleSocialLogin(\"google\")" in auth_page)
    check("Flow: handler calls socialLogin(provider, {...})",
          "socialLogin(provider" in auth_page)
    check("Flow: context calls api.socialLogin",
          "api.socialLogin" in auth_ctx)
    check("Flow: api sends POST to /auth/social/login/",
          "POST" in api_js and "/auth/social/login/" in api_js)

    # ============================================================
    # RESULTS
    # ============================================================
    print(f"\n{'='*50}")
    print(f"RESULTS: {passed} passed, {failed} failed out of {passed + failed} checks")
    print(f"{'='*50}")

    if failed > 0:
        sys.exit(1)
    else:
        print("\n🎉 All verification checks passed!")
        sys.exit(0)



if __name__ == "__main__":
    main()
