// API Base URL
const API_URL = '/api/items';

// DOM Elements
const itemForm = document.getElementById('item-form');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');
const itemIdInput = document.getElementById('item-id');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const itemsTable = document.getElementById('items-table');
const itemsBody = document.getElementById('items-body');
const loadingDiv = document.getElementById('loading');
const emptyState = document.getElementById('empty-state');
const refreshBtn = document.getElementById('refresh-btn');
const toast = document.getElementById('toast');

// Geofence Elements
const drawFenceBtn = document.getElementById('draw-fence-btn');
const clearFenceBtn = document.getElementById('clear-fence-btn');
const startTrackingBtn = document.getElementById('start-tracking-btn');
const stopTrackingBtn = document.getElementById('stop-tracking-btn');
const fenceStatus = document.getElementById('fence-status');
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const alertPanel = document.getElementById('alert-panel');
const alertDetails = document.getElementById('alert-details');
const dismissAlertBtn = document.getElementById('dismiss-alert-btn');

// State
let isEditing = false;
let map = null;
let drawnItems = null;
let fencePolygon = null;
let fenceCoordinates = [];
let trackingMarker = null;
let trackingInterval = null;
let isTracking = false;
let currentPosition = null;
let isInsideFence = true;
let isDrawingFence = false;
let tempFencePoints = [];
let tempMarkers = [];
let tempPolyline = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    loadItems();
    setupEventListeners();
});

// Play alert sound
function playAlertSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
        console.log('Audio not supported');
    }
}

// Initialize OpenStreetMap
function initMap() {
    const defaultLat = 40.7128;
    const defaultLng = -74.0060;
    
    map = L.map('map').setView([defaultLat, defaultLng], 15);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // FeatureGroup for drawn items
    drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
    
    // Handle map clicks for fence drawing
    map.on('click', onMapClick);
    
    // Get user location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                map.setView([latitude, longitude], 15);
                currentPosition = { lat: latitude, lng: longitude };
            },
            () => {
                currentPosition = { lat: defaultLat, lng: defaultLng };
            }
        );
    } else {
        currentPosition = { lat: defaultLat, lng: defaultLng };
    }
}

// Handle map click for fence drawing
function onMapClick(e) {
    if (!isDrawingFence) return;
    
    const { lat, lng } = e.latlng;
    tempFencePoints.push({ lat, lng });
    
    // Add marker for this point
    const marker = L.circleMarker([lat, lng], {
        radius: 8,
        fillColor: '#667eea',
        color: '#fff',
        weight: 2,
        fillOpacity: 1
    }).addTo(map);
    tempMarkers.push(marker);
    
    // Update polyline
    updateTempPolyline();
    
    showToast(`Point ${tempFencePoints.length} added. ${tempFencePoints.length >= 3 ? 'Click "Finish Fence" or add more points.' : 'Add at least 3 points.'}`, 'info');
}

// Update temporary polyline while drawing
function updateTempPolyline() {
    if (tempPolyline) {
        map.removeLayer(tempPolyline);
    }
    
    if (tempFencePoints.length >= 2) {
        const latlngs = tempFencePoints.map(p => [p.lat, p.lng]);
        // Close the polygon preview
        if (tempFencePoints.length >= 3) {
            latlngs.push([tempFencePoints[0].lat, tempFencePoints[0].lng]);
        }
        tempPolyline = L.polyline(latlngs, {
            color: '#667eea',
            weight: 3,
            dashArray: '10, 10'
        }).addTo(map);
    }
}

// Start drawing fence
function startDrawingFence() {
    clearFence();
    isDrawingFence = true;
    tempFencePoints = [];
    tempMarkers = [];
    
    drawFenceBtn.textContent = 'Finish Fence';
    drawFenceBtn.classList.add('drawing');
    
    showToast('Click on the map to add fence vertices. Click "Finish Fence" when done.', 'info');
}

