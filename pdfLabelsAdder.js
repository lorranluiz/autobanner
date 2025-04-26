/**
 * Integração de rótulos L1C1, L1C2, etc. nos PDFs gerados
 * 
 * Este módulo adiciona rótulos discretos no canto superior direito de cada folha PDF
 * para facilitar a identificação durante a montagem da faixa.
 */

// Função para adicionar rótulos às páginas dos PDFs
function initPdfLabels() {
    // Guardamos referência à função original
    window.originalCreatePDFs = window.createPDFs;

    // Substituímos pela nossa função modificada
    window.createPDFs = createPDFsWithLabels;
    
    console.log('Sistema de rotulagem para PDFs ativado.');
}

// Versão modificada de createPDFs que adiciona rótulos
async function createPDFsWithLabels(imageParts, totalSheets) {
    console.log('Iniciando geração de PDFs com rótulos L1C1, L1C2, etc.');
    
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
            
            // Adicionar o rótulo L1C1, L1C2, etc. no canto superior direito
            await addSheetLabel(page, pdfDoc, part.row, part.col);
            
            // Adicionar informações ao PDF
            pdfDoc.setTitle(`Folha ${sheetNumber} - Faixa`);
            pdfDoc.setAuthor('Calculadora de Faixas');
            pdfDoc.setSubject('Parte de faixa para impressão');
            pdfDoc.setKeywords(['faixa', 'impressão', 'A4', 'folha ' + sheetNumber]);
            pdfDoc.setCreator('Calculadora de Faixas Web App');
            
            // Salvar o PDF como array de bytes
            const pdfBytes = await pdfDoc.save();
            
            // Adicionar à lista de PDFs com nome no formato LxCy
            pdfDocs.push({
                name: `folha_L${part.row+1}C${part.col+1}.pdf`, 
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

// Função para adicionar o rótulo de identificação na folha
async function addSheetLabel(page, pdfDoc, row, col) {
    const { rgb } = PDFLib;
    
    // Criar o rótulo no formato L{linha}C{coluna}
    const label = `L${row+1}C${col+1}`;
    
    // Carregar fonte
    const font = await pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold);
    
    // Tamanho da fonte para o rótulo
    const fontSize = 12;
    
    // Tamanho do texto do rótulo
    const textWidth = font.widthOfTextAtSize(label, fontSize);
    const textHeight = font.heightAtSize(fontSize);
    
    // Dimensões da página
    const pageWidth = page.getWidth();
    const pageHeight = page.getHeight();
    
    // Padding ao redor do texto
    const padding = 4;
    
    // Coordenadas para o box no canto superior direito com margem
    const boxX = pageWidth - textWidth - padding * 2 - 10;
    const boxY = pageHeight - textHeight - padding * 2 - 10;
    
    // Cor do fundo e borda baseada na alternância de cores das folhas
    const backgroundColor = rgb(1, 1, 1, 0.8); // Fundo branco semi-transparente
    const borderColor = (row + col) % 2 === 0 ? 
        rgb(0.3, 0.67, 0.97, 0.9) : // Azul claro para folhas alternadas
        rgb(0.2, 0.6, 0.94, 0.9);   // Azul mais escuro
    
    // Desenhar o retângulo de fundo
    page.drawRectangle({
        x: boxX,
        y: boxY,
        width: textWidth + padding * 2,
        height: textHeight + padding * 2,
        color: backgroundColor,
        borderColor: borderColor,
        borderWidth: 1.5,
    });
    
    // Desenhar o texto do rótulo
    page.drawText(label, {
        x: boxX + padding,
        y: boxY + padding,
        size: fontSize,
        font: font,
        color: borderColor,
    });
    
    return page;
}

// Inicializar quando a página for carregada
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPdfLabels);
} else {
    initPdfLabels();
}
