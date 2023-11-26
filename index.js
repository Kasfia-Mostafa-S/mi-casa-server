const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");


const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ijwgr8d.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const propertyCollection = client.db("miCasaDB").collection("properties");
    const reviewCollection = client.db("miCasaDB").collection("review");
    const wishesCollection = client.db("miCasaDB").collection("wishes");



// all properties
app.get("/property", async (req, res) => {
  const page = parseInt(req.query.page);
  const size = parseInt(req.query.size);
  const cursor = propertyCollection.find();
  const result = await cursor
    .skip(page * size)
    .limit(size)
    .toArray();
  res.send(result);
});
app.get("/propertyCount", async (req, res) => {
  const count = await propertyCollection.estimatedDocumentCount();
  res.send({ count });
});

app.get("/property/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await propertyCollection.findOne(query);
  res.send(result);
});


// review
app.post("/review", async (req, res) => {
  const propertyItem = req.body;
  const result = await reviewCollection.insertOne(propertyItem);
  res.send(result);
});

app.get("/review", async (req, res) => {
  const result = await reviewCollection.find().toArray();
  res.send(result);
});

app.get("/review/:title", async (req, res) => {
  const title = req.params.title;
  const query = { title: title };
  const result = await reviewCollection.find(query).toArray();
  res.send(result);
});

// add to wishlist
app.post("/wishList", async (req, res) => {
  const propertyWish = req.body;
  const result = await wishesCollection.insertOne(propertyWish);
  res.send(result);
});

app.get("/wishList", async (req, res) => {
  const email = req.query.email;
  const query = { email: email };
  const result = await wishesCollection.find(query).toArray();
  res.send(result);
});

app.get("/wishList/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await wishesCollection.findOne(query);
  res.send(result);
});

app.delete("/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await wishesCollection.deleteOne(query);
  res.send(result);
});


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Project is setting");
});

app.listen(port, () => {
  console.log(`Mi casa is setting on post ${port}`);
});