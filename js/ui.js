/**
 * UI Controller
 * Handles all UI interactions and events
 */
class UI {
  constructor() {
    // UI elements
    this.dropZone = document.getElementById("dropZone");
    this.fileInput = document.getElementById("kmlFile");
    this.fileInfo = document.getElementById("fileInfo");
    this.boundaryDistance = document.getElementById("boundaryDistance");
    this.dropLineStyle = document.getElementById("dropLineStyle");
    this.processBtn = document.getElementById("processBtn");
    this.resultSection = document.getElementById("resultSection");
    this.resultStats = document.getElementById("resultStats");
    this.downloadBtn = document.getElementById("downloadBtn");
    this.resetBtn = document.getElementById("resetBtn");

    // State
    this.selectedFile = null;
    this.processedData = null;
    this.outputKml = null;

    // Initialize event listeners
    this._initEventListeners();
  }

  /**
   * Initialize all event listeners
   * @private
   */
  _initEventListeners() {
    // File input change
    this.fileInput.addEventListener("change", this._handleFileSelect.bind(this));

    // Drag and drop
    this.dropZone.addEventListener("dragover", this._handleDragOver.bind(this));
    this.dropZone.addEventListener("dragleave", this._handleDragLeave.bind(this));
    this.dropZone.addEventListener("drop", this._handleDrop.bind(this));
    this.dropZone.addEventListener("click", () => this.fileInput.click());

    // Process button
    this.processBtn.addEventListener("click", this._handleProcessClick.bind(this));

    // Download button
    this.downloadBtn.addEventListener("click", this._handleDownloadClick.bind(this));

    // Reset button
    this.resetBtn.addEventListener("click", this._handleResetClick.bind(this));
  }