// Finish drawing fence
function finishDrawingFence() {
    if (tempFencePoints.length < 3) {
        showToast('Need at least 3 points to create a fence!', 'error');
        return;
    }
    
    isDrawingFence = false;
    fenceCoordinates = [...tempFencePoints];
    
    // Clear temp markers and polyline
    tempMarkers.forEach(m => map.removeLayer(m));
    tempMarkers = [];
    if (tempPolyline) {
        map.removeLayer(tempPolyline);
        tempPolyline = null;
    }
    
    // Create final polygon
    const latlngs = fenceCoordinates.map(p => [p.lat, p.lng]);
    fencePolygon = L.polygon(latlngs, {
        color: '#667eea',
        fillColor: '#667eea',
        fillOpacity: 0.2,
        weight: 3
    }).addTo(drawnItems);
    
    // Reset button
    drawFenceBtn.textContent = 'Draw Fence';
    drawFenceBtn.classList.remove('drawing');
    
    updateFenceStatus('ready');
    showToast(`Geofence created with ${fenceCoordinates.length} vertices!`, 'success');
}

// Clear fence
function clearFence() {
    // Clear temp drawing items
    tempMarkers.forEach(m => map.removeLayer(m));
    tempMarkers = [];
    tempFencePoints = [];
    if (tempPolyline) {
        map.removeLayer(tempPolyline);
        tempPolyline = null;
    }
    
    // Clear fence
    drawnItems.clearLayers();
    fencePolygon = null;
    fenceCoordinates = [];
    isDrawingFence = false;
    
    // Reset button
    drawFenceBtn.textContent = '✏️ Draw Fence';
    drawFenceBtn.classList.remove('btn-primary');
    drawFenceBtn.classList.add('btn-outline');
    
    if (isTracking) {
        stopTracking();
    }
    hideAlert();
    updateFenceStatus('none');
}

// Update fence status display
function updateFenceStatus(status) {
    switch(status) {
        case 'none':
            statusIndicator.textContent = '●';
            statusText.textContent = 'No fence drawn';
            fenceStatus.className = 'fence-status';
            break;
        case 'ready':
            statusIndicator.textContent = '●';
            statusText.textContent = `Fence ready (${fenceCoordinates.length} vertices)`;
            fenceStatus.className = 'fence-status';
            break;
        case 'inside':
            statusIndicator.textContent = '●';
            statusText.textContent = 'Object is INSIDE the fence';
            fenceStatus.className = 'fence-status inside';
            break;
        case 'outside':
            statusIndicator.textContent = '●';
            statusText.textContent = 'ALERT: Object is OUTSIDE the fence!';
            fenceStatus.className = 'fence-status outside';
            break;
    }
}

// Start tracking simulation
function startTracking() {
    if (fenceCoordinates.length < 3) {
        showToast('Please draw a fence first!', 'error');
        return;
    }
    
    isTracking = true;
    isInsideFence = true;
    startTrackingBtn.style.display = 'none';
    stopTrackingBtn.style.display = 'inline-flex';
    
    // Start at fence center
    const center = getPolygonCenter(fenceCoordinates);
    currentPosition = { lat: center.lat, lng: center.lng };
    
    // Create tracking marker
    const trackingIcon = L.divIcon({
        className: 'tracking-point',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
    });
    
    trackingMarker = L.marker([currentPosition.lat, currentPosition.lng], {
        icon: trackingIcon,
        draggable: true
    }).addTo(map);
    
    trackingMarker.bindPopup('<b>Tracking Point</b><br>Drag me to test the fence!').openPopup();
    
    // Drag events
    trackingMarker.on('drag', function(e) {
        const pos = e.target.getLatLng();
        currentPosition = { lat: pos.lat, lng: pos.lng };
        checkGeofence();
    });
    
    trackingMarker.on('dragend', function(e) {
        const pos = e.target.getLatLng();
        currentPosition = { lat: pos.lat, lng: pos.lng };
        checkGeofence();
    });
    
    // Start simulated movement
    trackingInterval = setInterval(simulateMovement, 2000);
    
    updateFenceStatus('inside');
    showToast('Tracking started! Drag the blue point to test fence breach.', 'success');
}

// Stop tracking
function stopTracking() {
    isTracking = false;
    startTrackingBtn.style.display = 'inline-flex';
    stopTrackingBtn.style.display = 'none';
    
    if (trackingInterval) {
        clearInterval(trackingInterval);
        trackingInterval = null;
    }
    
    if (trackingMarker) {
        map.removeLayer(trackingMarker);
        trackingMarker = null;
    }
    
    hideAlert();
    
    if (fenceCoordinates.length > 0) {
        updateFenceStatus('ready');
    } else {
        updateFenceStatus('none');
    }
    
    showToast('Tracking stopped', 'info');
}

