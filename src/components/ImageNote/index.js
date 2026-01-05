import React, { useState } from 'react';
import { 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Stack, 
  Avatar,
  Divider,
  Box,
  IconButton,
  Chip,
  Dialog,
  DialogContent
} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';


// Enhanced ImageNote Component
const ImageNote = ({ imageUrl }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Box
        sx={{
          position: 'relative',
          display: 'inline-block',
          borderRadius: 2,
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'scale(1.02)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
          '&:hover .zoom-icon': {
            opacity: 1
          }
        }}
        onClick={() => setOpen(true)}
      >
        <img
          src={imageUrl}
          alt="Note attachment"
          style={{
            width: '250px',
            height: 'auto',
            display: 'block',
            borderRadius: '8px',
            border: '1px solid #e0e0e0'
          }}
        />
        <Box
          className="zoom-icon"
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'rgba(0,0,0,0.7)',
            borderRadius: '50%',
            p: 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transition: 'opacity 0.3s ease'
          }}
        >
          <ZoomInIcon sx={{ fontSize: 20, color: 'white' }} />
        </Box>
      </Box>

      <Dialog 
        open={open} 
        onClose={() => setOpen(false)}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: { 
            position: 'relative',
            margin: 2,
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: 'calc(100vh - 32px)',
            bgcolor: 'rgba(0,0,0,0.95)'
          }
        }}
      >
        <IconButton
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            bgcolor: 'rgba(255,255,255,0.9)',
            zIndex: 1,
            '&:hover': { bgcolor: 'rgba(255,255,255,1)' }
          }}
          onClick={() => setOpen(false)}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent 
          sx={{ 
            p: 0, 
            bgcolor: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          <img
            src={imageUrl}
            alt="Full size"
            style={{ 
              maxWidth: '100%', 
              maxHeight: 'calc(100vh - 32px)',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              display: 'block'
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
export default ImageNote;