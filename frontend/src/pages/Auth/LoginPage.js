import React, { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

import WhatsAppFab from '../../components/common/WhatsAppFab';
import { getWhatsAppUrl } from '../../config/contact';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setLocalError('Por favor completa todos los campos.');
      return;
    }

    setLoading(true);
    const result = await login(form.email, form.password);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
      return;
    }

    setLocalError(result.error);
  };

  const FloatingIcon = ({ children, top, left, right, size = 40, delay = 0 }) => (
    <Box
      sx={{
        position: 'absolute',
        top,
        left,
        right,
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.6,
        opacity: 0.7,
        animation: `floatIcon ${3 + delay}s ease-in-out infinite alternate`,
        '@keyframes floatIcon': {
          '0%': { transform: 'translateY(0px) rotate(0deg)' },
          '100%': { transform: 'translateY(-15px) rotate(5deg)' },
        },
      }}
    >
      {children}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Box
        sx={{
          flex: 1,
          background: 'linear-gradient(135deg, #0d1b3e 0%, #1a2d5a 50%, #0d1b3e 100%)',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          p: 4,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '10%',
              left: '20%',
              width: '60%',
              height: '80%',
              border: '2px dashed rgba(255,255,255,0.15)',
              borderRadius: '50%',
              transform: 'rotate(-15deg)',
            },
          }}
        />

        <FloatingIcon top="8%" left="10%" size={50} delay={0}>📚</FloatingIcon>
        <FloatingIcon top="15%" right="15%" size={45} delay={0.5}>🎓</FloatingIcon>
        <FloatingIcon top="40%" left="5%" size={35} delay={1}>✏️</FloatingIcon>
        <FloatingIcon top="65%" right="10%" size={40} delay={1.5}>📐</FloatingIcon>
        <FloatingIcon top="80%" left="15%" size={45} delay={2}>🌟</FloatingIcon>
        <FloatingIcon top="5%" left="50%" size={35} delay={0.8}>🔬</FloatingIcon>
        <FloatingIcon top="75%" right="25%" size={38} delay={1.2}>🎨</FloatingIcon>

        {[...Array(8)].map((_, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.3)',
              top: `${10 + i * 11}%`,
              left: `${15 + (i % 3) * 30}%`,
            }}
          />
        ))}

        <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #42a5f5, #1565c0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
              boxShadow: '0 8px 32px rgba(66,165,245,0.3)',
            }}
          >
            <Typography sx={{ fontSize: '2.5rem' }}>🏫</Typography>
          </Box>

          <Typography
            variant="h3"
            sx={{
              color: '#fff',
              fontWeight: 900,
              mb: 1,
              letterSpacing: 1,
            }}
          >
            ABL
            <Box component="span" sx={{ color: '#42a5f5' }}>
              EDUCACION
            </Box>
          </Typography>

          <Typography
            variant="h5"
            sx={{
              color: '#fff',
              fontWeight: 700,
              mt: 4,
              mb: 1,
            }}
          >
            Acceso institucional
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: '#fff',
              fontWeight: 700,
              mb: 3,
            }}
          >
            solicita tus credenciales
          </Typography>

          <Button
            variant="contained"
            size="large"
            onClick={() => window.open(getWhatsAppUrl('Hola, necesito acceso a ABL Educacion.'), '_blank', 'noopener,noreferrer')}
            sx={{
              background: 'linear-gradient(135deg, #25d366, #1fa755)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '1.1rem',
              px: 6,
              py: 1.5,
              borderRadius: '16px',
              textTransform: 'none',
              boxShadow: '0 8px 24px rgba(37,211,102,0.35)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1fa755, #1a8f48)',
                boxShadow: '0 12px 32px rgba(37,211,102,0.45)',
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Solicitar acceso
          </Button>

          <Box sx={{ mt: 4 }}>
            <Typography
              variant="subtitle1"
              sx={{
                color: '#fff',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: 2,
                mb: 1,
              }}
            >
              Recuerda
            </Typography>
            <Typography
              sx={{
                color: 'rgba(255,255,255,0.7)',
                maxWidth: 300,
                mx: 'auto',
                lineHeight: 1.6,
              }}
            >
              El acceso al portal es administrado por la institucion para docentes, estudiantes y personal autorizado.
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          background: '#fdf6e3',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
          position: 'relative',
        }}
      >
        <Box sx={{ maxWidth: 400, width: '100%' }}>
          <Box sx={{ display: { xs: 'block', md: 'none' }, textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" fontWeight={900} color="primary">
              ABL<Box component="span" sx={{ color: '#ff9800' }}>EDUCACION</Box>
            </Typography>
          </Box>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              textAlign: 'center',
              mb: 1,
              color: '#1a2d5a',
            }}
          >
            Bienvenido al
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              textAlign: 'center',
              mb: 4,
              color: '#1a2d5a',
            }}
          >
            portal educativo
          </Typography>

          {localError && (
            <Alert
              severity="error"
              sx={{ mb: 3, borderRadius: '12px' }}
              onClose={() => setLocalError('')}
            >
              {localError}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              fullWidth
              label="Ingresa tu correo electronico"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              disabled={loading}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  backgroundColor: '#fff',
                  '& fieldset': { borderColor: '#ccc', borderWidth: 2 },
                  '&:hover fieldset': { borderColor: '#1565c0' },
                  '&.Mui-focused fieldset': { borderColor: '#1565c0' },
                },
                '& .MuiInputLabel-root': { color: '#888' },
              }}
            />

            <TextField
              fullWidth
              label="Ingresa tu contrasena"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }}
              sx={{
                mb: 4,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  backgroundColor: '#fff',
                  '& fieldset': { borderColor: '#ccc', borderWidth: 2 },
                  '&:hover fieldset': { borderColor: '#1565c0' },
                  '&.Mui-focused fieldset': { borderColor: '#1565c0' },
                },
                '& .MuiInputLabel-root': { color: '#888' },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.8,
                fontSize: '1.2rem',
                fontWeight: 700,
                borderRadius: '50px',
                background: 'linear-gradient(135deg, #ff4081, #ff80ab)',
                boxShadow: '0 8px 24px rgba(255,64,129,0.4)',
                textTransform: 'none',
                '&:hover': {
                  background: 'linear-gradient(135deg, #f50057, #ff4081)',
                  boxShadow: '0 12px 32px rgba(255,64,129,0.5)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              {loading ? <CircularProgress size={28} color="inherit" /> : 'Ingresar'}
            </Button>
          </Box>

          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography
              component="a"
              href="#"
              sx={{
                color: '#1565c0',
                textDecoration: 'none',
                fontWeight: 600,
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Olvidaste tu contrasena?
            </Typography>
            <br />
            <Typography
              component="a"
              href="#"
              sx={{
                color: '#1565c0',
                textDecoration: 'none',
                fontWeight: 600,
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Haz click aqui
            </Typography>
          </Box>
        </Box>
      </Box>
      <WhatsAppFab message="Hola, necesito ayuda para ingresar a ABL Educacion." />
    </Box>
  );
};

export default LoginPage;
