import os
import json
import datetime
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.db import models, schemas

router = APIRouter()

REGIONAL_WEATHER_PROFILES = {
    "coimbatore": {"temp": 28.5, "humidity": 68.0, "rain": 0.0, "wind": 12.0, "desc": "Partly Cloudy"},
    "thanjavur": {"temp": 32.0, "humidity": 75.0, "rain": 2.5, "wind": 8.0, "desc": "Scattered Showers in Delta"},
    "madurai": {"temp": 34.0, "humidity": 58.0, "rain": 0.0, "wind": 10.5, "desc": "Clear Sunny"},
    "vellore": {"temp": 31.5, "humidity": 62.0, "rain": 0.0, "wind": 9.0, "desc": "Dry and Warm"},
    "chennai": {"temp": 31.0, "humidity": 82.0, "rain": 1.2, "wind": 15.0, "desc": "Humid Coastal Breeze"},
    "tiruchirappalli": {"temp": 33.5, "humidity": 60.0, "rain": 0.0, "wind": 11.0, "desc": "Hot and Dry"}
}

@router.get("/", response_model=schemas.WeatherResponse)
def get_weather(
    location: str = Query(..., description="City or District name, e.g. Coimbatore, Thanjavur"),
    lat: Optional[float] = Query(None),
    lon: Optional[float] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get weather observations.
    If OPENWEATHER_API_KEY is configured in env, queries live provider.
    Otherwise, returns transparent regional demonstration data with advisory notes.
    """
    api_key = os.getenv("OPENWEATHER_API_KEY")
    loc_clean = location.strip().lower()
    
    if api_key:
        # Live external API integration
        try:
            import urllib.request
            url = f"https://api.openweathermap.org/data/2.5/weather?q={urllib.parse.quote(location)}&appid={api_key}&units=metric"
            req = urllib.request.Request(url, headers={"User-Agent": "AgriMind/1.0"})
            with urllib.request.urlopen(req, timeout=5) as response:
                data = json.loads(response.read().decode())
                
            temp = data["main"]["temp"]
            humidity = data["main"]["humidity"]
            wind_speed = data["wind"]["speed"]
            rain = data.get("rain", {}).get("1h", 0.0)
            desc = data["weather"][0]["description"].title()
            
            # Record in database
            w_record = models.WeatherRecord(
                location_label=location,
                latitude=data["coord"]["lat"],
                longitude=data["coord"]["lon"],
                weather_data_json=json.dumps(data),
                provider="OpenWeatherMap (Live)"
            )
            db.add(w_record)
            db.commit()
            
            return schemas.WeatherResponse(
                temperature=temp,
                humidity=humidity,
                rainfall=rain,
                wind_speed=wind_speed,
                description=desc,
                provider="OpenWeatherMap (Live)",
                status="live",
                timestamp=datetime.datetime.utcnow()
            )
        except Exception as e:
            # Fallback on API failure
            pass

    # Regional demo fallback (OpenWeatherMap key not present or failed)
    profile = None
    for city, data in REGIONAL_WEATHER_PROFILES.items():
        if city in loc_clean:
            profile = data
            break
            
    if not profile:
        profile = {"temp": 30.0, "humidity": 65.0, "rain": 0.0, "wind": 10.0, "desc": "Typical Tamil Nadu Agro-Climate"}

    # Persist the lookup record
    w_record = models.WeatherRecord(
        location_label=location,
        latitude=lat or 11.0,
        longitude=lon or 78.0,
        weather_data_json=json.dumps(profile),
        provider="Regional Agro-Climate Fallback (Live API key unconfigured)"
    )
    db.add(w_record)
    db.commit()

    return schemas.WeatherResponse(
        temperature=profile["temp"],
        humidity=profile["humidity"],
        rainfall=profile["rain"],
        wind_speed=profile["wind"],
        description=profile["desc"],
        provider="Regional Agro-Climate Profile (OPENWEATHER_API_KEY required for live radar)",
        status="demo_fallback",
        timestamp=datetime.datetime.utcnow()
    )
