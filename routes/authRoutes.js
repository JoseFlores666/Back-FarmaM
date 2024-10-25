const express = require('express');
const router = express.Router();
const login = require('../controllers/Login/authLogin');
const register = require('../controllers/Register/Register');
const verifyOtp = require('../controllers/verifyOtp');
const { validateRegister } = require('../middlewares/validators');
const { recuperarPassword, cambiarPassword } = require('../controllers/recuperarPassword');
const { getDeslindes, createDeslinde, updateDeslinde, deleteDeslinde } = require('../controllers/CrudDeslinde');
const { getPoliticas, createPolitica, updatePolitica, deletePolitica, getCurrentPolitica } = require('../controllers/CrudPoliticas');
const { getTerminos, createTerminos, updateTerminos, deleteTerminos } = require('../controllers/CrudTerminosYC');
const { getEnlaces, createEnlace, updateEnlace, deleteEnlace } = require('../controllers/CrudEnlaces');
const { createEslogan, getEslogan, deleteEslogan, updateEslogan } = require('../controllers/CrudEslogan');
const { getLogo, deleteLogo, uploadLogo } = require('../controllers/CrudLogo');
const { getTitle, createTitle, deleteTitle, updateTitle } = require('../controllers/CrudTittle');
const { getContactInfo, upsertContactInfo, deleteContactInfo } = require('../controllers/CrudContact');



router.post('/login', login);
router.post('/register', validateRegister, register);
router.post('/verifyOtp', verifyOtp);

router.post('/recuperar-password', recuperarPassword);
router.post('/cambiar-password', cambiarPassword);

//CRUD Deslinde
router.get('/getDeslindes', getDeslindes);
router.post('/add_deslinde', createDeslinde);
router.put('/edit_deslinde/:id', updateDeslinde);
router.delete('/delete_deslinde/:id', deleteDeslinde);

//CRUD Politicas esta listo de momento
router.get('/getPoliticas', getPoliticas);
router.post('/add_politica', createPolitica);
router.put('/edit_politica/:id', updatePolitica);
router.delete('/delete_politica/:id', deletePolitica);
router.delete('/getCurrentPolitica/:id', getCurrentPolitica);

//CRUD Terminos
router.get('/getTerminos', getTerminos);
router.post('/add_termino', createTerminos);
router.put('/edit_termino/:id', updateTerminos);
router.delete('/delete_termino/:id', deleteTerminos);

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

//CrudLogo
router.get('/getLogo', getLogo);
router.put('/uploadLogo', uploadLogo);
router.delete('/deleteLogo', deleteLogo);

//CrudTittle
router.get('/getTitle', getTitle);
router.post('/createTitle', createTitle);
router.put('/updateTitle/:id', updateTitle); 
router.delete('/deleteTitle/:id', deleteTitle);

//CrudContact
router.get('/contact', getContactInfo);
router.post('/contact', upsertContactInfo);
router.delete('/contact/:id', deleteContactInfo);

module.exports = router;