import { Button } from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import React from 'react';

export default function MyButton({
    name = 'Tìm kiếm',
    icon = <SearchOutlinedIcon />,
    fullWidth = true,
    backgroundColor = '#088f81',
    variant = 'primary', // 'primary', 'success', 'excel', 'secondary'
    onClick,
    disabled = false,
    size = 'medium',
}) {
    // Define gradient styles based on variant
    const getStyles = () => {
        const baseStyles = {
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: size === 'small' ? '12px' : '13px',
            padding: size === 'small' ? '6px 12px' : '8px 16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            transition: 'all 0.2s ease',
            '&:hover': {
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            },
            '&:disabled': {
                background: '#e0e0e0',
                color: '#999',
            },
        };

        switch (variant) {
            case 'excel':
                return {
                    ...baseStyles,
                    background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
                    '&:hover': {
                        ...baseStyles['&:hover'],
                        background: 'linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)',
                    },
                };
            case 'success':
                return {
                    ...baseStyles,
                    background: 'linear-gradient(135deg, #43a047 0%, #2e7d32 100%)',
                    '&:hover': {
                        ...baseStyles['&:hover'],
                        background: 'linear-gradient(135deg, #4caf50 0%, #43a047 100%)',
                    },
                };
            case 'secondary':
                return {
                    ...baseStyles,
                    background: 'linear-gradient(135deg, #546e7a 0%, #37474f 100%)',
                    '&:hover': {
                        ...baseStyles['&:hover'],
                        background: 'linear-gradient(135deg, #607d8b 0%, #546e7a 100%)',
                    },
                };
            case 'apply':
                return {
                    ...baseStyles,
                    background: 'linear-gradient(135deg, #ff7043 0%, #e64a19 100%)',
                    '&:hover': {
                        ...baseStyles['&:hover'],
                        background: 'linear-gradient(135deg, #ff8a65 0%, #ff7043 100%)',
                    },
                };
            case 'primary':
            default:
                return {
                    ...baseStyles,
                    background: `linear-gradient(135deg, ${backgroundColor} 0%, ${adjustColor(backgroundColor, -20)} 100%)`,
                    '&:hover': {
                        ...baseStyles['&:hover'],
                        background: `linear-gradient(135deg, ${adjustColor(backgroundColor, 10)} 0%, ${backgroundColor} 100%)`,
                    },
                };
        }
    };

    // Helper to adjust color brightness
    function adjustColor(color, percent) {
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 +
            (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)
        ).toString(16).slice(1);
    }

    return (
        <Button
            onClick={onClick}
            variant="contained"
            fullWidth={fullWidth}
            startIcon={icon}
            disabled={disabled}
            sx={getStyles()}
        >
            {name}
        </Button>
    );
}
