import React from 'react';
import { Box, Container, Typography, Grid, Link, IconButton, Divider } from '@mui/material';
import { WhatsApp, Facebook, Instagram, Email, MenuBook } from '@mui/icons-material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        background: 'linear-gradient(135deg, #1a237e 0%, #1565c0 100%)',
        color: '#fff',
        pt: 6,
        pb: 3,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Brand */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box
                sx={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  p: 1,
                  mr: 1.5,
                }}
              >
                <MenuBook sx={{ color: '#fff', fontSize: '2rem' }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.1 }}>
                  ABL Educacion
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Aprendiendo juntos
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>
              Plataforma educativa dedicada a proporcionar recursos de aprendizaje
              de alta calidad para niños de 6 a 11 años.
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <IconButton
                sx={{
                  color: '#fff',
                  background: 'rgba(255,255,255,0.15)',
                  '&:hover': { background: '#25D366' },
                }}
                href="https://wa.me/1234567890"
                target="_blank"
              >
                <WhatsApp />
              </IconButton>
              <IconButton
                sx={{
                  color: '#fff',
                  background: 'rgba(255,255,255,0.15)',
                  '&:hover': { background: '#1877f2' },
                }}
              >
                <Facebook />
              </IconButton>
              <IconButton
                sx={{
                  color: '#fff',
                  background: 'rgba(255,255,255,0.15)',
                  '&:hover': { background: '#e1306c' },
                }}
              >
                <Instagram />
              </IconButton>
              <IconButton
                sx={{
                  color: '#fff',
                  background: 'rgba(255,255,255,0.15)',
                  '&:hover': { background: '#ea4335' },
                }}
                href="mailto:info@ableducacion.com"
              >
                <Email />
              </IconButton>
            </Box>
          </Grid>

          {/* Links */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Plataforma
            </Typography>
            {['Inicio', 'Quienes Somos', 'Grados', 'Clases en Vivo', 'Contacto'].map((item) => (
              <Typography
                key={item}
                variant="body2"
                sx={{
                  color: 'rgba(255,255,255,0.75)',
                  mb: 0.75,
                  cursor: 'pointer',
                  '&:hover': { color: '#fff' },
                  transition: 'color 0.2s',
                }}
              >
                {item}
              </Typography>
            ))}
          </Grid>

          {/* Grades */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Grados
            </Typography>
            {['1° Grado', '2° Grado', '3° Grado', '4° Grado', '5° Grado', '6° Grado'].map((grade) => (
              <Typography
                key={grade}
                variant="body2"
                sx={{
                  color: 'rgba(255,255,255,0.75)',
                  mb: 0.75,
                  cursor: 'pointer',
                  '&:hover': { color: '#fff' },
                  transition: 'color 0.2s',
                }}
              >
                {grade}
              </Typography>
            ))}
          </Grid>

          {/* Contact */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
              Contacto
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WhatsApp sx={{ color: '#25D366', fontSize: '1.2rem' }} />
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    WhatsApp Principal
                  </Typography>
                  <Link
                    href="https://wa.me/1234567890"
                    target="_blank"
                    sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', textDecoration: 'none', '&:hover': { color: '#fff' } }}
                  >
                    +1 (234) 567-890
                  </Link>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WhatsApp sx={{ color: '#25D366', fontSize: '1.2rem' }} />
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    WhatsApp Soporte
                  </Typography>
                  <Link
                    href="https://wa.me/0987654321"
                    target="_blank"
                    sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', textDecoration: 'none', '&:hover': { color: '#fff' } }}
                  >
                    +0 (987) 654-321
                  </Link>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Email sx={{ color: '#ea4335', fontSize: '1.2rem' }} />
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    Email
                  </Typography>
                  <Link
                    href="mailto:info@ableducacion.com"
                    sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', textDecoration: 'none', '&:hover': { color: '#fff' } }}
                  >
                    info@ableducacion.com
                  </Link>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.2)' }} />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            © {new Date().getFullYear()} ABL Educacion. Todos los derechos reservados.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Typography
              variant="body2"
              sx={{ color: 'rgba(255,255,255,0.7)', cursor: 'pointer', '&:hover': { color: '#fff' } }}
            >
              Privacidad
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: 'rgba(255,255,255,0.7)', cursor: 'pointer', '&:hover': { color: '#fff' } }}
            >
              Terminos
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
