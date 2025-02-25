import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import {UploadHistoryType} from "@/api";
import {Button} from "@mui/material";
import {useRouter, useSearchParams} from "next/navigation";

type Props = {
  history: UploadHistoryType[];
}
const UploadHistory: React.FC<Props> = ({history}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const goToFile = (id: number) => {
    const newUrl = `${window.location.pathname}?${new URLSearchParams({ ...Object.fromEntries(searchParams), id: id.toString() }).toString()}`;
    router.push(newUrl);
  };
  return (
    <Box sx={{
      border: '2px solid rgba(56, 78, 183, 0.3)',
      backgroundColor: '#F8F8FF',
      borderRadius: '10px',
      padding: 2,
      textAlign: 'center',
      transition: '0.3s',
      width: '100%',
      minHeight: '300px',
      maxHeight: '300px',
      overflow: "auto",
      display: 'flex',
      flexDirection: 'column',
      gap: 0.5
    }}>
      <Typography variant="h6" color={"textSecondary"} sx={{ fontWeight: "bold", textAlign: "center" }}>
        Upload History
      </Typography>
      {history.map((item, index) => (
        <React.Fragment key={item.id}>
          <Box component={Button} onClick={() => goToFile(item.id)} display={"flex"} justifyContent={"space-between"} gap={1} alignItems={"center"}>
            <Box display={"flex"} alignItems={"center"} gap={1}>
              <Typography>{item.pdf_file_name}</Typography>
              <Typography color={item.status === "completed" ? "success" : "warning"} fontSize={"12px"}>
                {item.status}
              </Typography>
            </Box>
            <Typography color={"textSecondary"}>{new Date(item.created_at).toLocaleString()}</Typography>
          </Box>
          {index < history.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </Box>
  );
};

export default UploadHistory;
