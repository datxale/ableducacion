import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Container,
  FormControl,
  Grid,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Delete, Edit, Home, Save } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import axiosInstance from '../../api/axios';
import Footer from '../../components/Layout/Footer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

const emptyGrade = { id: null, name: '', description: '' };
const emptySubject = { id: null, name: '', grade_id: '' };
const emptyGroup = { id: null, name: '', description: '', grade_id: '', teacher_id: '', is_active: true };
const emptyEnrollment = { id: null, student_id: '', grade_id: '', group_id: '', academic_year: new Date().getFullYear().toString(), status: 'active' };
const statusChipStyle = {
  active: { bgcolor: '#e8f5e9', color: '#2e7d32' },
  inactive: { bgcolor: '#eceff1', color: '#546e7a' },
  withdrawn: { bgcolor: '#fff3e0', color: '#ef6c00' },
  retired: { bgcolor: '#fbe9e7', color: '#d84315' },
};
const groupStatusOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
];

const ManageAcademics = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isDocente } = useAuth();
  const isTeacherView = isDocente && !isAdmin;
  const [tab, setTab] = useState(isTeacherView ? 2 : 0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [groups, setGroups] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [gradeForm, setGradeForm] = useState(emptyGrade);
  const [subjectForm, setSubjectForm] = useState(emptySubject);
  const [groupForm, setGroupForm] = useState(emptyGroup);
  const [enrollmentForm, setEnrollmentForm] = useState(emptyEnrollment);
  const [gradeSearch, setGradeSearch] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [subjectGradeFilter, setSubjectGradeFilter] = useState('all');
  const [groupSearch, setGroupSearch] = useState('');
  const [groupGradeFilter, setGroupGradeFilter] = useState('all');
  const [groupStatusFilter, setGroupStatusFilter] = useState('all');
  const [enrollmentSearch, setEnrollmentSearch] = useState('');
  const [enrollmentGradeFilter, setEnrollmentGradeFilter] = useState('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (isTeacherView && user?.id) {
        const [gradesRes, subjectsRes, groupsRes, studentsRes] = await Promise.all([
          axiosInstance.get('/grades/'),
          axiosInstance.get('/subjects/'),
          axiosInstance.get('/groups/', { params: { teacher_id: user.id } }).catch(() => ({ data: [] })),
          axiosInstance.get('/users/', { params: { role: 'estudiante' } }).catch(() => ({ data: [] })),
        ]);
        setGrades(gradesRes.data || []);
        setSubjects(subjectsRes.data || []);
        setGroups(groupsRes.data || []);
        setEnrollments([]);
        setStudents(studentsRes.data || []);
        setTeachers(user ? [user] : []);
      } else {
        const [gradesRes, subjectsRes, groupsRes, enrollmentsRes, studentsRes, teachersRes] = await Promise.all([
          axiosInstance.get('/grades/'),
          axiosInstance.get('/subjects/'),
          axiosInstance.get('/groups/').catch(() => ({ data: [] })),
          axiosInstance.get('/enrollments/').catch(() => ({ data: [] })),
          axiosInstance.get('/users/', { params: { role: 'estudiante' } }),
          axiosInstance.get('/users/', { params: { role: 'docente' } }),
        ]);
        setGrades(gradesRes.data || []);
        setSubjects(subjectsRes.data || []);
        setGroups(groupsRes.data || []);
        setEnrollments(enrollmentsRes.data || []);
        setStudents(studentsRes.data || []);
        setTeachers(teachersRes.data || []);
      }
    } catch (err) {
      setError('No se pudo cargar la estructura academica.');
    } finally {
      setLoading(false);
    }
  }, [isTeacherView, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (isTeacherView && tab === 3) {
      setTab(2);
    }
  }, [isTeacherView, tab]);

  const gradesById = useMemo(() => Object.fromEntries(grades.map((item) => [item.id, item])), [grades]);
  const groupsById = useMemo(() => Object.fromEntries(groups.map((item) => [item.id, item])), [groups]);
  const studentsById = useMemo(() => Object.fromEntries(students.map((item) => [item.id, item])), [students]);
  const teachersById = useMemo(() => Object.fromEntries(teachers.map((item) => [item.id, item])), [teachers]);
  const enrollmentGroups = groups.filter((item) => !enrollmentForm.grade_id || item.grade_id === Number(enrollmentForm.grade_id));
  const filteredGrades = useMemo(() => {
    const query = gradeSearch.trim().toLowerCase();
    if (!query) return grades;
    return grades.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        (item.description || '').toLowerCase().includes(query)
    );
  }, [gradeSearch, grades]);
  const filteredSubjects = useMemo(() => {
    const query = subjectSearch.trim().toLowerCase();
    return subjects.filter((item) => {
      if (subjectGradeFilter !== 'all' && item.grade_id !== Number(subjectGradeFilter)) return false;
      if (!query) return true;
      return item.name.toLowerCase().includes(query);
    });
  }, [subjectGradeFilter, subjectSearch, subjects]);
  const filteredGroups = useMemo(() => {
    const query = groupSearch.trim().toLowerCase();
    return groups.filter((item) => {
      if (groupGradeFilter !== 'all' && item.grade_id !== Number(groupGradeFilter)) return false;
      if (groupStatusFilter === 'active' && !item.is_active) return false;
      if (groupStatusFilter === 'inactive' && item.is_active) return false;
      if (!query) return true;
      return [
        item.name,
        item.description || '',
        gradesById[item.grade_id]?.name || '',
        teachersById[item.teacher_id]?.full_name || '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [gradesById, groupGradeFilter, groupSearch, groupStatusFilter, groups, teachersById]);
  const filteredEnrollments = useMemo(() => {
    const query = enrollmentSearch.trim().toLowerCase();
    return enrollments.filter((item) => {
      if (enrollmentGradeFilter !== 'all' && item.grade_id !== Number(enrollmentGradeFilter)) return false;
      if (!query) return true;
      const student = studentsById[item.student_id];
      const group = student?.group_id ? groupsById[student.group_id] : null;
      return [
        student?.full_name || '',
        gradesById[item.grade_id]?.name || '',
        group?.name || '',
        item.academic_year || '',
        item.status || '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [enrollmentGradeFilter, enrollmentSearch, enrollments, gradesById, groupsById, studentsById]);

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const saveGrade = async () => {
    if (!isAdmin) return;
    if (!gradeForm.name.trim()) return;
    clearMessages();
    setSaving(true);
    try {
      if (gradeForm.id) await axiosInstance.put(`/grades/${gradeForm.id}`, { name: gradeForm.name.trim(), description: gradeForm.description.trim() || null });
      else await axiosInstance.post('/grades/', { name: gradeForm.name.trim(), description: gradeForm.description.trim() || null });
      setSuccess(gradeForm.id ? 'Grado actualizado.' : 'Grado creado.');
      setGradeForm(emptyGrade);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo guardar el grado.');
    } finally {
      setSaving(false);
    }
  };

  const saveSubject = async () => {
    if (!isAdmin) return;
    if (!subjectForm.name.trim() || !subjectForm.grade_id) return;
    clearMessages();
    setSaving(true);
    const payload = { name: subjectForm.name.trim(), grade_id: Number(subjectForm.grade_id) };
    try {
      if (subjectForm.id) await axiosInstance.put(`/subjects/${subjectForm.id}`, payload);
      else await axiosInstance.post('/subjects/', payload);
      setSuccess(subjectForm.id ? 'Materia actualizada.' : 'Materia creada.');
      setSubjectForm(emptySubject);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo guardar la materia.');
    } finally {
      setSaving(false);
    }
  };

  const saveGroup = async () => {
    if (!groupForm.name.trim() || !groupForm.grade_id) return;
    clearMessages();
    setSaving(true);
    const payload = {
      name: groupForm.name.trim(),
      description: groupForm.description.trim() || null,
      grade_id: Number(groupForm.grade_id),
      teacher_id: isTeacherView ? user?.id : groupForm.teacher_id ? Number(groupForm.teacher_id) : null,
      is_active: !!groupForm.is_active,
    };
    try {
      if (groupForm.id) await axiosInstance.put(`/groups/${groupForm.id}`, payload);
      else await axiosInstance.post('/groups/', payload);
      setSuccess(groupForm.id ? 'Seccion actualizada.' : 'Seccion creada.');
      setGroupForm(emptyGroup);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo guardar la seccion.');
    } finally {
      setSaving(false);
    }
  };

  const saveEnrollment = async () => {
    if (!isAdmin) return;
    if (!enrollmentForm.student_id || !enrollmentForm.grade_id || !enrollmentForm.academic_year.trim()) return;
    clearMessages();
    setSaving(true);
    try {
      if (enrollmentForm.id) {
        await axiosInstance.put(`/enrollments/${enrollmentForm.id}`, {
          grade_id: Number(enrollmentForm.grade_id),
          academic_year: enrollmentForm.academic_year.trim(),
          status: enrollmentForm.status,
        });
      } else {
        await axiosInstance.post('/enrollments/', {
          student_id: Number(enrollmentForm.student_id),
          grade_id: Number(enrollmentForm.grade_id),
          academic_year: enrollmentForm.academic_year.trim(),
        });
      }
      await axiosInstance.put(`/users/${enrollmentForm.student_id}`, {
        grade_id: Number(enrollmentForm.grade_id),
        group_id: enrollmentForm.group_id ? Number(enrollmentForm.group_id) : null,
      });
      setSuccess(enrollmentForm.id ? 'Matricula actualizada.' : 'Matricula creada.');
      setEnrollmentForm(emptyEnrollment);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo guardar la matricula.');
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (type, item) => {
    if (!isAdmin && type !== 'group') {
      setError('Solo el administrador puede eliminar este tipo de registro.');
      return;
    }
    if (!window.confirm('Esta accion no se puede deshacer. Deseas continuar?')) return;
    clearMessages();
    setSaving(true);
    const paths = {
      grade: `/grades/${item.id}`,
      subject: `/subjects/${item.id}`,
      group: `/groups/${item.id}`,
      enrollment: `/enrollments/${item.id}`,
    };
    try {
      await axiosInstance.delete(paths[type]);
      setSuccess(type === 'group' ? 'Seccion eliminada.' : 'Registro eliminado.');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo eliminar el registro.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Cargando estructura academica..." />;

  return (
    <Box sx={{ minHeight: '100vh', background: '#f5f7fa' }}>
      <Box sx={{ background: 'linear-gradient(135deg, #1565c0 0%, #42a5f5 100%)', py: 5 }}>
        <Container maxWidth="lg">
          <Breadcrumbs sx={{ mb: 2 }} separator=">">
            <Link component="button" onClick={() => navigate('/dashboard')} sx={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>
              <Home sx={{ fontSize: '1rem', mr: 0.3, verticalAlign: 'middle' }} /> Dashboard
            </Link>
            <Link component="button" onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')} sx={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none' }}>
              {isAdmin ? 'Admin' : 'Docencia'}
            </Link>
            <Typography sx={{ color: '#fff', fontWeight: 700 }}>Estructura academica</Typography>
          </Breadcrumbs>
          <Typography variant="h4" fontWeight={900} sx={{ color: '#fff' }}>
            {isTeacherView ? 'Grados y secciones asignadas' : 'Estructura academica'}
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.86)' }}>
            {isTeacherView
              ? 'Consulta y gestiona las secciones de los grados que tienes asignados.'
              : 'Gestiona grados, materias, grupos y matriculas desde el panel.'}
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Paper sx={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
          <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ px: 2, pt: 1.5 }}>
            <Tab label={`Grados (${grades.length})`} />
            <Tab label={`Materias (${subjects.length})`} />
            <Tab label={`Secciones (${groups.length})`} />
            {!isTeacherView && <Tab label={`Matriculas (${enrollments.length})`} />}
          </Tabs>

          <Box sx={{ p: 3 }}>
            {tab === 0 && (
              <>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={isAdmin ? 4 : 12}>
                    <TextField fullWidth label="Buscar grado" value={gradeSearch} onChange={(e) => setGradeSearch(e.target.value)} />
                  </Grid>
                  {isAdmin && (
                    <>
                      <Grid item xs={12} md={4}><TextField fullWidth label="Grado" value={gradeForm.name} onChange={(e) => setGradeForm({ ...gradeForm, name: e.target.value })} /></Grid>
                      <Grid item xs={12} md={3}><TextField fullWidth label="Descripcion" value={gradeForm.description} onChange={(e) => setGradeForm({ ...gradeForm, description: e.target.value })} /></Grid>
                      <Grid item xs={12} md={1}><Button fullWidth variant="contained" startIcon={<Save />} onClick={saveGrade} disabled={saving || !gradeForm.name.trim()} sx={{ height: '100%' }}>{gradeForm.id ? 'Actualizar' : 'Crear'}</Button></Grid>
                    </>
                  )}
                </Grid>
                <TableContainer><Table><TableHead><TableRow><TableCell>Grado</TableCell><TableCell>Descripcion</TableCell><TableCell>Materias</TableCell><TableCell>Secciones</TableCell>{isAdmin && <TableCell align="right">Acciones</TableCell>}</TableRow></TableHead><TableBody>{filteredGrades.map((item) => <TableRow key={item.id}><TableCell>{item.name}</TableCell><TableCell>{item.description || 'Sin descripcion'}</TableCell><TableCell>{subjects.filter((subject) => subject.grade_id === item.id).length}</TableCell><TableCell>{groups.filter((group) => group.grade_id === item.id).length}</TableCell>{isAdmin && <TableCell align="right"><Button size="small" startIcon={<Edit />} onClick={() => setGradeForm({ id: item.id, name: item.name, description: item.description || '' })}>Editar</Button><Button size="small" color="error" startIcon={<Delete />} onClick={() => removeItem('grade', item)}>Eliminar</Button></TableCell>}</TableRow>)}</TableBody></Table></TableContainer>
              </>
            )}

            {tab === 1 && (
              <>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={isAdmin ? 3 : 6}><TextField fullWidth label="Buscar materia" value={subjectSearch} onChange={(e) => setSubjectSearch(e.target.value)} /></Grid>
                  <Grid item xs={12} md={isAdmin ? 3 : 6}><FormControl fullWidth><InputLabel>Grado</InputLabel><Select value={subjectGradeFilter} label="Grado" onChange={(e) => setSubjectGradeFilter(e.target.value)}><MenuItem value="all">Todos</MenuItem>{grades.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}</Select></FormControl></Grid>
                  {isAdmin && (
                    <>
                      <Grid item xs={12} md={3}><TextField fullWidth label="Materia" value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} /></Grid>
                      <Grid item xs={12} md={2}><FormControl fullWidth><InputLabel>Grado</InputLabel><Select value={subjectForm.grade_id} label="Grado" onChange={(e) => setSubjectForm({ ...subjectForm, grade_id: e.target.value })}>{grades.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}</Select></FormControl></Grid>
                      <Grid item xs={12} md={1}><Button fullWidth variant="contained" startIcon={<Save />} onClick={saveSubject} disabled={saving || !subjectForm.name.trim() || !subjectForm.grade_id} sx={{ height: '100%' }}>{subjectForm.id ? 'Actualizar' : 'Crear'}</Button></Grid>
                    </>
                  )}
                </Grid>
                <TableContainer><Table><TableHead><TableRow><TableCell>Materia</TableCell><TableCell>Grado</TableCell>{isAdmin && <TableCell align="right">Acciones</TableCell>}</TableRow></TableHead><TableBody>{filteredSubjects.map((item) => <TableRow key={item.id}><TableCell>{item.name}</TableCell><TableCell>{gradesById[item.grade_id]?.name || `Grado ${item.grade_id}`}</TableCell>{isAdmin && <TableCell align="right"><Button size="small" startIcon={<Edit />} onClick={() => setSubjectForm({ id: item.id, name: item.name, grade_id: item.grade_id })}>Editar</Button><Button size="small" color="error" startIcon={<Delete />} onClick={() => removeItem('subject', item)}>Eliminar</Button></TableCell>}</TableRow>)}</TableBody></Table></TableContainer>
              </>
            )}

            {tab === 2 && (
              <>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={4}><TextField fullWidth label="Buscar seccion" value={groupSearch} onChange={(e) => setGroupSearch(e.target.value)} /></Grid>
                  <Grid item xs={12} md={3}><FormControl fullWidth><InputLabel>Grado</InputLabel><Select value={groupGradeFilter} label="Grado" onChange={(e) => setGroupGradeFilter(e.target.value)}><MenuItem value="all">Todos</MenuItem>{grades.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}</Select></FormControl></Grid>
                  <Grid item xs={12} md={3}><FormControl fullWidth><InputLabel>Estado</InputLabel><Select value={groupStatusFilter} label="Estado" onChange={(e) => setGroupStatusFilter(e.target.value)}>{groupStatusOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}</Select></FormControl></Grid>
                  <Grid item xs={12} md={2}><Button fullWidth variant="outlined" onClick={() => { setGroupSearch(''); setGroupGradeFilter('all'); setGroupStatusFilter('all'); }} sx={{ height: '100%' }}>Limpiar filtros</Button></Grid>
                  <Grid item xs={12} md={3}><TextField fullWidth label="Grupo o seccion" value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })} /></Grid>
                  <Grid item xs={12} md={3}><FormControl fullWidth><InputLabel>Grado</InputLabel><Select value={groupForm.grade_id} label="Grado" onChange={(e) => setGroupForm({ ...groupForm, grade_id: e.target.value })}>{grades.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}</Select></FormControl></Grid>
                  <Grid item xs={12} md={3}>
                    {isTeacherView ? (
                      <TextField fullWidth label="Docente" value={user?.full_name || ''} disabled />
                    ) : (
                      <FormControl fullWidth><InputLabel>Docente</InputLabel><Select value={groupForm.teacher_id} label="Docente" onChange={(e) => setGroupForm({ ...groupForm, teacher_id: e.target.value })}><MenuItem value=""><em>Sin docente</em></MenuItem>{teachers.map((item) => <MenuItem key={item.id} value={item.id}>{item.full_name}</MenuItem>)}</Select></FormControl>
                    )}
                  </Grid>
                  <Grid item xs={12} md={3}><Button fullWidth variant="contained" startIcon={<Save />} onClick={saveGroup} disabled={saving || !groupForm.name.trim() || !groupForm.grade_id} sx={{ height: '100%' }}>{groupForm.id ? 'Actualizar' : 'Crear'}</Button></Grid>
                  <Grid item xs={12}><TextField fullWidth label="Descripcion" value={groupForm.description} onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })} /></Grid>
                </Grid>
                <TableContainer><Table><TableHead><TableRow><TableCell>Grupo</TableCell><TableCell>Grado</TableCell><TableCell>Docente</TableCell><TableCell>Estudiantes</TableCell><TableCell>Estado</TableCell><TableCell align="right">Acciones</TableCell></TableRow></TableHead><TableBody>{filteredGroups.map((item) => <TableRow key={item.id}><TableCell><Typography fontWeight={700}>{item.name}</Typography><Typography variant="caption" color="text.secondary">{item.description || 'Sin descripcion'}</Typography></TableCell><TableCell>{gradesById[item.grade_id]?.name || `Grado ${item.grade_id}`}</TableCell><TableCell>{teachersById[item.teacher_id]?.full_name || (item.teacher_id === user?.id ? user.full_name : 'Sin docente asignado')}</TableCell><TableCell>{students.filter((student) => student.group_id === item.id).length}</TableCell><TableCell><Chip label={item.is_active ? 'Activo' : 'Inactivo'} size="small" sx={item.is_active ? { bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 800 } : { bgcolor: '#eceff1', color: '#546e7a', fontWeight: 800 }} /></TableCell><TableCell align="right"><Button size="small" startIcon={<Edit />} onClick={() => setGroupForm({ id: item.id, name: item.name, description: item.description || '', grade_id: item.grade_id, teacher_id: item.teacher_id || '', is_active: item.is_active !== false })}>Editar</Button><Button size="small" color="error" startIcon={<Delete />} onClick={() => removeItem('group', item)}>Eliminar</Button></TableCell></TableRow>)}</TableBody></Table></TableContainer>
              </>
            )}

            {!isTeacherView && tab === 3 && (
              <>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={12} md={3}><TextField fullWidth label="Buscar matricula" value={enrollmentSearch} onChange={(e) => setEnrollmentSearch(e.target.value)} /></Grid>
                  <Grid item xs={12} md={2}><FormControl fullWidth><InputLabel>Filtro grado</InputLabel><Select value={enrollmentGradeFilter} label="Filtro grado" onChange={(e) => setEnrollmentGradeFilter(e.target.value)}><MenuItem value="all">Todos</MenuItem>{grades.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}</Select></FormControl></Grid>
                  <Grid item xs={12} md={2}><FormControl fullWidth><InputLabel>Estudiante</InputLabel><Select value={enrollmentForm.student_id} label="Estudiante" onChange={(e) => setEnrollmentForm({ ...enrollmentForm, student_id: e.target.value })} disabled={!!enrollmentForm.id}>{students.map((item) => <MenuItem key={item.id} value={item.id}>{item.full_name}</MenuItem>)}</Select></FormControl></Grid>
                  <Grid item xs={12} md={2}><FormControl fullWidth><InputLabel>Grado</InputLabel><Select value={enrollmentForm.grade_id} label="Grado" onChange={(e) => setEnrollmentForm({ ...enrollmentForm, grade_id: e.target.value, group_id: '' })}>{grades.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}</Select></FormControl></Grid>
                  <Grid item xs={12} md={2}><FormControl fullWidth><InputLabel>Grupo</InputLabel><Select value={enrollmentForm.group_id} label="Grupo" onChange={(e) => setEnrollmentForm({ ...enrollmentForm, group_id: e.target.value })}><MenuItem value=""><em>Sin grupo</em></MenuItem>{enrollmentGroups.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}</Select></FormControl></Grid>
                  <Grid item xs={12} md={1}><TextField fullWidth label="Anio" value={enrollmentForm.academic_year} onChange={(e) => setEnrollmentForm({ ...enrollmentForm, academic_year: e.target.value })} /></Grid>
                  <Grid item xs={12} md={2}><Button fullWidth variant="contained" startIcon={<Save />} onClick={saveEnrollment} disabled={saving || !enrollmentForm.student_id || !enrollmentForm.grade_id || !enrollmentForm.academic_year.trim()}>{enrollmentForm.id ? 'Actualizar' : 'Crear'}</Button></Grid>
                </Grid>
                <TableContainer><Table><TableHead><TableRow><TableCell>Estudiante</TableCell><TableCell>Grado</TableCell><TableCell>Grupo</TableCell><TableCell>Anio</TableCell><TableCell>Estado</TableCell><TableCell align="right">Acciones</TableCell></TableRow></TableHead><TableBody>{filteredEnrollments.map((item) => { const student = studentsById[item.student_id]; const group = student?.group_id ? groupsById[student.group_id] : null; return <TableRow key={item.id}><TableCell>{student?.full_name || `Estudiante ${item.student_id}`}</TableCell><TableCell>{gradesById[item.grade_id]?.name || `Grado ${item.grade_id}`}</TableCell><TableCell>{group?.name || 'Sin grupo'}</TableCell><TableCell>{item.academic_year}</TableCell><TableCell><Chip label={item.status} size="small" sx={{ fontWeight: 800, ...(statusChipStyle[item.status] || statusChipStyle.inactive) }} /></TableCell><TableCell align="right"><Button size="small" startIcon={<Edit />} onClick={() => setEnrollmentForm({ id: item.id, student_id: item.student_id, grade_id: item.grade_id, group_id: student?.group_id || '', academic_year: item.academic_year, status: item.status })}>Editar</Button><Button size="small" color="error" startIcon={<Delete />} onClick={() => removeItem('enrollment', item)}>Eliminar</Button></TableCell></TableRow>; })}</TableBody></Table></TableContainer>
              </>
            )}
          </Box>
        </Paper>
      </Container>

      <Footer />
    </Box>
  );
};

export default ManageAcademics;
