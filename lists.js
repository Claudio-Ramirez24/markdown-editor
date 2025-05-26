/**
 * HU2: Generación de Listas Numéricas Dinámicamente
 * Implementa funciones de orden superior para procesar listas automáticamente
 */

// Función de orden superior para procesar listas con callback
function processListsWithCallback(listProcessor) {
    return function(markdownText) {
        // Dividir el texto en líneas para procesamiento
        const lines = markdownText.split('\n');
        const processedLines = [];
        let inOrderedList = false;
        let inUnorderedList = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const result = listProcessor(line, i, {
                previousInOrderedList: inOrderedList,
                previousInUnorderedList: inUnorderedList
            });
            
            // Actualizar el estado basado en el resultado del procesador
            inOrderedList = result.isOrderedList;
            inUnorderedList = result.isUnorderedList;
            
            processedLines.push(result.processedLine);
        }
        
        return processedLines.join('\n');
    };
}

// Callback para procesar líneas individuales de lista
function listLineProcessor(line, index, context) {
    const trimmedLine = line.trim();
    
    // Detectar lista ordenada (1. 2. 3. etc.)
    const orderedListMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
    if (orderedListMatch) {
        const number = orderedListMatch[1];
        const content = orderedListMatch[2];
        
        return {
            processedLine: `<li data-number="${number}">${content}</li>`,
            isOrderedList: true,
            isUnorderedList: false,
            listType: 'ordered',
            content: content,
            number: parseInt(number)
        };
    }
    
    // Detectar lista no ordenada (- * +)
    const unorderedListMatch = trimmedLine.match(/^[-*+]\s+(.+)$/);
    if (unorderedListMatch) {
        const content = unorderedListMatch[1];
        
        return {
            processedLine: `<li>${content}</li>`,
            isOrderedList: false,
            isUnorderedList: true,
            listType: 'unordered',
            content: content
        };
    }
    
    // Línea normal (no es lista)
    return {
        processedLine: line,
        isOrderedList: false,
        isUnorderedList: false,
        listType: 'none'
    };
}

// Función de orden superior para agrupar elementos de lista
function groupListItems(itemGrouper) {
    return function(processedText) {
        return itemGrouper(processedText);
    };
}

// Callback para agrupar elementos <li> en listas <ol> y <ul>
function listItemGrouper(htmlText) {
    let result = htmlText;
    
    // Agrupar elementos <li> consecutivos con data-number en <ol>
    result = result.replace(/(<li data-number="\d+"[^>]*>.*?<\/li>)(?:\s*<li data-number="\d+"[^>]*>.*?<\/li>)*/gs, (match) => {
        // Limpiar los atributos data-number para el HTML final
        const cleanedItems = match.replace(/data-number="\d+"/g, '');
        return `<ol>${cleanedItems}</ol>`;
    });
    
    // Agrupar elementos <li> consecutivos sin data-number en <ul>
    result = result.replace(/(<li(?![^>]*data-number)[^>]*>.*?<\/li>)(?:\s*<li(?![^>]*data-number)[^>]*>.*?<\/li>)*/gs, (match) => {
        // Verificar que no esté ya en una lista
        if (!match.includes('<ol>') && !match.includes('<ul>')) {
            return `<ul>${match}</ul>`;
        }
        return match;
    });
    
    // Limpiar listas anidadas incorrectamente
    result = result.replace(/<\/ol>\s*<ol>/g, '');
    result = result.replace(/<\/ul>\s*<ul>/g, '');
    
    return result;
}

// Función principal para procesar listas automáticamente
function processListsAutomatically(markdownText) {
    // Crear el procesador de listas usando función de orden superior
    const listProcessor = processListsWithCallback(listLineProcessor);
    const listGrouper = groupListItems(listItemGrouper);
    
    // Procesar las líneas
    const processedText = listProcessor(markdownText);
    
    // Agrupar los elementos de lista
    const groupedText = listGrouper(processedText);
    
    return groupedText;
}

// Función para detectar listas en tiempo real mientras el usuario escribe
function setupAutoListDetection() {
    const editor = document.getElementById('markdownEditor');
    
    if (editor) {
        let lastProcessedContent = '';
        
        editor.addEventListener('input', function(e) {
            const currentContent = this.value;
            
            // Solo procesar si hay cambios significativos
            if (currentContent !== lastProcessedContent) {
                detectAndHighlightLists(currentContent);
                lastProcessedContent = currentContent;
            }
        });
        
        // Detectar Enter para auto-continuar listas
        editor.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                handleListContinuation(this, e);
            }
        });
    }
}

