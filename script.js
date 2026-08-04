/**
 * =====================================================
 * ПРОГРАММА АВТОМАТИЧЕСКОГО АНАЛИЗА И ВЕРИФИКАЦИИ
 * ТЕХНИЧЕСКИХ ХАРАКТЕРИСТИК ТЕЛЕКОММУНИКАЦИОННОГО ОБОРУДОВАНИЯ
 * 
 * Версия: 2.9.0
 * =====================================================
 */

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// =====================================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// =====================================================
let protocols = [];
let pdfText = '';
let currentFilter = 'all';
let lastLoadedFile = null;
let originalText = '';

// =====================================================
// ПРАКТИЧЕСКИЕ ПОДСКАЗКИ (что проверять)
// =====================================================
const protocolHints = {
    'IPv4': 'Оборудование должно поддерживать статическую и динамическую маршрутизацию IPv4, фрагментацию пакетов, ICMP-запросы. Проверяется корректность назначения IP-адреса и доступность шлюза по умолчанию.',
    'IPv6': 'Оборудование должно поддерживать IPv6-адресацию, статическую маршрутизацию, Neighbor Discovery (NDP), SLAAC. Проверяется назначение IPv6-адреса и доступность IPv6-шлюза.',
    'ARP': 'Оборудование должно уметь разрешать IP-адреса в MAC-адреса через ARP-запросы и ответы. Проверяется корректность ARP-таблицы, наличие записей для соседних устройств.',
    'VLAN': 'Оборудование должно поддерживать создание и управление VLAN (802.1Q), тегирование трафика, изоляцию широковещательных доменов. Проверяется создание VLAN и назначение портов в VLAN.',
    'QinQ': 'Оборудование должно поддерживать двойное VLAN-тегирование (QinQ) для провайдерских сетей. Проверяется прохождение трафика с двумя тегами VLAN через магистральный порт.',
    'ICMP-PING': 'Оборудование должно отвечать на ICMP Echo Request (ping) и генерировать ICMP Echo Reply. Проверяется доступность IP-адреса по команде ping.',
    'TRACE-ROUTE': 'Оборудование должно корректно обрабатывать ICMP Time Exceeded и UDP-пакеты с TTL=1. Проверяется работа traceroute до удалённого узла.',
    'ICMPv6': 'Оборудование должно поддерживать ICMP для IPv6, включая Neighbor Discovery (NDP) и MLD. Проверяется работа ping6 и обнаружение соседей.',
    'DHCP': 'Оборудование должно корректно работать как DHCP-клиент или DHCP-сервер (в зависимости от режима). Проверяется получение IP-адреса от DHCP-сервера.',
    'DHCP-SERVER': 'Оборудование должно уметь раздавать IP-адреса устройствам в сети. Проверяется назначение IP-адреса клиенту из пула DHCP-сервера.',
    'DHCP-Client': 'Оборудование должно уметь получать IP-адрес от DHCP-сервера автоматически. Проверяется получение IP-адреса, маски, шлюза и DNS.',
    'DHCPv6': 'Оборудование должно поддерживать получение IPv6-адресов через DHCPv6. Проверяется назначение IPv6-адреса клиенту.',
    'DHCP-RELAY': 'Оборудование должно уметь перенаправлять DHCP-запросы в другую подсеть (DHCP Relay). Проверяется получение IP-адреса клиентом через Relay.',
    'DHCP-Snooping': 'Оборудование должно уметь фильтровать недоверенные DHCP-ответы (DHCP Snooping). Проверяется блокировка подмены DHCP-сервера на порту.',
    'DHCP IP Anti-Spoofing': 'Оборудование должно уметь проверять соответствие IP и MAC-адреса (IP Source Guard). Проверяется блокировка трафика с неразрешённых IP-адресов.',
    'RIP': 'Оборудование должно поддерживать маршрутизацию по протоколу RIP (v1/v2). Проверяется обмен маршрутами между соседними маршрутизаторами.',
    'IGMP': 'Оборудование должно поддерживать управление мультикаст-группами через IGMP. Проверяется подписка устройства на мультикаст-группу.',
    'IGMP-SNOOPING': 'Оборудование должно уметь анализировать IGMP-запросы и отправлять мультикаст-трафик только на нужные порты. Проверяется фильтрация мультикаст-трафика.',
    'IGMP FAST Leave': 'Оборудование должно уметь мгновенно обрабатывать выход из мультикаст-группы. Проверяется скорость прекращения трансляции потока трафика для группы multicast при получении IGMP-пакета Leave.',
    'IGMP-PROXY': 'Оборудование должно уметь объединять мультикаст-запросы от разных клиентов (IGMP Proxy). Проверяется уменьшение нагрузки на вышестоящее оборудование.',
    'IGMP V3': 'Устройство должно корректно обрабатывать и формировать пакеты IGMP версии 3 в рамках функционала Snooping или Proxy, а также взаимодействовать с потребителями по протоколу IGMP версии 2 либо 3 в зависимости от версии, используемой потребителями.',
    'UDP': 'Оборудование должно корректно обрабатывать UDP-пакеты. Проверяется передача и приём UDP-пакетов через порты.',
    'TCP': 'Оборудование должно корректно устанавливать TCP-соединения и поддерживать подтверждение доставки. Проверяется установка TCP-сессии и передача данных.',
    'RJ45': 'Оборудование должно обеспечивать работу порта RJ45 на скорости 10/100/1000 Мбит/с с поддержкой Auto-Negotiation и MDI/MDIX. Проверяется на L2 (коммутация) и L3 (маршрутизация).',
    'SFP': 'Оборудование должно поддерживать установку оптических трансиверов SFP/SFP+/QSFP и работу на скоростях 1G/10G/100G. Проверяется на L2 (коммутация) и L3 (маршрутизация).',
    'SNMP': 'Оборудование должно отвечать на SNMP-запросы и отдавать MIB-данные. Проверяется чтение системной информации через SNMP (версия v1/v2/v3).',
    'HTTP-HTTPS': 'Оборудование должно обеспечивать работу веб-сервера по протоколам HTTP и HTTPS для доступа к интерфейсу управления.',
    'WEB': 'Оборудование должно предоставлять веб-интерфейс для управления. Проверяется авторизация, изменение настроек, обновление прошивки, просмотр статуса и диагностика.'
};

