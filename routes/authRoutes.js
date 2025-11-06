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
const { getAllLogos, getLogoActivo, deleteLogo, updateLogo, createLogo } = require('../controllers/Perfil-Empresa/CrudLogo');
const { getEmpresa, updateEmpresa } = require('../controllers/Perfil-Empresa/CrudEmpresa');
const { getEmpresaChat, obtContacto, obtServicios, obtenerDoctoresConEspecialidad, obtServiciosDet, obtServiciosDoctor, loginAlexa, obtCitasUsuario } = require('../controllers/chatbot/alexa');
const { getContactInfo, upsertContactInfo } = require('../controllers/Perfil-Empresa/CrudContact');
const { createAudit, getAuditLogs } = require('../controllers/Perfil-Empresa/CrudAuditoria');
const { getUsuariosAll, bloquearUsuario, desbloquearUsuario } = require('../controllers/Monitor-Incidencias/CrudUsuariosBlock');
const { getEspecialidades, crearEspecialidad, updateEspecialidad, deleteEspecialidad } = require('../controllers/Servicios/Especialidades')
const { getDoc, createDoc, updateDoc, deleteDoc, upsertCostosDoctor } = require('../controllers/Doctores/CrudDoc')
const { getCitas, generarCitas, deleteAllCitasByDoctor, deleteCita, createCita, editarDatosCita, reagendarCita, getCitasById, cancelarCita } = require('../controllers/Citas/CrudCitas');
const { getHorarios, createHorario, updateHorario, deleteHorario } = require('../controllers/Doctores/CRUDHorarios');
const { createOpinion, updateOpinion, getOpinions, getOpinionById, deleteOpinion, updateReaction } = require('../controllers/CrudOpiniones/Opiniones');
const { getExpediente, getExpedienteById, createExpediente, updateExpediente, deleteExpediente } = require('../controllers/Citas/ExpedienteM');
const { reservarCita, agregarListaEspera, checkCitaPendiente, getListaEspera, reemplazarCita, deleteListaEspera, cancelarYEliminarCita, getServiciosDeCita } = require('../controllers/Citas/Reservaciones');
const { getRecetas, createRecetas, updateRecetas, deleteRecetas, getRecetasByPacienteId, getMedicamentosByReceta } = require('../controllers/Citas/RecetasMedicas');
const { getActuExpe, deleteActuExpe } = require('../controllers/Citas/ActuaExpediente');
const { loginDoc } = require('../controllers/Login/authLoginDoctor');
const { getHorarioEmpresa, crearHorarioEmpresa, updateHorarioEmpresa, deleteHorarioEmpresa } = require('../controllers/Perfil-Empresa/HorarioEmpresa');
const { getServicios, crearServicios, updateServicios, deleteServicios, asignarServiciosDoctor, getServiciosAsignadosCount, getServiciosDelDoctor, getServicioById } = require('../controllers/Servicios/Servicios');
const { getValores, updateValores, createValor, deleteValor } = require('../controllers/Servicios/Valores');
const { getPerfilbyid, updatePerfilDatos, updatePerfilFoto } = require('../controllers/Perfil-Empresa/PerfilUsuario');
const { sendCorreo } = require('../controllers/Contactanos');
const { generarTokenWear, vincularWear, desvincularWear } = require('../controllers/wearos/wearOsAuth');
const { getNotiById, marcarNotiLeida, marcarTodasNotiLeidas, eliminarNoti, eliminarTodasNoti } = require('../controllers/Notifications/Notification');
const { getAvisosPriv, createAvisoPriv, updateAvisoPriv, deleteAvisoPriv, getCurrentAvisosPriv } = require('../controllers/Doc-Regulatorio/CRUDAvisoPriv');
const { getNoticias, deleteNoticia, updateNoticia, addNoticia } = require('../controllers/Perfil-Empresa/noticias');
const upload = require('../middlewares/upload');
const { consultaCsv } = require('../controllers/Citas/Predict');
const { guardarDescuento, puedeGirar } = require('../controllers/Cliente/ruletaDesc');
const { insertDataWheel, getWheels, getWheelById, updateWheelById, deleteWheelById, getWheelActive, getOfertById, getColorById } = require('../controllers/Cliente/ruleta');
const { getCitasByPacienteId } = require('../controllers/Citas/crudCitasByUserId');

