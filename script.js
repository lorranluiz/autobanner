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

// Função aprimorada para desenhar a faixa e as folhas A4
function drawBanner(bannerWidth, bannerHeight) {
    // Verificar cobertura da imagem, se houver uma carregada
    let coverageInfo = null;
    if (uploadedImage) {
        coverageInfo = checkImageCoverage();
        displayCoverageWarnings(coverageInfo);
    }
    
    // Obter cores baseadas no tema atual
    const colors = getThemeColors();
    
    // Converter dimensões para pixels considerando zoom
    const widthPx = cmToPixel(bannerWidth);
    const heightPx = cmToPixel(bannerHeight);
    
    // Configurar o tamanho do canvas
    canvas.width = widthPx + 60; // Adicionando margem
    canvas.height = heightPx + 60; // Adicionando margem
    
    // Limpar o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar a faixa (com um pequeno deslocamento para margem)
    ctx.fillStyle = colors.bannerColor;
    ctx.fillRect(30, 30, widthPx, heightPx);
    
    // Desenhar a borda da faixa
    ctx.strokeStyle = colors.bannerBorderColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, widthPx, heightPx);
    
    // Desenhar a imagem se existir
    if (uploadedImage) {
        ctx.save();
        // Aplicar clipping para manter a imagem dentro da faixa
        ctx.beginPath();
        ctx.rect(30, 30, widthPx, heightPx);
        ctx.clip();
        
        // Desenhar a imagem
        ctx.drawImage(uploadedImage, 30 + imageX, 30 + imageY, imageWidth, imageHeight);
        ctx.restore();
        
        // Desenhar indicadores de cobertura, se necessário
        if (coverageInfo && !coverageInfo.fullyCovered) {
            drawCoverageIndicators(ctx, coverageInfo);
        }
    }
    
    // Calcular quantas folhas cabem
    const sheets = calculateSheets(bannerWidth, bannerHeight);
    
    // Obter dimensões da folha A4
    const a4 = getA4Dimensions();
    const marginInCm = sheetMargin * MM_TO_CM;
    
    // Converter dimensões para pixels considerando zoom
    const a4WidthPx = cmToPixel(a4.width);
    const a4HeightPx = cmToPixel(a4.height);
    const marginPx = cmToPixel(marginInCm);
    
    // Desenhar as folhas A4
    let sheetNumber = 1;
    for (let row = 0; row < sheets.vertical; row++) {
        for (let col = 0; col < sheets.horizontal; col++) {
            // Alternar cores para melhor visualização
            ctx.strokeStyle = (row + col) % 2 === 0 ? colors.sheetBorderColor : colors.sheetAltBorderColor;
            ctx.lineWidth = 1;
            
            const x = 30 + col * (a4WidthPx - marginPx);
            const y = 30 + row * (a4HeightPx - marginPx);
            
            // Desenhar apenas a parte da folha que cabe na faixa
            const remainingWidth = Math.min(a4WidthPx, widthPx - col * (a4WidthPx - marginPx));
            const remainingHeight = Math.min(a4HeightPx, heightPx - row * (a4HeightPx - marginPx));
            
            if (remainingWidth > 0 && remainingHeight > 0) {
                ctx.strokeRect(x, y, remainingWidth, remainingHeight);
                
                // Adicionar numeração se estiver ativado
                if (showNumbers) {
                    ctx.fillStyle = ctx.strokeStyle;
                    ctx.font = '16px Inter';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(sheetNumber.toString(), x + remainingWidth / 2, y + remainingHeight / 2);
                    sheetNumber++;
                }
            }
        }
    }
    
    // Atualizar as informações
    sheetCountElement.textContent = sheets.total;
    sheetDistributionElement.textContent = `${sheets.horizontal} x ${sheets.vertical}`;
    sheetDimensionsElement.textContent = a4.description;
    paperEfficiencyElement.textContent = `${sheets.efficiency}%`;
}

