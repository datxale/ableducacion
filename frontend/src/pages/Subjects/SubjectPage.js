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
  Button,
} from '@mui/material';
import { Home, CalendarMonth, ArrowForward } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Footer from '../../components/Layout/Footer';
import { monthColors } from '../../styles/theme';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const monthEmojis = ['❄️', '💝', '🌸', '🌷', '🌻', '☀️', '🌊', '🍎', '🍂', '🎃', '🍁', '🎄'];

const SubjectPage = () => {
  const { subjectId } = useParams();
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

  if (loading) return <LoadingSpinner message="Cargando materia..." />;

  const currentMonth = new Date().getMonth();

  return (
    <Box sx={{ background: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)',
          py: 6,
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
          <Breadcrumbs sx={{ mb: 2 }} separator="›">
            <Link
              component="button"
              onClick={() => navigate('/dashboard')}
              sx={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: '0.9rem', '&:hover': { color: '#fff' } }}
            >
              <Home sx={{ fontSize: '1rem', mr: 0.5, verticalAlign: 'middle' }} />
              Dashboard
            </Link>
            <Link
              component="button"
              onClick={() => navigate('/grades')}
              sx={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: '0.9rem', '&:hover': { color: '#fff' } }}
            >
              Grados
            </Link>
            {subject?.grade && (
              <Link
                component="button"
                onClick={() => navigate(`/grades/${subject.grade}`)}
                sx={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: '0.9rem', '&:hover': { color: '#fff' } }}
              >
                {subject.grade_name || `Grado ${subject.grade}`}
              </Link>
            )}
            <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
              {subject?.name || 'Materia'}
            </Typography>
          </Breadcrumbs>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '16px',
                p: 1.5,
                display: 'flex',
              }}
            >
              <CalendarMonth sx={{ color: '#fff', fontSize: '2.5rem' }} />
            </Box>
            <Box>
              <Typography variant="h3" fontWeight={800} sx={{ color: '#fff', lineHeight: 1 }}>
                {subject?.name || 'Materia'}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.5 }}>
                Selecciona el mes para ver las actividades
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
            Meses del año escolar 📅
          </Typography>
          <Typography color="text.secondary">
            Haz clic en un mes para ver las actividades por semana
          </Typography>
        </Box>

        <Grid container spacing={2.5}>
          {MONTHS.map((month, index) => {
            const isCurrentMonth = index === currentMonth;
            const background = monthColors[index];
            const emoji = monthEmojis[index];

            return (
              <Grid item xs={6} sm={4} md={3} key={month}>
                <Card
                  onClick={() => navigate(`/subjects/${subjectId}/month/${index + 1}`)}
                  sx={{
                    cursor: 'pointer',
                    background: background,
                    borderRadius: '20px',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    border: isCurrentMonth ? '3px solid #ffd200' : '3px solid transparent',
                    boxShadow: isCurrentMonth
                      ? '0 8px 32px rgba(255,210,0,0.4)'
                      : '0 4px 20px rgba(0,0,0,0.1)',
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    '&:hover': {
                      transform: 'translateY(-6px) scale(1.03)',
                      boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
                    },
                  }}
                >
                  {isCurrentMonth && (
                    <Chip
                      label="Actual"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: '#ffd200',
                        color: '#1a237e',
                        fontWeight: 700,
                        fontSize: '0.65rem',
                        height: 20,
                      }}
                    />
                  )}
                  <CardContent sx={{ py: 3 }}>
                    <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>{emoji}</Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        color: '#fff',
                        fontWeight: 800,
                        textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      }}
                    >
                      {month}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}
                    >
                      4 semanas
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>

      <Footer />
    </Box>
  );
};

export default SubjectPage;