router.post('/login', login);
router.get('/session', consultaSesion);
router.post('/logout', cerrarSesion);

router.post('/register', validateRegister, register);
router.post('/verifyOtp', verifyOtp);

//App Movil



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

// CRUD Aviso de Privacidad
router.get('/getAvisosPriv', getAvisosPriv);
router.post('/createAvisoPriv', createAvisoPriv);
router.put('/updateAvisoPriv/:id', updateAvisoPriv);
router.delete('/deleteAvisoPriv/:id', deleteAvisoPriv);
router.get('/getCurrentAvisosPriv', getCurrentAvisosPriv);

//contacto por correo electronico
router.post('/enviarMensaje', sendCorreo);


//CrudEmpresa horario
router.get('/getHorarioEmpresa', getHorarioEmpresa);
router.post('/crearHorarioEmpresa', crearHorarioEmpresa);
router.put('/updateHorarioEmpresa/:id', updateHorarioEmpresa);
router.delete('/deleteHorarioEmpresa/:id', deleteHorarioEmpresa);

//Crud horario de la empresa
router.get('/getEmpresa', getEmpresa);
router.put('/updateEmpresa/:id', updateEmpresa);

//CrudPerfilUsuario
router.get('/getPerfilbyid/:id', getPerfilbyid);
router.put('/updatePerfilDatos/:id', updatePerfilDatos);
router.put('/updatePerfilFoto/:id', upload.single('foto'), updatePerfilFoto);

//CrudServicios
router.get('/getServicios', getServicios);
router.put('/updateServicios/:id', upload.single('imagen'), updateServicios);
router.post('/crearServicios', upload.single('imagen'), crearServicios);
router.delete('/deleteServicios/:id', deleteServicios);

router.post('/asignarServiciosDoctor/:coddoc', asignarServiciosDoctor);
router.get('/getServiciosAsignadosCount/:coddoc', getServiciosAsignadosCount);
router.get('/getServiciosDelDoctor/:coddoc', getServiciosDelDoctor);
router.get("/getServicios/:id", getServicioById);

//CRUD enlaces
router.get('/getEnlaces', getEnlaces);
router.post('/createEnlace', createEnlace);
router.put('/updateEnlace/:id', updateEnlace);
router.delete('/deleteEnlace/:id', deleteEnlace);

//CrudLogo
router.get('/getAllLogos', getAllLogos);
router.get('/getLogoActivo', getLogoActivo);
router.post('/createLogo', upload.single('imagen'), createLogo);
router.put('/updateLogo/:id', upload.single('imagen'), updateLogo);
router.delete('/deleteLogo/:id', deleteLogo);

//CrudEspecialidad
router.get('/getEspecialidades', getEspecialidades);
router.post('/createEspec', upload.single('imagen'), crearEspecialidad);
router.put('/updateEspec/:codespe', upload.single('imagen'), updateEspecialidad);
router.delete('/deleteEspec/:codespe', deleteEspecialidad);

//CrudEmpresa
router.get('/getEmpresa', getEmpresa)
router.get('/getEmpresaChat', getEmpresaChat)
router.put('/updateEmpresa/:id', updateEmpresa)

//CrudValores
router.get('/getValores', getValores)
router.post('/createValor', upload.single('imagen'), createValor)
router.put('/updateValores/:id', upload.single('imagen'), updateValores),
    router.delete('/deleteValor/:id', deleteValor)


//CrudAuditoria 
router.post('/createAudit', createAudit);
router.get('/getAuditLogs', getAuditLogs);

//CrudContact
router.get('/getContactInfo', getContactInfo);
router.put('/upsertContactInfo', upsertContactInfo);

//CrudDoc
router.get('/getDoc', getDoc)
router.post('/createDoc', upload.single('imagen'), createDoc)
router.put('/updateDoc/:id', upload.single('imagen'), updateDoc);
router.delete('/deleteDoc/:id', deleteDoc)

