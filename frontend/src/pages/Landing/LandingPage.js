import React, { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Box, Button, Chip, Container, Dialog, DialogContent, DialogTitle, Grid, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

import axiosInstance from '../../api/axios';
import { NewsContentBlocks, NewsCoverMedia } from '../../components/News/NewsRichContent';
import Footer from '../../components/Layout/Footer';
import { buildDefaultHeroSlides, landingPageDefaults, mergeLandingPageConfig } from '../../constants/landingPageDefaults';
import { detectNewsMediaKind } from '../../utils/news';

const stepVisuals = [
  { number: 1, color: '#4ECDC4', label: '01' },
  { number: 2, color: '#FF6B6B', label: '02' },
  { number: 3, color: '#56CCF2', label: '03' },
];

const aboutCardColors = ['#4ECDC4', '#FF6B6B', '#56CCF2', '#FFD93D'];

const placeholderNews = [
  {
    id: 'placeholder-1',
    title: 'Nuevos anuncios muy pronto',
    summary: 'Aqui se publicaran novedades, actividades destacadas y anuncios importantes del programa.',
    content: '',
    image_url: '',
    cover_media_type: 'image',
    content_blocks: [],
    published_at: new Date().toISOString(),
  },
  {
    id: 'placeholder-2',
    title: 'Comparte avances del programa',
    summary: 'Aqui podras destacar logros, eventos y anuncios importantes para docentes y familias.',
    content: '',
    image_url: '',
    cover_media_type: 'image',
    content_blocks: [],
    published_at: new Date().toISOString(),
  },
  {
    id: 'placeholder-3',
    title: 'Espacio para novedades',
    summary: 'Esta seccion mostrara siempre las noticias mas recientes y relevantes para la comunidad educativa.',
    content: '',
    image_url: '',
    cover_media_type: 'image',
    content_blocks: [],
    published_at: new Date().toISOString(),
  },
];

const formatNewsDate = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
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
  const [selectedNews, setSelectedNews] = useState(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const deferredSlideIndex = useDeferredValue(activeSlideIndex);

  useEffect(() => {
    let isMounted = true;
    Promise.allSettled([axiosInstance.get('/landing-page/'), axiosInstance.get('/news/')]).then(([landingResponse, newsResponse]) => {
      if (!isMounted) return;
      setLandingContent(landingResponse.status === 'fulfilled' ? mergeLandingPageConfig(landingResponse.value.data) : landingPageDefaults);
      setNews(newsResponse.status === 'fulfilled' ? newsResponse.value.data || [] : []);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!location.hash) return undefined;
    const target = document.getElementById(location.hash.replace('#', ''));
    if (!target) return undefined;
    const timeoutId = window.setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    return () => window.clearTimeout(timeoutId);
  }, [location.hash]);

  const heroSlides = useMemo(() => (landingContent.hero_slides?.length ? landingContent.hero_slides : buildDefaultHeroSlides(landingContent)), [landingContent]);
  const activeSlide = heroSlides[deferredSlideIndex] || heroSlides[0];

  useEffect(() => {
    if (heroSlides.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      startTransition(() => {
        setActiveSlideIndex((previous) => (previous + 1) % heroSlides.length);
      });
    }, 6200);
    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  const newsSource = useMemo(() => {
    if (news.length === 0) return placeholderNews;
    if (news.length >= 3) return news;
    return [...news, ...placeholderNews.slice(0, 3 - news.length)];
  }, [news]);

  useEffect(() => {
    if (newsSource.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setCurrentNewsIndex((previous) => (previous + 1) % newsSource.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [newsSource.length]);

  const visibleNews = useMemo(() => {
    const cardsToShow = Math.min(3, newsSource.length);
    return Array.from({ length: cardsToShow }, (_, offset) => newsSource[(currentNewsIndex + offset) % newsSource.length]);
  }, [currentNewsIndex, newsSource]);

  const aboutCards = [
    { title: landingContent.about_card_1_title, value: landingContent.about_card_1_value, color: aboutCardColors[0] },
    { title: landingContent.about_card_2_title, value: landingContent.about_card_2_value, color: aboutCardColors[1] },
    { title: landingContent.about_card_3_title, value: landingContent.about_card_3_value, color: aboutCardColors[2] },
    { title: landingContent.about_card_4_title, value: landingContent.about_card_4_value, color: aboutCardColors[3] },
  ];

  const steps = stepVisuals.map((step, index) => ({
    ...step,
    title: landingContent[`step_${index + 1}_title`],
    desc: landingContent[`step_${index + 1}_description`],
  }));

  const handleHeroAction = (url, fallback) => {
    const target = (url || fallback || '').trim();
    if (!target) return;
    if (target.startsWith('http://') || target.startsWith('https://')) {
      window.open(target, '_blank', 'noopener,noreferrer');
      return;
    }
    if (target.startsWith('/inicio#')) {
      navigate({ pathname: '/inicio', hash: target.replace('/inicio', '') });
      return;
    }
    if (target.startsWith('#')) {
      navigate({ pathname: '/inicio', hash: target });
      return;
    }
    navigate(target);
  };

  return (
    <Box sx={{ overflowX: 'hidden', fontFamily: "'Nunito', sans-serif" }}>
      <Box
        id="inicio"
        sx={{
          position: 'relative',
          minHeight: { xs: '100vh', md: '100svh' },
          pt: { xs: 11, md: 13 },
          pb: { xs: 6, md: 7 },
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          background: `linear-gradient(135deg, ${activeSlide.background_start} 0%, ${activeSlide.background_end} 100%)`,
          transition: 'background 650ms ease',
        }}
      >
        <Box sx={{ position: 'absolute', inset: 0 }}>
          {heroSlides.map((slide, index) => (
            <Box key={`${slide.title}-${index}`} sx={{ position: 'absolute', inset: 0, opacity: deferredSlideIndex === index ? 1 : 0, transition: 'opacity 700ms ease', background: `linear-gradient(135deg, ${slide.background_start} 0%, ${slide.background_end} 100%)` }}>
              {slide.media_type === 'image' && slide.media_url && <Box sx={{ position: 'absolute', inset: 0, backgroundImage: `url(${slide.media_url})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.2, transform: 'scale(1.05)' }} />}
              {slide.media_type === 'video' && slide.media_url && <Box component="video" src={slide.media_url} poster={slide.poster_url || undefined} muted autoPlay loop playsInline sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.16, transform: 'scale(1.05)' }} />}
              <Box sx={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 12% 18%, rgba(255,255,255,0.14), transparent 18%), radial-gradient(circle at 86% 16%, ${slide.accent_color}40, transparent 18%), radial-gradient(circle at 72% 82%, rgba(255,255,255,0.12), transparent 20%), linear-gradient(110deg, ${slide.overlay_color} 0%, rgba(6,12,24,0.1) 100%)` }} />
            </Box>
          ))}
        </Box>
        <Box sx={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: { xs: '26px 26px', md: '38px 38px' }, maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.22), rgba(0,0,0,0.78) 18%, rgba(0,0,0,0.1) 100%)', opacity: 0.4 }} />
        <Container
          disableGutters
          sx={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            maxWidth: '1200px',
            mx: 'auto',
            px: { xs: 2, sm: 3, md: 4 },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-start',
            }}
          >
            <Box sx={{ width: '100%', maxWidth: { xs: '100%', md: 720, lg: 760 } }}>
              <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap', mb: 2.5 }}>
                <Chip label={activeSlide.eyebrow || 'Experiencia inmersiva'} sx={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.16)', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', backdropFilter: 'blur(16px)' }} />
                <Chip label={`${String(deferredSlideIndex + 1).padStart(2, '0')} / ${String(heroSlides.length).padStart(2, '0')}`} sx={{ background: 'rgba(8,16,30,0.34)', color: '#fff', border: '1px solid rgba(255,255,255,0.12)', fontWeight: 800 }} />
              </Box>
              <Typography variant="h1" sx={{ fontWeight: 900, fontSize: { xs: '2.75rem', sm: '3.7rem', md: '4.6rem', xl: '5rem' }, lineHeight: 0.96, color: '#fff', whiteSpace: 'pre-line', letterSpacing: '-0.04em', textShadow: '0 18px 40px rgba(4,10,24,0.34)' }}>
                {activeSlide.title}
              </Typography>
              <Typography sx={{ mt: 2.2, color: 'rgba(255,255,255,0.84)', fontSize: { xs: '1rem', md: '1.08rem' }, lineHeight: 1.8, maxWidth: 520 }}>
                {activeSlide.description}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.8, flexWrap: 'wrap', mt: 3.4 }}>
                <Button variant="contained" size="large" onClick={() => handleHeroAction(activeSlide.primary_button_url, '/register')} sx={{ background: '#FF6B6B', color: '#fff', fontWeight: 800, px: 4.6, py: 1.55, fontSize: '1rem', borderRadius: '999px', textTransform: 'none', boxShadow: '0 22px 44px rgba(255,107,107,0.28)', '&:hover': { background: '#ec5b5b', transform: 'translateY(-2px)', boxShadow: '0 24px 48px rgba(255,107,107,0.32)' } }}>
                  {activeSlide.primary_button_label || landingContent.hero_primary_button_label}
                </Button>
                <Button variant="contained" size="large" onClick={() => handleHeroAction(activeSlide.secondary_button_url, '/login')} sx={{ background: '#FFD93D', color: '#102246', fontWeight: 800, px: 4.6, py: 1.55, fontSize: '1rem', borderRadius: '999px', textTransform: 'none', boxShadow: '0 22px 44px rgba(255,217,61,0.24)', '&:hover': { background: '#f2ca2f', transform: 'translateY(-2px)', boxShadow: '0 24px 48px rgba(255,217,61,0.3)' } }}>
                  {activeSlide.secondary_button_label || landingContent.hero_secondary_button_label}
                </Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.1, flexWrap: 'wrap', mt: 3.2 }}>
                {(activeSlide.highlights || []).map((highlight) => (
                  <Chip key={highlight} label={highlight} sx={{ background: 'rgba(255,255,255,0.12)', color: '#fff', fontWeight: 800, border: '1px solid rgba(255,255,255,0.14)', backdropFilter: 'blur(12px)' }} />
                ))}
              </Box>
              <Box sx={{ display: 'flex', gap: 1.1, mt: 4.2, alignItems: 'center', flexWrap: 'wrap' }}>
                {heroSlides.map((slide, index) => (
                  <Button key={`${slide.title}-${index}-control`} onClick={() => startTransition(() => setActiveSlideIndex(index))} sx={{ minWidth: 0, p: 0, borderRadius: '16px', boxShadow: 'none', '&:hover': { background: 'transparent', boxShadow: 'none', transform: 'none' } }}>
                    <Box sx={{ width: deferredSlideIndex === index ? 120 : 58, height: 10, borderRadius: 999, background: deferredSlideIndex === index ? 'linear-gradient(90deg, #ffffff 0%, rgba(255,255,255,0.76) 100%)' : 'rgba(255,255,255,0.18)', transition: 'all 280ms ease' }} />
                  </Button>
                ))}
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>
      <Box id="quienes-somos" sx={{ py: { xs: 7, md: 9 }, background: '#fff', borderTop: '1px solid #eef2f6', borderBottom: '1px solid #eef2f6' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={5}>
              <Chip label={landingContent.about_chip_label} sx={{ background: '#E3F7F5', color: '#15857d', fontWeight: 800, mb: 2 }} />
              <Typography variant="h3" sx={{ fontWeight: 900, color: '#1a1a2e', fontSize: { xs: '1.9rem', md: '2.5rem' }, mb: 2 }}>
                {landingContent.about_title}
              </Typography>
              <Typography sx={{ color: 'text.secondary', lineHeight: 1.8, mb: 2.5 }}>{landingContent.about_description_1}</Typography>
              <Typography sx={{ color: 'text.secondary', lineHeight: 1.8 }}>{landingContent.about_description_2}</Typography>
            </Grid>
            <Grid item xs={12} md={7}>
              <Grid container spacing={2}>
                {aboutCards.map((item) => (
                  <Grid item xs={12} sm={6} key={`${item.title}-${item.value}`}>
                    <Box sx={{ background: '#fff9ec', borderRadius: '22px', p: 3, height: '100%', border: `1px solid ${item.color}55`, boxShadow: '0 10px 30px rgba(0,0,0,0.04)' }}>
                      <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: item.color, mb: 1 }}>{item.title}</Typography>
                      <Typography sx={{ fontWeight: 800, color: '#1a1a2e', lineHeight: 1.4 }}>{item.value}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Box id="noticias" sx={{ py: { xs: 8, md: 9 }, background: 'linear-gradient(180deg, #ffffff 0%, #f7fbff 100%)', borderTop: '1px solid #eef2f6', borderBottom: '1px solid #eef2f6' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-end', flexWrap: 'wrap', mb: 4 }}>
            <Box>
              <Chip label={landingContent.news_chip_label} sx={{ background: '#E9F2FF', color: '#2b7de9', fontWeight: 800, mb: 2 }} />
              <Typography variant="h3" sx={{ fontWeight: 900, color: '#1a1a2e', fontSize: { xs: '1.8rem', md: '2.4rem' }, mb: 1 }}>
                {landingContent.news_title}
              </Typography>
              <Typography sx={{ color: 'text.secondary', maxWidth: 660, lineHeight: 1.8 }}>{landingContent.news_description}</Typography>
            </Box>
            <Typography sx={{ color: '#2b7de9', fontWeight: 700 }}>{news.length > 0 ? `${news.length} noticias activas` : 'Sin noticias activas'}</Typography>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 3 }}>
            {visibleNews.map((item, index) => (
              <Box key={`${item.id}-${index}-${currentNewsIndex}`} sx={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', minWidth: 0, border: '1px solid rgba(16,24,40,0.08)', boxShadow: '0 18px 40px rgba(15,23,42,0.08)', display: 'flex', flexDirection: 'column' }}>
                <NewsCoverMedia item={item} height={190} sx={{ p: 2.5, display: 'flex', alignItems: 'flex-start' }}>
                  <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', height: '100%' }}>
                    <Chip label={formatNewsDate(item.published_at)} sx={{ background: 'rgba(255,255,255,0.92)', color: '#1a1a2e', fontWeight: 700 }} />
                    {detectNewsMediaKind(item.image_url, item.cover_media_type) === 'video' && (
                      <Chip label="Video" sx={{ background: 'rgba(8,16,30,0.72)', color: '#fff', fontWeight: 700 }} />
                    )}
                  </Box>
                </NewsCoverMedia>
                <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#1a1a2e', mb: 1.5, lineHeight: 1.35, minHeight: 58 }}>{item.title}</Typography>
                  <Typography sx={{ color: 'text.secondary', lineHeight: 1.75, flexGrow: 1, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.summary}</Typography>
                  <Button variant="text" onClick={() => setSelectedNews(item)} sx={{ alignSelf: 'flex-start', mt: 2, px: 0, color: '#2B7DE9', fontWeight: 800, textTransform: 'none', boxShadow: 'none', '&:hover': { background: 'transparent', boxShadow: 'none', transform: 'none', color: '#1565c0' } }}>
                    Ver mas
                  </Button>
                </Box>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      <Dialog open={Boolean(selectedNews)} onClose={() => setSelectedNews(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '24px', overflow: 'hidden' } }}>
        {selectedNews && (
          <>
            <NewsCoverMedia item={selectedNews} height={220}>
              <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', height: '100%' }}>
                <Chip label={formatNewsDate(selectedNews.published_at)} sx={{ background: 'rgba(255,255,255,0.92)', color: '#1a1a2e', fontWeight: 700 }} />
                {detectNewsMediaKind(selectedNews.image_url, selectedNews.cover_media_type) === 'video' && (
                  <Chip label="Video de portada" sx={{ background: 'rgba(8,16,30,0.72)', color: '#fff', fontWeight: 700 }} />
                )}
              </Box>
            </NewsCoverMedia>
            <DialogTitle sx={{ pb: 1, fontWeight: 900, color: '#1a1a2e' }}>{selectedNews.title}</DialogTitle>
            <DialogContent sx={{ pb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#10213a', mb: 2 }}>
                {selectedNews.summary}
              </Typography>
              <NewsContentBlocks item={{ ...selectedNews, content: selectedNews.content || null }} />
            </DialogContent>
          </>
        )}
      </Dialog>
      <Box id="pasos" sx={{ py: { xs: 8, md: 12 }, background: '#FFF9EC', position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', top: 60, left: -30, width: 100, height: 100, borderRadius: '50%', background: '#FF6B6B', opacity: 0.6 }} />
        <Box sx={{ position: 'absolute', bottom: '30%', right: '5%', width: 70, height: 70, borderRadius: '50%', background: '#FFD93D', opacity: 0.5 }} />
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography variant="h3" sx={{ fontWeight: 900, fontSize: { xs: '1.8rem', md: '2.5rem' }, color: '#1a1a2e' }}>
              {landingContent.steps_title}
            </Typography>
          </Box>
          <Grid container spacing={4}>
            {steps.map((step) => (
              <Grid item xs={12} md={4} key={step.number}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ width: 180, height: 180, borderRadius: '50%', background: `linear-gradient(135deg, ${step.color}33, ${step.color}66)`, mx: 'auto', mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', border: `3px solid ${step.color}` }}>
                    <Box sx={{ position: 'absolute', top: 0, left: 0, width: 44, height: 44, borderRadius: '50%', background: step.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '1rem' }}>{step.label}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '1.2rem', fontWeight: 900, color: step.color, maxWidth: 120, lineHeight: 1.2 }}>{step.title}</Typography>
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1, color: '#1a1a2e', fontSize: '1rem' }}>{step.title}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6, maxWidth: 260, mx: 'auto' }}>{step.desc}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
          <Box sx={{ textAlign: 'center', mt: 8 }}>
            <Button variant="contained" size="large" onClick={() => navigate('/register')} sx={{ background: '#FF6B6B', color: '#fff', fontWeight: 800, px: 6, py: 1.8, fontSize: '1.1rem', borderRadius: '30px', textTransform: 'none', boxShadow: '0 4px 15px rgba(255,107,107,0.4)', '&:hover': { background: '#e05555', transform: 'translateY(-2px)', boxShadow: '0 6px 20px rgba(255,107,107,0.5)' } }}>
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
