pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let protocols = [];
let pdfText = '';
let currentFilter = 'all';
let lastLoadedFile = null;

const protocolHints = {
    'IP': 'Оборудование должно уметь работать с IP-адресами. Основа всей IP-сети.',
    'ARP': 'Оборудование должно уметь преобразовывать IP в MAC-адреса.',
    'VLAN': 'Оборудование должно уметь разделять сеть на изолированные сегменты.',
    'QinQ': 'Оборудование должно уметь делать двойное VLAN-тегирование.',
    'ICMP-PING': 'Оборудование должно уметь отвечать на ICMP-запросы. Команда ping — первое что делает инженер.',
    'TRACE-ROUTE': 'Оборудование должно уметь показывать маршрут прохождения пакетов.',
    'DHCP': 'Оборудование должно уметь автоматически получать IP от сервера.',
    'DHCP-SERVER': 'Оборудование должно уметь само раздавать IP-адреса.',
    'DHCP-Client': 'Оборудование должно уметь автоматически получать IP-адрес.',
    'DHCP-RELAY': 'Оборудование должно уметь перенаправлять DHCP-запросы.',
    'DHCP-Snooping': 'Оборудование должно уметь фильтровать недоверенные DHCP-ответы.',
    'DHCP IP Anti-Spoofing': 'Оборудование должно уметь проверять соответствие IP и MAC.',
    'IGMP': 'Оборудование должно уметь управлять групповыми рассылками.',
    'IGMP-SNOOPING': 'Оборудование должно уметь анализировать IGMP-запросы.',
    'IGMP FAST Leave': 'Оборудование должно уметь мгновенно обрабатывать выход из мультикаст-группы.',
    'IGMP-PROXY': 'Оборудование должно уметь объединять мультикаст-запросы.',
    'IGMP V3': 'Оборудование должно уметь фильтровать мультикаст по источникам.',
    'UDP': 'Оборудование должно уметь обрабатывать быстрые разрозненные пакеты.',
    'TCP': 'Оборудование должно уметь устанавливать надежные соединения.',
    'RJ45': 'Оборудование должно уметь подключаться по медным портам.',
    'SFP': 'Оборудование должно уметь подключаться по оптическим трансиверам.',
    'SNMP': 'Оборудование должно уметь отдавать статистику через SNMP.',
    'HTTP-HTTPS': 'Оборудование должно уметь открывать защищенный веб-интерфейс.',
    'WEB': 'Оборудование должно уметь управляться через веб-интерфейс.'
};

function getHint(name, desc) {
    if (desc && desc.trim()) return desc;
    return protocolHints[name] || '📖 Пользовательский протокол';
}

document.addEventListener('DOMContentLoaded', () => {
    loadProtocols();
    initEventListeners();
    updateStats();
    const testDateInput = document.getElementById('testDate');
    if (testDateInput) testDateInput.valueAsDate = new Date();
});

