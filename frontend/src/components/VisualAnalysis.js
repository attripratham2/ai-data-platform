import React, { useState, useRef } from "react";
import { Bar, Line, Pie } from "react-chartjs-2";
import Papa from "papaparse"; // For CSV parsing
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

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend);

function VisualAnalysis() {
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [numericCols, setNumericCols] = useState([]);
  const [selectedCols, setSelectedCols] = useState([]);
  const [chartType, setChartType] = useState("bar");
  const [aiInsights, setAiInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropRef = useRef(null);

  // Handle file selection
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    await processFile(selectedFile);
  };

  // Drag & Drop
  const handleDrop = async (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    await processFile(droppedFile);
  };

  // Process file without cleansing
  const processFile = async (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setLoading(true);
    setData([]);
    setColumns([]);
    setNumericCols([]);
    setSelectedCols([]);
    setAiInsights([]);

    try {
      if (selectedFile.name.endsWith(".csv")) {
        Papa.parse(selectedFile, {
          header: true,
          skipEmptyLines: true,
          complete: function (results) {
            const parsedData = results.data;
            setData(parsedData);
            const cols = results.meta.fields;
            setColumns(cols);
            const nums = cols.filter(
              (col) => !isNaN(parsedData[0][col]) && parsedData[0][col] !== null
            );
            setNumericCols(nums);
            setSelectedCols(nums.slice(0, 1));

            // AI Insights
            const insights = nums.map((col) => {
              const values = parsedData.map((r) => parseFloat(r[col])).filter((v) => !isNaN(v));
              const avg = values.reduce((a, b) => a + b, 0) / values.length;
              const outliers = values.filter((v) => v > avg * 1.5 || v < avg * 0.5);
              return { col, outliers: outliers.length, suggestion: `Check ${col} for anomalies` };
            });
            setAiInsights(insights);
          },
        });
      } else {
        alert("Only CSV files are supported for now.");
      }
    } catch (err) {
      alert("Error reading file: " + err.message);
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
      data: data.map((row) => parseFloat(row[col])),
      backgroundColor: `rgba(${(idx * 70) % 255}, ${(idx * 50) % 255}, ${(idx * 100) % 255}, 0.6)`,
      borderColor: `rgba(${(idx * 70) % 255}, ${(idx * 50) % 255}, ${(idx * 100) % 255}, 1)`,
      borderWidth: 1,
    })),
  };

  const calculateStats = (col) => {
    const nums = data.map((row) => parseFloat(row[col])).filter((v) => !isNaN(v));
    const count = nums.length;
    const mean = (nums.reduce((a, b) => a + b, 0) / count).toFixed(2);
    const sorted = [...nums].sort((a, b) => a - b);
    const median = sorted[Math.floor(count / 2)]?.toFixed(2) || 0;
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const std = Math.sqrt(nums.reduce((a, b) => a + (b - mean) ** 2, 0) / count).toFixed(2);
    return { count, mean, median, min, max, std };
  };

  return (
    <div className="p-4">
      <h2 className="mb-3">Visual Analysis Module</h2>
      <p style={{ color: "#555" }}>
        This module is used to **visualize your dataset**. It will not cleanse or modify the data.
      </p>

      {/* Drag & Drop Upload */}
      <div
        ref={dropRef}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => document.getElementById("visualFileInput").click()}
        style={{
          border: "2px dashed #4f46e5",
          borderRadius: "15px",
          background: "#f3f4f6",
          textAlign: "center",
          padding: "20px",
          cursor: "pointer",
          marginBottom: "15px",
        }}
      >
        <p>Drag & drop your CSV file here or click to select</p>
        <input
          type="file"
          id="visualFileInput"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>

      {loading && <p>Loading data, please wait...</p>}

      {/* Column Selection */}
      {numericCols.length > 0 && (
        <div className="card p-3 mb-3 shadow-sm" style={{ borderRadius: "15px" }}>
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

      {/* Chart Type Selector */}
      {selectedCols.length > 0 && (
        <div className="mb-3">
          <label>Select Chart Type: </label>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="form-select w-auto d-inline-block ms-2"
          >
            <option value="bar">Bar</option>
            <option value="line">Line</option>
            <option value="pie">Pie</option>
          </select>
        </div>
      )}

      {/* Charts */}
      {selectedCols.length > 0 && (
        <div className="card p-3 mb-3 shadow-sm" style={{ borderRadius: "15px" }}>
          <h5>Data Charts</h5>
          {chartType === "bar" && <Bar data={chartData} />}
          {chartType === "line" && <Line data={chartData} />}
          {chartType === "pie" && <Pie data={chartData} />}
        </div>
      )}

      {/* Summary Statistics */}
      {selectedCols.length > 0 && (
        <div className="card p-3 mb-3 shadow-sm" style={{ borderRadius: "15px" }}>
          <h5>Summary Statistics</h5>
          {selectedCols.map((col) => {
            const stats = calculateStats(col);
            return (
              <div key={col}>
                <strong>{col}:</strong> Count: {stats.count}, Mean: {stats.mean}, Median: {stats.median}, Min: {stats.min}, Max: {stats.max}, Std: {stats.std}
              </div>
            );
          })}
        </div>
      )}

      {/* AI Insights */}
      {aiInsights.length > 0 && (
        <div className="card p-3 mb-3 shadow-sm" style={{ borderRadius: "15px", background: "#fef9c3" }}>
          <h5>AI Insights</h5>
          {aiInsights.map((insight) => (
            <div key={insight.col}>
              <strong>{insight.col}:</strong> Outliers Detected: {insight.outliers} - {insight.suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default VisualAnalysis;
