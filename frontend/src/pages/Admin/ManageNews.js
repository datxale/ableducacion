import React, { useEffect, useMemo, useState } from 'react';
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
  Divider,
  IconButton,
  MenuItem,
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
  CloudUpload,
  Delete,
  Edit,
  Image,
  SmartDisplay,
  TextFields,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import axiosInstance from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { NewsContentBlocks, NewsCoverMedia } from '../../components/News/NewsRichContent';
import Footer from '../../components/Layout/Footer';
import { uploadFile } from '../../utils/uploads';
import { createEmptyNewsBlock, detectNewsMediaKind, normalizeNewsBlocks } from '../../utils/news';

const emptyForm = {
  title: '',
  news_type: 'noticia',
  summary: '',
  content: '',
  image_url: '',
  cover_media_type: 'image',
  link_url: '',
  content_blocks: [],
};

const blockTypeOptions = [
  { value: 'text', label: 'Texto', icon: <TextFields fontSize="small" /> },
  { value: 'image', label: 'Imagen', icon: <Image fontSize="small" /> },
  { value: 'video', label: 'Video', icon: <SmartDisplay fontSize="small" /> },
];

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

const normalizeBlocksForSave = (blocks) => (
  normalizeNewsBlocks(blocks).filter((block) => {
    if (block.block_type === 'text') {
      return block.text.trim();
    }
    return block.media_url.trim();
  })
);

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
  const [saving, setSaving] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState('');

  const previewItem = useMemo(
    () => ({
      ...form,
      content: form.content.trim() || null,
      content_blocks: normalizeNewsBlocks(form.content_blocks),
    }),
    [form],
  );

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

  const resetForm = () => {
    setForm(emptyForm);
    setSelectedNews(null);
    setUploadingTarget('');
  };

  const handleOpenCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedNews(item);
    setForm({
      title: item.title || '',
      news_type: item.news_type || 'noticia',
      summary: item.summary || '',
      content: item.content || '',
      image_url: item.image_url || '',
      cover_media_type: item.cover_media_type || detectNewsMediaKind(item.image_url),
      link_url: item.link_url || '',
      content_blocks: normalizeNewsBlocks(item.content_blocks),
    });
    setDialogOpen(true);
  };

  const handleOpenDelete = (item) => {
    setSelectedNews(item);
    setDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (saving) return;
    setDialogOpen(false);
    resetForm();
  };

  const handleBasicChange = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleBlockChange = (index, field, value) => {
    setForm((current) => ({
      ...current,
      content_blocks: current.content_blocks.map((block, blockIndex) => {
        if (blockIndex !== index) return block;
        if (field === 'block_type') {
          return createEmptyNewsBlock(value);
        }
        return { ...block, [field]: value };
      }),
    }));
  };

  const addBlock = (blockType) => {
    setForm((current) => ({
      ...current,
      content_blocks: [...current.content_blocks, createEmptyNewsBlock(blockType)],
    }));
  };

  const removeBlock = (index) => {
    setForm((current) => ({
      ...current,
      content_blocks: current.content_blocks.filter((_, blockIndex) => blockIndex !== index),
    }));
  };

  const handleUpload = async (event, target, blockIndex = null) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingTarget(target);
    setError('');
    try {
      const uploaded = await uploadFile(file, 'news');
      if (target === 'cover') {
        setForm((current) => ({ ...current, image_url: uploaded.url }));
      } else if (target === 'block' && blockIndex !== null) {
        setForm((current) => ({
          ...current,
          content_blocks: current.content_blocks.map((block, currentIndex) =>
            currentIndex === blockIndex ? { ...block, media_url: uploaded.url } : block,
          ),
        }));
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo subir el archivo.');
    } finally {
      setUploadingTarget('');
      event.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.summary.trim()) {
      setError('Titulo y resumen son obligatorios.');
      return;
    }

    if (!form.image_url.trim()) {
      setError('Debes subir o pegar una portada de imagen o video.');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      title: form.title.trim(),
      news_type: form.news_type,
      summary: form.summary.trim(),
      content: form.content.trim() || null,
      image_url: form.image_url.trim(),
      cover_media_type: form.cover_media_type,
      link_url: form.link_url.trim() || null,
      content_blocks: normalizeBlocksForSave(form.content_blocks),
    };

    try {
      if (selectedNews) {
        await axiosInstance.put(`/news/${selectedNews.id}`, payload);
        setSuccess('Publicacion actualizada');
      } else {
        await axiosInstance.post('/news/', payload);
        setSuccess('Publicacion creada');
      }

      setDialogOpen(false);
      resetForm();
      fetchNews();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar noticia');
    } finally {
      setSaving(false);
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
                  Noticias y eventos
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.92)' }}>
                  Cada publicacion lleva portada obligatoria y bloques internos con imagenes o videos.
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
              Nueva publicacion
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
                  <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Portada</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Resumen</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {news.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Typography sx={{ fontSize: '2.2rem', mb: 1 }}>N</Typography>
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
                      <TableCell>
                        <Chip
                          label={item.news_type === 'evento' ? 'Evento' : 'Noticia'}
                          size="small"
                          sx={{ bgcolor: item.news_type === 'evento' ? '#ede7f6' : '#e3f2fd', color: item.news_type === 'evento' ? '#6a1b9a' : '#1565c0', fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.cover_media_type === 'video' ? 'Video' : 'Imagen'}
                          size="small"
                          icon={item.cover_media_type === 'video' ? <SmartDisplay /> : <Image />}
                          sx={{ bgcolor: item.cover_media_type === 'video' ? '#fff3e0' : '#e8f5e9', color: item.cover_media_type === 'video' ? '#ef6c00' : '#2e7d32', fontWeight: 700 }}
                        />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 320 }}>
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
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {selectedNews ? 'Editar publicacion' : 'Nueva publicacion'}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.2fr) minmax(360px, 0.8fr)' }, gap: 3 }}>
            <Box>
              <TextField
                label="Titulo"
                fullWidth
                value={form.title}
                onChange={(event) => handleBasicChange('title', event.target.value)}
                sx={{ mt: 1, mb: 2 }}
              />
              <TextField
                select
                fullWidth
                label="Tipo"
                value={form.news_type}
                onChange={(event) => handleBasicChange('news_type', event.target.value)}
                sx={{ mb: 2 }}
              >
                <MenuItem value="noticia">Noticia</MenuItem>
                <MenuItem value="evento">Evento</MenuItem>
              </TextField>
              <TextField
                label="Resumen"
                fullWidth
                multiline
                rows={3}
                value={form.summary}
                onChange={(event) => handleBasicChange('summary', event.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Contenido principal"
                fullWidth
                multiline
                rows={5}
                value={form.content}
                onChange={(event) => handleBasicChange('content', event.target.value)}
                helperText="Este texto acompana la noticia antes o entre los bloques multimedia."
                sx={{ mb: 2 }}
              />

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
                Portada obligatoria
              </Typography>

              <TextField
                select
                fullWidth
                label="Tipo de portada"
                value={form.cover_media_type}
                onChange={(event) => handleBasicChange('cover_media_type', event.target.value)}
                sx={{ mb: 2 }}
              >
                <MenuItem value="image">Imagen</MenuItem>
                <MenuItem value="video">Video</MenuItem>
              </TextField>

              <TextField
                label={form.cover_media_type === 'video' ? 'URL del video de portada' : 'URL de la imagen de portada'}
                fullWidth
                value={form.image_url}
                onChange={(event) => handleBasicChange('image_url', event.target.value)}
                placeholder="/api/uploads/news/... o https://..."
                sx={{ mb: 1.5 }}
              />

              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUpload />}
                disabled={uploadingTarget === 'cover'}
                sx={{ mb: 2, boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}
              >
                {uploadingTarget === 'cover'
                  ? 'Subiendo portada...'
                  : form.cover_media_type === 'video'
                    ? 'Subir video de portada'
                    : 'Subir imagen de portada'}
                <input
                  type="file"
                  hidden
                  accept={form.cover_media_type === 'video' ? 'video/*,.mp4,.webm,.mov,.m4v,.ogg' : 'image/*,.png,.jpg,.jpeg,.webp,.gif'}
                  onChange={(event) => handleUpload(event, 'cover')}
                />
              </Button>

              <TextField
                label="URL de destino"
                fullWidth
                value={form.link_url}
                onChange={(event) => handleBasicChange('link_url', event.target.value)}
                placeholder="https://... o se abrira el detalle publico"
              />

              <Divider sx={{ my: 3 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
                <Typography variant="subtitle1" fontWeight={800}>
                  Bloques dentro del contenido
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {blockTypeOptions.map((option) => (
                    <Button
                      key={option.value}
                      size="small"
                      variant="outlined"
                      startIcon={option.icon}
                      onClick={() => addBlock(option.value)}
                      sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}
                    >
                      {option.label}
                    </Button>
                  ))}
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Puedes agregar muchos bloques de texto, imagen o video. La portada siempre va aparte.
              </Typography>

              {form.content_blocks.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: '14px' }}>
                  Aun no agregaste bloques extra. Puedes guardar solo con portada y texto principal, o sumar mas imagenes y videos.
                </Alert>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {form.content_blocks.map((block, index) => (
                    <Paper key={`news-block-form-${index}`} variant="outlined" sx={{ p: 2, borderRadius: '18px' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                        <Chip
                          label={`Bloque ${index + 1}`}
                          sx={{ fontWeight: 700 }}
                        />
                        <Button
                          color="error"
                          size="small"
                          startIcon={<Delete />}
                          onClick={() => removeBlock(index)}
                          sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}
                        >
                          Quitar
                        </Button>
                      </Box>

                      <TextField
                        select
                        fullWidth
                        label="Tipo de bloque"
                        value={block.block_type}
                        onChange={(event) => handleBlockChange(index, 'block_type', event.target.value)}
                        sx={{ mb: 1.5 }}
                      >
                        {blockTypeOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>

                      {block.block_type === 'text' ? (
                        <TextField
                          fullWidth
                          label="Texto del bloque"
                          multiline
                          rows={4}
                          value={block.text}
                          onChange={(event) => handleBlockChange(index, 'text', event.target.value)}
                        />
                      ) : (
                        <>
                          <TextField
                            fullWidth
                            label={block.block_type === 'video' ? 'URL del video' : 'URL de la imagen'}
                            value={block.media_url}
                            onChange={(event) => handleBlockChange(index, 'media_url', event.target.value)}
                            placeholder="/api/uploads/news/... o https://..."
                            sx={{ mb: 1.5 }}
                          />
                          <Button
                            component="label"
                            variant="outlined"
                            startIcon={<CloudUpload />}
                            disabled={uploadingTarget === `block-${index}`}
                            sx={{ mb: 1.5, boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}
                          >
                            {uploadingTarget === `block-${index}`
                              ? 'Subiendo...'
                              : block.block_type === 'video'
                                ? 'Subir video'
                                : 'Subir imagen'}
                            <input
                              type="file"
                              hidden
                              accept={block.block_type === 'video' ? 'video/*,.mp4,.webm,.mov,.m4v,.ogg' : 'image/*,.png,.jpg,.jpeg,.webp,.gif'}
                              onChange={(event) => handleUpload(event, 'block', index)}
                            />
                          </Button>
                          <TextField
                            fullWidth
                            label="Pie o descripcion breve"
                            value={block.caption}
                            onChange={(event) => handleBlockChange(index, 'caption', event.target.value)}
                          />
                        </>
                      )}
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>

            <Box>
              <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
                Vista previa de la noticia
              </Typography>
              <Paper sx={{ borderRadius: '24px', overflow: 'hidden', boxShadow: '0 22px 48px rgba(15,23,42,0.08)' }}>
                <NewsCoverMedia item={previewItem} height={220}>
                  <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', height: '100%' }}>
                    <Chip
                      label={form.news_type === 'evento' ? 'Evento' : 'Noticia'}
                      sx={{ bgcolor: 'rgba(255,255,255,0.9)', color: '#10213a', fontWeight: 700 }}
                    />
                    {form.image_url && (
                      <Chip
                        label={detectNewsMediaKind(form.image_url, form.cover_media_type) === 'video' ? 'Video' : 'Imagen'}
                        sx={{ bgcolor: 'rgba(8,16,30,0.74)', color: '#fff', fontWeight: 700 }}
                      />
                    )}
                  </Box>
                </NewsCoverMedia>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                    {form.title || 'Titulo de la publicacion'}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#10213a', fontWeight: 700, mb: 1.5 }}>
                    {form.summary || 'Resumen breve para la tarjeta y el detalle publico.'}
                  </Typography>
                  <NewsContentBlocks item={previewItem} />
                </Box>
              </Paper>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !form.title.trim() || !form.summary.trim() || !form.image_url.trim()}
            sx={{ background: '#ef6c00', '&:hover': { background: '#e65100' } }}
          >
            {saving ? 'Guardando...' : selectedNews ? 'Guardar' : 'Crear'}
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
