import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

import axiosInstance from '../../api/axios';
import Footer from '../../components/Layout/Footer';

const steps = [
  {
    number: 1,
    title: 'Crea tus aulas e inscribe a tus estudiantes',
    desc: 'Registrate en ABL Educacion, ingresa al Portal Docente e inscribe a tus estudiantes.',
    color: '#4ECDC4',
    emoji: '👩‍🏫',
  },
  {
    number: 2,
    title: 'Descarguen e ingresen al aplicativo',
    desc: 'Comparte con tus estudiantes sus usuarios y contrasenas para empezar a aprender de manera divertida.',
    color: '#FF6B6B',
    emoji: '📱',
  },
  {
    number: 3,
    title: 'Revisa recursos y reportes',
    desc: 'Accede a videos pedagogicos, fichas curriculares y reportes automaticos desde tu portal.',
    color: '#56CCF2',
    emoji: '📊',
  },
];

const placeholderNews = [
  {
    id: 'placeholder-1',
    title: 'Nuevos anuncios muy pronto',
    summary: 'Aqui se publicaran novedades, actividades destacadas y anuncios importantes del programa.',
    content: '',
    image_url: '',
    published_at: new Date().toISOString(),
  },
  {
    id: 'placeholder-2',
    title: 'Comparte avances del programa',
    summary: 'Aqui podras destacar logros, eventos y anuncios importantes para docentes y familias.',
    content: '',
    image_url: '',
    published_at: new Date().toISOString(),
  },
  {
    id: 'placeholder-3',
    title: 'Espacio para novedades',
    summary: 'Esta seccion mostrara siempre las noticias mas recientes y relevantes para la comunidad educativa.',
    content: '',
    image_url: '',
    published_at: new Date().toISOString(),
  },
];

const formatNewsDate = (value) => {
  if (!value) {
    return '';
  }

  try {
    return new Date(value).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  } catch (error) {
    return value;
  }
};

const LandingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const [news, setNews] = useState([]);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);

  const visibleNewsCount = isMobile ? 1 : isTablet ? 2 : 3;
  const newsSource = news.length > 0 ? news : placeholderNews;

  useEffect(() => {
    let isMounted = true;

    axiosInstance.get('/news/')
      .then((response) => {
        if (isMounted) {
          setNews(response.data || []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setNews([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (newsSource.length <= 1) {
      return undefined;
    }

    const timer = setInterval(() => {
      setCurrentNewsIndex((prev) => (prev + 1) % newsSource.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [newsSource.length]);

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const elementId = location.hash.replace('#', '');
    const target = document.getElementById(elementId);

    if (!target) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);

    return () => window.clearTimeout(timeoutId);
  }, [location.hash]);

  const visibleNews = useMemo(() => {
    return Array.from({ length: visibleNewsCount }, (_, offset) => {
      const index = (currentNewsIndex + offset) % newsSource.length;
      return newsSource[index];
    });
  }, [currentNewsIndex, newsSource, visibleNewsCount]);

  return (
    <Box sx={{ overflowX: 'hidden', fontFamily: "'Nunito', sans-serif" }}>
      <Box
        id="inicio"
        sx={{
          background: 'linear-gradient(180deg, #4ECDC4 0%, #2AB7AD 100%)',
          position: 'relative',
          overflow: 'hidden',
          pt: { xs: 10, md: 12 },
          pb: { xs: 8, md: 10 },
          minHeight: { md: '80vh' },
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 40,
            left: 30,
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: '#5B6EE1',
            opacity: 0.8,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: 60,
            right: '35%',
            width: 50,
            height: 50,
            borderRadius: '50%',
            background: '#FF6B6B',
            opacity: 0.8,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            top: '40%',
            right: '45%',
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.3)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '20%',
            left: '10%',
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: '#FFD93D',
            opacity: 0.7,
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 900,
                  fontSize: { xs: '2rem', sm: '2.6rem', md: '3rem', lg: '3.5rem' },
                  lineHeight: 1.15,
                  mb: 2,
                  color: '#1a1a2e',
                  fontStyle: 'italic',
                }}
              >
                Rompiendo barreras,
                <Box component="span" sx={{ display: 'block' }}>
                  impulsando aprendizajes
                </Box>
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(0,0,0,0.72)',
                  mb: 4,
                  lineHeight: 1.7,
                  fontSize: { xs: '0.95rem', md: '1.05rem' },
                  maxWidth: 470,
                }}
              >
                Con <strong>ABL Educacion</strong>, nuestros estudiantes acceden a nuevas actividades de
                matematica cada semana y pueden aprender incluso con conectividad limitada.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/register')}
                  sx={{
                    background: '#FF6B6B',
                    color: '#fff',
                    fontWeight: 800,
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    borderRadius: '30px',
                    textTransform: 'none',
                    boxShadow: '0 4px 15px rgba(255,107,107,0.4)',
                    '&:hover': {
                      background: '#e05555',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(255,107,107,0.5)',
                    },
                  }}
                >
                  Registrarme
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/login')}
                  sx={{
                    background: '#FFD93D',
                    color: '#1a1a2e',
                    fontWeight: 800,
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    borderRadius: '30px',
                    textTransform: 'none',
                    boxShadow: '0 4px 15px rgba(255,217,61,0.4)',
                    '&:hover': {
                      background: '#f0c830',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(255,217,61,0.5)',
                    },
                  }}
                >
                  Descargar app
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Box
                  component="img"
                  src="/logo-circulo.png"
                  alt="ABL Educacion"
                  sx={{
                    width: { xs: 220, sm: 280, md: 320 },
                    height: 'auto',
                    filter: 'drop-shadow(0 8px 30px rgba(0,0,0,0.15))',
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box
        id="quienes-somos"
        sx={{
          py: { xs: 7, md: 9 },
          background: '#fff',
          borderTop: '1px solid #f0f0f0',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={5}>
              <Chip
                label="Quienes Somos"
                sx={{
                  background: '#E3F7F5',
                  color: '#15857d',
                  fontWeight: 800,
                  mb: 2,
                }}
              />
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  color: '#1a1a2e',
                  fontSize: { xs: '1.9rem', md: '2.5rem' },
                  mb: 2,
                }}
              >
                Tecnologia educativa con foco en resultados reales
              </Typography>
              <Typography sx={{ color: 'text.secondary', lineHeight: 1.8, mb: 2.5 }}>
                ABL Educacion acompana a docentes, directivos y estudiantes con recursos,
                seguimiento y reportes para fortalecer el aprendizaje de matematica.
              </Typography>
              <Typography sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                Combinamos actividades semanales, portal docente y analitica simple para
                tomar decisiones pedagogicas con informacion clara.
              </Typography>
            </Grid>
            <Grid item xs={12} md={7}>
              <Grid container spacing={2}>
                {[
                  { title: 'Implementado por', value: 'ABL Educacion', color: '#4ECDC4' },
                  { title: 'Enfoque', value: 'Aprendizaje aplicado y divertido', color: '#FF6B6B' },
                  { title: 'Cobertura', value: 'Aulas, directivos y familias', color: '#56CCF2' },
                  { title: 'Objetivo', value: 'Mejorar progreso y seguimiento', color: '#FFD93D' },
                ].map((item) => (
                  <Grid item xs={12} sm={6} key={item.title}>
                    <Box
                      sx={{
                        background: '#fff9ec',
                        borderRadius: '22px',
                        p: 3,
                        height: '100%',
                        border: `1px solid ${item.color}55`,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
                      }}
                    >
                      <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: item.color, mb: 1 }}>
                        {item.title}
                      </Typography>
                      <Typography sx={{ fontWeight: 800, color: '#1a1a2e', lineHeight: 1.4 }}>
                        {item.value}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box
        sx={{
          py: { xs: 8, md: 12 },
          background: '#FFF9EC',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 60,
            left: -30,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: '#FF6B6B',
            opacity: 0.6,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '30%',
            right: '5%',
            width: 70,
            height: 70,
            borderRadius: '50%',
            background: '#FFD93D',
            opacity: 0.5,
          }}
        />

        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 900,
                fontSize: { xs: '1.8rem', md: '2.5rem' },
                color: '#1a1a2e',
              }}
            >
              ABL Educacion de manera divertida desde hoy
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {steps.map((step) => (
              <Grid item xs={12} md={4} key={step.number}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 180,
                      height: 180,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${step.color}33, ${step.color}66)`,
                      mx: 'auto',
                      mb: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      border: `3px solid ${step.color}`,
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: step.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '1.2rem' }}>
                        {step.number}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '3.5rem' }}>{step.emoji}</Typography>
                  </Box>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 800, mb: 1, color: '#1a1a2e', fontSize: '1rem' }}
                  >
                    {step.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'text.secondary',
                      lineHeight: 1.6,
                      maxWidth: 260,
                      mx: 'auto',
                    }}
                  >
                    {step.desc}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              sx={{
                background: '#FF6B6B',
                color: '#fff',
                fontWeight: 800,
                px: 6,
                py: 1.8,
                fontSize: '1.1rem',
                borderRadius: '30px',
                textTransform: 'none',
                boxShadow: '0 4px 15px rgba(255,107,107,0.4)',
                '&:hover': {
                  background: '#e05555',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(255,107,107,0.5)',
                },
              }}
            >
              Registrarme
            </Button>
          </Box>
        </Container>
      </Box>

      <Box
        id="noticias"
        sx={{
          py: { xs: 8, md: 10 },
          background: 'linear-gradient(180deg, #ffffff 0%, #f7fbff 100%)',
          borderTop: '1px solid #eef2f6',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-end', flexWrap: 'wrap', mb: 4 }}>
            <Box>
              <Chip
                label="Noticias"
                sx={{
                  background: '#E9F2FF',
                  color: '#2b7de9',
                  fontWeight: 800,
                  mb: 2,
                }}
              />
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  color: '#1a1a2e',
                  fontSize: { xs: '1.8rem', md: '2.4rem' },
                  mb: 1,
                }}
              >
                Ultimas novedades de ABL Educacion
              </Typography>
              <Typography sx={{ color: 'text.secondary', maxWidth: 660, lineHeight: 1.8 }}>
                Revisa anuncios, actividades destacadas y novedades recientes de ABL Educacion.
              </Typography>
            </Box>
            <Typography sx={{ color: '#2b7de9', fontWeight: 700 }}>
              {news.length > 0 ? `${news.length} noticias activas` : 'Sin noticias activas'}
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {visibleNews.map((item, index) => (
              <Grid item xs={12} sm={visibleNewsCount === 1 ? 12 : 6} md={4} key={`${item.id}-${index}-${currentNewsIndex}`}>
                <Box
                  sx={{
                    background: '#fff',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    height: '100%',
                    border: '1px solid rgba(16,24,40,0.08)',
                    boxShadow: '0 18px 40px rgba(15,23,42,0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Box
                    sx={{
                      height: 190,
                      background: item.image_url
                        ? `linear-gradient(180deg, rgba(17,24,39,0.08), rgba(17,24,39,0.5)), url(${item.image_url})`
                        : 'linear-gradient(135deg, #4ECDC4 0%, #2B7DE9 100%)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      position: 'relative',
                      p: 2.5,
                      display: 'flex',
                      alignItems: 'flex-start',
                    }}
                  >
                    <Chip
                      label={formatNewsDate(item.published_at)}
                      sx={{
                        background: 'rgba(255,255,255,0.92)',
                        color: '#1a1a2e',
                        fontWeight: 700,
                      }}
                    />
                  </Box>

                  <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 800,
                        color: '#1a1a2e',
                        mb: 1.5,
                        lineHeight: 1.35,
                        minHeight: 58,
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography
                      sx={{
                        color: 'text.secondary',
                        lineHeight: 1.75,
                        flexGrow: 1,
                        display: '-webkit-box',
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {item.summary}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>

          {newsSource.length > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 4 }}>
              {newsSource.map((_, index) => (
                <Box
                  key={`dot-${index}`}
                  onClick={() => setCurrentNewsIndex(index)}
                  sx={{
                    width: currentNewsIndex === index ? 28 : 10,
                    height: 10,
                    borderRadius: 999,
                    background: currentNewsIndex === index ? '#2B7DE9' : 'rgba(43,125,233,0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.25s ease',
                  }}
                />
              ))}
            </Box>
          )}
        </Container>
      </Box>

      <Footer />
    </Box>
  );
};

export default LandingPage;
