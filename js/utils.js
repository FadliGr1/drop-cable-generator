/**
 * Utility functions for KML Cable Drop Generator
 */
const Utils = {
  /**
   * Show loading overlay
   */
  showLoading() {
    document.getElementById("loadingOverlay").style.display = "flex";
  },

  /**
   * Hide loading overlay
   */
  hideLoading() {
    document.getElementById("loadingOverlay").style.display = "none";
  },

  /**
   * Show success message
   * @param {string} message - Success message
   * @param {function} callback - Optional callback function
   */
  showSuccess(message, callback) {
    Swal.fire({
      ...CONFIG.swalConfig.success,
      text: message,
    }).then(callback);
  },

  /**
   * Show error message
   * @param {string} message - Error message
   * @param {function} callback - Optional callback function
   */
  showError(message, callback) {
    Swal.fire({
      ...CONFIG.swalConfig.error,
      text: message,
    }).then(callback);
  },

  /**
   * Show warning message
   * @param {string} message - Warning message
   * @param {function} callback - Optional callback function
   */
  showWarning(message, callback) {
    Swal.fire({
      ...CONFIG.swalConfig.warning,
      text: message,
    }).then(callback);
  },

  /**
   * Download text content as a file
   * @param {string} content - Text content to download
   * @param {string} fileName - File name
   * @param {string} contentType - Content type
   */
  downloadTextAsFile(content, fileName, contentType = "application/vnd.google-earth.kml+xml") {
    const blob = new Blob([content], {type: contentType});
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  },

  /**
   * Format file size in human-readable format
   * @param {number} bytes - Size in bytes
   * @returns {string} Formatted size
   */
  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  },

  /**
   * Format date in human-readable format
   * @param {Date} date - Date object
   * @returns {string} Formatted date
   */
  formatDate(date) {
    return date.toLocaleString();
  },

  /**
   * Generate stats about processing results
   * @param {Object} data - Data with processing results
   * @returns {Object} Stats object
   */
  generateStats(data) {
    return {
      boundaryCount: data.boundaries.length,
      hpCount: data.hps.length,
      fatCount: data.fats.length,
      cableDropCount: data.cableDrops.length,
      processingTime: data.processingTime || 0,
      fileName: data.fileName || "output.kml",
    };
  },

  /**
   * Truncate string with ellipsis if too long
   * @param {string} str - String to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated string
   */
  truncateString(str, maxLength = 30) {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + "...";
  },
};
