const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
require('dotenv').config()

const api = require('./myApp');

app.use(cors());
app.use(express.static('public'));
app.use( bodyParser.json() );
app.use( bodyParser.urlencoded({extended: false}) );

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use('/api', api());

app.use((err, req, res, next) => {
    if (res.headerSent)
        return next(err);

    res.status(err.cause || 500).json(err).end();
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
