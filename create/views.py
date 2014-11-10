from django.shortcuts import render
from django.http import HttpResponse
import json
from django.views.decorators.csrf import csrf_exempt
from nurvey.models import *


# Create your views here.
@csrf_exempt
def submit(request):
    if request.method == 'POST':
        survey = json.loads(request.body)

        # TODO: Replace owner_id=1 with actual owner id
        survey_entry = Survey(title=survey['title'], description=survey['description'], owner_id=1)
        survey_entry.save()
        questions = survey['questions']

        for question in questions:
            poll = Poll(survey=survey_entry, title=question['title'], description=question['description']).save()

        questions = survey['questions']
        question_descriptions = [question['description'] for question in questions]
        return HttpResponse(json.dumps(question_descriptions));
    else:
        return HttpResponse("Not a post");
