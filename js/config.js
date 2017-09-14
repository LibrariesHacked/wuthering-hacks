///////////////////////////////////////////////////////////////////////////////
// Lookups
///////////////////////////////////////////////////////////////////////////////
var daysFull = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var months = ['Ja', 'Fe', 'Mr', 'Ap', 'My', 'Jn', 'Jl', 'Au', 'Se', 'Oc', 'Nv', 'De'];
var monthsFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

var config = {
    colours: ['#36A2EB', '#FF6384', '#FF9F40', '#4BC0C0', '#9966FF'],
    librariescsv: 'data/libraries.csv',
    librariesExtendedCsv: 'data/newcastle_libraries_extended.csv',
    usagecsv: 'data/dashboard_usage.csv',
    catalogueGroupedCsv: 'data/dashboard_catalogue_grouped.csv',
    catalogueBranchesCsv: 'data/dashboard_catalogue_branches.csv',
    catalogueCategoriesCsv: 'data/dashboard_catalogue_categories.csv',
    catalogueMonthsCsv: 'data/dashboard_catalogue_months.csv',
    catalogueDatesCsv: 'data/dashboard_catalogue_dates.csv',
    cataloguePublishersCsv: 'data/dashboard_catalogue_publishers.csv',
    membersCsv: 'data/newcastle_members.csv',
    postcodesGeoJson: 'data/postcodedistricts.geojson',
    mapTiles: 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    mapAttribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>',
    mapToken: 'pk.eyJ1IjoibGlicmFyaWVzaGFja2VkIiwiYSI6IlctaDdxSm8ifQ.bxf1OpyYLiriHsZN33TD2A'
};

var toTitleCase = function (str) {
    return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
}