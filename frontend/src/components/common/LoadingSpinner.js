import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingSpinner = ({ message = 'Cargando...' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: 2,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress
          size={80}
          thickness={4}
          sx={{
            color: 'primary.main',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            fontSize: '2rem',
          }}
        >
          🎒
        </Box>
      </Box>
      <Typography
        variant="h6"
        sx={{
          color: 'primary.main',
          fontWeight: 700,
          animation: 'pulse 1.5s ease-in-out infinite',
          '@keyframes pulse': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.5 },
          },
        }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingSpinner;
