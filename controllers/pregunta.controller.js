var fs = require( 'fs' );
var path = require('path');

var mongoose = require( 'mongoose' );
const PreguntasRespondidas = require( '../models/preguntas_respondidas.model.js' );
const PreguntasDiarias = require( '../models/preguntas_diarias.model.js' );
const ManoaMano = require('../models/mano_a_mano.model');
const Pregunta = require('../models/pregunta.model');
const Usuario = require('../models/usuario.model');
const Categoria = require('../models/categoria.model');
const index = require( '../index' );

var csv = require( 'csv-express' );

const aumentoPorPregDiaria = 1;

exports.logs = ( req, res ) => {
	if ( fs.existsSync( path.resolve( __dirname + '/../logs.txt' ) ) )
		res.sendFile( path.resolve( __dirname + '/../logs.txt' ) );
	else
		res.send( 'No hay logs en ' + path.resolve( __dirname + '/../logs.txt' ) );
}

exports.exportar = ( req, res ) => {
	Pregunta.find( {}, ( err, pregs ) => {
		if ( err ) {
			res.send( 'Error' );
		} else {
			let csv = '';
			
			pregs.map( p => {
				csv += p.pregunta + '&' + p.categoria + '&' + p.respuestas + '\n';
			} );

			res.statusCode = 200;
			res.setHeader( 'Content-Type', 'text/csv' );
			res.setHeader( 'Content-Disposition', 'attachment; filename=preguntas.csv' );
			res.send( csv );
		}
	} );
};

exports.importar = ( req, res ) => {
	Categoria.remove( {}, () => {
		Pregunta.remove( {}, () => {
			Categoria.insertMany( [
				{ _id: new mongoose.Types.ObjectId(), name: "Historia"},
				{ _id: new mongoose.Types.ObjectId(), name: "Geografía"},
				{ _id: new mongoose.Types.ObjectId(), name: "Deportes"},
				{ _id: new mongoose.Types.ObjectId(), name: "Ciencia y Tecnología"},
				{ _id: new mongoose.Types.ObjectId(), name: "Arte y Literatura"},
				{ _id: new mongoose.Types.ObjectId(), name: "Entretenimiento"},
				], ( err, data ) => {
					if ( err )
						return res.send( 'Error' );	

					require( 'readline' ).createInterface( {
						input: fs.createReadStream( './preguntas/preguntas.csv' )
					} ).on( 'line', ( linea ) => {
						let campos = linea.split( ',' );

						let catId = "";
						for ( let i = 0; i < data.length; i++ )
							if ( data[i].name === campos[1] ) {
								catId = data[i]._id;
								break;
							}

							if ( catId === "" )
								return;

							let respuestas = campos.splice( 2, 4 );
							for ( let i = 0; i < respuestas.length; i++ )
								if ( respuestas[i].includes( '#' ) ) {
									let temp = respuestas[0];
									respuestas[0] = respuestas[i];
									respuestas[i] = temp;
								}

								respuestas[0] = respuestas[0].split( "#" )[1];

								let pregunta = new Pregunta( {
									_id: new mongoose.Types.ObjectId(),
									pregunta: campos[0],
									respuestas: respuestas,
									categoria: catId
								} );

								pregunta.save();
							} );
				} );
			res.send( 'Cargando preguntas...' );
		} );
	} );
};

exports.temp = ( req, res ) => {
	require( 'fs' ).readFile( './preguntas/preguntas.csv', 'utf8', ( err, data ) => {
		let lineas = data.toString().split( '\n' );

		let resp = "";
		for ( let i = 0; i < lineas.length; i++ ) {
			if ( lineas[i].split( "," ).length == 6 )
				resp += lineas[i] + "<br>";
		}

		res.send( resp );
	} );
};

exports.preguntas = ( req, res ) => {
	res.render( 'preguntas.ejs' );
};

