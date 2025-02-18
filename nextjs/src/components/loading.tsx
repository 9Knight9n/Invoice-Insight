import React from "react";

const Loading: React.FC = () => {
  return (
    <video autoPlay loop muted playsInline width="100px" height="auto">
      <source src="/loading.webm" type="video/webm" />
    </video>
  );
};

export default Loading;
