import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  Link,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Select,
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
  AssignmentTurnedIn,
  CloudUpload,
  Close,
  Delete,
  Edit,
  FolderOpen,
  Grade,
  Home,
  Save,
  Search,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../api/axios';
import AssetLibraryDialog from '../../components/common/AssetLibraryDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Footer from '../../components/Layout/Footer';
import { uploadFile } from '../../utils/uploads';

const emptyForm = {
  title: '',
  description: '',
  instructions: '',
  activity_type: 'ficha',
  learning_format: 'material',
  subject_id: '',
  group_id: '',
  month_id: '',
  week_number: '',
  file_url: '',
  video_url: '',
  resource_url_input: '',
  resources: [],
  max_score: '',
  due_at: '',
};

const learningFormatLabel = {
  material: 'Material',
  tarea: 'Tarea',
  examen: 'Examen',
};

const toDatetimeLocal = (value) => (value ? new Date(value).toISOString().slice(0, 16) : '');

const deriveFilenameFromUrl = (url) => {
  if (!url) return '';
  const cleanUrl = url.split('?')[0];
  return cleanUrl.split('/').pop() || url;
};

const normalizeResources = (resources = []) =>
  resources
    .filter((resource) => resource?.url?.trim())
    .reduce((accumulator, resource) => {
      const url = resource.url.trim();
      if (accumulator.some((item) => item.url === url)) {
        return accumulator;
      }

      accumulator.push({
        url,
        filename: resource.filename || resource.original_filename || deriveFilenameFromUrl(url),
        content_type: resource.content_type || null,
        order_index: accumulator.length,
      });
      return accumulator;
    }, []);

const mergeResources = (currentResources = [], incomingResources = []) =>
  normalizeResources([...currentResources, ...incomingResources]);

const getActivityResources = (activity) => {
  if (Array.isArray(activity?.resources) && activity.resources.length > 0) {
    return normalizeResources(activity.resources);
  }

  if (activity?.file_url) {
    return normalizeResources([
      {
        url: activity.file_url,
        filename: deriveFilenameFromUrl(activity.file_url),
        content_type: null,
      },
    ]);
  }

  return [];
};

const getResourceLabel = (resource, index) =>
  resource.filename || deriveFilenameFromUrl(resource.url) || `Recurso ${index + 1}`;

