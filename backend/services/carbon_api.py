import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import time
from functools import lru_cache


class CarbonAPIClient:
    """
    Client for UK Carbon Intensity API
    https://carbonintensity.org.uk/
    """
    
    BASE_URL = "https://api.carbonintensity.org.uk"
    
    # UK Region codes to our datacenter IDs
    REGION_MAPPING = {
        '1': 'UK-Scotland',     # North Scotland
        '2': 'UK-Scotland',     # South Scotland  
        '7': 'UK-Wales',        # Wales
        '9': 'UK-Midlands',     # West Midlands
        '12': 'UK-East',        # East England
        '13': 'UK-South',       # South England
        '4': 'UK-North',        # North West England
    }
    
    # Reverse mapping
    DC_TO_REGION = {
        'UK-North': '4',
        'UK-South': '13', 
        'UK-Midlands': '9',
        'UK-Scotland': '2',
        'UK-Wales': '7',
        'UK-East': '12'
    }
    
    def __init__(self, cache_ttl_minutes: int = 30):
        self.cache_ttl = timedelta(minutes=cache_ttl_minutes)
        self._cache = {}
        self._cache_timestamps = {}
    
    def _is_cache_valid(self, key: str) -> bool:
        """Check if cached data is still valid"""
        if key not in self._cache_timestamps:
            return False
        age = datetime.utcnow() - self._cache_timestamps[key]
        return age < self.cache_ttl
    
    def _get_cached(self, key: str) -> Optional[Dict]:
        """Get cached data if valid"""
        if self._is_cache_valid(key):
            return self._cache.get(key)
        return None
    
    def _set_cache(self, key: str, data: Dict):
        """Store data in cache"""
        self._cache[key] = data
        self._cache_timestamps[key] = datetime.utcnow()
    
    def get_current_intensity(self) -> Dict[str, Dict]:
        """
        Fetch current carbon intensity for all UK regions.
        
        Returns:
            Dict mapping datacenter_id to carbon data:
            {
                'UK-North': {
                    'intensity': 142.5,
                    'renewable': 65.3,
                    'generation_mix': {...},
                    'index': 'moderate'
                }
            }
        """
        cache_key = 'current_all'
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        try:
            # Fetch regional data
            response = requests.get(
                f"{self.BASE_URL}/regional",
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            
            result = {}
            regions = data.get('data', [])
            
            # Handle nested structure
            if regions and isinstance(regions, list):
                for region_group in regions:
                    region_list = region_group.get('regions', [region_group])
                    for region in region_list:
                        region_id = str(region.get('regionid', ''))
                        
                        # Map to our datacenter ID
                        dc_id = self.REGION_MAPPING.get(region_id)
                        if not dc_id:
                            continue
                        
                        intensity_data = region.get('data', [{}])[0] if region.get('data') else {}
                        gen_mix = region.get('generationmix', [])
                        
                        # Calculate renewable percentage
                        renewable_sources = ['wind', 'solar', 'hydro', 'nuclear']
                        renewable_pct = sum(
                            g.get('perc', 0) 
                            for g in gen_mix 
                            if g.get('fuel') in renewable_sources
                        )
                        
                        result[dc_id] = {
                            'intensity': intensity_data.get('intensity', {}).get('forecast', 200),
                            'renewable': renewable_pct,
                            'index': intensity_data.get('intensity', {}).get('index', 'moderate'),
                            'generation_mix': {
                                g.get('fuel'): g.get('perc', 0) 
                                for g in gen_mix
                            },
                            'last_updated': datetime.utcnow().isoformat()
                        }
            
            # Fill in any missing datacenters with defaults
            for dc_id in self.DC_TO_REGION.keys():
                if dc_id not in result:
                    result[dc_id] = {
                        'intensity': 200,
                        'renewable': 30,
                        'index': 'moderate',
                        'generation_mix': {},
                        'last_updated': datetime.utcnow().isoformat()
                    }
            
            self._set_cache(cache_key, result)
            return result
            
        except requests.RequestException as e:
            print(f"Error fetching carbon data: {e}")
            # Return defaults on error
            return self._get_default_carbon_data()
    
    def get_forecast(self, hours: int = 24) -> Dict[Tuple[str, int], Dict]:
        """
        Fetch carbon intensity forecast for next N hours.
        
        Returns:
            Dict mapping (datacenter_id, hour_offset) to carbon data
        """
        cache_key = f'forecast_{hours}'
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        try:
            # Get national forecast
            now = datetime.utcnow()
            end = now + timedelta(hours=hours)
            
            response = requests.get(
                f"{self.BASE_URL}/intensity/{now.strftime('%Y-%m-%dT%H:%MZ')}/{end.strftime('%Y-%m-%dT%H:%MZ')}",
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            
            # Get current regional data for proportional adjustment
            current = self.get_current_intensity()
            
            result = {}
            forecasts = data.get('data', [])
            
            for hour_idx, forecast in enumerate(forecasts[:hours]):
                national_intensity = forecast.get('intensity', {}).get('forecast', 200)
                
                # Distribute to datacenters based on current proportions
                for dc_id, dc_data in current.items():
                    # Adjust based on current ratio to national average
                    current_intensity = dc_data.get('intensity', 200)
                    avg_intensity = sum(d.get('intensity', 200) for d in current.values()) / len(current)
                    
                    ratio = current_intensity / avg_intensity if avg_intensity > 0 else 1.0
                    adjusted_intensity = national_intensity * ratio
                    
                    result[(dc_id, hour_idx)] = {
                        'intensity': adjusted_intensity,
                        'renewable': dc_data.get('renewable', 30),
                        'hour': hour_idx,
                        'timestamp': (now + timedelta(hours=hour_idx)).isoformat()
                    }
            
            self._set_cache(cache_key, result)
            return result
            
        except requests.RequestException as e:
            print(f"Error fetching forecast: {e}")
            return self._get_default_forecast(hours)
    
    def _get_default_carbon_data(self) -> Dict[str, Dict]:
        """Return default carbon data when API is unavailable"""
        return {
            'UK-North': {'intensity': 180, 'renewable': 55, 'index': 'moderate'},
            'UK-South': {'intensity': 220, 'renewable': 40, 'index': 'moderate'},
            'UK-Midlands': {'intensity': 200, 'renewable': 45, 'index': 'moderate'},
            'UK-Scotland': {'intensity': 120, 'renewable': 75, 'index': 'low'},
            'UK-Wales': {'intensity': 160, 'renewable': 60, 'index': 'low'},
            'UK-East': {'intensity': 190, 'renewable': 50, 'index': 'moderate'}
        }
    
    def _get_default_forecast(self, hours: int) -> Dict[Tuple[str, int], Dict]:
        """Return default forecast when API is unavailable"""
        defaults = self._get_default_carbon_data()
        result = {}
        
        for hour in range(hours):
            for dc_id, data in defaults.items():
                # Add some variation
                variation = (hour % 6 - 3) * 5  # -15 to +10
                result[(dc_id, hour)] = {
                    'intensity': data['intensity'] + variation,
                    'renewable': data['renewable'],
                    'hour': hour
                }
        
        return result


# Singleton instance
carbon_client = CarbonAPIClient()
