const path   = require('path');
const sqlite = require('sqlite3');
const {open} = require('sqlite');

const fetch  = require('node-fetch');
const { maxHeaderSize } = require('http');

require('dotenv').config();

const apiBaseURL = process.env.API_BASE_URL || 'http://localhost' 

module.exports = {
    migrateEntity,
    getEntitiesAll,
    getEntityById,
    upsertEntity,
    deleteEntity
}

async function getEntitiesAll(options){
    const {
        entity = '',
        page = 1
    } = options;

    let dbname = process.env.CRUD_DBNAME || 'data';
    let db_entity = entity;

    const knex = require('knex')({
        client: 'sqlite3',
        connection: {
            filename: path.resolve(`./data/${dbname}.db`),
        },
    });

    let sqlInfo = `SELECT COUNT(*) as total FROM ${db_entity};`;
    let rsInfo = await knex.raw(sqlInfo);
    let count = rsInfo[0].total || 0;

    let perPage = 20;
    let sql = `SELECT * FROM ${db_entity} LIMIT ${perPage} OFFSET ${(page-1) * perPage};`;
    let rs = await knex.raw(sql);

    let jsonRs = rs.map(reg => {
        let regOut = {};
        Object.keys(reg).forEach(field => {
            regOut[field] = reg[field];
            try {
                regOut[field] = JSON.parse(reg[field]);
            } catch {}
        });
        return regOut;
    });

    let results = {
        info: {
            count,
            pages: Math.ceil(count / perPage)
        },
        results: jsonRs
    }

    knex.destroy();
    return results;
}

async function getEntityById(entity, id, options){

}

async function deleteEntity(entity, id, options){
    let dbname = process.env.CRUD_DBNAME || 'data';
    let db_entity = entity;

    const knex = require('knex')({
        client: 'sqlite3',
        connection: {
            filename: path.resolve(`./data/${dbname}.db`),
        },
    });

    let sql = `
        DELETE FROM
            ${db_entity}
        WHERE
            id=${id}
    ;`;
    const result = await knex.raw(sql);
    
    knex.destroy();
    
    console.log(result);
}

async function upsertEntity(entity, options={}){
    let dbname = process.env.CRUD_DBNAME || 'data';
    let db_entity = entity;

    const {
        data = {}
    } = options;

    let cols = Object.keys(data).join(',');

    let vals = [];
    let valsUpdate = [];
    Object.keys(data).forEach(k => {
        let value = data[k];
        vals.push(`'${value}'`);
        valsUpdate.push(`${k}='${value}'`);
    }); 
    vals = vals.join(',');

    const knex = require('knex')({
        client: 'sqlite3',
        connection: {
            filename: path.resolve(`./data/${dbname}.db`),
        },
    });

    let sql = `
        INSERT INTO
            ${db_entity}
            (${cols})
        VALUES
            (${vals})
        
        ON CONFLICT (id) 
        DO 
            UPDATE SET 
            ${valsUpdate}
    ;`;
    console.log({sql});
    const result = await knex.raw(sql);
    
    knex.destroy();
    
    console.log(result);
}

async function migrateEntity(entity){
    let dbname = process.env.CRUD_DBNAME || 'data';
    let db_entity = entity;
    if(entity.slice(-1) == 's'){
        entity = entity.slice(0, -1);
    }

    // abrir / crear la BD
    let db = await open({
        filename: path.resolve(`./data/${dbname}.db`),
        driver  : sqlite.Database
    })
    .catch(err => {
        console.log({err});
        res
            .status(500)
            .json({
                error: true,
                ...err
            });
    });

    // consulta para obtener el modelo
    let jsonRsp = await getMigrateEntityById(entity, 1);
    let keys = Object.keys(jsonRsp);

    // crear la entidad
    let entityCols = keys.map(key => {
        let type = key === 'id' ? 'INTEGER PRIMARY KEY AUTOINCREMENT' : 'TEXT';
        return `${key} ${type}`
    })
    .join(',');

    let sql = `
        CREATE TABLE IF NOT EXISTS ${db_entity} (${entityCols});
    `;
    let table = await db.exec(sql)
    .catch(err => {
        console.log({err});
    });

    // poblar la entidad
    let optionsRS = {entity, page: 1};
    let jsonRS = await getMigrateEntitiesAll(optionsRS);
    let cols = keys.join(',');
    
    jsonRS.results.map(async reg => {
        let vals = "'" + Object.keys(reg)
            .map(col => {
                let value = (typeof reg[col] === 'object')
                    ? JSON.stringify(reg[col])
                    : reg[col]
                ;
                value = String(value).replace(/'/g,'');
                return value;
            }).join("','") + "'"
        ;
        let sql = `
            INSERT INTO
                ${db_entity}
                (${cols})
            VALUES
                (${vals})
        ;`;
        const result = await db.run(sql);
    });

    db.close();
}

async function getMigrateEntitiesAll(options){
    const {
        entity = '',
        page = 1
    } = options;

    let url = `${apiBaseURL}/${entity}/?page=${page}`;
    
    let rspJson = await fetch(url)
        .then(rslt => rslt.json())
        .catch(err => {
            console.log({err});
        })
    ;
    return rspJson;
}

async function getMigrateEntityById(entity, id){
    let url = `${apiBaseURL}/${entity}/${id}`;
    let rspJson = await fetch(url)
    .then(rslt => rslt.json())
    .catch(err => {
        console.log({err});
    });
    return rspJson;
}