// Função para atualizar a visualização quando os valores mudarem
function updateVisualization() {
    const bannerWidth = parseFloat(bannerWidthInput.value) || 100;
    const bannerHeight = parseFloat(bannerHeightInput.value) || 50;
    
    drawBanner(bannerWidth, bannerHeight);
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
            
            updateVisualization();
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
    // Criar uma div para representar a imagem manipulável
    const canvasRect = canvas.getBoundingClientRect();
    
    // Assegurar que a div manipulável não existe ainda
    const existingManipulator = document.getElementById('image-manipulator');
    if (existingManipulator) {
        document.body.removeChild(existingManipulator);
    }
    
    // Criar a div manipulável
    const imageManipulator = document.createElement('div');
    imageManipulator.id = 'image-manipulator';
    imageManipulator.style.position = 'absolute';
    imageManipulator.style.width = `${imageWidth}px`;
    imageManipulator.style.height = `${imageHeight}px`;
    imageManipulator.style.left = `${canvasRect.left + 30 + imageX}px`;
    imageManipulator.style.top = `${canvasRect.top + 30 + imageY}px`;
    imageManipulator.style.cursor = 'move';
    imageManipulator.style.border = '1px dashed rgba(16, 163, 127, 0.5)';
    imageManipulator.style.zIndex = '1000';
    imageManipulator.style.display = 'none'; // Inicialmente oculto, exibido apenas quando o mouse está sobre o canvas
    
    // Adicionar manipuladores de redimensionamento
    const positions = ['tl', 'tr', 'bl', 'br'];
    positions.forEach(pos => {
        const handle = document.createElement('div');
        handle.className = `resize-handle ${pos}`;
        imageManipulator.appendChild(handle);
    });
    
    document.body.appendChild(imageManipulator);
    
    // Configurar interação de arrastar
    interact(imageManipulator)
        .draggable({
            inertia: true,
            modifiers: [
                interact.modifiers.restrictRect({
                    restriction: {
                        left: canvasRect.left + 30,
                        right: canvasRect.left + 30 + cmToPixel(parseFloat(bannerWidthInput.value) || 100) - imageWidth,
                        top: canvasRect.top + 30,
                        bottom: canvasRect.top + 30 + cmToPixel(parseFloat(bannerHeightInput.value) || 50) - imageHeight
                    }
                })
            ],
            listeners: {
                move: dragMoveListener,
                end: function() {
                    updateVisualization();
                }
            }
        })
        .resizable({
            // Restringir para manter proporção
            preserveAspectRatio: true,
            
            // Apenas cantos para redimensionar
            edges: { left: true, right: true, bottom: true, top: true },
            
            modifiers: [
                // Manter dentro da faixa
                interact.modifiers.restrictSize({
                    min: { width: 20, height: 20 },
                    max: { 
                        width: cmToPixel(parseFloat(bannerWidthInput.value) || 100), 
                        height: cmToPixel(parseFloat(bannerHeightInput.value) || 50) 
                    }
                }),
                
                // Restrição de posicionamento
                interact.modifiers.restrictEdges({
                    outer: {
                        left: canvasRect.left + 30,
                        right: canvasRect.left + 30 + cmToPixel(parseFloat(bannerWidthInput.value) || 100),
                        top: canvasRect.top + 30,
                        bottom: canvasRect.top + 30 + cmToPixel(parseFloat(bannerHeightInput.value) || 50)
                    }
                })
            ],
            
            listeners: {
                move: resizeMoveListener,
                end: function() {
                    updateVisualization();
                }
            }
        });
    
    // Mostrar o manipulador apenas quando o mouse estiver sobre o canvas
    canvas.addEventListener('mouseenter', function() {
        if (uploadedImage) {
            imageManipulator.style.display = 'block';
        }
    });
    
    canvas.addEventListener('mouseleave', function(e) {
        // Verificar se não estamos arrastando
        if (!isDraggingImage) {
            imageManipulator.style.display = 'none';
        }
    });
    
    // Atualizar a posição do manipulador quando a janela for redimensionada
    window.addEventListener('resize', function() {
        if (uploadedImage) {
            updateManipulatorPosition();
        }
    });
}

// Função para lidar com o arrastar
function dragMoveListener(event) {
    isDraggingImage = true;
    
    const canvasRect = canvas.getBoundingClientRect();
    const target = event.target;
    
    // Atualizar posição do elemento
    const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
    const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
    
    // Atualizar posição do elemento
    target.style.transform = `translate(${x}px, ${y}px)`;
    
    // Armazenar a posição
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);
    
    // Atualizar as coordenadas da imagem
    imageX = ((parseFloat(target.style.left) - canvasRect.left - 30) || 0) + x;
    imageY = ((parseFloat(target.style.top) - canvasRect.top - 30) || 0) + y;
    
    // Redraw canvas em tempo real
    requestAnimationFrame(function() {
        drawBanner(parseFloat(bannerWidthInput.value) || 100, parseFloat(bannerHeightInput.value) || 50);
    });
}

// Função para lidar com o redimensionamento
function resizeMoveListener(event) {
    isDraggingImage = true;
    
    const canvasRect = canvas.getBoundingClientRect();
    const target = event.target;
    
    let x = (parseFloat(target.getAttribute('data-x')) || 0);
    let y = (parseFloat(target.getAttribute('data-y')) || 0);
    
    // Atualizar as dimensões do elemento
    target.style.width = `${event.rect.width}px`;
    target.style.height = `${event.rect.height}px`;
    
    // Traduzir quando redimensionando do topo ou esquerda
    x += event.deltaRect.left;
    y += event.deltaRect.top;
    
    target.style.transform = `translate(${x}px, ${y}px)`;
    
    // Armazenar a posição
    target.setAttribute('data-x', x);
    target.setAttribute('data-y', y);
    
    // Atualizar as dimensões e posição da imagem
    imageWidth = event.rect.width;
    imageHeight = event.rect.height;
    imageX = ((parseFloat(target.style.left) - canvasRect.left - 30) || 0) + x;
    imageY = ((parseFloat(target.style.top) - canvasRect.top - 30) || 0) + y;
    
    // Calcular a nova escala
    imageScale = imageWidth / originalImageWidth;
    
    // Redraw canvas em tempo real
    requestAnimationFrame(function() {
        drawBanner(parseFloat(bannerWidthInput.value) || 100, parseFloat(bannerHeightInput.value) || 50);
    });
}

// Função para atualizar a posição do manipulador
function updateManipulatorPosition() {
    const canvasRect = canvas.getBoundingClientRect();
    const imageManipulator = document.getElementById('image-manipulator');
    
    if (imageManipulator) {
        // Redefinir a transformação
        imageManipulator.style.transform = 'translate(0px, 0px)';
        imageManipulator.setAttribute('data-x', 0);
        imageManipulator.setAttribute('data-y', 0);
        
        // Atualizar posição e tamanho
        imageManipulator.style.width = `${imageWidth}px`;
        imageManipulator.style.height = `${imageHeight}px`;
        imageManipulator.style.left = `${canvasRect.left + 30 + imageX}px`;
        imageManipulator.style.top = `${canvasRect.top + 30 + imageY}px`;
    }
}

