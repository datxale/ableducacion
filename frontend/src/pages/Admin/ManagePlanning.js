import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add,
  CalendarMonth,
  Close,
  CloudUpload,
  Delete,
  Edit,
  Home,
  Launch,
  MenuBook,
  Save,
  VideoCall,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Footer from '../../components/Layout/Footer';
import { uploadFile } from '../../utils/uploads';

const emptyForm = {
  planning_type: 'horario',
  title: '',
  description: '',
  file_url: '',
  grade_id: '',
  month_id: '',
};

const GOOGLE_CALENDAR_URL = 'https://calendar.google.com/calendar/u/0/r/week';

const ManagePlanning = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();

  const [items, setItems] = useState([]);
  const [grades, setGrades] = useState([]);
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const sectionPath = location.pathname.startsWith('/admin') && isAdmin ? '/admin' : '/dashboard';
  const sectionLabel = location.pathname.startsWith('/admin') && isAdmin ? 'Admin' : 'Docencia';
  const classesManagementPath = isAdmin ? '/admin/classes' : '/teaching/classes';

  const fetchData = async () => {
    setLoading(true);
    try {
      const [planningRes, gradesRes, monthsRes] = await Promise.all([
        axiosInstance.get('/planning/'),
        axiosInstance.get('/grades/'),
        axiosInstance.get('/months/'),
      ]);
      setItems(planningRes.data?.results || planningRes.data || []);
      setGrades(gradesRes.data?.results || gradesRes.data || []);
      setMonths(monthsRes.data?.results || monthsRes.data || []);
    } catch (err) {
      setError('Error al cargar la planificacion.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const gradesById = useMemo(
    () => Object.fromEntries(grades.map((grade) => [grade.id, grade])),
    [grades]
  );
  const monthsById = useMemo(
    () => Object.fromEntries(months.map((month) => [month.id, month])),
    [months]
  );

  const openCreateDialog = () => {
    setSelectedItem(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (item) => {
    setSelectedItem(item);
    setForm({
      planning_type: item.planning_type || 'horario',
      title: item.title || '',
      description: item.description || '',
      file_url: item.file_url || '',
      grade_id: item.grade_id || '',
      month_id: item.month_id || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.grade_id) {
      setError('Titulo y grado son obligatorios.');
      return;
    }

    setSaving(true);
    setError('');

    const payload = {
      planning_type: form.planning_type,
      title: form.title.trim(),
      description: form.description.trim() || null,
      file_url: form.file_url.trim() || null,
      grade_id: Number(form.grade_id),
      month_id: form.month_id ? Number(form.month_id) : null,
    };

    try {
      if (selectedItem) {
        await axiosInstance.put(`/planning/${selectedItem.id}`, payload);
        setSuccess('Recurso actualizado.');
      } else {
        await axiosInstance.post('/planning/', payload);
        setSuccess('Recurso creado.');
      }
      setDialogOpen(false);
      setForm(emptyForm);
      fetchData();
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(Array.isArray(detail) ? detail[0]?.msg || 'Error al guardar.' : detail || 'Error al guardar.');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    try {
      const uploaded = await uploadFile(file, 'planning');
      setForm((current) => ({ ...current, file_url: uploaded.url }));
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo subir el archivo.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    setSaving(true);
    try {
      await axiosInstance.delete(`/planning/${selectedItem.id}`);
      setSuccess('Recurso eliminado.');
      setDeleteDialogOpen(false);
      fetchData();
    } catch (err) {
      setError('Error al eliminar el recurso.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Cargando planificacion..." />;

  return (
    <Box sx={{ background: '#f5f7fa', minHeight: '100vh' }}>
      <Box sx={{ background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)', py: 5 }}>
        <Container maxWidth="lg">
          <Breadcrumbs sx={{ mb: 2 }} separator=">">
            <Link component="button" onClick={() => navigate('/dashboard')} sx={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.9rem', '&:hover': { color: '#fff' } }}>
              <Home sx={{ fontSize: '1rem', mr: 0.3, verticalAlign: 'middle' }} /> Dashboard
            </Link>
            <Link component="button" onClick={() => navigate(sectionPath)} sx={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.9rem', '&:hover': { color: '#fff' } }}>
              {sectionLabel}
            </Link>
            <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
              Planificacion
            </Typography>
          </Breadcrumbs>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ background: 'rgba(255,255,255,0.25)', borderRadius: '16px', p: 1.5, display: 'flex' }}>
                <CalendarMonth sx={{ color: '#fff', fontSize: '2.5rem' }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#fff' }}>
                  Gestion de planificacion
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  {items.length} recurso{items.length !== 1 ? 's' : ''} publicado{items.length !== 1 ? 's' : ''}
                </Typography>
              </Box>
            </Box>
            <Button variant="contained" startIcon={<Add />} onClick={openCreateDialog} sx={{ background: '#6d4c41', '&:hover': { background: '#4e342e' } }}>
              Nuevo recurso
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Paper
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #f3e5f5, #ffffff)',
            border: '1px solid #e1bee7',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
              Calendario Google y clases grabadas
            </Typography>
            <Typography color="text.secondary">
              Los horarios y guias se publican aqui. Las clases que deben aparecer en Google Calendar se crean desde Gestionar clases y luego se reflejan en Planificacion.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<VideoCall />}
              onClick={() => navigate(classesManagementPath)}
              sx={{ background: '#6a1b9a', '&:hover': { background: '#4a148c' } }}
            >
              Gestionar clases
            </Button>
            <Button
              variant="outlined"
              startIcon={<Launch />}
              href={GOOGLE_CALENDAR_URL}
              target="_blank"
              rel="noreferrer"
              sx={{ borderColor: '#6a1b9a', color: '#6a1b9a' }}
            >
              Abrir Google Calendar
            </Button>
          </Box>
        </Paper>

        <Grid container spacing={2.5}>
          {items.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 5, textAlign: 'center', borderRadius: '20px' }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                  No hay recursos publicados
                </Typography>
                <Typography color="text.secondary">
                  Crea horarios o guias para que estudiantes y docentes los vean en la plataforma.
                </Typography>
              </Paper>
            </Grid>
          ) : (
            items.map((item) => (
              <Grid item xs={12} md={6} lg={4} key={item.id}>
                <Card sx={{ height: '100%', borderRadius: '20px' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 2 }}>
                      <Chip
                        icon={item.planning_type === 'horario' ? <CalendarMonth /> : <MenuBook />}
                        label={item.planning_type === 'horario' ? 'Horario' : 'Guia'}
                        sx={{
                          bgcolor: item.planning_type === 'horario' ? '#fff3e0' : '#e3f2fd',
                          color: item.planning_type === 'horario' ? '#ef6c00' : '#1565c0',
                          fontWeight: 700,
                        }}
                      />
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton size="small" onClick={() => openEditDialog(item)} sx={{ color: '#1565c0', bgcolor: '#e3f2fd' }}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => { setSelectedItem(item); setDeleteDialogOpen(true); }} sx={{ color: '#d32f2f', bgcolor: '#ffebee' }}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                      {item.description || 'Sin descripcion'}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      <Chip label={gradesById[item.grade_id]?.name || `Grado ${item.grade_id}`} size="small" />
                      {item.month_id && <Chip label={monthsById[item.month_id]?.name || `Mes ${item.month_id}`} size="small" />}
                    </Box>

                    <Button fullWidth variant={item.file_url ? 'contained' : 'outlined'} href={item.file_url || undefined} target={item.file_url ? '_blank' : undefined} disabled={!item.file_url}>
                      {item.file_url ? 'Abrir recurso' : 'Sin archivo'}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Container>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700}>
            {selectedItem ? 'Editar recurso' : 'Nuevo recurso'}
          </Typography>
          <IconButton onClick={() => setDialogOpen(false)} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select value={form.planning_type} label="Tipo" onChange={(event) => setForm({ ...form, planning_type: event.target.value })}>
                  <MenuItem value="horario">Horario</MenuItem>
                  <MenuItem value="guia">Guia</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Grado</InputLabel>
                <Select value={form.grade_id} label="Grado" onChange={(event) => setForm({ ...form, grade_id: event.target.value })}>
                  {grades.map((grade) => <MenuItem key={grade.id} value={grade.id}>{grade.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Mes</InputLabel>
                <Select value={form.month_id} label="Mes" onChange={(event) => setForm({ ...form, month_id: event.target.value })}>
                  <MenuItem value="">Todos</MenuItem>
                  {months.map((month) => <MenuItem key={month.id} value={month.id}>{month.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Titulo" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Descripcion" multiline rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="URL del archivo" placeholder="https://..." value={form.file_url} onChange={(event) => setForm({ ...form, file_url: event.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUpload />}
                disabled={uploading}
                sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}
              >
                {uploading ? 'Subiendo archivo...' : 'Subir archivo'}
                <input type="file" hidden onChange={handleFileUpload} />
              </Button>
              {form.file_url && (
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Archivo vinculado: {form.file_url}
                </Typography>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} startIcon={<Save />} sx={{ background: '#ff9800', '&:hover': { background: '#ef6c00' } }}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle>
          <Typography variant="h6" fontWeight={700}>Confirmar eliminacion</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography>Eliminar el recurso <strong>{selectedItem?.title}</strong>?</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={saving}>
            {saving ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </Box>
  );
};

export default ManagePlanning;
