"# Goldeneye - Geofence Tracker

A web application for creating virtual geographic boundaries (geofences) and tracking objects within them. When an object moves outside the defined fence area, an alert is triggered.

## Features

- Draw custom polygon fences on an interactive map
- Real-time tracking simulation with breach detection
- Visual and audio alerts when objects exit the geofence
- Save locations with associated fence data
- In-memory storage (no database required)

## Technology Stack

- ASP.NET Core 6.0 Web API
- Leaflet.js for interactive maps
- OpenStreetMap tiles
- In-memory data storage

## Getting Started

### Prerequisites

- .NET 6.0 SDK or later

### Running the Application

1. Navigate to the project folder:
   ```
   cd demo/WebApplication1
   ```

2. Run the application:
   ```
   dotnet run
   ```

3. Open your browser to:
   - http://localhost:5060 (HTTP)
   - https://localhost:7060 (HTTPS)

## How to Use

### Creating a Geofence

1. Click the "Draw Fence" button
2. Click on the map to add vertices (minimum 3 points)
3. Click "Finish Fence" to complete the polygon

### Testing Breach Detection

1. After creating a fence, click "Start Tracking"
2. A blue marker appears at the fence center
3. Drag the marker outside the fence boundary
4. An alert will trigger when the object exits the geofence

### Saving Locations

1. Enter a name (required), email, and phone
2. Draw a fence on the map (optional)
3. Click "Save" to store the location with its fence data

### Managing Saved Items

- Click "Load" to display a saved fence on the map
- Click "Edit" to modify an item
- Click "Delete" to remove an item
- Click "Refresh" to reload the list

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/items | Get all items |
| GET | /api/items/{id} | Get item by ID |
| POST | /api/items | Create new item |
| PUT | /api/items/{id} | Update item |
| DELETE | /api/items/{id} | Delete item |

## Project Structure

```
WebApplication1/
  Controllers/
    ItemsController.cs    - API endpoints
  Model/
    Demo.cs               - Data model with fence coordinates
  Services/
    InMemoryDbService.cs  - In-memory storage
    ICosmosDbService.cs   - Service interface
  wwwroot/
    index.html            - Main UI
    css/styles.css        - Styling
    js/app.js             - Frontend logic and map handling
```

## Notes

- Data is stored in memory and will be lost when the application restarts
- The tracking simulation auto-moves the marker every 2 seconds
- Fence breach detection uses the ray casting algorithm for point-in-polygon testing" 
"# openstreetmap-smart-fencing-system" 
