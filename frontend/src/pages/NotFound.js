import React from 'react';
import { Box, Typography, Button, Fade } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { FlightTakeoff, ArrowBack } from '@mui/icons-material';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0A2463 0%, #001B3D 50%, #0A2463 100%)',
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center',
        px: 3,
      }}
    >
      {/* Background glow */}
      <Box sx={{
        position: 'absolute', top: '30%', left: '50%', width: 500, height: 500,
        transform: 'translate(-50%, -50%)', borderRadius: '50%',
        background: 'rgba(62, 146, 204, 0.08)', filter: 'blur(80px)', pointerEvents: 'none',
      }} />

      <Fade in timeout={600}>
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{
            width: 80, height: 80, borderRadius: '20px', mx: 'auto', mb: 4,
            background: 'linear-gradient(135deg, #3E92CC, #00B4D8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 12px 40px rgba(0, 180, 216, 0.3)',
          }}>
            <FlightTakeoff sx={{ fontSize: 40, color: '#fff', transform: 'rotate(45deg)' }} />
          </Box>

          <Typography sx={{
            fontFamily: "'Montserrat', sans-serif", fontWeight: 800,
            fontSize: { xs: '6rem', sm: '8rem' }, color: 'rgba(255,255,255,0.1)',
            lineHeight: 1, mb: -3, userSelect: 'none',
          }}>
            404
          </Typography>

          <Typography variant="h4" sx={{
            fontFamily: "'Montserrat'", fontWeight: 700, color: '#fff', mb: 1.5,
          }}>
            Off Course
          </Typography>

          <Typography sx={{
            color: 'rgba(255,255,255,0.5)', maxWidth: 400, mx: 'auto', mb: 4, fontSize: '1.05rem',
          }}>
            The page you're looking for doesn't exist or has been relocated to a different flight path.
          </Typography>

          <Button
            variant="contained"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/')}
            sx={{
              py: 1.5, px: 4, fontSize: '0.95rem', fontWeight: 600, borderRadius: 2,
              background: 'linear-gradient(135deg, #3E92CC, #00B4D8)',
              boxShadow: '0 4px 20px rgba(0, 180, 216, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #3585B8, #0096C7)',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 28px rgba(0, 180, 216, 0.4)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            Return Home
          </Button>
        </Box>
      </Fade>
    </Box>
  );
};

export default NotFound;
