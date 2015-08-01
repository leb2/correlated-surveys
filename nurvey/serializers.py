from rest_framework import serializers
from nurvey.models import *



class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ('id', 'points')


class UserSerializer(serializers.ModelSerializer):
    profile = ProfileSerializer()

    class Meta:
        model = User
        fields = ('id', 'profile', 'username')


class SliderPollSerializer(serializers.ModelSerializer):
    class Meta:
        model = SliderPoll
        fields = ('id', 'min', 'max', 'step')


class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ('id', 'text')


class ChoicePollSerializer(serializers.ModelSerializer):
    choice_set = ChoiceSerializer(many=True)

    class Meta:
        model = ChoicePoll
        fields = ('id', 'choice_set', 'allow_multiple_selection')


class SpecificPollField(serializers.RelatedField):

    def to_representation(self, value):
        if isinstance(value, SliderPoll):
            serializer = SliderPollSerializer(value)
        elif isinstance(value, ChoicePoll):
            serializer = ChoicePollSerializer(value)
        else:
            raise Exception('Unexpected type of poll')
        return serializer.data


# Separate survey serializer for the poll serializer to prevent recursion
class SurveySerializer(serializers.ModelSerializer):
    hotness = serializers.ReadOnlyField()
    owner = UserSerializer()

    class Meta:
        model = Survey
        fields = ('id', 'title', 'description', 'pub_date', 'num_downvotes', 'num_upvotes', 'hotness', 'owner')

class PollSerializer(serializers.ModelSerializer):
    poll_object = SpecificPollField(read_only=True)
    poll_type = serializers.StringRelatedField(read_only=True)
    results = serializers.ReadOnlyField()
    results_pretty = serializers.ReadOnlyField()

    # TODO: survey's serializer will have a nested copy of the survey in each polls
        # Make another version of poll without the  survey maybe?
    survey = SurveySerializer()

    class Meta:
        model = Poll
        fields = ('id', 'title', 'description', 'poll_type', 'poll_object', 'results', 'results_pretty', 'survey')

class SurveySerializer(serializers.ModelSerializer):
    poll_set = PollSerializer(many=True)
    hotness = serializers.ReadOnlyField()
    owner = UserSerializer()

    class Meta:
        model = Survey
        fields = ('id', 'title', 'description', 'pub_date', 'num_downvotes', 'num_upvotes', 'poll_set', 'hotness', 'owner')
