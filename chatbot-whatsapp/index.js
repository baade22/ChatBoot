// index.js

// --- Importações de Módulos ---
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const FormData = require('form-data');
require('dotenv').config();
const { gerarBoletoCora } = require('./cora-api.js');
const { gerarPixCora } = require('./pix-api.js');
const { connectToDatabase } = require('./database.js');

// --- Configurações Iniciais ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] } });

const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)){ fs.mkdirSync(uploadDir); }
const upload = multer({ dest: uploadDir, limits: { fileSize: 50 * 1024 * 1024 } });

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- Configurações ---
const VERIFY_TOKEN = process.env.TOKEN_DE_VERIFICACAO;
const WHATSAPP_TOKEN = process.env.TOKEN_DO_WHATSAPP;
const PHONE_NUMBER_ID = process.env.ID_DO_NUMERO_DE_TELEFONE;
const PORT = process.env.PORT || 3000;
const EKLESIA_API_URL = process.env.EKLESIA_API_URL;
const EKLESIA_API_TOKEN = process.env.EKLESIA_API_TOKEN;
const ADMIN_WHATSAPP_NUMBER = '5581999686995';

// --- Definições de Mensagens e Fluxos ---
const registrationSteps = [
    { key: 'nome', question: 'Para começar, qual o seu nome completo?', required: true, validation: 'fullName' },
    { key: 'sexo', question: 'Qual o seu sexo?', required: true, type: 'buttons' },
    { key: 'dataNascimento', question: 'Qual a sua data de nascimento? (Use o formato DD/MM/AAAA)', required: true },
    { key: 'cpf', question: 'Qual o seu CPF? (Apenas números)', required: true },
    { key: 'estadoCivil', question: 'Qual o seu estado civil?', required: true, type: 'list' },
    { key: 'endereco', question: 'Qual o seu endereço? (Nome da rua, avenida, etc.)', required: true },
    { key: 'numero', question: 'Qual o número da sua residência?', required: true },
    { key: 'bairro', question: 'Qual o seu bairro?', required: true },
    { key: 'uf', question: 'Qual a sigla do seu estado? (Ex: PE, SP, RJ)', required: true },
    { key: 'cep', question: "Qual o seu CEP? (Opcional, envie 'pular' para a próxima pergunta)", required: false },
    { key: 'complemento', question: "Qual o complemento? (Apto, bloco, etc. Opcional, envie 'pular' para a próxima pergunta)", required: false },
    { key: 'email', question: "Qual o seu e-mail? (Opcional, envie 'pular' para a próxima pergunta)", required: false },
    { key: 'mae', question: "Qual o nome da sua mãe? (Opcional, envie 'pular' para a próxima pergunta)", required: false },
    { key: 'pai', question: "Qual o nome do seu pai? (Opcional, envie 'pular' para a próxima pergunta)", required: false },
];

const eventosDisponiveis = [
    { id: "evento_jovens_2025", title: "Acamp. de Jovens 2025", description: "Um fim de semana de comunhão e palavra.", paid: true, amount: 75.00 },
    { id: "evento_casais_2025", title: "Jantar de Casais", description: "Uma noite especial para os casais da igreja.", paid: true, amount: 100.00 },
    { id: "evento_batismo_2025", title: "Batismo Novos Membros", description: "Celebração da nova vida em Cristo.", paid: false }
];

