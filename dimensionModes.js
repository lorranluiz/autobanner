/**
 * Controlador para alternar entre modos de dimensionamento da faixa
 * (por dimensões em cm ou por número de folhas)
 */

// Estado
let currentDimensionMode = 'dimensions'; // 'dimensions' ou 'sheets'

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

    // Configurar event listeners
    dimensionModeBtn.addEventListener('click', () => switchMode('dimensions'));
    sheetCountModeBtn.addEventListener('click', () => switchMode('sheets'));
    
    // Event listeners para atualização automática entre os modos
    bannerWidthInput.addEventListener('input', updateSheetsFromDimensions);
    bannerHeightInput.addEventListener('input', updateSheetsFromDimensions);
    sheetsWidthInput.addEventListener('input', updateDimensionsFromSheets);
    sheetsHeightInput.addEventListener('input', updateDimensionsFromSheets);
    
    // Atualizar inicialmente o número de folhas com base nas dimensões padrão
    updateSheetsFromDimensions();
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
    
    // Se mudar para o modo de folhas, atualizar os valores com base nas dimensões atuais
    if (mode === 'sheets') {
        updateSheetsFromDimensions();
    } else {
        updateDimensionsFromSheets();
    }
    
    // Atualizar visualização
    updateVisualization();
}

/**
 * Calcula o número de folhas necessárias com base nas dimensões
 */
function updateSheetsFromDimensions() {
    const sheetsWidthInput = document.getElementById('sheets-width');
    const sheetsHeightInput = document.getElementById('sheets-height');
    
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
