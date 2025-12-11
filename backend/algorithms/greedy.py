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
    
    # DEBUG: Print what we received
    print(f"\n=== GREEDY DEBUG ===")
    print(f"carbon_data keys: {list(carbon_data.keys())}")
    print(f"datacenter IDs: {[dc.id for dc in dcs]}")
    for dc_id, data in carbon_data.items():
        print(f"  {dc_id}: intensity={data.get('intensity', 'MISSING')}")
    
    # Sort workloads by arrival time
    sorted_workloads = sorted(workloads, key=lambda w: w.arrival_time or datetime.utcnow())
    
    assignments = []
    
    for workload in sorted_workloads:
        # Get available DCs with capacity
        available_dcs = [dc for dc in dcs if dc.can_accommodate(workload.cpu, workload.memory)]
        
        if not available_dcs:
            print(f"  Workload {workload.id}: No DC has capacity!")
            continue
        
        # DEBUG: Print before sorting
        print(f"\n  Workload {workload.id} - Before sort:")
        for dc in available_dcs:
            intensity = carbon_data.get(dc.id, {}).get('intensity', 'DEFAULT(999)')
            print(f"    {dc.id}: intensity={intensity}")
        
        # KEY: Sort by carbon intensity (LOWEST first)
        # FIX: Handle missing data more gracefully
        def get_carbon_intensity(dc):
            dc_info = carbon_data.get(dc.id)
            if dc_info is None:
                print(f"    WARNING: No carbon data for DC '{dc.id}'")
                return 999  # High default so unknown DCs are deprioritized
            return dc_info.get('intensity', 999)
        
        available_dcs.sort(key=get_carbon_intensity)
        
        # DEBUG: Print after sorting
        print(f"  After sort:")
        for dc in available_dcs:
            print(f"    {dc.id}: {get_carbon_intensity(dc)}")
        
        # Pick the DC with LOWEST carbon
        selected_dc = available_dcs[0]
        print(f"  SELECTED: {selected_dc.id}")
        
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