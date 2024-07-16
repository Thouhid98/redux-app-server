const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const {
  MongoClient,
  ServerApiVersion,
  ObjectId,
  Collection,
} = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.28tvm1z.mongodb.net/?retryWrites=true&w=majority`;

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

    // User Related Api
    const userCollection = client.db("Medicaldb").collection("users");

    // MiddleWare for verify users token
    const verifyToken = (req, res, next) => {
      // console.log('Inside middleware', req.headers.authorization);
      if (!req.headers.authorization) {
        return res.status(401).send({ message: "Forbidden Acces" });
      }
      const token = req.headers.authorization.split(" ")[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: "Forbidden Access" });
        }
        req.decoded = decoded;
        next();
      });
    };

    // Checking User Admin or Not
    app.get("/users/admin/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "Unauthorized Access" });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }
      res.send({ admin });
    });

    // Checking User Organizer or Not
    app.get("/users/organizer/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "Unauthorized Access" });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let organizer = false;
      if (user) {
        organizer = user?.role === "organizer";
      }
      res.send({ organizer });
    });

    // Checking User Professionals or Not
    app.get("/users/professionals/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: "Unauthorized Access" });
      }
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let professionals = false;
      if (user) {
        professionals = user?.role === "professionals";
      }
      res.send({ professionals });
    });

    // Jwt Releted APis
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    app.get("/users", verifyToken, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      // insert email if user doesnt exists:
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists", insertedId: null });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // Make Admin Apis
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

    // Make Organizer Api
    app.patch("/users/organizer/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: "organizer",
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // Make Professionals Api
    app.patch("/users/professionals/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: "professionals",
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // User Profile
    app.get("/participant-profile/:email", async (req, res) => {
      const email = req.params.email;
      // console.log(email);
      const query = { email: email };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    // Update User Profile
    app.patch("/updateuser-profile/:email", async (req, res) => {
      const email = req.params.email;
      const userItem = req.body;
      console.log(email, userItem);

      const filter = { email: email };
      const updatedDoc = {
        $set: {
          name: userItem.name,
          number: userItem.number,
          address: userItem.address,
          interests: userItem.interests,
          photo: userItem.image,
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // Professionals Profile
    app.get("/professionals-profile/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let professionals = false;
      if (user) {
        professionals = user?.role === "professionals";
      }
      res.send(user);
    });

    // Update Professionals Profile
    app.patch("/doctorprofile-update/:email", async (req, res) => {
      const email = req.params.email;
      const userItem = req.body;
      console.log(email, userItem);

      const filter = { email: email };
      const updatedDoc = {
        $set: {
          name: userItem.name,
          number: userItem.number,
          address: userItem.address,
          specialist: userItem.specialist,
          photo: userItem.image,
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // Organizer Profile
    app.get("/organizer-profile/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let organizer = false;
      if (user) {
        organizer = user?.role === "organizer";
      }
      res.send(user);
    });

    // Update Organizer Profile
    app.patch("/organizerprofile-update/:email", async (req, res) => {
      const email = req.params.email;
      const userItem = req.body;
      console.log(email, userItem);

      const filter = { email: email };
      const updatedDoc = {
        $set: {
          name: userItem.name,
          number: userItem.number,
          address: userItem.address,
          photo: userItem.image,
        },
      };
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // Admin Profile
    app.get("/admin-profile/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === "admin";
      }
      res.send(user);
    });

    // Camps Collection Apis
    const campCollection = client.db("Medicaldb").collection("camps");

    app.get("/manage-camps", async (req, res) => {
      const result = await campCollection.find().toArray();
      res.send(result);
    });

    // Get Popular Camps
    app.get("/popular-camps", async (req, res) => {
      const result = await campCollection.find().limit(4).toArray();
      res.send(result);
    });

    // app.get('/popular-camps', async (req, res) => {

    //     const result = await registeredCollection.aggregate([
    //         {
    //             $group: {
    //                 _id: '$campId',
    //                 count: { $sum: 1 }
    //             }
    //         },
    //         {
    //             $sort: { count: -1 }
    //         },

    //         {
    //             $lookup: {
    //                 from: 'registercamps',
    //                 localField: '_id',
    //                 foreignField: 'campId',
    //                 as: 'campDetails'
    //             }
    //         }
    //     ]).toArray()

    //     res.send(result)
    // })

    // Get Camp Single Details

    app.get("/camp-details/:id", async (req, res) => {
      const id = req.params.id;
      // console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await campCollection.findOne(query);
      res.send(result);
    });

    app.post("/add-a-camp", async (req, res) => {
      const campitem = req.body;
      // console.log(campitem)
      const result = await campCollection.insertOne(campitem);
      res.send(result);
    });

    app.delete("/delete-camp/:campId", async (req, res) => {
      const id = req.params.campId;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await campCollection.deleteOne(query);
      res.send(result);
    });

    // Update Camp data
    //Step 01: First load the data
    app.get("/update-camp/:campId", async (req, res) => {
      const id = req.params.campId;
      // console.log(id)
      const query = { _id: new ObjectId(id) };
      const result = await campCollection.findOne(query);
      res.send(result);
    });

    // Step 02: Update the data
    app.patch("/update-camp/:campId", async (req, res) => {
      const item = req.body;
      const id = req.params.campId;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          name: item.name,
          campfees: item.campfees,
          campdes: item.campdes,
          location: item.location,
          specialservice: item.specialservice,
          professionals: item.professionals,
          targetaudience: item.targetaudience,
          date: item.date,
          image: item.image,
        },
      };
      const result = await campCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // id, name, campfees, location, specialservice,
    // professionals, targetaudience, date, image, campdes

    // Registerd Camps
    const registeredCollection = client
      .db("Medicaldb")
      .collection("registercamps");

    app.get("/manage-registered-camps", async (req, res) => {
      const result = await registeredCollection.find().toArray();
      res.send(result);
    });

    // Find User Registered Camps
    app.get("/registered-camps/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await registeredCollection.find(query).toArray();
      res.send(result);
    });

    // Cancel User Registered camps
    app.delete("/canceluser-registered/:id", async (req, res) => {
      const id = req.params.id;
      console.log("Cancel Register Id", id);

      const query = { _id: new ObjectId(id) };
      const result = await registeredCollection.deleteOne(query);
      res.send(result);
    });

    app.post("/manage-registered-camps", async (req, res) => {
      const registered = req.body;
      console.log(registered);
      const result = await registeredCollection.insertOne(registered);
      res.send(result);
    });

    // Give Feedback Api
    const feedbackCollection = client.db("Medicaldb").collection("feedbacks");

    app.get("/feedback/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await registeredCollection.findOne(query);
      res.send(result);
    });

    app.get("/given-reviews/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await feedbackCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/all-reviews", async (req, res) => {
      const result = await feedbackCollection
        .find()
        .sort({ _id: -1 })
        .toArray();
      res.send(result);
    });

    app.post("/feedback-rating", async (req, res) => {
      const review = req.body;
      console.log(review);
      const result = await feedbackCollection.insertOne(review);
      res.send(result);
    });

    // Delete Registration APi
    app.delete("/delete-registration/:id", async (req, res) => {
      const id = req.params.id;
      console.log("delete id", id);
      const query = { _id: new ObjectId(id) };
      const result = await registeredCollection.deleteOne(query);
      res.send(result);
    });

    // Payment Related Apis
    app.patch("/accept-payment/:id", async (req, res) => {
      const id = req.params.id;
      console.log("payment id", id);
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          payment: "Accepted",
        },
      };
      const result = await registeredCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    // Stripe Payment Intent
    app.post("/create-payment-intent", async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      console.log(amount);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    // Save Payment History In the database
    const paymentCollection = client.db("Medicaldb").collection("payments");

    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const paymentResult = await paymentCollection.insertOne(payment);
      console.log("Payment Info", payment);

      // Carefully Delete each item from the cart ordered
      const query = {
        _id: {
          $in: payment.registerId.map((id) => new ObjectId(id)),
        },
      };
      const deleteResult = await registeredCollection.deleteMany(query);
      res.send({ paymentResult, deleteResult });
    });

    // shwo user payment history
    app.get("/payments/:email", verifyToken, async (req, res) => {
      const query = { email: req.params.email };
      if (req.params.email !== req.decoded.email) {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      const result = await paymentCollection.find(query).toArray();
      res.send(result);
    });

    // app.get('/api/user_counts', async (req, res) => {

    //       const userCounts = await registeredCollection.aggregate([
    //         {
    //           $group: {
    //             _id: { campId: '$campId', email: '$email' },
    //             count: { $sum: 1 }
    //           }
    //         },
    //         {
    //           $group: {
    //             _id: '$_id.campId',
    //             userCount: { $sum: '$count' }
    //           }
    //         }
    //       ]).toArray();

    //       res.send(userCounts);

    //   });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Medical Server is running");
});

app.listen(port, () => {
  console.log(`Medical camp Port ${port}`);
});
