import React, { useState, useRef } from "react";

function FileUpload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [message, setMessage] = useState("");
  const [downloadLink, setDownloadLink] = useState("");
  const dropRef = useRef();

  const BACKEND = "http://localhost:5050"; // Make sure backend port is correct

  const handleFile = (selectedFile) => {
    setFile(selectedFile);
    setPreviewData([]);
    setMessage("");
    setDownloadLink("");
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    dropRef.current.style.borderColor = "#3b82f6";
    dropRef.current.style.backgroundColor = "#e0f2fe";
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dropRef.current.style.borderColor = "#ccc";
    dropRef.current.style.backgroundColor = "#f9fafb";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dropRef.current.style.borderColor = "#ccc";
    dropRef.current.style.backgroundColor = "#f9fafb";
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleClick = () => {
    document.querySelector('input[type="file"]').click();
  };

  // Blob download function to avoid CORS issue
  const triggerDownload = async (url, filename) => {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      alert("Download error: " + err.message);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select or drag a file to upload.");
      return;
    }

    setLoading(true);
    setMessage("");
    setPreviewData([]);
    setDownloadLink("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${BACKEND}/cleanse`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Error uploading file");
      }

      const data = await res.json();

      setMessage(data.message || "File uploaded and cleansed successfully.");
      setPreviewData(data.data || []);
      setDownloadLink(`${BACKEND}/download/${data.download.split("/").pop()}`);

      // Automatically trigger download
      triggerDownload(`${BACKEND}/download/${data.download.split("/").pop()}`, `cleansed_${file.name}`);
    } catch (err) {
      console.error("Upload error:", err);
      setMessage("Error uploading file. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="mb-4">File Upload & Data Cleansing</h2>
      <p className="mb-3">Upload CSV, Excel, or JSON file. Drag & drop here or click the box.</p>

      <div
        ref={dropRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        style={{
          border: "2px dashed #ccc",
          borderRadius: "10px",
          padding: "60px",
          textAlign: "center",
          marginBottom: "20px",
          backgroundColor: "#f9fafb",
          cursor: "pointer",
        }}
      >
        {file ? <p>{file.name}</p> : <p>Drag & drop a file here, or click to select a file</p>}
        <input type="file" onChange={handleFileChange} style={{ display: "none" }} />
      </div>

      <div className="mb-3">
        <button className="btn btn-primary" onClick={handleUpload} disabled={loading}>
          {loading ? "Processing..." : "Upload & Cleanse"}
        </button>
      </div>

      {message && <p className="mb-3">{message}</p>}

      {downloadLink && (
        <div className="mb-3">
          <button
            className="btn btn-success"
            onClick={() => triggerDownload(downloadLink, `cleansed_${file.name}`)}
          >
            Download Cleansed File
          </button>
        </div>
      )}

      {previewData.length > 0 && (
        <div className="table-responsive">
          <table className="table table-striped table-bordered">
            <thead className="table-dark">
              <tr>
                {Object.keys(previewData[0]).map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData.map((row, idx) => (
                <tr key={idx}>
                  {Object.keys(row).map((col) => (
                    <td key={col}>{row[col]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
