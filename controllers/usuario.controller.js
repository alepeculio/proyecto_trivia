var mongoose = require('mongoose');
var bcryptjs = require ( 'bcryptjs' );
const Usuario = require('../models/usuario.model');
const multiparty = require('multiparty');
const fs = require('fs');
const ManoaMano = require('../models/mano_a_mano.model');
const mensajes = require( './mensajes' );

const io = require( 'socket.io' )();

let usuarios = [];

io.on( 'connection', ( cliente ) => {
	cliente.on( 'conectado', ( id ) => {
		usuarios.push( {
			socket: cliente,
			id: id
		} );

		console.log( 'Cliente conectado, id = ' + id + ', socket = ' + cliente.id );
	} );

	cliente.on( 'desconectar', () => {
		desconectar( cliente.id );
	});

	cliente.on( 'disconnect', () => {
		desconectar( cliente.id );
	} );
} );

function desconectar( id ) {
	for ( let i = 0; i < usuarios.length; i++ )
		if ( usuarios[i].socket.id === id ) {
			console.log( 'Cliente desconectado, id = ' + usuarios[i].id + ', socket = ' + id );
			usuarios.splice( i, 1 );
			break;
		}
}

	function mensaje( id, titulo, mensaje, puntos = 0 ) {
		for ( let i = 0; i < usuarios.length; i++ )
			if ( usuarios[i].id === id )
				usuarios[i].socket.emit( 'mensaje', {
					titulo: titulo,
					contenido: mensaje,
					puntos: puntos
				} );
		}

		io.listen( 8000 );
>>>>>>> ff3f103268eeee1a40b5400056757ba33253c08f

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
		if ( req.body.tipo === 'Suscripcion' )
			mensajes.mensaje( usuario._id.toString(), '¡Suscripción aceptada!', 'Comienza a responder preguntas' );
		else if ( req.body.tipo === 'SinSuscripcion' )
			mensajes.mensaje( usuario._id.toString(), 'Suscripción finalizada :(', 'Solicita otra suscripción para seguir jugando' );

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

exports.solicitar = ( req, res ) => {
	mensajes.mensaje( req.query.id, 'Solicitud realizada', 'Vea su correo para más información' );
	mensajes.correo( req.query.correo, 'Solicitud realizada', '<b>Para realizar el pago diríjase al laboratorio 1 del TIP</b><p>Hable con uno de los estudiantes del taller de .NET responsables del desarrollo del juego.</p>' );

	Usuario.find( { tipo: 'Admin' } ).exec( ( err, admins ) => {
		for ( let i = 0; i < admins.length; i++ )
			mensajes.correo( admins[i].correo, 'Solicitud de suscripción', '<b>Solicitud de ' + req.query.nombre + '</b>' );
	} );
}

//luis
exports.retos = (req, res) => {
	res.render('retar.ejs');
}

function fechaActual() {
	let hoy = new Date();
	return hoy.getDate() + '-' + ( hoy.getMonth() + 1 ) + '-' + hoy.getFullYear();
}

exports.cancelarReto = (req,res) => {
	let query = {ID_retador: req.body.ID_retador , ID_retado: req.body.ID_retado, ID_ganador:null}; 
	ManoaMano.findOneAndDelete(query , (err,duelo) => {
		if(err) res.send(JSON.stringify({Error: 'No se pudo cancelar el reto'}));

		Usuario.findOneAndUpdate({_id: req.body.ID_retador},{$inc:{mmrestantes:1}},(err,usuario) =>{
			if(err) return res.json({Error: err});

			res.send(JSON.stringify({Mensaje: 'El duelo ha sido cancelado'}));
		});
		
	});
}

