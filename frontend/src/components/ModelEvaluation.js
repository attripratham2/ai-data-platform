import React, { useState } from "react";

// This component allows users to upload a dataset, select a target column,
// choose a model, and evaluate its accuracy. Results are displayed below.
function ModelEvaluation() {
  const [file, setFile] = useState(null);
  const [targetColumn, setTargetColumn] = useState("");
  const [modelType, setModelType] = useState("logistic_regression");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null); // reset previous results
  };

  const handleSubmit = async () => {
    if (!file) {
      alert("Please upload a CSV file first.");
      return;
    }
    if (!targetColumn) {
      alert("Please enter the target column name.");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file); // actual file
      formData.append("target_column", targetColumn);
      formData.append("model_type", modelType);

      const res = await fetch("http://localhost:8000/evaluate", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(JSON.stringify(errorData));
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Error evaluating model:", err);
      alert("Error evaluating model. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="mb-4">Model Evaluation</h2>
      <p className="mb-4">
        Upload your dataset, select the target column, choose a model, and
        evaluate its performance.
      </p>

      {/* File Upload */}
      <div className="mb-3">
        <input type="file" accept=".csv" onChange={handleFileChange} />
      </div>

      {/* Target Column */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="Target Column Name"
          value={targetColumn}
          onChange={(e) => setTargetColumn(e.target.value)}
          className="form-control"
        />
      </div>

      {/* Model Selection */}
      <div className="mb-3">
        <select
          value={modelType}
          onChange={(e) => setModelType(e.target.value)}
          className="form-select"
        >
          <option value="logistic_regression">Logistic Regression</option>
          <option value="decision_tree">Decision Tree</option>
          <option value="random_forest">Random Forest</option>
          <option value="svm">SVM</option>
        </select>
      </div>

      {/* Evaluate Button */}
      <button
        className="btn btn-primary mb-3"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Evaluating..." : "Evaluate Model"}
      </button>

      {/* Result Display */}
      {result && (
        <div className="card p-3 shadow-sm">
          <h4>Evaluation Result</h4>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default ModelEvaluation;
