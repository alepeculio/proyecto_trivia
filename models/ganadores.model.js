var mongoose = require( 'mongoose' );
var Schema = mongoose.Schema;

var GanadoresSchema = new Schema( {
	ID_usuario: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Usuarios',
		required: true
	},
	nombre:{type: String,required: true,max: 200, trim:true},
	apellido:{type: String,required: true,max: 200, trim:true},
	img: { data: Buffer, contentType: String},
	puntos: {
		type: Number,
		required: true
	}
} );

module.exports = mongoose.model( 'Ganadores', GanadoresSchema );