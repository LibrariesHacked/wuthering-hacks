$(function () {

    ///////////////////////////////////////////////////////////////////////////////
    // Common Functions
    ///////////////////////////////////////////////////////////////////////////////
    var parseDate = d3.timeParse("%Y-%m");

    // Load in all the CSVs
    $.when($.ajax(config.usagecsv))
        .then(function (u) {

            var usage = $.csv.toObjects(u);

            // For each row in the usage CSV, format the date, year, month and sessions
            usage.forEach(function (d) {
                d.date = parseDate(d.month);
                d.visits = +d.visits;
                d.enquiries = +d.enquiries;
                d.issues = +d.issues;
                d.year = d.date.getFullYear();
                d.month = d.date.getMonth();
                d.sessions ? d.sessions = +d.sessions.replace('%', '') : d.sessions = 0;
            });

            // Function: removeEmpty
            // 
            var removeEmpty = function (group) {
                return {
                    all: function () {
                        return group.all().filter(function (d) {
                            if (d.value.count === 0) return false;
                            return d && d.value !== 0;
                        });
                    }
                };
            };
            // Function: reduceAdd
            // 
            var reduceAdd = function (p, v) {
                ++p.count;
                p.total += +v.sessions;
                return p;
            };
            // Function: reduceRemove
            // 
            var reduceRemove = function (p, v) {
                --p.count;
                p.total -= +v.sessions;
                return p;
            };
            // Function: reduceInitial
            // 
            var reduceInitial = function () { return { count: 0, total: 0 }; };

            var usageNdx = crossfilter(usage);
            var usageDateDim = usageNdx.dimension(function (d) { return d.date; });

            var issuesTotal = removeEmpty(usageDateDim.group().reduceSum(function (d) { return d['issues']; }));
            var enquiriesTotal = removeEmpty(usageDateDim.group().reduceSum(function (d) { return d['enquiries']; }));
            var visitsTotal = removeEmpty(usageDateDim.group().reduceSum(function (d) { return d['visits']; }));
            var sessionsTotal = removeEmpty(usageDateDim.group().reduce(reduceAdd, reduceRemove, reduceInitial));

            /////////////////////////////////
            // Number display: Issues
            /////////////////////////////////
            var issuesNumberDisplay = dc.numberDisplay('#cht-number-issues');
            var issuesNumGroup = usageNdx.groupAll().reduceSum(function (d) { return d['issues']; });
            issuesNumberDisplay
                .valueAccessor(function (d) {
                    return d;
                })
                .html({
                    one: '<small class="colour1">Issues</small><br/><span class="big strong colour1">%number</span>',
                    some: '<small class="colour1">Issues</small><br/><span class="big strong colour1">%number</span>',
                    none: '<small class="colour1">Issues</small><br/><span class="big strong colour1">None</span>'
                })
                .group(issuesNumGroup);

            /////////////////////////////////
            // Number display: Visits
            /////////////////////////////////
            var visitsNumberDisplay = dc.numberDisplay('#cht-number-visits');
            var visitsNumGroup = usageNdx.groupAll().reduceSum(function (d) { return d['visits']; });
            visitsNumberDisplay
                .valueAccessor(function (d) {
                    return d;
                })
                .html({
                    one: '<small class="colour2">Visits</small><br/><span class="big strong colour2">%number</span>',
                    some: '<small class="colour2">Visits</small><br/><span class="big strong colour2">%number</span>',
                    none: '<small class="colour2">Visits</small><br/><span class="big strong colour2">None</span>'
                })
                .group(visitsNumGroup);

            /////////////////////////////////
            // Number display: Enquiries
            /////////////////////////////////
            var enquiriesNumberDisplay = dc.numberDisplay('#cht-number-enquiries');
            var enquiriesNumGroup = usageNdx.groupAll().reduceSum(function (d) { return d['enquiries']; });
            enquiriesNumberDisplay
                .valueAccessor(function (d) {
                    return d;
                })
                .html({
                    one: '<small class="colour3">Enquiries</small><br/><span class="big strong colour3">%number</span>',
                    some: '<small class="colour3">Enquiries</small><br/><span class="big strong colour3">%number</span>',
                    none: '<small class="colour3">Enquiries</small><br/><span class="big strong colour3">None</span>'
                })
                .group(enquiriesNumGroup);

            /////////////////////////////////
            // Number display: PC Utilisation
            /////////////////////////////////
            var pcNumberDisplay = dc.numberDisplay('#cht-number-pc');
            var pcNumGroup = usageNdx.groupAll().reduce(reduceAdd, reduceRemove, reduceInitial);
            pcNumberDisplay
                .valueAccessor(function (d) {
                    return ((d.total / d.count)).toFixed(1);
                })
                .html({
                    one: '<small class="colour4">PC utilisation</small><br/><span class="big strong colour4">%number%</span>',
                    some: '<small class="colour4">PC utilisation</small><br/><span class="big strong colour4">%number%</span>',
                    none: '<small class="colour4">PC utilisation</small><br/><span class="big strong colour4">None</span>'
                })
                .group(pcNumGroup);



            /////////////////////////////////
            // Row chart: Issues and Years
            /////////////////////////////////
            var issuesYearChart = dc.rowChart("#cht-issues-year");
            var issuesYearChartWidth = document.getElementById('div-issues-year').offsetWidth;
            var issuesYearDim = usageNdx.dimension(function (d) { return +d.year; });
            var issuesYearTotal = issuesYearDim.group().reduceSum(function (d) { return d.issues; });
            issuesYearChart
                .width(issuesYearChartWidth)
                .height(280)
                .margins({ top: 5, right: 0, bottom: 40, left: 5 })
                .group(issuesYearTotal)
                .ordinalColors([config.colours[0]])
                .dimension(issuesYearDim)
                .ordering(function (d) { return d })
                .elasticX(true);
            $('#reset-chart-issues-year').on('click', function (e) {
                e.preventDefault();
                issuesYearChart.filterAll();
                dc.redrawAll();
                return false;
            });
            issuesYearChart.renderlet(function (chart) {
                chart.selectAll("g.axis g.tick text").attr('transform', "translate(-10, 10) rotate(315)");
            });

            /////////////////////////////////
            // Row chart: Issues and Months
            /////////////////////////////////
            var issuesMonthRowChart = dc.rowChart("#cht-issues-month");
            var issuesMonthDim = usageNdx.dimension(function (d) { return d.month; });
            var issuesMonthTotal = issuesMonthDim.group().reduceSum(function (d) { return d['issues']; });

            issuesMonthRowChart
                .width(document.getElementById('div-issues-month').offsetWidth)
                .height(280)
                .label(function (d) {
                    return monthsFull[d.key];
                })
                .margins({ top: 5, right: 0, bottom: 40, left: 5 })
                .group(issuesMonthTotal)
                .ordinalColors([config.colours[0]])
                .dimension(issuesMonthDim)
                .ordering(function (d) { return d })
                .elasticX(true);

            issuesMonthRowChart.filterPrinter(function (filters) {
                return filters.map(function (f) { return monthsFull[f]; }).join(', ');
            });

            $('#reset-chart-issues-month').on('click', function (e) {
                e.preventDefault();
                issuesMonthRowChart.filterAll();
                dc.redrawAll();
                return false;
            });
            issuesMonthRowChart.renderlet(function (chart) {
                chart.selectAll("g.axis g.tick text").attr('transform', "translate(-10, 10) rotate(315)");
            });

            /////////////////////////////////
            // Bar chart: Issues and Branches
            /////////////////////////////////
            var issuesBranchBarChart = dc.barChart("#cht-issues-branch");
            var issuesBranchDim = usageNdx.dimension(function (d) { return d.Library; });
            var issuesBranchTotal = issuesBranchDim.group().reduceSum(function (d) { return d['issues']; });
            issuesBranchBarChart
                .width($('#div-issues-branch').width())
                .height(280)
                .margins({ top: 5, right: 0, bottom: 80, left: 60 })
                .group(issuesBranchTotal)
                .ordinalColors([config.colours[0]])
                .dimension(issuesBranchDim)
                .elasticY(true)
                .elasticX(true)
                .xUnits(dc.units.ordinal)
                .brushOn(false)
                .x(d3.scaleBand())
                .yAxisLabel('Issues')
                .renderHorizontalGridLines(true);

            $('#reset-chart-issues-branch').on('click', function (e) {
                e.preventDefault();
                issuesBranchBarChart.filterAll();
                dc.redrawAll();
                return false;
            });
            issuesBranchBarChart.renderlet(function (chart) {
                chart.selectAll("g.x text").attr('transform', "translate(-13, 35) rotate(270)");
            });




            /////////////////////////////////
            // Row chart: visits and Years
            /////////////////////////////////
            var visitsYearChart = dc.rowChart("#cht-visits-year");
            var visitsYearChartWidth = document.getElementById('div-visits-year').offsetWidth;
            var visitsYearDim = usageNdx.dimension(function (d) { return +d.year; });
            var visitsYearTotal = visitsYearDim.group().reduceSum(function (d) { return d.visits; });
            visitsYearChart
                .width(visitsYearChartWidth)
                .height(280)
                .margins({ top: 5, right: 0, bottom: 40, left: 5 })
                .group(visitsYearTotal)
                .ordinalColors([config.colours[0]])
                .dimension(visitsYearDim)
                .ordering(function (d) { return d })
                .elasticX(true);
            $('#reset-chart-visits-year').on('click', function (e) {
                e.preventDefault();
                visitsYearChart.filterAll();
                dc.redrawAll();
                return false;
            });
            visitsYearChart.renderlet(function (chart) {
                chart.selectAll("g.axis g.tick text").attr('transform', "translate(-10, 10) rotate(315)");
            });

            /////////////////////////////////
            // Row chart: visits and Months
            /////////////////////////////////
            var visitsMonthRowChart = dc.rowChart("#cht-visits-month");
            var visitsMonthDim = usageNdx.dimension(function (d) { return d.month; });
            var visitsMonthTotal = visitsMonthDim.group().reduceSum(function (d) { return d['visits']; });

            visitsMonthRowChart
                .width(document.getElementById('div-visits-month').offsetWidth)
                .height(280)
                .label(function (d) {
                    return monthsFull[d.key];
                })
                .margins({ top: 5, right: 0, bottom: 40, left: 5 })
                .group(visitsMonthTotal)
                .ordinalColors([config.colours[0]])
                .dimension(visitsMonthDim)
                .ordering(function (d) { return d })
                .elasticX(true);

            visitsMonthRowChart.filterPrinter(function (filters) {
                return filters.map(function (f) { return monthsFull[f]; }).join(', ');
            });

            $('#reset-chart-visits-month').on('click', function (e) {
                e.preventDefault();
                visitsMonthRowChart.filterAll();
                dc.redrawAll();
                return false;
            });
            visitsMonthRowChart.renderlet(function (chart) {
                chart.selectAll("g.axis g.tick text").attr('transform', "translate(-10, 10) rotate(315)");
            });

            /////////////////////////////////
            // Bar chart: visits and Branches
            /////////////////////////////////
            var visitsBranchBarChart = dc.barChart("#cht-visits-branch");
            var visitsBranchDim = usageNdx.dimension(function (d) { return d.Library; });
            var visitsBranchTotal = visitsBranchDim.group().reduceSum(function (d) { return d['visits']; });
            visitsBranchBarChart
                .width($('#div-visits-branch').width())
                .height(280)
                .margins({ top: 5, right: 0, bottom: 80, left: 60 })
                .group(visitsBranchTotal)
                .ordinalColors([config.colours[0]])
                .dimension(visitsBranchDim)
                .elasticY(true)
                .elasticX(true)
                .xUnits(dc.units.ordinal)
                .brushOn(false)
                .x(d3.scaleBand())
                .yAxisLabel('visits')
                .renderHorizontalGridLines(true);

            $('#reset-chart-visits-branch').on('click', function (e) {
                e.preventDefault();
                visitsBranchBarChart.filterAll();
                dc.redrawAll();
                return false;
            });
            visitsBranchBarChart.renderlet(function (chart) {
                chart.selectAll("g.x text").attr('transform', "translate(-13, 35) rotate(270)");
            });






            /////////////////////////////////
            // Line chart: Usage over time
            /////////////////////////////////
            var minDate = usageDateDim.bottom(1)[0].date;
            var maxDate = usageDateDim.top(1)[0].date;
            var usageLineChart = dc.compositeChart('#cht-usage');
            usageLineChart
                .width($('#div-usage').width())
                .height(270)
                .dimension(usageDateDim)
                .margins({ top: 30, right: 50, bottom: 25, left: 60 })
                .clipPadding(10)
                .mouseZoomable(false)
                .shareTitle(false)
                .shareColors(true)
                .round(d3.timeMonth.round)
                .elasticX(true)
                .elasticY(true)
                .renderHorizontalGridLines(true)
                .legend(dc.legend().x(0).y(0).horizontal(true).itemHeight(20).gap(15))
                .x(d3.scaleTime().domain([minDate, maxDate]))
                .compose([
                    dc.lineChart(usageLineChart)
                        .group(issuesTotal, 'Issues')
                        .interpolate('monotone')
                        .colors(config.colours[0]),
                    dc.lineChart(usageLineChart)
                        .group(visitsTotal, 'Visits')
                        .interpolate('monotone')
                        .title(function (d) {
                            var value = d.value.avg ? d.value.avg : d.value;
                            if (isNaN(value)) value = 0;
                            return dateFormat(d.key) + '\n' + numberFormat(value);
                        })
                        .colors(config.colours[1]),
                    dc.lineChart(usageLineChart)
                        .group(enquiriesTotal, 'Enquiries')
                        .interpolate('monotone')
                        .title(function (d) {
                            var value = d.value.avg ? d.value.avg : d.value;
                            if (isNaN(value)) value = 0;
                            return dateFormat(d.key) + '\n' + numberFormat(value);
                        })
                        .dashStyle([0])
                        .colors(config.colours[2]),
                    dc.lineChart(usageLineChart)
                        .group(sessionsTotal, 'PC utilisation')
                        .interpolate('monotone')
                        .valueAccessor(function (p) {
                            return p.value.count > 0 ? p.value.total / p.value.count : 0;
                        })
                        .dashStyle([3, 3])
                        .useRightYAxis(true)
                ])
                .yAxisLabel('Usage count')
                .rightYAxisLabel('PC utilisation %');

            $('#reset-chart-usage').on('click', function (e) {
                e.preventDefault();
                usageLineChart.filterAll();
                dc.redrawAll();
                return false;
            });

            // Startup: Render all the charts
            dc.renderAll();

            // Hide the loading spinner
            $('#loader').hide();

            var width = $(window).width();
            // Event: Resize Window.  Resize all the charts based on their new container widths.
            $(window).on('resize', function () {
                if ($(window).width() != width) {
                    width = $(window).width();
                    usageLineChart.width(document.getElementById('div-usage').offsetWidth);
                    usageYearChart.width(document.getElementById('div-usage-year').offsetWidth);
                    usageBranchBarChart.width(document.getElementById('div-usage-branch').offsetWidth);
                    usageMonthRowChart.width(document.getElementById('div-usage-month').offsetWidth);
                    dc.renderAll();
                }
            });
        });
});