  /**
   * Handle file selection
   * @param {Event} event - Input change event
   * @private
   */
  _handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
      this._validateAndSetFile(file);
    }
  }

  /**
   * Handle drag over
   * @param {Event} event - Drag event
   * @private
   */
  _handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    this.dropZone.classList.add("drag-over");
  }

  /**
   * Handle drag leave
   * @param {Event} event - Drag event
   * @private
   */
  _handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    this.dropZone.classList.remove("drag-over");
  }

  /**
   * Handle file drop
   * @param {Event} event - Drop event
   * @private
   */
  _handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    this.dropZone.classList.remove("drag-over");

    const file = event.dataTransfer.files[0];
    if (file) {
      this._validateAndSetFile(file);
    }
  }

  /**
   * Validate and set file
   * @param {File} file - File object
   * @private
   */
  _validateAndSetFile(file) {
    // Check file extension
    if (!file.name.toLowerCase().endsWith(".kml")) {
      Utils.showError("File harus berformat KML.");
      return;
    }

    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      Utils.showError("Ukuran file terlalu besar (maksimum 10MB).");
      return;
    }

    // Set file and update UI
    this.selectedFile = file;
    this.fileInfo.innerHTML = `
            <p class="file-name"><strong>File:</strong> ${Utils.truncateString(file.name)}</p>
            <p class="file-size"><strong>Ukuran:</strong> ${Utils.formatFileSize(file.size)}</p>
            <p class="file-date"><strong>Tanggal:</strong> ${Utils.formatDate(new Date())}</p>
        `;
    this.fileInfo.classList.add("active");
    this.processBtn.disabled = false;

    // Reset previous results
    this._resetResults();
  }

  /**
   * Handle process button click
   * @private
   */
  _handleProcessClick() {
    if (!this.selectedFile) {
      Utils.showWarning("Silakan pilih file KML terlebih dahulu.");
      return;
    }

    const maxDistance = parseInt(this.boundaryDistance.value);
    const lineStyle = this.dropLineStyle.value;

    if (isNaN(maxDistance) || maxDistance <= 0) {
      Utils.showWarning("Jarak maksimum harus berupa angka positif.");
      return;
    }

    this._processFile(maxDistance, lineStyle);
  }

  /**
   * Process selected KML file
   * @param {number} maxDistance - Maximum distance in meters
   * @param {string} lineStyle - Line style (straight/curved)
   * @private
   */
  _processFile(maxDistance, lineStyle) {
    Utils.showLoading();

    const reader = new FileReader();

    reader.onload = (event) => {
      const kmlContent = event.target.result;

      // Start processing time measurement
      const startTime = performance.now();

      // Parse KML
      const kmlParser = new KmlParser();
      kmlParser
        .parse(kmlContent)
        .then((parsedData) => {
          // Generate cable drops
          const dropGenerator = new CableDropGenerator({
            maxDistance: maxDistance,
            lineStyle: lineStyle,
          });

          return dropGenerator.generateCableDrops(parsedData);
        })
        .then((processedData) => {
          // Add file info and processing time
          this.processedData = {
            ...processedData,
            fileName: this.selectedFile.name,
            processingTime: Math.round(performance.now() - startTime),
          };

          // Generate KML output
          const kmlWriter = new KmlWriter();
          return kmlWriter.generateKml(this.processedData);
        })
        .then((kmlOutput) => {
          // Store output and update UI
          this.outputKml = kmlOutput;
          this._showResults();
          Utils.hideLoading();
          Utils.showSuccess("Pemrosesan file berhasil!");
        })
        .catch((error) => {
          Utils.hideLoading();
          Utils.showError("Error: " + error.message);
          console.error(error);
        });
    };

    reader.onerror = () => {
      Utils.hideLoading();
      Utils.showError("Gagal membaca file.");
    };

    reader.readAsText(this.selectedFile);
  }

  /**
   * Show results UI
   * @private
   */
  _showResults() {
    // Show result section
    this.resultSection.style.display = "block";

    // Generate stats HTML
    const stats = Utils.generateStats(this.processedData);
    this.resultStats.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">Jumlah Boundary:</span>
                <span class="stat-value">${stats.boundaryCount}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Jumlah HP:</span>
                <span class="stat-value">${stats.hpCount}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Jumlah FAT:</span>
                <span class="stat-value">${stats.fatCount}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Jumlah Cable Drop:</span>
                <span class="stat-value">${stats.cableDropCount}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Waktu Pemrosesan:</span>
                <span class="stat-value">${stats.processingTime} ms</span>
            </div>
        `;

    // Scroll to results
    this.resultSection.scrollIntoView({behavior: "smooth"});
  }

  /**
   * Handle download button click
   * @private
   */
  _handleDownloadClick() {
    if (!this.outputKml) {
      Utils.showWarning("Tidak ada file yang dapat diunduh.");
      return;
    }

    // Generate filename: original name + "_with_cables.kml"
    const nameParts = this.selectedFile.name.split(".");
    nameParts.pop(); // Remove extension
    const newFilename = nameParts.join(".") + "_with_cables.kml";

    // Download file
    Utils.downloadTextAsFile(this.outputKml, newFilename);
  }

  /**
   * Handle reset button click
   * @private
   */
  _handleResetClick() {
    this._resetAll();
    Utils.showSuccess("Aplikasi telah direset.");
  }

  /**
   * Reset results only
   * @private
   */
  _resetResults() {
    this.processedData = null;
    this.outputKml = null;
    this.resultSection.style.display = "none";
    this.resultStats.innerHTML = "";
  }

  /**
   * Reset entire application
   * @private
   */
  _resetAll() {
    // Reset file
    this.selectedFile = null;
    this.fileInput.value = "";
    this.fileInfo.innerHTML = "<p>Belum ada file yang dipilih</p>";
    this.fileInfo.classList.remove("active");

    // Reset options
    this.boundaryDistance.value = CONFIG.defaults.maxDistance;
    this.dropLineStyle.value = CONFIG.defaults.dropLineStyle;

    // Reset buttons and results
    this.processBtn.disabled = true;
    this._resetResults();
  }
}
