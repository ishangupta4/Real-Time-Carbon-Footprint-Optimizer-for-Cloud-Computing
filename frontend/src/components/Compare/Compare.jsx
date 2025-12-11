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
    Container,
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
    Cell,
    PieChart,
    Pie,
} from 'recharts';
import carbonAPI from '../../services/api';

const allAlgorithms = [
    { value: 'greedy', label: 'Greedy', color: '#4caf50', description: 'Picks lowest carbon DC' },
    { value: 'dp', label: 'Dynamic Programming', color: '#2196f3', description: 'Considers future forecasts' },
    { value: 'fcfs', label: 'FCFS (Baseline)', color: '#ff9800', description: 'First come first serve' },
];

const DC_COLORS = {
    'UK-Scotland': '#4caf50',
    'UK-North': '#8bc34a',
    'UK-Wales': '#cddc39',
    'UK-Midlands': '#ffeb3b',
    'UK-East': '#ff9800',
    'UK-South': '#f44336',
};

function Compare() {
    const [workloadCount, setWorkloadCount] = useState(50);
    const [selectedAlgorithms, setSelectedAlgorithms] = useState(['greedy', 'dp', 'fcfs']);
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
            const simResponse = await carbonAPI.simulate(workloadCount);
            const workloads = simResponse.workloads;
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
        ? Object.entries(results.results)
            .map(([algo, data]) => ({
                name: allAlgorithms.find(a => a.value === algo)?.label || algo,
                carbon: Math.round(data.total_carbon),
                cost: data.total_cost,
                time: data.execution_time_ms,
                tasks: data.tasks_scheduled,
                algo: algo,
                color: allAlgorithms.find(a => a.value === algo)?.color || '#888',
            }))
            .sort((a, b) => a.carbon - b.carbon)
        : [];

    // Prepare distribution comparison
    const getDistributionData = (algo) => {
        if (!results?.results?.[algo]?.distribution) return [];
        return Object.entries(results.results[algo].distribution).map(([dc, count]) => ({
            name: dc.replace('UK-', ''),
            fullName: dc,
            count,
        }));
    };

    return (
        <Container maxWidth="xl">
            {/* Header */}
            <Typography variant="h4" gutterBottom>Algorithm Comparison</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
                Compare scheduling algorithms on the same workload to see which minimizes carbon emissions
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>
            )}

            {/* Configuration */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <Typography gutterBottom fontWeight="bold">Number of Workloads: {workloadCount}</Typography>
                            <Slider
                                value={workloadCount}
                                onChange={(e, val) => setWorkloadCount(val)}
                                min={10}
                                max={200}
                                step={10}
                                valueLabelDisplay="auto"
                                marks={[
                                    { value: 10, label: '10' },
                                    { value: 100, label: '100' },
                                    { value: 200, label: '200' },
                                ]}
                            />
                        </Grid>
                        <Grid item xs={12} md={5}>
                            <Typography gutterBottom fontWeight="bold">Algorithms to Compare:</Typography>
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
                                        label={
                                            <Box>
                                                <Typography variant="body2">{algo.label}</Typography>
                                                <Typography variant="caption" color="text.secondary">{algo.description}</Typography>
                                            </Box>
                                        }
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
                                sx={{ py: 2 }}
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
                    <Alert severity="success" icon={<TrophyIcon />} sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                            Best Algorithm: {allAlgorithms.find(a => a.value === results.best_algorithm)?.label}
                        </Typography>
                        <Typography variant="body2">
                            Achieved lowest carbon emissions ({Math.round(results.results[results.best_algorithm]?.total_carbon).toLocaleString()} gCO₂) for {results.workload_count} workloads
                        </Typography>
                    </Alert>

                    {/* Results Table */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Comparison Results</Typography>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Rank</TableCell>
                                            <TableCell>Algorithm</TableCell>
                                            <TableCell align="right">Carbon (gCO₂)</TableCell>
                                            <TableCell align="right">vs Baseline</TableCell>
                                            <TableCell align="right">Cost ($)</TableCell>
                                            <TableCell align="right">Execution Time</TableCell>
                                            <TableCell align="right">Tasks</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {chartData.map((row, index) => {
                                            const baselineCarbon = results.results['fcfs']?.total_carbon || row.carbon;
                                            const savings = ((baselineCarbon - row.carbon) / baselineCarbon * 100);
                                            return (
                                                <TableRow key={row.algo} sx={{ bgcolor: index === 0 ? 'success.50' : 'inherit' }}>
                                                    <TableCell>
                                                        <Chip
                                                            icon={index === 0 ? <TrophyIcon /> : undefined}
                                                            label={`#${index + 1}`}
                                                            size="small"
                                                            color={index === 0 ? 'success' : 'default'}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box display="flex" alignItems="center" gap={1}>
                                                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: row.color }} />
                                                            <Typography fontWeight={index === 0 ? 'bold' : 'normal'}>{row.name}</Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Typography fontWeight={index === 0 ? 'bold' : 'normal'}>
                                                            {row.carbon.toLocaleString()}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {row.algo === 'fcfs' ? (
                                                            <Chip label="Baseline" size="small" variant="outlined" />
                                                        ) : (
                                                            <Chip
                                                                label={`${savings > 0 ? '-' : '+'}${Math.abs(savings).toFixed(1)}%`}
                                                                size="small"
                                                                color={savings > 0 ? 'success' : 'error'}
                                                            />
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="right">${row.cost.toFixed(2)}</TableCell>
                                                    <TableCell align="right">
                                                        <Chip label={`${row.time.toFixed(1)} ms`} size="small" icon={<SpeedIcon />} variant="outlined" />
                                                    </TableCell>
                                                    <TableCell align="right">{row.tasks}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>

                    {/* Charts */}
                    <Grid container spacing={3} mb={3}>
                        {/* Carbon Comparison Bar Chart */}
                        <Grid item xs={12} md={6}>
                            <Card sx={{ height: 400 }}>
                                <CardContent sx={{ height: '100%' }}>
                                    <Typography variant="h6" gutterBottom>Carbon Emissions Comparison</Typography>
                                    <Box height="calc(100% - 40px)">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis type="number" />
                                                <YAxis dataKey="name" type="category" width={150} />
                                                <Tooltip formatter={(value) => [`${value.toLocaleString()} gCO₂`, 'Carbon']} />
                                                <Bar dataKey="carbon" radius={[0, 4, 4, 0]}>
                                                    {chartData.map((entry, index) => (
                                                        <Cell key={index} fill={entry.color} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Execution Time Chart */}
                        <Grid item xs={12} md={6}>
                            <Card sx={{ height: 400 }}>
                                <CardContent sx={{ height: '100%' }}>
                                    <Typography variant="h6" gutterBottom>Execution Time Comparison</Typography>
                                    <Box height="calc(100% - 40px)">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <Tooltip formatter={(value) => [`${value.toFixed(2)} ms`, 'Time']} />
                                                <Bar dataKey="time" radius={[4, 4, 0, 0]}>
                                                    {chartData.map((entry, index) => (
                                                        <Cell key={index} fill={entry.color} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    {/* Distribution Comparison */}
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Datacenter Distribution by Algorithm</Typography>
                            <Typography variant="body2" color="text.secondary" mb={2}>
                                Shows how each algorithm distributes tasks across datacenters
                            </Typography>
                            <Grid container spacing={3}>
                                {selectedAlgorithms.map((algo) => {
                                    const distData = getDistributionData(algo);
                                    const algoInfo = allAlgorithms.find(a => a.value === algo);
                                    return (
                                        <Grid item xs={12} md={4} key={algo}>
                                            <Box textAlign="center" mb={1}>
                                                <Chip label={algoInfo?.label} sx={{ bgcolor: algoInfo?.color, color: 'white' }} />
                                            </Box>
                                            <Box height={250}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={distData}
                                                            dataKey="count"
                                                            nameKey="name"
                                                            cx="50%"
                                                            cy="50%"
                                                            outerRadius={80}
                                                            label={({ name, count }) => `${name}: ${count}`}
                                                        >
                                                            {distData.map((entry, index) => (
                                                                <Cell key={index} fill={DC_COLORS[entry.fullName] || '#888'} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </Box>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Empty State */}
            {!results && !loading && (
                <Card>
                    <CardContent sx={{ textAlign: 'center', py: 8 }}>
                        <CompareIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>Ready to Compare</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Configure settings above and click "Run Comparison" to see algorithm performance
                        </Typography>
                    </CardContent>
                </Card>
            )}
        </Container>
    );
}

export default Compare;