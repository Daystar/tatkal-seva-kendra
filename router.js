const express = require('express')
const router = express.Router()
const userController = require('./controllers/userController')
const passwordController = require('./controllers/passwordController')
const faqController = require('./controllers/footerController')
const errorController = require('./controllers/errorController')
const paymentController = require('./controllers/paymentController')

router.get('/', userController.home)
router.post('/register', userController.register)
router.post('/login', userController.login)
router.post('/logout', userController.logout)
router.get('/forgotPassword', userController.forgotPassword)
router.post('/recover', passwordController.recover)
router.get('/validateToken', passwordController.validateToken)
router.post('/resetPassword', passwordController.resetPassword)
router.get('/pricing', paymentController.showPricing)

// Footer routes
router.get('/faq', faqController.faq)
router.get('/useragreement', faqController.useragreement)
router.get('/privacypolicy', faqController.privacypolicy)
router.get('/cancellationrefundpolicy', faqController.cancellationrefundpolicy)
router.get('/features', faqController.features)

module.exports = router