import random
from datetime import datetime, timedelta
from typing import List, Optional
from models.workload import Workload


class WorkloadSimulator:
    """Generate simulated workloads for testing"""
    
    
    CPU_OPTIONS = [0.5, 1, 2, 4, 8, 16]
    CPU_WEIGHTS = [0.2, 0.3, 0.25, 0.15, 0.07, 0.03]
    
    
    MEMORY_OPTIONS = [0.5, 1, 2, 4, 8, 16, 32]
    MEMORY_WEIGHTS = [0.1, 0.2, 0.25, 0.2, 0.15, 0.07, 0.03]
    
    
    DURATION_MIN = 0.25
    DURATION_MAX = 8.0
    DURATION_MEAN = 2.0
    
    @classmethod
    def generate_workloads(
        cls,
        count: int,
        start_time: Optional[datetime] = None,
        time_span_hours: float = 24.0
    ) -> List[Workload]:
        """
        Generate random workloads.
        
        Args:
            count: Number of workloads to generate
            start_time: Start time for arrivals (default: now)
            time_span_hours: Time span over which workloads arrive
        
        Returns:
            List of Workload objects
        """
        if start_time is None:
            start_time = datetime.utcnow()
        
        workloads = []
        
        for i in range(count):
            
            cpu = random.choices(cls.CPU_OPTIONS, weights=cls.CPU_WEIGHTS)[0]
            
            
            memory_idx = min(
                cls.CPU_OPTIONS.index(cpu) + random.randint(-1, 1),
                len(cls.MEMORY_OPTIONS) - 1
            )
            memory_idx = max(0, memory_idx)
            memory = cls.MEMORY_OPTIONS[memory_idx]
            
            
            duration = max(
                cls.DURATION_MIN,
                min(
                    cls.DURATION_MAX,
                    random.lognormvariate(0.5, 0.8)
                )
            )
            
            
            arrival_offset = random.uniform(0, time_span_hours)
            arrival_time = start_time + timedelta(hours=arrival_offset)
            
            
            priority = random.choices(
                range(1, 11),
                weights=[1, 2, 3, 5, 8, 10, 8, 5, 3, 2]  
            )[0]
            
            
            buffer = random.uniform(1, 12)
            deadline = arrival_time + timedelta(hours=duration + buffer)
            
            workload = Workload(
                cpu=cpu,
                memory=memory,
                duration=round(duration, 2),
                priority=priority,
                arrival_time=arrival_time,
                deadline=deadline
            )
            
            workloads.append(workload)
        
        return workloads
    
    @classmethod
    def generate_burst_workload(
        cls,
        count: int,
        burst_time: Optional[datetime] = None,
        burst_duration_minutes: float = 30.0
    ) -> List[Workload]:
        """Generate burst of workloads arriving in short time window"""
        return cls.generate_workloads(
            count=count,
            start_time=burst_time,
            time_span_hours=burst_duration_minutes / 60.0
        )



workload_simulator = WorkloadSimulator()