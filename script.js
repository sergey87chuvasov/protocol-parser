// Инициализация pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

// База данных протоколов
let protocols = [];
let pdfText = '';

// ==================== //
// Daily Header Variables
// ==================== //
let filesAnalyzed = 0;

// База советов для сетевых инженеров
const networkTips = [
    "Всегда проверяйте настройки VLAN перед подключением нового оборудования",
    "Используйте SSH вместо Telnet для безопасного удаленного доступа",
    "Регулярно обновляйте микропрограммы сетевого оборудования",
    "Настройте NTP-сервер для синхронизации времени на всех устройствах",
    "Используйте агрегацию каналов (LACP) для увеличения пропускной способности",
    "Регулярно делайте резервные копии конфигураций сетевых устройств",
    "Настройте мониторинг с помощью SNMP или протоколов потоков (NetFlow)",
    "Используйте QoS для приоритизации важного трафика (VoIP, видеоконференции)",
    "Всегда документируйте изменения в сетевой инфраструктуре",
    "Проверяйте совместимость протоколов при обновлении оборудования",
    "Используйте протокол STP/RSTP для предотвращения петель в сети",
    "Настройте защиту от петель на коммутаторах (Loop Protection)",
    "Регулярно анализируйте логи (Syslog) на предмет ошибок и атак",
    "Используйте IPv6 даже если основной протокол - IPv4",
    "Настройте аутентификацию по RADIUS/TACACS+ для централизованного управления доступом",
    "Проверяйте загрузку CPU и памяти на критических сетевых устройствах",
    "Используйте протоколы маршрутизации (OSPF, BGP) вместо статических маршрутов в крупных сетях",
    "Настройте мониторинг температуры в серверных комнатах и ЦОД",
    "Используйте VLAN для логического разделения сетей",
    "Регулярно тестируйте процедуры восстановления после сбоев",
    "Настройте мониторинг линков на предмет ошибок и потерь пакетов",
    "Используйте протоколы резервирования (HSRP, VRRP) для отказоустойчивости шлюзов",
    "Проверяйте безопасность паролей на всех сетевых устройствах",
    "Настройте фильтрацию MAC-адресов на коммутаторах доступа",
    "Используйте протокол 802.1X для контроля доступа к сети",
    "Регулярно проводите аудит сетевой безопасности",
    "Настройте мониторинг трафика для выявления аномалий",
    "Используйте протоколы туннелирования (IPsec, GRE) для защищенных соединений",
    "Проверяйте актуальность сертификатов SSL/TLS на веб-интерфейсах",
    "Настройте ограничение скорости (Rate Limiting) для предотвращения DoS-атак"
];

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadProtocols();
    initEventListeners();
    updateStats();
    initDailyHeader();
    updateFooterYear();
    
    document.getElementById('testDate').valueAsDate = new Date();
    testFunctionality();
});

// ==================== //
// Daily Header Functions
// ==================== //

// Функция для обновления даты и времени
function updateDateTime() {
    const now = new Date();
    
    // Форматируем дату
    const dateOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const dateStr = now.toLocaleDateString('ru-RU', dateOptions);
    
    // Форматируем время
    const timeStr = now.toLocaleTimeString('ru-RU', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    });
    
    // Обновляем DOM
    document.getElementById('currentDate').textContent = dateStr;
    document.getElementById('currentTime').textContent = timeStr;
    
    // Обновляем счетчик проанализированных файлов
    document.getElementById('filesAnalyzed').textContent = filesAnalyzed;
}

// Функция для получения совета дня (меняется раз в день)
function getTipOfTheDay() {
    const today = new Date().toDateString();
    const savedTip = localStorage.getItem('tipOfTheDay');
    const savedDate = localStorage.getItem('tipDate');
    
    // Если у нас уже есть совет на сегодня, используем его
    if (savedTip && savedDate === today) {
        return savedTip;
    }
    
    // Иначе генерируем новый и сохраняем
    const randomIndex = Math.floor(Math.random() * networkTips.length);
    const newTip = networkTips[randomIndex];
    
    localStorage.setItem('tipOfTheDay', newTip);
    localStorage.setItem('tipDate', today);
    
    return newTip;
}

