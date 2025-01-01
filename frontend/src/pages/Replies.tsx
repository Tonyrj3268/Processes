import React from "react";
import { Box, Typography } from "@mui/material";

const Replies: React.FC = () => {
  return (
    <Box>
      <Typography sx={{ color: "gray", textAlign: "center", mt: 2 }}>
        尚無回覆
      </Typography>
    </Box>
  );
};

export default Replies;
