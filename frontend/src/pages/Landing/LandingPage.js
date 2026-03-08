import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Rating,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Layout/Footer';

/* ──────────────────────────────────────────────
   Testimonials data
   ────────────────────────────────────────────── */
const mainTestimonial = {
  quote:
    'ABL Educación me permite innovar en mis clases cada día',
  rating: 5,
  role: 'Docente de primaria, Lima',
};

const testimonials = [
  {
    quote:
      'Con ABL Educación, las matemáticas ya no son difíciles. Ahora disfruto aprendiendo y resolviendo los desafíos.',
    rating: 5,
    role: 'Estudiante de 5.° grado, Arequipa',
  },
  {
    quote:
      'Este programa nos ayuda a alinear nuestras clases y metas con el Currículo Nacional, mientras impulsamos el uso de tecnología.',
    rating: 5,
    role: 'Director de una institución educativa, Cusco',
  },
  {
    quote:
      'ABL Educación nos apoya mucho al monitorear el progreso de nuestros estudiantes, permitiéndonos tomar decisiones basadas en datos reales.',
    rating: 5,
    role: 'Especialista pedagógico',
  },
];

/* ──────────────────────────────────────────────
   Steps data
   ────────────────────────────────────────────── */
const steps = [
  {
    number: 1,
    title: 'Crea tus aulas e inscribe a tus estudiantes',
    desc: 'Regístrate en ABL Educación, ingresa al Portal Docente e inscribe a tus estudiantes.',
    color: '#4ECDC4',
  },
  {
    number: 2,
    title: 'Descarguen e ingresen al aplicativo ABL Educación',
    desc: '¡Comparte con tus estudiantes sus usuarios y contraseñas e ingresen al app para empezar a aprender de manera divertida!',
    color: '#FF6B6B',
  },
  {
    number: 3,
    title: 'Revisa tus recursos y reportes',
    desc: 'Accede a videos pedagógicos, fichas curriculares, recomendaciones y reportes automáticos desde tu Portal Docente.',
    color: '#56CCF2',
  },
];

const allTestimonials = [mainTestimonial, ...testimonials];