// Simulate random movement
function simulateMovement() {
    if (!isTracking || !currentPosition) return;
    
    const moveFactor = 0.0008;
    const newLat = currentPosition.lat + (Math.random() - 0.5) * moveFactor * 2;
    const newLng = currentPosition.lng + (Math.random() - 0.5) * moveFactor * 2;
    
    currentPosition = { lat: newLat, lng: newLng };
    
    if (trackingMarker) {
        trackingMarker.setLatLng([newLat, newLng]);
    }
    
    checkGeofence();
}

// Check if point is inside geofence
function checkGeofence() {
    if (!currentPosition || fenceCoordinates.length < 3) return;
    
    const inside = isPointInPolygon(currentPosition, fenceCoordinates);
    
    // Update marker style
    if (trackingMarker) {
        const icon = trackingMarker.getElement();
        if (icon) {
            icon.classList.toggle('outside-fence', !inside);
        }
    }
    
    // State changed
    if (isInsideFence && !inside) {
        triggerAlert();
    } else if (!isInsideFence && inside) {
        hideAlert();
        showToast('Object returned inside the geofence', 'success');
    }
    
    isInsideFence = inside;
    updateFenceStatus(inside ? 'inside' : 'outside');
}

// Point in polygon algorithm (Ray casting)
function isPointInPolygon(point, polygon) {
    let inside = false;
    const x = point.lat;
    const y = point.lng;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lat;
        const yi = polygon[i].lng;
        const xj = polygon[j].lat;
        const yj = polygon[j].lng;
        
        if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
            inside = !inside;
        }
    }
    
    return inside;
}

// Get polygon center
function getPolygonCenter(polygon) {
    let latSum = 0, lngSum = 0;
    polygon.forEach(p => { latSum += p.lat; lngSum += p.lng; });
    return { lat: latSum / polygon.length, lng: lngSum / polygon.length };
}

// Trigger fence breach alert
function triggerAlert() {
    alertPanel.style.display = 'block';
    alertDetails.textContent = `Breach detected at ${new Date().toLocaleTimeString()}. Location: ${currentPosition.lat.toFixed(6)}, ${currentPosition.lng.toFixed(6)}`;
    
    playAlertSound();
    
    if (fencePolygon) {
        fencePolygon.setStyle({ color: '#dc3545', fillColor: '#dc3545' });
    }
    
    showToast('FENCE BREACH DETECTED!', 'error');
}

// Hide alert
function hideAlert() {
    alertPanel.style.display = 'none';
    if (fencePolygon) {
        fencePolygon.setStyle({ color: '#667eea', fillColor: '#667eea' });
    }
}

// Event Listeners
function setupEventListeners() {
    itemForm.addEventListener('submit', handleFormSubmit);
    cancelBtn.addEventListener('click', resetForm);
    refreshBtn.addEventListener('click', loadItems);
    
    // Geofence controls
    drawFenceBtn.addEventListener('click', () => {
        if (isDrawingFence) {
            finishDrawingFence();
        } else {
            startDrawingFence();
        }
    });
    clearFenceBtn.addEventListener('click', clearFence);
    startTrackingBtn.addEventListener('click', startTracking);
    stopTrackingBtn.addEventListener('click', stopTracking);
    dismissAlertBtn.addEventListener('click', hideAlert);
}

// Load all items
async function loadItems() {
    showLoading(true);
    
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch items');
        
        const items = await response.json();
        renderItems(items);
    } catch (error) {
        console.error('Error loading items:', error);
        showToast('Failed to load items', 'error');
    } finally {
        showLoading(false);
    }
}

