import React from "react";

const Processing: React.FC = () => {
  return (
    <video autoPlay loop muted playsInline width="200px" height="auto">
      <source src="/processing.webm" type="video/webm" />
    </video>
  );
};

export default Processing;
