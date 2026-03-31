import React, { useEffect, useMemo, useState } from 'react';
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
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  Link,
  MenuItem,
  Paper,
  Select,
  Typography,
} from '@mui/material';
import { CheckCircle, EmojiEvents, Home, School, Timeline } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Footer from '../../components/Layout/Footer';
import { PROGRESS_STATUS } from '../../utils/progress';
import { getUserDisplayName, getUserInitial } from '../../utils/users';

const average = (values) =>
  values.length ? Math.round(values.reduce((total, value) => total + value, 0) / values.length) : 0;

const ProgressPage = () => {
  const navigate = useNavigate();
  const { user, isEstudiante, isDocente } = useAuth();

  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [weeks, setWeeks] = useState([]);
  const [activities, setActivities] = useState([]);
  const [progressRecords, setProgressRecords] = useState([]);
  const [gradeSummary, setGradeSummary] = useState(null);
  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadStudentData = async () => {
      try {
        const [gradesRes, subjectsRes, weeksRes, activitiesRes, progressRes] = await Promise.all([
          axiosInstance.get('/grades/'),
          axiosInstance.get('/subjects/'),
          axiosInstance.get('/weeks/'),
          axiosInstance.get('/activities/'),
          axiosInstance.get(`/progress/student/${user.id}`),
        ]);

        if (!active) return;
        setGrades(gradesRes.data?.results || gradesRes.data || []);
        setSubjects(subjectsRes.data?.results || subjectsRes.data || []);
        setWeeks(weeksRes.data?.results || weeksRes.data || []);
        setActivities(activitiesRes.data?.results || activitiesRes.data || []);
        setProgressRecords(progressRes.data || []);
      } catch (err) {
        if (!active) return;
        setError('Error al cargar tu progreso.');
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };

    const loadStaffData = async () => {
      try {
        const [gradesRes, enrollmentsRes] = await Promise.all([
          axiosInstance.get('/grades/'),
          axiosInstance.get('/enrollments/'),
        ]);

        if (!active) return;

        const allGrades = gradesRes.data?.results || gradesRes.data || [];
        const enrollments = enrollmentsRes.data?.results || enrollmentsRes.data || [];
        const gradeIds = new Set(enrollments.map((item) => item.grade_id));
        const visibleGrades = allGrades.filter((grade) => gradeIds.has(grade.id));
        const nextGrades = visibleGrades.length ? visibleGrades : allGrades;

        setGrades(nextGrades);
        setSelectedGradeId(nextGrades[0]?.id || '');
      } catch (err) {
        if (!active) return;
        setError('Error al cargar el resumen de progreso.');
        console.error(err);
        setLoading(false);
      }
    };

    if (isEstudiante && user?.id) loadStudentData();
    else loadStaffData();

    return () => {
      active = false;
    };
  }, [isEstudiante, user?.id]);

  useEffect(() => {
    if (isEstudiante || !selectedGradeId) return undefined;

    let active = true;

    const loadGradeSummary = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/progress/grade/${selectedGradeId}`);
        if (!active) return;
        setGradeSummary(response.data);
      } catch (err) {
        if (!active) return;
        setError('Error al cargar el grado seleccionado.');
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadGradeSummary();

    return () => {
      active = false;
    };
  }, [isEstudiante, selectedGradeId]);

  const studentStats = useMemo(() => {
    if (!isEstudiante) return null;

    const gradeById = Object.fromEntries(grades.map((grade) => [grade.id, grade]));
    const subjectById = Object.fromEntries(subjects.map((subject) => [subject.id, subject]));
    const weekById = Object.fromEntries(weeks.map((week) => [week.id, week]));
    const activityById = Object.fromEntries(activities.map((activity) => [activity.id, activity]));

    const visibleSubjects = user?.grade_id
      ? subjects.filter((subject) => subject.grade_id === user.grade_id)
      : subjects;
    const visibleSubjectIds = new Set(visibleSubjects.map((subject) => subject.id));
    const visibleWeeks = weeks.filter((week) => visibleSubjectIds.has(week.subject_id));
    const visibleWeekIds = new Set(visibleWeeks.map((week) => week.id));
    const visibleActivities = activities.filter((activity) => visibleWeekIds.has(activity.week_id));
    const visibleActivityIds = new Set(visibleActivities.map((activity) => activity.id));
    const scopedProgress = progressRecords.filter((record) => visibleActivityIds.has(record.activity_id));
    const completed = scopedProgress.filter((record) => record.status === PROGRESS_STATUS.COMPLETED);
    const inProgress = scopedProgress.filter((record) => record.status === PROGRESS_STATUS.IN_PROGRESS);
    const total = visibleActivities.length;
    const completedCount = completed.length;
    const inProgressCount = inProgress.length;
    const pendingCount = Math.max(total - completedCount - inProgressCount, 0);
    const completionRate = total ? Math.round((completedCount / total) * 100) : 0;

    const subjectProgress = visibleSubjects
      .map((subject) => {
        const subjectWeekIds = new Set(
          visibleWeeks.filter((week) => week.subject_id === subject.id).map((week) => week.id)
        );
        const subjectActivities = visibleActivities.filter((activity) => subjectWeekIds.has(activity.week_id));
        const subjectCompleted = completed.filter((record) => {
          const activity = activityById[record.activity_id];
          return activity && subjectWeekIds.has(activity.week_id);
        }).length;
        const subjectTotal = subjectActivities.length;
        return {
          id: subject.id,
          name: subject.name,
          percent: subjectTotal ? Math.round((subjectCompleted / subjectTotal) * 100) : 0,
          total: subjectTotal,
        };
      })
      .filter((subject) => subject.total > 0)
      .sort((left, right) => right.percent - left.percent);

    const recentCompleted = [...completed]
      .sort((left, right) => new Date(right.completed_at || right.updated_at || right.created_at || 0) - new Date(left.completed_at || left.updated_at || left.created_at || 0))
      .slice(0, 5)
      .map((record) => {
        const activity = activityById[record.activity_id];
        const week = activity ? weekById[activity.week_id] : null;
        const subject = week ? subjectById[week.subject_id] : null;
        return {
          id: record.id,
          title: activity?.title || `Actividad ${record.activity_id}`,
          subjectName: subject?.name || '',
        };
      });

    return {
      gradeName: user?.grade_id ? gradeById[user.grade_id]?.name : '',
      total,
      completedCount,
      inProgressCount,
      pendingCount,
      completionRate,
      subjectProgress,
      recentCompleted,
    };
  }, [activities, grades, isEstudiante, progressRecords, subjects, user?.grade_id, weeks]);

  const staffStats = useMemo(() => {
    const students = gradeSummary?.students_progress || [];
    return {
      totalStudents: gradeSummary?.total_students || 0,
      totalCompleted: students.reduce((total, item) => total + (item.completed || 0), 0),
      averageCompletion: average(students.map((item) => item.completion_rate || 0)),
      attentionNeeded: students.filter((item) => (item.completion_rate || 0) < 30 && (item.pending || 0) > 0),
      topStudents: [...students]
        .sort((left, right) => (right.completion_rate || 0) - (left.completion_rate || 0))
        .slice(0, 5),
    };
  }, [gradeSummary]);

  if (loading) {
    return <LoadingSpinner message={isEstudiante ? 'Cargando tu progreso...' : 'Cargando resumen por grado...'} />;
  }

  return (
    <Box sx={{ background: '#f5f7fa', minHeight: '100vh' }}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)',
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
              {isEstudiante ? 'Mi progreso' : 'Progreso por grado'}
            </Typography>
          </Breadcrumbs>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: 'rgba(255,255,255,0.3)',
                color: '#fff',
                width: 64,
                height: 64,
                fontSize: '1.5rem',
                fontWeight: 700,
                border: '3px solid rgba(255,255,255,0.5)',
              }}
            >
              {getUserInitial(user)}
            </Avatar>
            <Box>
              <Typography variant="h3" fontWeight={800} sx={{ color: '#fff', lineHeight: 1 }}>
                {isEstudiante ? 'Mi progreso' : 'Seguimiento academico'}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.5 }}>
                {getUserDisplayName(user)}
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && <Alert severity="warning" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}

        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          {(isEstudiante
            ? [
                { label: 'Completadas', value: studentStats?.completedCount || 0, color: '#4caf50', bg: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)', icon: <CheckCircle sx={{ color: '#4caf50' }} /> },
                { label: 'En progreso', value: studentStats?.inProgressCount || 0, color: '#ff9800', bg: 'linear-gradient(135deg, #fff3e0, #ffe0b2)', icon: <Timeline sx={{ color: '#ff9800' }} /> },
                { label: 'Disponibles', value: studentStats?.total || 0, color: '#1976d2', bg: 'linear-gradient(135deg, #e3f2fd, #bbdefb)', icon: <School sx={{ color: '#1976d2' }} /> },
                { label: 'Avance', value: `${studentStats?.completionRate || 0}%`, color: '#9c27b0', bg: 'linear-gradient(135deg, #f3e5f5, #e1bee7)', icon: <EmojiEvents sx={{ color: '#9c27b0' }} /> },
              ]
            : [
                { label: 'Estudiantes', value: staffStats.totalStudents, color: '#1976d2', bg: 'linear-gradient(135deg, #e3f2fd, #bbdefb)', icon: <School sx={{ color: '#1976d2' }} /> },
                { label: 'Completadas', value: staffStats.totalCompleted, color: '#4caf50', bg: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)', icon: <CheckCircle sx={{ color: '#4caf50' }} /> },
                { label: 'Promedio', value: `${staffStats.averageCompletion}%`, color: '#ff9800', bg: 'linear-gradient(135deg, #fff3e0, #ffe0b2)', icon: <Timeline sx={{ color: '#ff9800' }} /> },
                { label: 'Seguimiento', value: staffStats.attentionNeeded.length, color: '#e91e63', bg: 'linear-gradient(135deg, #fce4ec, #f8bbd9)', icon: <EmojiEvents sx={{ color: '#e91e63' }} /> },
              ]).map((stat) => (
            <Grid item xs={6} md={3} key={stat.label}>
              <Card sx={{ background: stat.bg, borderTop: `4px solid ${stat.color}`, textAlign: 'center' }}>
                <CardContent sx={{ py: 2.5 }}>
                  {stat.icon}
                  <Typography variant="h4" fontWeight={900} sx={{ color: stat.color, mt: 1 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {isEstudiante ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Paper sx={{ p: 3, borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>Resumen</Typography>
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight={600}>Avance total</Typography>
                    <Typography variant="body2" fontWeight={700} color="primary">{studentStats?.completionRate || 0}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={studentStats?.completionRate || 0} sx={{ height: 10, borderRadius: 5 }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                  {studentStats?.gradeName ? `Materias de ${studentStats.gradeName}` : 'Materias'}
                </Typography>
                {studentStats?.subjectProgress?.length ? studentStats.subjectProgress.map((subject) => (
                  <Box key={subject.id} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={600}>{subject.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{subject.percent}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={subject.percent} sx={{ height: 8, borderRadius: 4 }} />
                  </Box>
                )) : <Typography color="text.secondary">No hay actividades publicadas para tu grado.</Typography>}
              </Paper>
            </Grid>

            <Grid item xs={12} md={5}>
              <Paper sx={{ p: 3, borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', mb: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Actividad reciente</Typography>
                {studentStats?.recentCompleted?.length ? studentStats.recentCompleted.map((item) => (
                  <Box key={item.id} sx={{ p: 1.75, mb: 1.5, borderRadius: '12px', background: '#e8f5e9' }}>
                    <Typography variant="body2" fontWeight={700}>{item.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{item.subjectName || 'Sin materia'}</Typography>
                  </Box>
                )) : <Typography color="text.secondary">Aun no has completado actividades.</Typography>}
              </Paper>
              <Paper sx={{ p: 3, borderRadius: '20px', background: 'linear-gradient(135deg, #1976d2, #42a5f5)', color: '#fff' }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Tu progreso ya se guarda en la cuenta</Typography>
                <Typography sx={{ opacity: 0.9, mb: 2 }}>
                  {studentStats?.pendingCount || 0} actividad{studentStats?.pendingCount === 1 ? '' : 'es'} pendiente{studentStats?.pendingCount === 1 ? '' : 's'}.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate('/grades')}
                  sx={{ background: 'rgba(255,255,255,0.25)', color: '#fff', fontWeight: 700, boxShadow: 'none' }}
                >
                  Seguir aprendiendo
                </Button>
              </Paper>
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2.5, borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <FormControl sx={{ minWidth: 260 }}>
                  <InputLabel>Grado</InputLabel>
                  <Select value={selectedGradeId || ''} label="Grado" onChange={(event) => setSelectedGradeId(event.target.value)}>
                    {grades.map((grade) => <MenuItem key={grade.id} value={grade.id}>{grade.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <Button variant="contained" onClick={() => navigate(isDocente ? '/teaching/activities' : '/admin/activities')}>
                  Gestionar actividades
                </Button>
              </Paper>
            </Grid>

            <Grid item xs={12} md={7}>
              <Paper sx={{ p: 3, borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Estudiantes del grado</Typography>
                {(gradeSummary?.students_progress || []).length ? gradeSummary.students_progress.map((student) => (
                  <Box key={student.student_id} sx={{ p: 2, mb: 2, borderRadius: '16px', background: '#fafafa', border: '1px solid #eceff1' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 1 }}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700}>{student.student_name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {student.completed} completadas · {student.in_progress} en progreso · {student.pending} pendientes
                        </Typography>
                      </Box>
                      <Chip label={`${student.completion_rate}%`} sx={{ fontWeight: 700 }} />
                    </Box>
                    <LinearProgress variant="determinate" value={student.completion_rate || 0} sx={{ height: 8, borderRadius: 4 }} />
                  </Box>
                )) : <Typography color="text.secondary">No hay datos para este grado.</Typography>}
              </Paper>
            </Grid>

            <Grid item xs={12} md={5}>
              <Paper sx={{ p: 3, borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', mb: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Mejor avance</Typography>
                {staffStats.topStudents.length ? staffStats.topStudents.map((student) => (
                  <Box key={student.student_id} sx={{ p: 1.75, mb: 1.5, borderRadius: '12px', background: '#fff8e1' }}>
                    <Typography variant="body2" fontWeight={700}>{student.student_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{student.completion_rate}% de avance</Typography>
                  </Box>
                )) : <Typography color="text.secondary">Sin datos para mostrar.</Typography>}
              </Paper>

              <Paper sx={{ p: 3, borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Requieren seguimiento</Typography>
                {staffStats.attentionNeeded.length ? staffStats.attentionNeeded.map((student) => (
                  <Box key={student.student_id} sx={{ p: 1.75, mb: 1.5, borderRadius: '12px', background: '#ffebee' }}>
                    <Typography variant="body2" fontWeight={700}>{student.student_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{student.pending} pendientes · {student.completion_rate}% de avance</Typography>
                  </Box>
                )) : <Typography color="text.secondary">No hay estudiantes criticos en este grado.</Typography>}
              </Paper>
            </Grid>
          </Grid>
        )}
      </Container>

      <Footer />
    </Box>
  );
};

export default ProgressPage;
