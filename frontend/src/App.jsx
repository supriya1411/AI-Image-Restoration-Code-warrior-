import { useRef, useState } from "react";
import {
  Activity,
  Cpu,
  Image as ImageIcon,
  Upload,
  Zap,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [inputPreview, setInputPreview] = useState(null);
  const [outputPreview, setOutputPreview] = useState(null);

  const [isRestoring, setIsRestoring] = useState(false);
  const [status, setStatus] = useState("READY");
  const [error, setError] = useState("");

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    setFile(selectedFile);
    setError("");
    setOutputPreview(null);
    setStatus("IMAGE LOADED");

    const previewUrl = URL.createObjectURL(selectedFile);
    setInputPreview(previewUrl);
  };

  const handleFileChange = (event) => {
    handleFile(event.target.files?.[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();

    const droppedFile = event.dataTransfer.files?.[0];
    handleFile(droppedFile);
  };

  const restoreImage = async () => {
    if (!file) {
      setError("Upload a degraded image first.");
      return;
    }

    setIsRestoring(true);
    setError("");
    setStatus("RESTORING...");

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch(`${API_URL}/restore`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Restoration request failed.");
      }

      const blob = await response.blob();

      const outputUrl = URL.createObjectURL(blob);

      setOutputPreview(outputUrl);
      setStatus("RESTORATION COMPLETE");
    } catch (err) {
      console.error(err);

      setError(
        "Could not connect to the restoration backend. Make sure FastAPI is running."
      );

      setStatus("ERROR");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="app-shell">

      {/* Background decoration */}
      <div className="grid-background" />

      {/* Header */}
      <header className="topbar">

        <div className="brand">
          <div className="brand-mark">
            <Cpu size={20} />
          </div>

          <div>
            <div className="brand-name">
              KLA // RESTORATION LAB
            </div>

            <div className="brand-subtitle">
              AI-BASED IMAGE RESTORATION SYSTEM
            </div>
          </div>
        </div>

        <div className="system-status">
          <span className="status-dot" />
          SYSTEM ONLINE
        </div>

      </header>


      {/* Main */}
      <main className="main-container">

        {/* Hero */}
        <section className="hero">

          <div className="eyebrow">
            <Activity size={15} />
            DARC-NET INTELLIGENCE ENGINE
          </div>

          <h1>
            Restore the image.
            <br />
            <span>Recover the detail.</span>
          </h1>

          <p>
            AI-powered restoration of degraded low-resolution imagery
            using DARC-Net with a combined restoration loss.
          </p>

        </section>


        {/* Workspace */}
        <section className="workspace">

          {/* Upload */}
          <div className="panel upload-panel">

            <div className="panel-header">
              <div>
                <span className="panel-label">
                  01 // INPUT
                </span>

                <h2>Degraded Image</h2>
              </div>

              <ImageIcon size={19} />
            </div>


            <div
              className={`drop-zone ${
                inputPreview ? "has-image" : ""
              }`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >

              {inputPreview ? (
                <img
                  src={inputPreview}
                  alt="Uploaded degraded input"
                  className="preview-image"
                />
              ) : (
                <div className="upload-placeholder">

                  <div className="upload-icon">
                    <Upload size={24} />
                  </div>

                  <h3>Drop degraded image</h3>

                  <p>
                    or click to browse your files
                  </p>

                  <span className="format-hint">
                    PNG / JPG / JPEG
                  </span>

                </div>
              )}

            </div>


            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleFileChange}
              hidden
            />

            <div className="input-meta">

              <div>
                <span>FORMAT</span>
                <strong>
                  {file ? file.type.split("/")[1]?.toUpperCase() : "--"}
                </strong>
              </div>

              <div>
                <span>SIZE</span>
                <strong>
                  {file
                    ? `${(file.size / 1024).toFixed(1)} KB`
                    : "--"}
                </strong>
              </div>

            </div>

          </div>


          {/* Processing */}
          <div className="process-column">

            <div className="process-line" />

            <div className={`process-orb ${isRestoring ? "active" : ""}`}>
              <Zap size={22} />
            </div>

            <span className="process-label">
              {isRestoring ? "PROCESSING" : "DARC-NET"}
            </span>

            <div className="process-line" />

          </div>


          {/* Output */}
          <div className="panel output-panel">

            <div className="panel-header">
              <div>
                <span className="panel-label">
                  02 // OUTPUT
                </span>

                <h2>Restored Image</h2>
              </div>

              <ShieldCheck size={19} />
            </div>


            <div className="result-zone">

              {outputPreview ? (
                <img
                  src={outputPreview}
                  alt="Restored output"
                  className="preview-image"
                />
              ) : (
                <div className="empty-result">

                  <div className="empty-icon">
                    <ImageIcon size={25} />
                  </div>

                  <span>
                    RESTORED OUTPUT
                  </span>

                  <small>
                    Awaiting inference
                  </small>

                </div>
              )}

            </div>


            <div className="output-meta">

              <div>
                <span>OUTPUT</span>
                <strong>256 × 256</strong>
              </div>

              <div>
                <span>MODEL</span>
                <strong>DARC-NET</strong>
              </div>

            </div>

          </div>

        </section>


        {/* Action */}
        <section className="action-section">

          <button
            className="restore-button"
            onClick={restoreImage}
            disabled={!file || isRestoring}
          >

            {isRestoring ? (
              <>
                <span className="spinner" />
                RESTORING IMAGE
              </>
            ) : (
              <>
                RESTORE IMAGE
                <ArrowRight size={19} />
              </>
            )}

          </button>

          <div className={`live-status ${status === "ERROR" ? "error" : ""}`}>

            {status === "ERROR" ? (
              <AlertCircle size={15} />
            ) : (
              <CheckCircle2 size={15} />
            )}

            {status}

          </div>

        </section>


        {/* Error */}
        {error && (
          <div className="error-message">
            <AlertCircle size={17} />
            {error}
          </div>
        )}


        {/* Telemetry */}
        <section className="telemetry">

          <div className="telemetry-title">
            SYSTEM TELEMETRY
          </div>

          <div className="telemetry-grid">

            <div className="metric-card">
              <span>MODEL</span>
              <strong>DARC-Net</strong>
              <small>Combined Loss</small>
            </div>

            <div className="metric-card">
              <span>ACCELERATOR</span>
              <strong>CUDA GPU</strong>
              <small>Inference enabled</small>
            </div>

            <div className="metric-card">
              <span>INPUT</span>
              <strong>128 × 128</strong>
              <small>Low resolution</small>
            </div>

            <div className="metric-card">
              <span>OUTPUT</span>
              <strong>256 × 256</strong>
              <small>Restored resolution</small>
            </div>

          </div>

        </section>


        {/* Benchmark */}
        <section className="benchmark">

          <div className="section-heading">
            <div>
              <span className="panel-label">
                03 // BENCHMARK
              </span>

              <h2>Model Performance</h2>
            </div>

            <span className="benchmark-note">
              Validation benchmark
            </span>
          </div>


          <div className="benchmark-grid">

            <div className="benchmark-card">
              <span>PSNR</span>
              <strong>25.4332</strong>
              <small>dB</small>
            </div>

            <div className="benchmark-card">
              <span>SSIM</span>
              <strong>0.7710</strong>
              <small>higher is better</small>
            </div>

            <div className="benchmark-card">
              <span>LPIPS</span>
              <strong>0.2565</strong>
              <small>lower is better</small>
            </div>

          </div>

          <p className="benchmark-disclaimer">
            Metrics shown are from the KLA validation benchmark using
            ground-truth paired images. They are not inferred for
            arbitrary user uploads.
          </p>

        </section>

      </main>


      {/* Footer */}
      <footer className="footer">

        <span>
          KLA AI IMAGE RESTORATION
        </span>

        <span>
          DARC-NET // v1.0
        </span>

        <span>
          RESTORATION ENGINE ONLINE
        </span>

      </footer>

    </div>
  );
}

export default App;