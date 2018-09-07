var mongoose = require('mongoose');
const Usuario = require('../models/usuario.model');
const multiparty = require('multiparty');
const fs = require('fs');

exports.inicio = (req, res) => {
	res.render('usuarios.ejs');
}

exports.crear = (req, res) => {
	var form = new multiparty.Form(); //Para el manejo de datos de formularios 'multipart/form-data'

	form.parse(req, function(err, fields, files) {
		let usuario = new Usuario ({
			_id: mongoose.Types.ObjectId(),
			correo: fields.correo[0],
			nombre: fields.nombre[0],
			apellido: fields.apellido[0],
			pass: fields.pass[0],
			tipo: fields.tipo[0],
			mmrestantes: fields.mmrestantes[0],
			puntaje: fields.puntaje[0]
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
					res.send('Usuario agregado - con imagen'); //Cambiar mensaje por pagina a la que redirigir.
				})
				.catch((err) => {
					console.log(err);
					res.send('error:'+err.message);
				});

			});
		}else{
			usuario.save()
			.then((u) => {
				res.send('Usuario agregado - sin imagen');
			})
			.catch((err) => {
				console.log(err);
				res.send('error:'+err.message);
			});
		}
	});
}

exports.obtener = (req, res) => { //Retorna un objeto json con los datos del usuario.
	let correo = req.query.correo;

	Usuario.find({correo: correo})
	.then((usuarios) => {
		res.statusCode = 200;
		res.setHeader('Content-Type','application/json');
		if(usuarios.length == 0){
			res.write(JSON.stringify({Mensaje: 'El usuario solicitado no existe.'}))
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
			res.write(JSON.stringify(usuario));
		}
		res.end()
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
			res.send('Hubo un error al actualizar el usuario');
			return;
		}

		res.send('Usuario actualizado correctamente');
	});
}

exports.eliminar = (req, res) => {
	let query = { correo: req.body.correo };

	Usuario.findOneAndDelete(query)
	.then((usuario) => {
		res.send('Usuario eliminado');
	})
	.catch((err) => {
		console.log(err);
		res.send('Hubo un error al borrar el usuario');
	});
}

exports.listar = (req, res) => {
	Usuario.find()
	.then(users => {
		res.statusCode = 200;
		res.setHeader('Content-Type','application/json');
		if(users.length == 0){
			res.write(JSON.stringify({Mensaje: 'No hay usuarios'}));
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
			res.write(JSON.stringify({usuarios :usuarios}));
		}
		res.end();

	})
	.catch(err => {
		console.log(err);
	});
}