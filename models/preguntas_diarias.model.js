var mongoose = require( 'mongoose' );
var Schema = mongoose.Schema;

var PreguntasDiariasSchema = new Schema( {
	ID_usuario: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Usuarios',
		required: true
	},
	ID_pregunta: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Pregunta',
		required: true
	},
	position: {
		type: Number,
		required: true
	}
} );

module.exports = mongoose.model( 'PreguntasDiarias', PreguntasDiariasSchema );