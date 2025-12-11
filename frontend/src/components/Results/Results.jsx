// File: frontend/src/components/Results/Results.jsx

import React, { useMemo } from 'react';
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
    Container,
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
    ScatterChart,
    Scatter,
    ZAxis,
} from 'recharts';

const COLORS = ['#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#f44336', '#00bcd4'];

const DC_COLORS = {
    'UK-Scotland': '#4caf50',
    'UK-North': '#8bc34a',
    'UK-Wales': '#cddc39',
    'UK-Midlands': '#ffeb3b',
    'UK-East': '#ff9800',
    'UK-South': '#f44336',
};

function Results() {
    const location = useLocation();
    const navigate = useNavigate();
    const { result } = location.state || {};

    // Memoize schedule data transformation for timeline chart
    const { scheduleData, uniqueDCs } = useMemo(() => {
        if (!result?.schedule?.assignments || result.schedule.assignments.length === 0) {
            return { scheduleData: [], uniqueDCs: [] };
        }

        const assignments = result.schedule.assignments;

        // Get unique datacenters from actual assignments
        const uniqueDCs = [...new Set(assignments.map(a => a.datacenter_id))].sort();

        // Create index mapping for Y-axis
        const dcIndexMap = {};
        uniqueDCs.forEach((dc, index) => {
            dcIndexMap[dc] = index;
        });

        // Transform assignments to scatter chart data
        const scheduleData = assignments.map((a, idx) => {
            const startTime = new Date(a.start_time);
            const endTime = new Date(a.end_time);
            const startHour = startTime.getHours() + startTime.getMinutes() / 60;

            return {
                x: startHour,
                y: dcIndexMap[a.datacenter_id],
                z: Math.max(a.carbon_emissions || 10, 10), // Minimum size for visibility
                dc: a.datacenter_id,
                workload: a.workload_id?.substring(0, 8) || `Task ${idx + 1}`,
                carbon: Math.round(a.carbon_emissions || 0),
                duration: ((endTime - startTime) / 3600000).toFixed(1),
                cost: (a.cost || 0).toFixed(3),
            };
        });

        return { scheduleData, uniqueDCs };
    }, [result]);

    if (!result) {
        return (
            <Container maxWidth="lg">
                <Box textAlign="center" py={8}>
                    <Typography variant="h5" gutterBottom>No optimization results found</Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                        Please run an optimization first
                    </Typography>
                    <Button variant="contained" startIcon={<BackIcon />} onClick={() => navigate('/optimize')}>
                        Go to Optimize
                    </Button>
                </Box>
            </Container>
        );
    }

    const { schedule, metrics, baseline } = result;
    const carbonMetrics = metrics?.carbon || {};
    const costMetrics = metrics?.cost || {};
    const renewableMetrics = metrics?.renewable || {};
    const performanceMetrics = metrics?.performance || {};
    const distribution = metrics?.distribution || {};

    // Prepare distribution data
    const distributionData = Object.entries(distribution).map(([dc, data]) => ({
        name: dc.replace('UK-', ''),
        fullName: dc,
        tasks: data.count,
        carbon: Math.round(data.total_carbon),
    }));

    // Prepare comparison data
    const comparisonData = [
        { name: 'Optimized', carbon: Math.round(carbonMetrics.total_carbon_optimized || 0), fill: '#4caf50' },
        { name: 'Baseline (FCFS)', carbon: Math.round(carbonMetrics.total_carbon_baseline || 0), fill: '#ff9800' },
    ];

    // Custom tooltip for scatter chart
    const ScatterTooltip = ({ active, payload }) => {
        if (active && payload && payload.length > 0) {
            const data = payload[0].payload;
            return (
                <Paper sx={{ p: 1.5, boxShadow: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                        Task: {data.workload}
                    </Typography>
                    <Typography variant="body2">Datacenter: {data.dc}</Typography>
                    <Typography variant="body2">Carbon: {data.carbon} gCO₂</Typography>
                    <Typography variant="body2">Duration: {data.duration}h</Typography>
                    <Typography variant="body2">Cost: ${data.cost}</Typography>
                </Paper>
            );
        }
        return null;
    };

    return (
        <Container maxWidth={false}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Box>
                    <Typography variant="h4" gutterBottom>Optimization Results</Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                        <Chip label={`Algorithm: ${schedule?.algorithm_used?.toUpperCase()}`} color="primary" />
                        <Chip label={`${schedule?.summary?.tasks_scheduled || 0} tasks`} variant="outlined" />
                        <Chip label={`${performanceMetrics.execution_time_ms?.toFixed(1) || 0} ms`} variant="outlined" icon={<SpeedIcon />} />
                    </Box>
                </Box>
                <Box display="flex" gap={2}>
                    <Button variant="outlined" startIcon={<CompareIcon />} onClick={() => navigate('/compare')}>Compare</Button>
                    <Button variant="contained" startIcon={<BackIcon />} onClick={() => navigate('/optimize')}>New Optimization</Button>
                </Box>
            </Box>

            {/* Metrics Cards - Full Width Grid */}
            <Grid container spacing={2} mb={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%', bgcolor: 'success.50', borderLeft: 4, borderColor: 'success.main' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={1}>
                                <SavingsIcon sx={{ color: 'success.main', mr: 1 }} />
                                <Typography variant="body2" color="text.secondary">Carbon Saved</Typography>
                            </Box>
                            <Typography variant="h4" fontWeight="bold" color="success.main">
                                {Math.round(carbonMetrics.carbon_saved || 0).toLocaleString()}
                            </Typography>
                            <Typography variant="body2">gCO₂ ({carbonMetrics.percent_reduction?.toFixed(1) || 0}% reduction)</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={1}>
                                <LeafIcon sx={{ color: 'primary.main', mr: 1 }} />
                                <Typography variant="body2" color="text.secondary">Total Carbon</Typography>
                            </Box>
                            <Typography variant="h4" fontWeight="bold">
                                {Math.round(carbonMetrics.total_carbon_optimized || 0).toLocaleString()}
                            </Typography>
                            <Typography variant="body2">gCO₂</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" mb={1}>
                                <CostIcon sx={{ color: 'secondary.main', mr: 1 }} />
                                <Typography variant="body2" color="text.secondary">Total Cost</Typography>
                            </Box>
                            <Typography variant="h4" fontWeight="bold">
                                ${costMetrics.total_cost?.toFixed(2) || '0.00'}
                            </Typography>
                            <Typography variant="body2">${costMetrics.cost_per_task?.toFixed(3) || '0.00'}/task</Typography>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ height: '100%' }}>
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

            {/* Environmental Impact */}
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

            {/* Charts Row 1 */}
            <Grid container spacing={3} mb={3}>
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: 400 }}>
                        <CardContent sx={{ height: '100%' }}>
                            <Typography variant="h6" gutterBottom>Optimized vs Baseline</Typography>
                            <Box height="calc(100% - 40px)">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={comparisonData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="name" type="category" width={120} />
                                        <Tooltip formatter={(value) => [`${value.toLocaleString()} gCO₂`, 'Carbon']} />
                                        <Bar dataKey="carbon" radius={[0, 4, 4, 0]} barSize={60}>
                                            {comparisonData.map((entry, index) => (
                                                <Cell key={index} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card sx={{ height: 400 }}>
                        <CardContent sx={{ height: '100%' }}>
                            <Typography variant="h6" gutterBottom>Task Distribution by Datacenter</Typography>
                            <Box height="calc(100% - 40px)">
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
                                                <Cell key={index} fill={DC_COLORS[entry.fullName] || COLORS[index % COLORS.length]} />
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

            {/* Schedule Timeline Chart - FIXED */}
            {scheduleData.length > 0 && (
                <Card sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>Workload Schedule Timeline</Typography>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            Each dot represents a task. Position shows datacenter and start time. Size indicates carbon emissions.
                        </Typography>

                        {/* Legend */}
                        <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
                            {uniqueDCs.map(dc => (
                                <Box key={dc} display="flex" alignItems="center" gap={0.5}>
                                    <Box
                                        sx={{
                                            width: 12,
                                            height: 12,
                                            borderRadius: '50%',
                                            backgroundColor: DC_COLORS[dc] || '#4caf50'
                                        }}
                                    />
                                    <Typography variant="caption">{dc.replace('UK-', '')}</Typography>
                                </Box>
                            ))}
                        </Box>

                        <Box height={350}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 100 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                    <XAxis
                                        type="number"
                                        dataKey="x"
                                        name="Hour"
                                        domain={[0, 24]}
                                        ticks={[0, 4, 8, 12, 16, 20, 24]}
                                        tickFormatter={(value) => `${value}:00`}
                                        label={{
                                            value: 'Time of Day',
                                            position: 'bottom',
                                            offset: 20
                                        }}
                                    />
                                    <YAxis
                                        type="number"
                                        dataKey="y"
                                        name="Datacenter"
                                        domain={[-0.5, Math.max(uniqueDCs.length - 0.5, 0.5)]}
                                        ticks={uniqueDCs.map((_, i) => i)}
                                        tickFormatter={(value) => {
                                            const index = Math.round(value);
                                            return uniqueDCs[index]?.replace('UK-', '') || '';
                                        }}
                                        label={{
                                            value: 'Datacenter',
                                            angle: -90,
                                            position: 'insideLeft',
                                            offset: -10
                                        }}
                                        width={80}
                                    />
                                    <ZAxis
                                        type="number"
                                        dataKey="z"
                                        range={[50, 500]}
                                        name="Carbon"
                                    />
                                    <Tooltip content={<ScatterTooltip />} />
                                    <Scatter data={scheduleData} fill="#4caf50">
                                        {scheduleData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={DC_COLORS[entry.dc] || '#4caf50'}
                                                fillOpacity={0.7}
                                            />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        </Box>
                    </CardContent>
                </Card>
            )}

            {/* Carbon by Datacenter Bar Chart */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>Carbon Emissions by Datacenter</Typography>
                    <Box height={250}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={distributionData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value) => [`${value.toLocaleString()} gCO₂`, 'Carbon']} />
                                <Bar dataKey="carbon" radius={[4, 4, 0, 0]}>
                                    {distributionData.map((entry, index) => (
                                        <Cell key={index} fill={DC_COLORS[entry.fullName] || COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                </CardContent>
            </Card>

            {/* Schedule Table */}
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
                                {schedule?.assignments?.slice(0, 100).map((assignment, index) => (
                                    <TableRow key={index} hover>
                                        <TableCell>{assignment.workload_id}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={assignment.datacenter_id.replace('UK-', '')}
                                                size="small"
                                                sx={{ bgcolor: DC_COLORS[assignment.datacenter_id], color: 'white' }}
                                            />
                                        </TableCell>
                                        <TableCell>{new Date(assignment.start_time).toLocaleTimeString()}</TableCell>
                                        <TableCell>{new Date(assignment.end_time).toLocaleTimeString()}</TableCell>
                                        <TableCell align="right">{assignment.carbon_emissions?.toFixed(1)}</TableCell>
                                        <TableCell align="right">${assignment.cost?.toFixed(3)}</TableCell>
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
                    {schedule?.assignments?.length > 100 && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            Showing first 100 of {schedule.assignments.length} assignments
                        </Typography>
                    )}
                </CardContent>
            </Card>
        </Container>
    );
}

export default Results;