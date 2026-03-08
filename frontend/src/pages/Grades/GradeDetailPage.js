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
  Avatar,
  Chip,
} from '@mui/material';
import { Home, School, ArrowForward } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Footer from '../../components/Layout/Footer';
import { subjectColors, gradeColors } from '../../styles/theme';

const subjectIcons = ['📐', '📚', '🌍', '🔬', '🎨', '💻', '⚽', '🎵', '🌱', '🏛️'];

const GradeDetailPage = () => {
  const { gradeId } = useParams();
  const navigate = useNavigate();

  const [grade, setGrade] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gradeRes, subjectsRes] = await Promise.all([
          axiosInstance.get(`/grades/${gradeId}/`),
          axiosInstance.get(`/subjects/?grade=${gradeId}`),
        ]);
        setGrade(gradeRes.data);
        setSubjects(subjectsRes.data?.results || subjectsRes.data || []);
      } catch (err) {
        setError('Error al cargar la información del grado.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [gradeId]);

  if (loading) return <LoadingSpinner message="Cargando materias..." />;

  const gradeIndex = parseInt(gradeId) - 1;
  const colorSet = gradeColors[gradeIndex % gradeColors.length];

  return (
    <Box sx={{ background: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <Box
        sx={{
          background: colorSet.bg,
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
            width: 250,
            height: 250,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -60,
            left: -20,
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Breadcrumbs sx={{ mb: 2 }} separator="›">
            <Link
              component="button"
              onClick={() => navigate('/dashboard')}
              sx={{
                color: 'rgba(255,255,255,0.75)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                fontSize: '0.9rem',
                '&:hover': { color: '#fff' },
              }}
            >
              <Home sx={{ fontSize: '1rem' }} /> Dashboard
            </Link>
            <Link
              component="button"
              onClick={() => navigate('/grades')}
              sx={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: '0.9rem', '&:hover': { color: '#fff' } }}
            >
              Grados
            </Link>
            <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
              {grade?.name || `Grado ${gradeId}`}
            </Typography>
          </Breadcrumbs>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box
              sx={{
                background: 'rgba(255,255,255,0.25)',
                borderRadius: '20px',
                p: 2,
                fontSize: '3rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 80,
                height: 80,
              }}
            >
              {['🌟', '🚀', '🎨', '🦁', '🌈', '🏆'][gradeIndex % 6]}
            </Box>
            <Box>
              <Typography variant="h3" fontWeight={800} sx={{ color: '#fff', lineHeight: 1 }}>
                {grade?.name || `${gradeId}° Grado`}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.5, fontSize: '1.1rem' }}>
                {grade?.description || 'Selecciona una materia para empezar'}
              </Typography>
              <Chip
                label={`${subjects.length} materia${subjects.length !== 1 ? 's' : ''}`}
                sx={{
                  background: 'rgba(255,255,255,0.25)',
                  color: '#fff',
                  fontWeight: 700,
                  mt: 1,
                }}
              />
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

        {subjects.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ fontSize: '5rem', mb: 2 }}>📖</Typography>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
              No hay materias aún
            </Typography>
            <Typography color="text.secondary">
              Las materias para este grado serán añadidas pronto.
            </Typography>
          </Box>
        ) : (
          <>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
              Materias disponibles 📘
            </Typography>
            <Grid container spacing={3}>
              {subjects.map((subject, index) => {
                const color = subjectColors[index % subjectColors.length];
                const icon = subjectIcons[index % subjectIcons.length];
                return (
                  <Grid item xs={12} sm={6} md={4} key={subject.id}>
                    <Card
                      onClick={() => navigate(`/subjects/${subject.id}`)}
                      sx={{
                        cursor: 'pointer',
                        border: `3px solid ${color}22`,
                        '&:hover': {
                          border: `3px solid ${color}66`,
                          transform: 'translateY(-6px)',
                        },
                        height: '100%',
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <Avatar
                            sx={{
                              bgcolor: `${color}22`,
                              color: color,
                              width: 56,
                              height: 56,
                              fontSize: '1.8rem',
                              border: `2px solid ${color}33`,
                            }}
                          >
                            {icon}
                          </Avatar>
                          <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                              {subject.name}
                            </Typography>
                            {subject.description && (
                              <Typography variant="caption" color="text.secondary">
                                {subject.description}
                              </Typography>
                            )}
                          </Box>
                        </Box>

                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            p: 1.5,
                            background: `${color}11`,
                            borderRadius: '10px',
                            mt: 1,
                          }}
                        >
                          <Typography variant="body2" fontWeight={600} sx={{ color, flexGrow: 1 }}>
                            Ver meses del año
                          </Typography>
                          <ArrowForward sx={{ color, fontSize: '1rem' }} />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </>
        )}
      </Container>

      <Footer />
    </Box>
  );
};

export default GradeDetailPage;