const menuPrincipalList = { type: "interactive", interactive: { type: "list", header: { type: "text", text: "Menu Principal" }, body: { text: "Olá! 👋 Bem-vindo a Igreja Batista Missionária em Aldeia. Por favor, escolha uma das opções abaixo:" }, footer: { text: "Toque no botão e selecione" }, action: { button: "Ver Opções", sections: [{ title: "Atendimento Principal", rows: [ { id: "menu_membros", title: "Cadastro e Consulta", description: "Cadastre-se ou consulte seus dados." }, { id: "menu_eventos", title: "Inscrição em Eventos", description: "Veja os próximos eventos." }, { id: "menu_cultos", title: "Cultos e horários", description: "Veja nossa agenda semanal de cultos." }, { id: "menu_dizimos", title: "Dízimos e ofertas", description: "Informações para contribuição." }, { id: "menu_redes_sociais", title: "Redes sociais", description: "Siga nossos canais oficiais." }, { id: "menu_falar_equipe", title: "Falar com nossa equipe", description: "Transfere para um atendente." } ] }] } } };
const sexoOptionsButtons = { type: "interactive", interactive: { type: "button", body: { text: "Por favor, informe o seu sexo:" }, action: { buttons: [ { type: "reply", reply: { id: "sexo_masculino", title: "Masculino" } }, { type: "reply", reply: { id: "sexo_feminino", title: "Feminino" } } ] } } };
const estadoCivilOptionsList = { type: "interactive", interactive: { type: "list", body: { text: "Por favor, selecione seu estado civil:" }, action: { button: "Estado Civil", sections: [{ title: "Opções", rows: [ { id: "ec_solteiro", title: "Solteiro(a)" }, { id: "ec_casado", title: "Casado(a)" }, { id: "ec_divorciado", title: "Divorciado(a)" }, { id: "ec_viuvo", title: "Viúvo(a)" } ] }] } } };
const dizimoOptionsButtons = { type: "interactive", interactive: { type: "button", body: { text: "Você selecionou *Dízimos e ofertas*. 💲\n\nPor favor, escolha a forma de contribuição:" }, action: { buttons: [ { type: "reply", reply: { id: "dizimo_boleto", title: "Gerar Boleto" } }, { type: "reply", reply: { id: "dizimo_pix", title: "Gerar PIX" } }, { type: "reply", reply: { id: "dizimo_cartao", title: "Cartão de Crédito" } } ] } } };
const textos = { perguntaVoltarMenu: "Deseja voltar ao menu principal? Responda com *Sim* ou *Não*.", atendimentoEncerradoPeloPainel: "Este atendimento foi encerrado pelo nosso operador. Agradecemos o contato! 🙏", respostaPix: "Ótimo! Aqui está o código *PIX Copia e Cola* para sua doação.\n\n`00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5925IGREJA B. M. EM ALDEIA6009SAO PAULO62070503***6304E7C5`", respostaCartao: "Para doações com cartão de crédito ou débito, acesse nosso portal seguro:\n\nhttps://doar.ibmaldeia.com.br", cultos: "Você selecionou *Cultos e horários* 🕒. \n\nSegue nossa agenda semanal:\n\n*Segunda Feira* (Quinzenais)\nRede Homens e Rede de Mulheres às 19:30h\n\n*Terça Feira*\nCulto de doutrina às 19:30h\n\n*Quarta Feira*\nCulto de oração às 19:30h\n\n*Quinta Feira*\nPonto de pregação às 19:30h\n\n*Sábado*\nAcompanhe pelas nossas redes sociais\n\n*Domingo*\nEscola dominical às 9:00h\nCulto divino às 17:00h", redesSociais: "Você selecionou *Redes sociais*. 🖥️\n\nSiga nossos canais:\n\n*Instagram*\nhttps://www.instagram.com/ibmaldeia/\n\n*Facebook*\nhttps://www.facebook.com/ibmaaldeia12/?locale=pt_BR\n\n*Youtube*\nhttps://www.youtube.com/c/igrejabatistamissionariaemaldeia", falarComEquipe: "Você selecionou *Falar com nossa equipe*. 🧑🏽‍💻\n\nOk, um de nossos atendentes irá responder nesta mesma conversa em breve. Por favor, aguarde." };

// --- Funções Auxiliares ---
async function sendWhatsAppMessage(to, messagePayload) {
    try {
        console.log(`[WhatsApp Enviando] Para: ${to}`);
        await axios.post(`https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`, {
            messaging_product: 'whatsapp',
            to: to,
            ...messagePayload
        }, { headers: { 'Authorization': `Bearer ${WHATSAPP_TOKEN}` } });
        console.log(`[WhatsApp Sucesso] Mensagem enviada para ${to}`);
    } catch (error) {
        console.error(`[WhatsApp Falha] Erro ao enviar para ${to}:`, error.response?.data?.error?.message || error.message);
    }
}

function formatarDadosMembro(data) {
    const [ano, mes, dia] = (data.dataNascimento || "---").split('T')[0].split('-');
    const dataNascimentoFormatada = dia ? `${dia}/${mes}/${ano}` : "Não informado";
    return `*Seus Dados Cadastrados:*\n\n` +
        `*Nome:* ${data.nome || 'Não informado'}\n` +
        `*Matrícula:* ${data.codigo || 'Não informado'}\n` +
        `*CPF:* ${data.cpf || 'Não informado'}\n` +
        `*Celular:* ${data.celular || 'Não informado'}\n` +
        `*Nascimento:* ${dataNascimentoFormatada}\n` +
        `*Endereço:* ${data.endereco || ''}, ${data.numero || ''} - ${data.bairro || ''}`;
}

