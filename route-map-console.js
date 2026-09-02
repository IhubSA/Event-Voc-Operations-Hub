// Route Map Console
// Interactive map for creating and managing event routes (staff, vehicles, emergency evacuation)
import { supabase } from './supabase.js';
import { Navbar } from './navbar.js';
import { wrapWithShell } from './org-branding.js';

export class RouteMapConsole {
  constructor() {
    this.map = null;
    this.routes = [];
    this.currentRoute = null;
    this.isDrawing = false;
    this.polylines = [];
    this.markers = [];
    this.waterTableMarkers = [];
    this.marshalMarkers = [];
    this.medicalStationMarkers = [];
    this.securityVehicleMarkers = [];
    this.startPoint = null;
    this.finishPoint = null;
    this.distanceLabels = [];
    this.routeTypes = ['staff_route', 'vehicle_route', 'evacuation_route', 'race_route'];
    this.colors = {
      staff_route: '#0099FF',
      vehicle_route: '#FF6B35',
      evacuation_route: '#FF3333',
      race_route: '#9C27B0',
      water_table: '#1E90FF',
      marshal: '#9370DB',
      medical_station: '#E91E63',
      security_vehicle: '#FF9800',
      start: '#4CAF50',
      finish: '#F44336'
    };
    this.isAddingWaterTable = false;
    this.isAddingMarshal = false;
    this.isAddingMedical = false;
    this.isAddingSecurity = false;
    this.isAddingStart = false;
    this.isAddingFinish = false;

    // Track visibility of saved routes and their special locations
    this.routeVisibility = {}; // { routeId: { waypoints: true, marshals: true, water: true, medical: true, security: true, startFinish: true } }

    // Track markers and polylines per route for cleanup
    this.routeMapElements = {}; // { routeId: { markers: [], polylines: [] } }
  }

  // Calculate distance between two lat/lng points in kilometers (Haversine formula)
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Create orange flag icon for marshal markers
  createOrangeFlagMarker(scale = 0.75) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const size = 40 * scale;
    canvas.width = size;
    canvas.height = size;

    // Draw background circle (white)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();

    // Draw orange flag
    const flagX = size * 0.3;
    const flagY = size * 0.3;
    const flagWidth = size * 0.4;
    const flagHeight = size * 0.4;

    // Flag pole
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(flagX, flagY);
    ctx.lineTo(flagX, flagY + flagHeight);
    ctx.stroke();

    // Orange flag rectangle
    ctx.fillStyle = '#FF9800';
    ctx.fillRect(flagX, flagY, flagWidth, flagHeight);

    // Flag border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(flagX, flagY, flagWidth, flagHeight);