function loadProtocols() {
    const saved = localStorage.getItem('protocolsDictionary');
    if (saved) {
        const savedData = JSON.parse(saved);
        protocols = savedData.map(p => ({
            id: p.id, name: p.name, keywords: p.keywords, description: p.description || '',
            found: false, foundKeywords: []
        }));
    } else {
     protocols = [
    { id: 1, name: 'IP', keywords: ['IPV4','IP','Internet Protocol'] },
    { id: 2, name: 'ARP', keywords: ['ARP', 'Address Resolution Protocol','IPV4','IP'] },
    { id: 3, name: 'VLAN', keywords: ['VLAN', 'Virtual LAN', '802.1Q', "Vxlan"] },
    { id: 4, name: 'QinQ', keywords: ['QINQ', 'Q-IN-Q', 'Q in Q', 'Vlan stacking', '802.1ad'] },
    { id: 5, name: 'ICMP-PING', keywords: ['ICMP', 'Internet Control Message Protocol', ' ping'] },
    { id: 6, name: 'DHCP', keywords: ['DHCP', 'Dynamic Host Configuration Protocol', 'DHCP-сервер','DHCP-client', 'DHCP-клиент','BOOTP','Dynamic Ip Allocation'] },
    { id: 7, name: 'DHCP-SERVER', keywords: ['DHCP-SERVER', 'DHCP SERVER', 'DHCP сервер', 'DHCP-сервер'] },
    { id: 8, name: 'DHCP-Client', keywords: ['DHCP-CLIENT', 'DHCP CLIENT', 'DHCP клиент', 'DHCP-клиент'] },
    { id: 9, name: 'DHCP-RELAY', keywords: ['DHCP-relay', 'dhcp relay'] },
    { id: 10, name: 'DHCP-Snooping', keywords: ['DHCP snooping', 'DHCP-snooping'] },
    { id: 11, name: 'DHCP IP Anti-Spoofing', keywords: ['bind', 'source-guard', 'source guard', 'Binding'] },
    { id: 12, name: 'RIP', keywords: ['RIP', 'Routing Information Protocol'] },
    { id: 13, name: 'IGMP ATTENTION', keywords: ['IGMP', 'multicast'] },
    { id: 14, name: 'IGMP-SNOOPING', keywords: ['IGMP-SNOOPING', 'IGMP SNOOPING', 'IGMP v1/v2/v3 Snooping'] },
    { id: 15, name: 'IGMP FAST Leave', keywords: ['IGMP FAST Leave', 'Fast Leave'] },
    { id: 16, name: 'IGMP-PROXY', keywords: ['IGMP-PROXY', 'IGMP PROXY'] },
    { id: 17, name: 'IGMP V3', keywords: ['IGMP V3','IGMP VERSION 3','IGMP VERSION 2, 3', 'IGMPv1/v2/v3', 'IGMP v1/v2/v3', 'IGMP v1/v2/v3 Snooping', 'IGMP-SNOOPING',
    'IGMP snooping',
    'IGMP v1/v2/v3 Snooping',
    'IGMPv1/v2/v3 Snooping',
    'IGMP v1/v2/v3 snooping',
    'IGMP Snooping v1/v2/v3',
    'IGMP snooping v1/v2/v3',
    'IGMP V1/V2/V3 Snooping',
    'snooping'] },
    { id: 18, name: 'UDP', keywords: ['UDP', 'User Datagram Protocol', 'SNMP', 'DHCP'] },
    { id: 19, name: 'TCP', keywords: ['TCP', 'Transmission Control Protocol', 'TELNET', 'SSH', 'HTTP', 'HTTPS', 'WEB'] },
    { id: 20, name: 'TRACE-ROUTE', keywords: ['traceroute', 'trace route', 'tracert',  'traceroute',
    'trace route', 'ttl',
    'time to live',
    'ttl expired',
    'ttl exceeded',
    'port unreachable',
    'icmp time exceeded',
    'path discovery',
    'hop',
    'route tracing'] },
    { id: 21, name: 'RJ45', keywords: ['RJ45','1000base-t','1000 base-t', 'ethernet', 'eth','copper'] },
    { id: 22, name: 'SFP', keywords: ['SFP','SFP+','1000 base-t','1000base-x', '10g', 'fiber'] },
    { id: 23, name: 'SNMP', keywords: ['SNMP', 'Simple Network Management Protocol', 'SNMP v1', 'SNMP v2', 'SNMP v3'] },
    { id: 24, name: 'HTTP-HTTPS', keywords: ['HTTP', 'Hypertext Transfer Protocol', 'HTTP Secure', 'SSL', 'TLS', 'WEB', 'ВЕБ', 'ВЭБ'] },
    { id: 25, name: 'WEB', keywords: ['HTTP','HTTPS','WEB'] }
];
    }
    updateStats();
    renderProtocolsGrid();
}

function saveProtocols() {
    const toSave = protocols.map(p => ({ id: p.id, name: p.name, keywords: p.keywords, description: p.description || '' }));
    localStorage.setItem('protocolsDictionary', JSON.stringify(toSave));
}

function openAddModal() {
    document.getElementById('addProtocolModal').classList.remove('hidden');
}

function closeAddModal() {
    document.getElementById('addProtocolModal').classList.add('hidden');
    document.getElementById('newProtocolName').value = '';
    document.getElementById('newProtocolKeywords').value = '';
    document.getElementById('newProtocolDesc').value = '';
}

function addProtocol() {
    const name = document.getElementById('newProtocolName').value.trim();
    const keywordsStr = document.getElementById('newProtocolKeywords').value.trim();
    const desc = document.getElementById('newProtocolDesc').value.trim();
    
    if (!name) { alert('Введите название'); return; }
    if (!keywordsStr) { alert('Введите ключевые слова'); return; }
    if (protocols.some(p => p.name.toLowerCase() === name.toLowerCase())) { alert('Такой протокол уже есть'); return; }
    
    const keywords = keywordsStr.split(',').map(k => k.trim()).filter(k => k);
    const newId = Math.max(...protocols.map(p => p.id), 0) + 1;
    
    protocols.push({ id: newId, name: name, keywords: keywords, description: desc, found: false, foundKeywords: [] });
    saveProtocols();
    closeAddModal();
    renderProtocolsGrid();
    updateStats();
    showNotification(`✅ Протокол "${name}" добавлен`);
}

