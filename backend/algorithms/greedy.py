from typing import List, Dict, Tuple
from datetime import datetime, timedelta
from models.workload import Workload
from models.datacenter import Datacenter
from models.schedule import Assignment, Schedule
import time
import copy


def greedy_schedule(
    workloads: List[Workload],
    datacenters: List[Datacenter],
    carbon_data: Dict[str, Dict]
) -> Schedule:
    """
    Greedy scheduling algorithm - assigns each workload to datacenter
    with lowest current carbon intensity that has sufficient capacity.
    
    Time Complexity: O(n * d * log(d)) where n=tasks, d=datacenters
    Space Complexity: O(n + d)
    
    Args:
        workloads: List of Workload objects to schedule
        datacenters: List of Datacenter objects with capacity
        carbon_data: Dict {datacenter_id: {'intensity': float, 'renewable': float}}
    
    Returns:
        Schedule object with all assignments and metrics
    """
    start_time = time.time()
    
    # Create deep copies to avoid modifying originals
    dcs = [copy.deepcopy(dc) for dc in datacenters]
    
    # Sort workloads by arrival time (earliest first)
    sorted_workloads = sorted(workloads, key=lambda w: w.arrival_time)
    
    assignments = []
    unscheduled = []
    
    for workload in sorted_workloads:
        # Filter datacenters with sufficient capacity
        available_dcs = [
            dc for dc in dcs 
            if dc.can_accommodate(workload.cpu, workload.memory)
        ]
        
        if not available_dcs:
            unscheduled.append(workload.id)
            continue
        
        # Sort by carbon intensity (ascending - lowest first)
        available_dcs.sort(
            key=lambda dc: carbon_data.get(dc.id, {}).get('intensity', float('inf'))
        )
        
        # Select datacenter with lowest carbon intensity
        selected_dc = available_dcs[0]
        
        # Get carbon data for selected datacenter
        dc_carbon = carbon_data.get(selected_dc.id, {'intensity': 200, 'renewable': 30})
        carbon_intensity = dc_carbon.get('intensity', 200)
        renewable_pct = dc_carbon.get('renewable', 30)
        
        # Calculate carbon emissions: energy (kWh) * intensity (gCO2/kWh)
        energy_kwh = workload.energy_kwh
        carbon_emissions = energy_kwh * carbon_intensity
        
        # Calculate cost
        cost = workload.cpu * workload.duration * selected_dc.cost_per_core_hour
        
        # Create assignment
        assignment = Assignment(
            workload_id=workload.id,
            datacenter_id=selected_dc.id,
            start_time=workload.arrival_time,
            end_time=workload.arrival_time + timedelta(hours=workload.duration),
            carbon_emissions=carbon_emissions,
            cost=cost,
            carbon_intensity=carbon_intensity,
            renewable_percentage=renewable_pct
        )
        
        assignments.append(assignment)
        
        # Update datacenter capacity
        selected_dc.allocate(workload.cpu, workload.memory)
    
    execution_time = (time.time() - start_time) * 1000  # ms
    
    schedule = Schedule(
        assignments=assignments,
        algorithm_used='greedy',
        execution_time_ms=execution_time
    )
    
    return schedule