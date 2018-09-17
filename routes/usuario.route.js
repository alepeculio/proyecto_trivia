const express = require('express');
const router = express.Router();

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

module.exports = router;