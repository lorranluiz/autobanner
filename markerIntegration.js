/**
 * Integração dos identificadores visuais com o sistema principal
 * 
 * Este arquivo substitui a função de geração de PDFs original pela
 * versão que utiliza identificadores visuais.
 */

// Substituir a função original de geração de PDFs
window.addEventListener('DOMContentLoaded', () => {
    // Armazenar referência à função original
    const originalGeneratePDFs = window.generatePDFs;
    
    // Substituir pela nova função
    window.generatePDFs = window.generatePDFsWithMarkers;
    
    console.log('Sistema de identificadores visuais ativado.');
});
