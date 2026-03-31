import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Container,
  Grid,
  Link,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import {
  CalendarMonth,
  Home,
  OndemandVideo,
  OpenInNew,
  PictureAsPdf,
  School,
  ViewWeek,
} from '@mui/icons-material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import axiosInstance from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Footer from '../../components/Layout/Footer';

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const planningTypeMeta = {
  planificador: { label: 'Planificador', color: '#6d4c41', bg: '#efebe9' },
  guia: { label: 'Guia', color: '#1565c0', bg: '#e3f2fd' },
  horario: { label: 'Horario', color: '#ef6c00', bg: '#fff3e0' },
};

const summarizeActivities = (activities = []) => ({
  total: activities.length,
  fichas: activities.filter((item) => item.activity_type === 'ficha').length,
  videos: activities.filter((item) => item.activity_type === 'video').length,
  evaluaciones: activities.filter((item) => item.learning_format !== 'material').length,
});

const SectionMonthBranchPage = () => {
  const { gradeId, groupId, month } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const monthNumber = Number(month);

  const [grade, setGrade] = useState(null);
  const [group, setGroup] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [planningItems, setPlanningItems] = useState([]);
  const [weekBranches, setWeekBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const requestedView = searchParams.get('view') === 'activities' ? 'activities' : 'planning';
  const [activeView, setActiveView] = useState(requestedView);

  useEffect(() => {
    setActiveView(requestedView);
  }, [requestedView]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [gradeRes, groupRes, subjectsRes, monthsRes] = await Promise.all([
        axiosInstance.get(`/grades/${gradeId}/`),
        axiosInstance.get(`/groups/${groupId}`),
        axiosInstance.get('/subjects/', { params: { grade_id: gradeId } }),
        axiosInstance.get('/months/'),
      ]);

      const nextSubjects = subjectsRes.data?.results || subjectsRes.data || [];
      const months = monthsRes.data?.results || monthsRes.data || [];
      const currentMonthRecord = months.find((item) => item.number === monthNumber);

      if (!currentMonthRecord) {
        throw new Error('Mes no encontrado');
      }

      const [planningRes, weeksRes] = await Promise.all([
        axiosInstance.get('/planning/', {
          params: {
            grade_id: gradeId,
            group_id: groupId,
            month_id: currentMonthRecord.id,
          },
        }),
        axiosInstance.get('/weeks/', { params: { month_id: currentMonthRecord.id } }),
      ]);

      const planningData = planningRes.data?.results || planningRes.data || [];
      const weeksData = weeksRes.data?.results || weeksRes.data || [];
      const subjectsById = Object.fromEntries(nextSubjects.map((subject) => [subject.id, subject]));
      const relevantWeeks = weeksData.filter((weekItem) => subjectsById[weekItem.subject_id]);

      const activitiesPerWeek = await Promise.all(
        relevantWeeks.map((weekItem) =>
          axiosInstance
            .get('/activities/', { params: { week_id: weekItem.id } })
            .then((response) => response.data?.results || response.data || [])
            .catch(() => [])
        )
      );

      const groupedWeeks = new Map();

      relevantWeeks.forEach((weekItem, index) => {
        const activities = activitiesPerWeek[index] || [];
        const currentSubject = subjectsById[weekItem.subject_id];
        const currentEntry = groupedWeeks.get(weekItem.number) || {
          number: weekItem.number,
          totalActivities: 0,
          subjects: [],
        };

        currentEntry.subjects.push({
          subject: currentSubject,
          activities,
          summary: summarizeActivities(activities),
        });
        currentEntry.totalActivities += activities.length;
        groupedWeeks.set(weekItem.number, currentEntry);
      });

      const normalizedWeeks = Array.from(groupedWeeks.values())
        .sort((left, right) => left.number - right.number)
        .map((weekItem) => ({
          ...weekItem,
          subjects: weekItem.subjects.sort((left, right) =>
            left.subject.name.localeCompare(right.subject.name, 'es')
          ),
        }));

      setGrade(gradeRes.data);
      setGroup(groupRes.data);
      setSubjects(nextSubjects);
      setPlanningItems(planningData);
      setWeekBranches(normalizedWeeks);
    } catch (err) {
      setError('No se pudo cargar la rama del mes seleccionado.');
    } finally {
      setLoading(false);
    }
  }, [gradeId, groupId, monthNumber]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totals = useMemo(
    () => ({
      planning: planningItems.length,
      weeks: weekBranches.length,
      activities: weekBranches.reduce((total, item) => total + item.totalActivities, 0),
    }),
    [planningItems, weekBranches]
  );

  const handleTabChange = (_, value) => {
    setActiveView(value);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('view', value);
    setSearchParams(nextParams, { replace: true });
  };

  if (loading) {
    return <LoadingSpinner message="Cargando rama del mes..." />;
  }

  const monthLabel = MONTHS[monthNumber - 1] || `Mes ${month}`;

  return (
    <Box sx={{ background: '#f5f7fa', minHeight: '100vh' }}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1565c0 0%, #42a5f5 100%)',
          py: 6,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -30,
            right: -20,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Breadcrumbs sx={{ mb: 2 }} separator=">">
            <Link
              component="button"
              onClick={() => navigate('/dashboard')}
              sx={{ color: 'rgba(255,255,255,0.78)', textDecoration: 'none', '&:hover': { color: '#fff' } }}
            >
              <Home sx={{ fontSize: '1rem', mr: 0.5, verticalAlign: 'middle' }} />
              Dashboard
            </Link>
            <Link
              component="button"
              onClick={() => navigate('/grades')}
              sx={{ color: 'rgba(255,255,255,0.78)', textDecoration: 'none', '&:hover': { color: '#fff' } }}
            >
              Grados
            </Link>
            <Link
              component="button"
              onClick={() => navigate(`/grades/${gradeId}`)}
              sx={{ color: 'rgba(255,255,255,0.78)', textDecoration: 'none', '&:hover': { color: '#fff' } }}
            >
              {grade?.name || `Grado ${gradeId}`}
            </Link>
            <Typography sx={{ color: '#fff', fontWeight: 700 }}>
              {group?.name || `Seccion ${groupId}`} - {monthLabel}
            </Typography>
          </Breadcrumbs>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} alignItems={{ xs: 'flex-start', md: 'center' }}>
            <Paper
              elevation={0}
              sx={{
                p: 1.8,
                borderRadius: '22px',
                background: 'rgba(255,255,255,0.14)',
                color: '#fff',
              }}
            >
              <CalendarMonth sx={{ fontSize: '2.4rem' }} />
            </Paper>

            <Box>
              <Typography variant="h3" fontWeight={800} sx={{ color: '#fff', lineHeight: 1 }}>
                {monthLabel}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.7 }}>
                {grade?.name || `Grado ${gradeId}`} / {group?.name || `Seccion ${groupId}`}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1.6, flexWrap: 'wrap' }}>
                <Chip label={`${subjects.length} cursos`} sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: '#fff', fontWeight: 700 }} />
                <Chip label={`${totals.planning} planificaciones`} sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: '#fff', fontWeight: 700 }} />
                <Chip label={`${totals.weeks} semanas`} sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: '#fff', fontWeight: 700 }} />
                <Chip label={`${totals.activities} actividades`} sx={{ bgcolor: 'rgba(255,255,255,0.16)', color: '#fff', fontWeight: 700 }} />
              </Stack>
            </Box>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 5 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: '16px' }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Paper sx={{ borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 32px rgba(15, 23, 42, 0.08)' }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid #eef2f7' }}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={1.5}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
            >
              <Box>
                <Typography variant="h5" fontWeight={800}>
                  Rama del mes
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                  Dentro del mes se separa la planificacion publicada y la rama de actividades por semanas y cursos.
                </Typography>
              </Box>
              <Button variant="outlined" onClick={() => navigate(`/grades/${gradeId}`)}>
                Volver a la seccion
              </Button>
            </Stack>
          </Box>

          <Tabs value={activeView} onChange={handleTabChange} sx={{ px: 2, pt: 1.5 }}>
            <Tab value="planning" label={`Planificacion (${planningItems.length})`} />
            <Tab value="activities" label={`Actividades (${weekBranches.length})`} />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {activeView === 'planning' && (
              <>
                {planningItems.length === 0 ? (
                  <Paper sx={{ p: 5, borderRadius: '22px', bgcolor: '#fafbfc', textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                      No hay planificacion publicada para este mes
                    </Typography>
                    <Typography color="text.secondary">
                      Cuando el admin o docente publique planificadores, guias u horarios para esta seccion y este mes, apareceran aqui.
                    </Typography>
                  </Paper>
                ) : (
                  <Grid container spacing={2.5}>
                    {planningItems.map((item) => {
                      const typeMeta = planningTypeMeta[item.planning_type] || planningTypeMeta.guia;
                      const structuredWeeks = Array.isArray(item.structured_content) ? item.structured_content.length : 0;

                      return (
                        <Grid item xs={12} md={6} key={item.id}>
                          <Card sx={{ borderRadius: '22px', border: '1px solid #edf2f7', height: '100%' }}>
                            <CardContent sx={{ p: 2.5 }}>
                              <Stack direction="row" justifyContent="space-between" spacing={1.5} sx={{ mb: 1.5 }}>
                                <Box>
                                  <Chip
                                    label={typeMeta.label}
                                    size="small"
                                    sx={{ bgcolor: typeMeta.bg, color: typeMeta.color, fontWeight: 800, mb: 1 }}
                                  />
                                  <Typography variant="h6" fontWeight={800}>
                                    {item.title}
                                  </Typography>
                                </Box>
                                <Paper
                                  elevation={0}
                                  sx={{
                                    px: 1.4,
                                    py: 1.1,
                                    borderRadius: '16px',
                                    bgcolor: '#f6f8fb',
                                  }}
                                >
                                  <Typography variant="caption" color="text.secondary">
                                    Unidad
                                  </Typography>
                                  <Typography fontWeight={800}>
                                    {item.unit_number || 'Sin numero'}
                                  </Typography>
                                </Paper>
                              </Stack>

                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {item.description || 'Planificacion publicada para esta seccion y este mes.'}
                              </Typography>

                              <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
                                {item.unit_title && <Chip label={item.unit_title} size="small" />}
                                {structuredWeeks > 0 && <Chip label={`${structuredWeeks} semanas`} size="small" />}
                                {item.group_name && <Chip label={`Seccion ${item.group_name}`} size="small" />}
                              </Stack>

                              {item.situation_context && (
                                <Paper sx={{ p: 1.6, borderRadius: '16px', bgcolor: '#faf7f5', mb: 1.5 }}>
                                  <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.4 }}>
                                    Situacion significativa
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {item.situation_context}
                                  </Typography>
                                </Paper>
                              )}

                              {item.learning_challenge && (
                                <Paper sx={{ p: 1.6, borderRadius: '16px', bgcolor: '#f5f8ff' }}>
                                  <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.4 }}>
                                    Reto
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {item.learning_challenge}
                                  </Typography>
                                </Paper>
                              )}
                            </CardContent>
                            <CardActions sx={{ px: 2.5, pb: 2.5, pt: 0, flexWrap: 'wrap', gap: 1 }}>
                              {item.source_file_url && (
                                <Button
                                  size="small"
                                  startIcon={<PictureAsPdf />}
                                  component="a"
                                  href={item.source_file_url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Ver PDF
                                </Button>
                              )}
                              {item.presentation_video_url && (
                                <Button
                                  size="small"
                                  startIcon={<OndemandVideo />}
                                  component="a"
                                  href={item.presentation_video_url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Ver video
                                </Button>
                              )}
                              {item.file_url && (
                                <Button
                                  size="small"
                                  startIcon={<OpenInNew />}
                                  component="a"
                                  href={item.file_url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Abrir recurso
                                </Button>
                              )}
                            </CardActions>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>
                )}
              </>
            )}

            {activeView === 'activities' && (
              <>
                {weekBranches.length === 0 ? (
                  <Paper sx={{ p: 5, borderRadius: '22px', bgcolor: '#fafbfc', textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                      No hay semanas activas para este mes
                    </Typography>
                    <Typography color="text.secondary">
                      Cuando existan semanas y contenido en los cursos de este grado, apareceran aqui agrupados por semana.
                    </Typography>
                  </Paper>
                ) : (
                  <Grid container spacing={2.5}>
                    {weekBranches.map((weekItem) => (
                      <Grid item xs={12} key={weekItem.number}>
                        <Card sx={{ borderRadius: '22px', border: '1px solid #edf2f7' }}>
                          <CardContent sx={{ p: 2.5 }}>
                            <Stack
                              direction={{ xs: 'column', md: 'row' }}
                              spacing={1.5}
                              justifyContent="space-between"
                              alignItems={{ xs: 'flex-start', md: 'center' }}
                              sx={{ mb: 2 }}
                            >
                              <Box>
                                <Typography variant="h6" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <ViewWeek color="primary" /> Semana {weekItem.number}
                                </Typography>
                                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                                  Dentro de esta semana se listan los cursos del grado con acceso directo a su contenido.
                                </Typography>
                              </Box>
                              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                                <Chip label={`${weekItem.subjects.length} cursos`} sx={{ fontWeight: 700 }} />
                                <Chip label={`${weekItem.totalActivities} actividades`} sx={{ fontWeight: 700, bgcolor: '#e8f5e9', color: '#2e7d32' }} />
                              </Stack>
                            </Stack>

                            <Grid container spacing={2}>
                              {weekItem.subjects.map((entry) => (
                                <Grid item xs={12} md={6} lg={4} key={`${weekItem.number}-${entry.subject.id}`}>
                                  <Paper
                                    sx={{
                                      p: 2,
                                      height: '100%',
                                      borderRadius: '18px',
                                      border: '1px solid #edf2f7',
                                      bgcolor: entry.summary.total > 0 ? '#ffffff' : '#fafbfc',
                                    }}
                                  >
                                    <Stack direction="row" justifyContent="space-between" spacing={1.2} sx={{ mb: 1 }}>
                                      <Box>
                                        <Typography fontWeight={800}>
                                          {entry.subject.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                          Curso dentro de la Semana {weekItem.number}
                                        </Typography>
                                      </Box>
                                      <Paper elevation={0} sx={{ px: 1.2, py: 0.8, borderRadius: '14px', bgcolor: '#f6f8fb' }}>
                                        <Typography variant="caption" color="text.secondary">
                                          Estado
                                        </Typography>
                                        <Typography fontWeight={800}>
                                          {entry.summary.total > 0 ? 'Con contenido' : 'Pendiente'}
                                        </Typography>
                                      </Paper>
                                    </Stack>

                                    <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
                                      <Chip size="small" label={`${entry.summary.total} contenidos`} />
                                      {entry.summary.fichas > 0 && <Chip size="small" label={`${entry.summary.fichas} fichas`} />}
                                      {entry.summary.videos > 0 && <Chip size="small" label={`${entry.summary.videos} videos`} />}
                                      {entry.summary.evaluaciones > 0 && <Chip size="small" label={`${entry.summary.evaluaciones} tareas/evaluaciones`} />}
                                    </Stack>

                                    <Button
                                      fullWidth
                                      variant={entry.summary.total > 0 ? 'contained' : 'outlined'}
                                      startIcon={<School />}
                                      onClick={() => {
                                        const params = new URLSearchParams({
                                          group_id: String(group?.id || groupId),
                                          group_name: group?.name || `Seccion ${groupId}`,
                                        });
                                        navigate(`/subjects/${entry.subject.id}/month/${monthNumber}/week/${weekItem.number}?${params.toString()}`);
                                      }}
                                    >
                                      Abrir curso
                                    </Button>
                                  </Paper>
                                </Grid>
                              ))}
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </>
            )}
          </Box>
        </Paper>
      </Container>

      <Footer />
    </Box>
  );
};

export default SectionMonthBranchPage;
