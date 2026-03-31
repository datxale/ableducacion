import React from 'react';
import { Box, Fab } from '@mui/material';

import { getWhatsAppUrl } from '../../config/contact';

const WhatsAppFab = ({ message = '', bottom = 24, right = 24 }) => (
  <Fab
    color="success"
    aria-label="WhatsApp"
    sx={{
      position: 'fixed',
      bottom,
      right,
      width: 64,
      height: 64,
      boxShadow: '0 6px 20px rgba(37,211,102,0.5)',
      '&:hover': {
        transform: 'scale(1.08)',
        boxShadow: '0 8px 28px rgba(37,211,102,0.6)',
      },
      transition: 'all 0.3s ease',
      zIndex: 1200,
    }}
    onClick={() => window.open(getWhatsAppUrl(message), '_blank', 'noopener,noreferrer')}
  >
    <Box sx={{ fontSize: '2rem', lineHeight: 1 }}>W</Box>
  </Fab>
);

export default WhatsAppFab;
