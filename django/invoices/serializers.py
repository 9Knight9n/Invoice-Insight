from django.contrib.auth.models import User  # Add this import

from rest_framework import serializers

from invoices.models import Comment


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