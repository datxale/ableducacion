import React from 'react';
import { Box, Button, Container, Divider, Grid, IconButton, Link, Typography } from '@mui/material';
import { Email, WhatsApp } from '@mui/icons-material';

import { CONTACT_INFO, getWhatsAppUrl } from '../../config/contact';

const companyLinks = [
  { label: 'Inicio', href: '/inicio' },
  { label: 'Quienes somos', href: '/inicio#quienes-somos' },
  { label: 'Noticias y eventos', href: '/inicio#noticias' },
  { label: 'Ingresar', href: '/login' },
];

const supportLinks = [
  { label: 'Terminos y condiciones', href: '#' },
  { label: 'Politicas de privacidad', href: '#' },
];

const Footer = () => (
  <Box
    component="footer"
    sx={{
      mt: 'auto',
      background:
        'radial-gradient(circle at top left, rgba(66,165,245,0.35), transparent 30%), linear-gradient(135deg, #072b64 0%, #0d47a1 52%, #1976d2 100%)',
      color: '#fff',
      pt: { xs: 6, md: 8 },
      pb: 4,
    }}
  >
    <Container maxWidth="lg">
      <Grid container spacing={4}>
        <Grid item xs={12} md={5}>
          <Box component="img" src="/logo.png" alt="ABL Educacion" sx={{ height: 42, mb: 2, filter: 'brightness(0) invert(1)' }} />
          <Typography sx={{ maxWidth: 420, color: 'rgba(255,255,255,0.84)', lineHeight: 1.7, mb: 2 }}>
            Plataforma educativa para clases, materiales, noticias, seguimiento academico y comunicacion entre estudiantes, docentes y administracion.
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.84)' }}>
            Correo: {CONTACT_INFO.email}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.84)' }}>
            WhatsApp: {CONTACT_INFO.whatsappLabel}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.84)', mb: 2 }}>
            {CONTACT_INFO.location}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              href={`mailto:${CONTACT_INFO.email}`}
              sx={{ textTransform: 'none', background: '#fff', color: '#0d47a1', '&:hover': { background: '#e3f2fd' } }}
            >
              Contactar empresa
            </Button>
            <Button
              variant="outlined"
              href={getWhatsAppUrl('Hola, necesito soporte sobre ABL Educacion.')}
              target="_blank"
              rel="noreferrer"
              sx={{ textTransform: 'none', color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }}
            >
              Soporte por WhatsApp
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
            Empresa
          </Typography>
          {companyLinks.map((item) => (
            <Link key={item.label} href={item.href} underline="none" sx={{ display: 'block', color: 'rgba(255,255,255,0.76)', mb: 1.1 }}>
              {item.label}
            </Link>
          ))}
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
            Datos y soporte
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.76)', mb: 1 }}>
            Atencion digital para estudiantes, docentes, familias y direccion academica.
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.76)', mb: 1 }}>
            Horario sugerido de soporte: lunes a viernes de 8:00 a.m. a 6:00 p.m.
          </Typography>
          {supportLinks.map((item) => (
            <Link key={item.label} href={item.href} underline="none" sx={{ display: 'block', color: 'rgba(255,255,255,0.76)', mb: 1 }}>
              {item.label}
            </Link>
          ))}
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <IconButton
              href={getWhatsAppUrl('Hola, deseo comunicarme con ABL Educacion.')}
              target="_blank"
              rel="noreferrer"
              sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.12)' }}
            >
              <WhatsApp fontSize="small" />
            </IconButton>
            <IconButton href={`mailto:${CONTACT_INFO.email}`} sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.12)' }}>
              <Email fontSize="small" />
            </IconButton>
          </Box>
        </Grid>
      </Grid>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.16)', my: 4 }} />

      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.68)' }}>
          © {new Date().getFullYear()} ABL Educacion. Plataforma y soporte institucional.
        </Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.68)' }}>
          Todos los derechos reservados.
        </Typography>
      </Box>
    </Container>
  </Box>
);

export default Footer;
