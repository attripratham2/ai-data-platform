import React, { useState, useRef } from "react";
import { Bar } from "react-chartjs-2";
import { cleanseFile } from "../api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
);

function DataAnalysis() {
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [numericCols, setNumericCols] = useState([]);
  const [selectedCols, setSelectedCols] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadLink, setDownloadLink] = useState("");
  const [aiInsights, setAiInsights] = useState([]);
  const dropRef = useRef(null);

  // Function to trigger automatic download
  const triggerDownload = (url, filename) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle file selection
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    await processFile(selectedFile);
  };

  // Handle drag & drop
  const handleDrop = async (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    await processFile(droppedFile);
  };

  // Process and cleanse file
  const processFile = async (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setLoading(true);
    setData([]);
    setColumns([]);
    setNumericCols([]);
    setSelectedCols([]);
    setAiInsights([]);
    setDownloadLink("");

    try {
      // Call backend to cleanse
      const res = await cleanseFile(selectedFile);

      // Cleansed JSON data from backend
      setData(res.data);
      setColumns(res.data.length > 0 ? Object.keys(res.data[0]) : []);

      // Numeric columns for charts
      const nums =
        res.data.length > 0
          ? Object.keys(res.data[0]).filter((h) => !isNaN(res.data[0][h]))
          : [];
      setNumericCols(nums);
      setSelectedCols(nums.slice(0, 1));

      // AI Insights
      const insights = nums.map((col) => {
        const values = res.data.map((r) => r[col]).filter((v) => !isNaN(v));
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const outliers = values.filter((v) => v > avg * 1.5 || v < avg * 0.5);
        return {
          col,
          outliers: outliers.length,
          suggestion: `Check ${col} for anomalies`,
        };
      });
      setAiInsights(insights);

      // Set download link from backend and trigger automatic download
      setDownloadLink(res.download);
      triggerDownload(res.download, `cleansed_${selectedFile.name}`);
    } catch (err) {
      alert("Error uploading file: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleColSelect = (col) => {
    if (selectedCols.includes(col)) {
      setSelectedCols(selectedCols.filter((c) => c !== col));
    } else {
      setSelectedCols([...selectedCols, col]);
    }
  };

  const chartData = {
    labels: data.map((_, idx) => `Row ${idx + 1}`),
    datasets: selectedCols.map((col, idx) => ({
      label: col,
      data: data.map((row) => row[col]),
      backgroundColor: `rgba(${(idx * 70) % 255}, ${(idx * 50) % 255}, ${(idx *
        100) %
        255}, 0.6)`,
      borderColor: `rgba(${(idx * 70) % 255}, ${(idx * 50) % 255}, ${(idx *
        100) %
        255}, 1)`,
      borderWidth: 1,
    })),
  };

  const calculateStats = (col) => {
    const nums = data.map((row) => row[col]).filter((v) => !isNaN(v));
    const count = nums.length;
    const mean = (nums.reduce((a, b) => a + b, 0) / count).toFixed(2);
    const sorted = [...nums].sort((a, b) => a - b);
    const median = sorted[Math.floor(count / 2)]?.toFixed(2) || 0;
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const std = Math.sqrt(
      nums.reduce((a, b) => a + (b - mean) ** 2, 0) / count
    ).toFixed(2);
    return { count, mean, median, min, max, std };
  };

  return (
    <div className="p-4">
      {/* Top Notice */}
      <div
        className="mb-4 p-3"
        style={{
          backgroundColor: "#fef3c7",
          border: "1px solid #fbbf24",
          borderRadius: "10px",
          fontWeight: "bold",
          color: "#92400e",
        }}
      >
        This module is used to check your cleansed file. If it is not fully
        cleansed, it will be cleansed again automatically.
      </div>

      <h2 className="mb-4">AI Data Analysis</h2>

      {/* Drag & Drop Upload */}
      <div
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="mb-3 p-4"
        style={{
          border: "2px dashed #4f46e5",
          borderRadius: "15px",
          background: "#f3f4f6",
          textAlign: "center",
          cursor: "pointer",
        }}
        onClick={() => document.getElementById("dataFileInput").click()}
      >
        <p>Drag & drop your CSV/XLSX/JSON file here or click to select</p>
        <input
          type="file"
          id="dataFileInput"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>

      {loading && <p>Processing and cleansing file, please wait...</p>}

      {downloadLink && (
        <button
          className="btn btn-success mb-3"
          onClick={() =>
            triggerDownload(downloadLink, `cleansed_${file.name}`)
          }
        >
          Download Cleansed File
        </button>
      )}

      {/* Column Selection */}
      {numericCols.length > 0 && (
        <div
          className="card p-3 mb-3 shadow-sm"
          style={{ borderRadius: "15px" }}
        >
          <h5>Select Columns to Visualize</h5>
          {numericCols.map((col) => (
            <label key={col} className="me-3">
              <input
                type="checkbox"
                checked={selectedCols.includes(col)}
                onChange={() => handleColSelect(col)}
              />{" "}
              {col}
            </label>
          ))}
        </div>
      )}

      {/* Charts */}
      {selectedCols.length > 0 && (
        <div
          className="card p-3 mb-3 shadow-sm"
          style={{ borderRadius: "15px" }}
        >
          <h5>Data Charts</h5>
          <Bar data={chartData} />
        </div>
      )}

      {/* Summary Statistics */}
      {selectedCols.length > 0 && (
        <div
          className="card p-3 mb-3 shadow-sm"
          style={{ borderRadius: "15px" }}
        >
          <h5>Summary Statistics</h5>
          {selectedCols.map((col) => {
            const stats = calculateStats(col);
            return (
              <div key={col}>
                <strong>{col}:</strong> Count: {stats.count}, Mean: {stats.mean},
                Median: {stats.median}, Min: {stats.min}, Max: {stats.max}, Std:{" "}
                {stats.std}
              </div>
            );
          })}
        </div>
      )}

      {/* AI Insights */}
      {aiInsights.length > 0 && (
        <div
          className="card p-3 mb-3 shadow-sm"
          style={{ borderRadius: "15px", background: "#fef9c3" }}
        >
          <h5>AI Insights</h5>
          {aiInsights.map((insight) => (
            <div key={insight.col}>
              <strong>{insight.col}:</strong> Outliers Detected: {insight.outliers} -
              {insight.suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DataAnalysis;
