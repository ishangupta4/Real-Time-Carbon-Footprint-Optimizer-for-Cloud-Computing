// File: frontend/src/components/Common/Navbar.jsx

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    Chip,
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    CloudQueue as CloudIcon,
    CompareArrows as CompareIcon,
    EnergySavingsLeaf as LeafIcon,
} from '@mui/icons-material';

const navItems = [
    { path: '/', label: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/optimize', label: 'Optimize', icon: <CloudIcon /> },
    { path: '/compare', label: 'Compare', icon: <CompareIcon /> },
];

function Navbar() {
    const location = useLocation();

    return (
        <AppBar
            position="static"
            color="default"
            elevation={1}
            sx={{ bgcolor: 'white' }}
        >
            <Toolbar>
                <LeafIcon sx={{ color: 'primary.main', mr: 1, fontSize: 28 }} />
                <Typography
                    variant="h6"
                    component={Link}
                    to="/"
                    sx={{
                        flexGrow: 0,
                        textDecoration: 'none',
                        color: 'primary.main',
                        fontWeight: 700,
                        mr: 4,
                    }}
                >
                    Carbon Optimizer
                </Typography>

                <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
                    {navItems.map((item) => (
                        <Button
                            key={item.path}
                            component={Link}
                            to={item.path}
                            startIcon={item.icon}
                            variant={location.pathname === item.path ? 'contained' : 'text'}
                            color={location.pathname === item.path ? 'primary' : 'inherit'}
                            sx={{ px: 2 }}
                        >
                            {item.label}
                        </Button>
                    ))}
                </Box>

                <Chip
                    icon={<LeafIcon />}
                    label="Live Data"
                    color="success"
                    size="small"
                    variant="outlined"
                />
            </Toolbar>
        </AppBar>
    );
}

export default Navbar;