exports.listarRetos = (req,res) => {
	ManoaMano.find({ID_retado: req.query.id, ID_ganador: null})
	.exec(function(err,duels){

		if(err) return res.json({Error: err});

		if(duels.length == 0){
			res.json({Mensaje: 'No hay duelos'});
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

//sin uso
exports.listarRetosPropios = (req,res) => {
	ManoaMano.find({ID_retador: req.query.id, ID_ganador: null})
	.exec(function(err,duels){
		res.statusCode = 200;
		res.setHeader('Content-Type','application/json');
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
				if(err) console.log(err);

				let usus = [];

				if(usuarios.length != 0){
					for(u of usuarios){
						usus.push(getUser(u));
					}
				}

				res.json({'duelos':usus});
			});
		}
	});
}

exports.usuariosSinRetar = (req,res) => {
	let retados = [];


	ManoaMano.find({ $or: [ { ID_retador: req.query.id } , { ID_retado: req.query.id } ] , ID_ganador: null  }).exec(function(err,result){
		res.statusCode = 200;
		res.setHeader('Content-Type','application/json');
		if(result.length == 0){
			Usuario.find({ _id: { $not: { $eq: req.query.id } } , tipo: { $not: { $eq: "Admin" } } }).exec((err, users)  => {
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

				Usuario.find(coso,null,{sort:{puntaje: -1}})
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
	let query = {ID_retador: req.body.ID_retador,ID_retado: req.body.ID_retado};

	let update = {cant_correcta_retador: req.body.cant_correctas,tiempo_retador: req.body.tiempo};

	ManoaMano.findOneAndUpdate(query,update, (err,duelo) => {
		if(err) return res.json({Error: err});

		mensajes.mensaje( req.body.ID_retado, 'Duelo', 'El jugador ... te ha retado' );

		return res.json({Mensaje: 'OK'});

	});
}

exports.finalizarDuelo = (req,res) => {
	let correctas = req.body.cant_correctas;
	let tiempo = req.body.tiempo;
	let query = {ID_retador: req.body.ID_retador,ID_retado: req.body.ID_retado, ID_ganador: null};

	ManoaMano.findOne(query).exec(function(err,duelo){
		if(err) return res.json({Error: err});

		if(correctas < duelo.cant_correcta_retador){
			//gano el retador
			Usuario.findOneAndUpdate({_id: req.body.ID_retador}, {$inc: {puntaje: 3}}, (err,usuario) => {
				if(err) return res.json({Error: err});

				let update = {
					ID_ganador: duelo.ID_retador,ID_perdedor: duelo.ID_retado
				};

				ManoaMano.findOneAndUpdate({_id: duelo._id},update,(err,duelo) => {
					if(err) return res.json({Error:err});

					Usuario.findOneAndUpdate({_id: req.body.ID_retado},{$inc: {puntaje: -1}}, (err,usuario2) =>{
						if(err) return res.json({Error:err});

						// Perdio retado
						mensaje( req.body.ID_retador, 'Ganaste', 'Ganaste a ' + usuario2.nombre + ' ' + usuario2.apellido, 3 );
						mensaje( req.body.ID_retado, 'Perdiste', 'Perdiste contra ...' + usuario.nombre + ' ' + usuario.apellido, -1 );

						return res.json("PERDISTE");	
					});	
				});
			});

		}else if(correctas > duelo.cant_correcta_retador){
			//gano el retado
			Usuario.findOneAndUpdate({_id: req.body.ID_retado}, {$inc: {puntaje: 3}}, (err,usuario) => {
				if(err) return res.json({Error: err});

				let update2 = {
					ID_ganador: duelo.ID_retado, ID_perdedor: duelo.ID_retador,
					cant_correcta_retador: correctas, tiempo_retador: tiempo
				};

				ManoaMano.findOneAndUpdate({_id: duelo._id}, update2, (err,duelo) =>{
					if(err) return res.json({Error:err});

					Usuario.findOneAndUpdate({_id: req.body.ID_retador},{$inc:{puntaje: -1}}, (err,usuario2) => {
						if(err) return res.json({Error:err});

						// Gano retado
						mensaje( req.body.ID_retado, 'Ganaste', 'Ganaste a '+ usuario2.nombre + ' ' + usuario2.apellido, 3 );
						mensaje( req.body.ID_retador, 'Perdiste', 'Perdiste contra ' + usuario.nombre + ' ' + usuario.apellido, -1 );

						return res.json("GANASTE");
					});
				});
			});

		}else{

			if(tiempo  < duelo.tiempo_retador){
				//gano el retado
				Usuario.findOneAndUpdate({_id: req.body.ID_retado}, {$inc: {puntaje: 3}}, (err,usuario) => {
					if(err) return res.json({Error: err});

					let update3 = {
						ID_ganador: duelo.ID_retado,ID_perdedor: duelo.ID_retador,
						cant_correcta_retador: correctas, tiempo_retador: tiempo
					};

					ManoaMano.findOneAndUpdate({_id: duelo._id}, update3, (err,duelo) =>{
						if(err) return res.json({Error: err});

						Usuario.findOneAndUpdate({_id: req.body.ID_retador},{$inc:{puntaje: -1}}, (err,usuario2) => {
							if(err) return res.json({Error:err});

						// Gano retado
						mensajes.mensaje( req.body.ID_retado, 'Ganaste', 'Ganaste a '+ usuario2.nombre + ' ' + usuario2.apellido, 3 );
						mensajes.mensaje( req.body.ID_retador, 'Perdiste', 'Perdiste contra ' + usuario.nombre + ' ' + usuario.apellido, -1 );

						return res.json("GANASTE");//por tiempo
					});

					});
				});
			}else if(tiempo > duelo.tiempo_retador){
				//gano el retador
				Usuario.findOneAndUpdate({_id: req.body.ID_retador}, {$inc: {puntaje: 3}}, (err,usuario) => {
					if(err) return res.json({Error: err});

					let update4 = {
						ID_ganador: duelo.ID_retador,ID_perdedor: duelo.ID_retado
					};

					ManoaMano.findOneAndUpdate({_id: duelo._id}, update4, (err,duelo) =>{
						if(err) return res.json({Error: err});


						Usuario.findOneAndUpdate({_id: req.body.ID_retado},{$inc: {puntaje: -1 }}, (err,usuario2) =>{
							if(err) return res.json({Error: err});

							// Perdio el retado
							mensaje( req.body.ID_retador, 'Ganaste', 'Ganaste por tiempo a '+ usuario2.nombre + ' ' + usuario2.apellido, 3 );
							mensaje( req.body.ID_retado, 'Perdiste', 'Perdiste por tiempo contra '+ usuario.nombre + ' ' + usuario.apellido, -1 );

							return res.json("PERDISTE"); //por tiempo
						});
					});
				});
			}else{
					//empataron por tiempo
					let query2 = {ID_retador: req.body.ID_retador,ID_retado: req.body.ID_retado, ID_ganador: null};
					
					ManoaMano.findOneAndDelete(query2, (err,duelo) =>{
						if(err) return res.json({Error:err});

						Usuario.findOneAndUpdate({_id: req.body.ID_retador}, {$inc: {mmrestantes: 1}}, (err,usuario) => {
							if(err) return res.json({Error:err});

							Usuario.findOne({_id: req.body.ID_retado}, (err,usuario2) => {
								// Empataron
								mensaje( req.body.ID_retador, 'Empate', 'Empataste con '+ usuario2.nombre + ' ' + usuario2.apellido);
								mensaje( req.body.ID_retado, 'Empate', 'Empataste con '+  usuario.nombre + ' ' + usuario.apellido);

								return res.json("EMPATE");
							});
						});
					});
				}
			}

		});

}