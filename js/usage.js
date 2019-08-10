$(function () {

    var parseDate = d3.timeParse("%Y-%m");

    $.when($.ajax(config.usagecsv))
        .then(function (u) {

            var usage = $.csv.toObjects(u);

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
            var reduceAdd = function (p, v) {
                ++p.count;
                p.total += +v.sessions;
                return p;
            };

            // Function: reduceRemove
            var reduceRemove = function (p, v) {
                --p.count;
                p.total -= +v.sessions;
                return p;
            };

            // Function: reduceInitial
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

            var dataCount = dc.dataCount('.dc-data-count');
            dataCount
                .dimension(usageNdx)
                .group(usageNdx.groupAll())
                .html({
                    some: '<strong>%filter-count</strong> selected out of <strong>%total-count</strong> usage records' +
                        ' | <a href=\'javascript:dc.filterAll(); dc.renderAll();\'>Reset All</a><br/> &nbsp',
                    all: 'All records selected. Please click on the graphs to apply filters.<br/> &nbsp'
                });

            // Usage dimensions
            var usageYearDim = usageNdx.dimension(function (d) { return +d.year; });
            var usageMonthDim = usageNdx.dimension(function (d) { return d.month; });
            var usageBranchDim = usageNdx.dimension(function (d) { return d.Library; });

            /////////////////////////////////
            // Row chart: Issues and Years
            /////////////////////////////////
            var issuesYearChart = dc.rowChart("#cht-issues-year");
            var issuesYearTotal = usageYearDim.group().reduceSum(function (d) { return d.issues; });
            issuesYearChart
                .width($('#div-issues-year').width())
                .height(280)
                .margins({ top: 5, right: 0, bottom: 40, left: 5 })
                .group(issuesYearTotal)
                .ordinalColors([config.colours[0]])
                .dimension(usageYearDim)
                .ordering(function (d) { return d })
                .elasticX(true);
            $('#reset-chart-issues-year').on('click', function (e) {
                e.preventDefault();
                issuesYearChart.filterAll();
                dc.redrawAll();
                return false;
            });
            issuesYearChart.on('renderlet', function (chart) {
                chart.selectAll("g.axis g.tick text").attr('transform', "translate(-10, 10) rotate(315)");
            });

            /////////////////////////////////
            // Row chart: Issues and Months
            /////////////////////////////////
            var issuesMonthRowChart = dc.rowChart("#cht-issues-month");
            var issuesMonthTotal = usageMonthDim.group().reduceSum(function (d) { return d['issues']; });
            issuesMonthRowChart
                .width($('#div-issues-month').width())
                .height(280)
                .label(function (d) {
                    return monthsFull[d.key];
                })
                .margins({ top: 5, right: 0, bottom: 40, left: 5 })
                .group(issuesMonthTotal)
                .ordinalColors([config.colours[0]])
                .dimension(usageMonthDim)
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
            issuesMonthRowChart.on('renderlet', function (chart) {
                chart.selectAll("g.axis g.tick text").attr('transform', "translate(-10, 10) rotate(315)");
            });

            /////////////////////////////////
            // Bar chart: Issues and Branches
            /////////////////////////////////
            var issuesBranchBarChart = dc.barChart("#cht-issues-branch");
            var issuesBranchTotal = usageBranchDim.group().reduceSum(function (d) { return d['issues']; });
            issuesBranchBarChart
                .width($('#div-issues-branch').width())
                .height(280)
                .margins({ top: 5, right: 0, bottom: 80, left: 60 })
                .group(issuesBranchTotal)
                .ordinalColors([config.colours[0]])
                .dimension(usageBranchDim)
                .elasticY(true)
                .elasticX(true)
                .xUnits(dc.units.ordinal)
                .brushOn(false)
                .x(d3.scaleBand())
                .renderHorizontalGridLines(true);
            $('#reset-chart-issues-branch').on('click', function (e) {
                e.preventDefault();
                issuesBranchBarChart.filterAll();
                dc.redrawAll();
                return false;
            });
            issuesBranchBarChart.on('renderlet', function (chart) {
                chart.selectAll("g.axis.x g.tick text").attr('transform', "translate(-11, 40) rotate(270)");
            });

            /////////////////////////////////
            // Row chart: Visits and Years
            /////////////////////////////////
            var visitsYearChart = dc.rowChart("#cht-visits-year");
            var visitsYearTotal = usageYearDim.group().reduceSum(function (d) { return d.visits; });
            visitsYearChart
                .width($('#div-visits-year').width())
                .height(280)
                .margins({ top: 5, right: 0, bottom: 40, left: 5 })
                .group(visitsYearTotal)
                .ordinalColors([config.colours[1]])
                .dimension(usageYearDim)
                .ordering(function (d) { return d })
                .elasticX(true);
            $('#reset-chart-visits-year').on('click', function (e) {
                e.preventDefault();
                visitsYearChart.filterAll();
                dc.redrawAll();
                return false;
            });
            visitsYearChart.on('renderlet', function (chart) {
                chart.selectAll("g.axis g.tick text").attr('transform', "translate(-10, 10) rotate(315)");
            });

            /////////////////////////////////
            // Row chart: Visits and Months
            /////////////////////////////////
            var visitsMonthRowChart = dc.rowChart("#cht-visits-month");
            var visitsMonthTotal = usageMonthDim.group().reduceSum(function (d) { return d['visits']; });
            visitsMonthRowChart
                .width($('#div-visits-month').width())
                .height(280)
                .label(function (d) {
                    return monthsFull[d.key];
                })
                .margins({ top: 5, right: 0, bottom: 40, left: 5 })
                .group(visitsMonthTotal)
                .ordinalColors([config.colours[1]])
                .dimension(usageMonthDim)
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
            visitsMonthRowChart.on('renderlet', function (chart) {
                chart.selectAll("g.axis g.tick text").attr('transform', "translate(-10, 10) rotate(315)");
            });

            /////////////////////////////////
            // Bar chart: Visits and Branches
            /////////////////////////////////
            var visitsBranchBarChart = dc.barChart("#cht-visits-branch");
            var visitsBranchTotal = usageBranchDim.group().reduceSum(function (d) { return d['visits']; });
            visitsBranchBarChart
                .width($('#div-visits-branch').width())
                .height(280)
                .margins({ top: 5, right: 0, bottom: 80, left: 60 })
                .group(visitsBranchTotal)
                .ordinalColors([config.colours[1]])
                .dimension(usageBranchDim)
                .elasticY(true)
                .elasticX(true)
                .xUnits(dc.units.ordinal)
                .brushOn(false)
                .x(d3.scaleBand())
                .renderHorizontalGridLines(true);
            $('#reset-chart-visits-branch').on('click', function (e) {
                e.preventDefault();
                visitsBranchBarChart.filterAll();
                dc.redrawAll();
                return false;
            });
            visitsBranchBarChart.on('renderlet', function (chart) {
                chart.selectAll("g.x text").attr('transform', "translate(-13, 40) rotate(270)");
            });

            /////////////////////////////////
            // Row chart: Enquiries and Years
            /////////////////////////////////
            var enquiriesYearChart = dc.rowChart("#cht-enquiries-year");
            var enquiriesYearTotal = usageYearDim.group().reduceSum(function (d) { return d.enquiries; });
            enquiriesYearChart
                .width($('#div-enquiries-year').width())
                .height(280)
                .margins({ top: 5, right: 0, bottom: 40, left: 5 })
                .group(enquiriesYearTotal)
                .ordinalColors([config.colours[3]])
                .dimension(usageYearDim)
                .ordering(function (d) { return d })
                .elasticX(true);
            $('#reset-chart-enquiries-year').on('click', function (e) {
                e.preventDefault();
                enquiriesYearChart.filterAll();
                dc.redrawAll();
                return false;
            });
            enquiriesYearChart.on('renderlet', function (chart) {
                chart.selectAll("g.axis g.tick text").attr('transform', "translate(-10, 10) rotate(315)");
            });

            //////////////////////////////////
            // Row chart: Enquiries and Months
            //////////////////////////////////
            var enquiriesMonthRowChart = dc.rowChart("#cht-enquiries-month");
            var enquiriesMonthTotal = usageMonthDim.group().reduceSum(function (d) { return d['enquiries']; });
            enquiriesMonthRowChart
                .width($('#div-enquiries-month').width())
                .height(280)
                .label(function (d) {
                    return monthsFull[d.key];
                })
                .margins({ top: 5, right: 0, bottom: 40, left: 5 })
                .group(enquiriesMonthTotal)
                .ordinalColors([config.colours[3]])
                .dimension(usageMonthDim)
                .ordering(function (d) { return d })
                .elasticX(true);
            enquiriesMonthRowChart.filterPrinter(function (filters) {
                return filters.map(function (f) { return monthsFull[f]; }).join(', ');
            });
            $('#reset-chart-enquiries-month').on('click', function (e) {
                e.preventDefault();
                enquiriesMonthRowChart.filterAll();
                dc.redrawAll();
                return false;
            });
            enquiriesMonthRowChart.on('renderlet', function (chart) {
                chart.selectAll("g.axis g.tick text").attr('transform', "translate(-10, 10) rotate(315)");
            });

            ////////////////////////////////////
            // Bar chart: Enquiries and Branches
            ////////////////////////////////////
            var enquiriesBranchBarChart = dc.barChart("#cht-enquiries-branch");
            var enquiriesBranchTotal = usageBranchDim.group().reduceSum(function (d) { return d['enquiries']; });
            enquiriesBranchBarChart
                .width($('#div-enquiries-branch').width())
                .height(280)
                .margins({ top: 5, right: 0, bottom: 80, left: 60 })
                .group(enquiriesBranchTotal)
                .ordinalColors([config.colours[3]])
                .dimension(usageBranchDim)
                .elasticY(true)
                .elasticX(true)
                .xUnits(dc.units.ordinal)
                .brushOn(false)
                .x(d3.scaleBand())
                .renderHorizontalGridLines(true);
            $('#reset-chart-enquiries-branch').on('click', function (e) {
                e.preventDefault();
                enquiriesBranchBarChart.filterAll();
                dc.redrawAll();
                return false;
            });
            enquiriesBranchBarChart.on('renderlet', function (chart) {
                chart.selectAll("g.x text").attr('transform', "translate(-13, 40) rotate(270)");
            });

            //////////////////////////
            // Row chart: PC and Years
            //////////////////////////
            var pcYearChart = dc.rowChart("#cht-pc-year");
            var pcYearTotal = usageYearDim.group().reduce(reduceAdd, reduceRemove, reduceInitial);
            pcYearChart
                .width($('#div-pc-year').width())
                .height(280)
                .margins({ top: 5, right: 0, bottom: 40, left: 5 })
                .group(pcYearTotal)
                .valueAccessor(function (p) {
                    return p.value.count > 0 ? p.value.total / p.value.count : 0;
                })
                .ordinalColors([config.colours[2]])
                .dimension(usageYearDim)
                .ordering(function (d) { return d })
                .elasticX(true);
            $('#reset-chart-pc-year').on('click', function (e) {
                e.preventDefault();
                pcYearChart.filterAll();
                dc.redrawAll();
                return false;
            });
            pcYearChart.on('renderlet', function (chart) {
                chart.selectAll("g.axis g.tick text").attr('transform', "translate(-10, 10) rotate(315)");
            });

            ///////////////////////////
            // Row chart: PC and Months
            ///////////////////////////
            var pcMonthRowChart = dc.rowChart("#cht-pc-month");
            var pcMonthTotal = usageMonthDim.group().reduce(reduceAdd, reduceRemove, reduceInitial);
            pcMonthRowChart
                .width($('#div-pc-month').width())
                .height(280)
                .label(function (d) {
                    return monthsFull[d.key];
                })
                .margins({ top: 5, right: 0, bottom: 40, left: 5 })
                .group(pcMonthTotal)
                .valueAccessor(function (p) {
                    return p.value.count > 0 ? p.value.total / p.value.count : 0;
                })
                .ordinalColors([config.colours[2]])
                .dimension(usageMonthDim)
                .ordering(function (d) { return d })
                .elasticX(true);
            pcMonthRowChart.filterPrinter(function (filters) {
                return filters.map(function (f) { return monthsFull[f]; }).join(', ');
            });
            $('#reset-chart-pc-month').on('click', function (e) {
                e.preventDefault();
                pcMonthRowChart.filterAll();
                dc.redrawAll();
                return false;
            });
            pcMonthRowChart.on('renderlet', function (chart) {
                chart.selectAll("g.axis g.tick text").attr('transform', "translate(-10, 10) rotate(315)");
            });

            /////////////////////////////////
            // Bar chart: pc and Branches
            /////////////////////////////////
            var pcBranchBarChart = dc.barChart("#cht-pc-branch");
            var pcBranchDim = usageNdx.dimension(function (d) { return d.Library; });
            var pcBranchTotal = pcBranchDim.group().reduce(reduceAdd, reduceRemove, reduceInitial);
            pcBranchBarChart
                .width($('#div-pc-branch').width())
                .height(280)
                .margins({ top: 5, right: 0, bottom: 80, left: 60 })
                .group(pcBranchTotal)
                .valueAccessor(function (p) {
                    return p.value.count > 0 ? p.value.total / p.value.count : 0;
                })
                .ordinalColors([config.colours[2]])
                .dimension(pcBranchDim)
                .elasticY(true)
                .elasticX(true)
                .xUnits(dc.units.ordinal)
                .brushOn(false)
                .x(d3.scaleBand())
                .renderHorizontalGridLines(true);
            $('#reset-chart-pc-branch').on('click', function (e) {
                e.preventDefault();
                pcBranchBarChart.filterAll();
                dc.redrawAll();
                return false;
            });
            pcBranchBarChart.on('renderlet', function (chart) {
                chart.selectAll("g.x text").attr('transform', "translate(-13, 40) rotate(270)");
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
                    usageLineChart.width($('#div-usage').width());

                    issuesYearChart.width($('#div-issues-year').width());
                    issuesBranchBarChart.width($('#div-issues-branch').width());
                    issuesMonthRowChart.width($('#div-issues-month').width());

                    visitsYearChart.width($('#div-visits-year').width());
                    visitsBranchBarChart.width($('#div-visits-branch').width());
                    visitsMonthRowChart.width($('#div-visits-month').width());

                    enquiriesYearChart.width($('#div-enquiries-year').width());
                    enquiriesBranchBarChart.width($('#div-enquiries-branch').width());
                    enquiriesMonthRowChart.width($('#div-enquiries-month').width());

                    pcYearChart.width($('#div-pc-year').width());
                    pcBranchBarChart.width($('#div-pc-branch').width());
                    pcMonthRowChart.width($('#div-pc-month').width());

                    dc.renderAll();
                }
            });
        });
});