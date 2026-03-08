import React from 'react';
import { Box, Container, Typography, Grid, Link, IconButton } from '@mui/material';
import { WhatsApp, Email, Facebook, Instagram } from '@mui/icons-material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        background: 'linear-gradient(135deg, #1a237e 0%, #1565c0 50%, #2B7DE9 100%)',
        color: '#fff',
        pt: 6,
        pb: 4,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Brand & Info */}
          <Grid item xs={12} md={4}>
            <Box
              component="img"
              src="/logo.png"
              alt="ABL Educación"
              sx={{
                height: 40,
                width: 'auto',
                mb: 2,
                filter: 'brightness(0) invert(1)',
              }}
            />
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 0.5 }}>
              info@ableducacion.com
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 0.5 }}>
              WhatsApp: +51 929 220 076
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
              Lima, Perú
            </Typography>
            {/* Social icons */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                href="https://wa.me/51929220076"
                target="_blank"
                size="small"
                sx={{
                  color: '#fff',
                  background: 'rgba(255,255,255,0.15)',
                  '&:hover': { background: '#25D366' },
                }}
              >
                <WhatsApp fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                sx={{
                  color: '#fff',
                  background: 'rgba(255,255,255,0.15)',
                  '&:hover': { background: '#1877f2' },
                }}
              >
                <Facebook fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                sx={{
                  color: '#fff',
                  background: 'rgba(255,255,255,0.15)',
                  '&:hover': { background: '#e1306c' },
                }}
              >
                <Instagram fontSize="small" />
              </IconButton>
              <IconButton
                href="mailto:info@ableducacion.com"
                size="small"
                sx={{
                  color: '#fff',
                  background: 'rgba(255,255,255,0.15)',
                  '&:hover': { background: '#ea4335' },
                }}
              >
                <Email fontSize="small" />
              </IconButton>
            </Box>
          </Grid>

          {/* Links */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#fff' }}>
              Plataforma
            </Typography>
            {['Inicio', 'Grados', 'Clases en Vivo', 'Contacto'].map((item) => (
              <Typography
                key={item}
                variant="body2"
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  mb: 0.75,
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                  '&:hover': { color: '#fff' },
                }}
              >
                {item}
              </Typography>
            ))}
          </Grid>

          {/* Legal */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#fff' }}>
              Legal
            </Typography>
            <Link
              href="#"
              underline="none"
              sx={{
                display: 'block',
                color: 'rgba(255,255,255,0.7)',
                mb: 0.75,
                fontSize: '0.875rem',
                transition: 'color 0.2s',
                '&:hover': { color: '#fff' },
              }}
            >
              Términos y condiciones
            </Link>
            <Link
              href="#"
              underline="none"
              sx={{
                display: 'block',
                color: 'rgba(255,255,255,0.7)',
                mb: 0.75,
                fontSize: '0.875rem',
                transition: 'color 0.2s',
                '&:hover': { color: '#fff' },
              }}
            >
              Políticas de privacidad
            </Link>
          </Grid>
        </Grid>

        {/* Bottom bar */}
        <Box
          sx={{
            mt: 4,
            pt: 3,
            borderTop: '1px solid rgba(255,255,255,0.15)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            © {new Date().getFullYear()} ABL Educación
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Todos los derechos reservados
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
