from dataclasses import dataclass, field
from typing import Dict, List, Optional
from datetime import datetime

@dataclass
class Datacenter:
    """Represents a datacenter with capacity and carbon data"""
    
    id: str
    name: str
    location: str
    region_code: str  # UK Carbon API region code
    latitude: float
    longitude: float
    total_cpu: float = 1000.0  # Total CPU cores
    total_memory: float = 4000.0  # Total memory in GB
    cost_per_core_hour: float = 0.05  # $/core-hour
    
    # Current state (mutable)
    available_cpu: float = field(default=None)
    available_memory: float = field(default=None)
    current_carbon_intensity: float = 0.0  # gCO2/kWh
    renewable_percentage: float = 0.0
    generation_mix: Dict[str, float] = field(default_factory=dict)
    last_updated: datetime = field(default_factory=datetime.utcnow)
    
    def __post_init__(self):
        if self.available_cpu is None:
            self.available_cpu = self.total_cpu
        if self.available_memory is None:
            self.available_memory = self.total_memory
    
    def can_accommodate(self, cpu: float, memory: float) -> bool:
        """Check if datacenter has capacity for workload"""
        return self.available_cpu >= cpu and self.available_memory >= memory
    
    def allocate(self, cpu: float, memory: float) -> bool:
        """Allocate resources for a workload"""
        if not self.can_accommodate(cpu, memory):
            return False
        self.available_cpu -= cpu
        self.available_memory -= memory
        return True
    
    def release(self, cpu: float, memory: float):
        """Release resources after workload completion"""
        self.available_cpu = min(self.total_cpu, self.available_cpu + cpu)
        self.available_memory = min(self.total_memory, self.available_memory + memory)
    
    def reset_capacity(self):
        """Reset to full capacity"""
        self.available_cpu = self.total_cpu
        self.available_memory = self.total_memory
    
    @property
    def utilization_cpu(self) -> float:
        """CPU utilization percentage"""
        return ((self.total_cpu - self.available_cpu) / self.total_cpu) * 100
    
    @property
    def utilization_memory(self) -> float:
        """Memory utilization percentage"""
        return ((self.total_memory - self.available_memory) / self.total_memory) * 100
    
    def to_dict(self) -> dict:
        """Convert to dictionary for JSON serialization"""
        return {
            'id': self.id,
            'name': self.name,
            'location': self.location,
            'region_code': self.region_code,
            'coordinates': {'lat': self.latitude, 'lng': self.longitude},
            'capacity': {
                'total_cpu': self.total_cpu,
                'total_memory': self.total_memory,
                'available_cpu': self.available_cpu,
                'available_memory': self.available_memory,
                'utilization_cpu': self.utilization_cpu,
                'utilization_memory': self.utilization_memory
            },
            'carbon': {
                'intensity': self.current_carbon_intensity,
                'renewable_percentage': self.renewable_percentage,
                'generation_mix': self.generation_mix
            },
            'cost_per_core_hour': self.cost_per_core_hour,
            'last_updated': self.last_updated.isoformat()
        }


# Pre-configured UK datacenters (mapping to UK Carbon API regions)
DEFAULT_DATACENTERS = [
    Datacenter(
        id='UK-North',
        name='UK North',
        location='Manchester, UK',
        region_code='1',  # North Scotland
        latitude=53.4808,
        longitude=-2.2426,
        total_cpu=800,
        total_memory=3200,
        cost_per_core_hour=0.045
    ),
    Datacenter(
        id='UK-South',
        name='UK South',
        location='London, UK',
        region_code='13',  # South England
        latitude=51.5074,
        longitude=-0.1278,
        total_cpu=1200,
        total_memory=4800,
        cost_per_core_hour=0.055
    ),
    Datacenter(
        id='UK-Midlands',
        name='UK Midlands',
        location='Birmingham, UK',
        region_code='9',  # West Midlands
        latitude=52.4862,
        longitude=-1.8904,
        total_cpu=600,
        total_memory=2400,
        cost_per_core_hour=0.048
    ),
    Datacenter(
        id='UK-Scotland',
        name='UK Scotland',
        location='Edinburgh, UK',
        region_code='2',  # South Scotland
        latitude=55.9533,
        longitude=-3.1883,
        total_cpu=500,
        total_memory=2000,
        cost_per_core_hour=0.042
    ),
    Datacenter(
        id='UK-Wales',
        name='UK Wales',
        location='Cardiff, UK',
        region_code='7',  # Wales
        latitude=51.4816,
        longitude=-3.1791,
        total_cpu=400,
        total_memory=1600,
        cost_per_core_hour=0.044
    ),
    Datacenter(
        id='UK-East',
        name='UK East',
        location='Cambridge, UK',
        region_code='12',  # East England
        latitude=52.2053,
        longitude=0.1218,
        total_cpu=700,
        total_memory=2800,
        cost_per_core_hour=0.050
    )
]