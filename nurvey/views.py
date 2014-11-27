from django.http import HttpResponse
from django.shortcuts import render
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout
from django.views.decorators.csrf import csrf_exempt
from django.core import serializers as sera
from rest_framework.renderers import JSONRenderer
from serializers import *
from models import *
import json



# ---------------- MAIN PAGE ---------------- #

def landing(request):
    return render(request, 'nurvey/index.html')





# ---------------- REST API ---------------- #


@csrf_exempt
def points(request):
    if request.method == 'POST':
        data = json.loads(request.body)

        point = Point(user=request.user, is_up=data['isUp'])

        id = data['id']
        if data['targetType'] == 'survey':
            target = Survey.objects.get(pk=id)

        elif data['targetType'] == 'comment':
            target = Comment.objects.get(pk=id)

        # Ignore repeat votes
        if target.points.filter(user=request.user).exists():
            return HttpResponse('Already Voted - Frontend bypass attempt logged', status=400)

        if data['isUp']:
            target.num_upvotes += 1
        elif not data['isUp']:
            target.num_downvotes += 1
        target.save()

        point.voted_object = target;
        point.save()
        return HttpResponse(status=201)


@csrf_exempt
# Change Name to survey_submit or vote_survey
def survey_results(request, id):
    if request.method == 'POST':
        data = json.loads(request.body)
        for poll_id, answer in data.iteritems():
            poll = Poll.objects.get(pk=poll_id)
            if len(Vote.objects.filter(poll=poll, user=request.user)):
               return HttpResponse('Already Voted')
            vote = Vote(user=request.user, poll=poll, value=answer).save()
        return HttpResponse(status=201)
    return HttpResponse('Request Not POST', status=400)


@csrf_exempt
def surveys(request):

    # Load Survey into database
    if request.method == 'POST':
        survey = json.loads(request.body)

        survey_entry = Survey(title=survey['title'], description=survey['description'], owner_id=request.user.id)
        survey_entry.save()
        questions = survey['questions']

        for question in questions:
            params = question['parameters']

            poll = Poll(survey=survey_entry, title=question['title'], description=question.get('description'))

            if question['type'] == 'slider':
                slider_poll = SliderPoll(min=params['min'], max=params['max'])
                slider_poll.save()
                poll.poll_object = slider_poll

            elif question['type'] == 'choice':
                choice_poll = ChoicePoll()
                choice_poll.save()
                poll.poll_object = choice_poll

                for choice in params['choices']:
                    Choice(text=choice['text'], poll=choice_poll).save()

            poll.save();
        return HttpResponse(json.dumps(survey_entry.pk), content_type='application/json')



    # Retreive question by id if present or by most recent
    elif request.method == 'GET':
        id = request.GET.dict().get('id')

        if id is not None:
            surveys = Survey.objects.get(pk=id)
            many = False
        else:
            amount = request.GET.dict().get('amount', 10)
            many = True
            surveys = Survey.objects.exclude(poll__vote__user=request.user).order_by('-pub_date')[:amount]

        serializer = SurveySerializer(surveys, many=many)
        return HttpResponse(JSONRenderer().render(serializer.data), content_type='application/json')


def polls(request):

    if request.method == 'GET':
        id = request.GET.dict().get('id')
        polls = Poll.objects.filter(pk=id) if id is not None else Poll.objects.order_by('-pk')[0:1]

        serialized = serializers.serialize('json', polls)
        return HttpResponse(serialized, content_type='application/json')



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
    return HttpResponse('Request must be a POST', status=400)

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


























