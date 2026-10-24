require('dotenv').config();
const MONGO = process.env.MONGO_URI;
const express = require("express");
const { MongoClient } = require("mongodb");
const client = new MongoClient(MONGO);

let db = client.db("CapstoneDB");
let collection = db.collection("books");

var app = express();
app.use(express.json());

//Rickster's minimal CORS handler
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods",
    "GET,PUT,POST,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers",
    "Content-Type, Authorization, Content-Length, X-Requested-With");
  if (req.method === "OPTIONS") res.sendStatus(200);
  else next();
});

app.get('/', (req, res) => {
    res.json("Welcome to Parker's Liebrary book server!");
});

// get /books plus with query, if query exists
app.get('/books', async (req, res) => {
    let filter = {};
    if(req.query.avail === "true"){ filter = { avail: true }}
    else if( req.query.avail === "false"){ filter = { avail: false }}

    const books = await collection.find(filter).project({ _id: 0, id: 1, title: 1 }).toArray();
    res.status(200).json(books);
});

// get /books/:id
app.get('/books/:id', async (req, res) => {
    const book = await collection.findOne({ id: req.params.id });
    if (!book){ 
        res.status(404).send(`${req.params.id} not found`);
        return;
    }
    res.status(200).json(book);
});

// put /books/:id
app.put('/books/:id', async (req, res) => {
    const updates = { ...req.body };
    const result = await collection.updateOne({ id: req.params.id }, { $set: updates });

    if(result.matchedCount === 0){
        res.status(404).send(`${req.params.id} not found`);
        return;
    }

    res.status(200).json(result);
});

// delete /books/:id
app.delete('/books/:id', async (req, res) => {
    const result = await collection.deleteOne({ id: req.params.id });

    if(result.deletedCount === 0){
        res.status(204).send(`${req.params.id} could not be found to be deleted`);
        return;
    }
    res.status(200).send(`${req.params.id} deleted`);
});

// post /books
app.post('/books' , async (req, res) => {
    const book = req.body;
    
    if(await collection.findOne({ id: book.id })){
        res.status(403).send(`${book.id} already exists`);
        return;
    }

    await collection.insertOne({ ...book });
    res.status(201).send(`${book.id} created`);
});

// start server
async function start(){
    await client.connect();
    app.listen(3000, () => console.log("LieBerry is listening..."));
}

start().catch((err) => console.error(err));