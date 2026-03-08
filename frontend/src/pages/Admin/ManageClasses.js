import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Breadcrumbs,
  Link,
  InputAdornment,
  CircularProgress,
  Tooltip,
  Grid,
} from '@mui/material';
import {
  Home,
  Add,
  Edit,
  Delete,
  VideoCall,
  Close,
  Save,
  Schedule,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Footer from '../../components/Layout/Footer';

const ManageClasses = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    class_type: 'regular',
    grade: '',
    date_time: '',
    meeting_url: '',
    teacher_name: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classesRes, gradesRes] = await Promise.all([
        axiosInstance.get('/live-classes/'),
        axiosInstance.get('/grades/'),
      ]);
      setClasses(classesRes.data?.results || classesRes.data || []);
      setGrades(gradesRes.data?.results || gradesRes.data || []);
    } catch (err) {
      setError('Error al cargar clases.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateDialog = () => {
    setSelectedClass(null);
    setForm({
      title: '',
      description: '',
      class_type: 'regular',
      grade: '',
      date_time: '',
      meeting_url: '',
      teacher_name: '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (cls) => {
    setSelectedClass(cls);
    setForm({
      title: cls.title || '',
      description: cls.description || '',
      class_type: cls.class_type || 'regular',
      grade: cls.grade || '',
      date_time: cls.date_time ? cls.date_time.slice(0, 16) : '',
      meeting_url: cls.meeting_url || '',
      teacher_name: cls.teacher_name || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title) {
      setError('El título es obligatorio.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const data = { ...form };
      Object.keys(data).forEach((k) => data[k] === '' && delete data[k]);

      if (selectedClass) {
        await axiosInstance.patch(`/live-classes/${selectedClass.id}/`, data);
        setSuccess('Clase actualizada.');
      } else {
        await axiosInstance.post('/live-classes/', data);
        setSuccess('Clase creada.');
      }
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      const errData = err.response?.data;
      let msg = 'Error al guardar clase.';
      if (errData) {
        const firstKey = Object.keys(errData)[0];
        msg = Array.isArray(errData[firstKey]) ? errData[firstKey][0] : String(errData[firstKey]);
      }
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await axiosInstance.delete(`/live-classes/${selectedClass.id}/`);
      setSuccess('Clase eliminada.');
      setDeleteDialogOpen(false);
      fetchData();
    } catch {
      setError('Error al eliminar clase.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Cargando clases en vivo..." />;

  return (
    <Box sx={{ background: '#f5f7fa', minHeight: '100vh' }}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #e91e63 0%, #f48fb1 100%)',
          py: 5,
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Breadcrumbs sx={{ mb: 2 }} separator="›">
            <Link
              component="button"
              onClick={() => navigate('/dashboard')}
              sx={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.9rem', '&:hover': { color: '#fff' } }}
            >
              <Home sx={{ fontSize: '1rem', mr: 0.3, verticalAlign: 'middle' }} /> Dashboard
            </Link>
            <Link
              component="button"
              onClick={() => navigate('/admin')}
              sx={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.9rem', '&:hover': { color: '#fff' } }}
            >
              Admin
            </Link>
            <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
              Clases en Vivo
            </Typography>
          </Breadcrumbs>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ background: 'rgba(255,255,255,0.25)', borderRadius: '16px', p: 1.5, display: 'flex' }}>
                <VideoCall sx={{ color: '#fff', fontSize: '2.5rem' }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#fff' }}>
                  Clases en Vivo
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  {classes.length} clase{classes.length !== 1 ? 's' : ''} programada{classes.length !== 1 ? 's' : ''}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={openCreateDialog}
              sx={{ background: '#ff9800', '&:hover': { background: '#f57c00' } }}
            >
              Nueva Clase
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Paper sx={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ background: '#f5f7fa' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Clase</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Fecha y hora</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Grado</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Docente</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {classes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 5 }}>
                      <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>📭</Typography>
                      <Typography color="text.secondary">No hay clases programadas</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  classes.map((cls) => (
                    <TableRow key={cls.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            sx={{
                              bgcolor: cls.class_type === 'refuerzo' ? '#fff3e0' : '#fce4ec',
                              width: 36,
                              height: 36,
                            }}
                          >
                            <VideoCall sx={{ color: cls.class_type === 'refuerzo' ? '#ff9800' : '#e91e63', fontSize: '1.2rem' }} />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{cls.title}</Typography>
                            {cls.description && (
                              <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 180, display: 'block' }}>
                                {cls.description}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={cls.class_type === 'refuerzo' ? '🔄 Refuerzo' : '📚 Regular'}
                          size="small"
                          sx={{
                            bgcolor: cls.class_type === 'refuerzo' ? '#fff3e0' : '#e3f2fd',
                            color: cls.class_type === 'refuerzo' ? '#f57c00' : '#1565c0',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {cls.date_time ? (
                          <Box>
                            <Typography variant="body2" fontWeight={500}>
                              {new Date(cls.date_time).toLocaleDateString('es-PE', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(cls.date_time).toLocaleTimeString('es-PE', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary">Sin fecha</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{cls.grade_name || (cls.grade ? `Grado ${cls.grade}` : '—')}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{cls.teacher_name || '—'}</Typography>
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => openEditDialog(cls)}
                              sx={{ color: '#e91e63', bgcolor: '#fce4ec', '&:hover': { bgcolor: '#f8bbd9' } }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              onClick={() => { setSelectedClass(cls); setDeleteDialogOpen(true); }}
                              sx={{ color: '#f44336', bgcolor: '#ffebee', '&:hover': { bgcolor: '#ffcdd2' } }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
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
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700}>
            {selectedClass ? '✏️ Editar Clase' : '🎥 Nueva Clase en Vivo'}
          </Typography>
          <IconButton onClick={() => setDialogOpen(false)} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título de la clase *"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                multiline
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Tipo de clase</InputLabel>
                <Select
                  value={form.class_type}
                  onChange={(e) => setForm({ ...form, class_type: e.target.value })}
                  label="Tipo de clase"
                >
                  <MenuItem value="regular">📚 Clase Regular</MenuItem>
                  <MenuItem value="refuerzo">🔄 Clase de Refuerzo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Grado (opcional)</InputLabel>
                <Select
                  value={form.grade}
                  onChange={(e) => setForm({ ...form, grade: e.target.value })}
                  label="Grado (opcional)"
                >
                  <MenuItem value="">Todos los grados</MenuItem>
                  {grades.map((g) => (
                    <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fecha y hora"
                type="datetime-local"
                value={form.date_time}
                onChange={(e) => setForm({ ...form, date_time: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre del docente"
                value={form.teacher_name}
                onChange={(e) => setForm({ ...form, teacher_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="URL de la reunión (Zoom, Meet, etc.)"
                value={form.meeting_url}
                onChange={(e) => setForm({ ...form, meeting_url: e.target.value })}
                placeholder="https://meet.google.com/... o https://zoom.us/j/..."
                helperText="Enlace para unirse a la clase en vivo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setDialogOpen(false)} sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : <Save />}
            sx={{ background: '#e91e63', '&:hover': { background: '#c2185b' } }}
          >
            {saving ? 'Guardando...' : 'Guardar Clase'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle>
          <Typography variant="h6" fontWeight={700}>⚠️ Confirmar eliminación</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Eliminar la clase "<strong>{selectedClass?.title}</strong>"?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setDeleteDialogOpen(false)} sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={saving}
          >
            {saving ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </Box>
  );
};

export default ManageClasses;
