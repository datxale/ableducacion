import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add,
  ArrowBack,
  Article,
  Delete,
  Edit,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import axiosInstance from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Footer from '../../components/Layout/Footer';

const emptyForm = {
  title: '',
  summary: '',
  content: '',
  image_url: '',
};

const formatDate = (value) => {
  if (!value) {
    return '-';
  }

  try {
    return new Date(value).toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch (error) {
    return value;
  }
};

const ManageNews = () => {
  const navigate = useNavigate();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchNews = async () => {
    try {
      const response = await axiosInstance.get('/news/all');
      setNews(response.data || []);
    } catch (err) {
      setError('Error al cargar noticias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleOpenCreate = () => {
    setSelectedNews(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedNews(item);
    setForm({
      title: item.title || '',
      summary: item.summary || '',
      content: item.content || '',
      image_url: item.image_url || '',
    });
    setDialogOpen(true);
  };

  const handleOpenDelete = (item) => {
    setSelectedNews(item);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      title: form.title.trim(),
      summary: form.summary.trim(),
      content: form.content.trim() || null,
      image_url: form.image_url.trim() || null,
    };

    try {
      if (selectedNews) {
        await axiosInstance.put(`/news/${selectedNews.id}`, payload);
        setSuccess('Noticia actualizada');
      } else {
        await axiosInstance.post('/news/', payload);
        setSuccess('Noticia creada');
      }

      setDialogOpen(false);
      fetchNews();
    } catch (err) {
      setError('Error al guardar noticia');
    }
  };

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/news/${selectedNews.id}`);
      setSuccess('Noticia eliminada');
      setDeleteDialogOpen(false);
      fetchNews();
    } catch (err) {
      setError('Error al eliminar noticia');
    }
  };

  const handleToggleActive = async (item) => {
    try {
      await axiosInstance.put(`/news/${item.id}`, { is_active: !item.is_active });
      fetchNews();
    } catch (err) {
      setError('Error al cambiar el estado de la noticia');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Cargando noticias..." />;
  }

  return (
    <Box sx={{ background: '#f5f7fa', minHeight: '100vh' }}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #ef6c00 0%, #ff8f00 100%)',
          py: 5,
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
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/admin')}
            sx={{
              color: '#fff',
              mb: 2,
              boxShadow: 'none',
              '&:hover': {
                boxShadow: 'none',
                transform: 'none',
                background: 'rgba(255,255,255,0.15)',
              },
            }}
          >
            Panel Admin
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '16px',
                  p: 1.5,
                  display: 'flex',
                }}
              >
                <Article sx={{ color: '#fff', fontSize: '2.5rem' }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#fff' }}>
                  Noticias
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.92)' }}>
                  Gestiona las noticias de la landing page
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenCreate}
              sx={{
                background: '#fff',
                color: '#ef6c00',
                fontWeight: 700,
                '&:hover': { background: '#f7f7f7' },
              }}
            >
              Nueva noticia
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2, borderRadius: '12px' }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" onClose={() => setSuccess('')} sx={{ mb: 2, borderRadius: '12px' }}>
            {success}
          </Alert>
        )}

        <Paper sx={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ background: '#f5f7fa' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Titulo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Resumen</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {news.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <Typography sx={{ fontSize: '2.6rem', mb: 1 }}>📰</Typography>
                      <Typography color="text.secondary">
                        No hay noticias registradas. Crea la primera.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  news.map((item) => (
                    <TableRow key={item.id} sx={{ '&:hover': { background: '#fafafa' } }}>
                      <TableCell sx={{ minWidth: 220 }}>
                        <Typography variant="body2" fontWeight={700}>
                          {item.title}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 360 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {item.summary}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(item.published_at)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.is_active ? 'Activa' : 'Inactiva'}
                          size="small"
                          onClick={() => handleToggleActive(item)}
                          sx={{
                            cursor: 'pointer',
                            bgcolor: item.is_active ? '#e8f5e9' : '#fafafa',
                            color: item.is_active ? '#2e7d32' : '#777',
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => handleOpenEdit(item)} sx={{ color: '#1976d2' }}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleOpenDelete(item)} sx={{ color: '#f44336' }}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {selectedNews ? 'Editar noticia' : 'Nueva noticia'}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Titulo"
            fullWidth
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            label="Resumen"
            fullWidth
            multiline
            rows={3}
            value={form.summary}
            onChange={(event) => setForm({ ...form, summary: event.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Contenido"
            fullWidth
            multiline
            rows={6}
            value={form.content}
            onChange={(event) => setForm({ ...form, content: event.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            label="URL de imagen"
            fullWidth
            value={form.image_url}
            onChange={(event) => setForm({ ...form, image_url: event.target.value })}
            placeholder="https://..."
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!form.title.trim() || !form.summary.trim()}
            sx={{ background: '#ef6c00', '&:hover': { background: '#e65100' } }}
          >
            {selectedNews ? 'Guardar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: '20px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Eliminar noticia
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Esta accion no se puede deshacer. La noticia sera eliminada permanentemente.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}>
            Cancelar
          </Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </Box>
  );
};

export default ManageNews;
