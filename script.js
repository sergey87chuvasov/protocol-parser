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
    
    // Удаляем URL протоколы (http://, https://) и всё за ними
    cleaned = cleaned.replace(/https?:\/\/[^\s<>"'\]]+/gi, '');
    
    // Удаляем www ссылки
    cleaned = cleaned.replace(/www\.[^\s<>"'\]]+/gi, '');
    
    // Удаляем markdown ссылки
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/gi, '$1');
    
    // Удаляем HTML ссылки
    cleaned = cleaned.replace(/<a\s+[^>]*>([^<]*)<\/a>/gi, '$1');
    
    // Удаляем домены
    cleaned = cleaned.replace(/\b[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:\/[^\s]*)?\b/gi, '');
    
    // Удаляем IP адреса
    cleaned = cleaned.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '');
    
    // Удаляем email
    cleaned = cleaned.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '');
    
    // Удаляем отдельные слова http, https
    cleaned = cleaned.replace(/\bhttps?\b/gi, '');
    
    // Очищаем от лишних символов
    cleaned = cleaned.replace(/[^\w\s\u0400-\u04FF\-\.]/g, ' ');
    
    // Убираем множественные пробелы
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
// АНАЛИЗ ТЕКСТА (ИСПРАВЛЕННЫЙ)
// ==================== //
function analyzeText(text) {
    if (!text || text.trim() === '') {
        showNotification('Нет текста для анализа');
        return;
    }
    
    // Очищаем текст от ссылок и URL
    let cleanText = cleanTextFromUrls(text);
    
    const lowerText = cleanText.toLowerCase();
    
    // Разбиваем текст на отдельные слова (только слова)
    const words = lowerText.split(/\s+/).filter(word => word.length > 0);
    
    protocols.forEach(protocol => {
        protocol.found = false;
        protocol.foundKeywords = [];
        
        for (const keyword of protocol.keywords) {
            const lowerKeyword = keyword.toLowerCase();
            
            // Пропускаем ключевые слова, похожие на URL
            if (lowerKeyword.includes('http') || lowerKeyword.includes('www')) {
                continue;
            }
            
            // Для коротких ключевых слов (до 4 символов) - точное совпадение со словами
            if (lowerKeyword.length <= 4) {
                if (words.some(word => word === lowerKeyword)) {
                    protocol.found = true;
                    addFoundKeyword(protocol, keyword);
                }
            }
            // Для длинных ключевых слов - поиск с границами слова
            else {
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
// ГЕНЕРАЦИЯ DOCX
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
        
        const zip = new JSZip();
        
        zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

        zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

        zip.file("word/_rels/document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`);

        let docContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:body>
        <w:p><w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>Отчет о поддержке протоколов оборудования</w:t></w:r></w:p>
        <w:p><w:r><w:t> </w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Информация об оборудовании:</w:t></w:r></w:p>
        <w:p><w:r><w:t>Наименование: ${escapeXml(deviceName)}</w:t></w:r></w:p>
        <w:p><w:r><w:t>Модель: ${escapeXml(deviceModel)}</w:t></w:r></w:p>
        <w:p><w:r><w:t>Производитель: ${escapeXml(deviceVendor)}</w:t></w:r></w:p>
        <w:p><w:r><w:t>Дата тестирования: ${escapeXml(testDate)}</w:t></w:r></w:p>
        ${comments ? `<w:p><w:r><w:t>Комментарии: ${escapeXml(comments)}</w:t></w:r></w:p>` : ''}
        <w:p><w:r><w:t>Дата формирования отчета: ${escapeXml(new Date().toLocaleString('ru-RU'))}</w:t></w:r></w:p>
        <w:p><w:r><w:t> </w:t></w:r></w:p>
        
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Статистика:</w:t></w:r></w:p>
        <w:p><w:r><w:t>Всего протоколов в словаре: ${protocols.length}</w:t></w:r></w:p>
        <w:p><w:r><w:t>Поддерживаемые протоколы: ${foundProtocols.length}</w:t></w:r></w:p>
        <w:p><w:r><w:t>Не поддерживаемые протоколы: ${notFoundProtocols.length}</w:t></w:r></w:p>
        <w:p><w:r><w:t>Процент поддержки: ${Math.round((foundProtocols.length / protocols.length) * 100)}%</w:t></w:r></w:p>
        <w:p><w:r><w:t> </w:t></w:r></w:p>
        
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Поддерживаемые протоколы:</w:t></w:r></w:p>
        ${foundProtocols.map(p => `
        <w:p><w:r><w:t>✓ ${escapeXml(p.name)}</w:t></w:r></w:p>
        ${p.foundKeywords && p.foundKeywords.length > 0 ? 
        `<w:p><w:r><w:t>   (найдено по: ${escapeXml(p.foundKeywords.join(', '))})</w:t></w:r></w:p>` : ''}
        `).join('')}
        
        <w:p><w:r><w:t> </w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Не поддерживаемые протоколы:</w:t></w:r></w:p>
        ${notFoundProtocols.map(p => `
        <w:p><w:r><w:t>✗ ${escapeXml(p.name)}</w:t></w:r></w:p>
        `).join('')}
        
        <w:p><w:r><w:t> </w:t></w:r></w:p>
        <w:p><w:r><w:t>---</w:t></w:r></w:p>
        <w:p><w:r><w:t>Отчет сгенерирован автоматически</w:t></w:r></w:p>
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
            console.error('Ошибка при создании ZIP:', error);
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
// ДОБАВЛЯЕМ СТИЛИ ДЛЯ УВЕДОМЛЕНИЙ
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
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
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