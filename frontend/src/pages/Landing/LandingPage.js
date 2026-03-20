import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Typography,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

import axiosInstance from '../../api/axios';
import Footer from '../../components/Layout/Footer';
import {
  landingPageDefaults,
  mergeLandingPageConfig,
} from '../../constants/landingPageDefaults';

const stepVisuals = [
  { number: 1, color: '#4ECDC4', emoji: '👩‍🏫' },
  { number: 2, color: '#FF6B6B', emoji: '📱' },
  { number: 3, color: '#56CCF2', emoji: '📊' },
];

const aboutCardColors = ['#4ECDC4', '#FF6B6B', '#56CCF2', '#FFD93D'];

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

  const [landingContent, setLandingContent] = useState(landingPageDefaults);
  const [news, setNews] = useState([]);
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);

  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([
      axiosInstance.get('/landing-page/'),
      axiosInstance.get('/news/'),
    ]).then(([landingResponse, newsResponse]) => {
      if (!isMounted) {
        return;
      }

      if (landingResponse.status === 'fulfilled') {
        setLandingContent(mergeLandingPageConfig(landingResponse.value.data));
      } else {
        setLandingContent(landingPageDefaults);
      }

      if (newsResponse.status === 'fulfilled') {
        setNews(newsResponse.value.data || []);
      } else {
        setNews([]);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!location.hash) {
      return undefined;
    }

    const elementId = location.hash.replace('#', '');
    const target = document.getElementById(elementId);

    if (!target) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);

    return () => window.clearTimeout(timeoutId);
  }, [location.hash]);

  const newsSource = useMemo(() => {
    if (news.length === 0) {
      return placeholderNews;
    }

    if (news.length >= 3) {
      return news;
    }

    return [...news, ...placeholderNews.slice(0, 3 - news.length)];
  }, [news]);

  useEffect(() => {
    if (newsSource.length <= 1) {
      return undefined;
    }

    const timer = setInterval(() => {
      setCurrentNewsIndex((prev) => (prev + 1) % newsSource.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [newsSource.length]);

  const visibleNews = useMemo(() => {
    const cardsToShow = Math.min(3, newsSource.length);

    return Array.from({ length: cardsToShow }, (_, offset) => {
      const index = (currentNewsIndex + offset) % newsSource.length;
      return newsSource[index];
    });
  }, [currentNewsIndex, newsSource]);

  const aboutCards = [
    {
      title: landingContent.about_card_1_title,
      value: landingContent.about_card_1_value,
      color: aboutCardColors[0],
    },
    {
      title: landingContent.about_card_2_title,
      value: landingContent.about_card_2_value,
      color: aboutCardColors[1],
    },
    {
      title: landingContent.about_card_3_title,
      value: landingContent.about_card_3_value,
      color: aboutCardColors[2],
    },
    {
      title: landingContent.about_card_4_title,
      value: landingContent.about_card_4_value,
      color: aboutCardColors[3],
    },
  ];

  const steps = stepVisuals.map((step, index) => ({
    ...step,
    title: landingContent[`step_${index + 1}_title`],
    desc: landingContent[`step_${index + 1}_description`],
  }));

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
                {landingContent.hero_title_line_1}
                <Box component="span" sx={{ display: 'block' }}>
                  {landingContent.hero_title_line_2}
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
                {landingContent.hero_description}
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
                  {landingContent.hero_primary_button_label}
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
                  {landingContent.hero_secondary_button_label}
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
                label={landingContent.about_chip_label}
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
                {landingContent.about_title}
              </Typography>
              <Typography sx={{ color: 'text.secondary', lineHeight: 1.8, mb: 2.5 }}>
                {landingContent.about_description_1}
              </Typography>
              <Typography sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                {landingContent.about_description_2}
              </Typography>
            </Grid>
            <Grid item xs={12} md={7}>
              <Grid container spacing={2}>
                {aboutCards.map((item) => (
                  <Grid item xs={12} sm={6} key={`${item.title}-${item.value}`}>
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
        id="noticias"
        sx={{
          py: { xs: 8, md: 9 },
          background: 'linear-gradient(180deg, #ffffff 0%, #f7fbff 100%)',
          borderTop: '1px solid #eef2f6',
          borderBottom: '1px solid #eef2f6',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-end', flexWrap: 'wrap', mb: 4 }}>
            <Box>
              <Chip
                label={landingContent.news_chip_label}
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
                {landingContent.news_title}
              </Typography>
              <Typography sx={{ color: 'text.secondary', maxWidth: 660, lineHeight: 1.8 }}>
                {landingContent.news_description}
              </Typography>
            </Box>
            <Typography sx={{ color: '#2b7de9', fontWeight: 700 }}>
              {news.length > 0 ? `${news.length} noticias activas` : 'Sin noticias activas'}
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(3, minmax(280px, 1fr))',
                md: 'repeat(3, minmax(0, 1fr))',
              },
              gap: 3,
              overflowX: { xs: 'auto', md: 'visible' },
              pb: { xs: 1.5, md: 0 },
              scrollSnapType: { xs: 'x proximity', md: 'none' },
              '&::-webkit-scrollbar': {
                height: 8,
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(43,125,233,0.25)',
                borderRadius: 999,
              },
            }}
          >
            {visibleNews.map((item, index) => (
              <Box
                key={`${item.id}-${index}-${currentNewsIndex}`}
                sx={{
                  background: '#fff',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  minWidth: 0,
                  border: '1px solid rgba(16,24,40,0.08)',
                  boxShadow: '0 18px 40px rgba(15,23,42,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  scrollSnapAlign: 'start',
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
            ))}
          </Box>

          {newsSource.length > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 4 }}>
              {newsSource.map((item, index) => (
                <Box
                  key={`dot-${item.id}-${index}`}
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
              {landingContent.steps_title}
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
              {landingContent.steps_button_label}
            </Button>
          </Box>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
};

export default LandingPage;