// Modificar a função updateVisualization para atualizar o manipulador
const originalUpdateVisualization = updateVisualization;
updateVisualization = function() {
    originalUpdateVisualization();
    if (uploadedImage) {
        updateManipulatorPosition();
    }
};

// Adicionar captura do evento mouseup para encerrar o estado de arrastar
document.addEventListener('mouseup', function() {
    isDraggingImage = false;
    const imageManipulator = document.getElementById('image-manipulator');
    
    // Verificar se o mouse está fora do canvas para esconder o manipulador
    if (imageManipulator) {
        const canvasRect = canvas.getBoundingClientRect();
        const mouseX = event.clientX;
        const mouseY = event.clientY;
        
        if (mouseX < canvasRect.left || mouseX > canvasRect.right || 
            mouseY < canvasRect.top || mouseY > canvasRect.bottom) {
            imageManipulator.style.display = 'none';
        }
    }
});

// Modificar a função exportAsPNG para remover temporariamente o manipulador durante o export
const originalExportAsPNG = exportAsPNG;
exportAsPNG = function() {
    // Temporariamente ocultar o manipulador
    const imageManipulator = document.getElementById('image-manipulator');
    if (imageManipulator) {
        const originalDisplay = imageManipulator.style.display;
        imageManipulator.style.display = 'none';
        
        // Exportar e depois restaurar o manipulador
        setTimeout(() => {
            originalExportAsPNG();
            imageManipulator.style.display = originalDisplay;
        }, 0);
    } else {
        originalExportAsPNG();
    }
};

// Função para mostrar o modal de progresso
function showProgressModal() {
    progressBar.style.width = '0%';
    progressText.textContent = 'Iniciando processamento...';
    progressModal.classList.add('active');
}

// Função para atualizar a barra de progresso
function updateProgress(message, percent) {
    progressBar.style.width = `${percent}%`;
    progressText.textContent = `${message} (${percent.toFixed(1)}%)`;
}

// Função para ocultar o modal de progresso
function hideProgressModal() {
    progressModal.classList.remove('active');
}

// Função para extrair partes da imagem correspondentes às folhas A4
async function extractImageParts(totalSheets) {
    const bannerWidth = parseFloat(bannerWidthInput.value) || 100;
    const bannerHeight = parseFloat(bannerHeightInput.value) || 50;
    const sheets = calculateSheets(bannerWidth, bannerHeight);
    
    // Criar um canvas temporário para manipular imagens
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    // Obter dimensões da folha A4 com base na orientação
    const a4 = getA4Dimensions();
    const marginInCm = sheetMargin * MM_TO_CM;
    
    // Calcular a escala de pixels para cm (para manter proporção correta)
    const pixelsPerCm = DPI / 2.54; // 2.54 cm em uma polegada
    
    // Converter a sangria de mm para cm
    const bleedInCm = BLEED_MM * MM_TO_CM;
    
    // Resultado para armazenar as partes extraídas
    const imageParts = [];
    
    // Para cada folha, extrair a parte correspondente da imagem
    for (let row = 0; row < sheets.vertical; row++) {
        for (let col = 0; col < sheets.horizontal; col++) {
            const sheetIndex = row * sheets.horizontal + col;
            const sheetNumber = sheetIndex + 1;
            
            // Atualizar progresso
            updateProgress(`Processando folha ${sheetNumber} de ${totalSheets}`, 
                           ((sheetIndex * 3) / (totalSheets * 3 + 1)) * 100);
            
            // Calcular dimensões do canvas para esta folha (incluindo sangria)
            const sheetWidthCm = a4.width;
            const sheetHeightCm = a4.height;
            
            // Dimensões do canvas em pixels (300 DPI)
            const canvasWidth = Math.ceil(sheetWidthCm * pixelsPerCm);
            const canvasHeight = Math.ceil(sheetHeightCm * pixelsPerCm);
            
            // Configurar o canvas temporário
            tempCanvas.width = canvasWidth;
            tempCanvas.height = canvasHeight;
            tempCtx.fillStyle = '#FFFFFF'; // Fundo branco
            tempCtx.fillRect(0, 0, canvasWidth, canvasHeight);
            
            // Calcular as coordenadas na faixa
            const sheetX = col * (a4.width - marginInCm);
            const sheetY = row * (a4.height - marginInCm);
            
            // Calcular as coordenadas na imagem original
            // Considere a posição e escala atual da imagem
            const sourceX = imageX + (sheetX * CM_TO_PIXEL * (zoomLevel / 5));
            const sourceY = imageY + (sheetY * CM_TO_PIXEL * (zoomLevel / 5));
            const sourceWidth = (a4.width * CM_TO_PIXEL * (zoomLevel / 5));
            const sourceHeight = (a4.height * CM_TO_PIXEL * (zoomLevel / 5));
            
            // Desenhar a porção da imagem no canvas temporário
            tempCtx.drawImage(
                uploadedImage,
                sourceX / imageScale, // ajustar pela escala da imagem
                sourceY / imageScale,
                sourceWidth / imageScale,
                sourceHeight / imageScale,
                0, // Posição no canvas de destino
                0,
                canvasWidth,
                canvasHeight
            );
            
            // Converter o canvas para um blob (formato PNG)
            await new Promise(resolve => {
                tempCanvas.toBlob(async (blob) => {
                    // Adicionar à lista de partes da imagem
                    imageParts.push({
                        index: sheetNumber,
                        blob: blob,
                        row: row,
                        col: col
                    });
                    resolve();
                }, 'image/png');
            });
            
            // Atualizar progresso
            updateProgress(`Processando cores para folha ${sheetNumber}`, 
                          ((sheetIndex * 3 + 1) / (totalSheets * 3 + 1)) * 100);
            
            // Simulação de espera para simular processamento de cores
            await sleep(100);
        }
    }
    
    return imageParts;
}