function getHint(name, desc) {
    if (desc && desc.trim()) return desc;
    return protocolHints[name] || '📖 Пользовательский параметр. Добавьте описание.';
}

// =====================================================
// ИНИЦИАЛИЗАЦИЯ
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    loadProtocols();
    initEventListeners();
    updateStats();
    initTheme();
    const testDateInput = document.getElementById('testDate');
    if (testDateInput) testDateInput.valueAsDate = new Date();
    initTooltips();
});

function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        document.getElementById('themeToggle').textContent = '☀️';
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    document.getElementById('themeToggle').textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// =====================================================
// ТУЛТИПЫ ДЛЯ КНОПОК
// =====================================================
function initTooltips() {
    const tooltips = {
        'selectFileBtn': 'Выберите PDF или TXT файл для анализа',
        'parseTextBtn': 'Проанализировать вставленный текст',
        'exportDocxBtn': 'Сформировать DOCX-отчёт',
        'resetAnalysisBtn': 'Очистить все результаты анализа',
        'forceDeleteAllBtn': 'Удалить все добавленные пользователем параметры',
        'showHighlightBtn': 'Показать текст с подсветкой',
        'closeHighlightBtn': 'Скрыть текст с подсветкой',
        'addProtocolBtn': 'Добавить новый параметр',
        'themeToggle': 'Переключить тему'
    };

    Object.keys(tooltips).forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.setAttribute('title', tooltips[id]);
        }
    });
}

