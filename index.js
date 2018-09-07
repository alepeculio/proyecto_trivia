const express = require('express');
const bodyParser = require('body-parser');

const usuario = require('./routes/usuario.route');
const preguntas = require('./routes/preguntas.route');
const app = express();


var mongoose = require('mongoose');
var deb_db_url = 'mongodb://ale:ale12345@ds127362.mlab.com:27362/testing_mlab';
var mongoDB = deb_db_url;
mongoose.connect(mongoDB, {useNewUrlParser: true});
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

app.use('/usuarios', usuario);
app.use( '/preguntas', preguntas );

let port = 1234;
//Para usar un template
//npm install --save ejs
app.set('view engine', 'ejs');

//app.use('/css', express.static(__dirname + '/views/css'));

app.listen(port, () => {
	console.log('Servidor iniciado');
});