// database.js
const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB_NAME;

if (!uri || !dbName) {
    console.error("ERRO: As variáveis MONGO_URI e MONGO_DB_NAME devem estar definidas no ficheiro .env");
    process.exit(1);
}

const client = new MongoClient(uri);
let db;

async function connectToDatabase() {
    if (db) {
        return db;
    }
    try {
        await client.connect();
        console.log("[MongoDB] Conectado com sucesso ao servidor da base de dados!");
        db = client.db(dbName);
        return db;
    } catch (error) {
        console.error("[MongoDB] Falha ao conectar à base de dados", error);
        process.exit(1); // Encerra a aplicação se não conseguir conectar
    }
}

// Exporta a função para que o index.js a possa usar
module.exports = { connectToDatabase };
