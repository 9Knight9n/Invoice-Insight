const baseUrl = ``;

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
  id: number,
  item_wise_features: {
    itemName: string;
    hsCode: string;
    partNumber: string;
    [key: string]: string | null;
  }[],
  general_features: {
    Name: string,
    Value: string
  }[];
  status: "processing" | "completed";
}

export const mockResponse = {
  "id": 45,
  "item_wise_features": [
    {
      "Qty": "10.00",
      "HS Code": null,
      "Extended": "2,343.80",
      "Item Name": "SCC-262 (USA)",
      "Unit Price": "234.38",
      "Description": "screen tension spring 6kg stainless steel (250 per box)",
      "Part Number": null
    },
    {
      "Qty": "16.00",
      "HS Code": null,
      "Extended": "4,575.04",
      "Item Name": "LAB-002 (USA)",
      "Unit Price": "285.94",
      "Description": "label paintmask 155mm x 15mm (ZZU3025)",
      "Part Number": null
    }
  ],
  "general_features": [
    {
      "Name": "Date of Export",
      "Value": "9/11/2024"
    },
    {
      "Name": "Delivery Term",
      "Value": "FOB"
    },
    {
      "Name": "Delivery Method",
      "Value": "SEA LCL"
    },
    {
      "Name": "Shipment Number",
      "Value": "CHI-BNE-213"
    },
    {
      "Name": "Shipper Seller",
      "Value": "CENTOR NORTH AMERICA, 966 CORPORATE BLVD STE 130, AURORA IL 60502, USA"
    },
    {
      "Name": "Shipped to",
      "Value": "CENTOR ARCHITECTURAL - EAGLE FARM, Receiving, Cnr French St & Kingsfordsmith Drive, EAGLE FARM QLD 4009, AUSTRALIA"
    },
    {
      "Name": "Sold to",
      "Value": "CENTOR ARCHITECTURAL - EAGLE FARM, Receiving, Cnr French St & Kingsfordsmith Drive, EAGLE FARM QLD 4009, AUSTRALIA"
    },
    {
      "Name": "Contact Name",
      "Value": "KELVIN DEWEY"
    },
    {
      "Name": "Contact Phone Number",
      "Value": "00 61 7 3868 5786"
    },
    {
      "Name": "Country of Origin",
      "Value": "USA"
    },
    {
      "Name": "Purchase Order Number",
      "Value": "POAU1-00159354"
    }
  ],
  "status": "completed"
}