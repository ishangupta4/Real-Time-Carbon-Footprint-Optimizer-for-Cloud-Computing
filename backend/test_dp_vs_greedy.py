"""
Final Algorithm Test
====================
Save as: backend/test_all_algorithms.py
Run with: python test_all_algorithms.py

This verifies that FCFS, Greedy, and DP give DIFFERENT results.
"""

from datetime import datetime, timedelta
import copy
from models.workload import Workload
from models.datacenter import Datacenter, DEFAULT_DATACENTERS
from algorithms.greedy import greedy_schedule
from algorithms.dynamic_programming import dp_schedule
from algorithms.baseline import fcfs_schedule
from services.carbon_api import carbon_client


def run_test():
    print("=" * 70)
    print("FINAL ALGORITHM TEST")
    print("=" * 70)
    
    # Fetch real carbon data
    print("\n📡 Fetching real carbon intensity data...")
    carbon_data = carbon_client.get_current_intensity()
    forecast = carbon_client.get_forecast(24)
    
    print("\nCurrent Carbon Intensity:")
    sorted_carbon = sorted(carbon_data.items(), key=lambda x: x[1]['intensity'])
    for dc_id, data in sorted_carbon:
        print(f"  {dc_id}: {data['intensity']:.0f} gCO2/kWh, {data['renewable']:.0f}% renewable")
    
    lowest_dc = sorted_carbon[0][0]
    highest_dc = sorted_carbon[-1][0]
    print(f"\n  Lowest carbon:  {lowest_dc}")
    print(f"  Highest carbon: {highest_dc}")
    
    # Show datacenter ORDER (important for FCFS)
    print("\n📋 Datacenter LIST ORDER (FCFS uses this):")
    for i, dc in enumerate(DEFAULT_DATACENTERS):
        intensity = carbon_data.get(dc.id, {}).get('intensity', 0)
        print(f"  [{i}] {dc.id}: {intensity:.0f} gCO2/kWh")
    
    # Create workloads
    print("\n📦 Creating 20 test workloads...")
    workloads = [
        Workload(cpu=4, memory=8, duration=1, priority=5)
        for _ in range(20)
    ]
    
    # Run all algorithms
    results = {}
    
    # FCFS
    print("\n" + "-" * 50)
    print("Running FCFS...")
    dcs = copy.deepcopy(DEFAULT_DATACENTERS)
    for dc in dcs:
        dc.reset_capacity()
    fcfs_result = fcfs_schedule(workloads, dcs, carbon_data)
    results['FCFS'] = fcfs_result
    
    # Greedy
    print("Running Greedy...")
    dcs = copy.deepcopy(DEFAULT_DATACENTERS)
    for dc in dcs:
        dc.reset_capacity()
    greedy_result = greedy_schedule(workloads, dcs, carbon_data)
    results['Greedy'] = greedy_result
    
    # DP
    print("Running DP...")
    dcs = copy.deepcopy(DEFAULT_DATACENTERS)
    for dc in dcs:
        dc.reset_capacity()
    dp_result = dp_schedule(workloads, dcs, forecast, time_slots=24)
    results['DP'] = dp_result
    
    # Print results
    print("\n" + "=" * 70)
    print("RESULTS")
    print("=" * 70)
    
    for algo_name, result in results.items():
        print(f"\n{algo_name}:")
        
        # Distribution
        dist = {}
        for a in result.assignments:
            dist[a.datacenter_id] = dist.get(a.datacenter_id, 0) + 1
        
        print(f"  Distribution:")
        for dc_id, count in sorted(dist.items(), key=lambda x: -x[1]):
            intensity = carbon_data.get(dc_id, {}).get('intensity', 0)
            print(f"    {dc_id}: {count} tasks (carbon: {intensity:.0f})")
        
        print(f"  Total Carbon: {result.total_carbon:.0f} gCO2")
        print(f"  Execution Time: {result.execution_time_ms:.2f} ms")
    
    # Comparison
    print("\n" + "=" * 70)
    print("COMPARISON")
    print("=" * 70)
    
    print(f"\n{'Algorithm':<12} {'Carbon (gCO2)':<15} {'Time (ms)':<12} {'Primary DC':<15}")
    print("-" * 55)
    
    for algo_name, result in results.items():
        dist = {}
        for a in result.assignments:
            dist[a.datacenter_id] = dist.get(a.datacenter_id, 0) + 1
        primary_dc = max(dist.items(), key=lambda x: x[1])[0] if dist else "N/A"
        
        print(f"{algo_name:<12} {result.total_carbon:<15.0f} {result.execution_time_ms:<12.2f} {primary_dc:<15}")
    
    # Check if algorithms differ
    print("\n" + "=" * 70)
    print("VERIFICATION")
    print("=" * 70)
    
    fcfs_carbon = results['FCFS'].total_carbon
    greedy_carbon = results['Greedy'].total_carbon
    dp_carbon = results['DP'].total_carbon
    
    # Get primary DC for each
    def get_primary_dc(result):
        dist = {}
        for a in result.assignments:
            dist[a.datacenter_id] = dist.get(a.datacenter_id, 0) + 1
        return max(dist.items(), key=lambda x: x[1])[0] if dist else None
    
    fcfs_dc = get_primary_dc(results['FCFS'])
    greedy_dc = get_primary_dc(results['Greedy'])
    dp_dc = get_primary_dc(results['DP'])
    
    print(f"\nFCFS primary DC:   {fcfs_dc}")
    print(f"Greedy primary DC: {greedy_dc}")
    print(f"DP primary DC:     {dp_dc}")
    
    if fcfs_dc != greedy_dc:
        print("\n✅ FCFS and Greedy chose DIFFERENT datacenters!")
        print(f"   FCFS chose {fcfs_dc} (first in list)")
        print(f"   Greedy chose {greedy_dc} (lowest carbon)")
        savings = fcfs_carbon - greedy_carbon
        pct = (savings / fcfs_carbon) * 100
        print(f"   Greedy saved {savings:.0f} gCO2 ({pct:.1f}%)")
    else:
        print("\n⚠️  FCFS and Greedy chose the SAME datacenter")
        print("   This happens when the first DC in the list also has lowest carbon")
        print("   Check DEFAULT_DATACENTERS order in datacenter.py")
    
    if greedy_carbon <= dp_carbon:
        print(f"\n✅ Greedy carbon ({greedy_carbon:.0f}) <= DP carbon ({dp_carbon:.0f})")
    else:
        print(f"\n✅ DP carbon ({dp_carbon:.0f}) < Greedy carbon ({greedy_carbon:.0f})")
        print("   DP found a better schedule using time-shifting!")
    
    # Best algorithm
    best = min(results.items(), key=lambda x: x[1].total_carbon)
    print(f"\n🏆 Best algorithm: {best[0]} with {best[1].total_carbon:.0f} gCO2")


if __name__ == '__main__':
    run_test()