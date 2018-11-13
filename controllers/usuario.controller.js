var mongoose = require('mongoose');
var bcryptjs = require ( 'bcryptjs' );
const Usuario = require('../models/usuario.model');
const multiparty = require('multiparty');
const fs = require('fs');
const ManoaMano = require('../models/mano_a_mano.model');
const index = require( '../index' );

const PreguntasRespondidas = require( '../models/preguntas_respondidas.model.js' );
const PreguntasDiarias = require( '../models/preguntas_diarias.model.js' );

/*[Ale] ============================================================================================*/
exports.inicio = (req, res) => {
	res.render('usuarios.ejs');
}

exports.registro = (req, res) => {
	crearUsuario(req,res, 'Suscripcion', 3, 0);
}

exports.reset = ( req, res ) => {
	console.log( req.body.correo + ' ' + req.body.id );

	if ( req.body.correo === undefined || req.body.id === undefined )
		res.send( { error: 'envie correo y id' } );
	else {
		Usuario.count( {
			correo: req.body.correo,
			_id: req.body.id,
			tipo: 'Admin'
		}, ( err, cantidad ) => {
			if ( err )
				res.send( { error: err } );
			else if ( cantidad <= 0 ) {
				res.send( { error: 'no autorizado, salí de acá gil !!!' } );
			} else {
				PreguntasRespondidas.remove( {}, ( err, pr ) => {
					PreguntasDiarias.remove( {}, ( err, pd ) => {
						ManoaMano.remove( {}, ( err, mam ) => {
							Usuario.update( { tipo: { $in: [ 'Suscripcion', 'SinSuscripcion' ] } }, {
								puntaje: 0,
								mmrestantes: 3
							}, { multi: true }, ( err, resp ) => {
								if ( err )
									res.send( { error: err } );
								else {
									console.log( 'Datos reseteados' );
									res.send( { mensaje: 'OK' } );
								}
							} );
						} );
					} );
				} );
			}
		} );
	}
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

				index.puntosCambiados( u );
				index.reenviar();

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
		tipo: 'Suscripcion'
	}

	Usuario.findOneAndUpdate(query,update, (err, usuario) => {
		if(err){
			console.log(err);
			res.json({Error: 'No se pudo actualizar el usuario debido al siguiente error: '+err.message});
			return;
		}

		index.puntosCambiados( usuario );
		index.reenviar();

		res.json({Mensaje: 'Usuario actualizado correctamente'});
	});
}
exports.actualizarPass = (req, res) => {
	var hashedPassword = bcryptjs.hashSync( req.body.newpass, 8 );
	let update = {
		pass: hashedPassword
	}
	Usuario.findOne({ correo: req.body.correo }, (err,usuario) =>{
		var passwordIsValid = bcryptjs.compareSync( req.body.anterior, usuario.pass );
		if ( !passwordIsValid ){
			res.json({Mensaje: "no"});
		}else{
			let query ={ correo: req.body.correo };
			Usuario.findOneAndUpdate(query,update, (err, usuario) => {
				if(err){
					console.log(err);
					res.json({Error: 'No se pudo actualizar el usuario debido al siguiente error: '+err.message});
					return;
				}

				res.json({Mensaje: 'si'});
			});

		}

		
	});
}


