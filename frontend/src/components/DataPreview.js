import React, { useState, useRef } from "react";
import { cleanseFile } from "../api";

function DataPreview() {
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [downloadLink, setDownloadLink] = useState("");
  const dropRef = useRef(null);

  // Fetch file as blob and trigger download
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

  // Process file and get cleansed data
  const processFile = async (selectedFile) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setLoading(true);
    setData([]);
    setHeaders([]);
    setCurrentPage(1);
    setDownloadLink("");

    try {
      const res = await cleanseFile(selectedFile);

      setData(res.data);
      setHeaders(res.data.length > 0 ? Object.keys(res.data[0]) : []);

      // Save backend download URL
      setDownloadLink(res.download);
    } catch (err) {
      alert("Error uploading file: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtered data for search
  const filteredData = data.filter((row) =>
    headers.some((col) =>
      String(row[col]).toLowerCase().includes(search.toLowerCase())
    )
  );

  // Pagination
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows = filteredData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <div className="p-4">
      <h2 className="mb-4">Data Preview (Cleansed)</h2>

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

      {data.length > 0 && (
        <>
          <div className="mb-3">
            <input
              type="text"
              placeholder="Search in data..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
            />
          </div>

          <div className="table-responsive mb-3">
            <table className="table table-striped table-bordered shadow-sm">
              <thead className="table-dark">
                <tr>
                  {headers.map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentRows.map((row, idx) => (
                  <tr key={idx}>
                    {headers.map((col) => (
                      <td key={col}>{row[col]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-center align-items-center gap-2">
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Prev
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default DataPreview;
