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
        fields = ('id', 'min', 'max')


class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ('id', 'text')


class ChoicePollSerializer(serializers.ModelSerializer):
    choice_set = ChoiceSerializer(many=True)

    class Meta:
        model = ChoicePoll
        fields = ('id', 'choice_set')


class SpecificPollField(serializers.RelatedField):

    def to_native(self, value):
        if isinstance(value, SliderPoll):
            serializer = SliderPollSerializer(value)
        elif isinstance(value, ChoicePoll):
            serializer = ChoicePollSerializer(value)
        else:
            raise Exception('Unexpected type of poll')
        return serializer.data



class PollSerializer(serializers.ModelSerializer):
    poll_object = SpecificPollField()
    poll_type = serializers.RelatedField()
    results = serializers.Field(source='results')
    results_pretty = serializers.Field(source='results_pretty')

    class Meta:
        model = Poll
        fields = ('id', 'title', 'description', 'poll_type', 'poll_object', 'results', 'results_pretty')


class SurveySerializer(serializers.ModelSerializer):
    poll_set = PollSerializer(many=True)
    hotness = serializers.Field(source='hotness')

    class Meta:
        model = Survey
        fields = ('id', 'title', 'description', 'pub_date', 'num_downvotes', 'num_upvotes', 'poll_set', 'hotness')











