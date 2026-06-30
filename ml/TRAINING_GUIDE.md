# Panduan Fine-Tuning IndoBERT & Export ke ONNX

Karena Next.js (Node.js) tidak dirancang untuk melatih model Machine Learning dari nol, Anda perlu melakukan proses *training* secara terpisah menggunakan Python (direkomendasikan menggunakan Google Colab yang memiliki GPU gratis).

Berikut adalah langkah-langkah lengkapnya:

## Langkah 1: Persiapan di Google Colab
1. Buka [Google Colab](https://colab.research.google.com/).
2. Buat notebook baru.
3. Ubah Runtime ke GPU: `Runtime` > `Change runtime type` > Pilih `T4 GPU`.
4. Upload file `ml/dataset_intent.csv` yang baru saja kita generate ke dalam Colab.

## Langkah 2: Install Dependencies
Jalankan sel kode berikut di Colab:
```python
!pip install transformers[torch] datasets --upgrade optimum[onnxruntime] onnxscript scikit-learn pandas
```

> **Penting:** `datasets --upgrade` diperlukan untuk memperbaiki bug `VideoReader` di versi lama.

## Langkah 3: Script Training & Export
Copy-paste seluruh kode Python di bawah ini ke dalam sel Colab dan jalankan:

```python
import pandas as pd
import numpy as np
import os
import warnings

from datasets import Dataset
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer,
)
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, f1_score

# ──────────────────────────────────────────────
# FIX: Patch torchvision VideoReader yang dihapus
# di versi baru. Harus dipatch di dua tempat agar
# isinstance() di datasets tidak error.
# ──────────────────────────────────────────────
import torchvision.io
_VideoReaderDummy = type("VideoReader", (), {})
if not hasattr(torchvision.io, "VideoReader"):
    torchvision.io.VideoReader = _VideoReaderDummy

# Patch juga di level module cache agar "from torchvision.io import VideoReader" konsisten
import importlib
import datasets.formatting.torch_formatter as _tf
importlib.reload(_tf)

warnings.filterwarnings("ignore", message=".*pin_memory.*")

# ──────────────────────────────────────────────
# 1. Load Dataset
# ──────────────────────────────────────────────
print("Loading dataset...")
df = pd.read_csv("dataset_intent.csv")

le = LabelEncoder()
df["label_idx"] = le.fit_transform(df["label"])
labels = le.classes_.tolist()
print(f"Classes ({len(labels)}): {labels}")

dataset = Dataset.from_pandas(df)
dataset = dataset.train_test_split(test_size=0.1, seed=42)

# ──────────────────────────────────────────────
# 2. Tokenization
# ──────────────────────────────────────────────
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

# ──────────────────────────────────────────────
# 3. Setup Model
# ──────────────────────────────────────────────
print("Loading IndoBERT Model...")
id2label = {i: label for i, label in enumerate(labels)}
label2id = {label: i for i, label in enumerate(labels)}

model = AutoModelForSequenceClassification.from_pretrained(
    model_name,
    num_labels=len(labels),
    id2label=id2label,
    label2id=label2id,
)

# ──────────────────────────────────────────────
# 4. Evaluation Metrics
# ──────────────────────────────────────────────
def compute_metrics(eval_pred):
    logits, label_ids = eval_pred
    preds = np.argmax(logits, axis=-1)
    acc = accuracy_score(label_ids, preds)
    f1 = f1_score(label_ids, preds, average="weighted")
    return {"accuracy": acc, "f1": f1}

# ──────────────────────────────────────────────
# 5. Training Arguments
# ──────────────────────────────────────────────
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

# ──────────────────────────────────────────────
# 6. Mulai Training
# ──────────────────────────────────────────────
print("Starting training...")
trainer.train()

# ──────────────────────────────────────────────
# 7. Evaluasi Akhir
# ──────────────────────────────────────────────
print("\n--- Final Evaluation ---")
results = trainer.evaluate()
print(f"Accuracy : {results['eval_accuracy']:.4f}")
print(f"F1 Score : {results['eval_f1']:.4f}")

# ──────────────────────────────────────────────
# 8. Simpan Model Fine-tuned
# ──────────────────────────────────────────────
trainer.save_model("./indobert-intent-finetuned")
tokenizer.save_pretrained("./indobert-intent-finetuned")
print("Model fine-tuned saved!")

# ──────────────────────────────────────────────
# 9. Export ke ONNX untuk Transformers.js
# (Menggunakan torch.onnx.export langsung
#  untuk menghindari bug kompatibilitas optimum)
# ──────────────────────────────────────────────
import shutil

print("Exporting to ONNX format...")
model.eval()

# Buat dummy input untuk ONNX tracing
dummy = tokenizer(
    "contoh kalimat", return_tensors="pt",
    padding="max_length", max_length=128, truncation=True
)

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

# Copy config dan tokenizer files ke folder ONNX
tokenizer.save_pretrained("./indobert-intent-onnx")
shutil.copy("./indobert-intent-finetuned/config.json", "./indobert-intent-onnx/config.json")
print("Export complete! ✅")

# ──────────────────────────────────────────────
# 10. Zip dan Download Hasil
# ──────────────────────────────────────────────
import shutil
from google.colab import files

print("Zipping folder...")
shutil.make_archive("indobert-intent-onnx", 'zip', "indobert-intent-onnx")
print("Zip complete! Downloading...")
files.download("indobert-intent-onnx.zip")
```

## Langkah 4: Download dan Pasang ke Next.js
1. Script di atas akan otomatis mengunduh file `indobert-intent-onnx.zip`. (Jika browser meminta izin, klik Allow/Izinkan).
2. Jika download otomatis gagal, buka tab **Files** (ikon folder di sebelah kiri Colab), cari file `indobert-intent-onnx.zip`, klik titik tiga di sebelahnya, lalu pilih **Download**.
3. Di komputer Anda, ekstrak file zip tersebut.
4. Di dalam proyek Next.js Anda, buat folder `public/models/indobert-intent`.
5. Pindahkan **semua isi** dari folder hasil ekstrak tadi (file `.onnx`, `config.json`, dll) ke dalam folder `public/models/indobert-intent`.
6. Selesai! Model siap digunakan secara offline oleh `@huggingface/transformers` di Route API.
