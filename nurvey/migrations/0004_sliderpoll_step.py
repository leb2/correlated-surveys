# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('nurvey', '0003_vote'),
    ]

    operations = [
        migrations.AddField(
            model_name='sliderpoll',
            name='step',
            field=models.IntegerField(default=1),
            preserve_default=True,
        ),
    ]
