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
    { value: 'greedy', label: 'Greedy', description: 'Fast, assigns to lowest carbon DC', complexity: 'O(n·d·log d)' },
    { value: 'dp', label: 'Dynamic Programming', description: 'Optimal with time forecasts', complexity: 'O(n·T²·D²)' },
    { value: 'fcfs', label: 'FCFS (Baseline)', description: 'First-come first-serve', complexity: 'O(n·d)' },
    { value: 'round_robin', label: 'Round Robin (Baseline)', description: 'Even distribution', complexity: 'O(n)' },
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

    // Add new workload
    const addWorkload = () => {
        setWorkloads([...workloads, { cpu: 2, memory: 4, duration: 1, priority: 5 }]);
    };

    // Remove workload
    const removeWorkload = (index) => {
        if (workloads.length > 1) {
            setWorkloads(workloads.filter((_, i) => i !== index));
        }
    };

    // Update workload field
    const updateWorkload = (index, field, value) => {
        const updated = [...workloads];
        updated[index][field] = value;
        setWorkloads(updated);
    };

    // Run optimization
    const runOptimization = async () => {
        setLoading(true);
        setError(null);

        try {
            let workloadsToOptimize = workloads;

            // Generate simulated workloads if needed
            if (useSimulation) {
                const simResponse = await carbonAPI.simulate(simulationCount);
                workloadsToOptimize = simResponse.workloads;
            }

            // Run optimization
            const result = await carbonAPI.optimize(workloadsToOptimize, algorithm);

            // Navigate to results with data
            navigate('/results', { state: { result, workloads: workloadsToOptimize } });
        } catch (err) {
            setError(err.response?.data?.error || 'Optimization failed. Check backend connection.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Get selected algorithm details
    const selectedAlgo = algorithms.find(a => a.value === algorithm);

    return (
        <Box>
            {/* Header */}
            <Typography variant="h4" gutterBottom>
                Optimize Workloads
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
                Configure your workloads and select an algorithm to minimize carbon emissions
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            <Grid container spacing={3}>
                {/* Left Column - Workload Configuration */}
                <Grid item xs={12} md={7}>
                    <Card>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
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
                                // Simulation Mode
                                <Box>
                                    <Alert severity="info" sx={{ mb: 2 }}>
                                        Generate random workloads to test the optimizer
                                    </Alert>
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Typography>Number of workloads:</Typography>
                                        <Slider
                                            value={simulationCount}
                                            onChange={(e, val) => setSimulationCount(val)}
                                            min={10}
                                            max={500}
                                            step={10}
                                            valueLabelDisplay="auto"
                                            sx={{ maxWidth: 300 }}
                                        />
                                        <Chip label={simulationCount} color="primary" />
                                    </Box>
                                </Box>
                            ) : (
                                // Manual Mode
                                <Box>
                                    {workloads.map((workload, index) => (
                                        <Paper
                                            key={index}
                                            elevation={0}
                                            sx={{ p: 2, mb: 2, bgcolor: 'grey.50', borderRadius: 2 }}
                                        >
                                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                                <Typography variant="subtitle2" fontWeight="bold">
                                                    Workload {index + 1}
                                                </Typography>
                                                {workloads.length > 1 && (
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => removeWorkload(index)}
                                                        color="error"
                                                    >
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
                                                            inputProps: { min: 0.25, max: 168, step: 0.25 }
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
                                                        InputProps={{
                                                            inputProps: { min: 1, max: 10 }
                                                        }}
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Paper>
                                    ))}

                                    <Button
                                        startIcon={<AddIcon />}
                                        onClick={addWorkload}
                                        variant="outlined"
                                        fullWidth
                                    >
                                        Add Workload
                                    </Button>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Right Column - Algorithm Selection */}
                <Grid item xs={12} md={5}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Algorithm Selection
                            </Typography>

                            <FormControl fullWidth sx={{ mb: 3 }}>
                                <InputLabel>Algorithm</InputLabel>
                                <Select
                                    value={algorithm}
                                    onChange={(e) => setAlgorithm(e.target.value)}
                                    label="Algorithm"
                                >
                                    {algorithms.map((algo) => (
                                        <MenuItem key={algo.value} value={algo.value}>
                                            <Box>
                                                <Typography variant="body1">{algo.label}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {algo.description}
                                                </Typography>
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Algorithm Details */}
                            {selectedAlgo && (
                                <Paper
                                    elevation={0}
                                    sx={{
                                        p: 2,
                                        bgcolor: 'success.50',
                                        borderRadius: 2,
                                        border: '1px solid',
                                        borderColor: 'success.200'
                                    }}
                                >
                                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                        {selectedAlgo.label}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        {selectedAlgo.description}
                                    </Typography>
                                    <Chip
                                        label={`Complexity: ${selectedAlgo.complexity}`}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                    />
                                </Paper>
                            )}

                            <Divider sx={{ my: 3 }} />

                            {/* Summary */}
                            <Typography variant="subtitle2" gutterBottom>
                                Summary
                            </Typography>
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

                            {/* Run Button */}
                            <Button
                                variant="contained"
                                size="large"
                                fullWidth
                                onClick={runOptimization}
                                disabled={loading}
                                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <RunIcon />}
                            >
                                {loading ? 'Optimizing...' : 'Run Optimization'}
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
}

export default Optimize;