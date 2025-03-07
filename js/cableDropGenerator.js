/**
 * Cable Drop Generator
 * Modul untuk menghasilkan Cable Drop path antara FAT dan HP dalam boundary
 */
class CableDropGenerator {
  constructor(options = {}) {
    this.maxDistance = options.maxDistance || CONFIG.defaults.maxDistance;
    this.lineStyle = options.lineStyle || CONFIG.defaults.dropLineStyle;
  }

  /**
   * Generate cable drops for all boundaries
   * @param {Object} data - Data hasil parsing KML
   * @returns {Object} Data dengan cable drops yang sudah ditambahkan
   */
  generateCableDrops(data) {
    return new Promise((resolve, reject) => {
      try {
        const result = {
          ...data,
          cableDrops: [],
        };

        // Process each boundary
        for (const boundary of data.boundaries) {
          // Find HPs and FATs inside this boundary
          const hpsInBoundary = this._findPointsInBoundary(data.hps, boundary);
          const fatsInBoundary = this._findPointsInBoundary(data.fats, boundary);

          if (hpsInBoundary.length > 0 && fatsInBoundary.length > 0) {
            // For each HP, find nearest FAT and create cable drop
            for (const hp of hpsInBoundary) {
              const nearestFat = this._findNearestPoint(hp, fatsInBoundary);

              if (nearestFat) {
                // Check if distance is within max distance
                const distance = this._calculateDistance(hp.coordinates[1], hp.coordinates[0], nearestFat.coordinates[1], nearestFat.coordinates[0]);

                if (distance <= this.maxDistance) {
                  // Create cable drop
                  const cableDrop = this._createCableDrop(hp, nearestFat, boundary);
                  result.cableDrops.push(cableDrop);
                }
              }
            }
          }
        }

        if (result.cableDrops.length === 0) {
          throw new Error("Tidak dapat membuat Cable Drop. Pastikan HP dan FAT berada dalam satu Boundary dan jaraknya tidak melebihi jarak maksimum.");
        }

        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Find points (HP or FAT) that are inside a boundary
   * @param {Array} points - Array of HP or FAT points
   * @param {Object} boundary - Boundary object
   * @returns {Array} Points inside the boundary
   * @private
   */
  _findPointsInBoundary(points, boundary) {
    return points.filter((point) => {
      return this._isPointInPolygon(point.coordinates[1], point.coordinates[0], boundary.points);
    });
  }

  /**
   * Check if a point is inside a polygon (boundary)
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @param {Array} polygon - Array of polygon points
   * @returns {boolean} True if point is inside polygon
   * @private
   */
  _isPointInPolygon(lat, lon, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lat;
      const yi = polygon[i].lon;
      const xj = polygon[j].lat;
      const yj = polygon[j].lon;

      const intersect = yi > lon !== yj > lon && lat < ((xj - xi) * (lon - yi)) / (yj - yi) + xi;

      if (intersect) inside = !inside;
    }

    return inside;
  }

  /**
   * Find nearest FAT to a HP
   * @param {Object} hp - HP object
   * @param {Array} fats - Array of FATs
   * @returns {Object} Nearest FAT or null
   * @private
   */
  _findNearestPoint(hp, fats) {
    if (fats.length === 0) return null;
    if (fats.length === 1) return fats[0];

    let nearestFat = fats[0];
    let minDistance = this._calculateDistance(hp.coordinates[1], hp.coordinates[0], fats[0].coordinates[1], fats[0].coordinates[0]);

    for (let i = 1; i < fats.length; i++) {
      const distance = this._calculateDistance(hp.coordinates[1], hp.coordinates[0], fats[i].coordinates[1], fats[i].coordinates[0]);

      if (distance < minDistance) {
        minDistance = distance;
        nearestFat = fats[i];
      }
    }

    return nearestFat;
  }

  /**
   * Calculate Haversine distance between two points
   * @param {number} lat1 - Latitude of point 1
   * @param {number} lon1 - Longitude of point 1
   * @param {number} lat2 - Latitude of point 2
   * @param {number} lon2 - Longitude of point 2
   * @returns {number} Distance in meters
   * @private
   */
  _calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = this._toRadians(lat1);
    const φ2 = this._toRadians(lat2);
    const Δφ = this._toRadians(lat2 - lat1);
    const Δλ = this._toRadians(lon2 - lon1);

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  /**
   * Convert degrees to radians
   * @param {number} degrees - Angle in degrees
   * @returns {number} Angle in radians
   * @private
   */
  _toRadians(degrees) {
    return (degrees * Math.PI) / 180;
  }

  /**
   * Create a cable drop object
   * @param {Object} hp - HP point
   * @param {Object} fat - FAT point
   * @param {Object} boundary - Boundary
   * @returns {Object} Cable drop object
   * @private
   */
  _createCableDrop(hp, fat, boundary) {
    const hpName = hp.name.split(" ").join("_");
    const fatName = fat.name.split(" ").join("_");
    const dropName = `dropfg_${hpName}_to_${fatName}`;

    // Create path coordinates
    let path;
    if (this.lineStyle === "straight") {
      path = [
        fat.coordinates, // Start from FAT
        hp.coordinates, // End at HP
      ];
    } else {
      // Create curved path with a midpoint
      path = this._createCurvedPath(fat.coordinates, hp.coordinates);
    }

    return {
      name: dropName,
      type: "path",
      source: hp.name,
      target: fat.name,
      boundary: boundary.name,
      style: this.lineStyle,
      path: path,
    };
  }

  /**
   * Create a curved path between two points
   * @param {Array} start - Start point [lon, lat, alt]
   * @param {Array} end - End point [lon, lat, alt]
   * @returns {Array} Array of path points
   * @private
   */
  _createCurvedPath(start, end) {
    // Calculate midpoint with some offset for curve
    const midLon = (start[0] + end[0]) / 2;
    const midLat = (start[1] + end[1]) / 2;

    // Add slight offset to create curve
    const offsetFactor = 0.2; // 20% offset
    const distX = end[0] - start[0];
    const distY = end[1] - start[1];

    // Perpendicular offset (rotate 90 degrees)
    const offsetX = -distY * offsetFactor;
    const offsetY = distX * offsetFactor;

    const midPoint = [
      midLon + offsetX,
      midLat + offsetY,
      Math.max(start[2], end[2]), // Use max altitude
    ];

    // Return path with 3 points (start, mid, end)
    return [start, midPoint, end];
  }
}