exports.preguntasDiarias = ( req, res ) => {
	let id_usu = req.query.ID_Usuario;

	if ( id_usu === undefined ) {
		error( res, 'Faltan parametros' );
		return;
	}

	// Buscar las preguntas diarias del usuario en la fecha actual
	PreguntasDiarias.find( { ID_usuario: id_usu, fecha: fechaActual() } )
	.sort( 'position' ).exec( ( err, diarias ) => {
		if ( err ) {
			error( res, err );
		} else {
			// Obtener las id de las preguntas diarias de hoy
			let ids = [];
			for ( let i = 0; i < diarias.length; i++ ){
				if ( diarias[i].ID_pregunta != null ) {
					ids.push( diarias[i].ID_pregunta._id );
				}
			}

			// Buscar si fueron respondidas por ese usuario
			PreguntasRespondidas.find( { ID_usuario: id_usu, ID_pregunta: { $in: ids } }, ( err, respondidas ) => {
				if ( err ) {
					error( res, err );
				} else {
					// Se va a devolver una lista con la posicion de la pregunta diaria y su estado
					let resultado = [];

					// Recorremos cada pregunta diaria
					for ( let i = 0; i < diarias.length; i++ ) {
						// Colocamos el estado inicial como 'Respondiendo...' por si no la encontramos en la lista de ya respondidas
						let estado = 'Respondiendo...';
						
						// Recorremos las respondidas
						for ( let j = 0; j < respondidas.length; j++ )
							// Si encontramos esa pregunta entre las respondidas
							if ( diarias[i].ID_pregunta._id.equals( respondidas[j].ID_pregunta ) ) {
								// Guardamos su estado
								estado = respondidas[j].estado;
								// La quitamos de la lista para no recorrer tanto la siguiente vez
								respondidas.splice( j, 1 );
								break;
							}

						// Se agrega el resultado
						resultado.push( {
							posicion: diarias[i].position,
							estado: estado
						} );
					}

					res.send( resultado );
				}
			} );
		}
	} );
};

exports.generarPreguntaDiaria = ( req, res ) => {
	index.escribirLog( 'pregunta.generarPreguntaDiaria', 'ID_Usuario: ' + req.body.ID_Usuario + ', categoria: ' + req.body.categoria + ', position: ' + req.body.posicion );
		
	let id_usu = req.body.ID_Usuario;
	let cat = req.body.categoria;
	let position = req.body.posicion;

	if ( id_usu === undefined || cat === undefined || position === undefined ) {
		error( res, 'Faltan parametros' );
		return;
	}

	// Obtener todas las preguntas junto con sus categorias
	Pregunta.find( {} ).populate( 'categoria' ).exec( ( err, pregs ) => {
		if ( err ) {
			error( res, err );
		} else {

			// Eliminar las preguntas que no sean de la categoria dada
			for ( let i = pregs.length - 1; i >= 0; i-- )
				if ( pregs[i].categoria.name !== cat )
					pregs.splice( i, 1 );

			// Obtener todas las preguntas respondidas por ese usuario
			PreguntasRespondidas.find( { ID_usuario: id_usu }, ( err, pregsResp ) => {
				if ( err ) {
					error( res, err );
				} else {
					// Eliminar las preguntas que ya fueron respondidas por ese usaurio
					for ( let i = pregs.length - 1; i >= 0; i-- )
						for ( let j = pregsResp.length - 1; j >= 0; j-- )
							if ( pregs[i]._id.equals( pregsResp[j].ID_pregunta ) ) {
								pregs.splice( i, 1 );
								break;
							}

					// Obtener todas las preguntas diarias del usuario
					PreguntasDiarias.find( { ID_usuario: id_usu }, ( err, pregsDiarias ) => {
						if ( err ) {
							error( res, err );
						} else {
							// Eliminar las preguntas que estan en diarias
							for ( let i = pregs.length - 1; i >= 0; i-- )
								for ( let j = pregsDiarias.length - 1; j >= 0; j-- )
									if ( pregs[i]._id.equals( pregsDiarias[j].ID_pregunta ) ) {
										pregs.splice( i, 1 );
										break;
									}

									let query = {$or:[{ID_retador: req.body.ID_retador},{ID_retado: req.body.ID_retador},{ID_retador: req.body.ID_retado},{ID_retado: req.body.ID_retado}]};

									ManoaMano.find(query , (err,duelos) => {
										if(err) return res.json({Error:err});
										console.log(duelos.length);
										for(let i = pregs.length - 1; i >= 0; i--)
											for(let j = duelos.length - 1; j >=0; j--)
												if(pregs[i]._id.equals(duelos[j].preguntas[0]) || pregs[i]._id.equals(duelos[j].preguntas[1]) || pregs[i]._id.equals(duelos[j].preguntas[2])){
													pregs.splice(i, 1);
													continue;
												}

												
												
							// Seleccionar una posicion aleatoria
							let p = Math.floor( Math.random() * pregs.length );

							// Crear la pregunta ( No va a haber sido respondida por el usuario ni va a estar en sus preguntas diarias )
							let nuevaDiaria = PreguntasDiarias( {
								ID_usuario: id_usu,
								ID_pregunta: pregs[p]._id,
								position: position,
								fecha: fechaActual()
							} );

							// Guardar y retornar
							nuevaDiaria.save( ( err ) => {
								if ( err ) {
									error( res, err );
								} else {
									res.send( pregs[p] );
								}
							} );

							});
						}					
					} );
				}
			} );
		}
	} );
};