// Render items in table
function renderItems(items) {
    itemsBody.innerHTML = '';
    
    if (!items || items.length === 0) {
        itemsTable.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    itemsTable.style.display = 'table';
    emptyState.style.display = 'none';
    
    items.forEach(item => {
        const row = document.createElement('tr');
        const hasFence = item.fenceCoordinates && item.fenceCoordinates.length > 0;
        const fenceDisplay = hasFence 
            ? `<span class="fence-badge has-fence">${item.fenceCoordinates.length} pts</span>`
            : `<span class="fence-badge no-fence">No fence</span>`;
        
        row.innerHTML = `
            <td>${escapeHtml(item.name || '-')}</td>
            <td>${escapeHtml(item.email || '-')}</td>
            <td>${escapeHtml(item.phone || '-')}</td>
            <td>${fenceDisplay}</td>
            <td class="actions-cell">
                ${hasFence ? `<button onclick="loadFence('${item.id}')" title="Load fence">Load</button>` : ''}
                <button onclick="editItem('${item.id}')">Edit</button>
                <button onclick="deleteItem('${item.id}')">Delete</button>
            </td>
        `;
        itemsBody.appendChild(row);
    });
}

// Load fence from saved item
async function loadFence(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) throw new Error('Failed to fetch item');
        
        const item = await response.json();
        
        if (item.fenceCoordinates && item.fenceCoordinates.length > 0) {
            clearFence();
            fenceCoordinates = item.fenceCoordinates;
            const latLngs = fenceCoordinates.map(c => [c.lat, c.lng]);
            
            fencePolygon = L.polygon(latLngs, {
                color: '#667eea',
                fillColor: '#667eea',
                fillOpacity: 0.2,
                weight: 3
            }).addTo(drawnItems);
            
            map.fitBounds(fencePolygon.getBounds());
            updateFenceStatus('ready');
            showToast(`Loaded fence for "${item.name}"`, 'success');
        }
    } catch (error) {
        console.error('Error loading fence:', error);
        showToast('Failed to load fence', 'error');
    }
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const item = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        phone: phoneInput.value.trim(),
        fenceCoordinates: fenceCoordinates.length > 0 ? fenceCoordinates : null
    };
    
    if (!item.name) {
        showToast('Name is required', 'error');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text').textContent = isEditing ? 'Updating...' : 'Adding...';
    
    try {
        if (isEditing) {
            item.id = itemIdInput.value;
            await updateItem(item);
        } else {
            await createItem(item);
        }
        
        resetForm();
        loadItems();
    } catch (error) {
        console.error('Error saving item:', error);
        showToast('Failed to save item', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.querySelector('.btn-text').textContent = isEditing ? 'Update Item' : 'Add Item';
    }
}

// Create new item
async function createItem(item) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
    });
    if (!response.ok) throw new Error(await response.text());
    showToast('Item saved with geofence!', 'success');
    return response.json();
}

// Update existing item
async function updateItem(item) {
    const response = await fetch(`${API_URL}/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
    });
    if (!response.ok) throw new Error(await response.text());
    showToast('Item updated!', 'success');
}

// Edit item
async function editItem(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) throw new Error('Failed to fetch item');
        
        const item = await response.json();
        
        itemIdInput.value = item.id;
        nameInput.value = item.name || '';
        emailInput.value = item.email || '';
        phoneInput.value = item.phone || '';
        
        if (item.fenceCoordinates && item.fenceCoordinates.length > 0) {
            clearFence();
            fenceCoordinates = item.fenceCoordinates;
            const latLngs = fenceCoordinates.map(c => [c.lat, c.lng]);
            
            fencePolygon = L.polygon(latLngs, {
                color: '#667eea',
                fillColor: '#667eea',
                fillOpacity: 0.2,
                weight: 3
            }).addTo(drawnItems);
            
            map.fitBounds(fencePolygon.getBounds());
            updateFenceStatus('ready');
        }
        
        isEditing = true;
        formTitle.textContent = 'Edit Item';
        submitBtn.querySelector('.btn-text').textContent = 'Update Item';
        cancelBtn.style.display = 'inline-flex';
        
        document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
        nameInput.focus();
    } catch (error) {
        console.error('Error fetching item:', error);
        showToast('Failed to load item', 'error');
    }
}

// Delete item
async function deleteItem(id) {
    if (!confirm('Delete this item and its geofence?')) return;
    
    try {
        const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete');
        showToast('Item deleted!', 'success');
        loadItems();
    } catch (error) {
        console.error('Error deleting:', error);
        showToast('Failed to delete', 'error');
    }
}

// Reset form
function resetForm() {
    itemForm.reset();
    itemIdInput.value = '';
    isEditing = false;
    formTitle.textContent = 'Add New Item';
    submitBtn.querySelector('.btn-text').textContent = 'Add Item';
    cancelBtn.style.display = 'none';
    clearFence();
}

// Show/hide loading
function showLoading(show) {
    loadingDiv.style.display = show ? 'block' : 'none';
    if (show) {
        itemsTable.style.display = 'none';
        emptyState.style.display = 'none';
    }
}

// Show toast
function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