const LandingPage = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % allTestimonials.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box sx={{ overflowX: 'hidden', fontFamily: "'Nunito', sans-serif" }}>

      {/* ═══════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════ */}
      <Box
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
        {/* Decorative circles */}
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
            {/* Left: Text content */}
            <Grid item xs={12} md={6}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 900,
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem', lg: '3.5rem' },
                  lineHeight: 1.15,
                  mb: 2,
                  color: '#1a1a2e',
                  fontStyle: 'italic',
                }}
              >
                Rompiendo barreras,{' '}
                <Box component="span" sx={{ display: 'block' }}>
                  impulsando aprendizajes
                </Box>
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(0,0,0,0.7)',
                  mb: 4,
                  lineHeight: 1.7,
                  fontSize: { xs: '0.95rem', md: '1.05rem' },
                  maxWidth: 450,
                }}
              >
                Con <strong>ABL Educación</strong>, nuestros estudiantes pueden acceder a
                nuevas actividades de matemática cada semana y resolverlas sin conexión
                permanente a internet.
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
                  🔽 Descargar app
                </Button>
              </Box>
            </Grid>

            {/* Right: Illustration / Image placeholder */}
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Box
                  component="img"
                  src="/logo-circulo.png"
                  alt="ABL Educación"
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

      {/* ═══════════════════════════════════════════
          TESTIMONIALS CAROUSEL
          ═══════════════════════════════════════════ */}
      <Box sx={{ py: { xs: 8, md: 12 }, background: '#FFF9EC' }}>
        <Container maxWidth="lg">
          {/* Carousel track */}
          <Box sx={{ overflow: 'hidden' }}>
            <Box
              sx={{
                display: 'flex',
                transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: `translateX(-${currentSlide * (100 / 3)}%)`,
              }}
            >
              {/* Duplicate items for infinite loop effect */}
              {[...allTestimonials, ...allTestimonials].map((t, i) => (
                <Box
                  key={i}
                  sx={{
                    flex: { xs: '0 0 100%', sm: '0 0 50%', md: '0 0 33.333%' },
                    px: 1.5,
                    boxSizing: 'border-box',
                  }}
                >
                  <Box
                    sx={{
                      background: '#fff',
                      borderRadius: '20px',
                      p: { xs: 3, md: 4 },
                      textAlign: 'center',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                      border: '1px solid rgba(0,0,0,0.04)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      minHeight: 260,
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: { xs: '0.95rem', md: '1.05rem' },
                        lineHeight: 1.7,
                        mb: 3,
                        fontStyle: 'italic',
                        color: '#1a1a2e',
                      }}
                    >
                      &ldquo;{t.quote}&rdquo;
                    </Typography>
                    <Rating
                      value={t.rating}
                      readOnly
                      size="small"
                      sx={{ mb: 1.5, mx: 'auto', '& .MuiRating-icon': { color: '#FFD93D' } }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 700, color: 'text.primary', fontSize: '0.85rem' }}
                    >
                      {t.role}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Dots indicator */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 4 }}>
            {allTestimonials.map((_, i) => (
              <Box
                key={i}
                onClick={() => setCurrentSlide(i)}
                sx={{
                  width: currentSlide === i ? 28 : 10,
                  height: 10,
                  borderRadius: '5px',
                  background: currentSlide === i ? '#2B7DE9' : 'rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </Box>
        </Container>
      </Box>

      {/* ═══════════════════════════════════════════
          PARTNERS / SUPPORTERS SECTION
          ═══════════════════════════════════════════ */}
      <Box sx={{ py: 6, background: '#fff', borderTop: '1px solid #f0f0f0' }}>
        <Container maxWidth="md">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} sm={4}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 800, fontStyle: 'italic', mb: 1, color: '#1a1a2e' }}
              >
                Este programa es implementado por
              </Typography>
              <Typography
                variant="h5"
                sx={{ fontWeight: 900, color: '#4ECDC4', letterSpacing: 2 }}
              >
                ABL Educación
              </Typography>
            </Grid>
            <Grid item xs={12} sm={8}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 800, fontStyle: 'italic', mb: 2, color: '#1a1a2e' }}
              >
                Con el apoyo de
              </Typography>
              <Box sx={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                {['🏛️ MinEdu', '🌐 ONG Digital', '📚 FundaEdu'].map((partner) => (
                  <Typography
                    key={partner}
                    variant="body1"
                    sx={{ fontWeight: 700, color: '#666', fontSize: '1rem' }}
                  >
                    {partner}
                  </Typography>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ═══════════════════════════════════════════
          STEPS SECTION - "De manera divertida"
          ═══════════════════════════════════════════ */}
      <Box
        sx={{
          py: { xs: 8, md: 12 },
          background: '#FFF9EC',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
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
              ¡
              <Box component="span" sx={{ color: '#4ECDC4' }}>
                ABL
              </Box>{' '}
              <Box component="span" sx={{ color: '#FF6B6B' }}>
                Educación
              </Box>{' '}
              de manera
            </Typography>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 900,
                fontStyle: 'italic',
                fontSize: { xs: '1.8rem', md: '2.5rem' },
                color: '#1a1a2e',
              }}
            >
              divertida desde hoy!
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {steps.map((step) => (
              <Grid item xs={12} md={4} key={step.number}>
                <Box sx={{ textAlign: 'center' }}>
                  {/* Circular step image placeholder */}
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
                    {/* Step number badge */}
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
                      <Typography
                        sx={{ color: '#fff', fontWeight: 900, fontSize: '1.2rem' }}
                      >
                        {step.number}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '3.5rem' }}>
                      {step.number === 1 ? '👩‍🏫' : step.number === 2 ? '📱' : '📊'}
                    </Typography>
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

          {/* CTA Button */}
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

      {/* Footer */}
      <Footer />
    </Box>
  );
};

export default LandingPage;