function fechaActual() {
	let hoy = getHora();
	return hoy.getUTCDate() + '-' + ( hoy.getUTCMonth() + 1 ) + '-' + hoy.getUTCFullYear();
}

exports.usuarioRespondio = ( req, res ) => {
	index.escribirLog( 'pregunta.usuarioRespondio', 'ID_usuario: ' + req.body.ID_Usuario + ', ID_pregunta: ' + req.body.ID_Pregunta + ', estado: ' + req.body.estado + ', tiempo: ' + req.body.tiempo );
	
	let respondio = new PreguntasRespondidas({
		ID_usuario: req.body.ID_Usuario,
		ID_pregunta: req.body.ID_Pregunta,
		estado: req.body.estado,
		tiempo: req.body.tiempo,
		fecha: fechaActual()
	});

	respondio.save().then(( r ) => {
		res.send( {
			mensaje: 'Correcto'
		} );
	}).catch (( err ) => {
		res.send( 'Error' );
	});
};
exports.cambiarEstado = (req,res)=>{
	index.escribirLog( 'pregunta.cambiarEstado', 'ID_usuario: ' + req.body.ID_Usuario + ', ID_pregunta: ' + req.body.ID_Pregunta + ', estado: ' + req.body.estado + ', tiempo: ' + req.body.tiempo );

	let query = { ID_pregunta: req.body.ID_Pregunta , ID_usuario: req.body.ID_Usuario, estado: 'NoRespondio' };

	let update = {
		estado: req.body.estado,
		tiempo: req.body.tiempo
	}
	PreguntasRespondidas.findOneAndUpdate(query,update, (err, usuario) => {
		if(err){
			console.log(err);
			res.json({Error: 'Error'});
			return;
		}

		if ( update.estado === "Correcta" ) {
			Usuario.update( { _id: usuario.ID_usuario }, { $inc: { puntaje: aumentoPorPregDiaria } }, ( err, usuario2 ) => {
				if ( err )
					res.json( { Error: 'Error' } );
				else  {

					Usuario.findOne( { _id: req.body.ID_Usuario } ).exec( ( err, usu ) => {
						if ( err )
							res.json( { Error: 'Error' } );

						index.puntosCambiados( usu );
						index.reenviar();

						res.json( { Mensaje: 'Correcto' } );
					} );
				}
			} );
		} else
		res.json({Mensaje: 'Correcto'});
	});
}

exports.categoria_create = function(req,res){
	var categoria = new Categoria({
		_id: new mongoose.Types.ObjectId(),
		name: req.body.name

	});

	categoria.save(function(err){
		if(err){return console.log(err);}
		res.send('Categoria creada')
			//res.render('respuesta.ejs',{producto: product,marca:brand})
		})

};
exports.pregunta_create = function(req,res){

	Categoria.findOne({name: req.body.categoria} , function(err, data){
		if(err){
			console.log(err);
		};
		if(!data){
			res.send('La categoria no existe')
		}else{
			var respuestas = [req.body.correcta,req.body.primera,req.body.segunda,req.body.tercera];
			var pregunta = new Pregunta({
				_id: new mongoose.Types.ObjectId(),
				pregunta: req.body.pregunta ,
				respuestas: respuestas,
				categoria: data._id,

			});
			pregunta.save(function(err){
				if(err){return console.log(err);}
				res.send('Pregunta creado ok')
			//res.render('respuesta.ejs',{producto: product,marca: data })
		})
		}

		
	});

};
exports.pregunta_new = function(req,res){
	res.sendFile('/views/test.html',{root: '.'})
};

function error(res, err){
	console.log(err.message);
	res.json({Error: 'Error'});
}

exports.obtener_preguntas = (req, res) => {
	let cantidad = req.query.cantidad;
	let busqueda = req.query.busqueda;

	if(cantidad != undefined){
		cantidad = Number(cantidad);
	}

	if(busqueda == undefined){
		busqueda = "";
	}

	Pregunta.find({ pregunta: {'$regex': busqueda} }).populate({
		path: 'categoria'
	}).limit(cantidad).exec(( err, preguntas ) => {
		if(err){
			console.log(err);
			res.json({Error: 'Error'});
			return;
		}

		if(preguntas.length == 0){
			res.json({Mensaje: 'No hay preguntas'});
		}else{
			res.json({Preguntas :preguntas});
		}
	});
}

exports.editar_pregunta = (req, res) => {
	let query = { 
		_id: req.body.id,
	};

	let update = {
		pregunta: req.body.pregunta,
		respuestas: [
		req.body.correcta, 
		req.body.incorrecta1, 
		req.body.incorrecta2, 
		req.body.incorrecta3
		],
		categoria: req.body.categoria,
	}

	Pregunta.findOneAndUpdate(query,update, (err, pregunta) => {
		if(err){
			console.log(err);
			res.json({Error: 'Error'});
			return;
		}
		res.json({Mensaje: 'Pregunta actualizada correctamente'});
	});
}

