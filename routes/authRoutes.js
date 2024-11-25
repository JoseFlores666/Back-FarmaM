const express = require('express');
const router = express.Router();
const {authenticate} = require('../middlewares/authMiddleware');
const login = require('../controllers/Login/authLogin');
const register = require('../controllers/Register/Register');
const verifyOtp = require('../controllers/verifyOtp');
const { validateRegister } = require('../middlewares/validators');
const { recuperarPassword, cambiarPassword, verificarToken } = require('../controllers/recuperarPassword');
const { getDeslindesLegales, createDeslindeLegal, updateDeslindeLegal, deleteDeslindeLegal, getCurrentDeslindes } = require('../controllers/Doc-Regulatorio/CrudDeslinde');
const { getPoliticas, createPolitica, updatePolitica, deletePolitica, getCurrentPolitica } = require('../controllers/Doc-Regulatorio/CrudPoliticas');
const { getTerminosCondiciones, createTerminosCondiciones, updateTerminosCondiciones, deleteTerminosCondiciones, getCurrentTerminos } = require('../controllers/Doc-Regulatorio/CrudTerminosYC');
const { getEnlaces, createEnlace, updateEnlace, deleteEnlace } = require('../controllers/Perfil-Empresa/CrudEnlaces');
const { createEslogan, getEslogan, deleteEslogan, updateEslogan } = require('../controllers/Perfil-Empresa/CrudEslogan');
const { getAllLogos, getLogoActivo, deleteLogo, uploadLogo, updateLogo } = require('../controllers/Perfil-Empresa/CrudLogo');
const { getTitle, createTitle, deleteTitle, updateTitle } = require('../controllers/Perfil-Empresa/CrudTittle');
const { getContactInfo, upsertContactInfo, deleteContactInfo } = require('../controllers/Perfil-Empresa/CrudContact');
const { createAudit, getAuditLogs } = require('../controllers/Perfil-Empresa/CrudAuditoria');
const { getUsuariosAll, bloquearUsuario, desbloquearUsuario } = require('../controllers/Monitor-Incidencias/CrudUsuariosBlock');

router.post('/login', login);
router.post('/register', validateRegister, register);

router.post('/verifyOtp', verifyOtp);

// Gestión De Usuarios
router.get('/getUsuariosAll', getUsuariosAll); 
router.put('/bloquearUsuario/:id', bloquearUsuario); 
router.put('/desbloquearUsuario/:id', desbloquearUsuario); 

//recuperacion y cambio de passw
router.post('/recuperar-password', recuperarPassword);
router.post('/cambiar-password', cambiarPassword);
router.post('/verificarToken', verificarToken);

//CRUD Politicas esta listo de momento
router.get('/getPoliticas', getPoliticas);
router.post('/add_politica', authenticate, createPolitica);
router.put('/edit_politica/:id', authenticate, updatePolitica);
router.delete('/delete_politica/:id', authenticate, deletePolitica);
router.get('/getCurrentPolitica/', getCurrentPolitica);

//CRUD Terminos
router.get('/getTerminosCondiciones', getTerminosCondiciones);
router.post('/createTerminosCondiciones', authenticate, createTerminosCondiciones);
router.put('/updateTerminosCondiciones/:id', authenticate, updateTerminosCondiciones);
router.delete('/deleteTerminosCondiciones/:id', authenticate, deleteTerminosCondiciones);
router.get('/getCurrentTerminos/', getCurrentTerminos);

//CRUD Deslinde
router.get('/getDeslindesLegales', getDeslindesLegales);
router.post('/createDeslindeLegal', authenticate, createDeslindeLegal);
router.put('/updateDeslindeLegal/:id', authenticate, updateDeslindeLegal);
router.delete('/deleteDeslindeLegal/:id', authenticate, deleteDeslindeLegal);
router.get('/getCurrentDeslindes/', getCurrentDeslindes);

//CRUD enlaces
router.get('/getEnlaces', getEnlaces);
router.post('/createEnlace', authenticate, createEnlace);
router.put('/updateEnlace/:id', authenticate, updateEnlace);
router.delete('/deleteEnlace/:id', authenticate, deleteEnlace);

//CrudEslogan
router.get('/getEslogan', getEslogan);
router.post('/createEslogan', authenticate, createEslogan);
router.put('/updateEslogan/:id', authenticate, updateEslogan);
router.delete('/deleteEslogan/:id', authenticate, deleteEslogan);

//CrudTittle
router.get('/getTitle', getTitle);
router.post('/createTitle', authenticate, createTitle);
router.put('/updateTitle/:id', authenticate, updateTitle);
router.delete('/deleteTitle/:id', authenticate, deleteTitle);

//CrudContact
router.get('/getContactInfo', getContactInfo);
router.post('/upsertContactInfo', authenticate, upsertContactInfo);
router.delete('/deleteContactInfo/:id', authenticate, deleteContactInfo);

//CrudLogo
router.get('/getAllLogos', getAllLogos);
router.get('/getLogoActivo', getLogoActivo);
router.put('/updateLogo/:id', authenticate, updateLogo);
router.post('/uploadLogo', authenticate, uploadLogo);
router.delete('/deleteLogo/:id', authenticate, deleteLogo);

//CrudAuditoria
router.post('/createAudit', authenticate, createAudit);
router.get('/getAuditLogs', getAuditLogs);

module.exports = router;