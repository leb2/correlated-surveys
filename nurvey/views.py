from django.http import HttpResponse
from django.shortcuts import render
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt
import json


# Main page for single page application
def landing(request):
    return render(request, 'nurvey/index.html')






# ---------------- LOGIN MECHANIC ---------------- #


@csrf_exempt
def login_user(request):
    if request.method == 'POST':
        credentials = json.loads(request.body)
        user = authenticate(username=credentials['username'], password=credentials['password'])
        if user is not None and user.is_active:
            login(request, user)
            return HttpResponse('Login Successful')
        else:
            return HttpResponse('Incorrect Credentials')
    return HttpResponse('Request must be a POST')

@csrf_exempt
def register(request):
    if request.method == 'POST':
        credentials = json.loads(request.body)
        User.objects.create_user(credentials['username'], credentials['email'], credentials['password']).save()
        return login_user(request)

def logout_user(request):
    logout(request)
    return HttpResponse('logout successful')

# Use to tell if a username is unique
def unique_username(request):
    pass


























