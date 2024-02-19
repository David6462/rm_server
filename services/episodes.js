const fetch = require('node-fetch');

require('dotenv').config();

const apiBaseURL = process.env.API_BASE_URL || 'http://localhost' 

module.exports = {
    getEpisodesAll,
    getEpisodeById
}

async function getEpisodesAll(options){
    const {
        page = 1
    } = options;

    let url = `${apiBaseURL}/episode/?page=${page}`;
    let rspJson = await fetch(url)
    .then(rslt => rslt.json())
    .catch(err => {
        console.log({err});
    });
    return rspJson;
}

async function getEpisodeById(id){
    let url = `${apiBaseURL}/episode/${id}`;
    let rspJson = await fetch(url)
    .then(rslt => rslt.json())
    .catch(err => {
        console.log({err});
    });
    return rspJson;
}