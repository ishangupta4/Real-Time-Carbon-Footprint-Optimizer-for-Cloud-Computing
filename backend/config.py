import os
from datetime import timedelta

class Config:
    """Application configuration"""
    
    
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key')
    DEBUG = os.environ.get('FLASK_DEBUG', True)
    
    
    CARBON_API_BASE_URL = 'https://api.carbonintensity.org.uk'
    CARBON_CACHE_TTL = timedelta(minutes=30)
    
    
    DEFAULT_DATACENTERS = [
        'UK-North', 'UK-South', 'UK-Midlands', 
        'UK-East', 'UK-West', 'UK-Scotland'
    ]
    
    
    MAX_WORKLOADS_PER_REQUEST = 1000
    DEFAULT_ALGORITHM = 'greedy'
    SUPPORTED_ALGORITHMS = ['greedy', 'dp', 'graph', 'fcfs', 'round_robin']
