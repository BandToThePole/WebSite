window.onload = function(){
    proj4.defs("EPSG:3031",
               "+proj=stere +lat_0=-90 +lat_ts=-71 +lon_0=0 +k=1 +x_0=0 +y_0=0 " +
               "+datum=WGS84 +units=m +no_defs");
    ol.proj.get("EPSG:3031").setExtent([-4194304, -4194304, 4194304, 4194304]);

    var map = new ol.Map({
        view: new ol.View({
            maxResolution: 8192.0,
            projection: ol.proj.get("EPSG:3031"),
            extent: [-4194304, -4194304, 4194304, 4194304],
            center: [0, 0],
            zoom: 0.5,
            maxZoom: 5,
        }),
        target: "map",
        renderer: ["canvas", "dom"],
	controls: [],
    });

    var source = new ol.source.WMTS({
        url: "//map1a.vis.earthdata.nasa.gov/wmts-antarctic/wmts.cgi?TIME=2013-12-01",
        layer: "MODIS_Terra_CorrectedReflectance_TrueColor",
        extent: [-4194304, -4194304, 4194304, 4194304],
        format: "image/jpeg",
        matrixSet: "EPSG3031_250m",

        tileGrid: new ol.tilegrid.WMTS({
            origin: [-4194304, 4194304],
            resolutions: [
                8192.0,
                4096.0,
                2048.0,
                1024.0,
                512.0,
                256.0
            ],
            matrixIds: [0, 1, 2, 3, 4, 5],
            tileSize: 512
        })
    });

    var layer = new ol.layer.Tile({source: source});

    map.addLayer(layer);
    var points = [ [0, -90], [171,-83.75],[166, -77.8] ];

    for (var i = 0; i < points.length; i++) {
	points[i] = ol.proj.transform(points[i], 'EPSG:4326', 'EPSG:3031');
    }

    var featureLine = new ol.Feature({
	geometry: new ol.geom.LineString(points)
    });

    var vectorLine = new ol.source.Vector({});
    vectorLine.addFeature(featureLine);

    var vectorLineLayer = new ol.layer.Vector({
	source: vectorLine,
	style: new ol.style.Style({
            fill: new ol.style.Fill({ color: '#00FF00', weight: 4 }),
            stroke: new ol.style.Stroke({ color: '#00FF00', width: 2 })
	})
    });

    map.addLayer(vectorLineLayer);
}
