import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { getAllSharedVision, getSharedVision, saveSharedVision } from "./shared-memory-bridge.js";
import { saveJulesMemory, addTask } from "./jules-memory-sync.js";

/**
 * Juliet Orchestrator (MCP Server)
 * Núcleo de orquestación Proactor Intelligent (Yulex).
 */

const server = new Server(
  {
    name: "juliet-orchestrator",
    version: "3.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_shared_vision",
        description: "Recuperar la visión y preferencias compartidas desde Neon DB",
        inputSchema: {
          type: "object",
          properties: {
            topic: { type: "string" },
          },
        },
      },
      {
        name: "update_shared_vision",
        description: "Actualizar la memoria dinámica de la visión compartida",
        inputSchema: {
          type: "object",
          properties: {
            topic: { type: "string" },
            content: { type: "string" },
          },
          required: ["topic", "content"],
        },
      },
      {
        name: "save_juliet_memory",
        description: "Guardar información persistente en la memoria exclusiva de Juliet",
        inputSchema: {
          type: "object",
          properties: {
            category: { type: "string" },
            key: { type: "string" },
            content: { type: "string" },
          },
          required: ["category", "key", "content"],
        },
      },
      {
        name: "queue_local_task",
        description: "Añadir una tarea a la cola de ejecución local (terminal)",
        inputSchema: {
          type: "object",
          properties: {
            description: { type: "string" },
            command: { type: "string" },
          },
          required: ["description"],
        },
      },
      {
        name: "paperclip_hire_agent",
        description: "Contratar un nuevo agente a través del framework Paperclip",
        inputSchema: {
          type: "object",
          properties: {
            role: { type: "string" },
            goal: { type: "string" },
          },
          required: ["role", "goal"],
        },
      },
      {
        name: "supermemory_query",
        description: "Consultar la base de conocimientos global de SuperMemory",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" },
          },
          required: ["query"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "get_shared_vision") {
      const topic = (args as any).topic;
      const data = topic ? await getSharedVision(topic) : await getAllSharedVision();
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    }

    if (name === "update_shared_vision") {
      const { topic, content } = args as any;
      await saveSharedVision(topic, content);
      return { content: [{ type: "text", text: `Visión compartida actualizada: ${topic}` }] };
    }

    if (name === "save_juliet_memory") {
      const { category, key, content } = args as any;
      await saveJulesMemory(category, key, content);
      return { content: [{ type: "text", text: `Memoria de Juliet guardada: ${category}/${key}` }] };
    }

    if (name === "queue_local_task") {
      const { description, command } = args as any;
      await addTask(description, command);
      return { content: [{ type: "text", text: `Tarea encolada para ejecución local: ${description}` }] };
    }

    if (name === "paperclip_hire_agent") {
      const { role, goal } = args as any;
      // Simulación de orquestación Paperclip
      const msg = `[Paperclip] Agente contratado - Rol: ${role}, Objetivo: ${goal}`;
      await saveSharedVision('paperclip-agents', msg);
      return { content: [{ type: "text", text: msg }] };
    }

    if (name === "supermemory_query") {
      const { query } = args as any;
      // Aquí se conectaría con la API real de SuperMemory si estuviera configurada
      return { content: [{ type: "text", text: `SuperMemory buscando: "${query}". (Resultados integrados en Shared Vision)` }] };
    }

    throw new Error(`Herramienta no encontrada: ${name}`);
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error en Juliet Orchestrator: ${error.message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Juliet Orchestrator (MCP) activo y conectado.");
}

main().catch((error) => {
  console.error("Fallo crítico en Juliet Orchestrator:", error);
  process.exit(1);
});
