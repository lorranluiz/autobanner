/**
 * Módulo de exportação aprimorada para PNG
 * 
 * Adiciona suporte para mostrar indicadores de linha e coluna (L1C1, L1C2...)
 * quando a opção "Mostrar numeração" estiver ativada
 */

// Função para desenhar uma versão limpa da faixa com indicadores de linha e coluna
function drawEnhancedCleanBanner(ctx, canvasWidth, canvasHeight, bannerWidth, bannerHeight, showGridLabels) {
    // Converter dimensões para pixels considerando zoom
    const widthPx = cmToPixel(bannerWidth);
    const heightPx = cmToPixel(bannerHeight);
    
    // Limpar o canvas com fundo branco
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Desenhar a imagem se existir
    if (uploadedImage) {
        // Calcular posição centralizada, ajustada para o canvas sem margens
        const centerX = (widthPx / 2) + imageX - (imageWidth / 2);
        const centerY = (heightPx / 2) + imageY - (imageHeight / 2);
        
        // Desenhar a imagem centralizada
        ctx.drawImage(uploadedImage, centerX, centerY, imageWidth, imageHeight);
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
    
    // Desenhar as linhas das folhas A4
    for (let row = 0; row < sheets.vertical; row++) {
        for (let col = 0; col < sheets.horizontal; col++) {
            // Alternar cores para melhor visualização
            const colors = getThemeColors();
            ctx.strokeStyle = (row + col) % 2 === 0 ? colors.sheetBorderColor : colors.sheetAltBorderColor;
            ctx.lineWidth = 1;
            
            const x = col * (a4WidthPx - marginPx);
            const y = row * (a4HeightPx - marginPx);
            
            // Desenhar apenas a parte da folha que cabe na faixa
            const remainingWidth = Math.min(a4WidthPx, widthPx - col * (a4WidthPx - marginPx));
            const remainingHeight = Math.min(a4HeightPx, heightPx - row * (a4HeightPx - marginPx));
            
            if (remainingWidth > 0 && remainingHeight > 0) {
                ctx.strokeRect(x, y, remainingWidth, remainingHeight);
                
                // Adicionar numeração se showGridLabels estiver ativado
                if (showGridLabels) {
                    ctx.fillStyle = ctx.strokeStyle;
                    
                    // Usar fonte menor (8px) para os identificadores
                    ctx.font = '4px Inter';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    
                    // Usar formato L{linha}C{coluna} para identificar as folhas
                    const sheetLabel = `L${row+1}C${col+1}`;
                    
                    // Posicionamento do texto no canto superior direito da célula
                    // para ser menos intrusivo
                    const textX = x + remainingWidth - 20;
                    const textY = y + 15;
                    
                    // Adicionar um pequeno retângulo semitransparente atrás do texto
                    // para melhor legibilidade
                    const textWidth = ctx.measureText(sheetLabel).width;
                    const padding = 3;
                    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
                    ctx.fillRect(
                        textX - textWidth/2 - padding,
                        textY - 5 - padding,
                        textWidth + padding*2,
                        10 + padding*2
                    );
                    
                    // Desenhar o texto do identificador
                    ctx.fillStyle = ctx.strokeStyle;
                    ctx.fillText(sheetLabel, textX, textY);
                }
            }
        }
    }
}

// Função aprimorada para exportar o canvas como PNG
function exportEnhancedPNG() {
    const bannerWidth = parseFloat(bannerWidthInput.value) || 100;
    const bannerHeight = parseFloat(bannerHeightInput.value) || 50;
    
    // Verificar se a opção de mostrar números está ativada
    const showGridLabels = showNumbersCheckbox.checked;
    
    // Converter dimensões para pixels considerando zoom
    const widthPx = cmToPixel(bannerWidth);
    const heightPx = cmToPixel(bannerHeight);
    
    // Criar um canvas temporário para a exportação com o tamanho exato da faixa
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = widthPx;
    tempCanvas.height = heightPx;
    const tempCtx = tempCanvas.getContext('2d');
    
    // Desenhar a versão limpa da faixa no canvas temporário
    // Passando o parâmetro showGridLabels para indicar se deve mostrar as labels
    drawEnhancedCleanBanner(tempCtx, tempCanvas.width, tempCanvas.height, bannerWidth, bannerHeight, showGridLabels);
    
    // Criar um link temporário
    const link = document.createElement('a');
    link.download = 'distribuicao-folhas.png';
    link.href = tempCanvas.toDataURL('image/png');
    
    // Simular um clique no link
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Substituir a função original pela versão aprimorada
window.addEventListener('DOMContentLoaded', () => {
    // Armazenar referência ao botão de exportação
    const exportButton = document.getElementById('export-button');
    
    // Substituir o listener original
    if (exportButton) {
        // Remover listeners existentes
        const newExportButton = exportButton.cloneNode(true);
        exportButton.parentNode.replaceChild(newExportButton, exportButton);
        
        // Adicionar novo listener com a função aprimorada
        newExportButton.addEventListener('click', exportEnhancedPNG);
        
        console.log('Exportação PNG aprimorada ativada.');
    }
});
