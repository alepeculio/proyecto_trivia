var mongoose = require('mongoose');
var Schema = mongoose.Schema;

function validarCorreo(correo){
	var patron = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
	return patron.test(correo);
}

var userSchema = new Schema({
	_id: mongoose.Schema.Types.ObjectId,
	correo:{type: String,validate: [validarCorreo, false], unique:true},
	nombre:{type: String,required: true,max: 200, trim:true},
	apellido:{type: String,required: true,max: 200, trim:true},
	pass:{type:String, required:true},
	img: { data: Buffer, contentType: String},
	tipo: {type:String,enum: ['Admin', 'Suscripcion', 'SinSuscripcion']},
	mmrestantes:{type:Number, required:true},
	puntaje:{type: Number,required: true},
	ultima_conexion: {type: String}
});

module.exports = mongoose.model('Usuario', userSchema);