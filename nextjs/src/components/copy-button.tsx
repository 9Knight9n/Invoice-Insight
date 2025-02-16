import React, { useState } from 'react';
import {IconButton, Zoom} from "@mui/material";
import Image from "next/image";

const CopyButton = ({text} : {text: string}) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 3000);
    });
  };

  return (
    <IconButton onClick={handleCopy}>
      <Zoom in={isCopied} timeout={500}>
        <Image src="/images/check.svg" alt="Copied" width={16} height={16} style={{display: isCopied ? "block" : "none"}}/>
      </Zoom>
      <Zoom in={!isCopied} timeout={500}>
        <Image src="/images/copy.svg" alt="Copy" width={16} height={16} style={{display: isCopied ? "none" : "block"}}/>
      </Zoom>
    </IconButton>
  );
};

export default CopyButton;