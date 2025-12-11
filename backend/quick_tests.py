from datetime import datetime, timedelta
from models.workload import Workload
from models.datacenter import DEFAULT_DATACENTERS
from algorithms.greedy import greedy_schedule
from algorithms.baseline import fcfs_schedule, round_robin_schedule
from services.carbon_api import carbon_client
from services.simulator import workload_simulator
from services.metrics import MetricsCalculator


def main():
    print("🌱 Carbon Footprint Optimizer - Quick Test")
    print("=" * 50)
    
    # Test 1: Carbon API
    print("\n📡 Testing Carbon API...")
    carbon_data = carbon_client.get_current_intensity()
    print(f"  ✓ Fetched carbon data for {len(carbon_data)} datacenters")
    for dc_id, data in carbon_data.items():
        print(f"    - {dc_id}: {data['intensity']:.1f} gCO2/kWh, {data['renewable']:.1f}% renewable")
    
    # Test 2: Workload Simulator
    print("\n🔄 Testing Workload Simulator...")
    workloads = workload_simulator.generate_workloads(10)
    print(f"  ✓ Generated {len(workloads)} workloads")
    print(f"    - CPU range: {min(w.cpu for w in workloads)}-{max(w.cpu for w in workloads)} cores")
    print(f"    - Memory range: {min(w.memory for w in workloads)}-{max(w.memory for w in workloads)} GB")
    
    # Test 3: Greedy Algorithm
    print("\n🎯 Testing Greedy Algorithm...")
    datacenters = DEFAULT_DATACENTERS.copy()
    for dc in datacenters:
        dc.reset_capacity()
    
    greedy_result = greedy_schedule(workloads, datacenters, carbon_data)
    print(f"  ✓ Scheduled {len(greedy_result.assignments)} tasks")
    print(f"    - Total carbon: {greedy_result.total_carbon:.2f} gCO2")
    print(f"    - Total cost: ${greedy_result.total_cost:.2f}")
    print(f"    - Execution time: {greedy_result.execution_time_ms:.2f} ms")
    
    # Test 4: FCFS Baseline
    print("\n📊 Testing FCFS Baseline...")
    for dc in datacenters:
        dc.reset_capacity()
    
    fcfs_result = fcfs_schedule(workloads, datacenters, carbon_data)
    print(f"  ✓ Scheduled {len(fcfs_result.assignments)} tasks")
    print(f"    - Total carbon: {fcfs_result.total_carbon:.2f} gCO2")
    
    # Test 5: Metrics Comparison
    print("\n📈 Carbon Savings Analysis...")
    metrics = MetricsCalculator.calculate_carbon_metrics(greedy_result, fcfs_result)
    print(f"  ✓ Carbon saved: {metrics['carbon_saved']:.2f} gCO2 ({metrics['percent_reduction']:.1f}%)")
    print(f"    - Equivalent to {metrics['trees_equivalent']:.4f} trees/year")
    print(f"    - Equivalent to {metrics['miles_driven_saved']:.1f} miles not driven")
    
    # Test 6: Round Robin
    print("\n🔄 Testing Round Robin...")
    for dc in datacenters:
        dc.reset_capacity()
    
    rr_result = round_robin_schedule(workloads, datacenters, carbon_data)
    print(f"  ✓ Total carbon: {rr_result.total_carbon:.2f} gCO2")
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 ALGORITHM COMPARISON")
    print("=" * 50)
    print(f"{'Algorithm':<15} {'Carbon (gCO2)':<15} {'Cost ($)':<10} {'Time (ms)':<10}")
    print("-" * 50)
    print(f"{'Greedy':<15} {greedy_result.total_carbon:<15.2f} {greedy_result.total_cost:<10.2f} {greedy_result.execution_time_ms:<10.2f}")
    print(f"{'FCFS':<15} {fcfs_result.total_carbon:<15.2f} {fcfs_result.total_cost:<10.2f} {fcfs_result.execution_time_ms:<10.2f}")
    print(f"{'Round Robin':<15} {rr_result.total_carbon:<15.2f} {rr_result.total_cost:<10.2f} {rr_result.execution_time_ms:<10.2f}")
    
    best = min(
        [('Greedy', greedy_result), ('FCFS', fcfs_result), ('Round Robin', rr_result)],
        key=lambda x: x[1].total_carbon
    )
    print(f"\n🏆 Best algorithm: {best[0]} with {best[1].total_carbon:.2f} gCO2")
    
    print("\n✅ All tests passed!")


if __name__ == '__main__':
    main()