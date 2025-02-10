import math

from django.contrib.auth.models import User
from django.db import models
from django.core.exceptions import ValidationError


class Invoice(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    pdf_file = models.FileField(upload_to='invoices/pdf_files')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    extracted_text = models.JSONField(null=True, blank=True)
    item_wise_features = models.JSONField(null=True, blank=True)
    general_features = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Invoice {self.id} - {self.status}"

    def clean(self):
        super().clean()
        def sanitize_json(value):
            """Recursively replace NaN with None in JSON-serializable data."""
            if isinstance(value, float) and math.isnan(value):
                return None
            elif isinstance(value, dict):
                return {k: sanitize_json(v) for k, v in value.items()}
            elif isinstance(value, list):
                return [sanitize_json(v) for v in value]
            else:
                return value

        # Sanitize JSON fields
        self.extracted_text = sanitize_json(self.extracted_text) if self.extracted_text else None
        self.item_wise_features = sanitize_json(self.item_wise_features) if self.item_wise_features else None
        self.general_features = sanitize_json(self.general_features) if self.general_features else None

        try:
            if self.item_wise_features is not None:
                if not isinstance(self.item_wise_features, list):
                    raise ValidationError({'item_wise_features': 'item_wise_features must be a list of objects.'})

                for item in self.item_wise_features:
                    if not isinstance(item, dict):
                        raise ValidationError({'item_wise_features': 'Each item in item_wise_features must be an object (dictionary).'})
                    if 'Item Name' not in item:
                        raise ValidationError({'item_wise_features': 'Each object in item_wise_features must have a "item_name" field.'})
        except ValidationError as e:
            print(e.__str__())
            self.item_wise_features = None

        try:
            if self.general_features is not None:
                if not isinstance(self.general_features, list):
                    raise ValidationError({'general_features': 'general_features must be a list of objects.'})

                for item in self.general_features:
                    if not isinstance(item, dict):
                        raise ValidationError({'general_features': 'Each item in general_features must be an object (dictionary).'})
                    if 'Name' not in item:
                        raise ValidationError({'general_features': 'Each object in general_features must have a "field_name" field.'})
                    if 'Value' not in item:
                        raise ValidationError({'general_features': 'Each object in general_features must have a "extracted_value" field.'})
        except ValidationError as e:
            print(e.__str__())
            self.general_features = None

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class Comment(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.user.username} on Invoice {self.invoice.id}"