// Função para simular conversão RGB para CMYK
// Nota: Conversão real de RGB para CMYK requer processamento mais avançado
function convertRGBtoCMYK(imageData) {
    // Na prática, a conversão real seria implementada aqui
    // Seria utilizada uma biblioteca de gerenciamento de cores ou algoritmo específico
    // Para esta simulação, apenas retornamos os dados originais
    return imageData;
}

// Função para adicionar marcas de corte ao PDF
async function addCropMarks(page, pdfDoc) {
    const { rgb } = PDFLib;
    
    // Tamanho da página em pontos
    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();
    
    // Convertendo a sangria de mm para pontos do PDF
    const bleedInPt = BLEED_MM * MM_TO_POINTS;
    
    // Comprimento das marcas de corte em pontos
    const markLength = 10;
    
    // Desenhar marcas de corte nos cantos
    
    // Cores para marcas de corte
    const color = rgb(0, 0, 0); // preto
    const lineWidth = 0.5;
    
    // Superior esquerdo
    page.drawLine({
        start: { x: bleedInPt - markLength, y: bleedInPt },
        end: { x: bleedInPt, y: bleedInPt },
        color,
        thickness: lineWidth,
    });
    page.drawLine({
        start: { x: bleedInPt, y: bleedInPt - markLength },
        end: { x: bleedInPt, y: bleedInPt },
        color,
        thickness: lineWidth,
    });
    
    // Superior direito
    page.drawLine({
        start: { x: pageWidth - bleedInPt + markLength, y: bleedInPt },
        end: { x: pageWidth - bleedInPt, y: bleedInPt },
        color,
        thickness: lineWidth,
    });
    page.drawLine({
        start: { x: pageWidth - bleedInPt, y: bleedInPt - markLength },
        end: { x: pageWidth - bleedInPt, y: bleedInPt },
        color,
        thickness: lineWidth,
    });
    
    // Inferior esquerdo
    page.drawLine({
        start: { x: bleedInPt - markLength, y: pageHeight - bleedInPt },
        end: { x: bleedInPt, y: pageHeight - bleedInPt },
        color,
        thickness: lineWidth,
    });
    page.drawLine({
        start: { x: bleedInPt, y: pageHeight - bleedInPt + markLength },
        end: { x: bleedInPt, y: pageHeight - bleedInPt },
        color,
        thickness: lineWidth,
    });
    
    // Inferior direito
    page.drawLine({
        start: { x: pageWidth - bleedInPt + markLength, y: pageHeight - bleedInPt },
        end: { x: pageWidth - bleedInPt, y: pageHeight - bleedInPt },
        color,
        thickness: lineWidth,
    });
    page.drawLine({
        start: { x: pageWidth - bleedInPt, y: pageHeight - bleedInPt + markLength },
        end: { x: pageWidth - bleedInPt, y: pageHeight - bleedInPt },
        color,
        thickness: lineWidth,
    });
    
    return page;
}

