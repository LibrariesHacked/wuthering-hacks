$(function () {

    ///////////////////////////////////////////////////////////////////////////////
    // Common Functions
    ///////////////////////////////////////////////////////////////////////////////
    var parseDate = d3.time.format("%Y-%m").parse;

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
                    one: '<small>Issues</small><br/><span class="big strong colour1">%number</span>',
                    some: '<small>Issues</small><br/><span class="big strong colour1">%number</span>',
                    none: '<small>Issues</small><br/><span class="big strong colour1">None</span>'
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
                    one: '<small>Visits</small><br/><span class="big strong colour2">%number</span>',
                    some: '<small>Visits</small><br/><span class="big strong colour2">%number</span>',
                    none: '<small>Visits</small><br/><span class="big strong colour2">None</span>'
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
                    one: '<small>Enquiries</small><br/><span class="big strong colour3">%number</span>',
                    some: '<small>Enquiries</small><br/><span class="big strong colour3">%number</span>',
                    none: '<small>Enquiries</small><br/><span class="big strong colour3">None</span>'
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
                    one: '<small>PC utilisation</small><br/><span class="big strong colour4">%number%</span>',
                    some: '<small>PC utilisation</small><br/><span class="big strong colour4">%number%</span>',
                    none: '<small>PC utilisation</small><br/><span class="big strong colour4">None</span>'
                })
                .group(pcNumGroup);

            /////////////////////////////////
            // Line chart: Usage over time
            /////////////////////////////////
            var minDate = usageDateDim.bottom(1)[0].date;
            var maxDate = usageDateDim.top(1)[0].date;
            var usageLineChart = dc.compositeChart('#cht-usage');
            usageLineChart
                .width($('#div-usage').width())
                .height(250)
                .dimension(usageDateDim)
                .margins({ top: 50, right: 60, bottom: 30, left: 60 })
                .clipPadding(10)
                .mouseZoomable(false)
                .shareTitle(false)
                .shareColors(true)
                .round(d3.time.month.round)
                .elasticX(true)
                .elasticY(true)
                .renderHorizontalGridLines(true)
                .legend(dc.legend().x(0).y(0).horizontal(true).itemHeight(20).gap(15))
                .x(d3.time.scale().domain([minDate, maxDate]))
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

            $('#reset-chart-usage').on('click', function (e) {
                e.preventDefault();
                usageLineChart.filterAll();
                updateUsageTable();
                dc.redrawAll();
                return false;
            });

            /////////////////////////////////
            // Row chart: Issues and Years
            /////////////////////////////////
            var usageYearChart = dc.rowChart("#cht-usage-year");
            var usageYearChartWidth = document.getElementById('div-usage-year').offsetWidth;
            var usageYearDim = usageNdx.dimension(function (d) { return +d.year; });
            var usageYearTotal = usageYearDim.group().reduceSum(function (d) { return d.issues; });
            usageYearChart
                .width(document.getElementById('div-usage-year').offsetWidth)
                .height(300)
                .margins({ top: 5, right: 0, bottom: 40, left: 5 })
                .group(usageYearTotal)
                .ordinalColors([config.colours[0]])
                .dimension(usageYearDim)
                .ordering(function (d) { return d })
                .elasticX(true);

            $('#reset-chart-year').on('click', function (e) {
                e.preventDefault();
                usageYearChart.filterAll();
                updateUsageTable();
                dc.redrawAll();
                return false;
            });

            usageYearChart.renderlet(function (chart) {
                chart.selectAll("g.axis g.tick text").attr('transform', "translate(-10, 10) rotate(315)");
                chart.selectAll(".row rect").each(function (d, i) {
                    var colour = d3.select(this).attr('fill');
                    d3.select(this).attr('style', 'stroke-width:1; stroke:' + colour);
                })
            });

            /////////////////////////////////
            // Row chart: Issues and Months
            /////////////////////////////////
            var usageMonthRowChart = dc.rowChart("#cht-usage-month");
            var usageMonthDim = usageNdx.dimension(function (d) { return d.month; });
            var usageMonthTotal = usageMonthDim.group().reduceSum(function (d) { return d['issues']; });

            usageMonthRowChart
                .width(document.getElementById('div-usage-month').offsetWidth)
                .height(300)
                .label(function (d) {
                    return monthsFull[d.key];
                })
                .margins({ top: 5, right: 0, bottom: 40, left: 5 })
                .group(usageMonthTotal)
                .ordinalColors([config.colours[0]])
                .dimension(usageMonthDim)
                .ordering(function (d) { return d })
                .elasticX(true);

            usageMonthRowChart.filterPrinter(function (filters) {
                return filters.map(function (f) { return monthsFull[f]; }).join(', ');
            });

            $('#reset-chart-month').on('click', function (e) {
                e.preventDefault();
                usageMonthRowChart.filterAll();
                updateUsageTable();
                dc.redrawAll();
                return false;
            });
            usageMonthRowChart.renderlet(function (chart) {
                chart.selectAll("g.axis g.tick text").attr('transform', "translate(-10, 10) rotate(315)");
                chart.selectAll(".row rect").each(function (d, i) {
                    var colour = d3.select(this).attr('fill');
                    d3.select(this).attr('style', 'stroke-width:1; stroke:' + colour);
                })
            });

            /////////////////////////////////
            // Bar chart: Issues and Branches
            /////////////////////////////////
            var usageBranchBarChart = dc.barChart("#cht-usage-branch");
            var usageBranchDim = usageNdx.dimension(function (d) { return d.Library; });
            var usageBranchTotal = usageBranchDim.group().reduceSum(function (d) { return d['issues']; });
            usageBranchBarChart
                .width($('#div-usage-branch').width())
                .height(300)
                .margins({ top: 5, right: 0, bottom: 80, left: 60 })
                .group(usageBranchTotal)
                .ordinalColors([config.colours[0]])
                .dimension(usageBranchDim)
                .elasticY(true)
                .elasticX(true)
                .xUnits(dc.units.ordinal)
                .brushOn(false)
                .x(d3.scale.ordinal())
                .yAxisLabel('Issues')
                .renderHorizontalGridLines(true);

            $('#reset-chart-branch').on('click', function (e) {
                e.preventDefault();
                usageBranchBarChart.filterAll();
                updateUsageTable();
                dc.redrawAll();
                return false;
            });
            usageBranchBarChart.renderlet(function (chart) {
                chart.selectAll("g.x text").attr('transform', "translate(-13,10) rotate(270)");
                chart.selectAll(".column rect").each(function (d, i) {
                    var colour = d3.select(this).attr('fill');
                    d3.select(this).attr('style', 'stroke-width:1; stroke:' + colour);
                })
            });


            /////////////////////////////////
            // Table: All data
            /////////////////////////////////
            var dataCount = dc.dataCount('.dc-data-count');
            dataCount
                .dimension(usageNdx)
                .group(usageNdx.groupAll())
                .html({
                    some: '<strong>%filter-count</strong> selected out of <strong>%total-count</strong> usage records' +
                    ' | <a href=\'javascript:dc.filterAll(); dc.renderAll();\'>Reset All</a><br/> &nbsp',
                    all: 'All records selected. Please click on the graphs to apply filters.<br/> &nbsp'
                });

            var usageTable = dc.dataTable('#tbl-usage');
            var ofs = 0, pag = 10;

            var displayUsageTable = function () {
                d3.select('#begin').text(ofs);
                d3.select('#end').text(ofs + pag - 1);
                d3.select('#btn-previous').attr('disabled', ofs - pag < 0 ? 'true' : null);
                d3.select('#btn-next').attr('disabled', ofs + pag >= usageNdx.size() ? 'true' : null);
            };

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
                    { label: 'Name', format: function (d) { return d.Library; } },
                    { label: 'Month', format: function (d) { return monthsFull[d.month]; } },
                    { label: 'Issues', format: function (d) { return d.issues; } },
                    { label: 'Visits', format: function (d) { return d.visits; } },
                    { label: 'Enquiries', format: function (d) { return d.enquiries; } },
                    { label: 'PC Utilisation', format: function (d) { return d.sessions + '%'; } }
                ]);

            updateUsageTable();

            // Startup: Render all the charts
            dc.renderAll();

            // Hide the loading spinner
            $('#loader').hide();

            // Event: Resize Window.  Resize all the charts based on their new container widths.
            $(window).on('resize', function () {
                usageLineChart.width(document.getElementById('div-usage').offsetWidth);
                usageYearChart.width(document.getElementById('div-usage-year').offsetWidth);
                usageBranchBarChart.width(document.getElementById('div-usage-branch').offsetWidth);
                usageMonthRowChart.width(document.getElementById('div-usage-month').offsetWidth);
                dc.renderAll();
            });
        });
});