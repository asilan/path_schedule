// Note: This example requires that you consent to location sharing when
// prompted by your browser. If you see the error "The Geolocation service
// failed.", it means you probably did not give permission for the browser to
// locate you.
let map, infoWindow;
var markers = [];
var markerLabel = 1;
var goalPath;
var fieldBorder;
var navigationPath;
var ABLine;
var borderVetices = []
var ABLineMarkers =[]
var navigationPathMarkers = []

// Utility function to find cross product
// of two vectors
function CrossProduct(A)
{
	// Stores coefficient of X
	// direction of vector A[1]A[0]
	var X1 = (A[1][0] - A[0][0]);

	// Stores coefficient of Y
	// direction of vector A[1]A[0]
	var Y1 = (A[1][1] - A[0][1]);

	// Stores coefficient of X
	// direction of vector A[2]A[0]
	var X2 = (A[2][0] - A[0][0]);

	// Stores coefficient of Y
	// direction of vector A[2]A[0]
	var Y2 = (A[2][1] - A[0][1]);

	// Return cross product
	return (X1 * Y2 - Y1 * X2);
}

// Function to check if the polygon is
// convex polygon or not
function isConvex(points)
{
	// Stores count of
	// edges in polygon
	var N = points.length;

	// Stores direction of cross product
	// of previous traversed edges
	var prev = 0;

	// Stores direction of cross product
	// of current traversed edges
	var curr = 0;

	// Traverse the array
	for (var i = 0; i < N; i++) {

		// Stores three adjacent edges
		// of the polygon
		var temp= [ points[i],
				points[(i + 1) % N],
				points[(i + 2) % N] ];

		// Update curr
		curr = CrossProduct(temp);

		// If curr is not equal to 0
		if (curr != 0) {

			// If direction of cross product of
			// all adjacent edges are not same
			if (curr * prev < 0) {
				return false;
			}
			else {
				// Update curr
				prev = curr;
			}
		}
	}
	return true;
}


async function initMap() {
  const { Map } = await google.maps.importLibrary("maps");
  map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: -34.397, lng: 150.644 },
    zoom: 6,
  });
  infoWindow = new google.maps.InfoWindow();

  const locationButton = document.createElement("button");

  locationButton.textContent = "Pan to Current Location";
  locationButton.classList.add("custom-map-control-button");
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(locationButton);


if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const pos = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      map.setCenter(pos);
      map.zoom = 18;
    },
    () => {
      handleLocationError(true, infoWindow, map.getCenter());
    }
  );
}

  // let contextMenu = document.getElementById('contextMenu');
  // map.controls[google.maps.ControlPosition.TOP_CENTER].push(contextMenu);
  // contextMenu.style.display = "none";

  // google.maps.event.addListener(map, "rightclick", function(event) {
  //   showContextMenu(event);
  // });

  // function showContextMenu(event) {
  //   let contextMenu = document.getElementById('contextMenu');
  //   contextMenu.style.display = "block";
  //   contextMenu.style.position = "absolute";
  //   contextMenu.style.left = event.pixel.x + "px";
  //   contextMenu.style.top = event.pixel.y + "px";
  // }

  locationButton.addEventListener("click", () => {
    // Try HTML5 geolocation.
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          map.setCenter(pos);
          map.zoom = 18;
        },
        () => {
          handleLocationError(true, infoWindow, map.getCenter());
        }
      );
    } else {
      // Browser doesn't support Geolocation
      handleLocationError(false, infoWindow, map.getCenter());
    }
  });
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(
    browserHasGeolocation
      ? "Error: The Geolocation service failed."
      : "Error: Your browser doesn't support geolocation."
  );
  infoWindow.open(map);
}

initMap();

function drawBorderCheck() {
  if (drawBorderCheckbox.checked) {
    drawFirstRowCheckbox.checked = false;
    google.maps.event.clearListeners(map, 'click');
    google.maps.event.addListener(map, 'click', function (event) {
      // console.log("add one marker." + markerLabel.toString());
      drawBorder(event.latLng);
      // let x = event.latLng.lat();
      // let y = event.latLng.lng();
      //[x,y,n]=latLng2utm(x, y);
  });
  if (fieldBorder) {
    fieldBorder.setEditable(true);
    fieldBorder.setDraggable(true);
  }
  } else {
    google.maps.event.clearListeners(map, 'click');
    if (fieldBorder) {
      fieldBorder.setEditable(false);
      fieldBorder.setDraggable(false);
    }
  }
}