// --- Funções de Fluxo ---
async function handleMemberVerification(from, message, db) {
    const userState = await db.collection('userSessions').findOne({ _id: from });
    const receivedText = message.text?.body?.trim() || "";
    const receivedId = message.interactive?.button_reply?.id;

    switch (userState.step) {
        case 'ask_name':
            await sendWhatsAppMessage(from, { type: 'text', text: { body: `Ok, um momento enquanto verifico se já existe um cadastro para "${receivedText}"... 🔍` } });
            try {
                const response = await axios.get(EKLESIA_API_URL, {
                    params: { codIgreja: 1, nome: receivedText },
                    headers: { 'Authorization': `Bearer ${EKLESIA_API_TOKEN}` }
                });

                if (response.data?.registros?.length > 0) {
                    const foundData = response.data.registros[0];
                    const update = { $set: { step: 'confirm_identity', foundData: foundData, typedName: receivedText } };
                    await db.collection('userSessions').updateOne({ _id: from }, update);
                    
                    const membro = foundData;
                    const confirmMsg = `Encontrei este registo:\n\n*Nome:* ${membro.nome}\n*CPF (final):* ***${membro.cpf.slice(-3)}\n\nÉ você?`;
                    await sendWhatsAppMessage(from, { type: "interactive", interactive: { type: "button", body: { text: confirmMsg }, action: { buttons: [ { type: "reply", reply: { id: "verify_confirm_yes", title: "Sim, sou eu" } }, { type: "reply", reply: { id: "verify_confirm_no", title: "Não sou eu" } } ] } } });
                } else {
                    console.log(`[Cadastro] Nome "${receivedText}" não encontrado. Iniciando novo cadastro.`);
                    const update = { $set: { action: 'registering', step: 1, formData: { codIgreja: 1, celular: from, codArrolamento: 1, codMotivoArrolamento: 1, nome: receivedText } } };
                    await db.collection('userSessions').updateOne({ _id: from }, update);
                    await sendWhatsAppMessage(from, sexoOptionsButtons);
                }
            } catch (error) {
                await sendWhatsAppMessage(from, { type: 'text', text: { body: "Ocorreu um erro ao verificar seus dados. Por favor, tente novamente." } });
                await db.collection('userSessions').deleteOne({ _id: from });
            }
            break;
        
        case 'confirm_identity':
            if (receivedId === 'verify_confirm_yes') {
                const memberData = userState.foundData;
                const formattedResponse = formatarDadosMembro(memberData);
                await sendWhatsAppMessage(from, { type: 'text', text: { body: "Ótimo! Aqui estão os seus dados:" } });
                await sendWhatsAppMessage(from, { type: 'text', text: { body: formattedResponse } });
                await db.collection('userSessions').deleteOne({ _id: from });
            } else { // Não sou eu
                console.log(`[Cadastro] Utilizador negou ser a pessoa encontrada. Iniciando novo cadastro.`);
                const update = { $set: { action: 'registering', step: 1, formData: { codIgreja: 1, celular: from, codArrolamento: 1, codMotivoArrolamento: 1, nome: userState.typedName } } };
                await db.collection('userSessions').updateOne({ _id: from }, update);
                await sendWhatsAppMessage(from, sexoOptionsButtons);
            }
            break;
    }
}

