const User = require("../models/User");
const { validationResult } = require('express-validator');
const { nanoid } = require('nanoid');
const nodemailer = require("nodemailer");
require('dotenv').config()

const registerForm = (req, res) => {
    res.render('register');
};

const loginForm = (req, res) => {
    res.render("login");  
};

const registerUser = async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        // return res.json(errors);
        req.flash("mensajes", errors.array());
        return res.redirect('/auth/register');
    }

    const { userName, email, password } = req.body;
    try {
        let user = await User.findOne({ email: email });
        if(user) throw new Error('¡Usuario ya existe!');
        
        user = new User({ userName, email, password, tokenConfirm: nanoid() });
        await user.save();

        // Enviar correo electronico con la confirmacion de la cuenta
        const transport = nodemailer.createTransport({
            host: "smtp.mailtrap.io",
            port: 2525,
            auth: {
              user: process.env.USEREMAIL,
              pass: process.env.PASSEMAIL,
            },
          });

        await transport.sendMail({
            from: '"Fred Foo 👻" <foo@example.com>', // sender address
            to: user.email, // list of receivers
            subject: "Verifica tu cuenta de correo ✔", // Subject line
            html: `<a href="${
                process.env.PATHHEROKU || "http://localhost:5000"
            }auth/confirmar/${ user.tokenConfirm }">Verifica tu cuenta aquí</a>`, 
        });

        req.flash("mensajes", [
            { msg: "¡Por favor!, revisa tu correo electrónico y valida tu cuenta."},
         ]);
        return res.redirect('/auth/login');
    } catch (error) {
        req.flash("mensajes", [{ msg: error.message }]);
        return res.redirect('/auth/register');
        // return res.json({ error: error.message });
    }
};

const confirmarCuenta = async(req, res) => {
    const { token } = req.params;

    try {

        const user = await User.findOne({ tokenConfirm: token });
       
        if(!user) throw new Error('¡Este usuario no existe!');

        user.cuentaConfirmada = true;
        user.tokenConfirm = null;

        await user.save();

        req.flash("mensajes", [
            { msg: "¡Felicitaciones! Cuenta verificada, puedes iniciar sesión." },
         ]);
        return res.redirect("/auth/login");
        // res.render("login");
    } catch (error) {
        req.flash("mensajes", [{ msg: error.message }]);
        return res.redirect('/auth/login');
       // return res.json({ error: error.message });
    }
};

 const loginUser = async (req, res) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            req.flash("mensajes", errors.array())
            return res.redirect('/auth/login');
        }

     const { email, password } = req.body;
     try {
        const user = await User.findOne({ email });
        if(!user) throw new Error('¡Este email no existe!');
     
        if(!user.cuentaConfirmada) throw new Error('¡Falta confirmar cuenta!');

        if(!(await user.comparePassword(password))) 
            throw new Error('¡Contraseña invalida!');
        
        // me esta creando la sesion de usuario a traves de pass
        req.login(user, function(err) {
            if (err) throw new Error('Error al crear la sesión');
            return res.redirect('/');
        });   
    } catch (error) {
        // console.log(error);
        req.flash("mensajes", [{ msg: error.message }]);
        return res.redirect('/auth/login');
        // return res.send(error.message);
     }
 };

 const cerrarSesion = (req, res) => {
     req.logout()
     return res.redirect('/auth/login');
 }

module.exports = {
    loginForm,
    registerForm,
    registerUser,
    confirmarCuenta,   
    loginUser,
    cerrarSesion,
};