function drawFirstRowCheck() {
  if (drawFirstRowCheckbox.checked) {
    drawBorderCheckbox.checked = false;
    google.maps.event.clearListeners(map, 'click');
    if (fieldBorder) {
      fieldBorder.setEditable(false);
      fieldBorder.setDraggable(false);
    }
    google.maps.event.addListener(map, 'click', function (event) {
      // console.log("add one marker." + markerLabel.toString());
      drawFirstRow(event.latLng);
      // let x = event.latLng.lat();
      // let y = event.latLng.lng();
      //[x,y,n]=latLng2utm(x, y);
    });
    ABLineMarkers.forEach(function (marker) {
      marker.setDraggable(true);
    });
  } else {
    google.maps.event.clearListeners(map, 'click');
    ABLineMarkers.forEach(function (marker) {
      marker.setDraggable(false);
    });
  }
}
var markerLabel = 1;
function drawFirstRow(latLng)
{
  if (markerLabel > 2) {
    return;
  }
  var marker = new google.maps.Marker({
    position: latLng,
    map: map,
    label: markerLabel.toString(),
    zIndex: markerLabel - 1,
    clickable: true,
    draggable: true,
  });

  marker.addListener('dragend', function () {
      markers[this.getZIndex()] = this;

      var path = ABLine.getPath();
      path.setAt(this.getZIndex(), this.getPosition());
      // tableRef.rows[this.getZIndex() + 1].cells[1].textContent = this.getPosition().lat().toFixed(9);
      // tableRef.rows[this.getZIndex() + 1].cells[2].textContent = this.getPosition().lng().toFixed(9);
  });

  marker.addListener('drag', function () {
      markers[this.getZIndex()] = this;

      var path = ABLine.getPath();
      path.setAt(this.getZIndex(), this.getPosition());
      // Because path is an MVCArray, we can simply append a new coordinate
      // and it will automatically appear.
  });

  ABLineMarkers.push(marker);

  if (!ABLine) {
    ABLine = new google.maps.Polyline({
      path: [latLng],
      strokeColor: '#00FF00',
      strokeOpacity: 1.0,
      strokeWeight: 3,
    });
    ABLine.setMap(map);
    // ABLine.setEditable(true);
    // ABLine.setDraggable(true);
  }
  else {
    let path = ABLine.getPath();
    if (path.getLength() < 2) {
      path.insertAt(1,latLng);
    }
  }
  markerLabel++;
}

function generate_lineset(start_line, num_lines, distance) {
    // generate a set of lines parallel to start_line with same distance between each line
    // start_line: [p1, p2]
    // num_lines: number of lines to generate
    // distance: distance between each line
    // return: list of lines
    var lines = []
    for (let i = 0; i < num_lines; i++) {
        let line = [[start_line[0][0], start_line[0][1] + i * distance], [start_line[1][0], start_line[1][1] + i * distance]]
        lines.push(line)
    }
    return lines
}

function angle2matrix(theta)
{
  // rotation angle to rotation matrix
  var A = [
      [Math.cos(theta), -Math.sin(theta)],
      [Math.sin(theta), Math.cos(theta)]
  ];
  return A;
}


function coord_reverse_transform(coords, A, b) {
  // reverse transform coordinates with rotation matrix A and translation vector b
  var new_coords = [];
  for (var i = 0; i < coords.length; i++) {
      var coord = coords[i];
      var new_coord = [
          A[0][0] * (coord[0] - b[0]) + A[1][0] * (coord[1] - b[1]),
          A[0][1] * (coord[0] - b[0]) + A[1][1] * (coord[1] - b[1])
        ]
      new_coords.push(new_coord);
  }
  return new_coords;
}

function coord_transform(coords, A, b) {
  // transform coordinates with rotation matrix A and translation vector b
  var new_coords = [];
  for (var i = 0; i < coords.length; i++) {
      var coord = coords[i];
      var new_coord = [
          A[0][0] * coord[0] + A[0][1] * coord[1] + b[0],
          A[1][0] * coord[0] + A[1][1] * coord[1] + b[1]
        ]
      new_coords.push(new_coord);
  }
  return new_coords;
}

function line_intersection(line, segment) {
  var a = line[0];
  var b = line[1];
  var c = segment[0];
  var d = segment[1];
  var denominator = (b[1] - a[1]) * (d[0] - c[0]) - (a[0] - b[0]) * (c[1] - d[1]);
  if (denominator == 0) {
      return null;
  }
  var numerator1 = (a[0] - c[0]) * (d[1] - c[1]) - (a[1] - c[1]) * (d[0] - c[0]);
  var numerator2 = (a[0] - c[0]) * (b[1] - a[1]) - (a[1] - c[1]) * (b[0] - a[0]);
  var r = numerator1 / denominator;
  var s = numerator2 / denominator;
  if (s >= 0 && s <= 1) {
      return [
          a[0] + r * (b[0] - a[0]),
          a[1] + r * (b[1] - a[1])
      ];
  } else {
      return null;
  }
}

