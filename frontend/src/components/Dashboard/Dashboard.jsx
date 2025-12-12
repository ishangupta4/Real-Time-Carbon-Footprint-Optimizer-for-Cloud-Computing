

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    CircularProgress,
    Alert,
    Button,
    Chip,
    LinearProgress,
    Container,
} from '@mui/material';
import {
    EnergySavingsLeaf as LeafIcon,
    Speed as SpeedIcon,
    LocationOn as LocationIcon,
    Refresh as RefreshIcon,
    TrendingDown as TrendingDownIcon,
    Air as WindIcon,
    Cloud as CloudIcon,
    CompareArrows as CompareIcon,
} from '@mui/icons-material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import carbonAPI from '../../services/api';

const getIntensityColor = (intensity) => {
    if (intensity < 100) return '#4caf50';
    if (intensity < 150) return '#3778cdff';
    if (intensity < 200) return '#d47257ff';
    if (intensity < 250) return '#7ac5daff';
    if (intensity < 300) return '#4dba4bff';
    return '#2b0603ff';
};

const getIntensityLabel = (intensity) => {
    if (intensity < 100) return 'Very Low';
    if (intensity < 150) return 'Low';
    if (intensity < 200) return 'Moderate';
    if (intensity < 250) return 'High';
    return 'Very High';
};