// =====================================================
// ЗАГРУЗКА СЛОВАРЯ ПРОТОКОЛОВ (28 протоколов)
// =====================================================
function loadProtocols() {
    const saved = localStorage.getItem('protocolsDictionary');
    if (saved) {
        const savedData = JSON.parse(saved);
        protocols = savedData.map(p => ({
            id: p.id, name: p.name, keywords: p.keywords, description: p.description || '',
            operation: p.operation || '', normDoc: p.normDoc || '',
            active: p.active !== undefined ? p.active : true,
            found: false, foundKeywords: []
        }));
    } else {
        protocols = [
    // ----- Базовые протоколы -----
    { id: 1, name: 'IPv4', keywords: ['IP', 'Internet Protocol', 'IPv4', 'IP адрес', 'IP address'], operation: '№57', normDoc: 'СТБ 2156 п.5.3.1.1', active: true },
    { id: 2, name: 'IPv6', keywords: ['IPv6','IPV6','Internet Protocol version 6','IP next generation','IPng'], operation: '№57а', normDoc: 'СТБ 2156 п.5.3.1.2', active: true },
    { id: 3, name: 'ARP', keywords: ['ARP', 'Address Resolution Protocol','IPV4','IP'], operation: '№59', normDoc: 'СТБ 2156 п.5.3.5.9', active: true },
    { id: 4, name: 'VLAN', keywords: ['VLAN', 'Virtual LAN', '802.1Q', "Vxlan"], operation: '№44', normDoc: 'СТБ 2156 п.5.3.5.2', active: true },
    { id: 5, name: 'QinQ', keywords: ['QINQ', 'Q-IN-Q', 'Q in Q', 'Vlan stacking', '802.1ad'], operation: '№44 (п.3)', normDoc: 'СТБ 2156 п.5.3.5.3', active: true },
    { id: 6, name: 'ICMP-PING', keywords: ['ICMP', 'Internet Control Message Protocol', ' ping', 'type 0', 'type 8'], operation: '№35 (п.2)', normDoc: 'СТБ 2156 п.5.3.1.3', active: true },
    { id: 7, name: 'TRACE-ROUTE', keywords: ['traceroute', 'trace route', 'tracert', 'type 11'], operation: '№35 (п.4)', normDoc: 'СТБ 2156 п.5.3.1.3', active: true },
    { id: 8, name: 'ICMPv6', keywords: ['ICMPv6','ICMP version 6','Neighbor Discovery','MLD','Multicast Listener Discovery'], operation: '№35а (п.3-4)', normDoc: 'СТБ 2156 п.5.3.1.4', active: true },

    // ----- DHCP и подпротоколы -----
    { id: 9, name: 'DHCP', keywords: ['DHCP', 'Dynamic Host Configuration Protocol', 'DHCP-сервер','DHCP-client', 'DHCP-клиент','BOOTP','Dynamic Ip Allocation'], operation: '№34', normDoc: 'СТБ 2156 п.5.3.3.10', active: true },
    { id: 10, name: 'DHCP-SERVER', keywords: ['DHCP-SERVER', 'DHCP SERVER', 'DHCP сервер', 'DHCP-сервер'], operation: '№34 (п.5)', normDoc: 'СТБ 2156 п.5.3.3.10', active: true },
    { id: 11, name: 'DHCP-Client', keywords: ['DHCP-CLIENT', 'DHCP CLIENT', 'DHCP клиент', 'DHCP-клиент'], operation: '№34 (п.6)', normDoc: 'СТБ 2156 п.5.3.3.10', active: true },
    { id: 12, name: 'DHCPv6', keywords: ['DHCPv6','DHCP version 6','DHCP for IPv6','IPv6 DHCP'], operation: '№34', normDoc: 'СТБ 2156 п.5.3.3.11', active: true },
    { id: 13, name: 'DHCP-RELAY', keywords: ['DHCP-relay', 'dhcp relay'], operation: '№34 (п.2)', normDoc: 'СТБ 2156 п.5.3.3.10', active: true },
    { id: 14, name: 'DHCP-Snooping', keywords: ['DHCP snooping', 'DHCP-snooping'], operation: '№34 (п.3)', normDoc: 'СТБ 2156 п.5.3.3.10', active: true },
    { id: 15, name: 'DHCP IP Anti-Spoofing', keywords: ['bind', 'source-guard', 'source guard', 'Binding'], operation: '№34 (п.4)', normDoc: 'СТБ 2156 п.5.3.3.10', active: true },

    // ----- RIP и IGMP -----
    { id: 16, name: 'RIP', keywords: ['RIP', 'Routing Information Protocol'], operation: '№60', normDoc: 'СТБ 2156 п.5.3.3.16', active: true },
    { id: 17, name: 'IGMP', keywords: ['IGMP', 'multicast'], operation: '№61', normDoc: 'СТБ 2156 п.5.3.1.7', active: true },
    { id: 18, name: 'IGMP-SNOOPING', keywords: ['IGMP-SNOOPING', 'IGMP SNOOPING', 'IGMP v1/v2/v3 Snooping'], operation: '№61 (п.3)', normDoc: 'СТБ 2156 п.5.3.1.7', active: true },
    { id: 19, name: 'IGMP FAST Leave', keywords: ['IGMP FAST Leave'], operation: '№61 (п.4)', normDoc: 'СТБ 2156 п.5.3.1.7', active: true },
    { id: 20, name: 'IGMP-PROXY', keywords: ['IGMP-PROXY', 'IGMP PROXY'], operation: '№61 (п.2)', normDoc: 'СТБ 2156 п.5.3.1.7', active: true },
    { id: 21, name: 'IGMP V3', keywords: ['IGMP V3','IGMP VERSION 3','IGMP VERSION 2, 3', 'IGMPv1/v2/v3'], operation: '№61 (п.5)', normDoc: 'СТБ 2156 п.5.3.1.7', active: true },

    // ----- Транспортные протоколы -----
    { id: 22, name: 'UDP', keywords: ['UDP', 'User Datagram Protocol', 'SNMP', 'DHCP'], operation: '№58', normDoc: 'СТБ 2156 п.5.3.2.1', active: true },
    { id: 23, name: 'TCP', keywords: ['TCP', 'Transmission Control Protocol', 'TELNET', 'SSH', 'HTTP', 'HTTPS', 'WEB'], operation: '№58', normDoc: 'СТБ 2156 п.5.3.2.2', active: true },

    // ----- Диагностика и оборудование -----
    { id: 24, name: 'RJ45', keywords: ['RJ45','1000base-t','1000 base-t', 'ethernet', 'eth','copper'], operation: '№2', normDoc: 'СТБ 2156 п.5.4.1.1 (L2); п.5.4.1.2 (L3)', active: true },
    { id: 25, name: 'SFP', keywords: ['SFP','SFP+','1000 base-t','1000base-x', '10g', '100g', 'fiber', 'optical', 'QSFP', 'QSFP+'], operation: '№2', normDoc: 'СТБ 2156 п.5.4.1.1 (L2); п.5.4.1.2 (L3)', active: true },
    { id: 26, name: 'SNMP', keywords: ['SNMP', 'Simple Network Management Protocol', 'SNMP v1', 'SNMP v2', 'SNMP v3', 'TRAP', 'MIB'], operation: '№3 (п.2-7): вкл/выкл/настройка порта, выдача информации о конфигурации, о системе (версия ПО), о статусе портов, сообщения TRAP, информация о MIB', normDoc: 'СТБ 2156 п.5.5.3; 02.МИ.038 п.3.3.12', active: true },
    { id: 27, name: 'HTTP-HTTPS', keywords: ['HTTP', 'Hypertext Transfer Protocol', 'HTTP Secure', 'SSL', 'TLS'], operation: '№73 (базовый)', normDoc: 'СТБ 2156 п.5.5.2', active: true },
    { id: 28, name: 'WEB', keywords: ['WEB', 'web interface', 'gui', 'веб интерфейс', 'eweb'], operation: '№73 (п.2-11): вход по логину, смена пароля, обновление прошивки, просмотр информации о модели, настройка интерфейса, просмотр конфигураций, диагностика, настройка аккаунтов, просмотр статуса, история вызовов', normDoc: 'СТБ 2156 п.5.5.2', active: true }
];
    }
    updateStats();
    renderProtocolsGrid();
}

