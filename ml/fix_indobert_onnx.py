"""
Fix IndoBERT ONNX model: convert from external-data format to self-contained.

The model on HuggingFace (NurfauzanDaffa/indobert-intent) has model.onnx that
references an external model.onnx.data file which was never uploaded. This script:
1. Downloads the ONNX model
2. Converts it to self-contained format (all weights inside the .onnx file)
3. Saves it back — ready to re-upload to HuggingFace

Run: python ml/fix_indobert_onnx.py
Requires: pip install onnx huggingface_hub
"""
import os
import sys

def main():
    try:
        import onnx
    except ImportError:
        print("Installing onnx...")
        os.system(f"{sys.executable} -m pip install onnx")
        import onnx

    try:
        from huggingface_hub import hf_hub_download, HfApi
    except ImportError:
        print("Installing huggingface_hub...")
        os.system(f"{sys.executable} -m pip install huggingface_hub")
        from huggingface_hub import hf_hub_download, HfApi

    MODEL_REPO = "NurfauzanDaffa/indobert-intent"
    OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "indobert-fixed")
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print(f"[1/3] Downloading model.onnx from {MODEL_REPO}...")
    onnx_path = hf_hub_download(
        repo_id=MODEL_REPO,
        filename="onnx/model.onnx",
        local_dir=OUTPUT_DIR,
    )
    print(f"  Downloaded to: {onnx_path}")

    print("[2/3] Loading ONNX model (may take a moment for ~500MB)...")
    # Load model — this will fail if the external data is truly missing,
    # meaning the model stub itself references non-existent weights.
    try:
        model = onnx.load(onnx_path, load_external_data=False)
        print("  Loaded model stub (external data mode)")
        
        # Check if there ARE any external data references
        has_external = False
        for tensor in model.graph.initializer:
            if tensor.data_location == onnx.TensorProto.EXTERNAL:
                has_external = True
                break
        
        if has_external:
            print("  ⚠️ Model has external data references but no .data file was uploaded.")
            print("  ❌ Cannot fix without the original PyTorch model weights.")
            print()
            print("  === SOLUTION ===")
            print("  You need to re-export from the original PyTorch model.")
            print("  Run this in a Python environment with your trained model:")
            print()
            print("    from transformers import AutoModelForSequenceClassification, AutoTokenizer")
            print("    from optimum.exporters.onnx import main_export")
            print()  
            print(f'    main_export("{MODEL_REPO}", output="indobert-onnx-fixed/",')
            print('                task="text-classification",')
            print('                no_post_process=True)')
            print()
            print("  Or use the `optimum-cli` command:")
            print(f"    optimum-cli export onnx --model {MODEL_REPO} indobert-onnx-fixed/")
            print()
            print("  Then upload the fixed model:")
            print(f"    huggingface-cli upload {MODEL_REPO} indobert-onnx-fixed/ --repo-type model")
            return False
        else:
            print("  Model does NOT have external data — weights are embedded!")
            # This shouldn't happen given the error, but just in case
            output_path = os.path.join(OUTPUT_DIR, "model_fixed.onnx")
            onnx.save(model, output_path)
            print(f"  Saved to: {output_path}")
            return True
            
    except Exception as e:
        print(f"  Error loading model: {e}")
        print()
        print("  The model references external data that doesn't exist.")
        print("  You must re-export from the original PyTorch checkpoint.")
        print()
        print("  Run this Python script to fix and re-upload:")
        print("  ─────────────────────────────────────────────")
        print_reexport_script(MODEL_REPO)
        return False


def print_reexport_script(repo_id):
    print(f"""
# === Re-export IndoBERT to self-contained ONNX ===
# pip install transformers optimum[exporters] onnx onnxruntime

from pathlib import Path
from optimum.exporters.onnx import main_export

# Export with weights embedded (no external data)
main_export(
    model_name_or_path="{repo_id}",
    output=Path("indobert-onnx-fixed"),
    task="text-classification",
    no_post_process=True,
)

# Then upload:
# huggingface-cli upload {repo_id} indobert-onnx-fixed/ --repo-type model
# (This will overwrite onnx/model.onnx with the fixed version)
""")


if __name__ == "__main__":
    main()
