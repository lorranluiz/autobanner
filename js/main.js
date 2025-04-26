```javascript
// Adicionar ao início do arquivo main.js ou onde faz as importações
import { drawBanner } from './bannerRenderer.js';

// Constantes para as dimensões da folha A4
const A4_WIDTH_LANDSCAPE = 29.7;
const A4_HEIGHT_LANDSCAPE = 21;
const A4_WIDTH_PORTRAIT = 21;
const A4_HEIGHT_PORTRAIT = 29.7;

// Fator de conversão de cm para pixels e mm para cm
const CM_TO_PIXEL_BASE = 5; // Base value for 100% zoom
const MM_TO_CM = 0.1;

// Elementos do DOM
const bannerWidthInput = document.getElementById("banner-width");
const bannerHeightInput = document.getElementById("banner-height");
const sheetCountElement = document.getElementById("sheet-count");
const sheetDistributionElement = document.getElementById("sheet-distribution");
const sheetDimensionsElement = document.getElementById("sheet-dimensions");
const paperEfficiencyElement = document.getElementById("paper-efficiency");
const canvas = document.getElementById("banner-canvas");
const ctx = canvas.getContext("2d");
const themeToggle = document.getElementById("theme-toggle");
const orientationToggle = document.getElementById("orientation-toggle");
const marginSlider = document.getElementById("margin-slider");
const marginValueDisplay = document.getElementById("margin-value");
const zoomSlider = document.getElementById("zoom-slider");
const zoomValueDisplay = document.getElementById("zoom-value");
const exportButton = document.getElementById("export-button");

// Elementos adicionais do DOM
const showNumbersCheckbox = document.getElementById("show-numbers");
const toggleAdvancedButton = document.getElementById("toggle-advanced");
const advancedPanel = document.querySelector(".advanced-panel");
const printMarginInput = document.getElementById("print-margin");
const overlapInput = document.getElementById("overlap");
const saveConfigButton = document.getElementById("save-config");
const loadConfigButton = document.getElementById("load-config");
const generateGuideButton = document.getElementById("generate-guide");

// Elementos para upload de imagem
const dropArea = document.getElementById('drop-area');
const fileInput = document.getElementById('file-input');
const resetImageButton = document.getElementById('reset-image');
const removeImageButton = document.getElementById('remove-image');
const imageControls = document.getElementById('image-controls');

// Elementos para geração de PDF
const generatePdfButton = document.getElementById('generate-pdf-button');
const progressModal = document.getElementById('progress-modal');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

// Constantes para geração de PDF
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const BLEED_MM = 3; // Margem de sangria de 3mm
const PRINTABLE_WIDTH_MM = A4_WIDTH_MM - (BLEED_MM * 2);
const PRINTABLE_HEIGHT_MM = A4_HEIGHT_MM - (BLEED_MM * 2);
const MM_TO_POINTS = 2.83465; // 1mm = 2.83465pt (pontos no PDF)
const DPI = 300; // 300 DPI para impressão de alta qualidade
const MM_TO_INCH = 0.0393701; // 1mm = 0.0393701 polegadas

// Variáveis de estado
let isPortrait = false;
let sheetMargin = 0; // em mm
let zoomLevel = 5; // 5 = 100%
let showNumbers = false;
let printMargin = 5; // em mm
let overlap = 5; // em mm

// Variáveis para a imagem
let uploadedImage = null;
let imageX = 0;
let imageY = 0;
let imageWidth = 0;
let imageHeight = 0;
let imageScale = 1;
let originalImageWidth = 0;
let originalImageHeight = 0;
let isDraggingImage = false;

// Função para obter cores baseadas no tema atual
function getThemeColors() {
    const isDarkMode = document.documentElement.classList.contains('dark-mode');
    
    return {
        bannerColor: isDarkMode ? "#444654" : "#f0f0f0",
        bannerBorderColor: isDarkMode ? "#19c37d" : "#10a37f",
        sheetBorderColor: isDarkMode ? "#6c5ce7" : "#4dabf7",
        sheetAltBorderColor: isDarkMode ? "#5b46e4" : "#339af0"
    };
}

// Função para converter cm para pixels considerando o zoom
function cmToPixel(cm) {
    return cm * CM_TO_PIXEL_BASE * (zoomLevel / 5);
}

// Função para obter dimensões da folha A4 com base na orientação
function getA4Dimensions() {
    if (isPortrait) {
        return {
            width: A4_WIDTH_PORTRAIT,
            height: A4_HEIGHT_PORTRAIT,
            description: `21cm x 29.7cm (retrato)`
        };
    } else {
        return {
            width: A4_WIDTH_LANDSCAPE,
            height: A4_HEIGHT_LANDSCAPE,
            description: `29.7cm x 21cm (paisagem)`
        };
    }
}

// Função para calcular quantas folhas A4 cabem na faixa
function calculateSheets(bannerWidth, bannerHeight) {
    const a4 = getA4Dimensions();
    // Converter margem de mm para cm
    const marginInCm = sheetMargin * MM_TO_CM;
    
    // Cálculo considerando margens entre folhas
    const effectiveSheetWidth = a4.width - marginInCm;
    const effectiveSheetHeight = a4.height - marginInCm;
    
    // Número de folhas horizontalmente e verticalmente (com margem)
    const sheetsHorizontal = Math.ceil(bannerWidth / effectiveSheetWidth);
    const sheetsVertical = Math.ceil(bannerHeight / effectiveSheetHeight);
    
    // Total de folhas
    const totalSheets = sheetsHorizontal * sheetsVertical;
    
    // Calcular área total das folhas e da faixa para eficiência
    const totalSheetArea = totalSheets * a4.width * a4.height;
    const bannerArea = bannerWidth * bannerHeight;
    const efficiency = (bannerArea / totalSheetArea) * 100;
    
    return {
        horizontal: sheetsHorizontal,
        vertical: sheetsVertical,
        total: totalSheets,
        efficiency: Math.round(efficiency)
    };
}

// Função para atualizar a visualização quando os valores mudarem
function updateVisualization() {
    console.log("updateVisualization chamado");
    const bannerWidth = parseFloat(bannerWidthInput.value) || 100;
    const bannerHeight = parseFloat(bannerHeightInput.value) || 50;
    
    // Desenhar o banner e obter informações de folhas
    const sheets = drawBanner(ctx, bannerWidth, bannerHeight, calculateSheets, sheetMargin, MM_TO_CM, showNumbers);
    
    // Atualizar as informações
    sheetCountElement.textContent = sheets.total;
    sheetDistributionElement.textContent = `${sheets.horizontal} x ${sheets.vertical}`;
    sheetDimensionsElement.textContent = getA4Dimensions().description;
    paperEfficiencyElement.textContent = `${sheets.efficiency}%`;
}

// Função para alternar o modo escuro
function toggleDarkMode() {
    document.documentElement.classList.toggle('dark-mode');
    
    // Atualizar o canvas com as novas cores
    updateVisualization();
    
    // Salvar a preferência do usuário
    const isDarkMode = document.documentElement.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
}

// Função para alternar orientação do papel
function toggleOrientation() {
    isPortrait = orientationToggle.checked;
    updateVisualization();
}

// Função para atualizar o valor da margem
function updateMargin() {
    sheetMargin = parseInt(marginSlider.value);
    marginValueDisplay.textContent = sheetMargin;
    updateVisualization();
}

// Função para atualizar o valor de zoom
function updateZoom() {
    zoomLevel = parseInt(zoomSlider.value);
    const zoomPercentage = Math.round((zoomLevel / 5) * 100);
    zoomValueDisplay.textContent = `${zoomPercentage}%`;
    updateVisualization();
}

// Função para exportar o canvas como PNG
function exportAsPNG() {
    // Criar um link temporário
    const link = document.createElement('a');
    link.download = 'distribuicao-folhas.png';
    link.href = canvas.toDataURL('image/png');
    
    // Simular um clique no link
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Função para mostrar/esconder numeração das folhas
function toggleNumbers() {
    showNumbers = showNumbersCheckbox.checked;
    updateVisualization();
}

// Função para mostrar/esconder opções avançadas
function toggleAdvancedOptions() {
    advancedPanel.classList.toggle('active');
    toggleAdvancedButton.classList.toggle('active');
}

// Função para atualizar margem de impressão
function updatePrintMargin() {
    printMargin = parseInt(printMarginInput.value) || 0;
    updateVisualization();
}

// Função para atualizar sobreposição
function updateOverlap() {
    overlap = parseInt(overlapInput.value) || 0;
    updateVisualization();
}

// Função para salvar configuração
function saveConfiguration() {
    const config = {
        bannerWidth: parseFloat(bannerWidthInput.value) || 100,
        bannerHeight: parseFloat(bannerHeightInput.value) || 50,
        isPortrait: isPortrait,
        sheetMargin: sheetMargin,
        zoomLevel: zoomLevel,
        showNumbers: showNumbers,
        printMargin: printMargin,
        overlap: overlap,
        darkMode: document.documentElement.classList.contains('dark-mode')
    };
    
    const configString = JSON.stringify(config);
    localStorage.setItem('bannerConfig', configString);
    
    alert('Configuração salva com sucesso!');
}

// Função para carregar configuração
function loadConfiguration() {
    const configString = localStorage.getItem('bannerConfig');
    if (!configString) {
        alert('Nenhuma configuração salva encontrada!');
        return;
    }
    
    try {
        const config = JSON.parse(configString);
        
        bannerWidthInput.value = config.bannerWidth;
        bannerHeightInput.value = config.bannerHeight;
        orientationToggle.checked = config.isPortrait;
        isPortrait = config.isPortrait;
        marginSlider.value = config.sheetMargin;
        sheetMargin = config.sheetMargin;
        marginValueDisplay.textContent = sheetMargin;
        zoomSlider.value = config.zoomLevel;
        zoomLevel = config.zoomLevel;
        updateZoom();
        showNumbersCheckbox.checked = config.showNumbers;
        showNumbers = config.showNumbers;
        printMarginInput.value = config.printMargin;
        printMargin = config.printMargin;
        overlapInput.value = config.overlap;
        overlap = config.overlap;
        
        if (config.darkMode) {
            document.documentElement.classList.add('dark-mode');
        } else {
            document.documentElement.classList.remove('dark-mode');
        }
        
        updateVisualization();
        alert('Configuração carregada com sucesso!');
    } catch (error) {
        alert('Erro ao carregar configuração!');
        console.error(error);
    }
}

// Função para gerar guia de montagem
function generateMountingGuide() {
    const bannerWidth = parseFloat(bannerWidthInput.value) || 100;
    const bannerHeight = parseFloat(bannerHeightInput.value) || 50;
    const sheets = calculateSheets(bannerWidth, bannerHeight);
    const a4 = getA4Dimensions();
    
    // Criar uma nova janela para o guia
    const guideWindow = window.open('', '_blank');
    guideWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Guia de Montagem de Faixa</title>
            <style>
                body {
                    font-family: 'Inter', Arial, sans-serif;
                    line-height: 1.6;
                    padding: 20px;
                    max-width: 800px;
                    margin: 0 auto;
                }
                h1, h2 {
                    color: #10a37f;
                }
                .step {
                    margin-bottom: 15px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                th, td {
                    border: 1px solid #ddd;
                    padding: 8px;
                    text-align: left;
                }
                th {
                    background-color: #f0f0f0;
                }
                .print-button {
                    padding: 10px 15px;
                    background-color: #10a37f;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                @media print {
                    .print-button {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <button class="print-button" onclick="window.print()">Imprimir Guia</button>
            
            <h1>Guia de Montagem de Faixa</h1>
            
            <h2>Especificações da Faixa</h2>
            <p>Dimensões: ${bannerWidth}cm x ${bannerHeight}cm</p>
            <p>Tamanho da Folha: ${a4.description}</p>
            <p>Total de Folhas Necessárias: ${sheets.total}</p>
            <p>Distribuição: ${sheets.horizontal} x ${sheets.vertical} (largura x altura)</p>
            <p>Aproveitamento do Papel: ${sheets.efficiency}%</p>
            
            <h2>Passo a Passo para Montagem</h2>
            
            <div class="step">
                <h3>1. Preparação</h3>
                <p>Imprima todas as ${sheets.total} folhas em tamanho A4.</p>
                <p>Configure sua impressora para imprimir no modo ${isPortrait ? 'retrato' : 'paisagem'}.</p>
                <p>Deixe uma margem de impressão de ${printMargin}mm em todos os lados.</p>
            </div>
            
            <div class="step">
                <h3>2. Corte</h3>
                <p>Se necessário, corte as margens de impressão, deixando ${overlap}mm para sobreposição.</p>
            </div>
            
            <div class="step">
                <h3>3. Organização</h3>
                <p>Disponha as folhas em uma matriz de ${sheets.horizontal} x ${sheets.vertical} conforme numeração.</p>
                <p>Comece da esquerda para a direita, de cima para baixo.</p>
            </div>
            
            <div class="step">
                <h3>4. Montagem</h3>
                <p>Use fita adesiva para unir as folhas, garantindo que a sobreposição de ${overlap}mm seja mantida.</p>
                <p>Para uma montagem mais resistente, considere usar cola ou fita dupla face no verso.</p>
            </div>
            
            <h2>Mapa de Montagem</h2>
            <table>
                <tr>
                    <th>Linha/Coluna</th>
                    ${Array(sheets.horizontal).fill().map((_, i) => `<th>Coluna ${i+1}</th>`).join('')}
                </tr>
                ${Array(sheets.vertical).fill().map((_, row) => `
                    <tr>
                        <th>Linha ${row+1}</th>
                        ${Array(sheets.horizontal).fill().map((_, col) => {
                            const num = row * sheets.horizontal + col + 1;
                            return num <= sheets.total ? `<td>Folha ${num}</td>` : '<td></td>';
                        }).join('')}
                    </tr>
                `).join('')}
            </table>
            
            <p><em>Guia gerado em ${new Date().toLocaleDateString()} às ${new Date().toLocaleTimeString()}</em></p>
        </body>
        </html>
    `);
}

