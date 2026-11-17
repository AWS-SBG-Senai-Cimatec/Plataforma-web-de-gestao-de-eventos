/* =========================================================
                  Projeto Gestão de Eventos
   Abas: Home | Inscritos | Check-in | Certificados | Relatórios | Configurações
   ========================================================= */

// ---------- Dados ----------
const STORAGE_KEY = 'aws-events-manager-v1';

const DEFAULT_ATTENDEES = [
    { id: 1001, name: "Ana Paula Silva",  cpf: "123.456.789-00", email: "anapsilva@email.com",       company: "AWS",            sector: "Comunidades",  status: "Confirmado" },
    { id: 1002, name: "Bruno Costa",      cpf: "234.567.890-11", email: "brunocosta@cloud.br",       company: "Tech Solutions", sector: "Engenharia",   status: "Pendente" },
    { id: 1003, name: "Carlos Mendes",    cpf: "345.678.901-22", email: "carlos.mendes@globex.com",  company: "Globex",         sector: "Infraestrutura", status: "Confirmado" },
    { id: 1004, name: "Daniela Rocha",    cpf: "456.789.012-33", email: "daniela.rocha@dev.io",      company: "DevStudio",      sector: "Produto",      status: "Pendente" },
    { id: 1005, name: "Eduardo Lima",     cpf: "567.890.123-44", email: "eduardo.lima@nimbus.com.br", company: "Nimbus Cloud",  sector: "Dados",        status: "Confirmado" },
    { id: 1006, name: "Fernanda Alves",   cpf: "678.901.234-55", email: "fernanda.alves@datahub.io", company: "DataHub",        sector: "Analytics",    status: "Pendente" },
    { id: 1007, name: "Gustavo Pereira",  cpf: "789.012.345-66", email: "gustavo.pereira@secureops.com", company: "SecureOps",  sector: "Segurança",    status: "Confirmado" },
    { id: 1008, name: "Helena Martins",   cpf: "890.123.456-77", email: "helena.martins@aws.com",    company: "AWS",            sector: "Eventos",      status: "Pendente" }
];

const EVENTS = [
    {
        id: 'tech-immersion',
        name: 'AWS re:Invent 2024 - Tech Immersion Day',
        date: '2024-11-20',
        hours: 8,
        topics: 'serviços e inovação na nuvem AWS, incluindo IA generativa, DevOps avançado e segurança de dados'
    },
    {
        id: 'genai-workshop',
        name: 'AWS re:Invent 2024 - Workshop de IA Generativa',
        date: '2024-11-21',
        hours: 6,
        topics: 'Amazon Bedrock, agentes de IA, RAG e boas práticas para levar aplicações de IA generativa à produção'
    },
    {
        id: 'security-devops',
        name: 'AWS re:Invent 2024 - Security & DevOps Summit',
        date: '2024-11-22',
        hours: 4,
        topics: 'segurança em nuvem, infraestrutura como código e pipelines de CI/CD na AWS'
    }
];

// Cada aba define: título da página, item ativo no menu superior e botão ativo na barra lateral
const TAB_META = {
    home:          { title: 'AWS Events Manager | Home',                 nav: 'home',          rail: null },
    inscritos:     { title: 'AWS Events Manager | Gestão de Inscritos',  nav: 'inscritos',     rail: null },
    checkin:       { title: 'AWS Events Manager | Check-in Presencial',  nav: 'checkin',       rail: null },
    certificados:  { title: 'AWS Events Manager | Emissão de Certificados',   nav: 'relatorios',    rail: 'certificados' },
    eventos:       { title: 'AWS Events Manager | Eventos',              nav: 'eventos',       rail: null,            placeholder: 'Eventos' },
    relatorios:    { title: 'AWS Events Manager | Relatórios',           nav: 'relatorios',    rail: 'relatorios' },
    configuracoes: { title: 'AWS Events Manager | Configurações',        nav: 'configuracoes', rail: null }
};

// ---------- Configurações (valores padrão e persistência) ----------
const SETTINGS_KEY = 'aws-events-settings-v1';

const DEFAULT_SETTINGS = {
    profile: { name: 'Raphael Leão', role: 'Administrador', email: '', phone: '', company: 'AWS', sector: 'Eventos', avatar: '' },
    ui: { theme: 'dark', language: 'pt-BR', hud: '100', text: '16', accent: 'orange', density: 'comfortable', highContrast: false, reduceMotion: false, bgEffects: true },
    event: { name: 'AWS re:Invent 2024 - Tech Immersion', location: 'Las Vegas, NV', mode: 'Presencial', start: '2024-12-02', end: '2024-12-06', timezone: 'America/Sao_Paulo', capacity: 500, registrationOpen: true, checkinEnabled: true },
    email: {
        sender: 'suporte.eventos@aws.com',
        subject: 'Confirmação de Inscrição',
        template: 'Olá, {nome}!\n\nSua inscrição no evento {evento} foi confirmada.\n\nData: {data}\nLocal: {local}\n\nNo dia, informe o seu CPF no credenciamento para fazer o check-in.\n\nAté lá!\nEquipe de Eventos',
        copyToOrganizer: false
    },
    cert: { prefix: 'AWS-2024-', hours: 8, useDefaultHours: false, sign1Name: 'Ricardo Almeida', sign1Role: 'Diretor de Eventos, AWS Americas', sign2Name: 'Paulo Henrique', sign2Role: 'Coordenador Técnico', qr: true },
    notif: { toasts: true, duration: 4, position: 'right', sound: false, newAttendee: true, checkin: true, feedback: true },
    security: { maskCpf: false, maskEmail: false, confirmDelete: true }
};

// main = cor no tema escuro e botões; soft = texto de destaque no escuro; light = texto de destaque no claro; on = texto sobre a cor
const ACCENTS = {
    orange: { main: '#ff9900', soft: '#fb923c', light: '#c2410c', on: '#111827' },
    blue:   { main: '#3b82f6', soft: '#60a5fa', light: '#1d4ed8', on: '#ffffff' },
    green:  { main: '#22c55e', soft: '#4ade80', light: '#15803d', on: '#052e16' },
    purple: { main: '#8b5cf6', soft: '#a78bfa', light: '#6d28d9', on: '#ffffff' },
    pink:   { main: '#ec4899', soft: '#f472b6', light: '#be185d', on: '#ffffff' }
};

