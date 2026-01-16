
import React, { useRef } from 'react';
import { 
  Bold, 
  Italic, 
  List, 
  Heading1, 
  Heading2, 
  Quote,
  Undo,
  Redo,
  AlignCenter // Agregado para centrar
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange, placeholder }) => {
  const editorRef = useRef<HTMLDivElement>(null);

  const execCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-200">
        <button 
          type="button"
          onClick={() => execCommand('bold')}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors text-gray-700"
          title="Negrita"
        >
          <Bold size={18} />
        </button>
        <button 
          type="button"
          onClick={() => execCommand('italic')}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors text-gray-700"
          title="Cursiva"
        >
          <Italic size={18} />
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <button 
          type="button"
          onClick={() => execCommand('justifyCenter')} // Comando para centrar
          className="p-1.5 hover:bg-gray-200 rounded transition-colors text-gray-700"
          title="Centrar Texto"
        >
          <AlignCenter size={18} />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button 
          type="button"
          // Corregido: Usa h1 en lugar de h2 para el título principal
          onClick={() => execCommand('formatBlock', 'h1')}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors text-gray-700"
          title="Título Principal (H1)"
        >
          <Heading1 size={18} />
        </button>
        <button 
          type="button"
          // Corregido: Usa h2 en lugar de h3 para subtítulos
          onClick={() => execCommand('formatBlock', 'h2')}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors text-gray-700"
          title="Subtítulo (H2)"
        >
          <Heading2 size={18} />
        </button>
        
        <div className="w-px h-6 bg-gray-300 mx-1" />
        
        <button 
          type="button"
          onClick={() => execCommand('insertUnorderedList')}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors text-gray-700"
          title="Lista"
        >
          <List size={18} />
        </button>
        <button 
          type="button"
          onClick={() => execCommand('formatBlock', 'blockquote')}
          className="p-1.5 hover:bg-gray-200 rounded transition-colors text-gray-700"
          title="Cita / Entrecomillado"
        >
          <Quote size={18} />
        </button>
        
        <div className="ml-auto flex items-center gap-1">
          <button 
            type="button"
            onClick={() => execCommand('undo')}
            className="p-1.5 hover:bg-gray-200 rounded transition-colors text-gray-700"
          >
            <Undo size={16} />
          </button>
          <button 
            type="button"
            onClick={() => execCommand('redo')}
            className="p-1.5 hover:bg-gray-200 rounded transition-colors text-gray-700"
          >
            <Redo size={16} />
          </button>
        </div>
      </div>

      {/* Editable Area */}
      <div 
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: content }}
        className="flex-1 p-6 outline-none prose prose-slate max-w-none overflow-y-auto custom-scrollbar min-h-[300px]"
        data-placeholder={placeholder}
        // Agregamos estilos para asegurar que H1, H2, Blockquote y Center se vean correctamente
        style={{
             textAlign: 'left' // Reset default alignment so justifyCenter works relative to this
        }}
      />
      <style>{`
        /* Estilos específicos para el editor */
        [contenteditable] h1 { font-size: 2em; font-weight: 800; margin-bottom: 0.5em; color: #1e293b; }
        [contenteditable] h2 { font-size: 1.5em; font-weight: 700; margin-bottom: 0.5em; color: #334155; }
        [contenteditable] blockquote { 
            border-left: 4px solid #3b82f6; 
            padding-left: 1rem; 
            margin-left: 0; 
            font-style: italic; 
            color: #475569; 
            background: #f8fafc;
            padding: 10px;
        }
        [contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: #94a3b8;
            pointer-events: none;
            display: block; /* For Firefox */
        }
      `}</style>
    </div>
  );
};
