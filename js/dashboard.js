$(function () {
    // Wait for jQuery to have loaded.


    /////////////////////
    // Common Functions
    //
    /////////////////////

    // ParseDate
    // Dates in the Newcastle data are in the format 2009-08
    var parseDate = d3.time.format("%Y-%m").parse;

    ///////////////////////////////////////////////////////////////////////////////
    // Library Locations.
    // The locations are defined in a file called [publisher]_locations.csv
    // The library location data uses a web service to CartoDB in order to retrieve the relevant LSOA
    ///////////////////////////////////////////////////////////////////////////////

    // Set up the library locations map.
    var layer = L.tileLayer('http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="http://cartodb.com/attributions">CartoDB</a>'
    });
    var map = L.map('divMap', {
        scrollWheelZoom: false,
        center: [52, -2],
        zoom: 6
    });
    map.addLayer(layer);
    var libMarkersGroup = new L.featureGroup([]).addTo(map);

    //////////////
    // Map Events
    //////////////
    var markerClick = function (e) {
        $('#hBranchTitle').text(e.target.libData['Library']);
        $('#pComputerProvision').text(e.target.libData['Computer Provision']);
        $('#pNoOfPCs').text(e.target.libData['No of PCs']);
        $('#pWiFiProvision').text(e.target.libData['Wi-Fi Provision']);
    };

    // Load the library locations data.
    // Use D3 to load in the CSV data
    // Fields are: Library,Type,Computer Provision,No of PCs,Wi-Fi Provision,Latitude,Longitude
    d3.csv("data/newcastle_libraries.csv", function (data) {
        $.each(data, function () {
            if (this.Latitude && this.Longitude) {
                var marker = L.marker([this.Latitude, this.Longitude], {
                    icon: L.divIcon({
                        className: 'circle',
                        iconSize: [10, 10]
                    }),
                    title: this.Library
                }).addTo(libMarkersGroup).on('click', markerClick);
                marker.libData = this;

            }
            
        });
        map.fitBounds(libMarkersGroup.getBounds());
    });

    ///////////////////////////////////////////////////////////////////////////////
    // Issues
    // Issues are against each branch with a number for each month.
    ///////////////////////////////////////////////////////////////////////////////

    // Load the issues data Use D3 to load in the CSV
    // Fields are: Library,2008-04,2008-05,2008-06,2008-07
    // So the data really needs to be pivoted (using melt) to Library,Month,Count
    d3.csv("data/newcastle_monthlyissues.csv", function (data) {

        var issues = melt(data, ["Library"], "Date");
        issues.forEach(function (d) {
            d.date = parseDate(d.Date);
            d.numIssues = d.value;
            d.year = d.date.getFullYear();
            d.month = d.date.getMonth();
            d.branch = d.Library;
        });

        var issuesNdx = crossfilter(issues);
        var issuesDateDim = issuesNdx.dimension(function (d) { return d.date; });
        var issuesTotal = issuesDateDim.group().reduceSum(dc.pluck('numIssues'));

        var issuesMinDate = issuesDateDim.bottom(1)[0].date;
        var issuesMaxDate = issuesDateDim.top(1)[0].date;

        // Issues chart
        var issuesLineChart = dc.lineChart("#chartIssues");
        var issuesLineChartWidth = document.getElementById('chartIssuesContainer').offsetWidth;
        issuesLineChart
            .width(issuesLineChartWidth)
            .height(200)
            .dimension(issuesDateDim)
            .group(issuesTotal)
            .elasticX(true)
            .elasticY(true)
            .x(d3.time.scale().domain([issuesMinDate, issuesMaxDate]));

        
        // Issues Year Pie
        var yearDim = issuesDateDim.dimension(function (d) { return +d.year; });
        var issuesYearTotal = yearDim.group().reduceSum(function (d) { return d.numIssues; });

        chartIssuesYear

        window.onresize = function (event) {
            var newIssuesLineChartWidth = document.getElementById('chartIssuesContainer').offsetWidth;
            issuesLineChart
                .width(newIssuesLineChartWidth)
                .transitionDuration(0);
            dc.renderAll();
        };


        dc.renderAll();


    });



    ///////////////////////////////////////////////////////////////////////////////
    // Membership.
    // The membership 
    ///////////////////////////////////////////////////////////////////////////////

    // Load the membership data Use D3 to load in the CSV
    // Fields are: 
    d3.csv("data/newcastle_monthlyissues.csv", function (libData) {
        //var marker = L.marker([libData.Latitude, libData.Longitude]).addTo(libMarkersGroup).on('click', markerClick);
        //marker.libData = libData;
        //map.fitBounds(libMarkersGroup.getBounds());
    });












});