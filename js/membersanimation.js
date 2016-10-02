$(function () {
    cartodb.createVis('map', 'https://daveroweuk.carto.com/api/v2/viz/32bc99a6-87d4-11e6-8ff3-0e3ebc282e83/viz.json', {
        shareable: true,
        title: false,
        description: false,
        search: false,
        tiles_loader: true,
        center_lat: 54,
        center_lon: -2,
        zoom: 6
    }).done(function (vis, layers) {
        var map = vis.getNativeMap();
    }).error(function (err) {
        console.log(err);
    });
});