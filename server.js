const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const errorHandler = require('errorhandler');
const compression = require('compression');
const mongoose = require('mongoose');
const graphqlExpress = require("express-graphql");

const UserSchema = require('./graphql/UserSchema').UserSchema;
const { DB_URL } = require('./config/connection');

// Models
require('./models/User');

//Configure mongoose's promise to global promise
mongoose.promise = global.Promise;
//Configure isProduction variable
const isProduction = process.env.NODE_ENV === 'production';

const app = express();

//Configure our app
app.use(cors());
app.use(compression());
app.use(bodyParser.urlencoded({limit: '10mb', extended: false }));
app.use(bodyParser.json({limit: '10mb', extended: true}));
app.use(express.static(path.join(__dirname, 'public')));

if(!isProduction) {
  app.use(errorHandler());
}

app.use('/user', graphqlExpress({
    schema: UserSchema,
    rootValue: global,
    graphiql: true,
    customFormatErrorFn(err) {
        if (!err.originalError) {
          return err;
        }
        const data = err.originalError.data;
        const message = err.message || 'An error occurred.';
        const code = err.originalError.code || 500;
        return { message: message, status: code , data:data };
    }
}));

//Error handlers & middlewares
if(!isProduction) {
    app.use(function (err, req, res, next) {
      res.status(err.status || 500);
  
      res.json({
        errors: {
          message: err.message,
          error: err
        }
      });
    })
  }
  
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
  
    res.json({
      errors: {
        message: err.message,
        error: {}
      },
    });
  });
  

app.get('/', (req, res) => {
    res.send("Server Running ! ")
})

mongoose.connect(DB_URL, (err) => {
    if (err) throw err;
}).then(result => {
    // default Heroku port
    app.listen(process.env.PORT || 8000);
})
.catch(err => console.log(err));
mongoose.set('debug', true);
