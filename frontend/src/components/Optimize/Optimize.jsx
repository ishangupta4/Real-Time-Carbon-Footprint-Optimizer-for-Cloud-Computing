

import React, { useState, useRef } from 'react';
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
    Paper,
    IconButton,
    Container,
    Tabs,
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Link,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    PlayArrow as RunIcon,
    Memory as CpuIcon,
    Storage as MemoryIcon,
    Schedule as DurationIcon,
    CloudUpload as UploadIcon,
    FileDownload as DownloadIcon,
    Description as FileIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import carbonAPI from '../../services/api';

const algorithms = [
    { value: 'greedy', label: 'Greedy', description: 'Picks datacenter with lowest carbon intensity', complexity: 'O(n·d·log d)' },
    { value: 'dp', label: 'Dynamic Programming', description: 'Considers future carbon forecasts for optimal scheduling', complexity: 'O(n·T·d)' },
    { value: 'fcfs', label: 'FCFS (Baseline)', description: 'First-come first-serve, ignores carbon intensity', complexity: 'O(n·d)' },
];

function TabPanel({ children, value, index }) {
    return (
        <div hidden={value !== index} style={{ paddingTop: 16 }}>
            {value === index && children}
        </div>
    );
}

function Optimize() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    
    const [tabValue, setTabValue] = useState(0);

    
    const [workloads, setWorkloads] = useState([
        { cpu: 4, memory: 8, duration: 2, priority: 5 }
    ]);

    
    const [uploadedFile, setUploadedFile] = useState(null);
    const [uploadedWorkloads, setUploadedWorkloads] = useState([]);
    const [uploadError, setUploadError] = useState(null);
    const [uploading, setUploading] = useState(false);

    
    const [simulationCount, setSimulationCount] = useState(50);

    
    const [algorithm, setAlgorithm] = useState('greedy');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    
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

    
    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const validTypes = ['.csv', '.json'];
        const fileExt = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

        if (!validTypes.includes(fileExt)) {
            setUploadError('Please upload a .csv or .json file');
            return;
        }

        setUploading(true);
        setUploadError(null);
        setUploadedFile(file);

        try {
            const result = await carbonAPI.uploadWorkloads(file);

            if (result.success) {
                setUploadedWorkloads(result.workloads);
                if (result.errors && result.errors.length > 0) {
                    setUploadError(`Parsed ${result.count} workloads. Some rows had errors: ${result.errors.slice(0, 3).join('; ')}`);
                }
            } else {
                setUploadError(result.error || 'Failed to parse file');
                setUploadedWorkloads([]);
            }
        } catch (err) {
            setUploadError(err.response?.data?.error || 'Failed to upload file');
            setUploadedWorkloads([]);
        } finally {
            setUploading(false);
        }
    };

    const clearUpload = () => {
        setUploadedFile(null);
        setUploadedWorkloads([]);
        setUploadError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    
    const runOptimization = async () => {
        setLoading(true);
        setError(null);

        try {
            let workloadsToOptimize;

            if (tabValue === 0) {
                
                workloadsToOptimize = workloads;
            } else if (tabValue === 1) {
                
                if (uploadedWorkloads.length === 0) {
                    setError('Please upload a file first');
                    setLoading(false);
                    return;
                }
                workloadsToOptimize = uploadedWorkloads;
            } else {
                
                const simResponse = await carbonAPI.simulate(simulationCount);
                workloadsToOptimize = simResponse.workloads;
            }

            const result = await carbonAPI.optimize(workloadsToOptimize, algorithm);
            navigate('/results', { state: { result, workloads: workloadsToOptimize } });
        } catch (err) {
            setError(err.response?.data?.error || 'Optimization failed. Check backend connection.');
        } finally {
            setLoading(false);
        }
    };

    const selectedAlgo = algorithms.find(a => a.value === algorithm);

    
    const getWorkloadCount = () => {
        if (tabValue === 0) return workloads.length;
        if (tabValue === 1) return uploadedWorkloads.length;
        return simulationCount;
    };

    return (
        <Container maxWidth={false}>
            <Typography variant="h4" gutterBottom>Optimize Workloads</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
                Configure your workloads and select an algorithm to minimize carbon emissions
            </Typography>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>
            )}

            <Grid container spacing={3}>
                {}
                <Grid item xs={12} lg={8}>
                    <Card sx={{ height: '100%' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>Workload Configuration</Typography>

                            <Tabs
                                value={tabValue}
                                onChange={(e, v) => setTabValue(v)}
                                sx={{ borderBottom: 1, borderColor: 'divider' }}
                            >
                                <Tab label="Manual Entry" />
                                <Tab label="Upload File" />
                                <Tab label="Simulate" />
                            </Tabs>

                            {}
                            <TabPanel value={tabValue} index={0}>
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
                            </TabPanel>

                            {}
                            <TabPanel value={tabValue} index={1}>
                                <Box mb={3}>
                                    <Alert severity="info" sx={{ mb: 2 }}>
                                        Upload a CSV or JSON file with your workloads.
                                        <Box mt={1}>
                                            <Link
                                                component="button"
                                                variant="body2"
                                                onClick={() => carbonAPI.downloadCSVTemplate()}
                                                sx={{ mr: 2 }}
                                            >
                                                <DownloadIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                                                Download CSV Template
                                            </Link>
                                            <Link
                                                component="button"
                                                variant="body2"
                                                onClick={() => carbonAPI.downloadJSONTemplate()}
                                            >
                                                <DownloadIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                                                Download JSON Template
                                            </Link>
                                        </Box>
                                    </Alert>

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                        accept=".csv,.json"
                                        style={{ display: 'none' }}
                                    />

                                    {!uploadedFile ? (
                                        <Paper
                                            elevation={0}
                                            sx={{
                                                p: 4,
                                                border: '2px dashed',
                                                borderColor: 'grey.300',
                                                borderRadius: 2,
                                                textAlign: 'center',
                                                cursor: 'pointer',
                                                '&:hover': { borderColor: 'primary.main', bgcolor: 'grey.50' }
                                            }}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <UploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                                            <Typography variant="body1" gutterBottom>
                                                Click to upload or drag and drop
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                CSV or JSON files supported
                                            </Typography>
                                        </Paper>
                                    ) : (
                                        <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <FileIcon color="primary" />
                                                    <Box>
                                                        <Typography variant="body2" fontWeight="bold">{uploadedFile.name}</Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            {(uploadedFile.size / 1024).toFixed(1)} KB
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                <IconButton size="small" onClick={clearUpload}>
                                                    <CloseIcon />
                                                </IconButton>
                                            </Box>
                                        </Paper>
                                    )}

                                    {uploading && (
                                        <Box display="flex" alignItems="center" gap={1} mt={2}>
                                            <CircularProgress size={20} />
                                            <Typography variant="body2">Parsing file...</Typography>
                                        </Box>
                                    )}

                                    {uploadError && (
                                        <Alert severity="warning" sx={{ mt: 2 }}>{uploadError}</Alert>
                                    )}
                                </Box>

                                {}
                                {uploadedWorkloads.length > 0 && (
                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                                            Preview ({uploadedWorkloads.length} workloads)
                                        </Typography>
                                        <TableContainer component={Paper} elevation={0} sx={{ maxHeight: 250 }}>
                                            <Table size="small" stickyHeader>
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>#</TableCell>
                                                        <TableCell>CPU</TableCell>
                                                        <TableCell>Memory</TableCell>
                                                        <TableCell>Duration</TableCell>
                                                        <TableCell>Priority</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {uploadedWorkloads.slice(0, 10).map((w, i) => (
                                                        <TableRow key={i}>
                                                            <TableCell>{i + 1}</TableCell>
                                                            <TableCell>{w.cpu}</TableCell>
                                                            <TableCell>{w.memory} GB</TableCell>
                                                            <TableCell>{w.duration} hrs</TableCell>
                                                            <TableCell>{w.priority}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                        {uploadedWorkloads.length > 10 && (
                                            <Typography variant="caption" color="text.secondary">
                                                Showing first 10 of {uploadedWorkloads.length} workloads
                                            </Typography>
                                        )}
                                    </Box>
                                )}
                            </TabPanel>

                            {}
                            <TabPanel value={tabValue} index={2}>
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
                            </TabPanel>
                        </CardContent>
                    </Card>
                </Grid>

                {}
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
                                    Mode: <strong>{['Manual', 'File Upload', 'Simulation'][tabValue]}</strong>
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Workloads: <strong>{getWorkloadCount()}</strong>
                                </Typography>
                                {tabValue === 0 && (
                                    <>
                                        <Typography variant="body2" color="text.secondary">
                                            Total CPU: <strong>{workloads.reduce((acc, w) => acc + w.cpu, 0)} cores</strong>
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Total Memory: <strong>{workloads.reduce((acc, w) => acc + w.memory, 0)} GB</strong>
                                        </Typography>
                                    </>
                                )}
                            </Box>

                            <Button
                                variant="contained"
                                size="large"
                                fullWidth
                                onClick={runOptimization}
                                disabled={loading || (tabValue === 1 && uploadedWorkloads.length === 0)}
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