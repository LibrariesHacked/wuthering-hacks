$(function () {

    ///////////////////////////////////////////////////////////////////////////////
    // Common Functions
    ///////////////////////////////////////////////////////////////////////////////
    var parseDate = d3.time.format("%m-%Y").parse;

    ///////////////////////////////////////////////////////////////////////////////
    // Lookups
    ///////////////////////////////////////////////////////////////////////////////
    var months = ['Ja', 'Fe', 'Mr', 'Ap', 'My', 'Jn', 'Jl', 'Au', 'Se', 'Oc', 'Nv', 'De'];
    var monthsFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

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
                d.date = parseDate(d.monthAdded);
                d.year = d.date ? d.date.getFullYear() : null;
                d.month = d.date ? d.date.getMonth() : null;
                d.branch = branchLookup[d.branchId];
                d.category = catLookup[d.categoryId];
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

            // Issues table
            var catalogueTable = dc.dataTable('#tblCatalogueDetail');
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

            var catalogueLineChart = dc.compositeChart("#chtCatalogueTrend");
            var catalogueLineChartWidth = document.getElementById('divCatalogueTrendContainer').offsetWidth - 40;
            catalogueLineChart
                .width(catalogueLineChartWidth)
                .height(250)
                .dimension(catalogueDateDim)
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
                    dc.lineChart(catalogueLineChart)
                        .group(itemsTotal, 'Items added')
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

            $('#resetChartIssues').on('click', function () {
                catalogueLineChart.filterAll();
                dc.redrawAll();
                return false;
            });

            // Catalogue Year Pie
            var catalogueYearChart = dc.pieChart("#chtCatalogueYear");
            var catalogueYearChartWidth = document.getElementById('divCatalogueYearContainer').offsetWidth;
            var catalogueYearDim = catalogueNdx.dimension(function (d) { return +d.year; });
            var catalogueYearTotal = catalogueYearDim.group().reduceSum(function (d) { return d.count; });
            catalogueYearChart
                .width(catalogueYearChartWidth)
                .height(250)
                .dimension(catalogueYearDim)
                .group(catalogueYearTotal)
                .renderLabel(false)
                .renderTitle(false)
                .legend(dc.legend().x(0).y(0).itemHeight(13).gap(5))
                .innerRadius((catalogueYearChartWidth / 5))
                .transitionDuration(300);

            $('#resetChartCatalogueYear').on('click', function () {
                catalogueYearChart.filterAll();
                dc.redrawAll();
                return false;
            });

            var catalogueRowBranchChart = dc.rowChart("#chtCatalogueBranch");
            var catalogueRowBranchChartWidth = document.getElementById('divCatalogueBranchContainer').offsetWidth;
            var catalogueBranchDim = catalogueNdx.dimension(function (d) { return d.branch; });
            var catalogueBranchTotal = catalogueBranchDim.group().reduceSum(function (d) { return d['count'] });
            catalogueRowBranchChart
                .width(catalogueRowBranchChartWidth)
                .height(250)
                .group(catalogueBranchTotal)
                .dimension(catalogueBranchDim)
                .elasticX(true)
                .xAxis().ticks(4);

            $('#resetChartCatalogueBranch').on('click', function () {
                catalogueRowBranchChart.filterAll();
                dc.redrawAll();
                return false;
            });

            // Catalogue month bar chart
            var catalogueMonthBarChart = dc.barChart("#chtCatalogueMonth");
            var catalogueMonthDim = catalogueNdx.dimension(function (d) { return d.month; });
            var catalogueMonthTotal = catalogueMonthDim.group().reduceSum(function (d) { return d['count'] });

            catalogueMonthBarChart
                .width(document.getElementById('divCatalogueMonthContainer').offsetWidth)
                .height(250)
                .margins({ top: 10, right: 50, bottom: 30, left: 60 })
                .group(catalogueMonthTotal)
                .dimension(catalogueMonthDim)
                .elasticY(true)
                .elasticX(true)
                .xUnits(dc.units.ordinal)
                .brushOn(false)
                .x(d3.scale.ordinal())
                .renderHorizontalGridLines(true)
                .xAxis().tickFormat(function (d) { return months[d]; });

            $('#resetChartCatalogueMonth').on('click', function () {
                catalogueMonthBarChart.filterAll();
                dc.redrawAll();
                return false;
            });

            dc.renderAll();

            $('#chtCatalogueYear, #chtCatalogueBranch').on('click', function () {
                catalogueLineChart.x(d3.time.scale().domain([catalogueDateDim.bottom(1)[0].date, catalogueDateDim.top(1)[0].date]));
                catalogueLineChart.redraw();
            });

            $(window).on('resize', function () {
                catalogueLineChart.width(document.getElementById('divCatalogueTrendContainer').offsetWidth - 40).transitionDuration(0);
                catalogueYearChart.width(document.getElementById('divCatalogueYearContainer').offsetWidth).transitionDuration(0);
                catalogueRowBranchChart.width(document.getElementById('divCatalogueBranchContainer').offsetWidth).transitionDuration(0);
                catalogueMonthBarChart.width(document.getElementById('divCatalogueMonthContainer').offsetWidth).transitionDuration(0);
                dc.renderAll();
            });
        });
});