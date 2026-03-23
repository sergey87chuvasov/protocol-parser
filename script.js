// Инициализация pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// База данных протоколов
let protocols = [];
let pdfText = '';
let currentFilter = 'all';
let lastLoadedFile = null; // Сохраняем последний загруженный файл

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadProtocols();
    initEventListeners();
    updateStats();
    
    const testDateInput = document.getElementById('testDate');
    if (testDateInput) {
        testDateInput.valueAsDate = new Date();
    }
});

// Загрузка протоколов из localStorage
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
        // Базовый словарь по умолчанию
        protocols = [
            { id: 1, name: 'DHCP', keywords: ['DHCP', 'Dynamic Host Configuration Protocol', 'DHCP-сервер', 'DHCP-client', 'DHCP-клиент', 'BOOTP'] },
            { id: 2, name: 'ICMP', keywords: ['ICMP', 'Internet Control Message Protocol', 'ping'] },
            { id: 3, name: 'RIP', keywords: ['RIP', 'Routing Information Protocol'] },
            { id: 4, name: 'OSPF', keywords: ['OSPF', 'Open Shortest Path First'] },
            { id: 5, name: 'BGP', keywords: ['BGP', 'Border Gateway Protocol'] },
            { id: 6, name: 'SNMP', keywords: ['SNMP', 'Simple Network Management Protocol', 'SNMP v1', 'SNMP v2', 'SNMP v3'] },
            { id: 7, name: 'VLAN', keywords: ['VLAN', 'Virtual LAN', '802.1Q', 'Vxlan'] },
            { id: 8, name: 'STP/RSTP', keywords: ['STP', 'RSTP', 'Spanning Tree', 'Rapid Spanning Tree'] },
            { id: 9, name: 'HTTP/HTTPS', keywords: ['HTTP', 'HTTPS', 'Hypertext Transfer Protocol', 'SSL', 'TLS', 'WEB'] },
            { id: 10, name: 'SSH', keywords: ['SSH', 'Secure Shell'] },
            { id: 11, name: 'Telnet', keywords: ['Telnet'] },
            { id: 12, name: 'ARP', keywords: ['ARP', 'Address Resolution Protocol'] },
            { id: 13, name: 'IGMP', keywords: ['IGMP', 'Internet Group Management Protocol', 'multicast'] },
            { id: 14, name: 'IPv4', keywords: ['IPv4', 'IP', 'Internet Protocol'] },
            { id: 15, name: 'IPv6', keywords: ['IPv6'] },
            { id: 16, name: 'DHCP Snooping', keywords: ['DHCP snooping', 'DHCP-snooping'] },
            { id: 17, name: 'IGMP Snooping', keywords: ['IGMP snooping', 'IGMP-snooping'] },
            { id: 18, name: 'LACP', keywords: ['LACP', 'Link Aggregation', '802.3ad'] },
            { id: 19, name: 'QoS', keywords: ['QoS', 'Quality of Service'] },
            { id: 20, name: 'RADIUS', keywords: ['RADIUS', 'Remote Authentication Dial-In User Service'] },
            { id: 21, name: 'TACACS+', keywords: ['TACACS', 'TACACS+'] },
            { id: 22, name: 'NTP', keywords: ['NTP', 'Network Time Protocol'] },
            { id: 23, name: 'Syslog', keywords: ['Syslog', 'system log'] },
            { id: 24, name: 'NetFlow', keywords: ['NetFlow', 'sFlow', 'flow'] },
            { id: 25, name: 'VRRP/HSRP', keywords: ['VRRP', 'HSRP', 'redundancy', 'first hop'] }
        ];
    }
    
    pdfText = '';
    lastLoadedFile = null;
    updateStats();
    renderProtocolsGrid();
}

// Сохранение протоколов
function saveProtocols() {
    const protocolsToSave = protocols.map(protocol => ({
        id: protocol.id,
        name: protocol.name,
        keywords: protocol.keywords
    }));
    localStorage.setItem('protocolsDictionary', JSON.stringify(protocolsToSave));
}

// Сброс результатов анализа (только статусов, не очищает текст)
function resetAnalysisResults(keepText = false) {
    // Сбрасываем статусы протоколов
    protocols.forEach(protocol => {
        protocol.found = false;
        protocol.foundKeywords = [];
    });
    
    // Если не нужно сохранять текст, очищаем его
    if (!keepText) {
        pdfText = '';
        const manualText = document.getElementById('manualText');
        if (manualText) {
            manualText.value = '';
        }
        lastLoadedFile = null;
    }
    
    renderProtocolsGrid();
    updateStats();
    
    if (!keepText) {
        showNotification('Результаты анализа сброшены');
    }
}

// Полный сброс (очищает всё)
function fullReset() {
    resetAnalysisResults(false);
}

