from django.db import models
from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes import generic


class Survey(models.Model):
    title = models.CharField(max_length=200)
    description = models.CharField(max_length=1500, default="")
    pub_date = models.DateTimeField(auto_now_add=True)
    owner = models.ForeignKey(User)
    num_upvotes = models.IntegerField(default=0)
    num_downvotes = models.IntegerField(default=0)


class Poll(models.Model):
    survey = models.ForeignKey(Survey)

    # Generic Foreign Key to specific poll
    poll_type = models.ForeignKey(ContentType)
    poll_id = models.PositiveIntegerField()
    poll_object = generic.GenericForeignKey('poll_type', 'poll_id')

    title = models.CharField(max_length=200)
    unit_tag = models.CharField(max_length=50)
    description= models.CharField(max_length=1500, default="")

    def __unicode__(self):
        return self.title


class ChoicePoll(models.Model):
    poll = generic.GenericRelation(Poll)


class Choice(models.Model):
    poll = models.ForeignKey(ChoicePoll)
    text = models.CharField(max_length=200)

    def __unicode__(self):
        return self.text

