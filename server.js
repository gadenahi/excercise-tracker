const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongo = require('mongodb')  // no required??
const mongoose = require('mongoose')

const logger = require("morgan")
const Add = require("./Add")
const User = require("./User")

const REGEX = /\d{4}-\d{2}-\d{2}/

mongoose.connect(process.env.MONGO_URI, { 
  useNewUrlParser: true,
  useUnifiedTopology: true  
});

const db = mongoose.connection;
db.on('error', (err) => { console.log('Mongo DB connection error', err); });
db.once('open', () => { console.log('Mongo DB connected.'); });

app.use(logger('dev'))
app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.get("/api/exercise/users/", function(req, res) {

  User.find({}, function(err, alldata) {
    if (alldata) {
      // console.log(alldata)
      res.send(alldata)
   } else {
      req.flash("error", err.errors);      
    }
  }); 
})

app.get("/api/exercise/log/", function(req, res) {
  const id = req.query.userId
  // console.log(id)
  const from = req.query.from
  const to = req.query.to
  const limit = req.query.limit
  let userId;
  const query = {};
  User.find({_id: id},{"__v":0}, function(err, data) {
    // console.log(data)
    
    if(err) {
      res.send("unknown userId")      
    } else if (!data) {
      res.send("User not found")           
    } else {
      query.userid = id;
      if (from !== undefined) {
        var newfrom = new Date(from)
        query.date = {$gte: newfrom}
      }
      if (to !== undefined) {
        var newto = new Date(to)
        query.date = {$lt: newto};
      }
      if (from !== undefined & to !== undefined) {
        var newfrom = new Date(from)
        var newto = new Date(to)
        query.date = {$gte: newfrom, $lt: newto}        
      }      
      if (limit !== undefined) {
        var newlimit = Number(limit);
      }
      // console.log(query)
      Add.find(query,{"_id":0, "userid":0, "__v":0}).limit(newlimit).exec((err, log) => {
        if (log) {
          // console.log(log.length)
          var count = "{count: " + log.length + "}";
          res.send(data + count + "log: ["+ log +"]"); // check           
        } else {
          req.flash("error", err.errors);                
        }
      })
    } 
  })
})

app.post("/api/exercise/new-user", function(req, res, next){
  
  var user = new User();
  
  User.findOne({username: req.body.username}, function(err, userdata) {
    if(userdata) {
      // let alreadyUser = userdata.username;
      res.send("username already taken")  //need to add message
    } else {
      user.username = req.body.username;
      console.log(user)
      user.save(function(err) {
        if(err){
          // req.flash("error", err.errors);
          res.send("error");
        } else {
          res.json({_id: user._id, username: user.username})
        }
      })
    }
  })
})

app.post("/api/exercise/add", function(req, res, next) {
  var add = Add();  
  
  User.findOne({_id: req.body.userId}, function(err, iddata) {
    if(iddata) {
      add.userid = req.body.userId;
      add.description = req.body.description;
      add.duration = req.body.duration;
      if (req.body.date.match(REGEX)) {
      add.date = req.body.date;  //check format
      } else {
        req.flash("error", err.errors);          
      }
      add.save(function(err) {
        if(err) {
          req.flash("error", err.errors);             
        } else {
          res.json({userid: add.userid, description: add.description, duration: add.duration, date: add.date, })
        }
      })
      
    } else {
      res.send("unknown_id")
    }
  })
})

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
