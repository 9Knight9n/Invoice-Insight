from django.urls import path
from .views import UploadPDFView, JobStatusView, InvoiceDetailView, CreateCommentView

urlpatterns = [
    path('upload/', UploadPDFView.as_view(), name='upload_pdf'),
    path('status/<int:invoice_id>/', JobStatusView.as_view(), name='job_status'),
    path('invoice/<int:invoice_id>/', InvoiceDetailView.as_view(), name='invoice_detail'),
    path('invoice/<int:invoice_id>/comment/', CreateCommentView.as_view(), name='create_comment'),
]