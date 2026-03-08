import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Alert,
  Breadcrumbs,
  Link,
  Chip,
} from '@mui/material';
import { Home, School } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import GradeCard from '../../components/common/GradeCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Footer from '../../components/Layout/Footer';

const GradesPage = () => {
  const navigate = useNavigate();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const res = await axiosInstance.get('/grades/');
        setGrades(res.data?.results || res.data || []);
      } catch (err) {
        setError('Error al cargar los grados. Intenta de nuevo.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, []);

  if (loading) return <LoadingSpinner message="Cargando grados..." />;

  return (
    <Box sx={{ background: '#f5f7fa', minHeight: '100vh' }}>
      {/* Hero header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1565c0 0%, #42a5f5 100%)',
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
            <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
              Grados
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
              <School sx={{ color: '#fff', fontSize: '2.5rem' }} />
            </Box>
            <Box>
              <Typography variant="h3" fontWeight={800} sx={{ color: '#fff', lineHeight: 1 }}>
                Grados Escolares
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
                Selecciona tu grado para acceder al contenido
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 3, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {['1° Grado', '2° Grado', '3° Grado', '4° Grado', '5° Grado', '6° Grado'].map((g) => (
              <Chip
                key={g}
                label={g}
                size="small"
                sx={{
                  background: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  fontWeight: 600,
                  backdropFilter: 'blur(10px)',
                }}
              />
            ))}
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 5 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
            {error}
          </Alert>
        )}

        {grades.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ fontSize: '5rem', mb: 2 }}>📚</Typography>
            <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
              No hay grados disponibles
            </Typography>
            <Typography color="text.secondary">
              Los grados serán añadidos pronto por el administrador.
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>
                ¡Elige tu grado! 🎯
              </Typography>
              <Typography color="text.secondary">
                {grades.length} grado{grades.length !== 1 ? 's' : ''} disponible{grades.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
            <Grid container spacing={3}>
              {grades.map((grade, index) => (
                <Grid item xs={12} sm={6} md={4} key={grade.id}>
                  <GradeCard grade={grade} index={index} />
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Container>

      <Footer />
    </Box>
  );
};

export default GradesPage;
