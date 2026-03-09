import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  Rating,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  FormatQuote,
  ArrowBack,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Footer from '../../components/Layout/Footer';

const ManageTestimonials = () => {
  const navigate = useNavigate();
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTestimonial, setSelectedTestimonial] = useState(null);
  const [form, setForm] = useState({ quote: '', role: '', rating: 5 });

  const fetchTestimonials = async () => {
    try {
      const res = await axiosInstance.get('/testimonials/all');
      setTestimonials(res.data);
    } catch (err) {
      setError('Error al cargar testimonios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const handleOpenCreate = () => {
    setSelectedTestimonial(null);
    setForm({ quote: '', role: '', rating: 5 });
    setDialogOpen(true);
  };

  const handleOpenEdit = (t) => {
    setSelectedTestimonial(t);
    setForm({ quote: t.quote, role: t.role, rating: t.rating });
    setDialogOpen(true);
  };

  const handleOpenDelete = (t) => {
    setSelectedTestimonial(t);
    setDeleteDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (selectedTestimonial) {
        await axiosInstance.put(`/testimonials/${selectedTestimonial.id}`, form);
        setSuccess('Testimonio actualizado');
      } else {
        await axiosInstance.post('/testimonials/', form);
        setSuccess('Testimonio creado');
      }
      setDialogOpen(false);
      fetchTestimonials();
    } catch (err) {
      setError('Error al guardar testimonio');
    }
  };

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/testimonials/${selectedTestimonial.id}`);
      setSuccess('Testimonio eliminado');
      setDeleteDialogOpen(false);
      fetchTestimonials();
    } catch (err) {
      setError('Error al eliminar testimonio');
    }
  };

  const handleToggleActive = async (t) => {
    try {
      await axiosInstance.put(`/testimonials/${t.id}`, { is_active: !t.is_active });
      fetchTestimonials();
    } catch (err) {
      setError('Error al cambiar estado');
    }
  };

  if (loading) return <LoadingSpinner message="Cargando testimonios..." />;

  return (
    <Box sx={{ background: '#f5f7fa', minHeight: '100vh' }}>
      {/* Header */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #ff9800 0%, #ffc107 100%)',
          py: 5,
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
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/admin')}
            sx={{
              color: '#fff',
              mb: 2,
              boxShadow: 'none',
              '&:hover': { boxShadow: 'none', transform: 'none', background: 'rgba(255,255,255,0.15)' },
            }}
          >
            Panel Admin
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  background: 'rgba(255,255,255,0.25)',
                  borderRadius: '16px',
                  p: 1.5,
                  display: 'flex',
                }}
              >
                <FormatQuote sx={{ color: '#fff', fontSize: '2.5rem' }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#fff' }}>
                  Testimonios
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  Gestiona los testimonios de la página de inicio
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleOpenCreate}
              sx={{
                background: '#fff',
                color: '#ff9800',
                fontWeight: 700,
                '&:hover': { background: '#f5f5f5' },
              }}
            >
              Nuevo Testimonio
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
                  <TableCell sx={{ fontWeight: 700 }}>Testimonio</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Rol</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Calificación</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {testimonials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                      <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>💬</Typography>
                      <Typography variant="body1" color="text.secondary">
                        No hay testimonios. Crea el primero.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  testimonials.map((t) => (
                    <TableRow
                      key={t.id}
                      sx={{
                        '&:hover': { background: '#fafafa' },
                        transition: 'background 0.2s',
                      }}
                    >
                      <TableCell sx={{ maxWidth: 350 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontStyle: 'italic',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          &ldquo;{t.quote}&rdquo;
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {t.role}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Rating value={t.rating} readOnly size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={t.is_active ? 'Activo' : 'Inactivo'}
                          size="small"
                          onClick={() => handleToggleActive(t)}
                          sx={{
                            cursor: 'pointer',
                            bgcolor: t.is_active ? '#e8f5e9' : '#fafafa',
                            color: t.is_active ? '#4caf50' : '#999',
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEdit(t)}
                          sx={{ color: '#1976d2' }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDelete(t)}
                          sx={{ color: '#f44336' }}
                        >
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

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {selectedTestimonial ? 'Editar Testimonio' : 'Nuevo Testimonio'}
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Testimonio"
            fullWidth
            multiline
            rows={4}
            value={form.quote}
            onChange={(e) => setForm({ ...form, quote: e.target.value })}
            sx={{ mt: 1, mb: 2 }}
            placeholder='Ej: "ABL Educación me permite innovar en mis clases cada día"'
          />
          <TextField
            label="Rol / Cargo"
            fullWidth
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            sx={{ mb: 2 }}
            placeholder="Ej: Docente de primaria, Lima"
          />
          <Box>
            <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
              Calificación
            </Typography>
            <Rating
              value={form.rating}
              onChange={(_, newValue) => setForm({ ...form, rating: newValue || 5 })}
              size="large"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!form.quote || !form.role}
            sx={{ background: '#ff9800', '&:hover': { background: '#f57c00' } }}
          >
            {selectedTestimonial ? 'Guardar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: '20px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          ¿Eliminar testimonio?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Esta acción no se puede deshacer. El testimonio se eliminará permanentemente.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </Box>
  );
};

export default ManageTestimonials;
