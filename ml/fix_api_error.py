import nbformat

path = "evaluasi_deepeval_openrouter.ipynb"

try:
    with open(path, "r", encoding="utf-8") as f:
        nb = nbformat.read(f, as_version=4)

    changed = False
    for cell in nb.cells:
        if cell.cell_type == "code":
            source = cell.source
            if "def call_real_system(user_input: str):" in source:
                # Find the function definition and replace it
                lines = source.split("\n")
                new_lines = []
                in_func = False
                
                # Replace the old function logic
                new_func = """def call_real_system(user_input: str):
    try:
        resp = requests.post(SYSTEM_API_URL, json={"message": user_input, "isEval": True}, timeout=120)
        resp.raise_for_status()
        data = resp.json()
        return {
            "answer": data.get("answer", ""),
            "contexts": data.get("contexts", []),
            "metadata": data.get("metadata", {})
        }
    except Exception as e:
        print(f"API Error for input '{user_input}': {e}")
        return {
            "answer": "Maaf, terjadi kesalahan internal pada server saat memproses permintaan ini.",
            "contexts": [],
            "metadata": {}
        }"""
                
                # Reconstruct source string
                for line in lines:
                    if line.startswith("def call_real_system("):
                        in_func = True
                        new_lines.append(new_func)
                    elif in_func and (line.startswith("    ") or line.strip() == ""):
                        # Skip old function body lines
                        continue
                    else:
                        in_func = False
                        new_lines.append(line)
                
                new_source = "\n".join(new_lines)
                if new_source != source:
                    cell.source = new_source
                    changed = True

    if changed:
        with open(path, "w", encoding="utf-8") as f:
            nbformat.write(nb, f)
        print("Successfully updated call_real_system to handle HTTP 500 errors gracefully!")
    else:
        print("No changes were made. Could not find call_real_system.")
except Exception as e:
    print("Error:", e)
