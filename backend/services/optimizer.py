"""
Optimizer Service - Updated to use filtered datacenters
========================================================
File: backend/services/optimizer.py

Only uses datacenters that have carbon data available
(filters out very low carbon zones for algorithm comparison)
"""

from typing import List, Dict, Optional
import copy
from models.workload import Workload
from models.datacenter import Datacenter, DEFAULT_DATACENTERS
from models.schedule import Schedule
from algorithms.greedy import greedy_schedule
from algorithms.dynamic_programming import dp_schedule
from algorithms.baseline import fcfs_schedule
from services.carbon_api import carbon_client
from services.metrics import MetricsCalculator


class OptimizerService:
    """Main service for workload optimization."""
    
    ALGORITHMS = {
        'greedy': greedy_schedule,
        'dp': dp_schedule,
        'fcfs': fcfs_schedule,
    }
    
    def __init__(self):
        self.datacenters = DEFAULT_DATACENTERS
        self.carbon_client = carbon_client
        self.metrics_calculator = MetricsCalculator()
    
    def _get_fresh_datacenters(
        self, 
        datacenter_ids: Optional[List[str]] = None,
        carbon_data: Optional[Dict] = None
    ) -> List[Datacenter]:
        """
        Get fresh copies of datacenters with reset capacity.
        If carbon_data is provided, only include DCs that have carbon data.
        """
        # Start with all or filtered DCs
        if datacenter_ids:
            dcs = [dc for dc in self.datacenters if dc.id in datacenter_ids]
        else:
            dcs = self.datacenters
        
        # Filter to only DCs that have carbon data (if provided)
        if carbon_data:
            dcs = [dc for dc in dcs if dc.id in carbon_data]
        
        # Deep copy and reset capacity
        fresh_dcs = copy.deepcopy(dcs)
        for dc in fresh_dcs:
            dc.reset_capacity()
        
        return fresh_dcs
    
    def optimize(
        self,
        workloads: List[Workload],
        algorithm: str = 'greedy',
        datacenter_ids: Optional[List[str]] = None
    ) -> Dict:
        """Run optimization algorithm on workloads."""
        
        # Fetch current carbon data FIRST (this filters out low-carbon DCs)
        carbon_data = self.carbon_client.get_current_intensity()
        
        # Get fresh datacenters - only those with carbon data
        dcs = self._get_fresh_datacenters(datacenter_ids, carbon_data)
        
        # Debug output
        print(f"\n[Optimizer] Using {len(dcs)} datacenters: {[dc.id for dc in dcs]}")
        print(f"[Optimizer] Carbon data available for: {list(carbon_data.keys())}")
        
        # Get algorithm function
        algo_func = self.ALGORITHMS.get(algorithm, greedy_schedule)
        
        # Run optimization
        if algorithm == 'dp':
            forecast = self.carbon_client.get_forecast(24)
            schedule = algo_func(workloads, dcs, forecast, time_slots=24)
        else:
            schedule = algo_func(workloads, dcs, carbon_data)
        
        # Run FCFS baseline for comparison (using same filtered DCs)
        baseline_dcs = self._get_fresh_datacenters(datacenter_ids, carbon_data)
        baseline = fcfs_schedule(workloads, baseline_dcs, carbon_data)
        
        # Calculate metrics
        metrics = self.metrics_calculator.calculate_all_metrics(schedule, baseline)
        
        return {
            'success': True,
            'schedule': schedule.to_dict(),
            'metrics': metrics,
            'baseline': baseline.to_dict(),
            'carbon_data': carbon_data,
            'datacenters_used': [dc.id for dc in dcs]
        }
    
    def compare_algorithms(
        self,
        workloads: List[Workload],
        algorithms: Optional[List[str]] = None,
        datacenter_ids: Optional[List[str]] = None
    ) -> Dict:
        """Compare multiple algorithms on the same workload."""
        
        if algorithms is None:
            algorithms = ['greedy', 'dp', 'fcfs']
        
        # Fetch carbon data once (filtered)
        carbon_data = self.carbon_client.get_current_intensity()
        forecast = self.carbon_client.get_forecast(24)
        
        results = {}
        
        for algo_name in algorithms:
            # Get fresh datacenters for each algorithm (filtered)
            dcs = self._get_fresh_datacenters(datacenter_ids, carbon_data)
            
            algo_func = self.ALGORITHMS.get(algo_name)
            if not algo_func:
                continue
            
            if algo_name == 'dp':
                schedule = algo_func(workloads, dcs, forecast, time_slots=24)
            else:
                schedule = algo_func(workloads, dcs, carbon_data)
            
            # Get distribution
            distribution = {}
            for a in schedule.assignments:
                dc = a.datacenter_id
                distribution[dc] = distribution.get(dc, 0) + 1
            
            results[algo_name] = {
                'schedule': schedule.to_dict(),
                'total_carbon': round(schedule.total_carbon, 2),
                'total_cost': round(schedule.total_cost, 2),
                'execution_time_ms': round(schedule.execution_time_ms, 2),
                'tasks_scheduled': len(schedule.assignments),
                'distribution': distribution
            }
        
        # Find best algorithm
        best_algo = min(
            results.keys(),
            key=lambda k: results[k]['total_carbon']
        )
        
        return {
            'success': True,
            'results': results,
            'best_algorithm': best_algo,
            'workload_count': len(workloads),
            'carbon_data': carbon_data,
            'datacenters_used': list(carbon_data.keys())
        }


# Singleton
optimizer_service = OptimizerService()