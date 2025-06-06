import express from 'express';
import * as path from 'path';
import cors from "cors";
import proxy from "express-http-proxy";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import axios from "axios";
import cookieParser from "cookie-parser";
import { error } from 'console';

const app = express();
//#region CORS
app.use(cors({
  origin:["http://localhost:3000"],
  allowedHeaders:["Authorization","Content-Type"],
  credentials:true
}));
//#endregion
app.use(morgan("dev"));
app.use(express.json({limit:"100mb"}))
app.use(express.urlencoded({limit:"100mb",extended:true}))
app.use(cookieParser());
app.set("trust proxy",1)

//#region Apply rateLimit
const limiter= rateLimit({
  windowMs:15*60*1000,
  max:(req:any)=>(req.user?1000:100),
  message: {error:"Too many request, please try again later!"},
  standardHeaders:true,
  legacyHeaders:true,
  keyGenerator:(req:any)=>req.ip,
})
app.use(limiter);
//#endregion

app.get('/gateway-health', (req, res) => {
  res.send({ message: 'Welcome to api-gateway!' });
});

app.use('/',proxy('http://localhost:6001'))

const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/gateway-health`);
});
server.on('error', console.error);