    return {
      url: canvas.toDataURL(),
      scaledSize: new google.maps.Size(size, size),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(size / 2, size / 2)
    };
  }

  // Create emoji marker icon for map markers
  createEmojiMarker(emoji, scale = 1.5) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const size = 40 * scale;
    canvas.width = size;
    canvas.height = size;

    // Draw background circle
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw border
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();

    // Draw emoji
    ctx.font = `${size * 0.6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, size / 2, size / 2);

    return {
      url: canvas.toDataURL(),
      scaledSize: new google.maps.Size(size, size),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(size / 2, size / 2)
    };
  }

  // Create kilometer marker label icon
  createKilometerMarkerLabel(kilometers) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const size = 50;
    canvas.width = size;
    canvas.height = size;

    // Draw background circle (slightly transparent)
    ctx.fillStyle = 'rgba(0, 153, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw border
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.stroke();

    // Draw text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${kilometers.toFixed(1)}km`, size / 2, size / 2);

    return {
      url: canvas.toDataURL(),
      scaledSize: new google.maps.Size(size, size),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(size / 2, size / 2)
    };
  }

  async render(eventId, onBack, currentUser, onOpenClubSettings) {
    this.eventId = eventId;
    this.onBack = onBack;
    const container = document.getElementById('app');
    const navbar = new Navbar(currentUser, () => {}, null, onOpenClubSettings);
    const navbarHtml = navbar.render();

    // Get current user's org_id
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: memberData, error: memberError } = await supabase
          .from('organization_members')
          .select('org_id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .limit(1);

        if (memberError) {
          console.error('Error fetching org_id:', memberError);
        }

        if (memberData && memberData.length > 0) {
          this.orgId = memberData[0].org_id;
          console.log('Set org_id to:', this.orgId);
        } else {
          console.warn('No organization membership found for user - routes may not save correctly');
          this.orgId = null;
        }
      }
    } catch (error) {
      console.error('Error getting org_id:', error);
      this.orgId = null;
    }

    const html = `
      <div class="route-map-container">
        <div class="route-map-header">
          <div class="route-map-title-section">
            <h1>Route Map Console</h1>
            <p class="route-map-subtitle">Create and manage event routes</p>
          </div>
          <button class="btn btn-secondary" id="back-btn">← Back</button>
        </div>

        <div class="route-map-controls-sticky">
          <div class="controls-wrapper">
            <div class="control-group">
              <label>Route Type:</label>
              <select id="route-type-select" class="control-select">
                <option value="staff_route">Staff Route</option>
                <option value="vehicle_route">Vehicle Route</option>
                <option value="evacuation_route">Evacuation Route</option>
                <option value="race_route">Race Route</option>
              </select>
            </div>
            <div class="control-group">
              <label>Route Name:</label>
              <input type="text" id="route-name-input" class="control-input" placeholder="e.g., North Entrance Route">
            </div>
            <div class="control-group">
              <button class="btn btn-primary" id="start-drawing-btn">✎ Start Drawing</button>
              <button class="btn btn-secondary" id="clear-drawing-btn" disabled>Clear</button>
              <button class="btn btn-success" id="save-route-btn" disabled>💾 Save</button>
            </div>
            <div class="control-group">
              <button class="btn btn-success" id="add-start-btn">🚩 Start</button>
              <button class="btn btn-danger" id="add-finish-btn">🏁 Finish</button>
            </div>
            <div class="control-group">
              <button class="btn btn-info" id="add-medical-btn">🏥 Medical</button>
              <button class="btn btn-warning" id="add-security-btn">🚔 Security</button>
            </div>
            <div class="control-group">
              <button class="btn btn-info" id="add-water-table-btn">💧 Water</button>
              <button class="btn btn-info" id="add-marshal-btn">👮 Marshal</button>
            </div>
          </div>
        </div>

        <div class="route-map-content">
          <div class="route-map-main">
            <div id="map" class="map-container"></div>
          </div>

          <div class="route-map-sidebar">
            <div class="sidebar-section">
              <h3>Legend</h3>
              <div class="routes-legend">
                <div class="legend-item">
                  <div class="legend-color" style="background-color: #0099FF;"></div>
                  <span>Staff Routes</span>
                </div>
                <div class="legend-item">
                  <div class="legend-color" style="background-color: #FF6B35;"></div>
                  <span>Vehicle Routes</span>
                </div>
                <div class="legend-item">
                  <div class="legend-color" style="background-color: #FF3333;"></div>
                  <span>Evacuation Routes</span>
                </div>
                <div class="legend-item">
                  <div class="legend-color" style="background-color: #9C27B0;"></div>
                  <span>Race Routes</span>
                </div>
              </div>
            </div>

            <div class="sidebar-section">
              <h3>Saved Routes</h3>
              <div id="routes-list" class="routes-list">
                <div class="loading">Loading routes...</div>
              </div>
            </div>

            <div class="sidebar-section">
              <h3>Waypoints</h3>
              <div id="waypoints-list" class="waypoints-list">
                <p class="empty-state">No waypoints yet</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit Route Modal -->
      <div id="edit-route-modal" class="modal hidden">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Edit Route</h2>
            <button class="modal-close" data-modal="edit-route-modal">&times;</button>
          </div>
          <form id="edit-route-form">
            <input type="hidden" name="route_id">
            <div class="form-group">
              <label>Route Name</label>
              <input type="text" name="name" required>
            </div>
            <div class="form-group">
              <label>Description</label>
              <textarea name="description" rows="3"></textarea>
            </div>
            <div class="form-group">
              <label>Status</label>
              <select name="status">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" data-modal="edit-route-modal">Cancel</button>
              <button type="button" class="btn btn-danger" id="delete-route-btn">Delete Route</button>
              <button type="submit" class="btn btn-primary">Save Changes</button>
            </div>
          </form>
        </div>
      </div>
    `;

    container.innerHTML = wrapWithShell(navbarHtml, html);
    this.addStyles();
    this.setupEventListeners();

    // Wait for Google Maps to be available before initializing
    if (typeof google !== 'undefined' && google.maps) {
      this.initMap();
      await this.loadRoutes();
    } else {
      console.error('Google Maps API not loaded');
      this.showToast('Error: Google Maps API failed to load', 'error');
    }
  }

  initMap() {
    // Default center (you can update this based on event location)
    const defaultCenter = { lat: -33.9249, lng: 18.4241 }; // Cape Town

    this.map = new google.maps.Map(document.getElementById('map'), {
      zoom: 15,
      center: defaultCenter,
      mapTypeId: 'roadmap',
      streetViewControl: false,
    });

    // Click listener for drawing, water tables, marshals, and other points
    this.map.addListener('click', (e) => {
      if (this.isDrawing) {
        this.addWaypoint(e.latLng);
      } else if (this.isAddingWaterTable) {
        this.addWaterTable(e.latLng);
      } else if (this.isAddingMarshal) {
        this.addMarshal(e.latLng);
      } else if (this.isAddingStart) {
        this.addStartPoint(e.latLng);
      } else if (this.isAddingFinish) {
        this.addFinishPoint(e.latLng);
      } else if (this.isAddingMedical) {
        this.addMedicalStation(e.latLng);
      } else if (this.isAddingSecurity) {
        this.addSecurityVehicle(e.latLng);
      }
    });
  }

  setupEventListeners() {
    document.getElementById('back-btn')?.addEventListener('click', () => {
      if (this.onBack) this.onBack();
    });

    document.getElementById('start-drawing-btn')?.addEventListener('click', () => {
      this.toggleDrawingMode();
    });

    document.getElementById('clear-drawing-btn')?.addEventListener('click', () => {
      this.clearDrawing();
    });

    document.getElementById('save-route-btn')?.addEventListener('click', () => {
      this.saveRoute();
    });

    document.getElementById('add-water-table-btn')?.addEventListener('click', () => {
      this.toggleWaterTableMode();
    });

    document.getElementById('add-marshal-btn')?.addEventListener('click', () => {
      this.toggleMarshalMode();
    });

    document.getElementById('add-start-btn')?.addEventListener('click', () => {
      this.toggleStartMode();
    });

    document.getElementById('add-finish-btn')?.addEventListener('click', () => {
      this.toggleFinishMode();
    });

    document.getElementById('add-medical-btn')?.addEventListener('click', () => {
      this.toggleMedicalMode();
    });

    document.getElementById('add-security-btn')?.addEventListener('click', () => {
      this.toggleSecurityMode();
    });

    document.getElementById('edit-route-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleEditRoute(new FormData(e.target));
    });

    document.getElementById('delete-route-btn')?.addEventListener('click', () => {
      this.handleDeleteRoute();
    });

    // Modal close buttons
    document.querySelectorAll('.modal-close, [data-modal]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (e.target.dataset.modal) {
          this.hideModal(e.target.dataset.modal);
        }
      });
    });
  }

  toggleDrawingMode() {
    this.isDrawing = !this.isDrawing;
    const btn = document.getElementById('start-drawing-btn');

    if (this.isDrawing) {
      btn.textContent = '⏹ Stop Drawing';
      btn.classList.add('active');
      document.getElementById('clear-drawing-btn').disabled = false;
      document.getElementById('save-route-btn').disabled = false;
      this.clearAllMarkersAndPolylines();
    } else {
      btn.textContent = '✎ Start Drawing Route';
      btn.classList.remove('active');
      this.updateSaveButtonState();
    }
  }

  addWaypoint(latLng) {
    const waypoint = {
      lat: latLng.lat(),
      lng: latLng.lng(),
      order: this.markers.length + 1
    };

    // Add marker
    const marker = new google.maps.Marker({
      position: latLng,
      map: this.map,
      title: `Waypoint ${waypoint.order}`,
      icon: this.getMarkerIcon(waypoint.order)
    });

    this.markers.push(marker);

    // Draw line between waypoints
    if (this.markers.length > 1) {
      const path = [];
      this.markers.forEach(m => {
        path.push(m.getPosition());
      });

      if (this.polylines.length === 0) {
        const polyline = new google.maps.Polyline({
          path: path,
          geodesic: true,
          strokeColor: this.colors[document.getElementById('route-type-select').value],
          strokeOpacity: 0.8,
          strokeWeight: 3,
          map: this.map
        });
        this.polylines.push(polyline);
      } else {
        this.polylines[0].setPath(path);
      }
    }

    this.updateWaypointsList();
  }

  getMarkerIcon(index) {
    const svgMarker = {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: this.colors[document.getElementById('route-type-select').value],
      fillOpacity: 0.9,
      strokeColor: '#fff',
      strokeWeight: 2
    };
    return svgMarker;
  }

  toggleWaterTableMode() {
    this.isAddingWaterTable = !this.isAddingWaterTable;
    const btn = document.getElementById('add-water-table-btn');

    if (this.isAddingWaterTable) {
      btn.classList.add('active');
      document.getElementById('start-drawing-btn').disabled = true;
      document.getElementById('add-marshal-btn').disabled = true;
      this.showToast('Click on map to place water tables', 'info');
    } else {
      btn.classList.remove('active');
      document.getElementById('start-drawing-btn').disabled = false;
      document.getElementById('add-marshal-btn').disabled = false;
    }
  }

  toggleMarshalMode() {
    this.isAddingMarshal = !this.isAddingMarshal;
    const btn = document.getElementById('add-marshal-btn');

    if (this.isAddingMarshal) {
      btn.classList.add('active');
      document.getElementById('start-drawing-btn').disabled = true;
      document.getElementById('add-water-table-btn').disabled = true;
      this.showToast('Click on map to place marshals', 'info');
    } else {
      btn.classList.remove('active');
      document.getElementById('start-drawing-btn').disabled = false;
      document.getElementById('add-water-table-btn').disabled = false;
    }
  }

  addWaterTable(latLng) {
    const marker = new google.maps.Marker({
      position: latLng,
      map: this.map,
      title: `Water Table ${this.waterTableMarkers.length + 1}`,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: this.colors.water_table,
        fillOpacity: 0.9,
        strokeColor: '#fff',
        strokeWeight: 2
      }
    });

    this.waterTableMarkers.push({
      marker: marker,
      lat: latLng.lat(),
      lng: latLng.lng()
    });

    this.updateSaveButtonState();
    this.showToast(`Water table added (${this.waterTableMarkers.length})`, 'success');
  }

  addMarshal(latLng) {
    const marker = new google.maps.Marker({
      position: latLng,
      map: this.map,
      title: `Marshal ${this.marshalMarkers.length + 1}`,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: this.colors.marshal,
        fillOpacity: 0.9,
        strokeColor: '#fff',
        strokeWeight: 2
      }
    });

    this.marshalMarkers.push({
      marker: marker,
      lat: latLng.lat(),
      lng: latLng.lng()
    });

    this.updateSaveButtonState();
    this.showToast(`Marshal position added (${this.marshalMarkers.length})`, 'success');
  }

  toggleStartMode() {
    this.isAddingStart = !this.isAddingStart;
    const btn = document.getElementById('add-start-btn');

    if (this.isAddingStart) {
      if (this.startPoint) {
        this.startPoint.setMap(null);
        this.startPoint = null;
      }
      btn.classList.add('active');
      this.disableOtherModes('start');
      this.showToast('Click on map to set START point', 'info');
    } else {
      btn.classList.remove('active');
      this.enableOtherModes();
    }
  }

  toggleFinishMode() {
    this.isAddingFinish = !this.isAddingFinish;
    const btn = document.getElementById('add-finish-btn');

    if (this.isAddingFinish) {
      if (this.finishPoint) {
        this.finishPoint.setMap(null);
        this.finishPoint = null;
      }
      btn.classList.add('active');
      this.disableOtherModes('finish');
      this.showToast('Click on map to set FINISH point', 'info');
    } else {
      btn.classList.remove('active');
      this.enableOtherModes();
    }
  }

  toggleMedicalMode() {
    this.isAddingMedical = !this.isAddingMedical;
    const btn = document.getElementById('add-medical-btn');

    if (this.isAddingMedical) {
      btn.classList.add('active');
      this.disableOtherModes('medical');
      this.showToast('Click on map to place medical stations', 'info');
    } else {
      btn.classList.remove('active');
      this.enableOtherModes();
    }
  }

  toggleSecurityMode() {
    this.isAddingSecurity = !this.isAddingSecurity;
    const btn = document.getElementById('add-security-btn');

    if (this.isAddingSecurity) {
      btn.classList.add('active');
      this.disableOtherModes('security');
      this.showToast('Click on map to place security vehicles', 'info');
    } else {
      btn.classList.remove('active');
      this.enableOtherModes();
    }
  }

  disableOtherModes(currentMode) {
    if (currentMode !== 'drawing') document.getElementById('start-drawing-btn').disabled = true;
    if (currentMode !== 'water') document.getElementById('add-water-table-btn').disabled = true;
    if (currentMode !== 'marshal') document.getElementById('add-marshal-btn').disabled = true;
    if (currentMode !== 'medical') document.getElementById('add-medical-btn').disabled = true;
    if (currentMode !== 'security') document.getElementById('add-security-btn').disabled = true;
  }

  enableOtherModes() {
    document.getElementById('start-drawing-btn').disabled = false;
    document.getElementById('add-water-table-btn').disabled = false;
    document.getElementById('add-marshal-btn').disabled = false;
    document.getElementById('add-medical-btn').disabled = false;
    document.getElementById('add-security-btn').disabled = false;
  }

  addStartPoint(latLng) {
    if (this.startPoint) {
      this.startPoint.setMap(null);
    }

    const marker = new google.maps.Marker({
      position: latLng,
      map: this.map,
      title: 'START',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: this.colors.start,
        fillOpacity: 0.95,
        strokeColor: '#fff',
        strokeWeight: 3
      }
    });

    this.startPoint = marker;
    this.isAddingStart = false;
    document.getElementById('add-start-btn').classList.remove('active');
    this.enableOtherModes();
    this.updateSaveButtonState();
    this.showToast('Start point set! 🚩', 'success');
  }

  addFinishPoint(latLng) {
    if (this.finishPoint) {
      this.finishPoint.setMap(null);
    }

    const marker = new google.maps.Marker({
      position: latLng,
      map: this.map,
      title: 'FINISH',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: this.colors.finish,
        fillOpacity: 0.95,
        strokeColor: '#fff',
        strokeWeight: 3
      }
    });

    this.finishPoint = marker;
    this.isAddingFinish = false;
    document.getElementById('add-finish-btn').classList.remove('active');
    this.enableOtherModes();
    this.updateSaveButtonState();
    this.showToast('Finish point set! 🏁', 'success');
  }

  addMedicalStation(latLng) {
    const marker = new google.maps.Marker({
      position: latLng,
      map: this.map,
      title: `Medical Station ${this.medicalStationMarkers.length + 1}`,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: this.colors.medical_station,
        fillOpacity: 0.9,
        strokeColor: '#fff',
        strokeWeight: 2
      }
    });

    this.medicalStationMarkers.push({
      marker: marker,
      lat: latLng.lat(),
      lng: latLng.lng()
    });

    this.updateSaveButtonState();
    this.showToast(`Medical station added (${this.medicalStationMarkers.length})`, 'success');
  }

  addSecurityVehicle(latLng) {
    const marker = new google.maps.Marker({
      position: latLng,
      map: this.map,
      title: `Security Vehicle ${this.securityVehicleMarkers.length + 1}`,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: this.colors.security_vehicle,
        fillOpacity: 0.9,
        strokeColor: '#fff',
        strokeWeight: 2
      }
    });

    this.securityVehicleMarkers.push({
      marker: marker,
      lat: latLng.lat(),
      lng: latLng.lng()
    });

    this.updateSaveButtonState();
    this.showToast(`Security vehicle added (${this.securityVehicleMarkers.length})`, 'success');
  }

  updateWaypointsList() {
    const list = document.getElementById('waypoints-list');
    if (this.markers.length === 0) {
      list.innerHTML = '<p class="empty-state">No waypoints yet</p>';
      return;
    }

    let totalDistance = 0;
    const waypointHtml = this.markers.map((marker, i) => {
      let distanceText = '';
      if (i > 0) {
        const prevMarker = this.markers[i - 1];
        const distance = google.maps.geometry.spherical.computeDistanceBetween(
          prevMarker.getPosition(),
          marker.getPosition()
        );
        totalDistance += distance;
        distanceText = `<small style="color: #999;">${(distance / 1000).toFixed(2)} km</small>`;
      }
      return `
        <div class="waypoint-item">
          <span class="waypoint-number">${i + 1}</span>
          <span class="waypoint-coords">${marker.getPosition().lat().toFixed(4)}, ${marker.getPosition().lng().toFixed(4)}</span>
          ${distanceText}
          <button class="btn-small btn-danger" onclick="this.parentElement.remove()">×</button>
        </div>
      `;
    }).join('');

    list.innerHTML = `
      <div class="waypoints-items">
        ${waypointHtml}
        <div style="padding: 0.75rem; background: #e8f5e9; border-radius: 4px; margin-top: 0.5rem; font-weight: bold;">
          Total: ${(totalDistance / 1000).toFixed(2)} km
        </div>
      </div>
    `;
  }

  clearDrawing() {
    this.clearAllMarkersAndPolylines();
    this.updateWaypointsList();
    this.updateSaveButtonState();
  }

  updateSaveButtonState() {
    // Enable save button if there's any content on the map
    const hasContent =
      this.markers.length > 0 ||
      this.marshalMarkers.length > 0 ||
      this.waterTableMarkers.length > 0 ||
      this.medicalStationMarkers.length > 0 ||
      this.securityVehicleMarkers.length > 0 ||
      this.startPoint !== null ||
      this.finishPoint !== null;

    const clearBtn = document.getElementById('clear-drawing-btn');
    const saveBtn = document.getElementById('save-route-btn');

    if (hasContent) {
      clearBtn.disabled = false;
      saveBtn.disabled = false;
    } else {
      clearBtn.disabled = true;
      saveBtn.disabled = true;
    }
  }

  clearAllMarkersAndPolylines() {
    this.markers.forEach(marker => marker.setMap(null));
    this.polylines.forEach(polyline => polyline.setMap(null));
    this.waterTableMarkers.forEach(wt => wt.marker.setMap(null));
    this.marshalMarkers.forEach(m => m.marker.setMap(null));
    this.medicalStationMarkers.forEach(ms => ms.marker.setMap(null));
    this.securityVehicleMarkers.forEach(sv => sv.marker.setMap(null));
    if (this.startPoint) this.startPoint.setMap(null);
    if (this.finishPoint) this.finishPoint.setMap(null);
    this.markers = [];
    this.polylines = [];
    this.waterTableMarkers = [];
    this.marshalMarkers = [];
    this.medicalStationMarkers = [];
    this.securityVehicleMarkers = [];
    this.startPoint = null;
    this.finishPoint = null;
  }

  async saveRoute() {
    const routeName = document.getElementById('route-name-input').value;
    const routeType = document.getElementById('route-type-select').value;

    if (!routeName) {
      alert('Please enter a route name');
      return;
    }

    // Validate org_id
    if (!this.orgId) {
      alert('Error: Could not determine your organization. Please refresh the page and try again.');
      console.error('org_id is not set. User may not have an active organization membership.');
      return;
    }

    // Check if route has at least some content (waypoints OR special locations)
    const hasWaypoints = this.markers.length >= 2;
    const hasMarshal = this.marshalMarkers.length > 0;
    const hasWaterTable = this.waterTableMarkers.length > 0;
    const hasMedical = this.medicalStationMarkers.length > 0;
    const hasSecurity = this.securityVehicleMarkers.length > 0;
    const hasStartFinish = this.startPoint || this.finishPoint;

    if (!hasWaypoints && !hasMarshal && !hasWaterTable && !hasMedical && !hasSecurity && !hasStartFinish) {
      alert('Please add at least waypoints or special locations (marshals, water tables, etc.) to the route');
      return;
    }

    const waypoints = this.markers.map((marker, i) => ({
      order: i + 1,
      lat: marker.getPosition().lat(),
      lng: marker.getPosition().lng()
    }));

    // Prepare special locations data
    const marshals = this.marshalMarkers.map((m, i) => ({
      order: i + 1,
      lat: m.lat,
      lng: m.lng
    }));

    const waterTables = this.waterTableMarkers.map((w, i) => ({
      order: i + 1,
      lat: w.lat,
      lng: w.lng
    }));

    const medicalStations = this.medicalStationMarkers.map((ms, i) => ({
      order: i + 1,
      lat: ms.lat,
      lng: ms.lng
    }));

    const securityVehicles = this.securityVehicleMarkers.map((sv, i) => ({
      order: i + 1,
      lat: sv.lat,
      lng: sv.lng
    }));

    const startFinish = {
      start: this.startPoint ? {
        lat: this.startPoint.getPosition().lat(),
        lng: this.startPoint.getPosition().lng()
      } : null,
      finish: this.finishPoint ? {
        lat: this.finishPoint.getPosition().lat(),
        lng: this.finishPoint.getPosition().lng()
      } : null
    };

    // Check if start_finish has any actual data
    const hasStartFinishData = startFinish.start !== null || startFinish.finish !== null;

    try {
      const routeData = {
        event_id: this.eventId,
        org_id: this.orgId,
        name: routeName,
        type: routeType,
        waypoints: waypoints.length > 0 ? waypoints : null,
        marshals: marshals.length > 0 ? marshals : null,
        water_tables: waterTables.length > 0 ? waterTables : null,
        medical_stations: medicalStations.length > 0 ? medicalStations : null,
        security_vehicles: securityVehicles.length > 0 ? securityVehicles : null,
        start_finish: hasStartFinishData ? startFinish : null,
        status: 'active',
        created_at: new Date().toISOString()
      };

      console.log('Saving route with data:', routeData);
      console.log('Marshal markers count:', this.marshalMarkers.length);
      console.log('Water table markers count:', this.waterTableMarkers.length);
      console.log('Medical stations count:', this.medicalStationMarkers.length);
      console.log('Security vehicles count:', this.securityVehicleMarkers.length);

      const { data, error } = await supabase
        .from('routes')
        .insert(routeData)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        throw error;
      }

      console.log('Route saved successfully:', data);
      if (data && data.length > 0) {
        console.log('Route ID:', data[0].id);
        console.log('Marshals saved:', data[0].marshals);
      } else {
        console.warn('Route insert succeeded but no data returned - RLS policy may be too restrictive');
      }

      this.showToast('Route saved successfully!', 'success');
      this.clearDrawing();
      document.getElementById('route-name-input').value = '';
      await this.loadRoutes();
    } catch (error) {
      console.error('Error saving route:', error);
      this.showToast('Error saving route: ' + error.message, 'error');
    }
  }

  async loadRoutes() {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('event_id', this.eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.routes = data || [];

      // Initialize visibility for new routes
      this.routes.forEach(route => {
        if (!this.routeVisibility[route.id]) {
          this.routeVisibility[route.id] = {
            waypoints: true,
            marshals: true,
            water: true,
            medical: true,
            security: true,
            startFinish: true
          };
        }
      });

      this.renderRoutesList();
      this.displayRoutesOnMap();
    } catch (error) {
      console.error('Error loading routes:', error);
      document.getElementById('routes-list').innerHTML = '<div class="error">Failed to load routes</div>';
    }
  }

  renderRoutesList() {
    const list = document.getElementById('routes-list');

    if (this.routes.length === 0) {
      list.innerHTML = '<p class="empty-state">No routes created yet</p>';
      return;
    }

    list.innerHTML = `
      <div class="routes-items">
        ${this.routes.map(route => {
          const visibility = this.routeVisibility[route.id] || {};
          const hasWaypoints = route.waypoints && route.waypoints.length > 0;
          const hasMarshal = route.marshals && route.marshals.length > 0;
          const hasWater = route.water_tables && route.water_tables.length > 0;
          const hasMedical = route.medical_stations && route.medical_stations.length > 0;
          const hasSecurity = route.security_vehicles && route.security_vehicles.length > 0;
          const hasStartFinish = route.start_finish && (route.start_finish.start || route.start_finish.finish);

          return `
            <div class="route-item">
              <div class="route-header">
                <div class="route-name-section">
                  <span class="route-name">${route.name || 'Unnamed Route'}</span>
                  <span class="route-type-small" style="background-color: ${this.colors[route.type]}">${route.type.replace('_', ' ')}</span>
                </div>
              </div>

              <div class="route-toggles">
                ${hasWaypoints ? `
                  <label class="route-toggle">
                    <input type="checkbox" class="toggle-waypoints" data-route-id="${route.id}" ${visibility.waypoints ? 'checked' : ''} />
                    <span>🛣️ Routes</span>
                  </label>
                ` : ''}
                ${hasMarshal ? `
                  <label class="route-toggle">
                    <input type="checkbox" class="toggle-marshals" data-route-id="${route.id}" ${visibility.marshals ? 'checked' : ''} />
                    <span>👮 Marshals</span>
                  </label>
                ` : ''}
                ${hasWater ? `
                  <label class="route-toggle">
                    <input type="checkbox" class="toggle-water" data-route-id="${route.id}" ${visibility.water ? 'checked' : ''} />
                    <span>💧 Water</span>
                  </label>
                ` : ''}
                ${hasMedical ? `
                  <label class="route-toggle">
                    <input type="checkbox" class="toggle-medical" data-route-id="${route.id}" ${visibility.medical ? 'checked' : ''} />
                    <span>🏥 Medical</span>
                  </label>
                ` : ''}
                ${hasSecurity ? `
                  <label class="route-toggle">
                    <input type="checkbox" class="toggle-security" data-route-id="${route.id}" ${visibility.security ? 'checked' : ''} />
                    <span>🚔 Security</span>
                  </label>
                ` : ''}
                ${hasStartFinish ? `
                  <label class="route-toggle">
                    <input type="checkbox" class="toggle-startfinish" data-route-id="${route.id}" ${visibility.startFinish ? 'checked' : ''} />
                    <span>🚩 Start/Finish</span>
                  </label>
                ` : ''}
              </div>

              <div class="route-details">
                <small>Waypoints: ${(route.waypoints || []).length}</small>
                <small>Marshals: ${(route.marshals || []).length}</small>
                <small>Water: ${(route.water_tables || []).length}</small>
              </div>

              <div class="route-actions">
                <button class="btn-small btn-primary" data-route-id="${route.id}" data-action="view">View</button>
                <button class="btn-small btn-secondary" data-route-id="${route.id}" data-action="edit">Edit</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Attach event listeners to action buttons
    list.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const routeId = e.target.dataset.routeId;
        const action = e.target.dataset.action;
        if (action === 'edit') {
          this.editRoute(routeId);
        } else if (action === 'view') {
          this.showRouteDetails(routeId);
        }
      });
    });

    // Attach event listeners to toggles
    list.querySelectorAll('.toggle-waypoints').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const routeId = e.target.dataset.routeId;
        this.routeVisibility[routeId].waypoints = e.target.checked;
        this.displayRoutesOnMap();
      });
    });

    list.querySelectorAll('.toggle-marshals').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const routeId = e.target.dataset.routeId;
        this.routeVisibility[routeId].marshals = e.target.checked;
        this.displayRoutesOnMap();
      });
    });

    list.querySelectorAll('.toggle-water').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const routeId = e.target.dataset.routeId;
        this.routeVisibility[routeId].water = e.target.checked;
        this.displayRoutesOnMap();
      });
    });

    list.querySelectorAll('.toggle-medical').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const routeId = e.target.dataset.routeId;
        this.routeVisibility[routeId].medical = e.target.checked;
        this.displayRoutesOnMap();
      });
    });

    list.querySelectorAll('.toggle-security').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const routeId = e.target.dataset.routeId;
        this.routeVisibility[routeId].security = e.target.checked;
        this.displayRoutesOnMap();
      });
    });

    list.querySelectorAll('.toggle-startfinish').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const routeId = e.target.dataset.routeId;
        this.routeVisibility[routeId].startFinish = e.target.checked;
        this.displayRoutesOnMap();
      });
    });
  }

  displayRoutesOnMap() {
    // Clear all existing route markers and polylines
    Object.values(this.routeMapElements).forEach(elements => {
      elements.markers.forEach(marker => marker.setMap(null));
      elements.polylines.forEach(polyline => polyline.setMap(null));
    });
    this.routeMapElements = {};

    this.routes.forEach(route => {
      const visibility = this.routeVisibility[route.id] || {};

      // Initialize storage for this route's elements
      if (!this.routeMapElements[route.id]) {
        this.routeMapElements[route.id] = { markers: [], polylines: [] };
      }

      // Display waypoints and polyline
      if (visibility.waypoints && route.waypoints && route.waypoints.length > 0) {
        const path = route.waypoints.map(wp => ({
          lat: wp.lat,
          lng: wp.lng
        }));

        const polyline = new google.maps.Polyline({
          path: path,
          geodesic: true,
          strokeColor: this.colors[route.type],
          strokeOpacity: 0.7,
          strokeWeight: 2,
          map: this.map
        });

        this.routeMapElements[route.id].polylines.push(polyline);

        // Calculate cumulative distance and add waypoint markers with mile labels
        let cumulativeDistance = 0;
        route.waypoints.forEach((wp, i) => {
          // Calculate distance from previous waypoint
          if (i > 0) {
            const prevWp = route.waypoints[i - 1];
            const segmentDistance = this.calculateDistance(
              prevWp.lat, prevWp.lng,
              wp.lat, wp.lng
            );
            cumulativeDistance += segmentDistance;
          }

          // Add waypoint circle marker
          const marker = new google.maps.Marker({
            position: { lat: wp.lat, lng: wp.lng },
            map: this.map,
            title: `${route.name} - Waypoint ${wp.order} (${cumulativeDistance.toFixed(1)} km)`,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: this.colors[route.type],
              fillOpacity: 0.6,
              strokeColor: '#fff',
              strokeWeight: 1
            },
            zIndex: 10
          });
          this.routeMapElements[route.id].markers.push(marker);

          // Add kilometer marker label (offset slightly from the waypoint)
          if (i > 0) { // Don't show for first point (cumulative is 0)
            const kmMarker = new google.maps.Marker({
              position: { lat: wp.lat, lng: wp.lng },
              map: this.map,
              title: `${cumulativeDistance.toFixed(1)} kilometers`,
              icon: this.createKilometerMarkerLabel(cumulativeDistance),
              zIndex: 5
            });
            this.routeMapElements[route.id].markers.push(kmMarker);
          }
        });

        // Add total distance label if route has waypoints
        if (route.waypoints.length > 1) {
          console.log(`${route.name} total distance: ${cumulativeDistance.toFixed(1)} km`);
        }
      }

      // Display marshals
      if (visibility.marshals && route.marshals && Array.isArray(route.marshals) && route.marshals.length > 0) {
        route.marshals.forEach((marshal, i) => {
          if (marshal.lat && marshal.lng) {
            const marker = new google.maps.Marker({
              position: { lat: marshal.lat, lng: marshal.lng },
              map: this.map,
              title: `${route.name} - Marshal ${i + 1}`,
              icon: this.createOrangeFlagMarker(0.75)
            });
            this.routeMapElements[route.id].markers.push(marker);
          }
        });
      }

      // Display water tables
      if (visibility.water && route.water_tables && Array.isArray(route.water_tables) && route.water_tables.length > 0) {
        route.water_tables.forEach((wt, i) => {
          if (wt.lat && wt.lng) {
            const marker = new google.maps.Marker({
              position: { lat: wt.lat, lng: wt.lng },
              map: this.map,
              title: `${route.name} - Water Table ${i + 1}`,
              icon: this.createEmojiMarker('💧', 0.75)
            });
            this.routeMapElements[route.id].markers.push(marker);
          }
        });
      }

      // Display medical stations
      if (visibility.medical && route.medical_stations && Array.isArray(route.medical_stations) && route.medical_stations.length > 0) {
        route.medical_stations.forEach((ms, i) => {
          if (ms.lat && ms.lng) {
            const marker = new google.maps.Marker({
              position: { lat: ms.lat, lng: ms.lng },
              map: this.map,
              title: `${route.name} - Medical Station ${i + 1}`,
              icon: this.createEmojiMarker('🏥', 0.75)
            });
            this.routeMapElements[route.id].markers.push(marker);
          }
        });
      }

      // Display security vehicles
      if (visibility.security && route.security_vehicles && Array.isArray(route.security_vehicles) && route.security_vehicles.length > 0) {
        route.security_vehicles.forEach((sv, i) => {
          if (sv.lat && sv.lng) {
            const marker = new google.maps.Marker({
              position: { lat: sv.lat, lng: sv.lng },
              map: this.map,
              title: `${route.name} - Security Vehicle ${i + 1}`,
              icon: this.createEmojiMarker('🚔', 0.75)
            });
            this.routeMapElements[route.id].markers.push(marker);
          }
        });
      }

      // Display start/finish points
      if (visibility.startFinish && route.start_finish) {
        if (route.start_finish.start && route.start_finish.start.lat && route.start_finish.start.lng) {
          const marker = new google.maps.Marker({
            position: { lat: route.start_finish.start.lat, lng: route.start_finish.start.lng },
            map: this.map,
            title: `${route.name} - Start`,
            icon: this.createEmojiMarker('🚩', 0.9)
          });
          this.routeMapElements[route.id].markers.push(marker);
        }
        if (route.start_finish.finish && route.start_finish.finish.lat && route.start_finish.finish.lng) {
          const marker = new google.maps.Marker({
            position: { lat: route.start_finish.finish.lat, lng: route.start_finish.finish.lng },
            map: this.map,
            title: `${route.name} - Finish`,
            icon: this.createEmojiMarker('🏁', 0.9)
          });
          this.routeMapElements[route.id].markers.push(marker);
        }
      }
    });
  }

  editRoute(routeId) {
    const route = this.routes.find(r => r.id === routeId);
    if (!route) return;

    document.querySelector('input[name="route_id"]').value = routeId;
    document.querySelector('input[name="name"]').value = route.name;
    document.querySelector('textarea[name="description"]').value = route.description || '';
    document.querySelector('select[name="status"]').value = route.status;

    this.currentRoute = route;
    this.showModal('edit-route-modal');
  }

  async handleEditRoute(formData) {
    const routeId = formData.get('route_id');
    const updates = {
      name: formData.get('name'),
      description: formData.get('description'),
      status: formData.get('status'),
      updated_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase
        .from('routes')
        .update(updates)
        .eq('id', routeId);

      if (error) throw error;

      this.showToast('Route updated successfully!', 'success');
      this.hideModal('edit-route-modal');
      await this.loadRoutes();
    } catch (error) {
      console.error('Error updating route:', error);
      this.showToast('Error updating route: ' + error.message, 'error');
    }
  }

  async handleDeleteRoute() {
    if (!confirm('Are you sure you want to delete this route?')) return;

    const routeId = document.querySelector('input[name="route_id"]').value;

    try {
      const { error } = await supabase
        .from('routes')
        .delete()
        .eq('id', routeId);

      if (error) throw error;

      this.showToast('Route deleted successfully!', 'success');
      this.hideModal('edit-route-modal');
      await this.loadRoutes();
    } catch (error) {
      console.error('Error deleting route:', error);
      this.showToast('Error deleting route: ' + error.message, 'error');
    }
  }

  showModal(modalId) {
    document.getElementById(modalId)?.classList.remove('hidden');
  }

  hideModal(modalId) {
    document.getElementById(modalId)?.classList.add('hidden');
  }

  showRouteDetails(routeId) {
    const route = this.routes.find(r => r.id === routeId);
    if (!route) {
      this.showToast('Route not found', 'error');
      return;
    }

    // Center map on this route's waypoints
    if (route.waypoints && route.waypoints.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      route.waypoints.forEach(wp => {
        bounds.extend({ lat: wp.lat, lng: wp.lng });
      });
      this.map.fitBounds(bounds);
    }

    this.showToast(`Showing route: ${route.name}`, 'info');
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .route-map-container {
        min-height: 100vh;
        background: #f5f5f5;
        display: flex;
        flex-direction: column;
      }

      .route-map-header {
        background: white;
        border-bottom: 1px solid #ddd;
        padding: 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .route-map-title-section h1 {
        margin: 0;
        font-size: 1.8rem;
        color: #333;
      }

      .route-map-subtitle {
        margin: 0.5rem 0 0 0;
        color: #666;
        font-size: 0.9rem;
      }

      .route-map-controls-sticky {
        position: sticky;
        top: 0;
        background: white;
        border-bottom: 2px solid #ddd;
        padding: 1rem;
        z-index: 100;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .controls-wrapper {
        display: grid;
        grid-template-columns: 200px 250px 1fr;
        gap: 1rem;
        align-items: end;
        max-width: 1400px;
      }

      .route-map-content {
        flex: 1;
        display: grid;
        grid-template-columns: 1fr 280px;
        gap: 1rem;
        padding: 1rem;
        overflow: hidden;
      }

      .route-map-main {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .map-container {
        flex: 1;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        min-height: 600px;
      }

      .control-group {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .control-group:last-child {
        display: flex;
        flex-direction: row;
        gap: 0.5rem;
        align-items: flex-end;
      }

      .control-group label {
        font-size: 0.85rem;
        font-weight: 600;
        color: #333;
      }

      .control-select,
      .control-input {
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 0.9rem;
        color: #333;
        background: white;
      }

      .control-group button {
        flex: 1;
        min-width: 100px;
      }

      .route-map-sidebar {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .sidebar-section {
        background: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .sidebar-section h3 {
        margin: 0 0 1rem 0;
        font-size: 1rem;
        color: #333;
      }

      .routes-legend {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
      }

      .legend-color {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 1px solid #ccc;
      }

      .routes-list,
      .waypoints-list {
        max-height: 400px;
        overflow-y: auto;
      }

      .routes-items,
      .waypoints-items {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .route-item {
        background: #f9f9f9;
        padding: 0.75rem;
        border-radius: 4px;
        border-left: 3px solid #0099FF;
      }

      .route-header {
        display: flex;
        justify-content: flex-start;
        align-items: flex-start;
        margin-bottom: 0.75rem;
      }

      .route-name-section {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .route-name {
        font-weight: 700;
        font-size: 1rem;
        color: #222;
        flex: 1;
        min-width: 150px;
      }

      .route-type-small {
        color: white;
        padding: 0.3rem 0.6rem;
        border-radius: 4px;
        font-size: 0.7rem;
        font-weight: 600;
        white-space: nowrap;
      }

      .route-toggles {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-bottom: 0.75rem;
        padding: 0.5rem 0;
      }

      .route-toggle {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.8rem;
        cursor: pointer;
        user-select: none;
        padding: 0.25rem 0.5rem;
        background: rgba(0, 153, 255, 0.08);
        border: 1px solid rgba(0, 153, 255, 0.2);
        border-radius: 4px;
        transition: all 0.2s ease;
      }

      .route-toggle:hover {
        background: rgba(0, 153, 255, 0.15);
        border-color: rgba(0, 153, 255, 0.4);
      }

      .route-toggle input[type="checkbox"] {
        cursor: pointer;
        width: 14px;
        height: 14px;
      }

      .route-toggle span {
        color: #333;
        font-weight: 500;
      }

      .route-details {
        display: flex;
        gap: 1rem;
        margin-bottom: 0.5rem;
      }

      .route-details small {
        color: #666;
        font-size: 0.8rem;
      }

      .route-actions {
        display: flex;
        gap: 0.25rem;
      }

      .waypoint-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        background: #f9f9f9;
        border-radius: 4px;
        font-size: 0.8rem;
      }

      .waypoint-number {
        background: #0099FF;
        color: white;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
      }

      .waypoint-coords {
        flex: 1;
        color: #666;
      }

      .empty-state {
        color: #999;
        font-size: 0.9rem;
        text-align: center;
        padding: 1rem;
        margin: 0;
      }

      .btn-small {
        padding: 0.4rem 0.6rem;
        font-size: 0.8rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .btn-small.btn-primary {
        background: #0099FF;
        color: white;
      }

      .btn-small.btn-secondary {
        background: #f0f0f0;
        color: #333;
      }

      .btn-small.btn-danger {
        background: #ff4444;
        color: white;
        padding: 0.2rem 0.4rem;
      }

      .btn {
        padding: 0.6rem 1.2rem;
        font-size: 0.95rem;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s;
      }

      .btn-primary {
        background: #0099FF;
        color: white;
      }

      .btn-primary:hover {
        background: #0077cc;
      }

      .btn-secondary {
        background: #f0f0f0;
        color: #333;
      }

      .btn-secondary:hover {
        background: #e0e0e0;
      }

      .btn-success {
        background: #4caf50;
        color: white;
      }

      .btn-success:hover {
        background: #45a049;
      }

      .btn-danger {
        background: #f44336;
        color: white;
      }

      .btn-danger:hover {
        background: #da190b;
      }

      .btn-info {
        background: #17a2b8;
        color: white;
      }

      .btn-info:hover {
        background: #138496;
      }

      .btn-warning {
        background: #FF9800;
        color: white;
      }

      .btn-warning:hover {
        background: #e68900;
      }

      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .btn.active {
        box-shadow: 0 0 8px rgba(0,0,0,0.3);
        transform: scale(1.05);
      }

      .modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 1000;
        align-items: center;
        justify-content: center;
      }

      .modal:not(.hidden) {
        display: flex;
      }

      .modal-content {
        background: white;
        border-radius: 8px;
        padding: 2rem;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }

      .modal-header h2 {
        margin: 0;
        font-size: 1.3rem;
      }

      .modal-close {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #999;
      }

      .form-group {
        margin-bottom: 1rem;
      }

      .form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 600;
        color: #333;
      }

      .form-group input,
      .form-group textarea,
      .form-group select {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-family: inherit;
        font-size: 0.9rem;
      }

      .form-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
        margin-top: 2rem;
      }

      .toast {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: #333;
        color: white;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        opacity: 0;
        transition: opacity 0.3s;
        z-index: 2000;
      }

      .toast.show {
        opacity: 1;
      }

      .toast-success {
        background: #4caf50;
      }

      .toast-error {
        background: #f44336;
      }

      .toast-info {
        background: #2196F3;
      }

      @media (max-width: 1200px) {
        .route-map-content {
          grid-template-columns: 1fr;
        }

        .controls-wrapper {
          grid-template-columns: 150px 200px 1fr;
        }
      }

      @media (max-width: 768px) {
        .route-map-header {
          flex-direction: column;
          gap: 1rem;
          align-items: flex-start;
        }

        .controls-wrapper {
          grid-template-columns: 1fr;
        }

        .route-map-content {
          grid-template-columns: 1fr;
        }

        .map-container {
          min-height: 400px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  destroy() {
    if (this.map) {
      this.clearAllMarkersAndPolylines();
    }
  }
}
