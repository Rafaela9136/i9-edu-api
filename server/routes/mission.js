var express = require('express');
var router = express.Router();


var Mission = require('../models/mission.js');
var MissionAnswer = require('../models/mission_answer.js');


//Index
router.get('/', function(req, res) {
  Mission.find({}, function(err, missions) {
    if (err) {
      res.status(400).send(err);
    } else {
      res.status(200).json(missions);
    }
  });
});

//Find by params
router.get('/query/fields', function(req, res) {
  Mission.find(req.query, function(err, mission) {
    if (err) {
      res.status(400).send(err);
    } else if (!mission){
      res.status(404).send("Missão não encontrada");
    } else {
      res.status(200).json(mission);
    }
  });
});

//public?user_id
router.get('/public', function(req, res) {
  Mission.find({ is_public: true }, async function(err, missions) {
    if (err) {
      res.status(400).send(err);
    } else {
      var result = []
      let date = new Date();

      for (var i = 0; i < missions.length; i++) {
        let mission = missions[i];
        let end_time = new Date(mission.end_time);
        let in_time = end_time.toLocaleString() > date.toLocaleString();

        if (mission.single_answer) {
          console.log('single answer');
          await wasMissionAnswered(mission._id, req.query.user_id).then((answered) => {
            if (!answered && in_time) {
              console.log('single answer not answered and in time');
              result.push(mission);
            }
          });
        } else if (!mission.single_answer && in_time){
          console.log('not single answer and in time');
          result.push(mission);
        }
      }
    }

    res.status(200).send(result);
  });
});

//private?user_id&secret_code
router.get('/private', function(req, res) {
  Mission.findOne({ secret_code: req.query.secret_code }, async function(err, mission) {
    if (err) {
      res.status(400).send(err);
    } else if (!mission) {
      res.status(404).send('Missão não encontrada');
    } else {
      let end_time = new Date(mission.end_time);
      let date = new Date();
      let answered;

      try {
        answered = await wasMissionAnswered(mission._id, req.query.user_id);
      } catch (err) {
        res.status(400).send(err);
      }

      if (end_time.toLocaleString() < date.toLocaleString()) {
        res.status(401).send('Missão expirada');
      } else if (mission.single_answer && answered) {
        res.status(401).send('Missão já foi respondida');
      } else {
        res.status(200).json(mission);
      }
    }
  });
});

var wasMissionAnswered = async function(mission, user) {
  answers = await MissionAnswer.find({ _mission: mission, _user: user }).exec();
  return answers.length > 0;
}

//Create
router.post('/', function(req, res) {
  var mission              = new Mission();
  mission.name             = req.body.name;
  mission.description      = req.body.description;
  mission.points           = req.body.points;
  mission.secret_code      = generateSecretCode();
  mission.is_public        = req.body.is_public;
  mission.is_grupal        = req.body.is_grupal;
  mission.single_answer    = req.body.single_answer;
  mission.has_image        = req.body.has_image;
  mission.has_audio        = req.body.has_audio;
  mission.has_video        = req.body.has_video;
  mission.has_text         = req.body.has_text;
  mission.has_geolocation  = req.body.has_geolocation;
  mission.end_message      = req.body.end_message;
  mission.start_time       = new Date(req.body.start_time);
  mission.end_time         = new Date(req.body.end_time);

  mission.save(function(err) {
    if (err) {
      res.status(400).send(err);
    } else {
      res.status(200).send(mission);
    }
  });
});

// Update
router.put('/:mission_id', function(req, res) {
  Mission.findById(req.params.mission_id, function(err, mission) {
    if (req.body.name) mission.name                       = req.body.name;
    if (req.body.description) mission.description         = req.body.description;
    if (req.body.points) mission.points                   = req.body.points;
    if (req.body.is_public) mission.is_public             = req.body.is_public;
    if (req.body.is_grupal) mission.is_grupal             = req.body.is_grupal;
    if (req.body.single_answer) mission.single_answer     = req.body.single_answer;
    if (req.body.has_image) mission.has_image             = req.body.has_image;
    if (req.body.has_image) mission.has_image             = req.body.has_image;
    if (req.body.has_audio) mission.has_audio             = req.body.has_audio;
    if (req.body.has_video) mission.has_video             = req.body.has_video;
    if (req.body.has_text) mission.has_text               = req.body.has_text;
    if (req.body.has_geolocation) mission.has_geolocation = req.body.has_geolocation;
    if (req.body.end_message) mission.end_message         = req.body.end_message;
    if (req.body.start_time) mission.start_time           = new Date(req.body.start_time);
    if (req.body.end_time) mission.end_time               = new Date(req.body.end_time);
    
    mission.save(function(err) {
      if (err) {
        res.status(400).send(err);
      } else {
        res.status(200).send(mission._id);
      }
    });
  });
});

// Delete
router.delete('/:mission_id', function(req, res) {
  Mission.remove({ _id: req.params.mission_id }, function(err) {
    if (err) {
      res.status(400).send(err);
    } else {
      res.status(200).send("Missão removida.");
    }
  });
});

generateSecretCode = function() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

module.exports = router;