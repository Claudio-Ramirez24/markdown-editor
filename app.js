// Variables globales
const markdownEditor = document.getElementById('markdownEditor');
const preview = document.getElementById('preview');
const generateBtn = document.getElementById('generateBtn');
const contrastBtn = document.getElementById('contrastBtn');
let isContrastActive = false;

// Función para convertir Markdown a HTML usando Regex
function markdownToHtml(markdown) {
    let html = markdown;

    // Convertir encabezados (# ## ### #### ##### ######)
    html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
    html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
    html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

    // Convertir listas no ordenadas (-)
    html = html.replace(/^[\s]*-\s+(.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    
    // Limpiar múltiples ul consecutivos
    html = html.replace(/<\/ul>\s*<ul>/g, '');

    // Convertir listas ordenadas (1. 2. 3.)
    html = html.replace(/^[\s]*\d+\.\s+(.+)$/gm, '<li>$1</li>');
    
    // Buscar secuencias de <li> que no estén ya en <ul> y envolverlas en <ol>
    html = html.replace(/(<li>(?:(?!<\/?[uo]l>).)*<\/li>(?:\s*<li>(?:(?!<\/?[uo]l>).)*<\/li>)*)/gs, (match) => {
        // Si ya está dentro de ul, no hacer nada
        if (html.indexOf('<ul>' + match) !== -1) {
            return match;
        }
        return '<ol>' + match + '</ol>';
    });

    // Limpiar múltiples ol consecutivos
    html = html.replace(/<\/ol>\s*<ol>/g, '');

    // Convertir párrafos (líneas que no son encabezados ni listas)
    html = html.replace(/^(?!<[huo]|<li)(.+)$/gm, '<p>$1</p>');

    // Limpiar párrafos vacíos
    html = html.replace(/<p>\s*<\/p>/g, '');

    // Limpiar líneas vacías múltiples
    html = html.replace(/\n\s*\n/g, '\n');

    return html;
}

// Función para generar vista previa
function generatePreview() {
    const markdownText = markdownEditor.value;
    const htmlContent = markdownToHtml(markdownText);
    preview.innerHTML = htmlContent;

    // Si el contraste está activo, reaplicarlo
    if (isContrastActive) {
        applyContrastToHeadings();
    }

    // Añadir efecto visual al botón
    generateBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        generateBtn.style.transform = 'scale(1)';
    }, 150);
}

// Función para aplicar contraste a los encabezados
function applyContrastToHeadings() {
    const headings = preview.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
        heading.classList.add('contrast-style');
    });
}

// Función para remover contraste de los encabezados
function removeContrastFromHeadings() {
    const headings = preview.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
        heading.classList.remove('contrast-style');
    });
}

// Función para alternar contraste
function toggleContrast() {
    if (isContrastActive) {
        removeContrastFromHeadings();
        contrastBtn.textContent = 'Contrastar Encabezados';
        contrastBtn.classList.remove('active');
        isContrastActive = false;
    } else {
        applyContrastToHeadings();
        contrastBtn.textContent = 'Quitar Contraste';
        contrastBtn.classList.add('active');
        isContrastActive = true;
    }

    // Efecto visual al botón
    contrastBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        contrastBtn.style.transform = 'scale(1)';
    }, 150);
}

// Event listeners
generateBtn.addEventListener('click', generatePreview);
contrastBtn.addEventListener('click', toggleContrast);

// Generar vista previa inicial si hay contenido
if (markdownEditor.value.trim()) {
    generatePreview();
}

// Ajustar altura del textarea automáticamente
markdownEditor.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
});

// Atajos de teclado
markdownEditor.addEventListener('keydown', function(e) {
    // Ctrl + Enter para generar vista previa
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        generatePreview();
    }
    
    // Ctrl + Shift + C para alternar contraste
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        toggleContrast();
    }
});

// Mensaje de ayuda en consola
console.log(`
🚀 Editor Markdown cargado correctamente!
📋 Atajos disponibles:
   • Ctrl + Enter: Generar vista previa
   • Ctrl + Shift + C: Alternar contraste en encabezados
`);

// Inicialización al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Editor Markdown inicializado correctamente');
});