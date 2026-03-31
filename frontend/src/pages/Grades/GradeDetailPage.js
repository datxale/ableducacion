import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Link,
  MenuItem,
  Paper,
  Select,
  Stack,
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
import {
  AccountTree,
  Add,
  ArrowForward,
  CalendarMonth,
  Clear,
  Delete,
  Edit,
  Groups,
  Home,
  MenuBook,
  Save,
  School,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';

import axiosInstance from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Footer from '../../components/Layout/Footer';
import { useAuth } from '../../context/AuthContext';
import { gradeColors, subjectColors } from '../../styles/theme';

const emptySubjectForm = { id: null, name: '' };
const emptyGroupForm = {
  id: null,
  name: '',
  description: '',
  teacher_id: '',
  is_active: true,
};

const MONTH_BRANCH_OPTIONS = [
  { number: 1, name: 'Enero', accent: '#42a5f5' },
  { number: 2, name: 'Febrero', accent: '#ef5350' },
  { number: 3, name: 'Marzo', accent: '#66bb6a' },
  { number: 4, name: 'Abril', accent: '#ffb300' },
  { number: 5, name: 'Mayo', accent: '#ab47bc' },
  { number: 6, name: 'Junio', accent: '#26c6da' },
  { number: 7, name: 'Julio', accent: '#5c6bc0' },
  { number: 8, name: 'Agosto', accent: '#8d6e63' },
  { number: 9, name: 'Septiembre', accent: '#26a69a' },
  { number: 10, name: 'Octubre', accent: '#ec407a' },
  { number: 11, name: 'Noviembre', accent: '#ffa726' },
  { number: 12, name: 'Diciembre', accent: '#78909c' },
];

const GradeDetailPage = () => {
  const { gradeId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin, isDocente } = useAuth();
  const canManageGroups = isAdmin || isDocente;

  const [grade, setGrade] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingSubject, setSavingSubject] = useState(false);
  const [savingGroup, setSavingGroup] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [groupStatusFilter, setGroupStatusFilter] = useState('all');
  const [groupTeacherFilter, setGroupTeacherFilter] = useState('all');
  const [subjectForm, setSubjectForm] = useState(emptySubjectForm);
  const [groupForm, setGroupForm] = useState(emptyGroupForm);

  const loadGradeData = useCallback(
    async (showLoader = true) => {
      if (showLoader) {
        setLoading(true);
      }

      try {
        const requests = [
          axiosInstance.get(`/grades/${gradeId}/`),
          axiosInstance.get(`/subjects/?grade_id=${gradeId}`),
          axiosInstance.get('/groups/', { params: { grade_id: gradeId } }).catch(() => ({ data: [] })),
        ];

        if (isAdmin) {
          requests.push(
            axiosInstance.get('/users/', { params: { role: 'docente' } }).catch(() => ({ data: [] }))
          );
        }

        const [gradeRes, subjectsRes, groupsRes, teachersRes] = await Promise.all(requests);
        setGrade(gradeRes.data);
        setSubjects(subjectsRes.data?.results || subjectsRes.data || []);
        setGroups(groupsRes.data?.results || groupsRes.data || []);
        setTeachers((teachersRes?.data?.results || teachersRes?.data || []).filter(Boolean));
      } catch (err) {
        setError('Error al cargar la informacion del grado.');
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    [gradeId, isAdmin]
  );

  useEffect(() => {
    loadGradeData(true);
  }, [loadGradeData]);

  const gradeIndex = Math.max(parseInt(gradeId, 10) - 1, 0);
  const colorSet = gradeColors[gradeIndex % gradeColors.length];

  const filteredSubjects = useMemo(() => {
    if (groups.length > 0 && !selectedGroupId) return [];
    const query = subjectSearch.trim().toLowerCase();
    if (!query) return subjects;
    return subjects.filter((subject) => subject.name.toLowerCase().includes(query));
  }, [groups.length, selectedGroupId, subjectSearch, subjects]);

  const teachersById = useMemo(
    () => Object.fromEntries(teachers.map((teacher) => [teacher.id, teacher])),
    [teachers]
  );

  const filteredGroups = useMemo(() => {
    const query = groupSearch.trim().toLowerCase();

    return groups.filter((group) => {
      if (groupStatusFilter === 'active' && !group.is_active) return false;
      if (groupStatusFilter === 'inactive' && group.is_active) return false;
      if (groupTeacherFilter !== 'all' && String(group.teacher_id || '') !== String(groupTeacherFilter)) {
        return false;
      }

      if (!query) return true;

      const teacherName =
        group.teacher?.full_name ||
        teachersById[group.teacher_id]?.full_name ||
        '';

      return [group.name, group.description || '', teacherName]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }, [groupSearch, groupStatusFilter, groupTeacherFilter, groups, teachersById]);

  const selectedGroup = useMemo(
    () => groups.find((group) => String(group.id) === String(selectedGroupId)) || null,
    [groups, selectedGroupId]
  );

  useEffect(() => {
    if (selectedGroupId && !groups.some((group) => String(group.id) === String(selectedGroupId))) {
      setSelectedGroupId('');
    }
    if (!selectedGroupId && groups.length === 1) {
      setSelectedGroupId(String(groups[0].id));
    }
  }, [groups, selectedGroupId]);

  const resetMessages = () => {
    setError('');
    setSuccess('');
  };

  const handleSaveSubject = async () => {
    if (!subjectForm.name.trim()) return;

    resetMessages();
    setSavingSubject(true);
    try {
      const payload = {
        name: subjectForm.name.trim(),
        grade_id: Number(gradeId),
      };

      if (subjectForm.id) {
        await axiosInstance.put(`/subjects/${subjectForm.id}`, payload);
        setSuccess('Materia actualizada.');
      } else {
        await axiosInstance.post('/subjects/', payload);
        setSuccess('Materia creada.');
      }

      setSubjectForm(emptySubjectForm);
      await loadGradeData(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo guardar la materia.');
    } finally {
      setSavingSubject(false);
    }
  };

  const handleDeleteSubject = async (subject) => {
    if (!window.confirm(`Se eliminara la materia "${subject.name}". Deseas continuar?`)) {
      return;
    }

    resetMessages();
    setSavingSubject(true);
    try {
      await axiosInstance.delete(`/subjects/${subject.id}`);
      setSuccess('Materia eliminada.');
      if (subjectForm.id === subject.id) {
        setSubjectForm(emptySubjectForm);
      }
      await loadGradeData(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo eliminar la materia.');
    } finally {
      setSavingSubject(false);
    }
  };

  const handleSaveGroup = async () => {
    if (!groupForm.name.trim()) return;

    resetMessages();
    setSavingGroup(true);
    try {
      const payload = {
        name: groupForm.name.trim(),
        description: groupForm.description.trim() || null,
        grade_id: Number(gradeId),
        teacher_id: isDocente && !isAdmin ? user?.id : groupForm.teacher_id ? Number(groupForm.teacher_id) : null,
        is_active: !!groupForm.is_active,
      };

      if (groupForm.id) {
        await axiosInstance.put(`/groups/${groupForm.id}`, payload);
        setSuccess('Seccion actualizada.');
      } else {
        await axiosInstance.post('/groups/', payload);
        setSuccess('Seccion creada.');
      }

      setGroupForm(emptyGroupForm);
      await loadGradeData(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo guardar la seccion.');
    } finally {
      setSavingGroup(false);
    }
  };

  const handleDeleteGroup = async (group) => {
    if (!window.confirm(`Se eliminara la seccion "${group.name}". Deseas continuar?`)) {
      return;
    }

    resetMessages();
    setSavingGroup(true);
    try {
      await axiosInstance.delete(`/groups/${group.id}`);
      setSuccess('Seccion eliminada.');
      if (groupForm.id === group.id) {
        setGroupForm(emptyGroupForm);
      }
      await loadGradeData(false);
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo eliminar la seccion.');
    } finally {
      setSavingGroup(false);
    }
  };

  const handleOpenGroupSubjects = (group) => {
    setSelectedGroupId(String(group.id));
    setActiveTab(1);
    setSuccess(`Seccion "${group.name}" seleccionada. Ahora estas viendo su rama por meses, planificacion y actividades.`);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return <LoadingSpinner message="Cargando estructura del grado..." />;
  }

  return (
    <Box sx={{ background: '#f5f7fa', minHeight: '100vh' }}>
      <Box
        sx={{
          background: colorSet.bg,
          py: 6,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 250,
            height: 250,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -60,
            left: -20,
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Breadcrumbs sx={{ mb: 2 }} separator=">">
            <Link
              component="button"
              onClick={() => navigate('/dashboard')}
              sx={{
                color: 'rgba(255,255,255,0.75)',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                fontSize: '0.9rem',
                '&:hover': { color: '#fff' },
              }}
            >
              <Home sx={{ fontSize: '1rem' }} /> Dashboard
            </Link>
            <Link
              component="button"
              onClick={() => navigate('/grades')}
              sx={{
                color: 'rgba(255,255,255,0.75)',
                textDecoration: 'none',
                fontSize: '0.9rem',
                '&:hover': { color: '#fff' },
              }}
            >
              Grados
            </Link>
            <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
              {grade?.name || `Grado ${gradeId}`}
            </Typography>
          </Breadcrumbs>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                width: 84,
                height: 84,
                border: '2px solid rgba(255,255,255,0.15)',
              }}
            >
              <School sx={{ color: '#fff', fontSize: '2.8rem' }} />
            </Avatar>
            <Box>
              <Typography variant="h3" fontWeight={800} sx={{ color: '#fff', lineHeight: 1 }}>
                {grade?.name || `${gradeId} Grado`}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.5, fontSize: '1.1rem' }}>
                {grade?.description || 'Primero gestiona secciones y luego continua con la rama por meses, planificacion y actividades.'}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
                <Chip
                  label={`${groups.length} seccion${groups.length !== 1 ? 'es' : ''}`}
                  sx={{
                    background: 'rgba(255,255,255,0.22)',
                    color: '#fff',
                    fontWeight: 700,
                  }}
                />
                <Chip
                  label={`${subjects.length} materia${subjects.length !== 1 ? 's' : ''}`}
                  sx={{
                    background: 'rgba(255,255,255,0.22)',
                    color: '#fff',
                    fontWeight: 700,
                  }}
                />
                {canManageGroups && (
                  <Chip
                    label="Gestion habilitada"
                    sx={{
                      background: 'rgba(255,255,255,0.15)',
                      color: '#fff',
                      fontWeight: 700,
                    }}
                  />
                )}
              </Stack>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 5 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Paper
          sx={{
            borderRadius: '24px',
            boxShadow: '0 10px 32px rgba(15, 23, 42, 0.08)',
            overflow: 'hidden',
          }}
        >
          <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} sx={{ px: 2, pt: 1.5 }}>
            <Tab label={`Secciones (${groups.length})`} />
            <Tab
              label={
                selectedGroup
                  ? `Rama de ${selectedGroup.name}`
                  : 'Rama de la seccion'
              }
              disabled={!selectedGroup}
            />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {activeTab === 0 && (
              <>
                <Typography variant="h5" fontWeight={800} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Groups color="primary" /> Secciones del grado
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  La rama academica ahora baja asi: Grado, Seccion, Mes, Planificacion y Actividades. Dentro de Actividades se organizan Semanas y, dentro de cada semana, los cursos.
                </Typography>

                <Paper sx={{ p: 2.5, borderRadius: '20px', border: '1px solid #edf2f7', boxShadow: 'none', mb: 3 }}>
                  <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2 }}>
                    Filtros de secciones
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={isAdmin ? 4 : 7}>
                      <TextField
                        fullWidth
                        label="Buscar seccion"
                        placeholder="Nombre, descripcion o docente"
                        value={groupSearch}
                        onChange={(event) => setGroupSearch(event.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} md={isAdmin ? 3 : 3}>
                      <FormControl fullWidth>
                        <InputLabel>Estado</InputLabel>
                        <Select value={groupStatusFilter} label="Estado" onChange={(event) => setGroupStatusFilter(event.target.value)}>
                          <MenuItem value="all">Todos</MenuItem>
                          <MenuItem value="active">Activos</MenuItem>
                          <MenuItem value="inactive">Inactivos</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    {isAdmin && (
                      <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                          <InputLabel>Docente</InputLabel>
                          <Select value={groupTeacherFilter} label="Docente" onChange={(event) => setGroupTeacherFilter(event.target.value)}>
                            <MenuItem value="all">Todos</MenuItem>
                            <MenuItem value="">Sin docente</MenuItem>
                            {teachers.map((teacher) => (
                              <MenuItem key={teacher.id} value={teacher.id}>
                                {teacher.full_name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    )}
                    <Grid item xs={12} md={2}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => {
                          setGroupSearch('');
                          setGroupStatusFilter('all');
                          setGroupTeacherFilter('all');
                        }}
                        sx={{ height: '100%' }}
                      >
                        Limpiar filtros
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>

                {canManageGroups && (
                  <Paper sx={{ p: 2.5, borderRadius: '20px', border: '1px solid #edf2f7', boxShadow: 'none', mb: 3 }}>
                    <Stack
                      direction={{ xs: 'column', md: 'row' }}
                      justifyContent="space-between"
                      alignItems={{ xs: 'flex-start', md: 'center' }}
                      spacing={1}
                      sx={{ mb: 2 }}
                    >
                      <Box>
                        <Typography variant="subtitle1" fontWeight={800}>
                          {groupForm.id ? `Editar seccion: ${groupForm.name || 'sin nombre'}` : 'Nueva seccion'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Crea o actualiza la seccion y luego entra a su rama por meses y actividades.
                        </Typography>
                      </Box>
                      {groupForm.id && (
                        <Chip
                          label={groupForm.is_active ? 'Activa' : 'Inactiva'}
                          color={groupForm.is_active ? 'success' : 'default'}
                          sx={{ fontWeight: 700 }}
                        />
                      )}
                    </Stack>

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          label="Nombre de la seccion"
                          placeholder="Ejemplo: Seccion A"
                          value={groupForm.name}
                          onChange={(event) => setGroupForm((current) => ({ ...current, name: event.target.value }))}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Descripcion"
                          placeholder="Turno, aula o detalle adicional"
                          value={groupForm.description}
                          onChange={(event) => setGroupForm((current) => ({ ...current, description: event.target.value }))}
                        />
                      </Grid>
                      <Grid item xs={12} md={2}>
                        {isAdmin ? (
                          <FormControl fullWidth>
                            <InputLabel>Docente</InputLabel>
                            <Select
                              value={groupForm.teacher_id}
                              label="Docente"
                              onChange={(event) => setGroupForm((current) => ({ ...current, teacher_id: event.target.value }))}
                            >
                              <MenuItem value="">Sin docente</MenuItem>
                              {teachers.map((teacher) => (
                                <MenuItem key={teacher.id} value={teacher.id}>
                                  {teacher.full_name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        ) : (
                          <TextField fullWidth label="Docente" value={user?.full_name || ''} disabled />
                        )}
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                          <InputLabel>Estado de la seccion</InputLabel>
                          <Select
                            value={groupForm.is_active ? 'active' : 'inactive'}
                            label="Estado de la seccion"
                            onChange={(event) =>
                              setGroupForm((current) => ({
                                ...current,
                                is_active: event.target.value === 'active',
                              }))
                            }
                          >
                            <MenuItem value="active">Activa</MenuItem>
                            <MenuItem value="inactive">Inactiva</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12}>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                          <Button
                            variant="contained"
                            startIcon={groupForm.id ? <Save /> : <Add />}
                            onClick={handleSaveGroup}
                            disabled={savingGroup || !groupForm.name.trim()}
                          >
                            {groupForm.id ? 'Actualizar seccion' : 'Agregar seccion'}
                          </Button>
                          {groupForm.id && (
                            <Button
                              variant="outlined"
                              color="inherit"
                              startIcon={<Clear />}
                              onClick={() => setGroupForm(emptyGroupForm)}
                              disabled={savingGroup}
                            >
                              Cancelar edicion
                            </Button>
                          )}
                        </Stack>
                      </Grid>
                    </Grid>
                  </Paper>
                )}

                {filteredGroups.length === 0 ? (
                  <Paper sx={{ p: 5, textAlign: 'center', borderRadius: '20px', bgcolor: '#fafbfc' }}>
                    <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                      {groups.length === 0 ? 'No hay secciones aun' : 'No hay secciones para ese filtro'}
                    </Typography>
                    <Typography color="text.secondary">
                      {groups.length === 0
                        ? canManageGroups
                          ? 'Crea la primera seccion del grado desde el formulario superior.'
                          : 'Aun no hay secciones registradas para este grado.'
                        : 'Prueba con otro filtro o limpia la busqueda actual.'}
                    </Typography>
                  </Paper>
                ) : (
                  <TableContainer component={Paper} sx={{ borderRadius: '20px', boxShadow: 'none', border: '1px solid #edf2f7' }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Seccion</TableCell>
                          <TableCell>Docente</TableCell>
                          <TableCell>Estado</TableCell>
                          <TableCell align="right">Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredGroups.map((group) => {
                          const teacherName =
                            group.teacher?.full_name ||
                            teachersById[group.teacher_id]?.full_name ||
                            (group.teacher_id === user?.id ? user.full_name : 'Sin docente');

                          return (
                            <TableRow key={group.id} hover>
                              <TableCell>
                                <Typography fontWeight={800}>{group.name}</Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {group.description || 'Sin descripcion'}
                                </Typography>
                              </TableCell>
                              <TableCell>{teacherName}</TableCell>
                              <TableCell>
                                <Chip
                                  label={group.is_active ? 'Activa' : 'Inactiva'}
                                  size="small"
                                  sx={
                                    group.is_active
                                      ? { bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 800 }
                                      : { bgcolor: '#eceff1', color: '#546e7a', fontWeight: 800 }
                                  }
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Button
                                  size="small"
                                  startIcon={<AccountTree />}
                                  onClick={() => handleOpenGroupSubjects(group)}
                                >
                                  Abrir rama
                                </Button>
                                {canManageGroups && (
                                  <>
                                    <Button
                                      size="small"
                                      startIcon={<Edit />}
                                      onClick={() => {
                                        setGroupForm({
                                          id: group.id,
                                          name: group.name,
                                          description: group.description || '',
                                          teacher_id: group.teacher_id || '',
                                          is_active: group.is_active !== false,
                                        });
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                      }}
                                    >
                                      Editar
                                    </Button>
                                    <Button size="small" color="error" startIcon={<Delete />} onClick={() => handleDeleteGroup(group)}>
                                      Eliminar
                                    </Button>
                                  </>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </>
            )}

            {activeTab === 1 && (
              <>
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={1.5}
                  justifyContent="space-between"
                  alignItems={{ xs: 'flex-start', md: 'center' }}
                  sx={{ mb: 3 }}
                >
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {selectedGroup ? `Rama academica de ${selectedGroup.name}` : 'Rama de la seccion'}
                    </Typography>
                    <Typography color="text.secondary">
                      {selectedGroup
                        ? `Estas dentro de la ruta ${grade?.name || `Grado ${gradeId}`} > ${selectedGroup.name} > Mes > Planificacion y Actividades > Semanas > Cursos.`
                        : 'Primero selecciona una seccion para ver su rama academica.'}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {selectedGroup && (
                      <Chip
                        label={`Seccion activa: ${selectedGroup.name}`}
                        color="primary"
                        sx={{ fontWeight: 700 }}
                      />
                    )}
                    <Button variant="outlined" onClick={() => setActiveTab(0)}>
                      Volver a secciones
                    </Button>
                  </Stack>
                </Stack>

                {!selectedGroup && groups.length > 0 && (
                  <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '20px', mb: 3, bgcolor: '#fafbfc' }}>
                    <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                      Primero elige una seccion
                    </Typography>
                    <Typography color="text.secondary" sx={{ mb: 2 }}>
                      Usa "Abrir rama" en la pestana de secciones para entrar por Mes y luego bajar a Planificacion, Actividades, Semanas y Cursos.
                    </Typography>
                    <Button variant="contained" onClick={() => setActiveTab(0)}>
                      Ir a secciones
                    </Button>
                  </Paper>
                )}

                {(selectedGroup || groups.length === 0) && (
                  <>
                    {selectedGroup && (
                      <>
                        <Paper
                          sx={{
                            p: 2.5,
                            borderRadius: '20px',
                            border: '1px solid #edf2f7',
                            boxShadow: 'none',
                            mb: 3,
                            background: 'linear-gradient(135deg, #f8fbff 0%, #f3f8ff 100%)',
                          }}
                        >
                          <Stack
                            direction={{ xs: 'column', md: 'row' }}
                            spacing={2}
                            justifyContent="space-between"
                            alignItems={{ xs: 'flex-start', md: 'center' }}
                          >
                            <Box>
                              <Typography variant="h6" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CalendarMonth color="primary" /> Meses de la seccion
                              </Typography>
                              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                                Entra primero al mes. Dentro del mes veras la planificacion publicada y la rama de actividades por semanas y cursos.
                              </Typography>
                            </Box>
                            <Chip
                              label={`${MONTH_BRANCH_OPTIONS.length} meses disponibles`}
                              sx={{ fontWeight: 700, bgcolor: '#e3f2fd', color: '#1565c0' }}
                            />
                          </Stack>
                        </Paper>

                        <Grid container spacing={2.2} sx={{ mb: 4 }}>
                          {MONTH_BRANCH_OPTIONS.map((monthItem) => (
                            <Grid item xs={12} sm={6} md={4} lg={3} key={monthItem.number}>
                              <Card
                                sx={{
                                  height: '100%',
                                  borderRadius: '22px',
                                  border: `1px solid ${monthItem.accent}33`,
                                  boxShadow: '0 10px 28px rgba(15, 23, 42, 0.06)',
                                }}
                              >
                                <CardContent sx={{ p: 2.5 }}>
                                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
                                    <Box>
                                      <Chip
                                        label={`Mes ${monthItem.number}`}
                                        size="small"
                                        sx={{
                                          mb: 1.2,
                                          bgcolor: `${monthItem.accent}18`,
                                          color: monthItem.accent,
                                          fontWeight: 800,
                                        }}
                                      />
                                      <Typography variant="h6" fontWeight={800}>
                                        {monthItem.name}
                                      </Typography>
                                    </Box>
                                    <Avatar
                                      sx={{
                                        width: 46,
                                        height: 46,
                                        bgcolor: `${monthItem.accent}15`,
                                        color: monthItem.accent,
                                        border: `1px solid ${monthItem.accent}33`,
                                      }}
                                    >
                                      <CalendarMonth />
                                    </Avatar>
                                  </Stack>

                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1.2, minHeight: 56 }}>
                                    Abre este mes para revisar planificacion por seccion y bajar despues a actividades, semanas y cursos.
                                  </Typography>

                                  <Stack direction="row" spacing={1} sx={{ mt: 2.2 }}>
                                    <Button
                                      fullWidth
                                      variant="outlined"
                                      startIcon={<MenuBook />}
                                      onClick={() => navigate(`/grades/${gradeId}/sections/${selectedGroup.id}/month/${monthItem.number}?view=planning`)}
                                    >
                                      Planificacion
                                    </Button>
                                    <Button
                                      fullWidth
                                      variant="contained"
                                      startIcon={<ArrowForward />}
                                      onClick={() => navigate(`/grades/${gradeId}/sections/${selectedGroup.id}/month/${monthItem.number}?view=activities`)}
                                      sx={{ bgcolor: monthItem.accent, '&:hover': { bgcolor: monthItem.accent } }}
                                    >
                                      Actividades
                                    </Button>
                                  </Stack>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      </>
                    )}

                    <Paper sx={{ p: 2.5, borderRadius: '20px', border: '1px solid #edf2f7', boxShadow: 'none', mb: 3 }}>
                      <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 0.5 }}>
                        Cursos base del grado
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Estos cursos aparecen dentro de cada semana en la rama de actividades. Desde aqui el admin tambien puede seguir creandolos o editandolos.
                      </Typography>
                    </Paper>

                    <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
                      <Grid item xs={12} md={isAdmin ? 4 : 12}>
                        <TextField
                          fullWidth
                          label="Buscar curso"
                          placeholder="Escribe una materia o curso"
                          value={subjectSearch}
                          onChange={(event) => setSubjectSearch(event.target.value)}
                        />
                      </Grid>

                      {isAdmin && (
                        <>
                          <Grid item xs={12} md={5}>
                            <TextField
                              fullWidth
                              label={subjectForm.id ? 'Editar curso' : 'Nuevo curso'}
                              placeholder="Ejemplo: Matematica"
                              value={subjectForm.name}
                              onChange={(event) => setSubjectForm((current) => ({ ...current, name: event.target.value }))}
                            />
                          </Grid>
                          <Grid item xs={12} md={3}>
                            <Stack direction="row" spacing={1}>
                              <Button
                                fullWidth
                                variant="contained"
                                startIcon={subjectForm.id ? <Save /> : <Add />}
                                onClick={handleSaveSubject}
                                disabled={savingSubject || !subjectForm.name.trim()}
                              >
                                {subjectForm.id ? 'Actualizar' : 'Agregar'}
                              </Button>
                              {subjectForm.id && (
                                <Button
                                  variant="outlined"
                                  color="inherit"
                                  startIcon={<Clear />}
                                  onClick={() => setSubjectForm(emptySubjectForm)}
                                  disabled={savingSubject}
                                >
                                  Cancelar
                                </Button>
                              )}
                            </Stack>
                          </Grid>
                        </>
                      )}
                    </Grid>

                    {filteredSubjects.length === 0 ? (
                      <Paper sx={{ p: 5, textAlign: 'center', borderRadius: '24px' }}>
                        <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
                          {subjects.length === 0 ? 'No hay cursos aun' : 'No hay resultados para ese filtro'}
                        </Typography>
                        <Typography color="text.secondary">
                          {subjects.length === 0
                            ? isAdmin
                              ? 'Usa el panel superior para crear el primer curso de este grado.'
                              : 'Los cursos para este grado se anadiran pronto.'
                            : 'Prueba con otra busqueda o limpia el filtro actual.'}
                        </Typography>
                      </Paper>
                    ) : (
                      <Grid container spacing={3}>
                        {filteredSubjects.map((subject, index) => {
                          const color = subjectColors[index % subjectColors.length];
                          return (
                            <Grid item xs={12} sm={6} md={4} key={subject.id}>
                              <Card
                                onClick={() => {
                                  if (!selectedGroup) {
                                    navigate(`/subjects/${subject.id}`);
                                    return;
                                  }

                                  const params = new URLSearchParams({
                                    group_id: String(selectedGroup.id),
                                    group_name: selectedGroup.name,
                                  });

                                  navigate(`/subjects/${subject.id}?${params.toString()}`);
                                }}
                                sx={{
                                  cursor: 'pointer',
                                  border: `3px solid ${color}22`,
                                  borderRadius: '24px',
                                  height: '100%',
                                  transition: 'transform 0.25s ease, border-color 0.25s ease',
                                  '&:hover': {
                                    border: `3px solid ${color}66`,
                                    transform: 'translateY(-6px)',
                                  },
                                }}
                              >
                                <CardContent sx={{ p: 3 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, mb: 2 }}>
                                    <Avatar
                                      sx={{
                                        bgcolor: `${color}18`,
                                        color,
                                        width: 58,
                                        height: 58,
                                        border: `2px solid ${color}2f`,
                                        fontWeight: 900,
                                      }}
                                    >
                                      {subject.name?.charAt(0)?.toUpperCase() || 'M'}
                                    </Avatar>

                                    {isAdmin && (
                                      <Stack direction="row" spacing={1}>
                                        <Button
                                          size="small"
                                          startIcon={<Edit />}
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            setSubjectForm({ id: subject.id, name: subject.name });
                                            setActiveTab(1);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                          }}
                                        >
                                          Editar
                                        </Button>
                                        <Button
                                          size="small"
                                          color="error"
                                          startIcon={<Delete />}
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            handleDeleteSubject(subject);
                                          }}
                                        >
                                          Eliminar
                                        </Button>
                                      </Stack>
                                    )}
                                  </Box>

                                  <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2, mb: 0.8 }}>
                                    {subject.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ minHeight: 42 }}>
                                    {selectedGroup
                                      ? `Curso base del grado. Tambien aparecera dentro de las semanas de ${selectedGroup.name} en la rama de actividades.`
                                      : 'Acceso directo al curso y a sus meses.'}
                                  </Typography>

                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1,
                                      p: 1.5,
                                      background: `${color}11`,
                                      borderRadius: '12px',
                                      mt: 2,
                                    }}
                                  >
                                    <Typography variant="body2" fontWeight={700} sx={{ color, flexGrow: 1 }}>
                                      Acceso directo al curso
                                    </Typography>
                                    <ArrowForward sx={{ color, fontSize: '1rem' }} />
                                  </Box>
                                </CardContent>
                              </Card>
                            </Grid>
                          );
                        })}
                      </Grid>
                    )}
                  </>
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

export default GradeDetailPage;
