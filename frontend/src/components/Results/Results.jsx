// File: frontend/src/components/Results/Results.jsx

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    Button,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Alert,
} from '@mui/material';
import {
    EnergySavingsLeaf as LeafIcon,
    TrendingDown as SavingsIcon,
    AttachMoney as CostIcon,
    Speed as SpeedIcon,
    ArrowBack as BackIcon,
    Park as TreeIcon,
    DirectionsCar as CarIcon,
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
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';

const COLORS = ['#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ff9800', '#f44336'];

function Results() {
    const location = useLocation();
    const navigate = useNavigate();
    const { result } = location.state || {};

    if (!result) {
        return (
            <Box textAlign="center" py={8}>
                <Typography variant="h5" gutterBottom>
                    No optimization results found
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                    Please run an optimization first
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<BackIcon />}
                    onClick={() => navigate('/optimize')}
                >
                    Go to Optimize
                </Button>
            </Box>
        );
    }

    const { schedule, metrics, baseline } = result;
    const carbonMetrics = metrics?.carbon || {};
    const costMetrics = metrics?.cost || {};
    const renewableMetrics = metrics?.renewable || {};
    const performanceMetrics = metrics?.performance || {};
    const distribution = metrics?.distribution || {};

    const distributionData = Object.entries(distribution).map(([dc, data]) => ({
        name: dc.replace('UK-', ''),
        tasks: data.count,
        carbon: data.total_carbon,
    }));

    const comparisonData = [
        {
            name: 'Optimized',
            carbon: carbonMetrics.total_carbon_optimized || 0,
            cost: costMetrics.total_cost || 0,
        },
        {
            name: 'Baseline',
            carbon: carbonMetrics.total_carbon_baseline || 0,
            cost: baseline?.summary?.total_cost || 0,
        },
    ];

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box>
                    <Typography variant="h4" gutterBottom>
                        Optimization Results
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                        <Chip label={`Algorithm: ${schedule?.algorithm_used?.toUpperCase()}`} color="primary" />
                        <Chip label={`${schedule?.summary?.tasks_scheduled || 0} tasks`} variant="outlined" />
                        <Chip label={`${performanceMetrics.execution_time_ms?.toFixed(1) || 0} ms`} variant="outlined" icon={<SpeedIcon />} />
                    </Box>
                </Box>
                <Box display="flex" gap={2}>
                    <Button variant="outlined" startIcon={<CompareIcon />} onClick={() => navigate('/compare')}>
                        Compare
                    </Button>
                    <Button variant="contained" startIcon={<BackIcon />} onClick={() => navigate('/optimize')}>
                        New Optimization
                    </Button>
                </Box>
            </Box>

            <Grid container spacing={3} mb={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ bgcolor: 'success.50', borderLeft: 4, borderColor: 'success.main' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={1}>
                                <SavingsIcon sx={{ color: 'success.main', mr: 1 }} />
                                <Typography variant="body2" color="text.secondary">Carbon Saved</Typography>
                            </Box>
                            <Typography variant="h4" fontWeight="bold" color="success.main">
                                {carbonMetrics.carbon_saved?.toFixed(0) || 0}
                            </Typography>
                            <Typography variant="body2">
                                gCO₂ ({carbonMetrics.percent_reduction?.toFixed(1) || 0}% reduction)
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={1}>
                                <LeafIcon sx={{ color: 'primary.main', mr: 1 }} />
                                <Typography variant="body2" color="text.secondary">Total Carbon</Typography>
                            </Box>
                            <Typography variant="h4" fontWeight="bold">
                                {carbonMetrics.total_carbon_optimized?.toFixed(0) || 0}
                            </Typography>
                            <Typography variant="body2">gCO₂</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={1}>
                                <CostIcon sx={{ color: 'secondary.main', mr: 1 }} />
                                <Typography variant="body2" color="text.secondary">Total Cost</Typography>
                            </Box>
                            <Typography variant="h4" fontWeight="bold">
                                ${costMetrics.total_cost?.toFixed(2) || '0.00'}
                            </Typography>
                            <Typography variant="body2">${costMetrics.cost_per_task?.toFixed(2) || '0.00'}/task</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={1}>
                                <LeafIcon sx={{ color: 'success.main', mr: 1 }} />
                                <Typography variant="body2" color="text.secondary">Renewable Energy</Typography>
                            </Box>
                            <Typography variant="h4" fontWeight="bold" color="success.main">
                                {renewableMetrics.avg_renewable?.toFixed(0) || 0}%
                            </Typography>
                            <Typography variant="body2">{renewableMetrics.tasks_on_green_dc || 0} tasks on green DCs</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="bold">Environmental Impact Equivalent</Typography>
                <Box display="flex" gap={4} mt={1} flexWrap="wrap">
                    <Box display="flex" alignItems="center" gap={1}>
                        <TreeIcon />
                        <Typography variant="body2">{carbonMetrics.trees_equivalent?.toFixed(4) || 0} trees/year</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                        <CarIcon />
                        <Typography variant="body2">{carbonMetrics.miles_driven_saved?.toFixed(1) || 0} miles saved</Typography>
                    </Box>
                </Box>
            </Alert>

            <Grid container spacing={3} mb={3}>
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Optimized vs Baseline</Typography>
                            <Box height={300}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={comparisonData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="carbon" name="Carbon (gCO₂)" fill="#4caf50" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Task Distribution</Typography>
                            <Box height={300}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={distributionData}
                                            dataKey="tasks"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            label={({ name, tasks }) => `${name}: ${tasks}`}
                                        >
                                            {distributionData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>Schedule Details</Typography>
                    <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 400 }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Workload ID</TableCell>
                                    <TableCell>Datacenter</TableCell>
                                    <TableCell>Start Time</TableCell>
                                    <TableCell>End Time</TableCell>
                                    <TableCell align="right">Carbon (gCO₂)</TableCell>
                                    <TableCell align="right">Cost ($)</TableCell>
                                    <TableCell align="right">Renewable %</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {schedule?.assignments?.slice(0, 50).map((assignment, index) => (
                                    <TableRow key={index} hover>
                                        <TableCell>{assignment.workload_id}</TableCell>
                                        <TableCell>
                                            <Chip label={assignment.datacenter_id} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell>{new Date(assignment.start_time).toLocaleTimeString()}</TableCell>
                                        <TableCell>{new Date(assignment.end_time).toLocaleTimeString()}</TableCell>
                                        <TableCell align="right">{assignment.carbon_emissions?.toFixed(1)}</TableCell>
                                        <TableCell align="right">${assignment.cost?.toFixed(2)}</TableCell>
                                        <TableCell align="right">
                                            <Chip
                                                label={`${assignment.renewable_percentage?.toFixed(0)}%`}
                                                size="small"
                                                color={assignment.renewable_percentage > 50 ? 'success' : 'default'}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    {schedule?.assignments?.length > 50 && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Showing first 50 of {schedule.assignments.length} assignments
                        </Typography>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
}

export default Results;