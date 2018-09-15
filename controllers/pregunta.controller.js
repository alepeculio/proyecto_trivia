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

exports.generarPreguntaDiaria = ( req, res ) => {
	Pregunta.find().populate( 'categoria' ).exec( ( err, pregs ) => {
		if ( err ) {
			console.log( 'Error: ' + err );
		} else {
			res.send( pregs );
			/*PreguntasRespondidas.find( { ID_usuario: req.body.ID_Usuario }, ( err, pregsResp ) => {
				if ( err ) {
					console.log( 'Error: ' + err );
				} else {
					res.send( pregsResp );
				}
			} );*/
		}
	} );
	/* Categoria.findOne( { name: req.body.categoria }, ( err, cat ) => {
		if ( err ) {
			res.send( 'Error: ' + err.message );
		} else {
			Pregunta.find( { categoria: cat._id }, ( err, pregs ) => {
				if ( err ) {
					res.send( 'Error: ' + err.message );
				} else {
					PreguntasRespondidas.find( { ID_usuario: req.body.ID_Usuario }, ( err, pregsResp ) => {
						if ( err ) {
							res.send( 'Error: ' + err.message );
						} else {
							for ( let i = 0; i < pregs.length; i++ ) {
								for ( let j = 0; j < pregsResp.length; j++ ) {
									if ( pregs[i]._id === pregsResp[j].ID_pregunta ) {
										pregs.splice( i, 1 );
										break;
									}
								}
							}
							let preguntaDiaria = new PreguntasDiarias({
								ID_usuario: req.body.ID_Usuario,
								ID_pregunta: pregs[0]._id,
								position: req.body.posicion
							});
							preguntaDiaria.save().then(( r ) => {
								res.send( {
									r: r,
									pregs: pregs
								} );
							}).catch(( err ) => {
								res.send( 'Error: ' + err.message );
							});
						}
					} );
				}
			} );
		}
	} );*/
};

exports.usuarioRespondio = ( req, res ) => {
	let fecha = new Date();
	fecha.setUTCHours( 0, 0, 0, 0 );

	let respondio = new PreguntasRespondidas({
		ID_usuario: req.body.ID_Usuario,
		ID_pregunta: req.body.ID_Pregunta,
		estado: req.body.estado,
		tiempo: req.body.tiempo,
		fecha: fecha.toISOString()
	});
	respondio.save().then(( r ) => {
		res.send( ' Registro ingresado' );
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

exports.pregunta = function(req,res){
	
};