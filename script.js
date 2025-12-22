// Инициализация pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

// База данных протоколов
let protocols = [];
let pdfText = '';

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadProtocols();
    initEventListeners();
    updateStats();
    
    document.getElementById('testDate').valueAsDate = new Date();
});

// Загрузка протоколов из localStorage
function loadProtocols() {
    const saved = localStorage.getItem('protocolsDictionary');
    if (saved) {
        const savedData = JSON.parse(saved);
        
        // Восстанавливаем только базовую структуру протоколов (без статуса found)
        protocols = savedData.map(protocol => ({
            id: protocol.id,
            name: protocol.name,
            keywords: protocol.keywords,
            // Сбрасываем статусы при загрузке
            found: false,
            foundKeywords: []
        }));
    } else {
        // Базовый словарь по умолчанию
        protocols = [
            { id: 1, name: 'DHCP', keywords: ['DHCP', 'Dynamic Host Configuration Protocol', 'DHCP-сервер', 'DHCP-клиент'] },
            { id: 2, name: 'ICMP', keywords: ['ICMP', 'Internet Control Message Protocol', 'ping', 'эхо-запрос'] },
            { id: 3, name: 'RIP', keywords: ['RIP', 'Routing Information Protocol', 'RIP v1', 'RIP v2'] },
            { id: 4, name: 'UDP', keywords: ['UDP', 'User Datagram Protocol'] },
            { id: 5, name: 'TCP', keywords: ['TCP', 'Transmission Control Protocol'] },
            { id: 6, name: 'OSPF', keywords: ['OSPF', 'Open Shortest Path First', 'OSPFv2', 'OSPFv3'] },
            { id: 7, name: 'BGP', keywords: ['BGP', 'Border Gateway Protocol', 'BGP-4'] },
            { id: 8, name: 'SNMP', keywords: ['SNMP', 'Simple Network Management Protocol', 'SNMP v1', 'SNMP v2', 'SNMP v3'] },
            { id: 9, name: 'VLAN', keywords: ['VLAN', 'Virtual LAN', '802.1Q', 'VLAN trunking'] },
            { id: 10, name: 'STP', keywords: ['STP', 'Spanning Tree Protocol', 'RSTP', 'MSTP', '802.1D'] },
            { id: 11, name: 'HTTP', keywords: ['HTTP', 'Hypertext Transfer Protocol'] },
            { id: 12, name: 'HTTPS', keywords: ['HTTPS', 'HTTP Secure', 'SSL', 'TLS'] },
            { id: 13, name: 'SSH', keywords: ['SSH', 'Secure Shell', 'SSH v2'] },
            { id: 14, name: 'FTP', keywords: ['FTP', 'File Transfer Protocol'] },
            { id: 15, name: 'TFTP', keywords: ['TFTP', 'Trivial File Transfer Protocol'] },
            { id: 16, name: 'NTP', keywords: ['NTP', 'Network Time Protocol'] },
            { id: 17, name: 'Syslog', keywords: ['Syslog', 'системный журнал'] },
            { id: 18, name: 'QoS', keywords: ['QoS', 'Quality of Service', 'качество обслуживания'] },
            { id: 19, name: 'ARP', keywords: ['ARP', 'Address Resolution Protocol'] },
            { id: 20, name: 'IGMP', keywords: ['IGMP', 'Internet Group Management Protocol', 'multicast'] }
        ];
    }
    
    // При загрузке страницы сбрасываем текст и статусы
    pdfText = '';
    updateStats();
    renderProtocolsGrid();
}

// Сохранение протоколов
function saveProtocols() {
    // Сохраняем только базовую информацию о протоколах (без found статуса)
    const protocolsToSave = protocols.map(protocol => ({
        id: protocol.id,
        name: protocol.name,
        keywords: protocol.keywords
    }));
    
    localStorage.setItem('protocolsDictionary', JSON.stringify(protocolsToSave));
    updateStats();
}

function resetAnalysisResults() {
    // Сбрасываем текст анализа
    pdfText = '';
    
    // Сбрасываем статусы всех протоколов
    protocols.forEach(protocol => {
        protocol.found = false;
        protocol.foundKeywords = [];
    });
    
    // Очищаем текстовое поле
    document.getElementById('manualText').value = '';
    
    // Обновляем интерфейс
    renderProtocolsGrid();
    updateStats();
    
    showNotification('Результаты анализа сброшены');
}