// Função para criar PDFs individuais
async function createPDFs(imageParts, totalSheets) {
    const pdfDocs = [];
    
    for (let i = 0; i < imageParts.length; i++) {
        const part = imageParts[i];
        const sheetNumber = part.index;
        
        // Atualizar progresso
        updateProgress(`Gerando PDF da folha ${sheetNumber} de ${totalSheets}`, 
                      ((i * 3 + 2) / (totalSheets * 3 + 1)) * 100);
        
        try {
            // Criar novo documento PDF
            const pdfDoc = await PDFLib.PDFDocument.create();
            
            // Definir dimensões da página em pontos (A4)
            // 1 ponto = 0.352778 mm, A4 = 210mm x 297mm
            const pageWidth = A4_WIDTH_MM * MM_TO_POINTS;
            const pageHeight = A4_HEIGHT_MM * MM_TO_POINTS;
            
            // Orientação da página baseada na configuração
            const pageSize = isPortrait 
                ? [pageWidth, pageHeight]  // retrato
                : [pageHeight, pageWidth]; // paisagem
            
            // Adicionar página ao documento
            const page = pdfDoc.addPage(pageSize);
            
            // Converter blob para ArrayBuffer
            const imageBytes = await part.blob.arrayBuffer();
            
            // Incorporar a imagem no PDF
            const image = await pdfDoc.embedPng(imageBytes);
            
            // Calcular dimensões da imagem
            const imgDims = image.scale(1.0);
            
            // Dimensões da área de conteúdo da página (excluindo sangria)
            const contentWidth = isPortrait 
                ? PRINTABLE_WIDTH_MM * MM_TO_POINTS
                : PRINTABLE_HEIGHT_MM * MM_TO_POINTS;
            
            const contentHeight = isPortrait 
                ? PRINTABLE_HEIGHT_MM * MM_TO_POINTS
                : PRINTABLE_WIDTH_MM * MM_TO_POINTS;
            
            // Posição do bleed (para centralizar o conteúdo)
            const bleedPt = BLEED_MM * MM_TO_POINTS;
            
            // Calcular escala para ajustar a imagem à área de conteúdo
            const scaleWidth = contentWidth / imgDims.width;
            const scaleHeight = contentHeight / imgDims.height;
            const scale = Math.min(scaleWidth, scaleHeight);
            
            // Desenhar a imagem na página com sangria
            page.drawImage(image, {
                x: bleedPt,
                y: bleedPt,
                width: imgDims.width * scale,
                height: imgDims.height * scale,
            });
            
            // Adicionar marcas de corte
            await addCropMarks(page, pdfDoc);
            
            // Adicionar informações ao PDF
            pdfDoc.setTitle(`Folha ${sheetNumber} - Faixa`);
            pdfDoc.setAuthor('Calculadora de Faixas');
            pdfDoc.setSubject('Parte de faixa para impressão');
            pdfDoc.setKeywords(['faixa', 'impressão', 'A4', 'folha ' + sheetNumber]);
            pdfDoc.setCreator('Calculadora de Faixas Web App');
            
            // Salvar o PDF como array de bytes
            const pdfBytes = await pdfDoc.save();
            
            // Adicionar à lista de PDFs
            pdfDocs.push({
                name: `folha_${String(sheetNumber).padStart(2, '0')}.pdf`,
                data: pdfBytes,
                row: part.row,
                col: part.col
            });
            
        } catch (error) {
            console.error(`Erro ao criar PDF para folha ${sheetNumber}:`, error);
            throw new Error(`Falha ao gerar PDF para folha ${sheetNumber}: ${error.message}`);
        }
    }
    
    return pdfDocs;
}

// Função para adicionar o guia de montagem ao ZIP
async function createAssemblyGuidePDF(sheets) {
    // Criar um novo documento PDF para o guia de montagem
    const pdfDoc = await PDFLib.PDFDocument.create();
    const { rgb } = PDFLib;
    
    // Definir dimensões da página em pontos (A4, sempre retrato para o guia)
    const pageWidth = A4_WIDTH_MM * MM_TO_POINTS;
    const pageHeight = A4_HEIGHT_MM * MM_TO_POINTS;
    
    // Adicionar página ao documento
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    
    // Fonte padrão
    const helveticaFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
    
    // Cores
    const textColor = rgb(0, 0, 0);
    const accentColor = rgb(0.063, 0.639, 0.498); // #10a37f
    
    // Margens
    const margin = 50;
    const contentWidth = pageWidth - (margin * 2);
    
    // Posição inicial de escrita
    let yPos = pageHeight - margin;
    
    // Adicionar título
    page.drawText('Guia de Montagem da Faixa', {
        x: margin,
        y: yPos,
        size: 24,
        font: boldFont,
        color: accentColor,
    });
    
    yPos -= 40;
    
    // Adicionar informações da faixa
    const bannerWidth = parseFloat(bannerWidthInput.value) || 100;
    const bannerHeight = parseFloat(bannerHeightInput.value) || 50;
    
    page.drawText(`Dimensões da Faixa: ${bannerWidth}cm x ${bannerHeight}cm`, {
        x: margin,
        y: yPos,
        size: 12,
        font: helveticaFont,
        color: textColor,
    });
    
    yPos -= 20;
    
    const orientation = isPortrait ? 'retrato (21cm x 29.7cm)' : 'paisagem (29.7cm x 21cm)';
    page.drawText(`Folhas A4: ${sheets.total} folhas em orientação ${orientation}`, {
        x: margin,
        y: yPos,
        size: 12,
        font: helveticaFont,
        color: textColor,
    });
    
    yPos -= 20;
    
    page.drawText(`Distribuição: ${sheets.horizontal} x ${sheets.vertical} (colunas x linhas)`, {
        x: margin,
        y: yPos,
        size: 12,
        font: helveticaFont,
        color: textColor,
    });
    
    yPos -= 40;
    
    // Adicionar instruções
    page.drawText('Instruções de Montagem', {
        x: margin,
        y: yPos,
        size: 16,
        font: boldFont,
        color: accentColor,
    });
    
    yPos -= 30;
    
    const instructions = [
        '1. Imprima todas as folhas PDF em papel A4.',
        '2. Corte as folhas seguindo as marcas de corte (linhas nos cantos).',
        '3. Disponha as folhas seguindo a numeração, da esquerda para a direita e de cima para baixo.',
        '4. Para melhor alinhamento, use as marcas de corte para posicionar as folhas.',
        '5. Fixe as folhas com fita adesiva, preferencialmente no verso.',
        '6. Para maior durabilidade, considere plastificar a faixa após a montagem.'
    ];
    
    for (let instruction of instructions) {
        page.drawText(instruction, {
            x: margin,
            y: yPos,
            size: 12,
            font: helveticaFont,
            color: textColor,
        });
        yPos -= 20;
    }
    
    yPos -= 20;
    
    // Adicionar diagrama de montagem
    page.drawText('Diagrama de Montagem', {
        x: margin,
        y: yPos,
        size: 16,
        font: boldFont,
        color: accentColor,
    });
    
    yPos -= 30;
    
    // Desenhar grade representando folhas
    const gridSize = Math.min(30, Math.floor(contentWidth / sheets.horizontal));
    const gridWidth = gridSize * sheets.horizontal;
    const gridHeight = gridSize * sheets.vertical;
    const gridX = margin + (contentWidth - gridWidth) / 2;
    let gridY = yPos - gridHeight;
    
    // Desenhar cada célula da grade
    for (let row = 0; row < sheets.vertical; row++) {
        for (let col = 0; col < sheets.horizontal; col++) {
            const cellX = gridX + (col * gridSize);
            const cellY = gridY + ((sheets.vertical - row - 1) * gridSize);
            
            // Desenhar retângulo para célula
            page.drawRectangle({
                x: cellX,
                y: cellY,
                width: gridSize,
                height: gridSize,
                borderColor: accentColor,
                borderWidth: 1,
            });
            
            // Adicionar número da folha
            const sheetNumber = row * sheets.horizontal + col + 1;
            const numText = String(sheetNumber);
            const textWidth = helveticaFont.widthOfTextAtSize(numText, 10);
            
            page.drawText(numText, {
                x: cellX + (gridSize - textWidth) / 2,
                y: cellY + (gridSize - 10) / 2,
                size: 10,
                font: boldFont,
                color: textColor,
            });
        }
    }
    
    yPos = gridY - 40;
    
    // Adicionar data de criação
    const date = new Date().toLocaleDateString();
    page.drawText(`Guia gerado em: ${date}`, {
        x: margin,
        y: yPos,
        size: 10,
        font: helveticaFont,
        color: rgb(0.5, 0.5, 0.5),
    });
    
    // Salvar o PDF como array de bytes
    const pdfBytes = await pdfDoc.save();
    
    return {
        name: 'guia_de_montagem.pdf',
        data: pdfBytes
    };
}

