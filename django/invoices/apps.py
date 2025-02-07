from django.apps import AppConfig


class InvoicesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'invoices'

    def ready(self):
        import os
        if os.environ.get('RUN_MAIN'):
            from core.celery import app as celery_app
            __all__ = ("celery_app",)