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
router.get('/obtenerPreguntas', pregunta_controller.obtener_preguntas);
router.post('/editarPregunta',pregunta_controller.editar_pregunta);
router.post('/eliminarPregunta',pregunta_controller.eliminar_pregunta);
module.exports = router;