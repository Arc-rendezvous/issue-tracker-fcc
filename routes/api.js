/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;

const CONNECTION_STRING = process.env.DB; 

module.exports = function (app) {

  app.route('/api/issues/:project')
  
    .get(function (req, res){
      var project = req.params.project;
      
    })
    
    .post(function (req, res, next){
    /* req.body = { issue_title: String (required), 
                    issue_text: String (required), 
                    created_by: String (required), 
                    assigned_to: String, 
                    status_text: String } */
    
      var project = req.params.project;
      var projectBody = req.body;
    
      //Only proceed if required fields are not blank
      if (projectBody.issue_title === undefined && projectBody.issue_text === undefined && projectBody.created_by === undefined) {
        return res.type('text').send('Please fill the required fields')
      } 
      
      MongoClient.connect(CONNECTION_STRING, function(err, client) {
        if (err) return next(err)
        console.log('Database connected to create');
  
        const db = client.db();      
        var newIssue = { issue_title: projectBody.issue_title, 
                         issue_text: projectBody.issue_text,
                         created_on: new Date(),
                         updated_on: new Date(),
                         created_by: projectBody.created_by,
                         assigned_to: projectBody.assigned_to,
                         open: true,
                         status_text: projectBody.status_text }
        
        db.collection('issue').insertOne(newIssue, (err, doc) => {
            if (err) return next(err)
            res.send(doc.ops[0])
        });
        
        client.close();
      });
    
    })
    
    .put(function (req, res, next){
      var project = req.params.project;
      var projectBody = req.body;
    
      if ((projectBody._id) && (projectBody.issue_title === '')
                           && (projectBody.issue_text === '')
                           && (projectBody.created_by === '')
                           && (projectBody.assigned_to === '')
                           && (projectBody.status_text === '')) {
        console.log('Im IN');
        return res.type('text').send('no update field sent');
      } else {            

        MongoClient.connect(CONNECTION_STRING, function(err, client) {
          if (err) return next(err)
          console.log('Database connected to update')

          const db = client.db();
          let id = projectBody._id;
          Object.keys(projectBody).forEach(key => projectBody[key] === '' && delete projectBody[key]);
          delete projectBody._id;
          projectBody.updated_on = new Date();
          console.log(projectBody);

          db.collection('issue')
            .findOneAndUpdate({_id: ObjectId(id)}, 
                       {$set: projectBody},
                       {returnOriginal: false},
            (err, doc) => {
            if (err) return next(err)
            if (doc.lastErrorObject.n == 0) return res.type('text').send('could not update ' + id);
            console.log(doc.value);
            res.send(doc.value);
          });
        })
      }
    })
    
    .delete(function (req, res, next){
      var project = req.params.project;
      var id = req.body._id;
    
      if (req.body._id == undefined) { return res.type('text').send('_id error') }
    
      MongoClient.connect(CONNECTION_STRING, function(err, client) {
        if (err) return next(err)
        console.log('Database connected to delete')
        const db = client.db();
        
        db.collection('issue').deleteOne({ _id: id }, (err, obj) => {
          if (err) { res.type('text').send('could not delete ' + id) }
          res.type('text').send('deleted ' + id);
        })
        
        client.close();
      })
    });
  
  
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
  
};
