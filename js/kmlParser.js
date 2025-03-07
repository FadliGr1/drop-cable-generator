/**
 * KML Parser
 * Modul untuk parsing file KML dan ekstraksi data yang dibutuhkan
 */
class KmlParser {
  constructor() {
    this.parsedData = {
      boundaries: [],
      hps: [],
      fats: [],
    };
  }

  /**
   * Parse KML file content
   * @param {string} kmlContent - Konten file KML sebagai string
   * @returns {Object} Data yang sudah diparse
   */
  parse(kmlContent) {
    return new Promise((resolve, reject) => {
      try {
        // Parse XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(kmlContent, "text/xml");

        // Clear previous data
        this.parsedData = {
          boundaries: [],
          hps: [],
          fats: [],
        };

        // Get all folders
        const folders = xmlDoc.getElementsByTagName("Folder");

        // Process each folder
        for (let i = 0; i < folders.length; i++) {
          const folder = folders[i];
          const folderName = this._getTagContent(folder, "name");

          switch (folderName) {
            case CONFIG.folders.BOUNDARY:
              this._processBoundaryFolder(folder);
              break;
            case CONFIG.folders.HP:
              this._processHpFolder(folder);
              break;
            case CONFIG.folders.FAT:
              this._processFatFolder(folder);
              break;
          }
        }

        // Validate parsed data
        if (this.parsedData.boundaries.length === 0) {
          throw new Error("Tidak ada BOUNDARY yang ditemukan dalam file KML");
        }
        if (this.parsedData.hps.length === 0) {
          throw new Error("Tidak ada HP Placemark yang ditemukan dalam file KML");
        }
        if (this.parsedData.fats.length === 0) {
          throw new Error("Tidak ada FAT Placemark yang ditemukan dalam file KML");
        }

        resolve(this.parsedData);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Process BOUNDARY folder
   * @param {Element} folder - XML Folder element
   * @private
   */
  _processBoundaryFolder(folder) {
    const polygons = folder.getElementsByTagName("Polygon");
    for (let i = 0; i < polygons.length; i++) {
      const polygon = polygons[i];
      const placemark = polygon.closest("Placemark");
      if (placemark) {
        const name = this._getTagContent(placemark, "name");
        const coordinates = this._getPolygonCoordinates(polygon);
        if (coordinates.length > 0) {
          this.parsedData.boundaries.push({
            name: name,
            type: "polygon",
            coordinates: coordinates,
            points: this._parseCoordinatesToPoints(coordinates[0]), // Outer boundary
          });
        }
      }
    }
  }

  /**
   * Process HP folder
   * @param {Element} folder - XML Folder element
   * @private
   */
  _processHpFolder(folder) {
    const placemarks = folder.getElementsByTagName("Placemark");
    for (let i = 0; i < placemarks.length; i++) {
      const placemark = placemarks[i];
      const name = this._getTagContent(placemark, "name");
      const point = placemark.getElementsByTagName("Point")[0];

      if (point) {
        const coordinates = this._getTagContent(point, "coordinates");
        const coordArray = this._parsePointCoordinates(coordinates);
        if (coordArray) {
          this.parsedData.hps.push({
            name: name,
            type: "placemark",
            coordinates: coordArray,
          });
        }
      }
    }
  }

  /**
   * Process FAT folder
   * @param {Element} folder - XML Folder element
   * @private
   */
  _processFatFolder(folder) {
    const placemarks = folder.getElementsByTagName("Placemark");
    for (let i = 0; i < placemarks.length; i++) {
      const placemark = placemarks[i];
      const name = this._getTagContent(placemark, "name");
      const point = placemark.getElementsByTagName("Point")[0];

      if (point) {
        const coordinates = this._getTagContent(point, "coordinates");
        const coordArray = this._parsePointCoordinates(coordinates);
        if (coordArray) {
          this.parsedData.fats.push({
            name: name,
            type: "placemark",
            coordinates: coordArray,
          });
        }
      }
    }
  }

  /**
   * Get polygon coordinates
   * @param {Element} polygon - XML Polygon element
   * @returns {Array} Array of coordinate arrays (outer and inner boundaries)
   * @private
   */
  _getPolygonCoordinates(polygon) {
    const result = [];

    // Get outer boundary
    const outerBoundary = polygon.getElementsByTagName("outerBoundaryIs")[0];
    if (outerBoundary) {
      const linearRing = outerBoundary.getElementsByTagName("LinearRing")[0];
      if (linearRing) {
        const coordinates = this._getTagContent(linearRing, "coordinates");
        result.push(this._parsePolygonCoordinates(coordinates));
      }
    }

    // Get inner boundaries (holes)
    const innerBoundaries = polygon.getElementsByTagName("innerBoundaryIs");
    for (let i = 0; i < innerBoundaries.length; i++) {
      const linearRing = innerBoundaries[i].getElementsByTagName("LinearRing")[0];
      if (linearRing) {
        const coordinates = this._getTagContent(linearRing, "coordinates");
        result.push(this._parsePolygonCoordinates(coordinates));
      }
    }

    return result;
  }

  /**
   * Parse polygon coordinates string to array
   * @param {string} coordsString - Coordinate string from KML
   * @returns {Array} Array of [lon, lat, alt] arrays
   * @private
   */
  _parsePolygonCoordinates(coordsString) {
    const result = [];
    const coordLines = coordsString.trim().split(/\s+/);

    for (let i = 0; i < coordLines.length; i++) {
      const coords = coordLines[i].split(",");
      if (coords.length >= 2) {
        result.push([parseFloat(coords[0]), parseFloat(coords[1]), coords.length > 2 ? parseFloat(coords[2]) : 0]);
      }
    }

    return result;
  }

  /**
   * Parse point coordinates string to array
   * @param {string} coordsString - Coordinate string from KML
   * @returns {Array} [lon, lat, alt] array
   * @private
   */
  _parsePointCoordinates(coordsString) {
    const coords = coordsString.trim().split(",");
    if (coords.length >= 2) {
      return [parseFloat(coords[0]), parseFloat(coords[1]), coords.length > 2 ? parseFloat(coords[2]) : 0];
    }
    return null;
  }

  /**
   * Convert coordinates array to points array for easier processing
   * @param {Array} coords - Array of [lon, lat, alt] arrays
   * @returns {Array} Array of {lon, lat} objects
   * @private
   */
  _parseCoordinatesToPoints(coords) {
    return coords.map((coord) => ({
      lon: coord[0],
      lat: coord[1],
    }));
  }

  /**
   * Get content of a tag
   * @param {Element} element - Parent element
   * @param {string} tagName - Tag name to get content from
   * @returns {string} Tag content or empty string
   * @private
   */
  _getTagContent(element, tagName) {
    const tags = element.getElementsByTagName(tagName);
    if (tags.length > 0) {
      return tags[0].textContent;
    }
    return "";
  }
}
