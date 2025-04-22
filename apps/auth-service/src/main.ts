import express from 'express';
import cors from "cors";
import { errorMiddleware } from '../../../packages/error-handler/error-middleware'
import cookieParser from "cookie-parser";

const app = express();

//#region CORS
app.use(cors({
    origin:["http://localhost:3000"],
    allowedHeaders:["Authorization","Content-Type"],
    credentials:true
  }));
  //#endregion
  
app.get('/', (req, res) => {
    res.send({ 'message': 'Hello API'});
});
app.use(express.json())
app.use(cookieParser());
app.use(errorMiddleware)
const port=process.env.port||6001;
const server= app.listen(port,()=>{
    console.log(`Authentication Service is running on http://localhost:${port}`);
});

server.on("error",(err)=>{
    console.log("Server Error :",err);
});