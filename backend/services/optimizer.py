from typing import List, Dict, Optional
from models.workload import Workload
from models.datacenter import Datacenter, DEFAULT_DATACENTERS
from models.schedule import Schedule
from algorithms import (
    greedy_schedule, 
    dp_schedule, 
    fcfs_schedule, 
    round_robin_schedule
)
from services.carbon_api import carbon_client
from services.metrics import MetricsCalculator


class OptimizerService:
    """
    Main service for workload optimization.
    Coordinates algorithms, carbon data, and metrics.
    """
    
    ALGORITHMS = {
        'greedy': greedy_schedule,
        'dp': dp_schedule,
        'fcfs': fcfs_schedule,
        'round_robin': round_robin_schedule
    }
    
    def __init__(self):
        self.datacenters = DEFAULT_DATACENTERS.copy()
        self.carbon_client = carbon_client
        self.metrics_calculator = MetricsCalculator()
    
    def optimize(
        self,
        workloads: List[Workload],
        algorithm: str = 'greedy',
        datacenter_ids: Optional[List[str]] = None
    ) -> Dict:
        """
        Run optimization algorithm on workloads.
        
        Args:
            workloads: List of Workload objects
            algorithm: Algorithm name ('greedy', 'dp', 'fcfs', 'round_robin')
            datacenter_ids: Optional list of datacenter IDs to consider
        
        Returns:
            Dict with schedule, metrics, and comparison data
        """
        # Filter datacenters if specified
        if datacenter_ids:
            dcs = [dc for dc in self.datacenters if dc.id in datacenter_ids]
        else:
            dcs = self.datacenters.copy()
        
        # Reset datacenter capacities
        for dc in dcs:
            dc.reset_capacity()
        
        # Fetch current carbon data
        carbon_data = self.carbon_client.get_current_intensity()
        
        # Get algorithm function
        algo_func = self.ALGORITHMS.get(algorithm, greedy_schedule)
        
        # Run optimization
        if algorithm == 'dp':
            # DP needs forecast data
            forecast = self.carbon_client.get_forecast(24)
            schedule = algo_func(workloads, dcs, forecast, time_slots=24)
        else:
            schedule = algo_func(workloads, dcs, carbon_data)
        
        # Run baseline for comparison
        baseline_dcs = [dc.__class__(**{
            'id': dc.id, 'name': dc.name, 'location': dc.location,
            'region_code': dc.region_code, 'latitude': dc.latitude,
            'longitude': dc.longitude, 'total_cpu': dc.total_cpu,
            'total_memory': dc.total_memory, 'cost_per_core_hour': dc.cost_per_core_hour
        }) for dc in dcs]
        
        baseline = fcfs_schedule(workloads, baseline_dcs, carbon_data)
        
        # Calculate metrics
        metrics = self.metrics_calculator.calculate_all_metrics(schedule, baseline)
        
        return {
            'success': True,
            'schedule': schedule.to_dict(),
            'metrics': metrics,
            'baseline': baseline.to_dict(),
            'carbon_data': carbon_data
        }
    
    def compare_algorithms(
        self,
        workloads: List[Workload],
        algorithms: Optional[List[str]] = None,
        datacenter_ids: Optional[List[str]] = None
    ) -> Dict:
        """
        Compare multiple algorithms on the same workload.
        """
        if algorithms is None:
            algorithms = list(self.ALGORITHMS.keys())
        
        # Filter datacenters
        if datacenter_ids:
            dcs = [dc for dc in self.datacenters if dc.id in datacenter_ids]
        else:
            dcs = self.datacenters.copy()
        
        # Fetch carbon data
        carbon_data = self.carbon_client.get_current_intensity()
        forecast = self.carbon_client.get_forecast(24)
        
        results = {}
        
        for algo_name in algorithms:
            # Reset capacities
            for dc in dcs:
                dc.reset_capacity()
            
            algo_func = self.ALGORITHMS.get(algo_name)
            if not algo_func:
                continue
            
            if algo_name == 'dp':
                schedule = algo_func(workloads, dcs, forecast, time_slots=24)
            else:
                schedule = algo_func(workloads, dcs, carbon_data)
            
            results[algo_name] = {
                'schedule': schedule.to_dict(),
                'total_carbon': schedule.total_carbon,
                'total_cost': schedule.total_cost,
                'execution_time_ms': schedule.execution_time_ms,
                'tasks_scheduled': len(schedule.assignments)
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
            'workload_count': len(workloads)
        }


# Singleton instance
optimizer_service = OptimizerService()
