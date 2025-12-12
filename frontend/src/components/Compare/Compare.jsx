

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
    'UK-North': '#3778cdff',
    'UK-Wales': '#d47257ff',
    'UK-Midlands': '#d39f26ff',
    'UK-East': '#7ac5daff',
    'UK-South': '#4dba4bff',
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

    
    const getDistributionData = (algo) => {
        if (!results?.results?.[algo]?.distribution) return [];
        return Object.entries(results.results[algo].distribution).map(([dc, count]) => ({
            name: dc.replace('UK-', ''),
            fullName: dc,
            count,
        }));
    };

    return (
        <Container maxWidth={false}>
            {}
            <Typography variant="h4" gutterBottom>Algorithm Comparison</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
                Compare scheduling algorithms on the same workload to see which minimizes carbon emissions
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>
            )}

            {}
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

            {}
            {results && (
                <>
                    {}
                    <Alert severity="success" icon={<TrophyIcon />} sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" fontWeight="bold">
                            Best Algorithm: {allAlgorithms.find(a => a.value === results.best_algorithm)?.label}
                        </Typography>
                        <Typography variant="body2">
                            Achieved lowest carbon emissions ({Math.round(results.results[results.best_algorithm]?.total_carbon).toLocaleString()} gCO₂) for {results.workload_count} workloads
                        </Typography>
                    </Alert>

                    {}
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

                    {}
                    <Grid container spacing={15} mb={3}>
                        {}
                        <Grid item xs={12} md={8}>
                            <Card sx={{ height: 400, width: 800 }}>
                                <CardContent sx={{ height: '100%' }}>
                                    <Typography variant="h6" gutterBottom>Carbon Emissions Comparison</Typography>
                                    <Box height="calc(100% - 40px)">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis type="number" />
                                                <YAxis dataKey="name" type="category" width={100} />
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

                        {}
                        <Grid item xs={12} md={4}>
                            <Card sx={{ height: 400, width: 500 }}>
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

                    {}
                    {}
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Datacenter Distribution by Algorithm
                            </Typography>
                            <Typography variant="body2" color="text.secondary" mb={3}>
                                Shows how each algorithm distributes tasks across datacenters
                            </Typography>

                            {}
                            <Box display="flex" justifyContent="center" flexWrap="wrap" gap={6} mb={3}>
                                {Object.entries(DC_COLORS).map(([dc, color]) => (
                                    <Box key={dc} display="flex" alignItems="center" gap={1}>
                                        <Box
                                            sx={{
                                                width: 14,
                                                height: 14,
                                                borderRadius: '50%',
                                                backgroundColor: color,
                                                border: '1px solid #ddd'
                                            }}
                                        />
                                        <Typography variant="caption" fontWeight="medium">
                                            {dc.replace('UK-', '')}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>

                            {}
                            <Grid container spacing={5} justifyContent="space-around">
                                {selectedAlgorithms.map((algo) => {
                                    const distData = getDistributionData(algo);
                                    const algoInfo = allAlgorithms.find(a => a.value === algo);
                                    const totalTasks = distData.reduce((sum, d) => sum + d.count, 0);

                                    return (
                                        <Grid item xs={12} md={4} key={algo}>
                                            <Paper
                                                elevation={10}
                                                sx={{
                                                    p: 6,
                                                    height: '100%',
                                                    width: '100%',
                                                    border: '2px solid',
                                                    borderColor: algoInfo?.color || 'grey.300',
                                                    borderRadius: 8,
                                                    backgroundColor: 'background.paper'
                                                }}
                                            >
                                                {}
                                                <Box textAlign="center" mb={2}>
                                                    <Chip
                                                        label={algoInfo?.label}
                                                        sx={{
                                                            bgcolor: algoInfo?.color,
                                                            color: 'white',
                                                            fontWeight: 'bold',
                                                            fontSize: '0.9rem',
                                                            px: 2,
                                                            py: 0.5
                                                        }}
                                                    />
                                                    <Typography variant="caption" display="block" color="text.secondary" mt={1}>
                                                        {totalTasks} tasks scheduled
                                                    </Typography>
                                                </Box>

                                                {}
                                                <Box height={220} width={250}>
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie
                                                                data={distData}
                                                                dataKey="count"
                                                                nameKey="name"
                                                                cx="50%"
                                                                cy="50%"
                                                                innerRadius={30}
                                                                outerRadius={70}
                                                                paddingAngle={2}
                                                                labelLine={'False'}
                                                            >
                                                                {distData.map((entry, index) => (
                                                                    <Cell
                                                                        key={index}
                                                                        fill={DC_COLORS[entry.fullName] || '#888'}
                                                                        stroke="#fff"
                                                                        strokeWidth={2}
                                                                    />
                                                                ))}
                                                            </Pie>
                                                            <Tooltip
                                                                formatter={(value, name) => [`${value} tasks`, name]}
                                                                contentStyle={{
                                                                    backgroundColor: 'rgba(255,255,255,0.95)',
                                                                    borderRadius: 8,
                                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                                                }}
                                                            />
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                </Box>

                                                {}
                                                <Box mt={2}>
                                                    {distData
                                                        .sort((a, b) => b.count - a.count)
                                                        .map((entry, idx) => (
                                                            <Box
                                                                key={idx}
                                                                display="flex"
                                                                justifyContent="space-between"
                                                                alignItems="center"
                                                                py={0.5}
                                                                px={1}
                                                                sx={{
                                                                    borderRadius: 1,
                                                                    '&:hover': { bgcolor: 'action.hover' }
                                                                }}
                                                            >
                                                                <Box display="flex" alignItems="center" gap={1}>
                                                                    <Box
                                                                        sx={{
                                                                            width: 10,
                                                                            height: 10,
                                                                            borderRadius: '50%',
                                                                            bgcolor: DC_COLORS[entry.fullName] || '#888'
                                                                        }}
                                                                    />
                                                                    <Typography variant="body2">
                                                                        {entry.name}
                                                                    </Typography>
                                                                </Box>
                                                                <Typography variant="body2" fontWeight="medium">
                                                                    {entry.count} ({((entry.count / totalTasks) * 100).toFixed(0)}%)
                                                                </Typography>
                                                            </Box>
                                                        ))}
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        </CardContent>
                    </Card>
                </>
            )}

            {}
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