function Dashboard() {
    const navigate = useNavigate();
    const [carbonData, setCarbonData] = useState(null);
    const [datacenters, setDatacenters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [carbonResponse, dcResponse] = await Promise.all([
                carbonAPI.getCarbonIntensity(),
                carbonAPI.getDatacenters(),
            ]);
            setCarbonData(carbonResponse.data);
            setDatacenters(dcResponse.datacenters);
            setLastUpdated(new Date());
        } catch (err) {
            setError('Failed to fetch data. Is the backend running on http://127.0.0.1:5000?');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    if (loading && !carbonData) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    const chartData = carbonData
        ? Object.entries(carbonData).map(([id, data]) => ({
            name: id.replace('UK-', ''),
            fullName: id,
            intensity: Math.round(data.intensity),
            renewable: Math.round(data.renewable),
            color: getIntensityColor(data.intensity),
        }))
        : [];

    const sortedChartData = [...chartData].sort((a, b) => a.intensity - b.intensity);
    const bestDC = sortedChartData[0];
    const worstDC = sortedChartData[sortedChartData.length - 1];
    const avgIntensity = chartData.length > 0
        ? Math.round(chartData.reduce((acc, d) => acc + d.intensity, 0) / chartData.length)
        : 0;

    return (
        <Container maxWidth={false}>
            {}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Box>
                    <Typography variant="h4" gutterBottom>Carbon Intensity Dashboard</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Real-time carbon intensity data from UK datacenters
                    </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={2}>
                    {lastUpdated && (
                        <Typography variant="body2" color="text.secondary">
                            Updated: {lastUpdated.toLocaleTimeString()}
                        </Typography>
                    )}
                    <Button
                        startIcon={loading ? <CircularProgress size={16} /> : <RefreshIcon />}
                        onClick={fetchData}
                        disabled={loading}
                        variant="outlined"
                    >
                        Refresh
                    </Button>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {}
            <Grid container spacing={2} mb={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%', borderTop: 4, borderColor: 'success.main' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={1}>
                                <LeafIcon sx={{ color: 'success.main', mr: 1 }} />
                                <Typography variant="body2" color="text.secondary">Lowest Carbon</Typography>
                            </Box>
                            {bestDC ? (
                                <>
                                    <Typography variant="h5" fontWeight="bold" color="success.main">{bestDC.name}</Typography>
                                    <Typography variant="body2">{bestDC.intensity} gCO₂/kWh</Typography>
                                </>
                            ) : <Typography>Loading...</Typography>}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%', borderTop: 4, borderColor: 'error.main' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={1}>
                                <TrendingDownIcon sx={{ color: 'error.main', mr: 1 }} />
                                <Typography variant="body2" color="text.secondary">Highest Carbon</Typography>
                            </Box>
                            {worstDC ? (
                                <>
                                    <Typography variant="h5" fontWeight="bold" color="error.main">{worstDC.name}</Typography>
                                    <Typography variant="body2">{worstDC.intensity} gCO₂/kWh</Typography>
                                </>
                            ) : <Typography>Loading...</Typography>}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%', borderTop: 4, borderColor: 'primary.main' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={1}>
                                <SpeedIcon sx={{ color: 'primary.main', mr: 1 }} />
                                <Typography variant="body2" color="text.secondary">Average Intensity</Typography>
                            </Box>
                            <Typography variant="h5" fontWeight="bold">{avgIntensity} gCO₂/kWh</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%', borderTop: 4, borderColor: 'secondary.main' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={1}>
                                <LocationIcon sx={{ color: 'secondary.main', mr: 1 }} />
                                <Typography variant="body2" color="text.secondary">Active Datacenters</Typography>
                            </Box>
                            <Typography variant="h5" fontWeight="bold">{datacenters.length}</Typography>
                            <Typography variant="body2">UK Regions</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {}
            <Grid container spacing={5} mb={3}>
                <Grid item xs={12} lg={8}>
                    <Card sx={{ height: 450, width: 600 }}>
                        <CardContent sx={{ height: '100%' }}>
                            <Typography variant="h6" gutterBottom>Carbon Intensity by Datacenter</Typography>
                            <Box height="calc(100% - 40px)">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={sortedChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis label={{ value: 'gCO₂/kWh', angle: -90, position: 'insideLeft' }} />
                                        <Tooltip
                                            formatter={(value) => [`${value} gCO₂/kWh`, 'Carbon Intensity']}
                                            contentStyle={{ borderRadius: 8 }}
                                        />
                                        <Bar dataKey="intensity" radius={[4, 4, 0, 0]}>
                                            {sortedChartData.map((entry, index) => (
                                                <Cell key={index} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} lg={4}>
                    <Card sx={{ height: 450 }}>
                        <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="h6" gutterBottom>Datacenter Status</Typography>
                            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                                {datacenters.map((dc) => {
                                    const carbon = carbonData?.[dc.id] || {};
                                    const intensity = Math.round(carbon.intensity || 0);
                                    const renewable = Math.round(carbon.renewable || 0);
                                    return (
                                        <Box
                                            key={dc.id}
                                            sx={{
                                                p: 2,
                                                mb: 1.5,
                                                borderRadius: 2,
                                                bgcolor: 'grey.50',
                                                borderLeft: 4,
                                                borderColor: getIntensityColor(intensity),
                                            }}
                                        >
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight="bold">{dc.name}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{dc.location}</Typography>
                                                </Box>
                                                <Box textAlign="right">
                                                    <Typography variant="subtitle1" fontWeight="bold">{intensity}</Typography>
                                                    <Chip
                                                        label={getIntensityLabel(intensity)}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: getIntensityColor(intensity),
                                                            color: intensity < 200 ? 'black' : 'white',
                                                            fontSize: '0.65rem',
                                                            height: 20,
                                                        }}
                                                    />
                                                </Box>
                                            </Box>
                                            <Box mt={1}>
                                                <Box display="flex" alignItems="center" gap={0.5}>
                                                    <WindIcon sx={{ fontSize: 14, color: 'success.main' }} />
                                                    <Typography variant="caption">{renewable}% Renewable</Typography>
                                                </Box>
                                                <LinearProgress
                                                    variant="determinate"
                                                    value={Math.min(renewable, 100)}
                                                    sx={{ mt: 0.5, height: 6, borderRadius: 3 }}
                                                    color="success"
                                                />
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {}
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>Quick Actions</Typography>
                    <Box display="flex" gap={2} flexWrap="wrap">
                        <Button
                            variant="contained"
                            size="large"
                            onClick={() => navigate('/optimize')}
                            startIcon={<CloudIcon />}
                            sx={{ px: 4 }}
                        >
                            Optimize Workload
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            onClick={() => navigate('/compare')}
                            startIcon={<CompareIcon />}
                            sx={{ px: 4 }}
                        >
                            Compare Algorithms
                        </Button>
                    </Box>
                </CardContent>
            </Card>
        </Container>
    );
}

export default Dashboard;