// Инициализация обработчиков событий
function initEventListeners() {
    // Кнопка выбора файла
    document.getElementById('selectFileBtn').addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });

    // Обработка загрузки файла PDF
    document.getElementById('fileInput').addEventListener('change', handleFileUpload);

    // Область перетаскивания
    const dropArea = document.getElementById('dropArea');
    dropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropArea.style.background = '#e8f4fc';
    });

    dropArea.addEventListener('dragleave', () => {
        dropArea.style.background = '#f8fafc';
    });

    dropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dropArea.style.background = '#f8fafc';
        const file = e.dataTransfer.files[0];
        if (file) {
            parsePDFFile(file);
        }
    });

    // Анализ текста вручную
    document.getElementById('parseTextBtn').addEventListener('click', parseManualText);

    // Экспорт в TXT
    document.getElementById('exportTxtBtn').addEventListener('click', exportToTxt);

    // Экспорт в HTML
    document.getElementById('exportHtmlBtn').addEventListener('click', exportToHtml);

    // Кнопки для DOCX
    document.getElementById('exportDocxBtn').addEventListener('click', openTemplateModal);
    document.getElementById('openDocxModalBtn').addEventListener('click', openTemplateModal);

    // Простой DOCX
    document.getElementById('exportSimpleDocxBtn').addEventListener('click', generateSimpleDocx);

    // Закрытие модального окна
    document.getElementById('closeTemplateBtn').addEventListener('click', () => {
        document.getElementById('templateModal').classList.add('hidden');
    });

    // Генерация DOCX в модальном окне
    document.getElementById('generateDocxBtn').addEventListener('click', generateDocxReport);

    // Словарь
    document.getElementById('editDictBtn').addEventListener('click', showDictionary);
    document.getElementById('backToMainBtn').addEventListener('click', hideDictionary);
    document.getElementById('addProtocolBtn').addEventListener('click', addNewProtocol);

     // Кнопка сброса результатов
    document.getElementById('resetAnalysisBtn').addEventListener('click', resetAnalysisResults);
}

// Открытие модального окна шаблона
function openTemplateModal() {
    document.getElementById('templateModal').classList.remove('hidden');
}

// Обработка загрузки файла
async function handleFileUpload(event) {

    resetAnalysisResults();

    const file = event.target.files[0];
    if (!file) return;

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
            
            if (pageNum % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
        
        pdfText = fullText;
        showLoading(false);
        analyzeText(fullText);
        
        showNotification(`PDF успешно загружен! Проанализировано ${numPages} страниц.`);
        
    } catch (error) {
        showLoading(false);
        console.error('Ошибка при чтении PDF:', error);
        alert('Ошибка при чтении PDF файла. Убедитесь, что файл не поврежден и не защищен паролем.');
    }
}

// Парсинг текстового файла
function parseTextFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        pdfText = e.target.result;
        analyzeText(pdfText);
        showNotification('Текстовый файл успешно загружен!');
    };
    reader.readAsText(file);
}

// Парсинг текста вручную
function parseManualText() {

    resetAnalysisResults();
    
    const text = document.getElementById('manualText').value;
    if (!text.trim()) {
        alert('Введите текст для анализа');
        return;
    }
    pdfText = text;
    analyzeText(text);
}

// Анализ текста на наличие протоколов
function analyzeText(text) {
    const textLower = text.toLowerCase();
    
    protocols.forEach(protocol => {
        protocol.found = false;
        protocol.foundKeywords = [];
    });
    
    protocols.forEach(protocol => {
        for (const keyword of protocol.keywords) {
            if (textLower.includes(keyword.toLowerCase())) {
                protocol.found = true;
                if (!protocol.foundKeywords) protocol.foundKeywords = [];
                protocol.foundKeywords.push(keyword);
            }
        }
    });
    
    saveProtocols();
    renderProtocolsGrid();
    updateStats();
}

// Отображение сетки протоколов
function renderProtocolsGrid() {
    const grid = document.getElementById('protocolsGrid');
    grid.innerHTML = '';

    protocols.forEach(protocol => {
        const card = document.createElement('div');
        card.className = `protocol-card ${protocol.found ? 'found' : ''}`;
        
        const keywordsHtml = protocol.foundKeywords && protocol.foundKeywords.length > 0 
            ? `<div class="protocol-details">
                 <h5>Найдено по ключевым словам:</h5>
                 <p>${protocol.foundKeywords.join(', ')}</p>
               </div>`
            : '';
        
        card.innerHTML = `
            <h4>
                ${protocol.name}
                <span class="status ${protocol.found ? 'found' : 'not-found'}">
                    ${protocol.found ? '✓ Найден' : '✗ Не найден'}
                </span>
            </h4>
            <p><strong>ID:</strong> ${protocol.id}</p>
            <div class="keywords">
                <strong>Ключевые слова:</strong> ${protocol.keywords.join(', ')}
            </div>
            ${keywordsHtml}
        `;
        
        grid.appendChild(card);
    });
}