// Verificar a preferência salva do usuário
function loadThemePreference() {
    if (localStorage.getItem('darkMode') === 'true') {
        document.documentElement.classList.add('dark-mode');
    }
}

// Adicionar event listeners
bannerWidthInput.addEventListener("input", updateVisualization);
bannerHeightInput.addEventListener("input", updateVisualization);
themeToggle.addEventListener("click", toggleDarkMode);
orientationToggle.addEventListener("change", toggleOrientation);
marginSlider.addEventListener("input", updateMargin);
zoomSlider.addEventListener("input", updateZoom);
exportButton.addEventListener("click", exportAsPNG);
showNumbersCheckbox.addEventListener("change", toggleNumbers);
toggleAdvancedButton.addEventListener("click", toggleAdvancedOptions);
printMarginInput.addEventListener("input", updatePrintMargin);
overlapInput.addEventListener("input", updateOverlap);
saveConfigButton.addEventListener("click", saveConfiguration);
loadConfigButton.addEventListener("click", loadConfiguration);
generateGuideButton.addEventListener("click", generateMountingGuide);

// Configurar eventos para o drag and drop
dropArea.addEventListener('click', () => {
    fileInput.click();
});

dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('dragover');
});

dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('dragover');
});

dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('dragover');
    
    if (e.dataTransfer.files.length) {
        handleImageUpload(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
        handleImageUpload(e.target.files[0]);
    }
});

