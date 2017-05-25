///////////////////////////////////////////////////////////////////////////////
// Lookups
///////////////////////////////////////////////////////////////////////////////
var daysFull = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
var months = ['Ja', 'Fe', 'Mr', 'Ap', 'My', 'Jn', 'Jl', 'Au', 'Se', 'Oc', 'Nv', 'De'];
var monthsFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

var config = {
    colours: ['#0275d8', '#5cb85c', '#5bc0de', '#d9534f', '#ec971f', '#292b2c'],
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
    mapTiles: 'http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    mapAttribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
};

var toTitleCase = function (str) {
    return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
}