import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add,
  ArrowBack,
  ArrowDownward,
  ArrowUpward,
  Article,
  CloudUpload,
  DeleteOutline,
  Save,
  Web,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import axiosInstance from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  buildDefaultHeroSlides,
  buildLandingPagePayload,
  landingPageDefaults,
  mergeLandingPageConfig,
} from '../../constants/landingPageDefaults';
import Footer from '../../components/Layout/Footer';
import { uploadFile } from '../../utils/uploads';

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

const mediaTypeOptions = [
  { value: 'scene', label: 'Escena grafica' },
  { value: 'image', label: 'Imagen' },
  { value: 'video', label: 'Video' },
];

const buildNewSlide = (form, index) => {
  const defaults = buildDefaultHeroSlides(form);
  const fallback = defaults[Math.min(index, defaults.length - 1)] || defaults[0];
  return {
    ...fallback,
    highlights: [...(fallback.highlights || [])],
  };
};

const splitHighlights = (value) =>
  value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 4);

const ManageLandingPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState(landingPageDefaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState('');
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

  const slides = useMemo(() => form.hero_slides || [], [form.hero_slides]);

  const handleChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSlideChange = (index, key, value) => {
    setForm((prev) => ({
      ...prev,
      hero_slides: prev.hero_slides.map((slide, slideIndex) => (
        slideIndex === index
          ? {
              ...slide,
              [key]: value,
            }
          : slide
      )),
    }));
  };

  const handleAddSlide = () => {
    setForm((prev) => ({
      ...prev,
      hero_slides: [...prev.hero_slides, buildNewSlide(prev, prev.hero_slides.length)],
    }));
  };

  const handleRemoveSlide = (index) => {
    setForm((prev) => {
      if (prev.hero_slides.length <= 1) {
        return prev;
      }

      return {
        ...prev,
        hero_slides: prev.hero_slides.filter((_, slideIndex) => slideIndex !== index),
      };
    });
  };

  const handleMoveSlide = (index, direction) => {
    setForm((prev) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.hero_slides.length) {
        return prev;
      }

      const reordered = [...prev.hero_slides];
      const [current] = reordered.splice(index, 1);
      reordered.splice(nextIndex, 0, current);

      return {
        ...prev,
        hero_slides: reordered,
      };
    });
  };

  const handleSlideUpload = async (index, field, file) => {
    if (!file) {
      return;
    }

    setUploadingKey(`${index}-${field}`);
    setError('');
    setSuccess('');

    try {
      const uploaded = await uploadFile(file, 'landing-hero');
      const updates = {
        [field]: uploaded.url,
      };

      if (field === 'media_url') {
        if (file.type.startsWith('video/')) {
          updates.media_type = 'video';
        } else if (file.type.startsWith('image/')) {
          updates.media_type = 'image';
        }
      }

      setForm((prev) => ({
        ...prev,
        hero_slides: prev.hero_slides.map((slide, slideIndex) => (
          slideIndex === index
            ? {
                ...slide,
                ...updates,
              }
            : slide
        )),
      }));
      setSuccess('Archivo del slider subido correctamente');
    } catch (err) {
      setError('No se pudo subir el archivo del slider');
    } finally {
      setUploadingKey('');
    }
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
          background: 'linear-gradient(135deg, #0f2f56 0%, #1d8bf1 55%, #6be7e0 100%)',
          py: 5,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              radial-gradient(circle at 10% 15%, rgba(255,255,255,0.18), transparent 18%),
              radial-gradient(circle at 88% 18%, rgba(255, 107, 107, 0.28), transparent 16%),
              linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)
            `,
            backgroundSize: 'auto, auto, 34px 34px, 34px 34px',
            opacity: 0.7,
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
                background: 'rgba(255,255,255,0.12)',
              },
            }}
          >
            Panel Admin
          </Button>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              flexWrap: 'wrap',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  background: 'rgba(255,255,255,0.18)',
                  borderRadius: '18px',
                  p: 1.6,
                  display: 'flex',
                  backdropFilter: 'blur(18px)',
                }}
              >
                <Web sx={{ color: '#fff', fontSize: '2.5rem' }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#fff' }}>
                  Landing Page
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Administra el slider de portada, el header publico y los bloques institucionales.
                </Typography>
              </Box>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button
                variant="contained"
                startIcon={<Article />}
                onClick={() => navigate('/admin/news')}
                sx={{
                  background: 'rgba(255,255,255,0.14)',
                  color: '#fff',
                  fontWeight: 700,
                  '&:hover': { background: 'rgba(255,255,255,0.2)' },
                }}
              >
                Gestionar noticias
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/inicio')}
                sx={{
                  background: 'rgba(255,255,255,0.14)',
                  color: '#fff',
                  fontWeight: 700,
                  '&:hover': { background: 'rgba(255,255,255,0.2)' },
                }}
              >
                Ver landing
              </Button>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSave}
                disabled={saving}
                sx={{
                  background: '#fff',
                  color: '#0f2f56',
                  fontWeight: 800,
                  '&:hover': { background: '#f7f9fb' },
                }}
              >
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </Stack>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2, borderRadius: '14px' }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2, borderRadius: '14px' }}>
            {success}
          </Alert>
        )}

        <Paper
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: '24px',
            boxShadow: '0 20px 50px rgba(15, 34, 70, 0.08)',
            mb: 3,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: { xs: 'flex-start', md: 'center' },
              justifyContent: 'space-between',
              gap: 2,
              flexWrap: 'wrap',
              mb: 2.5,
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 0.5 }}>
                Slider de portada
              </Typography>
              <Typography color="text.secondary">
                Cada slide puede usar imagen, video o escena grafica. El header publico se renderiza transparente por encima del slider.
              </Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
              <Chip
                label={`${slides.length} slides activos`}
                sx={{ fontWeight: 700, background: '#E6F7FF', color: '#0f5ea8' }}
              />
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddSlide}
                disabled={slides.length >= 6}
                sx={{
                  background: '#0f8cff',
                  fontWeight: 700,
                  '&:hover': { background: '#0c7adf' },
                }}
              >
                Agregar slide
              </Button>
            </Stack>
          </Box>

          <Stack spacing={2.5}>
            {slides.map((slide, index) => (
              <Paper
                key={`slide-${index}`}
                sx={{
                  p: { xs: 2, md: 2.5 },
                  borderRadius: '22px',
                  border: '1px solid rgba(15, 34, 70, 0.08)',
                  boxShadow: 'none',
                  background: '#fcfdff',
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    minHeight: { xs: 220, md: 250 },
                    borderRadius: '20px',
                    overflow: 'hidden',
                    mb: 2.5,
                    p: { xs: 2.5, md: 3.5 },
                    display: 'flex',
                    alignItems: 'flex-end',
                    background: `linear-gradient(135deg, ${slide.background_start} 0%, ${slide.background_end} 100%)`,
                  }}
                >
                  {slide.media_type === 'image' && slide.media_url && (
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `url(${slide.media_url})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        transform: 'scale(1.03)',
                      }}
                    />
                  )}
                  {slide.media_type === 'video' && slide.media_url && (
                    <Box
                      component="video"
                      src={slide.media_url}
                      poster={slide.poster_url || undefined}
                      muted
                      autoPlay
                      loop
                      playsInline
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: 'scale(1.03)',
                      }}
                    />
                  )}
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      background: `linear-gradient(110deg, ${slide.overlay_color} 0%, rgba(5, 11, 24, 0.18) 100%)`,
                    }}
                  />
                  <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 560 }}>
                    <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap' }}>
                      <Chip
                        label={`Slide ${index + 1}`}
                        sx={{
                          background: 'rgba(255,255,255,0.16)',
                          color: '#fff',
                          fontWeight: 800,
                          backdropFilter: 'blur(12px)',
                        }}
                      />
                      <Chip
                        label={mediaTypeOptions.find((item) => item.value === slide.media_type)?.label || 'Escena grafica'}
                        sx={{
                          background: 'rgba(255,255,255,0.12)',
                          color: '#fff',
                          fontWeight: 700,
                          backdropFilter: 'blur(12px)',
                        }}
                      />
                    </Stack>
                    <Typography
                      sx={{
                        fontWeight: 900,
                        color: '#fff',
                        fontSize: { xs: '1.65rem', md: '2.35rem' },
                        lineHeight: 1.05,
                        whiteSpace: 'pre-line',
                        textShadow: '0 12px 32px rgba(6, 12, 24, 0.35)',
                      }}
                    >
                      {slide.title || 'Titulo del slide'}
                    </Typography>
                    <Typography
                      sx={{
                        mt: 1.2,
                        color: 'rgba(255,255,255,0.86)',
                        maxWidth: 520,
                        lineHeight: 1.75,
                      }}
                    >
                      {slide.description || 'Agrega una descripcion para este slide.'}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
                      {(slide.highlights || []).map((item) => (
                        <Chip
                          key={`${item}-${index}`}
                          label={item}
                          sx={{
                            background: 'rgba(255,255,255,0.1)',
                            color: '#fff',
                            border: '1px solid rgba(255,255,255,0.14)',
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 1,
                    flexWrap: 'wrap',
                    mb: 2,
                  }}
                >
                  <Typography fontWeight={800}>
                    Contenido editable del slide {index + 1}
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      startIcon={<ArrowUpward />}
                      disabled={index === 0}
                      onClick={() => handleMoveSlide(index, -1)}
                    >
                      Subir
                    </Button>
                    <Button
                      size="small"
                      startIcon={<ArrowDownward />}
                      disabled={index === slides.length - 1}
                      onClick={() => handleMoveSlide(index, 1)}
                    >
                      Bajar
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteOutline />}
                      disabled={slides.length <= 1}
                      onClick={() => handleRemoveSlide(index)}
                    >
                      Eliminar
                    </Button>
                  </Stack>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Etiqueta superior"
                      fullWidth
                      value={slide.eyebrow || ''}
                      onChange={(event) => handleSlideChange(index, 'eyebrow', event.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <TextField
                      label="Titulo"
                      fullWidth
                      multiline
                      rows={3}
                      value={slide.title || ''}
                      onChange={(event) => handleSlideChange(index, 'title', event.target.value)}
                      helperText="Usa salto de linea para separar el titulo principal."
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Descripcion"
                      fullWidth
                      multiline
                      rows={4}
                      value={slide.description || ''}
                      onChange={(event) => handleSlideChange(index, 'description', event.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Boton principal"
                      fullWidth
                      value={slide.primary_button_label || ''}
                      onChange={(event) => handleSlideChange(index, 'primary_button_label', event.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="URL boton principal"
                      fullWidth
                      value={slide.primary_button_url || ''}
                      onChange={(event) => handleSlideChange(index, 'primary_button_url', event.target.value)}
                      helperText="Ej: /register, /login o https://..."
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="Boton secundario"
                      fullWidth
                      value={slide.secondary_button_label || ''}
                      onChange={(event) => handleSlideChange(index, 'secondary_button_label', event.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      label="URL boton secundario"
                      fullWidth
                      value={slide.secondary_button_url || ''}
                      onChange={(event) => handleSlideChange(index, 'secondary_button_url', event.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      label="Tipo de media"
                      select
                      fullWidth
                      value={slide.media_type || 'scene'}
                      onChange={(event) => handleSlideChange(index, 'media_type', event.target.value)}
                    >
                      {mediaTypeOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <TextField
                      label="Highlights"
                      fullWidth
                      multiline
                      rows={3}
                      value={(slide.highlights || []).join('\n')}
                      onChange={(event) => handleSlideChange(index, 'highlights', splitHighlights(event.target.value))}
                      helperText="Un highlight por linea. Se muestran hasta 4."
                    />
                  </Grid>
                  <Grid item xs={12} md={7}>
                    <TextField
                      label="URL media"
                      fullWidth
                      value={slide.media_url || ''}
                      onChange={(event) => handleSlideChange(index, 'media_url', event.target.value)}
                      helperText="Si no hay media, el slide usa la capa grafica."
                    />
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2}>
                      <Button
                        component="label"
                        variant="outlined"
                        startIcon={<CloudUpload />}
                        disabled={Boolean(uploadingKey)}
                      >
                        {uploadingKey === `${index}-media_url` ? 'Subiendo...' : 'Subir media'}
                        <input
                          hidden
                          type="file"
                          accept="image/*,video/*"
                          onChange={(event) => handleSlideUpload(index, 'media_url', event.target.files?.[0])}
                        />
                      </Button>
                      <Button
                        component="label"
                        variant="outlined"
                        startIcon={<CloudUpload />}
                        disabled={Boolean(uploadingKey)}
                      >
                        {uploadingKey === `${index}-poster_url` ? 'Subiendo...' : 'Subir poster'}
                        <input
                          hidden
                          type="file"
                          accept="image/*"
                          onChange={(event) => handleSlideUpload(index, 'poster_url', event.target.files?.[0])}
                        />
                      </Button>
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Poster de video"
                      fullWidth
                      value={slide.poster_url || ''}
                      onChange={(event) => handleSlideChange(index, 'poster_url', event.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Capa overlay"
                      fullWidth
                      value={slide.overlay_color || ''}
                      onChange={(event) => handleSlideChange(index, 'overlay_color', event.target.value)}
                      helperText="Usa rgba(...) para controlar la oscuridad del texto."
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      spacing={2}
                      divider={<Divider flexItem orientation="vertical" />}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" color="text.secondary">
                          Color inicial
                        </Typography>
                        <TextField
                          type="color"
                          value={slide.background_start || '#081B36'}
                          onChange={(event) => handleSlideChange(index, 'background_start', event.target.value)}
                          sx={{ width: 96 }}
                        />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" color="text.secondary">
                          Color final
                        </Typography>
                        <TextField
                          type="color"
                          value={slide.background_end || '#1B8DFF'}
                          onChange={(event) => handleSlideChange(index, 'background_end', event.target.value)}
                          sx={{ width: 96 }}
                        />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="caption" color="text.secondary">
                          Color acento
                        </Typography>
                        <TextField
                          type="color"
                          value={slide.accent_color || '#7CF4FF'}
                          onChange={(event) => handleSlideChange(index, 'accent_color', event.target.value)}
                          sx={{ width: 96 }}
                        />
                      </Box>
                    </Stack>
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Stack>
        </Paper>

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
