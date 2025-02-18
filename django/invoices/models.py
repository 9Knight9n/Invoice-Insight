from django.contrib.auth.models import User
from django.db import models

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
    general_features = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Invoice {self.id} - {self.status}"

    def clean(self):
        super().clean()

        if self.general_features is None:
            return

        if not isinstance(self.general_features, list):
            self.general_features = None
            return

        new_general_features = []
        for item in self.general_features:
            if not isinstance(item, dict):
                continue
            if 'Name' not in item:
                continue
            if 'Value' not in item:
                continue
            new_general_features.append(item)
        self.general_features = new_general_features


    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class InvoiceItem(models.Model):
    USED_METHOD_CHOICES = [
        ('extracted_from_invoice', 'Extracted from invoice'),
        ('naive_llm', 'Naive LLM'),
    ]
    QUARANTINE_CHOICES = [
        ('yes', 'Yes'),
        ('no', 'No'),
        ('maybe', 'Maybe'),
    ]
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    name = models.TextField()
    hs_code = models.CharField(max_length=20, null=True, blank=True)
    hs_code_method = models.CharField(max_length=30, choices=USED_METHOD_CHOICES, null=True, blank=True)
    part_number = models.CharField(max_length=50, null=True, blank=True)
    part_number_method = models.CharField(max_length=30, choices=USED_METHOD_CHOICES, null=True, blank=True)
    quarantine = models.CharField(max_length=20, choices=QUARANTINE_CHOICES, null=True, blank=True)
    quarantine_detail = models.TextField(null=True, blank=True)
    quarantine_method = models.CharField(max_length=30, choices=USED_METHOD_CHOICES, null=True, blank=True)
    metadata = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"Item {self.part_number} in Invoice {self.invoice.id}"


class Comment(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Comment by {self.user.username} on Invoice {self.invoice.id}"