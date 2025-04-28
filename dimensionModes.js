/**
 * Controlador para alternar entre modos de dimensionamento da faixa
 * (por dimensões em cm ou por número de folhas)
 */

// Estado
let currentDimensionMode = 'dimensions'; // 'dimensions' ou 'sheets'
let initializing = true; // Flag para controlar inicialização

/**
 * Inicializa os controles de modo de dimensionamento
 */
function initDimensionModes() {
    // Elementos do DOM
    const dimensionModeBtn = document.getElementById('dimension-mode-btn');
    const sheetCountModeBtn = document.getElementById('sheet-count-mode-btn');
    const dimensionsInput = document.getElementById('dimensions-input');
    const sheetCountInput = document.getElementById('sheet-count-input');
    const sheetsWidthInput = document.getElementById('sheets-width');
    const sheetsHeightInput = document.getElementById('sheets-height');
    
    // Carregar modo salvo, se existir
    const configString = localStorage.getItem('bannerConfig');
    if (configString) {
        try {
            const config = JSON.parse(configString);
            if (config.dimensionMode) {
                currentDimensionMode = config.dimensionMode;
                // Atualizar interface com base no modo salvo
                if (currentDimensionMode === 'sheets') {
                    dimensionModeBtn.classList.remove('active');
                    sheetCountModeBtn.classList.add('active');
                    dimensionsInput.classList.remove('active');
                    sheetCountInput.classList.add('active');
                } else {
                    dimensionModeBtn.classList.add('active');
                    sheetCountModeBtn.classList.remove('active');
                    dimensionsInput.classList.add('active');
                    sheetCountInput.classList.remove('active');
                }
            }
        } catch (e) {
            console.error("Erro ao carregar modo de dimensionamento:", e);
        }
    }

    // Configurar event listeners
    dimensionModeBtn.addEventListener('click', () => switchMode('dimensions'));
    sheetCountModeBtn.addEventListener('click', () => switchMode('sheets'));
    
    // Event listeners para atualização automática entre os modos
    bannerWidthInput.addEventListener('input', updateSheetsFromDimensions);
    bannerHeightInput.addEventListener('input', updateSheetsFromDimensions);
    sheetsWidthInput.addEventListener('input', updateDimensionsFromSheets);
    sheetsHeightInput.addEventListener('input', updateDimensionsFromSheets);
    
    // Permitir que o carregamento inicial da configuração seja concluído antes
    // de habilitar as atualizações automáticas entre modos
    setTimeout(() => {
        initializing = false;
    }, 500); // Aumentado para 500ms para garantir que o carregamento termine
}

/**
 * Alterna entre os modos de dimensionamento
 * @param {string} mode - 'dimensions' ou 'sheets'
 */
function switchMode(mode) {
    const dimensionModeBtn = document.getElementById('dimension-mode-btn');
    const sheetCountModeBtn = document.getElementById('sheet-count-mode-btn');
    const dimensionsInput = document.getElementById('dimensions-input');
    const sheetCountInput = document.getElementById('sheet-count-input');
    
    // Se o modo for o mesmo, não fazer nada
    if (currentDimensionMode === mode) return;
    
    currentDimensionMode = mode;
    
    // Atualizar classes de botões
    if (mode === 'dimensions') {
        dimensionModeBtn.classList.add('active');
        sheetCountModeBtn.classList.remove('active');
        dimensionsInput.classList.add('active');
        sheetCountInput.classList.remove('active');
    } else {
        dimensionModeBtn.classList.remove('active');
        sheetCountModeBtn.classList.add('active');
        dimensionsInput.classList.remove('active');
        sheetCountInput.classList.add('active');
    }
    
    // Se não estiver inicializando, atualizar valores entre modos
    if (!initializing) {
        // Se mudar para o modo de folhas, atualizar os valores com base nas dimensões atuais
        if (mode === 'sheets') {
            updateSheetsFromDimensions();
        } else {
            updateDimensionsFromSheets();
        }
        
        // Atualizar visualização somente se não estiver inicializando
        updateVisualization();
    }
}

/**
 * Calcula o número de folhas necessárias com base nas dimensões
 */
function updateSheetsFromDimensions() {
    const sheetsWidthInput = document.getElementById('sheets-width');
    const sheetsHeightInput = document.getElementById('sheets-height');
    
    // Se estiver inicializando, não sobreescrever os valores
    if (initializing) return;
    
    // Obter dimensões da faixa em cm
    const bannerWidth = parseFloat(bannerWidthInput.value) || 100;
    const bannerHeight = parseFloat(bannerHeightInput.value) || 50;
    
    // Obter dimensões de uma folha A4 com base na orientação
    const a4 = getA4Dimensions();
    const marginInCm = sheetMargin * MM_TO_CM;
    
    // Calcular número de folhas efetivamente necessárias
    const effectiveSheetWidth = a4.width - marginInCm;
    const effectiveSheetHeight = a4.height - marginInCm;
    
    // Calcular e arredondar para cima o número de folhas
    const sheetsWidth = Math.ceil(bannerWidth / effectiveSheetWidth);
    const sheetsHeight = Math.ceil(bannerHeight / effectiveSheetHeight);
    
    // Atualizar os campos de entrada sem disparar eventos
    sheetsWidthInput.value = sheetsWidth;
    sheetsHeightInput.value = sheetsHeight;
}

/**
 * Calcula as dimensões da faixa com base no número de folhas
 */
function updateDimensionsFromSheets() {
    const sheetsWidthInput = document.getElementById('sheets-width');
    const sheetsHeightInput = document.getElementById('sheets-height');
    
    // Se estiver inicializando, não sobreescrever os valores
    if (initializing) return;
    
    // Obter número de folhas
    const sheetsWidth = parseInt(sheetsWidthInput.value) || 1;
    const sheetsHeight = parseInt(sheetsHeightInput.value) || 1;
    
    // Obter dimensões de uma folha A4 com base na orientação
    const a4 = getA4Dimensions();
    const marginInCm = sheetMargin * MM_TO_CM;
    
    // Calcular dimensões efetivas da faixa
    const effectiveSheetWidth = a4.width - marginInCm;
    const effectiveSheetHeight = a4.height - marginInCm;
    
    // Calcular dimensões totais
    const bannerWidth = sheetsWidth * effectiveSheetWidth;
    const bannerHeight = sheetsHeight * effectiveSheetHeight;
    
    // Atualizar os campos de entrada sem disparar eventos
    bannerWidthInput.value = bannerWidth.toFixed(1);
    bannerHeightInput.value = bannerHeight.toFixed(1);
}

/**
 * Obtém o modo de dimensionamento atual
 * @returns {string} 'dimensions' ou 'sheets'
 */
function getCurrentDimensionMode() {
    return currentDimensionMode;
}

/**
 * Define externamente o modo de dimensionamento 
 * usado quando o script principal carrega a configuração
 */
function setDimensionMode(mode) {
    if (mode === 'dimensions' || mode === 'sheets') {
        currentDimensionMode = mode;
    }
}