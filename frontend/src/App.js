

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import Navbar from './components/Common/Navbar';
import Dashboard from './components/Dashboard/Dashboard';
import Optimize from './components/Optimize/Optimize';
import Results from './components/Results/Results';
import Compare from './components/Compare/Compare';

function App() {
  return (
    <Router>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            bgcolor: 'background.default',
            minHeight: 'calc(100vh - 64px)'
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/optimize" element={<Optimize />} />
            <Route path="/results" element={<Results />} />
            <Route path="/compare" element={<Compare />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;