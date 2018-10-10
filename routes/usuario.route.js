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
router.post('/actualizar', usuario_controller.actualizar);
router.post('/actualizarSuscripcion', usuario_controller.actualizarSuscripcion);
router.post('/eliminar', usuario_controller.eliminar);
router.post('/iniciarSesion', usuario_controller.iniciarSesion);

//luis
router.get('/retos', usuario_controller.retos);
router.post('/retar', usuario_controller.retar);
router.get('/cancelarDuelo', usuario_controller.cancelarDuelo);
router.post('/cancelarReto', usuario_controller.cancelarReto);
router.get('/listarRetos', usuario_controller.listarRetos);
router.get('/listarRetosPropios', usuario_controller.listarRetosPropios);
router.post('/finalizarDuelo', usuario_controller.finalizarDuelo);
router.get('/usuariosSinRetar', usuario_controller.usuariosSinRetar);

router.post( '/authRegistro', AuthController.authRegistro );
router.get( '/authMe', VerifyToken, AuthController.authMe );
router.post( '/authLogin', AuthController.authLogin );

module.exports = router;