// Função para compactar os PDFs em um arquivo ZIP
async function createZipFile(pdfDocs, bannerInfo) {
    // Criar novo objeto ZIP
    const zip = new JSZip();
    
    // Adicionar cada PDF ao ZIP
    for (const pdfDoc of pdfDocs) {
        zip.file(pdfDoc.name, pdfDoc.data);
    }
    
    // Adicionar arquivo de informações (txt)
    const infoContent = createInfoText(bannerInfo);
    zip.file("informacoes.txt", infoContent);
    
    // Criar pasta para PDFs
    const pdfFolder = zip.folder("arquivos_pdf");
    
    // Mover PDFs para a pasta
    for (const pdfDoc of pdfDocs) {
        pdfFolder.file(pdfDoc.name, pdfDoc.data);
    }
    
    // Gerar o arquivo ZIP
    const zipContent = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: {
            level: 6 // Nível de compressão (1-9)
        }
    });
    
    return zipContent;
}

// Função para criar texto de informações
function createInfoText(bannerInfo) {
    const date = new Date().toLocaleDateString();
    const time = new Date().toLocaleTimeString();
    
    return `INFORMAÇÕES DA FAIXA
====================
Data de geração: ${date} às ${time}

Dimensões da faixa: ${bannerInfo.width}cm x ${bannerInfo.height}cm
Orientação das folhas: ${bannerInfo.portrait ? 'Retrato' : 'Paisagem'}
Total de folhas: ${bannerInfo.sheets.total}
Distribuição: ${bannerInfo.sheets.horizontal} x ${bannerInfo.sheets.vertical} (colunas x linhas)
Margem entre folhas: ${bannerInfo.margin}mm
Sangria aplicada: ${BLEED_MM}mm

INSTRUÇÕES DE IMPRESSÃO
=====================
1. Imprima todos os PDFs em tamanho A4, sem redimensionar (tamanho real)
2. Verifique se a impressão está configurada em alta qualidade
3. Certifique-se que a orientação da página está correta (${bannerInfo.portrait ? 'retrato' : 'paisagem'})
4. Use as marcas de corte para alinhar as folhas durante a montagem

Gerado pela Calculadora de Faixas Web App
`;
}

