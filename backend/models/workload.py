from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
import uuid

@dataclass
class Workload:
    """Represents a computational workload/task"""
    
    cpu: float  
    memory: float  
    duration: float  
    priority: int = 5  
    deadline: Optional[datetime] = None
    arrival_time: Optional[datetime] = None
    id: str = field(default_factory=lambda: str(uuid.uuid4())[:8])
    
    def __post_init__(self):
        """Validate workload parameters"""
        if self.cpu <= 0 or self.cpu > 64:
            raise ValueError(f"CPU must be between 0 and 64, got {self.cpu}")
        if self.memory <= 0 or self.memory > 256:
            raise ValueError(f"Memory must be between 0 and 256 GB, got {self.memory}")
        if self.duration <= 0 or self.duration > 168:  
            raise ValueError(f"Duration must be between 0 and 168 hours, got {self.duration}")
        if self.priority < 1 or self.priority > 10:
            raise ValueError(f"Priority must be between 1 and 10, got {self.priority}")
        
        if self.arrival_time is None:
            self.arrival_time = datetime.utcnow()
        if self.deadline is None:
            
            self.deadline = self.arrival_time + timedelta(hours=24)
    
    @property
    def energy_kwh(self) -> float:
        """Estimate energy consumption in kWh"""
        
        power_kw = self.cpu * 0.1
        return power_kw * self.duration
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'cpu': self.cpu,
            'memory': self.memory,
            'duration': self.duration,
            'priority': self.priority,
            'deadline': self.deadline.isoformat() if self.deadline else None,
            'arrival_time': self.arrival_time.isoformat() if self.arrival_time else None,
            'energy_kwh': self.energy_kwh
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'Workload':
        """Create Workload from dictionary"""
        return cls(
            id=data.get('id', str(uuid.uuid4())[:8]),
            cpu=float(data['cpu']),
            memory=float(data['memory']),
            duration=float(data['duration']),
            priority=int(data.get('priority', 5)),
            deadline=datetime.fromisoformat(data['deadline']) if data.get('deadline') else None,
            arrival_time=datetime.fromisoformat(data['arrival_time']) if data.get('arrival_time') else None
        )


from datetime import timedelta