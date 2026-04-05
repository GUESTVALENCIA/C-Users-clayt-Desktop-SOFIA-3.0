import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { getAllSharedVision, getSharedVision, saveSharedVision } from "./shared-memory-bridge.js";

/**
 * Yulex Orchestrator (MCP Server)
 * Núcleo de interconexión para el ecosistema de Clay.
 * Este servidor debe ser ejecutado en el entorno local del usuario.
 */

const server = new Server(
  {
    name: "yulex-orchestrator",
    version: "2.0.0",
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
        description: "Recuperar la visión y preferencias compartidas de Clay y Yulex desde Neon DB",
        inputSchema: {
          type: "object",
          properties: {
            topic: { type: "string", description: "El tema específico de la visión a recuperar" },
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
        name: "orchestrate_system_task",
        description: "Orquestar tareas complejas interconectando sistemas (Aider, Open Manus, Obsidian, Google Workspace)",
        inputSchema: {
          type: "object",
          properties: {
            task: { type: "string" },
            systems: { type: "array", items: { type: "string" } },
          },
          required: ["task"],
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

    if (name === "orchestrate_system_task") {
      const { task, systems } = args as any;
      return { content: [{ type: "text", text: `Yulex iniciando orquestación para: ${task}. Conectando sistemas: ${systems?.join(', ') || 'todos'}.` }] };
    }

    throw new Error(`Herramienta no encontrada: ${name}`);
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error en Yulex Orchestrator: ${error.message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Yulex Orchestrator (MCP) activo.");
}

main().catch((error) => {
  console.error("Fallo crítico en Yulex Orchestrator:", error);
  process.exit(1);
});
