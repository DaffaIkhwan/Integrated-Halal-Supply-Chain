const fs = require('fs');
const path = require('path');

const filepath = path.join('c:', 'Users', 'Acer', 'Pictures', 'chatbot', 'NextRag', 'ml', 'evaluasi_deepeval_openrouter.ipynb');
const raw = fs.readFileSync(filepath, 'utf8');
const nb = JSON.parse(raw);
const cells = nb.cells;

// 1. Update LLMTestCase creation (additional_metadata -> metadata)
for (let i = 0; i < cells.length; i++) {
    const source = cells[i].source.join('');
    if (cells[i].cell_type === 'code' && source.includes('tc = LLMTestCase(')) {
        let newSource = source.replace(/additional_metadata=/g, "metadata=");
        cells[i].source = newSource.split(/(?<=\n)/);
    }
}

// 2. Update DeterministicIntentMetric (adding a_measure and handling metadata deprecation gracefully)
for (let i = 0; i < cells.length; i++) {
    const source = cells[i].source.join('');
    if (cells[i].cell_type === 'code' && source.includes('class DeterministicIntentMetric(BaseMetric):')) {
        cells[i].source = [
            "from deepeval.metrics import BaseMetric\n",
            "from deepeval.test_case import LLMTestCase\n",
            "\n",
            "class DeterministicIntentMetric(BaseMetric):\n",
            "    def __init__(self, threshold: float = 1.0):\n",
            "        self.threshold = threshold\n",
            "        self.name = \"Intent Routing Exact Match\"\n",
            "        self.score = 0.0\n",
            "        self.success = False\n",
            "        self.reason = \"\"\n",
            "\n",
            "    async def a_measure(self, test_case: LLMTestCase):\n",
            "        return self.measure(test_case)\n",
            "\n",
            "    def measure(self, test_case: LLMTestCase):\n",
            "        # Handle gracefully between deep eval versions\n",
            "        md = getattr(test_case, 'metadata', getattr(test_case, 'additional_metadata', {})) or {}\n",
            "        expected_intent = md.get(\"category\", \"unknown\") \n",
            "        actual_intent = md.get(\"detected_intent\", \"unknown\")\n",
            "        confidence = md.get(\"confidence_score\", 0.0)\n",
            "        \n",
            "        if confidence >= 0.7:\n",
            "            is_correct = (actual_intent == expected_intent)\n",
            "            self.reason = (f\"Confidence {confidence:.2f} (>= 0.7). \"\n",
            "                           f\"Prediksi: '{actual_intent}', Ekspektasi: '{expected_intent}'. \"\n",
            "                           f\"{'BENAR' if is_correct else 'SALAH'}.\")\n",
            "        else:\n",
            "            is_correct = (expected_intent == \"fallback\")\n",
            "            self.reason = (f\"Confidence {confidence:.2f} (< 0.7) - Fallback LLM. \"\n",
            "                           f\"Ekspektasi: '{expected_intent}'. \"\n",
            "                           f\"{'BENAR' if is_correct else 'SALAH'}.\")\n",
            "            \n",
            "        self.score = 1.0 if is_correct else 0.0\n",
            "        self.success = self.score >= self.threshold\n",
            "        return self.score\n",
            "\n",
            "    def is_successful(self):\n",
            "        return self.success\n",
            "\n",
            "    @property\n",
            "    def __name__(self):\n",
            "        return self.name\n"
        ];
    }
}

// 3. Update Eval Loop to use getattr(tc, 'metadata')
for (let i = 0; i < cells.length; i++) {
    const source = cells[i].source.join('');
    if (cells[i].cell_type === 'code' && source.includes('for tc in test_cases:')) {
        cells[i].source = [
            "from deepeval import evaluate\n",
            "from deepeval.evaluate.configs import DisplayConfig\n",
            "\n",
            "results_records = []\n",
            "\n",
            "for tc in test_cases:\n",
            "    md = getattr(tc, 'metadata', getattr(tc, 'additional_metadata', {})) or {}\n",
            "    category = md.get(\"category\", \"unknown\")\n",
            "    metrics = METRICS_PER_CATEGORY.get(category, []) + SAFETY_METRICS\n",
            "    eval_result = evaluate(\n",
            "        test_cases=[tc],\n",
            "        metrics=metrics,\n",
            "        display_config=DisplayConfig(show_indicator=True, print_results=False),\n",
            "    )\n",
            "    for test_result in eval_result.test_results:\n",
            "        for metric_data in test_result.metrics_data:\n",
            "            results_records.append({\n",
            "                \"category\": category,\n",
            "                \"input\": tc.input,\n",
            "                \"metric\": metric_data.name,\n",
            "                \"score\": metric_data.score,\n",
            "                \"threshold\": metric_data.threshold,\n",
            "                \"success\": metric_data.success,\n",
            "                \"reason\": metric_data.reason,\n",
            "            })\n",
            "\n",
            "print(f\"Total baris hasil metrik: {len(results_records)}\")\n"
        ];
    }
}

// Write back
fs.writeFileSync(filepath, JSON.stringify(nb, null, 1), 'utf8');
console.log('Notebook berhasil diperbaiki untuk async mode dan metadata.');
