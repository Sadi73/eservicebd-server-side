const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const app = express();
const port = 3000;

// middleware
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.jcb8og7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const database = client.db("eserviceBD");
    const allService = database.collection("allServices");
    const bookedService = database.collection("bookedServices");

    app.get('/services/all', async (req, res) => {
      const email = req?.query?.email;
      if (email) {
        const cursor = allService.find({ 'providerInfo.providerEmail': email });
        const result = await cursor.toArray();
        res.send(result);
      } else {
        const cursor = allService.find();
        const result = await cursor.toArray();
        res.send(result);
      }
    });

    app.get('/services/popular', async (req, res) => {
      const cursor = allService.find();
      const result = await cursor.toArray();
      const result1 = result.slice(0, 6);
      res.send(result1);
    });

    app.get('/service/:serviceId', async (req, res) => {
      const id = req.params?.serviceId;
      const query = { sequence_value: parseInt(id) };
      const result = await allService.findOne(query);
      res.send(result);
    });

    app.post('/add-service', async (req, res) => {

      const cursor = allService.find();
      const previousData = await cursor.toArray();


      const serviceData = req?.body;
      serviceData.sequence_value = previousData.length + 1;

      const result = await allService.insertOne(serviceData);
      res.send(result);
    });

    app.put('/update-service/:serviceId', async (req, res) => {
      const id = req?.params?.serviceId;
      const serviceData = req?.body;
      const filter = { sequence_value: parseInt(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          serviceTitle: serviceData?.serviceTitle,
          price: serviceData?.price,
          imageURL: serviceData?.imageURL,
          serviceArea: serviceData?.serviceArea,
          description: serviceData?.description,
        },
      };
      const result = await allService.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    app.post('/book-service', async (req, res) => {
      const serviceToBook = req?.body;
      const result = await bookedService.insertOne(serviceToBook);
      res.send(result);
    });

    app.get('/booked-service/all', async (req, res) => {
      const email = req?.query?.email;
      if (email) {
        const cursor = bookedService.find({ 'providerInfo.providerEmail': email });
        const result = await cursor.toArray();
        res.send(result);
      } else {
        const cursor = bookedService.find();
        const result = await cursor.toArray();
        res.send(result);
      }
    });

    app.put('/booked-service/:serviceId', async (req, res) => {
      const id = req?.params?.serviceId;
      const status = req?.body;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: status.status
        },
      };
      const result = await bookedService.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    app.delete('/service/delete/:serviceId', async (req, res) => {
      const id = req?.params?.serviceId;
      const query = { sequence_value: parseInt(id) };
      const result = await allService.deleteOne(query);
      res.send(result);
    });

    app.post('/jwt', (req, res) => {
      const payload = req?.body;
      const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'none',
        secure: false
      })
        .send({ success: true });
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


app.get('/', (req, res) => {
  res.send('Hello World!');
});


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
