var mongoose = require('mongoose');
var bcryptjs = require ( 'bcryptjs' );
const Usuario = require('../models/usuario.model');
const multiparty = require('multiparty');
const fs = require('fs');
const ManoaMano = require('../models/mano_a_mano.model');

/*[Ale] ============================================================================================*/
exports.inicio = (req, res) => {
	res.render('usuarios.ejs');
}

exports.registro = (req, res) => {
	crearUsuario(req,res, 'SinSuscripcion', 3, 0);
}

function crearUsuario(req, res, tipo, mmrestantes, puntaje){
	var form = new multiparty.Form(); //Para el manejo de datos de formularios 'multipart/form-data'

	form.parse(req, function(err, fields, files) {
		var hashedPassword = bcryptjs.hashSync( fields.pass[0], 8 );

		let usuario = new Usuario ({
			_id: mongoose.Types.ObjectId(),
			correo: fields.correo[0],
			nombre: fields.nombre[0],
			apellido: fields.apellido[0],
			pass: hashedPassword,
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
		pass: bcryptjs.hashSync( req.body.pass, 8 ),
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

/*[FIN Ale] ========================================================================================*/

//luis
exports.retos = (req,res) => {
	res.render('mano.ejs');
}

exports.retar = (req,res) => {
	//falta terminar
	let mano_a_mano = new ManoaMano({
		_id: new mongoose.Types.ObjectId(),
		ID_retador: req.body.ID_retador,
		ID_retado: req.body.ID_retado,
		ID_ganador: null,
		ID_perdedor: null,
		cant_correcta_retador: "",
		tiempo_retador: null
	});
	mano_a_mano.save().then(( r ) => {
		res.send( ' Usuario retado' );
	}).catch (( err ) => {
		res.send( 'Error: ' + err.message );
	});
}

exports.cancelarReto = (req,res) => {
	ManoaMano.findOneAndDelete(req.body.ID_duelo, (err, duelo) =>{
		if(err) res.send('Error: '+ err.message);
		res.send('Duelo cancelado');
	});
}

exports.cancelarDuelo = (req,res) => {
	res.render('cancelar_reto.ejs');
}

exports.listarRetos = (req,res) => {
	ManoaMano.find({ID_retado: req.query.id}, null, )
	.then(duels => {
		res.statusCode = 200;
		res.setHeader('Content-Type','application/json');
		if(duels.length == 0){
			res.write(JSON.stringify({Mensaje: 'No hay duelos'}));
		}else{
			let duelos = [];
			for(d of duels){
				let duelo  = {
					id:d._id,
					ID_retador: d.ID_retador,
					ID_retado: d.ID_retado,
					ID_ganador: d.ID_ganador,
					ID_perdedor: d.ID_perdedor,
					cant_correcta_retador: d.cant_correcta_retador,
					tiempo_retador: d.tiempo_retador
				}
				duelos.push(duelo);
			}
			res.write(JSON.stringify({duelos :duelos}));
		}
		res.end();

	})
	.catch(err => {
		console.log(err);
	});
}

exports.listarRetosPropios = (req,res) => {
	ManoaMano.find({ID_retador: req.query.id}, null, )
	.then(duels => {
		res.statusCode = 200;
		res.setHeader('Content-Type','application/json');
		if(duels.length == 0){
			res.write(JSON.stringify({Mensaje: 'No hay duelos'}));
		}else{
			let duelos = [];
			for(d of duels){
				let duelo  = {
					id:d._id,
					ID_retador: d.ID_retador,
					ID_retado: d.ID_retado,
					ID_ganador: d.ID_ganador,
					ID_perdedor: d.ID_perdedor,
					cant_correcta_retador: d.cant_correcta_retador,
					tiempo_retador: d.tiempo_retador
				}
				duelos.push(duelo);
			}
			res.write(JSON.stringify({duelos :duelos}));
		}
		res.end();

	})
	.catch(err => {
		console.log(err);
	});
}

exports.usuariosSinRetar = (req,res) => {
	let retados = [];

	ManoaMano.find({ $or: [ { ID_retador: req.query.id } , { ID_retado: req.query.id } ] })
	.exec(function(err,result){
		res.statusCode = 200;
		res.setHeader('Content-Type','application/json');
		if(result.length == 0){
			Usuario.find({ _id: { $not: { $eq: req.query.id } } }).exec((err, users)  => {
				if(err){
					console.log(err);
					res.json({Error: 'No se pudieron listar los usuarios debido al siguiente error: '+err.message});
				}else{
					let usuarios = [];
					for(u of users){
						usuarios.push(getUser(u));
					}
					res.json({usuarios :usuarios});
				}
			});

		}else{
			
			for(r of result){
				if(r.ID_retador == req.query.id){
					retados.push(r.ID_retado);
				}else{
					retados.push(r.ID_retador);
				}
			}

			if(retados.length != 0){
				let coso = new Object();
				coso._id = {};
				coso._id.$nin = [];
				coso._id.$nin.push(req.query.id);
				let n = retados.length;
				for(let i=0; i < n; i++){
					coso._id.$nin.push(retados[i]);
			}
	
			Usuario.find(coso)
			.exec(function(error, usus){ 
				if(error) console.log(error);
				let usuarios = [];
				for(u of usus){
					usuarios.push(getUser(u));
				}
				res.json({usuarios: usuarios});
			});
		}
	}

});
}

exports.comenzarDuelo = (req,res) => {

}

exports.finalizarDuelo = (req,res) => {
/* 
ManoMano
_id:
ID_retador
ID_retado
ID_ganador
ID_perdedor
cant_correctar_retador
tiempo_retador
*/

}