// Atualização final da função generatePDFs
async function generatePDFs() {
    // Verificar se há uma imagem carregada
    if (!uploadedImage) {
        alert('Por favor, carregue uma imagem primeiro.');
        return;
    }
    
    showProgressModal();
    
    try {
        // Obter informações sobre a distribuição das folhas
        const bannerWidth = parseFloat(bannerWidthInput.value) || 100;
        const bannerHeight = parseFloat(bannerHeightInput.value) || 50;
        const sheets = calculateSheets(bannerWidth, bannerHeight);
        
        // Armazenar informações da faixa
        const bannerInfo = {
            width: bannerWidth,
            height: bannerHeight,
            portrait: isPortrait,
            sheets: sheets,
            margin: sheetMargin
        };
        
        // Extrair partes da imagem
        const imageParts = await extractImageParts(sheets.total);
        
        // Criar PDFs individuais
        const pdfDocs = await createPDFs(imageParts, sheets.total);
        
        // Criar guia de montagem
        updateProgress("Criando guia de montagem", 95);
        const assemblyGuide = await createAssemblyGuidePDF(sheets);
        
        // Adicionar o guia aos documentos
        pdfDocs.push(assemblyGuide);
        
        // Compactar PDFs em arquivo ZIP
        updateProgress("Compactando arquivos em ZIP", 97);
        const zipFile = await createZipFile(pdfDocs, bannerInfo);
        
        // Oferecer download do ZIP
        updateProgress("Preparando download", 99);
        
        // Nome do arquivo com data
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${(today.getMonth()+1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
        const fileName = `faixa_${bannerWidth}x${bannerHeight}_${dateStr}.zip`;
        
        // Usar FileSaver para download
        saveAs(zipFile, fileName);
        
        updateProgress("Download iniciado!", 100);
        
        // Aguardar um momento antes de fechar o modal
        await sleep(1000);
        hideProgressModal();
        
    } catch (error) {
        console.error("Erro ao gerar PDFs:", error);
        hideProgressModal();
        alert(`Erro ao gerar PDFs: ${error.message}`);
    }
}

// Função auxiliar para simular operações assíncronas
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Adicionar event listener para o botão de geração de PDF
generatePdfButton.addEventListener('click', generatePDFs);

// Função para simular conversão de cores RGB para CMYK
// Na prática, seria usada uma biblioteca real de gerenciamento de cores
function simulateCMYKConversion() {
    // Função para simular o tempo de processamento da conversão CMYK
    // Em uma implementação real, isso seria substituído pela conversão real
    return new Promise(resolve => {
        setTimeout(() => {
            resolve();
        }, 200); // Simular 200ms de processamento
    });
}

// Função para adicionar opções avançadas de PDF
function addPDFMetadata(pdfDoc, pageIndex, totalPages) {
    // Adicionar metadados relacionados à impressão
    pdfDoc.setProducer('Calculadora de Faixas');
    pdfDoc.setCreator('Calculadora de Faixas Web App');
    pdfDoc.setCreationDate(new Date());
    
    // Em uma implementação completa, aqui poderíamos adicionar:
    // - Perfis ICC para CMYK
    // - Marcas de registro adicionais
    // - Informações de produção específicas
}

// Funções para validação de cobertura de imagem
function checkImageCoverage() {
    if (!uploadedImage) return null;
    
    const bannerWidth = parseFloat(bannerWidthInput.value) || 100;
    const bannerHeight = parseFloat(bannerHeightInput.value) || 50;
    
    // Converter para pixels
    const bannerWidthPx = cmToPixel(bannerWidth);
    const bannerHeightPx = cmToPixel(bannerHeight);
    
    // Obter as dimensões e posição atual da imagem
    const imageBounds = {
        x: imageX,
        y: imageY,
        width: imageWidth,
        height: imageHeight,
        right: imageX + imageWidth,
        bottom: imageY + imageHeight
    };
    
    // Verificar se a imagem cobre completamente a faixa
    const coverageIssues = [];
    
    // Verificar se alguma parte da faixa não está coberta pela imagem
    if (imageBounds.x > 0) {
        coverageIssues.push({
            type: 'uncovered',
            area: 'left',
            message: `Área esquerda da faixa não coberta (${(imageBounds.x / cmToPixel(1)).toFixed(1)}cm)`
        });
    }
    
    if (imageBounds.y > 0) {
        coverageIssues.push({
            type: 'uncovered',
            area: 'top',
            message: `Área superior da faixa não coberta (${(imageBounds.y / cmToPixel(1)).toFixed(1)}cm)`
        });
    }
    
    if (imageBounds.right < bannerWidthPx) {
        coverageIssues.push({
            type: 'uncovered',
            area: 'right',
            message: `Área direita da faixa não coberta (${((bannerWidthPx - imageBounds.right) / cmToPixel(1)).toFixed(1)}cm)`
        });
    }
    
    if (imageBounds.bottom < bannerHeightPx) {
        coverageIssues.push({
            type: 'uncovered',
            area: 'bottom',
            message: `Área inferior da faixa não coberta (${((bannerHeightPx - imageBounds.bottom) / cmToPixel(1)).toFixed(1)}cm)`
        });
    }
    
    // Verificar se parte da imagem está fora da área da faixa (desperdício)
    const wastedArea = {
        left: Math.max(0, -imageBounds.x),
        top: Math.max(0, -imageBounds.y),
        right: Math.max(0, imageBounds.right - bannerWidthPx),
        bottom: Math.max(0, imageBounds.bottom - bannerHeightPx)
    };
    
    const totalWastedWidth = wastedArea.left + wastedArea.right;
    const totalWastedHeight = wastedArea.top + wastedArea.bottom;
    
    if (totalWastedWidth > 0 || totalWastedHeight > 0) {
        const wastedWidthCm = (totalWastedWidth / cmToPixel(1)).toFixed(1);
        const wastedHeightCm = (totalWastedHeight / cmToPixel(1)).toFixed(1);
        
        coverageIssues.push({
            type: 'overflow',
            message: `Parte da imagem está fora da área útil (${wastedWidthCm}cm × ${wastedHeightCm}cm)`
        });
    }
    
    return {
        fullyCovered: coverageIssues.length === 0,
        issues: coverageIssues,
        imageBounds: imageBounds,
        wastedArea: wastedArea
    };
}

// Função para mostrar avisos de cobertura
function displayCoverageWarnings(coverageInfo) {
    // Remover avisos anteriores
    const existingWarnings = document.querySelectorAll('.coverage-warning');
    existingWarnings.forEach(warning => warning.remove());
    
    if (!coverageInfo || coverageInfo.fullyCovered) return;
    
    // Criar contêiner de avisos se não existir
    let warningsContainer = document.getElementById('coverage-warnings');
    if (!warningsContainer) {
        warningsContainer = document.createElement('div');
        warningsContainer.id = 'coverage-warnings';
        warningsContainer.className = 'coverage-warnings';
        
        // Inserir antes da imagem de upload ou depois do canvas
        const imageControls = document.querySelector('.image-controls');
        if (imageControls) {
            imageControls.parentNode.insertBefore(warningsContainer, imageControls);
        } else {
            const canvasContainer = document.querySelector('.canvas-container');
            canvasContainer.parentNode.insertBefore(warningsContainer, canvasContainer.nextSibling);
        }
    } else {
        // Limpar avisos existentes
        warningsContainer.innerHTML = '';
    }
    
    // Adicionar cada aviso
    coverageInfo.issues.forEach(issue => {
        const warningElement = document.createElement('div');
        warningElement.className = `coverage-warning ${issue.type}`;
        
        // Ícone apropriado para o tipo de aviso
        const icon = issue.type === 'uncovered' ? 
            '<i class="fas fa-exclamation-triangle"></i>' : 
            '<i class="fas fa-crop-alt"></i>';
        
        warningElement.innerHTML = `${icon} <span>${issue.message}</span>`;
        warningsContainer.appendChild(warningElement);
    });
}

// Função para desenhar indicadores visuais de cobertura no canvas
function drawCoverageIndicators(ctx, coverageInfo) {
    if (!coverageInfo || coverageInfo.fullyCovered) return;
    
    // Desenhar apenas se houver problemas de cobertura
    const bannerWidth = parseFloat(bannerWidthInput.value) || 100;
    const bannerHeight = parseFloat(bannerHeightInput.value) || 50;
    
    // Converter para pixels
    const bannerWidthPx = cmToPixel(bannerWidth);
    const bannerHeightPx = cmToPixel(bannerHeight);
    
    // Salvar o contexto atual
    ctx.save();
    
    // Estilo para áreas não cobertas
    ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    
    // Desenhar indicadores para áreas não cobertas
    coverageInfo.issues.filter(issue => issue.type === 'uncovered').forEach(issue => {
        switch(issue.area) {
            case 'left':
                ctx.fillRect(30, 30, coverageInfo.imageBounds.x, bannerHeightPx);
                ctx.strokeRect(30, 30, coverageInfo.imageBounds.x, bannerHeightPx);
                break;
            case 'top':
                ctx.fillRect(30, 30, bannerWidthPx, coverageInfo.imageBounds.y);
                ctx.strokeRect(30, 30, bannerWidthPx, coverageInfo.imageBounds.y);
                break;
            case 'right':
                const rightX = 30 + coverageInfo.imageBounds.right;
                const rightWidth = bannerWidthPx - coverageInfo.imageBounds.right;
                ctx.fillRect(rightX, 30, rightWidth, bannerHeightPx);
                ctx.strokeRect(rightX, 30, rightWidth, bannerHeightPx);
                break;
            case 'bottom':
                const bottomY = 30 + coverageInfo.imageBounds.bottom;
                const bottomHeight = bannerHeightPx - coverageInfo.imageBounds.bottom;
                ctx.fillRect(30, bottomY, bannerWidthPx, bottomHeight);
                ctx.strokeRect(30, bottomY, bannerWidthPx, bottomHeight);
                break;
        }
    });
    
    // Estilo para áreas de desperdício (overflow)
    ctx.fillStyle = 'rgba(255, 165, 0, 0.2)';
    ctx.strokeStyle = 'rgba(255, 165, 0, 0.8)';
    
    // Desenhar áreas de overflow
    const wastedArea = coverageInfo.wastedArea;
    const imgBounds = coverageInfo.imageBounds;
    
    // Área esquerda fora da faixa
    if (wastedArea.left > 0) {
        ctx.fillRect(30 + imgBounds.x, 30 + imgBounds.y, wastedArea.left, imgBounds.height);
        ctx.strokeRect(30 + imgBounds.x, 30 + imgBounds.y, wastedArea.left, imgBounds.height);
    }
    
    // Área superior fora da faixa
    if (wastedArea.top > 0) {
        ctx.fillRect(30 + imgBounds.x, 30 + imgBounds.y, imgBounds.width, wastedArea.top);
        ctx.strokeRect(30 + imgBounds.x, 30 + imgBounds.y, imgBounds.width, wastedArea.top);
    }
    
    // Área direita fora da faixa
    if (wastedArea.right > 0) {
        const rightX = 30 + bannerWidthPx;
        ctx.fillRect(rightX, 30 + imgBounds.y, wastedArea.right, imgBounds.height);
        ctx.strokeRect(rightX, 30 + imgBounds.y, wastedArea.right, imgBounds.height);
    }
    
    // Área inferior fora da faixa
    if (wastedArea.bottom > 0) {
        const bottomY = 30 + bannerHeightPx;
        ctx.fillRect(30 + imgBounds.x, bottomY, imgBounds.width, wastedArea.bottom);
        ctx.strokeRect(30 + imgBounds.x, bottomY, imgBounds.width, wastedArea.bottom);
    }
    
    // Restaurar o contexto
    ctx.restore();
}
