import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { gradeColors } from '../../styles/theme';

const gradeIcons = ['🌟', '🚀', '🎨', '🦁', '🌈', '🏆'];
const gradeLabels = ['1° Grado', '2° Grado', '3° Grado', '4° Grado', '5° Grado', '6° Grado'];

const GradeCard = ({ grade, index, onClick }) => {
  const navigate = useNavigate();
  const colorSet = gradeColors[index % gradeColors.length];
  const icon = gradeIcons[index % gradeIcons.length];
  const label = gradeLabels[index] || `${index + 1}° Grado`;

  const handleClick = () => {
    if (onClick) {
      onClick(grade);
    } else {
      navigate(`/grades/${grade.id}`);
    }
  };

  return (
    <Card
      onClick={handleClick}
      sx={{
        cursor: 'pointer',
        background: colorSet.bg,
        color: colorSet.color,
        borderRadius: '24px',
        boxShadow: `0 8px 32px ${colorSet.shadow}`,
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        '&:hover': {
          transform: 'translateY(-8px) scale(1.03)',
          boxShadow: `0 20px 60px ${colorSet.shadow}`,
        },
        minHeight: 180,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decorative circles */}
      <Box
        sx={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -30,
          left: -10,
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.10)',
        }}
      />

      <CardContent
        sx={{
          textAlign: 'center',
          zIndex: 1,
          py: 3,
        }}
      >
        <Typography sx={{ fontSize: '3.5rem', lineHeight: 1, mb: 1 }}>
          {icon}
        </Typography>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            color: '#fff',
            textShadow: '0 2px 8px rgba(0,0,0,0.2)',
            mb: 0.5,
          }}
        >
          {grade?.name || label}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: 'rgba(255,255,255,0.85)',
            fontWeight: 600,
            fontSize: '0.85rem',
          }}
        >
          {grade?.description || 'Haz clic para ver secciones'}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default GradeCard;
