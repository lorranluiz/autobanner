/**
 * Módulo para extrair folhas com identificadores visuais
 * 
 * Este módulo modifica o processo de extração para adicionar
 * identificadores visuais que garantem a correspondência entre
 * a visualização e os arquivos PDF gerados.
 */

// Função para extrair partes da imagem com marcadores
async function extractImagePartsWithMarkers(totalSheets) {
    const bannerWidth = parseFloat(bannerWidthInput.value) || 100;
    const bannerHeight = parseFloat(bannerHeightInput.value) || 50;
    const sheets = calculateSheets(bannerWidth, bannerHeight);
    
    // Primeiro, renderizar a faixa completa em alta qualidade (como na exportação PNG)
    const fullBannerCanvas = document.createElement('canvas');
    
    // Usar DPI de impressão (300dpi) para melhor qualidade
    const DPI = 300;
    const INCH_TO_CM = 2.54;
    const pixelsPerCm = DPI / INCH_TO_CM;
    
    // Configurar o tamanho do canvas para a faixa completa
    fullBannerCanvas.width = Math.ceil(bannerWidth * pixelsPerCm);
    fullBannerCanvas.height = Math.ceil(bannerHeight * pixelsPerCm);
    
    const fullCtx = fullBannerCanvas.getContext('2d');
    
    // Desenhar fundo branco
    fullCtx.fillStyle = "#FFFFFF";
    fullCtx.fillRect(0, 0, fullBannerCanvas.width, fullBannerCanvas.height);
    
    // Desenhar a imagem na faixa
    if (uploadedImage) {
        // Calcular a escala entre a visualização e a resolução de impressão
        const screenToPrintRatio = fullBannerCanvas.width / cmToPixel(bannerWidth);
        
        // Calcular as dimensões em alta resolução
        const hiResImageWidth = imageWidth * screenToPrintRatio;
        const hiResImageHeight = imageHeight * screenToPrintRatio;
        
        // Calcular a posição central
        const centerX = fullBannerCanvas.width / 2;
        const centerY = fullBannerCanvas.height / 2;
        
        // Calcular os offsets
        const offsetX = imageX * screenToPrintRatio;
        const offsetY = imageY * screenToPrintRatio;
        
        // Desenhar a imagem na posição correta
        fullCtx.drawImage(
            uploadedImage, 
            centerX - (hiResImageWidth / 2) + offsetX, 
            centerY - (hiResImageHeight / 2) + offsetY, 
            hiResImageWidth, 
            hiResImageHeight
        );
    }
    
    // Obter as dimensões do A4 e margem
    const a4 = getA4Dimensions();
    const MM_TO_CM = 0.1;
    const marginInCm = sheetMargin * MM_TO_CM;
    
    // Converter dimensões de A4 para pixels em alta resolução
    const a4WidthPx = Math.ceil(a4.width * pixelsPerCm);
    const a4HeightPx = Math.ceil(a4.height * pixelsPerCm);
    const marginPx = Math.ceil(marginInCm * pixelsPerCm);
    
    // Array para armazenar partes extraídas
    const imageParts = [];
    
    // Para cada folha, extrair a parte correspondente da faixa completa
    for (let row = 0; row < sheets.vertical; row++) {
        for (let col = 0; col < sheets.horizontal; col++) {
            const sheetIndex = row * sheets.horizontal + col + 1;
            
            // Atualizar progresso
            updateProgress(`Processando folha ${sheetIndex} de ${totalSheets}`, 
                           ((sheetIndex - 1) / totalSheets * 100));
            
            // Calcular posição desta folha na faixa completa
            const x = Math.round(col * (a4WidthPx - marginPx));
            const y = Math.round(row * (a4HeightPx - marginPx));
            
            // Criar canvas para esta folha
            const sheetCanvas = document.createElement('canvas');
            sheetCanvas.width = a4WidthPx;
            sheetCanvas.height = a4HeightPx;
            
            const sheetCtx = sheetCanvas.getContext('2d');
            
            // Preencher com fundo branco
            sheetCtx.fillStyle = "#FFFFFF";
            sheetCtx.fillRect(0, 0, sheetCanvas.width, sheetCanvas.height);
            
            // Calcular largura e altura efetivas (para lidar com folhas nas bordas)
            const effectiveWidth = Math.min(a4WidthPx, fullBannerCanvas.width - x);
            const effectiveHeight = Math.min(a4HeightPx, fullBannerCanvas.height - y);
            
            if (effectiveWidth > 0 && effectiveHeight > 0) {
                // Extrair a parte correspondente da faixa
                sheetCtx.drawImage(
                    fullBannerCanvas,
                    x, y, effectiveWidth, effectiveHeight, // Área de origem
                    0, 0, effectiveWidth, effectiveHeight  // Posição de destino
                );
                
                // Adicionar identificador visual
                window.SheetIdentifier.addSheetIdentifier(sheetCanvas, row, col);
                
                // Converter para blob
                const blob = await new Promise(resolve => {
                    sheetCanvas.toBlob(blob => resolve(blob), 'image/png');
                });
                
                // Adicionar à lista
                imageParts.push({
                    row: row,
                    col: col,
                    index: sheetIndex,
                    blob: blob,
                    identifier: `L${row+1}C${col+1}`
                });
            }
        }
    }
    
    return {
        imageParts: imageParts,
        sheets: sheets
    };
}

