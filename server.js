var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var User = require('./models/user');
var passwordHash = require('password-hash');

mongoose.connect('mongodb://sib:pass@ds151917.mlab.com:51917/final');

var db = mongoose.connection;
db.on('error', function(err){
  console.log('connection error ', err);
});

db.once('open', function() {
  console.log('connected');
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8080;

var router = express.Router();

router.use(function(req, res, next) {
    // do logging
    console.log('Something is happening.');
    next(); // make sure we go to the next routes and don't stop here
});

router.get('/', function(req, res) {
    res.json({message: 'this worked'});
});

router.route('/register').post(function(req, res) {

    var user = new User();
    user.name = req.body.name;
    user.password = passwordHash.generate(req.body.password);

    user.save(function(err) {
      if(err)
        return res.json({success: false, message: 'name already exists'});
      res.json(user);

    });

});
function findUser(name, callback) {
  User.findOne({name: name}, function(err, user) {
    if(err) {
      callback(err, null);
    }else {
      callback(null, user);
    }
  });
};


router.put('/addfriend', function(req, res, next) {
  var user_name = req.body.name;
  var friend_to_add = req.body.friend
  var friend_found = false;


   User.findOne({name: friend_to_add}, function(err,user) {
    if(err) throw err;
    if(!user) {
      console.log('error');
      res.send({success: false, message: 'friend to add not found'});
      return;
    }
    var isInArray = user.friends.some(function(friend) {
      return (friend == user_name);
    });
    if(isInArray) {
      res.send({success: false, message:'already friends'});
      return;
    }
    user.friends.push(user_name);
    user.save(function(err){
      if(err) throw err;
    });
    User.findOne(user_name, function(err, user2) {
      user2.friends.push(friend_to_add);
      user2.save(function(err) {
        if(err) throw err;
      });
      res.send(user2);
      return;
    });
  });

});

router.get('/user/:name', function(req, res){
  User.findOne({name: req.params.name}, function(err, user) {
    if(err) throw err;
    if(!user) {
      res.send({success: false, message: 'User not found'});
      return;
    } else {
      res.send(user);
      return;
    }
  });
});

router.post('/check', function(req, res) {
  User.findOne({
    name: req.body.name
  }, function(err, user) {
    if(err) throw err;

    if(!user) {
      res.send({success: false, message: 'User not found'});
    } else{
      //check password
      var sentPass = req.body.password;
      var comparison = passwordHash.verify(sentPass, user.password);
      if(comparison) {
        return res.json(user);
      }
      else{
        res.json({success: false, message:'username or password not matched'});
      }
    }
  });
});



//all routes will be prefixed with /login
app.use('/login', router);

//start
app.listen(port);
console.log("listening on port " + port)
