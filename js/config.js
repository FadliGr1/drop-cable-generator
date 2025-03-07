/**
 * Konfigurasi aplikasi KML Cable Drop Generator
 */
const CONFIG = {
  // Folder structure for KML
  folders: {
    BOUNDARY: "BOUNDARY",
    HP: "HP",
    FAT: "FAT",
    CABLE_DROP: "CABLE DROP",
  },

  // Default settings
  defaults: {
    maxDistance: 100, // dalam meter
    dropLineStyle: "straight",
    dropLineColor: "#ff00ff", // magenta
    dropLineWidth: 1,
    dropLineName: "dropfg",
  },

  // KML style definitions
  styles: {
    boundary: {
      lineColor: "#0000ff", // biru
      lineWidth: 3,
      polyColor: "330000ff", // biru dengan transparansi
    },
    hp: {
      iconUrl: "http://maps.google.com/mapfiles/kml/shapes/placemark_circle.png",
      iconScale: 1.2,
    },
    fat: {
      iconUrl: "http://maps.google.com/mapfiles/kml/shapes/square.png",
      iconScale: 1.4,
    },
    cableDrop: {
      straight: {
        lineColor: "#ff00ff", // magenta
        lineWidth: 1,
      },
      curved: {
        lineColor: "#ff00ff", // magenta
        lineWidth: 1,
      },
    },
  },

  // Swal settings
  swalConfig: {
    error: {
      icon: "error",
      title: "Error!",
      confirmButtonColor: "#3498db",
    },
    success: {
      icon: "success",
      title: "Berhasil!",
      confirmButtonColor: "#2ecc71",
    },
    warning: {
      icon: "warning",
      title: "Perhatian!",
      confirmButtonColor: "#f39c12",
    },
    info: {
      icon: "info",
      title: "Informasi",
      confirmButtonColor: "#3498db",
    },
  },
};
