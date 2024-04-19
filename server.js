const express = require("express");
const {CronJob} = require("cron");

const app = express();
const PORT = 80;

const bucketSize = 10;
let bucket = [];

const refillBucket = ()=>{
    if(bucket.length < bucketSize)
    {
        bucket.push(Date.now());
    }
}

app.get("/status", async (req, res) => {
    res.json({
        bucketSize: bucketSize,
        currentBucketSize: bucket.length,
        bucket: bucket
    })
})

const RateLimitMiddleware = async(req, res, next)=>{
    if(bucket.length == 0)
    {
        res.status(429).set('X-RateLimit-Remaining', 0).set('Retry-After', 2).json({
            success: false,
            message: "Too many requests"
        });
    }
    else
    {
        const token = bucket.shift();
        console.log(`token ${token} is consumed!`);
        res.set('X-RateLimit-Remaining', bucket.length);
        next();
    }
}

app.use(RateLimitMiddleware);

app.get("/test", async(req, res)=>{
    res.send({success: true, message: "Hello there!"});
})

// every 10 seconds
const job = new CronJob("*/10 * * * * *", ()=>{
    refillBucket();
})

app.listen(PORT, () => {
    console.log(`app on port ${PORT}`);
    job.start();
})