function polygon_intersection(line, polygon) {
  var intersections = [];
  var xmax = 0;
  var xmin = 0;
  var xs = [];
  for (var i = 0; i < polygon.length; i++) {
      var segment = [polygon[i], polygon[(i + 1) % polygon.length]];
      var intersect = line_intersection(line, segment);
      if (intersect) {
        xs.push(intersect[0]);
        intersections.push(intersect);
      }
  }

  xmin = Math.min(...xs);
  xmax = Math.max(...xs);

  return [intersections, xmin, xmax];
}

function generatePath() {
  if (fieldBorder && fieldBorder.getPath().getLength() > 2) {
    var path = fieldBorder.getPath();
    var vertices = path.getArray();
    var bordPolygonUTM = [];
    var utm_x, utm_y, zoneNum, zoneLetter;
    for (let i = 0; i < vertices.length; i++) {
      [utm_x, utm_y, zoneNum, zoneLetter] = fromLatLon(vertices[i].lat(), vertices[i].lng());
      bordPolygonUTM.push([utm_x, utm_y]);
    }
    var ABLineUTM = []
    path = ABLine.getPath();
    vertices = path.getArray();
    [utm_x, utm_y, zoneNum, zoneLetter] = fromLatLon(vertices[0].lat(), vertices[0].lng());
    ABLineUTM.push([utm_x, utm_y]);
    [utm_x, utm_y, zoneNum, zoneLetter] = fromLatLon(vertices[1].lat(), vertices[1].lng());
    ABLineUTM.push([utm_x, utm_y]);

    let theta = Math.atan2(ABLineUTM[1][1] - ABLineUTM[0][1], ABLineUTM[1][0] - ABLineUTM[0][0])
    let A = angle2matrix(theta)

    let bordPolygonUTMTransformed = coord_reverse_transform(bordPolygonUTM, A, ABLineUTM[0])

    let ABLineUTMTransformed = coord_reverse_transform(ABLineUTM, A, ABLineUTM[0])

    let numRows = Number(rowNum.value);
    let rowDistance = Number(rowDist.value);

    let horizontal_lines = generate_lineset(ABLineUTMTransformed, numRows, rowDistance);
    var direction = true;
    path =[]
    for (var i = 0; i < horizontal_lines.length; i++) {
      let hl = horizontal_lines[i]
      let y0 = hl[0][1]
      let y1 = hl[0][1] + rowDistance
      let [intersections, xmin, xmax] = polygon_intersection(hl, bordPolygonUTMTransformed);
      var vertice_keep
      if (intersections.length > 0) {
        if (rowDistance > 0) {
          vertice_keep = bordPolygonUTMTransformed.filter(value  => value[1] < y0 && value[1] > y1 && value[0] > xmin && value[0] < xmax)
        } else {
          vertice_keep = bordPolygonUTMTransformed.filter(value  => value[1] > y0 && value[1] < y1 && value[0] > xmin && value[0] < xmax)
        }
        if (vertice_keep.length > 0) {
          intersections = intersections.concat(vertice_keep)
        }
        if (direction)
          intersections.sort((a, b) => a[0] - b[0]);
        else
          intersections.sort((a, b) => b[0] - a[0]);
        path = path.concat(intersections)

        direction = !direction;
      }
    }

    let path_global = coord_transform(path, A, ABLineUTM[0]);
    var path_glabal_latlng = [];
    for (var i = 0; i < path_global.length; i++) {
      let latlng = toLatLon(path_global[i][0], path_global[i][1], zoneNum, zoneLetter);
      path_glabal_latlng.push(latlng);
    }
    showPathOnMap(path_glabal_latlng);
    console.log("isConvex: " + isConvex(bordPolygonUTM));
    
  }
}

