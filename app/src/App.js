import React, { useEffect, useState } from 'react';

function App() {
  const [mint, setMint] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [imageFile, setImageFile] = useState(null);
  const [extraFile, setExtraFile] = useState(null);
  const [uploadResponse, setUploadResponse] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Read query param ?mint=<address>
  const queryParams = new URLSearchParams(window.location.search);
  const mintParam = queryParams.get('mint');
  const prev = mintParam; // prev is the mint value

  useEffect(() => {
    if (!mintParam) {
      setError('Please provide a mint address via ?mint=<address>');
      return;
    }
    setMint(mintParam);

    const fetchMetadata = async () => {
      setLoading(true);
      try {
        const resp = await fetch(`http://localhost:3000/metadata/${mintParam}`);
        if (!resp.ok) throw new Error(`Server responded with status ${resp.status}`);
        const data = await resp.json();
        setMetadata(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [mintParam]);

  // Upload JSON to server
  const handleUpload = async () => {
    if (!imageFile) return alert("Image file is required");
    setUploading(true);
    setUploadResponse(null);

    try {
      const formData = new FormData();
      formData.append("prev", prev);
      formData.append("image", imageFile);
      if (extraFile) formData.append("extraFile", extraFile);

      const resp = await fetch("http://localhost:3000/upload", {
        method: "POST",
        body: formData
      });

      const data = await resp.json();
      setUploadResponse(data);
    } catch (err) {
      console.error(err);
      setUploadResponse({ error: err.message });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>NFT Metadata Viewer & JSON Uploader</h1>

      {!mint && !error && <p>Loading mint address from URL…</p>}

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {loading && <p>Loading metadata…</p>}

      {metadata && (
        <div>
          <h2>Mint: {mint}</h2>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f0f0f0', padding: '10px' }}>
            {JSON.stringify(metadata, null, 2)}
          </pre>
        </div>
      )}

      <hr style={{ margin: '20px 0' }} />

      <h2>Upload JSON to Pinata</h2>
      <p>Prev value (mint address): <strong>{prev}</strong></p>
      <div style={{ marginBottom: '10px' }}>
        <label>
          Image (required):{" "}
          <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} />
        </label>
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label>
          Extra file (optional):{" "}
          <input type="file" onChange={e => setExtraFile(e.target.files[0])} />
        </label>
      </div>
      <button onClick={handleUpload} disabled={uploading} style={{ padding: '8px 16px' }}>
        {uploading ? 'Uploading…' : 'Upload JSON'}
      </button>

      {uploadResponse && (
        <div style={{ marginTop: '20px' }}>
          <h3>Upload Response:</h3>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f0f0f0', padding: '10px' }}>
            {JSON.stringify(uploadResponse, null, 2)}
          </pre>
          {uploadResponse.metadataUrl && (
            <a href={uploadResponse.metadataUrl} target="_blank" rel="noreferrer">
              View JSON on IPFS
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
