var mongoose  =  require('mongoose');
var Schema = mongoose.Schema;
var CategoriaSchema = new Schema({
	_id: mongoose.Schema.Types.ObjectId,
	name: {type: String, required: true, max: 100}
});

module.exports = mongoose.model('Categoria',CategoriaSchema);