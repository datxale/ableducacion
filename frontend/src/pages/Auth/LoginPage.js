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
  Link,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person,
  Lock,
  MenuBook,
  ArrowBack,
} from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, error } = useAuth();

  const [form, setForm] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      setLocalError('Por favor completa todos los campos.');
      return;
    }
    setLoading(true);
    const result = await login(form.username, form.password);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setLocalError(result.error);
    }
  };

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
      {/* Background decorations */}
      {[...Array(5)].map((_, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            width: [100, 200, 80, 150, 120][i],
            height: [100, 200, 80, 150, 120][i],
            top: [`${15 + i * 15}%`],
            left: i % 2 === 0 ? `${i * 20}%` : 'auto',
            right: i % 2 !== 0 ? `${i * 15}%` : 'auto',
          }}
        />
      ))}

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Back button */}
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
              ¡Hola de nuevo! 👋
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
              Ingresa a tu cuenta para continuar aprendiendo
            </Typography>
          </Box>

          {/* Form */}
          <Box sx={{ p: 4 }}>
            {(localError || error) && (
              <Alert
                severity="error"
                sx={{ mb: 3, borderRadius: '12px' }}
                onClose={() => setLocalError('')}
              >
                {localError || error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                fullWidth
                label="Usuario"
                name="username"
                value={form.username}
                onChange={handleChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2.5 }}
                disabled={loading}
              />

              <TextField
                fullWidth
                label="Contraseña"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
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
                sx={{ mb: 3 }}
                disabled={loading}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  borderRadius: '12px',
                  mb: 2,
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  '¡Ingresar!'
                )}
              </Button>

              <Divider sx={{ my: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  ¿No tienes cuenta?
                </Typography>
              </Divider>

              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={() => navigate('/register')}
                sx={{
                  py: 1.5,
                  fontSize: '1rem',
                  borderRadius: '12px',
                  borderWidth: 2,
                  boxShadow: 'none',
                  '&:hover': { borderWidth: 2, boxShadow: 'none', transform: 'none' },
                }}
              >
                Registrarse Gratis
              </Button>
            </Box>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Al ingresar, aceptas nuestros{' '}
                <Link href="#" underline="hover" color="primary">
                  Terminos de Servicio
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Decorative emojis */}
        <Box sx={{ textAlign: 'center', mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
          {['📚', '✏️', '🎒', '🌟', '📐'].map((emoji, i) => (
            <Typography
              key={i}
              sx={{
                fontSize: '1.5rem',
                animation: `float ${2 + i * 0.3}s ease-in-out infinite alternate`,
                '@keyframes float': {
                  '0%': { transform: 'translateY(0px)' },
                  '100%': { transform: 'translateY(-10px)' },
                },
              }}
            >
              {emoji}
            </Typography>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage;
