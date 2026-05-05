// Инициализация pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// ==================== //
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ==================== //
let protocols = [];
let pdfText = '';
let currentFilter = 'all';
let lastLoadedFile = null;

// ==================== //
// ИНИЦИАЛИЗАЦИЯ
// ==================== //
document.addEventListener('DOMContentLoaded', function() {
    loadProtocols();
    initEventListeners();
    updateStats();
    
    const testDateInput = document.getElementById('testDate');
    if (testDateInput) {
        testDateInput.valueAsDate = new Date();
    }
});

// ==================== //
// ЗАГРУЗКА СЛОВАРЯ
// ==================== //
function loadProtocols() {
    const saved = localStorage.getItem('protocolsDictionary');
    if (saved) {
        const savedData = JSON.parse(saved);
        protocols = savedData.map(protocol => ({
            id: protocol.id,
            name: protocol.name,
            keywords: protocol.keywords,
            found: false,
            foundKeywords: []
        }));
    } else {
        protocols = [
            { id: 1, name: 'DHCP', keywords: ['DHCP', 'Dynamic Host Configuration Protocol', 'DHCP-сервер', 'DHCP-client', 'DHCP-клиент', 'BOOTP', 'Dynamic Ip Allocation', 'DHCP Client', 'DHCP Server'] },
            { id: 2, name: 'ICMP-PING', keywords: ['ICMP', 'Internet Control Message Protocol', 'ping', 'icmp ping', 'ping request', 'ping reply'] },
            { id: 3, name: 'RIP', keywords: ['RIP', 'Routing Information Protocol'] },
            { id: 4, name: 'UDP', keywords: ['UDP', 'User Datagram Protocol', 'SNMP', 'DHCP'] },
            { id: 5, name: 'TCP', keywords: ['TCP', 'Transmission Control Protocol', 'TELNET', 'SSH', 'HTTP', 'HTTPS', 'WEB'] },
            { id: 6, name: 'TRACE-ROUTE', keywords: ['traceroute', 'trace route', 'tracert'] },
            { id: 7, name: 'DHCP-RELAY', keywords: ['DHCP-relay', 'dhcp relay'] },
            { id: 8, name: 'SNMP', keywords: ['SNMP', 'Simple Network Management Protocol', 'SNMP v1', 'SNMP v2', 'SNMP v3'] },
            { id: 9, name: 'VLAN', keywords: ['VLAN', 'Virtual LAN', '802.1Q', 'Vxlan'] },
            { id: 10, name: 'QinQ', keywords: ['QINQ', 'Q-IN-Q', 'Q in Q', 'Vlan stacking', '802.1ad'] },
            { id: 11, name: 'HTTP-HTTPS', keywords: ['HTTP', 'Hypertext Transfer Protocol', 'HTTPS', 'HTTP Secure', 'SSL', 'TLS', 'WEB', 'ВЕБ', 'ВЭБ'] },
            { id: 12, name: 'DHCP-Snooping', keywords: ['DHCP snooping', 'DHCP-snooping'] },
            { id: 13, name: 'DHCP IP Anti-Spoofing', keywords: ['bind', 'source-guard', 'source guard', 'Binding'] },
            { id: 14, name: 'DHCP-SERVER', keywords: ['DHCP-SERVER', 'DHCP SERVER', 'DHCP сервер', 'DHCP-сервер'] },
            { id: 15, name: 'DHCP-Client', keywords: ['DHCP-CLIENT', 'DHCP CLIENT', 'DHCP клиент', 'DHCP-клиент'] },
            { id: 16, name: 'IGMP-SNOOPING', keywords: ['IGMP-SNOOPING', 'IGMP SNOOPING', 'IGMP v1/v2/v3 Snooping'] },
            { id: 17, name: 'IGMP FAST Leave', keywords: ['IGMP FAST Leave'] },
            { id: 18, name: 'IGMP ATTENTION', keywords: ['IGMP', 'multicast'] },
            { id: 19, name: 'ARP', keywords: ['ARP', 'Address Resolution Protocol', 'IPV4', 'IP'] },
            { id: 20, name: 'IGMP-PROXY', keywords: ['IGMP-PROXY', 'IGMP PROXY'] },
            { id: 21, name: 'IPv4', keywords: ['IPV4', 'IP', 'Internet Protocol'] },
            { id: 22, name: 'IGMP V3', keywords: ['IGMP V3', 'IGMP VERSION 3', 'IGMP VERSION 2, 3', 'IGMPv1/v2/v3'] },
            { id: 23, name: 'RJ45', keywords: ['RJ45', '1000base-t', '1000 base-t', 'ethernet', 'eth', 'copper'] },
            { id: 24, name: 'SFP', keywords: ['SFP', 'SFP+', '1000 base-t', '1000base-x', '10g', 'fiber'] },
            { id: 25, name: 'WEB', keywords: ['HTTP', 'HTTPS', 'WEB'] }
        ];
    }
    
    pdfText = '';
    lastLoadedFile = null;
    updateStats();
    renderProtocolsGrid();
}