resetImageButton.addEventListener('click', resetImage);
removeImageButton.addEventListener('click', removeImage);

// Função para lidar com o upload de imagem
function handleImageUpload(file) {
    if (!file.type.match('image.*')) {
        alert('Por favor, selecione uma imagem.');
        return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
        uploadedImage = new Image();
        uploadedImage.onload = () => {
            // Calcular dimensões iniciais mantendo proporção
            originalImageWidth = uploadedImage.width;
            originalImageHeight = uploadedImage.height;
            
            // Ajustar à faixa (80% do tamanho da faixa como padrão)
            const bannerWidth = parseFloat(bannerWidthInput.value) || 100;
            const bannerHeight = parseFloat(bannerHeightInput.value) || 50;
            
            // Converter para pixels
            const bannerWidthPx = cmToPixel(bannerWidth);
            const bannerHeightPx = cmToPixel(bannerHeight);
            
            // Calcular escala inicial (80% do tamanho da faixa)
            const widthScale = (bannerWidthPx * 0.8) / originalImageWidth;
            const heightScale = (bannerHeightPx * 0.8) / originalImageHeight;
            imageScale = Math.min(widthScale, heightScale);
            
            imageWidth = originalImageWidth * imageScale;
            imageHeight = originalImageHeight * imageScale;
            
            // Centralizar na faixa
            imageX = (bannerWidthPx - imageWidth) / 2;
            imageY = (bannerHeightPx - imageHeight) / 2;
            
            // Mostrar controles e atualizar canvas
            imageControls.style.display = 'flex';
            dropArea.style.display = 'none';
            
            // Inicializar interact.js
            initializeImageInteraction();
            
            // Certifique-se de que a imagem seja desenhada
            updateVisualization();
            
            console.log("Imagem carregada:", {
                originalWidth: originalImageWidth,
                originalHeight: originalImageHeight,
                displayWidth: imageWidth,
                displayHeight: imageHeight,
                position: { x: imageX, y: imageY }
            });
        };
        uploadedImage.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
}

// Função para redefinir a imagem para posição e tamanho iniciais
function resetImage() {
    if (uploadedImage) {
        const bannerWidth = parseFloat(bannerWidthInput.value) || 100;
        const bannerHeight = parseFloat(bannerHeightInput.value) || 50;
        
        // Converter para pixels
        const bannerWidthPx = cmToPixel(bannerWidth);
        const bannerHeightPx = cmToPixel(bannerHeight);
        
        // Calcular escala inicial (80% do tamanho da faixa)
        const widthScale = (bannerWidthPx * 0.8) / originalImageWidth;
        const heightScale = (bannerHeightPx * 0.8) / originalImageHeight;
        imageScale = Math.min(widthScale, heightScale);
        
        imageWidth = originalImageWidth * imageScale;
        imageHeight = originalImageHeight * imageScale;
        
        // Centralizar na faixa
        imageX = (bannerWidthPx - imageWidth) / 2;
        imageY = (bannerHeightPx - imageHeight) / 2;
        
        // Atualizar o manipulador
        updateManipulatorPosition();
        
        // Redesenhar o canvas
        updateVisualization();
    }
}

// Função para remover a imagem
function removeImage() {
    uploadedImage = null;
    fileInput.value = '';
    imageControls.style.display = 'none';
    dropArea.style.display = 'block';
    updateVisualization();
    const imageManipulator = document.getElementById('image-manipulator');
    if (imageManipulator) {
        document.body.removeChild(imageManipulator);
    }
    isDraggingImage = false;
}

// Inicializar
window.addEventListener("load", () => {
    loadThemePreference();
    updateMargin(); // Inicializa o valor da margem
    updateZoom(); // Inicializa o valor do zoom
    updateVisualization();
});

// Função para inicializar interact.js após o carregamento da imagem
function initializeImageInteraction() {
    // Remover manipulador existente se houver
    const existingManipulator = document.getElementById('image-manipulator');
    if (existingManipulator) {
        document.body.removeChild(existingManipulator);
    }
    
    // Obter a posição atual do canvas
    const canvasRect = canvas.getBoundingClientRect();
    
    // Criar o manipulador de imagem
    const imageManipulator = document.createElement('div');
    imageManipulator.id = 'image-manipulator';
    imageManipulator.style.position = 'absolute';
    imageManipulator.style.width = `${imageWidth}px`;
    imageManipulator.style.height = `${imageHeight}px`;
    imageManipulator.style.left = `${canvasRect.left + 30 + imageX}px`;
    imageManipulator.style.top = `${canvasRect.top + 30 + imageY}px`;
    imageManipulator.style.cursor = 'move';
    imageManipulator.style.border = '2px dashed rgba(16, 163, 127, 0.8)';
    imageManipulator.style.zIndex = '1000';
    imageManipulator.style.display = 'block'; // Sempre visível quando há imagem
    imageManipulator.style.pointerEvents = 'all'; // Garantir que receba eventos de mouse
    
    // Criar alças de redimensionamento
    const positions = ['tl', 'tr', 'bl', 'br'];
    positions.forEach(pos => {
        const handle = document.createElement('div');
        handle.className = `resize-handle ${pos}`;
        handle.setAttribute('data-handle', pos);
        imageManipulator.appendChild(handle);
    });
    
    // Adicionar o manipulador ao DOM
    document.body.appendChild(imageManipulator);
    
    // Obter dimensões da faixa
    const bannerWidth = parseFloat(bannerWidthInput.value) || 100;
    const bannerHeight = parseFloat(bannerHeightInput.value) || 50;
    const bannerWidthPx = cmToPixel(bannerWidth);
    const bannerHeightPx = cmToPixel(bannerHeight);
    
    // Configurar drag & drop com interact.js
    interact(imageManipulator)
        .draggable({
            inertia: false, // Desativar inércia para maior controle
            modifiers: [],
            autoScroll: true,
            listeners: {
                start: function(event) {
                    isDraggingImage = true;
                    event.target.classList.add('dragging');
                    
                    // Salvar posição inicial para cálculos futuros
                    event.target.setAttribute('data-start-x', imageX);
                    event.target.setAttribute('data-start-y', imageY);
                    
                    // Posição inicial do mouse
                    event.target.setAttribute('data-mouse-start-x', event.clientX);
                    event.target.setAttribute('data-mouse-start-y', event.clientY);
                },
                move: function(event) {
                    // Calcular o deslocamento do mouse desde o início do arrasto
                    const startX = parseFloat(event.target.getAttribute('data-start-x') || 0);
                    const startY = parseFloat(event.target.getAttribute('data-start-y') || 0);
                    const mouseStartX = parseFloat(event.target.getAttribute('data-mouse-start-x') || 0);
                    const mouseStartY = parseFloat(event.target.getAttribute('data-mouse-start-y') || 0);
                    
                    // Calcular nova posição baseada no movimento do mouse
                    const dx = event.clientX - mouseStartX;
                    const dy = event.clientY - mouseStartY;
                    
                    imageX = startX + dx;
                    imageY = startY + dy;
                    
                    // Atualizar posição visual do manipulador
                    event.target.style.left = `${canvasRect.left + 30 + imageX}px`;
                    event.target.style.top = `${canvasRect.top + 30 + imageY}px`;
                    
                    // Redesenhar canvas em tempo real
                    drawBanner(parseFloat(bannerWidthInput.value) || 100, parseFloat(bannerHeightInput.value) || 50);
                },
                end: function(event) {
                    isDraggingImage = false;
                    event.target.classList.remove('dragging');
                    updateVisualization(); // Atualizar o canvas após finalizar o arrastamento
                }
            }
        })
        .resizable({
            edges: { top: true, left: true, bottom: true, right: true },
            preserveAspectRatio: true,
            listeners: {
                start: function(event) {
                    isDraggingImage = true;
                    event.target.classList.add('resizing');
                    
                    // Salvar dimensões iniciais
                    event.target.setAttribute('data-start-width', imageWidth);
                    event.target.setAttribute('data-start-height', imageHeight);
                    event.target.setAttribute('data-start-x', imageX);
                    event.target.setAttribute('data-start-y', imageY);
                },
                move: function(event) {
                    // Atualizar dimensões
                    imageWidth = event.rect.width;
                    imageHeight = event.rect.height;
                    
                    // Atualizar posição (para manter alinhamento quando redimensionando de cima ou esquerda)
                    imageX = parseFloat(event.target.getAttribute('data-start-x')) + event.deltaRect.left;
                    imageY = parseFloat(event.target.getAttribute('data-start-y')) + event.deltaRect.top;
                    
                    // Atualizar escala
                    imageScale = imageWidth / originalImageWidth;
                    
                    // Atualizar o elemento visual
                    event.target.style.width = `${imageWidth}px`;
                    event.target.style.height = `${imageHeight}px`;
                    event.target.style.left = `${canvasRect.left + 30 + imageX}px`;
                    event.target.style.top = `${canvasRect.top + 30 + imageY}px`;
                    
                    // Redesenhar canvas em tempo real
                    drawBanner(parseFloat(bannerWidthInput.value) || 100, parseFloat(bannerHeightInput.value) || 50);
                },
                end: function(event) {
                    isDraggingImage = false;
                    event.target.classList.remove('resizing');
                    updateVisualization(); // Atualizar o canvas após finalizar o redimensionamento
                }
            }
        });
    
    // Garantir que o manipulador seja atualizado quando a janela for redimensionada
    window.addEventListener('resize', function() {
        if (uploadedImage) {
            updateManipulatorPosition();
        }
    });
    
    // Adicionar eventos para as alças de redimensionamento
    document.querySelectorAll('.resize-handle').forEach(handle => {
        handle.addEventListener('mousedown', function(e) {
            e.stopPropagation(); // Impedir que o evento seja propagado para o manipulador pai
        });
    });
    
    // Certifique-se de que a imagem seja desenhada
    updateVisualization();
}

// Função para atualizar a posição do manipulador
function updateManipulatorPosition() {
    const canvasRect = canvas.getBoundingClientRect();
    const imageManipulator = document.getElementById('image-manipulator');
    
    if (imageManipulator) {
        // Atualizar posição e tamanho sem transformações CSS
        imageManipulator.style.width = `${imageWidth}px`;
        imageManipulator.style.height = `${imageHeight}px`;
        imageManipulator.style.left = `${canvasRect.left + 30 + imageX}px`;
        imageManipulator.style.top = `${canvasRect.top + 30 + imageY}px`;
        imageManipulator.style.transform = 'none'; // Remover qualquer transformação
    }
}

// Este é um método de fallback caso o sistema modular não funcione
// Adicione este código ao final do arquivo
try {
    // Tentar usar a versão modular
    document.addEventListener('DOMContentLoaded', function() {
        console.log("DOM carregado - versão modular");
        updateVisualization();
    });
} catch (e) {
    console.error("Erro na versão modular:", e);
    // Fallback para a versão não modular
    function drawFallbackBanner() {
        console.log("Usando fallback para desenhar banner");
        const bannerWidth = parseFloat(bannerWidthInput.value) || 100;
        const bannerHeight = parseFloat(bannerHeightInput.value) || 50;
        
        // Obter cores baseadas no tema atual
        const colors = getThemeColors();
        
        // Converter dimensões para pixels considerando zoom
        const widthPx = cmToPixel(bannerWidth);
        const heightPx = cmToPixel(bannerHeight);
        
        // Configurar o tamanho do canvas
        canvas.width = widthPx + 60;
        canvas.height = heightPx + 60;
        
        // Limpar o canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Desenhar a faixa
        ctx.fillStyle = colors.bannerColor;
        ctx.fillRect(30, 30, widthPx, heightPx);
        
        // Desenhar a borda
        ctx.strokeStyle = colors.bannerBorderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(30, 30, widthPx, heightPx);
        
        // Desenhar folhas A4 (código simplificado)
        const sheets = calculateSheets(bannerWidth, bannerHeight);
        return sheets;
    }
    
    // Substituir updateVisualization pelo fallback
    updateVisualization = function() {
        const sheets = drawFallbackBanner();
        // Atualizar informações
        sheetCountElement.textContent = sheets.total;
        sheetDistributionElement.textContent = `${sheets.horizontal} x ${sheets.vertical}`;
    };
    
    // Inicializar com fallback
    document.addEventListener('DOMContentLoaded', function() {
        console.log("DOM carregado - versão fallback");
        updateVisualization();
    });
}
```