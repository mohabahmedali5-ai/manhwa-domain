// lib/redis.js
import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

if (!process.env.REDIS_URL) throw new Error("REDIS_URL not set");

const redis = global.__redisClient || new Redis(process.env.REDIS_URL);
global.__redisClient = redis;

export default redis;