// Обновление статистики
function updateStats() {
    const foundCount = protocols.filter(p => p.found).length;
    const totalCount = protocols.length;
    const matchPercent = totalCount > 0 ? Math.round((foundCount / totalCount) * 100) : 0;
    
    document.getElementById('foundCount').textContent = foundCount;
    document.getElementById('totalCount').textContent = totalCount;
    document.getElementById('matchPercent').textContent = `${matchPercent}%`;
}

// Показать/скрыть загрузку
function showLoading(show) {
    const loading = document.getElementById('pdfLoading');
    if (show) {
        loading.classList.remove('hidden');
    } else {
        loading.classList.add('hidden');
    }
}

// Обновить прогресс
function updateProgress(percent) {
    document.getElementById('progressText').textContent = `${percent}%`;
}

// Показать уведомление
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2ecc71;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Экспорт в TXT
function exportToTxt() {
    const foundProtocols = protocols.filter(p => p.found);
    const notFoundProtocols = protocols.filter(p => !p.found);
    
    let exportText = `ОТЧЕТ О ПОДДЕРЖКЕ ПРОТОКОЛОВ ОБОРУДОВАНИЯ\n`;
    exportText += `===================================================\n\n`;
    
    exportText += `Дата создания: ${new Date().toLocaleString('ru-RU')}\n`;
    exportText += `Всего протоколов в словаре: ${protocols.length}\n`;
    exportText += `Найдено поддерживаемых: ${foundProtocols.length}\n`;
    exportText += `Процент поддержки: ${Math.round((foundProtocols.length / protocols.length) * 100)}%\n\n`;
    
    exportText += `ПОДДЕРЖИВАЕМЫЕ ПРОТОКОЛЫ:\n`;
    exportText += `---------------------------------------------------\n`;
    foundProtocols.forEach(protocol => {
        exportText += `${protocol.id}. ${protocol.name}\n`;
        if (protocol.foundKeywords && protocol.foundKeywords.length > 0) {
            exportText += `   Найдено по ключевым словам: ${protocol.foundKeywords.join(', ')}\n`;
        }
        exportText += `   Все ключевые слова: ${protocol.keywords.join(', ')}\n\n`;
    });
    
    exportText += `\nНЕ ПОДДЕРЖИВАЕМЫЕ ПРОТОКОЛЫ:\n`;
    exportText += `---------------------------------------------------\n`;
    notFoundProtocols.forEach(protocol => {
        exportText += `${protocol.id}. ${protocol.name}\n`;
    });
    
    exportText += `\n\nТЕКСТ ИЗ ДАТАШИТА (фрагмент):\n`;
    exportText += `---------------------------------------------------\n`;
    exportText += pdfText.substring(0, 2000) + (pdfText.length > 2000 ? '...' : '');
    
    const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `protocol_report_${new Date().toISOString().slice(0,10)}.txt`);
}

