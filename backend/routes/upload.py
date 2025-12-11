

import json
import csv
import io
from flask import Blueprint, request, jsonify
from models.workload import Workload
from datetime import datetime

upload_bp = Blueprint('upload', __name__)


@upload_bp.route('/upload/parse', methods=['POST'])
def parse_workloads():
    """
    Parse workloads from uploaded CSV or JSON file.
    
    Expected CSV format:
    cpu,memory,duration,priority
    4,8,2,5
    2,4,1,3
    
    Expected JSON format:
    [
        {"cpu": 4, "memory": 8, "duration": 2, "priority": 5},
        {"cpu": 2, "memory": 4, "duration": 1, "priority": 3}
    ]
    
    Returns parsed workloads ready for optimization.
    """
    try:
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file uploaded'
            }), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400
        
        filename = file.filename.lower()
        content = file.read().decode('utf-8')
        
        workloads_data = []
        
        
        if filename.endswith('.json'):
            workloads_data = parse_json(content)
        elif filename.endswith('.csv'):
            workloads_data = parse_csv(content)
        else:
            return jsonify({
                'success': False,
                'error': 'Unsupported file format. Use .csv or .json'
            }), 400
        
        
        workloads = []
        errors = []
        
        for i, data in enumerate(workloads_data):
            try:
                workload = validate_workload_data(data, i)
                workloads.append(workload.to_dict())
            except ValueError as e:
                errors.append(f"Row {i + 1}: {str(e)}")
        
        if not workloads:
            return jsonify({
                'success': False,
                'error': 'No valid workloads found',
                'details': errors
            }), 400
        
        return jsonify({
            'success': True,
            'workloads': workloads,
            'count': len(workloads),
            'errors': errors if errors else None,
            'message': f'Successfully parsed {len(workloads)} workloads' + 
                      (f' ({len(errors)} rows had errors)' if errors else '')
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to parse file: {str(e)}'
        }), 500


def parse_json(content: str) -> list:
    """Parse JSON content into workload data."""
    data = json.loads(content)
    
    
    if isinstance(data, list):
        return data
    elif isinstance(data, dict) and 'workloads' in data:
        return data['workloads']
    else:
        raise ValueError("JSON must be an array or object with 'workloads' key")


def parse_csv(content: str) -> list:
    """Parse CSV content into workload data."""
    workloads = []
    
    
    csv_file = io.StringIO(content)
    
    
    sample = content[:1000]
    has_header = 'cpu' in sample.lower() or 'memory' in sample.lower()
    
    if has_header:
        reader = csv.DictReader(csv_file)
        for row in reader:
            
            normalized = {k.lower().strip(): v.strip() for k, v in row.items()}
            workloads.append(normalized)
    else:
        
        reader = csv.reader(csv_file)
        for row in reader:
            if len(row) >= 3:
                workloads.append({
                    'cpu': row[0].strip(),
                    'memory': row[1].strip(),
                    'duration': row[2].strip(),
                    'priority': row[3].strip() if len(row) > 3 else '5'
                })
    
    return workloads


def validate_workload_data(data: dict, index: int) -> Workload:
    """Validate and create a Workload from parsed data."""
    
    
    try:
        cpu = float(data.get('cpu', 0))
    except (ValueError, TypeError):
        raise ValueError(f"Invalid CPU value: {data.get('cpu')}")
    
    try:
        memory = float(data.get('memory', 0))
    except (ValueError, TypeError):
        raise ValueError(f"Invalid memory value: {data.get('memory')}")
    
    try:
        duration = float(data.get('duration', 0))
    except (ValueError, TypeError):
        raise ValueError(f"Invalid duration value: {data.get('duration')}")
    
    try:
        priority = int(data.get('priority', 5))
    except (ValueError, TypeError):
        priority = 5
    
    
    if cpu <= 0 or cpu > 64:
        raise ValueError(f"CPU must be between 0 and 64, got {cpu}")
    if memory <= 0 or memory > 256:
        raise ValueError(f"Memory must be between 0 and 256, got {memory}")
    if duration <= 0 or duration > 168:
        raise ValueError(f"Duration must be between 0 and 168, got {duration}")
    
    priority = max(1, min(10, priority))
    
    return Workload(
        cpu=cpu,
        memory=memory,
        duration=duration,
        priority=priority
    )


@upload_bp.route('/upload/template/csv', methods=['GET'])
def get_csv_template():
    """Return a sample CSV template."""
    template = """cpu,memory,duration,priority
4,8,2,5
2,4,1,7
8,16,3,3
1,2,0.5,9
16,32,4,5"""
    
    return template, 200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=workloads_template.csv'
    }


@upload_bp.route('/upload/template/json', methods=['GET'])
def get_json_template():
    """Return a sample JSON template."""
    template = {
        "workloads": [
            {"cpu": 4, "memory": 8, "duration": 2, "priority": 5},
            {"cpu": 2, "memory": 4, "duration": 1, "priority": 7},
            {"cpu": 8, "memory": 16, "duration": 3, "priority": 3},
            {"cpu": 1, "memory": 2, "duration": 0.5, "priority": 9},
            {"cpu": 16, "memory": 32, "duration": 4, "priority": 5}
        ]
    }
    
    return jsonify(template), 200, {
        'Content-Disposition': 'attachment; filename=workloads_template.json'
    }