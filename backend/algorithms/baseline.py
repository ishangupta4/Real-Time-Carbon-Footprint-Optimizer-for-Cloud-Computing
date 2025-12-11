from typing import List, Dict
from datetime import datetime, timedelta
from models.workload import Workload
from models.datacenter import Datacenter
from models.schedule import Assignment, Schedule
import time
import copy


def fcfs_schedule(
    workloads: List[Workload],
    datacenters: List[Datacenter],
    carbon_data: Dict[str, Dict]
) -> Schedule:
    """
    First-Come-First-Serve baseline - assigns tasks to first 
    available datacenter in order, ignoring carbon intensity.
    
    Time Complexity: O(n * d)
    Space Complexity: O(n)
    """
    start_time = time.time()
    
    dcs = [copy.deepcopy(dc) for dc in datacenters]
    sorted_workloads = sorted(workloads, key=lambda w: w.arrival_time)
    
    assignments = []
    
    for workload in sorted_workloads:
        assigned = False
        
        # Try each datacenter in order (no sorting by carbon)
        for dc in dcs:
            if dc.can_accommodate(workload.cpu, workload.memory):
                dc_carbon = carbon_data.get(dc.id, {'intensity': 200, 'renewable': 30})
                
                energy_kwh = workload.energy_kwh
                carbon_emissions = energy_kwh * dc_carbon.get('intensity', 200)
                cost = workload.cpu * workload.duration * dc.cost_per_core_hour
                
                assignment = Assignment(
                    workload_id=workload.id,
                    datacenter_id=dc.id,
                    start_time=workload.arrival_time,
                    end_time=workload.arrival_time + timedelta(hours=workload.duration),
                    carbon_emissions=carbon_emissions,
                    cost=cost,
                    carbon_intensity=dc_carbon.get('intensity', 200),
                    renewable_percentage=dc_carbon.get('renewable', 30)
                )
                
                assignments.append(assignment)
                dc.allocate(workload.cpu, workload.memory)
                assigned = True
                break
        
        if not assigned:
            # Task couldn't be scheduled
            pass
    
    execution_time = (time.time() - start_time) * 1000
    
    return Schedule(
        assignments=assignments,
        algorithm_used='fcfs',
        execution_time_ms=execution_time
    )


def round_robin_schedule(
    workloads: List[Workload],
    datacenters: List[Datacenter],
    carbon_data: Dict[str, Dict]
) -> Schedule:
    """
    Round Robin baseline - distributes tasks evenly across 
    datacenters, ignoring carbon intensity.
    
    Time Complexity: O(n)
    Space Complexity: O(n)
    """
    start_time = time.time()
    
    dcs = [copy.deepcopy(dc) for dc in datacenters]
    sorted_workloads = sorted(workloads, key=lambda w: w.arrival_time)
    
    assignments = []
    dc_index = 0
    
    for workload in sorted_workloads:
        attempts = 0
        assigned = False
        
        # Try datacenters in round-robin fashion
        while attempts < len(dcs):
            dc = dcs[dc_index % len(dcs)]
            
            if dc.can_accommodate(workload.cpu, workload.memory):
                dc_carbon = carbon_data.get(dc.id, {'intensity': 200, 'renewable': 30})
                
                energy_kwh = workload.energy_kwh
                carbon_emissions = energy_kwh * dc_carbon.get('intensity', 200)
                cost = workload.cpu * workload.duration * dc.cost_per_core_hour
                
                assignment = Assignment(
                    workload_id=workload.id,
                    datacenter_id=dc.id,
                    start_time=workload.arrival_time,
                    end_time=workload.arrival_time + timedelta(hours=workload.duration),
                    carbon_emissions=carbon_emissions,
                    cost=cost,
                    carbon_intensity=dc_carbon.get('intensity', 200),
                    renewable_percentage=dc_carbon.get('renewable', 30)
                )
                
                assignments.append(assignment)
                dc.allocate(workload.cpu, workload.memory)
                assigned = True
                break
            
            dc_index += 1
            attempts += 1
        
        dc_index += 1  # Move to next DC for next task
    
    execution_time = (time.time() - start_time) * 1000
    
    return Schedule(
        assignments=assignments,
        algorithm_used='round_robin',
        execution_time_ms=execution_time
    )


def random_schedule(
    workloads: List[Workload],
    datacenters: List[Datacenter],
    carbon_data: Dict[str, Dict]
) -> Schedule:
    """
    Random baseline - randomly assigns tasks to datacenters
    with available capacity.
    
    Time Complexity: O(n * d)
    Space Complexity: O(n)
    """
    import random
    
    start_time = time.time()
    
    dcs = [copy.deepcopy(dc) for dc in datacenters]
    sorted_workloads = sorted(workloads, key=lambda w: w.arrival_time)
    
    assignments = []
    
    for workload in sorted_workloads:
        available_dcs = [
            dc for dc in dcs 
            if dc.can_accommodate(workload.cpu, workload.memory)
        ]
        
        if available_dcs:
            dc = random.choice(available_dcs)
            dc_carbon = carbon_data.get(dc.id, {'intensity': 200, 'renewable': 30})
            
            energy_kwh = workload.energy_kwh
            carbon_emissions = energy_kwh * dc_carbon.get('intensity', 200)
            cost = workload.cpu * workload.duration * dc.cost_per_core_hour
            
            assignment = Assignment(
                workload_id=workload.id,
                datacenter_id=dc.id,
                start_time=workload.arrival_time,
                end_time=workload.arrival_time + timedelta(hours=workload.duration),
                carbon_emissions=carbon_emissions,
                cost=cost,
                carbon_intensity=dc_carbon.get('intensity', 200),
                renewable_percentage=dc_carbon.get('renewable', 30)
            )
            
            assignments.append(assignment)
            dc.allocate(workload.cpu, workload.memory)
    
    execution_time = (time.time() - start_time) * 1000
    
    return Schedule(
        assignments=assignments,
        algorithm_used='random',
        execution_time_ms=execution_time
    )