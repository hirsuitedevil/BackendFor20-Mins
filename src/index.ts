import express from 'express';
import axios from 'axios';
import { decode } from './polylineUtils';
import cors from "cors"
const app = express();
const port = 5000;

app.use(cors())

app.get('/', async (req, res) => {
  try {
    const { loc, time, transport, service } = req.query;
    const apiKey = '7UalH_mc8-4SsygiyEDs5Y9FWsK9xsSDSA0hUPZW2lw';
    const timeInSec = 60 * Number(time);

    // Request isoline data
    const apiURLIsoline = `https://isoline.router.hereapi.com/v8/isolines?transportMode=${transport}&range[type]=time&range[values]=${timeInSec}&origin=${loc}&apikey=${apiKey}`;
    const responseIsoline = await axios.get(apiURLIsoline);

    // Decode polyline data
    const outerPolygon = responseIsoline.data.isolines[0].polygons[0].outer;
    const decodedPolygon = decode(outerPolygon);    

    // Request geocoding data
    const apiURLGeoCoding = `https://discover.search.hereapi.com/v1/discover?at=${loc}&q=${service}&apiKey=${apiKey}&limit=100`;
    const responseGeoCoding = await axios.get(apiURLGeoCoding);

    const pos = responseGeoCoding.data.items.filter((i:any)=>{
        function pointInPolygon(polygon : any, point : any) {
            let odd = false;
            for (let i = 0, j = polygon.length - 1; i < polygon.length; i++) {
                if (((polygon[i][1] > point[1]) !== (polygon[j][1] > point[1])) 
                    && (point[0] < ((polygon[j][0] - polygon[i][0]) * (point[1] - polygon[i][1]) / (polygon[j][1] - polygon[i][1]) + polygon[i][0]))) {
                    odd = !odd;
                }
                j = i;
            }
            return odd;
        };
        return pointInPolygon(decodedPolygon.polyline,[i.position.lat,i.position.lng])
    })
    res.send(pos);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is listening on ${port}`);
});
