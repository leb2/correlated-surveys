from django.http import HttpResponse
from django.shortcuts import render
import json


def landing(request):
    return render(request, 'nurvey/landing.html')
