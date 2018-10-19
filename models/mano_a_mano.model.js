var mongoose = require( 'mongoose' );
var Schema = mongoose.Schema;

var ManoaManoSchema = new Schema( {
	_id: mongoose.Schema.Types.ObjectId,
	ID_retador: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Usuarios',
		required: true
	},
	ID_retado: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Usuarios',
		required: true
	},
	ID_ganador: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Usuarios'
	},
	ID_perdedor: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Usuarios'
	},
	cant_correcta_retador: {
		type: Number
	},
	tiempo_retador: {
		type: Number
	},
	fecha:{
		type: String,
		required: true
	},
	preguntas:{
		type: Array
	}
} );

module.exports = mongoose.model( 'ManoaMano', ManoaManoSchema );