function cleanText(text) {
    if (!text) return '';
    let cleaned = text;
    cleaned = cleaned.replace(/https?:\/\/[^\s<>"'\]]+/gi, '');
    cleaned = cleaned.replace(/www\.[^\s<>"'\]]+/gi, '');
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/gi, '$1');
    cleaned = cleaned.replace(/<a\s+[^>]*>([^<]*)<\/a>/gi, '$1');
    cleaned = cleaned.replace(/\b[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:\/[^\s]*)?\b/gi, '');
    cleaned = cleaned.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '');
    cleaned = cleaned.replace(/[^\w\s\u0400-\u04FF\-\.]/g, ' ');
    cleaned = cleaned.replace(/\s+/g, ' ');
    return cleaned.trim();
}

function resetResults(keepText = false) {
    protocols.forEach(p => { p.found = false; p.foundKeywords = []; });
    if (!keepText) {
        pdfText = '';
        document.getElementById('manualText').value = '';
        lastLoadedFile = null;
    }
    renderProtocolsGrid();
    updateStats();
    if (!keepText) showNotification('Результаты сброшены');
}

function fullReset() { resetResults(false); }

function analyzeText(text) {
    if (!text || !text.trim()) { showNotification('Нет текста для анализа'); return; }
    const clean = cleanText(text).toLowerCase();
    
    protocols.forEach(p => {
        p.found = false;
        p.foundKeywords = [];
        for (const kw of p.keywords) {
            if (clean.includes(kw.toLowerCase())) {
                p.found = true;
                if (!p.foundKeywords.includes(kw)) p.foundKeywords.push(kw);
            }
        }
    });
    renderProtocolsGrid();
    updateStats();
    const foundCount = protocols.filter(p => p.found).length;
    showNotification(`Анализ завершен! Найдено ${foundCount} из ${protocols.length}`);
}

function renderProtocolsGrid() {
    const grid = document.getElementById('protocolsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    
    let filtered = protocols;
    if (currentFilter === 'found') filtered = protocols.filter(p => p.found);
    if (currentFilter === 'notFound') filtered = protocols.filter(p => !p.found);
    
    if (filtered.length === 0) {
        grid.innerHTML = '<div class="empty-state">📭 Нет протоколов для отображения</div>';
        return;
    }
    
    filtered.forEach(p => {
        const card = document.createElement('div');
        card.className = `protocol-card ${p.found ? 'found' : ''}`;
        card.setAttribute('data-id', p.id);
        
        const hint = getHint(p.name, p.description);
        const foundHtml = p.foundKeywords?.length ? `<div class="protocol-details"><strong>🔍 Найдено по:</strong> ${escapeHtml(p.foundKeywords.join(', '))}</div>` : '';
        
        card.innerHTML = `
            <h4 style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">
                <span>${escapeHtml(p.name)}</span>
                <span class="status ${p.found ? 'found' : 'not-found'}">${p.found ? '✓ Найден' : '✗ Не найден'}</span>
            </h4>
            <div class="keywords"><strong>📝 Ключевые слова:</strong><br>${escapeHtml(p.keywords.join(', '))}</div>
            <div class="protocol-hint hidden" id="hint-${p.id}"><strong>💡 Подсказка:</strong><br>${escapeHtml(hint)}</div>
            ${foundHtml}
        `;
        grid.appendChild(card);
    });
    
    document.querySelectorAll('.protocol-card').forEach(card => {
        const id = card.getAttribute('data-id');
        const hintDiv = document.getElementById(`hint-${id}`);
        if (hintDiv) {
            card.onclick = (e) => {
                if (e.target.closest?.('.status')) return;
                hintDiv.classList.toggle('hidden');
            };
        }
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m] || m));
}

function updateStats() {
    const found = protocols.filter(p => p.found).length;
    const total = protocols.length;
    const percent = total ? Math.round((found / total) * 100) : 0;
    document.getElementById('foundCount').textContent = found;
    document.getElementById('totalCount').textContent = total;
    document.getElementById('matchPercent').textContent = `${percent}%`;
}

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    resetResults(true);
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) await parsePDF(file);
    else if (file.type === 'text/plain' || file.name.endsWith('.txt')) parseText(file);
    else alert('Загрузите PDF или TXT');
}

