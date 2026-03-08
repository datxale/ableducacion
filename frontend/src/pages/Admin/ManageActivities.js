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
  Search,
  MenuBook,
  Close,
  Save,
  PictureAsPdf,
  PlayCircle,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Footer from '../../components/Layout/Footer';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const ManageActivities = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    activity_type: 'ficha',
    subject: '',
    month: '',
    week: '',
    file_url: '',
    video_url: '',
    url: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [activitiesRes, subjectsRes, gradesRes] = await Promise.all([
        axiosInstance.get('/activities/'),
        axiosInstance.get('/subjects/'),
        axiosInstance.get('/grades/'),
      ]);
      setActivities(activitiesRes.data?.results || activitiesRes.data || []);
      setSubjects(subjectsRes.data?.results || subjectsRes.data || []);
      setGrades(gradesRes.data?.results || gradesRes.data || []);
    } catch (err) {
      setError('Error al cargar actividades.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateDialog = () => {
    setSelectedActivity(null);
    setForm({
      title: '',
      description: '',
      activity_type: 'ficha',
      subject: '',
      month: '',
      week: '',
      file_url: '',
      video_url: '',
      url: '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (activity) => {
    setSelectedActivity(activity);
    setForm({
      title: activity.title || '',
      description: activity.description || '',
      activity_type: activity.activity_type || 'ficha',
      subject: activity.subject || '',
      month: activity.month || '',
      week: activity.week || '',
      file_url: activity.file_url || '',
      video_url: activity.video_url || '',
      url: activity.url || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.subject) {
      setError('El título y la materia son obligatorios.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const data = { ...form };
      // Remove empty fields
      Object.keys(data).forEach((k) => data[k] === '' && delete data[k]);

      if (selectedActivity) {
        await axiosInstance.patch(`/activities/${selectedActivity.id}/`, data);
        setSuccess('Actividad actualizada.');
      } else {
        await axiosInstance.post('/activities/', data);
        setSuccess('Actividad creada.');
      }
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      const errData = err.response?.data;
      let msg = 'Error al guardar actividad.';
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
      await axiosInstance.delete(`/activities/${selectedActivity.id}/`);
      setSuccess('Actividad eliminada.');
      setDeleteDialogOpen(false);
      fetchData();
    } catch {
      setError('Error al eliminar actividad.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Cargando actividades..." />;

  const filteredActivities = activities.filter(
    (a) =>
      a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.subject_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ background: '#f5f7fa', minHeight: '100vh' }}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)',
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
              Actividades
            </Typography>
          </Breadcrumbs>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ background: 'rgba(255,255,255,0.25)', borderRadius: '16px', p: 1.5, display: 'flex' }}>
                <MenuBook sx={{ color: '#fff', fontSize: '2.5rem' }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#fff' }}>
                  Gestión de Actividades
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  {activities.length} actividad{activities.length !== 1 ? 'es' : ''} registrada{activities.length !== 1 ? 's' : ''}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={openCreateDialog}
              sx={{ background: '#ff9800', '&:hover': { background: '#f57c00' } }}
            >
              Nueva Actividad
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Paper sx={{ p: 2.5, borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Buscar actividades..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />
        </Paper>

        <Paper sx={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ background: '#f5f7fa' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Actividad</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Tipo</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Materia</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Mes / Semana</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredActivities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 5 }}>
                      <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>📭</Typography>
                      <Typography color="text.secondary">No hay actividades registradas</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredActivities.map((activity) => (
                    <TableRow key={activity.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            sx={{
                              bgcolor:
                                activity.activity_type === 'video' ? '#fce4ec' : '#e3f2fd',
                              width: 36,
                              height: 36,
                            }}
                          >
                            {activity.activity_type === 'video' ? (
                              <PlayCircle sx={{ color: '#e91e63', fontSize: '1.2rem' }} />
                            ) : (
                              <PictureAsPdf sx={{ color: '#1976d2', fontSize: '1.2rem' }} />
                            )}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {activity.title}
                            </Typography>
                            {activity.description && (
                              <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: 'block' }}>
                                {activity.description}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={activity.activity_type === 'video' ? '🎬 Video' : '📄 Ficha'}
                          size="small"
                          sx={{
                            bgcolor: activity.activity_type === 'video' ? '#fce4ec' : '#e3f2fd',
                            color: activity.activity_type === 'video' ? '#e91e63' : '#1976d2',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{activity.subject_name || `Materia ${activity.subject}`}</Typography>
                      </TableCell>
                      <TableCell>
                        {activity.month && (
                          <Typography variant="body2">
                            {MONTHS[activity.month - 1] || `Mes ${activity.month}`}
                            {activity.week ? ` - Sem. ${activity.week}` : ''}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => openEditDialog(activity)}
                              sx={{ color: '#9c27b0', bgcolor: '#f3e5f5', '&:hover': { bgcolor: '#e1bee7' } }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              onClick={() => { setSelectedActivity(activity); setDeleteDialogOpen(true); }}
                              sx={{ color: '#e91e63', bgcolor: '#fce4ec', '&:hover': { bgcolor: '#f8bbd9' } }}
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
            {selectedActivity ? '✏️ Editar Actividad' : '➕ Nueva Actividad'}
          </Typography>
          <IconButton onClick={() => setDialogOpen(false)} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título *"
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
                <InputLabel>Tipo de actividad *</InputLabel>
                <Select
                  value={form.activity_type}
                  onChange={(e) => setForm({ ...form, activity_type: e.target.value })}
                  label="Tipo de actividad *"
                >
                  <MenuItem value="ficha">📄 Ficha PDF</MenuItem>
                  <MenuItem value="video">🎬 Video</MenuItem>
                  <MenuItem value="otro">📌 Otro</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Materia *</InputLabel>
                <Select
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  label="Materia *"
                >
                  {subjects.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Mes</InputLabel>
                <Select
                  value={form.month}
                  onChange={(e) => setForm({ ...form, month: e.target.value })}
                  label="Mes"
                >
                  <MenuItem value="">Sin mes</MenuItem>
                  {MONTHS.map((month, idx) => (
                    <MenuItem key={idx + 1} value={idx + 1}>{month}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Semana</InputLabel>
                <Select
                  value={form.week}
                  onChange={(e) => setForm({ ...form, week: e.target.value })}
                  label="Semana"
                >
                  <MenuItem value="">Sin semana</MenuItem>
                  {[1, 2, 3, 4].map((w) => (
                    <MenuItem key={w} value={w}>Semana {w}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="URL de archivo PDF / recurso"
                value={form.file_url || form.url}
                onChange={(e) => setForm({ ...form, file_url: e.target.value, url: e.target.value })}
                placeholder="https://..."
                helperText="URL directa al archivo PDF o recurso"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="URL de video (YouTube, etc.)"
                value={form.video_url}
                onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
                helperText="URL del video educativo"
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
            sx={{ background: '#9c27b0', '&:hover': { background: '#7b1fa2' } }}
          >
            {saving ? 'Guardando...' : 'Guardar'}
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
            ¿Eliminar la actividad "<strong>{selectedActivity?.title}</strong>"?
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

export default ManageActivities;