// Función para detectar y resaltar listas visualmente en el editor
function detectAndHighlightLists(content) {
    const lines = content.split('\n');
    let hasOrderedLists = false;
    let hasUnorderedLists = false;
    
    lines.forEach(line => {
        if (/^\d+\.\s+/.test(line.trim())) {
            hasOrderedLists = true;
        } else if (/^[-*+]\s+/.test(line.trim())) {
            hasUnorderedLists = true;
        }
    });
    
    // Mostrar indicador visual si hay listas
    showListIndicator(hasOrderedLists, hasUnorderedLists);
}

// Función para mostrar indicador visual de listas detectadas
function showListIndicator(hasOrdered, hasUnordered) {
    let indicator = document.getElementById('listIndicator');
    
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'listIndicator';
        indicator.className = 'fixed top-32 right-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm z-40 transition-all duration-300';
        document.body.appendChild(indicator);
    }
    
    if (hasOrdered || hasUnordered) {
        const types = [];
        if (hasOrdered) types.push('📝 Numeradas');
        if (hasUnordered) types.push('• No numeradas');
        
        indicator.textContent = `Listas: ${types.join(', ')}`;
        indicator.style.opacity = '1';
        indicator.style.transform = 'translateX(0)';
    } else {
        indicator.style.opacity = '0';
        indicator.style.transform = 'translateX(100%)';
    }
}

// Función para continuar automáticamente las listas al presionar Enter
function handleListContinuation(textarea, event) {
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPosition);
    const lines = textBeforeCursor.split('\n');
    const currentLine = lines[lines.length - 1];
    
    // Detectar si estamos en una lista ordenada
    const orderedMatch = currentLine.match(/^(\s*)(\d+)\.\s+(.*)$/);
    if (orderedMatch) {
        const indent = orderedMatch[1];
        const currentNumber = parseInt(orderedMatch[2]);
        const content = orderedMatch[3];
        
        // Si la línea está vacía, terminar la lista
        if (content.trim() === '') {
            event.preventDefault();
            // Remover la línea de lista vacía y añadir una línea normal
            const newPosition = cursorPosition - currentLine.length;
            textarea.value = textarea.value.substring(0, newPosition) + 
                           textarea.value.substring(cursorPosition);
            textarea.setSelectionRange(newPosition, newPosition);
            return;
        }
        
        // Continuar con el siguiente número
        event.preventDefault();
        const nextNumber = currentNumber + 1;
        const newListItem = `\n${indent}${nextNumber}. `;
        
        textarea.value = textarea.value.substring(0, cursorPosition) + 
                        newListItem + 
                        textarea.value.substring(cursorPosition);
        
        const newPosition = cursorPosition + newListItem.length;
        textarea.setSelectionRange(newPosition, newPosition);
        return;
    }
    
    // Detectar si estamos en una lista no ordenada
    const unorderedMatch = currentLine.match(/^(\s*)([-*+])\s+(.*)$/);
    if (unorderedMatch) {
        const indent = unorderedMatch[1];
        const bullet = unorderedMatch[2];
        const content = unorderedMatch[3];
        
        // Si la línea está vacía, terminar la lista
        if (content.trim() === '') {
            event.preventDefault();
            const newPosition = cursorPosition - currentLine.length;
            textarea.value = textarea.value.substring(0, newPosition) + 
                           textarea.value.substring(cursorPosition);
            textarea.setSelectionRange(newPosition, newPosition);
            return;
        }
        
        // Continuar con el mismo tipo de bullet
        event.preventDefault();
        const newListItem = `\n${indent}${bullet} `;
        
        textarea.value = textarea.value.substring(0, cursorPosition) + 
                        newListItem + 
                        textarea.value.substring(cursorPosition);
        
        const newPosition = cursorPosition + newListItem.length;
        textarea.setSelectionRange(newPosition, newPosition);
    }
}

// Función para inicializar el sistema de listas
function initializeLists() {
    setupAutoListDetection();
    console.log('✅ Sistema de listas automáticas inicializado');
}

// Exportar funciones para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        processListsWithCallback,
        listLineProcessor,
        groupListItems,
        listItemGrouper,
        processListsAutomatically,
        initializeLists,
        setupAutoListDetection
    };
}