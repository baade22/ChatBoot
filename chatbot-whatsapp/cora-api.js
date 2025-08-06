// cora-api.js

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

// --- CONFIGURAÇÃO ESPECÍFICA DA CORA ---
const CLIENT_ID = process.env.CORA_CLIENT_ID;
const CERT_FILE_NAME = 'certificate.pem';
const KEY_FILE_NAME = 'private-key.key';
const API_BASE_URL = 'https://matls-clients.api.stage.cora.com.br';

// Função interna para obter o token
async function obterToken(httpsAgent) {
    console.log("[Cora API Module] Autenticando para obter token...");
    try {
        const data = new URLSearchParams();
        data.append('grant_type', 'client_credentials');
        data.append('client_id', CLIENT_ID);
        const response = await axios.post(`${API_BASE_URL}/token`, data, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            httpsAgent: httpsAgent
        });
        console.log("[Cora API Module] => Token obtido com sucesso!");
        return response.data.access_token;
    } catch (error) {
        console.error("[Cora API Module] => Erro ao obter token:", error.response?.data || error.message);
        return null;
    }
}

// Função interna para criar a cobrança
async function criarCobranca(token, httpsAgent, dadosMembro, valor) {
    console.log("[Cora API Module] Criando a cobrança (boleto)...");
    const url = `${API_BASE_URL}/v2/invoices`;
    const idempotencyKey = crypto.randomUUID();
    
    const dataVencimento = new Date();
    dataVencimento.setDate(dataVencimento.getDate() + 15);
    const formattedDueDate = dataVencimento.toISOString().split('T')[0];

    const dadosCobranca = {
        code: `DOACAO-${crypto.randomInt(1000, 9999)}`,
        customer: {
            name: dadosMembro.nome,
            email: dadosMembro.email || "email.nao.informado@exemplo.com",
            document: {
                identity: dadosMembro.cpf.replace(/\D/g, ''),
                type: "CPF"
            },
            address: {
                street: dadosMembro.endereco || "Rua não informada",
                number: dadosMembro.numero || "S/N",
                district: dadosMembro.bairro || "Bairro não informado",
                city: dadosMembro.cidade || "Cidade não informada",
                state: dadosMembro.uf || "XX",
                zip_code: (dadosMembro.cep || "00000000").replace(/\D/g, '')
            }
        },
        services: [{
            name: "Dízimo / Oferta",
            description: `Contribuição voluntária de ${dadosMembro.nome}`,
            amount: Math.round(valor * 100)
        }],
        payment_terms: {
            due_date: formattedDueDate,
        }
    };

    try {
        console.log("[Cora API Module] Enviando dados da cobrança:", JSON.stringify(dadosCobranca, null, 2));
        const response = await axios.post(url, dadosCobranca, {
            headers: { 'Authorization': `Bearer ${token}`, 'Idempotency-Key': idempotencyKey },
            httpsAgent: httpsAgent
        });
        console.log("[Cora API Module] => Resposta recebida da API Cora:", JSON.stringify(response.data, null, 2));
        return response.data;
    } catch (error) {
        console.error("[Cora API Module] => Erro ao criar boleto:", error.response?.data || error.message);
        return null;
    }
}

// --- FUNÇÃO PRINCIPAL EXPORTADA ---
async function gerarBoletoCora(dadosMembro, valor) {
    console.log("[Cora Module] Iniciando processo de geração de boleto...");
    if (!CLIENT_ID) {
        console.error("[Cora Module] ERRO: CORA_CLIENT_ID não está definido no arquivo .env");
        return null;
    }
    try {
        const httpsAgent = new https.Agent({
            cert: fs.readFileSync(path.join(__dirname, CERT_FILE_NAME)),
            key: fs.readFileSync(path.join(__dirname, KEY_FILE_NAME)),
            passphrase: process.env.CORA_CERT_PASSPHRASE || null // Adicione se seu certificado tiver senha
        });

        const accessToken = await obterToken(httpsAgent);
        
        if (accessToken) {
            const cobrancaGerada = await criarCobranca(accessToken, httpsAgent, dadosMembro, valor);
            
            const linkBoleto = cobrancaGerada?.payment_options?.bank_slip?.url;
            const linhaDigitavel = cobrancaGerada?.payment_options?.bank_slip?.digitable;

            if (linkBoleto && linhaDigitavel) {
                console.log("[Cora Module] Sucesso! Boleto gerado.");
                return { link: linkBoleto, linhaDigitavel: linhaDigitavel };
            }
        }
        
        console.error("[Cora Module] Falha ao extrair dados do boleto da resposta da API.");
        return null;
    } catch (fileError) {
        console.error("[Cora Module] ERRO AO LER OS ARQUIVOS DE CERTIFICADO:", fileError.message);
        return null;
    }
}

// Exportação correta no final do arquivo
module.exports = { gerarBoletoCora };