async function handleRegistration(from, message, db) {
    const userState = await db.collection('userSessions').findOne({ _id: from });
    if (!userState || typeof userState.step !== 'number') {
        console.error(`Estado inválido para registro:`, userState);
        await db.collection('userSessions').deleteOne({ _id: from });
        return;
    }
    const currentStep = registrationSteps[userState.step];
    const receivedId = message.interactive?.list_reply?.id || message.interactive?.button_reply?.id;
    const receivedText = message.text?.body?.trim() || "";

    let isValid = true;
    let value = receivedText;

    if (currentStep.type === 'buttons' || currentStep.type === 'list') {
        if (receivedId) {
            value = message.interactive[receivedId.startsWith('ec_') ? 'list_reply' : 'button_reply'].title;
        } else { isValid = false; }
    } else {
        if (currentStep.validation === 'fullName' && !value.includes(' ')) {
            isValid = false;
            await sendWhatsAppMessage(from, { type: 'text', text: { body: "Por favor, digite seu nome e sobrenome." } });
        } else if (!currentStep.required && value.toLowerCase() === 'pular') {
            value = "";
        } else if (currentStep.required && !value) {
            isValid = false;
            await sendWhatsAppMessage(from, { type: 'text', text: { body: "Esta informação é obrigatória." } });
        }
    }

    if (!isValid) {
        if (currentStep.type === 'buttons') await sendWhatsAppMessage(from, sexoOptionsButtons);
        else if (currentStep.type === 'list') await sendWhatsAppMessage(from, estadoCivilOptionsList);
        return;
    }

    if(receivedId === 'sexo_masculino') value = 'MASCULINO';
    if(receivedId === 'sexo_feminino') value = 'FEMININO';
    
    const newStep = userState.step + 1;
    const updateData = { $set: { step: newStep, [`formData.${currentStep.key}`]: value } };
    await db.collection('userSessions').updateOne({ _id: from }, updateData);

    if (newStep < registrationSteps.length) {
        const nextStep = registrationSteps[newStep];
        if (nextStep.type === 'buttons') await sendWhatsAppMessage(from, sexoOptionsButtons);
        else if (nextStep.type === 'list') await sendWhatsAppMessage(from, estadoCivilOptionsList);
        else await sendWhatsAppMessage(from, { type: 'text', text: { body: nextStep.question } });
    } else {
        await sendWhatsAppMessage(from, { type: 'text', text: { body: "Obrigado! 🙏 Finalizando seu cadastro..." } });
        const finalState = await db.collection('userSessions').findOne({ _id: from });
        try {
            const [dia, mes, ano] = finalState.formData.dataNascimento.split('/');
            finalState.formData.dataNascimento = `${ano}-${mes}-${dia}`;
            finalState.formData.dataArrolamento = new Date().toISOString().split('T')[0];
            const response = await axios.post(EKLESIA_API_URL, finalState.formData, { headers: { 'Authorization': `Bearer ${EKLESIA_API_TOKEN}` } });
            
            if (response.data?.registros?.[0]?.codigo) {
                await sendWhatsAppMessage(from, { type: 'text', text: { body: `Cadastro realizado com sucesso! ✅ Sua matrícula é: *${response.data.registros[0].codigo}*` } });
                
                if (finalState.resumeAfterRegistration) {
                    await sendWhatsAppMessage(from, { type: 'text', text: { body: "Agora, vamos continuar com a sua doação." } });
                    const update = { $set: { action: finalState.resumeAfterRegistration, step: 'ask_value', membroData: response.data.registros[0] }, $unset: { resumeAfterRegistration: "" } };
                    await db.collection('userSessions').updateOne({_id: from}, update);
                    await sendWhatsAppMessage(from, { type: 'text', text: { body: "Por favor, informe o valor que deseja doar (Ex: 50.00)" } });
                } else {
                    await db.collection('userSessions').deleteOne({ _id: from });
                }
            } else { throw new Error(response.data?.mensagem); }
        } catch (apiError) {
            if (apiError.response?.data?.mensagem?.includes('já cadastrado')) {
                await sendWhatsAppMessage(from, { type: 'text', text: { body: "Este CPF já está cadastrado. Para ver seus dados, use a opção 'Consultar'." } });
            } else {
                await sendWhatsAppMessage(from, { type: 'text', text: { body: "Houve um erro ao finalizar seu cadastro." } });
            }
            await db.collection('userSessions').deleteOne({ _id: from });
        }
    }
}

