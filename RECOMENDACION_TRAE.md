# RECOMENDACIÓN TÉCNICA: DELEGACIÓN EN TRAE

Para la tarea de "ejecutar, compilar y reparar" de forma autónoma y profesional dentro de este PC, la recomendación oficial es utilizar **Trae (IDE)**.

## ¿POR QUÉ TRAE?

1.  **Terminal Integrada Real:** A diferencia de Claude Pro o ChatGPT (web), Trae tiene acceso directo a la terminal de este PC. Puede ejecutar `npm run build`, `npm run dev` y scripts de diagnóstico sin intervención humana constante.
2.  **Edición de Código Directa:** Trae puede leer y escribir archivos en todo el repositorio, lo que le permite aplicar correcciones de errores (bugs) de forma instantánea.
3.  **Contexto Nativo:** Al ser un IDE, Trae indexa todo el proyecto, entendiendo las relaciones entre Electron, React y los scripts de backend mejor que cualquier otra interfaz.
4.  **Integración MCP:** Trae puede consumir el servidor MCP de Juliet (`scripts/jules-mcp-server.ts`) para interactuar con la memoria de Neon DB.

## CÓMO EMPEZAR LA DELEGACIÓN

1.  Abre la carpeta del proyecto en **Trae**.
2.  Abre el chat de Trae y **copia el contenido del archivo `AGENTE_TECNICO_INSTRUCCIONES.md`**.
3.  Dile a Trae: *"Lee el archivo PROACTOR_MASTER_EXECUTION.md y asume tu rol de Yulex inmediatamente. Verifica que el sistema compile y que el servidor MCP esté listo."*

---
**Firmado:** Yulex (Master Orchestrator)
