import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  Link,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add,
  AutoStories,
  CheckCircle,
  CloudUpload,
  Delete,
  Download,
  Edit,
  FolderOpen,
  Home,
  Image as ImageIcon,
  InsertDriveFile,
  Movie,
  OndemandVideo,
  OpenInNew,
  PictureAsPdf,
  PlayCircle,
  Quiz,
  RadioButtonUnchecked,
  Save,
  Search,
  TableChart,
  YouTube,
} from '@mui/icons-material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import axiosInstance from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Footer from '../../components/Layout/Footer';
import { useAuth } from '../../context/AuthContext';
import { uploadFile } from '../../utils/uploads';
import {
  buildProgressMap,
  getProgressStatusColor,
  getProgressStatusLabel,
  PROGRESS_STATUS,
} from '../../utils/progress';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'Todas las categorias' },
  { value: 'ficha', label: 'Fichas' },
  { value: 'video', label: 'Videos' },
  { value: 'material', label: 'Materiales' },
  { value: 'tarea', label: 'Tareas' },
  { value: 'examen', label: 'Examenes' },
];

const emptyContentForm = {
  title: '',
  description: '',
  instructions: '',
  activity_type: 'ficha',
  learning_format: 'material',
  file_url: '',
  video_url: '',
  max_score: '',
  due_at: '',
  content_kind: 'pdf',
};

// ── Content helpers ─────────────────────────────────────────────────────────

const getYoutubeEmbedUrl = (url) => {
  if (!url) return null;
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/,
    /youtube\.com\/shorts\/([^?]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
  }
  return null;
};

const detectContentKind = (url) => {
  if (!url) return 'file';
  if (getYoutubeEmbedUrl(url)) return 'youtube';
  const lower = url.toLowerCase().split('?')[0];
  if (lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov')) return 'video';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.gif') || lower.endsWith('.webp')) return 'image';
  if (lower.endsWith('.pdf')) return 'pdf';
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.csv')) return 'excel';
  return 'file';
};

const resolveMediaUrl = (form) => form.video_url || form.file_url || '';

const typeChipOptions = [
  { value: 'pdf', label: 'Ficha / PDF', icon: <PictureAsPdf fontSize="small" />, color: '#e53935' },
  { value: 'youtube', label: 'YouTube', icon: <YouTube fontSize="small" />, color: '#ff0000' },
  { value: 'video', label: 'Video / MP4', icon: <Movie fontSize="small" />, color: '#1976d2' },
  { value: 'image', label: 'Imagen', icon: <ImageIcon fontSize="small" />, color: '#43a047' },
  { value: 'excel', label: 'Excel / Datos', icon: <TableChart fontSize="small" />, color: '#1b5e20' },
  { value: 'file', label: 'Archivo', icon: <InsertDriveFile fontSize="small" />, color: '#546e7a' },
];

const fileTypeAcceptMap = {
  pdf: '.pdf',
  video: '.mp4,.webm,.mov,.avi',
  image: '.jpg,.jpeg,.png,.gif,.webp,.svg',
  excel: '.xlsx,.xls,.csv,.ods',
  file: '*',
};

