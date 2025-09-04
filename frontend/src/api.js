// frontend/src/api.js

const BACKEND = "http://localhost:5050";

// ------------------- Cleanse File -------------------
export async function cleanseFile(file, columnStrategy = null) {
  const fd = new FormData();
  fd.append("file", file);

  if (columnStrategy) {
    fd.append("column_strategy", JSON.stringify(columnStrategy));
  }

  const res = await fetch(`${BACKEND}/cleanse`, {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to cleanse file");
  }

  const data = await res.json();
  return data;
}

// ------------------- Trigger Cleanse Download -------------------
export function downloadFile(downloadUrl) {
  // Open in new tab to trigger browser download
  window.open(downloadUrl, "_blank");
}

// ------------------- Evaluate Model -------------------
export async function evaluateModel(file, modelType, targetColumn) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("model_type", modelType); // 'logistic' or 'random_forest'
  fd.append("target_column", targetColumn); // target column name

  const res = await fetch(`${BACKEND}/evaluate_model`, {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to evaluate model");
  }

  return res.json();
}

// ------------------- Get History -------------------
export async function getHistory() {
  const res = await fetch(`${BACKEND}/history`);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to fetch history");
  }
  return res.json(); // Returns array of download URLs
}

// ------------------- Preview File -------------------
export async function previewFile(filename, rows = 20) {
  const res = await fetch(`${BACKEND}/preview/${filename}?rows=${rows}`);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to preview file");
  }
  return res.json(); // Returns preview data
}

// ------------------- Delete File -------------------
export async function deleteFile(filename) {
  const res = await fetch(`${BACKEND}/delete/${filename}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to delete file");
  }
  return res.json();
}

// ------------------- Clear All History -------------------
export async function clearHistory() {
  const res = await fetch(`${BACKEND}/clear_history`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to clear history");
  }
  return res.json();
}
