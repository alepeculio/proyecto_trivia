const express = require( 'express' );
const router = express.Router();

const pregunta_controller = require( '../controllers/pregunta.controller' );

router.get( '/', pregunta_controller.preguntas );
router.post( '/generarPreguntaDiaria', pregunta_controller.generarPreguntaDiaria );
router.post( '/usuarioRespondio', pregunta_controller.usuarioRespondio );

router.post('/crearCategoria', pregunta_controller.categoria_create);
router.post('/crearPregunta', pregunta_controller.pregunta_create);
router.get('/nueva', pregunta_controller.pregunta_new);

module.exports = router;