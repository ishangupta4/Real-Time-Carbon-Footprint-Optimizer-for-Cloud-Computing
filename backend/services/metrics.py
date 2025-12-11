from typing import Dict, List
from models.schedule import Schedule, Assignment
import numpy as np


class MetricsCalculator:
    """Calculate comprehensive metrics for scheduling results"""
    
    @staticmethod
    def calculate_carbon_metrics(
        optimized: Schedule, 
        baseline: Schedule
    ) -> Dict:
        """
        Calculate carbon-related metrics comparing optimized vs baseline.
        """
        opt_carbon = optimized.total_carbon
        base_carbon = baseline.total_carbon
        
        carbon_saved = base_carbon - opt_carbon
        percent_reduction = (carbon_saved / base_carbon * 100) if base_carbon > 0 else 0
        
        # Convert to relatable equivalents
        # Source: EPA greenhouse gas equivalencies
        metrics = {
            'total_carbon_optimized': round(opt_carbon, 2),
            'total_carbon_baseline': round(base_carbon, 2),
            'carbon_saved': round(carbon_saved, 2),
            'percent_reduction': round(percent_reduction, 1),
            'carbon_per_task': round(opt_carbon / len(optimized.assignments), 2) if optimized.assignments else 0,
            
            # Equivalents (approximate)
            'trees_equivalent': round(carbon_saved / 21000, 2),  # kg CO2 absorbed by tree/year
            'miles_driven_saved': round(carbon_saved / 404, 1),  # gCO2 per mile
            'smartphone_charges': round(carbon_saved / 8.22, 0),  # gCO2 per charge
            'hours_led_bulb': round(carbon_saved / 5, 0),  # 10W LED at 500g/kWh
        }
        
        return metrics
    
    @staticmethod
    def calculate_cost_metrics(schedule: Schedule) -> Dict:
        """Calculate cost-related metrics"""
        total_cost = schedule.total_cost
        num_tasks = len(schedule.assignments)
        
        return {
            'total_cost': round(total_cost, 2),
            'cost_per_task': round(total_cost / num_tasks, 2) if num_tasks > 0 else 0,
            'cost_per_carbon': round(total_cost / schedule.total_carbon, 4) if schedule.total_carbon > 0 else 0
        }
    
    @staticmethod
    def calculate_renewable_metrics(schedule: Schedule) -> Dict:
        """Calculate renewable energy utilization metrics"""
        if not schedule.assignments:
            return {
                'avg_renewable': 0,
                'tasks_on_green_dc': 0,
                'green_percentage': 0
            }
        
        renewable_values = [a.renewable_percentage for a in schedule.assignments]
        
        # Count tasks assigned to "green" datacenters (>50% renewable)
        green_tasks = sum(1 for r in renewable_values if r > 50)
        
        return {
            'avg_renewable': round(np.mean(renewable_values), 1),
            'min_renewable': round(min(renewable_values), 1),
            'max_renewable': round(max(renewable_values), 1),
            'tasks_on_green_dc': green_tasks,
            'green_percentage': round(green_tasks / len(schedule.assignments) * 100, 1)
        }
    
    @staticmethod
    def calculate_performance_metrics(schedule: Schedule) -> Dict:
        """Calculate scheduling performance metrics"""
        if not schedule.assignments:
            return {
                'tasks_scheduled': 0,
                'avg_duration': 0,
                'execution_time_ms': schedule.execution_time_ms
            }
        
        durations = [
            (a.end_time - a.start_time).total_seconds() / 3600 
            for a in schedule.assignments
        ]
        
        return {
            'tasks_scheduled': len(schedule.assignments),
            'avg_duration': round(np.mean(durations), 2),
            'total_duration': round(sum(durations), 2),
            'execution_time_ms': round(schedule.execution_time_ms, 2)
        }
    
    @staticmethod
    def calculate_datacenter_distribution(schedule: Schedule) -> Dict:
        """Calculate workload distribution across datacenters"""
        distribution = {}
        
        for assignment in schedule.assignments:
            dc_id = assignment.datacenter_id
            if dc_id not in distribution:
                distribution[dc_id] = {
                    'count': 0,
                    'total_carbon': 0,
                    'total_cost': 0
                }
            
            distribution[dc_id]['count'] += 1
            distribution[dc_id]['total_carbon'] += assignment.carbon_emissions
            distribution[dc_id]['total_cost'] += assignment.cost
        
        # Round values
        for dc_id in distribution:
            distribution[dc_id]['total_carbon'] = round(distribution[dc_id]['total_carbon'], 2)
            distribution[dc_id]['total_cost'] = round(distribution[dc_id]['total_cost'], 2)
        
        return distribution
    
    @classmethod
    def calculate_all_metrics(
        cls, 
        optimized: Schedule, 
        baseline: Schedule
    ) -> Dict:
        """Calculate all metrics in one call"""
        return {
            'carbon': cls.calculate_carbon_metrics(optimized, baseline),
            'cost': cls.calculate_cost_metrics(optimized),
            'renewable': cls.calculate_renewable_metrics(optimized),
            'performance': cls.calculate_performance_metrics(optimized),
            'distribution': cls.calculate_datacenter_distribution(optimized)
        }