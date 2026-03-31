import React, { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
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
  Divider,
  Grid,
  Link,
  Paper,
  Tab,
  Tabs,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  CalendarToday,
  Home,
  Person,
  PlayCircle,
  Refresh,
  Schedule,
  Settings,
  VideoCall,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Footer from '../../components/Layout/Footer';
import {
  formatLiveClassDate,
  formatLiveClassTime,
  getLiveClassDate,
} from '../../utils/liveClasses';

const LiveClassesPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isDocente, isEstudiante } = useAuth();

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [syncingRecordingId, setSyncingRecordingId] = useState(null);
  const [recordingDialogOpen, setRecordingDialogOpen] = useState(false);
  const [recordingLoading, setRecordingLoading] = useState(false);
  const [recordingBlobUrl, setRecordingBlobUrl] = useState('');
  const [recordingClass, setRecordingClass] = useState(null);

  useEffect(() => {
    const fetchClasses = async () => {
      setLoading(true);
      try {
        const params = {};

        if (isEstudiante && user?.grade_id) {
          params.grade_id = user.grade_id;
        }

        if (isDocente && user?.id) {
          params.teacher_id = user.id;
        }

        const res = await axiosInstance.get('/live-classes/', { params });
        setClasses(res.data?.results || res.data || []);
      } catch (err) {
        setError('Error al cargar las clases.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, [isDocente, isEstudiante, refreshKey, user?.grade_id, user?.id]);

  useEffect(() => () => {
    if (recordingBlobUrl) {
      URL.revokeObjectURL(recordingBlobUrl);
    }
  }, [recordingBlobUrl]);

  if (loading) return <LoadingSpinner message="Cargando clases en vivo..." />;

  const now = new Date();
  const managementPath = isAdmin ? '/admin/classes' : '/teaching/classes';

  const upcomingClasses = classes.filter((liveClass) => {
    const scheduledAt = getLiveClassDate(liveClass);
    if (!scheduledAt) return true;
    return new Date(scheduledAt) >= now;
  });

  const pastClasses = classes.filter((liveClass) => {
    const scheduledAt = getLiveClassDate(liveClass);
    if (!scheduledAt) return false;
    return new Date(scheduledAt) < now;
  });

  const regularClasses = classes.filter((liveClass) => liveClass.class_type !== 'refuerzo');
  const reinforcementClasses = classes.filter((liveClass) => liveClass.class_type === 'refuerzo');

  const getFilteredClasses = () => {
    if (tabValue === 0) return upcomingClasses;
    if (tabValue === 1) return regularClasses;
    if (tabValue === 2) return reinforcementClasses;
    return pastClasses;
  };

  const isLive = (liveClass) => {
    const scheduledAt = getLiveClassDate(liveClass);
    if (!scheduledAt) return false;
    const classTime = new Date(scheduledAt);
    const diffMinutes = Math.abs(now - classTime) / 60000;
    return diffMinutes <= 60;
  };

  const filteredClasses = getFilteredClasses();

  const handleJoinClass = async (liveClass) => {
    try {
      if (isEstudiante) {
        await axiosInstance.post(`/live-classes/${liveClass.id}/attendance/join`);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo registrar la asistencia.');
    } finally {
      if (liveClass.meeting_url) {
        window.open(liveClass.meeting_url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const handleSyncRecording = async (liveClass) => {
    setSyncingRecordingId(liveClass.id);
    try {
      await axiosInstance.post(`/live-classes/${liveClass.id}/recording/sync`);
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo sincronizar la grabacion.');
    } finally {
      setSyncingRecordingId(null);
    }
  };

  const handleOpenRecording = async (liveClass) => {
    setRecordingClass(liveClass);
    setRecordingDialogOpen(true);
    setRecordingLoading(true);
    try {
      const response = await axiosInstance.get(`/live-classes/${liveClass.id}/recording/stream`, {
        responseType: 'blob',
      });
      if (recordingBlobUrl) {
        URL.revokeObjectURL(recordingBlobUrl);
      }
      setRecordingBlobUrl(URL.createObjectURL(response.data));
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setRecordingDialogOpen(false);
      setError(err.response?.data?.detail || 'No se pudo abrir la grabacion.');
    } finally {
      setRecordingLoading(false);
    }
  };

  const closeRecordingDialog = () => {
    setRecordingDialogOpen(false);
    setRecordingLoading(false);
    setRecordingClass(null);
    if (recordingBlobUrl) {
      URL.revokeObjectURL(recordingBlobUrl);
      setRecordingBlobUrl('');
    }
  };

  const getRecordingStatus = (liveClass) => {
    if (liveClass.recording_status === 'available') {
      return { label: 'Grabacion lista', color: '#2e7d32', bg: '#e8f5e9' };
    }
    if (liveClass.recording_status === 'processing') {
      return { label: 'Procesando grabacion', color: '#ef6c00', bg: '#fff3e0' };
    }
    if (liveClass.recording_status === 'recording') {
      return { label: 'Grabando', color: '#c62828', bg: '#ffebee' };
    }
    if (liveClass.recording_status === 'pending') {
      return { label: 'Grabacion pendiente', color: '#1565c0', bg: '#e3f2fd' };
    }
    return null;
  };

  const openAttendanceDialog = async (liveClass) => {
    setSelectedClass(liveClass);
    setAttendanceDialogOpen(true);
    setAttendanceLoading(true);
    try {
      const response = await axiosInstance.get(`/live-classes/${liveClass.id}/attendance`);
      setAttendanceRecords(response.data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo cargar la asistencia.');
    } finally {
      setAttendanceLoading(false);
    }
  };

  return (
    <Box sx={{ background: '#f5f7fa', minHeight: '100vh' }}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #e91e63 0%, #f48fb1 100%)',
          py: 6,
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
          <Breadcrumbs sx={{ mb: 2 }} separator=">">
            <Link
              component="button"
              onClick={() => navigate('/dashboard')}
              sx={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.9rem', '&:hover': { color: '#fff' } }}
            >
              <Home sx={{ fontSize: '1rem', mr: 0.3, verticalAlign: 'middle' }} /> Dashboard
            </Link>
            <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
              Clases en vivo
            </Typography>
          </Breadcrumbs>

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
                <VideoCall sx={{ color: '#fff', fontSize: '2.5rem' }} />
              </Box>
              <Box>
                <Typography variant="h3" fontWeight={800} sx={{ color: '#fff', lineHeight: 1 }}>
                  {isDocente ? 'Mis clases en vivo' : 'Clases en vivo'}
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.5 }}>
                  {isEstudiante
                    ? 'Sesiones disponibles para tu grado'
                    : isDocente
                    ? 'Programa y revisa tus sesiones publicadas'
                    : 'Revision general de sesiones programadas'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {(isAdmin || isDocente) && (
                <Button
                  variant="contained"
                  startIcon={<Settings />}
                  onClick={() => navigate(managementPath)}
                  sx={{ background: '#6d214f', '&:hover': { background: '#4a1435' } }}
                >
                  Gestionar clases
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={() => setRefreshKey((value) => value + 1)}
                sx={{
                  color: '#fff',
                  borderColor: 'rgba(255,255,255,0.6)',
                  boxShadow: 'none',
                  '&:hover': { boxShadow: 'none', transform: 'none', borderColor: '#fff', background: 'rgba(255,255,255,0.1)' },
                }}
              >
                Actualizar
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Total', value: classes.length, color: '#e91e63' },
            { label: 'Proximas', value: upcomingClasses.length, color: '#1976d2' },
            { label: 'Refuerzo', value: reinforcementClasses.length, color: '#ff9800' },
            { label: 'Pasadas', value: pastClasses.length, color: '#4caf50' },
          ].map((stat) => (
            <Grid item xs={6} md={3} key={stat.label}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: 'center',
                  borderRadius: '16px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                  border: `2px solid ${stat.color}22`,
                }}
              >
                <Typography variant="h4" fontWeight={800} sx={{ color: stat.color }}>
                  {stat.value}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>
                  {stat.label}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Box
          sx={{
            background: '#fff',
            borderRadius: '16px',
            p: 1,
            mb: 3,
            display: 'inline-flex',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          }}
        >
          <Tabs
            value={tabValue}
            onChange={(_, value) => setTabValue(value)}
            sx={{
              '& .MuiTab-root': {
                borderRadius: '10px',
                fontWeight: 600,
                minHeight: 36,
                py: 0.5,
                fontSize: '0.85rem',
              },
              '& .Mui-selected': {
                background: 'linear-gradient(135deg, #e91e63, #f48fb1)',
                color: '#fff !important',
              },
              '& .MuiTabs-indicator': { display: 'none' },
            }}
          >
            <Tab label={`Proximas (${upcomingClasses.length})`} />
            <Tab label={`Regulares (${regularClasses.length})`} />
            <Tab label={`Refuerzo (${reinforcementClasses.length})`} />
            <Tab label={`Pasadas (${pastClasses.length})`} />
          </Tabs>
        </Box>

        {filteredClasses.length === 0 ? (
          <Paper
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: '20px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            }}
          >
            <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
              No hay clases en esta categoria
            </Typography>
            <Typography color="text.secondary">
              Todavia no hay sesiones publicadas para este filtro.
            </Typography>
          </Paper>
        ) : (
          <Grid container spacing={2.5}>
            {filteredClasses.map((liveClass) => {
              const live = isLive(liveClass);
              const isRefuerzo = liveClass.class_type === 'refuerzo';
              const recordingStatus = getRecordingStatus(liveClass);
              const canShowRecording = Boolean(liveClass.recording_file_id || liveClass.recording_url);

              return (
                <Grid item xs={12} sm={6} md={4} key={liveClass.id}>
                  <Card
                    sx={{
                      height: '100%',
                      border: live ? '2px solid #4caf50' : isRefuerzo ? '2px solid #ff9800' : '2px solid transparent',
                      background: live
                        ? 'linear-gradient(135deg, #f1f8e9, #dcedc8)'
                        : isRefuerzo
                        ? 'linear-gradient(135deg, #fff3e0, #ffe0b2)'
                        : '#fff',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {live && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          background: '#4caf50',
                          py: 0.5,
                          textAlign: 'center',
                        }}
                      >
                        <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700 }}>
                          En vivo ahora
                        </Typography>
                      </Box>
                    )}

                    <CardContent sx={{ p: 2.5, pt: live ? 4 : 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                        <Avatar
                          sx={{
                            bgcolor: live ? '#4caf50' : isRefuerzo ? '#ff9800' : '#1976d2',
                            width: 48,
                            height: 48,
                          }}
                        >
                          <VideoCall />
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', gap: 0.5, mb: 0.5, flexWrap: 'wrap' }}>
                            <Chip
                              label={isRefuerzo ? 'Refuerzo' : 'Regular'}
                              size="small"
                              sx={{
                                bgcolor: isRefuerzo ? '#fff3e0' : '#e3f2fd',
                                color: isRefuerzo ? '#f57c00' : '#1565c0',
                                fontWeight: 700,
                                fontSize: '0.65rem',
                                height: 20,
                              }}
                            />
                            {live && (
                              <Chip
                                label="En vivo"
                                size="small"
                                sx={{
                                  bgcolor: '#4caf50',
                                  color: '#fff',
                                  fontWeight: 700,
                                  fontSize: '0.65rem',
                                  height: 20,
                                }}
                              />
                            )}
                            {recordingStatus && (
                              <Chip
                                label={recordingStatus.label}
                                size="small"
                                sx={{
                                  bgcolor: recordingStatus.bg,
                                  color: recordingStatus.color,
                                  fontWeight: 700,
                                  fontSize: '0.65rem',
                                  height: 20,
                                }}
                              />
                            )}
                          </Box>
                          <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.3 }}>
                            {liveClass.title}
                          </Typography>
                        </Box>
                      </Box>

                      {liveClass.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mb: 2,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {liveClass.description}
                        </Typography>
                      )}

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 2 }}>
                        {getLiveClassDate(liveClass) && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarToday sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary" fontWeight={500}>
                              {formatLiveClassDate(liveClass, {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </Typography>
                          </Box>
                        )}

                        {getLiveClassDate(liveClass) && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Schedule sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary" fontWeight={500}>
                              {formatLiveClassTime(liveClass, {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </Typography>
                          </Box>
                        )}

                        {(liveClass.teacher?.full_name || liveClass.teacher_name) && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Person sx={{ fontSize: '0.9rem', color: 'text.secondary' }} />
                            <Typography variant="caption" color="text.secondary" fontWeight={500}>
                              {liveClass.teacher?.full_name || liveClass.teacher_name}
                            </Typography>
                          </Box>
                        )}

                        <Chip
                          label={liveClass.grade?.name || liveClass.grade_name || `Grado ${liveClass.grade_id}`}
                          size="small"
                          sx={{
                            bgcolor: '#f5f5f5',
                            color: '#555',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            alignSelf: 'flex-start',
                            height: 20,
                          }}
                        />
                      </Box>

                      <Divider sx={{ mb: 2 }} />

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {liveClass.meeting_url ? (
                          <Button
                            variant="contained"
                            fullWidth
                            startIcon={live ? <PlayCircle /> : <VideoCall />}
                            onClick={() => handleJoinClass(liveClass)}
                            sx={{
                              background: live
                                ? 'linear-gradient(135deg, #4caf50, #81c784)'
                                : isRefuerzo
                                ? 'linear-gradient(135deg, #ff9800, #ffd200)'
                                : 'linear-gradient(135deg, #1976d2, #42a5f5)',
                              py: 1,
                              fontWeight: 700,
                            }}
                          >
                            {live ? 'Entrar ahora' : 'Unirse a la clase'}
                          </Button>
                        ) : (
                          <Button variant="outlined" fullWidth disabled sx={{ py: 1 }}>
                            Enlace no disponible
                          </Button>
                        )}

                        {(isAdmin || isDocente) && (
                          <Button variant="outlined" fullWidth onClick={() => openAttendanceDialog(liveClass)}>
                            Ver asistencia
                          </Button>
                        )}
                        {canShowRecording && (
                          <Button
                            variant="outlined"
                            fullWidth
                            startIcon={<PlayCircle />}
                            onClick={() => handleOpenRecording(liveClass)}
                          >
                            Ver grabacion
                          </Button>
                        )}
                        {(isAdmin || isDocente) && liveClass.meeting_provider === 'google_meet' && (
                          <Button
                            variant="outlined"
                            fullWidth
                            startIcon={syncingRecordingId === liveClass.id ? <CircularProgress size={16} /> : <Refresh />}
                            onClick={() => handleSyncRecording(liveClass)}
                            disabled={syncingRecordingId === liveClass.id}
                          >
                            {syncingRecordingId === liveClass.id ? 'Sincronizando...' : 'Sincronizar grabacion'}
                          </Button>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Container>

      <Dialog open={attendanceDialogOpen} onClose={() => setAttendanceDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Asistencia de {selectedClass?.title}</DialogTitle>
        <DialogContent>
          {attendanceLoading ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <CircularProgress />
            </Box>
          ) : attendanceRecords.length === 0 ? (
            <Alert severity="info" sx={{ mt: 1 }}>
              Aun no hay asistencias registradas.
            </Alert>
          ) : (
            attendanceRecords.map((record) => (
              <Box key={record.id} sx={{ py: 1.5, borderBottom: '1px solid #eee' }}>
                <Typography fontWeight={700}>{record.student_name || `Alumno ${record.student_id}`}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {record.status === 'late' ? 'Tarde' : 'Presente'} · {new Date(record.joined_at).toLocaleString('es-PE')}
                </Typography>
              </Box>
            ))
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAttendanceDialogOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={recordingDialogOpen} onClose={closeRecordingDialog} maxWidth="md" fullWidth>
        <DialogTitle>{recordingClass ? `Grabacion: ${recordingClass.title}` : 'Grabacion de clase'}</DialogTitle>
        <DialogContent>
          {recordingLoading ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <CircularProgress />
            </Box>
          ) : recordingBlobUrl ? (
            <Box
              component="video"
              src={recordingBlobUrl}
              controls
              sx={{ width: '100%', borderRadius: '12px', background: '#000', minHeight: 360 }}
            />
          ) : (
            <Alert severity="info" sx={{ mt: 1 }}>
              La grabacion aun no esta disponible.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRecordingDialog}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </Box>
  );
};

export default LiveClassesPage;
