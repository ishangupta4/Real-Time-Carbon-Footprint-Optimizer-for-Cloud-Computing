from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
from models.workload import Workload
from models.datacenter import Datacenter
from models.schedule import Assignment, Schedule
from functools import lru_cache
import time
import copy


def dp_schedule(
    workloads: List[Workload],
    datacenters: List[Datacenter],
    carbon_forecast: Dict[Tuple[str, int], Dict],
    time_slots: int = 24
) -> Schedule:
    """
    Dynamic Programming scheduling with time windows.
    Finds optimal assignment considering future carbon intensity forecasts.
    
    Time Complexity: O(n * T^2 * D^2)
    Space Complexity: O(n * T * D)
    
    Args:
        workloads: List of Workload objects
        datacenters: List of Datacenter objects
        carbon_forecast: Dict {(dc_id, time_slot): {'intensity': float, 'renewable': float}}
        time_slots: Number of time slots (hours) to consider
    
    Returns:
        Schedule object with optimal assignments
    """
    start_time = time.time()
    
    n = len(workloads)
    T = time_slots
    D = len(datacenters)
    
    if n == 0:
        return Schedule(algorithm_used='dp', execution_time_ms=0)
    
    # Sort workloads by priority (higher first) then arrival time
    sorted_workloads = sorted(
        workloads, 
        key=lambda w: (-w.priority, w.arrival_time)
    )
    
    # Initialize DP table: dp[i][t][d] = (min_carbon, assignments_list)
    # Using dict for sparse representation
    INF = float('inf')
    dp = {}
    
    # Base case: no tasks scheduled
    for t in range(T):
        for dc_idx, dc in enumerate(datacenters):
            dp[(0, t, dc_idx)] = (0.0, [])
    
    # Create capacity tracking per (time_slot, datacenter)
    def get_carbon_data(dc_id: str, time_slot: int) -> Dict:
        """Get carbon data for datacenter at time slot"""
        return carbon_forecast.get(
            (dc_id, time_slot), 
            {'intensity': 200, 'renewable': 30}
        )
    
    # Fill DP table
    for i in range(1, n + 1):
        task = sorted_workloads[i - 1]
        task_duration_slots = max(1, int(task.duration))
        
        for t in range(T):
            # Check if task can complete within time horizon
            if t + task_duration_slots > T:
                continue
            
            for dc_idx, dc in enumerate(datacenters):
                # Check basic capacity (simplified - not tracking per-slot)
                if not dc.can_accommodate(task.cpu, task.memory):
                    dp[(i, t, dc_idx)] = (INF, [])
                    continue
                
                # Get carbon data for this assignment
                carbon_data = get_carbon_data(dc.id, t)
                carbon_intensity = carbon_data.get('intensity', 200)
                renewable_pct = carbon_data.get('renewable', 30)
                
                # Calculate carbon cost
                energy_kwh = task.energy_kwh
                carbon_cost = energy_kwh * carbon_intensity
                
                # Find best previous state
                best_prev_carbon = INF
                best_prev_assignments = []
                
                # Check all previous states
                for t_prev in range(t + 1):
                    for dc_prev in range(D):
                        prev_state = dp.get((i-1, t_prev, dc_prev), (INF, []))
                        prev_carbon, prev_assignments = prev_state
                        
                        if prev_carbon + carbon_cost < best_prev_carbon:
                            best_prev_carbon = prev_carbon + carbon_cost
                            best_prev_assignments = prev_assignments
                
                if best_prev_carbon < INF:
                    # Calculate cost
                    cost = task.cpu * task.duration * dc.cost_per_core_hour
                    
                    # Determine actual start time
                    base_time = datetime.utcnow()
                    start = base_time + timedelta(hours=t)
                    end = start + timedelta(hours=task.duration)
                    
                    new_assignment = Assignment(
                        workload_id=task.id,
                        datacenter_id=dc.id,
                        start_time=start,
                        end_time=end,
                        carbon_emissions=carbon_cost,
                        cost=cost,
                        carbon_intensity=carbon_intensity,
                        renewable_percentage=renewable_pct
                    )
                    
                    dp[(i, t, dc_idx)] = (
                        best_prev_carbon,
                        best_prev_assignments + [new_assignment]
                    )
                else:
                    dp[(i, t, dc_idx)] = (INF, [])
    
    # Find optimal final state
    min_carbon = INF
    optimal_assignments = []
    
    for t in range(T):
        for dc_idx in range(D):
            state = dp.get((n, t, dc_idx), (INF, []))
            carbon, assignments = state
            if carbon < min_carbon:
                min_carbon = carbon
                optimal_assignments = assignments
    
    execution_time = (time.time() - start_time) * 1000
    
    schedule = Schedule(
        assignments=optimal_assignments,
        algorithm_used='dp',
        execution_time_ms=execution_time
    )
    
    return schedule
