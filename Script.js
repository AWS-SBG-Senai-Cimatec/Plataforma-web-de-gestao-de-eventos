/* =========================================================
   AWS re:Invent 2024 - Gestão de Eventos
   Abas: Inscritos | Check-in | Certificados
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
    inscritos:     { title: 'AWS Events Manager | Gestão de Inscritos',  nav: 'inscritos',     rail: null },
    checkin:       { title: 'AWS Events Manager | Check-in Presencial',  nav: 'home',          rail: 'checkin' },
    certificados:  { title: 'AWS re:Invent | Emissão de Certificados',   nav: 'home',          rail: 'relatorios' },
    eventos:       { title: 'AWS Events Manager | Eventos',              nav: 'eventos',       rail: null,            placeholder: 'Eventos' },
    relatorios:    { title: 'AWS Events Manager | Relatórios',           nav: 'relatorios',    rail: null,            placeholder: 'Relatórios' },
    configuracoes: { title: 'AWS Events Manager | Configurações',        nav: 'configuracoes', rail: 'configuracoes', placeholder: 'Configurações' }
};

let attendees = loadAttendees();
let editingId = null;

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

function toast(message, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    const icon = type === 'ok' ? 'circle-check' : type === 'error' ? 'circle-alert' : 'info';
    el.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4 shrink-0"></i><span>${esc(message)}</span>`;
    $('toast-area').appendChild(el);
    refreshIcons();
    setTimeout(() => el.remove(), 3800);
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

    editingId = null;
    toggleAddPopover(false);

    document.querySelectorAll('.tab-content').forEach((s) => s.classList.add('hidden'));
    $(meta.placeholder ? 'tab-placeholder' : `tab-${tabId}`).classList.remove('hidden');

    $('page-title').textContent = meta.title;
    document.title = `${meta.title} - re:Invent 2024`;

    document.querySelectorAll('.top-link').forEach((b) => b.classList.toggle('active', b.dataset.nav === meta.nav));
    document.querySelectorAll('.rail-btn').forEach((b) => b.classList.toggle('active', b.dataset.rail === meta.rail));
    document.body.dataset.rail = meta.rail ? 'on' : 'off';

    if (meta.placeholder) $('placeholder-name').textContent = meta.placeholder;
    if (tabId === 'inscritos') renderTable();
    if (tabId === 'certificados') populateCertificatesDropdown();
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

function rowView(a) {
    const confirmed = a.status === 'Confirmado';
    return `
        <tr>
            <td class="font-mono text-slate-300">${a.id}</td>
            <td>
                <div class="font-medium text-slate-50">${esc(a.name)}</div>
                <div class="text-[11px] font-mono text-slate-500">${esc(a.cpf)}</div>
            </td>
            <td class="text-slate-300">${esc(a.email)}</td>
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
    toast(`${data.name.trim()} foi adicionado(a) à lista.`, 'ok');
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
    if (!a || !confirm(`Remover ${a.name} da lista de inscritos?`)) return;
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
    return `${datePart}${String(attendee.id).padStart(6, '0')}`;
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
    $('preview-hours').textContent = ev.hours;

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

// ---------- Inicialização ----------
document.addEventListener('DOMContentLoaded', () => {
    initCertificateForm();
    populateCertificatesDropdown();
    switchTab('inscritos');
    refreshIcons();
});
