"""Admin registration for the session models."""

from django.contrib import admin

from .models import Comment, Message, Note, Session, SessionEntry

admin.site.register([Session, SessionEntry, Note, Comment, Message])
