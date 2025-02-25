import React, { useState } from 'react';
import {IconButton, Zoom} from "@mui/material";
import Image from "next/image";

const CopyButton = ({text} : {text: string}) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const copyToClipboard = async () => {
    if (!navigator.clipboard) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setIsCopied(true);
        setTimeout(() => {
          setIsCopied(false);
        }, 3000);
      } catch (err) {
        console.error(err);
      } finally {
        document.body.removeChild(textArea);
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <IconButton onClick={copyToClipboard}>
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