// Функция для обновления совета
function updateTip() {
    const tipElement = document.getElementById('dailyTip');
    const refreshBtn = document.getElementById('refreshTip');
    
    // Добавляем анимацию
    refreshBtn.classList.add('refreshing');
    tipElement.style.opacity = '0.5';
    
    // Через небольшую задержку показываем новый совет
    setTimeout(() => {
        const newTip = getTipOfTheDay();
        tipElement.textContent = newTip;
        tipElement.style.opacity = '1';
        
        // Убираем анимацию
        setTimeout(() => {
            refreshBtn.classList.remove('refreshing');
        }, 500);
    }, 300);
}

// Инициализация daily header
function initDailyHeader() {
    // Загружаем счетчик из localStorage
    const savedCount = localStorage.getItem('filesAnalyzedCount');
    if (savedCount) {
        filesAnalyzed = parseInt(savedCount);
    }
    
    // Обновляем дату и время каждую секунду
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Загружаем совет дня
    const dailyTip = getTipOfTheDay();
    document.getElementById('dailyTip').textContent = dailyTip;
    
    // Обработчик для кнопки обновления совета
    document.getElementById('refreshTip').addEventListener('click', updateTip);
    
    // Обновляем счетчик проанализированных файлов
    document.getElementById('filesAnalyzed').textContent = filesAnalyzed;
}

// Функция для увеличения счетчика проанализированных файлов
function incrementFilesAnalyzed() {
    filesAnalyzed++;
    localStorage.setItem('filesAnalyzedCount', filesAnalyzed);
    updateDateTime(); // Обновляем отображение счетчика
}

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
            { id: 1, name: 'DHCP', keywords: ['DHCP', 'Dynamic Host Configuration Protocol', 'DHCP-сервер','DHCP-client','DHCP-client', 'DHCP-клиент','BOOTP','Dynamic Ip Allocation'] },
            { id: 2, name: 'ICMP-PING', keywords: ['ICMP', 'Internet Control Message Protocol', ' ping'] },
            { id: 3, name: 'RIP', keywords: ['RIP', 'Routing Information Protocol'] },
            { id: 4, name: 'UDP', keywords: ['UDP', 'User Datagram Protocol', 'SNMP', 'DHCP'] },
            { id: 5, name: 'TCP', keywords: ['TCP', 'Transmission Control Protocol', 'TELNET', 'SSH', 'HTTP', 'HTTPS', 'WEB'] },
            { id: 6, name: 'TRACE-ROUTE', keywords: ['traceroute', 'trace route', 'tracert'] },
            { id: 7, name: 'DHCP-RELAY', keywords: ['DHCP-relay', 'dhcp relay'] },
            { id: 8, name: 'SNMP', keywords: ['SNMP', 'Simple Network Management Protocol', 'SNMP v1', 'SNMP v2', 'SNMP v3'] },
            { id: 9, name: 'VLAN', keywords: ['VLAN', 'Virtual LAN', '802.1Q', "Vxlan"] },
            { id: 10, name: 'QinQ', keywords: ['QINQ', 'Q-IN-Q', 'Q in Q', 'Vlan stacking', '802.1ad'] },
            { id: 11, name: 'HTTP-HTTPS', keywords: ['HTTP', 'Hypertext Transfer Protocol', 'HTTP Secure', 'SSL', 'TLS', 'WEB', 'ВЕБ', 'ВЭБ'] },
            { id: 12, name: 'DHCP-Snooping', keywords: ['DHCP snooping', 'DHCP-snooping'] },
            { id: 13, name: 'DHCP IP Anti-Spoofing', keywords: ['bind', 'source-guard', 'source guard'] },
            { id: 14, name: 'DHCP-SERVER', keywords: ['DHCP-SERVER', 'DHCP SERVER', 'DHCP сервер', 'DHCP-сервер'] },
            { id: 15, name: 'DHCP-Client', keywords: ['DHCP-CLIENT', 'DHCP CLIENT', 'DHCP клиент', 'DHCP-клиент'] },
            { id: 16, name: 'IGMP-SNOOPING', keywords: ['IGMP-SNOOPING', 'IGMP SNOOPING'] },
            { id: 17, name: 'IGMP FAST Leave', keywords: ['IGMP FAST Leave', 'системный журнал'] },
            { id: 18, name: 'IGMP ATTENTION', keywords: ['IGMP', 'multicast'] },
            { id: 19, name: 'ARP', keywords: ['ARP', 'Address Resolution Protocol','IPV4','IP'] },
            { id: 20, name: 'IGMP-PROXY', keywords: ['IGMP-PROXY', 'IGMP PROXY'] },
            { id: 21, name: 'IPv4', keywords: ['IPV4','IP','Internet Protocol'] },
            { id: 22, name: 'IGMP V3', keywords: ['IGMP V3','IGMP VERSION 3','IGMP VERSION 2, 3'] },
            { id: 23, name: 'RJ45', keywords: ['RJ45','1000base-t','1000 base-t', 'ethernet', 'eth','copper'] },
            { id: 24, name: 'SFP', keywords: ['SFP','SFP+','1000 base-t','1000base-x', '10g', 'fiber'] },
            { id: 25, name: 'SNMP', keywords: ['SNMP','SNMPV1','SNMPV2', 'SNMPV3', 'SNMPV2C', 'SIMPLE NETWORK MANAGEMENT PROTOCOL'] },
            { id: 25, name: 'WEB', keywords: ['HTTP','HTTPS','WEB'] },
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

    // Кнопка обновления совета
    document.getElementById('refreshTip').addEventListener('click', updateTip);

     if ('ontouchstart' in window) {
        // Добавляем touch-обработчики для лучшего UX
        document.querySelectorAll('.btn, .protocol-card').forEach(element => {
            element.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.98)';
            });
            
            element.addEventListener('touchend', function() {
                this.style.transform = '';
            });
        });
    }
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
    incrementFilesAnalyzed(); // Увеличиваем счетчик файлов
    
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
        incrementFilesAnalyzed(); // Увеличиваем счетчик файлов
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
    incrementFilesAnalyzed(); // Увеличиваем счетчик файлов
}

