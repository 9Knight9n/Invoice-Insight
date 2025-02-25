import React from "react";
import { DataGrid, GridToolbarContainer, GridToolbarExport, GridRenderCellParams } from '@mui/x-data-grid';
import { Box, Typography } from "@mui/material";
import { ApprovedInvoiceItems } from "@/api";

interface CustomDataGridProps {
  data: ApprovedInvoiceItems[];
}

const MyDataGrid: React.FC<CustomDataGridProps> = ({ data }) => {
  const extractMetadataKeys = (data: ApprovedInvoiceItems[]): string[] => {
    const keysSet = new Set<string>();
    data.forEach(item => {
      if (item.metadata) {
        Object.keys(item.metadata).forEach(key => keysSet.add(key));
      }
    });
    return Array.from(keysSet);
  };

  const metadataKeys = extractMetadataKeys(data);

  const columns = [
    // { field: 'id', headerName: 'ID', width: 50, hide: true },
    { field: 'name', headerName: 'Name', width: 150 },
    { field: 'hs_code', headerName: 'HS Code', width: 100 },
    { field: 'part_number', headerName: 'Part Number', width: 100 },
    ...metadataKeys.map(key => ({
      field: key,
      headerName: key.charAt(0).toUpperCase() + key.slice(1),
      width: 150,
      renderCell: (params: GridRenderCellParams) => params.value || 'N/A',
    })),
  ];

  const rows = data.map(item => ({
    id: item.id,
    name: item.name,
    hs_code: item.hs_code,
    part_number: item.part_number,
    ...item.metadata,
  }));

  return (
      <DataGrid
        rows={rows}
        columns={columns}
        slots={{
          toolbar: CustomToolbar,
        }}
        getRowId={(row) => row.id}
        getRowClassName={(params) =>
          params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
        }
        autoHeight
        rowSelection={false}
        sx={{
          borderRadius: "12px",
          '& .even': {
            backgroundColor: '#f0f0f0',
          },
        }}
      />
  );
};

const CustomToolbar: React.FC = () => {
  return (
    <GridToolbarContainer>
      <Typography ml={1} fontWeight={"bold"}>Approved Items Preview</Typography>
      <Box sx={{ flexGrow: 1 }} />
      <GridToolbarExport
        csvOptions={{ fileName: "approved_items" }}
        slotProps={{
          tooltip: { title: 'Export' },
          button: { variant: "outlined", children: 'Export' },
        }}
      />
    </GridToolbarContainer>
  );
};

export default MyDataGrid;