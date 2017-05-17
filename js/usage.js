$(function () {

    ///////////////////////////////////////////////////////////////////////////////
    // Common Functions
    ///////////////////////////////////////////////////////////////////////////////
    var parseDate = d3.time.format("%Y-%m").parse;

    // Load in all the CSVs
    $.when($.ajax(config.usagecsv), $.ajax(config.librariescsv))
        .then(function (u, l) {

            var usage = $.csv.toObjects(u[0]);
            var libs = $.csv.toObjects(l[0]);

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
            var usageDateDim = usageNdx.dimension(function (d) { return d.date; });

            var issuesTotal = removeEmpty(usageDateDim.group().reduceSum(function (d) { return d['issues']; }));
            var enquiriesTotal = removeEmpty(usageDateDim.group().reduceSum(function (d) { return d['enquiries']; }));
            var visitsTotal = removeEmpty(usageDateDim.group().reduceSum(function (d) { return d['visits']; }));

            var sessionsTotal = removeEmpty(usageDateDim.group().reduce(reduceAdd, reduceRemove, reduceInitial));
            var minDate = usageDateDim.bottom(1)[0].date;
            var maxDate = usageDateDim.top(1)[0].date;

            var usageLineChart = dc.compositeChart('#cht-usage');
            usageLineChart
                .width($('#div-usage').width())
                .height(250)
                .dimension(usageDateDim)
                .margins({ top: 40, right: 60, bottom: 30, left: 60 })
                .mouseZoomable(false)
                .shareTitle(false)
                .round(d3.time.month.round)
                .elasticX(true)
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
                        .group(enquiriesTotal, 'Enquiries')
                        .title(function (d) {
                            var value = d.value.avg ? d.value.avg : d.value;
                            if (isNaN(value)) value = 0;
                            return dateFormat(d.key) + '\n' + numberFormat(value);
                        })
                        .ordinalColors([config.colours[2]]),
                    dc.lineChart(usageLineChart)
                        .group(sessionsTotal, 'PC percentage')
                        .valueAccessor(function (p) {
                            return p.value.count > 0 ? p.value.total / p.value.count : 0;
                        })
                        .ordinalColors([config.colours[3]])
                        .useRightYAxis(true)
                ])
                .yAxisLabel('Visits. Issues. Enquiries')
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

            $('#reset-chart-usage').on('click', function () {
                e.preventDefault();
                usageLineChart.filterAll();
                dc.redrawAll();
                return false;
            });

            // Usage Year Row
            var usageYearChart = dc.rowChart("#cht-usage-year");
            var usageYearChartWidth = document.getElementById('div-usage-year').offsetWidth;
            var usageYearDim = usageNdx.dimension(function (d) { return +d.year; });
            var usageYearTotal = usageYearDim.group().reduceSum(function (d) { return d.issues; });

            usageYearChart
                .width(document.getElementById('div-usage-year').offsetWidth)
                .height(250)
                .margins({ top: 10, right: 50, bottom: 60, left: 5 })
                .group(usageYearTotal)
                .dimension(usageYearDim)
                .elasticX(true);
            
            $('#resetChartIssuesYear').on('click', function () {
                usageYearChart.filterAll();
                dc.redrawAll();
                return false;
            });

            usageYearChart.renderlet(function (chart) {
                chart.selectAll("g.axis g.tick text").attr('transform', "translate(-10, 10) rotate(315)");
            });

            var usageBranchBarChart = dc.barChart("#cht-usage-branch");
            var usageBranchDim = usageNdx.dimension(function (d) { return d.Library; });
            var usageBranchTotal = usageBranchDim.group().reduceSum(function (d) { return d['issues'] });
            usageBranchBarChart
                .width($('#div-usage-branch').width())
                .height(250)
                .margins({ top: 10, right: 50, bottom: 70, left: 60 })
                .group(usageBranchTotal)
                .dimension(usageBranchDim)
                .elasticY(true)
                .elasticX(true)
                .xUnits(dc.units.ordinal)
                .brushOn(false)
                .x(d3.scale.ordinal())
                .yAxisLabel('Issues')
                .renderHorizontalGridLines(true);

            $('#resetChartIssuesBranch').on('click', function () {
                usageRowBranchChart.filterAll();
                dc.redrawAll();
                return false;
            });
            usageBranchBarChart.renderlet(function (chart) {
                chart.selectAll("g.x text").attr('transform', "translate(-10,40) rotate(270)");
            });

            // Issues month bar chart
            var usageMonthRowChart = dc.rowChart("#cht-usage-month");
            var usageMonthDim = usageNdx.dimension(function (d) { return d.month; });
            var usageMonthTotal = usageMonthDim.group().reduceSum(function (d) { return d['issues'] });

            usageMonthRowChart
                .width(document.getElementById('div-usage-month').offsetWidth)
                .height(250)
                .label(function (d) {
                    return monthsFull[d.key];
                })
                .margins({ top: 10, right: 50, bottom: 60, left: 5 })
                .group(usageMonthTotal)
                .dimension(usageMonthDim)
                .elasticX(true);

            $('#resetChartIssuesMonth').on('click', function () {
                usageMonthRowChart.filterAll();
                dc.redrawAll();
                return false;
            });
            usageMonthRowChart.renderlet(function (chart) {
                chart.selectAll("g.axis g.tick text").attr('transform', "translate(-10, 10) rotate(315)");
            });
            
            // Issues table
            var usageTable = dc.dataTable('#tbl-usage')
            var ofs = 0, pag = 10;

            var displayUsageTable = function () {
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
            $('#div-usagetable-paging a#btn-next').on('click', function (e) { e.preventDefault(); usageTableNext(); });

            var usageTableLast = function () {
                ofs -= pag;
                updateUsageTable();
                usageTable.redraw();
            };
            $('#div-usagetable-paging a#btn-previous').on('click', function (e) { e.preventDefault(); usageTableLast(); });

            usageTable
                .dimension(usageDateDim)
                .group(function (d) { return d.year; })
                .size(Infinity)
                .columns([
                    { label: 'Name', format: function (d) { return d.Library } },
                    { label: 'Month', format: function (d) { return monthsFull[d.month] } },
                    { label: 'Issues', format: function (d) { return d.issues; } },
                    { label: 'Visits', format: function (d) { return d.visits; } },
                    { label: 'Enquiries', format: function (d) { return d.enquiries; } },
                    { label: 'PCs', format: function (d) { return d.sessions; } }
                ]);

            updateUsageTable();

            dc.renderAll();

            $(window).on('resize', function () {
                var newUsageLineWidth = document.getElementById('div-usage').offsetWidth - 40;
                var newUsageYearChartWidth = document.getElementById('div-usage-year').offsetWidth;
                var newUsageMonthChartWidth = document.getElementById('div-usage-month').offsetWidth;
                var newUsageBranchChartWidth = document.getElementById('div-usage-branch').offsetWidth;

                usageLineChart.width(newUsageLineWidth).transitionDuration(0);
                usageYearChart.width(newUsageYearChartWidth).transitionDuration(0);
                usageBranchBarChart.width(newUsageBranchChartWidth).transitionDuration(0);
                usageMonthRowChart.width(newUsageMonthChartWidth).transitionDuration(0);
                dc.renderAll();
            });
        });
});