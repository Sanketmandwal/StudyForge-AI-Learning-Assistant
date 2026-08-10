import IORedis from "ioredis";

const redisUrl =
    process.env.REDIS_URL || "redis://localhost:6379";

const redisConnection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null
});

redisConnection.on("connect", () => {
    console.log("Redis/Valkey connected");
});

redisConnection.on("error", (error) => {
    console.error("Redis/Valkey error:", error);
});

export default redisConnection;