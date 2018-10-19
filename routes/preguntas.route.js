const express = require( 'express' );
const router = express.Router();

const pregunta_controller = require( '../controllers/pregunta.controller' );

router.get( '/exportar', pregunta_controller.exportar );
router.get( '/importar', pregunta_controller.importar );
router.get( '/', pregunta_controller.preguntas );
router.get( '/preguntasDiarias', pregunta_controller.preguntasDiarias );
router.post( '/generarPreguntaDiaria', pregunta_controller.generarPreguntaDiaria );
router.post( '/usuarioRespondio', pregunta_controller.usuarioRespondio );
router.post( '/cambiarEstado', pregunta_controller.cambiarEstado );

router.post('/crearCategoria', pregunta_controller.categoria_create);
router.post('/crearPregunta', pregunta_controller.pregunta_create);
router.get('/nueva', pregunta_controller.pregunta_new);
router.get('/temp', pregunta_controller.temp);
router.post('/generarPreguntasDuelo', pregunta_controller.generarPreguntasDuelo);
router.post('/obtenerPreguntasDuelo', pregunta_controller.obtenerPreguntasDuelo);

module.exports = router;