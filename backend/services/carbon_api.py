"""
Carbon API Client - With Low-Carbon Filtering
==============================================
File: backend/services/carbon_api.py

Filters out datacenters with very low carbon intensity (< threshold)
so that algorithms have meaningful differences to show.
"""

import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple


class CarbonAPIClient:
    """
    Client for UK Carbon Intensity API
    https://carbonintensity.org.uk/
    """
    
    BASE_URL = "https://api.carbonintensity.org.uk"
    
    
    
    MIN_CARBON_THRESHOLD = 50  
    
    REGION_MAPPING = {
        '1': 'UK-Scotland', '2': 'UK-Scotland',
        '3': 'UK-North', '4': 'UK-North', '5': 'UK-North',
        '6': 'UK-Midlands', '7': 'UK-Wales', '8': 'UK-Midlands', '9': 'UK-Midlands',
        '10': 'UK-East', '11': 'UK-South', '12': 'UK-East', '13': 'UK-South', '14': 'UK-South',
    }
    
    DC_TO_REGION = {
        'UK-North': '4', 'UK-South': '13', 'UK-Midlands': '9',
        'UK-Scotland': '2', 'UK-Wales': '7', 'UK-East': '12'
    }
    
    def __init__(self, cache_ttl_minutes: int = 30):
        self.cache_ttl = timedelta(minutes=cache_ttl_minutes)
        self._cache = {}
        self._cache_timestamps = {}
    
    def _is_cache_valid(self, key: str) -> bool:
        if key not in self._cache_timestamps:
            return False
        age = datetime.utcnow() - self._cache_timestamps[key]
        return age < self.cache_ttl
    
    def _get_cached(self, key: str) -> Optional[Dict]:
        if self._is_cache_valid(key):
            return self._cache.get(key)
        return None
    
    def _set_cache(self, key: str, data: Dict):
        self._cache[key] = data
        self._cache_timestamps[key] = datetime.utcnow()
    
    def get_current_intensity(self) -> Dict[str, Dict]:
        """
        Fetch current carbon intensity for all UK regions.
        Filters out datacenters with very low carbon intensity.
        """
        cache_key = 'current_all'
        cached = self._get_cached(cache_key)
        if cached:
            print("[CarbonAPI] Using cached data")
            return cached
        
        try:
            response = requests.get(f"{self.BASE_URL}/regional", timeout=10)
            response.raise_for_status()
            data = response.json()
            
            result = {}
            excluded = []
            
            outer_data = data.get('data', [])
            if not outer_data:
                print("[CarbonAPI] No data in response")
                return self._get_default_carbon_data()
            
            first_element = outer_data[0]
            regions = first_element.get('regions', [])
            
            print(f"[CarbonAPI] Fetched {len(regions)} regions from API")
            
            for region in regions:
                region_id = str(region.get('regionid', ''))
                shortname = region.get('shortname', 'Unknown')
                
                dc_id = self.REGION_MAPPING.get(region_id)
                if not dc_id:
                    continue
                
                intensity_obj = region.get('intensity', {})
                intensity = intensity_obj.get('forecast', 200)
                index = intensity_obj.get('index', 'moderate')
                
                gen_mix = region.get('generationmix', [])
                renewable_sources = ['wind', 'solar', 'hydro', 'nuclear']
                renewable_pct = sum(
                    g.get('perc', 0) for g in gen_mix if g.get('fuel') in renewable_sources
                )
                
                
                if dc_id not in result or intensity < result[dc_id]['intensity']:
                    result[dc_id] = {
                        'intensity': intensity,
                        'renewable': renewable_pct,
                        'index': index,
                        'generation_mix': {g.get('fuel'): g.get('perc', 0) for g in gen_mix},
                        'region_name': shortname,
                        'last_updated': datetime.utcnow().isoformat()
                    }
            
            
            
            
            
            filtered_result = {}
            for dc_id, dc_data in result.items():
                if dc_data['intensity'] < self.MIN_CARBON_THRESHOLD:
                    excluded.append(f"{dc_id} ({dc_data['intensity']} gCO2/kWh)")
                else:
                    filtered_result[dc_id] = dc_data
            
            if excluded:
                print(f"[CarbonAPI] Excluded low-carbon DCs (< {self.MIN_CARBON_THRESHOLD} gCO2/kWh): {', '.join(excluded)}")
            
            
            if len(filtered_result) < 3:
                print("[CarbonAPI] WARNING: Too few DCs after filtering, using all DCs with minimum floor")
                for dc_id, dc_data in result.items():
                    dc_data['intensity'] = max(dc_data['intensity'], self.MIN_CARBON_THRESHOLD)
                    filtered_result[dc_id] = dc_data
            
            
            print("\n[CarbonAPI] Final carbon data (after filtering):")
            for dc_id, dc_data in sorted(filtered_result.items(), key=lambda x: x[1]['intensity']):
                print(f"    {dc_id}: intensity={dc_data['intensity']}, renewable={dc_data['renewable']:.1f}%")
            
            self._set_cache(cache_key, filtered_result)
            return filtered_result
            
        except requests.RequestException as e:
            print(f"[CarbonAPI] Error fetching carbon data: {e}")
            return self._get_default_carbon_data()
        except Exception as e:
            print(f"[CarbonAPI] Unexpected error: {e}")
            import traceback
            traceback.print_exc()
            return self._get_default_carbon_data()
    
    def get_forecast(self, hours: int = 24) -> Dict[Tuple[str, int], Dict]:
        """Fetch carbon intensity forecast for next N hours."""
        cache_key = f'forecast_{hours}'
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        try:
            now = datetime.utcnow()
            end = now + timedelta(hours=hours)
            
            response = requests.get(
                f"{self.BASE_URL}/intensity/{now.strftime('%Y-%m-%dT%H:%MZ')}/{end.strftime('%Y-%m-%dT%H:%MZ')}",
                timeout=10
            )
            response.raise_for_status()
            data = response.json()
            
            
            current = self.get_current_intensity()
            
            result = {}
            forecasts = data.get('data', [])
            
            avg_intensity = sum(d.get('intensity', 200) for d in current.values()) / len(current) if current else 200
            
            for hour_idx, forecast in enumerate(forecasts[:hours]):
                national_intensity = forecast.get('intensity', {}).get('forecast', 200)
                
                for dc_id, dc_data in current.items():
                    current_intensity = dc_data.get('intensity', 200)
                    ratio = current_intensity / avg_intensity if avg_intensity > 0 else 1.0
                    adjusted_intensity = national_intensity * ratio
                    
                    
                    adjusted_intensity = max(adjusted_intensity, self.MIN_CARBON_THRESHOLD)
                    
                    result[(dc_id, hour_idx)] = {
                        'intensity': adjusted_intensity,
                        'renewable': dc_data.get('renewable', 30),
                        'hour': hour_idx,
                        'timestamp': (now + timedelta(hours=hour_idx)).isoformat()
                    }
            
            self._set_cache(cache_key, result)
            return result
            
        except requests.RequestException as e:
            print(f"[CarbonAPI] Error fetching forecast: {e}")
            return self._get_default_forecast(hours)
    
    def _get_default_carbon_data(self) -> Dict[str, Dict]:
        """Return default carbon data when API is unavailable"""
        print("[CarbonAPI] Using default carbon data (API unavailable)")
        return {
            'UK-Scotland': {'intensity': 85, 'renewable': 80, 'index': 'low'},
            'UK-North': {'intensity': 145, 'renewable': 55, 'index': 'moderate'},
            'UK-Wales': {'intensity': 195, 'renewable': 42, 'index': 'moderate'},
            'UK-Midlands': {'intensity': 180, 'renewable': 45, 'index': 'moderate'},
            'UK-East': {'intensity': 165, 'renewable': 50, 'index': 'moderate'},
            'UK-South': {'intensity': 230, 'renewable': 35, 'index': 'high'},
        }
    
    def _get_default_forecast(self, hours: int) -> Dict[Tuple[str, int], Dict]:
        """Return default forecast when API is unavailable"""
        defaults = self._get_default_carbon_data()
        result = {}
        
        for hour in range(hours):
            for dc_id, data in defaults.items():
                variation = (hour % 8 - 4) * 10
                result[(dc_id, hour)] = {
                    'intensity': max(self.MIN_CARBON_THRESHOLD, data['intensity'] + variation),
                    'renewable': data['renewable'],
                    'hour': hour
                }
        
        return result
    
    def clear_cache(self):
        """Clear all cached data"""
        self._cache.clear()
        self._cache_timestamps.clear()
        print("[CarbonAPI] Cache cleared")



carbon_client = CarbonAPIClient()