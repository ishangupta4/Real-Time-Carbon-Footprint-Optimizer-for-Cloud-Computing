import pytest
from datetime import datetime, timedelta
import sys
sys.path.insert(0, '..')

from models.workload import Workload
from models.datacenter import Datacenter, DEFAULT_DATACENTERS
from algorithms.greedy import greedy_schedule
from algorithms.baseline import fcfs_schedule, round_robin_schedule


@pytest.fixture
def sample_workloads():
    """Create sample workloads for testing"""
    base_time = datetime.utcnow()
    return [
        Workload(cpu=4, memory=8, duration=2, priority=5, arrival_time=base_time),
        Workload(cpu=2, memory=4, duration=1, priority=7, arrival_time=base_time + timedelta(hours=1)),
        Workload(cpu=8, memory=16, duration=3, priority=3, arrival_time=base_time + timedelta(hours=2)),
        Workload(cpu=1, memory=2, duration=0.5, priority=9, arrival_time=base_time + timedelta(hours=0.5)),
    ]


@pytest.fixture
def sample_datacenters():
    """Create sample datacenters"""
    return [
        Datacenter(
            id='DC-Low', name='Low Carbon DC', location='Scotland',
            region_code='1', latitude=55.9, longitude=-3.2,
            total_cpu=100, total_memory=400
        ),
        Datacenter(
            id='DC-Medium', name='Medium Carbon DC', location='London',
            region_code='13', latitude=51.5, longitude=-0.1,
            total_cpu=200, total_memory=800
        ),
        Datacenter(
            id='DC-High', name='High Carbon DC', location='Birmingham',
            region_code='9', latitude=52.5, longitude=-1.9,
            total_cpu=150, total_memory=600
        ),
    ]


@pytest.fixture
def carbon_data():
    """Sample carbon intensity data"""
    return {
        'DC-Low': {'intensity': 100, 'renewable': 80},
        'DC-Medium': {'intensity': 200, 'renewable': 45},
        'DC-High': {'intensity': 300, 'renewable': 25},
    }


class TestWorkloadModel:
    """Test Workload model"""
    
    def test_workload_creation(self):
        """Test basic workload creation"""
        w = Workload(cpu=4, memory=8, duration=2)
        assert w.cpu == 4
        assert w.memory == 8
        assert w.duration == 2
        assert w.priority == 5  # Default
    
    def test_workload_energy_calculation(self):
        """Test energy consumption calculation"""
        w = Workload(cpu=4, memory=8, duration=2)
        # 4 cores * 0.1 kW/core * 2 hours = 0.8 kWh
        assert w.energy_kwh == 0.8
    
    def test_workload_validation(self):
        """Test workload validation"""
        with pytest.raises(ValueError):
            Workload(cpu=-1, memory=8, duration=2)
        
        with pytest.raises(ValueError):
            Workload(cpu=4, memory=8, duration=200)  # > 168 hours
    
    def test_workload_serialization(self):
        """Test to_dict and from_dict"""
        w = Workload(cpu=4, memory=8, duration=2, priority=7)
        d = w.to_dict()
        
        assert d['cpu'] == 4
        assert d['memory'] == 8
        assert d['priority'] == 7
        
        w2 = Workload.from_dict(d)
        assert w2.cpu == w.cpu
        assert w2.memory == w.memory


class TestDatacenterModel:
    """Test Datacenter model"""
    
    def test_datacenter_capacity(self, sample_datacenters):
        """Test capacity checking"""
        dc = sample_datacenters[0]  # 100 CPU, 400 memory
        
        assert dc.can_accommodate(50, 200) is True
        assert dc.can_accommodate(150, 200) is False
        assert dc.can_accommodate(50, 500) is False
    
    def test_datacenter_allocation(self, sample_datacenters):
        """Test resource allocation"""
        dc = sample_datacenters[0]
        dc.reset_capacity()
        
        assert dc.allocate(50, 200) is True
        assert dc.available_cpu == 50
        assert dc.available_memory == 200
        
        assert dc.allocate(60, 100) is False  # Not enough CPU
    
    def test_datacenter_utilization(self, sample_datacenters):
        """Test utilization calculation"""
        dc = sample_datacenters[0]
        dc.reset_capacity()
        dc.allocate(50, 200)
        
        assert dc.utilization_cpu == 50.0
        assert dc.utilization_memory == 50.0


class TestGreedyAlgorithm:
    """Test Greedy scheduling algorithm"""
    
    def test_greedy_basic(self, sample_workloads, sample_datacenters, carbon_data):
        """Test basic greedy scheduling"""
        schedule = greedy_schedule(
            sample_workloads, 
            sample_datacenters, 
            carbon_data
        )
        
        assert len(schedule.assignments) == len(sample_workloads)
        assert schedule.algorithm_used == 'greedy'
    
    def test_greedy_prefers_low_carbon(self, sample_workloads, sample_datacenters, carbon_data):
        """Test that greedy prefers low carbon datacenters"""
        schedule = greedy_schedule(
            sample_workloads[:1],  # Just one workload
            sample_datacenters, 
            carbon_data
        )
        
        # Should assign to DC-Low (lowest carbon intensity)
        assert schedule.assignments[0].datacenter_id == 'DC-Low'
    
    def test_greedy_carbon_calculation(self, sample_datacenters, carbon_data):
        """Test carbon emission calculation"""
        workloads = [Workload(cpu=4, memory=8, duration=2)]  # 0.8 kWh
        
        schedule = greedy_schedule(workloads, sample_datacenters, carbon_data)
        
        # Assigned to DC-Low with intensity 100 gCO2/kWh
        # Expected: 0.8 kWh * 100 gCO2/kWh = 80 gCO2
        assert schedule.assignments[0].carbon_emissions == 80.0


class TestBaselineAlgorithms:
    """Test baseline algorithms"""
    
    def test_fcfs_schedules_all(self, sample_workloads, sample_datacenters, carbon_data):
        """Test FCFS schedules all workloads"""
        schedule = fcfs_schedule(
            sample_workloads, 
            sample_datacenters, 
            carbon_data
        )
        
        assert len(schedule.assignments) == len(sample_workloads)
        assert schedule.algorithm_used == 'fcfs'
    
    def test_round_robin_distributes(self, sample_datacenters, carbon_data):
        """Test round robin distributes across DCs"""
        workloads = [Workload(cpu=1, memory=2, duration=1) for _ in range(6)]
        
        schedule = round_robin_schedule(workloads, sample_datacenters, carbon_data)
        
        # Should distribute 2 to each DC (6 workloads, 3 DCs)
        dc_counts = {}
        for a in schedule.assignments:
            dc_counts[a.datacenter_id] = dc_counts.get(a.datacenter_id, 0) + 1
        
        # Each DC should have at least 1 assignment
        assert len(dc_counts) == 3


class TestAlgorithmComparison:
    """Test algorithm comparison"""
    
    def test_greedy_beats_fcfs(self, sample_workloads, sample_datacenters, carbon_data):
        """Test that greedy produces less carbon than FCFS"""
        greedy_schedule_result = greedy_schedule(
            sample_workloads, 
            sample_datacenters, 
            carbon_data
        )
        
        fcfs_schedule_result = fcfs_schedule(
            sample_workloads, 
            sample_datacenters, 
            carbon_data
        )
        
        # Greedy should have lower or equal carbon
        assert greedy_schedule_result.total_carbon <= fcfs_schedule_result.total_carbon