const ContentPreview = ({ url, kind }) => {
  if (!url) return null;
  const embedUrl = kind === 'youtube' ? getYoutubeEmbedUrl(url) : null;

  return (
    <Box sx={{ mt: 2, borderRadius: 2, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
      {kind === 'youtube' && embedUrl && (
        <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
          <iframe
            src={embedUrl}
            title="YouTube preview"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          />
        </Box>
      )}
      {kind === 'video' && (
        <video controls style={{ width: '100%', maxHeight: 300, display: 'block' }}>
          <source src={url} />
          Tu navegador no soporta reproduccion de video.
        </video>
      )}
      {kind === 'image' && (
        <img
          src={url}
          alt="preview"
          style={{ width: '100%', maxHeight: 300, objectFit: 'contain', display: 'block' }}
        />
      )}
      {kind === 'pdf' && (
        <Box sx={{ height: 300 }}>
          <iframe src={url} title="PDF preview" style={{ width: '100%', height: '100%', border: 'none' }} />
        </Box>
      )}
      {(kind === 'excel' || kind === 'file') && (
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          {kind === 'excel' ? <TableChart color="success" /> : <InsertDriveFile />}
          <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {url.split('/').pop()}
          </Typography>
          <Tooltip title="Abrir archivo">
            <IconButton size="small" onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}>
              <OpenInNew fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
};

// ── Page helpers ─────────────────────────────────────────────────────────────

const getActivityDate = (activity) => activity.due_at || activity.created_at || null;

const matchesCategory = (activity, categoryFilter) => {
  if (categoryFilter === 'all') return true;
  if (categoryFilter === 'ficha' || categoryFilter === 'video') {
    return activity.activity_type === categoryFilter;
  }
  return activity.learning_format === categoryFilter;
};

const matchesDateRange = (activity, dateFrom, dateTo) => {
  if (!dateFrom && !dateTo) return true;

  const activityDate = getActivityDate(activity);
  if (!activityDate) return false;

  const currentDate = new Date(activityDate);
  if (Number.isNaN(currentDate.getTime())) return false;

  if (dateFrom) {
    const fromDate = new Date(`${dateFrom}T00:00:00`);
    if (currentDate < fromDate) return false;
  }

  if (dateTo) {
    const toDate = new Date(`${dateTo}T23:59:59`);
    if (currentDate > toDate) return false;
  }

  return true;
};

const toDatetimeLocal = (value) => (value ? new Date(value).toISOString().slice(0, 16) : '');

const buildContentSummary = (activities) => ({
  total: activities.length,
  fichas: activities.filter((item) => item.activity_type === 'ficha').length,
  videos: activities.filter((item) => item.activity_type === 'video').length,
  materiales: activities.filter((item) => item.learning_format === 'material').length,
  tareas: activities.filter((item) => item.learning_format === 'tarea').length,
  examenes: activities.filter((item) => item.learning_format === 'examen').length,
});

const WeekPage = () => {
  const { subjectId, month, week } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAdmin, isDocente, isEstudiante } = useAuth();

  const canManageContent = isAdmin || isDocente;
  const activeGroupId = searchParams.get('group_id');
  const activeGroupName = searchParams.get('group_name');
  const activeGroupLabel = activeGroupName || (activeGroupId ? `Seccion ${activeGroupId}` : '');
  const groupQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (activeGroupId) params.set('group_id', activeGroupId);
    if (activeGroupName) params.set('group_name', activeGroupName);
    const value = params.toString();
    return value ? `?${value}` : '';
  }, [activeGroupId, activeGroupName]);

  const [subject, setSubject] = useState(null);
  const [monthRecord, setMonthRecord] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(null);
  const [activities, setActivities] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [contentDialogOpen, setContentDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFilename, setUploadedFilename] = useState('');
  const [confirmStep, setConfirmStep] = useState(false);
  const [submissionActivity, setSubmissionActivity] = useState(null);
  const [editingActivity, setEditingActivity] = useState(null);
  const [activityToDelete, setActivityToDelete] = useState(null);
  const [submissionForm, setSubmissionForm] = useState({ response_text: '', attachment_url: '' });
  const [contentForm, setContentForm] = useState(emptyContentForm);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [subjectRes, monthsRes] = await Promise.all([
        axiosInstance.get(`/subjects/${subjectId}/`),
        axiosInstance.get('/months/'),
      ]);

      const currentMonthRecord = (monthsRes.data || []).find((item) => item.number === Number(month));
      if (!currentMonthRecord) {
        throw new Error('Mes no encontrado');
      }

      const weeksRes = await axiosInstance.get('/weeks/', {
        params: { subject_id: subjectId, month_id: currentMonthRecord.id },
      });

      const weekMatch = (weeksRes.data || []).find((item) => item.number === Number(week));
      if (!weekMatch) {
        throw new Error('Semana no encontrada');
      }

      const activitiesRes = await axiosInstance.get('/activities/', {
        params: { week_id: weekMatch.id },
      });

      let nextProgressMap = {};
      if (isEstudiante && user?.id) {
        const progressRes = await axiosInstance.get(`/progress/student/${user.id}`);
        nextProgressMap = buildProgressMap(progressRes.data || []);
      }

      setSubject(subjectRes.data);
      setMonthRecord(currentMonthRecord);
      setCurrentWeek(weekMatch);
      setActivities(activitiesRes.data || []);
      setProgressMap(nextProgressMap);
    } catch (err) {
      setError('Error al cargar el contenido de la semana.');
    } finally {
      setLoading(false);
    }
  }, [isEstudiante, month, subjectId, user?.id, week]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const monthName = MONTHS[Number(month) - 1] || `Mes ${month}`;
  const summary = useMemo(() => buildContentSummary(activities), [activities]);
  const completedCount = activities.filter(
    (item) => progressMap[item.id]?.status === PROGRESS_STATUS.COMPLETED
  ).length;

  const visibleActivities = useMemo(() => {
    let nextActivities = [...activities];

    if (tabValue === 1) {
      nextActivities = nextActivities.filter((item) => item.activity_type === 'ficha');
    } else if (tabValue === 2) {
      nextActivities = nextActivities.filter((item) => item.activity_type === 'video');
    } else if (tabValue === 3) {
      nextActivities = nextActivities.filter((item) => item.learning_format !== 'material');
    }

    nextActivities = nextActivities.filter((item) => matchesCategory(item, categoryFilter));
    nextActivities = nextActivities.filter((item) => matchesDateRange(item, dateFrom, dateTo));

    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      nextActivities = nextActivities.filter((item) =>
        [item.title, item.description, item.instructions]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(term)
      );
    }

    return nextActivities;
  }, [activities, categoryFilter, dateFrom, dateTo, searchTerm, tabValue]);

  const clearFilters = () => {
    setCategoryFilter('all');
    setDateFrom('');
    setDateTo('');
    setSearchTerm('');
  };

  const persistStatus = async (activityId, status) => {
    const existing = progressMap[activityId];
    const response = existing
      ? await axiosInstance.put(`/progress/${existing.id}`, { status })
      : await axiosInstance.post('/progress/', {
          student_id: user.id,
          activity_id: activityId,
          status,
        });

    setProgressMap((current) => ({
      ...current,
      [activityId]: response.data,
    }));
  };

  const handleOpenResource = async (activity) => {
    const resourceUrl = activity.file_url || activity.video_url;
    if (resourceUrl) {
      window.open(resourceUrl, '_blank', 'noopener,noreferrer');
    }

    if (isEstudiante && activity.learning_format === 'material') {
      const currentStatus = progressMap[activity.id]?.status || PROGRESS_STATUS.PENDING;
      if (currentStatus === PROGRESS_STATUS.PENDING) {
        await persistStatus(activity.id, PROGRESS_STATUS.IN_PROGRESS);
      }
    }
  };

  const toggleComplete = async (activityId) => {
    setSavingId(activityId);
    try {
      const currentStatus = progressMap[activityId]?.status || PROGRESS_STATUS.PENDING;
      await persistStatus(
        activityId,
        currentStatus === PROGRESS_STATUS.COMPLETED
          ? PROGRESS_STATUS.PENDING
          : PROGRESS_STATUS.COMPLETED
      );
    } catch (err) {
      setError('No se pudo actualizar el progreso.');
    } finally {
      setSavingId(null);
    }
  };

  const openSubmissionDialog = (activity) => {
    setSubmissionActivity(activity);
    setSubmissionForm({
      response_text: activity.my_submission?.response_text || '',
      attachment_url: activity.my_submission?.attachment_url || '',
    });
    setSubmissionDialogOpen(true);
  };

  const handleSubmissionUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploaded = await uploadFile(file, 'submissions');
      setSubmissionForm((current) => ({ ...current, attachment_url: uploaded.url }));
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo subir el archivo.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const saveSubmission = async () => {
    if (!submissionActivity) return;

    setSavingId(submissionActivity.id);
    try {
      const response = await axiosInstance.post('/activity-submissions/', {
        activity_id: submissionActivity.id,
        response_text: submissionForm.response_text.trim() || null,
        attachment_url: submissionForm.attachment_url || null,
      });

      setActivities((current) =>
        current.map((activity) =>
          activity.id === submissionActivity.id
            ? {
                ...activity,
                my_submission: response.data,
                submission_count:
                  (activity.submission_count || 0) + (activity.my_submission ? 0 : 1),
              }
            : activity
        )
      );

      setProgressMap((current) => ({
        ...current,
        [submissionActivity.id]: {
          ...(current[submissionActivity.id] || {}),
          activity_id: submissionActivity.id,
          status: PROGRESS_STATUS.COMPLETED,
        },
      }));

      setSuccess('Entrega enviada correctamente.');
      setSubmissionDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo enviar la entrega.');
    } finally {
      setSavingId(null);
    }
  };

  const openCreateDialog = () => {
    setEditingActivity(null);
    setContentForm(emptyContentForm);
    setUploadProgress(0);
    setUploadedFilename('');
    setConfirmStep(false);
    setContentDialogOpen(true);
  };

  const openEditDialog = (activity) => {
    setEditingActivity(activity);
    const existingUrl = activity.file_url || activity.video_url || '';
    const kind = detectContentKind(existingUrl);
    setContentForm({
      title: activity.title || '',
      description: activity.description || '',
      instructions: activity.instructions || '',
      activity_type: activity.activity_type || 'ficha',
      learning_format: activity.learning_format || 'material',
      file_url: activity.file_url || '',
      video_url: activity.video_url || '',
      max_score: activity.max_score ?? '',
      due_at: toDatetimeLocal(activity.due_at),
      content_kind: kind,
    });
    setUploadProgress(0);
    setUploadedFilename('');
    setConfirmStep(false);
    setContentDialogOpen(true);
  };

  const handleContentUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadedFilename(file.name);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'activities');

      const response = await axiosInstance.post('/uploads/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
          }
        },
      });

      const uploaded = response.data;
      const detectedKind = detectContentKind(uploaded.url);
      setContentForm((current) => ({
        ...current,
        file_url: uploaded.url,
        video_url: '',
        content_kind: detectedKind,
        activity_type: detectedKind === 'youtube' || detectedKind === 'video' ? 'video' : 'ficha',
      }));
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo subir el archivo.');
      setUploadedFilename('');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const requestConfirm = () => {
    setError('');
    if (!currentWeek) { setError('No se encontro la semana actual.'); return; }
    if (!contentForm.title.trim()) { setError('El titulo es obligatorio.'); return; }
    const contentUrl = resolveMediaUrl(contentForm);
    if (!contentUrl.trim()) { setError('Debes agregar un archivo, URL o enlace de YouTube.'); return; }
    if (
      contentForm.learning_format !== 'material' &&
      !contentForm.instructions.trim() &&
      !contentForm.description.trim()
    ) { setError('Las tareas y examenes deben tener descripcion o instrucciones.'); return; }
    setConfirmStep(true);
  };

  const saveContent = async () => {
    setSavingId(editingActivity?.id || 'new');
    setError('');
    const contentUrl = resolveMediaUrl(contentForm);

    const isYoutubeOrVideo = contentForm.content_kind === 'youtube' || contentForm.content_kind === 'video';

    try {
      const payload = {
        title: contentForm.title.trim(),
        description: contentForm.description.trim() || null,
        instructions: contentForm.instructions.trim() || null,
        activity_type: isYoutubeOrVideo ? 'video' : 'ficha',
        learning_format: contentForm.learning_format,
        week_id: currentWeek.id,
        file_url: isYoutubeOrVideo ? null : (contentForm.file_url.trim() || null),
        video_url: isYoutubeOrVideo ? contentUrl.trim() : null,
        max_score:
          contentForm.learning_format === 'material' || contentForm.max_score === ''
            ? null
            : Number(contentForm.max_score),
        due_at:
          contentForm.learning_format === 'material' || !contentForm.due_at
            ? null
            : new Date(contentForm.due_at).toISOString(),
      };

      if (editingActivity) {
        await axiosInstance.put(`/activities/${editingActivity.id}`, payload);
        setSuccess('Contenido actualizado.');
      } else {
        await axiosInstance.post('/activities/', payload);
        setSuccess('Contenido creado.');
      }

      setContentDialogOpen(false);
      setContentForm(emptyContentForm);
      setEditingActivity(null);
      setConfirmStep(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo guardar el contenido.');
    } finally {
      setSavingId(null);
    }
  };

  const deleteContent = async () => {
    if (!activityToDelete) return;

    setSavingId(activityToDelete.id);
    try {
      await axiosInstance.delete(`/activities/${activityToDelete.id}`);
      setDeleteDialogOpen(false);
      setActivityToDelete(null);
      setSuccess('Contenido eliminado.');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo eliminar el contenido.');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Cargando actividades..." />;
  }

  const currentMediaUrl = resolveMediaUrl(contentForm);

  return (
    <Box sx={{ background: '#f5f7fa', minHeight: '100vh' }}>
      <Box sx={{ background: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)', py: 6 }}>
        <Container maxWidth="lg">
          <Breadcrumbs sx={{ mb: 2 }} separator=">">
            <Link
              component="button"
              onClick={() => navigate('/dashboard')}
              sx={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}
            >
              <Home sx={{ fontSize: '0.95rem', mr: 0.3, verticalAlign: 'middle' }} /> Dashboard
            </Link>
            <Link
              component="button"
              onClick={() => navigate(`/subjects/${subjectId}${groupQuery}`)}
              sx={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}
            >
              {subject?.name || 'Materia'}
            </Link>
            <Link
              component="button"
              onClick={() => navigate(`/subjects/${subjectId}/month/${month}${groupQuery}`)}
              sx={{ color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}
            >
              {monthName}
            </Link>
            <Typography sx={{ color: '#fff', fontWeight: 700 }}>Semana {week}</Typography>
          </Breadcrumbs>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 2,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <Box>
              <Typography variant="h4" fontWeight={800} sx={{ color: '#fff' }}>
                Semana {week} · {monthName}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.92)', mt: 1 }}>
                {summary.total} contenidos publicados · {completedCount} completados
              </Typography>
              {activeGroupLabel && (
                <Chip
                  label={`Seccion activa: ${activeGroupLabel}`}
                  sx={{
                    mt: 1.5,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontWeight: 700,
                  }}
                />
              )}
            </Box>

            {canManageContent && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<FolderOpen />}
                  onClick={() =>
                    navigate('/teaching/activities', {
                      state: {
                        prefill: {
                          subject_id: Number(subjectId),
                          month_id: monthRecord?.id || '',
                          week_number: Number(week),
                        },
                      },
                    })
                  }
                  sx={{
                    background: '#1a237e',
                    '&:hover': { background: '#11195b' },
                  }}
                >
                  Gestor completo
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={openCreateDialog}
                  sx={{
                    background: '#ff9800',
                    '&:hover': { background: '#f57c00' },
                  }}
                >
                  Nuevo contenido
                </Button>
              </Box>
            )}
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            {
              label: 'Fichas y materiales',
              value: summary.fichas,
              helper: `${summary.materiales} materiales de consulta`,
              icon: <AutoStories sx={{ color: '#1976d2' }} />,
            },
            {
              label: 'Videos',
              value: summary.videos,
              helper: 'Explicaciones y apoyo audiovisual',
              icon: <OndemandVideo sx={{ color: '#e91e63' }} />,
            },
            {
              label: 'Evaluaciones',
              value: summary.tareas + summary.examenes,
              helper: `${summary.tareas} tareas y ${summary.examenes} examenes`,
              icon: <Quiz sx={{ color: '#8e24aa' }} />,
            },
            {
              label: 'Progreso',
              value: completedCount,
              helper: `${activities.length} actividades en total`,
              icon: <CheckCircle sx={{ color: '#2e7d32' }} />,
            },
          ].map((item) => (
            <Grid item xs={12} md={6} lg={3} key={item.label}>
              <Paper
                sx={{
                  p: 2.5,
                  borderRadius: '20px',
                  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: '16px',
                    background: 'rgba(25, 118, 210, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {item.label}
                  </Typography>
                  <Typography variant="h5" fontWeight={800}>
                    {item.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.helper}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Paper sx={{ p: 1, mb: 2, display: 'inline-flex', borderRadius: '18px' }}>
          <Tabs value={tabValue} onChange={(_, value) => setTabValue(value)}>
            <Tab label={`Todos (${activities.length})`} />
            <Tab label={`Fichas (${summary.fichas})`} />
            <Tab label={`Videos (${summary.videos})`} />
            <Tab label={`Tareas / Examenes (${summary.tareas + summary.examenes})`} />
          </Tabs>
        </Paper>

        <Paper
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: '20px',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)',
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Buscar contenido"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Categoria</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Categoria"
                  onChange={(event) => setCategoryFilter(event.target.value)}
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type="date"
                label="Desde"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                type="date"
                label="Hasta"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={1}>
              <Button fullWidth variant="outlined" onClick={clearFilters} sx={{ height: '100%' }}>
                Limpiar
              </Button>
            </Grid>
          </Grid>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            Se muestran {visibleActivities.length} de {activities.length} actividades segun los filtros actuales.
          </Typography>
        </Paper>

        <Grid container spacing={2.5}>
          {visibleActivities.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 5, textAlign: 'center', borderRadius: '24px' }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                  No hay contenido para esos filtros.
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  Ajusta la busqueda o publica fichas, videos, tareas y examenes en esta semana.
                </Typography>
                {canManageContent && (
                  <Button variant="contained" startIcon={<Add />} onClick={openCreateDialog}>
                    Crear primer contenido
                  </Button>
                )}
              </Paper>
            </Grid>
          ) : (
            visibleActivities.map((activity) => {
              const status = progressMap[activity.id]?.status || PROGRESS_STATUS.PENDING;
              const isEvaluation = activity.learning_format !== 'material';
              const submission = activity.my_submission;
              const activityDate = getActivityDate(activity);
              const canEditActivity = isAdmin || (isDocente && activity.created_by === user?.id);

              return (
                <Grid item xs={12} sm={6} lg={4} key={activity.id}>
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: '24px',
                      borderTop: isEvaluation ? '4px solid #ff9800' : '4px solid #1976d2',
                      boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 1.5 }}>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip
                            size="small"
                            label={activity.activity_type === 'video' ? 'Video' : 'Ficha'}
                          />
                          <Chip
                            size="small"
                            label={
                              activity.learning_format === 'material'
                                ? 'Material'
                                : activity.learning_format === 'tarea'
                                ? 'Tarea'
                                : 'Examen'
                            }
                            color={isEvaluation ? 'warning' : 'success'}
                          />
                        </Box>

                        {canManageContent && canEditActivity && (
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton size="small" color="primary" onClick={() => openEditDialog(activity)}>
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setActivityToDelete(activity);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </Box>

                      <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                        {activity.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 2, minHeight: 44 }}
                      >
                        {activity.description || activity.instructions || 'Sin descripcion'}
                      </Typography>

                      {activity.instructions && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                          {activity.instructions}
                        </Typography>
                      )}

                      <Chip
                        size="small"
                        label={getProgressStatusLabel(status)}
                        sx={{
                          mb: 2,
                          bgcolor: `${getProgressStatusColor(status)}22`,
                          color: getProgressStatusColor(status),
                        }}
                      />

                      {activity.max_score ? (
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.75 }}>
                          Nota maxima: {activity.max_score}
                        </Typography>
                      ) : null}

                      {activity.due_at && (
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.75 }}>
                          Fecha limite: {new Date(activity.due_at).toLocaleString('es-PE')}
                        </Typography>
                      )}

                      {activityDate && (
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                          Fecha de referencia:{' '}
                          {new Date(activityDate).toLocaleDateString('es-PE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </Typography>
                      )}

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {(activity.file_url || activity.video_url) && (
                          <Button
                            variant="outlined"
                            startIcon={activity.activity_type === 'video' ? <PlayCircle /> : <Download />}
                            onClick={() => handleOpenResource(activity)}
                          >
                            Abrir recurso
                          </Button>
                        )}

                        {isEstudiante && !isEvaluation && (
                          <Button
                            variant="contained"
                            startIcon={
                              status === PROGRESS_STATUS.COMPLETED ? (
                                <CheckCircle />
                              ) : (
                                <RadioButtonUnchecked />
                              )
                            }
                            onClick={() => toggleComplete(activity.id)}
                            disabled={savingId === activity.id}
                          >
                            {status === PROGRESS_STATUS.COMPLETED
                              ? 'Marcar pendiente'
                              : 'Marcar completada'}
                          </Button>
                        )}

                        {isEstudiante && isEvaluation && (
                          <Button
                            variant="contained"
                            color="warning"
                            onClick={() => openSubmissionDialog(activity)}
                          >
                            {submission ? 'Actualizar entrega' : 'Enviar entrega'}
                          </Button>
                        )}

                        {isEvaluation && submission && (
                          <Typography variant="caption" color="text.secondary">
                            Entrega: {submission.status}
                            {submission.score !== null && submission.score !== undefined
                              ? ` · Nota ${submission.score}`
                              : ''}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })
          )}
        </Grid>
      </Container>

      {/* ── Nuevo contenido dialog ── */}
      <Dialog
        open={contentDialogOpen}
        onClose={() => { setContentDialogOpen(false); setConfirmStep(false); }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {confirmStep
            ? 'Confirmar contenido'
            : editingActivity
            ? 'Editar contenido'
            : 'Nuevo contenido'}
        </DialogTitle>
        <DialogContent>
          {/* ── Confirm step ── */}
          {confirmStep ? (
            <Box sx={{ pt: 1 }}>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Titulo</Typography>
                  <Typography fontWeight={700}>{contentForm.title}</Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="caption" color="text.secondary">Formato</Typography>
                  <Typography fontWeight={700} sx={{ textTransform: 'capitalize' }}>
                    {contentForm.learning_format}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Typography variant="caption" color="text.secondary">Tipo</Typography>
                  <Typography fontWeight={700}>
                    {typeChipOptions.find((o) => o.value === contentForm.content_kind)?.label || contentForm.content_kind}
                  </Typography>
                </Grid>
                {contentForm.description && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Descripcion</Typography>
                    <Typography variant="body2">{contentForm.description}</Typography>
                  </Grid>
                )}
                {contentForm.instructions && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Instrucciones</Typography>
                    <Typography variant="body2">{contentForm.instructions}</Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Divider sx={{ mb: 1 }} />
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                    Vista previa del contenido
                  </Typography>
                  <ContentPreview
                    url={contentForm.content_kind === 'youtube' ? contentForm.video_url : contentForm.file_url}
                    kind={contentForm.content_kind}
                  />
                  {!contentForm.video_url && !contentForm.file_url && (
                    <Typography variant="body2" color="text.secondary">Sin contenido adjunto.</Typography>
                  )}
                </Grid>
              </Grid>
            </Box>
          ) : (
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {/* Title + Format */}
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Titulo"
                value={contentForm.title}
                onChange={(event) => setContentForm({ ...contentForm, title: event.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Formato</InputLabel>
                <Select
                  value={contentForm.learning_format}
                  label="Formato"
                  onChange={(event) =>
                    setContentForm({ ...contentForm, learning_format: event.target.value })
                  }
                >
                  <MenuItem value="material">Material</MenuItem>
                  <MenuItem value="tarea">Tarea</MenuItem>
                  <MenuItem value="examen">Examen</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Description + Instructions */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Descripcion"
                value={contentForm.description}
                onChange={(event) =>
                  setContentForm({ ...contentForm, description: event.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Instrucciones"
                value={contentForm.instructions}
                onChange={(event) =>
                  setContentForm({ ...contentForm, instructions: event.target.value })
                }
              />
            </Grid>

            {/* Mes / Semana */}
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Mes" value={monthName} InputProps={{ readOnly: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Semana"
                value={`Semana ${currentWeek?.number || week}`}
                InputProps={{ readOnly: true }}
              />
            </Grid>

            {/* Evaluacion fields */}
            {contentForm.learning_format !== 'material' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Nota maxima"
                    value={contentForm.max_score}
                    onChange={(event) =>
                      setContentForm({ ...contentForm, max_score: event.target.value })
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="datetime-local"
                    label="Fecha limite"
                    InputLabelProps={{ shrink: true }}
                    value={contentForm.due_at}
                    onChange={(event) =>
                      setContentForm({ ...contentForm, due_at: event.target.value })
                    }
                  />
                </Grid>
              </>
            )}

            {/* Content type chips */}
            <Grid item xs={12}>
              <Divider sx={{ mb: 1 }} />
              <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
                Tipo de contenido
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {typeChipOptions.map((opt) => (
                  <Chip
                    key={opt.value}
                    icon={opt.icon}
                    label={opt.label}
                    clickable
                    onClick={() =>
                      setContentForm((current) => ({
                        ...current,
                        content_kind: opt.value,
                        file_url: '',
                        video_url: '',
                      }))
                    }
                    variant={contentForm.content_kind === opt.value ? 'filled' : 'outlined'}
                    sx={{
                      borderColor: contentForm.content_kind === opt.value ? opt.color : undefined,
                      background: contentForm.content_kind === opt.value ? `${opt.color}18` : undefined,
                      color: contentForm.content_kind === opt.value ? opt.color : undefined,
                      fontWeight: contentForm.content_kind === opt.value ? 700 : 400,
                    }}
                  />
                ))}
              </Box>
            </Grid>

            {/* YouTube URL field */}
            {contentForm.content_kind === 'youtube' && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="URL de YouTube"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={contentForm.video_url}
                  onChange={(event) => {
                    const val = event.target.value;
                    setContentForm((current) => ({
                      ...current,
                      video_url: val,
                      file_url: '',
                    }));
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <YouTube sx={{ color: '#ff0000' }} />
                      </InputAdornment>
                    ),
                    endAdornment: contentForm.video_url ? (
                      <InputAdornment position="end">
                        <Tooltip title="Abrir en nueva pestana">
                          <IconButton
                            size="small"
                            onClick={() =>
                              window.open(contentForm.video_url, '_blank', 'noopener,noreferrer')
                            }
                          >
                            <OpenInNew fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ) : null,
                  }}
                />
              </Grid>
            )}

            {/* File upload for non-YouTube types */}
            {contentForm.content_kind !== 'youtube' && (
              <Grid item xs={12}>
                <Box
                  sx={{
                    border: '2px dashed #bdbdbd',
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                    background: '#fafafa',
                  }}
                >
                  {uploading ? (
                    <Box>
                      <CircularProgress size={32} sx={{ mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        Subiendo {uploadedFilename}...
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={uploadProgress}
                        sx={{ mt: 1, borderRadius: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {uploadProgress}%
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      <CloudUpload sx={{ fontSize: 40, color: '#bdbdbd', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {currentMediaUrl
                          ? `Archivo: ${currentMediaUrl.split('/').pop()}`
                          : 'Arrastra un archivo o haz clic para seleccionar'}
                      </Typography>
                      <Button
                        component="label"
                        variant="outlined"
                        startIcon={<CloudUpload />}
                        size="small"
                      >
                        {currentMediaUrl ? 'Reemplazar archivo' : 'Seleccionar archivo'}
                        <input
                          type="file"
                          hidden
                          accept={fileTypeAcceptMap[contentForm.content_kind] || '*'}
                          onChange={handleContentUpload}
                        />
                      </Button>
                      {currentMediaUrl && (
                        <Tooltip title="Abrir en nueva pestana">
                          <IconButton
                            size="small"
                            sx={{ ml: 1 }}
                            onClick={() =>
                              window.open(currentMediaUrl, '_blank', 'noopener,noreferrer')
                            }
                          >
                            <OpenInNew fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  )}
                </Box>

                {/* Manual URL fallback */}
                <TextField
                  fullWidth
                  label="O pega un enlace directo"
                  placeholder="https://..."
                  value={contentForm.file_url}
                  onChange={(event) =>
                    setContentForm((current) => ({
                      ...current,
                      file_url: event.target.value,
                      video_url: '',
                    }))
                  }
                  sx={{ mt: 1.5 }}
                  size="small"
                />
              </Grid>
            )}

            {/* Content preview */}
            {currentMediaUrl && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Vista previa
                </Typography>
                <ContentPreview
                  url={contentForm.content_kind === 'youtube' ? contentForm.video_url : contentForm.file_url}
                  kind={contentForm.content_kind}
                />
              </Grid>
            )}
          </Grid>
          )} {/* end confirmStep else */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setContentDialogOpen(false); setConfirmStep(false); }}>
            Cancelar
          </Button>
          {confirmStep ? (
            <>
              <Button variant="outlined" onClick={() => setConfirmStep(false)}>
                Volver a editar
              </Button>
              <Button
                variant="contained"
                onClick={saveContent}
                disabled={savingId === 'new' || !!savingId}
                startIcon={<Save />}
              >
                Confirmar y guardar
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              onClick={requestConfirm}
              disabled={uploading}
              startIcon={<Save />}
            >
              Guardar
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Eliminar contenido</DialogTitle>
        <DialogContent>
          <Typography>
            Se eliminara <strong>{activityToDelete?.title}</strong> de la semana {week}.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
          <Button
            color="error"
            variant="contained"
            onClick={deleteContent}
            disabled={savingId === activityToDelete?.id}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={submissionDialogOpen}
        onClose={() => setSubmissionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Enviar entrega</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Respuesta"
            value={submissionForm.response_text}
            onChange={(event) =>
              setSubmissionForm({ ...submissionForm, response_text: event.target.value })
            }
            sx={{ mt: 1 }}
          />
          <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button
              component="label"
              variant="outlined"
              startIcon={<CloudUpload />}
              disabled={uploading}
            >
              {uploading ? 'Subiendo...' : 'Adjuntar archivo'}
              <input type="file" hidden onChange={handleSubmissionUpload} />
            </Button>
            {submissionForm.attachment_url && (
              <Link href={submissionForm.attachment_url} target="_blank" rel="noreferrer">
                Ver adjunto
              </Link>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmissionDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={saveSubmission}
            disabled={savingId === submissionActivity?.id}
            startIcon={<Save />}
          >
            Guardar entrega
          </Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </Box>
  );
};

export default WeekPage;
