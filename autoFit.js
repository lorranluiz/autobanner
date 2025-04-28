/**
 * Auto-Fit: Módulo para ajustar automaticamente a imagem ao tamanho do banner
 * Versão revisada com melhor compatibilidade de escopo
 */

// Função principal para ajustar automaticamente a imagem ao tamanho do banner
function autoFitImage() {
    console.log("Tentando aplicar auto-ajuste da imagem");
    
    // Verificar se a função tem acesso às variáveis necessárias
    if (typeof uploadedImage === 'undefined' || !uploadedImage) {
        console.error("Auto-ajuste: Imagem não disponível");
        return;
    }
    
    try {
        // Obter dimensões do banner em centímetros
        const bannerWidth = parseFloat(document.getElementById('banner-width').value);
        const bannerHeight = parseFloat(document.getElementById('banner-height').value);
        
        console.log(`Dimensões do banner: ${bannerWidth}cm x ${bannerHeight}cm`);
        
        // Verificar se a função cmToPixel existe
        if (typeof cmToPixel !== 'function') {
            console.error("Auto-ajuste: Função cmToPixel não encontrada");
            return;
        }
        
        // Converter para pixels
        const bannerWidthPx = cmToPixel(bannerWidth);
        const bannerHeightPx = cmToPixel(bannerHeight);
        
        // Verificar se as dimensões originais da imagem estão disponíveis
        if (typeof originalImageWidth === 'undefined' || typeof originalImageHeight === 'undefined') {
            console.error("Auto-ajuste: Dimensões originais da imagem não disponíveis");
            return;
        }
        
        // Calcular as proporções
        const bannerRatio = bannerWidthPx / bannerHeightPx;
        const imageRatio = originalImageWidth / originalImageHeight;
        
        console.log(`Proporção do banner: ${bannerRatio}, Proporção da imagem: ${imageRatio}`);
        
        // Calcular a escala necessária para cobrir toda a faixa
        let baseScale = (bannerWidthPx * 0.8) / originalImageWidth; // Escala base usada pelo sistema
        let newScale, scalePercent;
        
        if (imageRatio > bannerRatio) {
            // Imagem mais larga que a faixa - ajustar pela altura
            newScale = bannerHeightPx / originalImageHeight;
            console.log(`Ajustando pela altura: ${newScale}`);
        } else {
            // Imagem mais alta que a faixa - ajustar pela largura
            newScale = bannerWidthPx / originalImageWidth;
            console.log(`Ajustando pela largura: ${newScale}`);
        }
        
        scalePercent = Math.round((newScale / baseScale) * 100);
        
        // Garantir que a escala esteja dentro dos limites do slider (10-200%)
        scalePercent = Math.min(200, Math.max(10, scalePercent));
        
        console.log(`Escala calculada: ${scalePercent}%`);
        
        // Acessar diretamente os sliders
        const imageScaleSlider = document.getElementById('image-scale-slider');
        const imageXSlider = document.getElementById('image-x-slider');
        const imageYSlider = document.getElementById('image-y-slider');
        
        if (!imageScaleSlider || !imageXSlider || !imageYSlider) {
            console.error("Auto-ajuste: Não foi possível encontrar os sliders");
            return;
        }
        
        // Centralizar a imagem e aplicar escala
        imageXSlider.value = 0;
        imageYSlider.value = 0;
        imageScaleSlider.value = scalePercent;
        
        // Atualizar textos dos valores
        document.getElementById('image-x-value').textContent = "0";
        document.getElementById('image-y-value').textContent = "0";
        document.getElementById('image-scale-value').textContent = `${scalePercent}%`;
        
        // Atualizar variáveis globais para serem consistentes com os sliders
        // Acessando diretamente, sem "window."
        imageX = 0;
        imageY = 0;
        
        // Forçar chamada dos eventos de atualização
        // Simulando eventos de input para cada slider
        const inputEvent = new Event('input', { bubbles: true });
        imageXSlider.dispatchEvent(inputEvent);
        imageYSlider.dispatchEvent(inputEvent);
        imageScaleSlider.dispatchEvent(inputEvent);
        
        console.log(`Auto-ajuste aplicado com sucesso - Escala: ${scalePercent}%, X: 0, Y: 0`);
    } catch (error) {
        console.error("Erro ao aplicar auto-ajuste:", error);
    }
}

// Configurar event listeners quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    console.log("Inicializando funcionalidade de auto-ajuste");
    
    // Obter o checkbox de auto-ajuste
    const autoFitCheckbox = document.getElementById('auto-fit');
    
    if (!autoFitCheckbox) {
        console.error("Elemento 'auto-fit' não encontrado!");
        return;
    }
    
    // Adicionar listener para mudanças no checkbox
    autoFitCheckbox.addEventListener('change', function() {
        console.log(`Auto-ajuste ${this.checked ? 'ativado' : 'desativado'}`);
        if (this.checked) {
            console.log("Checkbox marcado, verificando imagem...");
            if (typeof uploadedImage !== 'undefined' && uploadedImage) {
                console.log("Imagem encontrada, aplicando auto-ajuste");
                autoFitImage();
            } else {
                console.warn("Checkbox marcado, mas nenhuma imagem encontrada");
            }
        }
    });
    
    // Verificar se o checkbox já está marcado ao carregar a página
    if (autoFitCheckbox.checked) {
        console.log("Auto-ajuste já está marcado ao carregar, verificando imagem...");
    }
    
    // Event listener para imagens recém-carregadas
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        console.log("Adicionando listener ao input de arquivo");
        
        fileInput.addEventListener('change', function() {
            console.log("Arquivo selecionado, esperando processamento...");
            
            // Esperar a imagem ser processada antes de aplicar o auto-ajuste
            setTimeout(() => {
                if (autoFitCheckbox.checked && typeof uploadedImage !== 'undefined' && uploadedImage) {
                    console.log("Aplicando auto-ajuste à nova imagem");
                    autoFitImage();
                }
            }, 500);
        });
    }
});

// Observar mudanças nos controles de imagem para detectar quando uma imagem é carregada
window.addEventListener('load', function() {
    console.log("Página carregada, configurando observer para controles de imagem");
    
    const imageControls = document.getElementById('image-controls');
    if (!imageControls) {
        console.error("Elemento 'image-controls' não encontrado");
        return;
    }
    
    // Observador para detectar quando os controles de imagem são exibidos
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                if (mutation.target.style.display === 'flex' || mutation.target.style.display === 'block') {
                    console.log("Controles de imagem exibidos - imagem detectada");
                    const autoFitCheckbox = document.getElementById('auto-fit');
                    if (autoFitCheckbox && autoFitCheckbox.checked && typeof uploadedImage !== 'undefined' && uploadedImage) {
                        console.log("Aplicando auto-ajuste após imagem ser restaurada");
                        setTimeout(autoFitImage, 200);
                    }
                }
            }
        });
    });
    
    // Iniciar observação
    observer.observe(imageControls, { attributes: true });
    
    // Verificar se já existe uma imagem e o auto-ajuste está marcado
    const autoFitCheckbox = document.getElementById('auto-fit');
    setTimeout(() => {
        if (autoFitCheckbox && autoFitCheckbox.checked) {
            console.log("Verificando imagem existente após carregamento completo");
            if (typeof uploadedImage !== 'undefined' && uploadedImage) {
                console.log("Imagem encontrada, aplicando auto-ajuste");
                autoFitImage();
            } else {
                console.warn("Auto-ajuste marcado, mas nenhuma imagem encontrada");
            }
        }
    }, 300);
});

// Exportar função para uso global
window.autoFitImage = autoFitImage;
