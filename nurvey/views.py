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
from django.db.models import Avg
import datetime
from django.conf import settings

import requests
import requests.auth
import urllib
from uuid import uuid4



# ---------------- MAIN PAGE ---------------- #

def landing(request):
    return render(request, 'nurvey/index.html')


import cgi
def request(request):
    return HttpResponse('<pre>' + cgi.escape(str(request)) + '</pre>')


# ---------------- REST API ---------------- #


def correlate(request):
    if request.method == 'GET':
        ids = json.loads(request.GET['ids'])
        filters = json.loads(request.GET['filters'])
        polls = [Poll.objects.get(pk=id) for id in ids]
        valuesets = []
        dataset_labels = []
        chart_type = 'bar'
        debug = ""

        filtered_users = User.objects.all()
        for filter in filters:
            poll = Poll.objects.get(pk=filter['pollId'])

            if poll.poll_type.model == 'sliderpoll':
                debug = filter['value']
                filtered_users = filtered_users.filter(vote__poll=poll, vote__value__gt=min(filter['value']))
                filtered_users = filtered_users.filter(vote__poll=poll, vote__value__lt=max(filter['value']))
            elif poll.poll_type.model == 'choicepoll':
                filtered_users = filtered_users.filter(vote__poll=poll, vote__value=filter['value'])

        def polls_with_type(type):
            return [poll for poll in polls if poll.poll_type.model == type]

        if len(polls) is 1:
            if polls[0].poll_type.model == 'sliderpoll':
                domain = [float(decimal) for decimal in polls[0].domain()]
            else:
                domain = polls[0].domain_pretty()
            valuesets = [polls[0].values()]
            x_axis_label = polls[0].title
            y_axis_label = 'Number of votes'
            if polls[0].poll_type.model == 'sliderpoll':
                chart_type = 'line'


        elif len(polls_with_type('choicepoll')) == 2 and len(polls_with_type('sliderpoll')) == 0:
            domain_poll, values_poll = polls[0], polls[1]
            x_axis_label = domain_poll.title
            y_axis_label = values_poll.title

            domain = domain_poll.domain_pretty()

            for values_choice in values_poll.domain():
                valueset = []

                # Count the users who voted for a specific choice in p
                for domain_choice in domain_poll.domain():
                    count = filtered_users.filter(vote__poll=domain_poll, vote__value=domain_choice.pk)
                    count =        count.filter(vote__poll=values_poll, vote__value=values_choice.pk).count()
                    valueset.append(count)

                valuesets.append(valueset)
                dataset_labels.append(values_choice.text)

        # Results in a single-line line graph
        # TODO: Handle choicepoll by adding multiple lines
        elif len(polls_with_type('sliderpoll')) == 2 and len(polls_with_type('choicepoll')) <= 1:
            chart_type = 'line'
            sliderpolls = polls_with_type('sliderpoll')
            domain_poll, values_poll = sliderpolls[0], sliderpolls[1]
            domain = [float(decimal) for decimal in domain_poll.domain()]

            x_axis_label = domain_poll.title
            y_axis_label = values_poll.title + " (average)"

            valueset = []
            valuesets.append(valueset)
            for x_val in domain:

                # Get all the votes to the second (values) slider poll
                to_value_votes = Vote.objects.filter(poll=values_poll)

                for filter in filters:
                    poll = Poll.objects.get(pk=filter['pollId'])
                    to_value_votes = to_value_votes.filter(user__vote__poll=poll, user__vote__value=filter['value'])

                # Keep only the votes in which the voter also voted on the first (domain) poll with a specific value on the values poll
                valid_votes = to_value_votes.filter(user__vote__poll=domain_poll, user__vote__value=x_val)
                average = valid_votes.aggregate(Avg('value'))

                valueset.append(average['value__avg'])

        # TODO: Refactor to be DRYer - repeats first case mostly
        # Should results in a line graph with multiple lines
        elif len(polls_with_type('sliderpoll'))== 1 and len(polls_with_type('choicepoll')) == 1:
            chart_type = 'line'
            domain_poll = polls_with_type('sliderpoll')[0]
            values_poll = polls_with_type('choicepoll')[0]
            domain = [float(decimal) for decimal in domain_poll.domain()]

            x_axis_label = domain_poll.title
            y_axis_label = "Number of Votes" #values_poll.title

            for values_choice in values_poll.domain():
                valueset = []

                for x_val in domain:
                    count = filtered_users.filter(vote__poll=domain_poll, vote__value=x_val)
                    count =        count.filter(vote__poll=values_poll, vote__value=values_choice.pk).count()
                    valueset.append(count)

                valuesets.append(valueset)
                dataset_labels.append(values_choice.text)


        data = {
            'type': chart_type,
            'labels': domain,
            'datasets': [{'values': valueset} for valueset in valuesets],
            'dataset_labels': dataset_labels,
            'x_axis': x_axis_label,
            'y_axis': y_axis_label,
            'debug': debug
        }

        return HttpResponse(json.dumps(data), content_type='application/json')

    return HttpResponse('Wrong method?')


