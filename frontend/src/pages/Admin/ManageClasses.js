import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Footer from '../../components/Layout/Footer';
import {
  formatLiveClassDate,
  formatLiveClassTime,
} from '../../utils/liveClasses';

const emptyForm = {
  title: '',
  description: '',
  class_type: 'regular',
  grade_id: '',
  subject_id: '',
  scheduled_at: '',
  meeting_provider: 'manual',
  meeting_url: '',
};

const ManageClasses = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, isDocente } = useAuth();
  const [classes, setClasses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [meetingConfig, setMeetingConfig] = useState({ google_meet_enabled: false });
  const sectionPath = location.pathname.startsWith('/admin') && isAdmin ? '/admin' : '/dashboard';
  const sectionLabel = location.pathname.startsWith('/admin') && isAdmin ? 'Admin' : 'Docencia';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [classesRes, gradesRes, subjectsRes, configRes] = await Promise.all([
        axiosInstance.get('/live-classes/', {
          params: isDocente && user?.id ? { teacher_id: user.id } : undefined,
        }),
        axiosInstance.get('/grades/'),
        axiosInstance.get('/subjects/'),
        axiosInstance.get('/live-classes/config/status').catch(() => ({ data: { google_meet_enabled: false } })),
      ]);
      setClasses(classesRes.data?.results || classesRes.data || []);
      setGrades(gradesRes.data?.results || gradesRes.data || []);
      setSubjects(subjectsRes.data?.results || subjectsRes.data || []);
      setMeetingConfig(configRes.data || { google_meet_enabled: false });
    } catch (err) {
      setError('Error al cargar clases en vivo.');
    } finally {
      setLoading(false);
    }
  }, [isDocente, user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const gradesById = useMemo(
    () => Object.fromEntries(grades.map((grade) => [grade.id, grade])),
    [grades]
  );

  const subjectsById = useMemo(
    () => Object.fromEntries(subjects.map((subject) => [subject.id, subject])),
    [subjects]
  );

  const availableSubjects = subjects.filter(
    (subject) => !form.grade_id || subject.grade_id === Number(form.grade_id)
  );

  const openCreateDialog = () => {
    setSelectedClass(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (liveClass) => {
    setSelectedClass(liveClass);
    setForm({
      title: liveClass.title || '',
      description: liveClass.description || '',
      class_type: liveClass.class_type || 'regular',
      grade_id: liveClass.grade_id || '',
      subject_id: liveClass.subject_id || '',
      scheduled_at: liveClass.scheduled_at
        ? liveClass.scheduled_at.slice(0, 16)
        : '',
      meeting_provider: liveClass.meeting_provider || 'manual',
      meeting_url: liveClass.meeting_url || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.grade_id || !form.subject_id || !form.scheduled_at) {
      setError('Titulo, grado, materia y fecha son obligatorios.');
      return;
    }

    if (form.meeting_provider !== 'google_meet' && !form.meeting_url.trim()) {
      setError('Debes ingresar la URL de la reunion para clases manuales o Zoom.');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      class_type: form.class_type,
      grade_id: Number(form.grade_id),
      subject_id: Number(form.subject_id),
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      meeting_provider: form.meeting_provider,
      meeting_url: form.meeting_provider === 'google_meet' ? null : form.meeting_url.trim() || null,
    };

    try {
      if (selectedClass) {
        await axiosInstance.put(`/live-classes/${selectedClass.id}`, payload);
        setSuccess('Clase actualizada.');
      } else {
        await axiosInstance.post('/live-classes/', payload);
        setSuccess('Clase creada.');
      }
      setDialogOpen(false);
      setForm(emptyForm);
      fetchData();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(
        Array.isArray(detail) ? detail[0]?.msg || 'Error al guardar clase.' : detail || 'Error al guardar clase.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedClass) return;

    setSaving(true);
    try {
      await axiosInstance.delete(`/live-classes/${selectedClass.id}`);
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
          <Breadcrumbs sx={{ mb: 2 }} separator=">">
            <Link
              component="button"
              onClick={() => navigate('/dashboard')}
              sx={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.9rem', '&:hover': { color: '#fff' } }}
            >
              <Home sx={{ fontSize: '1rem', mr: 0.3, verticalAlign: 'middle' }} /> Dashboard
            </Link>
            <Link
              component="button"
              onClick={() => navigate(sectionPath)}
              sx={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.9rem', '&:hover': { color: '#fff' } }}
            >
              {sectionLabel}
            </Link>
            <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
              Clases en vivo
            </Typography>
          </Breadcrumbs>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ background: 'rgba(255,255,255,0.25)', borderRadius: '16px', p: 1.5, display: 'flex' }}>
                <VideoCall sx={{ color: '#fff', fontSize: '2.5rem' }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#fff' }}>
                  Clases en vivo
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  {classes.length} clase{classes.length !== 1 ? 's' : ''} registrada{classes.length !== 1 ? 's' : ''}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={openCreateDialog}
              sx={{ background: '#ff9800', '&:hover': { background: '#f57c00' } }}
            >
              Nueva clase
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
                  <TableCell sx={{ fontWeight: 700 }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Grado</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Materia</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Docente</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {classes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 5 }}>
                      <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>0</Typography>
                      <Typography color="text.secondary">No hay clases registradas</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  classes.map((liveClass) => (
                    <TableRow key={liveClass.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            sx={{
                              bgcolor: liveClass.class_type === 'refuerzo' ? '#fff3e0' : '#fce4ec',
                              width: 36,
                              height: 36,
                            }}
                          >
                            <VideoCall sx={{ color: liveClass.class_type === 'refuerzo' ? '#ff9800' : '#e91e63', fontSize: '1.2rem' }} />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {liveClass.title}
                            </Typography>
                            {liveClass.description && (
                              <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 180, display: 'block' }}>
                                {liveClass.description}
                              </Typography>
                            )}
                            <Chip
                              label={
                                liveClass.meeting_provider === 'google_meet'
                                  ? 'Google Meet automatico'
                                  : liveClass.meeting_provider === 'zoom'
                                  ? 'Zoom'
                                  : 'Enlace manual'
                              }
                              size="small"
                              sx={{
                                mt: 0.75,
                                bgcolor:
                                  liveClass.meeting_provider === 'google_meet'
                                    ? '#e8f5e9'
                                    : liveClass.meeting_provider === 'zoom'
                                    ? '#e3f2fd'
                                    : '#f5f5f5',
                                color:
                                  liveClass.meeting_provider === 'google_meet'
                                    ? '#2e7d32'
                                    : liveClass.meeting_provider === 'zoom'
                                    ? '#1565c0'
                                    : '#616161',
                                fontWeight: 700,
                              }}
                            />
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={liveClass.class_type === 'refuerzo' ? 'Refuerzo' : 'Regular'}
                          size="small"
                          sx={{
                            bgcolor: liveClass.class_type === 'refuerzo' ? '#fff3e0' : '#e3f2fd',
                            color: liveClass.class_type === 'refuerzo' ? '#f57c00' : '#1565c0',
                            fontWeight: 700,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {formatLiveClassDate(liveClass, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          }) || 'Sin fecha'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatLiveClassTime(liveClass, {
                            hour: '2-digit',
                            minute: '2-digit',
                          }) || ''}
                        </Typography>
                      </TableCell>
                      <TableCell>{gradesById[liveClass.grade_id]?.name || `Grado ${liveClass.grade_id}`}</TableCell>
                      <TableCell>{subjectsById[liveClass.subject_id]?.name || `Materia ${liveClass.subject_id}`}</TableCell>
                      <TableCell>{liveClass.teacher?.full_name || (liveClass.teacher_id === user?.id ? user.full_name : `Usuario ${liveClass.teacher_id}`)}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => openEditDialog(liveClass)}
                              sx={{ color: '#e91e63', bgcolor: '#fce4ec', '&:hover': { bgcolor: '#f8bbd9' } }}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton
                              size="small"
                              onClick={() => { setSelectedClass(liveClass); setDeleteDialogOpen(true); }}
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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700}>
            {selectedClass ? 'Editar clase' : 'Nueva clase en vivo'}
          </Typography>
          <IconButton onClick={() => setDialogOpen(false)} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Titulo"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripcion"
                multiline
                rows={2}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={form.class_type}
                  onChange={(event) => setForm({ ...form, class_type: event.target.value })}
                  label="Tipo"
                >
                  <MenuItem value="regular">Regular</MenuItem>
                  <MenuItem value="refuerzo">Refuerzo</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Grado</InputLabel>
                <Select
                  value={form.grade_id}
                  onChange={(event) => setForm({ ...form, grade_id: event.target.value, subject_id: '' })}
                  label="Grado"
                >
                  {grades.map((grade) => (
                    <MenuItem key={grade.id} value={grade.id}>{grade.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Acceso</InputLabel>
                <Select
                  value={form.meeting_provider}
                  onChange={(event) => setForm({ ...form, meeting_provider: event.target.value, meeting_url: '' })}
                  label="Acceso"
                >
                  <MenuItem value="google_meet">Google Meet automatico</MenuItem>
                  <MenuItem value="manual">Google Meet manual</MenuItem>
                  <MenuItem value="zoom">Zoom manual</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Materia</InputLabel>
                <Select
                  value={form.subject_id}
                  onChange={(event) => setForm({ ...form, subject_id: event.target.value })}
                  label="Materia"
                >
                  {availableSubjects.map((subject) => (
                    <MenuItem key={subject.id} value={subject.id}>{subject.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fecha y hora"
                type="datetime-local"
                value={form.scheduled_at}
                onChange={(event) => setForm({ ...form, scheduled_at: event.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            {form.meeting_provider === 'google_meet' ? (
              <Grid item xs={12}>
                <Alert severity={meetingConfig.google_meet_enabled ? 'info' : 'warning'} sx={{ borderRadius: '12px' }}>
                  {meetingConfig.google_meet_enabled
                    ? meetingConfig.auto_recording_enabled
                      ? 'Al guardar, el backend creara el Google Meet con integracion de Google activa y dejara la grabacion automatica preparada.'
                      : 'Al guardar, el backend creara automaticamente el Google Meet usando la configuracion activa del servidor.'
                    : 'Google Meet automatico ya esta preparado en codigo, pero el servidor aun no tiene las credenciales de Google activadas.'}
                </Alert>
              </Grid>
            ) : (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={form.meeting_provider === 'zoom' ? 'URL de Zoom' : 'URL de Google Meet'}
                  value={form.meeting_url}
                  onChange={(event) => setForm({ ...form, meeting_url: event.target.value })}
                  placeholder={
                    form.meeting_provider === 'zoom'
                      ? 'https://us06web.zoom.us/j/...'
                      : 'https://meet.google.com/...'
                  }
                />
              </Grid>
            )}
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
            {saving ? 'Guardando...' : 'Guardar clase'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle>
          <Typography variant="h6" fontWeight={700}>Confirmar eliminacion</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Eliminar la clase <strong>{selectedClass?.title}</strong>?
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
