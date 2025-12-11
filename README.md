# 🌱 Carbon Footprint Optimizer for Cloud Computing

A web application that intelligently schedules cloud computing workloads across multiple geographic datacenters to minimize carbon emissions.

## Features

- **Real-time carbon intensity monitoring** from UK Carbon Intensity API
- **Multiple scheduling algorithms**: Greedy, Dynamic Programming, FCFS, Round Robin
- **Interactive dashboard** with carbon intensity maps and metrics
- **Algorithm comparison** to find optimal scheduling strategy
- **Workload simulation** for testing and benchmarking

## Tech Stack

**Backend**: Python, Flask, NumPy, Pandas  
**Frontend**: React, Recharts, Material-UI  
**APIs**: UK Carbon Intensity API

## Quick Start

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python app.py
```

### Frontend Setup

```bash
cd frontend
npm install
npm start
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/optimize` | POST | Optimize workload scheduling |
| `/api/carbon-intensity` | GET | Get current carbon intensity |
| `/api/datacenters` | GET | List all datacenters |
| `/api/simulate` | POST | Generate test workloads |
| `/api/compare` | POST | Compare algorithms |

## Project Structure

```
carbon-optimizer/
├── backend/
│   ├── algorithms/     # Scheduling algorithms
│   ├── models/         # Data models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   └── app.py          # Flask app
├── frontend/
│   └── src/
│       ├── components/ # React components
│       └── services/   # API client
└── docs/               # Documentation
```

## Algorithms

1. **Greedy**: O(n × d log d) - Fast, assigns to lowest carbon DC
2. **Dynamic Programming**: O(n × T² × D²) - Optimal with forecasts
3. **FCFS**: O(n × d) - Baseline, first available DC
4. **Round Robin**: O(n) - Even distribution baseline

