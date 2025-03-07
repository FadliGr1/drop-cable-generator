/**
 * KML Writer
 * Modul untuk membuat file KML baru dengan cable drops
 */
class KmlWriter {
  constructor() {
    this.xmlDoc = null;
    this.kmlRoot = null;
    this.documentElement = null;
    this.styles = {};
  }

  /**
   * Generate KML document from data
   * @param {Object} data - Data from parser and cable drop generator
   * @returns {string} KML content as string
   */
  generateKml(data) {
    return new Promise((resolve, reject) => {
      try {
        // Create XML document
        this._createXmlDocument();

        // Add styles
        this._addStyles();

        // Add folders and data
        this._addBoundaryFolder(data.boundaries);
        this._addHpFolder(data.hps);
        this._addFatFolder(data.fats);
        this._addCableDropFolder(data.cableDrops);

        // Serialize to string
        const serializer = new XMLSerializer();
        const kmlString = serializer.serializeToString(this.xmlDoc);

        resolve(kmlString);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Create base XML document
   * @private
   */
  _createXmlDocument() {
    this.xmlDoc = document.implementation.createDocument("http://www.opengis.net/kml/2.2", "kml", null);

    // Set namespace
    const kmlElement = this.xmlDoc.documentElement;
    kmlElement.setAttribute("xmlns", "http://www.opengis.net/kml/2.2");
    kmlElement.setAttribute("xmlns:gx", "http://www.google.com/kml/ext/2.2");
    kmlElement.setAttribute("xmlns:atom", "http://www.w3.org/2005/Atom");

    // Create Document
    this.documentElement = this.xmlDoc.createElement("Document");
    kmlElement.appendChild(this.documentElement);

    // Add name
    const nameElement = this.xmlDoc.createElement("name");
    nameElement.textContent = "KML Cable Drop Generator Output";
    this.documentElement.appendChild(nameElement);
  }

  /**
   * Add KML styles
   * @private
   */
  _addStyles() {
    // Boundary style
    this.styles.boundary = this._createStyle("boundaryStyle", CONFIG.styles.boundary.lineColor, CONFIG.styles.boundary.lineWidth, CONFIG.styles.boundary.polyColor);

    // HP style
    this.styles.hp = this._createIconStyle("hpStyle", CONFIG.styles.hp.iconUrl, CONFIG.styles.hp.iconScale);

    // FAT style
    this.styles.fat = this._createIconStyle("fatStyle", CONFIG.styles.fat.iconUrl, CONFIG.styles.fat.iconScale);

    // Cable Drop styles
    this.styles.cableDropStraight = this._createStyle("cableDropStraightStyle", CONFIG.styles.cableDrop.straight.lineColor, CONFIG.styles.cableDrop.straight.lineWidth);

    this.styles.cableDropCurved = this._createStyle("cableDropCurvedStyle", CONFIG.styles.cableDrop.curved.lineColor, CONFIG.styles.cableDrop.curved.lineWidth);
  }

  /**
   * Create a polygon/line style
   * @param {string} id - Style ID
   * @param {string} lineColor - Line color in KML format (aabbggrr)
   * @param {number} lineWidth - Line width
   * @param {string} polyColor - Polygon fill color (optional)
   * @returns {Element} Style element
   * @private
   */
  _createStyle(id, lineColor, lineWidth, polyColor = null) {
    const style = this.xmlDoc.createElement("Style");
    style.setAttribute("id", id);

    // Line style
    const lineStyle = this.xmlDoc.createElement("LineStyle");

    const colorElement = this.xmlDoc.createElement("color");
    colorElement.textContent = this._convertHexToKmlColor(lineColor);
    lineStyle.appendChild(colorElement);

    const widthElement = this.xmlDoc.createElement("width");
    widthElement.textContent = lineWidth;
    lineStyle.appendChild(widthElement);

    style.appendChild(lineStyle);

    // Polygon style (if polyColor provided)
    if (polyColor) {
      const polyStyle = this.xmlDoc.createElement("PolyStyle");

      const polyColorElement = this.xmlDoc.createElement("color");
      polyColorElement.textContent = polyColor;
      polyStyle.appendChild(polyColorElement);

      style.appendChild(polyStyle);
    }

    this.documentElement.appendChild(style);
    return style;
  }

  /**
   * Create an icon style
   * @param {string} id - Style ID
   * @param {string} iconUrl - Icon URL
   * @param {number} scale - Icon scale
   * @returns {Element} Style element
   * @private
   */
  _createIconStyle(id, iconUrl, scale) {
    const style = this.xmlDoc.createElement("Style");
    style.setAttribute("id", id);

    const iconStyle = this.xmlDoc.createElement("IconStyle");

    const scaleElement = this.xmlDoc.createElement("scale");
    scaleElement.textContent = scale;
    iconStyle.appendChild(scaleElement);

    const iconElement = this.xmlDoc.createElement("Icon");
    const hrefElement = this.xmlDoc.createElement("href");
    hrefElement.textContent = iconUrl;
    iconElement.appendChild(hrefElement);
    iconStyle.appendChild(iconElement);

    style.appendChild(iconStyle);
    this.documentElement.appendChild(style);
    return style;
  }

  /**
   * Add BOUNDARY folder with polygons
   * @param {Array} boundaries - Array of boundary objects
   * @private
   */
  _addBoundaryFolder(boundaries) {
    const folder = this._createFolder(CONFIG.folders.BOUNDARY);

    for (const boundary of boundaries) {
      const placemark = this._createPlacemark(boundary.name, "#" + this.styles.boundary.getAttribute("id"));

      // Create polygon
      const polygon = this._createPolygon(boundary.coordinates);
      placemark.appendChild(polygon);

      folder.appendChild(placemark);
    }

    this.documentElement.appendChild(folder);
  }

  /**
   * Add HP folder with placemarks
   * @param {Array} hps - Array of HP objects
   * @private
   */
  _addHpFolder(hps) {
    const folder = this._createFolder(CONFIG.folders.HP);

    for (const hp of hps) {
      const placemark = this._createPlacemark(hp.name, "#" + this.styles.hp.getAttribute("id"));

      // Create point
      const point = this._createPoint(hp.coordinates);
      placemark.appendChild(point);

      folder.appendChild(placemark);
    }

    this.documentElement.appendChild(folder);
  }

  /**
   * Add FAT folder with placemarks
   * @param {Array} fats - Array of FAT objects
   * @private
   */
  _addFatFolder(fats) {
    const folder = this._createFolder(CONFIG.folders.FAT);

    for (const fat of fats) {
      const placemark = this._createPlacemark(fat.name, "#" + this.styles.fat.getAttribute("id"));

      // Create point
      const point = this._createPoint(fat.coordinates);
      placemark.appendChild(point);

      folder.appendChild(placemark);
    }

    this.documentElement.appendChild(folder);
  }

  /**
   * Add CABLE DROP folder with paths
   * @param {Array} cableDrops - Array of cable drop objects
   * @private
   */
  _addCableDropFolder(cableDrops) {
    const folder = this._createFolder(CONFIG.folders.CABLE_DROP);

    for (const drop of cableDrops) {
      const styleId = drop.style === "straight" ? this.styles.cableDropStraight.getAttribute("id") : this.styles.cableDropCurved.getAttribute("id");

      const placemark = this._createPlacemark(drop.name, "#" + styleId);

      // Tidak menambahkan deskripsi sesuai permintaan

      // Create line string
      const lineString = this._createLineString(drop.path);
      placemark.appendChild(lineString);

      folder.appendChild(placemark);
    }

    this.documentElement.appendChild(folder);
  }

  /**
   * Create a folder element
   * @param {string} name - Folder name
   * @returns {Element} Folder element
   * @private
   */
  _createFolder(name) {
    const folder = this.xmlDoc.createElement("Folder");

    const nameElement = this.xmlDoc.createElement("name");
    nameElement.textContent = name;
    folder.appendChild(nameElement);

    return folder;
  }

  /**
   * Create a placemark element
   * @param {string} name - Placemark name
   * @param {string} styleUrl - Style URL reference
   * @returns {Element} Placemark element
   * @private
   */
  _createPlacemark(name, styleUrl) {
    const placemark = this.xmlDoc.createElement("Placemark");

    const nameElement = this.xmlDoc.createElement("name");
    nameElement.textContent = name;
    placemark.appendChild(nameElement);

    const styleUrlElement = this.xmlDoc.createElement("styleUrl");
    styleUrlElement.textContent = styleUrl;
    placemark.appendChild(styleUrlElement);

    return placemark;
  }

  /**
   * Create a point element
   * @param {Array} coordinates - [lon, lat, alt] array
   * @returns {Element} Point element
   * @private
   */
  _createPoint(coordinates) {
    const point = this.xmlDoc.createElement("Point");

    const coordinatesElement = this.xmlDoc.createElement("coordinates");
    coordinatesElement.textContent = coordinates.join(",");
    point.appendChild(coordinatesElement);

    return point;
  }

  /**
   * Create a polygon element
   * @param {Array} coordinatesArrays - Array of coordinate arrays
   * @returns {Element} Polygon element
   * @private
   */
  _createPolygon(coordinatesArrays) {
    const polygon = this.xmlDoc.createElement("Polygon");

    // Outer boundary
    if (coordinatesArrays.length > 0) {
      const outerBoundary = this.xmlDoc.createElement("outerBoundaryIs");
      const linearRing = this._createLinearRing(coordinatesArrays[0]);
      outerBoundary.appendChild(linearRing);
      polygon.appendChild(outerBoundary);
    }

    // Inner boundaries (holes)
    for (let i = 1; i < coordinatesArrays.length; i++) {
      const innerBoundary = this.xmlDoc.createElement("innerBoundaryIs");
      const linearRing = this._createLinearRing(coordinatesArrays[i]);
      innerBoundary.appendChild(linearRing);
      polygon.appendChild(innerBoundary);
    }

    return polygon;
  }

  /**
   * Create a linear ring element
   * @param {Array} coordinates - Array of [lon, lat, alt] arrays
   * @returns {Element} LinearRing element
   * @private
   */
  _createLinearRing(coordinates) {
    const linearRing = this.xmlDoc.createElement("LinearRing");

    const coordinatesElement = this.xmlDoc.createElement("coordinates");
    const coordsString = coordinates.map((coord) => coord.join(",")).join(" ");
    coordinatesElement.textContent = coordsString;
    linearRing.appendChild(coordinatesElement);

    return linearRing;
  }

  /**
   * Create a line string element
   * @param {Array} path - Array of [lon, lat, alt] arrays
   * @returns {Element} LineString element
   * @private
   */
  _createLineString(path) {
    const lineString = this.xmlDoc.createElement("LineString");

    // Add altitude mode for 3D display
    const altitudeMode = this.xmlDoc.createElement("altitudeMode");
    altitudeMode.textContent = "relativeToGround";
    lineString.appendChild(altitudeMode);

    // Add tessellate for ground hugging
    const tessellate = this.xmlDoc.createElement("tessellate");
    tessellate.textContent = "1";
    lineString.appendChild(tessellate);

    // Add coordinates
    const coordinatesElement = this.xmlDoc.createElement("coordinates");
    const coordsString = path.map((coord) => coord.join(",")).join(" ");
    coordinatesElement.textContent = coordsString;
    lineString.appendChild(coordinatesElement);

    return lineString;
  }

  /**
   * Convert hex color to KML color format
   * @param {string} hexColor - Hex color string (e.g. "#ff0000")
   * @returns {string} KML color string (aabbggrr format)
   * @private
   */
  _convertHexToKmlColor(hexColor) {
    // Remove # if present
    hexColor = hexColor.replace("#", "");

    // Split into RGB components
    const r = hexColor.substr(0, 2);
    const g = hexColor.substr(2, 2);
    const b = hexColor.substr(4, 2);

    // KML uses aabbggrr format (alpha, blue, green, red)
    return "ff" + b + g + r;
  }
}
