import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  Breadcrumbs,
  Link,
  Chip,
  Avatar,
} from '@mui/material';
import { Home, CalendarViewWeek, ArrowForward } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Footer from '../../components/Layout/Footer';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const weekColors = [
  { bg: 'linear-gradient(135deg, #FF6B6B, #FF8E53)', shadow: 'rgba(255,107,107,0.4)' },
  { bg: 'linear-gradient(135deg, #4ECDC4, #44A08D)', shadow: 'rgba(78,205,196,0.4)' },
  { bg: 'linear-gradient(135deg, #A770EF, #CF8BF3)', shadow: 'rgba(167,112,239,0.4)' },
  { bg: 'linear-gradient(135deg, #f7971e, #ffd200)', shadow: 'rgba(247,151,30,0.4)' },
];

const weekEmojis = ['🗓️', '📅', '📆', '🗒️'];

const MonthPage = () => {
  const { subjectId, month } = useParams();
  const navigate = useNavigate();

  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSubject = async () => {
      try {
        const res = await axiosInstance.get(`/subjects/${subjectId}/`);
        setSubject(res.data);
      } catch (err) {
        setError('Error al cargar la materia.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubject();
  }, [subjectId]);

  if (loading) return <LoadingSpinner message="Cargando semanas..." />;

  const monthName = MONTHS[parseInt(month) - 1] || `Mes ${month}`;

  return (
    <Box sx={{ background: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #ff9800 0%, #ffd200 100%)',
          py: 6,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
          }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Breadcrumbs sx={{ mb: 2 }} separator="›">
            <Link
              component="button"
              onClick={() => navigate('/dashboard')}
              sx={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.9rem', '&:hover': { color: '#fff' } }}
            >
              <Home sx={{ fontSize: '1rem', mr: 0.5, verticalAlign: 'middle' }} />
              Dashboard
            </Link>
            <Link
              component="button"
              onClick={() => navigate('/grades')}
              sx={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.9rem', '&:hover': { color: '#fff' } }}
            >
              Grados
            </Link>
            <Link
              component="button"
              onClick={() => navigate(`/subjects/${subjectId}`)}
              sx={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.9rem', '&:hover': { color: '#fff' } }}
            >
              {subject?.name || 'Materia'}
            </Link>
            <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
              {monthName}
            </Typography>
          </Breadcrumbs>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                background: 'rgba(255,255,255,0.25)',
                borderRadius: '16px',
                p: 1.5,
                display: 'flex',
              }}
            >
              <CalendarViewWeek sx={{ color: '#fff', fontSize: '2.5rem' }} />
            </Box>
            <Box>
              <Typography variant="h3" fontWeight={800} sx={{ color: '#fff', lineHeight: 1 }}>
                {monthName}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.5 }}>
                {subject?.name} - Elige una semana para ver las actividades
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 5 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
            Semanas de {monthName} 📅
          </Typography>
          <Typography color="text.secondary">
            Selecciona una semana para acceder a las fichas y videos
          </Typography>
        </Box>

        <Grid container spacing={3} justifyContent="center">
          {[1, 2, 3, 4].map((week) => {
            const colorSet = weekColors[week - 1];
            const emoji = weekEmojis[week - 1];
            return (
              <Grid item xs={12} sm={6} md={3} key={week}>
                <Card
                  onClick={() =>
                    navigate(`/subjects/${subjectId}/month/${month}/week/${week}`)
                  }
                  sx={{
                    cursor: 'pointer',
                    background: colorSet.bg,
                    borderRadius: '24px',
                    textAlign: 'center',
                    boxShadow: `0 8px 32px ${colorSet.shadow}`,
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    '&:hover': {
                      transform: 'translateY(-10px) scale(1.04)',
                      boxShadow: `0 24px 64px ${colorSet.shadow}`,
                    },
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: 200,
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -20,
                      right: -20,
                      width: 100,
                      height: 100,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.12)',
                    }}
                  />
                  <CardContent sx={{ py: 4, position: 'relative', zIndex: 1 }}>
                    <Typography sx={{ fontSize: '3rem', mb: 1 }}>{emoji}</Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        color: '#fff',
                        fontWeight: 900,
                        textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                        mb: 0.5,
                      }}
                    >
                      Semana {week}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 500, mb: 2 }}
                    >
                      Fichas y videos
                    </Typography>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        background: 'rgba(255,255,255,0.25)',
                        borderRadius: '20px',
                        px: 2,
                        py: 0.75,
                      }}
                    >
                      <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700 }}>
                        Ver actividades
                      </Typography>
                      <ArrowForward sx={{ color: '#fff', fontSize: '1rem' }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Info cards */}
        <Grid container spacing={2} sx={{ mt: 4 }}>
          {[
            { icon: '📄', label: 'Fichas PDF', desc: 'Material imprimible para trabajar', color: '#1976d2' },
            { icon: '🎬', label: 'Videos', desc: 'Explicaciones y tutoriales', color: '#e91e63' },
            { icon: '✅', label: 'Progreso', desc: 'Marca actividades completadas', color: '#4caf50' },
          ].map((item) => (
            <Grid item xs={12} sm={4} key={item.label}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2.5,
                  background: '#fff',
                  borderRadius: '16px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                  border: `2px solid ${item.color}22`,
                }}
              >
                <Typography sx={{ fontSize: '2rem' }}>{item.icon}</Typography>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: item.color }}>
                    {item.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.desc}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Footer />
    </Box>
  );
};

export default MonthPage;
