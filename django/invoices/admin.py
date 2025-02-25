from django.contrib import admin

from invoices.models import Invoice, Comment

# Register your models here.
admin.site.register(Invoice)
admin.site.register(Comment)