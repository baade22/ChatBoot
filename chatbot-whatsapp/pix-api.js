// pix-api.js

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');
require('dotenv').config();

// --- CONFIGURAÇÃO ESPECÍFICA DA CORA ---
const CLIENT_ID = process.env.CORA_CLIENT_ID;
const CERT_FILE_NAME = 'certificate.pem';
const KEY_FILE_NAME = 'private-key.key';
const API_BASE_URL = 'https://matls-clients.api.stage.cora.com.br';

// Função interna para obter o token
async function obterToken(httpsAgent) {
    console.log("[PIX API Module] Autenticando para obter token...");
    try {
        const data = new URLSearchParams();
        data.append('grant_type', 'client_credentials');
        data.append('client_id', CLIENT_ID);
        const response = await axios.post(`${API_BASE_URL}/token`, data, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            httpsAgent: httpsAgent
        });
        console.log("[PIX API Module] => Token obtido com sucesso!");
        return response.data.access_token;
    } catch (error) {
        console.error("[PIX API Module] => Erro ao obter token:", error.response?.data || error.message);
        return null;
    }
}

// Função interna para criar a cobrança de PIX
async function criarCobrancaPix(token, httpsAgent, dadosMembro, valor) {
    console.log("[PIX API Module] Criando a cobrança (PIX)...");
    const url = `${API_BASE_URL}/v2/invoices`;
    const idempotencyKey = crypto.randomUUID();
    
    // Mesmo para PIX, a API exige uma data de vencimento.
    const dataVencimento = new Date();
    dataVencimento.setDate(dataVencimento.getDate() + 15);
    const formattedDueDate = dataVencimento.toISOString().split('T')[0];

    const dadosCobranca = {
        code: `DOACAO-PIX-${crypto.randomInt(1000, 9999)}`,
        customer: {
            name: dadosMembro.nome,
            email: dadosMembro.email || "email.nao.informado@exemplo.com",
            document: {
                identity: dadosMembro.cpf.replace(/\D/g, ''),
                type: "CPF"
            },
            address: {
                street: dadosMembro.endereco,
                number: dadosMembro.numero,
                district: dadosMembro.bairro,
                city: dadosMembro.cidade || "Cidade não informada",
                state: dadosMembro.uf,
                zip_code: dadosMembro.cep.replace(/\D/g, '') || "00000000"
            }
        },
        services: [{
            name: "Dízimo / Oferta (PIX)",
            description: `Contribuição voluntária de ${dadosMembro.nome}`,
            amount: Math.round(valor * 100)
        }],
        payment_forms: ["PIX"],
        // **CORREÇÃO APLICADA AQUI:** Adicionado payment_terms, que é obrigatório
        payment_terms: {
            due_date: formattedDueDate,
        }
    };

    try {
        console.log("[PIX API Module] Enviando dados da cobrança:", JSON.stringify(dadosCobranca, null, 2));
        const response = await axios.post(url, dadosCobranca, {
            headers: { 'Authorization': `Bearer ${token}`, 'Idempotency-Key': idempotencyKey },
            httpsAgent: httpsAgent
        });
        console.log("[PIX API Module] => Resposta recebida da API Cora:", JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (error) {
        console.error("[PIX API Module] => Erro ao criar cobrança PIX:", error.response?.data || error.message);
        return null;
    }
}

// --- FUNÇÃO PRINCIPAL EXPORTADA ---
async function gerarPixCora(dadosMembro, valor) {
    console.log("[PIX Module] Iniciando processo de geração de PIX...");
    try {
        const httpsAgent = new https.Agent({
            cert: fs.readFileSync(path.join(__dirname, CERT_FILE_NAME)),
            key: fs.readFileSync(path.join(__dirname, KEY_FILE_NAME)),
        });

        const accessToken = await obterToken(httpsAgent);
        
        if (accessToken) {
            const cobrancaGerada = await criarCobrancaPix(accessToken, httpsAgent, dadosMembro, valor);
            
            const pixCopiaECola = cobrancaGerada?.pix?.emv;

            if(pixCopiaECola) {
                console.log("[PIX Module] Extração do código PIX com sucesso.");
                return { emv: pixCopiaECola };
            }
        }
        
        console.error("[PIX Module] Falha ao extrair dados do PIX da resposta da API.");
        return null;
    } catch (fileError) {
        console.error("[PIX Module] ERRO AO LER OS ARQUIVOS DE CERTIFICADO.");
        return null;
    }
}

module.exports = { gerarPixCora };