const clone = (obj) => JSON.parse(JSON.stringify(obj));

// Mescla o que veio salvo com os padrões, aceitando só chaves conhecidas e do mesmo tipo
function deepMerge(base, extra) {
    const out = {};
    for (const key of Object.keys(base)) {
        const b = base[key];
        const e = extra && typeof extra === 'object' ? extra[key] : undefined;
        if (b && typeof b === 'object' && !Array.isArray(b)) out[key] = deepMerge(b, e);
        else out[key] = typeof e === typeof b ? e : b;
    }
    return out;
}

function loadSettings() {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (raw) return deepMerge(DEFAULT_SETTINGS, JSON.parse(raw));
    } catch (e) { /* ignora: usa o padrão */ }
    return clone(DEFAULT_SETTINGS);
}

function persistSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) { /* ignora */ }
}

function resolveTheme(theme) {
    if (theme === 'auto') return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    return theme === 'light' ? 'light' : 'dark';
}

let settings = loadSettings();
let draft = clone(settings);

let attendees = loadAttendees();
let editingId = null;

const FEEDBACK_KEY = 'aws-events-feedback-v1';
let feedbacks = loadFeedbacks();

// ---------- Utilitários ----------
const $ = (id) => document.getElementById(id);

function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
}

function normalize(text) {
    return String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function onlyDigits(text) {
    return String(text).replace(/\D/g, '');
}

function maskCPF(value) {
    let v = onlyDigits(value).slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    return v;
}

// Formatador automático de CPF (usado nos campos via oninput)
function formatCPF(input) {
    input.value = maskCPF(input.value);
}

function formatDateBR(iso) {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
}

function refreshIcons() {
    if (window.lucide) lucide.createIcons();
}

function toast(message, type = 'info', force = false) {
    // Erros sempre aparecem; os demais respeitam a opção "Exibir avisos"
    if (!force && type !== 'error' && !settings.notif.toasts) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    const icon = type === 'ok' ? 'circle-check' : type === 'error' ? 'circle-alert' : 'info';
    el.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4 shrink-0"></i><span>${esc(message)}</span>`;
    $('toast-area').appendChild(el);
    refreshIcons();
    if (settings.notif.sound) playBeep(type);
    setTimeout(() => el.remove(), settings.notif.duration * 1000);
}

// ---------- Persistência (localStorage, com fallback em memória) ----------
function loadAttendees() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const data = JSON.parse(raw);
            if (Array.isArray(data)) return data;
        }
    } catch (e) { /* ignora: usa dados de exemplo */ }
    return DEFAULT_ATTENDEES.map((a) => ({ ...a }));
}

function saveAttendees() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(attendees)); } catch (e) { /* ignora */ }
}

function resetData() {
    if (!confirm('Restaurar a lista de inscritos de exemplo? As alterações feitas serão perdidas.')) return;
    attendees = DEFAULT_ATTENDEES.map((a) => ({ ...a }));
    editingId = null;
    saveAttendees();
    renderTable();
    populateCertificatesDropdown();
    toast('Dados de exemplo restaurados.', 'ok');
}

// ---------- Navegação entre abas ----------
function switchTab(tabId) {
    const meta = TAB_META[tabId];
    if (!meta) return;

    // Saindo da aba Configurações com alterações pendentes: descarta a pré-visualização
    if (document.body.dataset.tab === 'configuracoes' && tabId !== 'configuracoes' && isDirty()) {
        discardSettings(true);
        toast('Alterações não salvas foram descartadas.', 'info', true);
    }

    editingId = null;
    toggleAddPopover(false);
    toggleReportsPanel(false);

    // Antes o código buscava #tab-home (inexistente) e quebrava aqui, antes de marcar o menu como ativo
    const section = $(meta.placeholder ? 'tab-placeholder' : `tab-${tabId}`);
    if (!section) return;

    document.querySelectorAll('.tab-content').forEach((s) => s.classList.add('hidden'));
    section.classList.remove('hidden');
    document.body.dataset.tab = tabId;

    $('page-title').textContent = meta.title;
    document.title = `${meta.title} - ${settings.event.name}`;

    document.querySelectorAll('.top-link').forEach((b) => b.classList.toggle('active', b.dataset.nav === meta.nav));
    document.querySelectorAll('.rail-btn').forEach((b) => b.classList.toggle('active', b.dataset.rail === meta.rail));
    document.body.dataset.rail = meta.rail ? 'on' : 'off';

    if (meta.placeholder) $('placeholder-name').textContent = meta.placeholder;
    if (tabId === 'inscritos') renderTable();
    if (tabId === 'configuracoes') openConfigTab();
    if (tabId === 'certificados') populateCertificatesDropdown();
    if (tabId === 'home') startHero(); else stopHero();
    if (tabId === 'checkin') setTimeout(() => $('checkin-cpf').focus(), 0);

    window.scrollTo({ top: 0 });
}

// =========================================================
// ABA INSCRITOS
// =========================================================
function onSearch() {
    editingId = null; // evita perder campos em edição ao filtrar
    renderTable();
}

function actionButtons(a, editing) {
    const confirmed = a.status === 'Confirmado';
    return `
        <button type="button" onclick="startEdit(${a.id})" class="btn-row ${editing ? 'is-editing' : ''}">
            <i data-lucide="pencil"></i> Editar
        </button>
        <button type="button" onclick="openCertificate(${a.id})" class="btn-cert ${confirmed ? '' : 'is-disabled'}"
                title="${confirmed ? 'Emitir certificado' : 'Faça o check-in para liberar o certificado'}">
            <i data-lucide="file-check"></i> Certificado
        </button>`;
}