async function parsePDF(file) {
    showLoading(true);
    try {
        const ab = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            fullText += content.items.map(item => item.str).join(' ') + ' ';
            updateProgress(Math.round(i / pdf.numPages * 100));
        }
        pdfText = fullText;
        showLoading(false);
        analyzeText(pdfText);
        showNotification(`PDF загружен! ${pdf.numPages} страниц.`);
    } catch(e) { showLoading(false); alert('Ошибка PDF'); }
}

function parseText(file) {
    const reader = new FileReader();
    reader.onload = e => { pdfText = e.target.result; analyzeText(pdfText); showNotification('Файл загружен'); };
    reader.readAsText(file, 'UTF-8');
}

function parseManual() {
    const text = document.getElementById('manualText').value;
    if (!text.trim()) { alert('Введите текст'); return; }
    resetResults(true);
    pdfText = text;
    analyzeText(pdfText);
}

function showLoading(show) {
    const el = document.getElementById('pdfLoading');
    if (el) show ? el.classList.remove('hidden') : el.classList.add('hidden');
}

function updateProgress(p) { document.getElementById('progressText').textContent = `${p}%`; }

function showNotification(msg) {
    const n = document.createElement('div');
    n.className = 'notification-toast';
    n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3000);
}

function openTemplateModal() { document.getElementById('templateModal').classList.remove('hidden'); }
function closeTemplateModal() { document.getElementById('templateModal').classList.add('hidden'); }

