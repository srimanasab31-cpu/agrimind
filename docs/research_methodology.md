# AgriMind Research Methodology

## Goal
To evaluate and deploy an evidence-grounded AI decision support system targeting Sustainable Development Goals (SDGs 2, 12, 13) within the agricultural sector (specifically Tamil Nadu contexts).

## Metrics & Evaluation
### 1. Retrieval-Augmented Generation (RAG)
We test the Knowledge Base extraction using standard Information Retrieval metrics:
- **Precision@K**: How many of the top K retrieved documents are relevant.
- **Recall@K**: What proportion of all relevant documents are retrieved.
- **Faithfulness**: Rate at which generated answers rely *exclusively* on retrieved evidence rather than LLM hallucinations.

### 2. Computer Vision (Disease Detection)
The models (ResNet/EfficientNet class) are evaluated on labeled leaf datasets via:
- **Confusion Matrices**: To detect class imbalances.
- **F1 Score**: Harmonic mean of precision and recall.
- **Confidence Calibration**: Ensuring the model outputs a probability score that reliably matches its actual likelihood of being correct.

### 3. Human-In-The-Loop
To avoid agricultural disasters caused by automated AI over-confidence, the platform separates *factual observation* (retrieved docs) from *predictions* (CV models). Low confidence scores automatically trigger "Human Review" fallback paths.