exports.eliminar_pregunta = (req, res) => {
	let query = { _id: req.body.id };

	Pregunta.findOneAndDelete(query)
	.then(pregunta => {
		res.json({Mensaje: 'Pregunta eliminada'});
	})
	.catch(err => {
		console.log(err);
		res.json({Error: 'Error'});
	});
}

exports.generarPreguntasDuelo = function(req, res){
	index.escribirLog( 'pregunta.generarPreguntasDuelo', 'ID_retador: ' + req.body.ID_retador + ', ID_retado: ' + req.body.ID_retado );

	Usuario.findOne({_id: req.body.ID_retador}, (err,user) => {
		if(err) return res.json({Error:'Error'});

		if(user.mmrestantes > 0){

			let query = {$or:[{ID_usuario:req.body.ID_retador},{ID_usuario:req.body.ID_retado}]};

			let coso = new Object();

			coso._id = {};

			coso._id.$nin = [];


			PreguntasRespondidas.find(query).exec(function(err,respondidas){

				if(err) return res.json({Error: 'Error'});

				if(respondidas.length !== 0){
					let n = respondidas.length;
					for(let i=0; i < n; i++){
						coso._id.$nin.push(respondidas[i]._id);
					}
				}

				let query2 = {$or:[{ID_retador: req.body.ID_retador},{ID_retado: req.body.ID_retador},{ID_retador: req.body.ID_retado},{ID_retado: req.body.ID_retado}]};

				ManoaMano.find(query2).exec(function(err,duelos){
					if(err) return res.json({Error:'Error'});

					if(duelos.length !== 0){
						let j = duelos.length;
						for(let i=0;i<j;i++){
							coso._id.$nin.push(duelos[i].preguntas[0]);
							coso._id.$nin.push(duelos[i].preguntas[1]);
							coso._id.$nin.push(duelos[i].preguntas[2]);
						}

					}


					Pregunta.find(coso).exec(function(err,preguntas){

						if(err) return res.json({Error: 'Error'});

						let uno  = Math.floor( Math.random() * preguntas.length );

						let dos = Math.floor( Math.random() * preguntas.length );

						let tres = Math.floor( Math.random() * preguntas.length );

						let mano_a_mano = new ManoaMano({
							_id: new mongoose.Types.ObjectId(),
							ID_retador: req.body.ID_retador,
							ID_retado: req.body.ID_retado,
							ID_ganador: null,
							ID_perdedor: null,
							cant_correcta_retador: 0,
							tiempo_retador: 46,
							fecha: fechaActual(),
							preguntas: [preguntas[uno]._id,preguntas[dos]._id,preguntas[tres]._id]
						});

						mano_a_mano.save( (err) => {
							if(err) return res.json({Error: 'Error'});

							Usuario.findOneAndUpdate({_id: req.body.ID_retador},{$inc: {mmrestantes: -1}}, (err,usuario) =>{
								if(err) return res.json({Error:'Error'});

								let resultado = [];
								resultado.push(preguntas[uno]);
								resultado.push(preguntas[dos]);
								resultado.push(preguntas[tres]);
								return res.send(resultado);
							});		
						});
					});
				});

			});

		}else{
			index.mensaje(user._id.toString(), 'Mensaje', 'Excediste el límite de duelos por día,vuelve a intentarlo mañana!', );
			return res.json({Mensaje: 'Excediste el límite'});
		}
	});

	
}

exports.obtenerPreguntasDuelo = function(req,res){
	index.escribirLog( 'pregunta.obtenerPreguntasDuelo', 'ID_retador: ' + req.body.ID_retador + ', ID_retado: ' + req.body.ID_retado );

	let query = {ID_retador: req.body.ID_retador, ID_retado: req.body.ID_retado, ID_ganador: null};
	

	ManoaMano.findOne(query).exec(function(err,duelo){
		if(err) return res.json({Error: 'Error'});

		let q = new Object();
		q.$or = [];
		q.$or.push({_id:duelo.preguntas[2]});
		q.$or.push({_id:duelo.preguntas[1]});
		q.$or.push({_id:duelo.preguntas[0]});

		Pregunta.find(q).exec(function(err,preguntas){
			if(err) return res.json({Error: 'Error'});

			return res.send(preguntas);
		});

	});
}

function getHora() {
	let hora = new Date();
	hora.setTime( new Date().getTime() - 10800000 );
	return hora;
}