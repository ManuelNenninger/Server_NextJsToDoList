const express = require('express');
const mongoose = require('mongoose');
//Du musst nicht bodyParser verwenden. Du kannst auch als Middleware die express benutzen.
const bodyParser = require('body-parser')
//Ohne Cors würde das Object durch die Request entweder Empty ankommen oder die request würde failen.
const cors = require("cors");



const app = express();
const PORT = process.env.PORT || 4747;
const DB_URI = "mongodb://localhost:27017/";
const DB = "NextJsToDOList";
const DB_URI_ONLINE = "mongodb+srv://Manuel:ToDoListNextJs@cluster0.bvwmd.mongodb.net/"+ DB + "?retryWrites=true&w=majority";


// Middleware. Entweder express oder eben Bodyparser zum request fetchen aus dem body.
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({
  extended: true
}));
// app.use(cors());

//Auflösen der preflight request
app.options('*', cors());
//Optionen da nur diese spezifische Domain
var corsOptions = {
  origin: 'http://localhost:3000',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
//Alle Routes sollen bedient werden. Nicht nur eine einzige
app.use(cors(corsOptions));




// Establish DB connection
//Für eine Offline Database statt <DB_URI_ONLINE> einfach <DB_URI + DB> einsetzen
mongoose.connect(DB_URI_ONLINE, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  connectTimeoutMS: 10000
});
const db = mongoose.connection;

// Event listeners
db.once('open', () => console.log(`Connected to ${DB} database`));

const ListSchema = new mongoose.Schema({
  Titel: String,
  Content: String,
});

const ListModel = mongoose.model('ListCollection', ListSchema);
// const probe = new ListModel({
//   Titel: "Test Two",
//   Content: "Content Two",
// });
// probe.save();

//Get all ListItems
app.get("/api/list", function(req, res) {
  ListModel.find({}, (err, docs) => {
    if (!err) {
      res.json(docs)
    } else {
      res.status(400).json({
        "error": err
      });
    }
  });
});
// app.options('/api/list/add', function (req, res) {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader('Access-Control-Allow-Methods', '*');
//   res.setHeader("Access-Control-Allow-Headers", "*");
//   res.end();
// });
//Create One new List Item and send back the aktuelle List
app.post("/api/list/add", function(req, res) {
  console.log("the add request was made");
  console.log(req.body);
  const probe = new ListModel({
    Titel: req.body.Titel,
    Content: "sended Request",
  });
  probe.save(function(err) {
    if (!err) {
      ListModel.find({}, (error, docs) => {
        if (!error) {
          res.json(docs)
        } else {
          res.status(400).json({
            "error": error
          });
        }
      });
    } else {
      res.status(400).json({
        "error": err
      });
    }
  });
})
//Delete Request and send back the aktuelle List
app.post("/api/list/delete", function(req, res) {
  console.log("the delete request was made");
  console.log(req.body);
  const id = req.body.id;

  ListModel.findByIdAndRemove(id, function(err) {
    if (!err) {
      ListModel.find({}, (error, docs) => {
        if (!error) {
          res.json(docs)
        } else {
          res.status(400).json({
            "error": error
          });
        }
      });
    } else {
      res.status(400).json({
        "error": err
      });
    }
  });
})



app.listen(PORT, function(req, res) {
  console.log("Server is running on Port " + (PORT));
});
