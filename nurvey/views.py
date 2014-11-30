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
# TODO: Move some logic to model
def points(request):
    if request.method == 'POST':
        vote = json.loads(request.body)
        id = vote['id']

        # Obtains target based on id and targetType
        if vote['targetType'] == 'survey':
            target = Survey.objects.get(pk=id)
        elif vote['targetType'] == 'comment':
            target = Comment.objects.get(pk=id)

        # Applies vote to target
        def apply_votes(is_up, should_undo=False):
            change = -1 if should_undo else 1

            if is_up:
                target.num_upvotes += change
            else:
                target.num_downvotes += change

        # If first vote on target, makes a new point object
        if not target.point_set.filter(user=request.user).exists():
            point = Point(user=request.user, is_up=vote['isUp'], voted_object=target)
            apply_votes(vote['isUp'])
            point.save()

        # Updates current point object on revote
        else:
            previous_vote = point = target.point_set.get(user=request.user)

            # Should undo if previous vote is the same as new vote
            unvoting = previous_vote.is_up is vote['isUp']

            # Undoes old vote
            apply_votes(previous_vote.is_up, should_undo=True)

            # If vote is different, apply the vote
            if not unvoting:
                apply_votes(vote['isUp'])
                point.is_up = vote['isUp']
                point.save()
            elif unvoting:
                point.delete()

            # Updates previous vote with new vote data

        # Save changes to database
        target.save()
        return HttpResponse(str(target.num_upvotes) + " " + str(target.num_downvotes), status=201)

    # Gets point data for survey (unfortunately not RESTy)
    elif request.method == 'GET':
        vote_data = {}
        data = request.GET.dict()

        survey = Survey.objects.get(pk=data['id'])

        try:
            point = survey.point_set.get(user=request.user)
        except Exception: # Does not exist error
            vote_data = {'survey_vote': None}
        else:
            vote_data['survey_vote'] = survey.point_set.get(user=request.user).is_up

        return HttpResponse(json.dumps(vote_data), content_type='application/json')

    return HttpResponse('Request must be POST or GET')


@csrf_exempt
# TODO: Change Name to survey_submit or vote_survey
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


def users(request):

    if request.method == 'GET':
        username = request.GET.dict().get('user')
        user = User.objects.get(username=username) if username is not None else request.user
        if not user.is_authenticated():
            return HttpResponse("")

        serializer = UserSerializer(user)
        data = serializer.data
        response = JSONRenderer().render(data)
        return HttpResponse(JSONRenderer().render(serializer.data), content_type='application/json')


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
        user = User.objects.create_user(credentials['username'], credentials['email'], credentials['password'])
        user.save()
        Profile(user=user).save()
        return login_user(request)

def logout_user(request):
    logout(request)
    return HttpResponse('logout successful')

# Use to tell if a username is unique
def unique_username(request):
    pass


























