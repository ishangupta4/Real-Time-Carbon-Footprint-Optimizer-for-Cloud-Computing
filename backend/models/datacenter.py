"""
Datacenter Model - Reordered for Algorithm Comparison
======================================================
File: backend/models/datacenter.py

KEY: Order starts with HIGH carbon DCs first!
This ensures FCFS (picks first) differs from Greedy (picks lowest carbon)
"""

from dataclasses import dataclass, field
from typing import Dict
from datetime import datetime


@dataclass
class Datacenter:
    """Represents a datacenter with capacity and carbon data"""
    
    id: str
    name: str
    location: str
    region_code: str
    latitude: float
    longitude: float
    total_cpu: float = 200.0
    total_memory: float = 800.0
    cost_per_core_hour: float = 0.05
    
    available_cpu: float = field(default=None)
    available_memory: float = field(default=None)
    current_carbon_intensity: float = 0.0
    renewable_percentage: float = 0.0
    generation_mix: Dict[str, float] = field(default_factory=dict)
    last_updated: datetime = field(default_factory=datetime.utcnow)
    
    def __post_init__(self):
        if self.available_cpu is None:
            self.available_cpu = self.total_cpu
        if self.available_memory is None:
            self.available_memory = self.total_memory
    
    def can_accommodate(self, cpu: float, memory: float) -> bool:
        return self.available_cpu >= cpu and self.available_memory >= memory
    
    def allocate(self, cpu: float, memory: float) -> bool:
        if not self.can_accommodate(cpu, memory):
            return False
        self.available_cpu -= cpu
        self.available_memory -= memory
        return True
    
    def release(self, cpu: float, memory: float):
        self.available_cpu = min(self.total_cpu, self.available_cpu + cpu)
        self.available_memory = min(self.total_memory, self.available_memory + memory)
    
    def reset_capacity(self):
        self.available_cpu = self.total_cpu
        self.available_memory = self.total_memory
    
    @property
    def utilization_cpu(self) -> float:
        return ((self.total_cpu - self.available_cpu) / self.total_cpu) * 100
    
    @property
    def utilization_memory(self) -> float:
        return ((self.total_memory - self.available_memory) / self.total_memory) * 100
    
    def to_dict(self) -> dict:
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
















DEFAULT_DATACENTERS = [
    
    Datacenter(
        id='UK-Wales',
        name='UK Wales',
        location='Cardiff, UK',
        region_code='7',
        latitude=51.4816,
        longitude=-3.1791,
        total_cpu=200,
        total_memory=800,
        cost_per_core_hour=0.044
    ),
    
    Datacenter(
        id='UK-South',
        name='UK South',
        location='London, UK',
        region_code='13',
        latitude=51.5074,
        longitude=-0.1278,
        total_cpu=200,
        total_memory=800,
        cost_per_core_hour=0.055
    ),
    
    Datacenter(
        id='UK-East',
        name='UK East',
        location='Cambridge, UK',
        region_code='12',
        latitude=52.2053,
        longitude=0.1218,
        total_cpu=200,
        total_memory=800,
        cost_per_core_hour=0.050
    ),
    
    Datacenter(
        id='UK-Midlands',
        name='UK Midlands',
        location='Birmingham, UK',
        region_code='9',
        latitude=52.4862,
        longitude=-1.8904,
        total_cpu=200,
        total_memory=800,
        cost_per_core_hour=0.048
    ),
    
    Datacenter(
        id='UK-North',
        name='UK North',
        location='Manchester, UK',
        region_code='4',
        latitude=53.4808,
        longitude=-2.2426,
        total_cpu=200,
        total_memory=800,
        cost_per_core_hour=0.045
    ),
    
    Datacenter(
        id='UK-Scotland',
        name='UK Scotland',
        location='Edinburgh, UK',
        region_code='2',
        latitude=55.9533,
        longitude=-3.1883,
        total_cpu=200,
        total_memory=800,
        cost_per_core_hour=0.042
    ),
]