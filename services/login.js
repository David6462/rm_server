const fetch = require('node-fetch');
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');
const blacklist = new Set(); // Almacena tokens invalidados

require('dotenv').config();

const apiBaseURL = process.env.API_BASE_URL || 'http://localhost'

module.exports = {
    login,
    getAllUsers,
    createAccount,
}

async function createAccount(username, password){
    let dbname = process.env.CRUD_DBNAME || 'data';
    let db_entity = 'user';

    const knex = require('knex')({
        client: 'sqlite3',
        connection: {
            filename: path.resolve(`./data/${dbname}.db`),
        },
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    let sqlUsernameValidation = `SELECT * FROM ${db_entity} WHERE username = '${username}';`;
    const usernameValidation = await knex.raw(sqlUsernameValidation);

    if (usernameValidation.length === 0){
        let sql = `INSERT INTO ${db_entity} (username, password) VALUES ('${username}', '${hashedPassword}');`;
        const result = await knex.raw(sql);

        await knex.destroy();

        return {
            message: 'Usuario creado exitosamente',
            error: false
        };
    } else {
        await knex.destroy();

        return {
            message: 'Nombre de usuario ya existe',
            error: true
        };
    }
}

async function login(username, password){
    let dbname = process.env.CRUD_DBNAME || 'data';
    let db_entity = 'user';

    const knex = require('knex')({
        client: 'sqlite3',
        connection: {
            filename: path.resolve(`./data/${dbname}.db`),
        },
    });

    let sql = `SELECT * FROM ${db_entity} WHERE username = '${username}';`;
    const result = await knex.raw(sql);

    await knex.destroy();

    const isPasswordValid = await bcrypt.compareSync(password, result[0].password);

    if (isPasswordValid){
        if (result.length > 0){
            const token = jwt.sign({username}, "Stack", {
                expiresIn: '3m'
            });
            return {
                message: 'Datos correctos',
                token: token,
                userData: result[0].username
            };
        } else {
            return { message: 'Datos incorrectos' }
        }
    } else {
        return { message: 'Usuario o clave no coinciden' }
    }
}

async function getAllUsers(){
    let dbname = process.env.CRUD_DBNAME || 'data';
    let db_entity = 'user';

    const knex = require('knex')({
        client: 'sqlite3',
        connection: {
            filename: path.resolve(`./data/${dbname}.db`),
        },
    });

    let sql = `SELECT * FROM ${db_entity};`;
    const result = await knex.raw(sql);

    await knex.destroy();
    return result;
}