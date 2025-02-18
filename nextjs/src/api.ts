const baseUrl = 'http://85.198.9.203:8000';

export const getInvoice = async (invoiceId: number): Promise<InvoiceGeneralData> => {
  const response = await fetch(`${baseUrl}/api/invoices/invoice/${invoiceId}/`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });
  return response.json();
};

export const createInvoiceComment = async (invoiceId: number, text: string) => {
  const response = await fetch(`${baseUrl}/api/invoices/invoice/${invoiceId}/comment/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ text }),
  });
  return response.json();
};

export const getInvoiceStatus = async (invoiceId: number) => {
  const response = await fetch(`${baseUrl}/api/invoices/status/${invoiceId}/`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });
  return response.json();
};

export const uploadInvoice = async (file: File) => {
  const formData = new FormData();
  formData.append('pdf_file', file);

  const response = await fetch(`${baseUrl}/api/invoices/upload/`, {
    method: 'POST',
    body: formData,
  });
  return response.json();
};

export type InvoiceGeneralData = {
  id?: number,
  item_wise_features?: ItemWiseFeature[],
  general_features?: {
    Name: string,
    Value: string
  }[];
  status: "processing" | "pending" | "completed";
}

export type ItemWiseFeature = {
  name: string;
  hs_code: string | null;
  hs_code_method: used_method_choices | null;
  part_number: string | null;
  part_number_method: used_method_choices | null;
  quarantine: "maybe" | "yes" | "no";
  quarantine_detail: string;
  quarantine_method: used_method_choices | null;
  metadata: {
    [key: string]: string | null;
  }
}

export type used_method_choices = "naive_llm" | "extracted_from_invoice";

export const mockInvoiceData: InvoiceGeneralData = {
  id: 10123,
  status: "completed",
  general_features: [
    { Name: "Invoice Number", Value: "INV-2024-001" },
    { Name: "Supplier", Value: "Global Supplies Ltd." },
    { Name: "Buyer", Value: "Tech Solutions Inc." },
    { Name: "Invoice Date", Value: "2024-02-18" },
    { Name: "Due Date", Value: "2024-03-01" },
    { Name: "Total Amount", Value: "$15,600" },
    { Name: "Currency", Value: "USD" },
    { Name: "Payment Terms", Value: "Net 30" },
    { Name: "Shipment Method", Value: "Air Freight" },
    { Name: "Origin Country", Value: "Germany" },
    { Name: "Destination Country", Value: "United States" },
    { Name: "Customs Clearance", Value: "Required" },
    { Name: "Incoterms", Value: "FOB (Free on Board)" },
  ],
  item_wise_features: [
    {
      name: "Industrial Drill Machine",
      hs_code: "84672100",
      hs_code_method: "extracted_from_invoice",
      part_number: "DRL-450X",
      part_number_method: "naive_llm",
      quarantine: "no",
      quarantine_detail: "Not subject to quarantine",
      quarantine_method: "naive_llm",
      metadata: {
        Color: "Blue",
        Product: "Heavy-Duty Drill",
        Quantity: "10 Units",
        "Unit Price": "$1,200",
        "Total Price": "$12,000",
        Specification: "Voltage: 220V, Power: 1500W, Speed: 3000 RPM",
      },
    },
    {
      name: "Stainless Steel Screws",
      hs_code: "73181500",
      hs_code_method: "extracted_from_invoice",
      part_number: "SSCR-12X50",
      part_number_method: "naive_llm",
      quarantine: "maybe",
      quarantine_detail: "May require certification",
      quarantine_method: "extracted_from_invoice",
      metadata: {
        Color: "Silver",
        Product: "M12 x 50mm Bolts",
        Quantity: "5000 PCS",
        "Unit Price": "$0.50",
        "Total Price": "$2,500",
        Specification: "Grade: A2-70, Material: Stainless Steel",
      },
    },
    {
      name: "Hydraulic Pump",
      hs_code: null,
      hs_code_method: "naive_llm",
      part_number: "HP-5000",
      part_number_method: "extracted_from_invoice",
      quarantine: "yes",
      quarantine_detail: "Requires inspection upon arrival",
      quarantine_method: "extracted_from_invoice",
      metadata: {
        Color: "Black",
        Product: "High-Pressure Hydraulic Pump",
        Quantity: "2 Units",
        "Unit Price": "$550",
        "Total Price": "$1,100",
        Specification: "Max Pressure: 5000 PSI, Flow Rate: 20 LPM",
      },
    },
    {
      name: "Electronic Circuit Board",
      hs_code: "85340090",
      hs_code_method: "extracted_from_invoice",
      part_number: "ECB-900X",
      part_number_method: "naive_llm",
      quarantine: "no",
      quarantine_detail: "No quarantine required",
      quarantine_method: "naive_llm",
      metadata: {
        Color: "Green",
        Product: "PCB Board",
        Quantity: "50 PCS",
        "Unit Price": "$15",
        "Total Price": "$750",
        Specification: "Layers: 4, Copper Thickness: 1oz, Material: FR4",
      },
    },
  ],
};