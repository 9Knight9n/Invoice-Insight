from django.contrib.auth.models import User  # Add this import

from rest_framework import serializers

from invoices.models import Comment, InvoiceItem, Invoice


class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['id', 'text', 'created_at']  # Remove 'user' from fields
        read_only_fields = ['id', 'invoice', 'user', 'created_at']  # Ensure 'user' is read-only

    def create(self, validated_data):
        # Assign User ID 1 if unauthenticated, else use the authenticated user
        user = self.context['request'].user
        if user.is_authenticated:
            validated_data['user'] = user
        else:
            validated_data['user'] = User.objects.get(id=1)  # Auto-assign to User ID 1
        return super().create(validated_data)

class ApproveItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = ['isApproved']

class DisapproveItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = ['isDisapproved']

class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = [
            'id',
            'name',
            'hs_code',
            'part_number',
            'metadata',
        ]

class InvoiceListSerializer(serializers.ModelSerializer):
    pdf_file_name = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = ['id', 'status', 'created_at', 'pdf_file_name']

    def get_pdf_file_name(self, obj):
        return obj.pdf_file.name.split('/')[-1]  # Extract the file name from the path