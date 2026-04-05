import sys

def fix_file(filepath, search_text, replace_text):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    if search_text in content:
        new_content = content.replace(search_text, replace_text)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed {filepath}")
    else:
        print(f"Search text not found in {filepath}")

# For global.d.ts
search_dts = """    getRuntimeHealth: () => Promise<any>
    getEditorInventory: () => Promise<any>
    getMemoryPolicy: () => Promise<any>
    getPublicApiCapabilityRegistry: () => Promise<any>
    getKnowledgeRoutingPolicy: () => Promise<any>
    getMcpToolPriorityMap: () => Promise<any>
    getTeachingManifest: () => Promise<any>
    callTool: (name: string, args: any) => Promise<string>"""

# Preload.ts
search_preload = """        getRuntimeHealth: () => ipcRenderer.invoke('mcp:get-runtime-health'),
        getEditorInventory: () => ipcRenderer.invoke('mcp:get-editor-inventory'),
        getMemoryPolicy: () => ipcRenderer.invoke('mcp:get-memory-policy'),
        getPublicApiCapabilityRegistry: () => ipcRenderer.invoke('mcp:get-public-api-capability-registry'),
        getKnowledgeRoutingPolicy: () => ipcRenderer.invoke('mcp:get-knowledge-routing-policy'),
        getMcpToolPriorityMap: () => ipcRenderer.invoke('mcp:get-tool-priority-map'),
        getTeachingManifest: () => ipcRenderer.invoke('mcp:get-teaching-manifest'),
        callTool: (name: string, args: any) => ipcRenderer.invoke('mcp:call-tool', name, args),"""

# wait, I don't want to remove everything, just ensure OpenClaw is gone.
# In global.d.ts and preload.ts, it seems they were already cleaned or never there in the way I thought.
# Actually I see getOpenClawLibrary and getOpenClawCapabilityRegistry in my previous read_file but NOT in the search blocks.
# Let me re-read them carefully.
