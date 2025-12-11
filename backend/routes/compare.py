from flask import Blueprint, request, jsonify
from models.workload import Workload
from services.optimizer import optimizer_service

compare_bp = Blueprint('compare', __name__)


@compare_bp.route('/compare', methods=['POST'])
def compare_algorithms():
    """
    Compare multiple algorithms on the same workload set.
    
    Request Body:
    {
        "workloads": [...],
        "algorithms": ["greedy", "dp", "fcfs", "round_robin"]
    }
    
    Response:
    {
        "success": true,
        "results": {
            "greedy": {"total_carbon": 1234, ...},
            "dp": {"total_carbon": 1100, ...}
        },
        "best_algorithm": "dp"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'workloads' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing workloads in request'
            }), 400
        
        
        workloads = []
        for w_data in data['workloads']:
            try:
                workload = Workload.from_dict(w_data)
                workloads.append(workload)
            except (ValueError, KeyError) as e:
                return jsonify({
                    'success': False,
                    'error': f'Invalid workload: {str(e)}'
                }), 400
        
        algorithms = data.get('algorithms')
        datacenter_ids = data.get('datacenters')
        
        result = optimizer_service.compare_algorithms(
            workloads=workloads,
            algorithms=algorithms,
            datacenter_ids=datacenter_ids
        )
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Comparison failed: {str(e)}'
        }), 500