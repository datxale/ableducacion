import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import {
  ArrowBack,
  Badge,
  Cake,
  Email,
  Lock,
  MenuBook,
  Person,
  PhoneIphone,
  School,
  Visibility,
  VisibilityOff,
  WorkspacePremium,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import axiosInstance from '../../api/axios';
import WhatsAppFab from '../../components/common/WhatsAppFab';
import { useAuth } from '../../context/AuthContext';

const steps = ['Perfil', 'Datos', 'Acceso'];

const roleCards = [
  {
    value: 'estudiante',
    label: 'Estudiante',
    icon: <School sx={{ fontSize: '2.2rem' }} />,
    color: '#2e7d32',
    background: 'linear-gradient(135deg, rgba(46,125,50,0.14) 0%, rgba(102,187,106,0.08) 100%)',
    description: 'Registro rapido para entrar a clases, actividades y seguimiento.',
    highlights: ['Nombre completo', 'Edad', 'Grado', 'Correo', 'Contrasena'],
  },
  {
    value: 'docente',
    label: 'Docente',
    icon: <WorkspacePremium sx={{ fontSize: '2.2rem' }} />,
    color: '#1565c0',
    background: 'linear-gradient(135deg, rgba(21,101,192,0.14) 0%, rgba(66,165,245,0.08) 100%)',
    description: 'Registro profesional con identidad, fecha de nacimiento y especialidad.',
    highlights: ['Nombre completo', 'Correo', 'Profesiones', 'Nacimiento', 'Documento', 'Celular'],
  },
];

const initialForm = {
  role: 'estudiante',
  full_name: '',
  age: '',
  grade_id: '',
  email: '',
  professions: '',
  birth_date: '',
  document_id: '',
  phone: '',
  password: '',
  confirm_password: '',
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [grades, setGrades] = useState([]);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isTeacher = form.role === 'docente';
  const selectedRole = useMemo(
    () => roleCards.find((item) => item.value === form.role) || roleCards[0],
    [form.role],
  );

  useEffect(() => {
    let active = true;

    const loadGrades = async () => {
      setGradesLoading(true);
      try {
        const response = await axiosInstance.get('/grades/public');
        if (active) {
          setGrades(response.data || []);
        }
      } catch (err) {
        if (active) {
          setError('No se pudo cargar la lista de grados.');
        }
      } finally {
        if (active) {
          setGradesLoading(false);
        }
      }
    };

    loadGrades();
    return () => {
      active = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setError('');
  };

  const handleRoleChange = (role) => {
    setForm((previous) => ({
      ...previous,
      role,
      grade_id: role === 'estudiante' ? previous.grade_id : '',
    }));
    setError('');
  };

  const validateStep = () => {
    if (activeStep === 0) {
      if (!form.role) {
        setError('Selecciona un perfil para continuar.');
        return false;
      }
      return true;
    }

    if (activeStep === 1) {
      if (!form.full_name.trim()) {
        setError('Ingresa el nombre completo.');
        return false;
      }

      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) {
        setError('Ingresa un correo valido.');
        return false;
      }

      if (isTeacher) {
        if (!form.professions.trim()) {
          setError('Ingresa las profesiones o especialidades del docente.');
          return false;
        }

        if (!form.birth_date) {
          setError('Ingresa la fecha de nacimiento del docente.');
          return false;
        }

        if (!form.document_id.trim()) {
          setError('Ingresa el documento de identidad.');
          return false;
        }

        if (!form.phone.trim()) {
          setError('Ingresa el numero de celular.');
          return false;
        }
      } else {
        const parsedAge = Number(form.age);
        if (!Number.isInteger(parsedAge) || parsedAge < 3 || parsedAge > 120) {
          setError('La edad del estudiante debe estar entre 3 y 120.');
          return false;
        }

        if (!form.grade_id) {
          setError('Selecciona el grado del estudiante.');
          return false;
        }
      }
    }

    if (activeStep === 2) {
      if (!form.password || form.password.length < 6) {
        setError('La contrasena debe tener al menos 6 caracteres.');
        return false;
      }

      if (form.password !== form.confirm_password) {
        setError('Las contrasenas no coinciden.');
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setActiveStep((previous) => previous + 1);
  };

  const handleBack = () => {
    setActiveStep((previous) => previous - 1);
    setError('');
  };

  const buildPayload = () => {
    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
    };

    if (isTeacher) {
      payload.professions = form.professions.trim();
      payload.birth_date = form.birth_date;
      payload.document_id = form.document_id.trim();
      payload.phone = form.phone.trim();
    } else {
      payload.age = Number(form.age);
      payload.grade_id = Number(form.grade_id);
    }

    return payload;
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    setLoading(true);
    const result = await register(buildPayload());
    setLoading(false);

    if (result.success) {
      setSuccess(true);
      window.setTimeout(() => navigate('/login'), 2200);
    } else {
      setError(result.error);
    }
  };

  if (success) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f766e 0%, #22c55e 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
        }}
      >
        <Paper sx={{ borderRadius: '28px', px: 5, py: 6, maxWidth: 520, textAlign: 'center' }}>
          <Typography variant="h3" fontWeight={900} sx={{ color: '#0f172a', mb: 1.5 }}>
            Registro completado
          </Typography>
          <Typography sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
            Tu cuenta fue creada correctamente. Te estamos redirigiendo al inicio de sesion.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at top left, rgba(255,255,255,0.14), transparent 22%), linear-gradient(135deg, #081b36 0%, #1565c0 48%, #42a5f5 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        py: { xs: 4, md: 6 },
      }}
    >
      <Box sx={{ position: 'absolute', top: '12%', left: '-3%', width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', filter: 'blur(12px)' }} />
      <Box sx={{ position: 'absolute', bottom: '8%', right: '-4%', width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', filter: 'blur(18px)' }} />

      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/inicio')}
          sx={{
            color: '#fff',
            mb: 2,
            boxShadow: 'none',
            '&:hover': { background: 'rgba(255,255,255,0.08)', transform: 'none', boxShadow: 'none' },
          }}
        >
          Volver al inicio
        </Button>

        <Paper
          elevation={24}
          sx={{
            borderRadius: '30px',
            overflow: 'hidden',
            boxShadow: '0 40px 90px rgba(4, 15, 35, 0.32)',
          }}
        >
          <Box
            sx={{
              px: { xs: 3, md: 4 },
              py: { xs: 3.5, md: 4 },
              background: `linear-gradient(135deg, ${selectedRole.color} 0%, #42a5f5 100%)`,
              color: '#fff',
            }}
          >
            <Box sx={{ display: 'inline-flex', p: 1.8, borderRadius: '22px', background: 'rgba(255,255,255,0.16)', mb: 2 }}>
              <MenuBook sx={{ fontSize: '2.2rem' }} />
            </Box>
            <Typography variant="h4" fontWeight={900}>
              Registro ABL Educacion
            </Typography>
            <Typography sx={{ mt: 1, color: 'rgba(255,255,255,0.9)', maxWidth: 700, lineHeight: 1.7 }}>
              El formulario cambia segun el perfil. Estudiantes registran solo datos esenciales; docentes completan identidad y datos profesionales.
            </Typography>
          </Box>

          <Box sx={{ p: { xs: 3, md: 4 } }}>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: '14px' }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {activeStep === 0 && (
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ textAlign: 'center', mb: 1 }}>
                  Selecciona tu perfil
                </Typography>
                <Typography sx={{ textAlign: 'center', color: 'text.secondary', mb: 3 }}>
                  Cada perfil pide solo los datos que corresponden al tipo de acceso.
                </Typography>

                <Grid container spacing={2.2}>
                  {roleCards.map((role) => {
                    const selected = form.role === role.value;
                    return (
                      <Grid item xs={6} key={role.value}>
                        <Box
                          onClick={() => handleRoleChange(role.value)}
                          sx={{
                            height: '100%',
                            borderRadius: '24px',
                            p: { xs: 2, sm: 3 },
                            cursor: 'pointer',
                            border: `2px solid ${selected ? role.color : 'rgba(15,23,42,0.08)'}`,
                            background: selected ? role.background : '#fff',
                            boxShadow: selected ? `0 18px 38px ${role.color}22` : '0 10px 24px rgba(15,23,42,0.05)',
                            transition: 'all 220ms ease',
                            '&:hover': {
                              borderColor: role.color,
                              transform: 'translateY(-2px)',
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Box sx={{ width: 58, height: 58, borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: role.color, background: '#fff', boxShadow: 'inset 0 0 0 1px rgba(15,23,42,0.06)' }}>
                              {role.icon}
                            </Box>
                            {selected && <Chip label="Seleccionado" size="small" sx={{ background: role.color, color: '#fff', fontWeight: 800 }} />}
                          </Box>
                          <Typography variant="h6" fontWeight={800} sx={{ color: '#0f172a', mb: 1 }}>
                            {role.label}
                          </Typography>
                          <Typography sx={{ color: 'text.secondary', lineHeight: 1.6, mb: 2, fontSize: { xs: '0.92rem', sm: '1rem' } }}>
                            {role.description}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {role.highlights.map((item) => (
                              <Chip key={item} label={item} size="small" sx={{ fontWeight: 700, background: 'rgba(15,23,42,0.05)' }} />
                            ))}
                          </Box>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            )}

            {activeStep === 1 && (
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ textAlign: 'center', mb: 1 }}>
                  {isTeacher ? 'Datos del docente' : 'Datos del estudiante'}
                </Typography>
                <Typography sx={{ textAlign: 'center', color: 'text.secondary', mb: 3 }}>
                  {isTeacher
                    ? 'Completa la informacion profesional y de identidad para validar el acceso docente.'
                    : 'Pedimos nombre completo, edad, grado, correo y luego tu contrasena.'}
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={isTeacher ? 6 : 12}>
                    <TextField
                      fullWidth
                      label="Nombre completo"
                      name="full_name"
                      value={form.full_name}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Person color="primary" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  {!isTeacher && (
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Edad"
                        name="age"
                        type="number"
                        value={form.age}
                        onChange={handleChange}
                        inputProps={{ min: 3, max: 120 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Cake color="primary" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  )}

                  {!isTeacher && (
                    <Grid item xs={12} md={6}>
                      <TextField
                        select
                        fullWidth
                        label="Grado"
                        name="grade_id"
                        value={form.grade_id}
                        onChange={handleChange}
                        disabled={gradesLoading}
                        helperText={gradesLoading ? 'Cargando grados...' : 'Selecciona el grado del estudiante'}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <School color="primary" />
                            </InputAdornment>
                          ),
                        }}
                      >
                        <MenuItem value="" disabled>
                          Selecciona un grado
                        </MenuItem>
                        {grades.map((grade) => (
                          <MenuItem key={grade.id} value={grade.id}>
                            {grade.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                  )}

                  <Grid item xs={12} md={isTeacher ? 6 : 12}>
                    <TextField
                      fullWidth
                      label="Correo electronico"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email color="primary" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  {isTeacher && (
                    <>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Profesiones o especialidades"
                          name="professions"
                          value={form.professions}
                          onChange={handleChange}
                          multiline
                          minRows={2}
                          placeholder="Ej: Docente de matematica, psicopedagoga, coordinadora academica"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.4 }}>
                                <WorkspacePremium color="primary" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Fecha de nacimiento"
                          name="birth_date"
                          type="date"
                          value={form.birth_date}
                          onChange={handleChange}
                          InputLabelProps={{ shrink: true }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Cake color="primary" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Documento de identidad"
                          name="document_id"
                          value={form.document_id}
                          onChange={handleChange}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Badge color="primary" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          label="Celular"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <PhoneIphone color="primary" />
                              </InputAdornment>
                            ),
                          }}
                        />
                      </Grid>
                    </>
                  )}
                </Grid>
              </Box>
            )}

            {activeStep === 2 && (
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ textAlign: 'center', mb: 1 }}>
                  Crea tu acceso
                </Typography>
                <Typography sx={{ textAlign: 'center', color: 'text.secondary', mb: 3 }}>
                  Usa una contrasena segura. El acceso quedara asociado a tu perfil de {isTeacher ? 'docente' : 'estudiante'}.
                </Typography>

                <Paper
                  variant="outlined"
                  sx={{
                    mb: 3,
                    p: 2.2,
                    borderRadius: '18px',
                    background: 'linear-gradient(135deg, rgba(21,101,192,0.04) 0%, rgba(255,255,255,0.9) 100%)',
                  }}
                >
                  <Typography variant="subtitle2" fontWeight={800} sx={{ color: selectedRole.color, mb: 1.2 }}>
                    Resumen del registro
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.2 }}>
                    <Chip label={selectedRole.label} sx={{ background: `${selectedRole.color}16`, color: selectedRole.color, fontWeight: 800 }} />
                    <Chip label={form.full_name || 'Nombre pendiente'} sx={{ background: 'rgba(15,23,42,0.05)', fontWeight: 700 }} />
                    <Chip label={form.email || 'Correo pendiente'} sx={{ background: 'rgba(15,23,42,0.05)', fontWeight: 700 }} />
                    {!isTeacher && (
                      <Chip
                        label={grades.find((grade) => grade.id === Number(form.grade_id))?.name || 'Grado pendiente'}
                        sx={{ background: 'rgba(15,23,42,0.05)', fontWeight: 700 }}
                      />
                    )}
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {isTeacher
                      ? 'Incluye profesiones, fecha de nacimiento, documento y celular.'
                      : 'Incluye nombre completo, edad, grado, correo y contrasena.'}
                  </Typography>
                </Paper>

                <TextField
                  fullWidth
                  label="Contrasena"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  helperText="Minimo 6 caracteres"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="primary" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword((previous) => !previous)} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2.5 }}
                />

                <TextField
                  fullWidth
                  label="Confirmar contrasena"
                  name="confirm_password"
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirm_password}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="primary" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowConfirm((previous) => !previous)} edge="end">
                          {showConfirm ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
              {activeStep > 0 && (
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  sx={{ flex: 1, py: 1.5, boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}
                >
                  Atras
                </Button>
              )}

              {activeStep < steps.length - 1 ? (
                <Button variant="contained" onClick={handleNext} sx={{ flex: 1, py: 1.5, fontWeight: 800 }}>
                  Siguiente
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                  sx={{ flex: 1, py: 1.5, fontWeight: 800 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Crear cuenta'}
                </Button>
              )}
            </Box>

            <Divider sx={{ my: 3 }}>
              <Typography variant="caption" color="text.secondary">
                Ya tienes cuenta
              </Typography>
            </Divider>

            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate('/login')}
              sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}
            >
              Iniciar sesion
            </Button>
          </Box>
        </Paper>
      </Container>

      <WhatsAppFab message="Hola, necesito apoyo con mi registro en ABL Educacion." />
    </Box>
  );
};

export default RegisterPage;
