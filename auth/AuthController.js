var express = require( 'express' );
var router = express.Router();
var bodyParser = require( 'body-parser' );
var jwt = require( 'jsonwebtoken' );
var bcryptjs = require ( 'bcryptjs' );
var config = require( '../config' );
var Usuario = require( '../models/usuario.model' );
var mongoose = require( 'mongoose' );
const multiparty = require('multiparty');
var fs = require( 'fs' );

exports.authRegistro = ( req, res ) => {
	crearUsuario( req, res, 'SinSuscripcion', 3, 200 );
};

function crearUsuario( req, res, tipo, mmrestantes, puntaje ) {
	var form = new multiparty.Form();

	form.parse( req, ( err, fields, files ) => {
		var hashedPassword = bcryptjs.hashSync( fields.pass[0], 8 );

		let usuario = new Usuario ( {
			_id: mongoose.Types.ObjectId(),
			correo: fields.correo[0],
			nombre: fields.nombre[0],
			apellido: fields.apellido[0],
			pass: hashedPassword,
			tipo: tipo !== undefined ? tipo : fields.tipo[0],
			mmrestantes: mmrestantes !== undefined ? mmrestantes : fields.mmrestantes[0],
			puntaje: puntaje !== undefined ? puntaje : fields.puntaje[0]
		} );

		var imgPath;
		var contentType;

		if ( files.img !== undefined ) {
			var filename = files.img[0].originalFilename.split( '.' );
			contentType = filename[filename.length - 1];
			imgPath = files.img[0].path;
		} else {
			imgPath = './views/img/user_default.png';
			contentType = 'png';
		}

		fs.readFile( imgPath, ( err, data ) => {
			if ( err )
				return console.log( err );

			usuario.img.data = data;
			usuario.img.contentType = contentType;

			usuario.save()
				.then( ( u ) => {
					var token = jwt.sign( { id: usuario._id }, config.secret, { expiresIn: 86400 } );
					res.status( 200 ).send( { auth: true, token } );
				} )
				.catch( ( err ) => {
					console.log( err );
					res.status( 500 ).json( { Error: 'No se pudo agregar el usuario debido al sguiente error: ' + err.message } );
				} );
		} );
	} );
}

exports.authMe = ( req, res, next ) => {
	var token = req.headers['x-access-token'];

	if ( !token )
		return res.status( 401 ).send( { auth: false, message: 'No hay token' } );

	jwt.verify( token, config.secret, ( err, decoded ) => {
		if ( err )
			return res.status( 500 ).send( { auth: false, message: 'Fallo al autenticar' } );

		Usuario.findById( decoded.id, { pass: 0 }, ( err, usuario ) => {
			if ( err )
				return res.status( 500 ).send( 'Problema en la busqueda del usuario' );

			if ( !usuario )
				return res.status( 404 ).send( 'No se encontró el usuario' );

			res.status( 200 ).send( usuario );
		} );
	} );
};

exports.authLogin = ( req, res ) => {
	Usuario.findOne( { correo: req.body.correo }, ( err, usuario ) => {
		if ( err )
			return res.status( 500 ).send( 'Error en el servidor' );

		if ( !usuario )
			return res.status( 404 ).send( 'Usuario no encontrado' );

		var passwordIsValid = bcryptjs.compareSync( req.body.pass, usuario.pass );

		if ( !passwordIsValid )
			return res.status( 401 ).send( { auth: false, token: null } );

		var token = jwt.sign( { id: usuario._id }, config.secret, { expiresIn: 86400 } );
		res.status( 200 ).send( { auth: true, token: token } );
	} );
};