async function handleContribution(from, message, db) {
    const userState = await db.collection('userSessions').findOne({ _id: from });
    const receivedText = message.text?.body?.trim() || "";
    const receivedId = message.interactive?.button_reply?.id;
    const paymentType = userState.action === 'generatingBoleto' ? 'boleto' : 'pix';

    switch (userState.step) {
        case 'ask_name':
            await sendWhatsAppMessage(from, { type: 'text', text: { body: `Ok, a pesquisar por "${receivedText}"... 🔍` } });
            try {
                const response = await axios.get(EKLESIA_API_URL, { params: { codIgreja: 1, nome: receivedText }, headers: { 'Authorization': `Bearer ${EKLESIA_API_TOKEN}` } });
                if (response.data?.registros?.length > 0) {
                    const membroData = response.data.registros[0];
                    await db.collection('userSessions').updateOne({ _id: from }, { $set: { step: 'confirm_identity', membroData: membroData } });
                    const confirmMsg = `Encontrei este registo:\n\n*Nome:* ${membroData.nome}\n*CPF (final):* ***${membroData.cpf.slice(-3)}\n\nÉ você?`;
                    await sendWhatsAppMessage(from, { type: "interactive", interactive: { type: "button", body: { text: confirmMsg }, action: { buttons: [ { type: "reply", reply: { id: "contrib_confirm_yes", title: "Sim, sou eu" } }, { type: "reply", reply: { id: "contrib_confirm_no", title: "Não sou eu" } } ] } } });
                } else {
                    await sendWhatsAppMessage(from, { type: 'text', text: { body: "Não encontrei um cadastro com este nome. Para realizar a contribuição, primeiro precisamos fazer o seu cadastro." } });
                    const update = { $set: { action: 'registering', step: 1, formData: { codIgreja: 1, celular: from, codArrolamento: 1, codMotivoArrolamento: 1, nome: receivedText }, resumeAfterRegistration: userState.action } };
                    await db.collection('userSessions').updateOne({ _id: from }, update);
                    await sendWhatsAppMessage(from, sexoOptionsButtons);
                }
            } catch (error) {
                await sendWhatsAppMessage(from, { type: 'text', text: { body: "Ocorreu um erro ao buscar os seus dados." } });
                await db.collection('userSessions').deleteOne({ _id: from });
            }
            break;

        case 'confirm_identity':
            if (receivedId === 'contrib_confirm_yes') {
                await db.collection('userSessions').updateOne({ _id: from }, { $set: { step: 'ask_value' } });
                await sendWhatsAppMessage(from, { type: 'text', text: { body: "Ótimo! Por favor, informe o valor que deseja doar (Ex: 50.00)" } });
            } else {
                await sendWhatsAppMessage(from, { type: 'text', text: { body: "Ok. Para tentar novamente, por favor, escolha a opção de contribuição no menu de dízimos." } });
                await db.collection('userSessions').deleteOne({ _id: from });
            }
            break;

        case 'ask_value':
            const valor = parseFloat(receivedText.replace(',', '.'));
            if (isNaN(valor) || valor < 5) {
                await sendWhatsAppMessage(from, { type: 'text', text: { body: "Valor inválido. O valor mínimo para doação é de R$ 5,00. Por favor, digite um valor igual ou maior." } });
                return;
            }
            
            await sendWhatsAppMessage(from, { type: 'text', text: { body: `A gerar sua contribuição via ${paymentType}, aguarde... 🏦` } });
            
            try {
                const resultData = await (paymentType === 'boleto' ? gerarBoletoCora(userState.membroData, valor) : gerarPixCora(userState.membroData, valor));
                
                if (resultData) {
                    let responseMsg;
                    if (paymentType === 'boleto') {
                        responseMsg = `Boleto gerado! ✅\n\n*Link:* ${resultData.link}\n\n*Linha Digitável:*\n\`\`\`${resultData.linhaDigitavel}\`\`\``;
                    } else {
                        responseMsg = `PIX gerado! ✅\n\nCopie o código abaixo e cole no seu app do banco:\n\n\`\`\`${resultData.emv}\`\`\``;
                    }
                    await sendWhatsAppMessage(from, { type: 'text', text: { body: responseMsg } });
                } else {
                    throw new Error("O módulo de pagamento não retornou os dados esperados.");
                }
            } catch (error) {
                console.error(`[${paymentType} Finalização] Erro:`, error.message);
                await sendWhatsAppMessage(from, { type: 'text', text: { body: "Não foi possível gerar sua contribuição neste momento." } });
            } finally {
                await db.collection('userSessions').deleteOne({ _id: from });
            }
            break;
    }
}

