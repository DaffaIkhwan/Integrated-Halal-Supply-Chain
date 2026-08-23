# Panduan Fine-Tuning IndoBERT & Export ke ONNX

Panduan ini berisi langkah-langkah lengkap untuk melakukan *training* model klasifikasi intent (IndoBERT) secara terpisah menggunakan Google Colab. Kode ini telah dioptimalkan dan disatukan agar lebih rapi, termasuk penambahan evaluasi metrik klasifikasi lengkap (Accuracy, Precision, Recall, F1-Score, dan Confusion Matrix) serta fitur checkpoint backup.

## Langkah 1: Persiapan di Google Colab
1. Buka [Google Colab](https://colab.research.google.com/).
2. Buat notebook baru.
3. Ubah Runtime ke GPU: `Runtime` > `Change runtime type` > Pilih `T4 GPU`.
4. Upload file `dataset_intent.csv` (berisi teks dan label intent) ke dalam Colab.

## Langkah 2: Copy-Paste Script ke Colab
Salin seluruh kode Python di bawah ini, tempelkan ke dalam **satu cell** di Colab, lalu jalankan.

```python
# ==========================================
# 1. Install Dependencies
# ==========================================
!pip install --upgrade datasets
!pip install transformers[torch] optimum[onnxruntime] onnxscript scikit-learn pandas==2.2.2

# ==========================================
# 2. Import Libraries
# ==========================================
import pandas as pd
import numpy as np
import os
import warnings
import shutil
import torch
from google.colab import files

from datasets import Dataset
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer,
)
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, f1_score, classification_report, confusion_matrix

# ──────────────────────────────────────────────
# FIX: Patch torchvision VideoReader yang dihapus
# di versi baru agar isinstance() di datasets tidak error.
# ──────────────────────────────────────────────
import torchvision.io
_VideoReaderDummy = type("VideoReader", (), {})
if not hasattr(torchvision.io, "VideoReader"):
    torchvision.io.VideoReader = _VideoReaderDummy

import importlib
import datasets.formatting.torch_formatter as _tf
importlib.reload(_tf)

warnings.filterwarnings("ignore", message=".*pin_memory.*")

# ==========================================
# 3. Load Dataset & Preprocessing
# ==========================================
print("Loading dataset...")
df = pd.read_csv("dataset_intent.csv")

le = LabelEncoder()
df["label_idx"] = le.fit_transform(df["label"])
labels = le.classes_.tolist()
print(f"Classes ({len(labels)}): {labels}")

dataset = Dataset.from_pandas(df)
# Pisahkan 10% untuk Test Set (Sesuai metode held-out test set)
dataset = dataset.train_test_split(test_size=0.1, seed=42)

# ==========================================
# 4. Tokenization
# ==========================================
print("Loading Tokenizer...")
model_name = "indobenchmark/indobert-base-p1"
tokenizer = AutoTokenizer.from_pretrained(model_name)

def tokenize_function(examples):
    return tokenizer(
        examples["text"],
        padding="max_length",
        truncation=True,
        max_length=128,
    )

tokenized_datasets = dataset.map(tokenize_function, batched=True)
tokenized_datasets = tokenized_datasets.remove_columns(["text", "label"])
tokenized_datasets = tokenized_datasets.rename_column("label_idx", "labels")
tokenized_datasets.set_format("torch")

# ==========================================
# 5. Setup Model & Metrics
# ==========================================
print("Loading IndoBERT Model...")
id2label = {i: label for i, label in enumerate(labels)}
label2id = {label: i for i, label in enumerate(labels)}

model = AutoModelForSequenceClassification.from_pretrained(
    model_name,
    num_labels=len(labels),
    id2label=id2label,
    label2id=label2id,
)

def compute_metrics(eval_pred):
    logits, label_ids = eval_pred
    preds = np.argmax(logits, axis=-1)
    acc = accuracy_score(label_ids, preds)
    f1 = f1_score(label_ids, preds, average="weighted")
    return {"accuracy": acc, "f1": f1}

# ==========================================
# 6. Training
# ==========================================
training_args = TrainingArguments(
    output_dir="./results",
    eval_strategy="epoch",
    save_strategy="epoch",
    learning_rate=2e-5,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=16,
    num_train_epochs=5,
    weight_decay=0.01,
    load_best_model_at_end=True,
    metric_for_best_model="f1",
    logging_steps=10,
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_datasets["train"],
    eval_dataset=tokenized_datasets["test"],
    compute_metrics=compute_metrics,
)

print("Starting training...")
trainer.train()

# ==========================================
# 7. Evaluasi Akhir di Test Set
# ==========================================
print("\n--- Final Evaluation on Held-out Test Set ---")
test_results = trainer.predict(tokenized_datasets["test"])
preds = np.argmax(test_results.predictions, axis=-1)
label_ids = test_results.label_ids

# Menampilkan metrik lengkap: Precision, Recall, F1 per kelas + Macro/Weighted
print("\n[ 1 ] Classification Report (Accuracy, Precision, Recall, F1):")
print(classification_report(label_ids, preds, target_names=labels, zero_division=0))

# Menampilkan Confusion Matrix
print("\n[ 2 ] Confusion Matrix:")
cm = confusion_matrix(label_ids, preds)
df_cm = pd.DataFrame(cm, index=labels, columns=labels)
print(df_cm)

# ==========================================
# 8. Simpan Model & Checkpoint
# ==========================================
trainer.save_model("./indobert-intent-finetuned")
tokenizer.save_pretrained("./indobert-intent-finetuned")
print("Model fine-tuned saved!")

# Fitur Checkpoint (Backup)
checkpoint_dir = "./project_checkpoint"
os.makedirs(checkpoint_dir, exist_ok=True)
shutil.copytree("./indobert-intent-finetuned", os.path.join(checkpoint_dir, "indobert-intent-finetuned"), dirs_exist_ok=True)
shutil.copytree("./results", os.path.join(checkpoint_dir, "results"), dirs_exist_ok=True)
print(f"Project checkpoint created in {checkpoint_dir}")

# ==========================================
# 9. Export ke ONNX
# ==========================================
print("Exporting to ONNX format...")
model.eval()
dummy = tokenizer("contoh kalimat", return_tensors="pt", padding="max_length", max_length=128, truncation=True)
os.makedirs("./indobert-intent-onnx", exist_ok=True)

torch.onnx.export(
    model,
    (dummy["input_ids"], dummy["attention_mask"], dummy["token_type_ids"]),
    "./indobert-intent-onnx/model.onnx",
    input_names=["input_ids", "attention_mask", "token_type_ids"],
    output_names=["logits"],
    dynamic_axes={
        "input_ids": {0: "batch_size", 1: "sequence"},
        "attention_mask": {0: "batch_size", 1: "sequence"},
        "token_type_ids": {0: "batch_size", 1: "sequence"},
        "logits": {0: "batch_size"},
    },
    opset_version=14,
)

tokenizer.save_pretrained("./indobert-intent-onnx")
shutil.copy("./indobert-intent-finetuned/config.json", "./indobert-intent-onnx/config.json")
print("Export complete! ✅")

# Verifikasi file
for f in os.listdir("./indobert-intent-onnx"):
    size = os.path.getsize(f"./indobert-intent-onnx/{f}")
    print(f"  {f} ({size/1024:.1f} KB)")

# ==========================================
# 10. Zip & Download Hasil ONNX
# ==========================================
print("Zipping folder...")
shutil.make_archive("indobert-intent-onnx", 'zip', "indobert-intent-onnx")
print("Zip complete! Downloading...")
files.download("indobert-intent-onnx.zip")
```

## Langkah 3: Pasang ke Next.js
1. Script di atas akan otomatis mengunduh file `indobert-intent-onnx.zip`. (Jika browser meminta izin, klik Allow/Izinkan).
2. Jika download otomatis gagal, buka tab **Files** di sebelah kiri Colab, cari file `indobert-intent-onnx.zip`, dan **Download** secara manual.
3. Ekstrak file zip tersebut.
4. Di dalam proyek Next.js Anda, pastikan ada folder `public/models/indobert-intent`.
5. Pindahkan **semua isi** folder ekstrak tadi (file `.onnx`, `config.json`, `vocab.txt`, dll) ke dalam folder `public/models/indobert-intent`.
6. Selesai! Model ONNX siap digunakan secara offline oleh aplikasi Anda.