function displayCpf(cpf) {
    if (!settings.security.maskCpf) return cpf;
    const d = onlyDigits(cpf);
    return d.length === 11 ? `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**` : '***';
}

function displayEmail(email) {
    if (!settings.security.maskEmail) return email;
    const [local, domain] = String(email).split('@');
    return domain ? `${local[0] || ''}***@${domain}` : '***';
}

function rowView(a) {
    const confirmed = a.status === 'Confirmado';
    return `
        <tr>
            <td class="font-mono text-slate-300">${a.id}</td>
            <td>
                <div class="font-medium text-slate-50">${esc(a.name)}</div>
                <div class="text-[11px] font-mono text-slate-500">${esc(displayCpf(a.cpf))}</div>
            </td>
            <td class="text-slate-300">${esc(displayEmail(a.email))}</td>
            <td class="text-slate-200">
                ${esc(a.company)}
                ${a.sector ? `<div class="text-[11px] text-slate-500">${esc(a.sector)}</div>` : ''}
            </td>
            <td><span class="${confirmed ? 'status-ok' : 'status-pending'}">${esc(a.status)}</span></td>
            <td class="text-right whitespace-nowrap">${actionButtons(a, false)}</td>
        </tr>`;
}

function rowEdit(a) {
    return `
        <tr class="row-editing">
            <td class="font-mono text-slate-300 align-top pt-5">${a.id}</td>
            <td>
                <div class="edit-box">
                    <input type="text" id="edit-name" class="field" value="${esc(a.name)}" placeholder="Nome completo">
                    <input type="text" id="edit-cpf" class="field mt-2 font-mono" value="${esc(a.cpf)}" maxlength="14" inputmode="numeric" oninput="formatCPF(this)" placeholder="000.000.000-00">
                    <div class="flex items-center gap-1 mt-3">
                        <button type="button" class="btn-save" onclick="saveEdit(${a.id})">Salvar</button>
                        <button type="button" class="btn-ghost" onclick="cancelEdit()">Cancelar</button>
                        <button type="button" class="btn-danger ml-auto" onclick="deleteAttendee(${a.id})">Excluir</button>
                    </div>
                </div>
            </td>
            <td class="align-top pt-4"><input type="email" id="edit-email" class="field" value="${esc(a.email)}" placeholder="E-mail"></td>
            <td class="align-top pt-4">
                <input type="text" id="edit-company" class="field" value="${esc(a.company)}" placeholder="Empresa">
                <input type="text" id="edit-sector" class="field mt-2" value="${esc(a.sector || '')}" placeholder="Setor">
            </td>
            <td class="align-top pt-4">
                <select id="edit-status" class="field">
                    <option value="Pendente" ${a.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
                    <option value="Confirmado" ${a.status === 'Confirmado' ? 'selected' : ''}>Confirmado</option>
                </select>
            </td>
            <td class="text-right whitespace-nowrap align-top pt-4">${actionButtons(a, true)}</td>
        </tr>`;
}

function renderTable() {
    const query = normalize($('search-input').value.trim());
    const filtered = attendees.filter((a) =>
        normalize(`${a.name} ${a.email} ${a.company} ${a.sector || ''} ${a.cpf}`).includes(query)
    );

    const tbody = $('attendees-table-body');
    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-slate-400 !py-10">Nenhum inscrito encontrado.</td></tr>`;
    } else {
        tbody.innerHTML = filtered.map((a) => (a.id === editingId ? rowEdit(a) : rowView(a))).join('');
    }

    const present = attendees.filter((a) => a.status === 'Confirmado').length;
    $('table-summary').textContent =
        `${attendees.length} inscritos • ${present} confirmados • ${attendees.length - present} pendentes`;

    refreshIcons();
}

// Validação compartilhada por "adicionar" e "editar"
function validateAttendee(d, ignoreId) {
    if (!d.name.trim()) return 'Informe o nome completo.';
    if (onlyDigits(d.cpf).length !== 11) return 'Informe um CPF com 11 dígitos.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) return 'Informe um e-mail válido.';
    if (!d.company.trim()) return 'Informe a empresa.';
    const duplicate = attendees.some((a) => a.id !== ignoreId && onlyDigits(a.cpf) === onlyDigits(d.cpf));
    if (duplicate) return 'Já existe um inscrito com este CPF.';
    return null;
}

// --- Adicionar ---
function toggleAddPopover(force) {
    const pop = $('add-popover');
    if (!pop) return;
    const open = typeof force === 'boolean' ? force : pop.classList.contains('hidden');
    pop.classList.toggle('hidden', !open);
    if (open) {
        editingId = null;
        renderTable();
        $('add-name').focus();
    }
}

function handleAddAttendee(event) {
    event.preventDefault();
    if (!settings.event.registrationOpen) { toast('As inscrições estão encerradas. Reabra em Configurações > Sistema.', 'error'); return; }
    if (attendees.length >= settings.event.capacity) { toast(`Capacidade máxima de ${settings.event.capacity} inscritos atingida.`, 'error'); return; }
    const data = {
        name: $('add-name').value,
        cpf: $('add-cpf').value,
        email: $('add-email').value,
        company: $('add-company').value,
        sector: $('add-sector').value
    };
    const error = validateAttendee(data, null);
    if (error) { toast(error, 'error'); return; }

    const newId = attendees.length ? Math.max(...attendees.map((a) => a.id)) + 1 : 1001;
    attendees.push({
        id: newId,
        name: data.name.trim(),
        cpf: maskCPF(data.cpf),
        email: data.email.trim(),
        company: data.company.trim(),
        sector: data.sector.trim(),
        status: 'Pendente'
    });
    saveAttendees();

    $('add-popover').reset();
    toggleAddPopover(false);
    $('search-input').value = '';
    renderTable();
    populateCertificatesDropdown();
    if (settings.notif.newAttendee) toast(`${data.name.trim()} foi adicionado(a) à lista.`, 'ok');
}

