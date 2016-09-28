$(function () {

    ///////////////////////////////////////////////////////////////////////////////
    // Common Functions
    //
    ///////////////////////////////////////////////////////////////////////////////
    var parseDate = d3.time.format("%Y-%m").parse;

    ///////////////////////////////////////////////////////////////////////////////
    // Library Locations.
    // The locations are defined in a file called [publisher]_locations.csv
    ///////////////////////////////////////////////////////////////////////////////

    // Set up the library locations map.
    
    var map = L.map('divMap', { scrollWheelZoom: false, center: [52, -2], zoom: 6 });
    L.tileLayer(config.mapTiles, { attribution: config.mapAttribution }).addTo(map);
    var libMarkersGroup = new L.featureGroup([]).addTo(map);

    /////////////////////////////////////////////////////////////////////////////////////////////
    // Map Events
    /////////////////////////////////////////////////////////////////////////////////////////////
    var markerClick = function (e) {
        $('#hBranchTitle').text(e.target.libData['Library'] + " Library");
        $('#pComputerProvision').text(e.target.libData['Computer Provision']);
        $('#pNoOfPCs').text("Number of PCs: " + e.target.libData['No of PCs']);
        $('#pWiFiProvision').text(e.target.libData['Wi-Fi Provision']);
    };

    /////////////////////////////////////////////////////////////////////////////////////////////
    // Libraries
    // Load the library locations data.
    // Use D3 to load in the CSV data
    // Fields are: Library,Type,Computer Provision,No of PCs,Wi-Fi Provision,Latitude,Longitude
    /////////////////////////////////////////////////////////////////////////////////////////////
    d3.csv(config.librariesCsv, function (data) {

        /////////////////////////////////////////////////////////////////////////////////////////////
        // Library extended data
        // 
        /////////////////////////////////////////////////////////////////////////////////////////////
        d3.csv(config.librariesExtendedCsv, function (extended) {
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



        /////////////////////////////////////////////////////////////////////////////////////////////
        // Library monthly usage data.
        /////////////////////////////////////////////////////////////////////////////////////////////




        /////////////////////////////////////////////////////////////////////////////////////////////
        // Library Issues
        // Issues are against each branch with a number for each month.
        /////////////////////////////////////////////////////////////////////////////////////////////

        // Load the issues data Use D3 to load in the CSV
        // Fields are: Library,2008-04,2008-05,2008-06,2008-07
        // So the data really needs to be pivoted (using melt) to Library,Month,Count
        d3.csv(config.issuesCsv, function (data) {

            // Set up the data and crossfilter to use in all the charts
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
            var issuesTotal = issuesDateDim.group().reduceSum(function(d){ return d['numIssues'] });
            var issuesMinDate = issuesDateDim.bottom(1)[0].date;
            var issuesMaxDate = issuesDateDim.top(1)[0].date;

            // Issues table
            var issuesTable = dc.dataTable('#tableIssues');
            issuesTable
                .dimension(issuesDateDim)
                .group(function (d) { return d.year; })
                .columns([
                    function (d) { return d.month },
                    function (d) { return d.numIssues; }
                ]);

            // Issues chart
            var issuesLineChart = dc.lineChart("#chartIssues");
            var issuesLineChartWidth = document.getElementById('chartIssuesContainer').offsetWidth;
            issuesLineChart
                .width(issuesLineChartWidth)
                .height(300)
                .dimension(issuesDateDim)
                .group(issuesTotal)
                .margins({ top: 10, right: 50, bottom: 30, left: 60 })
                .elasticX(false)
                .elasticY(true)
                .renderArea(true)
                .x(d3.time.scale().domain([issuesMinDate, issuesMaxDate]))
                .xUnits(2);
            $('#resetChartIssues').on('click', function () {
                issuesLineChart.filterAll();
                dc.redrawAll();
                return false;
            });
            issuesLineChart.renderlet(function (chart) {
                chart.selectAll("g.x text")
                    .attr('transform', "rotate(-65)");
            });

            // Issues Year Pie
            var issuesYearChart = dc.pieChart("#chartIssuesYear");
            var issuesYearChartWidth = document.getElementById('chartIssuesYearContainer').offsetWidth;
            var issuesYearDim = issuesNdx.dimension(function (d) { return +d.year; });
            var issuesYearTotal = issuesYearDim.group().reduceSum(function (d) { return d.numIssues; });
            issuesYearChart
                .width(issuesYearChartWidth)
                .height(300)
                .dimension(issuesYearDim)
                .group(issuesYearTotal)
                .renderLabel(false)
                .renderTitle(false)
                .legend(dc.legend().x((issuesYearChartWidth / 2) - 20).y(70).itemHeight(13).gap(5))
                .innerRadius((issuesYearChartWidth / 4))
                .transitionDuration(500);
            $('#resetChartIssuesYear').on('click', function () {
                issuesYearChart.filterAll();
                dc.redrawAll();
                return false;
            });

            // Issues branches row chart
            var issuesRowChart = dc.rowChart("#chartIssuesBranch");
            var issuesRowChartWidth = document.getElementById('chartIssuesBranchContainer').offsetWidth;
            var issuesBranchDim = issuesNdx.dimension(function (d) { return d.branch; });
            var issuesBranchTotal = issuesBranchDim.group().reduceSum(function(d) { return d['numIssues'] });
            issuesRowChart
                .width(issuesRowChartWidth)
                .height(300)
                .group(issuesBranchTotal)
                .dimension(issuesBranchDim)
                .elasticX(true)
                .xAxis().ticks(4);
            $('#resetChartIssuesBranch').on('click', function () {
                issuesRowChart.filterAll();
                dc.redrawAll();
                return false;
            });

            // Issues month bar chart
            var issuesMonthBarChart = dc.barChart("#chartIssuesMonth");
            var issuesMonthBarChartWidth = document.getElementById('chartIssuesMonthContainer').offsetWidth;
            var issuesMonthDim = issuesNdx.dimension(function (d) { return d.month; });
            var issuesMonthTotal = issuesMonthDim.group().reduceSum(function(d){ return d['numIssues'] });
            issuesMonthBarChart
                .width(issuesMonthBarChartWidth)
                .height(300)
                .margins({ top: 10, right: 50, bottom: 30, left: 60 })
                .group(issuesMonthTotal)
                .dimension(issuesMonthDim)
                .elasticY(true)
                .xUnits(dc.units.ordinal)
                .brushOn(false)
                .x(d3.scale.ordinal())
                .renderHorizontalGridLines(true);
            $('#resetChartIssuesMonth').on('click', function () {
                issuesMonthBarChart.filterAll();
                dc.redrawAll();
                return false;
            });

            $('#chartIssuesYear,#chartIssuesBranch,#chartIssuesMonth').on('click', function () {
                var issuesMinDate2 = issuesDateDim.bottom(1)[0].date;
                var issuesMaxDate2 = issuesDateDim.top(1)[0].date;
                issuesLineChart.x(d3.time.scale().domain([issuesMinDate2, issuesMaxDate2]));
                issuesLineChart.redraw();
            });
            $(window).on('resize', function () {
                var newIssuesLineChartWidth = document.getElementById('chartIssuesContainer').offsetWidth;
                var newIssuesYearChartWidth = document.getElementById('chartIssuesYearContainer').offsetWidth;
                var newIssuesRowChartWidth = document.getElementById('chartIssuesBranchContainer').offsetWidth;
                var newIssuesMonthBarChartWidth = document.getElementById('chartIssuesMonthContainer').offsetWidth;

                issuesLineChart
                    .width(newIssuesLineChartWidth)
                    .transitionDuration(0);
                issuesYearChart
                    .width(newIssuesYearChartWidth)
                    .transitionDuration(0);
                issuesRowChart
                    .width(newIssuesRowChartWidth)
                    .transitionDuration(0);
                issuesMonthBarChart
                    .width(newIssuesLineChartWidth)
                    .transitionDuration(0);
                dc.renderAll();
            });

            dc.renderAll();
        });

        /////////////////////////////////////////////////////////////////////////////////////////////
        // Visits
        // Visits are against each branch with a number for each month.
        /////////////////////////////////////////////////////////////////////////////////////////////

        // Load the visits data Use D3 to load in the CSV
        // Fields are: Library,2008-04,2008-05,2008-06,2008-07
        // So the data really needs to be pivoted (using melt) to Library,Month,Count
        d3.csv(config.visitsCsv, function (data) {

            // Set up the data and crossfilter to use in all the charts
            var visits = melt(data, ["Library"], "Date");
            visits.forEach(function (d) {
                d.date = parseDate(d.Date);
                d.numVisits = d.value;
                d.year = d.date.getFullYear();
                d.month = d.date.getMonth();
                d.branch = d.Library;
            });

            var visitsNdx = crossfilter(visits);
            var visitsDateDim = visitsNdx.dimension(function (d) { return d.date; });
            var visitsTotal = visitsDateDim.group().reduceSum(function(d){ return d['numVisits'] });
            var visitsMinDate = visitsDateDim.bottom(1)[0].date;
            var visitsMaxDate = visitsDateDim.top(1)[0].date;

            // Visits table
            var visitsTable = dc.dataTable('#tableVisits');
            visitsTable
                .dimension(visitsDateDim)
                .group(function (d) { return d.year; })
                // dynamic columns creation using an array of closures
                .columns([
                    function (d) { return d.month },
                    function (d) { return d.numVisits; }
                ]);

            // Visits chart
            var visitsLineChart = dc.lineChart("#chartVisits");
            var visitsLineChartWidth = document.getElementById('chartVisitsContainer').offsetWidth;
            visitsLineChart
                .width(visitsLineChartWidth)
                .height(300)
                .dimension(visitsDateDim)
                .group(visitsTotal)
                .margins({ top: 10, right: 50, bottom: 30, left: 60 })
                .elasticX(true)
                .elasticY(true)
                .x(d3.time.scale().domain([visitsMinDate, visitsMaxDate]));
            $('#resetChartVisits').on('click', function () {
                visitsLineChart.filterAll();
                dc.redrawAll();
                return false;
            });

            // Visits Year Pie
            var visitsYearChart = dc.pieChart("#chartVisitsYear");
            var visitsYearChartWidth = document.getElementById('chartVisitsYearContainer').offsetWidth;
            var visitsYearDim = visitsNdx.dimension(function (d) { return +d.year; });
            var visitsYearTotal = visitsYearDim.group().reduceSum(function (d) { return d.numVisits; });
            visitsYearChart
                .width(visitsYearChartWidth)
                .height(300)
                .dimension(visitsYearDim)
                .group(visitsYearTotal)
                .renderLabel(true)
                .innerRadius(10)
                .transitionDuration(500);
            $('#resetChartVisitsYear').on('click', function () {
                visitsYearChart.filterAll();
                dc.redrawAll();
                return false;
            });

            // Visits branches row chart
            var visitsRowChart = dc.rowChart("#chartVisitsBranch");
            var visitsRowChartWidth = document.getElementById('chartVisitsBranchContainer').offsetWidth;
            var visitsBranchDim = visitsNdx.dimension(function (d) { return d.branch; });
            var visitsBranchTotal = visitsBranchDim.group().reduceSum(function(d){ return d['numVisits']} );
            visitsRowChart
                .width(visitsRowChartWidth)
                .height(300)
                .group(visitsBranchTotal)
                .dimension(visitsBranchDim)
                .elasticX(true)
                .xAxis().ticks(4);
            $('#resetChartVisitsBranch').on('click', function () {
                visitsRowChart.filterAll();
                dc.redrawAll();
                return false;
            });

            // Visits month bar chart
            var visitsMonthBarChart = dc.barChart("#chartVisitsMonth");
            var visitsMonthBarChartWidth = document.getElementById('chartVisitsMonthContainer').offsetWidth;
            var visitsMonthDim = visitsNdx.dimension(function (d) { return d.month; });
            var visitsMonthTotal = visitsMonthDim.group().reduceSum(function(d){ return d['numVisits'] });
            visitsMonthBarChart
                .width(visitsMonthBarChartWidth)
                .height(300)
                .margins({ top: 10, right: 50, bottom: 30, left: 60 })
                .group(visitsMonthTotal)
                .dimension(visitsMonthDim)
                .elasticY(true)
                .xUnits(dc.units.ordinal)
                .brushOn(false)
                .x(d3.scale.ordinal())
                .renderHorizontalGridLines(true);
            $('#resetChartVisitsMonth').on('click', function () {
                visitsMonthBarChart.filterAll();
                dc.redrawAll();
                return false;
            });


            $('#chartVisitsYear,#chartVisitsBranch,#chartVisitsMonth').on('click', function () {
                var visitsMinDate2 = issuesDateDim.bottom(1)[0].date;
                var visitsMaxDate2 = issuesDateDim.top(1)[0].date;
                visitsLineChart.x(d3.time.scale().domain([visitsMinDate2, visitsMaxDate2]));
                visitsLineChart.redraw();
            });
            $(window).on('resize', function () {
                var newVisitsLineChartWidth = document.getElementById('chartVisitsContainer').offsetWidth;
                var newVisitsYearChartWidth = document.getElementById('chartVisitsYearContainer').offsetWidth;
                var newVisitsRowChartWidth = document.getElementById('chartVisitsBranchContainer').offsetWidth;
                var newVisitsMonthBarChartWidth = document.getElementById('chartVisitsMonthContainer').offsetWidth;

                visitsLineChart
                    .width(newVisitsLineChartWidth)
                    .transitionDuration(0);
                visitsYearChart
                    .width(newVisitsYearChartWidth)
                    .transitionDuration(0);
                visitsRowChart
                    .width(newVisitsRowChartWidth)
                    .transitionDuration(0);
                visitsMonthBarChart
                    .width(newVisitsLineChartWidth)
                    .transitionDuration(0);

                dc.renderAll();
            });

            dc.renderAll();
        });

        /////////////////////////////////////////////////////////////////////////////////////////////
        // PCs
        // PCs are against each branch with a number for each month.
        /////////////////////////////////////////////////////////////////////////////////////////////

        // Load the computer usage data Use D3 to load in the CSV
        // Fields are: Library,2008-04,2008-05,2008-06,2008-07
        // So the data really needs to be pivoted (using melt) to Library,Month,Count
        d3.csv(config.computersCsv, function (data) {

            // Set up the data and crossfilter to use in all the charts
            var pcs = melt(data, ["Library"], "Date");
            pcs.forEach(function (d) {
                d.date = parseDate(d.Date);
                d.numPcs = d.value.replace('%', '');
                d.year = d.date.getFullYear();
                d.month = d.date.getMonth();
                d.branch = d.Library;
            });

            var pcsNdx = crossfilter(pcs);
            var pcsDateDim = pcsNdx.dimension(function (d) { return d.date; });
            var pcsTotal = pcsDateDim.group().reduceSum(function(d) {
                return d['numPcs'];
            });
            var pcsMinDate = pcsDateDim.bottom(1)[0].date;
            var pcsMaxDate = pcsDateDim.top(1)[0].date;

            // Pcs table
            var pcsTable = dc.dataTable('#tablePcs');
            pcsTable
                .dimension(pcsDateDim)
                .group(function (d) { return d.year; })
                // dynamic columns creation using an array of closures
                .columns([
                    function (d) { return d.month },
                    function (d) { return d.numPcs; }
                ]);

            // Pcs chart
            var pcsLineChart = dc.lineChart("#chartPcs");
            var pcsLineChartWidth = document.getElementById('chartPcsContainer').offsetWidth;
            pcsLineChart
                .width(pcsLineChartWidth)
                .height(300)
                .dimension(pcsDateDim)
                .group(pcsTotal)
                .margins({ top: 10, right: 50, bottom: 30, left: 60 })
                .elasticX(true)
                .elasticY(true)
                .x(d3.time.scale().domain([pcsMinDate, pcsMaxDate]));
            $('#resetChartPcs').on('click', function () {
                pcsLineChart.filterAll();
                dc.redrawAll();
                return false;
            });

            // Pcs Year Pie
            var pcsYearChart = dc.pieChart("#chartPcsYear");
            var pcsYearChartWidth = document.getElementById('chartPcsYearContainer').offsetWidth;
            var pcsYearDim = pcsNdx.dimension(function (d) { return +d.year; });
            var pcsYearTotal = pcsYearDim.group().reduceSum(function (d) { return d.numPcs; });
            pcsYearChart
                .width(pcsYearChartWidth)
                .height(300)
                .dimension(pcsYearDim)
                .group(pcsYearTotal)
                .renderLabel(true)
                .innerRadius(10)
                .transitionDuration(500);
            $('#resetChartPcsYear').on('click', function () {
                pcsYearChart.filterAll();
                dc.redrawAll();
                return false;
            });

            // Pcs branches row chart
            var pcsRowChart = dc.rowChart("#chartPcsBranch");
            var pcsRowChartWidth = document.getElementById('chartPcsBranchContainer').offsetWidth;
            var pcsBranchDim = pcsNdx.dimension(function (d) { return d.branch; });
            var pcsBranchTotal = pcsBranchDim.group().reduceSum(function(d) { return d['numPcs'] });
            pcsRowChart
                .width(pcsRowChartWidth)
                .height(300)
                .group(pcsBranchTotal)
                .dimension(pcsBranchDim)
                .elasticX(true)
                .xAxis().ticks(4);
            $('#resetChartPcsBranch').on('click', function () {
                pcsRowChart.filterAll();
                dc.redrawAll();
                return false;
            });

            // Pcs month bar chart
            var pcsMonthBarChart = dc.barChart("#chartPcsMonth");
            var pcsMonthBarChartWidth = document.getElementById('chartPcsMonthContainer').offsetWidth;
            var pcsMonthDim = pcsNdx.dimension(function (d) { return d.month; });
            var pcsMonthTotal = pcsMonthDim.group().reduceSum(function(d){ return d['numPcs'] });
            pcsMonthBarChart
                .width(pcsMonthBarChartWidth)
                .height(300)
                .margins({ top: 10, right: 50, bottom: 30, left: 60 })
                .group(pcsMonthTotal)
                .dimension(pcsMonthDim)
                .elasticY(true)
                .xUnits(dc.units.ordinal)
                .brushOn(false)
                .x(d3.scale.ordinal())
                .renderHorizontalGridLines(true);
            $('#resetChartPcsMonth').on('click', function () {
                pcsMonthBarChart.filterAll();
                dc.redrawAll();
                return false;
            });

            $('#chartPcsYear,#chartPcsBranch,#chartPcsMonth').on('click', function () {
                var visitsMinDate2 = issuesDateDim.bottom(1)[0].date;
                var visitsMaxDate2 = issuesDateDim.top(1)[0].date;
                visitsLineChart.x(d3.time.scale().domain([visitsMinDate2, visitsMaxDate2]));
                visitsLineChart.redraw();
            });
            $(window).on('resize', function () {
                var newPcsLineChartWidth = document.getElementById('chartPcsContainer').offsetWidth;
                var newPcsYearChartWidth = document.getElementById('chartPcsYearContainer').offsetWidth;
                var newPcsRowChartWidth = document.getElementById('chartPcsBranchContainer').offsetWidth;
                var newPcsMonthBarChartWidth = document.getElementById('chartPcsMonthContainer').offsetWidth;

                pcsLineChart
                    .width(newPcsLineChartWidth)
                    .transitionDuration(0);
                pcsYearChart
                    .width(newPcsYearChartWidth)
                    .transitionDuration(0);
                pcsRowChart
                    .width(newPcsRowChartWidth)
                    .transitionDuration(0);
                pcsMonthBarChart
                    .width(newPcsLineChartWidth)
                    .transitionDuration(0);

                dc.renderAll();
            });

            dc.renderAll();
        });
    });
});