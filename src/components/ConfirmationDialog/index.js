import React from 'react';
import Dialog from "@mui/material/Dialog";
import Button from "@mui/material/Button";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
function ConfirmationDialog(props) {
  const { open, onClose, title, message, onConfirm, isNoButton, item} = props;

  const handleClose = () => {
    onClose();
  };

  const handleConfirm = (v) => {
    onConfirm(v);
    handleClose();
  };

  return (
    <Dialog maxWidth={"xs"}
    fullWidth={true} open={open} onClose={handleClose} aria-labelledby="confirmation-dialog-title">
      <DialogTitle id="confirmation-dialog-title">{title}</DialogTitle>
      <DialogContent>{message}</DialogContent>
      <DialogActions>
       { isNoButton? <Button onClick={handleClose} variant='contained'  color="primary">
          No
        </Button> :''}
        <Button  onClick={() => handleConfirm(item)} variant='contained'  color="warning" autoFocus>
          Yes
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmationDialog;
