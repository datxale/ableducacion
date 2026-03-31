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
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import WhatsAppFab from '../../components/common/WhatsAppFab';
import { useAuth } from '../../context/AuthContext';

const steps = ['Perfil', 'Datos personales', 'Acceso'];

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [activeStep, setActiveStep] = useState(0);
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: '',
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
      if (!form.full_name.trim()) {
        setError('Por favor ingresa tu nombre completo.');
        return false;
      }

      if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) {
        setError('Por favor ingresa un email valido.');
        return false;
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
    const result = await register({
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
    });
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
          <Typography sx={{ fontSize: '6rem', mb: 2 }}>OK</Typography>
          <Typography variant="h3" fontWeight={800} sx={{ mb: 2 }}>
            Solicitud registrada
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Redirigiendo al inicio de sesion...
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
              Registro institucional
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
              Completa tus datos para solicitar acceso a ABL Educacion
            </Typography>
          </Box>

          <Box sx={{ p: 4 }}>
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

            {activeStep === 0 && (
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1, textAlign: 'center' }}>
                  Quien eres
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                  Selecciona tu perfil dentro de la plataforma
                </Typography>
                <Grid container spacing={2}>
                  {[
                    {
                      value: 'estudiante',
                      label: 'Estudiante',
                      icon: 'A',
                      desc: 'Accedo a clases, actividades y seguimiento academico.',
                      color: '#4caf50',
                    },
                    {
                      value: 'docente',
                      label: 'Docente',
                      icon: 'D',
                      desc: 'Gestiono grupos, clases y acompanamiento de estudiantes.',
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

            {activeStep === 1 && (
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 3, textAlign: 'center' }}>
                  Cuentanos sobre ti
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                  Estos datos ayudaran a validar tu acceso institucional.
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
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

            {activeStep === 2 && (
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 3, textAlign: 'center' }}>
                  Crea tu acceso
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                  Usa una contrasena segura para tu ingreso al portal.
                </Typography>
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
                        <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end">
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
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Solicitar acceso'}
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
