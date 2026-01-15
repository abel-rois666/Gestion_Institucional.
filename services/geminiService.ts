
import { GoogleGenAI } from "@google/genai";
import { Task, Department } from "../types";

// Helper for formatting tasks for the prompt
const formatTasksForPrompt = (tasks: Task[], depth = 0): string => {
  return tasks.map(t => {
    const indent = "  ".repeat(depth);
    // Fix: Using t.assignee_name instead of t.assignee
    let line = `${indent}- ${t.title} (${t.startDate || 'N/A'} a ${t.endDate || 'N/A'}): ${t.status} ${t.isSpecificTask ? '[Tarea Específica]' : '[Proceso General]'} ${t.assignee_name ? `[Resp: ${t.assignee_name}]` : ''}`;
    
    if (t.subtasks && t.subtasks.length > 0) {
      line += `\n${formatTasksForPrompt(t.subtasks, depth + 1)}`;
    }
    return line;
  }).join('\n');
};

export const generateEfficiencyReport = async (
  department: Department | 'GENERAL',
  tasks: Task[]
): Promise<string> => {
  // Fix: Initializing GoogleGenAI with named parameter and obtaining API key from process.env.API_KEY exclusively.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Fix: Using gemini-3-pro-preview for complex reasoning tasks like efficiency analysis and strategic recommendations.
  const model = "gemini-3-pro-preview";

  const taskSummary = formatTasksForPrompt(tasks);

  const prompt = `
    Actúa como un analista de eficiencia operativa experto para una universidad.
    Analiza los siguientes datos de procesos y tareas para el área: ${department}.
    La estructura muestra Procesos Generales y sus Tareas Específicas indentadas.
    
    Datos:
    ${taskSummary}

    Genera un reporte estratégico, breve y profesional (formato markdown) que incluya:
    1. **Resumen Ejecutivo**: Estado actual del cumplimiento de procesos generales.
    2. **Análisis de Cuellos de Botella**: Identifica si tareas específicas retrasadas están bloqueando procesos generales.
    3. **Recomendaciones Tácticas**: 3 acciones concretas para mejorar la eficiencia y el cumplimiento de fechas en los sub-procesos.
    
    Mantén el tono directivo y enfocado a resultados.
  `;

  try {
    // Fix: Using ai.models.generateContent to query GenAI with model name and prompt.
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    
    // Fix: Accessing text directly from the response object as a property, not a method.
    return response.text || "No se pudo generar el reporte.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Ocurrió un error al contactar al servicio de IA. Por favor intente más tarde.";
  }
};
