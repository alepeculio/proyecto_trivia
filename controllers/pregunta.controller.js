var mongoose = require( 'mongoose' );
const PreguntasRespondidas = require( '../models/preguntas_respondidas.model.js' );
const PreguntasDiarias = require( '../models/preguntas_diarias.model.js' );

exports.preguntas = ( req, res ) => {
	res.render( 'preguntas.ejs' );
};

exports.generarPreguntaDiaria = ( req, res ) => {
	
};

exports.usuarioRespondio = ( req, res ) => {
	let fecha = new Date();
	fecha.setUTCHours( 0, 0, 0, 0 );

	let respondio = new PreguntasRespondidas({
		ID_usuario: req.body.ID_Usuario,
		ID_pregunta: req.body.ID_Pregunta,
		estado: req.body.estado,
		tiempo: req.body.tiempo,
		fecha: fecha.toISOString()
	});
	respondio.save().then(( r ) => {
		res.send( ' Registro ingresado' );
	}).catch (( err ) => {
		res.send( 'Error: ' + err.message );
	});
};