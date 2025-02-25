"use client";
import React, {useCallback, useState} from 'react';
import {Box, Typography, Button, List, ListItem, ListItemAvatar, ListItemText} from '@mui/material';
import Image from "next/image";
import {getInvoice, InvoiceGeneralData, uploadInvoice} from "@/api";
import { enqueueSnackbar } from 'notistack';
import Processing from "@/components/processing";
import { useRouter } from "next/navigation"; // تغییر به next/navigation
import { useSearchParams } from 'next/navigation'; // اضافه کردن useSearchParams

type Props = {
  setGeneralData: React.Dispatch<React.SetStateAction<InvoiceGeneralData | null>>;
  setInvoiceID: React.Dispatch<React.SetStateAction<number | undefined>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}
const FileUpload: React.FC<Props> = ({setGeneralData, setInvoiceID, isLoading, setIsLoading}) => {
  const [files, setFiles] = useState<File[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const acceptedFiles = Array.from(event.dataTransfer.files).filter(file =>
      ['application/pdf', 'image/png', 'image/jpeg'].includes(file.type)
    );
    // setFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
    setFiles(acceptedFiles);

  }, []);

  const handleBrowse = (event: React.ChangeEvent<HTMLInputElement>) => {
    const acceptedFiles = Array.from(event.target.files || []).filter(file =>
      ['application/pdf', 'image/png', 'image/jpeg'].includes(file.type)
    );
    // setFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
    setFiles(acceptedFiles);
  };

  const handleUpload = () => {
    if (files.length > 0) {
      setIsLoading(true);
      uploadInvoice(files[0]).then(r => {
        setInvoiceID(r.invoice_id);
        enqueueSnackbar(r.message, {variant: "info"});
        // setGeneralData(mockInvoiceData);
        // setIsLoading(false);
        const checkInvoiceStatus = () => {
          getInvoice(r.invoice_id).then((response) => {
            console.log(response.status);
            if (response.status === 'processing' || response.status === 'pending') {
              if (!!response.general_features?.length && !!response.item_wise_features?.length)
                setGeneralData(prevState => ({
                  ...prevState, ...response
                }));
              setTimeout(checkInvoiceStatus, 2000);
            } else if (response.status === 'completed') {
              console.log('Invoice processing completed:', response);
              setGeneralData(response);
              setIsLoading(false);
              enqueueSnackbar('Invoice processing completed', {variant: 'success'});
              const newUrl = `${window.location.pathname}?${new URLSearchParams({ ...Object.fromEntries(searchParams), id: r.invoice_id }).toString()}`;
              router.push(newUrl);
            } else {
              console.log('Invoice status:', response.status);
              setIsLoading(false);
            }
          });
        };
        checkInvoiceStatus();
      }).catch(error => {
        enqueueSnackbar(error, {variant: "error"});
      }).finally(() => {});
    }
  };

  return (
    <Box>
      {isLoading ?
        <Box width="100%" display="flex" justifyContent="center" alignItems="center">
          <Processing/>
        </Box> :
        <Box
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          sx={{
            border: '2px dashed rgba(56, 78, 183, 0.3)',
            backgroundColor: '#F8F8FF',
            borderRadius: '10px',
            padding: !!files.length ? '20px' : '80px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: '0.3s',
          }}
        >
          <input
            type="file"
            accept=".pdf, .png, .jpeg, .jpg"
            onChange={handleBrowse}
            style={{display: 'none'}}
            id="file-upload"
            multiple={false}
          />
          <label htmlFor="file-upload">
            <Image src={"/images/upload.svg"} alt={"upload"} width={76} height={62}/>
            <Typography variant="body1">
              Drag & drop your file here, or click to browse
            </Typography>
            <Button variant="outlined" component="span" sx={{marginTop: '10px'}}>
              Browse Files
            </Button>
          </label>
        </Box>
      }
      {/*{!!files.length && <Typography color="textSecondary" mt={3} mb={1}>{files.length} files uploaded:</Typography>}*/}
      {!!files.length && <List color={"red"}>
        {files.map((file, index) => (
          <ListItem key={index} sx={{p: 0}}>
            <ListItemAvatar sx={{minWidth: "unset", mt: 0.3}}>
              <Image src={"/images/checkCircle.svg"} alt={"file"} width={28} height={28}/>
            </ListItemAvatar>
            <ListItemText primary={file.name} sx={{ml: 1}}/>
          </ListItem>
        ))}
      </List>}
      {!!files.length &&
        <Button
          variant={"contained"}
          fullWidth
          onClick={handleUpload}
          disabled={isLoading}
        >
          {isLoading ? "Processing ..." : "Start Process"}
        </Button>
      }
    </Box>
  );
};

export default FileUpload;