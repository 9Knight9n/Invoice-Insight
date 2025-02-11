"use client";
import FileUpload from "@/components/file-upload";
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import React, {useState} from "react";
import {createInvoiceComment, InvoiceGeneralData} from "@/api";
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarExport,
  GridToolbarDensitySelector,
  gridClasses
} from '@mui/x-data-grid';
import { alpha, styled } from '@mui/material/styles';
import {Button, Grow, TextField, Typography} from "@mui/material";
import Image from "next/image";
import { enqueueSnackbar } from 'notistack';

export default function Home() {
  const [generalData, setGeneralData] = useState<InvoiceGeneralData>();
  const [comment, setComment] = useState<string>("");
  const [invoiceID, setInvoiceID] = useState<number>();
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);

  const mainFields = ['Item Name', 'HS Code', 'Part Number'];
  const createDynamicColumns = (data: { [key: string]: string | null }[]) => {
    if (!data || data.length === 0) return [];
    const dynamicFields = Object.keys(data[0]).filter(
      (key) => !mainFields.includes(key)
    );
    return [
      ...mainFields,
      ...dynamicFields,
    ].map((field) => ({
      field,
      headerName: field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1'), // فرمت دهی header
      flex: field === "Description" || field === "D E S C R I P T I O N" ? 2.5 : 1,
    }));
  };

  return (
    <Box display={"flex"} justifyContent={"center"} alignItems={"center"} bgcolor={"#F4F4FF"} p={4} minHeight={"100svh"}>
      <Box display="flex" flexDirection="column" bgcolor="white" p={4} borderRadius={4} minWidth={generalData ? "100%" : "50%"} sx={{ transition: "0.5s" }}>
        {!generalData && <FileUpload setGeneralData={setGeneralData} setInvoiceID={setInvoiceID}/>}
        {generalData && invoiceID &&
          <Grow in={true} {...{ timeout: 1000 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 12 }}>
                <StripedDataGrid
                  rowHeight={30}
                  columnHeaderHeight={40}
                  rows={generalData?.general_features || []}
                  columns={[
                    { field: 'Name', headerName: 'Name', flex: 1 },
                    { field: 'Value', headerName: 'Value', flex: 3 },
                  ]}
                  getRowId={(row) => row.Name}
                  checkboxSelection
                  // hideFooterPagination={true}
                  // hideFooterSelectedRowCount={true}
                  // hideFooter={true}
                  slots={{
                    toolbar: () => CustomToolbar("General Extracted Data (Not Item-wise)"),
                  }}
                  sx={{
                    borderRadius: "12px",
                  }}
                  getRowClassName={(params) =>
                    params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 12 }}>
                <StripedDataGrid
                  rowHeight={30}
                  columnHeaderHeight={40}
                  rows={generalData?.item_wise_features || []}
                  columns={createDynamicColumns(generalData?.item_wise_features)}
                  getRowId={(row) => `${row.itemName}-${Date.now()}-${Math.floor(Math.random() * 1000)}`}
                  checkboxSelection
                  // hideFooterPagination={true}
                  // hideFooterSelectedRowCount={true}
                  // hideFooter={true}
                  slots={{
                    toolbar: () => CustomToolbar("Items in Invoice with Detected HS Codes and Part Numbers"),
                  }}
                  sx={{
                    borderRadius: "12px",
                  }}
                  getRowClassName={(params) =>
                    params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 12 }}>
                <TextField
                  fullWidth={true}
                  label={"Feedback/Comment on Invoice Processing"}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  multiline={true}
                  minRows={3}
                  sx={{borderRadius: "12px"}}
                />
                <Box display="flex" width={"100%"} justifyContent={"flex-end"} gap={1} mt={1}>
                  <Button variant={"outlined"} onClick={() => setGeneralData(undefined)}>
                    <Image src={"/images/refresh.svg"} alt={"refresh"} width={20} height={20} style={{marginRight: "4px"}}/>
                    Start Over
                  </Button>
                  <Button disabled={!comment || isSubmittingComment} variant={"contained"} onClick={() => {
                    setIsSubmittingComment(true)
                    createInvoiceComment(invoiceID, comment ?? "").then(() => {
                    }).finally(() => {setIsSubmittingComment(false)});
                    enqueueSnackbar("Your feedback has been successfully saved!", {variant: "success"});
                    setComment("");
                  }} >
                    Submit Comment
                    <Image src={"/images/send.svg"} alt={"refresh"} width={20} height={20} style={{marginLeft: "4px"}}/>
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Grow>
        }
      </Box>
    </Box>
  );
}
function CustomToolbar(title: string) {
  return (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector
        slotProps={{ tooltip: { title: 'Change density' } }}
      />
      <Box sx={{ flexGrow: 1 }} />
      <Typography ml={1} fontWeight={"bold"}>{title}</Typography>
      <Box sx={{ flexGrow: 1 }} />
      <GridToolbarExport
        slotProps={{
          tooltip: { title: 'Export data' },
          button: { variant: 'outlined' },
        }}
      />
    </GridToolbarContainer>
  );
}
const ODD_OPACITY = 0.2;

const StripedDataGrid = styled(DataGrid)(({ theme }) => ({
  [`& .${gridClasses.row}.even`]: {
    backgroundColor: theme.palette.grey[200],
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, ODD_OPACITY),
      '@media (hover: none)': {
        backgroundColor: 'transparent',
      },
    },
    '&.Mui-selected': {
      backgroundColor: alpha(
        theme.palette.primary.main,
        ODD_OPACITY + theme.palette.action.selectedOpacity,
      ),
      '&:hover': {
        backgroundColor: alpha(
          theme.palette.primary.main,
          ODD_OPACITY +
          theme.palette.action.selectedOpacity +
          theme.palette.action.hoverOpacity,
        ),
        '@media (hover: none)': {
          backgroundColor: alpha(
            theme.palette.primary.main,
            ODD_OPACITY + theme.palette.action.selectedOpacity,
          ),
        },
      },
    },
  },
}));