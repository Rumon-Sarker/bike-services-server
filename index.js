const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());






const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@expressdb.hgdaj4q.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const verifyJwt = async (req, res, next) => {
    const authorization = req.headers.authorization;
    console.log("ttt", req.headers.authorization)
    if (!authorization) {
        return res.status(401).send({ error: true, message: "User is unauthorization" })
    }
    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
        if (error) {
            return res.status(401).send({ error: true, message: "User is Unauthorize" })
        }
        req.decoded = decoded;
        next()

    })
}



const servicesCollation = client.db("bikeServices").collection("services");
const bookingCollation = client.db("bikeServices").collection("booking");


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();



        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1h" });
            res.send({ token });
        })

        // Services 

        app.get('/services', async (req, res) => {
            const corsur = servicesCollation.find();
            const result = await corsur.toArray()
            res.send(result);


        })

        app.get("/services/:id", async (req, res) => {
            const id = req.params.id;
            const quiry = { _id: new ObjectId(id) };
            const options = {
                // Include only the `title` and `imdb` fields in the returned document
                projection: { _id: 1, title: 1, price: 1, img: 1 },
            };
            const result = await servicesCollation.findOne(quiry, options);
            res.send(result);
        })

        app.get("/booking", verifyJwt, async (req, res) => {
            const decoded = req.decoded;
            if (decoded.email !== req.query.email) {
                return res.status(403).send({ error: true, message: "Not Chiting ,unvalid eamil account" })
            }
            let query = {};
            if (req.query?.email) {
                query = { email: req.query.email }
            }
            const result = await bookingCollation.find(query).toArray();
            res.send(result)
        })

        app.post("/booking", async (req, res) => {
            const item = req.body;
            const result = await bookingCollation.insertOne(item);
            res.send(result);
        })

        app.delete("/booking/:id", async (req, res) => {
            const id = req.params.id;
            const quiry = { _id: new ObjectId(id) }
            const result = await bookingCollation.deleteOne(quiry);
            res.send(result)
        })
        app.patch("/booking/:id", async (req, res) => {
            const id = req.params.id;
            const quiry = { _id: new ObjectId(id) }
            const updateBooking = req.body;
            const updateDoc = {
                $set: {
                    status: updateBooking.status
                },
            };
            const result = await bookingCollation.updateOne(quiry, updateDoc);
            res.send(result)
        })







        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);







// Define a route
app.get('/', (req, res) => {
    res.send('Server is Running');
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
