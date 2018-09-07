const express = require('express');
const router = express.Router();

// Requiere al controlador
const usuario_controller = require('../controllers/usuario.controller');

router.get('/',usuario_controller.inicio);
router.post('/crear', usuario_controller.crear);
router.get('/obtener',usuario_controller.obtener);
router.get('/listar', usuario_controller.listar);
router.post('/actualizar', usuario_controller.actualizar);
router.post('/eliminar', usuario_controller.eliminar);

module.exports = router;