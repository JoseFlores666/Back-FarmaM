const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const { login, consultaSesion, cerrarSesion } = require('../controllers/Login/authLogin');
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
const { getEmpresa, updateEmpresa } = require('../controllers/Perfil-Empresa/CrudEmpresa');
const { getContactInfo, upsertContactInfo, deleteContactInfo } = require('../controllers/Perfil-Empresa/CrudContact');
const { createAudit, getAuditLogs } = require('../controllers/Perfil-Empresa/CrudAuditoria');
const { getUsuariosAll, bloquearUsuario, desbloquearUsuario } = require('../controllers/Monitor-Incidencias/CrudUsuariosBlock');
const { getEspecialidades, crearEspecialidad, updateEspecialidad, deleteEspecialidad } = require('../controllers/Servicios/Especialidades')
const { getDoc, createDoc, updateDoc, deleteDoc } = require('../controllers/Doctores/CrudDoc')
const { getCitas, generarCitas, reservarCita, deleteAllCitasByDoctor, deleteCita, createCita, updateCita, getCitasById, cancelarCita } = require('../controllers/Citas/CrudCitas');
const { getHorarios, createHorario, updateHorario, deleteHorario } = require('../controllers/Doctores/CRUDHorarios');
const { createOpinion, updateOpinion, getOpinions, getOpinionById, deleteOpinion, updateReaction } = require('../controllers/CrudOpiniones/Opiniones');
const { getExpediente, getExpedienteById, createExpediente, updateExpediente, deleteExpediente } = require('../controllers/Citas/ExpedienteM');
const { getRecetas, getRecetasById, createRecetas, updateRecetas, deleteRecetas, getMedicamentos } = require('../controllers/Citas/RecetasMedicas');
const { getActuExpe, deleteActuExpe } = require('../controllers/Citas/ActuaExpediente');
const { loginDoc } = require('../controllers/Login/authLoginDoctor');
const { getServicios, crearServicios, updateServicios, deleteServicios } = require('../controllers/Servicios/Servicios');
const { getValores, updateValores, createValor, deleteValor } = require('../controllers/Servicios/Valores');
const { getPerfilbyid, updateperfilbyid } = require('../controllers/Perfil-Empresa/PerfilUsuario');

router.post('/login', login);
router.get('/session', consultaSesion);
router.post('/logout', cerrarSesion);

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



//CrudEmpresa
router.get('/getEmpresa', getEmpresa);
router.put('/updateEmpresa/:id', updateEmpresa);

//CrudPerfilUsuario
router.get('/getPerfilbyid/:id', getPerfilbyid);
router.put('/updateperfilbyid/:id', updateperfilbyid);

//CrudServicios
router.get('/getServicios', getServicios);
router.put('/updateServicios/:id', updateServicios);
router.post('/crearServicios', crearServicios);
router.delete('/deleteServicios/:id', deleteServicios);
//CRUD enlaces
router.get('/getEnlaces', getEnlaces);
router.post('/createEnlace', createEnlace);
router.put('/updateEnlace/:id', updateEnlace);
router.delete('/deleteEnlace/:id', deleteEnlace);

//CrudLogo
router.get('/getAllLogos', getAllLogos);
router.get('/getLogoActivo', getLogoActivo);
router.put('/updateLogo/:id', updateLogo);
router.post('/uploadLogo', uploadLogo);
router.delete('/deleteLogo/:id', deleteLogo);

//CrudServicios corregir el nombre
router.get('/getEspecialidades', getEspecialidades);
router.post('/createEspec', crearEspecialidad)
router.put('/updateEspec/:codespe', updateEspecialidad);
router.delete('/deleteEspec/:codespe', deleteEspecialidad);

//CrudEmpresa
router.get('/getEmpresa', getEmpresa)
router.put('/updateEmpresa/:id', updateEmpresa)

//CrudValores
router.get('/getValores', getValores)
router.post('/createValor', createValor)
router.put('/updateValores/:id',updateValores),
router.delete('/deleteValor/:id',deleteValor)


//CrudAuditoria 
router.post('/createAudit', createAudit);
router.get('/getAuditLogs', getAuditLogs);

//CrudContact
router.get('/getContactInfo', getContactInfo);
router.put('/upsertContactInfo', upsertContactInfo);

//CrudDoc
router.get('/getDoc', getDoc)
router.post('/createDoc', createDoc)
router.delete('/deleteDoc/:id', deleteDoc)
router.put('/updateDoc/:id', updateDoc);
router.post('/loginDoc', loginDoc);

//CrudCitas
router.get('/getCitas', getCitas)
router.get('/getCitasById/:coddoc', getCitasById)
router.put('/cancelarCita', cancelarCita)
router.put('/reservarCita', reservarCita)
router.post('/generarCitas', generarCitas)
router.post('/createCita', createCita)
router.put('/updateCita/:id', updateCita)
router.delete('/deleteCita/:id', deleteCita)
router.delete('/deleteAllCitasByDoctor/:coddoc', deleteAllCitasByDoctor)

//CrudHorario
router.get('/getHorario', getHorarios)
router.post('/createHorario', createHorario)
router.put('/updateHorario', updateHorario)
router.delete('/deleteHorario/:id', deleteHorario)

//CrudOpiniones
router.get('/getOpinionById/:id', getOpinionById)
router.get('/getOpinions', getOpinions)
router.post('/createOpinion', createOpinion)
router.put('/updateOpinion/:id', updateOpinion);
router.delete('/deleteOpinion/:id', deleteOpinion);
router.put('/updateReaction/:id', updateReaction);


//CrudExpediente
router.get('/getExpediente', getExpediente)
router.get('/getExpedienteById/:id', getExpedienteById)
router.post('/createExpediente', createExpediente)
router.put('/updateExpediente/:id', updateExpediente);
router.delete('/deleteExpediente/:id', deleteExpediente);

//CrudRecetas aun no funciona
router.get('/getRecetas', getRecetas)
router.get('/getMedicamentos', getMedicamentos)
router.get('/getRecetasById/:id', getRecetasById)
router.post('/createReceta', createRecetas)
router.put('/updateReceta/:id', updateRecetas);
router.delete('/deleteReceta/:id', deleteRecetas);

//CrudRecetas aun no funciona
router.get('/getActuExpe', getActuExpe)
router.delete('/deleteActuExpe/:id', deleteActuExpe);



module.exports = router;