from django.urls import path
from .views import UploadPDFView, JobStatusView, InvoiceDetailView, CreateCommentView, ApproveItemView, DisapproveItemView, ApprovedItemsListView, InvoiceListView

urlpatterns = [
    path('upload/', UploadPDFView.as_view(), name='upload_pdf'),
    path('status/<int:invoice_id>/', JobStatusView.as_view(), name='job_status'),
    path('invoice/<int:invoice_id>/', InvoiceDetailView.as_view(), name='invoice_detail'),
    path('invoice/<int:invoice_id>/comment/', CreateCommentView.as_view(), name='create_comment'),
    path('item/<int:item_id>/approve/', ApproveItemView.as_view(), name='approve_item'),
    path('item/<int:item_id>/disapprove/', DisapproveItemView.as_view(), name='disapprove_item'),
    path('items/approved/', ApprovedItemsListView.as_view(), name='approved_items_list'),
    path('invoices/', InvoiceListView.as_view(), name='invoice_list'),
]