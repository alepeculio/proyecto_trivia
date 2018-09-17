var fs = require( 'fs' );

var mongoose = require( 'mongoose' );
const PreguntasRespondidas = require( '../models/preguntas_respondidas.model.js' );
const PreguntasDiarias = require( '../models/preguntas_diarias.model.js' );
const Pregunta = require('../models/pregunta.model');
const Categoria = require('../models/categoria.model');

var csv = require( 'csv-express' );

exports.exportar = ( req, res ) => {
	Pregunta.find( {}, ( err, pregs ) => {
		if ( err ) {
			res.send( err );
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
	var lectorLinea = require( 'readline' ).createInterface( {
		input: fs.createReadStream( './preguntas.csv' )
	} );

	lectorLinea.on( 'line', ( linea ) => {
		let campos = linea.split( '&' );

		for (let i = 0; i < campos.length; i++)
			campos[i] = campos[i].trim();

		let respuestas = campos.splice( 2, 4 );

		let pregunta = new Pregunta( {
			_id: new mongoose.Types.ObjectId(),
			pregunta: campos[0],
			respuestas: respuestas,
			categoria: campos[1]
		} );

		pregunta.save();
	} );

	res.send( 'Cargarndo preguntas...' );
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
	PreguntasDiarias.find( { ID_usuario: id_usu, fecha: fechaActual() } ).populate( {
		path: 'ID_pregunta',
		populate: { path: 'categoria' }
	} ).exec( ( err, preguntas ) => {
		if ( err ) {
			error( res, err );
		} else {
			let respuestas = [];

			for ( let i = 0; i < preguntas.length; i++ )
				respuestas.push( {
					categoria: preguntas[i].ID_pregunta.categoria.name,
					posicion: preguntas[i].position
				} );

			res.send( {
				asd: respuestas,
				dsa: preguntas
			} );
		}
	} );
};

exports.generarPreguntaDiaria = ( req, res ) => {
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
									// TODO: No retornar la nueva pregunta (Solo para testing)
									let r = {
										nueva: pregs[p],
										coleccion: pregs
									};
									res.send( r );
								}
							} );
						}
					} );
				}
			} );
		}
	} );
};

function fechaActual() {
	let hoy = new Date();
	return hoy.getDate() + '-' + ( hoy.getMonth() + 1 ) + '-' + hoy.getFullYear();
}

exports.usuarioRespondio = ( req, res ) => {
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
		res.send( 'Error: ' + err.message );
	});
};
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

