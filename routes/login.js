let router = require('express').Router();

const service = require('../services/login');

router
    .post('/register', async (req, res, next)=>{
        let {
            username,
            password
        } = req.body;

        let data = await service.createAccount(username, password);

        res
            .status(200)
            .json(data);
    })

    .post('/iniciarSesion', async (req, res, next)=>{
        let {
            username,
            password
        } = req.body;

        let data = await service.login(username, password);

        res
            .status(200)
            .json(data);
    })

    .get('/getAllUsers', async (req, res, next)=>{
        let data = await service.getAllUsers();

        res
            .status(200)
            .json(data);
    });

module.exports = router;