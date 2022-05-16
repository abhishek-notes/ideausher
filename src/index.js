const express = require(`express`);
const app = express();
let Parser = require("rss-parser");
let parser = new Parser();
const { MongoClient } = require("mongodb");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

async function cachedResult(queryTerm) {
  // Passed the password here instead of a enviroment file, just since it's a demo project.
  const uri ="mongodb+srv://gyewebdw:0P8nTH5mQpdlyNiM@cluster0.hqi1o.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
  
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const result = await client.db("cachedRss").collection("cachedResult").findOne({keyword: queryTerm});
    if(result) console.log('returned from cache');
    return result.value;
  } catch(err){
    console.log('error', err);
  }finally {
    // Close the connection to cluster
    await client.close();
  }
}

async function cacheIt(queryTerm, responses) {
  const uri =
    "mongodb+srv://gyewebdw:0P8nTH5mQpdlyNiM@cluster0.hqi1o.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

  const client = new MongoClient(uri);

  try {
    await client.connect();
    await client.db("cachedRss").collection("cachedResult").insertOne({ keyword: queryTerm, value: responses });
    console.log(`successfully cached,  ${queryTerm}`);
  } catch (err) {
    console.log("error", err);
  } finally {
    await client.close();
  }
}


// write read me file
// add a form to input for search
// cache request
// create a postman request

app.get("/search", async(req, res)=> {
  res.send(`<form action="/api" method="post">
    <h1> Search here </h1>
    <label for="team_name"> Enter name: </label> <br> <br>
    <input id="team_name" type="text" name="query" placeholder="input_here">
    <input type="submit" value="OK">
</form>`);
});

app.post("/api", async (req, res) => {
  
  let queryTerm = req.body.query.toLowerCase();
 
  console.log('queryTerm', queryTerm);
  const cached = await cachedResult(queryTerm);
  if(cached) {
    return res.status(200).send(cached)
    }
  var response = await parser.parseURL(
    `https://news.google.com/rss/search?q=${queryTerm}&hl=en-IN&gl=IN&ceid=IN:en`
  );

    const returnRes = await response.items.map((item) => {
      return {
        title: item.title,
        link: item.link,
        date: item.pubDate,
        snippet: item.contentSnippet
      };
    });
  
 cacheIt(queryTerm, returnRes);
 res.status(200).send(returnRes);
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});

