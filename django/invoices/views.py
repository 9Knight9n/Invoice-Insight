from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework import status
from .models import Invoice
from .tasks import process_pdf  # We'll create this task later

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
            data = {
                "id": invoice.id,
                "extracted_text": invoice.extracted_text,
                "llm_analysis": invoice.llm_analysis,
            }
            return Response(data, status=status.HTTP_200_OK)
        except Invoice.DoesNotExist:
            return Response({"error": "Invoice not found"}, status=status.HTTP_404_NOT_FOUND)