from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional

@dataclass
class Assignment:
    """Represents a single workload-to-datacenter assignment"""
    
    workload_id: str
    datacenter_id: str
    start_time: datetime
    end_time: datetime
    carbon_emissions: float  
    cost: float  
    carbon_intensity: float  
    renewable_percentage: float
    
    def to_dict(self) -> dict:
        return {
            'workload_id': self.workload_id,
            'datacenter_id': self.datacenter_id,
            'start_time': self.start_time.isoformat(),
            'end_time': self.end_time.isoformat(),
            'carbon_emissions': round(self.carbon_emissions, 2),
            'cost': round(self.cost, 2),
            'carbon_intensity': round(self.carbon_intensity, 2),
            'renewable_percentage': round(self.renewable_percentage, 1)
        }


@dataclass
class Schedule:
    """Complete schedule with all assignments and metrics"""
    
    assignments: List[Assignment] = field(default_factory=list)
    algorithm_used: str = ''
    execution_time_ms: float = 0.0
    timestamp: datetime = field(default_factory=datetime.utcnow)
    
    @property
    def total_carbon(self) -> float:
        """Total carbon emissions in gCO2"""
        return sum(a.carbon_emissions for a in self.assignments)
    
    @property
    def total_cost(self) -> float:
        """Total cost in $"""
        return sum(a.cost for a in self.assignments)
    
    @property
    def avg_carbon_intensity(self) -> float:
        """Average carbon intensity across assignments"""
        if not self.assignments:
            return 0.0
        return sum(a.carbon_intensity for a in self.assignments) / len(self.assignments)
    
    @property
    def avg_renewable(self) -> float:
        """Average renewable percentage"""
        if not self.assignments:
            return 0.0
        return sum(a.renewable_percentage for a in self.assignments) / len(self.assignments)
    
    def to_dict(self) -> dict:
        return {
            'assignments': [a.to_dict() for a in self.assignments],
            'algorithm_used': self.algorithm_used,
            'execution_time_ms': round(self.execution_time_ms, 2),
            'timestamp': self.timestamp.isoformat(),
            'summary': {
                'total_carbon': round(self.total_carbon, 2),
                'total_cost': round(self.total_cost, 2),
                'avg_carbon_intensity': round(self.avg_carbon_intensity, 2),
                'avg_renewable': round(self.avg_renewable, 1),
                'tasks_scheduled': len(self.assignments)
            }
        }