// --- Editar (na própria linha) ---
function startEdit(id) {
    editingId = id;
    renderTable();
    const input = $('edit-name');
    if (input) { input.focus(); input.select(); }
}

function cancelEdit() {
    editingId = null;
    renderTable();
}

function saveEdit(id) {
    const data = {
        name: $('edit-name').value,
        cpf: $('edit-cpf').value,
        email: $('edit-email').value,
        company: $('edit-company').value,
        sector: $('edit-sector').value
    };
    const error = validateAttendee(data, id);
    if (error) { toast(error, 'error'); return; }

    const index = attendees.findIndex((a) => a.id === id);
    if (index === -1) return;
    attendees[index] = {
        id,
        name: data.name.trim(),
        cpf: maskCPF(data.cpf),
        email: data.email.trim(),
        company: data.company.trim(),
        sector: data.sector.trim(),
        status: $('edit-status').value
    };
    saveAttendees();
    editingId = null;
    renderTable();
    populateCertificatesDropdown();
    toast('Inscrito atualizado.', 'ok');
}

function deleteAttendee(id) {
    const a = attendees.find((x) => x.id === id);
    if (!a) return;
    if (settings.security.confirmDelete && !confirm(`Remover ${a.name} da lista de inscritos?`)) return;
    attendees = attendees.filter((x) => x.id !== id);
    saveAttendees();
    editingId = null;
    renderTable();
    populateCertificatesDropdown();
    toast('Inscrito removido.', 'ok');
}

// Enter salva, Esc cancela durante a edição
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        toggleAddPopover(false);
        toggleReportsPanel(false);
        if (editingId !== null) cancelEdit();
    }
    if (e.key === 'Enter' && editingId !== null && e.target.closest && e.target.closest('.row-editing') && e.target.tagName === 'INPUT') {
        e.preventDefault();
        saveEdit(editingId);
    }
});

// Clique fora fecha o pop-up de "Adicionar"
document.addEventListener('click', (e) => {
    const wrapper = $('add-wrapper');
    if (wrapper && !wrapper.contains(e.target)) toggleAddPopover(false);
});

// =========================================================
// ABA CHECK-IN
// =========================================================
function showCheckinAlert(type, html) {
    const box = $('checkin-alert');
    box.className = `alert-box alert-${type}`;
    box.innerHTML = html;
    refreshIcons();
}

function handleCheckIn(event) {
    event.preventDefault();
    const input = $('checkin-cpf');
    const digits = onlyDigits(input.value);

    if (!settings.event.checkinEnabled) {
        showCheckinAlert('error', `<i data-lucide="circle-alert" class="w-5 h-5 shrink-0"></i><span>O check-in está desabilitado. Ative em Configurações > Sistema.</span>`);
        return;
    }

    if (digits.length !== 11) {
        showCheckinAlert('error', `<i data-lucide="circle-alert" class="w-5 h-5 shrink-0"></i><span>Informe um CPF com 11 dígitos.</span>`);
        input.focus();
        return;
    }

    const attendee = attendees.find((a) => onlyDigits(a.cpf) === digits);

    if (!attendee) {
        showCheckinAlert('error', `<i data-lucide="circle-alert" class="w-5 h-5 shrink-0"></i><span>CPF não encontrado na lista de inscritos.</span>`);
    } else if (attendee.status === 'Confirmado') {
        showCheckinAlert('info', `<i data-lucide="info" class="w-5 h-5 shrink-0"></i><span>A presença de <strong>${esc(attendee.name)}</strong> já estava confirmada.</span>`);
    } else {
        attendee.status = 'Confirmado';
        saveAttendees();
        showCheckinAlert('success', `<i data-lucide="circle-check" class="w-5 h-5 shrink-0"></i><span>Presença confirmada com sucesso para <strong>${esc(attendee.name)}</strong>!</span>`);
        renderTable();
        populateCertificatesDropdown();
        if (settings.notif.checkin) toast(`Check-in registrado: ${attendee.name}.`, 'ok');
    }

    input.value = '';
    input.focus();
}

function cancelCheckIn() {
    $('checkin-cpf').value = '';
    $('checkin-alert').className = 'alert-box hidden';
    switchTab('inscritos');
}

// =========================================================
// ABA CERTIFICADOS
// =========================================================
function getSelectedEvent() {
    return EVENTS.find((e) => e.id === $('cert-event-select').value) || EVENTS[0];
}

function getSelectedAttendee() {
    const id = $('cert-participant-select').value;
    return attendees.find((a) => String(a.id) === id && a.status === 'Confirmado') || null;
}

function initCertificateForm() {
    const select = $('cert-event-select');
    select.innerHTML = EVENTS.map((e) => `<option value="${e.id}">${esc(e.name)}</option>`).join('');
    onEventChange();
}

// Ao trocar de evento, preenche data e tópicos (continuam editáveis)
function onEventChange() {
    const ev = getSelectedEvent();
    $('cert-date').value = ev.date;
    $('cert-topics').value = ev.topics;
    updateCertificatePreview();
}

// Lista só os confirmados; o campo de busca filtra a lista
function populateCertificatesDropdown(preferId) {
    const select = $('cert-participant-select');
    const previous = preferId !== undefined ? String(preferId) : select.value;
    const query = normalize($('cert-search').value.trim());

    const confirmed = attendees.filter((a) => a.status === 'Confirmado');
    const matches = confirmed.filter((a) => normalize(`${a.name} ${a.company} ${a.cpf}`).includes(query));

    if (matches.length === 0) {
        select.innerHTML = `<option value="">${confirmed.length === 0 ? 'Nenhum participante confirmado' : 'Nenhum resultado'}</option>`;
    } else {
        select.innerHTML = matches
            .map((a) => `<option value="${a.id}">${esc(a.name)} (${esc(a.company)})</option>`)
            .join('');
        if (matches.some((a) => String(a.id) === previous)) select.value = previous;
    }
    updateCertificatePreview();
}