const ManageActivities = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, isDocente } = useAuth();

  const [activities, setActivities] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [groups, setGroups] = useState([]);
  const [months, setMonths] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [gradeForm, setGradeForm] = useState({ score: '', feedback: '' });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [submissionsDialogOpen, setSubmissionsDialogOpen] = useState(false);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [assetDialogMode, setAssetDialogMode] = useState('resources');
  const [assetDialogOpen, setAssetDialogOpen] = useState(false);

  const sectionPath = location.pathname.startsWith('/admin') && isAdmin ? '/admin' : '/dashboard';
  const sectionLabel = location.pathname.startsWith('/admin') && isAdmin ? 'Admin' : 'Docencia';

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = isDocente && user?.id ? { created_by: user.id } : undefined;
      const [activitiesRes, subjectsRes, groupsRes, monthsRes, weeksRes] = await Promise.all([
        axiosInstance.get('/activities/', { params }),
        axiosInstance.get('/subjects/'),
        axiosInstance.get('/groups/'),
        axiosInstance.get('/months/'),
        axiosInstance.get('/weeks/'),
      ]);
      setActivities(activitiesRes.data?.results || activitiesRes.data || []);
      setSubjects(subjectsRes.data?.results || subjectsRes.data || []);
      setGroups(groupsRes.data?.results || groupsRes.data || []);
      setMonths(monthsRes.data?.results || monthsRes.data || []);
      setWeeks(weeksRes.data?.results || weeksRes.data || []);
    } catch (err) {
      setError('Error al cargar actividades.');
    } finally {
      setLoading(false);
    }
  }, [isDocente, user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const prefill = location.state?.prefill;
    if (!prefill) return;

    setSelectedActivity(null);
    setForm({
      ...emptyForm,
      subject_id: prefill.subject_id || '',
      month_id: prefill.month_id || '',
      week_number: prefill.week_number || '',
      group_id: prefill.group_id || '',
      learning_format: prefill.learning_format || 'material',
      activity_type: prefill.activity_type || 'ficha',
      title: prefill.title || '',
    });
    setDialogOpen(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const subjectsById = useMemo(() => Object.fromEntries(subjects.map((item) => [item.id, item])), [subjects]);
  const monthsById = useMemo(() => Object.fromEntries(months.map((item) => [item.id, item])), [months]);
  const weeksById = useMemo(() => Object.fromEntries(weeks.map((item) => [item.id, item])), [weeks]);
  const availableGroups = useMemo(() => {
    const selectedSubject = subjectsById[Number(form.subject_id)];
    return groups.filter((group) => {
      if (!selectedSubject) return true;
      return Number(group.grade_id) === Number(selectedSubject.grade_id);
    });
  }, [form.subject_id, groups, subjectsById]);

  useEffect(() => {
    if (!form.group_id) return;
    if (!availableGroups.some((group) => Number(group.id) === Number(form.group_id))) {
      setForm((current) => ({ ...current, group_id: '' }));
    }
  }, [availableGroups, form.group_id]);

  const filteredActivities = useMemo(
    () =>
      activities.filter((activity) => {
        const week = weeksById[activity.week_id];
        const subject = week ? subjectsById[week.subject_id] : null;
        return [activity.title, activity.description, activity.learning_format, subject?.name]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase());
      }),
    [activities, search, subjectsById, weeksById]
  );

  const resolveWeekId = async () => {
    const existing = weeks.find(
      (item) =>
        item.subject_id === Number(form.subject_id) &&
        item.month_id === Number(form.month_id) &&
        item.number === Number(form.week_number)
    );
    if (existing) return existing.id;
    const response = await axiosInstance.post('/weeks/', {
      subject_id: Number(form.subject_id),
      month_id: Number(form.month_id),
      number: Number(form.week_number),
    });
    setWeeks((current) => [...current, response.data]);
    return response.data.id;
  };

  const openCreate = () => {
    setSelectedActivity(null);
    setForm({
      ...emptyForm,
      group_id: user?.group_id || groups[0]?.id || '',
    });
    setDialogOpen(true);
  };

  const openEdit = (activity) => {
    const week = weeksById[activity.week_id];
    const resources = getActivityResources(activity);
    setSelectedActivity(activity);
    setForm({
      title: activity.title || '',
      description: activity.description || '',
      instructions: activity.instructions || '',
      activity_type: activity.activity_type || 'ficha',
      learning_format: activity.learning_format || 'material',
      subject_id: week?.subject_id || '',
      group_id: activity.group_id || '',
      month_id: week?.month_id || '',
      week_number: week?.number || '',
      file_url: resources[0]?.url || '',
      video_url: activity.video_url || '',
      resource_url_input: '',
      resources,
      max_score: activity.max_score ?? '',
      due_at: toDatetimeLocal(activity.due_at),
    });
    setDialogOpen(true);
  };

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploadedResources = [];
      for (const file of files) {
        const uploaded = await uploadFile(file, 'activities');
        uploadedResources.push({
          url: uploaded.url,
          filename: uploaded.filename || file.name,
          content_type: uploaded.content_type || file.type || null,
        });
      }

      setForm((current) => {
        const resources = mergeResources(current.resources, uploadedResources);
        return {
          ...current,
          file_url: resources[0]?.url || '',
          resources,
        };
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo subir el archivo.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleAddResourceUrl = () => {
    const url = form.resource_url_input.trim();
    if (!url) return;

    setForm((current) => {
      const resources = mergeResources(current.resources, [
        {
          url,
          filename: deriveFilenameFromUrl(url),
          content_type: null,
        },
      ]);

      return {
        ...current,
        file_url: resources[0]?.url || '',
        resource_url_input: '',
        resources,
      };
    });
  };

  const handleRemoveResource = (resourceUrl) => {
    setForm((current) => {
      const resources = normalizeResources(
        current.resources.filter((resource) => resource.url !== resourceUrl)
      );

      return {
        ...current,
        file_url: resources[0]?.url || '',
        resources,
      };
    });
  };

  const openAssetDialog = (mode) => {
    setAssetDialogMode(mode);
    setAssetDialogOpen(true);
  };

  const handleAssetSelection = (selectedAssets) => {
    if (assetDialogMode === 'video') {
      const selectedAsset = selectedAssets[0];
      if (!selectedAsset?.url) return;
      setForm((current) => ({
        ...current,
        activity_type: 'video',
        video_url: selectedAsset.url,
      }));
      return;
    }

    const incomingResources = selectedAssets.map((asset) => ({
      url: asset.url,
      filename: asset.original_filename || asset.filename || deriveFilenameFromUrl(asset.url),
      content_type: asset.content_type || null,
    }));

    setForm((current) => {
      const resources = mergeResources(current.resources, incomingResources);
      const isVideoActivity = current.activity_type === 'video';
      return {
        ...current,
        activity_type: isVideoActivity ? 'video' : 'ficha',
        file_url: resources[0]?.url || '',
        resources,
      };
    });
  };

  const handleSave = async () => {
    const normalizedResources = normalizeResources(form.resources);
    if (!form.title.trim() || !form.subject_id || !form.month_id || !form.week_number) {
      setError('Titulo, materia, mes y semana son obligatorios.');
      return;
    }
    if (form.activity_type === 'ficha' && normalizedResources.length === 0) {
      setError('El archivo o recurso requiere al menos un adjunto.');
      return;
    }
    if (form.activity_type === 'video' && !form.video_url.trim()) {
      setError('El video requiere URL.');
      return;
    }
    if (form.learning_format !== 'material' && !form.instructions.trim() && !form.description.trim()) {
      setError('La tarea o examen debe tener indicaciones.');
      return;
    }
    if (isDocente && !form.group_id) {
      setError('Debes seleccionar una seccion para publicar esta actividad.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const weekId = await resolveWeekId();
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        instructions: form.instructions.trim() || null,
        activity_type: form.activity_type,
        learning_format: form.learning_format,
        week_id: weekId,
        group_id: form.group_id ? Number(form.group_id) : null,
        file_url: normalizedResources[0]?.url || null,
        video_url: form.activity_type === 'video' ? form.video_url.trim() : null,
        resources: normalizedResources,
        max_score: form.learning_format === 'material' || form.max_score === '' ? null : Number(form.max_score),
        due_at: form.learning_format === 'material' || !form.due_at ? null : new Date(form.due_at).toISOString(),
      };

      if (selectedActivity) {
        await axiosInstance.put(`/activities/${selectedActivity.id}`, payload);
        setSuccess('Actividad actualizada.');
      } else {
        await axiosInstance.post('/activities/', payload);
        setSuccess('Actividad creada.');
      }
      setDialogOpen(false);
      setForm(emptyForm);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar actividad.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedActivity) return;
    setSaving(true);
    try {
      await axiosInstance.delete(`/activities/${selectedActivity.id}`);
      setSuccess('Actividad eliminada.');
      setDeleteDialogOpen(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al eliminar actividad.');
    } finally {
      setSaving(false);
    }
  };

  const openSubmissions = async (activity) => {
    setSelectedActivity(activity);
    setSubmissionsDialogOpen(true);
    try {
      const response = await axiosInstance.get('/activity-submissions/', { params: { activity_id: activity.id } });
      setSubmissions(response.data || []);
    } catch (err) {
      setError('No se pudieron cargar las entregas.');
    }
  };

  const openGrade = (submission) => {
    setSelectedSubmission(submission);
    setGradeForm({ score: submission.score ?? '', feedback: submission.feedback || '' });
    setGradeDialogOpen(true);
  };

  const saveGrade = async () => {
    if (!selectedSubmission) return;
    setSaving(true);
    try {
      await axiosInstance.put(`/activity-submissions/${selectedSubmission.id}/grade`, {
        score: gradeForm.score === '' ? null : Number(gradeForm.score),
        feedback: gradeForm.feedback.trim() || null,
      });
      setGradeDialogOpen(false);
      openSubmissions(selectedActivity);
      fetchData();
      setSuccess('Entrega revisada.');
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo guardar la revision.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Cargando actividades..." />;

  return (
    <Box sx={{ background: '#f5f7fa', minHeight: '100vh' }}>
      <Box sx={{ background: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)', py: 5 }}>
        <Container maxWidth="lg">
          <Breadcrumbs sx={{ mb: 2 }} separator=">">
            <Link component="button" onClick={() => navigate('/dashboard')} sx={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>
              <Home sx={{ fontSize: '1rem', mr: 0.3, verticalAlign: 'middle' }} /> Dashboard
            </Link>
            <Link component="button" onClick={() => navigate(sectionPath)} sx={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>
              {sectionLabel}
            </Link>
            <Typography sx={{ color: '#fff', fontWeight: 700 }}>Actividades</Typography>
          </Breadcrumbs>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#fff' }}>
                Material, tareas y examenes
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.92)' }}>
                {activities.length} elementos publicados
              </Typography>
            </Box>
            <Button variant="contained" startIcon={<Add />} onClick={openCreate} sx={{ background: '#ff9800', '&:hover': { background: '#f57c00' } }}>
              Nueva actividad
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Paper sx={{ p: 2, mb: 2 }}>
          <TextField
            fullWidth
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar actividades..."
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
          />
        </Paper>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Titulo</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Formato</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Materia</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Seccion</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Semana</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Entregas</TableCell>
                <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredActivities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    No hay actividades registradas.
                  </TableCell>
                </TableRow>
              ) : (
                filteredActivities.map((activity) => {
                  const week = weeksById[activity.week_id];
                  const subject = week ? subjectsById[week.subject_id] : null;
                  const month = week ? monthsById[week.month_id] : null;
                  const isEvaluation = activity.learning_format !== 'material';
                  const resourceCount = getActivityResources(activity).length;
                  return (
                    <TableRow key={activity.id}>
                      <TableCell>
                        <Typography fontWeight={700}>{activity.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {activity.activity_type === 'video'
                            ? resourceCount > 0
                              ? `Video + ${resourceCount} recurso${resourceCount === 1 ? '' : 's'}`
                              : 'Video'
                            : resourceCount > 0
                            ? `${resourceCount} recurso${resourceCount === 1 ? '' : 's'}`
                            : 'Recurso'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={learningFormatLabel[activity.learning_format] || 'Material'} />
                        {activity.max_score ? <Chip size="small" label={`Nota ${activity.max_score}`} sx={{ ml: 0.5 }} /> : null}
                      </TableCell>
                      <TableCell>{subject?.name || 'Sin materia'}</TableCell>
                      <TableCell>{activity.group_name || (activity.group_id ? `Seccion ${activity.group_id}` : 'Todo el grado')}</TableCell>
                      <TableCell>{month?.name || 'Sin mes'}{week ? ` · Semana ${week.number}` : ''}</TableCell>
                      <TableCell>{isEvaluation ? `${activity.submission_count || 0} entregas` : 'No aplica'}</TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        {isEvaluation && (
                          <IconButton size="small" onClick={() => openSubmissions(activity)} color="primary">
                            <AssignmentTurnedIn fontSize="small" />
                          </IconButton>
                        )}
                        <IconButton size="small" onClick={() => openEdit(activity)} color="secondary">
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => { setSelectedActivity(activity); setDeleteDialogOpen(true); }} color="error">
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography fontWeight={700}>{selectedActivity ? 'Editar actividad' : 'Nueva actividad'}</Typography>
          <IconButton onClick={() => setDialogOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={8}>
              <TextField fullWidth label="Titulo" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Formato</InputLabel>
                <Select value={form.learning_format} label="Formato" onChange={(event) => setForm({ ...form, learning_format: event.target.value })}>
                  <MenuItem value="material">Material</MenuItem>
                  <MenuItem value="tarea">Tarea</MenuItem>
                  <MenuItem value="examen">Examen</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={2} label="Descripcion" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} label="Instrucciones" value={form.instructions} onChange={(event) => setForm({ ...form, instructions: event.target.value })} />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={form.activity_type}
                  label="Tipo"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      activity_type: event.target.value,
                      file_url:
                        event.target.value === 'ficha'
                          ? current.resources[0]?.url || current.file_url
                          : current.file_url,
                      video_url: event.target.value === 'video' ? current.video_url : '',
                    }))
                  }
                >
                  <MenuItem value="ficha">Archivo / recurso</MenuItem>
                  <MenuItem value="video">Video</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Materia</InputLabel>
                <Select value={form.subject_id} label="Materia" onChange={(event) => setForm({ ...form, subject_id: event.target.value })}>
                  {subjects.map((subject) => <MenuItem key={subject.id} value={subject.id}>{subject.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth disabled={!form.subject_id}>
                <InputLabel>Seccion</InputLabel>
                <Select value={form.group_id} label="Seccion" onChange={(event) => setForm({ ...form, group_id: event.target.value })}>
                  {!isDocente && <MenuItem value="">Todo el grado</MenuItem>}
                  {availableGroups.map((group) => <MenuItem key={group.id} value={group.id}>{group.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Mes</InputLabel>
                <Select value={form.month_id} label="Mes" onChange={(event) => setForm({ ...form, month_id: event.target.value })}>
                  {months.map((month) => <MenuItem key={month.id} value={month.id}>{month.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                type="number"
                label="Semana"
                value={form.week_number}
                onChange={(event) => setForm({ ...form, week_number: event.target.value })}
                inputProps={{ min: 1, step: 1 }}
              />
            </Grid>
            {form.learning_format !== 'material' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth type="number" label="Nota maxima" value={form.max_score} onChange={(event) => setForm({ ...form, max_score: event.target.value })} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth type="datetime-local" label="Fecha limite" InputLabelProps={{ shrink: true }} value={form.due_at} onChange={(event) => setForm({ ...form, due_at: event.target.value })} />
                </Grid>
              </>
            )}
            {form.activity_type === 'ficha' ? (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Pegar enlace de recurso"
                    value={form.resource_url_input}
                    onChange={(event) => setForm({ ...form, resource_url_input: event.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button variant="outlined" startIcon={<Add />} onClick={handleAddResourceUrl}>
                      Agregar enlace
                    </Button>
                    <Button variant="outlined" startIcon={<FolderOpen />} onClick={() => openAssetDialog('resources')}>
                      Biblioteca de archivos
                    </Button>
                    <Button component="label" variant="outlined" startIcon={<CloudUpload />} disabled={uploading}>
                      {uploading ? 'Subiendo...' : 'Subir archivo o recurso'}
                      <input type="file" hidden multiple onChange={handleUpload} />
                    </Button>
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    Admite fichas, PDF, imagenes, laminas y otros recursos. Puedes adjuntar varios.
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  {form.resources.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Aun no hay recursos adjuntos.
                    </Typography>
                  ) : (
                    <List dense>
                      {form.resources.map((resource, index) => (
                        <ListItem
                          key={`${resource.url}-${index}`}
                          divider
                          secondaryAction={
                            <IconButton edge="end" color="error" onClick={() => handleRemoveResource(resource.url)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          }
                        >
                          <ListItemText
                            primary={getResourceLabel(resource, index)}
                            secondary={resource.url}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="URL principal heredada"
                    value={form.file_url}
                    InputProps={{ readOnly: true }}
                    helperText="Se mantiene por compatibilidad con actividades antiguas."
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    El estudiante vera todos los recursos adjuntos dentro de la misma actividad.
                  </Typography>
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={12}>
                  <TextField fullWidth label="URL del video" value={form.video_url} onChange={(event) => setForm({ ...form, video_url: event.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="outlined" startIcon={<FolderOpen />} onClick={() => openAssetDialog('video')}>
                    Biblioteca de videos
                  </Button>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" fontWeight={700}>
                    Recursos para descargar
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                    Opcional. Aqui puedes adjuntar PDF, fichas, imagenes y otros archivos para acompanar el video.
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Pegar enlace de recurso"
                    value={form.resource_url_input}
                    onChange={(event) => setForm({ ...form, resource_url_input: event.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button variant="outlined" startIcon={<Add />} onClick={handleAddResourceUrl}>
                      Agregar enlace
                    </Button>
                    <Button variant="outlined" startIcon={<FolderOpen />} onClick={() => openAssetDialog('resources')}>
                      Biblioteca de archivos
                    </Button>
                    <Button component="label" variant="outlined" startIcon={<CloudUpload />} disabled={uploading}>
                      {uploading ? 'Subiendo...' : 'Subir PDF o recurso'}
                      <input type="file" hidden multiple onChange={handleUpload} />
                    </Button>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  {form.resources.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Aun no hay recursos descargables adjuntos.
                    </Typography>
                  ) : (
                    <List dense>
                      {form.resources.map((resource, index) => (
                        <ListItem
                          key={`${resource.url}-${index}`}
                          divider
                          secondaryAction={
                            <IconButton edge="end" color="error" onClick={() => handleRemoveResource(resource.url)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          }
                        >
                          <ListItemText
                            primary={getResourceLabel(resource, index)}
                            secondary={resource.url}
                          />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="URL principal heredada de descarga"
                    value={form.file_url}
                    InputProps={{ readOnly: true }}
                    helperText="Se usa para compatibilidad y apunta al primer recurso descargable."
                  />
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} startIcon={<Save />}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Eliminar actividad</DialogTitle>
        <DialogContent>Eliminar <strong>{selectedActivity?.title}</strong>?</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={saving}>Eliminar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={submissionsDialogOpen} onClose={() => setSubmissionsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography fontWeight={700}>Entregas de {selectedActivity?.title}</Typography>
          <IconButton onClick={() => setSubmissionsDialogOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent>
          {submissions.length === 0 ? (
            <Alert severity="info">Aun no hay entregas.</Alert>
          ) : (
            <List>
              {submissions.map((submission) => (
                <ListItem
                  key={submission.id}
                  divider
                  secondaryAction={<Button startIcon={<Grade />} onClick={() => openGrade(submission)}>Revisar</Button>}
                >
                  <ListItemText
                    primary={submission.student_name || `Alumno ${submission.student_id}`}
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">{submission.response_text || 'Sin texto'}</Typography>
                        {submission.attachment_url ? <Link href={submission.attachment_url} target="_blank" rel="noreferrer">Ver archivo</Link> : null}
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={gradeDialogOpen} onClose={() => setGradeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Revisar entrega</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth type="number" label="Nota" value={gradeForm.score} onChange={(event) => setGradeForm({ ...gradeForm, score: event.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={4} label="Retroalimentacion" value={gradeForm.feedback} onChange={(event) => setGradeForm({ ...gradeForm, feedback: event.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGradeDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={saveGrade} disabled={saving}>Guardar revision</Button>
        </DialogActions>
      </Dialog>

      <AssetLibraryDialog
        open={assetDialogOpen}
        onClose={() => setAssetDialogOpen(false)}
        onSelect={handleAssetSelection}
        title={assetDialogMode === 'video' ? 'Biblioteca de videos' : 'Biblioteca de archivos para actividades'}
        category="activities"
        multiple={assetDialogMode !== 'video'}
        selectedAssets={
          assetDialogMode === 'video'
            ? (form.video_url
              ? [{
                  url: form.video_url,
                  original_filename: deriveFilenameFromUrl(form.video_url),
                  media_kind: 'video',
                }]
              : [])
            : form.resources
        }
        allowedMediaKinds={assetDialogMode === 'video' ? ['video'] : ['all']}
        helperText={
          assetDialogMode === 'video'
            ? 'Admin ve todos los videos. El docente solo ve los videos que subio.'
            : 'Admin ve todos los archivos. El docente solo ve los archivos que subio.'
        }
      />

      <Footer />
    </Box>
  );
};

export default ManageActivities;
