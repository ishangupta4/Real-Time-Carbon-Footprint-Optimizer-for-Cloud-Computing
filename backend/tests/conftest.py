import pytest
import sys
import os


sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))


@pytest.fixture
def app():
    """Create test Flask app"""
    from app import app
    app.config['TESTING'] = True
    return app


@pytest.fixture
def client(app):
    """Create test client"""
    return app.test_client()


"""
============================================================
File: backend/quick_test.py
============================================================
Run this file to quickly test the backend:
    python quick_test.py
"""

from datetime import datetime, timedelta
from models.workload import Workload
from models.datacenter import DEFAULT_DATACENTERS
from algorithms.greedy import greedy_schedule
from algorithms.baseline import fcfs_schedule
from services.carbon_api import carbon_client
from services.simulator import workload_simulator
from services.metrics import MetricsCalculator


def main():
    print("🌱 Carbon Footprint Optimizer - Quick Test")
    print("=" * 50)
    
    
    print("\n📡 Testing Carbon API...")
    carbon_data = carbon_client.get_current_intensity()
    print(f"  ✓ Fetched carbon data for {len(carbon_data)} datacenters")
    for dc_id, data in carbon_data.items():
        print(f"    - {dc_id}: {data['intensity']:.1f} gCO2/kWh, {data['renewable']:.1f}% renewable")
    
    
    print("\n🔄 Testing Workload Simulator...")
    workloads = workload_simulator.generate_workloads(10)
    print(f"  ✓ Generated {len(workloads)} workloads")
    print(f"    - CPU range: {min(w.cpu for w in workloads)}-{max(w.cpu for w in workloads)} cores")
    print(f"    - Memory range: {min(w.memory for w in workloads)}-{max(w.memory for w in workloads)} GB")
    
    
    print("\n🎯 Testing Greedy Algorithm...")
    datacenters = DEFAULT_DATACENTERS.copy()
    for dc in datacenters:
        dc.reset_capacity()
    
    greedy_result = greedy_schedule(workloads, datacenters, carbon_data)
    print(f"  ✓ Scheduled {len(greedy_result.assignments)} tasks")
    print(f"    - Total carbon: {greedy_result.total_carbon:.2f} gCO2")
    print(f"    - Total cost: ${greedy_result.total_cost:.2f}")
    print(f"    - Execution time: {greedy_result.execution_time_ms:.2f} ms")
    
    
    print("\n📊 Testing FCFS Baseline...")
    for dc in datacenters:
        dc.reset_capacity()
    
    fcfs_result = fcfs_schedule(workloads, datacenters, carbon_data)
    print(f"  ✓ Scheduled {len(fcfs_result.assignments)} tasks")
    print(f"    - Total carbon: {fcfs_result.total_carbon:.2f} gCO2")
    
    
    print("\n📈 Carbon Savings Analysis...")
    metrics = MetricsCalculator.calculate_carbon_metrics(greedy_result, fcfs_result)
    print(f"  ✓ Carbon saved: {metrics['carbon_saved']:.2f} gCO2 ({metrics['percent_reduction']:.1f}%)")
    print(f"    - Equivalent to {metrics['trees_equivalent']:.4f} trees/year")
    print(f"    - Equivalent to {metrics['miles_driven_saved']:.1f} miles not driven")
    
    

    
    print("\n" + "=" * 50)
    print("📊 ALGORITHM COMPARISON")
    print("=" * 50)
    print(f"{'Algorithm':<15} {'Carbon (gCO2)':<15} {'Cost ($)':<10} {'Time (ms)':<10}")
    print("-" * 50)
    print(f"{'Greedy':<15} {greedy_result.total_carbon:<15.2f} {greedy_result.total_cost:<10.2f} {greedy_result.execution_time_ms:<10.2f}")
    print(f"{'FCFS':<15} {fcfs_result.total_carbon:<15.2f} {fcfs_result.total_cost:<10.2f} {fcfs_result.execution_time_ms:<10.2f}")
    
    best = min(
        [('Greedy', greedy_result), ('FCFS', fcfs_result)],
        key=lambda x: x[1].total_carbon
    )
    print(f"\n🏆 Best algorithm: {best[0]} with {best[1].total_carbon:.2f} gCO2")
    
    print("\n✅ All tests passed!")


if __name__ == '__main__':
    main()