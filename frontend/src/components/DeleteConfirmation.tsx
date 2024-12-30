import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

interface DeleteConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title?: string;
  content?: string;
}

const DeleteConfirmation: React.FC<DeleteConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title = "",
  content = "",
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { borderRadius: "20px", padding: "8px" },
      }}
    >
      <DialogTitle fontWeight="bold">{title}</DialogTitle>
      <DialogContent>
        <Typography>{content}</Typography>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          sx={{ color: "#888", fontSize: "16px", textTransform: "none" }}
        >
          取消
        </Button>
        <Button
          onClick={async () => {
            await onConfirm();
            onClose();
          }}
          sx={{
            textTransform: "none",
            color: "red",
            fontWeight: "bold",
            fontSize: "16px",
          }}
        >
          刪除
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmation;
