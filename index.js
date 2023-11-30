const express = require("express");
const app = express();
require("dotenv").config();
var jwt = require("jsonwebtoken");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ijwgr8d.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const userCollection = client.db("miCasaDB").collection("users");
    const propertyCollection = client.db("miCasaDB").collection("properties");
    const reviewCollection = client.db("miCasaDB").collection("review");
    const wishesCollection = client.db("miCasaDB").collection("wishes");
    const newPropertyCollection = client
      .db("miCasaDB")
      .collection("newProperty");
    const offeredCollection = client.db("miCasaDB").collection("offered");
    const paymentCollection = client.db("miCasaDB").collection("payments");

    // jwt api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // middleware
    const verifyToken = (req, res, next) => {
      console.log("Inside verify token", req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "Forbidden access" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN, (error, decoded) => {
        if (error) {
          return res.status(401).send({ message: "Forbidden access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    // user related
    app.get("/users", async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exist", insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.deleteOne(query);
      res.send(result);
    });

    // admin selection
    app.get("/users/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }
      res.send({ admin });
    });

    app.patch("/users/admin/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: "admin",
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // admin selection
    app.get("/users/agent/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let agent = false;
      if (user) {
        agent = user?.role === "agent";
      }
      res.send({ agent });
    });

    app.patch("/users/agent/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: "agent",
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // property count
    app.get("/propertyCount", async (req, res) => {
      const count = await propertyCollection.estimatedDocumentCount();
      res.send({ count });
    });

    // all properties
    app.get("/property", async (req, res) => {
      const result = await propertyCollection.find().toArray();
      res.send(result);
    });

    app.get("/property", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await propertyCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/property", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const cursor = property.find();
      const result = await cursor
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send(result);
    });

    app.get("/property/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await propertyCollection.findOne(query);
      res.send(result);
    });

    app.post("/property", async (req, res) => {
      const newPropertyItem = req.body;
      const result = await propertyCollection.insertOne(newPropertyItem);
      res.send(result);
    });

    app.delete("/property/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await propertyCollection.deleteOne(query);
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

    app.get("/review/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await reviewCollection.findOne(query);
      res.send(result);
    });

    app.delete("/review/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
    });

    // add to wishlist
    app.post("/wishlist", async (req, res) => {
      const propertyWish = req.body;
      const result = await wishesCollection.insertOne(propertyWish);
      res.send(result);
    });

    app.get("/wishlist", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await wishesCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/wishlist/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await wishesCollection.findOne(query);
      res.send(result);
    });

    app.delete("/wishlist/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await wishesCollection.deleteOne(query);
      res.send(result);
    });

    // add properties
    app.post("/addProperty", async (req, res) => {
      const newAddProperty = req.body;
      const result = await newPropertyCollection.insertOne(newAddProperty);
      res.send(result);
    });

    app.get("/addProperty", async (req, res) => {
      const result = await newPropertyCollection.find().toArray();
      res.send(result);
    });

    // offered and bought
    app.post("/offered", async (req, res) => {
      const newAddProperty = req.body;
      const result = await offeredCollection.insertOne(newAddProperty);
      res.send(result);
    });

    app.get("/offered", async (req, res) => {
      const result = await offeredCollection.find().toArray();
      res.send(result);
    });

    app.get("/offered/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await offeredCollection.findOne(query);
      res.send(result);
    });

    app.patch("/offered/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: "Accepted",
        },
      };
      const result = await offeredCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // stripe
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      console.log(amount, "amount inside the payment");
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.get("/payments/:email", verifyToken, async (req, res) => {
      const query = { email: req.params.email };
      if (req.params.email !== req.decoded.email) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const paymentResult = await paymentCollection.insertOne(payment);
      console.log("Payment info", payment);

      const query = {
        _id: {
          $in: payment.cartIds.map((id) => new ObjectId(id)),
        },
      };
      const deleteResult = await cartCollection.deleteMany(query);
      res.send({ paymentResult, deleteResult });
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
    // Ensures that the client will close when you finish/error0
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
