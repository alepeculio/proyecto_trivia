var mongoose = require('mongoose');
const Usuario = require('../models/usuario.model');
const multiparty = require('multiparty');
const fs = require('fs');

exports.inicio = (req, res) => {
	res.render('usuarios.ejs');
}

exports.registro = (req, res) => {
	crearUsuario(req,res, 'SinSuscripcion', 3, 200);
}

function crearUsuario(req, res, tipo, mmrestantes, puntaje){
	var form = new multiparty.Form(); //Para el manejo de datos de formularios 'multipart/form-data'

	form.parse(req, function(err, fields, files) {
		let usuario = new Usuario ({
			_id: mongoose.Types.ObjectId(),
			correo: fields.correo[0],
			nombre: fields.nombre[0],
			apellido: fields.apellido[0],
			pass: fields.pass[0],
			tipo: (tipo != undefined) ? tipo : fields.tipo[0],
			mmrestantes: (mmrestantes != undefined) ? mmrestantes : fields.mmrestantes[0],
			puntaje: (puntaje != undefined) ? puntaje : fields.puntaje[0]
		});
		
		var imgPath;
		var contentType; //Extención del archivo.
		if(files.img !== undefined ){
			var filename = files.img[0].originalFilename.split('.');
			contentType = filename[filename.length - 1]; 
			imgPath = files.img[0].path;
		}else{
			imgPath = './views/img/user_default.png';
			contentType = 'png';
		}

		fs.readFile(imgPath, (err, data) => {
			if (err){ 
				console.log(err);
				return;
			}

			usuario.img.data = data;
			usuario.img.contentType = contentType;

			usuario.save()
			.then((u) => {
				res.json({Mensaje: 'Usuario agregado con éxito.'});
			})
			.catch((err) => {
				console.log(err);
				res.json({Error: 'No se pudo agregar el usuario debido al siguiente error: '+err.message});
			});

		});
	});
}

exports.obtener = (req, res) => { //Retorna un objeto json con los datos del usuario.
	let correo = req.query.correo;
	let id = req.query.id;
	let buscar;
	if(id != undefined){
		buscar = {_id:id};
	}else if(correo != undefined){
		buscar = {correo:correo};
	}else{
		res.json({Error: "Se debe de especificar al menos un parametro, 'id' o 'correo'"});
	}

	Usuario.find(buscar)
	.then((usuarios) => {
		if(usuarios.length == 0){
			res.json({Mensaje: 'El usuario solicitado no existe.'});
		}else{
			res.json(getUser(usuarios[0]));
		}
	}).catch((err) => {
		res.json({Error: 'No se pudo obtener el usuario debido al siguiente error: '+err.message});
	});
}

exports.actualizar = (req, res) => {
	let query = { correo: req.body.correo };

	let update = {
		nombre: req.body.nombre,
		apellido: req.body.apellido,
		pass: req.body.pass,
		tipo: req.body.tipo,
		mmrestantes: req.body.mmrestantes,
		puntaje: req.body.puntaje,
	}

	Usuario.findOneAndUpdate(query,update, (err, usuario) => {
		if(err){
			console.log(err);
			res.json({Error: 'No se pudo actualizar el usuario debido al siguiente error: '+err.message});
			return;
		}
		res.json({Mensaje: 'Usuario actualizado correctamente'});
	});
}

exports.actualizarSuscripcion = (req, res) => {
	let query = { correo: req.body.correo };

	let update = {
		tipo: req.body.tipo
	}

	res.statusCode = 200;
	res.setHeader('Content-Type','application/json');

	Usuario.findOneAndUpdate(query,update)
	.then( usuario => {
		res.write(JSON.stringify({Mensaje: 'Suscripción actualizada correctamente'}));
		res.end();
	}).catch( err => {
		console.log(err);
		res.write(JSON.stringify({Error: 'No se pudo actualizar la suscripción debido al siguiente error: '+err.message}));
		res.end();
	});

}

exports.eliminar = (req, res) => {
	let query = { correo: req.body.correo };

	Usuario.findOneAndDelete(query)
	.then((usuario) => {
		res.json({Mensaje: 'Usuario eliminado'});
	})
	.catch((err) => {
		console.log(err);
		res.json({Error: 'No se pudo eliminar el usuario debido al siguiente error: '+err.message});
	});
}

exports.listar = (req, res) => {
	let cantidad = req.query.cantidad;
	if(cantidad != undefined){
		cantidad = Number(cantidad);
	}

	Usuario.find({}, null, {sort:{puntaje: -1}}).limit(cantidad).exec((err, users)  => {
		if(err){
			console.log(err);
			res.json({Error: 'No se pudieron listar los usuarios debido al siguiente error: '+err.message});
		}else if(users.length == 0){
			res.json({Mensaje: 'No hay usuarios'});
		}else{
			let usuarios = [];
			for(u of users){
				usuarios.push(getUser(u));
			}
			res.json({usuarios :usuarios});
		}
	});
}

exports.iniciarSesion = (req, res) =>{
	let correo = req.body.correo;
	let pass = req.body.pass;

	Usuario.find({correo: correo, pass:pass})
	.then((usuarios) => {
		if(usuarios.length == 0){
			res.json({Mensaje: 'Login incorrecto.'});
		}else{
			res.json(getUser(usuarios[0]));
		}
	}).catch((err) => {
		res.json({Error: 'No se pudo obtener el usuario debido al siguiente error: '+err.message});
	});
}

function getUser(u){
	var imgBase64 = (u.img.data != undefined) ? 'data:image/jpeg;base64,'+u.img.data.toString('base64') : ''; //Pasar a base64, para usarla directamente en el img src.
	let usuario = {
		id:u._id,
		correo: u.correo,
		nombre: u.nombre,
		apellido: u.apellido,
		pass: u.pass,
		tipo: u.tipo,
		mmrestantes: u.mmrestantes,
		puntaje: u.puntaje,
		img: imgBase64
	}
	return usuario;
}