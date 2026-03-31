import React, { useEffect, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import {
  ArrowForward,
  Assignment,
  CalendarMonth,
  EmojiEvents,
  School,
  Settings,
  VideoCall,
  Timeline,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../api/axios';
import GradeCard from '../../components/common/GradeCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Footer from '../../components/Layout/Footer';
import { formatLiveClassDateTime } from '../../utils/liveClasses';
import { getUserDisplayName, getUserInitial } from '../../utils/users';

const greetingByTime = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos dias';
  if (hour < 18) return 'Buenas tardes';
  return 'Buenas noches';
};

const DashboardPage = () => {
  const { user, isAdmin, isDocente, isEstudiante } = useAuth();
  const navigate = useNavigate();

  const [grades, setGrades] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [reportOverview, setReportOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const classParams = { limit: 3 };

        if (isEstudiante && user?.grade_id) {
          classParams.grade_id = user.grade_id;
        }

        if (isDocente && user?.id) {
          classParams.teacher_id = user.id;
        }

        const requests = [
          axiosInstance.get('/grades/'),
          axiosInstance.get('/live-classes/', { params: classParams }),
        ];

        if (!isEstudiante) {
          requests.push(axiosInstance.get('/reports/overview').catch(() => ({ data: null })));
        }

        const [gradesRes, classesRes, reportRes] = await Promise.all(requests);

        const allGrades = gradesRes.data?.results || gradesRes.data || [];
        const visibleGrades =
          isEstudiante && user?.grade_id
            ? allGrades.filter((grade) => grade.id === user.grade_id)
            : allGrades;

        setGrades(visibleGrades);
        setLiveClasses(classesRes.data?.results || classesRes.data || []);
        setReportOverview(reportRes?.data || null);
      } catch (err) {
        setError('Error al cargar datos del dashboard.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isDocente, isEstudiante, user?.grade_id, user?.id]);

  if (loading) return <LoadingSpinner message="Cargando dashboard..." />;

  const displayName = getUserDisplayName(user);
  const managementActivitiesPath = isAdmin ? '/admin/activities' : '/teaching/activities';
  const managementClassesPath = isAdmin ? '/admin/classes' : '/teaching/classes';

  const quickActions = isEstudiante
    ? [
        {
          icon: <School sx={{ fontSize: '2rem', color: '#1976d2' }} />,
          title: 'Mi grado',
          desc: 'Ver materias y semanas',
          color: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
          border: '#1976d2',
          path: '/grades',
        },
        {
          icon: <VideoCall sx={{ fontSize: '2rem', color: '#e91e63' }} />,
          title: 'Clases en vivo',
          desc: 'Entrar a tus sesiones',
          color: 'linear-gradient(135deg, #fce4ec, #f8bbd9)',
          border: '#e91e63',
          path: '/live-classes',
        },
        {
          icon: <CalendarMonth sx={{ fontSize: '2rem', color: '#ff9800' }} />,
          title: 'Planificacion',
          desc: 'Horarios y guias',
          color: 'linear-gradient(135deg, #fff3e0, #ffe0b2)',
          border: '#ff9800',
          path: '/planning',
        },
        {
          icon: <Timeline sx={{ fontSize: '2rem', color: '#4caf50' }} />,
          title: 'Mi progreso',
          desc: 'Revisar avances',
          color: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
          border: '#4caf50',
          path: '/progress',
        },
      ]
    : [
        {
          icon: <Assignment sx={{ fontSize: '2rem', color: '#9c27b0' }} />,
          title: 'Actividades',
          desc: 'Crear y editar material',
          color: 'linear-gradient(135deg, #f3e5f5, #e1bee7)',
          border: '#9c27b0',
          path: managementActivitiesPath,
        },
        {
          icon: <VideoCall sx={{ fontSize: '2rem', color: '#e91e63' }} />,
          title: 'Clases',
          desc: 'Programar sesiones',
          color: 'linear-gradient(135deg, #fce4ec, #f8bbd9)',
          border: '#e91e63',
          path: managementClassesPath,
        },
        {
          icon: <CalendarMonth sx={{ fontSize: '2rem', color: '#ff9800' }} />,
          title: 'Planificacion',
          desc: 'Publicar recursos',
          color: 'linear-gradient(135deg, #fff3e0, #ffe0b2)',
          border: '#ff9800',
          path: '/planning/manage',
        },
        {
          icon: <Timeline sx={{ fontSize: '2rem', color: '#4caf50' }} />,
          title: 'Progreso',
          desc: 'Ver avance por grado',
          color: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)',
          border: '#4caf50',
          path: '/progress',
        },
        {
          icon: <Settings sx={{ fontSize: '2rem', color: '#0d47a1' }} />,
          title: 'Reportes',
          desc: 'Indicadores y alertas',
          color: 'linear-gradient(135deg, #e3f2fd, #bbdefb)',
          border: '#0d47a1',
          path: '/reports',
        },
      ];

  return (
    <Box sx={{ background: '#f5f7fa', minHeight: '100vh' }}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 60%, #42a5f5 100%)',
          pt: 6,
          pb: 10,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {[0, 1, 2].map((index) => (
          <Box
            key={index}
            sx={{
              position: 'absolute',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.07)',
              width: [200, 150, 100][index],
              height: [200, 150, 100][index],
              top: `${10 + index * 20}%`,
              right: `${5 + index * 15}%`,
            }}
          />
        ))}

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Avatar
              sx={{
                width: 60,
                height: 60,
                bgcolor: 'rgba(255,255,255,0.25)',
                color: '#fff',
                fontSize: '1.5rem',
                fontWeight: 700,
                border: '3px solid rgba(255,255,255,0.4)',
              }}
            >
              {getUserInitial(user)}
            </Avatar>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: { xs: '1.5rem', md: '2rem' },
                }}
              >
                {greetingByTime()}, {displayName}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '1rem' }}>
                {new Date().toLocaleDateString('es-PE', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={
                isEstudiante
                  ? 'Ruta de aprendizaje activa'
                  : isDocente
                  ? 'Panel docente'
                  : 'Panel administrativo'
              }
              sx={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }}
            />
            {isAdmin && (
              <Chip
                label="Ir a admin"
                onClick={() => navigate('/admin')}
                sx={{
                  background: '#9c27b0',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              />
            )}
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ mt: -4, pb: 6, position: 'relative', zIndex: 1 }}>
        {error && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: '12px' }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mb: 4 }}>
          {quickActions.map((action) => (
            <Grid item xs={6} md={4} lg={isEstudiante ? 3 : 2} key={action.title}>
              <Card
                onClick={() => navigate(action.path)}
                sx={{
                  cursor: 'pointer',
                  background: action.color,
                  borderTop: `4px solid ${action.border}`,
                  height: '100%',
                  '&:hover': { transform: 'translateY(-6px)' },
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 2.5 }}>
                  {action.icon}
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 1 }}>
                    {action.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {action.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Paper
              sx={{
                p: 3,
                borderRadius: '20px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                mb: 3,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight={700}>
                  {isEstudiante ? 'Mi grado' : 'Grados disponibles'}
                </Typography>
                <Button
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/grades')}
                  size="small"
                  sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}
                >
                  Ver detalle
                </Button>
              </Box>

              {grades.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">
                    No hay grados disponibles para esta cuenta.
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {grades.slice(0, 6).map((grade, index) => (
                    <Grid item xs={12} sm={6} md={4} key={grade.id}>
                      <GradeCard grade={grade} index={index} />
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Paper
              sx={{
                p: 3,
                borderRadius: '20px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                mb: 3,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                  {isDocente ? 'Mis clases' : 'Proximas clases'}
                </Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/live-classes')}
                  sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}
                >
                  Ver todas
                </Button>
              </Box>

              {liveClasses.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No hay clases programadas.
                  </Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {liveClasses.slice(0, 3).map((liveClass, index) => (
                    <React.Fragment key={liveClass.id}>
                      <ListItem
                        alignItems="flex-start"
                        sx={{ px: 0, py: 1.5 }}
                        secondaryAction={
                          liveClass.meeting_url && (
                            <Button
                              size="small"
                              variant="contained"
                              href={liveClass.meeting_url}
                              target="_blank"
                              sx={{
                                fontSize: '0.7rem',
                                py: 0.5,
                                px: 1.5,
                                minWidth: 'auto',
                              }}
                            >
                              Entrar
                            </Button>
                          )
                        }
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor: liveClass.class_type === 'refuerzo' ? '#ff9800' : '#1976d2',
                              width: 36,
                              height: 36,
                            }}
                          >
                            <VideoCall sx={{ fontSize: '1.1rem' }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight={600} noWrap>
                              {liveClass.title}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {formatLiveClassDateTime(liveClass, {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }) || 'Sin fecha'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {liveClass.subject?.name || liveClass.grade?.name || 'Sin referencia'}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < liveClasses.slice(0, 3).length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>

            {!isEstudiante && reportOverview && (
              <Paper
                sx={{
                  p: 3,
                  borderRadius: '20px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  mb: 3,
                }}
              >
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  Pendientes y alertas
                </Typography>
                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                  {[
                    { label: 'Pendientes por revisar', value: reportOverview.pending_grading, color: '#e91e63' },
                    { label: 'Notificaciones sin leer', value: reportOverview.unread_notifications, color: '#ff9800' },
                    { label: 'Promedio general', value: `${reportOverview.average_completion_rate}%`, color: '#4caf50' },
                  ].map((item) => (
                    <Grid item xs={12} sm={4} key={item.label}>
                      <Box sx={{ p: 1.5, borderRadius: '16px', background: `${item.color}12` }}>
                        <Typography variant="h5" fontWeight={900} sx={{ color: item.color }}>
                          {item.value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.label}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
                {reportOverview.students_needing_attention?.length ? (
                  reportOverview.students_needing_attention.slice(0, 3).map((student) => (
                    <Box key={student.student_id} sx={{ py: 1, borderTop: '1px solid #eee' }}>
                      <Typography variant="body2" fontWeight={700}>
                        {student.student_name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {student.pending_activities} pendientes, {student.completion_rate}% de avance
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <Typography color="text.secondary">No hay alertas academicas en este momento.</Typography>
                )}
              </Paper>
            )}

            <Paper
              sx={{
                p: 3,
                borderRadius: '20px',
                background: isEstudiante
                  ? 'linear-gradient(135deg, #4caf50, #81c784)'
                  : 'linear-gradient(135deg, #263238, #455a64)',
                color: '#fff',
                boxShadow: isEstudiante
                  ? '0 8px 32px rgba(76,175,80,0.35)'
                  : '0 8px 32px rgba(38,50,56,0.35)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                {isEstudiante ? <EmojiEvents sx={{ fontSize: '1.8rem' }} /> : <Settings sx={{ fontSize: '1.8rem' }} />}
                <Typography variant="h6" fontWeight={700}>
                  {isEstudiante ? 'Mi progreso' : 'Seguimiento academico'}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                {isEstudiante
                  ? 'Consulta actividades completadas, avances por materia e historial reciente.'
                  : `Tienes ${reportOverview?.pending_grading || 0} entrega${reportOverview?.pending_grading === 1 ? '' : 's'} por revisar y ${reportOverview?.unread_notifications || 0} notificacion${reportOverview?.unread_notifications === 1 ? '' : 'es'} sin leer.`}
              </Typography>
              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate(isEstudiante ? '/progress' : '/reports')}
                sx={{
                  background: 'rgba(255,255,255,0.22)',
                  color: '#fff',
                  fontWeight: 700,
                  boxShadow: 'none',
                  '&:hover': {
                    background: 'rgba(255,255,255,0.34)',
                    boxShadow: 'none',
                    transform: 'none',
                  },
                }}
              >
                {isEstudiante ? 'Ver mi progreso' : 'Abrir reportes'}
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Footer />
    </Box>
  );
};

export default DashboardPage;
