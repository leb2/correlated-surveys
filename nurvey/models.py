from django.db import models
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes import generic




# Upvote / Downvote mechanic

class Point(models.Model):
    user = models.ForeignKey(User)
    data = models.DateTimeField(auto_now_add=True)
    is_up = models.BooleanField(blank=True, default=None)

    # Survey or Poll that is being voted on
    voted_type = models.ForeignKey(ContentType)
    voted_id = models.PositiveIntegerField()
    voted_object = generic.GenericForeignKey('voted_type', 'voted_id')



class Survey(models.Model):
    title = models.CharField(max_length=200)
    description = models.CharField(max_length=1500, default="")
    pub_date = models.DateTimeField(auto_now_add=True)
    owner = models.ForeignKey(User)
    num_upvotes = models.IntegerField(default=0)
    num_downvotes = models.IntegerField(default=0)
    points = generic.GenericRelation(Point, content_type_field='voted_type', object_id_field='voted_id')

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
    step = models.IntegerField(default=1)

    def results(self, poll):
        results = {}
        for i in range(self.min, self.max, self.step):
            results[i] = Vote.objects.filter(poll=poll, value=i).count()
        return results

    def results_pretty(self, poll):
        results = self.results(poll)
        return {
            'domain': results.keys(),
            'range': results.values()
        }


class ChoicePoll(models.Model):
    poll = generic.GenericRelation(Poll)

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







