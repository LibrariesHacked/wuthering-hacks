$(function () {

    ///////////////////////////////////////////////////////////////////////////////
    // Common Functions
    ///////////////////////////////////////////////////////////////////////////////
    var parseDate = d3.time.format("%Y%m").parse;

    // Load in all the CSVs.  These are the main grouping of catalogue data, and the lookups for branches and categories
    $.when($.ajax(config.catalogueGroupedCsv), $.ajax(config.catalogueBranchesCsv), $.ajax(config.catalogueCategoriesCsv), $.ajax(config.catalogueMonthsCsv), $.ajax(config.cataloguePublishersCsv))
        .then(function (c, b, ca, m, p) {

            var catalogue = $.csv.toObjects(c[0]);
            var branches = $.csv.toObjects(b[0]);
            var categories = $.csv.toObjects(ca[0]);
            var months = $.csv.toObjects(m[0]);
            var publishers = $.csv.toObjects(p[0]);

            var branchLookup = {};
            $.each(branches, function (i, x) { branchLookup[x.id] = x.branch });
            var catLookup = {};
            $.each(categories, function (i, x) { catLookup[x.id] = x.category });
            var monthLookup = {};
            $.each(months, function (i, x) { monthLookup[x.id] = x.month });
            var publisherLookup = {};
            $.each(publishers, function (i, x) { publisherLookup[x.id] = x.publisher });

            // For each row in the usage CSV, format the date, year, month and sessions
            catalogue.forEach(function (d) {
                d.dateAdded = monthLookup[d.monthAddedId];
                d.date = parseDate(d.dateAdded);
                d.year = d.date ? d.date.getFullYear() : null;
                d.day = d.dayAdded ? d.dayAdded : null;
                d.month = d.date ? d.date.getMonth() : null;
                d.branch = toTitleCase(branchLookup[d.branchId]);
                d.category = toTitleCase(catLookup[d.categoryId]);
                d.publisher = publisherLookup[d.publisherId];
                d.count = +d.count;
                d.price = +d.price;
            });

            // Function: removeEmpty
            // 
            var removeEmpty = function (group) {
                return {
                    all: function () {
                        return group.all().filter(function (d) {
                            return (d && d.key && d.value >= 1);
                        });
                    }
                };
            };

            var removeEmptyCost = function (group) {
                return {
                    all: function () {
                        return group.all().filter(function (d) {
                            return (d && d.key && d.value >= 1);
                        });
                    }
                };
            };
            
            var reduceInitial = function () { return { count: 0, total: 0 } };

            var catalogueNdx = crossfilter(catalogue);
            var catalogueDateDim = catalogueNdx.dimension(function (d) { return d.date; });
            var itemsTotal = removeEmpty(catalogueDateDim.group().reduceSum(function (d) { return d['count'] }));
            var priceTotal = removeEmptyCost(catalogueDateDim.group().reduceSum(function (d) { return d['price'] }));

            // Min and max date values - used in the line chart.
            var minDate = catalogueDateDim.bottom(1)[0].date;
            var maxDate = catalogueDateDim.top(1)[0].date;


            ////////////////////////////////////////////////////////////////
            // Chart: Catalogue Line Chart
            ////////////////////////////////////////////////////////////////
            var catalogueLineChart = dc.compositeChart("#cht-catalogue");
            catalogueLineChart
                .width(document.getElementById('div-catalogue').offsetWidth)
                .height(250)
                .dimension(catalogueDateDim)
                .margins({ top: 40, right: 0, bottom: 20, left: 60 })
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

            ////////////////////////////////////////////////////////////////
            // Chart: Filter by Category (Bar Chart)
            ////////////////////////////////////////////////////////////////
            var catalogueCategoryChart = dc.barChart("#cht-catalogue-category");
            var catalogueCategoryDim = catalogueNdx.dimension(function (d) { return d.category; });
            var catalogueCategoryTotal = catalogueCategoryDim.group().reduceSum(function (d) { return d['count'] });
            catalogueCategoryChart
                .width(document.getElementById('div-catalogue-category').offsetWidth)
                .height(300)
                .margins({ top: 5, right: 0, bottom: 125, left: 60 })
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


            ////////////////////////////////////////////////////////////////
            // Chart: Filter by Month (Row Chart)
            ////////////////////////////////////////////////////////////////
            var catalogueMonthBarChart = dc.rowChart("#cht-catalogue-month");
            var catalogueMonthDim = catalogueNdx.dimension(function (d) { return d.month; });
            var catalogueMonthTotal = catalogueMonthDim.group().reduceSum(function (d) { return d['count'] });

            catalogueMonthBarChart
                .width(document.getElementById('div-catalogue-month').offsetWidth)
                .height(300)
                .label(function (d) {
                    return monthsFull[d.key];
                })
                .margins({ top: 5, right: 0, bottom: 40, left: 5 })
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

            ////////////////////////////////////////////////////////////////
            // Chart: Filter by Day (Row Chart)
            ////////////////////////////////////////////////////////////////
            var catalogueDayBarChart = dc.rowChart("#cht-catalogue-day");
            var catalogueDayDim = catalogueNdx.dimension(function (d) { return d.day; });
            var catalogueDayTotal = catalogueDayDim.group().reduceSum(function (d) { return d['count'] });

            catalogueDayBarChart
                .width(document.getElementById('div-catalogue-day').offsetWidth)
                .height(300)
                .label(function (d) {
                    return daysFull[d.key];
                })
                .margins({ top: 5, right: 0, bottom: 40, left: 5 })
                .group(catalogueDayTotal)
                .dimension(catalogueDayDim)
                .elasticX(true);

            catalogueDayBarChart.renderlet(function (chart) {
                chart.selectAll("g.axis g.tick text").attr('transform', "translate(-10, 20) rotate(270)");
            });

            $('#resetChartCatalogueDay').on('click', function (e) {
                e.preventDefault();
                catalogueDayBarChart.filterAll();
                dc.redrawAll();
                return false;
            });

            ////////////////////////////////////////////////////////////////
            // Chart: Filter by Publisher (Bar Chart)
            ////////////////////////////////////////////////////////////////
            var cataloguePublisherChart = dc.barChart("#cht-catalogue-publisher");
            var cataloguePublisherDim = catalogueNdx.dimension(function (d) { return d.publisher; });
            var cataloguePublisherTotal = cataloguePublisherDim.group().reduceSum(function (d) { return d['count'] });
            cataloguePublisherChart
                .width(document.getElementById('div-catalogue-publisher').offsetWidth)
                .height(300)
                .margins({ top: 5, right: 0, bottom: 125, left: 60 })
                .group(cataloguePublisherTotal)
                .dimension(cataloguePublisherDim)
                .elasticY(true)
                .elasticX(true)
                .xUnits(dc.units.ordinal)
                .brushOn(false)
                .x(d3.scale.ordinal())
                .renderHorizontalGridLines(true)
                .xAxis().tickFormat(function (d) { return d; });

            cataloguePublisherChart.renderlet(function (chart) {
                chart.selectAll("g.axis.x g.tick text").attr('transform', "translate(-13, 7) rotate(270)");
            });

            $('#resetChartCataloguePublisher').on('click', function () {
                catalogueRowBranchChart.filterAll();
                dc.redrawAll();
                return false;
            });

            ////////////////////////////////////////////////////////////////
            // Chart: Filter by Year (Bar Chart)
            ////////////////////////////////////////////////////////////////
            var catalogueYearChart = dc.barChart("#cht-catalogue-year");
            var catalogueYearChartWidth = document.getElementById('div-catalogue-year').offsetWidth;
            var catalogueYearDim = catalogueNdx.dimension(function (d) { return +d.year; });
            var catalogueYearTotal = catalogueYearDim.group().reduceSum(function (d) { return d.count; });
            catalogueYearChart
                .width(document.getElementById('div-catalogue-year').offsetWidth)
                .height(300)
                .margins({ top: 5, right: 0, bottom: 40, left: 60 })
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


            ////////////////////////////////////////////////////////////////
            // Chart: Filter by Branch (Bar Chart)
            ////////////////////////////////////////////////////////////////
            var catalogueRowBranchChart = dc.barChart("#cht-catalogue-branch");
            var catalogueBranchDim = catalogueNdx.dimension(function (d) { return d.branch; });
            var catalogueBranchTotal = catalogueBranchDim.group().reduceSum(function (d) { return d['count'] });
            catalogueRowBranchChart
                .width(document.getElementById('div-catalogue-branch').offsetWidth)
                .height(300)
                .margins({ top: 5, right: 0, bottom: 125, left: 60 })
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

            ////////////////////////////////////////////////////////////////
            // Table: Main data table
            ////////////////////////////////////////////////////////////////
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

            ////////////////////////////////////////////////////////////////
            // Event: Resize Window.
            ////////////////////////////////////////////////////////////////
            $(window).on('resize', function () {
                catalogueLineChart.width(document.getElementById('div-catalogue').offsetWidth);
                catalogueCategoryChart.width(document.getElementById('div-catalogue-category').offsetWidth);
                catalogueYearChart.width(document.getElementById('div-catalogue-year').offsetWidth);
                catalogueRowBranchChart.width(document.getElementById('div-catalogue-branch').offsetWidth);
                catalogueMonthBarChart.width(document.getElementById('div-catalogue-month').offsetWidth);
                dc.renderAll();
            });
        });
});