function generateDocx() {
    try {
        const name = document.getElementById('deviceName')?.value || 'Не указано';
        const model = document.getElementById('deviceModel')?.value || 'Не указано';
        const vendor = document.getElementById('deviceVendor')?.value || 'Не указано';
        const date = document.getElementById('testDate')?.value || new Date().toISOString().slice(0,10);
        const comments = document.getElementById('deviceComments')?.value || '';
        const found = protocols.filter(p => p.found);
        const notFound = protocols.filter(p => !p.found);
        const percent = Math.round(found.length / protocols.length * 100);
        
        const zip = new JSZip();
        zip.file("[Content_Types].xml", `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`);
        zip.file("_rels/.rels", `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
        zip.file("word/_rels/document.xml.rels", `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`);
        
        let foundRows = '';
        found.forEach((p, i) => { foundRows += `<w:tr><w:tc><w:p><w:r><w:t>${i+1}</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>${escapeXml(p.name)}</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>${escapeXml(getHint(p.name, p.description))}</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>${p.foundKeywords ? p.foundKeywords.join(', ') : '-'}</w:t></w:r></w:p></w:tc></w:tr>`; });
        let notRows = '';
        notFound.forEach((p, i) => { notRows += `<w:tr><w:tc><w:p><w:r><w:t>${i+1}</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>${escapeXml(p.name)}</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>${escapeXml(p.keywords.join(', '))}</w:t></w:r></w:p></w:tc></w:tr>`; });
        
        let color = percent >= 80 ? '16A34A' : (percent >= 60 ? 'EAB308' : (percent >= 40 ? 'F97316' : 'EF4444'));
        
        const doc = `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
        <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="44"/><w:color w:val="5B21B6"/></w:rPr><w:t>📊 ОТЧЕТ О ПОДДЕРЖКЕ ПРОТОКОЛОВ</w:t></w:r></w:p>
        <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:i/><w:sz w:val="28"/><w:color w:val="8B5CF6"/></w:rPr><w:t>ProtoScan | ЦПЛ МЦК</w:t></w:r></w:p>
        <w:p><w:r><w:t> </w:t></w:r></w:p>
        <w:tbl><w:tblPr><w:tblW w:w="8000" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="C4B5FD"/><w:left w:val="single" w:sz="4" w:color="C4B5FD"/><w:bottom w:val="single" w:sz="4" w:color="C4B5FD"/><w:right w:val="single" w:sz="4" w:color="C4B5FD"/><w:insideH w:val="single" w:sz="4" w:color="E9D8FF"/><w:insideV w:val="single" w:sz="4" w:color="E9D8FF"/></w:tblBorders></w:tblPr>
        <w:tr><w:tc><w:tcW w:w="2500"/><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Параметр</w:t></w:r></w:p></w:tc><w:tc><w:tcW w:w="5500"/><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Значение</w:t></w:r></w:p></w:tc></w:tr>
        <w:tr><w:tc><w:p><w:r><w:t>Наименование</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>${escapeXml(name)}</w:t></w:r></w:p></w:tc></w:tr>
        <w:tr><w:tc><w:p><w:r><w:t>Модель</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>${escapeXml(model)}</w:t></w:r></w:p></w:tc></w:tr>
        <w:tr><w:tc><w:p><w:r><w:t>Производитель</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>${escapeXml(vendor)}</w:t></w:r></w:p></w:tc></w:tr>
        <w:tr><w:tc><w:p><w:r><w:t>Дата тестирования</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>${escapeXml(date)}</w:t></w:r></w:p></w:tc></w:tr>
        <w:tr><w:tc><w:p><w:r><w:t>Дата отчета</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>${escapeXml(new Date().toLocaleString('ru-RU'))}</w:t></w:r></w:p></w:tc></w:tr>
        ${comments ? `<w:tr><w:tc><w:p><w:r><w:t>Комментарии</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>${escapeXml(comments)}</w:t></w:r></w:p></w:tc></w:tr>` : ''}
        </w:tbl>
        <w:p><w:r><w:t> </w:t></w:r></w:p>
        <w:tbl><w:tblPr><w:tblW w:w="8000" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="C4B5FD"/><w:left w:val="single" w:sz="4" w:color="C4B5FD"/><w:bottom w:val="single" w:sz="4" w:color="C4B5FD"/><w:right w:val="single" w:sz="4" w:color="C4B5FD"/><w:insideH w:val="single" w:sz="4" w:color="E9D8FF"/><w:insideV w:val="single" w:sz="4" w:color="E9D8FF"/></w:tblBorders></w:tblPr>
        <w:tr><w:tc><w:tcW w:w="4000"/><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Показатель</w:t></w:r></w:p></w:tc><w:tc><w:tcW w:w="4000"/><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Результат</w:t></w:r></w:p></w:tc></w:tr>
        <w:tr><w:tc><w:p><w:r><w:t>Всего протоколов</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>${protocols.length}</w:t></w:r></w:p></w:tc></w:tr>
        <w:tr><w:tc><w:p><w:r><w:t>Поддерживаемые</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:rPr><w:color w:val="16A34A"/></w:rPr><w:t>${found.length}</w:t></w:r></w:p></w:tc></w:tr>
        <w:tr><w:tc><w:p><w:r><w:t>Не поддерживаемые</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:rPr><w:color w:val="EF4444"/></w:rPr><w:t>${notFound.length}</w:t></w:r></w:p></w:tc></w:tr>
        <w:tr><w:tc><w:p><w:r><w:t>Процент поддержки</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="${color}"/></w:rPr><w:t>${percent}%</w:t></w:r></w:p></w:tc></w:tr>
        </w:tbl>
        <w:p><w:r><w:t> </w:t></w:r></w:p>
        ${found.length ? `<w:p><w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>✅ ПОДДЕРЖИВАЕМЫЕ ПРОТОКОЛЫ</w:t></w:r></w:p><w:tbl><w:tblPr><w:tblW w:w="9000"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="86EFAC"/><w:left w:val="single" w:sz="4" w:color="86EFAC"/><w:bottom w:val="single" w:sz="4" w:color="86EFAC"/><w:right w:val="single" w:sz="4" w:color="86EFAC"/><w:insideH w:val="single" w:sz="4" w:color="DCFCE7"/><w:insideV w:val="single" w:sz="4" w:color="DCFCE7"/></w:tblBorders></w:tblPr><w:tr><w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>№</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Протокол</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Описание</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Найдено по</w:t></w:r></w:p></w:tc></w:tr>${foundRows}</w:tbl>` : ''}
        ${notFound.length ? `<w:p><w:r><w:t> </w:t></w:r></w:p><w:p><w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>❌ НЕ ПОДДЕРЖИВАЕМЫЕ ПРОТОКОЛЫ</w:t></w:r></w:p><w:tbl><w:tblPr><w:tblW w:w="9000"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="FCA5A5"/><w:left w:val="single" w:sz="4" w:color="FCA5A5"/><w:bottom w:val="single" w:sz="4" w:color="FCA5A5"/><w:right w:val="single" w:sz="4" w:color="FCA5A5"/><w:insideH w:val="single" w:sz="4" w:color="FEE2E2"/><w:insideV w:val="single" w:sz="4" w:color="FEE2E2"/></w:tblBorders></w:tblPr><w:tr><w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>№</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Протокол</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Ключевые слова</w:t></w:r></w:p></w:tc></w:tr>${notRows}</w:tbl>` : ''}
        <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:color w:val="A78BFA"/><w:i/></w:rPr><w:t>© 2026 ЦПЛ МЦК | ProtoScan</w:t></w:r></w:p>
        </w:body></w:document>`;
        zip.file("word/document.xml", doc);
        zip.generateAsync({ type: "blob" }).then(content => { saveAs(content, `Report_${model.replace(/[^a-z0-9]/gi, '_')}_${date}.docx`); closeTemplateModal(); showNotification('DOCX создан!'); });
    } catch(e) { alert('Ошибка: ' + e.message); }
}

function escapeXml(s) { if (!s) return ''; return s.toString().replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m] || m)); }

function initEventListeners() {
    document.getElementById('selectFileBtn')?.addEventListener('click', () => document.getElementById('fileInput').click());
    document.getElementById('fileInput')?.addEventListener('change', handleFileUpload);
    document.getElementById('parseTextBtn')?.addEventListener('click', parseManual);
    document.getElementById('exportDocxBtn')?.addEventListener('click', openTemplateModal);
    document.getElementById('resetAnalysisBtn')?.addEventListener('click', fullReset);
    document.getElementById('closeTemplateBtn')?.addEventListener('click', closeTemplateModal);
    document.getElementById('generateDocxBtn')?.addEventListener('click', generateDocx);
    document.getElementById('addProtocolBtn')?.addEventListener('click', openAddModal);
    document.getElementById('closeAddModalBtn')?.addEventListener('click', closeAddModal);
    document.getElementById('confirmAddProtocolBtn')?.addEventListener('click', addProtocol);
    
    // ГЛАВНОЕ — РАБОЧЕЕ УДАЛЕНИЕ ВСЕХ ДОБАВЛЕННЫХ ПРОТОКОЛОВ
    const forceDeleteBtn = document.getElementById('forceDeleteAllBtn');
    if (forceDeleteBtn) {
        forceDeleteBtn.addEventListener('click', () => {
            const userProtocols = protocols.filter(p => p.id > 25);
            const count = userProtocols.length;
            if (count === 0) {
                alert('❌ Нет добавленных протоколов для удаления');
                return;
            }
            if (confirm(`🗑 Удалить ВСЕ добавленные протоколы (${count} шт.)? Базовые 24 протокола останутся.`)) {
                protocols = protocols.filter(p => p.id <= 25);
                saveProtocols();
                renderProtocolsGrid();
                updateStats();
                showNotification(`✅ Удалено ${count} протоколов`);
            }
        });
    }
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.id === 'addProtocolBtn') return;
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.getAttribute('data-filter');
            renderProtocolsGrid();
        });
    });
    
    const drop = document.getElementById('dropArea');
    if (drop) {
        drop.addEventListener('dragover', e => { e.preventDefault(); drop.style.background = '#f5f0ff'; });
        drop.addEventListener('dragleave', () => { drop.style.background = '#faf7ff'; });
        drop.addEventListener('drop', e => { e.preventDefault(); drop.style.background = '#faf7ff'; const f = e.dataTransfer.files[0]; if (f) parsePDF(f); });
    }
}

if (!document.querySelector('#dynamic-styles')) {
    const s = document.createElement('style');
    s.id = 'dynamic-styles';
    s.textContent = `.protocol-hint{margin-top:12px;padding:12px;background:linear-gradient(135deg,#f3e8ff,#faf7ff);border-radius:12px;font-size:0.9em;color:#5a2d8c;border-left:3px solid #8b5cf6}.protocol-hint.hidden{display:none}.notification-toast{position:fixed;bottom:20px;right:20px;background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:#fff;padding:14px 28px;border-radius:50px;z-index:1000;animation:slideInRight 0.4s}.empty-state{text-align:center;padding:60px 20px;background:linear-gradient(135deg,#faf7ff,#f3eaff);border-radius:20px;color:#9b6ddf;grid-column:1/-1}@keyframes slideInRight{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}@keyframes slideOut{from{transform:translateX(0);opacity:1}to{transform:translateX(100%);opacity:0}}.badge-white{font-size:0.6em;background:linear-gradient(135deg,#8b5cf6,#7c3aed);padding:4px 12px;border-radius:50px;color:#fff;margin-left:8px}`;
    document.head.appendChild(s);
}