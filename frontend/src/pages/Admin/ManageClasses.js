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
  group_id: '',
  month_id: '',
  week_number: '',
  subject_id: '',
  scheduled_at: '',
  meeting_provider: 'manual',
  meeting_url: '',
};

const emptyFilters = {
  grade_id: '',
  group_id: '',
  month_id: '',
  week_number: '',
};

const DEFAULT_WEEK_OPTIONS = [1, 2, 3, 4, 5, 6];

const ManageClasses = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, isDocente } = useAuth();
  const [classes, setClasses] = useState([]);
  const [grades, setGrades] = useState([]);
  const [groups, setGroups] = useState([]);
  const [months, setMonths] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filters, setFilters] = useState(emptyFilters);
  const [meetingConfig, setMeetingConfig] = useState({ google_meet_enabled: false });
  const sectionPath = location.pathname.startsWith('/admin') && isAdmin ? '/admin' : '/dashboard';
  const sectionLabel = location.pathname.startsWith('/admin') && isAdmin ? 'Admin' : 'Docencia';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const classParams = {};

      if (isDocente && user?.id) {
        classParams.teacher_id = user.id;
      }
      if (filters.grade_id) {
        classParams.grade_id = Number(filters.grade_id);
      }
      if (filters.group_id) {
        classParams.group_id = Number(filters.group_id);
      }
      if (filters.month_id) {
        classParams.month_id = Number(filters.month_id);
      }
      if (filters.week_number) {
        classParams.week_number = Number(filters.week_number);
      }

      const [classesRes, gradesRes, groupsRes, monthsRes, subjectsRes, configRes] = await Promise.all([
        axiosInstance.get('/live-classes/', {
          params: Object.keys(classParams).length ? classParams : undefined,
        }),
        axiosInstance.get('/grades/'),
        axiosInstance.get('/groups/'),
        axiosInstance.get('/months/'),
        axiosInstance.get('/subjects/'),
        axiosInstance.get('/live-classes/config/status').catch(() => ({ data: { google_meet_enabled: false } })),
      ]);
      setClasses(classesRes.data?.results || classesRes.data || []);
      setGrades(gradesRes.data?.results || gradesRes.data || []);
      setGroups(groupsRes.data?.results || groupsRes.data || []);
      setMonths(monthsRes.data?.results || monthsRes.data || []);
      setSubjects(subjectsRes.data?.results || subjectsRes.data || []);
      setMeetingConfig(configRes.data || { google_meet_enabled: false });
    } catch (err) {
      setError('Error al cargar clases en vivo.');
    } finally {
      setLoading(false);
    }
  }, [filters.grade_id, filters.group_id, filters.month_id, filters.week_number, isDocente, user?.id]);

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

  const monthsById = useMemo(
    () => Object.fromEntries(months.map((month) => [month.id, month])),
    [months]
  );

  const availableSubjects = subjects.filter(
    (subject) => !form.grade_id || subject.grade_id === Number(form.grade_id)
  );

  const availableGroups = groups.filter(
    (group) => !form.grade_id || group.grade_id === Number(form.grade_id)
  );

  const filterGroups = groups.filter(
    (group) => !filters.grade_id || group.grade_id === Number(filters.grade_id)
  );

  const weekOptions = useMemo(() => {
    const fromClasses = new Set(
      classes
        .map((liveClass) => Number(liveClass.week_number))
        .filter((value) => Number.isInteger(value) && value > 0)
    );
    DEFAULT_WEEK_OPTIONS.forEach((value) => fromClasses.add(value));
    return [...fromClasses].sort((left, right) => left - right);
  }, [classes]);

  useEffect(() => {
    if (form.group_id && !availableGroups.some((group) => group.id === Number(form.group_id))) {
      setForm((current) => ({ ...current, group_id: '' }));
    }
  }, [availableGroups, form.group_id]);

  useEffect(() => {
    if (filters.group_id && !filterGroups.some((group) => group.id === Number(filters.group_id))) {
      setFilters((current) => ({ ...current, group_id: '' }));
    }
  }, [filterGroups, filters.group_id]);

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
      group_id: liveClass.group_id || '',
      month_id: liveClass.month_id || '',
      week_number: liveClass.week_number || '',
      subject_id: liveClass.subject_id || '',
      scheduled_at: liveClass.scheduled_at
        ? liveClass.scheduled_at.slice(0, 16)
        : '',
      meeting_provider: liveClass.meeting_provider || 'manual',
      meeting_url: liveClass.meeting_url || '',
    });
    setDialogOpen(true);
  };

  const inferMonthIdFromDate = (value) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return '';
    }
    const matchingMonth = months.find((month) => month.number === parsed.getMonth() + 1);
    return matchingMonth?.id || '';
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
      group_id: form.group_id ? Number(form.group_id) : null,
      month_id: form.month_id ? Number(form.month_id) : null,
      week_number: form.week_number ? Number(form.week_number) : null,
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

        <Paper sx={{ p: 2.5, mb: 2.5, borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Box>
              <Typography variant="h6" fontWeight={800}>
                Filtros de agenda
              </Typography>
              <Typography color="text.secondary">
                Filtra las clases por grado, seccion, mes y semana.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              onClick={() => setFilters(emptyFilters)}
              sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}
            >
              Limpiar filtros
            </Button>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Grado</InputLabel>
                <Select
                  value={filters.grade_id}
                  onChange={(event) => setFilters((current) => ({
                    ...current,
                    grade_id: event.target.value,
                    group_id: '',
                  }))}
                  label="Grado"
                >
                  <MenuItem value="">Todos</MenuItem>
                  {grades.map((grade) => (
                    <MenuItem key={grade.id} value={grade.id}>{grade.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Seccion</InputLabel>
                <Select
                  value={filters.group_id}
                  onChange={(event) => setFilters((current) => ({ ...current, group_id: event.target.value }))}
                  label="Seccion"
                >
                  <MenuItem value="">Todas</MenuItem>
                  {filterGroups.map((group) => (
                    <MenuItem key={group.id} value={group.id}>{group.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Mes</InputLabel>
                <Select
                  value={filters.month_id}
                  onChange={(event) => setFilters((current) => ({ ...current, month_id: event.target.value }))}
                  label="Mes"
                >
                  <MenuItem value="">Todos</MenuItem>
                  {months.map((month) => (
                    <MenuItem key={month.id} value={month.id}>{month.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Semana</InputLabel>
                <Select
                  value={filters.week_number}
                  onChange={(event) => setFilters((current) => ({ ...current, week_number: event.target.value }))}
                  label="Semana"
                >
                  <MenuItem value="">Todas</MenuItem>
                  {weekOptions.map((weekNumber) => (
                    <MenuItem key={weekNumber} value={weekNumber}>{`Semana ${weekNumber}`}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

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
                            <Box sx={{ display: 'flex', gap: 0.75, mt: 0.75, flexWrap: 'wrap' }}>
                              {liveClass.group?.name && (
                                <Chip
                                  label={`Seccion ${liveClass.group.name}`}
                                  size="small"
                                  sx={{ bgcolor: '#f3e5f5', color: '#7b1fa2', fontWeight: 700 }}
                                />
                              )}
                              {(liveClass.month?.name || monthsById[liveClass.month_id]?.name) && (
                                <Chip
                                  label={liveClass.month?.name || monthsById[liveClass.month_id]?.name}
                                  size="small"
                                  sx={{ bgcolor: '#fff8e1', color: '#f57f17', fontWeight: 700 }}
                                />
                              )}
                              {liveClass.week_number && (
                                <Chip
                                  label={`Semana ${liveClass.week_number}`}
                                  size="small"
                                  sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 700 }}
                                />
                              )}
                            </Box>
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
                  onChange={(event) => setForm({
                    ...form,
                    grade_id: event.target.value,
                    group_id: '',
                    subject_id: '',
                  })}
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
                <InputLabel>Seccion</InputLabel>
                <Select
                  value={form.group_id}
                  onChange={(event) => setForm({ ...form, group_id: event.target.value })}
                  label="Seccion"
                >
                  <MenuItem value="">Todas</MenuItem>
                  {availableGroups.map((group) => (
                    <MenuItem key={group.id} value={group.id}>{group.name}</MenuItem>
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
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Mes</InputLabel>
                <Select
                  value={form.month_id}
                  onChange={(event) => setForm({ ...form, month_id: event.target.value })}
                  label="Mes"
                >
                  {months.map((month) => (
                    <MenuItem key={month.id} value={month.id}>{month.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Semana</InputLabel>
                <Select
                  value={form.week_number}
                  onChange={(event) => setForm({ ...form, week_number: event.target.value })}
                  label="Semana"
                >
                  <MenuItem value="">Sin semana</MenuItem>
                  {weekOptions.map((weekNumber) => (
                    <MenuItem key={weekNumber} value={weekNumber}>{`Semana ${weekNumber}`}</MenuItem>
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
                onChange={(event) => {
                  const nextValue = event.target.value;
                  setForm((current) => ({
                    ...current,
                    scheduled_at: nextValue,
                    month_id: current.month_id || inferMonthIdFromDate(nextValue),
                  }));
                }}
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