async function handleEventRegistration(from, message, db) {
    const userState = await db.collection('userSessions').findOne({ _id: from });
    const receivedText = message.text?.body?.trim() || "";
    const receivedId = message.interactive?.list_reply?.id || message.interactive?.button_reply?.id;

    switch (userState.step) {
        case 'select_event':
            const eventoId = receivedId;
            const eventoSelecionado = eventosDisponiveis.find(e => e.id === eventoId);
            
            if (!eventoSelecionado) {
                await sendWhatsAppMessage(from, { type: 'text', text: { body: "Opção de evento inválida. Por favor, selecione uma das opções disponíveis na lista abaixo." } });
                const eventRows = eventosDisponiveis.map(e => ({ id: e.id, title: e.title, description: e.description }));
                const eventListMessage = { type: "interactive", interactive: { type: "list", header: { type: "text", text: "Eventos Disponíveis" }, body: { text: "Temos os seguintes eventos abertos para inscrição. Por favor, selecione um:" }, action: { button: "Ver Eventos", sections: [{ title: "Nossos Eventos", rows: eventRows }] } } };
                await sendWhatsAppMessage(from, eventListMessage);
                return;
            }

            await db.collection('userSessions').updateOne({ _id: from }, { $set: { step: 'ask_name', evento: eventoSelecionado } });
            await sendWhatsAppMessage(from, { type: 'text', text: { body: `Ótima escolha! Para se inscrever no evento "${eventoSelecionado.title}", por favor, digite o seu nome completo:` } });
            break;

        case 'ask_name':
            await sendWhatsAppMessage(from, { type: 'text', text: { body: `Ok, a pesquisar por "${receivedText}"... 🔍` } });
            try {
                const response = await axios.get(EKLESIA_API_URL, { params: { codIgreja: 1, nome: receivedText }, headers: { 'Authorization': `Bearer ${EKLESIA_API_TOKEN}` } });
                if (response.data?.registros?.length > 0) {
                    const membroData = response.data.registros[0];
                    await db.collection('userSessions').updateOne({ _id: from }, { $set: { step: 'confirm_identity', membroData: membroData } });
                    const confirmMsg = `Encontrei este registo:\n\n*Nome:* ${membroData.nome}\n*CPF (final):* ***${membroData.cpf.slice(-3)}\n\nÉ você?`;
                    await sendWhatsAppMessage(from, { type: "interactive", interactive: { type: "button", body: { text: confirmMsg }, action: { buttons: [ { type: "reply", reply: { id: "event_confirm_yes", title: "Sim, sou eu" } }, { type: "reply", reply: { id: "event_confirm_no", title: "Não sou eu" } } ] } } });
                } else {
                    await sendWhatsAppMessage(from, { type: 'text', text: { body: "Não encontrei um cadastro com este nome. Para se inscrever, primeiro precisamos fazer o seu cadastro." } });
                    const update = { $set: { action: 'registering', step: 1, formData: { codIgreja: 1, celular: from, codArrolamento: 1, codMotivoArrolamento: 1, nome: receivedText }, resumeAfterRegistration: { action: 'eventRegistration', event: userState.evento } } };
                    await db.collection('userSessions').updateOne({ _id: from }, update);
                    await sendWhatsAppMessage(from, sexoOptionsButtons);
                }
            } catch (error) {
                await sendWhatsAppMessage(from, { type: 'text', text: { body: "Ocorreu um erro ao buscar os seus dados." } });
                await db.collection('userSessions').deleteOne({ _id: from });
            }
            break;

        case 'confirm_identity':
            const evento = userState.evento;
            if (receivedId === 'event_confirm_yes') {
                if (evento.paid) {
                    await db.collection('userSessions').updateOne({ _id: from }, { $set: { step: 'ask_payment' } });
                    await sendWhatsAppMessage(from, { type: 'text', text: { body: `Perfeito! O valor da inscrição para "${evento.title}" é de R$ ${evento.amount.toFixed(2)}. Como deseja pagar?` } });
                    await sendWhatsAppMessage(from, dizimoOptionsButtons);
                } else {
                    await sendWhatsAppMessage(from, { type: 'text', text: { body: `Inscrição para "${evento.title}" realizada com sucesso! ✅` } });
                    await db.collection('eventRegistrations').insertOne({ eventoId: evento.id, eventoNome: evento.title, nomeMembro: userState.membroData.nome, dataPagamento: new Date(), formaPagamento: 'Gratuito' });
                    await enviarRelatorioInscricoes(db);
                    await db.collection('userSessions').deleteOne({ _id: from });
                }
            } else {
                await sendWhatsAppMessage(from, { type: 'text', text: { body: "Ok. Para tentar novamente, por favor, escolha a opção de eventos no menu principal." } });
                await db.collection('userSessions').deleteOne({ _id: from });
            }
            break;

        case 'ask_payment':
            const formaPagamentoId = receivedId;
            const eventoPagamento = userState.evento;
            const membroPagamento = userState.membroData;
            
            let paymentType;
            if (formaPagamentoId === 'dizimo_boleto') paymentType = 'boleto';
            else if (formaPagamentoId === 'dizimo_pix') paymentType = 'pix';
            else {
                await sendWhatsAppMessage(from, { type: 'text', text: { body: "Opção de pagamento inválida." } });
                return;
            }

            await sendWhatsAppMessage(from, { type: 'text', text: { body: `A gerar sua contribuição via ${paymentType}, aguarde... 🏦` } });
            
            try {
                const resultData = await (paymentType === 'boleto' ? gerarBoletoCora(membroPagamento, eventoPagamento.amount) : gerarPixCora(membroPagamento, eventoPagamento.amount));
                
                if (resultData) {
                    let responseMsg;
                    if (paymentType === 'boleto') {
                        responseMsg = `Boleto gerado! ✅\n\n*Link:* ${resultData.link}\n\n*Linha Digitável:*\n\`\`\`${resultData.linhaDigitavel}\`\`\``;
                    } else {
                        responseMsg = `PIX gerado! ✅\n\nCopie o código abaixo e cole no seu app do banco:\n\n\`\`\`${resultData.emv}\`\`\``;
                    }
                    await sendWhatsAppMessage(from, { type: 'text', text: { body: responseMsg } });
                    await sendWhatsAppMessage(from, { type: 'text', text: { body: "Sua inscrição será confirmada após o pagamento. Deus abençoe!" } });
                    await db.collection('eventRegistrations').insertOne({ eventoId: eventoPagamento.id, eventoNome: eventoPagamento.title, nomeMembro: membroPagamento.nome, dataPagamento: new Date(), formaPagamento: paymentType, valor: eventoPagamento.amount });
                    await enviarRelatorioInscricoes(db);
                } else {
                    throw new Error("O módulo de pagamento não retornou os dados esperados.");
                }
            } catch (error) {
                await sendWhatsAppMessage(from, { type: 'text', text: { body: "Não foi possível gerar sua forma de pagamento neste momento." } });
            } finally {
                await db.collection('userSessions').deleteOne({ _id: from });
            }
            break;
    }
}

