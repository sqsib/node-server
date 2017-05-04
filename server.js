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

router.post('/removefriend', function(req, res) {
  var user_name = req.body.name;
  var friend_to_remove = req.body.friend;
  var friend_found = false;

  if(user_name == friend_to_remove) {
    res.send({success: false, message: 'You cannot remove yourself'});
    return;
  }

  User.find({name: friend_to_remove}, function(err,user) {
   if(err) console.log(err);
   if(!user[0]) {
     console.log('error');
     res.send({success: false, message: 'friend to remove not found'});
     return;
   }
   var isInArray = user[0].friends.some(function(friend) {
     return (friend == user_name);
   });
   if(!isInArray) {
     res.send({success: false, message:'you are not friends with this user'});
     return;
   }
   user[0].friends.pull(user_name);
   user[0].save(function(err){
     if(err)  console.log(err);
   });
   User.find({name: user_name}, function(err, user2) {
     user2[0].friends.pull(friend_to_remove);
     user2[0].save(function(err) {
       if(err) console.log(err);
     });
     res.send(user2[0]);
     return;
   });
 });

});
router.post('/addfriend', function(req, res, next) {
  var user_name = req.body.name;
  var friend_to_add = req.body.friend;
  var friend_found = false;

  if(user_name == friend_to_add) {
    res.send({success: false, message: 'You cannot add yourself'});
    return;
  }

   User.find({name: friend_to_add}, function(err,user) {
    if(err) console.log(err);
    if(!user[0]) {
      console.log('error');
      res.send({success: false, message: 'friend to add not found'});
      return;
    }
    var isInArray = user[0].friends.some(function(friend) {
      return (friend == user_name);
    });
    if(isInArray) {
      res.send({success: false, message:'already friends'});
      return;
    }
    console.log('Pushing friend');
    console.log('friend name ' + user[0].name);
    user[0].friends.push(user_name);
    user[0].save(function(err){
      if(err)  console.log(err);
    });
  });
  User.find({name: user_name}, function(err, user2) {
    if(err) console.log(err);
    //console.log(user2.toString());
    console.log('Pushing user');
    console.log('user name ' + user2[0].name);
    user2[0].friends.push(friend_to_add);
    user2[0].save(function(err) {
      if(err) console.log(err);
    });
    res.send(user2[0]);
    return;
  });
});

router.post('/updatestatus', function(req, res) {
  User.findOne({name: req.body.name}, function(err, user) {
    if(err) throw err;
    if(!user) {
      res.send({success: false, message: 'User not found'});
      return;
    }
    else {
      user.online = req.body.status;
      user.save(function(err) {
        if(err) throw err;
        res.send(user);
        return;
      });
    }
    });
  });
router.post('/getcoord', function(req, res) {
  User.findOne({name: req.body.name}, function(err, user) {
    if(err) throw err;
    if(!user){
      res.send({success: false, message: 'User not found'});
      return;
    } else {
      res.send({lat: user.location.lat, long: user.location.long});
      return;
    }

  });
});
router.post('/updatelocation', function(req, res) {
  User.findOne({name: req.body.name}, function(err, user) {
    if(err) throw err;
    if(!user) {
      res.send({success: false, message: 'User not found'});
      return;
    } else {
      user.location.lat = req.body.lat;
      user.location.long = req.body.long;

      user.save(function(err) {
        if(err) console.log(err);
      });
      res.send(user);
      return;
    }
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
