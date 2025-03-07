/**
 * Main entry point for KML Cable Drop Generator
 * Initializes all components and handles global events
 */
document.addEventListener("DOMContentLoaded", () => {
  // Initialize UI controller
  const ui = new UI();

  // Initialize tabs
  initTabs();

  // Initialize modals
  initModals();

  // Example code handlers
  initExampleHandlers();

  // Log initialization
  console.log("KML Cable Drop Generator initialized");

  // Check browser compatibility
  checkBrowserCompatibility();
});

/**
 * Initialize tab functionality
 */
function initTabs() {
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Remove active class from all tabs
      tabBtns.forEach((b) => b.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));

      // Add active class to clicked tab
      btn.classList.add("active");

      // Show corresponding content
      const tabId = btn.getAttribute("data-tab");
      document.getElementById(tabId).classList.add("active");
    });
  });
}

/**
 * Initialize modal functionality
 */
function initModals() {
  // About modal
  const aboutModal = document.getElementById("aboutModal");
  const aboutLink = document.getElementById("aboutLink");
  const closeAboutModal = document.getElementById("closeAboutModal");

  aboutLink.addEventListener("click", (e) => {
    e.preventDefault();
    aboutModal.style.display = "block";
  });

  closeAboutModal.addEventListener("click", () => {
    aboutModal.style.display = "none";
  });

  // Help link
  const helpLink = document.getElementById("helpLink");
  helpLink.addEventListener("click", (e) => {
    e.preventDefault();

    // Switch to guide tab
    document.querySelector('.tab-btn[data-tab="guide-tab"]').click();

    // Scroll to top
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });

  // Close modals when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === aboutModal) {
      aboutModal.style.display = "none";
    }
  });
}

/**
 * Initialize example code handlers
 */
function initExampleHandlers() {
  // Copy example button
  const copyExampleBtn = document.getElementById("copyExampleBtn");
  if (copyExampleBtn) {
    copyExampleBtn.addEventListener("click", () => {
      const codeExample = document.querySelector(".code-example");

      // Copy text to clipboard
      navigator.clipboard
        .writeText(codeExample.textContent)
        .then(() => {
          // Show success message
          const originalText = copyExampleBtn.innerHTML;
          copyExampleBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';

          // Reset button text after 2 seconds
          setTimeout(() => {
            copyExampleBtn.innerHTML = originalText;
          }, 2000);
        })
        .catch((err) => {
          console.error("Error copying text: ", err);
          Utils.showError("Gagal menyalin kode. Silakan coba lagi.");
        });
    });
  }

  // Download example button
  const downloadExampleBtn = document.getElementById("downloadExampleBtn");
  if (downloadExampleBtn) {
    downloadExampleBtn.addEventListener("click", (e) => {
      e.preventDefault();

      const codeExample = document.querySelector(".code-example");
      Utils.downloadTextAsFile(codeExample.textContent, "example_kml.kml");
    });
  }
}

/**
 * Check browser compatibility for required features
 */
function checkBrowserCompatibility() {
  // Create list of checks
  const checks = [
    {feature: "FileReader API", check: window.FileReader},
    {feature: "DOMParser API", check: window.DOMParser},
    {feature: "XMLSerializer API", check: window.XMLSerializer},
    {feature: "Clipboard API", check: navigator.clipboard},
  ];

  // Filter failed checks
  const failedChecks = checks.filter((item) => !item.check);

  if (failedChecks.length > 0) {
    const features = failedChecks.map((item) => item.feature).join(", ");
    Utils.showWarning(`Browser Anda tidak mendukung beberapa fitur yang diperlukan: ${features}. Silakan gunakan browser modern seperti Chrome, Firefox, atau Edge versi terbaru.`);
    return false;
  }

  return true;
}

/**
 * Handle global errors
 */
window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
  Utils.showError("Terjadi kesalahan: " + event.error?.message || "Error tidak diketahui");
});

/**
 * Handle unhandled promise rejections
 */
window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled rejection:", event.reason);
  Utils.showError("Terjadi kesalahan asinkron: " + event.reason?.message || "Error tidak diketahui");
});
