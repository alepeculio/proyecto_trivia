var mongoose = require( 'mongoose' );
var Schema = mongoose.Schema;

var PreguntasRespondidasSchema = new Schema( {
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
	estado: {
		type: String,
		enum: [ 'Correcta', 'Incorrecta', 'NoRespondio' ],
		required: true
	},
	tiempo: {
		type: Number,
		required: true,
		default: Date.now
	},
	fecha: {
		type: Date,
		required: true
	}
} );

module.exports = mongoose.model( 'PreguntasRespondidas', PreguntasRespondidasSchema );