# File: backend/algorithms/greedy.py

import time
import copy
from typing import List, Dict
from datetime import datetime, timedelta

from models.workload import Workload
from models.datacenter import Datacenter
from models.schedule import Assignment, Schedule


def greedy_schedule(
    workloads: List[Workload],
    datacenters: List[Datacenter],
    carbon_data: Dict[str, Dict]
) -> Schedule:
    """
    GREEDY: Always picks datacenter with LOWEST carbon intensity.
    
    Logic:
    1. Sort datacenters by carbon intensity (lowest first)
    2. For each workload, assign to first DC with capacity
    
    This gives better results than FCFS because it prioritizes
    low-carbon datacenters.
    """
    start_time = time.time()
    
    # Deep copy to avoid modifying originals
    dcs = copy.deepcopy(datacenters)
    
    # Sort workloads by arrival time
    sorted_workloads = sorted(workloads, key=lambda w: w.arrival_time or datetime.utcnow())
    
    assignments = []
    
    for workload in sorted_workloads:
        # Get available DCs with capacity
        available_dcs = [dc for dc in dcs if dc.can_accommodate(workload.cpu, workload.memory)]
        
        if not available_dcs:
            continue
        
        # KEY: Sort by carbon intensity (LOWEST first)
        available_dcs.sort(key=lambda dc: carbon_data.get(dc.id, {}).get('intensity', 999))
        
        # Pick the DC with LOWEST carbon
        selected_dc = available_dcs[0]
        
        # Get carbon info
        dc_carbon = carbon_data.get(selected_dc.id, {'intensity': 200, 'renewable': 30})
        carbon_intensity = dc_carbon.get('intensity', 200)
        renewable_pct = dc_carbon.get('renewable', 30)
        
        # Calculate emissions
        energy_kwh = workload.energy_kwh
        carbon_emissions = energy_kwh * carbon_intensity
        cost = workload.cpu * workload.duration * selected_dc.cost_per_core_hour
        
        assignment = Assignment(
            workload_id=workload.id,
            datacenter_id=selected_dc.id,
            start_time=workload.arrival_time or datetime.utcnow(),
            end_time=(workload.arrival_time or datetime.utcnow()) + timedelta(hours=workload.duration),
            carbon_emissions=carbon_emissions,
            cost=cost,
            carbon_intensity=carbon_intensity,
            renewable_percentage=renewable_pct
        )
        
        assignments.append(assignment)
        selected_dc.allocate(workload.cpu, workload.memory)
    
    execution_time = (time.time() - start_time) * 1000
    
    return Schedule(
        assignments=assignments,
        algorithm_used='greedy',
        execution_time_ms=execution_time
    )