// Генерация DOCX отчета
function generateDocxReport() {
    console.log("Создаем DOCX отчет...");
    
    try {
        const deviceName = document.getElementById('deviceName').value || 'Не указано';
        const deviceModel = document.getElementById('deviceModel').value || 'Не указано';
        const deviceVendor = document.getElementById('deviceVendor').value || 'Не указано';
        const testDate = document.getElementById('testDate').value || new Date().toISOString().slice(0,10);
        
        const foundProtocols = protocols.filter(p => p.found);
        const notFoundProtocols = protocols.filter(p => !p.found);
        
        const zip = new JSZip();
        
        // Структура DOCX
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

        const docContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:body>
        <w:p><w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>Отчет о поддержке протоколов</w:t></w:r></w:p>
        <w:p><w:r><w:t>Оборудование: ${escapeXml(deviceName)}</w:t></w:r></w:p>
        <w:p><w:r><w:t>Модель: ${escapeXml(deviceModel)}</w:t></w:r></w:p>
        <w:p><w:r><w:t>Производитель: ${escapeXml(deviceVendor)}</w:t></w:r></w:p>
        <w:p><w:r><w:t>Дата тестирования: ${escapeXml(testDate)}</w:t></w:r></w:p>
        <w:p><w:r><w:t>Дата отчета: ${escapeXml(new Date().toLocaleDateString('ru-RU'))}</w:t></w:r></w:p>
        <w:p><w:r><w:t> </w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Статистика:</w:t></w:r></w:p>
        <w:p><w:r><w:t>Всего протоколов: ${protocols.length}</w:t></w:r></w:p>
        <w:p><w:r><w:t>Найдено: ${foundProtocols.length}</w:t></w:r></w:p>
        <w:p><w:r><w:t>Не найдено: ${notFoundProtocols.length}</w:t></w:r></w:p>
        <w:p><w:r><w:t>Процент поддержки: ${Math.round((foundProtocols.length / protocols.length) * 100)}%</w:t></w:r></w:p>
        <w:p><w:r><w:t> </w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Поддерживаемые протоколы:</w:t></w:r></w:p>
        ${foundProtocols.map(p => `
        <w:p><w:r><w:t>${p.id}. ${escapeXml(p.name)}</w:t></w:r></w:p>
        <w:p><w:r><w:t>Ключевые слова: ${escapeXml(p.keywords.join(', '))}</w:t></w:r></w:p>
        ${p.foundKeywords && p.foundKeywords.length > 0 ? 
        `<w:p><w:r><w:t>Найдено по: ${escapeXml(p.foundKeywords.join(', '))}</w:t></w:r></w:p>` : ''}
        `).join('')}
        <w:p><w:r><w:t> </w:t></w:r></w:p>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Не поддерживаемые протоколы:</w:t></w:r></w:p>
        ${notFoundProtocols.map(p => `
        <w:p><w:r><w:t>${p.id}. ${escapeXml(p.name)}</w:t></w:r></w:p>
        <w:p><w:r><w:t>Ключевые слова: ${escapeXml(p.keywords.join(', '))}</w:t></w:r></w:p>
        `).join('')}
        <w:p><w:r><w:t> </w:t></w:r></w:p>
        <w:p><w:r><w:t>Отчет сгенерирован автоматически</w:t></w:r></w:p>
        <w:p><w:r><w:t>${new Date().toLocaleString('ru-RU')}</w:t></w:r></w:p>
    </w:body>
</w:document>`;

        zip.file("word/document.xml", docContent);

        zip.generateAsync({
            type: "blob",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            compression: "DEFLATE"
        }).then(function(content) {
            saveAs(content, `Отчет_${deviceModel}_${testDate.replace(/-/g, '')}.docx`);
            
            document.getElementById('templateModal').classList.add('hidden');
            showNotification('DOCX отчет успешно создан!');
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

// Функции для работы со словарем
function showDictionary() {
    document.querySelector('.results-section').classList.add('hidden');
    document.getElementById('dictionarySection').classList.remove('hidden');
    renderDictionary();
}

function hideDictionary() {
    document.querySelector('.results-section').classList.remove('hidden');
    document.getElementById('dictionarySection').classList.add('hidden');
    renderProtocolsGrid();
    updateStats();
}

function renderDictionary() {
    const list = document.getElementById('dictionaryList');
    list.innerHTML = '';

    protocols.forEach((protocol, index) => {
        const item = document.createElement('div');
        item.className = 'dict-item';
        
        item.innerHTML = `
            <div>
                <h4>${protocol.name} (ID: ${protocol.id})</h4>
                <div class="keywords">${protocol.keywords.join(', ')}</div>
                ${protocol.found ? '<span style="color: #2ecc71; font-size: 0.9em;">✓ Найден в последнем анализе</span>' : ''}
            </div>
            <button class="delete-protocol" data-index="${index}">
                <i class="fas fa-trash"></i> Удалить
            </button>
        `;
        
        list.appendChild(item);
    });

    document.querySelectorAll('.delete-protocol').forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            deleteProtocol(index);
        });
    });
}

function addNewProtocol() {
    const nameInput = document.getElementById('newProtocolName');
    const keywordsInput = document.getElementById('newProtocolKeywords');
    
    const name = nameInput.value.trim();
    const keywords = keywordsInput.value
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);
    
    if (!name) {
        alert('Введите название протокола');
        return;
    }
    
    if (keywords.length === 0) {
        alert('Введите хотя бы одно ключевое слово');
        return;
    }
    
    if (protocols.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        alert('Протокол с таким названием уже существует');
        return;
    }
    
    const newId = protocols.length > 0 ? 
        Math.max(...protocols.map(p => p.id)) + 1 : 1;
    
    protocols.push({
        id: newId,
        name: name,
        keywords: keywords,
        found: false
    });
    
    saveProtocols();
    renderDictionary();
    renderProtocolsGrid();
    
    nameInput.value = '';
    keywordsInput.value = '';
    
    showNotification(`Протокол "${name}" добавлен в словарь`);
}

function deleteProtocol(index) {
    const protocolName = protocols[index].name;
    if (confirm(`Удалить протокол "${protocolName}"?`)) {
        protocols.splice(index, 1);
        saveProtocols();
        renderDictionary();
        renderProtocolsGrid();
        showNotification(`Протокол "${protocolName}" удален`);
    }
}

// Экспорт в HTML
function exportToHtml() {
    const foundProtocols = protocols.filter(p => p.found);
    const notFoundProtocols = protocols.filter(p => !p.found);
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Отчет о протоколах</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #2c3e50; text-align: center; }
        h2 { color: #3498db; border-bottom: 2px solid #3498db; padding-bottom: 5px; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background-color: #f2f2f2; }
        .found { color: #27ae60; }
        .not-found { color: #e74c3c; }
    </style>
</head>
<body>
    <h1>Отчет о поддержке протоколов</h1>
    
    <h2>Информация об оборудовании</h2>
    <p><strong>Оборудование:</strong> ${document.getElementById('deviceName').value || 'Не указано'}</p>
    <p><strong>Модель:</strong> ${document.getElementById('deviceModel').value || 'Не указано'}</p>
    <p><strong>Производитель:</strong> ${document.getElementById('deviceVendor').value || 'Не указано'}</p>
    <p><strong>Дата тестирования:</strong> ${document.getElementById('testDate').value || new Date().toISOString().slice(0,10)}</p>
    <p><strong>Дата отчета:</strong> ${new Date().toLocaleString('ru-RU')}</p>
    
    <h2>Статистика</h2>
    <p>Всего протоколов в словаре: <strong>${protocols.length}</strong></p>
    <p>Найдено поддерживаемых: <strong class="found">${foundProtocols.length}</strong></p>
    <p>Не поддерживается: <strong class="not-found">${notFoundProtocols.length}</strong></p>
    <p>Процент поддержки: <strong>${Math.round((foundProtocols.length / protocols.length) * 100)}%</strong></p>
    
    <h2>Поддерживаемые протоколы</h2>
    <table>
        <tr>
            <th>ID</th><th>Протокол</th><th>Ключевые слова</th><th>Найдено по</th>
        </tr>
        ${foundProtocols.map(p => `
        <tr>
            <td>${p.id}</td>
            <td class="found"><strong>${p.name}</strong></td>
            <td>${p.keywords.join(', ')}</td>
            <td>${p.foundKeywords ? p.foundKeywords.join(', ') : 'Не указано'}</td>
        </tr>
        `).join('')}
    </table>
    
    <h2>Не поддерживаемые протоколы</h2>
    <table>
        <tr>
            <th>ID</th><th>Протокол</th><th>Ключевые слова</th>
        </tr>
        ${notFoundProtocols.map(p => `
        <tr>
            <td>${p.id}</td>
            <td class="not-found">${p.name}</td>
            <td>${p.keywords.join(', ')}</td>
        </tr>
        `).join('')}
    </table>
    
    <p style="margin-top: 40px; font-style: italic; text-align: center;">
        Отчет сгенерирован автоматически<br>
        Сохранено: ${new Date().toLocaleString('ru-RU')}
    </p>
</body>
</html>`;
    
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    saveAs(blob, `Отчет_протоколы_${new Date().toISOString().slice(0,10)}.html`);
}

// Простой DOCX
function generateSimpleDocx() {
    console.log("Создаем простой DOCX...");
    
    const foundProtocols = protocols.filter(p => p.found);
    const notFoundProtocols = protocols.filter(p => !p.found);
    
    let docContent = `Отчет о поддержке протоколов
========================================

Дата создания: ${new Date().toLocaleString('ru-RU')}
Всего протоколов: ${protocols.length}
Найдено: ${foundProtocols.length}
Не найдено: ${notFoundProtocols.length}
Процент: ${Math.round((foundProtocols.length / protocols.length) * 100)}%

НАЙДЕННЫЕ ПРОТОКОЛЫ:
${foundProtocols.map(p => `${p.id}. ${p.name} (${p.keywords.join(', ')})`).join('\n')}

НЕНАЙДЕННЫЕ ПРОТОКОЛЫ:
${notFoundProtocols.map(p => `${p.id}. ${p.name} (${p.keywords.join(', ')})`).join('\n')}`;
    
    const blob = new Blob([docContent], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    
    saveAs(blob, `Протоколы_${new Date().toISOString().slice(0,10)}.docx`);
    showNotification('DOCX файл создан!');
}