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
let subsARanking = [];
let ranking = [];

let mensajesNoEnviados = [];

io.on( 'connection', ( cliente ) => {
	cliente.on( 'conectado', ( id ) => {
		for ( let i = 0; i < usuarios.length; i++ )
			if ( usuarios[i].id == id ) {
				console.log( 'Cliente con doble conexión ' + id + ', desconectado...' );
				usuarios[i].socket.emit( 'desconectar' );
				usuarios[i].socket = cliente;
				return;
			}

		usuarios.push( {
			socket: cliente,
			id: id
		} );

		console.log( 'Cliente conectado, id = ' + id + ', socket = ' + cliente.id );

		for ( let i = mensajesNoEnviados.length - 1; i >= 0; i-- )
			if ( mensajesNoEnviados[i].id == id ) {
				mensajesNoEnviados[i].mensaje.puntos = 0;
				cliente.emit( 'mensaje', mensajesNoEnviados[i].mensaje );
				mensajesNoEnviados.splice( i, 1 );
			}
	} );

	cliente.on( 'desconectar', () => {
		desconectar( cliente.id );
	} );

	cliente.on( 'disconnect', () => {
		desconectar( cliente.id );
		quitarDeRanking( cliente.id );
	} );

	cliente.on( 'sub-ranking', () => {
		for ( let i = 0; i < subsARanking.length; i++ )
			if ( subsARanking[i].socket.id == cliente.id )
				return;

		subsARanking.push( {
			socket: cliente
		} );

		console.log( 'Ranking conectado ' + cliente.id );
	} );

	cliente.on( 'unsub-ranking', () => {
		quitarDeRanking( cliente.id );
	} );
} );

function quitarDeRanking( id ) {
	for ( let i = 0; i < subsARanking.length; i++ )
		if ( subsARanking[i].socket.id == id ) {
			subsARanking.splice( i, 1 );
			console.log( 'Ranking desconectado ' + id );
			return;
		}
}

function desconectar( id ) {
	for ( let i = 0; i < usuarios.length; i++ )
		if ( usuarios[i].socket.id === id ) {
			console.log( 'Cliente desconectado, id = ' + usuarios[i].id + ', socket = ' + id );
			usuarios.splice( i, 1 );
			return;
		}
}

exports.mensaje = ( id, titulo, mensaje, puntos = 0 ) => {
	let json = {
		titulo: titulo,
		contenido: mensaje,
		puntos: puntos
	};

	for ( let i = 0; i < usuarios.length; i++ )
		if ( usuarios[i].id === id ) {
			usuarios[i].socket.emit( 'mensaje', json );
			return;
		}

	console.log( 'Guardando mensaje para ' + id );

	mensajesNoEnviados.push( {
		id: id,
		mensaje: json
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

exports.llenarRanking = ( usus ) => {
	ranking = [];

	for ( let i = 0; i < usus.length; i++ )
		if ( usus[i].tipo != 'Admin' && usus[i].tipo != 'SinSuscripcion' )
			ranking.push( {
				id: usus[i]._id.toString(),
				correo: usus[i].correo,
				nombre: usus[i].nombre,
				apellido: usus[i].apellido,
				puntaje: usus[i].puntaje,
				img: ( usus[i].img.data != undefined ) ? 'data:image/jpeg;base64,' + usus[i].img.data.toString( 'base64' ) : ''
			} );
}

let puntajeCambio = false;

exports.puntosCambiados = ( usuario ) => {
	let esta = false;

	for ( let i = 0; i < ranking.length; i++ )
		if ( ranking[i].id == usuario._id.toString() ) {
			ranking[i].puntaje = usuario.puntaje;
			esta = true;
			puntajeCambio = true;
			break;
		}

	if ( !esta && ranking[ranking.length - 1].puntaje <= usuario.puntaje || !esta && ranking.length < 10 ) {
		ranking.push( {
			id: usuario._id.toString(),
			correo: usuario.correo,
			nombre: usuario.nombre,
			apellido: usuario.apellido,
			puntaje: usuario.puntaje,
			img: ( usuario.img.data != undefined ) ? 'data:image/jpeg;base64,' + usuario.img.data.toString( 'base64' ) : ''
		} );

		if ( ranking.length > 10 )
			ranking.pop();

		puntajeCambio = true;
	}
}

function reenviar( reenviarSioSi = false ) {
	if ( puntajeCambio || reenviarSioSi ) {
		ranking.sort( ( r1, r2 ) => {
			return r2.puntaje - r1.puntaje;
		} );

		for ( let i = 0; i < subsARanking.length; i++ )
			subsARanking[i].socket.emit( 'nuevo-ranking', ranking );

		puntajeCambio = false;
	}
}

exports.reenviar = reenviar;