// Улучшенная версия с поддержкой составных терминов
function analyzeText(text) {
    protocols.forEach(protocol => {
        protocol.found = false;
        protocol.foundKeywords = [];
        
        // Проверяем каждое ключевое слово
        for (const keyword of protocol.keywords) {
            // Для коротких аббревиатур (2-3 символа) используем точный поиск
            if (keyword.length <= 3) {
                // Ищем аббревиатуру как отдельное слово
                const regex = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'i');
                if (regex.test(text)) {
                    protocol.found = true;
                    addFoundKeyword(protocol, keyword);
                }
            } 
            // Для длинных слов и фраз используем обычный поиск
            else {
                const regex = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, 'i');
                if (regex.test(text)) {
                    protocol.found = true;
                    addFoundKeyword(protocol, keyword);
                }
            }
        }
    });
    
    saveProtocols();
    renderProtocolsGrid();
    updateStats();
}

// Вспомогательная функция для добавления найденного ключевого слова
function addFoundKeyword(protocol, keyword) {
    if (!protocol.foundKeywords) protocol.foundKeywords = [];
    if (!protocol.foundKeywords.includes(keyword)) {
        protocol.foundKeywords.push(keyword);
    }
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
        type: 'application/octet-stream' 
    });
    
    saveAs(blob, `Протоколы_${new Date().toISOString().slice(0,10)}.docx`);
    showNotification('DOCX файл создан!');
}

// Функция для обновления года в футере
function updateFooterYear() {
    const yearElement = document.querySelector('.footer-bottom p');
    if (yearElement) {
        const currentYear = new Date().getFullYear();
        yearElement.innerHTML = yearElement.innerHTML.replace('2024', currentYear);
    }
}

// Функция для тестирования
function testFunctionality() {
    console.log('Приложение загружено. Тестовые данные:');
    console.log('Протоколов в словаре:', protocols.length);
    console.log('PDF.js версия:', pdfjsLib.version);
    console.log('JSZip доступен:', typeof JSZip !== 'undefined');
    console.log('FileSaver доступен:', typeof saveAs !== 'undefined');
    console.log('Советов в базе:', networkTips.length);
}