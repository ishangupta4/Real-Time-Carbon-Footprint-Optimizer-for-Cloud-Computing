

import time
import copy
from typing import List, Dict
from datetime import datetime, timedelta

from models.workload import Workload
from models.datacenter import Datacenter
from models.schedule import Assignment, Schedule


def fcfs_schedule(
    workloads: List[Workload],
    datacenters: List[Datacenter],
    carbon_data: Dict[str, Dict]
) -> Schedule:
    """
    FCFS (First Come First Serve): Assigns to datacenters in LIST ORDER.
    
    Logic:
    1. Process workloads in arrival order
    2. For each workload, try DCs in the ORDER they appear in the list
    3. Assign to FIRST DC with available capacity
    
    This does NOT consider carbon intensity at all - it just uses
    whatever DC comes first in the list.
    
    KEY DIFFERENCE FROM GREEDY:
    - FCFS: Uses list order (index 0, then 1, then 2...)
    - Greedy: Sorts by carbon intensity first
    """
    start_time = time.time()
    
    
    dcs = copy.deepcopy(datacenters)
    
    
    sorted_workloads = sorted(workloads, key=lambda w: w.arrival_time or datetime.utcnow())
    
    assignments = []
    
    for workload in sorted_workloads:
        assigned = False
        
        
        for dc in dcs:
            if dc.can_accommodate(workload.cpu, workload.memory):
                
                dc_carbon = carbon_data.get(dc.id, {'intensity': 200, 'renewable': 30})
                carbon_intensity = dc_carbon.get('intensity', 200)
                renewable_pct = dc_carbon.get('renewable', 30)
                
                energy_kwh = workload.energy_kwh
                carbon_emissions = energy_kwh * carbon_intensity
                cost = workload.cpu * workload.duration * dc.cost_per_core_hour
                
                assignment = Assignment(
                    workload_id=workload.id,
                    datacenter_id=dc.id,
                    start_time=workload.arrival_time or datetime.utcnow(),
                    end_time=(workload.arrival_time or datetime.utcnow()) + timedelta(hours=workload.duration),
                    carbon_emissions=carbon_emissions,
                    cost=cost,
                    carbon_intensity=carbon_intensity,
                    renewable_percentage=renewable_pct
                )
                
                assignments.append(assignment)
                dc.allocate(workload.cpu, workload.memory)
                assigned = True
                break  
        
        if not assigned:
            pass  
    
    execution_time = (time.time() - start_time) * 1000
    
    return Schedule(
        assignments=assignments,
        algorithm_used='fcfs',
        execution_time_ms=execution_time
    )