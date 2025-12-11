from flask import Blueprint, request, jsonify
from models.workload import Workload
from services.optimizer import optimizer_service
from datetime import datetime

optimize_bp = Blueprint('optimize', __name__)


@optimize_bp.route('/optimize', methods=['POST'])
def optimize_workloads():
    """
    Optimize workload scheduling for minimum carbon emissions.
    
    Request Body:
    {
        "workloads": [
            {"cpu": 4, "memory": 8, "duration": 2, "priority": 5}
        ],
        "algorithm": "greedy",
        "datacenters": ["UK-North", "UK-South"]  // optional
    }
    
    Response:
    {
        "success": true,
        "schedule": {...},
        "metrics": {...},
        "baseline": {...}
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'workloads' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing workloads in request body'
            }), 400
        
        
        workloads = []
        for w_data in data['workloads']:
            try:
                workload = Workload.from_dict(w_data)
                workloads.append(workload)
            except (ValueError, KeyError) as e:
                return jsonify({
                    'success': False,
                    'error': f'Invalid workload data: {str(e)}'
                }), 400
        
        if not workloads:
            return jsonify({
                'success': False,
                'error': 'No valid workloads provided'
            }), 400
        
        
        algorithm = data.get('algorithm', 'greedy')
        datacenter_ids = data.get('datacenters')
        
        
        valid_algorithms = ['greedy', 'dp', 'fcfs', 'round_robin']
        if algorithm not in valid_algorithms:
            return jsonify({
                'success': False,
                'error': f'Invalid algorithm. Must be one of: {valid_algorithms}'
            }), 400
        
        
        result = optimizer_service.optimize(
            workloads=workloads,
            algorithm=algorithm,
            datacenter_ids=datacenter_ids
        )
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Optimization failed: {str(e)}'
        }), 500
