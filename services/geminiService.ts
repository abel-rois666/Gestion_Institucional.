import { GoogleGenAI } from "@google/genai";
import { Task, Department } from "../types";

// Note: In a real app, strict error handling for missing API keys is essential.
// For this demo, we assume the environment variable is present or handled by the component logic.

const formatTasksForPrompt = (tasks: Task[], depth = 0): string => {
  return tasks.map(t => {
    const indent = "  ".repeat(depth);
    let line = `${indent}- ${t.title} (${t.startDate || 'N/A'} a ${t.endDate || 'N/A'}): ${t.status} ${t.isSpecificTask ? '[Tarea Específica]' : '[Proceso General]'} ${t.assignee ? `[Resp: ${t.assignee}]` : ''}`;
    
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
  if (!process.env.API_KEY) {
    return "Error: Clave API de Gemini no encontrada. Por favor configure process.env.API_KEY.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-flash-preview";

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
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text || "No se pudo generar el reporte.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Ocurrió un error al contactar al servicio de IA. Por favor intente más tarde.";
  }
};