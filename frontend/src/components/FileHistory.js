import React, { useEffect, useState } from "react";

function FileHistory() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch history from backend
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/history");
      const data = await res.json();
      setFiles(data.history.reverse()); // latest first
    } catch (err) {
      alert("Error fetching file history: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Download file
  const handleDownload = (filename) => {
    const link = document.createElement("a");
    link.href = `http://localhost:8000/download/${filename}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Delete single file
  const handleDelete = async (filename) => {
    if (!window.confirm(`Are you sure you want to delete ${filename}?`)) return;

    try {
      const res = await fetch(`http://localhost:8000/delete/${filename}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.message) {
        alert(data.message);
        fetchHistory();
      }
    } catch (err) {
      alert("Error deleting file: " + err.message);
    }
  };

  // Clear all files
  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to delete all files?")) return;

    try {
      const res = await fetch(`http://localhost:8000/clear_history`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.message) {
        alert(data.message);
        fetchHistory();
      }
    } catch (err) {
      alert("Error clearing history: " + err.message);
    }
  };

  return (
    <div className="p-4">
      <h2 className="mb-2">File History</h2>
      <p>All uploaded and cleansed files are listed below. You can download or delete files.</p>

      <div className="mb-3">
        <button className="btn btn-danger btn-sm" onClick={handleClearAll}>
          Clear All History
        </button>
      </div>

      {loading ? (
        <p>Loading files...</p>
      ) : files.length === 0 ? (
        <p>No files uploaded yet.</p>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-bordered">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>File Name</th>
                <th>Download</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file, idx) => {
                const name = file.replace("uploads/", "");
                return (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{name}</td>
                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleDownload(name)}
                      >
                        Download
                      </button>
                    </td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(name)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default FileHistory;
