import React from 'react';
import { Card, CardContent, Typography, Box, Avatar } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

const StatsCard = ({
  title,
  value,
  icon,
  color = 'primary',
  subtitle,
  trend,
  trendValue
}) => {
  // Color mapping for aviation theme
  const getColorConfig = (colorType) => {
    const configs = {
      primary: {
        gradient: 'linear-gradient(135deg, #0A2463 0%, #3E92CC 100%)',
        light: 'rgba(62, 146, 204, 0.1)',
        main: '#0A2463',
        icon: '#FFFFFF',
      },
      secondary: {
        gradient: 'linear-gradient(135deg, #3E92CC 0%, #00B4D8 100%)',
        light: 'rgba(62, 146, 204, 0.1)',
        main: '#3E92CC',
        icon: '#FFFFFF',
      },
      success: {
        gradient: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
        light: 'rgba(16, 185, 129, 0.1)',
        main: '#10B981',
        icon: '#FFFFFF',
      },
      warning: {
        gradient: 'linear-gradient(135deg, #D97706 0%, #F59E0B 100%)',
        light: 'rgba(245, 158, 11, 0.1)',
        main: '#F59E0B',
        icon: '#FFFFFF',
      },
      error: {
        gradient: 'linear-gradient(135deg, #B91C1C 0%, #DC2626 100%)',
        light: 'rgba(220, 38, 38, 0.1)',
        main: '#DC2626',
        icon: '#FFFFFF',
      },
      info: {
        gradient: 'linear-gradient(135deg, #0096C7 0%, #00B4D8 100%)',
        light: 'rgba(0, 180, 216, 0.1)',
        main: '#00B4D8',
        icon: '#FFFFFF',
      },
    };
    return configs[colorType] || configs.primary;
  };

  const colorConfig = getColorConfig(color);

  return (
    <Card
      sx={{
        height: '100%',
        background: '#FFFFFF',
        border: '1px solid #E8F1F5',
        borderRadius: 3,
        boxShadow: '0 2px 8px rgba(10, 36, 99, 0.08)',
        transition: 'all 0.3s ease-in-out',
        position: 'relative',
        overflow: 'visible',
        '&:hover': {
          boxShadow: '0 8px 24px rgba(10, 36, 99, 0.15)',
          transform: 'translateY(-4px)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header with icon and trend */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          {/* Icon in circular badge */}
          <Avatar
            sx={{
              width: 56,
              height: 56,
              background: colorConfig.gradient,
              boxShadow: `0 4px 14px ${colorConfig.light}`,
            }}
          >
            <Box sx={{ color: colorConfig.icon, display: 'flex', alignItems: 'center' }}>
              {icon}
            </Box>
          </Avatar>

          {/* Trend indicator (optional) */}
          {trend && trendValue && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                px: 1,
                py: 0.5,
                borderRadius: 1,
                backgroundColor: trend === 'up' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(220, 38, 38, 0.1)',
              }}
            >
              {trend === 'up' ? (
                <TrendingUp sx={{ fontSize: 16, color: '#10B981' }} />
              ) : (
                <TrendingDown sx={{ fontSize: 16, color: '#DC2626' }} />
              )}
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 600,
                  color: trend === 'up' ? '#10B981' : '#DC2626',
                }}
              >
                {trendValue}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Value and Title */}
        <Box>
          <Typography
            variant="h3"
            component="div"
            sx={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 700,
              fontSize: '2.25rem',
              color: colorConfig.main,
              mb: 0.5,
              lineHeight: 1.2,
            }}
          >
            {value}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: '#6C757D',
              fontWeight: 500,
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {title}
          </Typography>

          {subtitle && (
            <Typography
              variant="caption"
              sx={{
                color: '#9CA3AF',
                fontSize: '0.75rem',
                mt: 0.5,
                display: 'block',
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </CardContent>

      {/* Bottom accent line */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          background: colorConfig.gradient,
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
        }}
      />
    </Card>
  );
};

export default StatsCard;
