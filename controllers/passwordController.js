const User = require('../models/User')
const SibApiV3Sdk = require('sib-api-v3-sdk')

const defaultClient = SibApiV3Sdk.ApiClient.instance

let apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.SENDINBLUE_API_KEY;

exports.recover = function (req, res) {
    let forgotUser = new User(req.body)
    console.log('STFU in password controller')
    forgotUser.recover().then(function (result) {
        console.log('Resolved');
        console.log(result);

        const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi()

        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail()

        const sendSmtpEmailSender = new SibApiV3Sdk.SendSmtpEmailSender()
        sendSmtpEmailSender.email = process.env.FROM_EMAIL
        sendSmtpEmail.sender = sendSmtpEmailSender

        const sendSmtpEmailTo = []
        sendSmtpEmailTo[0] = new SibApiV3Sdk.SendSmtpEmailTo()
        sendSmtpEmailTo[0] = { email: forgotUser.data.email }
        sendSmtpEmail.to = sendSmtpEmailTo
        
        // sendSmtpEmail.subject = "DMC"
        // sendSmtpEmail.textContent = "Trigger"

        sendSmtpEmail.templateId = 1

        console.log(forgotUser.data.username)
        console.log(`http://localhost:3050/validateToken?token=${forgotUser.resetPasswordToken}`)
        sendSmtpEmail.params = {
            "customerName": forgotUser.data.username,
            "link": `http://localhost:3050/validateToken?token=${forgotUser.resetPasswordToken}`
        }

        apiInstance.sendTransacEmail(sendSmtpEmail).then(function (data) {
            console.log('API called successfully. Returned data: ' + data)
            req.flash('message', "Email sent successfully!!!")
            req.session.save(function () {
                res.redirect('/forgotPassword')
            })
        }, function (error) {
            console.error(error)
        })

    }).catch(function (e) {
        console.error(e)
        req.flash('errors', e)
        req.session.save(function () {
            res.redirect('/forgotPassword')
        })
    })
}

exports.validateToken = function (req, res) {
    
    console.log(req.query.token)

    if (req.query.token != null) {
        let resetUser = new User(req.body)
        resetUser.validateToken(req.query.token).then((username) => {
            console.log(username)
            res.render('resetPassword', {
                errors: req.flash(''),
                username: username,
                message: req.flash('')
            })
        }).catch((msg) => {
            console.log(msg)
            res.render('linkexpired')
        })
    } else {
        res.render('accessdenied')
    }
}

exports.resetPassword = function (req, res) {
    
    console.log(req.body)
    
    if (req.body.password === req.body.confirmPassword) {
        let user = new User(req.body)
        user.resetPassword(req.body.username, req.body.password).then((result) => {
            console.log(result)
            res.render('resetPassword', {
                errors: req.flash(''),
                username: req.flash(''),
                message: result
            })
        }).catch((err) => {
            res.render('resetPassword', {
                errors: req.flash(err),
                username: req.flash(''),
                message: req.flash('')
            })
        })
    } else {
        res.render('resetPassword', { 
            errors: req.flash('Password mismatch'), 
            username: req.flash(''),
            message: req.flash('')
        })
    }
}