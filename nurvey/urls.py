from django.conf.urls import patterns, include, url
from django.contrib import admin
from nurvey import views

admin.autodiscover()

urlpatterns = patterns('',
    url(r'^admin/', include(admin.site.urls)),
    url(r'^$', views.landing, name='landing'),

    #Login
    url(r'^reddit-auth-url', views.reddit_auth_url, name='reddit_auth_url'),
    url(r'^callback/', views.reddit_callback, name='reddit_callback'),
    url(r'^login/', views.login_user, name='login'),
    url(r'^register/', views.register, name='register'),
    url(r'^logout/', views.logout_user, name='logout'),
    url(r'^unique-username/', views.unique_username, name='unique_username'),

    # REST API
    url(r'^surveys/(?P<id>\d+)/$', views.survey_results, name='survey_results'),
    url(r'^delete-survey/$', views.delete_survey, name='delete_surveys'),
    url(r'^surveys/$', views.surveys, name='surveys'),
    url(r'^delete-poll/', views.delete_poll, name='delete_polls'),
    url(r'^polls/', views.polls, name='polls'),
    url(r'^points/', views.points, name='points'),
    url(r'^users/', views.users, name='users'),
    url(r'user-recent-surveys/', views.user_recent_surveys, name='user_recent_surveys'),

    # Other
    url(r'^correlate/', views.correlate, name='correlate'),

    #Testing
    url(r'^login_next_user/', views.login_next_user, name='login_next_user'),
)
