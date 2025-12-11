// File: frontend/src/components/Optimize/Optimize.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Box,
    TextField,
    Button,
    Slider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Alert,
    CircularProgress,
    Divider,
    Switch,
    FormControlLabel,
    Paper,
    IconButton,
    Container,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    PlayArrow as RunIcon,
    Memory as CpuIcon,
    Storage as MemoryIcon,
    Schedule as DurationIcon,
} from '@mui/icons-material';
import carbonAPI from '../../services/api';

const algorithms = [
    { value: 'greedy', label: 'Greedy', description: 'Picks datacenter with lowest carbon intensity', complexity: 'O(n·d·log d)' },
    { value: 'dp', label: 'Dynamic Programming', description: 'Considers future carbon forecasts for optimal scheduling', complexity: 'O(n·T·d)' },
    { value: 'fcfs', label: 'FCFS (Baseline)', description: 'First-come first-serve, ignores carbon intensity', complexity: 'O(n·d)' },
];

function Optimize() {
    const navigate = useNavigate();
    const [workloads, setWorkloads] = useState([
        { cpu: 4, memory: 8, duration: 2, priority: 5 }
    ]);
    const [algorithm, setAlgorithm] = useState('greedy');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [useSimulation, setUseSimulation] = useState(false);
    const [simulationCount, setSimulationCount] = useState(50);

    const addWorkload = () => {
        setWorkloads([...workloads, { cpu: 2, memory: 4, duration: 1, priority: 5 }]);
    };

    const removeWorkload = (index) => {
        if (workloads.length > 1) {
            setWorkloads(workloads.filter((_, i) => i !== index));
        }
    };

    const updateWorkload = (index, field, value) => {
        const updated = [...workloads];
        updated[index][field] = value;
        setWorkloads(updated);
    };

    const runOptimization = async () => {
        setLoading(true);
        setError(null);

        try {
            let workloadsToOptimize = workloads;

            if (useSimulation) {
                const simResponse = await carbonAPI.simulate(simulationCount);
                workloadsToOptimize = simResponse.workloads;
            }

            const result = await carbonAPI.optimize(workloadsToOptimize, algorithm);
            navigate('/results', { state: { result, workloads: workloadsToOptimize } });
        } catch (err) {
            setError(err.response?.data?.error || 'Optimization failed. Check backend connection.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const selectedAlgo = algorithms.find(a => a.value === algorithm);

    return (
        <Container maxWidth="xl">
            <Typography variant="h4" gutterBottom>Optimize Workloads</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
                Configure your workloads and select an algorithm to minimize carbon emissions
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>
            )}

            <Grid container spacing={3}>
                {/* Workload Configuration */}
                <Grid item xs={12} lg={8}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                                <Typography variant="h6">Workload Configuration</Typography>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={useSimulation}
                                            onChange={(e) => setUseSimulation(e.target.checked)}
                                            color="primary"
                                        />
                                    }
                                    label="Use Simulation"
                                />
                            </Box>

                            {useSimulation ? (
                                <Box>
                                    <Alert severity="info" sx={{ mb: 3 }}>
                                        Generate random workloads to test the optimizer with realistic data
                                    </Alert>
                                    <Box sx={{ px: 2 }}>
                                        <Typography gutterBottom fontWeight="bold">
                                            Number of workloads: {simulationCount}
                                        </Typography>
                                        <Slider
                                            value={simulationCount}
                                            onChange={(e, val) => setSimulationCount(val)}
                                            min={10}
                                            max={200}
                                            step={10}
                                            valueLabelDisplay="auto"
                                            marks={[
                                                { value: 10, label: '10' },
                                                { value: 50, label: '50' },
                                                { value: 100, label: '100' },
                                                { value: 200, label: '200' },
                                            ]}
                                        />
                                    </Box>
                                </Box>
                            ) : (
                                <Box>
                                    {workloads.map((workload, index) => (
                                        <Paper key={index} elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                                <Typography variant="subtitle2" fontWeight="bold">Workload {index + 1}</Typography>
                                                {workloads.length > 1 && (
                                                    <IconButton size="small" onClick={() => removeWorkload(index)} color="error">
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                )}
                                            </Box>
                                            <Grid container spacing={2}>
                                                <Grid item xs={6} sm={3}>
                                                    <TextField
                                                        fullWidth
                                                        label="CPU Cores"
                                                        type="number"
                                                        size="small"
                                                        value={workload.cpu}
                                                        onChange={(e) => updateWorkload(index, 'cpu', parseFloat(e.target.value) || 0)}
                                                        InputProps={{
                                                            startAdornment: <CpuIcon sx={{ mr: 1, color: 'grey.500', fontSize: 18 }} />,
                                                            inputProps: { min: 0.5, max: 64, step: 0.5 }
                                                        }}
                                                    />
                                                </Grid>
                                                <Grid item xs={6} sm={3}>
                                                    <TextField
                                                        fullWidth
                                                        label="Memory (GB)"
                                                        type="number"
                                                        size="small"
                                                        value={workload.memory}
                                                        onChange={(e) => updateWorkload(index, 'memory', parseFloat(e.target.value) || 0)}
                                                        InputProps={{
                                                            startAdornment: <MemoryIcon sx={{ mr: 1, color: 'grey.500', fontSize: 18 }} />,
                                                            inputProps: { min: 0.5, max: 256, step: 0.5 }
                                                        }}
                                                    />
                                                </Grid>
                                                <Grid item xs={6} sm={3}>
                                                    <TextField
                                                        fullWidth
                                                        label="Duration (hrs)"
                                                        type="number"
                                                        size="small"
                                                        value={workload.duration}
                                                        onChange={(e) => updateWorkload(index, 'duration', parseFloat(e.target.value) || 0)}
                                                        InputProps={{
                                                            startAdornment: <DurationIcon sx={{ mr: 1, color: 'grey.500', fontSize: 18 }} />,
                                                            inputProps: { min: 0.25, max: 24, step: 0.25 }
                                                        }}
                                                    />
                                                </Grid>
                                                <Grid item xs={6} sm={3}>
                                                    <TextField
                                                        fullWidth
                                                        label="Priority (1-10)"
                                                        type="number"
                                                        size="small"
                                                        value={workload.priority}
                                                        onChange={(e) => updateWorkload(index, 'priority', parseInt(e.target.value) || 1)}
                                                        InputProps={{ inputProps: { min: 1, max: 10 } }}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Paper>
                                    ))}
                                    <Button startIcon={<AddIcon />} onClick={addWorkload} variant="outlined" fullWidth>
                                        Add Workload
                                    </Button>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Algorithm Selection */}
                <Grid item xs={12} lg={4}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Algorithm Selection</Typography>

                            <FormControl fullWidth sx={{ mb: 3 }}>
                                <InputLabel>Algorithm</InputLabel>
                                <Select value={algorithm} onChange={(e) => setAlgorithm(e.target.value)} label="Algorithm">
                                    {algorithms.map((algo) => (
                                        <MenuItem key={algo.value} value={algo.value}>
                                            <Box>
                                                <Typography variant="body1">{algo.label}</Typography>
                                                <Typography variant="caption" color="text.secondary">{algo.description}</Typography>
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {selectedAlgo && (
                                <Paper elevation={0} sx={{ p: 2, bgcolor: 'success.50', borderRadius: 2, border: '1px solid', borderColor: 'success.200', mb: 3 }}>
                                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>{selectedAlgo.label}</Typography>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>{selectedAlgo.description}</Typography>
                                    <Chip label={`Complexity: ${selectedAlgo.complexity}`} size="small" color="primary" variant="outlined" />
                                </Paper>
                            )}

                            <Divider sx={{ my: 3 }} />

                            <Typography variant="subtitle2" gutterBottom fontWeight="bold">Summary</Typography>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Workloads: <strong>{useSimulation ? simulationCount : workloads.length}</strong>
                                </Typography>
                                {!useSimulation && (
                                    <>
                                        <Typography variant="body2" color="text.secondary">
                                            Total CPU: <strong>{workloads.reduce((acc, w) => acc + w.cpu, 0)} cores</strong>
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Total Memory: <strong>{workloads.reduce((acc, w) => acc + w.memory, 0)} GB</strong>
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Total Duration: <strong>{workloads.reduce((acc, w) => acc + w.duration, 0)} hours</strong>
                                        </Typography>
                                    </>
                                )}
                            </Box>

                            <Button
                                variant="contained"
                                size="large"
                                fullWidth
                                onClick={runOptimization}
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <RunIcon />}
                                sx={{ py: 1.5 }}
                            >
                                {loading ? 'Optimizing...' : 'Run Optimization'}
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Container>
    );
}

export default Optimize;