
// Función de primera clase para transformar bloques de código
function createCodeTransformer() {
    // Función interna que maneja la transformación
    function transformCodeBlock(codeContent, language = '') {
        // Escapar caracteres HTML para prevenir XSS
        const escapedCode = codeContent
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        
        // Determinar la clase CSS basada en el lenguaje
        const languageClass = language ? ` language-${language.toLowerCase()}` : '';
        const highlightClass = 'code-highlight';
        
        return {
            html: `<pre class="${highlightClass}"><code class="code-block${languageClass}">${escapedCode}</code></pre>`,
            language: language,
            content: escapedCode,
            hasLanguage: !!language
        };
    }
    
    // Retornar la función transformadora
    return transformCodeBlock;
}

// Función de primera clase para procesar múltiples bloques de código
function createMultiCodeProcessor(transformer) {
    return function(markdownText) {
        // Regex para detectar bloques de código con triple backticks
        // Captura: ```lenguaje (opcional) \n código \n ```
        const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
        let processedText = markdownText;
        const codeBlocks = [];
        let blockIndex = 0;
        
        // Reemplazar todos los bloques de código encontrados
        processedText = processedText.replace(codeBlockRegex, (match, language, codeContent) => {
            // Usar el transformador para procesar cada bloque
            const transformedBlock = transformer(codeContent.trim(), language);
            
            // Guardar información del bloque para referencia
            codeBlocks.push({
                index: blockIndex,
                original: match,
                transformed: transformedBlock,
                position: processedText.indexOf(match)
            });
            
            blockIndex++;
            return transformedBlock.html;
        });
        
        return {
            processedText: processedText,
            codeBlocks: codeBlocks,
            totalBlocks: blockIndex
        };
    };
}

// Función de primera clase para detectar bloques de código en tiempo real
function createCodeDetector() {
    let detectedBlocks = [];
    
    return function(text) {
        const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
        const newBlocks = [];
        let match;
        
        // Resetear la detección
        codeBlockRegex.lastIndex = 0;
        
        // Encontrar todos los bloques
        while ((match = codeBlockRegex.exec(text)) !== null) {
            newBlocks.push({
                fullMatch: match[0],
                language: match[1] || 'plaintext',
                content: match[2] ? match[2].trim() : '',
                startIndex: match.index,
                endIndex: match.index + match[0].length,
                isComplete: match[0].endsWith('```')
            });
        }
        
        detectedBlocks = newBlocks;
        return {
            blocks: detectedBlocks,
            count: detectedBlocks.length,
            hasIncompleteBlocks: detectedBlocks.some(block => !block.isComplete)
        };
    };
}

// Función principal para integrar el resaltado de código con el sistema existente
function enhanceMarkdownWithCodeHighlight(originalMarkdownToHtml) {
    const codeTransformer = createCodeTransformer();
    const multiCodeProcessor = createMultiCodeProcessor(codeTransformer);
    
    return function(markdownText) {
        // Primero procesar los bloques de código
        const codeResult = multiCodeProcessor(markdownText);
        
        // Luego aplicar el procesamiento normal de markdown
        const htmlResult = originalMarkdownToHtml(codeResult.processedText);
        
        return {
            html: htmlResult,
            codeInfo: {
                blocksProcessed: codeResult.totalBlocks,
                blocks: codeResult.codeBlocks
            }
        };
    };
}

// Función para mostrar indicador visual de bloques de código detectados
function showCodeBlockIndicator(blocksCount, hasIncomplete = false) {
    let indicator = document.getElementById('codeIndicator');
    
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'codeIndicator';
        indicator.className = 'fixed top-44 right-4 bg-purple-500 text-white px-3 py-1 rounded-full text-sm z-40 transition-all duration-300';
        document.body.appendChild(indicator);
    }
    
    if (blocksCount > 0) {
        const status = hasIncomplete ? ' (incompleto)' : '';
        indicator.textContent = `💻 Código: ${blocksCount} bloque${blocksCount > 1 ? 's' : ''}${status}`;
        indicator.style.opacity = '1';
        indicator.style.transform = 'translateX(0)';
        
        // Cambiar color si hay bloques incompletos
        if (hasIncomplete) {
            indicator.className = indicator.className.replace('bg-purple-500', 'bg-orange-500');
        } else {
            indicator.className = indicator.className.replace('bg-orange-500', 'bg-purple-500');
        }
    } else {
        indicator.style.opacity = '0';
        indicator.style.transform = 'translateX(100%)';
    }
}

// Función para configurar la detección automática de código
function setupAutoCodeDetection() {
    const editor = document.getElementById('markdownEditor');
    const codeDetector = createCodeDetector();
    
    if (editor) {
        editor.addEventListener('input', function() {
            const detection = codeDetector(this.value);
            showCodeBlockIndicator(detection.count, detection.hasIncompleteBlocks);
            
            // Log para debugging
            if (detection.count > 0) {
                console.log(`🔍 Detectados ${detection.count} bloques de código:`, detection.blocks);
            }
        });
    }
}