# GET:
#   term: returns list of polls that contain the term in title
#   id: returns the poll by given id
def polls(request):

    if request.method == 'GET':
        term = request.GET.dict().get('term')
        if term is not None:
            related_polls = Poll.objects.filter(title__icontains=term)
            serializer = PollSerializer(related_polls, many=True)
            return HttpResponse(JSONRenderer().render(serializer.data), content_type='application/json')



        id = request.GET.dict().get('id')
        polls = Poll.objects.filter(pk=id) if id is not None else Poll.objects.order_by('-pk')[0:1]

        serialized = serializers.serialize('json', polls)
        return HttpResponse(serialized, content_type='application/json')



@csrf_exempt
# TODO: Move some logic to model - view is too fat!
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
                request.user.profile.points += change
            else:
                target.num_downvotes += change
                request.user.profile.points -= change
            request.user.profile.save()

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
# Submits a response to a survey
def survey_results(request, id):
    if request.method == 'POST':
        data = json.loads(request.body)
        for poll_id, answer in data.iteritems():
            poll = Poll.objects.get(pk=poll_id)

            # Uncomment rest of line to disable multiple voting
            if Vote.objects.filter(poll=poll, user=request.user).count():
               return HttpResponse('Already Voted')

            # Answer will be an array because multiple choice can have multiple values
            # TODO: Ignore duplicate id's to prevent rigging poll and only loop when allow_multiple_selection is True
            for answer_value in answer:
                vote = Vote(user=request.user, poll=poll, value=answer_value).save()
        return HttpResponse(status=201)
    return HttpResponse('Request Not POST', status=400)



# POST:
#       Saves a created survey to database - must be logged in
# GET:
#       default:    Returns serialied top surveys
#       id:         Returns serialized survey with id

@csrf_exempt
def surveys(request):

    # Bug: if one poll is incorrect, the other may still be saved to the database
    # Load Survey into database
    if request.method == 'POST':
        survey = json.loads(request.body)
        questions = survey['questions']

        if len(questions) == 1:
            title = questions[0]['title']
            description = questions[0].get('description', '')
        else:
            title = survey['title']
            description = survey.get('description', '')

        if len(title) > Survey._meta.get_field('title').max_length:
            return HttpResponse('Survey title too long', status=400)

        survey_entry = Survey(title=title, description=description, owner_id=request.user.id)
        survey_entry.save()

        for question in questions:
            params = question['parameters']

            if len(title) > Poll._meta.get_field('title').max_length:
                return HttpResponse('Poll title too long', status=400)
            poll = Poll(survey=survey_entry, title=question['title'], description=question.get('description', ''))

            if question['type'] == 'slider':

                # To prevent step = 0
                step = params['step'] if params['step'] != 0 else 1
                slider_poll = SliderPoll(min=params['min'], max=params['max'], step=step)
                slider_poll.save()
                poll.poll_object = slider_poll

            elif question['type'] == 'choice':
                choice_poll = ChoicePoll(allow_multiple_selection=params['isCheckbox'])
                choice_poll.save()
                poll.poll_object = choice_poll

                if len(params['choices']) < 2:
                    return HttpResponse('Not enough choices', status=400)
                for choice in params['choices']:
                    Choice(text=choice['text'], poll=choice_poll).save()

            poll.save();
        return HttpResponse(json.dumps(survey_entry.pk), content_type='application/json')

    # Retreive question by id if present or by most recent
    elif request.method == 'GET':
        id = request.GET.dict().get('id')

        if id is not None:
            surveys = Survey.objects.filter(pk=id)
        else:
            amount = request.GET.dict().get('amount', 10)
            before_survey_id = request.GET.dict().get('beforeSurveyId')
            if before_survey_id is not None:
                before_date = Survey.objects.get(pk=before_survey_id).pub_date
            else:
                before_date = datetime.datetime.now()

            # USE BELOW LINE TO EXCLUDE SURVEYS ALREADY VOTED ON
            # surveys = Survey.objects.exclude(poll__vote__user=request.user).order_by('-pub_date')[:amount]
            surveys = Survey.objects.all().order_by('-pub_date').filter(pub_date__lt=before_date)[:amount]

        serializer = SurveySerializer(surveys, many=True)
        data = serializer.data

        # Add data about whether the user has voted on each survey
        for i in range(len(data)):
            survey = Survey.objects.get(pk=data[i]['id'])
            poll_from_survey = survey.poll_set.all()[0]
            has_voted = Vote.objects.filter(poll=poll_from_survey, user=request.user).count()
            data[i]['has_voted'] = has_voted

        return HttpResponse(JSONRenderer().render(data), content_type='application/json')


