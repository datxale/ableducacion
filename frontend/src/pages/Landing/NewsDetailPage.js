import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Typography,
} from '@mui/material';
import { ArrowBack, OpenInNew } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

import axiosInstance from '../../api/axios';
import Footer from '../../components/Layout/Footer';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const formatDate = (value) => {
  if (!value) return '';
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

const NewsDetailPage = () => {
  const { newsId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await axiosInstance.get(`/news/${newsId}`);
        if (!active) return;
        setItem(response.data);
      } catch (err) {
        if (!active) return;
        setError(err.response?.data?.detail || 'No se pudo cargar la noticia.');
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [newsId]);

  if (loading) return <LoadingSpinner message="Cargando noticia..." />;

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)' }}>
      <Box sx={{ background: 'linear-gradient(135deg, #0d47a1 0%, #1976d2 55%, #42a5f5 100%)', color: '#fff', py: { xs: 8, md: 10 } }}>
        <Container maxWidth="md">
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/inicio#noticias')}
            sx={{ color: '#fff', mb: 2, boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none', background: 'rgba(255,255,255,0.08)' } }}
          >
            Volver a noticias
          </Button>
          {item && (
            <>
              <Chip
                label={item.news_type === 'evento' ? 'Evento' : 'Noticia'}
                sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: '#fff', fontWeight: 800, mb: 2 }}
              />
              <Typography variant="h2" sx={{ fontWeight: 900, fontSize: { xs: '2rem', md: '3rem' }, lineHeight: 1.1, mb: 2 }}>
                {item.title}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
                {formatDate(item.published_at)}
              </Typography>
            </>
          )}
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: 5 }}>
        {error && <Alert severity="warning" sx={{ mb: 3, borderRadius: '14px' }}>{error}</Alert>}

        {item && (
          <Paper sx={{ borderRadius: '28px', overflow: 'hidden', boxShadow: '0 22px 48px rgba(15,23,42,0.08)' }}>
            <Box
              sx={{
                height: { xs: 220, md: 340 },
                background: item.image_url
                  ? `linear-gradient(180deg, rgba(15,23,42,0.08), rgba(15,23,42,0.45)), url(${item.image_url})`
                  : 'linear-gradient(135deg, #4ECDC4 0%, #2B7DE9 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <Box sx={{ p: { xs: 3, md: 4 } }}>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#10213a', mb: 2 }}>
                {item.summary}
              </Typography>
              <Typography sx={{ color: 'text.secondary', lineHeight: 1.9, whiteSpace: 'pre-line', mb: item.link_url ? 3 : 0 }}>
                {item.content || item.summary}
              </Typography>
              {item.link_url && (
                <Button
                  variant="contained"
                  endIcon={<OpenInNew />}
                  onClick={() => window.open(item.link_url, '_blank', 'noopener,noreferrer')}
                  sx={{ borderRadius: '999px', px: 3, py: 1.2, textTransform: 'none', fontWeight: 800 }}
                >
                  Abrir enlace relacionado
                </Button>
              )}
            </Box>
          </Paper>
        )}
      </Container>

      <Footer />
    </Box>
  );
};

export default NewsDetailPage;
