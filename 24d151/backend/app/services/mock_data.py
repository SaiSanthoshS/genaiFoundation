ROUTES = {
  "default": [
    {
      "id": "route-1", "name": "Nexus Subway Line 4 & Green Line Bus", "totalDuration": 28, "startTime": "08:05 AM", "endTime": "08:33 AM",
      "segments": [
        { "mode": "walk", "name": "Walk to Grand Central", "duration": 5, "stops": 0, "distance": 0.4 },
        { "mode": "subway", "name": "Nexus Subway Line 4", "lineCode": "N4", "color": "#004ac6", "duration": 15, "stops": 4, "distance": 8.2 },
        { "mode": "tram", "name": "Green Line Tram", "lineCode": "GL", "color": "#006c49", "duration": 6, "stops": 2, "distance": 2.1 },
        { "mode": "walk", "name": "Walk to destination", "duration": 2, "stops": 0, "distance": 0.1 }
      ], "cost": 2.75, "co2Saved": 3.4, "occupancy": "low", "confidence": 98, "reliability": 99, "delayMinutes": 0, "ecoFriendly": True, "smartest": True, "fastest": True, "cheapest": False
    },
    {
      "id": "route-2", "name": "Rapid Express Commuter Rail", "totalDuration": 32, "startTime": "08:10 AM", "endTime": "08:42 AM",
      "segments": [
        { "mode": "walk", "name": "Walk to Penn Station", "duration": 8, "stops": 0, "distance": 0.6 },
        { "mode": "train", "name": "Commuter Rail Line M1", "lineCode": "M1", "color": "#784b00", "duration": 20, "stops": 1, "distance": 12.5 },
        { "mode": "walk", "name": "Walk to destination", "duration": 4, "stops": 0, "distance": 0.3 }
      ], "cost": 5.50, "co2Saved": 2.8, "occupancy": "medium", "confidence": 94, "reliability": 95, "delayMinutes": 3, "ecoFriendly": False, "smartest": False, "fastest": False, "cheapest": False
    },
    {
      "id": "route-3", "name": "Metro City Bus 42 & Walk", "totalDuration": 45, "startTime": "07:55 AM", "endTime": "08:40 AM",
      "segments": [
        { "mode": "walk", "name": "Walk to Bus Stop 12", "duration": 3, "stops": 0, "distance": 0.2 },
        { "mode": "bus", "name": "Metro Bus 42", "lineCode": "B42", "color": "#ff9900", "duration": 38, "stops": 12, "distance": 6.8 },
        { "mode": "walk", "name": "Walk to destination", "duration": 4, "stops": 0, "distance": 0.3 }
      ], "cost": 1.50, "co2Saved": 4.2, "occupancy": "low", "confidence": 89, "reliability": 91, "delayMinutes": 0, "ecoFriendly": True, "smartest": False, "fastest": False, "cheapest": True
    }
  ],
  "specific": [
    {
      "id": "route-jfk", "name": "JFK AirTrain & Subway Line E", "totalDuration": 42, "startTime": "10:15 AM", "endTime": "10:57 AM",
      "segments": [
        { "mode": "subway", "name": "Subway Line E", "lineCode": "E", "color": "#004ac6", "duration": 25, "stops": 8, "distance": 14.2 },
        { "mode": "train", "name": "JFK AirTrain Red", "lineCode": "AIR", "color": "#737686", "duration": 12, "stops": 3, "distance": 6.5 },
        { "mode": "walk", "name": "Walk to Terminal 4", "duration": 5, "stops": 0, "distance": 0.4 }
      ], "cost": 11.25, "co2Saved": 5.8, "occupancy": "medium", "confidence": 96, "reliability": 97, "delayMinutes": 0, "ecoFriendly": True, "smartest": True, "fastest": True, "cheapest": False
    }
  ]
}

DELAYS = [
  { "id": "delay-1", "line": "Nexus Subway Line 4", "route": "Grand Central to Wall Street Plaza", "status": "minor", "delayMinutes": 3, "reason": "Signal maintenance at Union Square", "alternativeRouteId": "route-2", "aiAnalysis": "The 3-minute delay is stabilizing. Headway is returning to nominal levels.", "active": True },
  { "id": "delay-2", "line": "Metro Bus 104", "route": "Central Park West to Times Square", "status": "major", "delayMinutes": 14, "reason": "Street construction on Broadway", "alternativeRouteId": "route-1", "aiAnalysis": "Severe congestion surrounding 48th St. Commuter bus transit speed is down to 4 km/h.", "active": True },
  { "id": "delay-3", "line": "Rapid Rail Commuter Line M1", "route": "Hoboken to Penn Station", "status": "critical", "delayMinutes": 28, "reason": "Switch malfunction near Tunnel East", "alternativeRouteId": "route-3", "aiAnalysis": "Relay issues have bottlenecked all inbound transit on this corridor.", "active": True }
]
