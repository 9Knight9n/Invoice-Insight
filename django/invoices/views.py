from rest_framework.parsers import MultiPartParser
from .models import Invoice, InvoiceItem
from .serializers import CommentSerializer
from .tasks import process_pdf
from rest_framework import permissions
from .serializers import ApproveItemSerializer, DisapproveItemSerializer
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample, OpenApiTypes
from .serializers import InvoiceItemSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Invoice
from .serializers import InvoiceListSerializer
from drf_spectacular.utils import extend_schema, OpenApiTypes

class InvoiceListView(APIView):
    @extend_schema(
        description="Get a list of all uploaded invoices",
        responses={
            200: InvoiceListSerializer(many=True),
            404: OpenApiTypes.OBJECT,
        },
    )
    def get(self, request, *args, **kwargs):
        invoices = Invoice.objects.all()
        if not invoices.exists():
            return Response({"message": "No invoices found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = InvoiceListSerializer(invoices, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class ApprovedItemsListView(APIView):
    @extend_schema(
        description="Get a list of all approved invoice items",
        responses={
            200: InvoiceItemSerializer(many=True),
            404: OpenApiTypes.OBJECT,
        },
    )
    def get(self, request, *args, **kwargs):
        approved_items = InvoiceItem.objects.filter(isApproved=True)
        if not approved_items.exists():
            return Response({"message": "No approved items found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = InvoiceItemSerializer(approved_items, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class ApproveItemView(APIView):
    @extend_schema(
        description="Approve an invoice item",
        request=ApproveItemSerializer,
        responses={
            200: ApproveItemSerializer,
            400: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT,
        },
        examples=[
            OpenApiExample(
                name="Approve Item",
                value={"isApproved": True},
                request_only=True,
            ),
        ],
    )
    def patch(self, request, item_id, *args, **kwargs):
        try:
            item = InvoiceItem.objects.get(id=item_id)
        except InvoiceItem.DoesNotExist:
            return Response({"error": "Item not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = ApproveItemSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class DisapproveItemView(APIView):
    @extend_schema(
        description="Disapprove an invoice item",
        request=DisapproveItemSerializer,
        responses={
            200: DisapproveItemSerializer,
            400: OpenApiTypes.OBJECT,
            404: OpenApiTypes.OBJECT,
        },
        examples=[
            OpenApiExample(
                name="Disapprove Item",
                value={"isDisapproved": True},
                request_only=True,
            ),
        ],
    )
    def patch(self, request, item_id, *args, **kwargs):
        try:
            item = InvoiceItem.objects.get(id=item_id)
        except InvoiceItem.DoesNotExist:
            return Response({"error": "Item not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = DisapproveItemSerializer(item, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UploadPDFView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request, *args, **kwargs):
        pdf_file = request.FILES.get('pdf_file')
        if not pdf_file:
            return Response({"error": "No PDF file provided"}, status=status.HTTP_400_BAD_REQUEST)

        # Create a new invoice
        invoice = Invoice.objects.create(pdf_file=pdf_file)

        # Start the Celery task
        process_pdf.delay(invoice.id)

        return Response({
            "message": "PDF uploaded and processing started",
            "invoice_id": invoice.id
        }, status=status.HTTP_202_ACCEPTED)

class JobStatusView(APIView):
    def get(self, request, invoice_id, *args, **kwargs):
        try:
            invoice = Invoice.objects.get(id=invoice_id)
            return Response({"status": invoice.status}, status=status.HTTP_200_OK)
        except Invoice.DoesNotExist:
            return Response({"error": "Invoice not found"}, status=status.HTTP_404_NOT_FOUND)

class InvoiceDetailView(APIView):
    def get(self, request, invoice_id, *args, **kwargs):
        try:
            invoice = Invoice.objects.get(id=invoice_id)
            items = InvoiceItem.objects.filter(invoice=invoice).values(
                    "id",
                    "name",
                    "hs_code",
                    "hs_code_method",
                    "part_number",
                    "part_number_method",
                    "quarantine",
                    "quarantine_detail",
                    "quarantine_method",
                    "isApproved",
                    "isDisapproved",
                    "metadata",
                )
            data = {
                "id": invoice.id,
                "item_wise_features": items if len(items) > 0 else None,
                "general_features": invoice.general_features,
                "status": invoice.status,
            }
            return Response(data, status=status.HTTP_200_OK)
        except Invoice.DoesNotExist:
            return Response({"error": "Invoice not found"}, status=status.HTTP_404_NOT_FOUND)


class CreateCommentView(APIView):
    permission_classes = [permissions.AllowAny]  # Allow unauthenticated access

    def post(self, request, invoice_id, *args, **kwargs):
        try:
            invoice = Invoice.objects.get(id=invoice_id)
        except Invoice.DoesNotExist:
            return Response({"error": "Invoice not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = CommentSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save(invoice=invoice)  # Pass the invoice object here
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)