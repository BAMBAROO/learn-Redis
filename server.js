import express from "express";
import { createClient } from "redis";
import cors from "cors";

const redisClient = createClient(); //connect to my redis-server in ubuntu wsl
const app = express();
const DEFAULT_EXPIRATION = 3600;
app.use(cors());

redisClient.on("error", (err) => console.log("Error ", err))

app.get("/api", async (req, res) => {
  await redisClient.connect(); //open connection to redis server

  const movies = await getSetCache("data", fetchingData); 
  return res.json(movies);
});

async function fetchingData() {
  const response = await fetch("http://www.omdbapi.com/?apikey=9c7663ba&s=batman"); //fetch data to api
  return response;
}

const getSetCache = (data, callback) => {
  return new Promise(async (resolve, reject) => {
    const cache = await redisClient.get(data); //get key "data"
    if (cache !== null) {
      console.log("get from cache");
      redisClient.disconnect(); //close connection after geting data
      return resolve(JSON.parse(cache));
    }

    const rawData = await callback();
    const { Search } = await rawData.json();

    await redisClient.SETEX(data, DEFAULT_EXPIRATION, JSON.stringify(Search)); //set data in redis with expiration
    await redisClient.disconnect(); //close connection after seting data 
    console.log("get from api");
    resolve(Search);
  });
};

app.listen(8000, () => {
  console.log("server is running");
});
