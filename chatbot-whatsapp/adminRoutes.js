// adminRoutes.js
const express = require('express');
const { ObjectId } = require('mongodb');
const router = express.Router();

// Middleware de segurança simples (será usado no index.js)
const checkAuth = (req, res, next) => {
    // Implementaremos a lógica de sessão/senha aqui depois
    // Por enquanto, vamos permitir o acesso para construir a base
    next();
};

// GET: Obter todos os eventos
router.get('/events', checkAuth, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const events = await db.collection('events').find({}).sort({ title: 1 }).toArray();
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar eventos.' });
    }
});

// POST: Criar um novo evento
router.post('/events', checkAuth, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const newEvent = req.body;
        // Converte os dados recebidos para os tipos corretos
        newEvent.paid = newEvent.paid === 'true' || newEvent.paid === true;
        newEvent.amount = newEvent.paid ? parseFloat(newEvent.amount) : 0;

        const result = await db.collection('events').insertOne(newEvent);
        res.status(201).json(result.ops[0]);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar evento.' });
    }
});

// PUT: Atualizar um evento existente
router.put('/events/:id', checkAuth, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const { id } = req.params;
        const updatedEventData = req.body;
        
        updatedEventData.paid = updatedEventData.paid === 'true' || updatedEventData.paid === true;
        updatedEventData.amount = updatedEventData.paid ? parseFloat(updatedEventData.amount) : 0;
        delete updatedEventData._id; // Remove o campo _id para evitar erros na atualização

        const result = await db.collection('events').updateOne(
            { _id: new ObjectId(id) },
            { $set: updatedEventData }
        );
        res.json({ message: 'Evento atualizado com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar evento.' });
    }
});

// DELETE: Apagar um evento
router.delete('/events/:id', checkAuth, async (req, res) => {
    try {
        const db = req.app.locals.db;
        const { id } = req.params;
        await db.collection('events').deleteOne({ _id: new ObjectId(id) });
        res.json({ message: 'Evento apagado com sucesso!' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao apagar evento.' });
    }
});

module.exports = router;