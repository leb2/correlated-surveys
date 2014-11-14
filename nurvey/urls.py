from django.conf.urls import patterns, include, url
from django.contrib import admin
from nurvey import views

urlpatterns = patterns('',
    url(r'^admin/', include(admin.site.urls)),
    url(r'^$', views.landing, name='landing'),
    url(r'^create/', include('create.urls', namespace='create')),
    url(r'^login/', views.login_user, name='login'),
    url(r'^register/', views.register, name='register'),
    url(r'^logout/', views.logout_user, name='logout')
)
