const express = require('express');
const router = express.Router();
const login = require('../controllers/Login/authLogin');
const register = require('../controllers/Register/Register');
const verifyOtp = require('../controllers/verifyOtp');
const { validateRegister } = require('../middlewares/validators');
const { recuperarPassword, cambiarPassword } = require('../controllers/recuperarPassword');
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

//CRUD Politicas esta listo de momento
router.get('/getPoliticas', getPoliticas);
router.post('/add_politica', createPolitica);
router.put('/edit_politica/:id', updatePolitica);
router.delete('/delete_politica/:id', deletePolitica);
router.get('/getCurrentPolitica/', getCurrentPolitica);

//CRUD Terminos
router.get('/getTerminosCondiciones', getTerminosCondiciones);
router.post('/createTerminosCondiciones', createTerminosCondiciones);
router.put('/updateTerminosCondiciones/:id', updateTerminosCondiciones);
router.delete('/deleteTerminosCondiciones/:id', deleteTerminosCondiciones);
router.get('/getCurrentTerminos/', getCurrentTerminos);

//CRUD Deslinde
router.get('/getDeslindesLegales', getDeslindesLegales);
router.post('/createDeslindeLegal', createDeslindeLegal);
router.put('/updateDeslindeLegal/:id', updateDeslindeLegal);
router.delete('/deleteDeslindeLegal/:id', deleteDeslindeLegal);
router.get('/getCurrentDeslindes/', getCurrentDeslindes);

//CRUD enlaces
router.get('/getEnlaces', getEnlaces);
router.post('/createEnlace', createEnlace);
router.put('/updateEnlace/:id', updateEnlace);
router.delete('/deleteEnlace/:id', deleteEnlace);

//CrudEslogan
router.get('/getEslogan', getEslogan);
router.post('/createEslogan', createEslogan);
router.put('/updateEslogan/:id', updateEslogan);
router.delete('/deleteEslogan/:id', deleteEslogan);

//CrudTittle
router.get('/getTitle', getTitle);
router.post('/createTitle', createTitle);
router.put('/updateTitle/:id', updateTitle);
router.delete('/deleteTitle/:id', deleteTitle);

//CrudContact
router.get('/getContactInfo', getContactInfo);
router.post('/upsertContactInfo', upsertContactInfo);
router.delete('/deleteContactInfo/:id', deleteContactInfo);

//CrudLogo
router.get('/getAllLogos', getAllLogos);
router.get('/getLogoActivo', getLogoActivo);
router.put('/updateLogo/:id', updateLogo);
router.post('/uploadLogo', uploadLogo);
router.delete('/deleteLogo/:id', deleteLogo);

//CrudAuditoria
router.post('/createAudit', createAudit);
router.get('/getAuditLogs', getAuditLogs);

module.exports = router;