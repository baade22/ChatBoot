// constants.js

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

const menuPrincipalList = { type: "interactive", interactive: { type: "list", header: { type: "text", text: "IBMAldeia" }, body: { text: "Olá! 👋 Bem-vindo a Igreja Batista Missionária em Aldeia. \n\nPor favor, escolha uma das opções abaixo:" }, footer: { text: "Toque no botão e selecione" }, action: { button: "Ver Opções", sections: [{ title: "Atendimento Principal", rows: [ { id: "menu_membros", title: "Cadastro e Consulta", description: "Cadastre-se ou consulte seus dados." }, { id: "menu_eventos", title: "Inscrição em Eventos", description: "Veja os próximos eventos." }, { id: "menu_cultos", title: "Cultos e horários", description: "Veja nossa agenda semanal de cultos." }, { id: "menu_dizimos", title: "Dízimos e ofertas", description: "Informações para contribuição." }, { id: "menu_redes_sociais", title: "Redes sociais", description: "Siga nossos canais oficiais." }, { id: "menu_falar_equipe", title: "Falar com nossa equipe", description: "Transfere para um voluntário." } ] }] } } };
const membrosSubMenuButtons = { type: "interactive", interactive: { type: "button", body: { text: "Você selecionou a área de membros. O que deseja fazer?" }, action: { buttons: [ { type: "reply", reply: { id: "cadastro_novo", title: "Novo Cadastro" } }, { type: "reply", reply: { id: "consulta_dados", title: "Consultar meus Dados" } } ] } } };
const sexoOptionsButtons = { type: "interactive", interactive: { type: "button", body: { text: "Por favor, informe o seu sexo:" }, action: { buttons: [ { type: "reply", reply: { id: "sexo_masculino", title: "Masculino" } }, { type: "reply", reply: { id: "sexo_feminino", title: "Feminino" } } ] } } };
const estadoCivilOptionsList = { type: "interactive", interactive: { type: "list", body: { text: "Por favor, selecione seu estado civil:" }, action: { button: "Estado Civil", sections: [{ title: "Opções", rows: [ { id: "ec_solteiro", title: "Solteiro(a)" }, { id: "ec_casado", title: "Casado(a)" }, { id: "ec_divorciado", title: "Divorciado(a)" }, { id: "ec_viuvo", title: "Viúvo(a)" } ] }] } } };
const dizimoOptionsButtons = { type: "interactive", interactive: { type: "button", body: { text: "Você selecionou *Dízimos e ofertas*. 💲\n\nPor favor, escolha a forma de contribuição:" }, action: { buttons: [ { type: "reply", reply: { id: "dizimo_boleto", title: "Gerar Boleto" } }, { type: "reply", reply: { id: "dizimo_pix", title: "Gerar PIX" } }, { type: "reply", reply: { id: "dizimo_cartao", title: "Cartão de Crédito" } } ] } } };

const textos = {
    perguntaVoltarMenu: "Deseja voltar ao menu principal? Responda com *Sim* ou *Não*.",
    atendimentoEncerradoPeloPainel: "Este atendimento foi encerrado pelo nosso voluntário. Agradecemos o contato! 🙏",
    respostaCartao: "Para doações com cartão de crédito ou débito, acesse nosso portal seguro:\n\nhttps://doar.ibmaldeia.com.br",
    cultos: "Você selecionou *Cultos e horários* 🕒. \n\nSegue nossa agenda semanal:\n\n*Segunda Feira* (Quinzenais)\nRede Homens e Rede de Mulheres às 19:30h\n\n*Terça Feira*\nCulto de doutrina às 19:30h\n\n*Quarta Feira*\nCulto de oração às 19:30h\n\n*Quinta Feira*\nPonto de pregação às 19:30h\n\n*Sábado*\nAcompanhe pelas nossas redes sociais\n\n*Domingo*\nEscola dominical às 9:00h\nCulto divino às 17:00h",
    redesSociais: "Você selecionou *Redes sociais*. 🖥️\n\nSiga nossos canais:\n\n*Instagram*\nhttps://www.instagram.com/ibmaldeia/\n\n*Facebook*\nhttps://www.facebook.com/ibmaaldeia12/?locale=pt_BR\n\n*Youtube*\nhttps://www.youtube.com/c/igrejabatistamissionariaemaldeia", // Lembre-se de corrigir este link
    falarComEquipe: "Você selecionou *Falar com nossa equipe*. 🧑🏽‍💻\n\nOk, um de nossos voluntátios irá responder nesta mesma conversa em breve. Por favor, aguarde."
};

module.exports = {
    registrationSteps,
    eventosDisponiveis,
    menuPrincipalList,
    membrosSubMenuButtons,
    sexoOptionsButtons,
    estadoCivilOptionsList,
    dizimoOptionsButtons,
    textos
};