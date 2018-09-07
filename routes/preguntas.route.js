const express = require( 'express' );
const router = express.Router();

const pregunta_controller = require( '../controllers/pregunta.controller' );

router.get( '/', pregunta_controller.preguntas );
router.post( '/generarPreguntaDiaria', pregunta_controller.generarPreguntaDiaria );
router.post( '/usuarioRespondio', pregunta_controller.usuarioRespondio );

module.exports = router;