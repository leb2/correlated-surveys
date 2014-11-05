from django.db import models
from django.contrib.auth.models import User

class Survey(models.Model):
    title = models.CharField(max_length=200)
    description = models.CharField(max_length=1500, default="")
    pub_date = models.DateTimeField(auto_now_add=True)
    owner = models.ForeignKey(User)
    num_upvotes = models.IntegerField(default=0)
    num_downvotes = models.IntegerField(default=0)
