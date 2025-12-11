

import time
import copy
from typing import List, Dict, Tuple
from datetime import datetime, timedelta

from models.workload import Workload
from models.datacenter import Datacenter
from models.schedule import Assignment, Schedule


def dp_schedule(
    workloads: List[Workload],
    datacenters: List[Datacenter],
    carbon_forecast: Dict[Tuple[str, int], Dict],
    time_slots: int = 24
) -> Schedule:
    """
    DP (Dynamic Programming): Considers FUTURE carbon intensity.
    
    Logic:
    1. Look at carbon forecast for next 24 hours
    2. For each workload, find the (DC, time_slot) with lowest carbon
    3. Can delay flexible tasks to run during low-carbon periods
    
    KEY DIFFERENCE FROM GREEDY:
    - Greedy: Only sees current carbon intensity
    - DP: Sees future forecast, can delay tasks for better windows
    """
    start_time = time.time()
    
    if not workloads:
        return Schedule(algorithm_used='dp', execution_time_ms=0)
    
    dcs = copy.deepcopy(datacenters)
    base_time = datetime.utcnow()
    
    
    capacity = {
        dc.id: {t: dc.total_cpu for t in range(time_slots)}
        for dc in dcs
    }
    
    
    sorted_workloads = sorted(
        workloads,
        key=lambda w: (w.deadline or datetime.max, -w.priority)
    )
    
    assignments = []
    
    for workload in sorted_workloads:
        best_assignment = None
        min_carbon = float('inf')
        
        task_duration = max(1, int(workload.duration))
        
        
        if workload.deadline:
            deadline_hours = max(1, int((workload.deadline - base_time).total_seconds() / 3600))
            max_start = min(time_slots - task_duration, deadline_hours - task_duration)
        else:
            max_start = time_slots - task_duration
        
        max_start = max(0, min(max_start, time_slots - 1))
        
        
        for t in range(max_start + 1):
            for dc in dcs:
                
                if capacity[dc.id][t] < workload.cpu:
                    continue
                
                
                forecast = carbon_forecast.get((dc.id, t), {'intensity': 200, 'renewable': 30})
                carbon_intensity = forecast.get('intensity', 200)
                
                
                carbon_emissions = workload.energy_kwh * carbon_intensity
                
                if carbon_emissions < min_carbon:
                    min_carbon = carbon_emissions
                    best_assignment = {
                        'dc': dc,
                        'time_slot': t,
                        'carbon_emissions': carbon_emissions,
                        'carbon_intensity': carbon_intensity,
                        'renewable': forecast.get('renewable', 30)
                    }
        
        if best_assignment:
            dc = best_assignment['dc']
            t = best_assignment['time_slot']
            
            capacity[dc.id][t] -= workload.cpu
            
            start = base_time + timedelta(hours=t)
            end = start + timedelta(hours=workload.duration)
            
            assignment = Assignment(
                workload_id=workload.id,
                datacenter_id=dc.id,
                start_time=start,
                end_time=end,
                carbon_emissions=best_assignment['carbon_emissions'],
                cost=workload.cpu * workload.duration * dc.cost_per_core_hour,
                carbon_intensity=best_assignment['carbon_intensity'],
                renewable_percentage=best_assignment['renewable']
            )
            
            assignments.append(assignment)
    
    execution_time = (time.time() - start_time) * 1000
    
    return Schedule(
        assignments=assignments,
        algorithm_used='dp',
        execution_time_ms=execution_time
    )