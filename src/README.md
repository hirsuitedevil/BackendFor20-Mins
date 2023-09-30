# Geocoding and Routing Server
 
This server is designed to handle geocoding, isoline calculation, and routing requests using HERE APIs.
 
## Getting Started
 
### Prerequisites
 
- Node.js installed
- npm (Node Package Manager) installed
 
### Installation
 
1. Clone the repository:
 
    ```bash
    git clone <repository-url>
    ```
 
2. Install dependencies:
 
    ```bash
    npm install
    ```
 
3. Start the server:
 
    ```bash
    npm start
    ```
 
4. The server will be running on `http://localhost:5000`.
 
## Endpoints
 
### 1. [/](http://localhost:5000/)
 
- **Method:** GET
- **Parameters:**
  - `loc`: Location coordinates (latitude,longitude)
  - `rangeType`: Type of range (`distance` or `time`)
  - `rangeValue`: Value for range (in meters or minutes)
  - `transport`: Transport mode (e.g., `car`, `pedestrian`)
  - `service`: Search query for geocoding
- **Description:** This endpoint handles geocoding and isoline calculation based on the provided parameters. It returns geocoded locations within a specified range and their travel times. This API endpoint uses Isoline Here API to generate all the possible coordinates that can be reached within the specified time limit. Reverse GeoCode API is used in case latitude and longitude are passed in the search box. Geocoding and Search API is used to find locations based on categories. To check whether a point is inside the polyline, we used the Ray Tracing method that states if a ray coincides with the polygon even number of times it is outside the polygon while an odd number of times it is inside the polygon. Routes Here API is used to find the duration between two coordinate points.
 
### 2. [/findRoute](http://localhost:5000/findRoute)
 
- **Method:** GET
- **Parameters:**
  - `loc`: Origin coordinates (latitude,longitude)
  - `dest`: Destination coordinates (latitude,longitude)
  - `transport`: Transport mode (e.g., `car`, `pedestrian`)
- **Description:** This endpoint finds a route between the specified origin and destination using HERE Routing API. It returns the decoded polyline of the route.
 
## Additional Notes
 
- This server uses the HERE Geocoding, Discover, Isoline, and Routing APIs.
- The `decode` function is used to convert polylines into coordinates.
- The server utilizes the Axios library for making HTTP requests.
- Ensure replacing the placeholder API keys with valid HERE API keys.
 
## Acknowledgments
 
- This project is built with Node.js, Express.js, Axios, and HERE APIs.