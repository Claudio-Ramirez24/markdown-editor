/**
 * HU1: Botón para Alternar el Formato de Texto
 * Implementa funciones de orden superior para aplicar/quitar formato
 */

// Función de orden superior que recibe un callback para aplicar formato
function applyFormatting(formatCallback) {
    return function(textarea, formatType) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        
        if (selectedText.length === 0) {
            alert('Por favor, selecciona texto para aplicar formato');
            return;
        }
        
        // Ejecutar el callback pasado como parámetro
        const result = formatCallback(selectedText, formatType);
        
        // Reemplazar el texto seleccionado con el resultado
        const beforeText = textarea.value.substring(0, start);
        const afterText = textarea.value.substring(end);
        
        textarea.value = beforeText + result.text + afterText;
        
        // Mantener la selección en el nuevo texto
        const newStart = start;
        const newEnd = start + result.text.length;
        textarea.setSelectionRange(newStart, newEnd);
        textarea.focus();
        
        return result;
    };
}

// Callback para aplicar o quitar formato de texto
function formatTextCallback(selectedText, formatType) {
    let formattedText = '';
    let wasFormatted = false;
    
    switch (formatType) {
        case 'bold':
            // Verificar si ya tiene formato de negrita
            if (selectedText.startsWith('**') && selectedText.endsWith('**') && selectedText.length > 4) {
                // Quitar formato de negrita
                formattedText = selectedText.slice(2, -2);
                wasFormatted = true;
            } else {
                // Aplicar formato de negrita
                formattedText = `**${selectedText}**`;
            }
            break;
            
        case 'italic':
            // Verificar si ya tiene formato de cursiva (evitar confusión con negrita)
            if (selectedText.startsWith('*') && selectedText.endsWith('*') && 
                !selectedText.startsWith('**') && selectedText.length > 2) {
                // Quitar formato de cursiva
                formattedText = selectedText.slice(1, -1);
                wasFormatted = true;
            } else {
                // Aplicar formato de cursiva
                formattedText = `*${selectedText}*`;
            }
            break;
            
        default:
            formattedText = selectedText;
    }
    
    return {
        text: formattedText,
        wasFormatted: wasFormatted,
        formatType: formatType
    };
}

// Función de orden superior para alternar entre formatos
function createFormatToggler() {
    let currentFormat = 'bold'; // Empezar con negrita
    const formatter = applyFormatting(formatTextCallback);
    
    return function(textarea) {
        // Aplicar el formato actual
        const result = formatter(textarea, currentFormat);
        
        if (result) {
            // Alternar al siguiente formato para la próxima vez
            currentFormat = currentFormat === 'bold' ? 'italic' : 'bold';
            
            // Actualizar el botón para mostrar el próximo formato
            updateFormatButton(currentFormat);
            
            // Mostrar mensaje de confirmación
            const action = result.wasFormatted ? 'removido' : 'aplicado';
            const formatName = result.formatType === 'bold' ? 'negrita' : 'cursiva';
            
            console.log(`✅ Formato ${formatName} ${action}`);
            
            return {
                success: true,
                action: action,
                format: formatName,
                nextFormat: currentFormat === 'bold' ? 'negrita' : 'cursiva'
            };
        }
        
        return { success: false };
    };
}

// Función para actualizar el texto del botón
function updateFormatButton(nextFormat) {
    const formatBtn = document.getElementById('formatBtn');
    if (formatBtn) {
        const formatText = nextFormat === 'bold' ? 'Negrita' : 'Cursiva';
        formatBtn.textContent = `Aplicar ${formatText}`;
        
        // Cambiar el ícono del botón
        const icon = nextFormat === 'bold' ? '𝐁' : '𝐼';
        formatBtn.innerHTML = `${icon} Aplicar ${formatText}`;
    }
}

// Función para inicializar el sistema de formato
function initializeFormatting() {
    const formatToggler = createFormatToggler();
    
    // Configurar el botón de formato
    const formatBtn = document.getElementById('formatBtn');
    const editor = document.getElementById('markdownEditor');
    
    if (formatBtn && editor) {
        formatBtn.addEventListener('click', () => {
            const result = formatToggler(editor);
            
            if (result.success) {
                // Efecto visual en el botón
                formatBtn.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    formatBtn.style.transform = 'scale(1)';
                }, 150);
                
                // Mostrar notificación visual
                showFormatNotification(result);
            }
        });
        
        // Inicializar el texto del botón
        updateFormatButton('bold');
    }
}

// Función para mostrar notificación visual del formato aplicado
function showFormatNotification(result) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-all duration-300';
    notification.textContent = `${result.format} ${result.action}. Próximo: ${result.nextFormat}`;
    
    document.body.appendChild(notification);
    
    // Animación de entrada
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remover después de 2 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}

// Atajo de teclado para formato rápido
function setupFormatShortcuts() {
    const editor = document.getElementById('markdownEditor');
    const formatToggler = createFormatToggler();
    
    if (editor) {
        editor.addEventListener('keydown', (e) => {
            // Ctrl + B para negrita, Ctrl + I para cursiva
            if (e.ctrlKey && (e.key === 'b' || e.key === 'B')) {
                e.preventDefault();
                const formatter = applyFormatting(formatTextCallback);
                formatter(editor, 'bold');
            } else if (e.ctrlKey && (e.key === 'i' || e.key === 'I')) {
                e.preventDefault();
                const formatter = applyFormatting(formatTextCallback);
                formatter(editor, 'italic');
            }
        });
    }
}

// Exportar funciones para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        applyFormatting,
        formatTextCallback,
        createFormatToggler,
        initializeFormatting,
        setupFormatShortcuts
    };
}