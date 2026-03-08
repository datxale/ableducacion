import React from 'react';
import { Box, Container, Typography, Grid, Link, Divider } from '@mui/material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        background: '#fff',
        color: '#1a1a2e',
        pt: 5,
        pb: 3,
        mt: 'auto',
        borderTop: '1px solid #e0e0e0',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="flex-start">
          {/* Brand */}
          <Grid item xs={12} md={5}>
            <Box
              component="img"
              src="/logo.png"
              alt="ABL Educación"
              sx={{ height: 36, width: 'auto', mb: 1 }}
            />
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
              info@ableducacion.com
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
              WhatsApp: +51 929 220 076
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Lima, Perú
            </Typography>
          </Grid>

          {/* Links */}
          <Grid item xs={12} md={7}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: { xs: 'flex-start', md: 'flex-end' },
                alignItems: 'center',
                gap: 4,
                flexWrap: 'wrap',
              }}
            >
              <Link
                href="#"
                underline="hover"
                sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.9rem' }}
              >
                Términos y condiciones
              </Link>
              <Link
                href="#"
                underline="hover"
                sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.9rem' }}
              >
                Políticas de privacidad
              </Link>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3, borderColor: '#e0e0e0' }} />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            ABL Educación
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Todos los derechos reservados
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
