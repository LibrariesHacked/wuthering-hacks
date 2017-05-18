$(function () {

    ///////////////////////////////////////////////////////////////////////////////
    // Common Functions
    ///////////////////////////////////////////////////////////////////////////////
    var parseDate = d3.time.format("%m-%Y").parse;

    // Load in all the CSVs.  These are the main grouping of catalogue data, and the lookups for branches and categories
    $.when($.ajax(config.catalogueGroupedCsv), $.ajax(config.catalogueBranchesCsv), $.ajax(config.catalogueCategoriesCsv))
        .then(function (c, b, ca) {

            var catalogue = $.csv.toObjects(c[0]);
            var branches = $.csv.toObjects(b[0]);
            var categories = $.csv.toObjects(ca[0]);
 
            var branchLookup = {};
            $.each(branches, function (i, x) { branchLookup[x.id] = x.branch });
            var catLookup = {};
            $.each(categories, function (i, x) { catLookup[x.id] = x.category });

            // For each row in the usage CSV, format the date, year, month and sessions
            catalogue.forEach(function (d) {
                if (!d.monthAdded) d.monthAdded = '01-1994';
                d.date = parseDate(d.monthAdded);
                d.year = d.date ? d.date.getFullYear() : null;
                d.month = d.date ? d.date.getMonth() : null;
                d.branch = toTitleCase(branchLookup[d.branchId]);
                d.category = toTitleCase(catLookup[d.categoryId]);
                d.count = +d.count;
                d.price = +d.price;
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

            var catalogueNdx = crossfilter(catalogue);
            var catalogueDateDim = catalogueNdx.dimension(function (d) { return d.date; });
            var itemsTotal = removeEmpty(catalogueDateDim.group().reduceSum(function (d) { return d['count'] }));
            var priceTotal = removeEmpty(catalogueDateDim.group().reduceSum(function (d) { return d['price'] }));

            // Min and max date values - used in the line chart.
            var minDate = catalogueDateDim.bottom(1)[0].date;
            var maxDate = catalogueDateDim.top(1)[0].date;

            var catalogueLineChart = dc.compositeChart("#cht-catalogue");
            var catalogueLineChartWidth = document.getElementById('div-catalogue').offsetWidth - 40;
            catalogueLineChart
                .width(catalogueLineChartWidth)
                .height(250)
                .dimension(catalogueDateDim)
                .margins({ top: 40, right: 5, bottom: 20, left: 60 })
                .mouseZoomable(false)
                .shareTitle(false)
                .round(d3.time.month.round)
                .elasticX(true)
                .elasticY(true)
                .renderHorizontalGridLines(true)
                .legend(dc.legend().x(0).y(0).horizontal(true).itemHeight(15).gap(10))
                .x(d3.time.scale().domain([minDate, maxDate]))
                .compose([
                    dc.lineChart(catalogueLineChart)
                        .group(itemsTotal, 'Added')
                        .ordinalColors([config.colours[0]]),
                    dc.lineChart(catalogueLineChart)
                        .group(priceTotal, 'Cost')
                        .title(function (d) {
                            var value = d.value.avg ? d.value.avg : d.value;
                            if (isNaN(value)) value = 0;
                            return dateFormat(d.key) + "\n" + numberFormat(value);
                        })
                        .ordinalColors([config.colours[1]])
                ])
                .yAxisLabel("Items and cost");

            // There seems to be a bug with composite charts.
            catalogueLineChart._brushing = function () {
                var extent = catalogueLineChart.extendBrush();
                var rangedFilter = null;
                if (!catalogueLineChart.brushIsEmpty(extent)) rangedFilter = dc.filters.RangedFilter(extent[0], extent[1]);
                dc.events.trigger(function () {
                    if (!rangedFilter) {
                        catalogueLineChart.filter(null);
                    } else {
                        catalogueLineChart.replaceFilter(rangedFilter);
                    }
                    catalogueLineChart.redrawGroup();
                }, dc.constants.EVENT_DELAY);
            };

            $('#reset-chart-catalogue').on('click', function (e) {
                e.preventDefault();
                catalogueLineChart.filterAll();
                dc.redrawAll();
                return false;
            });

            var catalogueCategoryChart = dc.barChart("#cht-catalogue-category");
            var catalogueCategoryDim = catalogueNdx.dimension(function (d) { return d.category; });
            var catalogueCategoryTotal = catalogueCategoryDim.group().reduceSum(function (d) { return d['count'] });
            catalogueCategoryChart
                .width(document.getElementById('div-catalogue-category').offsetWidth)
                .height(300)
                .margins({ top: 5, right: 5, bottom: 120, left: 60 })
                .group(catalogueCategoryTotal)
                .dimension(catalogueCategoryDim)
                .elasticY(true)
                .elasticX(true)
                .xUnits(dc.units.ordinal)
                .brushOn(false)
                .x(d3.scale.ordinal())
                .renderHorizontalGridLines(true)
                .xAxis().tickFormat(function (d) { return d; });

            catalogueCategoryChart.renderlet(function (chart) {
                chart.selectAll("g.axis.x g.tick text").attr('transform', "translate(-13, 7) rotate(270)");
            });

            $('#resetChartCatalogueCategory').on('click', function () {
                catalogueRowBranchChart.filterAll();
                dc.redrawAll();
                return false;
            });

            // Catalogue month bar chart
            var catalogueMonthBarChart = dc.rowChart("#cht-catalogue-month");
            var catalogueMonthDim = catalogueNdx.dimension(function (d) { return d.month; });
            var catalogueMonthTotal = catalogueMonthDim.group().reduceSum(function (d) { return d['count'] });

            catalogueMonthBarChart
                .width(document.getElementById('div-catalogue-month').offsetWidth)
                .height(250)
                .label(function (d) {
                    return monthsFull[d.key];
                })
                .margins({ top: 5, right: 5, bottom: 60, left: 5 })
                .group(catalogueMonthTotal)
                .dimension(catalogueMonthDim)
                .elasticX(true);

            catalogueMonthBarChart.renderlet(function (chart) {
                chart.selectAll("g.axis g.tick text").attr('transform', "translate(-10, 20) rotate(270)");
            });

            $('#resetChartCatalogueMonth').on('click', function (e) {
                e.preventDefault();
                catalogueMonthBarChart.filterAll();
                dc.redrawAll();
                return false;
            });

            // Catalogue Year Row
            var catalogueYearChart = dc.barChart("#cht-catalogue-year");
            var catalogueYearChartWidth = document.getElementById('div-catalogue-year').offsetWidth;
            var catalogueYearDim = catalogueNdx.dimension(function (d) { return +d.year; });
            var catalogueYearTotal = catalogueYearDim.group().reduceSum(function (d) { return d.count; });
            catalogueYearChart
                .width(document.getElementById('div-catalogue-year').offsetWidth)
                .height(300)
                .margins({ top: 10, right: 50, bottom: 30, left: 60 })
                .group(catalogueYearTotal)
                .dimension(catalogueYearDim)
                .elasticY(true)
                .elasticX(true)
                .xUnits(dc.units.ordinal)
                .brushOn(false)
                .x(d3.scale.ordinal())
                .renderHorizontalGridLines(true)
                .xAxis().tickFormat(function (d) { return d; });

            catalogueYearChart.renderlet(function (chart) {
                chart.selectAll("g.axis.x g.tick text").attr('transform', "translate(-13, 20) rotate(270)");
            });

            $('#reset-chart-catalogue-year').on('click', function (e) {
                e.preventDefault();
                catalogueYearChart.filterAll();
                dc.redrawAll();
                return false;
            });

            var catalogueRowBranchChart = dc.barChart("#cht-catalogue-branch");
            var catalogueBranchDim = catalogueNdx.dimension(function (d) { return d.branch; });
            var catalogueBranchTotal = catalogueBranchDim.group().reduceSum(function (d) { return d['count'] });
            catalogueRowBranchChart
                .width(document.getElementById('div-catalogue-branch').offsetWidth)
                .height(300)
                .margins({ top: 10, right: 50, bottom: 110, left: 60 })
                .group(catalogueBranchTotal)
                .dimension(catalogueBranchDim)
                .elasticY(true)
                .elasticX(true)
                .xUnits(dc.units.ordinal)
                .brushOn(false)
                .x(d3.scale.ordinal())
                .renderHorizontalGridLines(true)
                .xAxis().tickFormat(function (d) { return d; });

            catalogueRowBranchChart.renderlet(function (chart) {
                chart.selectAll("g.axis.x g.tick text").attr('transform', "translate(-11, 10) rotate(270)");
            });

            $('#resetChartCatalogueBranch').on('click', function () {
                catalogueRowBranchChart.filterAll();
                dc.redrawAll();
                return false;
            });

            // Issues table
            var catalogueTable = dc.dataTable('#tbl-catalogue-detail');
            catalogueTable
                .dimension(catalogueDateDim)
                .group(function (d) { return d.year; })
                .columns([
                    { label: 'Branch', format: function (d) { return d.branch } },
                    { label: 'Month added', format: function (d) { return monthsFull[d.month] } },
                    { label: 'Category', format: function (d) { return d.category; } },
                    { label: 'Count', format: function (d) { return d.count; } },
                    { label: 'Price', format: function (d) { return d.price; } }
                ]);

            dc.renderAll();

            $(window).on('resize', function () {
                catalogueLineChart.width(document.getElementById('div-catalogue').offsetWidth - 40).transitionDuration(0);
                catalogueYearChart.width(document.getElementById('div-catalogue-year').offsetWidth).transitionDuration(0);
                catalogueRowBranchChart.width(document.getElementById('div-catalogue-branch').offsetWidth).transitionDuration(0);
                catalogueMonthBarChart.width(document.getElementById('div-catalogue-month').offsetWidth).transitionDuration(0);
                dc.renderAll();
            });
        });
});