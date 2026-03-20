import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import {
  ArrowBack,
  Article,
  Save,
  Web,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import axiosInstance from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  buildLandingPagePayload,
  landingPageDefaults,
  mergeLandingPageConfig,
} from '../../constants/landingPageDefaults';
import Footer from '../../components/Layout/Footer';

const sectionDefinitions = [
  {
    title: 'Navegacion publica',
    description: 'Textos del header publico y boton de ingreso.',
    fields: [
      { key: 'nav_home_label', label: 'Menu Inicio' },
      { key: 'nav_about_label', label: 'Menu Quienes Somos' },
      { key: 'nav_news_label', label: 'Menu Noticias' },
      { key: 'login_button_label', label: 'Boton Ingresar' },
    ],
  },
  {
    title: 'Hero principal',
    description: 'Bloque inicial de la landing.',
    fields: [
      { key: 'hero_title_line_1', label: 'Titulo linea 1' },
      { key: 'hero_title_line_2', label: 'Titulo linea 2' },
      { key: 'hero_description', label: 'Descripcion', multiline: true, rows: 4, md: 12 },
      { key: 'hero_primary_button_label', label: 'Boton principal' },
      { key: 'hero_secondary_button_label', label: 'Boton secundario' },
    ],
  },
  {
    title: 'Quienes Somos',
    description: 'Contenido del bloque institucional.',
    fields: [
      { key: 'about_chip_label', label: 'Etiqueta superior' },
      { key: 'about_title', label: 'Titulo', multiline: true, rows: 3, md: 12 },
      { key: 'about_description_1', label: 'Descripcion 1', multiline: true, rows: 4, md: 12 },
      { key: 'about_description_2', label: 'Descripcion 2', multiline: true, rows: 4, md: 12 },
      { key: 'about_card_1_title', label: 'Tarjeta 1 titulo' },
      { key: 'about_card_1_value', label: 'Tarjeta 1 valor' },
      { key: 'about_card_2_title', label: 'Tarjeta 2 titulo' },
      { key: 'about_card_2_value', label: 'Tarjeta 2 valor' },
      { key: 'about_card_3_title', label: 'Tarjeta 3 titulo' },
      { key: 'about_card_3_value', label: 'Tarjeta 3 valor' },
      { key: 'about_card_4_title', label: 'Tarjeta 4 titulo' },
      { key: 'about_card_4_value', label: 'Tarjeta 4 valor' },
    ],
  },
  {
    title: 'Pasos y llamada a la accion',
    description: 'Seccion de como funciona ABL Educacion.',
    fields: [
      { key: 'steps_title', label: 'Titulo de la seccion', multiline: true, rows: 3, md: 12 },
      { key: 'steps_button_label', label: 'Boton final' },
      { key: 'step_1_title', label: 'Paso 1 titulo' },
      { key: 'step_1_description', label: 'Paso 1 descripcion', multiline: true, rows: 4 },
      { key: 'step_2_title', label: 'Paso 2 titulo' },
      { key: 'step_2_description', label: 'Paso 2 descripcion', multiline: true, rows: 4 },
      { key: 'step_3_title', label: 'Paso 3 titulo' },
      { key: 'step_3_description', label: 'Paso 3 descripcion', multiline: true, rows: 4 },
    ],
  },
  {
    title: 'Cabecera de Noticias',
    description: 'Texto introductorio del bloque de noticias. Los posts se gestionan aparte.',
    fields: [
      { key: 'news_chip_label', label: 'Etiqueta superior' },
      { key: 'news_title', label: 'Titulo', multiline: true, rows: 3, md: 12 },
      { key: 'news_description', label: 'Descripcion', multiline: true, rows: 4, md: 12 },
    ],
  },
];

const ManageLandingPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(landingPageDefaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchLandingPage = async () => {
      try {
        const response = await axiosInstance.get('/landing-page/');
        setForm(mergeLandingPageConfig(response.data));
      } catch (err) {
        setError('Error al cargar la configuracion de la landing page');
      } finally {
        setLoading(false);
      }
    };

    fetchLandingPage();
  }, []);

  const handleChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = buildLandingPagePayload(form);
      const response = await axiosInstance.put('/landing-page/', payload);
      setForm(mergeLandingPageConfig(response.data));
      setSuccess('Configuracion de la landing page actualizada');
    } catch (err) {
      setError('Error al guardar la landing page');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Cargando configuracion de landing..." />;
  }

  return (
    <Box sx={{ background: '#f5f7fa', minHeight: '100vh' }}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1565c0 0%, #42a5f5 100%)',
          py: 5,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
          }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/admin')}
            sx={{
              color: '#fff',
              mb: 2,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 'none',
                transform: 'none',
                background: 'rgba(255,255,255,0.15)',
              },
            }}
          >
            Panel Admin
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '16px',
                  p: 1.5,
                  display: 'flex',
                }}
              >
                <Web sx={{ color: '#fff', fontSize: '2.5rem' }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#fff' }}>
                  Landing Page
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.92)' }}>
                  Administra todos los textos visibles de la pagina de inicio
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<Article />}
                onClick={() => navigate('/admin/news')}
                sx={{
                  background: 'rgba(255,255,255,0.16)',
                  color: '#fff',
                  fontWeight: 700,
                  '&:hover': { background: 'rgba(255,255,255,0.22)' },
                }}
              >
                Gestionar noticias
              </Button>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                disabled={saving}
                sx={{
                  background: '#fff',
                  color: '#1565c0',
                  fontWeight: 700,
                  '&:hover': { background: '#f7f7f7' },
                }}
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2, borderRadius: '12px' }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2, borderRadius: '12px' }}>
            {success}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {sectionDefinitions.map((section) => (
            <Paper
              key={section.title}
              sx={{
                p: { xs: 2.5, md: 3 },
                borderRadius: '20px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.07)',
              }}
            >
              <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
                {section.title}
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                {section.description}
              </Typography>

              <Grid container spacing={2}>
                {section.fields.map((field) => (
                  <Grid item xs={12} md={field.md || 6} key={field.key}>
                    <TextField
                      label={field.label}
                      fullWidth
                      multiline={field.multiline}
                      rows={field.rows}
                      value={form[field.key] || ''}
                      onChange={(event) => handleChange(field.key, event.target.value)}
                    />
                  </Grid>
                ))}
              </Grid>
            </Paper>
          ))}
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default ManageLandingPage;
