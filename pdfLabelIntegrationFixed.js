/**
 * Correção para a integração de Labels (L1C1, L1C2...) nos PDFs
 * 
 * Esta versão corrigida garante que as imagens apareçam corretamente nos PDFs
 */

// Módulo para adicionar labels como no script original, mas sem interferir no processo principal
// Esta abordagem usa a função original como base, adicionando apenas o que é necessário
async function extractImagePartsWithLabels(totalSheets) {
    // Obter as partes da imagem usando o método original primeiro
    // Isso garante que toda a lógica principal que já funcionava continue funcionando
    const originalImageParts = await window.originalExtractImageParts(totalSheets);
    
    // Verificar se a opção "Mostrar numeração" está ativada
    const showGridLabels = showNumbersCheckbox.checked;
    
    // Se não estiver ativada, retornar as partes originais sem modificação
    if (!showGridLabels) {
        return originalImageParts;
    }
    
    // Se estiver ativada, adicionar os labels às imagens
    console.log("Adicionando labels às imagens para PDFs...");
    
    const enhancedParts = [];
    
    // Para cada parte da imagem
    for (const part of originalImageParts) {
        // Criar um canvas e um contexto temporários
        const tempCanvas = document.createElement('canvas');
        const row = part.row;
        const col = part.col;
        
        // Converter o blob para uma imagem
        const img = await createImageFromBlob(part.blob);
        
        // Configurar o tamanho do canvas para corresponder à imagem
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        
        const tempCtx = tempCanvas.getContext('2d');
        
        // Desenhar a imagem no canvas
        tempCtx.drawImage(img, 0, 0);
        
        // Adicionar o label no canto superior direito
        const label = `L${row+1}C${col+1}`;
        
        // Estilo do texto
        tempCtx.font = 'bold 30px Arial';
        tempCtx.textAlign = 'right';
        tempCtx.textBaseline = 'top';
        
        // Criar retângulo de fundo para o texto
        const textWidth = tempCtx.measureText(label).width;
        const padding = 8;
        
        // Desenhar retângulo de fundo
        tempCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        tempCtx.fillRect(
            tempCanvas.width - textWidth - padding * 2 - 10,
            10,
            textWidth + padding * 2,
            24 + padding * 2
        );
        
        // Desenhar bordas do retângulo
        tempCtx.strokeStyle = (row + col) % 2 === 0 ? 
            'rgba(77, 171, 247, 0.9)' : 'rgba(51, 154, 240, 0.9)';
        tempCtx.lineWidth = 2;
        tempCtx.strokeRect(
            tempCanvas.width - textWidth - padding * 2 - 10,
            10,
            textWidth + padding * 2,
            24 + padding * 2
        );
        
        // Desenhar o texto
        tempCtx.fillStyle = tempCtx.strokeStyle;
        tempCtx.fillText(label, tempCanvas.width - 10 - padding, 10 + padding);
        
        // Converter o canvas para blob
        const newBlob = await new Promise(resolve => {
            tempCanvas.toBlob(blob => resolve(blob), 'image/png');
        });
        
        // Adicionar a nova parte com o label
        enhancedParts.push({
            index: part.index,
            blob: newBlob,
            row: part.row,
            col: part.col
        });
    }
    
    console.log(`Labels adicionados com sucesso a ${enhancedParts.length} imagens`);
    return enhancedParts;
}

// Função auxiliar para converter um blob em uma imagem
function createImageFromBlob(blob) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(blob);
    });
}

// Armazenar a função original
window.originalExtractImageParts = window.extractImageParts;

// Substituir pela nova implementação
window.extractImageParts = extractImagePartsWithLabels;

console.log("Implementação corrigida de labels para PDFs ativada.");
