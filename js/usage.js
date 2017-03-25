$(function () {

    ///////////////////////////////////////////////////////////////////////////////
    // Common Functions
    ///////////////////////////////////////////////////////////////////////////////
    var parseDate = d3.time.format("%Y-%m").parse;

    ///////////////////////////////////////////////////////////////////////////////
    // Lookups
    ///////////////////////////////////////////////////////////////////////////////
    var months = ['Ja', 'Fe', 'Mr', 'Ap', 'My', 'Jn', 'Jl', 'Au', 'Se', 'Oc', 'Nv', 'De'];
    var monthsFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    // Load in all the CSVs
    $.when($.ajax(config.usageCsv), $.ajax(config.librariesCsv))
        .then(function (u, l) {

            var usage = $.csv.toObjects(u[0]);
            var libs = $.csv.toObjects(l[0]);

            // For each row in the usage CSV, format the date, year, month and sessions
            usage.forEach(function (d) {
                d.date = parseDate(d.month);
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
                            if (d.value.count == 0) return false;
                            return (d && d.value != 0);
                        });
                    }
                };
            };

            var reduceAdd = function (p, v) {
                ++p.count;
                p.total += +v.sessions;
                return p;
            };

            var reduceRemove = function (p, v) {
                --p.count;
                p.total -= +v.sessions;
                return p;
            };

            var reduceInitial = function () { return { count: 0, total: 0 } };

            var usageNdx = crossfilter(usage);

            var usageDateDim = usageNdx.dimension(function (d) {
                return d.date;
            });

            var issuesTotal = removeEmpty(usageDateDim.group().reduceSum(function (d) {
                return d['issues']
            }));

            var visitsTotal = removeEmpty(usageDateDim.group().reduceSum(function (d) {
                return d['visits']
            }));

            var sessionsTotal = removeEmpty(usageDateDim.group().reduce(reduceAdd, reduceRemove, reduceInitial));

            var minDate = usageDateDim.bottom(1)[0].date;
            var maxDate = usageDateDim.top(1)[0].date;

            // Issues table
            var usageTable = dc.dataTable('#tblUsageDetail')
            var ofs = 0, pag = 10;

            var displayUsageTable = function() {
                d3.select('#begin').text(ofs);
                d3.select('#end').text(ofs + pag - 1);
                d3.select('#last').attr('disabled', ofs - pag < 0 ? 'true' : null);
                d3.select('#next').attr('disabled', ofs + pag >= usageNdx.size() ? 'true' : null);
                d3.select('#size').text(usageNdx.size());
            }

            var updateUsageTable = function () {
                usageTable.beginSlice(ofs);
                usageTable.endSlice(ofs + pag);
                displayUsageTable();
            };

            var usageTableNext = function () {
                ofs += pag;
                updateUsageTable();
                usageTable.redraw();
            };
            $('#tblUsageDetailPaging input#btn-next').on('click', function () { usageTableNext(); });

            var usageTableLast = function () {
                ofs -= pag;
                updateUsageTable();
                usageTable.redraw();
            };
            $('#tblUsageDetailPaging input#btn-last').on('click', function () { usageTableLast(); });

            usageTable
                .dimension(usageDateDim)
                .group(function (d) { return d.year; })
                .size(Infinity)
                .columns([
                    { label: 'Name', format: function (d) { return d.Library } },
                    { label: 'Month', format: function (d) { return monthsFull[d.month] } },
                    { label: 'Issues', format: function (d) { return d.issues; } },
                    { label: 'Visits', format: function (d) { return d.visits; } },
                    { label: 'PCs', format: function (d) { return d.sessions; } }
                ]);

            updateUsageTable();

            var usageLineChart = dc.compositeChart('#chtUsageTrend');
            usageLineChart
                .width($('#divUsageTrendContainer').width())
                .height(250)
                .dimension(usageDateDim)
                .margins({ top: 40, right: 60, bottom: 30, left: 60 })
                .mouseZoomable(false)
                .shareTitle(false)
                .round(d3.time.month.round)
                .elasticX(false)
                .elasticY(true)
                .renderHorizontalGridLines(true)
                .legend(dc.legend().x(0).y(0).horizontal(true).itemHeight(15).gap(10))
                .x(d3.time.scale().domain([minDate, maxDate]))
                .compose([
                    dc.lineChart(usageLineChart)
                        .group(issuesTotal, 'Issues')
                        .ordinalColors([config.colours[0]]),
                    dc.lineChart(usageLineChart)
                        .group(visitsTotal, 'Visits')
                        .title(function (d) {
                            var value = d.value.avg ? d.value.avg : d.value;
                            if (isNaN(value)) value = 0;
                            return dateFormat(d.key) + '\n' + numberFormat(value);
                        })
                        .ordinalColors([config.colours[1]]),
                    dc.lineChart(usageLineChart)
                        .group(sessionsTotal, 'PC percentage')
                        .valueAccessor(function (p) {
                            return p.value.count > 0 ? p.value.total / p.value.count : 0;
                        })
                        .ordinalColors([config.colours[2]])
                        .useRightYAxis(true)
                ])
                .xAxisLabel('Month')
                .yAxisLabel('Visits and Issues')
                .rightYAxisLabel('Percentage PC usage');

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
            var usageYearTotal = usageYearDim.group().reduceSum(function (d) { return d.issues; });
            usageYearChart
                .width(usageYearChartWidth)
                .height(250)
                .dimension(usageYearDim)
                .group(usageYearTotal)
                .renderLabel(false)
                .renderTitle(false)
                .legend(dc.legend().x(0).y(0).itemHeight(13).gap(5))
                .innerRadius((usageYearChartWidth / 5))
                .transitionDuration(300);
            $('#resetChartIssuesYear').on('click', function () {
                usageYearChart.filterAll();
                dc.redrawAll();
                return false;
            });

            var usageBranchBarChart = dc.barChart("#chtUsageBranch");
            var usageBranchDim = usageNdx.dimension(function (d) { return d.Library; });
            var usageBranchTotal = usageBranchDim.group().reduceSum(function (d) { return d['issues'] });
            usageBranchBarChart
                .width($('#divUsageBranchContainer').width())
                .height(250)
                .margins({ top: 10, right: 50, bottom: 30, left: 60 })
                .group(usageBranchTotal)
                .dimension(usageBranchDim)
                .elasticY(true)
                .elasticX(true)
                .xUnits(dc.units.ordinal)
                .brushOn(false)
                .x(d3.scale.ordinal())
                .renderHorizontalGridLines(true);
            $('#resetChartIssuesBranch').on('click', function () {
                usageRowBranchChart.filterAll();
                dc.redrawAll();
                return false;
            });
            usageBranchBarChart.renderlet(function (chart) {
                chart.selectAll("g.x text").attr('transform', "rotate(-45)");
            });

            // Issues month bar chart
            var usageMonthBarChart = dc.barChart("#chtUsageMonth");
            var usageMonthDim = usageNdx.dimension(function (d) { return d.month; });
            var usageMonthTotal = usageMonthDim.group().reduceSum(function (d) { return d['issues'] });

            usageMonthBarChart
                .width(document.getElementById('divUsageMonthContainer').offsetWidth)
                .height(250)
                .margins({ top: 10, right: 50, bottom: 30, left: 60 })
                .group(usageMonthTotal)
                .dimension(usageMonthDim)
                .elasticY(true)
                .elasticX(true)
                .xUnits(dc.units.ordinal)
                .brushOn(false)
                .x(d3.scale.ordinal())
                .renderHorizontalGridLines(true)
                .xAxis().tickFormat(function (d) { return months[d]; });
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
                var newUsageLineWidth = document.getElementById('divUsageTrendContainer').offsetWidth - 40;
                var newUsageYearChartWidth = document.getElementById('divUsageYearContainer').offsetWidth;
                var newUsageMonthChartWidth = document.getElementById('divUsageMonthContainer').offsetWidth;
                var newUsageBranchChartWidth = document.getElementById('divUsageBranchContainer').offsetWidth;

                usageLineChart.width(newUsageLineWidth).transitionDuration(0);
                usageYearChart.width(newUsageYearChartWidth).transitionDuration(0);
                usageRowBranchChart.width(newUsageBranchChartWidth).transitionDuration(0);
                usageMonthBarChart.width(newUsageMonthChartWidth).transitionDuration(0);
                dc.renderAll();
            });
        });
});