// Función para añadir estilos CSS de resaltado dinámicamente
function addCodeHighlightStyles() {
    const styleId = 'code-highlight-styles';
    
    // Evitar duplicar estilos
    if (document.getElementById(styleId)) {
        return;
    }
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        /* Estilos para bloques de código resaltados */
        .code-highlight {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 1px solid #3a3a5c;
            border-radius: 8px;
            margin: 16px 0;
            overflow-x: auto;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            position: relative;
        }
        
        .code-highlight::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
            border-radius: 8px 8px 0 0;
        }
        
        .code-block {
            display: block;
            padding: 16px 20px;
            margin: 0;
            color: #e0e6ed;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.5;
            background: transparent;
            white-space: pre;
            overflow-x: auto;
        }
        
        /* Estilos específicos por lenguaje */
        .language-javascript, .language-js {
            color: #f7df1e;
        }
        
        .language-python {
            color: #3776ab;
        }
        
        .language-html {
            color: #e34c26;
        }
        
        .language-css {
            color: #1572b6;
        }
        
        .language-json {
            color: #00d4aa;
        }
        
        /* Scrollbar personalizado para bloques de código */
        .code-highlight::-webkit-scrollbar {
            height: 8px;
        }
        
        .code-highlight::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
        }
        
        .code-highlight::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 4px;
        }
        
        .code-highlight::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
        }
        
        /* Animación de aparición */
        .code-highlight {
            animation: fadeInCode 0.3s ease-in-out;
        }
        
        @keyframes fadeInCode {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    
    document.head.appendChild(style);
}

// Función para integrar con el sistema principal
function integrateCodeHighlighting() {
    // Verificar que markdownToHtml existe en el scope global
    if (typeof window.markdownToHtml === 'function') {
        // Enhancer la función existente
        const originalFunction = window.markdownToHtml;
        window.markdownToHtml = enhanceMarkdownWithCodeHighlight(originalFunction);
    } else {
        console.warn('⚠️ markdownToHtml no encontrada, integrando directamente');
        
        // Modificar la función generatePreview existente
        const originalGeneratePreview = window.generatePreview;
        if (typeof originalGeneratePreview === 'function') {
            window.generatePreview = function() {
                const markdownText = document.getElementById('markdownEditor').value;
                const codeTransformer = createCodeTransformer();
                const multiCodeProcessor = createMultiCodeProcessor(codeTransformer);
                
                // Procesar bloques de código primero
                const codeResult = multiCodeProcessor(markdownText);
                
                // Aplicar markdown normal al texto procesado
                const htmlContent = markdownToHtml(codeResult.processedText);
                
                // Actualizar preview
                const preview = document.getElementById('preview');
                preview.innerHTML = htmlContent;
                
                // Reaplicar contraste si está activo
                if (window.isContrastActive) {
                    applyContrastToHeadings();
                }
                
                // Mostrar información de bloques procesados
                if (codeResult.totalBlocks > 0) {
                    console.log(`✅ Procesados ${codeResult.totalBlocks} bloques de código`);
                }
                
                // Efectos visuales del botón
                const generateBtn = document.getElementById('generateBtn');
                generateBtn.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    generateBtn.style.transform = 'scale(1)';
                }, 150);
            };
        }
    }
}

// Función de inicialización principal
function initializeCodeHighlighting() {
    // Añadir estilos CSS
    addCodeHighlightStyles();
    
    // Configurar detección automática
    setupAutoCodeDetection();
    
    // Integrar con el sistema existente
    integrateCodeHighlighting();
    
    console.log('✅ Sistema de resaltado de código inicializado');
    console.log('💡 Usa triple backticks (```) para crear bloques de código');
    console.log('💡 Opcionalmente especifica el lenguaje: ```javascript');
}

// Función para agregar shortcuts de teclado relacionados con código
function setupCodeShortcuts() {
    const editor = document.getElementById('markdownEditor');
    
    if (editor) {
        editor.addEventListener('keydown', function(e) {
            // Ctrl + Shift + C para insertar bloque de código
            if (e.ctrlKey && e.shiftKey && e.key === 'K') {
                e.preventDefault();
                insertCodeBlock(this);
            }
        });
    }
}

// Función auxiliar para insertar un bloque de código
function insertCodeBlock(textarea) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    const codeBlock = selectedText 
        ? `\`\`\`\n${selectedText}\n\`\`\`` 
        : `\`\`\`javascript\n// Tu código aquí\n\`\`\``;
    
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);
    
    textarea.value = beforeText + codeBlock + afterText;
    
    // Posicionar cursor dentro del bloque
    const newPosition = start + (selectedText ? 4 : 15); // Después de ```\n o ```javascript\n
    textarea.setSelectionRange(newPosition, newPosition);
    textarea.focus();
    
    // Mostrar notificación
    showCodeInsertNotification();
}

// Función para mostrar notificación de inserción de código
function showCodeInsertNotification() {
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-4 bg-purple-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300';
    notification.textContent = '💻 Bloque de código insertado';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 2000);
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    initializeCodeHighlighting();
    setupCodeShortcuts();
});

// Exportar funciones para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        createCodeTransformer,
        createMultiCodeProcessor,
        createCodeDetector,
        enhanceMarkdownWithCodeHighlight,
        initializeCodeHighlighting,
        setupCodeShortcuts
    };
}