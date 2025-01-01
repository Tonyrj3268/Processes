import React from "react";
import { Box, Typography } from "@mui/material";

const Reposts: React.FC = () => {
  return (
    <Box>
      <Typography sx={{ color: "gray", textAlign: "center", mt: 2 }}>
        尚未轉發內容
      </Typography>
    </Box>
  );
};

export default Reposts;
