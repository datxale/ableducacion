import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Breadcrumbs,
  Link,
  InputAdornment,
  CircularProgress,
  Tooltip,
  Grid,
} from '@mui/material';
import {
  Home,
  AdminPanelSettings,
  Add,
  Edit,
  Delete,
  Search,
  People,
  Close,
  Save,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Footer from '../../components/Layout/Footer';

const roleColors = {
  admin: { bg: '#f3e5f5', color: '#9c27b0', label: 'Admin' },
  docente: { bg: '#e3f2fd', color: '#1976d2', label: 'Docente' },
  estudiante: { bg: '#e8f5e9', color: '#4caf50', label: 'Estudiante' },
};

const ManageUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    role: 'estudiante',
    password: '',
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/users/');
      setUsers(res.data?.results || res.data || []);
    } catch (err) {
      setError('Error al cargar usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreateDialog = () => {
    setSelectedUser(null);
    setForm({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      role: 'estudiante',
      password: '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (user) => {
    setSelectedUser(user);
    setForm({
      username: user.username,
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      role: user.role || 'estudiante',
      password: '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const data = { ...form };
      if (!data.password) delete data.password;

      if (selectedUser) {
        await axiosInstance.patch(`/users/${selectedUser.id}/`, data);
        setSuccess('Usuario actualizado correctamente.');
      } else {
        await axiosInstance.post('/users/', data);
        setSuccess('Usuario creado correctamente.');
      }
      setDialogOpen(false);
      fetchUsers();
    } catch (err) {
      const errData = err.response?.data;
      let msg = 'Error al guardar usuario.';
      if (errData) {
        const firstKey = Object.keys(errData)[0];
        msg = Array.isArray(errData[firstKey]) ? errData[firstKey][0] : errData[firstKey];
      }
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await axiosInstance.delete(`/users/${selectedUser.id}/`);
      setSuccess('Usuario eliminado.');
      setDeleteDialogOpen(false);
      fetchUsers();
    } catch (err) {
      setError('Error al eliminar usuario.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Cargando usuarios..." />;

  const filteredUsers = users.filter(
    (u) =>
      u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>
              Usuarios
            </Typography>
          </Breadcrumbs>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ background: 'rgba(255,255,255,0.25)', borderRadius: '16px', p: 1.5, display: 'flex' }}>
                <People sx={{ color: '#fff', fontSize: '2.5rem' }} />
              </Box>
              <Box>
                <Typography variant="h4" fontWeight={800} sx={{ color: '#fff' }}>
                  Gestión de Usuarios
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
              sx={{
                background: '#ff9800',
                '&:hover': { background: '#f57c00' },
              }}
            >
              Nuevo Usuario
            </Button>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: '12px' }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Paper sx={{ p: 2.5, borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.07)', mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Buscar por nombre, usuario o email..."
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
        </Paper>

        <Paper sx={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ background: '#f5f7fa' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Usuario</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Rol</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 5 }}>
                      <Typography sx={{ fontSize: '2rem', mb: 1 }}>🔍</Typography>
                      <Typography color="text.secondary">
                        {searchQuery ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const roleInfo = roleColors[user.role] || roleColors.estudiante;
                    return (
                      <TableRow
                        key={user.id}
                        hover
                        sx={{ '&:last-child td': { border: 0 } }}
                      >
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
                              {(user.first_name || user.username)?.[0]?.toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={600}>
                                {user.first_name
                                  ? `${user.first_name} ${user.last_name || ''}`
                                  : user.username}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                @{user.username}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{user.email || '—'}</Typography>
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
                            label={user.is_active !== false ? 'Activo' : 'Inactivo'}
                            size="small"
                            sx={{
                              bgcolor: user.is_active !== false ? '#e8f5e9' : '#fce4ec',
                              color: user.is_active !== false ? '#4caf50' : '#e91e63',
                              fontWeight: 700,
                              fontSize: '0.7rem',
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                            <Tooltip title="Editar">
                              <IconButton
                                size="small"
                                onClick={() => openEditDialog(user)}
                                sx={{ color: '#1976d2', bgcolor: '#e3f2fd', '&:hover': { bgcolor: '#bbdefb' } }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar">
                              <IconButton
                                size="small"
                                onClick={() => { setSelectedUser(user); setDeleteDialogOpen(true); }}
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
      </Container>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" fontWeight={700}>
            {selectedUser ? '✏️ Editar Usuario' : '➕ Nuevo Usuario'}
          </Typography>
          <IconButton onClick={() => setDialogOpen(false)} size="small">
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Nombre"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Apellido"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Usuario"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
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
              />
            </Grid>
            <Grid item xs={12}>
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={selectedUser ? 'Nueva contraseña (opcional)' : 'Contraseña'}
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

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={700}>⚠️ Confirmar eliminación</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de eliminar al usuario{' '}
            <strong>
              {selectedUser?.first_name || selectedUser?.username}
            </strong>
            ? Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button variant="outlined" onClick={() => setDeleteDialogOpen(false)} sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}>
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
