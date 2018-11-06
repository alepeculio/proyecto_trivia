/*const io = require( 'socket.io' )();

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

io.listen( 1234 );

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
}*/