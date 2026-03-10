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
  Link,
  MenuItem,
  Paper,
  Select,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Add,
  Close,
  Delete,
  Edit,
  Home,
  Login,
  People,
  Save,
  Search,
  SwapHoriz,
  Wifi,
  WifiOff,
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

import axiosInstance from '../../api/axios';
import Footer from '../../components/Layout/Footer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useAuth } from '../../context/AuthContext';

const roleColors = {
  admin: { bg: '#f3e5f5', color: '#9c27b0', label: 'Admin' },
  docente: { bg: '#e3f2fd', color: '#1976d2', label: 'Docente' },
  estudiante: { bg: '#e8f5e9', color: '#4caf50', label: 'Estudiante' },
};

const getConnectionChipStyle = (isOnline) => ({
  bgcolor: isOnline ? '#e8f5e9' : '#eceff1',
  color: isOnline ? '#2e7d32' : '#546e7a',
  fontWeight: 700,
  fontSize: '0.72rem',
});

const defaultForm = {
  full_name: '',
  email: '',
  role: 'estudiante',
  password: '',
  is_active: true,
};

const getTabFromPath = (pathname = '') => (pathname.startsWith('/admin/mirrors') ? 1 : 0);

const ManageUsers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser, beginImpersonation } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [activeTab, setActiveTab] = useState(() => getTabFromPath(location.pathname));
  const [searchQuery, setSearchQuery] = useState('');

  const [presenceLoading, setPresenceLoading] = useState(false);
  const [presenceByUserId, setPresenceByUserId] = useState({});
  const [lastPresenceSync, setLastPresenceSync] = useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [impersonatingUserId, setImpersonatingUserId] = useState(null);

  const [form, setForm] = useState(defaultForm);

  const getDisplayName = useCallback((u) => {
    if (u?.full_name) return u.full_name;
    if (u?.first_name || u?.last_name) return `${u.first_name || ''} ${u.last_name || ''}`.trim();
    if (u?.username) return u.username;
    return u?.email || 'Sin nombre';
  }, []);

  const getPresence = useCallback(
    (userId) => presenceByUserId[userId] || { is_online: false, last_seen: null },
    [presenceByUserId]
  );

  const getPresenceText = useCallback((presenceData) => {
    if (!presenceData?.last_seen) return 'Sin actividad reciente';
    const lastSeenDate = new Date(presenceData.last_seen);
    if (Number.isNaN(lastSeenDate.getTime())) return 'Sin actividad reciente';

    const now = new Date();
    const sameDay = now.toDateString() === lastSeenDate.toDateString();
    const time = lastSeenDate.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    if (sameDay) return `Ult. actividad ${time}`;

    const date = lastSeenDate.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
    return `Ult. actividad ${date} ${time}`;
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/users/');
      setUsers(response.data?.results || response.data || []);
    } catch (err) {
      setError('Error al cargar usuarios.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPresence = useCallback(async (usersList, options = {}) => {
    const { silent = false } = options;
    const ids = (usersList || [])
      .map((u) => u?.id)
      .filter((id) => Number.isInteger(id));

    if (ids.length === 0) {
      setPresenceByUserId({});
      setLastPresenceSync(new Date());
      return;
    }

    if (!silent) setPresenceLoading(true);
    try {
      const response = await axiosInstance.get('/auth/presence', {
        params: { user_ids: ids.join(',') },
      });
      const items = response.data?.items || [];
      const nextMap = {};
      items.forEach((item) => {
        nextMap[item.user_id] = item;
      });
      setPresenceByUserId(nextMap);
      setLastPresenceSync(new Date());
    } catch (err) {
      if (!silent) {
        setError('No se pudo actualizar el estado en linea.');
      }
    } finally {
      if (!silent) setPresenceLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  useEffect(() => {
    if (!users.length) return undefined;

    fetchPresence(users);
    const interval = setInterval(() => fetchPresence(users, { silent: true }), 15000);
    return () => clearInterval(interval);
  }, [users, fetchPresence]);

  const handleTabChange = (_, value) => {
    setActiveTab(value);
    const nextPath = value === 1 ? '/admin/mirrors' : '/admin/users';
    if (location.pathname !== nextPath) {
      navigate(nextPath, { replace: true });
    }
  };

  const openCreateDialog = () => {
    setSelectedUser(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEditDialog = (user) => {
    setSelectedUser(user);
    setForm({
      full_name: user.full_name || getDisplayName(user),
      email: user.email || '',
      role: user.role || 'estudiante',
      password: '',
      is_active: user.is_active !== false,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        full_name: form.full_name,
        email: form.email,
        role: form.role,
        is_active: form.is_active,
      };
      if (form.password) payload.password = form.password;

      if (selectedUser) {
        await axiosInstance.put(`/users/${selectedUser.id}`, payload);
        setSuccess('Usuario actualizado correctamente.');
      } else {
        if (!form.password) {
          setError('La contrasena es obligatoria para un usuario nuevo.');
          setSaving(false);
          return;
        }
        await axiosInstance.post('/users/', payload);
        setSuccess('Usuario creado correctamente.');
      }

      setDialogOpen(false);
      await fetchUsers();
    } catch (err) {
      const errData = err.response?.data;
      let msg = 'Error al guardar usuario.';

      if (errData?.detail) {
        msg = errData.detail;
      } else if (typeof errData === 'object' && errData !== null) {
        const firstKey = Object.keys(errData)[0];
        const firstValue = errData[firstKey];
        msg = Array.isArray(firstValue) ? firstValue[0] : String(firstValue);
      }
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await axiosInstance.delete(`/users/${selectedUser.id}`);
      setSuccess('Usuario eliminado.');
      setDeleteDialogOpen(false);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al eliminar usuario.');
    } finally {
      setSaving(false);
    }
  };

  const handleImpersonate = async (targetUser) => {
    setError('');
    setSuccess('');
    setImpersonatingUserId(targetUser.id);

    const result = await beginImpersonation(targetUser.id);
    if (result.success) {
      const targetName = getDisplayName(targetUser);
      setSuccess(`Ahora estas impersonando a ${targetName}.`);
      navigate('/dashboard');
    } else {
      setError(result.error || 'No se pudo impersonar el usuario.');
    }

    setImpersonatingUserId(null);
  };

  const filteredUsers = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();
    if (!term) return users;

    return users.filter((u) => {
      const roleLabel = roleColors[u.role]?.label || u.role || '';
      return (
        getDisplayName(u).toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term) ||
        roleLabel.toLowerCase().includes(term)
      );
    });
  }, [users, searchQuery, getDisplayName]);

  const mirrorGroups = useMemo(() => {
    const grouped = { admin: [], docente: [], estudiante: [] };
    filteredUsers.forEach((profile) => {
      const role = profile.role || 'estudiante';
      if (!grouped[role]) grouped[role] = [];
      grouped[role].push(profile);
    });
    return grouped;
  }, [filteredUsers]);

  const onlineCount = useMemo(
    () => filteredUsers.filter((profile) => getPresence(profile.id).is_online).length,
    [filteredUsers, getPresence]
  );

  if (loading) return <LoadingSpinner message="Cargando usuarios..." />;

  return (
    <Box sx={{ background: '#f5f7fa', minHeight: '100vh' }}>
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          py: 5,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Breadcrumbs sx={{ mb: 2 }} separator="›">
            <Link
              component="button"
              onClick={() => navigate('/dashboard')}
              sx={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.9rem', '&:hover': { color: '#fff' } }}
            >
              <Home sx={{ fontSize: '1rem', mr: 0.3, verticalAlign: 'middle' }} /> Dashboard
            </Link>
            <Link
              component="button"
              onClick={() => navigate('/admin')}
              sx={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.9rem', '&:hover': { color: '#fff' } }}
            >
              Admin
            </Link>
            <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{activeTab === 1 ? 'Espejos' : 'Usuarios'}</Typography>
          </Breadcrumbs>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ background: 'rgba(255,255,255,0.25)', borderRadius: '16px', p: 1.5, display: 'flex' }}>
                <People sx={{ color: '#fff', fontSize: '2.5rem' }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#fff' }}>
                  Gestion de Usuarios
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  {users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}
                </Typography>
              </Box>
            </Box>

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={openCreateDialog}
              sx={{ background: '#ff9800', '&:hover': { background: '#f57c00' } }}
            >
              Nuevo Usuario
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
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

        <Paper sx={{ borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', mb: 2 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            sx={{ px: 1.5, pt: 1.5, '& .MuiTabs-indicator': { height: 3, borderRadius: 999 } }}
          >
            <Tab icon={<People fontSize="small" />} iconPosition="start" label="Usuarios" />
            <Tab icon={<SwapHoriz fontSize="small" />} iconPosition="start" label="Espejos" />
          </Tabs>
        </Paper>

        <Paper sx={{ p: 2.5, borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Buscar por nombre, rol o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
          />

          <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
            <Chip
              icon={presenceLoading ? <CircularProgress size={14} /> : <Wifi fontSize="small" />}
              label={`${onlineCount}/${filteredUsers.length} en linea`}
              size="small"
              sx={getConnectionChipStyle(true)}
            />
            <Chip
              icon={<WifiOff fontSize="small" />}
              label={`${Math.max(filteredUsers.length - onlineCount, 0)} fuera de linea`}
              size="small"
              sx={getConnectionChipStyle(false)}
            />
            {lastPresenceSync && (
              <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                Actualizado: {lastPresenceSync.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </Typography>
            )}
          </Box>
        </Paper>

        {activeTab === 0 && (
          <Paper sx={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: '#f5f7fa' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Usuario</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Rol</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Cuenta</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Conexion</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 5 }}>
                        <Typography sx={{ fontSize: '2rem', mb: 1 }}>??</Typography>
                        <Typography color="text.secondary">
                          {searchQuery ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((profile) => {
                      const roleInfo = roleColors[profile.role] || roleColors.estudiante;
                      const displayName = getDisplayName(profile);
                      const avatarLetter = (displayName || 'U')[0]?.toUpperCase();
                      const presenceData = getPresence(profile.id);
                      const isOnline = !!presenceData.is_online;

                      return (
                        <TableRow key={profile.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar
                                sx={{
                                  bgcolor: roleInfo.color,
                                  width: 36,
                                  height: 36,
                                  fontSize: '0.9rem',
                                  fontWeight: 700,
                                }}
                              >
                                {avatarLetter}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>{displayName}</Typography>
                                <Typography variant="caption" color="text.secondary">{profile.email}</Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{profile.email || '—'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={roleInfo.label}
                              size="small"
                              sx={{
                                bgcolor: roleInfo.bg,
                                color: roleInfo.color,
                                fontWeight: 700,
                                fontSize: '0.7rem',
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={profile.is_active !== false ? 'Activo' : 'Inactivo'}
                              size="small"
                              sx={{
                                bgcolor: profile.is_active !== false ? '#e8f5e9' : '#fce4ec',
                                color: profile.is_active !== false ? '#4caf50' : '#e91e63',
                                fontWeight: 700,
                                fontSize: '0.7rem',
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Tooltip title={getPresenceText(presenceData)}>
                              <Chip
                                icon={isOnline ? <Wifi fontSize="small" /> : <WifiOff fontSize="small" />}
                                label={isOnline ? 'Online' : 'Offline'}
                                size="small"
                                sx={getConnectionChipStyle(isOnline)}
                              />
                            </Tooltip>
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                              <Tooltip title="Entrar al perfil (impersonar)">
                                <span>
                                  <IconButton
                                    size="small"
                                    disabled={
                                      profile.id === currentUser?.id ||
                                      profile.is_active === false ||
                                      impersonatingUserId === profile.id
                                    }
                                    onClick={() => handleImpersonate(profile)}
                                    sx={{ color: '#5e35b1', bgcolor: '#ede7f6', '&:hover': { bgcolor: '#d1c4e9' } }}
                                  >
                                    {impersonatingUserId === profile.id ? <CircularProgress size={14} /> : <Login fontSize="small" />}
                                  </IconButton>
                                </span>
                              </Tooltip>
                              <Tooltip title="Editar">
                                <IconButton
                                  size="small"
                                  onClick={() => openEditDialog(profile)}
                                  sx={{ color: '#1976d2', bgcolor: '#e3f2fd', '&:hover': { bgcolor: '#bbdefb' } }}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Eliminar">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedUser(profile);
                                    setDeleteDialogOpen(true);
                                  }}
                                  sx={{ color: '#e91e63', bgcolor: '#fce4ec', '&:hover': { bgcolor: '#f8bbd9' } }}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {activeTab === 1 && (
          <Paper sx={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
            <Box sx={{ p: 2.5, borderBottom: '1px solid #eef1f5' }}>
              <Typography variant="h6" fontWeight={800}>Espejos por Rol</Typography>
              <Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
                Perfiles por rol con estado online/offline en tiempo real e ingreso directo al perfil.
              </Typography>
            </Box>

            <Box sx={{ p: 2.5 }}>
              {['admin', 'docente', 'estudiante'].map((roleKey) => {
                const roleInfo = roleColors[roleKey] || roleColors.estudiante;
                const roleProfiles = mirrorGroups[roleKey] || [];

                return (
                  <Box key={roleKey} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.2 }}>
                      <Chip
                        label={`${roleInfo.label} (${roleProfiles.length})`}
                        size="small"
                        sx={{ bgcolor: roleInfo.bg, color: roleInfo.color, fontWeight: 700 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {roleProfiles.filter((profile) => getPresence(profile.id).is_online).length} online
                      </Typography>
                    </Box>

                    {roleProfiles.length === 0 ? (
                      <Paper variant="outlined" sx={{ p: 2, borderStyle: 'dashed', borderRadius: '12px' }}>
                        <Typography variant="body2" color="text.secondary">
                          No hay perfiles para este rol con el filtro actual.
                        </Typography>
                      </Paper>
                    ) : (
                      <Grid container spacing={2}>
                        {roleProfiles.map((profile) => {
                          const displayName = getDisplayName(profile);
                          const avatarLetter = (displayName || 'U')[0]?.toUpperCase();
                          const presenceData = getPresence(profile.id);
                          const isOnline = !!presenceData.is_online;

                          return (
                            <Grid item xs={12} sm={6} md={4} key={profile.id}>
                              <Card variant="outlined" sx={{ borderRadius: '14px', height: '100%' }}>
                                <CardContent sx={{ p: 2 }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Avatar sx={{ bgcolor: roleInfo.color, width: 34, height: 34, fontWeight: 700 }}>
                                      {avatarLetter}
                                    </Avatar>
                                    <Chip
                                      icon={isOnline ? <Wifi fontSize="small" /> : <WifiOff fontSize="small" />}
                                      label={isOnline ? 'Online' : 'Offline'}
                                      size="small"
                                      sx={getConnectionChipStyle(isOnline)}
                                    />
                                  </Box>

                                  <Typography fontWeight={700} sx={{ lineHeight: 1.2 }}>{displayName}</Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
                                    {profile.email}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.8 }}>
                                    {getPresenceText(presenceData)}
                                  </Typography>

                                  <Divider sx={{ my: 1.2 }} />

                                  <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mb: 1.2 }}>
                                    <Chip
                                      label={roleInfo.label}
                                      size="small"
                                      sx={{ bgcolor: roleInfo.bg, color: roleInfo.color, fontWeight: 700, fontSize: '0.7rem' }}
                                    />
                                    <Chip
                                      label={profile.is_active !== false ? 'Activo' : 'Inactivo'}
                                      size="small"
                                      sx={{
                                        bgcolor: profile.is_active !== false ? '#e8f5e9' : '#fce4ec',
                                        color: profile.is_active !== false ? '#4caf50' : '#e91e63',
                                        fontWeight: 700,
                                        fontSize: '0.7rem',
                                      }}
                                    />
                                  </Box>

                                  <Button
                                    fullWidth
                                    variant="contained"
                                    size="small"
                                    startIcon={
                                      impersonatingUserId === profile.id
                                        ? <CircularProgress size={14} color="inherit" />
                                        : <Login fontSize="small" />
                                    }
                                    disabled={
                                      profile.id === currentUser?.id ||
                                      profile.is_active === false ||
                                      impersonatingUserId === profile.id
                                    }
                                    onClick={() => handleImpersonate(profile)}
                                    sx={{ background: '#5e35b1', '&:hover': { background: '#4527a0' } }}
                                  >
                                    {impersonatingUserId === profile.id ? 'Ingresando...' : 'Entrar como'}
                                  </Button>
                                </CardContent>
                              </Card>
                            </Grid>
                          );
                        })}
                      </Grid>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Paper>
        )}
      </Container>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" fontWeight={700}>
            {selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
          </Typography>
          <IconButton onClick={() => setDialogOpen(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre completo"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Rol</InputLabel>
                <Select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  label="Rol"
                >
                  <MenuItem value="estudiante">Estudiante</MenuItem>
                  <MenuItem value="docente">Docente</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Estado de cuenta</InputLabel>
                <Select
                  value={form.is_active ? 'active' : 'inactive'}
                  onChange={(e) => setForm({ ...form, is_active: e.target.value === 'active' })}
                  label="Estado de cuenta"
                >
                  <MenuItem value="active">Activo</MenuItem>
                  <MenuItem value="inactive">Inactivo</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label={selectedUser ? 'Nueva contrasena (opcional)' : 'Contrasena'}
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!selectedUser}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setDialogOpen(false)}
            sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : <Save />}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={700}>Confirmar eliminacion</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Estas seguro de eliminar al usuario <strong>{getDisplayName(selectedUser || {})}</strong>? Esta accion no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Delete />}
          >
            {saving ? 'Eliminando...' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Footer />
    </Box>
  );
};

export default ManageUsers;
