// File: frontend/src/components/Compare/Compare.jsx

import React, { useState } from 'react';
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    Button,
    Slider,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    FormControlLabel,
    Checkbox,
} from '@mui/material';
import {
    CompareArrows as CompareIcon,
    EmojiEvents as TrophyIcon,
    Speed as SpeedIcon,
} from '@mui/icons-material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    Cell,
} from 'recharts';
import carbonAPI from '../../services/api';

const allAlgorithms = [
    { value: 'greedy', label: 'Greedy', color: '#4caf50' },
    { value: 'dp', label: 'Dynamic Programming', color: '#2196f3' },
    { value: 'fcfs', label: 'FCFS', color: '#ff9800' },
    { value: 'round_robin', label: 'Round Robin', color: '#9c27b0' },
];

function Compare() {
    const [workloadCount, setWorkloadCount] = useState(100);
    const [selectedAlgorithms, setSelectedAlgorithms] = useState(['greedy', 'dp', 'fcfs', 'round_robin']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [results, setResults] = useState(null);

    const toggleAlgorithm = (algo) => {
        if (selectedAlgorithms.includes(algo)) {
            if (selectedAlgorithms.length > 1) {
                setSelectedAlgorithms(selectedAlgorithms.filter(a => a !== algo));
            }
        } else {
            setSelectedAlgorithms([...selectedAlgorithms, algo]);
        }
    };

    const runComparison = async () => {
        setLoading(true);
        setError(null);

        try {
            // Generate workloads
            const simResponse = await carbonAPI.simulate(workloadCount);
            const workloads = simResponse.workloads;

            // Compare algorithms
            const compareResponse = await carbonAPI.compare(workloads, selectedAlgorithms);
            setResults(compareResponse);
        } catch (err) {
            setError(err.response?.data?.error || 'Comparison failed. Check backend connection.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Prepare chart data
    const chartData = results
        ? Object.entries(results.results).map(([algo, data]) => ({
            name: allAlgorithms.find(a => a.value === algo)?.label || algo,
            carbon: data.total_carbon,
            cost: data.total_cost,
            time: data.execution_time_ms,
            tasks: data.tasks_scheduled,
            algo: algo,
        }))
        : [];

    // Normalize data for radar chart
    const getRadarData = () => {
        if (!results) return [];

        const entries = Object.entries(results.results);
        const maxCarbon = Math.max(...entries.map(([, d]) => d.total_carbon));
        const maxCost = Math.max(...entries.map(([, d]) => d.total_cost));
        const maxTime = Math.max(...entries.map(([, d]) => d.execution_time_ms));

        return [
            {
                metric: 'Carbon Efficiency',
                ...Object.fromEntries(entries.map(([algo, data]) => [
                    algo,
                    Math.round((1 - data.total_carbon / maxCarbon) * 100)
                ]))
            },
            {
                metric: 'Cost Efficiency',
                ...Object.fromEntries(entries.map(([algo, data]) => [
                    algo,
                    Math.round((1 - data.total_cost / maxCost) * 100)
                ]))
            },
            {
                metric: 'Speed',
                ...Object.fromEntries(entries.map(([algo, data]) => [
                    algo,
                    Math.round((1 - data.execution_time_ms / maxTime) * 100)
                ]))
            },
            {
                metric: 'Task Completion',
                ...Object.fromEntries(entries.map(([algo, data]) => [
                    algo,
                    Math.round((data.tasks_scheduled / workloadCount) * 100)
                ]))
            },
        ];
    };

    return (
        <Box>
            {/* Header */}
            <Typography variant="h4" gutterBottom>
                Algorithm Comparison
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
                Compare different scheduling algorithms on the same workload
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* Configuration */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <Typography gutterBottom>Number of Workloads: {workloadCount}</Typography>
                            <Slider
                                value={workloadCount}
                                onChange={(e, val) => setWorkloadCount(val)}
                                min={10}
                                max={500}
                                step={10}
                                valueLabelDisplay="auto"
                            />
                        </Grid>
                        <Grid item xs={12} md={5}>
                            <Typography gutterBottom>Algorithms to Compare:</Typography>
                            <Box display="flex" flexWrap="wrap" gap={1}>
                                {allAlgorithms.map((algo) => (
                                    <FormControlLabel
                                        key={algo.value}
                                        control={
                                            <Checkbox
                                                checked={selectedAlgorithms.includes(algo.value)}
                                                onChange={() => toggleAlgorithm(algo.value)}
                                                sx={{ color: algo.color, '&.Mui-checked': { color: algo.color } }}
                                            />
                                        }
                                        label={algo.label}
                                    />
                                ))}
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <Button
                                variant="contained"
                                size="large"
                                fullWidth
                                onClick={runComparison}
                                disabled={loading || selectedAlgorithms.length === 0}
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CompareIcon />}
                            >
                                {loading ? 'Running...' : 'Run Comparison'}
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Results */}
            {results && (
                <>
                    {/* Winner Banner */}
                    <Alert
                        severity="success"
                        icon={<TrophyIcon />}
                        sx={{ mb: 3 }}
                    >
                        <Typography variant="subtitle1" fontWeight="bold">
                            Best Algorithm: {allAlgorithms.find(a => a.value === results.best_algorithm)?.label}
                        </Typography>
                        <Typography variant="body2">
                            Achieved the lowest carbon emissions for {results.workload_count} workloads
                        </Typography>
                    </Alert>

                    {/* Results Table */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Comparison Results
                            </Typography>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Algorithm</TableCell>
                                            <TableCell align="right">Carbon (gCO₂)</TableCell>
                                            <TableCell align="right">Cost ($)</TableCell>
                                            <TableCell align="right">Execution Time</TableCell>
                                            <TableCell align="right">Tasks Scheduled</TableCell>
                                            <TableCell align="center">Rank</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {chartData
                                            .sort((a, b) => a.carbon - b.carbon)
                                            .map((row, index) => (
                                                <TableRow
                                                    key={row.algo}
                                                    sx={{
                                                        bgcolor: index === 0 ? 'success.50' : 'inherit',
                                                    }}
                                                >
                                                    <TableCell>
                                                        <Box display="flex" alignItems="center" gap={1}>
                                                            {index === 0 && <TrophyIcon sx={{ color: 'gold' }} />}
                                                            <Typography fontWeight={index === 0 ? 'bold' : 'normal'}>
                                                                {row.name}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography fontWeight={index === 0 ? 'bold' : 'normal'}>
                                                            {row.carbon.toFixed(0)}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">${row.cost.toFixed(2)}</TableCell>
                                                    <TableCell align="right">
                                                        <Chip
                                                            label={`${row.time.toFixed(1)} ms`}
                                                            size="small"
                                                            icon={<SpeedIcon />}
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell align="right">{row.tasks}</TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            label={`#${index + 1}`}
                                                            size="small"
                                                            color={index === 0 ? 'success' : 'default'}
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>

                    {/* Charts */}
                    <Grid container spacing={3}>
                        {/* Bar Chart */}
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Carbon Emissions Comparison
                                    </Typography>
                                    <Box height={350}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <Tooltip />
                                                <Bar
                                                    dataKey="carbon"
                                                    name="Carbon (gCO₂)"
                                                    radius={[4, 4, 0, 0]}
                                                >
                                                    {chartData.map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={allAlgorithms.find(a => a.value === entry.algo)?.color || '#888'}
                                                        />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Radar Chart */}
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Performance Radar
                                    </Typography>
                                    <Box height={350}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <RadarChart data={getRadarData()}>
                                                <PolarGrid />
                                                <PolarAngleAxis dataKey="metric" />
                                                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                                {selectedAlgorithms.map((algo) => (
                                                    <Radar
                                                        key={algo}
                                                        name={allAlgorithms.find(a => a.value === algo)?.label}
                                                        dataKey={algo}
                                                        stroke={allAlgorithms.find(a => a.value === algo)?.color}
                                                        fill={allAlgorithms.find(a => a.value === algo)?.color}
                                                        fillOpacity={0.2}
                                                    />
                                                ))}
                                                <Legend />
                                                <Tooltip />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Execution Time Chart */}
                        <Grid item xs={12}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Execution Time Comparison
                                    </Typography>
                                    <Box height={250}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis type="number" unit=" ms" />
                                                <YAxis dataKey="name" type="category" width={150} />
                                                <Tooltip formatter={(value) => [`${value.toFixed(2)} ms`, 'Execution Time']} />
                                                <Bar
                                                    dataKey="time"
                                                    name="Time (ms)"
                                                    radius={[0, 4, 4, 0]}
                                                >
                                                    {chartData.map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={allAlgorithms.find(a => a.value === entry.algo)?.color || '#888'}
                                                        />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </>
            )}

            {/* Empty State */}
            {!results && !loading && (
                <Card>
                    <CardContent sx={{ textAlign: 'center', py: 8 }}>
                        <CompareIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            Ready to Compare
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Configure the settings above and click "Run Comparison" to see how different algorithms perform
                        </Typography>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
}

export default Compare;