function buildCertificateId(attendee, isoDate) {
    const datePart = (isoDate || new Date().toISOString().slice(0, 10)).replace(/-/g, '');
    return `${settings.cert.prefix}${datePart}${String(attendee.id).padStart(6, '0')}`;
}

function renderQR(text) {
    const img = $('preview-qr');
    if (!text || typeof qrcode !== 'function') {
        img.removeAttribute('src');
        img.style.visibility = 'hidden';
        return;
    }
    try {
        if (qrcode.stringToBytesFuncs && qrcode.stringToBytesFuncs['UTF-8']) {
            qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
        }
        const qr = qrcode(0, 'M');
        qr.addData(text);
        qr.make();
        img.src = qr.createDataURL(4, 0);
        img.style.visibility = 'visible';
    } catch (e) {
        img.style.visibility = 'hidden';
    }
}

function updateCertificatePreview() {
    const attendee = getSelectedAttendee();
    const ev = getSelectedEvent();
    const isoDate = $('cert-date').value;
    const dateBR = formatDateBR(isoDate);
    const topics = $('cert-topics').value.trim();

    $('preview-participant-name').textContent = attendee ? attendee.name : 'Nome do Participante';
    $('preview-event-name').textContent = ev.name;
    $('preview-date').textContent = dateBR || '--/--/----';
    $('preview-topics').textContent = topics || 'os temas do evento';
    $('preview-hours').textContent = settings.cert.useDefaultHours ? settings.cert.hours : ev.hours;

    if (attendee) {
        const certId = buildCertificateId(attendee, isoDate);
        $('preview-cert-id').textContent = certId;
        renderQR(`Certificado ${certId} | ${attendee.name} | ${ev.name} | ${dateBR}`);
    } else {
        $('preview-cert-id').textContent = '—';
        renderQR('');
    }
    $('preview-cert-date').textContent = dateBR || '—';
}

function emitCertificate() {
    const attendee = getSelectedAttendee();
    if (!attendee) { toast('Selecione um participante com presença confirmada.', 'error'); return; }
    updateCertificatePreview();
    $('certificate-print-area').scrollIntoView({ behavior: 'smooth', block: 'center' });
    toast(`Certificado emitido para ${attendee.name} (ID ${buildCertificateId(attendee, $('cert-date').value)}).`, 'ok');
}

// "Baixar PDF": abre a impressão já configurada; é só escolher "Salvar como PDF"
function downloadPDF() {
    const attendee = getSelectedAttendee();
    if (!attendee) { toast('Selecione um participante com presença confirmada.', 'error'); return; }
    updateCertificatePreview();

    const originalTitle = document.title;
    document.title = `Certificado - ${attendee.name}`; // vira o nome sugerido do arquivo
    const restore = () => { document.title = originalTitle; window.removeEventListener('afterprint', restore); };
    window.addEventListener('afterprint', restore);
    window.print();
}

// Botão "Certificado" da tabela de inscritos
function openCertificate(id) {
    const attendee = attendees.find((a) => a.id === id);
    if (!attendee) return;
    if (attendee.status !== 'Confirmado') {
        toast(`${attendee.name} ainda não fez check-in. Confirme a presença para liberar o certificado.`, 'error');
        return;
    }
    $('cert-search').value = '';
    switchTab('certificados');
    populateCertificatesDropdown(id);
}

// =========================================================
// ABA RELATÓRIOS (feedback lido pelo administrador após o evento)
// =========================================================
function loadFeedbacks() {
    try {
        const raw = localStorage.getItem(FEEDBACK_KEY);
        if (raw) {
            const data = JSON.parse(raw);
            if (Array.isArray(data)) return data;
        }
    } catch (e) { /* ignora: começa sem feedbacks */ }
    return [];
}

function saveFeedbacks() {
    try { localStorage.setItem(FEEDBACK_KEY, JSON.stringify(feedbacks)); } catch (e) { /* ignora */ }
}

function initFeedback() {
    $('fb-event').innerHTML = EVENTS.map((e) => `<option value="${e.id}">${esc(e.name)}</option>`).join('');
    updateFeedbackCounter();
    renderFeedbackList();
}

function updateFeedbackCounter() {
    $('fb-counter').textContent = `${$('fb-message').value.length}/1000`;
}

function handleFeedbackSubmit(event) {
    event.preventDefault();
    const message = $('fb-message').value.trim();
    if (!message) {
        toast('Escreva seu feedback antes de enviar.', 'error');
        $('fb-message').focus();
        return;
    }
    const ev = EVENTS.find((e) => e.id === $('fb-event').value) || EVENTS[0];
    feedbacks.push({
        id: feedbacks.length ? Math.max(...feedbacks.map((f) => f.id)) + 1 : 1,
        eventId: ev.id,
        eventName: ev.name,
        author: $('fb-author').value.trim(),
        message,
        createdAt: new Date().toISOString()
    });
    saveFeedbacks();

    $('feedback-form').reset();
    updateFeedbackCounter();
    renderFeedbackList();
    if (settings.notif.feedback) toast('Feedback enviado. O administrador poderá lê-lo após o evento.', 'ok');
}

function renderFeedbackList() {
    const list = [...feedbacks].sort((a, b) => b.id - a.id); // mais recentes primeiro
    $('reports-count').textContent = list.length;
    $('reports-count').classList.toggle('hidden', list.length === 0);
    $('reports-panel-title').textContent = `Feedbacks recebidos (${list.length})`;

    $('reports-list').innerHTML = list.length === 0
        ? `<div class="fb-empty"><i data-lucide="inbox"></i>Nenhum feedback enviado ainda.</div>`
        : list.map((f) => {
            const when = new Date(f.createdAt).toLocaleString(settings.ui.language, { dateStyle: 'short', timeStyle: 'short' });
            return `
            <article class="fb-item">
                <div class="fb-event">${esc(f.eventName)}</div>
                <p class="fb-msg">${esc(f.message)}</p>
                <div class="fb-meta">${esc(f.author || 'Anônimo')} • ${esc(when)}</div>
            </article>`;
        }).join('');
    refreshIcons();
}

