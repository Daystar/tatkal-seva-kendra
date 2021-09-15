const bcrypt = require('bcryptjs')
const usersCollection = require('../db').db().collection('users')
const validator = require('validator')
const md5 = require('md5')
const { Console } = require('console')
const crypto = require('crypto')

let User = function(data) {
    this.data = data,
    this.errors = [],
    this.resetPasswordToken = "",
    this.resetPasswordExpires = null
}

User.prototype.cleanUp = function() {
    if (typeof(this.data.username) != "string") { this.data.username = "" }
    if (typeof(this.data.email) != "string") { this.data.email = "" }
    if (typeof(this.data.password) != "string") { this.data.password = "" }

    //get rid of any bogus properties
    this.data = {
        username: this.data.username.trim().toLowerCase(),
        email: this.data.email.trim().toLowerCase(),
        password: this.data.password
    }
}

User.prototype.validate = function() {
    return new Promise(async (resolve, reject) => {
        if (this.data.username == "") { this.errors.push("You must provide a username.") }
        if (this.data.username != "" && !validator.isAlphanumeric(this.data.username)) { this.errors.push("Username must only contain letters and numbers.") }
        if (!validator.isEmail(this.data.email)) { this.errors.push("You must provide a valid email address.") }
        if (this.data.password == "") { this.errors.push("You must provide a password.") }
        if (this.data.password.length > 0 && this.data.password.length < 8) { this.errors.push("Password must be atleat 8 characters.") }
        if (this.data.password.length > 50) { this.errors.push("Password cannot exceed 50 characters.") }
        if (this.data.username.length > 0 && this.data.username.length < 3) { this.errors.push("Username must be atleat 3 characters.") }
        if (this.data.username.length > 30) { this.errors.push("Username cannot exceed 30 characters.") }

        // Only if the username is valid then check to see if it's already taken
        if (this.data.username.length > 2 && this.data.username.length < 31 && validator.isAlphanumeric(this.data.username)) {
            let usernameExists = await usersCollection.findOne({ username: this.data.username })
            if (usernameExists) { this.errors.push("That Username is already taken.") }
        }

        // Only if the email is valid then check to see if it's already taken
        if (validator.isEmail(this.data.email)) {
            let emailExists = await usersCollection.findOne({ email: this.data.email })
            if (emailExists) { this.errors.push("The entered email is already being used.") }
        }
        resolve()
    })
}

User.prototype.login = function() {
    return new Promise((resolve, reject) => {
        this.cleanUp()
        usersCollection.findOne({ $or: [ {username: this.data.username}, {email: this.data.username} ] }).then((dbUser) => {
            if (dbUser && bcrypt.compareSync(this.data.password, dbUser.password)) {
                this.data = dbUser
                this.getAvatar()
                resolve(`Welcome ${dbUser.username}!`)
            } else {
                reject("Invalid username / password.")
            }
        }).catch((err) => {
            reject(err)
        })
    })
}

User.prototype.register = function() {
    return new Promise(async (resolve, reject) => {
        //Step #1: Validate user data
        this.cleanUp()
        await this.validate()

        //Step #2: Only if there are no validation errors then save the user data into a database.
        if (!this.errors.length) {
            // hash the password
            let salt = bcrypt.genSaltSync(10)
            this.data.password = bcrypt.hashSync(this.data.password, salt)
            await usersCollection.insertOne(this.data)
            this.getAvatar()
            resolve()
        } else {
            reject(this.errors)
        }
    })
}

User.prototype.recover = function () {
    return new Promise((resolve, reject) => {
        this.cleanUp()

        // validate form data

        console.log('STFU in User')

        usersCollection.findOne({ email: this.data.email }).then((dbUser) => {
            if (dbUser) {
                this.data = dbUser
                console.log(`${dbUser.email} found!`)
                this.generatePasswordReset()
                this.resetTokenEntry().then((result) => {
                    resolve(result)
                }).catch((err) => {
                    reject(err)
                })                
            } else {
                reject("You have entered an invalid email address")
            }
        }).catch((err) => {
            console.log(err)
            reject(err)
        })
    })
}

User.prototype.generatePasswordReset = function () {
    this.resetPasswordToken = crypto.randomBytes(20).toString('hex')
    console.log(this.resetPasswordToken)
    this.resetPasswordExpires = Date.now() + 3600000 //3600000 60000
    console.log(this.resetPasswordExpires)
}

User.prototype.resetTokenEntry = function () {
    return new Promise((resolve, reject) => {
        const myquery = { email: this.data.email }
        usersCollection.updateOne(myquery, {
            $set: {
                resetPasswordToken: this.resetPasswordToken,
                resetPasswordExpires: this.resetPasswordExpires
            }
        }).then((updatedUser) => {
            resolve(`Token added successfully for ${updatedUser}`)
        }).catch((err) => {
            console.log(err)
            reject(err)
        })
    })
}

User.prototype.validateToken = function (token) {
    return new Promise((resolve, reject) => {
        
        console.log(token)

        usersCollection.findOne({ resetPasswordToken: { $exists: true }, resetPasswordToken: { $eq: token } }).then((dbUser) => {
            // console.log(dbUser)
            // console.log(dbUser.resetPasswordToken)
            // console.log(Date.now())
            // console.log(dbUser.resetPasswordExpires)
            // console.log(Date.now() - dbUser.resetPasswordExpires)

            if (dbUser && (Date.now() - dbUser.resetPasswordExpires <= 0)) {
                resolve(`${dbUser.username}`)
            } else {
                reject(`Link expired. Please request a new Password reset link`)
            }
        }).catch((err) => {
            reject(err)
        })
    })
}

User.prototype.resetPassword = function (username, password) {
    return new Promise((resolve, reject) => {

        usersCollection.findOne({ username: username }).then((dbUser) => {
            if (dbUser && (Date.now() - dbUser.resetPasswordExpires <= 0)) {

                this.updatePassword(dbUser, password).then((result) => {
                    console.log(result)
                    console.log(dbUser.username)
                    resolve(`${result} for ${dbUser.username}. Login with your new password.`)
                }).catch((err) => {
                    reject(err)
                })
            } else {
                reject(`Link expired. Please request a new Password reset link`)
            }
        }).catch((err) => {
            reject(err)
        })
    })
}

User.prototype.updatePassword = function (dbUser, updatedPassword) {
    return new Promise((resolve, reject) => {

        let salt = bcrypt.genSaltSync(10)
        let newPassword = bcrypt.hashSync(updatedPassword, salt)

        const myquery = { email: dbUser.email }
        usersCollection.updateOne(myquery, {
            $set: {
                password: newPassword,
                resetPasswordToken: undefined,
                resetPasswordExpires: undefined
            }
        }).then((updatedUser) => {
            resolve(`Password updated successfully`)
        }).catch((err) => {
            reject(err)
        })
    })
}

User.prototype.getAvatar = function() {
    this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`
}

module.exports = User