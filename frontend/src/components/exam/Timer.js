import React, { useState, useEffect } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { Timer as TimerIcon } from '@mui/icons-material';

const Timer = ({ duration, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (timeLeft === 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          onTimeUp();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getColor = () => {
    const percentage = (timeLeft / duration) * 100;
    if (percentage > 50) return 'success';
    if (percentage > 25) return 'warning';
    return 'error';
  };

  return (
    <Chip
      icon={<TimerIcon />}
      label={`Time: ${formatTime(timeLeft)}`}
      color={getColor()}
      variant="outlined"
    />
  );
};

export default Timer;