router.post('/loginDoc', loginDoc);
router.post('/upsertCostosDoctor', upsertCostosDoctor);


//CrudCitasDoc
router.get('/getCitas', getCitas)
router.get('/getCitasById/:coddoc', getCitasById)
router.put('/cancelarCita', cancelarCita)

//CrudCitasUser
router.get('/getCitasByPacienteId/:codpaci', getCitasByPacienteId)


//Crud reservaciones
router.put('/reservarCita', reservarCita)
router.get('/checkCitaPendiente', checkCitaPendiente)
router.post('/agregarListaEspera', agregarListaEspera)
router.get('/getListaEspera/:codcita', getListaEspera)

router.put('/reemplazarCita/:codcita', reemplazarCita)
router.delete('/deleteListaEspera/:id', deleteListaEspera)



router.post('/generarCitas', generarCitas)
router.post('/createCita', createCita)
router.put('/editarDatosCita/:id', editarDatosCita);
router.put('/reagendarCita/:id', reagendarCita);
router.delete('/deleteCita/:id', deleteCita)
router.delete('/deleteAllCitasByDoctor/:coddoc', deleteAllCitasByDoctor)
router.delete('/cancelarYEliminarCita', cancelarYEliminarCita);

//PARTE DEL WEAR OD
router.post('/generar-token', generarTokenWear);
router.post('/vincular', vincularWear);
router.post('/desvincular', desvincularWear);

//Notificaciones
router.get('/getNotiById/:codpaci', getNotiById)
router.put('/notiLeida/:id', marcarNotiLeida);
router.put('/notiLeidas/:codpaci', marcarTodasNotiLeidas);
router.delete('/deleteNoti/:id', eliminarNoti);
router.delete('/deleteNotisAll/:codpaci', eliminarTodasNoti);

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

//CrudRecetas aun no funciona y lo tengo duplicado
router.post('/createReceta', createRecetas)
router.get('/getMedicamentosByReceta/:recetaId', getMedicamentosByReceta)
router.put('/updateReceta/:id', updateRecetas);
router.delete('/deleteReceta/:id', deleteRecetas);
router.get('/getRecetasByPacienteId/:id', getRecetasByPacienteId);
router.get('/getRecetas', getRecetas);
router.get('/getServiciosDeCita/:codcita', getServiciosDeCita);

//crud seccion de noticias
router.get('/getNoticias', getNoticias);
router.post('/addNoticia', upload.single('imagen'), addNoticia);
router.put('/updateNoticia/:id', upload.single('imagen'), updateNoticia);
router.delete('/deleteNoticia/:id', deleteNoticia);

//CrudActualizacion expediente aun no funciona
router.get('/getActuExpe', getActuExpe)
router.delete('/deleteActuExpe/:id', deleteActuExpe);

//Chat Alexa devloper console
router.get('/alexa/contacto', obtContacto);
router.get('/alexa/servicios', obtServicios);
router.get('/alexa/obtServDet', obtServiciosDet);
router.get('/alexa/obtDoc', obtenerDoctoresConEspecialidad);
router.get('/alexa/serviciosDoctor/:coddoc', obtServiciosDoctor)
router.post('/alexa/loginAlexa', loginAlexa);
router.get('/alexa/citas/:usuario', obtCitasUsuario);

//consulta csv PM3
router.get('/consultaCsv', consultaCsv);

//ruleta
router.post('/ruleta/insertDataWheel', upload.single("imagen"), insertDataWheel);
router.put('/ruleta/updateWheelById/:id', upload.single("imagen"), updateWheelById);

router.get('/ruleta/getWheels', getWheels);
router.get('/ruleta/getWheelById/:id', getWheelById);
router.delete('/ruleta/deleteWheelById/:id', deleteWheelById)
router.get('/ruleta/getWheelActive', getWheelActive);
router.get('/ruleta/getOfertById/:id', getOfertById);
router.get('/ruleta/getColorById/:id', getColorById);

router.post('/ruleta/insertDiscountWheel', guardarDescuento);
router.get('/ruleta/puedeGirar/:id_usuario', puedeGirar);

module.exports = router;