var mongoose  =  require('mongoose');
var Schema = mongoose.Schema;

var PreguntaSchema = new Schema({
	_id: mongoose.Schema.Types.ObjectId,
	pregunta: {type: String , require: true , max:200},
	respuestas: {type: Array , require: true},
	categoria: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Categoria'
	},

});
module.exports = mongoose.model('Pregunta',PreguntaSchema);