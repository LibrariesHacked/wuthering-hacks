﻿$(function () {

    ///////////////////////////////////////////////////////////////////////////////
    // Common Functions
    ///////////////////////////////////////////////////////////////////////////////
    var parseDate = d3.time.format("%Y-%m").parse;

    // Load in all the CSVs
    $.when($.ajax(config.librariesCsv), $.ajax(config.librariesExtendedCsv), $.ajax(config.enquiriesCsv), $.ajax(config.issuesCsv), $.ajax(config.visitsCsv), $.ajax(config.computersCsv), $.ajax(config.membersCsv))
        .then(function (libs, libsExt, enquiries, iss, vis, computers, members) {
            var issues = melt($.csv.toObjects(iss[0]), ["Library"], "Date", "Issues", true);
            var visits = melt($.csv.toObjects(vis[0]), ["Library"], "Date", "Visits", true);
            var pcs = melt($.csv.toObjects(computers[0]), ["Library"], "Date", "Sessions", true);
            // Merge the usage data together
            var usage = $.map(issues, function (item) {
                var withVisits = $.extend(item, $.grep(visits, function (e) { return e.Library == item.Library && e.Date == item.Date; })[0]);
                return $.extend(withVisits, $.grep(pcs, function (e) { return e.Library == item.Library && e.Date == item.Date; })[0]);
            });

            usage.forEach(function (d) {
                d.date = parseDate(d.Date);
                d.year = d.date.getFullYear();
                d.month = d.date.getMonth();
                d.Sessions ? d.PCSessions = +d.Sessions.replace('%', '') : d.PCSessions = 0;
            });

            var usageNdx = crossfilter(usage);
            var usageDateDim = usageNdx.dimension(function (d) { return d.date; });
            var issuesTotal = usageDateDim.group().reduceSum(function (d) { return d['Issues'] });
            var visitsTotal = usageDateDim.group().reduceSum(function (d) { return d['Visits'] });
            var sessionsTotal = usageDateDim.group().reduce(reduceAdd, reduceRemove, reduceInitial);

            function reduceAdd(p, v) {
                ++p.count;
                p.total += +v.PCSessions;
                return p;
            }

            function reduceRemove(p, v) {
                --p.count;
                p.total -= +v.PCSessions;
                return p;
            }

            function reduceInitial() {
                return { count: 0, total: 0 };
            }

            var minDate = usageDateDim.bottom(1)[0].date;
            var maxDate = usageDateDim.top(1)[0].date;

            // Issues table
            var usageTable = dc.dataTable('#tblUsageDetail');
            usageTable
                .dimension(usageDateDim)
                .group(function (d) { return d.year; })
                .columns([
                    function (d) { return d.Library },
                    function (d) { return d.month },
                    function (d) { return d.Issues; },
                    function (d) { return d.Visits; },
                    function (d) { return d.Sessions; }
                ]);

            var usageLineChart = dc.compositeChart("#chtUsageTrend");
            var usageLineChartWidth = document.getElementById('divUsageTrendContainer').offsetWidth;
            usageLineChart
                .width(usageLineChartWidth)
                .height(300)
                .dimension(usageDateDim)
                .margins({ top: 20, right: 100, bottom: 30, left: 60 })
                .mouseZoomable(true)
                .shareTitle(false)
                .round(d3.time.month.round)
                .elasticX(false)
                .elasticY(true)
                .renderHorizontalGridLines(true)
                .legend(dc.legend().x(0).y(0).horizontal(true).itemHeight(13).gap(5))
                .x(d3.time.scale().domain([minDate, maxDate]))
                .compose([
                    dc.lineChart(usageLineChart)
                        .group(issuesTotal, 'Issues')
                        .interpolate("basis")
                        .ordinalColors(["red"]),
                    dc.lineChart(usageLineChart)
                        .group(visitsTotal, 'Visits')
                        .title(function (d) {
                            var value = d.value.avg ? d.value.avg : d.value;
                            if (isNaN(value)) value = 0;
                            return dateFormat(d.key) + "\n" + numberFormat(value);
                        })
                        .interpolate("basis")
                        .ordinalColors(["blue"]),
                    dc.lineChart(usageLineChart)
                        .group(sessionsTotal, 'PC percentage')
                        .interpolate("basis")
                        .valueAccessor(function (p) {
                            return p.value.count > 0 ? p.value.total / p.value.count : 0;
                        })
                        .ordinalColors(["orange"])
                        .useRightYAxis(true)
                ])
                .yAxisLabel("Visits and Issues")
                .rightYAxisLabel("Percentage PC usage");

            // There seems to be a bug with composite charts.
            usageLineChart._brushing = function () {
                var extent = usageLineChart.extendBrush();
                var rangedFilter = null;
                if (!usageLineChart.brushIsEmpty(extent)) {
                    rangedFilter = dc.filters.RangedFilter(extent[0], extent[1]);
                }
                dc.events.trigger(function () {
                    if (!rangedFilter) {
                        usageLineChart.filter(null);
                    } else {
                        usageLineChart.replaceFilter(rangedFilter);
                    }
                    usageLineChart.redrawGroup();
                }, dc.constants.EVENT_DELAY);
            };

            $('#resetChartIssues').on('click', function () {
                usageLineChart.filterAll();
                dc.redrawAll();
                return false;
            });

            // Usage Year Pie
            var usageYearChart = dc.pieChart("#chtUsageYear");
            var usageYearChartWidth = document.getElementById('divUsageYearContainer').offsetWidth;
            var usageYearDim = usageNdx.dimension(function (d) { return +d.year; });
            var usageYearTotal = usageYearDim.group().reduceSum(function (d) { return d.Issues; });
            usageYearChart
                .width(usageYearChartWidth)
                .height(300)
                .dimension(usageYearDim)
                .group(usageYearTotal)
                .renderLabel(false)
                .renderTitle(false)
                .legend(dc.legend().x((usageYearChartWidth / 2) - 20).y(70).itemHeight(13).gap(5))
                .innerRadius((usageYearChartWidth / 4))
                .transitionDuration(500);
            $('#resetChartIssuesYear').on('click', function () {
                usageYearChart.filterAll();
                dc.redrawAll();
                return false;
            });

            var usageRowBranchChart = dc.rowChart("#chtUsageBranch");
            var usageRowBranchChartWidth = document.getElementById('divUsageBranchContainer').offsetWidth;
            var usageBranchDim = usageNdx.dimension(function (d) { return d.Library; });
            var usageBranchTotal = usageBranchDim.group().reduceSum(function (d) { return d['Issues'] });
            usageRowBranchChart
                .width(usageRowBranchChartWidth)
                .height(300)
                .group(usageBranchTotal)
                .dimension(usageBranchDim)
                .elasticX(true)
                .xAxis().ticks(4);
            $('#resetChartIssuesBranch').on('click', function () {
                usageRowBranchChart.filterAll();
                dc.redrawAll();
                return false;
            });

            // Issues month bar chart
            var usageMonthBarChart = dc.barChart("#chtUsageMonth");
            var usageMonthDim = usageNdx.dimension(function (d) { return d.month; });
            var usageMonthTotal = usageMonthDim.group().reduceSum(function (d) { return d['Issues'] });
            usageMonthBarChart
                .width(document.getElementById('divUsageMonthContainer').offsetWidth)
                .height(300)
                .margins({ top: 10, right: 50, bottom: 30, left: 60 })
                .group(usageMonthTotal)
                .dimension(usageMonthDim)
                .elasticY(true)
                .xUnits(dc.units.ordinal)
                .brushOn(false)
                .x(d3.scale.ordinal())
                .renderHorizontalGridLines(true);
            $('#resetChartIssuesMonth').on('click', function () {
                usageMonthBarChart.filterAll();
                dc.redrawAll();
                return false;
            });

            dc.renderAll();

            $('#chtUsageYear,#chtUsageBranch').on('click', function () {
                var usageMinDate = usageDateDim.bottom(1)[0].date;
                var usageMaxDate = usageDateDim.top(1)[0].date;
                usageLineChart.x(d3.time.scale().domain([usageMinDate, usageMaxDate]));
                //dc.redrawAll();
                usageLineChart.redraw()
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
        });
});