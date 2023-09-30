import express from 'express';
import axios from 'axios';
import { decode } from './polylineUtils';
import cors from 'cors';

const app = express();
const port = 5000;

app.use(cors());

interface Position {
  lat: number;
  lng: number;
}

interface GeoCodingItem {
  position: Position;
  // Add other properties if needed
  travelTime?: number; // Optional property for travel time
  likes: string;
}

app.get('/', async (req, res) => {
  try {
    const { loc, rangeType, rangeValue, transport, service } = req.query;
    const apiKey = '1EhAO_a7NAqCH8w3l4vVQ_ERJXIw7_zNyYxdU_bkQMQ';

    let rangeVal = 1;
    if (rangeType === 'distance') {
      rangeVal = 1000 * Number(rangeValue);
    } else {
      rangeVal = 60 * Number(rangeValue);
    }

    // Request isoline data
    const apiURLIsoline = `https://isoline.router.hereapi.com/v8/isolines?transportMode=${transport}&range[type]=${rangeType}&range[values]=${rangeVal}&origin=${loc}&apikey=${apiKey}`;
    const responseIsoline = await axios.get(apiURLIsoline);

    // Decode polyline data
    const outerPolygon = responseIsoline.data.isolines[0].polygons[0].outer;
    const decodedPolygon = decode(outerPolygon);

    // Check if latitude, longitude passed
    const isLatLong = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|(\d{1,2}))(\.\d+)?)$/.test(service as string);
    if (isLatLong) {
      // Handle API call for latitude and longitude
      const [lat, lng] = (service as string).split(/[\s,]+/);
      const apiURLLatLong = `https://revgeocode.search.hereapi.com/v1/revgeocode?at=${lat}%2C${lng}&lang=en-US&apikey=${apiKey}`;
      const responseLatLong = await axios.get(apiURLLatLong);

      // Process the response as needed
      res.send(responseLatLong.data);
      return;
    }

    // Request geocoding data
    const apiURLDiscover = `https://discover.search.hereapi.com/v1/discover?at=${loc}&q=${service}&apiKey=${apiKey}&limit=100`;
    const responseDiscover = await axios.get(apiURLDiscover);

    const pos: GeoCodingItem[] = responseDiscover.data.items.filter((i: GeoCodingItem) => {
      function pointInPolygon(polygon: any, point: any) {
        let odd = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; i++) {
          if (
            (polygon[i][1] > point[1]) !== (polygon[j][1] > point[1]) &&
            point[0] <
              ((polygon[j][0] - polygon[i][0]) * (point[1] - polygon[i][1]) / (polygon[j][1] - polygon[i][1]) +
                polygon[i][0])
          ) {
            odd = !odd;
          }
          j = i;
        }
        return odd;
      }
      return pointInPolygon(decodedPolygon.polyline, [i.position.lat, i.position.lng]);
    });
    
    if(pos.length === 0){
      const apiURLGeocode = `https://discover.search.hereapi.com/v1/discover?at=${loc}&q=${service}&apiKey=${apiKey}`;
      const responseGeocode = await axios.get(apiURLGeocode);
      const geocodeItems: GeoCodingItem[] = responseGeocode.data.items;
      pos.push(...geocodeItems);
    }
    const promises = pos.map(async (point: GeoCodingItem) => {
      try {
        const { lat, lng } = point.position;

        // Request route data for each point
        const apiURLRouting = `https://router.hereapi.com/v8/routes?transportMode=${transport}&origin=${loc}&destination=${lat},${lng}&return=summary&apikey=${apiKey}`;
        const routeResponse = await axios.get(apiURLRouting);

        // Extract duration from the first route's summary
        if (routeResponse.data.routes && routeResponse.data.routes.length > 0) {
          const firstRoute = routeResponse.data.routes[0];

          if (firstRoute.sections && firstRoute.sections.length > 0) {
            const firstSection = firstRoute.sections[0];

            if (firstSection.summary && firstSection.summary.duration) {
              const durationInSeconds = firstSection.summary.duration;
              point.likes = ((Math.random())*100).toFixed(0);
              point.travelTime = durationInSeconds;
            } else {
              console.error('Invalid or missing duration in the route section summary.');
            }
          } else {
            console.error('No sections found in the first route.');
          }
        } else {
          console.error('No routes found in the response.');
        }
      } catch (error) {
        console.error(`Error calculating time for point: ${point}`, error);
        point.travelTime = 0; // Set to null or handle error as needed
      }
    });

    // Wait for all the promises to resolve
    await Promise.all(promises);

    res.send(pos);
  } catch (error) {
    console.error(error);
    res.send([]);
  }
});

// Find Route Path
app.get('/findRoute',async(req,res) => {
  try {
    const { loc, dest, transport } = req.query;
    const apiKey = 'quhVrdb2B-bvrDCtO1tp14k3VKC4-6nGCh9BuZUBQTA';
    const apiURLRoute = `https://router.hereapi.com/v8/routes?transportMode=${transport}&origin=${loc}8&destination=${dest}&return=polyline&apikey=${apiKey}`;
    const responseRoute = await axios.get(apiURLRoute);
    // Decode polyline data
    const routeShape = responseRoute.data.routes[0].sections[0].polyline;
    const decodedRoute = decode(routeShape);

    res.send(decodedRoute);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is listening on ${port}`);
});
