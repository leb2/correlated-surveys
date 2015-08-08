from django.contrib.auth.models import User
import requests
import requests.auth
from nurvey.models import Profile

# TODO: Make separate namespace for reddit usernames with a prefix or something
class RedditBackend:

    # Uses Reddit API to retrieve username from access token
    def get_reddit_username(self, access_token):
        headers = {"Authorization": "bearer " + access_token, "User-Agent": "Surveying app by /u/TreeTwo"}
        response = requests.get("https://oauth.reddit.com/api/v1/me", headers=headers)
        return response.json()['name']

    def authenticate(self, access_token=None):
        username = self.get_reddit_username(access_token)
        try:
            user = User.objects.get(username=username)

        # Creates a new user if reddit user is signing in for the first time
        except User.DoesNotExist:

            # Password may be checked from default backend, make sure to move to settings
            user = User(username=username, password="TODO: Hide in settings")
            user.save()
            profile = Profile(user=user)
            profile.save()
        return user

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
