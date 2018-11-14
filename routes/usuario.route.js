const express = require('express');
const router = express.Router();
var VerifyToken = require( '../auth/VerifyToken' );
var AuthController = require( '../auth/AuthController' );

// Requiere al controlador
const usuario_controller = require('../controllers/usuario.controller');

router.get('/',usuario_controller.inicio);
router.post('/registro', usuario_controller.registro);
router.get('/obtener',usuario_controller.obtener);
router.get('/listar', usuario_controller.listar);
router.get( '/listarRanking', usuario_controller.listarRanking );
router.post('/actualizar', usuario_controller.actualizar);
router.post('/actualizarPass', usuario_controller.actualizarPass);
router.post('/enviarPass', usuario_controller.enviarPass);
router.post('/actualizarSuscripcion', usuario_controller.actualizarSuscripcion);
router.post('/eliminar', usuario_controller.eliminar);
router.post('/iniciarSesion', usuario_controller.iniciarSesion);

//luis
router.get('/retos', usuario_controller.retos);
router.post('/cancelarReto', usuario_controller.cancelarReto);
router.get('/listarRetos', usuario_controller.listarRetos);
router.get('/listarRetosPropios', usuario_controller.listarRetosPropios);
router.post('/comenzarDuelo', usuario_controller.comenzarDuelo);
router.post('/finalizarDuelo', usuario_controller.finalizarDuelo);
router.get('/usuariosSinRetar', usuario_controller.usuariosSinRetar);

router.post( '/authRegistro', AuthController.authRegistro );
router.get( '/authMe', VerifyToken, AuthController.authMe );
router.post( '/authLogin', AuthController.authLogin );

router.get( '/solicitar', usuario_controller.solicitar );
router.get( '/hora', usuario_controller.hora );

router.post( '/reset', usuario_controller.reset );

router.get( '/redimensionar', usuario_controller.redimensionarImagen );


module.exports = router;