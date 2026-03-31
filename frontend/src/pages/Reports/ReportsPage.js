import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Breadcrumbs,
  Card,
  CardContent,
  Container,
  FormControl,
  Grid,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  Assessment,
  FactCheck,
  Home,
  NotificationsActive,
  School,
  VideoCall,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axiosInstance from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Footer from '../../components/Layout/Footer';

const StatsCard = ({ title, value, subtitle, color, icon }) => (
  <Card sx={{ borderTop: `4px solid ${color}`, height: '100%' }}>
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Avatar sx={{ bgcolor: `${color}22`, color, width: 56, height: 56 }}>{icon}</Avatar>
      <Box>
        <Typography variant="h4" fontWeight={900} sx={{ color }}>
          {value}
        </Typography>
        <Typography variant="subtitle2" fontWeight={700}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      </Box>
    </CardContent>
  </Card>
);

const ReportsPage = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [grades, setGrades] = useState([]);
  const [selectedGradeId, setSelectedGradeId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReport = async (gradeId = '') => {
    setLoading(true);
    setError('');
    try {
      const params = gradeId ? { grade_id: gradeId } : undefined;
      const reportRes = await axiosInstance.get('/reports/overview', { params });
      setReport(reportRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar reportes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        if (isAdmin) {
          const gradesRes = await axiosInstance.get('/grades/');
          setGrades(gradesRes.data?.results || gradesRes.data || []);
        }
      } catch (err) {
        setError('No se pudieron cargar los grados.');
      } finally {
        fetchReport('');
      }
    };

    load();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchReport(selectedGradeId);
  }, [isAdmin, selectedGradeId]);

  const stats = useMemo(
    () =>
      report
        ? [
            {
              title: 'Estudiantes',
              value: report.total_students,
              subtitle: report.grade_name || 'Alcance actual',
              color: '#1976d2',
              icon: <School />,
            },
            {
              title: 'Actividades',
              value: report.total_activities,
              subtitle: `${report.total_tasks_and_exams} tareas y examenes`,
              color: '#9c27b0',
              icon: <Assessment />,
            },
            {
              title: 'Clases',
              value: report.total_live_classes,
              subtitle: `${report.total_attendance_records} asistencias registradas`,
              color: '#e91e63',
              icon: <VideoCall />,
            },
            {
              title: 'Seguimiento',
              value: `${report.average_completion_rate}%`,
              subtitle: `${report.pending_grading} entregas pendientes`,
              color: '#4caf50',
              icon: <FactCheck />,
            },
            {
              title: 'Notificaciones',
              value: report.unread_notifications,
              subtitle: 'Sin leer',
              color: '#ff9800',
              icon: <NotificationsActive />,
            },
          ]
        : [],
    [report]
  );

  if (loading && !report) {
    return <LoadingSpinner message="Cargando reportes..." />;
  }

  return (
    <Box sx={{ background: '#f5f7fa', minHeight: '100vh' }}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0d47a1 0%, #1976d2 100%)',
          py: 6,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
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
              Reportes
            </Typography>
          </Breadcrumbs>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box>
              <Typography variant="h3" fontWeight={800} sx={{ color: '#fff', lineHeight: 1 }}>
                Reportes y seguimiento
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.5 }}>
                {report?.grade_name ? `Resumen de ${report.grade_name}` : 'Vista consolidada del sistema'}
              </Typography>
            </Box>

            {isAdmin && (
              <FormControl sx={{ minWidth: 240, bgcolor: '#fff', borderRadius: '12px' }} size="small">
                <InputLabel>Filtrar por grado</InputLabel>
                <Select
                  value={selectedGradeId}
                  label="Filtrar por grado"
                  onChange={(event) => setSelectedGradeId(event.target.value)}
                >
                  <MenuItem value="">Todos los grados</MenuItem>
                  {grades.map((grade) => (
                    <MenuItem key={grade.id} value={grade.id}>
                      {grade.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: '12px' }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          {stats.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={stats.length > 4 ? 4 : 3} key={item.title}>
              <StatsCard {...item} />
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: '20px', height: '100%' }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Estudiantes con mejor avance
              </Typography>
              {report?.top_students?.length ? (
                report.top_students.map((student, index) => (
                  <Box
                    key={student.student_id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 1.5,
                      borderBottom: index === report.top_students.length - 1 ? 'none' : '1px solid #eee',
                    }}
                  >
                    <Box>
                      <Typography fontWeight={700}>{student.student_name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {student.graded_submissions} entregas calificadas
                      </Typography>
                    </Box>
                    <Typography fontWeight={800} color="primary">
                      {student.completion_rate}%
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography color="text.secondary">Aun no hay datos suficientes.</Typography>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: '20px', height: '100%' }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Estudiantes que requieren seguimiento
              </Typography>
              {report?.students_needing_attention?.length ? (
                report.students_needing_attention.map((student, index) => (
                  <Box
                    key={student.student_id}
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      py: 1.5,
                      borderBottom: index === report.students_needing_attention.length - 1 ? 'none' : '1px solid #eee',
                    }}
                  >
                    <Box>
                      <Typography fontWeight={700}>{student.student_name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {student.pending_activities} pendientes
                      </Typography>
                    </Box>
                    <Typography fontWeight={800} color="#e91e63">
                      {student.completion_rate}%
                    </Typography>
                  </Box>
                ))
              ) : (
                <Typography color="text.secondary">No hay alertas en este momento.</Typography>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 3, borderRadius: '20px' }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                Resumen por materia
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Materia</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Actividades</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Clases</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Por revisar</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report?.subject_summary?.length ? (
                      report.subject_summary.map((item) => (
                        <TableRow key={item.subject_id}>
                          <TableCell>{item.subject_name}</TableCell>
                          <TableCell>{item.activities}</TableCell>
                          <TableCell>{item.live_classes}</TableCell>
                          <TableCell>{item.submissions_pending_grading}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}>
                          No hay resumen disponible.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Footer />
    </Box>
  );
};

export default ReportsPage;
