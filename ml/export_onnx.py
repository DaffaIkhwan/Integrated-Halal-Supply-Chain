from optimum.exporters.onnx import main_export
from pathlib import Path

repo_id = "NurfauzanDaffa/indobert-intent"
output_dir = Path("indobert-onnx-fixed")

print(f"Exporting {repo_id} to {output_dir}...")
main_export(
    model_name_or_path=repo_id,
    output=output_dir,
    task="text-classification",
    no_post_process=True
)
print("Export complete!")