function saveProtocols() {
    const toSave = protocols.map(p => ({
        id: p.id,
        name: p.name,
        keywords: p.keywords,
        description: p.description || '',
        operation: p.operation || '',
        normDoc: p.normDoc || '',
        active: p.active !== undefined ? p.active : true
    }));
    localStorage.setItem('protocolsDictionary', JSON.stringify(toSave));
}

// =====================================================
// ДОБАВЛЕНИЕ ПОЛЬЗОВАТЕЛЬСКОГО ПРОТОКОЛА
// =====================================================
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
    if (protocols.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        alert('Такой параметр уже есть');
        return;
    }

    const keywords = keywordsStr.split(',').map(k => k.trim()).filter(k => k);
    const newId = Math.max(...protocols.map(p => p.id), 0) + 1;

    protocols.push({
        id: newId,
        name: name,
        keywords: keywords,
        description: desc,
        operation: '',
        normDoc: '',
        active: true,
        found: false,
        foundKeywords: []
    });

    saveProtocols();
    closeAddModal();
    renderProtocolsGrid();
    updateStats();
    showNotification(`✅ Параметр "${name}" добавлен`);
}

// =====================================================
// УДАЛЕНИЕ ВСЕХ ПОЛЬЗОВАТЕЛЬСКИХ ПРОТОКОЛОВ
// =====================================================
function deleteAllUserProtocols() {
    const userProtocols = protocols.filter(p => p.id > 28);
    const count = userProtocols.length;
    if (count === 0) {
        alert('❌ Нет добавленных параметров для удаления');
        return;
    }
    if (confirm(`🗑 Удалить ВСЕ добавленные параметры (${count} шт.)? Базовые 28 параметров останутся.`)) {
        protocols = protocols.filter(p => p.id <= 28);
        saveProtocols();
        renderProtocolsGrid();
        updateStats();
        showNotification(`✅ Удалено ${count} параметров`);
    }
}

