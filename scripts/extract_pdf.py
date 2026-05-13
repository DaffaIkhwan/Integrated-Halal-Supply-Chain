import os
import PyPDF2

rag_dir = os.path.join(os.getcwd(), 'public', 'RAG')

print("Starting PDF extraction...")
for filename in os.listdir(rag_dir):
    if filename.endswith('.pdf'):
        pdf_path = os.path.join(rag_dir, filename)
        txt_path = os.path.join(rag_dir, filename + '.txt')
        
        if os.path.exists(txt_path):
            continue
            
        print(f"Extracting {filename}...")
        try:
            with open(pdf_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                text = ""
                for page in reader.pages:
                    extracted = page.extract_text()
                    if extracted:
                        text += extracted + "\n"
            
            with open(txt_path, 'w', encoding='utf-8') as f:
                f.write(text)
        except Exception as e:
            print(f"Failed to extract {filename}: {e}")

print("Extraction complete.")