function toggleReportsPanel(force) {
    const panel = $('reports-panel');
    if (!panel) return;
    const open = typeof force === 'boolean' ? force : panel.classList.contains('hidden');
    panel.classList.toggle('hidden', !open);
    $('reports-toggle').setAttribute('aria-expanded', String(open));
    $('reports-toggle-label').textContent = open ? 'Fechar relatórios' : 'Abrir relatórios';
    if (open) renderFeedbackList();
}

// =========================================================
// ABA HOME (carrossel de eventos passados)
// Para usar fotos reais, salve os arquivos na pasta img/ com os nomes abaixo
// (ou troque os caminhos). Sem a imagem, o degradê da slide aparece no lugar.
// =========================================================
const HOME_SLIDES = [
    { img: 'img/reinvent-2024.jpg', title: 'AWS re:Invent 2024', meta: 'Las Vegas • 2 a 6 de dezembro de 2024',   tint: 'linear-gradient(135deg,#1e1b4b,#4338ca 55%,#ff9900)' },
    { img: 'img/reinvent-2023.jpg', title: 'AWS re:Invent 2023', meta: 'Las Vegas • 27 de novembro a 1 de dezembro de 2023', tint: 'linear-gradient(135deg,#0c4a6e,#0ea5e9 55%,#6366f1)' },
    { img: 'img/reinvent-2022.jpg', title: 'AWS re:Invent 2022', meta: 'Las Vegas • novembro e dezembro de 2022', tint: 'linear-gradient(135deg,#312e81,#7c3aed 55%,#fb923c)' },
    { img: 'img/summit-sao-paulo.jpg', title: 'AWS Summit São Paulo', meta: 'Evento anual da AWS no Brasil',   tint: 'linear-gradient(135deg,#064e3b,#10b981 55%,#38bdf8)' }
];

let heroIndex = 0;
let heroTimer = null;

function initHome() {
    $('hero-slides').innerHTML = HOME_SLIDES.map((s, i) =>
        `<div class="hero-slide" style="background-image:url('${s.img}'),${s.tint}" aria-hidden="${i !== 0}"></div>`
    ).join('');
    $('hero-dots').innerHTML = HOME_SLIDES.map((s, i) =>
        `<button type="button" class="hero-dot" onclick="goToSlide(${i})" aria-label="Ir para ${esc(s.title)}"></button>`
    ).join('');
    showSlide(0);
}

function showSlide(i) {
    const n = HOME_SLIDES.length;
    heroIndex = (i + n) % n;
    document.querySelectorAll('.hero-slide').forEach((el, k) => {
        el.classList.toggle('is-active', k === heroIndex);
        el.setAttribute('aria-hidden', k !== heroIndex);
    });
    document.querySelectorAll('.hero-dot').forEach((el, k) => el.classList.toggle('is-active', k === heroIndex));
    $('hero-caption-title').textContent = HOME_SLIDES[heroIndex].title;
    $('hero-caption-meta').textContent = HOME_SLIDES[heroIndex].meta;
}

function goToSlide(i) { showSlide(i); startHero(); }

function startHero() {
    stopHero();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || settings.ui.reduceMotion) return;
    heroTimer = setInterval(() => showSlide(heroIndex + 1), 5500);
}

function stopHero() { clearInterval(heroTimer); heroTimer = null; }

// =========================================================
// ABA CONFIGURAÇÕES
// Rascunho (draft) é editado no formulário; "Salvar" confirma.
// Opções visuais (tema, tamanhos, cor) são pré-visualizadas ao vivo.
// =========================================================
const PANE_SECTIONS = {
    sistema: ['ui', 'event'], perfil: ['profile'], email: ['email'],
    certificado: ['cert'], notificacoes: ['notif'], seguranca: ['security']
};

function applyUI(ui) {
    const root = document.documentElement;
    const theme = resolveTheme(ui.theme);
    const acc = ACCENTS[ui.accent] || ACCENTS.orange;

    root.dataset.theme = theme;
    root.dataset.contrast = ui.highContrast ? 'high' : 'normal';
    root.dataset.motion = ui.reduceMotion ? 'reduce' : 'normal';
    root.dataset.fx = ui.bgEffects ? 'on' : 'off';
    root.dataset.density = ui.density;
    root.lang = ui.language;
    root.style.fontSize = `${ui.text}px`;
    root.style.setProperty('--hud-zoom', String(Number(ui.hud) / 100));
    root.style.setProperty('--aws-orange', acc.main);
    root.style.setProperty('--aws-orange-soft', theme === 'light' ? acc.light : acc.soft);
    root.style.setProperty('--on-accent', acc.on);

    if (ui.reduceMotion) stopHero();
    else if (document.body.dataset.tab === 'home') startHero();
}

function currentUI() {
    return (document.body.dataset.tab === 'configuracoes' ? draft : settings).ui;
}