// =====================================================
// ОЧИСТКА ТЕКСТА
// =====================================================
function cleanText(text) {
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

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// =====================================================
// ПОДСВЕТКА
// =====================================================
function showHighlightedText() {
    if (!originalText || originalText.trim() === '') {
        showNotification('Нет текста для подсветки');
        return;
    }
    const highlightSection = document.getElementById('highlightSection');
    const container = document.getElementById('highlightedText');
    if (!highlightSection || !container) return;

    const foundKeywords = [];
    protocols.forEach(p => {
        if (p.found && p.foundKeywords) {
            p.foundKeywords.forEach(kw => foundKeywords.push(kw.toLowerCase()));
        }
    });

    const uniqueKeywords = [...new Set(foundKeywords)];
    uniqueKeywords.sort((a, b) => b.length - a.length);

    const words = originalText.split(/\s+/);

    const highlighted = words.map(word => {
        const wordLower = word.toLowerCase();
        const cleanWord = wordLower.replace(/[.,!?;:()\[\]{}"'`~@#№$%^&*]/g, '');
        if (uniqueKeywords.includes(cleanWord)) {
            return `<span class="highlight">${escapeHtml(word)}</span>`;
        }
        return escapeHtml(word);
    }).join(' ');

    container.innerHTML = highlighted;
    highlightSection.classList.remove('hidden');
}

function hideHighlightedText() {
    document.getElementById('highlightSection').classList.add('hidden');
}

// =====================================================
// АНАЛИЗ ТЕКСТА
// =====================================================
function analyzeText(text) {
    if (!text || !text.trim()) {
        showNotification('Нет текста для анализа');
        return;
    }
    originalText = text;
    let clean = cleanText(text);
    const lowerText = clean.toLowerCase();

    const words = lowerText.split(/\s+/).filter(w => w.length > 0);

    protocols.forEach(p => {
        p.found = false;
        p.foundKeywords = [];
        for (const kw of p.keywords) {
            const lowerKw = kw.toLowerCase();
            if (lowerKw.includes('http') || lowerKw.includes('www')) continue;

            if (words.some(word => word === lowerKw)) {
                p.found = true;
                if (!p.foundKeywords.includes(kw)) p.foundKeywords.push(kw);
            }
        }
    });

    extractDeviceInfo(clean);

    currentFilter = 'found';
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.filter-btn[data-filter="found"]')?.classList.add('active');
    renderProtocolsGrid();
    updateStats();
    const foundCount = protocols.filter(p => p.found).length;
    showNotification(`Анализ завершен! Подтверждено ${foundCount} из ${protocols.length} параметров`);
}

// =====================================================
// ИЗВЛЕЧЕНИЕ ДАННЫХ ОБ ОБОРУДОВАНИИ (АВТОЗАПОЛНЕНИЕ)
// =====================================================
function extractDeviceInfo(text) {
    if (!text || text.trim() === '') return;
    let name = '', model = '', vendor = '';

    const nameMatch = text.match(/Device\s*[:;]\s*([^\n\r,]+)/i) ||
                      text.match(/Оборудование\s*[:;]\s*([^\n\r,]+)/i) ||
                      text.match(/Equipment\s*[:;]\s*([^\n\r,]+)/i) ||
                      text.match(/Product\s*Name\s*[:;]\s*([^\n\r,]+)/i);
    if (nameMatch) name = nameMatch[1].trim();

    const modelMatch = text.match(/Model\s*[:;]\s*([^\n\r,]+)/i) ||
                       text.match(/Модель\s*[:;]\s*([^\n\r,]+)/i) ||
                       text.match(/Part\s*No\s*[:;]\s*([^\n\r,]+)/i) ||
                       text.match(/P\/N\s*[:;]\s*([^\n\r,]+)/i) ||
                       text.match(/Product\s*ID\s*[:;]\s*([^\n\r,]+)/i) ||
                       text.match(/([A-Z]{2,5}-\d{4,5}[-A-Z\d]*)/i);
    if (modelMatch) model = modelMatch[1].trim();

    const vendorMatch = text.match(/Vendor\s*[:;]\s*([^\n\r,]+)/i) ||
                        text.match(/Производитель\s*[:;]\s*([^\n\r,]+)/i) ||
                        text.match(/Manufacturer\s*[:;]\s*([^\n\r,]+)/i) ||
                        text.match(/Brand\s*[:;]\s*([^\n\r,]+)/i) ||
                        text.match(/\b(Cisco|Huawei|Juniper|Eltex|D-Link|HPE|Aruba)\b/i);
    if (vendorMatch) vendor = vendorMatch[1].trim();

    const nameInput = document.getElementById('deviceName');
    const modelInput = document.getElementById('deviceModel');
    const vendorInput = document.getElementById('deviceVendor');
    const dateInput = document.getElementById('testDate');

    if (nameInput && name) nameInput.value = name;
    if (modelInput && model) modelInput.value = model;
    if (vendorInput && vendor) vendorInput.value = vendor;
    if (dateInput && !dateInput.value) {
        const today = new Date();
        dateInput.value = today.toISOString().slice(0, 10);
    }
}

// =====================================================
// СБРОС РЕЗУЛЬТАТОВ
// =====================================================
function resetResults(keepText = false) {
    protocols.forEach(p => { p.found = false; p.foundKeywords = []; });
    if (!keepText) {
        pdfText = '';
        originalText = '';
        document.getElementById('manualText').value = '';
        lastLoadedFile = null;
        hideHighlightedText();
    }
    renderProtocolsGrid();
    updateStats();
    if (!keepText) showNotification('Результаты сброшены');
}

function fullReset() { resetResults(false); }

// =====================================================
// ОТОБРАЖЕНИЕ
// =====================================================
function renderProtocolsGrid() {
    const grid = document.getElementById('protocolsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    let filtered = protocols;
    if (currentFilter === 'found') filtered = protocols.filter(p => p.found);
    if (currentFilter === 'notFound') filtered = protocols.filter(p => !p.found);

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="empty-state">📭 Нет параметров для отображения</div>';
        return;
    }

    filtered.forEach(p => {
        const card = document.createElement('div');
        card.className = `protocol-card ${p.found ? 'found' : ''}`;
        card.setAttribute('data-id', p.id);

        const hint = getHint(p.name, p.description);
        const foundHtml = p.foundKeywords?.length ?
            `<div class="protocol-details"><strong>🔍 Найдено по:</strong> ${escapeHtml(p.foundKeywords.join(', '))}</div>` :
            '';

        const extraHtml = `
            <div style="margin-top:8px; font-size:0.85em; color:var(--text-muted); border-top:1px solid var(--border-color); padding-top:8px; word-wrap:break-word; white-space:normal; max-width:100%;">
                <div><strong>📋 Перечень операций:</strong> ${escapeHtml(p.operation || '-')}</div>
                <div><strong>📄 Нормативный документ:</strong> ${escapeHtml(p.normDoc || '-')}</div>
            </div>
        `;

        card.innerHTML = `
            <h4 style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap;">
                <span>${escapeHtml(p.name)}</span>
                <span class="status ${p.found ? 'found' : 'not-found'}">${p.found ? '✓ Найден' : '✗ Не найден'}</span>
            </h4>
            <div class="keywords"><strong>📝 Ключевые слова:</strong><br>${escapeHtml(p.keywords.join(', '))}</div>
            <div class="protocol-hint hidden" id="hint-${p.id}">
                <strong>💡 Подсказка:</strong><br>${escapeHtml(hint)}
                ${extraHtml}
            </div>
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

// =====================================================
// ЗАГРУЗКА ФАЙЛОВ
// =====================================================
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
    } catch(e) {
        showLoading(false);
        if (e.message && e.message.toLowerCase().includes('password')) {
            alert('🔒 Файл защищён паролем. Снимите защиту и попробуйте снова.');
        } else if (e.message && (e.message.toLowerCase().includes('invalid') || e.message.toLowerCase().includes('corrupt'))) {
            alert('📄 Файл повреждён или не является PDF. Проверьте файл и попробуйте снова.');
        } else {
            alert('❌ Неизвестная ошибка при чтении PDF. Попробуйте перезагрузить страницу или использовать другой файл.');
        }
        console.error('Ошибка чтения PDF:', e);
    }
}

function parseText(file) {
    const reader = new FileReader();
    reader.onload = e => {
        pdfText = e.target.result;
        analyzeText(pdfText);
        showNotification('Файл загружен');
    };
    reader.onerror = () => {
        alert('Не удалось прочитать текстовый файл. Проверьте кодировку (UTF-8).');
    };
    reader.readAsText(file, 'UTF-8');
}

function parseManual() {
    const text = document.getElementById('manualText').value;
    if (!text.trim()) { alert('Введите текст'); return; }
    resetResults(true);
    pdfText = text;
    analyzeText(pdfText);
}

// =====================================================
// UI
// =====================================================
function showLoading(show) {
    const el = document.getElementById('pdfLoading');
    if (el) show ? el.classList.remove('hidden') : el.classList.add('hidden');
}

function updateProgress(p) {
    document.getElementById('progressText').textContent = `${p}%`;
}

function showNotification(msg) {
    const n = document.createElement('div');
    n.className = 'notification-toast';
    n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3000);
}

function openTemplateModal() {
    document.getElementById('templateModal').classList.remove('hidden');
}

function closeTemplateModal() {
    document.getElementById('templateModal').classList.add('hidden');
}

// =====================================================
// ГЕНЕРАЦИЯ DOCX-ОТЧЁТА (С КОРОТКИМИ ПЕРЕЧНЯМИ И ТАБЛИЦАМИ НА ВСЮ ШИРИНУ)
// =====================================================
function generateDocx() {
    try {
        const name = document.getElementById('deviceName')?.value || 'Не указано';
        const model = document.getElementById('deviceModel')?.value || 'Не указано';
        const vendor = document.getElementById('deviceVendor')?.value || 'Не указано';
        const date = document.getElementById('testDate')?.value || new Date().toISOString().slice(0,10);
        const found = protocols.filter(p => p.found === true && p.active === true);
        const percent = Math.round(found.length / protocols.length * 100);

        const zip = new JSZip();
        zip.file("[Content_Types].xml", `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`);
        zip.file("_rels/.rels", `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
        zip.file("word/_rels/document.xml.rels", `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"></Relationships>`);

        // Короткие версии operation для отчёта (без расшифровки)
        const operationShort = {
            '26': '№3 (п.2-7)',
            '28': '№73 (п.2-11)'
        };

        let foundRows = '';
        found.forEach((p, i) => {
            const op = operationShort[p.id] || p.operation || '-';
            foundRows += `<w:tr>
                <w:tc><w:p><w:r><w:t>${i+1}</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>${escapeXml(p.name)}</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>${escapeXml(op)}</w:t></w:r></w:p></w:tc>
                <w:tc><w:p><w:r><w:t>${escapeXml(p.normDoc || '-')}</w:t></w:r></w:p></w:tc>
            </w:tr>`;
        });

        let color = percent >= 80 ? '16A34A' : (percent >= 60 ? 'EAB308' : (percent >= 40 ? 'F97316' : 'EF4444'));

        const doc = `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
        <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="44"/><w:color w:val="5B21B6"/></w:rPr><w:t>📊 ОТЧЕТ О ПОДДЕРЖКЕ ПАРАМЕТРОВ</w:t></w:r></w:p>
        <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:i/><w:sz w:val="28"/><w:color w:val="8B5CF6"/></w:rPr><w:t>Программа автоматического анализа и верификации технических характеристик телекоммуникационного оборудования</w:t></w:r></w:p>
        <w:p><w:r><w:t> </w:t></w:r></w:p>

        <!-- Информация об оборудовании -->
        <w:tbl>
            <w:tblPr>
                <w:tblW w:w="100%" w:type="pct"/>
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
                <w:tc><w:tcW w:w="25%"/><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Параметр</w:t></w:r></w:p></w:tc>
                <w:tc><w:tcW w:w="75%"/><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Значение</w:t></w:r></w:p></w:tc>
            </w:tr>
            <w:tr><w:tc><w:p><w:r><w:t>Наименование оборудования</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>${escapeXml(name)}</w:t></w:r></w:p></w:tc></w:tr>
            <w:tr><w:tc><w:p><w:r><w:t>Модель</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>${escapeXml(model)}</w:t></w:r></w:p></w:tc></w:tr>
            <w:tr><w:tc><w:p><w:r><w:t>Производитель</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>${escapeXml(vendor)}</w:t></w:r></w:p></w:tc></w:tr>
            <w:tr><w:tc><w:p><w:r><w:t>Дата тестирования</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>${escapeXml(date)}</w:t></w:r></w:p></w:tc></w:tr>
            <w:tr><w:tc><w:p><w:r><w:t>Дата отчета</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>${escapeXml(new Date().toLocaleString('ru-RU'))}</w:t></w:r></w:p></w:tc></w:tr>
        </w:tbl>
        <w:p><w:r><w:t> </w:t></w:r></w:p>

        <!-- Статистика -->
        <w:tbl>
            <w:tblPr>
                <w:tblW w:w="100%" w:type="pct"/>
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
                <w:tc><w:tcW w:w="50%"/><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Показатель</w:t></w:r></w:p></w:tc>
                <w:tc><w:tcW w:w="50%"/><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Результат</w:t></w:r></w:p></w:tc>
            </w:tr>
            <w:tr><w:tc><w:p><w:r><w:t>Всего параметров</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>${protocols.length}</w:t></w:r></w:p></w:tc></w:tr>
            <w:tr><w:tc><w:p><w:r><w:t>Подтверждено</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:rPr><w:color w:val="16A34A"/></w:rPr><w:t>${found.length}</w:t></w:r></w:p></w:tc></w:tr>
            <w:tr><w:tc><w:p><w:r><w:t>Процент соответствия</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="${color}"/></w:rPr><w:t>${percent}%</w:t></w:r></w:p></w:tc></w:tr>
        </w:tbl>
        <w:p><w:r><w:t> </w:t></w:r></w:p>

        <!-- Таблица подтверждённых параметров (на всю ширину) -->
        ${found.length ? `<w:p><w:r><w:rPr><w:b/><w:sz w:val="28"/></w:rPr><w:t>✅ ПОДТВЕРЖДЕННЫЕ ПАРАМЕТРЫ</w:t></w:r></w:p>
        <w:tbl>
            <w:tblPr>
                <w:tblW w:w="100%" w:type="pct"/>
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
                <w:tc><w:tcW w:w="10%"/><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>№</w:t></w:r></w:p></w:tc>
                <w:tc><w:tcW w:w="30%"/><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Параметр</w:t></w:r></w:p></w:tc>
                <w:tc><w:tcW w:w="30%"/><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Перечень операций</w:t></w:r></w:p></w:tc>
                <w:tc><w:tcW w:w="30%"/><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Нормативный документ</w:t></w:r></w:p></w:tc>
            </w:tr>
            ${foundRows}
        </w:tbl>` : `<w:p><w:r><w:rPr><w:color w:val="A78BFA"/><w:i/></w:rPr><w:t>Нет подтверждённых параметров</w:t></w:r></w:p>`}

        <w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:color w:val="A78BFA"/><w:i/></w:rPr><w:t>© 2026 ЦПЛ МЦК</w:t></w:r></w:p>
        </w:body></w:document>`;
        zip.file("word/document.xml", doc);
        zip.generateAsync({ type: "blob" }).then(content => {
            saveAs(content, `Report_${model.replace(/[^a-z0-9]/gi, '_')}_${date}.docx`);
            closeTemplateModal();
            showNotification('DOCX создан!');
        });
    } catch(e) { alert('Ошибка: ' + e.message); }
}

function escapeXml(s) {
    if (!s) return '';
    return s.toString().replace(/[&<>]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m] || m));
}

// =====================================================
// ОБРАБОТЧИКИ СОБЫТИЙ
// =====================================================
function initEventListeners() {
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
    document.getElementById('selectFileBtn')?.addEventListener('click', () => document.getElementById('fileInput').click());
    document.getElementById('fileInput')?.addEventListener('change', handleFileUpload);
    document.getElementById('parseTextBtn')?.addEventListener('click', parseManual);
    document.getElementById('exportDocxBtn')?.addEventListener('click', openTemplateModal);
    document.getElementById('closeTemplateBtn')?.addEventListener('click', closeTemplateModal);
    document.getElementById('generateDocxBtn')?.addEventListener('click', generateDocx);
    document.getElementById('resetAnalysisBtn')?.addEventListener('click', fullReset);
    document.getElementById('showHighlightBtn')?.addEventListener('click', showHighlightedText);
    document.getElementById('closeHighlightBtn')?.addEventListener('click', hideHighlightedText);
    document.getElementById('addProtocolBtn')?.addEventListener('click', openAddModal);
    document.getElementById('closeAddModalBtn')?.addEventListener('click', closeAddModal);
    document.getElementById('confirmAddProtocolBtn')?.addEventListener('click', addProtocol);
    document.getElementById('forceDeleteAllBtn')?.addEventListener('click', deleteAllUserProtocols);
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

// =====================================================
// ДИНАМИЧЕСКИЕ СТИЛИ
// =====================================================
if (!document.querySelector('#dynamic-styles')) {
    const s = document.createElement('style');
    s.id = 'dynamic-styles';
    s.textContent = `
        .protocol-hint { margin-top:12px; padding:12px; background:var(--bg-upload); border-radius:12px; font-size:0.9em; color:var(--text-secondary); border-left:3px solid #8b5cf6; }
        .protocol-hint.hidden { display:none; }
        .notification-toast { position:fixed; bottom:20px; right:20px; background:linear-gradient(135deg,#8b5cf6,#7c3aed); color:#fff; padding:14px 28px; border-radius:50px; z-index:1000; animation:slideInRight 0.4s; font-size:14px; font-weight:500; }
        .empty-state { text-align:center; padding:60px 20px; background:var(--bg-upload); border-radius:20px; color:var(--text-secondary); grid-column:1/-1; border:2px dashed var(--border-color); }
        @keyframes slideInRight { from { transform:translateX(100%); opacity:0; } to { transform:translateX(0); opacity:1; } }
        @keyframes slideOut { from { transform:translateX(0); opacity:1; } to { transform:translateX(100%); opacity:0; } }
        .badge-white { font-size:0.6em; background:linear-gradient(135deg,#8b5cf6,#7c3aed); padding:4px 12px; border-radius:50px; display:inline-block; color:#fff; font-weight:600; margin-left:8px; box-shadow:0 2px 8px rgba(139,92,246,0.3); }
    `;
    document.head.appendChild(s);
}