const express = require('express');
const bodyParser = require('body-parser');
var cors = require('cors');

const usuario = require('./routes/usuario.route');
const preguntas = require('./routes/preguntas.route');
const app = express();


var mongoose = require('mongoose');
var deb_db_url = 'mongodb://triviauser:user1234@ds149742.mlab.com:49742/triviatip';
var mongoDB = deb_db_url;
mongoose.connect(mongoDB, {useNewUrlParser: true});
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));
app.use(cors());

app.use('/usuarios', usuario);
app.use( '/preguntas', preguntas );

let port = 1234;
//Para usar un template
//npm install --save ejs
app.set('view engine', 'ejs');

app.use('/css', express.static(__dirname + '/views/css'));
app.use('/img', express.static(__dirname + '/views/img'));


const server = app.listen( process.env.PORT || port, () => {
	console.log('Servidor iniciado');
});

const io = require( 'socket.io' )( server );

let usuarios = [];

io.on( 'connection', ( cliente ) => {
	cliente.on( 'conectado', ( id ) => {
		usuarios.push( {
			socket: cliente,
			id: id
		} );

		console.log( 'Cliente conectado, id = ' + id + ', socket = ' + cliente.id );
	} );

	cliente.on( 'desconectar', () => {
		desconectar( cliente.id );
	} );

	cliente.on( 'disconnect', () => {
		desconectar( cliente.id );
	} );
} );

function desconectar( id ) {
	for ( let i = 0; i < usuarios.length; i++ )
		if ( usuarios[i].socket.id === id ) {
			console.log( 'Cliente desconectado, id = ' + usuarios[i].id + ', socket = ' + id );
			usuarios.splice( i, 1 );
			break;
		}
}

exports.mensaje = ( id, titulo, mensaje, puntos = 0 ) => {
	for ( let i = 0; i < usuarios.length; i++ )
		if ( usuarios[i].id === id )
			usuarios[i].socket.emit( 'mensaje', {
				titulo: titulo,
				contenido: mensaje,
				puntos: puntos
			} );
}

let nodemailer = require( 'nodemailer' );

exports.correo = ( para, titulo, mensaje ) => {
	var transporter = nodemailer.createTransport( {
		service: 'gmail',
		auth: {
			user: 'triviatip@gmail.com',
			pass: 'triviatip2018'
		}
	} );

	var opciones = {
		to: para,
		subject: titulo,
		html: mensaje
	};

	transporter.sendMail( opciones, ( err, info ) => {
		if ( err )
			console.log( err );
		else
			console.log( 'Correo enviado a ' + para );
	} );
}