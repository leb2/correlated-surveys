from django.db import models
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes import generic
from datetime import datetime
from django.template import defaultfilters
from collections import OrderedDict



class Profile(models.Model):
    user = models.OneToOneField(User)
    points = models.IntegerField(default=0)


# Upvote / Downvote mechanic

class Point(models.Model):
    user = models.ForeignKey(User)
    date = models.DateTimeField(auto_now_add=True)
    is_up = models.BooleanField(default=None)

    # Survey or Poll that is being voted on
    voted_type = models.ForeignKey(ContentType)
    voted_id = models.PositiveIntegerField()
    voted_object = generic.GenericForeignKey('voted_type', 'voted_id')


class Survey(models.Model):
    title = models.CharField(max_length=200)
    description = models.CharField(max_length=10000, default="")
    pub_date = models.DateTimeField(auto_now_add=True)
    owner = models.ForeignKey(User)
    num_upvotes = models.IntegerField(default=0)
    num_downvotes = models.IntegerField(default=0)
    num_responses = models.IntegerField(default=0)
    point_set = generic.GenericRelation(Point, content_type_field='voted_type', object_id_field='voted_id')

    @property
    def time_ago(self):
        return defaultfilters.timesince(self.pub_date)

    @property
    def points(self):
        return self.num_upvotes - self.num_downvotes

    @property
    def hotness(self):
        gravity = 1.8
        # Convert timezone aware time to timezone naive for compatibility
        hours = (datetime.now() - self.pub_date.replace(tzinfo=None)).total_seconds() / 60
        return (self.points - 1) / (hours + 2) ** 1.8

    def __unicode__(self):
        return self.title

    class Meta:
        ordering = ['-pub_date']


class Poll(models.Model):
    survey = models.ForeignKey(Survey)

    # Generic Foreign Key to specific poll
    poll_type = models.ForeignKey(ContentType)
    poll_id = models.PositiveIntegerField()
    poll_object = generic.GenericForeignKey('poll_type', 'poll_id')

    title = models.CharField(max_length=200)
    unit_tag = models.CharField(max_length=50)
    description= models.CharField(max_length=1500, default="")

    points = generic.GenericRelation(Point, content_type_field='voted_type', object_id_field='voted_id')

    def domain_pretty(self):
        return self.poll_object.domain_pretty()

    def domain(self):
        return self.poll_object.domain()

    def values(self):
        return self.poll_object.values(self)

    @property
    def results(self):
        return self.poll_object.results(self)

    @property
    def results_pretty(self):
        return self.poll_object.results_pretty(self)

    def natural_key(self):
        return self.title

    def __unicode__(self):
        return self.title


class SliderPoll(models.Model):
    poll = generic.GenericRelation(Poll)
    min = models.IntegerField()
    max = models.IntegerField()
    step = models.DecimalField(max_digits=5, decimal_places=2, default=1)

    @staticmethod
    def drange(start, stop, step):
        r = start
        while r <= stop:
            yield r

            # note: using decimal step turns r into decimal
            r += step

    # If there are too many labels to display, step will be increaesd
    def step_adjusted(self):
        max_labels = 20
        num_labels = int((self.max - self.min) / self.step)

        if num_labels > max_labels:
            return self.step * int(num_labels / max_labels)
        return self.step

    def domain(self):
        return list(self.drange(self.min, self.max, self.step_adjusted()))
        return range(self.min, self.max + 1, self.step_adjusted())

    def domain_pretty(self):
        return self.domain()

    def values(self, poll):
        values = []
        for i in self.domain():
            values.append(Vote.objects.filter(poll=poll, value=i).count())
        return values

    def results(self, poll):
        results = OrderedDict()
        for i in self.domain():
            votes = Vote.objects.filter(poll=poll)
            # Float because decimal not get serialized
            results[float(i)] = votes.filter(value__gte=i).filter(value__lt=i+self.step_adjusted()).count()

        return results

    def results_pretty(self, poll):
        results = self.results(poll)
        return {
            'domain': results.keys(),
            'range': results.values()
        }


class ChoicePoll(models.Model):
    poll = generic.GenericRelation(Poll)
    allow_multiple_selection = models.BooleanField(default=False)

    def domain_pretty(self):
        return [choice.text for choice in self.domain()]

    def domain(self):
        return self.choice_set.all().order_by('pk')

    def values(self, poll):
        values = []
        for choice in self.domain():
            values.append(Vote.objects.filter(poll=poll, value=choice.pk).count())
        return values

    def results(self, poll):
        results = {}
        for choice in self.choice_set.all():
            results[choice.pk] = Vote.objects.filter(poll=poll, value=choice.pk).count()
        return results

    def results_pretty(self, poll):
        results = {'domain': [], 'range': []}
        for choice in self.choice_set.all():
            results['domain'].append(choice.text)
            results['range'].append(Vote.objects.filter(poll=poll, value=choice.pk).count())
        return results


class Choice(models.Model):
    poll = models.ForeignKey(ChoicePoll)
    text = models.CharField(max_length=200)

    def __unicode__(self):
        return self.text


class Vote(models.Model):
    user = models.ForeignKey(User)
    date = models.DateTimeField(auto_now_add=True)
    value = models.IntegerField()
    poll = models.ForeignKey(Poll)

    def __unicode__(self):
        return str(self.value)