function showPathOnMap(path_global) {
  if (path_global.length > 0) {

    if (navigationPath) {
      navigationPathMarkers.forEach(function (marker) {
        marker.setMap(null);
      });
      navigationPath.setMap(null);

    }
    navigationPath = new google.maps.Polyline({
      path: path_global,
      geodesic: true,
      strokeColor: '#0000FF',
      strokeOpacity: 1.0,
      strokeWeight: 3
    });
    navigationPath.setMap(map);


    for (var i = 0; i < path_global.length; i++) {
      var marker = new google.maps.Marker({
        position: path_global[i],
        map: map,
        label: (i+1).toString(),
        zIndex: i,
        clickable: true,
        draggable: true,
      });
      navigationPathMarkers.push(marker);
      marker.addListener('dragend', function () {
        navigationPathMarkers[this.getZIndex()] = this;
        let path = navigationPath.getPath();
        path.setAt(this.getZIndex(), this.getPosition());
        // tableRef.rows[this.getZIndex() + 1].cells[1].textContent = this.getPosition().lat().toFixed(9);
        // tableRef.rows[this.getZIndex() + 1].cells[2].textContent = this.getPosition().lng().toFixed(9);
      });
  
      marker.addListener('drag', function () {
        navigationPathMarkers[this.getZIndex()] = this;
        let path = navigationPath.getPath();
        path.setAt(this.getZIndex(), this.getPosition());
      });
    }
    

  }
}

function downloadMission() {
  if (navigationPath ) {
    var path = navigationPath.getPath();
    if (path.getLength() > 0) {
      var mission = "QGC WPL 110\r\n0\t1\t0\t0\t0\t0\t0\t0\t0\t0\t0\t1\r\n";
      for (var i = 0; i < path.getLength(); i++) {
        
        let latlng = path.getAt(i);
        let [utm_x, utm_y, zoneNum, zoneLetter] = fromLatLon(latlng.lat(), latlng.lng());
        let umt_x_offset = utm_x+Number(eastingOffset.value);
        let umt_y_offset = utm_y+Number(northingOffset.value);
        latlng = toLatLon(umt_x_offset, umt_y_offset, zoneNum, zoneLetter);
        mission += (i+1)+"\t0\t3\t16\t0\t0\t0\t0\t"+latlng.lat.toFixed(9)+"\t"+latlng.lng.toFixed(9)+"\t0.000000\t1\r\n";
      }
      var blob = new Blob([mission], { type: "text/plain;charset=utf-8" });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = "mission.txt";

      // Simulate a click on the link to trigger the download
      link.dispatchEvent(new MouseEvent('click'));

      // Clean up the URL object
      URL.revokeObjectURL(link.href);
    }
  }
}

window.drawBorderCheck=drawBorderCheck;
window.drawFirstRowCheck=drawFirstRowCheck;
window.generatePath=generatePath;
window.downloadMission=downloadMission;

function drawBorder(latLng) {

  // var marker = new google.maps.Marker({
  //     position: latLng,
  //     map: map,
  //     label: markerLabel.toString(),
  //     zIndex: markerLabel - 1,
  //     clickable: true,
  //     draggable: true,
  // });

  // borderVetices.push({lat: latLng.lat(), lng: latLng.lng()});
  // addRow(latLng);
  
  if (drawBorderCheckbox.checked) {
    if (!fieldBorder) {
      fieldBorder = new google.maps.Polygon({
          paths: [latLng],
          strokeColor: '#228B22',
          strokeOpacity: 1.0,
          strokeWeight: 3,
          fillColor: "#FF0000",
          fillOpacity: 0.35,
      });
      fieldBorder.setMap(map);
      fieldBorder.setEditable(true);
      fieldBorder.setDraggable(true);
    }
    else {
      var path = fieldBorder.getPath();
      path.insertAt(path.length, latLng);
    }
  }

  // var path = fieldBorder.getPath();
  // // Because path is an MVCArray, we can simply append a new coordinate
  // // and it will automatically appear.
  // path.push(latLng);

  // goals.push([latLng.lat(), latLng.lng()]);

  // marker.addListener('click', function () {

  //     // if (this.getIcon() == selectedMarkerIcon) {
  //     //     unhighlight(this.getZIndex());
  //     // }
  //     // else {
  //     //     highlight(this.getZIndex());
  //     // }
  // });

  // marker.addListener('dragend', function () {
  //     markers[this.getZIndex()] = this;

  //     var path = fieldBorder.getPath();
  //     path.setAt(this.getZIndex(), this.getPosition());
  //     // tableRef.rows[this.getZIndex() + 1].cells[1].textContent = this.getPosition().lat().toFixed(9);
  //     // tableRef.rows[this.getZIndex() + 1].cells[2].textContent = this.getPosition().lng().toFixed(9);
  // });

  // marker.addListener('drag', function () {
  //     markers[this.getZIndex()] = this;

  //     var path = fieldBorder.getPath();
  //     path.setAt(this.getZIndex(), this.getPosition());
  //     // Because path is an MVCArray, we can simply append a new coordinate
  //     // and it will automatically appear.
  // });


  // markers.push(marker);
  // markerLabel = markerLabel + 1;
}

// JavaScript program to implement
// the above approach