exports.enviarPass = (req, res) => {

	var caracteres = "abcdefghijkmnpqrtuvwxyzABCDEFGHIJKLMNPQRTUVWXYZ2346789";
	var passTemporal = "";
	for (i=0; i<8; i++) passTemporal += caracteres.charAt(Math.floor(Math.random()*caracteres.length));

		index.correo(req.body.correo,"Contraseña temporal","Ingrese a triviatip con la contraseña temporal y vaya a su perfil para cambiarla. Su Contraseña temporal es: "+passTemporal);
	let query = { correo: req.body.correo };
	var hashedPassword = bcryptjs.hashSync(passTemporal , 8 );
	let update = {
		pass: hashedPassword
	}

	Usuario.findOneAndUpdate(query,update, (err, usuario) => {
		if(err){
			console.log(err);
			res.json({Error: 'No se pudo actualizar la contraseña debido al siguiente error: '+err.message});
			return;
		}
		res.json({Mensaje: 'Contraseña actualizado correctamente'});
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
		if ( req.body.tipo === 'Suscripcion' ){
			index.mensaje( usuario._id.toString(), '¡Suscripción aceptada!', 'Comienza a responder preguntas' );
			index.correo( usuario.correo,'¡Suscripción aceptada!', '<b>Inicia sesión y comienza a responder preguntas!!!</b> <p>Tenemos premios increíbles...</p> \n\n https://triviatip.herokuapp.com/'  );

			usuario.tipo = 'Suscripcion';
			index.puntosCambiados( usuario );
			index.reenviar();

		}else if ( req.body.tipo === 'SinSuscripcion' ) {

			cargarIniciales( true );

			index.mensaje( usuario._id.toString(), 'Suscripción finalizada :(', 'Solicita otra suscripción para seguir jugando' );
		}

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


exports.listarRanking = (req, res) => {
	let cantidad = req.query.cantidad;
	if(cantidad != undefined){
		cantidad = Number(cantidad);
	}

	Usuario.find({ tipo: 'Suscripcion' }, null, {sort:{puntaje: -1}}).limit(cantidad).exec((err, users)  => {
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

function cargarIniciales( reenviar = false ) {
	console.log( "Buscando usuarios" );

	Usuario.find( { tipo: 'Suscripcion' }, null, {
		sort: { puntaje: -1 }
	} ).limit( 10 ).exec( ( err, usuarios ) => {
		if ( err )
			console.log( err );
		else {
			index.llenarRanking( usuarios );

			if ( reenviar )
				index.reenviar( true );
		}
	} );
}

cargarIniciales();

setInterval( () => {
	cargarIniciales();
}, 20000 );

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

exports.solicitar = ( req, res ) => {
	index.mensaje( req.query.id, 'Solicitud realizada', 'Vea su correo para más información' );
	index.correo( req.query.correo, 'Solicitud realizada', '<b>Para realizar el pago diríjase al laboratorio 1 del TIP</b><p>Hable con uno de los estudiantes del taller de .NET responsables del desarrollo del juego.</p>' );

	Usuario.find( { tipo: 'Admin' } ).exec( ( err, admins ) => {
		for ( let i = 0; i < admins.length; i++ )
			index.correo( admins[i].correo, 'Solicitud de suscripción', '<b>Solicitud de ' + req.query.nombre + '</b>' );
	} );

	res.send( 'OK' );
}

//luis
exports.retos = (req, res) => {
	res.render('retar.ejs');
}

function fechaActual() {
	let hoy = getHora();
	return hoy.getUTCDate() + '-' + ( hoy.getUTCMonth() + 1 ) + '-' + hoy.getUTCFullYear();
}

exports.cancelarReto = (req,res) => {
	if(req.body.ID_retador == undefined || req.body.ID_retado == undefined){
		return res.json({Error: 'Faltan parámetros'});
	}

	let query = {ID_retador: req.body.ID_retador , ID_retado: req.body.ID_retado, ID_ganador:null}; 
	ManoaMano.findOneAndDelete(query , (err,duelo) => {
		if(err) return res.json({Error: 'No se pudo cancelar el reto'});

		Usuario.findOneAndUpdate({_id: req.body.ID_retador},{$inc:{mmrestantes:1}},(err,usuario) =>{
			if(err) return res.json({Error: err});

			return res.json({Mensaje: 'El duelo ha sido cancelado'});
		});
		
	});
}

exports.listarRetos = (req,res) => {
	if(req.query.id == undefined){
		return res.json({Error: 'Faltan parámetros'});
	}

	ManoaMano.find({ID_retado: req.query.id, ID_ganador: null, cant_correcta_retador: {$not: {$eq: null}}})
	.exec(function(err,duels){

		if(err) return res.json({Error: err});

		if(duels.length == 0){
			return res.json({Mensaje: 'No hay duelos'});
		}else{
			let coso = new Object();
			coso._id = {};
			coso._id.$in = [];
			for(d of duels){
				coso._id.$in.push(d.ID_retador);
			}
			Usuario.find(coso).exec(function(err, usuarios){
				if(err) return res.json({Error: err});

				let usus = [];

				if(usuarios.length == 0){
					return res.json({Mensaje: 'No hay duelos'});
				}else{
					for(u of usuarios){
						usus.push(getUser(u));	
					}
				}
				return res.json({'duelos':usus});
			});

		}
	});
}

exports.listarRetosPropios = (req,res) => {
	if(req.query.id == undefined){
		return res.json({Error: 'Faltan parámetros'});
	}

	ManoaMano.find({ID_retador: req.query.id, ID_ganador: null})
	.exec(function(err,duels){
		if(err) return res.json({Error: err});

		if(duels.length == 0){
			res.write(JSON.stringify({Mensaje: 'No hay duelos'}));
		}else{
			let coso = new Object();
			coso._id = {};
			coso._id.$in = [];
			for(d of duels){
				coso._id.$in.push(d.ID_retado);
			}

			Usuario.find(coso).exec(function(err, usuarios){
				if(err) {res.json({Error: err});console.log(err);}

				let usus = [];

				if(usuarios.length != 0){
					for(u of usuarios){
						usus.push(getUser(u));
					}
				}

				return res.json({'duelos':usus});
			});
		}
	});
}

exports.usuariosSinRetar = (req,res) => {
	let retados = [];

	if(req.query.id == undefined){
		return res.json({Error: 'Faltan parámetros'});
	}

	ManoaMano.find({ $or: [ { ID_retador: req.query.id } , { ID_retado: req.query.id } ] , ID_ganador: null})
	.exec(function(err,result){

		if(err) return res.json({Error: err});

		if(result.length == 0){
			Usuario.find({ _id: { $not: { $eq: req.query.id } } , tipo: { $not: { $eq: "Admin" } } })
			.exec((err, users)  => {
				if(err) return res.json({Error: 'No se pudieron listar los usuarios debido al siguiente error: '+err.message});
				
				let usuarios = [];
				for(u of users){
					usuarios.push(getUser(u));
				}
				return res.json({usuarios :usuarios});
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
				coso.tipo = {};
				coso.tipo.$nin = [];
				coso.tipo.$nin.push("Admin"); 
				coso._id = {};
				coso._id.$nin = [];
				coso._id.$nin.push(req.query.id);
				let n = retados.length;
				for(let i=0; i < n; i++){
					coso._id.$nin.push(retados[i]);
				}

				Usuario.find(coso,null,{sort:{puntaje: -1}})
				.exec(function(error, usus){ 
					if(error) return res.json({Error:error});
					let usuarios = [];

					for(u of usus){
						usuarios.push(getUser(u));
					}

					return res.json({usuarios: usuarios});
				});
			}
		}

	});
}

exports.comenzarDuelo = (req,res) => {

	if(req.body.ID_retador == undefined || req.body.ID_retado == undefined || req.body.cant_correctas == undefined || req.body.tiempo == undefined){
		return res.json({Error: 'Faltam parámetros'});
	}

	let query = {ID_retador: req.body.ID_retador,ID_retado: req.body.ID_retado, ID_ganador: null};

	let update = {cant_correcta_retador: req.body.cant_correctas,tiempo_retador: req.body.tiempo};
	ManoaMano.findOneAndUpdate(query,update, (err,duelo) => {
		if(err) return res.json({Error: err});

		Usuario.findOne({_id: req.body.ID_retador}, (err,usuario) =>{

			index.mensaje( req.body.ID_retado, 'Duelo', 'El jugador '+ usuario.nombre + ' ' + usuario.apellido +' te ha retado' );

			return res.json({Mensaje: 'OK'});
		});
	});
}

exports.finDuelo = ( correctas, tiempo, retador, retado ) => {

	let query = {ID_retador: retador,ID_retado: retado, ID_ganador: null};

	ManoaMano.findOne(query).exec(function(err,duelo){
		if(correctas < duelo.cant_correcta_retador){
			//gano el retador
			Usuario.findOneAndUpdate({_id: retador}, {$inc: {puntaje: 3}}, (err,usuario) => {
				let update = {
					ID_ganador: duelo.ID_retador,ID_perdedor: duelo.ID_retado
				};

				ManoaMano.findOneAndUpdate({_id: duelo._id},update,(err,duelo) => {
					Usuario.findOneAndUpdate({_id: retado},{$inc: {puntaje: -1}}, (err,usuario2) =>{
						usuario.puntaje += 3;
						usuario2.puntaje += -1;

						index.puntosCambiados( usuario );
						index.puntosCambiados( usuario2 );
						index.reenviar();
						// Perdio retado
						index.mensaje( retador, 'Ganaste', 'Ganaste a ' + usuario2.nombre + ' ' + usuario2.apellido, 3 );
						index.mensaje( retado, 'Perdiste', 'Perdiste contra ' + usuario.nombre + ' ' + usuario.apellido, -1 );
					});	
				});
			});

		}else if(correctas > duelo.cant_correcta_retador){
			//gano el retado
			Usuario.findOneAndUpdate({_id: retado}, {$inc: {puntaje: 3}}, (err,usuario) => {
				let update2 = {
					ID_ganador: duelo.ID_retado, ID_perdedor: duelo.ID_retador,
					cant_correcta_retador: correctas, tiempo_retador: tiempo
				};

				ManoaMano.findOneAndUpdate({_id: duelo._id}, update2, (err,duelo) =>{
					Usuario.findOneAndUpdate({_id: retador},{$inc:{puntaje: -1}}, (err,usuario2) => {
						usuario.puntaje += 3;
						usuario2.puntaje += -1;

						index.puntosCambiados( usuario );
						index.puntosCambiados( usuario2 );
						index.reenviar();
						// Gano retado
						index.mensaje( retado, 'Ganaste', 'Ganaste a '+ usuario2.nombre + ' ' + usuario2.apellido, 3 );
						index.mensaje( retador, 'Perdiste', 'Perdiste contra ' + usuario.nombre + ' ' + usuario.apellido, -1 );
					});
				});
			});

		}else{

			if(tiempo  < duelo.tiempo_retador){
				//gano el retado
				Usuario.findOneAndUpdate({_id: retado}, {$inc: {puntaje: 3}}, (err,usuario) => {
					let update3 = {
						ID_ganador: duelo.ID_retado,ID_perdedor: duelo.ID_retador,
						cant_correcta_retador: correctas, tiempo_retador: tiempo
					};

					ManoaMano.findOneAndUpdate({_id: duelo._id}, update3, (err,duelo) =>{
						Usuario.findOneAndUpdate({_id: retador},{$inc:{puntaje: -1}}, (err,usuario2) => {
							usuario.puntaje += 3;
							usuario2.puntaje += -1;

							index.puntosCambiados( usuario );
							index.puntosCambiados( usuario2 );
							index.reenviar();
						// Gano retado
						index.mensaje( retado, 'Ganaste', 'Ganaste a '+ usuario2.nombre + ' ' + usuario2.apellido, 3 );
						index.mensaje( retador, 'Perdiste', 'Perdiste contra ' + usuario.nombre + ' ' + usuario.apellido, -1 );
					});

					});
				});
			}else if(tiempo > duelo.tiempo_retador){
				//gano el retador
				Usuario.findOneAndUpdate({_id: retador}, {$inc: {puntaje: 3}}, (err,usuario) => {
					let update4 = {
						ID_ganador: duelo.ID_retador,ID_perdedor: duelo.ID_retado
					};

					ManoaMano.findOneAndUpdate({_id: duelo._id}, update4, (err,duelo) =>{
						Usuario.findOneAndUpdate({_id: retado},{$inc: {puntaje: -1 }}, (err,usuario2) =>{
							usuario.puntaje += 3;
							usuario2.puntaje += -1;

							index.puntosCambiados( usuario );
							index.puntosCambiados( usuario2 );
							index.reenviar();
							// Perdio el retado
							index.mensaje( retador, 'Ganaste', 'Ganaste por tiempo a '+ usuario2.nombre + ' ' + usuario2.apellido, 3 );
							index.mensaje( retado, 'Perdiste', 'Perdiste por tiempo contra '+ usuario.nombre + ' ' + usuario.apellido, -1 );
						});
					});
				});
			}else{
					//empataron por tiempo
					let query2 = {ID_retador: retador,ID_retado: retado, ID_ganador: null};
					
					ManoaMano.findOneAndDelete(query2, (err,duelo) =>{
						Usuario.findOneAndUpdate({_id: retador}, {$inc: {mmrestantes: 1}}, (err,usuario) => {
							Usuario.findOne({_id: retado}, (err,usuario2) => {
								// Empataron
								index.mensaje( retador, 'Empate', 'Empataste con '+ usuario2.nombre + ' ' + usuario2.apellido);
								index.mensaje( retado, 'Empate', 'Empataste con '+  usuario.nombre + ' ' + usuario.apellido);
							});
						});
					});
				}
			}

		});
}

exports.finalizarDuelo = (req,res) => {
	res.send( { ok: 'OK' } );
	return;
	
	let correctas = req.body.cant_correctas;
	let tiempo = req.body.tiempo;

	finDuelo( correctas, tiempo, res.body.ID_retador, req.body.ID_retado );
}

function getHora() {
	let hora = new Date();
	hora.setTime( new Date().getTime() - 10800000 );
	return hora;
}

exports.hora = ( req, res ) => {
	res.send( {
		hora: getHora(),
		fecha: fechaActual()
	} );
}