// Инициализация обработчиков событий
function initEventListeners() {
    // Кнопка выбора файла
    const selectFileBtn = document.getElementById('selectFileBtn');
    if (selectFileBtn) {
        selectFileBtn.addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
    }

    // Обработка загрузки файла
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
        // Очищаем value после обработки, чтобы можно было загрузить тот же файл снова
        fileInput.addEventListener('click', function() {
            this.value = null;
        });
    }

    // Область перетаскивания
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
            if (file) {
                parsePDFFile(file);
            }
        });
    }

    // Анализ текста вручную
    const parseTextBtn = document.getElementById('parseTextBtn');
    if (parseTextBtn) {
        parseTextBtn.addEventListener('click', parseManualText);
    }

    // Экспорт в DOCX
    const exportDocxBtn = document.getElementById('exportDocxBtn');
    if (exportDocxBtn) {
        exportDocxBtn.addEventListener('click', openTemplateModal);
    }

    // Кнопка сброса
    const resetBtn = document.getElementById('resetAnalysisBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', fullReset);
    }

    // Модальное окно
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

    // Фильтры
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

// Открытие модального окна
function openTemplateModal() {
    const modal = document.getElementById('templateModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

// Обработка загрузки файла
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Сбрасываем только статусы, но не очищаем поле ввода
    resetAnalysisResults(true);
    
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        await parsePDFFile(file);
    } else if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
        parseTextFile(file);
    } else {
        alert('Пожалуйста, загрузите PDF или TXT файл');
    }
}

// Парсинг PDF файла
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
            
            // Небольшая задержка для обновления UI
            if (pageNum % 5 === 0) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }
        
        pdfText = fullText;
        lastLoadedFile = file;
        showLoading(false);
        analyzeText(fullText);
        showNotification(`PDF успешно загружен! Проанализировано ${numPages} страниц.`);
        
    } catch (error) {
        showLoading(false);
        console.error('Ошибка при чтении PDF:', error);
        alert('Ошибка при чтении PDF файла. Убедитесь, что файл не поврежден.');
    }
}

// Парсинг текстового файла
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

// Парсинг текста вручную
function parseManualText() {
    const text = document.getElementById('manualText').value;
    if (!text.trim()) {
        alert('Введите текст для анализа');
        return;
    }
    
    // Сбрасываем только статусы
    resetAnalysisResults(true);
    
    pdfText = text;
    lastLoadedFile = null;
    analyzeText(text);
    showNotification('Текст проанализирован');
}

// Анализ текста
function analyzeText(text) {
    if (!text || text.trim() === '') {
        showNotification('Нет текста для анализа');
        return;
    }
    
    const lowerText = text.toLowerCase();
    
    protocols.forEach(protocol => {
        protocol.found = false;
        protocol.foundKeywords = [];
        
        for (const keyword of protocol.keywords) {
            const lowerKeyword = keyword.toLowerCase();
            
            // Поиск с учетом границ слова для коротких терминов
            if (keyword.length <= 3) {
                const regex = new RegExp(`\\b${escapeRegExp(lowerKeyword)}\\b`, 'i');
                if (regex.test(lowerText)) {
                    protocol.found = true;
                    addFoundKeyword(protocol, keyword);
                }
            } 
            // Для длинных терминов
            else {
                if (lowerText.includes(lowerKeyword)) {
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

// Отображение сетки протоколов с фильтрацией
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
        grid.innerHTML = '<div class="empty-state">Нет протоколов для отображения</div>';
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

// Обновление статистики
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

// Показать/скрыть загрузку
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

// Обновить прогресс
function updateProgress(percent) {
    const progressText = document.getElementById('progressText');
    if (progressText) {
        progressText.textContent = `${percent}%`;
    }
}

// Показать уведомление
function showNotification(message) {
    // Удаляем старые уведомления
    const oldNotifications = document.querySelectorAll('.notification-toast');
    oldNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = 'notification-toast';
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #8b5cf6;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease;
        font-size: 14px;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Генерация DOCX отчета
function generateDocxReport() {
    try {
        const deviceName = document.getElementById('deviceName')?.value || 'Не указано';
        const deviceModel = document.getElementById('deviceModel')?.value || 'Не указано';
        const deviceVendor = document.getElementById('deviceVendor')?.value || 'Не указано';
        const testDate = document.getElementById('testDate')?.value || new Date().toISOString().slice(0,10);
        const comments = document.getElementById('deviceComments')?.value || '';
        
        const foundProtocols = protocols.filter(p => p.found);
        const notFoundProtocols = protocols.filter(p => !p.found);
        
        const zip = new JSZip();
        
        // Content_Types.xml
        zip.file("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

        // _rels/.rels
        zip.file("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

        // word/_rels/document.xml.rels
        zip.file("word/_rels/document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`);

        // Формируем содержимое документа
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
        <w:p><w:r><w:t>Отчет сгенерирован автоматически с помощью Protocol Parser</w:t></w:r></w:p>
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

// Функция экранирования XML
function escapeXml(text) {
    if (!text) return '';
    return text.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// Добавляем стили для empty-state и уведомлений если их нет
if (!document.querySelector('#dynamic-styles')) {
    const style = document.createElement('style');
    style.id = 'dynamic-styles';
    style.textContent = `
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #9b6ddf;
            font-size: 1.1em;
            grid-column: 1 / -1;
        }
        
        @keyframes slideIn {
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