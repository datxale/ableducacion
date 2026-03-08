import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Alert,
  Divider,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Grid,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person,
  Lock,
  Email,
  MenuBook,
  ArrowBack,
  School,
  Cast,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const steps = ['Rol', 'Datos personales', 'Acceso'];

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: '',
    role: 'estudiante',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const validateStep = () => {
    if (activeStep === 0) {
      return true;
    }
    if (activeStep === 1) {
      if (!form.first_name || !form.last_name) {
        setError('Por favor ingresa tu nombre completo.');
        return false;
      }
      if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) {
        setError('Por favor ingresa un email válido.');
        return false;
      }
    }
    if (activeStep === 2) {
      if (!form.username || form.username.length < 4) {
        setError('El usuario debe tener al menos 4 caracteres.');
        return false;
      }
      if (!form.password || form.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.');
        return false;
      }
      if (form.password !== form.confirm_password) {
        setError('Las contraseñas no coinciden.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setError('');
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    const { confirm_password, ...submitData } = form;
    const result = await register(submitData);
    setLoading(false);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } else {
      setError(result.error);
    }
  };

  if (success) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #4caf50 0%, #81c784 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ textAlign: 'center', color: '#fff' }}>
          <Typography sx={{ fontSize: '6rem', mb: 2 }}>🎉</Typography>
          <Typography variant="h3" fontWeight={800} sx={{ mb: 2 }}>
            ¡Registro exitoso!
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Redirigiendo al inicio de sesión...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a237e 0%, #1565c0 50%, #42a5f5 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        py: 4,
      }}
    >
      {[...Array(4)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            width: [150, 100, 200, 80][i],
            height: [150, 100, 200, 80][i],
            top: [`${10 + i * 20}%`],
            left: i % 2 === 0 ? `${i * 25}%` : 'auto',
            right: i % 2 !== 0 ? `${i * 20}%` : 'auto',
          }}
        />
      ))}

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/')}
          sx={{
            color: '#fff',
            mb: 2,
            boxShadow: 'none',
            '&:hover': { background: 'rgba(255,255,255,0.1)', transform: 'none', boxShadow: 'none' },
          }}
        >
          Volver al inicio
        </Button>

        <Paper
          elevation={24}
          sx={{
            borderRadius: '28px',
            overflow: 'hidden',
            boxShadow: '0 40px 80px rgba(0,0,0,0.3)',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #1565c0, #42a5f5)',
              p: 4,
              textAlign: 'center',
            }}
          >
            <Box
              sx={{
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '20px',
                p: 2,
                display: 'inline-flex',
                mb: 2,
              }}
            >
              <MenuBook sx={{ color: '#fff', fontSize: '2.5rem' }} />
            </Box>
            <Typography variant="h4" fontWeight={800} sx={{ color: '#fff' }}>
              Crear Cuenta 🌟
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
              Únete a la comunidad de ABL Educacion
            </Typography>
          </Box>

          <Box sx={{ p: 4 }}>
            {/* Stepper */}
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            {/* Step 0: Role selection */}
            {activeStep === 0 && (
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1, textAlign: 'center' }}>
                  ¿Quién eres?
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                  Selecciona tu rol en la plataforma
                </Typography>
                <Grid container spacing={2}>
                  {[
                    {
                      value: 'estudiante',
                      label: 'Estudiante',
                      icon: '🎒',
                      desc: 'Tengo entre 6 y 11 años y quiero aprender',
                      color: '#4caf50',
                    },
                    {
                      value: 'docente',
                      label: 'Docente',
                      icon: '👩‍🏫',
                      desc: 'Soy maestro/a y quiero enseñar',
                      color: '#1976d2',
                    },
                  ].map((role) => (
                    <Grid item xs={12} sm={6} key={role.value}>
                      <Box
                        onClick={() => setForm({ ...form, role: role.value })}
                        sx={{
                          border: `3px solid ${form.role === role.value ? role.color : '#e0e0e0'}`,
                          borderRadius: '20px',
                          p: 3,
                          textAlign: 'center',
                          cursor: 'pointer',
                          background: form.role === role.value ? `${role.color}11` : '#fff',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            border: `3px solid ${role.color}`,
                            background: `${role.color}08`,
                          },
                        }}
                      >
                        <Typography sx={{ fontSize: '3rem', mb: 1 }}>{role.icon}</Typography>
                        <Typography variant="h6" fontWeight={700} sx={{ color: role.color }}>
                          {role.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {role.desc}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Step 1: Personal data */}
            {activeStep === 1 && (
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 3, textAlign: 'center' }}>
                  Cuéntanos sobre ti
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nombre"
                      name="first_name"
                      value={form.first_name}
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
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Apellido"
                      name="last_name"
                      value={form.last_name}
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
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email"
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
                </Grid>
              </Box>
            )}

            {/* Step 2: Access data */}
            {activeStep === 2 && (
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 3, textAlign: 'center' }}>
                  Crea tu acceso
                </Typography>
                <TextField
                  fullWidth
                  label="Nombre de usuario"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  helperText="Mínimo 4 caracteres, sin espacios"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2.5 }}
                />
                <TextField
                  fullWidth
                  label="Contraseña"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  helperText="Mínimo 6 caracteres"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="primary" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2.5 }}
                />
                <TextField
                  fullWidth
                  label="Confirmar contraseña"
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
                        <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end">
                          {showConfirm ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            )}

            {/* Navigation buttons */}
            <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
              {activeStep > 0 && (
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  sx={{ flex: 1, py: 1.5, boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}
                >
                  Atrás
                </Button>
              )}
              {activeStep < steps.length - 1 ? (
                <Button
                  variant="contained"
                  onClick={handleNext}
                  sx={{ flex: 1, py: 1.5 }}
                >
                  Siguiente
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  disabled={loading}
                  sx={{ flex: 1, py: 1.5, fontSize: '1rem' }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : '¡Crear mi cuenta!'}
                </Button>
              )}
            </Box>

            <Divider sx={{ my: 3 }}>
              <Typography variant="caption" color="text.secondary">
                ¿Ya tienes cuenta?
              </Typography>
            </Divider>

            <Button
              fullWidth
              variant="outlined"
              onClick={() => navigate('/login')}
              sx={{ boxShadow: 'none', '&:hover': { boxShadow: 'none', transform: 'none' } }}
            >
              Iniciar Sesión
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default RegisterPage;
