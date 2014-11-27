from django.conf.urls import patterns, include, url
from django.contrib import admin
from nurvey import views

admin.autodiscover()

urlpatterns = patterns('',
    url(r'^admin/', include(admin.site.urls)),
    url(r'^$', views.landing, name='landing'),

    # Includes
    url(r'^create/', include('create.urls', namespace='create')),

    # Login
    url(r'^login/', views.login_user, name='login'),
    url(r'^register/', views.register, name='register'),
    url(r'^logout/', views.logout_user, name='logout'),

    # REST API
    url(r'surveys/(?P<id>\d+)/$', views.survey_results, name='survey_results'),
    url(r'surveys/$', views.surveys, name='surveys'),
    url(r'polls/', views.polls, name='polls'),
    url(r'points/', views.points, name='points')
)