def user_recent_surveys(request):
    if request.method == 'GET':
        user_id = request.GET.dict().get('user_id')
        amount = request.GET.dict().get('amount', 4)

        surveys = Survey.objects.all().order_by('-pub_date').filter(owner__pk=user_id)[:amount]
        serializer = SurveySerializer(surveys, many=True)

        return HttpResponse(JSONRenderer().render(serializer.data), content_type='application/json')



def users(request):

    if request.method == 'GET':
        username = request.GET.dict().get('user')
        user = User.objects.get(username=username) if username is not None else request.user
        if not user.is_authenticated():
            return HttpResponse("User not authenticated", status=400)

        serializer = UserSerializer(user)
        data = serializer.data
        response = JSONRenderer().render(data)
        return HttpResponse(JSONRenderer().render(serializer.data), content_type='application/json')






# ---------------- FOR TESTING PURPOSES ONLY ---------------- #


def login_next_user(request):
    username = request.GET['username']
    username_number = username[1:]
    new_username = "u" + str(int(username_number) + 1)
    user = authenticate(username=new_username, password='a')
    if user is not None and user.is_active:
        login(request, user)
        return HttpResponse("Login Successful")
    return HttpResponse("user " + new_username + " is not valid")


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
            return HttpResponse('Incorrect Credentials', status=400)
    return HttpResponse('Request must be a POST', status=400)

@csrf_exempt
def register(request):
    if request.method == 'POST':
        credentials = json.loads(request.body)
        user = User.objects.create_user(credentials['username'], credentials['email'], credentials['password'])
        user.save()
        profile = Profile(user=user)
        profile.save()
        return login_user(request)



def reddit_auth_url(request):
    # Generate a random string for the state parameter
    # Save it for use later to prevent xsrf attacks
    state = str(uuid4())
    params = {"client_id": settings.CLIENT_ID,
              "response_type": "code",
              "state": state,
              "redirect_uri": settings.REDIRECT_URI,
              "duration": "permanent",
              "scope": "identity"}
    url = "https://www.reddit.com/api/v1/authorize?" + urllib.urlencode(params)
    return HttpResponse(url)


def reddit_callback(request):
    code = request.GET.dict().get('code')
    access_token = get_access_token(request, code)
    user = authenticate(access_token=access_token)

    login(request, user)

    return landing(request)


def get_access_token(request, code=None):
    client_auth = requests.auth.HTTPBasicAuth(settings.CLIENT_ID, settings.CLIENT_SECRET)
    url = 'https://www.reddit.com/api/v1/access_token'

    # If getting access token for first time
    if request.session.get('access_token') is None:
        post_data = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': settings.REDIRECT_URI
        }
    # if refreshing token
    else:
        post_data = {
            'grant_type': 'refresh_token',
            'refresh_token': request.session['refresh_token']
        }

    headers = {'User-Agent': 'Surveying app by /u/TreeTwo'}
    response = requests.post(url, headers=headers, data=post_data, auth=client_auth)
    response_test = response.json()
    request.session['access_token'] = response.json()['access_token']
    refresh_token = response.json().get('refresh_token')
    if refresh_token is not None:
        request.session['refresh_token'] = refresh_token
    return response.json()['access_token']



def logout_user(request):
    logout(request)
    return HttpResponse('logout successful')

# Use to tell if a username is unique
def unique_username(request):
    username = request.GET['username']
    return HttpResponse(json.dumps(User.objects.filter(username=username).exists()), content_type='application/json')