function shortName(full) {
    const parts = String(full).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'Usuário';
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

function initials(full) {
    const parts = String(full).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function fillAvatar(el, profile) {
    if (profile.avatar) {
        el.innerHTML = `<img src="${esc(profile.avatar)}" alt="" class="w-full h-full object-cover">`;
    } else {
        el.textContent = initials(profile.name);
    }
}

function applyProfile(p) {
    fillAvatar($('user-avatar'), p);
    $('user-name').textContent = shortName(p.name);
    $('user-role').textContent = p.role;
}

function applyCertificateSettings() {
    const c = settings.cert;
    $('sig1-name').textContent = c.sign1Name;
    $('sig1-role').textContent = c.sign1Role;
    $('sig2-name').textContent = c.sign2Name;
    $('sig2-role').textContent = c.sign2Role;
    $('certificate-print-area').classList.toggle('no-qr', !c.qr);
}

function applyToastPosition() {
    $('toast-area').dataset.pos = settings.notif.position;
}

function applyAll() {
    applyUI(settings.ui);
    applyProfile(settings.profile);
    applyCertificateSettings();
    applyToastPosition();
}

// ---------- Formulário <-> rascunho ----------
const getPath = (obj, path) => path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
function setPath(obj, path, value) {
    const keys = path.split('.');
    const last = keys.pop();
    keys.reduce((o, k) => o[k], obj)[last] = value;
}

function loadForm() {
    document.querySelectorAll('#cfg-panel [data-cfg]').forEach((el) => {
        const v = getPath(draft, el.dataset.cfg);
        if (el.type === 'checkbox') el.checked = !!v;
        else if (el.type === 'radio') el.checked = String(v) === el.value;
        else el.value = v ?? '';
    });
    refreshProfileCard();
    refreshDirty();
    if (!$('cfg-mail-preview').classList.contains('hidden')) renderMailPreview();
}

function onCfgInput(e) {
    const el = e.target.closest('[data-cfg]');
    if (!el) return;
    if (el.type === 'radio' && !el.checked) return;

    let value;
    if (el.type === 'checkbox') value = el.checked;
    else if (el.dataset.type === 'number') value = el.value === '' ? '' : Number(el.value);
    else value = el.value;
    setPath(draft, el.dataset.cfg, value);

    if (el.dataset.cfg.startsWith('ui.')) applyUI(draft.ui);
    if (el.dataset.cfg.startsWith('profile.')) refreshProfileCard();
    if (!$('cfg-mail-preview').classList.contains('hidden')) renderMailPreview();
    refreshDirty();
}

function isDirty() {
    return JSON.stringify(draft) !== JSON.stringify(settings);
}

function refreshDirty() {
    const dirty = isDirty();
    $('cfg-dirty').classList.toggle('hidden', !dirty);
    // Rodapé (Salvar / Descartar) só aparece enquanto houver alterações pendentes
    $('cfg-footer').classList.toggle('is-clean', !dirty);
    document.querySelectorAll('.cfg-tab').forEach((tab) => {
        const changed = PANE_SECTIONS[tab.dataset.cfgTab].some(
            (s) => JSON.stringify(draft[s]) !== JSON.stringify(settings[s])
        );
        tab.classList.toggle('changed', changed);
    });
}

function showCfgPane(name) {
    document.querySelectorAll('.cfg-pane').forEach((p) => p.classList.toggle('hidden', p.dataset.pane !== name));
    document.querySelectorAll('.cfg-tab').forEach((t) => {
        const on = t.dataset.cfgTab === name;
        t.classList.toggle('active', on);
        t.setAttribute('aria-selected', String(on));
    });
}

function openSettings(pane) {
    switchTab('configuracoes');
    if (pane) showCfgPane(pane);
}

// Chamado pelo switchTab ao entrar na aba
function openConfigTab() {
    draft = clone(settings);
    loadForm();
    refreshIcons();
}

// ---------- Perfil ----------
function refreshProfileCard() {
    fillAvatar($('cfg-avatar'), draft.profile);
    $('cfg-profile-name').textContent = draft.profile.name || 'Seu nome';
    $('cfg-profile-role').textContent = [draft.profile.role, draft.profile.company].filter(Boolean).join(' • ');
}

function handleAvatarFile(input) {
    const file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast('Escolha um arquivo de imagem.', 'error'); return; }
    if (file.size > 8 * 1024 * 1024) { toast('A imagem deve ter até 8 MB.', 'error'); return; }

    const reader = new FileReader();
    reader.onload = () => {
        const img = new Image();
        img.onload = () => {
            // Recorta o centro em quadrado e reduz, para caber no armazenamento local
            const size = 160;
            const canvas = document.createElement('canvas');
            canvas.width = canvas.height = size;
            const side = Math.min(img.width, img.height);
            canvas.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
            draft.profile.avatar = canvas.toDataURL('image/jpeg', 0.85);
            refreshProfileCard();
            refreshDirty();
        };
        img.onerror = () => toast('Não foi possível ler a imagem.', 'error');
        img.src = reader.result;
    };
    reader.readAsDataURL(file);
}

function removeAvatar() {
    draft.profile.avatar = '';
    refreshProfileCard();
    refreshDirty();
}

// ---------- E-mail: modelo e pré-visualização ----------
function renderTemplate(tpl, vars) {
    return String(tpl).replace(/\{(nome|evento|data|local)\}/g, (_, k) => vars[k]);
}

function renderMailPreview() {
    const box = $('cfg-mail-preview');
    const vars = {
        nome: 'Ana Paula Silva',
        evento: draft.event.name,
        data: formatDateBR(draft.event.start) || '--/--/----',
        local: draft.event.location || 'a definir'
    };
    box.innerHTML = `
        <div class="text-xs text-muted mb-2">
            <div><strong>De:</strong> ${esc(draft.email.sender)}</div>
            <div><strong>Para:</strong> anapsilva@email.com</div>
            <div><strong>Assunto:</strong> ${esc(renderTemplate(draft.email.subject, vars))}</div>
        </div>
        <div>${esc(renderTemplate(draft.email.template, vars))}</div>`;
}

function toggleMailPreview() {
    const box = $('cfg-mail-preview');
    box.classList.toggle('hidden');
    if (!box.classList.contains('hidden')) renderMailPreview();
}

function insertTemplateVar(token) {
    const ta = $('cfg-mail-template');
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? ta.value.length;
    ta.setRangeText(token, start, end, 'end');
    ta.focus();
    draft.email.template = ta.value;
    if (!$('cfg-mail-preview').classList.contains('hidden')) renderMailPreview();
    refreshDirty();
}

// ---------- Notificações ----------
function testNotification() {
    // Usa o rascunho atual para o usuário ouvir/ver como ficará
    const backup = settings.notif;
    settings.notif = draft.notif;
    applyToastPosition();
    toast('Assim os avisos vão aparecer.', 'ok', true);
    settings.notif = backup;
}

let audioCtx = null;
function playBeep(type) {
    try {
        audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = type === 'error' ? 220 : type === 'ok' ? 880 : 660;
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.18);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    } catch (e) { /* sem áudio disponível */ }
}

