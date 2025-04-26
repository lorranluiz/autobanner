import { MM_TO_CM } from './constants.js';
import { cmToPixel, getThemeColors, getA4Dimensions } from './uiManager.js';
import { 
    getUploadedImage, getImagePosition, getImageDimensions, 
    drawImageHandles, checkImageCoverage, displayCoverageWarnings, drawCoverageIndicators 
} from './imageManager.js';

// Função para desenhar as réguas
function drawRulers(ctx, bannerWidth, bannerHeight) {
    const rulerSize = 20; // Altura/Largura da régua em pixels
    const rulerOffset = 30; // Mesmo offset que a faixa tem (30px)
    const majorTickInterval = 10; // Intervalo de marcações principais (10cm)
    
    // Configuração de estilo da régua
    const rulerBgColor = document.documentElement.classList.contains('dark-mode') ? 
        "rgba(80, 80, 80, 0.8)" : "rgba(240, 240, 240, 0.8)";
    const rulerTextColor = document.documentElement.classList.contains('dark-mode') ? 
        "#FFFFFF" : "#333333";
    
    // Converter dimensões para pixels considerando zoom
    const widthPx = cmToPixel(bannerWidth);
    const heightPx = cmToPixel(bannerHeight);
    
    // Desenhar a régua horizontal (superior)
    ctx.fillStyle = rulerBgColor;
    ctx.fillRect(rulerOffset, 0, widthPx, rulerSize);
    
    // Desenhar a régua vertical (esquerda)
    ctx.fillRect(0, rulerOffset, rulerSize, heightPx);
    
    // Desenhar as marcações principais da régua horizontal
    ctx.fillStyle = rulerTextColor;
    ctx.font = '10px Inter';
    ctx.textAlign = 'center';
    
    for (let i = 0; i <= bannerWidth; i += majorTickInterval) {
        const xPos = rulerOffset + cmToPixel(i);
        
        // Desenhar linha da marcação
        ctx.beginPath();
        ctx.moveTo(xPos, rulerSize - 5);
        ctx.lineTo(xPos, rulerSize);
        ctx.stroke();
        
        // Desenhar número
        ctx.fillText(i.toString(), xPos, rulerSize - 7);
    }
    
    // Desenhar as marcações principais da régua vertical
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i <= bannerHeight; i += majorTickInterval) {
        const yPos = rulerOffset + cmToPixel(i);
        
        // Desenhar linha da marcação
        ctx.beginPath();
        ctx.moveTo(rulerSize - 5, yPos);
        ctx.lineTo(rulerSize, yPos);
        ctx.stroke();
        
        // Desenhar número
        ctx.fillText(i.toString(), rulerSize - 7, yPos);
    }
}

// Função aprimorada para desenhar a faixa e as folhas A4
function drawBanner(ctx, bannerWidth, bannerHeight, calculateSheets, sheetMargin, MM_TO_CM, showNumbers) {
    console.log("drawBanner chamada com:", {bannerWidth, bannerHeight});
    
    // Obter a imagem e suas propriedades do imageManager
    const uploadedImage = getUploadedImage ? getUploadedImage() : null;
    let imageX = 0, imageY = 0, imageWidth = 0, imageHeight = 0;
    
    if (uploadedImage && getImagePosition && getImageDimensions) {
        const pos = getImagePosition();
        const dims = getImageDimensions();
        imageX = pos.x;
        imageY = pos.y;
        imageWidth = dims.width;
        imageHeight = dims.height;
    }
    
    // Verificar cobertura da imagem, se houver uma carregada
    let coverageInfo = null;
    if (uploadedImage && checkImageCoverage) {
        coverageInfo = checkImageCoverage(bannerWidth, bannerHeight);
        if (displayCoverageWarnings) {
            displayCoverageWarnings(coverageInfo);
        }
    }
    
    // Obter cores baseadas no tema atual
    const colors = getThemeColors();
    
    // Converter dimensões para pixels considerando zoom
    const widthPx = cmToPixel(bannerWidth);
    const heightPx = cmToPixel(bannerHeight);
    
    // Configurar o tamanho do canvas
    ctx.canvas.width = widthPx + 60; // Adicionando margem
    ctx.canvas.height = heightPx + 60; // Adicionando margem
    
    // Limpar o canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Desenhar as réguas
    drawRulers(ctx, bannerWidth, bannerHeight);
    
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
        
        // Calcular posição centralizada
        const centerX = 30 + (widthPx / 2) + imageX - (imageWidth / 2);
        const centerY = 30 + (heightPx / 2) + imageY - (imageHeight / 2);
        
        // Desenhar a imagem centralizada + offset
        ctx.drawImage(uploadedImage, centerX, centerY, imageWidth, imageHeight);
        ctx.restore();
        
        // Desenhar indicadores de cobertura, se necessário
        if (coverageInfo && !coverageInfo.fullyCovered && drawCoverageIndicators) {
            drawCoverageIndicators(ctx, coverageInfo);
        }
        
        // Desenhar manipuladores de interação diretos
        if (drawImageHandles) {
            drawImageHandles(ctx, centerX, centerY, imageWidth, imageHeight);
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
                    ctx.font = '12px Inter';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    // Usar formato L{linha}C{coluna} para identificar as folhas
                    const sheetLabel = `L${row+1}C${col+1}`;
                    ctx.fillText(sheetLabel, x + remainingWidth / 2, y + remainingHeight / 2);
                }
            }
        }
    }
    
    console.log("Banner desenhado com sucesso");
    return sheets;
}

export { drawBanner, drawRulers };
