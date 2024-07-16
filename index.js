const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.28tvm1z.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    await client.connect();
    const userCollection = client.db("Tflix").collection("users");
    const watchedMoviesCollection = client
      .db("Tflix")
      .collection("watchedMovies");

    // JWT APi
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // Users Apis
    app.post("/users", async (req, res) => {
      const user = req.body;
      try {
        const result = await userCollection.insertOne(user);
        console.log("Insert result:", result);
        res.status(201).send(result);
      } catch (error) {
        console.error("Error inserting user:", error);
        res
          .status(500)
          .send({ error: "An error occurred while saving the user." });
      }
    });

    app.post("/addwatchedmovies", async (req, res) => {
      const seenMovies = req.body;
      // console.log(seenMovies);
      try {
        const result = await watchedMoviesCollection.insertOne(seenMovies);
        res.status(201).send(result);
      } catch (error) {
        console.log("Error inserting movie Details", error);
        res
          .status(500)
          .send({ error: "An error occurred while saving the user." });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("T-flix Server is running");
});

app.listen(port, () => {
  console.log(`T-flix Port ${port}`);
});