function saveProtocols() {
    const protocolsToSave = protocols.map(protocol => ({
        id: protocol.id,
        name: protocol.name,
        keywords: protocol.keywords
    }));
    localStorage.setItem('protocolsDictionary', JSON.stringify(protocolsToSave));
}

// ==================== //
// ОЧИСТКА ТЕКСТА ОТ ССЫЛОК
// ==================== //
function cleanTextFromUrls(text) {
    if (!text) return '';
    
    let cleaned = text;
    
    cleaned = cleaned.replace(/https?:\/\/[^\s<>"'\]]+/gi, '');
    cleaned = cleaned.replace(/www\.[^\s<>"'\]]+/gi, '');
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/gi, '$1');
    cleaned = cleaned.replace(/<a\s+[^>]*>([^<]*)<\/a>/gi, '$1');
    cleaned = cleaned.replace(/\b[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:\/[^\s]*)?\b/gi, '');
    cleaned = cleaned.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '');
    cleaned = cleaned.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '');
    cleaned = cleaned.replace(/\bhttps?\b/gi, '');
    cleaned = cleaned.replace(/[^\w\s\u0400-\u04FF\-\.]/g, ' ');
    cleaned = cleaned.replace(/\s+/g, ' ');
    
    return cleaned.trim();
}

// ==================== //
// СБРОС РЕЗУЛЬТАТОВ
// ==================== //
function resetAnalysisResults(keepText = false) {
    protocols.forEach(protocol => {
        protocol.found = false;
        protocol.foundKeywords = [];
    });
    
    if (!keepText) {
        pdfText = '';
        const manualText = document.getElementById('manualText');
        if (manualText) manualText.value = '';
        lastLoadedFile = null;
    }
    
    renderProtocolsGrid();
    updateStats();
    
    if (!keepText) {
        showNotification('Результаты анализа сброшены');
    }
}

function fullReset() {
    resetAnalysisResults(false);
}

// ==================== //
// АНАЛИЗ ТЕКСТА
// ==================== //
function analyzeText(text) {
    if (!text || text.trim() === '') {
        showNotification('Нет текста для анализа');
        return;
    }
    
    let cleanText = cleanTextFromUrls(text);
    const lowerText = cleanText.toLowerCase();
    const words = lowerText.split(/\s+/).filter(word => word.length > 0);
    
    protocols.forEach(protocol => {
        protocol.found = false;
        protocol.foundKeywords = [];
        
        for (const keyword of protocol.keywords) {
            const lowerKeyword = keyword.toLowerCase();
            
            if (lowerKeyword.includes('http') || lowerKeyword.includes('www')) {
                continue;
            }
            
            if (lowerKeyword.length <= 4) {
                if (words.some(word => word === lowerKeyword)) {
                    protocol.found = true;
                    addFoundKeyword(protocol, keyword);
                }
            } else {
                const regex = new RegExp(`\\b${escapeRegExp(lowerKeyword)}\\b`, 'i');
                if (regex.test(cleanText)) {
                    protocol.found = true;
                    addFoundKeyword(protocol, keyword);
                }
            }
        }
    });
    
    renderProtocolsGrid();
    updateStats();
    
    const foundCount = protocols.filter(p => p.found).length;
    showNotification(`Анализ завершен! Найдено ${foundCount} протоколов из ${protocols.length}`);
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function addFoundKeyword(protocol, keyword) {
    if (!protocol.foundKeywords) protocol.foundKeywords = [];
    if (!protocol.foundKeywords.includes(keyword)) {
        protocol.foundKeywords.push(keyword);
    }
}

// ==================== //
// ОТОБРАЖЕНИЕ
// ==================== //
function renderProtocolsGrid() {
    const grid = document.getElementById('protocolsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    let filteredProtocols = protocols;
    if (currentFilter === 'found') {
        filteredProtocols = protocols.filter(p => p.found);
    } else if (currentFilter === 'notFound') {
        filteredProtocols = protocols.filter(p => !p.found);
    }
    
    if (filteredProtocols.length === 0) {
        grid.innerHTML = '<div class="empty-state">📭 Нет протоколов для отображения</div>';
        return;
    }
    
    filteredProtocols.forEach(protocol => {
        const card = document.createElement('div');
        card.className = `protocol-card ${protocol.found ? 'found' : ''}`;
        
        const keywordsHtml = protocol.foundKeywords && protocol.foundKeywords.length > 0 
            ? `<div class="protocol-details">
                 <strong>🔍 Найдено по:</strong> ${escapeHtml(protocol.foundKeywords.join(', '))}
               </div>`
            : '';
        
        card.innerHTML = `
            <h4>
                ${escapeHtml(protocol.name)}
                <span class="status ${protocol.found ? 'found' : 'not-found'}">
                    ${protocol.found ? '✓ Найден' : '✗ Не найден'}
                </span>
            </h4>
            <div class="keywords">
                <strong>📝 Ключевые слова:</strong><br>
                ${escapeHtml(protocol.keywords.join(', '))}
            </div>
            ${keywordsHtml}
        `;
        
        grid.appendChild(card);
    });
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function updateStats() {
    const foundCount = protocols.filter(p => p.found).length;
    const totalCount = protocols.length;
    const matchPercent = totalCount > 0 ? Math.round((foundCount / totalCount) * 100) : 0;
    
    const foundCountEl = document.getElementById('foundCount');
    const totalCountEl = document.getElementById('totalCount');
    const matchPercentEl = document.getElementById('matchPercent');
    
    if (foundCountEl) foundCountEl.textContent = foundCount;
    if (totalCountEl) totalCountEl.textContent = totalCount;
    if (matchPercentEl) matchPercentEl.textContent = `${matchPercent}%`;
}

// ==================== //
// ЗАГРУЗКА ФАЙЛОВ
// ==================== //
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    resetAnalysisResults(true);
    
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        await parsePDFFile(file);
    } else if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
        parseTextFile(file);
    } else {
        alert('Пожалуйста, загрузите PDF или TXT файл');
    }
}

async function parsePDFFile(file) {
    showLoading(true);
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;
        
        let fullText = '';
        
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            updateProgress(Math.round((pageNum / numPages) * 100));
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + ' ';
        }
        
        pdfText = fullText;
        lastLoadedFile = file;
        showLoading(false);
        analyzeText(pdfText);
        showNotification(`PDF успешно загружен! Проанализировано ${numPages} страниц.`);
        
    } catch (error) {
        showLoading(false);
        console.error('Ошибка при чтении PDF:', error);
        alert('Ошибка при чтении PDF файла. Убедитесь, что файл не поврежден.');
    }
}

function parseTextFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        pdfText = e.target.result;
        lastLoadedFile = file;
        analyzeText(pdfText);
        showNotification('Текстовый файл успешно загружен!');
    };
    reader.onerror = function() {
        alert('Ошибка при чтении файла');
    };
    reader.readAsText(file, 'UTF-8');
}

function parseManualText() {
    let text = document.getElementById('manualText').value;
    if (!text.trim()) {
        alert('Введите текст для анализа');
        return;
    }
    
    resetAnalysisResults(true);
    pdfText = text;
    lastLoadedFile = null;
    analyzeText(pdfText);
    showNotification('Текст проанализирован');
}

// ==================== //
// UI ВСПОМОГАТЕЛЬНЫЕ
// ==================== //
function showLoading(show) {
    const loading = document.getElementById('pdfLoading');
    if (loading) {
        if (show) {
            loading.classList.remove('hidden');
        } else {
            loading.classList.add('hidden');
        }
    }
}

function updateProgress(percent) {
    const progressText = document.getElementById('progressText');
    if (progressText) {
        progressText.textContent = `${percent}%`;
    }
}

function showNotification(message) {
    const oldNotifications = document.querySelectorAll('.notification-toast');
    oldNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = 'notification-toast';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==================== //
// ГЕНЕРАЦИЯ DOCX (КРАСИВЫЙ ВАРИАНТ)
// ==================== //
function openTemplateModal() {
    const modal = document.getElementById('templateModal');
    if (modal) modal.classList.remove('hidden');
}

function generateDocxReport() {
    try {
        const deviceName = document.getElementById('deviceName')?.value || 'Не указано';
        const deviceModel = document.getElementById('deviceModel')?.value || 'Не указано';
        const deviceVendor = document.getElementById('deviceVendor')?.value || 'Не указано';
        const testDate = document.getElementById('testDate')?.value || new Date().toISOString().slice(0, 10);
        const comments = document.getElementById('deviceComments')?.value || '';
        
        const foundProtocols = protocols.filter(p => p.found);
        const notFoundProtocols = protocols.filter(p => !p.found);
        const totalCount = protocols.length;
        const foundCount = foundProtocols.length;
        const percent = Math.round((foundCount / totalCount) * 100);
        
        const zip = new JSZip();
        
        zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
    <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`);

        zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

        zip.file("word/_rels/document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`);

        zip.file("word/styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:docDefaults>
        <w:rPrDefault>
            <w:rPr>
                <w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>
                <w:sz w:val="24"/>
            </w:rPr>
        </w:rPrDefault>
    </w:docDefaults>
</w:styles>`);

        let foundRows = '';
        foundProtocols.forEach((p, idx) => {
            foundRows += `
            <w:tr>
                <w:tc><w:tcW w:w="500" w:type="dxa"/><w:p><w:r><w:t>${idx + 1}</w:t></w:r></w:p></w:tc>
                <w:tc><w:tcW w:w="2500" w:type="dxa"/><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>${escapeXml(p.name)}</w:t></w:r></w:p></w:tc>
                <w:tc><w:tcW w:w="3500" w:type="dxa"/><w:p><w:r><w:t>${escapeXml(p.keywords.join(', '))}</w:t></w:r></w:p></w:tc>
                <w:tc><w:tcW w:w="2500" w:type="dxa"/><w:p><w:r><w:rPr><w:color w:val="16A34A"/></w:rPr><w:t>${p.foundKeywords ? escapeXml(p.foundKeywords.join(', ')) : '-'}</w:t></w:r></w:p></w:tc>
            </w:tr>`;
        });

        let notFoundRows = '';
        notFoundProtocols.forEach((p, idx) => {
            notFoundRows += `
            <w:tr>
                <w:tc><w:tcW w:w="500" w:type="dxa"/><w:p><w:r><w:t>${idx + 1}</w:t></w:r></w:p></w:tc>
                <w:tc><w:tcW w:w="3000" w:type="dxa"/><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>${escapeXml(p.name)}</w:t></w:r></w:p></w:tc>
                <w:tc><w:tcW w:w="5500" w:type="dxa"/><w:p><w:r><w:t>${escapeXml(p.keywords.join(', '))}</w:t></w:r></w:p></w:tc>
            </w:tr>`;
        });

        let percentColor = 'EF4444';
        if (percent >= 80) percentColor = '16A34A';
        else if (percent >= 60) percentColor = 'EAB308';
        else if (percent >= 40) percentColor = 'F97316';

        const docContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:body>
        <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="44"/><w:color w:val="5B21B6"/></w:rPr><w:t>📊 ОТЧЕТ О ПОДДЕРЖКЕ ПРОТОКОЛОВ</w:t></w:r></w:p>
        <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:i/><w:sz w:val="28"/><w:color w:val="8B5CF6"/></w:rPr><w:t>Тестирование телекоммуникационного оборудования</w:t></w:r></w:p>
        <w:p><w:r><w:t> </w:t></w:r></w:p>
        <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:color w:val="C4B5FD"/></w:rPr><w:t>═══════════════════════════════════════════════════════════════</w:t></w:r></w:p>
        <w:p><w:r><w:t> </w:t></w:r></w:p>
        
        <w:p><w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="7C3AED"/></w:rPr><w:t>📋 ИНФОРМАЦИЯ ОБ ОБОРУДОВАНИИ</w:t></w:r></w:p>
        <w:p><w:r><w:t> </w:t></w:r></w:p>
        
        <w:tbl>
            <w:tblPr><w:tblW w:w="8000" w:type="dxa"/>
                <w:tblBorders>
                    <w:top w:val="single" w:sz="4" w:color="C4B5FD"/>
                    <w:left w:val="single" w:sz="4" w:color="C4B5FD"/>
                    <w:bottom w:val="single" w:sz="4" w:color="C4B5FD"/>
                    <w:right w:val="single" w:sz="4" w:color="C4B5FD"/>
                    <w:insideH w:val="single" w:sz="4" w:color="E9D8FF"/>
                    <w:insideV w:val="single" w:sz="4" w:color="E9D8FF"/>
                </w:tblBorders>
            </w:tblPr>
            <w:tr>
                <w:tc><w:tcW w:w="2500" w:type="dxa"/><w:p><w:r><w:rPr><w:b/><w:color w:val="7C3AED"/></w:rPr><w:t>Параметр</w:t></w:r></w:p></w:tc>
                <w:tc><w:tcW w:w="5500" w:type="dxa"/><w:p><w:r><w:rPr><w:b/><w:color w:val="7C3AED"/></w:rPr><w:t>Значение</w:t></w:r></w:p></w:tc>
            </w:tr>
            <w:tr><w:tc><w:p><w:r><w:t>Наименование</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>${escapeXml(deviceName)}</w:t></w:r></w:p></w:tc></w:tr>
            <w:tr><w:tc><w:p><w:r><w:t>Модель</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>${escapeXml(deviceModel)}</w:t></w:r></w:p></w:tc></w:tr>
            <w:tr><w:tc><w:p><w:r><w:t>Производитель</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>${escapeXml(deviceVendor)}</w:t></w:r></w:p></w:tc></w:tr>
            <w:tr><w:tc><w:p><w:r><w:t>Дата тестирования</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>${escapeXml(testDate)}</w:t></w:r></w:p></w:tc></w:tr>
            <w:tr><w:tc><w:p><w:r><w:t>Дата отчета</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>${escapeXml(new Date().toLocaleString('ru-RU'))}</w:t></w:r></w:p></w:tc></w:tr>
            ${comments ? `<w:tr><w:tc><w:p><w:r><w:t>Комментарии</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>${escapeXml(comments)}</w:t></w:r></w:p></w:tc></w:tr>` : ''}
        </w:tbl>
        <w:p><w:r><w:t> </w:t></w:r></w:p>
        
        <w:p><w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="7C3AED"/></w:rPr><w:t>📈 СТАТИСТИКА</w:t></w:r></w:p>
        <w:p><w:r><w:t> </w:t></w:r></w:p>
        
        <w:tbl>
            <w:tblPr><w:tblW w:w="8000" w:type="dxa"/>
                <w:tblBorders>
                    <w:top w:val="single" w:sz="4" w:color="C4B5FD"/>
                    <w:left w:val="single" w:sz="4" w:color="C4B5FD"/>
                    <w:bottom w:val="single" w:sz="4" w:color="C4B5FD"/>
                    <w:right w:val="single" w:sz="4" w:color="C4B5FD"/>
                    <w:insideH w:val="single" w:sz="4" w:color="E9D8FF"/>
                    <w:insideV w:val="single" w:sz="4" w:color="E9D8FF"/>
                </w:tblBorders>
            </w:tblPr>
            <w:tr>
                <w:tc><w:tcW w:w="4000" w:type="dxa"/><w:p><w:r><w:rPr><w:b/><w:color w:val="7C3AED"/></w:rPr><w:t>Показатель</w:t></w:r></w:p></w:tc>
                <w:tc><w:tcW w:w="4000" w:type="dxa"/><w:p><w:r><w:rPr><w:b/><w:color w:val="7C3AED"/></w:rPr><w:t>Результат</w:t></w:r></w:p></w:tc>
            </w:tr>
            <w:tr><w:tc><w:p><w:r><w:t>Всего протоколов</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>${totalCount}</w:t></w:r></w:p></w:tc></w:tr>
            <w:tr><w:tc><w:p><w:r><w:t>Поддерживаемые</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:rPr><w:b/><w:color w:val="16A34A"/></w:rPr><w:t>${foundCount}</w:t></w:r></w:p></w:tc></w:tr>
            <w:tr><w:tc><w:p><w:r><w:t>Не поддерживаемые</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:rPr><w:b/><w:color w:val="EF4444"/></w:rPr><w:t>${notFoundProtocols.length}</w:t></w:r></w:p></w:tc></w:tr>
            <w:tr><w:tc><w:p><w:r><w:t>Процент поддержки</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="${percentColor}"/></w:rPr><w:t>${percent}%</w:t></w:r></w:p></w:tc></w:tr>
        </w:tbl>
        <w:p><w:r><w:t> </w:t></w:r></w:p>
        
        ${foundProtocols.length > 0 ? `
        <w:p><w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="16A34A"/></w:rPr><w:t>✅ ПОДДЕРЖИВАЕМЫЕ ПРОТОКОЛЫ (${foundProtocols.length})</w:t></w:r></w:p>
        <w:p><w:r><w:t> </w:t></w:r></w:p>
        <w:tbl>
            <w:tblPr><w:tblW w:w="9000" w:type="dxa"/>
                <w:tblBorders>
                    <w:top w:val="single" w:sz="4" w:color="86EFAC"/>
                    <w:left w:val="single" w:sz="4" w:color="86EFAC"/>
                    <w:bottom w:val="single" w:sz="4" w:color="86EFAC"/>
                    <w:right w:val="single" w:sz="4" w:color="86EFAC"/>
                    <w:insideH w:val="single" w:sz="4" w:color="DCFCE7"/>
                    <w:insideV w:val="single" w:sz="4" w:color="DCFCE7"/>
                </w:tblBorders>
            </w:tblPr>
            <w:tr>
                <w:tc><w:tcW w:w="500" w:type="dxa"/><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>№</w:t></w:r></w:p></w:tc>
                <w:tc><w:tcW w:w="2500" w:type="dxa"/><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Протокол</w:t></w:r></w:p></w:tc>
                <w:tc><w:tcW w:w="3500" w:type="dxa"/><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Ключевые слова</w:t></w:r></w:p></w:tc>
                <w:tc><w:tcW w:w="2500" w:type="dxa"/><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Найдено по</w:t></w:r></w:p></w:tc>
            </w:tr>
            ${foundRows}
        </w:tbl>
        <w:p><w:r><w:t> </w:t></w:r></w:p>
        ` : ''}
        
        ${notFoundProtocols.length > 0 ? `
        <w:p><w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="EF4444"/></w:rPr><w:t>❌ НЕ ПОДДЕРЖИВАЕМЫЕ ПРОТОКОЛЫ (${notFoundProtocols.length})</w:t></w:r></w:p>
        <w:p><w:r><w:t> </w:t></w:r></w:p>
        <w:tbl>
            <w:tblPr><w:tblW w:w="9000" w:type="dxa"/>
                <w:tblBorders>
                    <w:top w:val="single" w:sz="4" w:color="FCA5A5"/>
                    <w:left w:val="single" w:sz="4" w:color="FCA5A5"/>
                    <w:bottom w:val="single" w:sz="4" w:color="FCA5A5"/>
                    <w:right w:val="single" w:sz="4" w:color="FCA5A5"/>
                    <w:insideH w:val="single" w:sz="4" w:color="FEE2E2"/>
                    <w:insideV w:val="single" w:sz="4" w:color="FEE2E2"/>
                </w:tblBorders>
            </w:tblPr>
            <w:tr>
                <w:tc><w:tcW w:w="500" w:type="dxa"/><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>№</w:t></w:r></w:p></w:tc>
                <w:tc><w:tcW w:w="3000" w:type="dxa"/><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Протокол</w:t></w:r></w:p></w:tc>
                <w:tc><w:tcW w:w="5500" w:type="dxa"/><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Ключевые слова</w:t></w:r></w:p></w:tc>
            </w:tr>
            ${notFoundRows}
        </w:tbl>
        <w:p><w:r><w:t> </w:t></w:r></w:p>
        ` : ''}
        
        <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:color w:val="A78BFA"/><w:i/></w:rPr><w:t>─────────────────────────────────────────────────────────────</w:t></w:r></w:p>
        <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:color w:val="A78BFA"/><w:i/></w:rPr><w:t>📋 Отчет сгенерирован автоматически с помощью системы ProtoScan</w:t></w:r></w:p>
        <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:color w:val="C4B5FD"/><w:i/><w:sz w:val="20"/></w:rPr><w:t>© 2026 ЦПЛ МЦК | Система тестирования протоколов телекоммуникационного оборудования</w:t></w:r></w:p>
        
        <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
    </w:body>
</w:document>`;

        zip.file("word/document.xml", docContent);

        zip.generateAsync({
            type: "blob",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            compression: "DEFLATE"
        }).then(function(content) {
            const filename = `Protocol_Report_${deviceModel.replace(/[^a-zA-Z0-9]/g, '_')}_${testDate}.docx`;
            saveAs(content, filename);
            const modal = document.getElementById('templateModal');
            if (modal) modal.classList.add('hidden');
            showNotification('DOCX отчет успешно создан!');
        }).catch(function(error) {
            console.error('Ошибка:', error);
            alert('Ошибка при создании DOCX файла');
        });

    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка создания DOCX: ' + error.message);
    }
}

function escapeXml(text) {
    if (!text) return '';
    return text.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// ==================== //
// ОБРАБОТЧИКИ СОБЫТИЙ
// ==================== //
function initEventListeners() {
    const selectFileBtn = document.getElementById('selectFileBtn');
    if (selectFileBtn) {
        selectFileBtn.addEventListener('click', () => document.getElementById('fileInput').click());
    }
    
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
        fileInput.addEventListener('click', function() { this.value = null; });
    }
    
    const dropArea = document.getElementById('dropArea');
    if (dropArea) {
        dropArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropArea.style.background = '#f5f0ff';
        });
        dropArea.addEventListener('dragleave', () => {
            dropArea.style.background = '#faf7ff';
        });
        dropArea.addEventListener('drop', (e) => {
            e.preventDefault();
            dropArea.style.background = '#faf7ff';
            const file = e.dataTransfer.files[0];
            if (file) parsePDFFile(file);
        });
    }
    
    const parseTextBtn = document.getElementById('parseTextBtn');
    if (parseTextBtn) {
        parseTextBtn.addEventListener('click', parseManualText);
    }
    
    const exportDocxBtn = document.getElementById('exportDocxBtn');
    if (exportDocxBtn) {
        exportDocxBtn.addEventListener('click', openTemplateModal);
    }
    
    const resetBtn = document.getElementById('resetAnalysisBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', fullReset);
    }
    
    const closeTemplateBtn = document.getElementById('closeTemplateBtn');
    if (closeTemplateBtn) {
        closeTemplateBtn.addEventListener('click', () => {
            document.getElementById('templateModal').classList.add('hidden');
        });
    }
    
    const generateDocxBtn = document.getElementById('generateDocxBtn');
    if (generateDocxBtn) {
        generateDocxBtn.addEventListener('click', generateDocxReport);
    }
    
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.getAttribute('data-filter');
            renderProtocolsGrid();
        });
    });
}

// ==================== //
// СТИЛИ ДЛЯ УВЕДОМЛЕНИЙ
// ==================== //
if (!document.querySelector('#dynamic-styles')) {
    const style = document.createElement('style');
    style.id = 'dynamic-styles';
    style.textContent = `
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            background: linear-gradient(135deg, #faf7ff, #f3eaff);
            border-radius: 20px;
            color: #9b6ddf;
            font-size: 1.1em;
            grid-column: 1 / -1;
            border: 2px dashed rgba(139, 92, 246, 0.3);
        }
        
        .notification-toast {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
            color: white;
            padding: 14px 28px;
            border-radius: 50px;
            box-shadow: 0 10px 30px rgba(139, 92, 246, 0.4);
            z-index: 1000;
            animation: slideInRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            font-size: 14px;
            font-weight: 500;
        }
        
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
}