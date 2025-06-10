// --- DADOS DE ENTRADA (MUDE AQUI DE ACORDO COM SEUS DADOS REAIS) ---

const metas = {
    mrr: 18400,
    ticketIdeal: 3000,
    reunioes: 60,
    leads: 200,
    cplIdeal: 15 // ATUALIZADO: Meta para o CPL (Custo por Lead)
};

// Meta para CAC (Custo de Aquisição de Clientes)
const metaCAC = 1000; // ATUALIZADO: CAC ideal de R$ 1000

// Meta para ROI (Retorno sobre Investimento) - Usado para a barra de progresso
// Se não há uma meta definida, 200% é um bom valor de referência para a barra
const metaROI = 200;

const dados = {
    mrrAtual: 3000,
    ticketMedio: 3000,
    delay: 0, // ATUALIZADO: Taxa de Delay em 0%
    conversao: 75,
    reunioesRealizadas: 3,
    leadsGerados: 8,
    custoTotalMarketing: 899, // Este valor será usado como parte do investimento em Marketing no CAC

    preVendas: {
        agendadas: [2, 3, 0, 0, 0],
        realizadas: [2, 1, 0, 0, 0],
        delay: [0, 0, 0, 0, 0],
        semanas: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5']
    },

    vendas: {
        realizadas: [2, 1, 0, 0, 0],
        fechadas: [1, 0, 0, 0, 0], // Você mencionou 1 cliente fechado
        follow: [1, 1, 0, 0, 0],
        foraICP: [0, 0, 0, 0, 0],
        semanas: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5']
    }
};

// CUSTOS FIXOS (ferramentas e salários) - ATUALIZADOS COM SEUS DADOS
const custosFixosMensais = {
    // Ferramentas
    asaas: 148.50,
    chatGPT: 119.97,
    read: 81.00,
    pipedrive: 102.60,
    canvaPro: 70.00,
    cataCliente: 350.00,
    // Salários (considerados como custos de Vendas/Marketing)
    salario_preVendas: 3000.00,
    salario_salesOps: 1500.00,
    salario_socialSeller: 1000.00
};

// Cotação do dólar (ajuste conforme a cotação atual)
const cotacaoDolar = 5.30;

// Dados para o cálculo do ROI do cliente específico
const receitaClienteROI = 3000; // MRR do cliente que gerou a receita do ROI
const fidelidadeMesesROI = 3; // Meses de fidelidade para o cálculo do ROI
const investimentoROI = dados.custoTotalMarketing; // O custo de tráfego que gerou o cliente de 3k/mês


// --- FUNÇÕES AUXILIARES ---

