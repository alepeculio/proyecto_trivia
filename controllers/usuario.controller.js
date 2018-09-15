var mongoose = require('mongoose');
const Usuario = require('../models/usuario.model');
const multiparty = require('multiparty');
const fs = require('fs');

exports.inicio = (req, res) => {
	res.render('usuarios.ejs');
}

exports.registro = (req, res) => {
	crearUsuario(req,res, 'SinSuscripcion', 3, 0);
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
	
		if(files.img[0].originalFilename != ''){
			var filename = files.img[0].originalFilename.split('.');
			var contentType = filename[filename.length - 1]; //Extención del archivo.
			var imgPath = files.img[0].path;

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
		}else{
			usuario.save()
			.then((u) => {
				res.json({Mensaje: 'Usuario agregado con éxito.'});

			})
			.catch((err) => {
				console.log(err);
				res.json({Error: 'No se pudo agregar el usuario debido al siguiente error: '+err.message});
			});
		}
	});
}

exports.obtener = (req, res) => { //Retorna un objeto json con los datos del usuario.
	let correo = req.query.correo;

	Usuario.find({correo: correo})
	.then((usuarios) => {
		if(usuarios.length == 0){
			res.json({Mensaje: 'El usuario solicitado no existe.'});
		}else{
			var u = usuarios[0];
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
			res.json(usuario);
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
	Usuario.find({}, null, {sort:{puntaje: -1}})
	.then(users => {
		if(users.length == 0){
			res.json({Mensaje: 'No hay usuarios'});
		}else{
			let usuarios = [];
			for(u of users){
				var imgBase64 = (u.img.data != undefined) ? 'data:image/jpeg;base64,'+u.img.data.toString('base64') : ''; //Pasar a base64, para usarla directamente en el img src.
				let usuario  = {
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
				usuarios.push(usuario);
			}
			res.json({usuarios :usuarios});
		}
	})
	.catch(err => {
		console.log(err);
		res.json({Error: 'No se pudieron listar los usuarios debido al siguiente error: '+err.message});
	});
}