require('dotenv').config();
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
const DB_URI_ONLINE = "mongodb+srv://Manuel:" + process.env.MONGOOSE_PW + "@cluster0.bvwmd.mongodb.net/" + DB + "?retryWrites=true&w=majority";


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
//For Development use localhost of server
//For deploy use https://nextjs-to-do-list.vercel.app
var corsOptions = {
  origin: 'https://nextjs-to-do-list.vercel.app',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
//Alle Routes sollen bedient werden. Nicht nur eine einzige
// app.use(cors(corsOptions));
app.use(cors());





// Establish DB connection
//Für eine Offline Database statt <DB_URI_ONLINE> einfach <DB_URI + DB> einsetzen
mongoose.connect("mongodb+srv://Manuel:ToDoListNextJs@cluster0.bvwmd.mongodb.net/NextJsToDOList?retryWrites=true&w=majority", {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false,
  connectTimeoutMS: 10000
});
const db = mongoose.connection;

// Event listeners
db.once('open', () => console.log(`Connected to ${DB} database`));


const NoteModel = new mongoose.Schema({
  Note: String,
});

const UserList = new mongoose.Schema({
  UserId: String,
  UserListItems: [NoteModel],
});

const UserModel = mongoose.model('UserListCollection', UserList);


// app.options('/api/list/add', function (req, res) {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader('Access-Control-Allow-Methods', '*');
//   res.setHeader("Access-Control-Allow-Headers", "*");
//   res.end();
// });


//Here is the initial Request made from the Client.
//Es wird entschieden, ob bereits ein account da ist oder nicht.
//Falls ja, wird einfach die Collection nach einem Document mit der passenden UserId durchsucht und an den Client übersendet.
//Falls nicht, wird in der Collection ein Document erstellt und dann an den Client zurück gesendet.
//Gesendet wird das Array mit UserId und dem Array, in welchem die Notes gespeichert sind.
app.post("/api/list", function(req, res) {
  console.log("the initial request after LogIn was made");
  console.log(req.body.id);
  const UserIdFromSession = req.body.id;

  UserModel.find({
    UserId: UserIdFromSession
  }, (error, docs) => {
    if (!error) {
      //If User already has an account
      if (docs.length != 0) {
        console.log("User already has data. Send current Document!");
        UserModel.find({
          UserId: UserIdFromSession
        }, (error, docs) => {
          if (!error) {
            res.json(docs)
          } else {
            res.status(400).json({
              "error": error
            });
          }
        });

      } else {
        //If User has no account, then create an initial accaunt
        console.log("User has no data. It will be created.");
        const probe = new UserModel({
          UserId: UserIdFromSession,
          UserListItems: [],
        });
        //Save the New Model in the Collection. Then send back the whole Model.
        probe.save(function(err) {
          if (!err) {
            UserModel.find({
              UserId: UserIdFromSession
            }, (error, docs) => {
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
      }
    } else {
      console.log(error);
    }
  });

});

//Hier wird eine neue Note in das subdocument hinzugefügt.
app.post("/api/list/add", async function(req, res) {
  console.log("The session Id is  " + req.body.session.id);
  console.log("The new Item is  " + req.body.newlistItem.Titel);

  const UserIdFromSession = req.body.session.id;
  const newNote = req.body.newlistItem.Titel;

//Hier findet das findOne, hinzufügen und saven über die await funktion statt. So ist es übersichtlicher. Deshalb ist die callback auch eine async funktion
//Das Subducouemt "NoteModel" befindet sich in einem Array und kann ganz einfach über .push ein neues hinzugefügt werden. Mongoose erkennt das.
  const updateDocument = await UserModel.findOne({UserId: UserIdFromSession});
  updateDocument.UserListItems.push({Note: newNote})
  const updated = await updateDocument.save()
  console.log("The Document is updated: " + updated);
  res.json(updated)

});

//Delete Request and send back the aktuelle List
//Du bekommst hier die Session, und die Id des Documentes, welches gelöscht werden soll.
//Du suchst erst nach dem Document mit der Session_ID, also vom User und dann in diesem Douement
//unter UserListItems durchsuchst Du das Array nach einem Document (hier ein Object) mit der deleteId.
//Falls gefunden .remove()
app.post("/api/list/delete", async function(req, res){
  console.log("The session Id for delete request is  " + req.body.session.id);
  console.log("The delete id is  " + req.body.id);

  const UserIdFromSession = req.body.session.id;
  const deleteId = req.body.id;
  //https://stackoverflow.com/questions/26252569/mongoose-delete-subdocument-array-item hier findest Du den zusammenhang zu .id(id)
  const updateDocument = await UserModel.findOne({UserId: UserIdFromSession});
  updateDocument.UserListItems.id(deleteId).remove();
  const updated = await updateDocument.save()
  console.log("It is deleted " + updated);
  res.json(updated)

})



app.listen(PORT, function(req, res) {
  console.log("Server is running on Port " + (PORT));
});