function formatarMoeda(valor) {
    return `R$${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatarPorcentagem(valor) {
    return `${valor.toFixed(2)}%`;
}

function atualizarBarra(idBarra, idTexto, valorPercentual, label, corClasse) {
    const barra = document.getElementById(idBarra);
    const texto = document.getElementById(idTexto);
    const indicadorDiv = barra.closest('.indicador');

    barra.style.width = `${Math.min(valorPercentual, 100)}%`;
    texto.textContent = label;

    barra.classList.remove('barra-ruim', 'barra-mediano', 'barra-meta', 'barra-superado');
    texto.classList.remove('texto-ruim', 'texto-mediano', 'texto-meta', 'texto-superado');
    indicadorDiv.classList.remove('borda-ruim', 'borda-mediano', 'borda-meta', 'borda-superado');

    if (corClasse) {
        barra.classList.add(`barra-${corClasse}`);
        texto.classList.add(`texto-${corClasse}`);
        indicadorDiv.classList.add(`borda-${corClasse}`);
    }
}

// Lógica para determinar a classe de cor com base no percentual e tipo de meta
function getCorClasse(percentual, tipoMeta) {
    // Casos onde menor percentual é melhor (Delay, CPL, CAC)
    if (tipoMeta === 'delay') {
        // Para Delay, a meta é ABAIXO de 50%. 0% é o ideal.
        // Se o percentual do delay for 0, é superado (roxo).
        // Se for abaixo de 50, é meta (verde).
        // A lógica é invertida em relação a um percentual de "atingimento da meta".
        if (percentual <= 0) return 'superado'; // Roxo: Ideal (0% ou menos, se possível)
        if (percentual < 50) return 'meta';     // Verde: Dentro da meta (abaixo de 50%)
        if (percentual < 75) return 'mediano';  // Amarelo: Mediano (entre 50% e 74%)
        return 'ruim'; // Vermelho: Ruim (75% ou mais)
    } else if (tipoMeta === 'cpl' || tipoMeta === 'cac') {
        // Para CPL e CAC, o percentual é (meta / valorAtual) * 100
        // Então, 100% significa que o valor atual é IGUAL à meta.
        // >100% significa que o valor atual é MELHOR que a meta (menor).
        if (percentual >= 100) return 'superado'; // Roxo: Ótimo (valor atual igual ou menor que a meta)
        if (percentual >= 75) return 'meta';     // Verde: Bom (valor atual ligeiramente acima da meta, mas aceitável)
        if (percentual >= 50) return 'mediano';  // Amarelo: Mediano
        return 'ruim'; // Vermelho: Ruim (valor muito acima da meta)
    } else { // Para metas de crescimento (MRR, Reuniões, Leads, Conversão, Ticket, ROI)
        if (percentual >= 100) return 'superado'; // Roxo: meta superada
        if (percentual >= 75) return 'meta';     // Verde: dentro da meta (75% ou mais)
        if (percentual >= 50) return 'mediano';  // Amarelo: Mediano (50% a 74%)
        return 'ruim'; // Vermelho: Ruim (abaixo de 50%)
    }
}


// --- CÁLCULOS ESPECÍFICOS PARA CAC E ROI ---

function calcularCAC() {

    const investimentosMarketing =
        custosFixosMensais.canvaPro +
        dados.custoTotalMarketing + // Tráfego Pago
        custosFixosMensais.cataCliente +
        custosFixosMensais.salario_socialSeller; // Social Seller pode ser considerado marketing

    const investimentosVendas =
        custosFixosMensais.asaas +
        custosFixosMensais.chatGPT + // ChatGPT pode ser usado por vendas
        custosFixosMensais.salario_preVendas +
        custosFixosMensais.pipedrive +
        custosFixosMensais.salario_salesOps;

    const totalInvestimentos = investimentosMarketing + investimentosVendas;

    // Soma todos os clientes fechados para o período
    const numeroNovosClientes = dados.vendas.fechadas.reduce((acc, current) => acc + current, 0);

    if (numeroNovosClientes > 0) {
        return totalInvestimentos / numeroNovosClientes;
    } else {
        return totalInvestimentos; // Se não houver clientes, o CAC é o próprio investimento total (ou NaN se totalInvestimentos for 0)
    }
}

function calcularROI() {
    const receitaTotalGerada = receitaClienteROI * fidelidadeMesesROI;
    if (investimentoROI > 0) {
        return ((receitaTotalGerada - investimentoROI) / investimentoROI) * 100;
    } else {
        return 0; // Evita divisão por zero
    }
}


// --- ATUALIZAÇÃO DA INTERFACE DO USUÁRIO ---

document.addEventListener('DOMContentLoaded', () => {
    // --- Atualiza Indicadores com Lógica de Cores ---

    // Meta Mensal de MRR
    const percentualMrr = (dados.mrrAtual / metas.mrr) * 100;
    atualizarBarra('barraMeta', 'valorMetaTexto', percentualMrr, `${Math.round(percentualMrr)}%`, getCorClasse(percentualMrr));

    // Ticket Médio Ideal
    const percentualTicket = (dados.ticketMedio / metas.ticketIdeal) * 100;
    atualizarBarra('barraTicket', 'valorTicketTexto', percentualTicket, `R$${dados.ticketMedio.toFixed(2)}`, getCorClasse(percentualTicket));

    // Taxa de Delay (meta: Abaixo de 50%)
    // A barra de progresso do delay deve refletir o percentual real, não uma meta de 100% de atingimento.
    atualizarBarra('barraDelay', 'valorDelayTexto', dados.delay, `${dados.delay}%`, getCorClasse(dados.delay, 'delay'));

    // Taxa de Conversão (meta: 50%)
    const percentualConversao = dados.conversao; // O valor já é o percentual
    atualizarBarra('barraConversao', 'valorConversaoTexto', percentualConversao, `${percentualConversao}%`, getCorClasse(percentualConversao));

    // Reuniões Realizadas (meta: 60)
    const percentualReunioes = (dados.reunioesRealizadas / metas.reunioes) * 100;
    atualizarBarra('barraReunioes', 'valorReunioesTexto', percentualReunioes, `${Math.round(percentualReunioes)}%`, getCorClasse(percentualReunioes));

    // Leads Gerados (meta: 200)
    const percentualLeads = (dados.leadsGerados / metas.leads) * 100;
    atualizarBarra('barraLeads', 'valorLeadsTexto', percentualLeads, `${Math.round(percentualLeads)}%`, getCorClasse(percentualLeads));

    // CPL (Custo por Lead)
    const cplCalculado = dados.leadsGerados > 0 ? dados.custoTotalMarketing / dados.leadsGerados : 0;
    const percentualCpl = cplCalculado > 0 ? (metas.cplIdeal / cplCalculado) * 100 : 0;
    atualizarBarra('barraCPL', 'valorCPLTexto', percentualCpl, `R$${cplCalculado.toFixed(2)}`, getCorClasse(percentualCpl, 'cpl'));

    // --- ATUALIZAR CAC ---
    const cacCalculado = calcularCAC();
    const percentualCAC = cacCalculado > 0 ? (metaCAC / cacCalculado) * 100 : 0;
    atualizarBarra('barraCAC', 'valorCACTexto', percentualCAC, formatarMoeda(cacCalculado), getCorClasse(percentualCAC, 'cac'));

    // --- ATUALIZAR ROI ---
    const roiCalculado = calcularROI();
    const percentualROI = (roiCalculado / metaROI) * 100; // Usa a metaROI de 200% para o preenchimento da barra
    atualizarBarra('barraROI', 'valorROITexto', percentualROI, formatarPorcentagem(roiCalculado), getCorClasse(percentualROI, 'roi'));


    // Gráfico Pré-Vendas
    new Chart(document.getElementById('graficoPreVendas'), {
        type: 'bar',
        data: {
            labels: dados.preVendas.semanas,
            datasets: [
                { label: 'Agendadas', data: dados.preVendas.agendadas, backgroundColor: '#ffa500' },
                { label: 'Realizadas', data: dados.preVendas.realizadas, backgroundColor: '#4caf50' },
                { label: 'Delay', data: dados.preVendas.delay, backgroundColor: '#f44336' }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

    // Gráfico Vendas
    new Chart(document.getElementById('graficoVendas'), {
        type: 'bar',
        data: {
            labels: dados.vendas.semanas,
            datasets: [
                { label: 'Reuniões', data: dados.vendas.realizadas, backgroundColor: '#ffa500' },
                { label: 'Vendas', data: dados.vendas.fechadas, backgroundColor: '#2196f3' },
                { label: 'Follow', data: dados.vendas.follow, backgroundColor: '#9c27b0' },
                { label: 'Fora ICP', data: dados.vendas.foraICP, backgroundColor: '#e91e63' }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
});


