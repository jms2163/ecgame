import os
import re
import json

PROJECT_ROOT = "./"  # change if needed

IMPORT_REGEX = re.compile(r'import\s+.*?\s+from\s+[\'"](.*?)[\'"]')

dependency_graph = {}

for root, _, files in os.walk(PROJECT_ROOT):
    for file in files:
        if file.endswith(".js"):
            path = os.path.join(root, file)
            module_name = os.path.relpath(path, PROJECT_ROOT)

            with open(path, "r", encoding="utf-8") as f:
                content = f.read()

            imports = IMPORT_REGEX.findall(content)
            dependency_graph[module_name] = imports

# Save JSON
with open("dependency_graph.json", "w") as out:
    json.dump(dependency_graph, out, indent=2)

# Optional: generate Graphviz DOT file
with open("dependency_graph.dot", "w") as dot:
    dot.write("digraph dependencies {\n")
    for module, deps in dependency_graph.items():
        for dep in deps:
            dot.write(f"  \"{module}\" -> \"{dep}\";\n")
    dot.write("}\n")

print("Dependency map generated.")