// Função para criar PDFs das imagens extraídas com marcadores
async function createMarkedPDFs(extractionResult) {
    const { imageParts, sheets } = extractionResult;
    const pdfDocs = [];
    
    for (let i = 0; i < imageParts.length; i++) {
        const part = imageParts[i];
        
        // Atualizar progresso
        updateProgress(`Gerando PDF ${i+1} de ${imageParts.length}`, 
                      50 + ((i+1) / imageParts.length * 50));
        
        try {
            // Criar documento PDF
            const pdfDoc = await PDFLib.PDFDocument.create();
            
            // Definir dimensões (A4)
            const pageWidth = A4_WIDTH_MM * MM_TO_POINTS;
            const pageHeight = A4_HEIGHT_MM * MM_TO_POINTS;
            
            // Configurar orientação
            const pageSize = isPortrait 
                ? [pageWidth, pageHeight]
                : [pageHeight, pageWidth];
            
            // Adicionar página
            const page = pdfDoc.addPage(pageSize);
            
            // Converter blob para array buffer
            const imageBytes = await part.blob.arrayBuffer();
            
            // Incorporar imagem no PDF
            const image = await pdfDoc.embedPng(imageBytes);
            
            // Definir sangria
            const bleedPt = BLEED_MM * MM_TO_POINTS;
            
            // Desenhar imagem
            page.drawImage(image, {
                x: bleedPt,
                y: bleedPt,
                width: page.getWidth() - (bleedPt * 2),
                height: page.getHeight() - (bleedPt * 2),
            });
            
            // Adicionar marcas de corte
            await addCropMarks(page, pdfDoc);
            
            // Adicionar metadados
            pdfDoc.setTitle(`Folha ${part.identifier} - Faixa`);
            pdfDoc.setAuthor('Calculadora de Faixas');
            pdfDoc.setSubject('Parte de faixa para impressão');
            pdfDoc.setKeywords(['faixa', 'impressão', 'A4', part.identifier]);
            pdfDoc.setCreator('Calculadora de Faixas Web App');
            
            // Salvar PDF
            const pdfBytes = await pdfDoc.save();
            
            // Adicionar ao array de PDFs
            pdfDocs.push({
                name: `folha_${part.identifier}.pdf`,
                data: pdfBytes,
                row: part.row,
                col: part.col
            });
            
        } catch (error) {
            console.error(`Erro ao criar PDF para folha ${part.identifier}:`, error);
            throw new Error(`Falha ao gerar PDF para folha ${part.identifier}: ${error.message}`);
        }
    }
    
    return pdfDocs;
}

// Função para gerar PDFs com identificadores visuais
async function generatePDFsWithMarkers() {
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
        
        // Extrair partes da imagem com marcadores
        const extractionResult = await extractImagePartsWithMarkers(sheets.total);
        
        // Criar PDFs a partir das imagens extraídas
        const pdfDocs = await createMarkedPDFs(extractionResult);
        
        // Armazenar informações da faixa
        const bannerInfo = {
            width: bannerWidth,
            height: bannerHeight,
            portrait: isPortrait,
            sheets: extractionResult.sheets,
            margin: sheetMargin
        };
        
        // Criar guia de montagem
        updateProgress("Criando guia de montagem", 95);
        const assemblyGuide = await createAssemblyGuidePDF(extractionResult.sheets);
        
        // Adicionar o guia aos documentos
        pdfDocs.push(assemblyGuide);
        
        // Compactar PDFs em um arquivo ZIP
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

// Exportar função para o escopo global
window.generatePDFsWithMarkers = generatePDFsWithMarkers;