async function enviarRelatorioInscricoes(db) {
    const inscritos = await db.collection('eventRegistrations').find({}).toArray();
    if (inscritos.length === 0) return;

    let relatorio = "🔔 *Relatório de Inscrições Atualizado* 🔔\n\n";
    inscritos.forEach((insc, index) => {
        relatorio += `${index + 1}. *${insc.eventoNome}*\n` +
                     `   - *Nome:* ${insc.nomeMembro}\n` +
                     `   - *Pagamento:* ${insc.formaPagamento}\n` +
                     `   - *Data:* ${new Date(insc.dataPagamento).toLocaleString('pt-BR')}\n\n`;
    });

    await sendWhatsAppMessage(ADMIN_WHATSAPP_NUMBER, { type: 'text', text: { body: relatorio } });
}


// --- Rotas do Express ---
app.get('/painel', (req, res) => {
    res.sendFile(path.join(__dirname, 'atendente.html'));
});

app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode && token === VERIFY_TOKEN) {
        console.log('Webhook verificado com sucesso!');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

app.post('/upload-media', upload.single('mediaFile'), async (req, res) => {
    // Lógica de upload de mídia...
});

app.post('/webhook', async (req, res) => {
    const db = await connectToDatabase();
    try {
        const body = req.body;
        if (body.object === 'whatsapp_business_account' && body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
            const message = body.entry[0].changes[0].value.messages[0];
            const from = message.from;
            
            const userState = await db.collection('userSessions').findOne({ _id: from });

            if (userState?.action) {
                console.log(`[Webhook] Usuário ${from} está no fluxo: ${userState.action}`);
                if (userState.action === 'verifyingMember') await handleMemberVerification(from, message, db);
                else if (userState.action === 'registering') await handleRegistration(from, message, db);
                else if (userState.action === 'generatingBoleto' || userState.action === 'generatingPix') await handleContribution(from, message, db);
                else if (userState.action === 'eventRegistration') await handleEventRegistration(from, message, db);
            } else {
                const receivedId = message.interactive?.list_reply?.id || message.interactive?.button_reply?.id;
                
                if (receivedId) {
                    console.log(`[Webhook] ID Interativo recebido: ${receivedId}`);
                    let messagePayload;

                    switch(receivedId) {
                        case 'menu_membros':
                            await db.collection('userSessions').updateOne({_id: from}, {$set: { action: 'verifyingMember', step: 'ask_name' }}, {upsert: true});
                            await sendWhatsAppMessage(from, { type: 'text', text: { body: "Ok. Para começar, por favor, digite o seu *nome completo*:" } });
                            break;
                        case 'menu_eventos':
                            const eventRows = eventosDisponiveis.map(e => ({ id: e.id, title: e.title, description: e.description }));
                            messagePayload = { type: "interactive", interactive: { type: "list", header: { type: "text", text: "Eventos Disponíveis" }, body: { text: "Temos os seguintes eventos abertos para inscrição. Por favor, selecione um:" }, action: { button: "Ver Eventos", sections: [{ title: "Nossos Eventos", rows: eventRows }] } } };
                            await db.collection('userSessions').updateOne({_id: from}, {$set: { action: 'eventRegistration', step: 'select_event' }}, {upsert: true});
                            break;
                        case 'menu_dizimos': 
                            messagePayload = dizimoOptionsButtons; 
                            break;
                        case 'dizimo_boleto':
                            await db.collection('userSessions').updateOne({_id: from}, {$set: { action: 'generatingBoleto', step: 'ask_name' }}, {upsert: true});
                            await sendWhatsAppMessage(from, { type: 'text', text: { body: "Para gerar o seu boleto, por favor, digite o seu nome completo:" } });
                            break;
                        case 'dizimo_pix':
                            await db.collection('userSessions').updateOne({_id: from}, {$set: { action: 'generatingPix', step: 'ask_name' }}, {upsert: true});
                            await sendWhatsAppMessage(from, { type: 'text', text: { body: "Para gerar o seu PIX, por favor, digite o seu nome completo:" } });
                            break;
                        case 'menu_falar_equipe':
                            const userName = body.entry[0].changes[0].value.contacts[0].profile.name || from;
                            await db.collection('pendingConversations').insertOne({ _id: from, userNumber: from, userName: userName, createdAt: new Date() });
                            io.emit('new_pending_conversation', { userNumber: from, userName });
                            messagePayload = { type: 'text', text: { body: textos.falarComEquipe } };
                            const numeroAtendente = '5581999686995';
                            const notificacao = `🔔 *Alerta de Atendimento* 🔔\n\nO cliente *${userName}* (${from}) solicitou atendimento e está a aguardar no painel.`;
                            await sendWhatsAppMessage(numeroAtendente, { type: 'text', text: { body: notificacao } });
                            break;
                        default: 
                            messagePayload = menuPrincipalList;
                    }
                    if (messagePayload) await sendWhatsAppMessage(from, messagePayload);
                } else if (message.text) {
                    await sendWhatsAppMessage(from, menuPrincipalList);
                }
            }
        }
    } catch (error) {
        console.error("!!!!!!!!!! ERRO INESPERADO NO WEBHOOK !!!!!!!!!!", error);
    } finally {
        res.sendStatus(200);
    }
});


// --- Inicialização e Lógica do Socket.IO ---
io.on('connection', async (socket) => {
    const db = await connectToDatabase();
    console.log('Painel de atendimento conectado:', socket.id);
    const pending = await db.collection('pendingConversations').find({}).toArray();
    socket.emit('pending_conversations', pending);
    
    socket.on('send_from_panel', (data) => {
        sendWhatsAppMessage(data.to, { type: 'text', text: { body: data.text } });
    });
    socket.on('request_history', async (userNumber) => {
        const history = await db.collection('chatHistories').find({ userNumber: userNumber }).sort({ timestamp: 1 }).toArray();
        socket.emit('chat_history', history);
    });
    socket.on('close_chat', async (userNumber) => {
        await db.collection('pendingConversations').deleteOne({ _id: userNumber });
        io.emit('conversation_closed', userNumber);
        sendWhatsAppMessage(userNumber, { type: 'text', text: { body: textos.atendimentoEncerradoPeloPainel } });
    });
    socket.on('disconnect', () => console.log('Painel de atendimento desconectado:', socket.id));
});

async function startServer() {
    await connectToDatabase();
    server.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
        console.log(`Acesse o painel de atendimento em http://localhost:${PORT}/painel`);
    });
}

startServer();