// ---------- Salvar / descartar / restaurar ----------
function trimSettings(s) {
    ['profile', 'event', 'email', 'cert'].forEach((sec) => {
        Object.keys(s[sec]).forEach((k) => {
            if (typeof s[sec][k] === 'string' && k !== 'avatar') {
                s[sec][k] = k === 'template' ? s[sec][k].trimEnd() : s[sec][k].trim();
            }
        });
    });
    return s;
}

function validateSettings(s) {
    const mailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const fail = (pane, field, message) => ({ pane, field, message });

    if (!s.profile.name.trim()) return fail('perfil', 'profile.name', 'Informe o seu nome.');
    if (s.profile.email.trim() && !mailRx.test(s.profile.email.trim())) return fail('perfil', 'profile.email', 'O e-mail do perfil é inválido.');
    if (!s.event.name.trim()) return fail('sistema', 'event.name', 'Informe o nome do evento principal.');
    if (s.event.start && s.event.end && s.event.end < s.event.start) return fail('sistema', 'event.end', 'A data de término deve ser igual ou posterior à de início.');
    if (!Number.isInteger(s.event.capacity) || s.event.capacity < 1 || s.event.capacity > 100000) return fail('sistema', 'event.capacity', 'A capacidade deve ser um número inteiro entre 1 e 100.000.');
    if (!mailRx.test(s.email.sender.trim())) return fail('email', 'email.sender', 'Informe um e-mail de remetente válido.');
    if (!s.email.subject.trim()) return fail('email', 'email.subject', 'Informe o assunto padrão.');
    if (!s.email.template.trim()) return fail('email', 'email.template', 'O modelo de e-mail não pode ficar vazio.');
    if (!/^[A-Za-z0-9_-]{0,20}$/.test(s.cert.prefix.trim())) return fail('certificado', 'cert.prefix', 'Use no prefixo só letras, números, hífen e sublinhado (até 20 caracteres).');
    if (!Number.isInteger(s.cert.hours) || s.cert.hours < 1 || s.cert.hours > 99) return fail('certificado', 'cert.hours', 'A carga horária deve ser um número inteiro entre 1 e 99.');
    return null;
}

function saveSettings(event) {
    event.preventDefault();
    const candidate = trimSettings(clone(draft));
    const problem = validateSettings(candidate);
    if (problem) {
        showCfgPane(problem.pane);
        const el = document.querySelector(`[data-cfg="${problem.field}"]`);
        if (el) el.focus();
        toast(problem.message, 'error');
        return;
    }

    settings = candidate;
    draft = clone(settings);
    persistSettings();
    applyAll();
    loadForm();

    // Atualiza as telas que dependem das opções
    $('page-title').textContent = TAB_META.configuracoes.title;
    document.title = `${TAB_META.configuracoes.title} - ${settings.event.name}`;
    renderTable();
    updateCertificatePreview();
    toast('Configurações salvas com sucesso.', 'ok', true);
}

function discardSettings(silent = false) {
    draft = clone(settings);
    applyUI(settings.ui);
    loadForm();
    if (!silent) toast('Alterações descartadas.', 'info', true);
}

function resetSettings() {
    if (!confirm('Restaurar todas as configurações para o padrão? Você ainda precisará clicar em Salvar Alterações.')) return;
    draft = clone(DEFAULT_SETTINGS);
    applyUI(draft.ui);
    loadForm();
    toast('Padrões carregados. Clique em Salvar Alterações para confirmar.', 'info', true);
}

function clearAllData() {
    if (!confirm('Apagar inscritos, feedbacks e configurações deste navegador? Esta ação não pode ser desfeita.')) return;
    try {
        [STORAGE_KEY, FEEDBACK_KEY, SETTINGS_KEY].forEach((k) => localStorage.removeItem(k));
    } catch (e) { /* ignora */ }
    location.reload();
}

// ---------- Exportar / importar ----------
function downloadFile(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportAttendeesCSV() {
    const cell = (v) => {
        let t = String(v ?? '');
        if (/^[=+\-@]/.test(t)) t = `'${t}`; // evita execução de fórmulas no Excel
        return `"${t.replace(/"/g, '""')}"`;
    };
    const rows = [['ID', 'Nome', 'CPF', 'E-mail', 'Empresa', 'Setor', 'Status']]
        .concat(attendees.map((a) => [a.id, a.name, a.cpf, a.email, a.company, a.sector || '', a.status]));
    const csv = '\uFEFF' + rows.map((r) => r.map(cell).join(';')).join('\r\n');
    downloadFile('inscritos.csv', csv, 'text/csv;charset=utf-8');
    toast(`${attendees.length} inscritos exportados.`, 'ok');
}

function exportSettings() {
    downloadFile('configuracoes-eventos.json', JSON.stringify(settings, null, 2), 'application/json');
    toast('Configurações exportadas.', 'ok');
}

function importSettings(input) {
    const file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const merged = deepMerge(DEFAULT_SETTINGS, JSON.parse(reader.result));
            draft = merged;
            applyUI(draft.ui);
            loadForm();
            toast('Configurações importadas. Revise e clique em Salvar Alterações.', 'info', true);
        } catch (e) {
            toast('Arquivo inválido. Use um JSON exportado por esta tela.', 'error');
        }
    };
    reader.readAsText(file);
}

function initSettings() {
    applyAll();
    const panel = $('cfg-panel');
    panel.addEventListener('input', onCfgInput);
    panel.addEventListener('change', onCfgInput);
    // No tema "automático", acompanha o sistema operacional
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyUI(currentUI()));
}

// ---------- Inicialização ----------
document.addEventListener('DOMContentLoaded', () => {
    initSettings();
    initCertificateForm();
    populateCertificatesDropdown();
    initHome();
    initFeedback();
    switchTab('home');
    refreshIcons();

    const hero = document.querySelector('.hero');
    hero.addEventListener('mouseenter', stopHero);
    hero.addEventListener('mouseleave', () => { if (document.body.dataset.tab === 'home') startHero(); });
});
