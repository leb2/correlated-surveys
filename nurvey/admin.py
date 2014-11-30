from django.contrib import admin
from nurvey.models import *

admin.site.register(Survey)
admin.site.register(Vote)
admin.site.register(Profile)

@admin.register(Poll)
class PollAdmin(admin.ModelAdmin):
    readonly_fields = ('results', )


