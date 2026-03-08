import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Paper,
  IconButton,
  Fade,
  Slide,
} from '@mui/material';
import {
  School,
  VideoCall,
  MenuBook,
  EmojiEvents,
  WhatsApp,
  ArrowForward,
  Star,
  Groups,
  Lightbulb,
  Favorite,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Layout/Footer';
import { gradeColors } from '../../styles/theme';

const gradeItems = [
  { label: '1° Grado', icon: '🌟', desc: 'Primeros pasos' },
  { label: '2° Grado', icon: '🚀', desc: 'Explorando' },
  { label: '3° Grado', icon: '🎨', desc: 'Creatividad' },
  { label: '4° Grado', icon: '🦁', desc: 'Valientes' },
  { label: '5° Grado', icon: '🌈', desc: 'Creciendo' },
  { label: '6° Grado', icon: '🏆', desc: 'Campeones' },
];

const features = [
  {
    icon: <MenuBook sx={{ fontSize: '2.5rem' }} />,
    title: 'Fichas Didácticas',
    desc: 'Material educativo descargable en PDF para cada grado y materia.',
    color: '#1976d2',
    bg: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
  },
  {
    icon: <VideoCall sx={{ fontSize: '2.5rem' }} />,
    title: 'Videos Educativos',
    desc: 'Videos explicativos y de refuerzo para cada tema.',
    color: '#e91e63',
    bg: 'linear-gradient(135deg, #fce4ec, #f8bbd9)',
  },
  {
    icon: <School sx={{ fontSize: '2.5rem' }} />,
    title: 'Clases en Vivo',
    desc: 'Sesiones interactivas con docentes en tiempo real.',
    color: '#4caf50',
    bg: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
  },
  {
    icon: <EmojiEvents sx={{ fontSize: '2.5rem' }} />,
    title: 'Seguimiento de Progreso',
    desc: 'Monitorea el avance y logros de tus estudiantes.',
    color: '#ff9800',
    bg: 'linear-gradient(135deg, #fff3e0, #ffe0b2)',
  },
];

const stats = [
  { number: '500+', label: 'Estudiantes', icon: '👨‍🎓' },
  { number: '50+', label: 'Docentes', icon: '👩‍🏫' },
  { number: '1000+', label: 'Actividades', icon: '📚' },
  { number: '100+', label: 'Clases en Vivo', icon: '🎥' },
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <Box sx={{ overflowX: 'hidden' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1a237e 0%, #1565c0 40%, #1976d2 70%, #42a5f5 100%)',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          pt: 8,
        }}
      >
        {/* Decorative floating circles */}
        {[...Array(8)].map((_, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)',
              width: [80, 120, 60, 200, 100, 150, 90, 70][i],
              height: [80, 120, 60, 200, 100, 150, 90, 70][i],
              top: [`${10 + i * 10}%`],
              left: i % 2 === 0 ? `${i * 12}%` : 'auto',
              right: i % 2 !== 0 ? `${i * 8}%` : 'auto',
              animation: `float${i} ${3 + i * 0.5}s ease-in-out infinite alternate`,
              '@keyframes float0': { '0%': { transform: 'translateY(0px)' }, '100%': { transform: 'translateY(-20px)' } },
              '@keyframes float1': { '0%': { transform: 'translateY(0px)' }, '100%': { transform: 'translateY(-15px)' } },
              '@keyframes float2': { '0%': { transform: 'translateY(0px)' }, '100%': { transform: 'translateY(-25px)' } },
              '@keyframes float3': { '0%': { transform: 'translateY(0px)' }, '100%': { transform: 'translateY(-10px)' } },
              '@keyframes float4': { '0%': { transform: 'translateY(0px)' }, '100%': { transform: 'translateY(-18px)' } },
              '@keyframes float5': { '0%': { transform: 'translateY(0px)' }, '100%': { transform: 'translateY(-22px)' } },
              '@keyframes float6': { '0%': { transform: 'translateY(0px)' }, '100%': { transform: 'translateY(-12px)' } },
              '@keyframes float7': { '0%': { transform: 'translateY(0px)' }, '100%': { transform: 'translateY(-16px)' } },
            }}
          />
        ))}

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Fade in={visible} timeout={1000}>
                <Box>
                  <Chip
                    label="🎓 Plataforma Educativa #1"
                    sx={{
                      background: 'rgba(255,255,255,0.2)',
                      color: '#fff',
                      fontWeight: 700,
                      mb: 2,
                      fontSize: '0.85rem',
                      backdropFilter: 'blur(10px)',
                    }}
                  />
                  <Typography
                    variant="h1"
                    sx={{
                      color: '#fff',
                      fontWeight: 900,
                      fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
                      lineHeight: 1.1,
                      mb: 2,
                      textShadow: '0 4px 20px rgba(0,0,0,0.2)',
                    }}
                  >
                    Aprender es{' '}
                    <Box
                      component="span"
                      sx={{
                        color: '#ffd200',
                        display: 'inline-block',
                        animation: 'bounce 2s ease-in-out infinite',
                        '@keyframes bounce': {
                          '0%, 100%': { transform: 'translateY(0)' },
                          '50%': { transform: 'translateY(-5px)' },
                        },
                      }}
                    >
                      Divertido
                    </Box>{' '}
                    y Maravilloso!
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'rgba(255,255,255,0.9)',
                      mb: 4,
                      lineHeight: 1.6,
                      fontWeight: 400,
                      fontSize: { xs: '1rem', md: '1.15rem' },
                    }}
                  >
                    Plataforma educativa para niños de 1° a 6° grado. Fichas,
                    videos, clases en vivo y mucho más para que aprender sea
                    una aventura increíble.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      size="large"
                      endIcon={<ArrowForward />}
                      onClick={() => navigate('/register')}
                      sx={{
                        background: 'linear-gradient(135deg, #ff9800, #ffd200)',
                        color: '#1a237e',
                        fontWeight: 800,
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        boxShadow: '0 8px 32px rgba(255,152,0,0.5)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #f57c00, #ff9800)',
                          boxShadow: '0 12px 40px rgba(255,152,0,0.6)',
                        },
                      }}
                    >
                      ¡Comenzar Gratis!
                    </Button>
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={() => navigate('/login')}
                      sx={{
                        color: '#fff',
                        borderColor: 'rgba(255,255,255,0.6)',
                        borderWidth: 2,
                        px: 4,
                        py: 1.5,
                        fontSize: '1.1rem',
                        boxShadow: 'none',
                        '&:hover': {
                          borderColor: '#fff',
                          background: 'rgba(255,255,255,0.1)',
                          transform: 'none',
                          boxShadow: 'none',
                        },
                      }}
                    >
                      Iniciar Sesión
                    </Button>
                  </Box>
                </Box>
              </Fade>
            </Grid>

            <Grid item xs={12} md={6}>
              <Fade in={visible} timeout={1500}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2,
                  }}
                >
                  {/* Fun illustration with emoji grid */}
                  <Box
                    sx={{
                      background: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(20px)',
                      borderRadius: '32px',
                      p: 4,
                      border: '1px solid rgba(255,255,255,0.2)',
                      textAlign: 'center',
                      maxWidth: 400,
                      width: '100%',
                    }}
                  >
                    <Typography sx={{ fontSize: '5rem', mb: 1, display: 'block' }}>
                      🏫
                    </Typography>
                    <Typography variant="h5" sx={{ color: '#fff', fontWeight: 800, mb: 1 }}>
                      ¡Bienvenido a ABL!
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 3 }}>
                      Tu plataforma de aprendizaje favorita
                    </Typography>
                    <Grid container spacing={1.5}>
                      {['📚 Fichas', '🎥 Videos', '👩‍🏫 Clases', '⭐ Logros'].map((item) => (
                        <Grid item xs={6} key={item}>
                          <Box
                            sx={{
                              background: 'rgba(255,255,255,0.15)',
                              borderRadius: '12px',
                              py: 1.5,
                              px: 1,
                              textAlign: 'center',
                            }}
                          >
                            <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
                              {item}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Box>
              </Fade>
            </Grid>
          </Grid>

          {/* Stats */}
          <Box sx={{ mt: 8, mb: 4 }}>
            <Grid container spacing={2}>
              {stats.map((stat) => (
                <Grid item xs={6} md={3} key={stat.label}>
                  <Box
                    sx={{
                      background: 'rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '16px',
                      p: 2.5,
                      textAlign: 'center',
                      border: '1px solid rgba(255,255,255,0.15)',
                    }}
                  >
                    <Typography sx={{ fontSize: '2rem', mb: 0.5 }}>{stat.icon}</Typography>
                    <Typography variant="h4" sx={{ color: '#ffd200', fontWeight: 900 }}>
                      {stat.number}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                      {stat.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Container>

        {/* Wave bottom */}
        <Box
          sx={{
            position: 'absolute',
            bottom: -1,
            left: 0,
            width: '100%',
            overflow: 'hidden',
            lineHeight: 0,
          }}
        >
          <svg viewBox="0 0 1200 120" style={{ display: 'block', width: '100%', height: '60px' }}>
            <path
              d="M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z"
              fill="#f5f7fa"
            />
          </svg>
        </Box>
      </Box>

      {/* Grades Section */}
      <Box sx={{ py: 10, background: '#f5f7fa' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Chip
              label="GRADOS ESCOLARES"
              sx={{ background: '#e3f2fd', color: '#1976d2', fontWeight: 700, mb: 2 }}
            />
            <Typography variant="h3" fontWeight={800} sx={{ mb: 1 }}>
              De 1° a 6° Grado
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
              Material educativo completo para todos los grados de primaria
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {gradeItems.map((grade, index) => {
              const colorSet = gradeColors[index];
              return (
                <Grid item xs={6} sm={4} md={2} key={grade.label}>
                  <Card
                    onClick={() => navigate('/register')}
                    sx={{
                      cursor: 'pointer',
                      background: colorSet.bg,
                      borderRadius: '24px',
                      textAlign: 'center',
                      p: 2,
                      boxShadow: `0 8px 32px ${colorSet.shadow}`,
                      transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                      '&:hover': {
                        transform: 'translateY(-8px) scale(1.05)',
                        boxShadow: `0 20px 60px ${colorSet.shadow}`,
                      },
                    }}
                  >
                    <Typography sx={{ fontSize: '3rem', mb: 1 }}>{grade.icon}</Typography>
                    <Typography variant="h6" sx={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>
                      {grade.label}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                      {grade.desc}
                    </Typography>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          <Box sx={{ textAlign: 'center', mt: 5 }}>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              onClick={() => navigate('/register')}
              sx={{ px: 5, py: 1.5 }}
            >
              Ver Todo el Contenido
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 10, background: '#fff' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Chip
              label="¿QUE OFRECEMOS?"
              sx={{ background: '#e8f5e9', color: '#4caf50', fontWeight: 700, mb: 2 }}
            />
            <Typography variant="h3" fontWeight={800} sx={{ mb: 1 }}>
              Todo lo que necesitas
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Recursos completos para docentes y estudiantes
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {features.map((feature) => (
              <Grid item xs={12} sm={6} md={3} key={feature.title}>
                <Card
                  sx={{
                    height: '100%',
                    background: feature.bg,
                    border: 'none',
                    borderTop: `4px solid ${feature.color}`,
                    p: 1,
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <Avatar
                      sx={{
                        bgcolor: feature.color,
                        width: 64,
                        height: 64,
                        mx: 'auto',
                        mb: 2,
                      }}
                    >
                      {React.cloneElement(feature.icon, { sx: { fontSize: '2rem', color: '#fff' } })}
                    </Avatar>
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Quienes Somos Section */}
      <Box
        sx={{
          py: 10,
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e3f2fd 100%)',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Chip
                label="QUIENES SOMOS"
                sx={{ background: '#fff3e0', color: '#ff9800', fontWeight: 700, mb: 2 }}
              />
              <Typography variant="h3" fontWeight={800} sx={{ mb: 2 }}>
                Nuestra Misión Educativa
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8 }}>
                Somos una plataforma educativa comprometida con el desarrollo integral de los niños
                de 6 a 11 años. Nuestro equipo de docentes especializados crea contenido didáctico
                de alta calidad, adaptado a cada grado escolar.
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.8 }}>
                Creemos que cada niño tiene el potencial de aprender y crecer. Por eso, combinamos
                metodologías modernas con recursos interactivos que hacen del aprendizaje una
                experiencia divertida y significativa.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[
                  { icon: <Star sx={{ color: '#ff9800' }} />, text: 'Docentes especializados en educacion primaria' },
                  { icon: <Lightbulb sx={{ color: '#9c27b0' }} />, text: 'Metodos de ensenanza innovadores y didacticos' },
                  { icon: <Groups sx={{ color: '#4caf50' }} />, text: 'Comunidad activa de estudiantes y docentes' },
                  { icon: <Favorite sx={{ color: '#e91e63' }} />, text: 'Aprendizaje con amor y dedicacion' },
                ].map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {item.icon}
                    <Typography variant="body1" fontWeight={500}>
                      {item.text}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 2,
                }}
              >
                {[
                  { emoji: '👩‍🏫', title: 'Docentes Expertos', desc: 'Profesionales apasionados' },
                  { emoji: '📚', title: 'Material Completo', desc: 'Fichas y videos por tema' },
                  { emoji: '🎯', title: 'Objetivos Claros', desc: 'Por grado y materia' },
                  { emoji: '🌟', title: 'Resultados Reales', desc: 'Progreso medible' },
                ].map((item, index) => (
                  <Paper
                    key={index}
                    elevation={0}
                    sx={{
                      p: 3,
                      textAlign: 'center',
                      borderRadius: '20px',
                      background: '#fff',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                      },
                    }}
                  >
                    <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>{item.emoji}</Typography>
                    <Typography variant="subtitle1" fontWeight={700}>
                      {item.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.desc}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          py: 10,
          background: 'linear-gradient(135deg, #ff9800 0%, #ff5722 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -80,
            left: -30,
            width: 250,
            height: 250,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }}
        />
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '4rem', mb: 2 }}>🚀</Typography>
          <Typography variant="h3" fontWeight={800} sx={{ color: '#fff', mb: 2 }}>
            ¡Empieza tu aventura hoy!
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', mb: 4 }}>
            Regístrate gratis y accede a cientos de recursos educativos
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              sx={{
                background: '#fff',
                color: '#ff5722',
                fontWeight: 800,
                px: 5,
                py: 1.5,
                fontSize: '1.1rem',
                '&:hover': {
                  background: '#f5f5f5',
                },
              }}
            >
              Registrarse Ahora
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<WhatsApp />}
              href="https://wa.me/1234567890"
              target="_blank"
              sx={{
                color: '#fff',
                borderColor: 'rgba(255,255,255,0.7)',
                borderWidth: 2,
                px: 4,
                py: 1.5,
                boxShadow: 'none',
                '&:hover': {
                  borderColor: '#fff',
                  background: 'rgba(255,255,255,0.15)',
                  transform: 'none',
                  boxShadow: 'none',
                },
              }}
            >
              Contactar por WhatsApp
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Contact Section */}
      <Box sx={{ py: 8, background: '#fff' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Typography variant="h4" fontWeight={800} sx={{ mb: 1 }}>
              Contáctanos
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Estamos aquí para ayudarte. Escríbenos por WhatsApp
            </Typography>
          </Box>
          <Grid container spacing={3} justifyContent="center">
            {[
              { phone: '+1 (234) 567-890', label: 'WhatsApp Principal', time: 'Lun-Vie 8am-6pm' },
              { phone: '+0 (987) 654-321', label: 'WhatsApp Soporte', time: 'Lun-Sab 9am-8pm' },
            ].map((contact) => (
              <Grid item xs={12} sm={6} md={4} key={contact.phone}>
                <Card
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    borderRadius: '20px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  }}
                >
                  <IconButton
                    href={`https://wa.me/${contact.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    sx={{
                      bgcolor: '#25D366',
                      color: '#fff',
                      width: 64,
                      height: 64,
                      mb: 2,
                      '&:hover': { bgcolor: '#128C7E' },
                    }}
                  >
                    <WhatsApp sx={{ fontSize: '2rem' }} />
                  </IconButton>
                  <Typography variant="h6" fontWeight={700}>
                    {contact.label}
                  </Typography>
                  <Typography variant="body1" color="primary" fontWeight={600}>
                    {contact.phone}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {contact.time}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
};

export default LandingPage;
