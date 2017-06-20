$(function () {

    ///////////////////////////////////////////////////////////////////////////////
    // Common Functions
    ///////////////////////////////////////////////////////////////////////////////
    var parseDate = d3.time.format("%Y%m").parse;

    // Load in all the CSVs.  These are the main grouping of catalogue data, and the lookups for branches and categories
    $.when(
        $.ajax(config.catalogueGroupedCsv, {
            xhr: function () {
                var xhr = new window.XMLHttpRequest();
                xhr.addEventListener("progress", function (evt) {
                    if (evt.lengthComputable) {
                        var percentComplete = evt.loaded / evt.total;
                    }
                }, false);
                return xhr;
            }
        }),
        $.ajax(config.catalogueBranchesCsv),
        $.ajax(config.catalogueCategoriesCsv),
        $.ajax(config.catalogueMonthsCsv),
        $.ajax(config.cataloguePublishersCsv))
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

            // For each row in the usage CSV, format all the fields required
            catalogue.forEach(function (d) {
                d.dateAdded = monthLookup[d.monthAddedId];
                d.date = parseDate(d.dateAdded);
                d.year = d.date ? d.date.getFullYear() : null;
                d.day = d.dayAdded ? d.dayAdded : null;
                d.month = d.date ? d.date.getMonth() : null;
                d.branch = toTitleCase(branchLookup[d.branchId]);
                d.category = toTitleCase(catLookup[d.categoryId]);
                d.publisher = toTitleCase(publisherLookup[d.publisherId]);
                d.count = +d.count;
                d.issues = +d.issues;
                d.renewals = +d.renewals;
                d.price = +d.price;
            });

            // Function: removeEmpty
            // Removes from the chart where the value is not zero
            var removeEmpty = function (group) {
                return {
                    all: function () {
                        return group.all().filter(function (d) {
                            return (d && d.key && d.value >= 1);
                        });
                    }
                };
            };

            // Function:
            // 
            var removeOther = function (group) {
                return {
                    all: function () {
                        return group.all().filter(function (d) {
                            return (d.key != 'Other' && d.key != 'Unknown');
                        });
                    }
                };
            };

            // Function: 
            // 
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
            var issuesTotal = removeEmpty(catalogueDateDim.group().reduceSum(function (d) { return d['issues'] }));
            var renewalsTotal = removeEmpty(catalogueDateDim.group().reduceSum(function (d) { return d['renewals'] }));

            ////////////////////////////////////////////////////////////////
            // Chart: Issues Number Display
            ////////////////////////////////////////////////////////////////
            var itemsNumberDisplay = dc.numberDisplay('#cht-number-items');
            var itemsNumGroup = catalogueNdx.groupAll().reduceSum(function (d) { return d['count']; });
            itemsNumberDisplay
                .valueAccessor(function (d) {
                    return d;
                })
                .html({
                    one: '<small>items</small><br/><span class="lead strong">%number</span>',
                    some: '<small>items</small><br/><span class="lead strong">%number</span>',
                    none: '<small>items</small><br/><span class="lead strong">None</span>'
                })
                .group(itemsNumGroup);

            ////////////////////////////////////////////////////////////////
            // Chart: Issues Number Display
            ////////////////////////////////////////////////////////////////
            var issuesNumberDisplay = dc.numberDisplay('#cht-number-issues');
            var issuesNumGroup = catalogueNdx.groupAll().reduceSum(function (d) { return d['issues']; });
            issuesNumberDisplay
                .valueAccessor(function (d) {
                    return d;
                })
                .html({
                    one: '<small>issues</small><br/><span class="lead strong">%number</span>',
                    some: '<small>issues</small><br/><span class="lead strong">%number</span>',
                    none: '<small>issues</small><br/><span class="lead strong">None</span>'
                })
                .group(issuesNumGroup);

            ////////////////////////////////////////////////////////////////
            // Chart: Renewals Number Display
            ////////////////////////////////////////////////////////////////
            var renewalsNumberDisplay = dc.numberDisplay('#cht-number-renewals');
            var renewalsNumGroup = catalogueNdx.groupAll().reduceSum(function (d) { return d['renewals']; });
            renewalsNumberDisplay
                .valueAccessor(function (d) {
                    return d;
                })
                .html({
                    one: '<small>renewals</small><br/><span class="lead strong">%number</span>',
                    some: '<small>renewals</small><br/><span class="lead strong">%number</span>',
                    none: '<small>renewals</small><br/><span class="lead strong">None</span>'
                })
                .group(renewalsNumGroup);

            ////////////////////////////////////////////////////////////////
            // Chart: Cost Number Display
            ////////////////////////////////////////////////////////////////
            var costNumberDisplay = dc.numberDisplay('#cht-number-cost');
            var costNumGroup = catalogueNdx.groupAll().reduceSum(function (d) { return d['price']; });
            costNumberDisplay
                .valueAccessor(function (d) {
                    return d;
                })
                .html({
                    one: '<small>cost</small><br/><span class="lead strong">£%number</span>',
                    some: '<small>cost</small><br/><span class="lead strong">£%number</span>',
                    none: '<small>cost</small><br/><span class="lead strong">£None</span>'
                })
                .group(costNumGroup);

            ////////////////////////////////////////////////////////////////
            // Chart: Catalogue Line Chart
            ////////////////////////////////////////////////////////////////
            var minDate = catalogueDateDim.bottom(1)[0].date;
            var maxDate = catalogueDateDim.top(1)[0].date;

            var catalogueLineChart = dc.compositeChart("#cht-catalogue");
            catalogueLineChart
                .width(document.getElementById('div-catalogue').offsetWidth)
                .height(250)
                .dimension(catalogueDateDim)
                .margins({ top: 40, right: 60, bottom: 20, left: 60 })
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
                        .ordinalColors([config.colours[0]])
                        .useRightYAxis(true),
                    dc.lineChart(catalogueLineChart)
                        .group(issuesTotal, 'Issues')
                        .title(function (d) {
                            var value = d.value.avg ? d.value.avg : d.value;
                            if (isNaN(value)) value = 0;
                            return dateFormat(d.key) + "\n" + numberFormat(value);
                        })
                        .ordinalColors([config.colours[1]]),
                    dc.lineChart(catalogueLineChart)
                        .group(renewalsTotal, 'Renewals')
                        .title(function (d) {
                            var value = d.value.avg ? d.value.avg : d.value;
                            if (isNaN(value)) value = 0;
                            return dateFormat(d.key) + "\n" + numberFormat(value);
                        })
                        .ordinalColors([config.colours[2]])
                ])
                .yAxisLabel("Issues and Renewals")
                .rightYAxisLabel('Items added');

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
            var catalogueCategoryTotal = removeOther(catalogueCategoryDim.group().reduceSum(function (d) { return d['count'] }));
            catalogueCategoryChart
                .width(document.getElementById('div-catalogue-category').offsetWidth)
                .height(300)
                .margins({ top: 5, right: 0, bottom: 110, left: 60 })
                .group(catalogueCategoryTotal)
                .dimension(catalogueCategoryDim)
                .elasticY(true)
                .elasticX(true)
                .xUnits(dc.units.ordinal)
                .brushOn(false)
                .x(d3.scale.ordinal())
                .renderHorizontalGridLines(true)
                .yAxisLabel('Items')
                .xAxis().tickFormat(function (d) { return d; });

            catalogueCategoryChart.on('renderlet', function (chart) {
                chart.selectAll("g.axis.x g.tick text").attr('transform', "translate(-13, 7) rotate(270)");
            });

            $('#reset-chart-category').on('click', function (e) {
                e.preventDefault();
                catalogueCategoryChart.filterAll();
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

            catalogueMonthBarChart.on('renderlet', function (chart) {
                chart.selectAll("g.axis g.tick text").attr('transform', "translate(-10, 20) rotate(270)");
            });

            $('#reset-chart-month').on('click', function (e) {
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
                .height(250)
                .label(function (d) {
                    return daysFull[d.key];
                })
                .margins({ top: 5, right: 0, bottom: 40, left: 5 })
                .group(catalogueDayTotal)
                .dimension(catalogueDayDim)
                .elasticX(true);

            catalogueDayBarChart.on('renderlet', function (chart) {
                chart.selectAll("g.axis g.tick text").attr('transform', "translate(-10, 20) rotate(270)");
            });

            $('#reset-chart-day').on('click', function (e) {
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
            var cataloguePublisherTotal = removeOther(cataloguePublisherDim.group().reduceSum(function (d) { return d['count'] }));
            cataloguePublisherChart
                .width(document.getElementById('div-catalogue-publisher').offsetWidth)
                .height(250)
                .margins({ top: 5, right: 0, bottom: 60, left: 60 })
                .group(cataloguePublisherTotal)
                .dimension(cataloguePublisherDim)
                .elasticY(true)
                .elasticX(true)
                .xUnits(dc.units.ordinal)
                .brushOn(false)
                .x(d3.scale.ordinal())
                .renderHorizontalGridLines(true)
                .yAxisLabel('Items')
                .xAxis().tickFormat(function (d) { return d; });

            cataloguePublisherChart.on('renderlet', function (chart) {
                chart.selectAll("g.axis.x g.tick text").attr('transform', "translate(-13, 7) rotate(270)");
            });

            $('#reset-chart-publisher').on('click', function (e) {
                e.preventDefault();
                cataloguePublisherChart.filterAll();
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

            catalogueYearChart.on('renderlet', function (chart) {
                chart.selectAll("g.axis.x g.tick text").attr('transform', "translate(-13, 20) rotate(270)");
            });

            $('#reset-chart-year').on('click', function (e) {
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
                .yAxisLabel('Items')
                .xAxis().tickFormat(function (d) { return d; });

            catalogueRowBranchChart.on('renderlet', function (chart) {
                chart.selectAll("g.axis.x g.tick text").attr('transform', "translate(-11, 10) rotate(270)");
            });

            $('#reset-chart-branch').on('click', function (e) {
                e.preventDefault();
                catalogueRowBranchChart.filterAll();
                dc.redrawAll();
                return false;
            });

            ////////////////////////////////////////////////////////////////
            // Table: Main data table
            ////////////////////////////////////////////////////////////////
            var dataCount = dc.dataCount('.dc-data-count');
            dataCount
                .dimension(catalogueNdx)
                .group(catalogueNdx.groupAll())
                .html({
                    some: '<strong>%filter-count</strong> selected out of <strong>%total-count</strong> records' +
                    ' | <a href=\'javascript:dc.filterAll(); dc.renderAll();\'>Reset All</a><br/> &nbsp',
                    all: 'All records selected. Please click on the graph to apply filters.<br/> &nbsp'
                });

            var ofs = 0, pag = 10;

            var displayCatalogueTable = function () {
                d3.select('#begin').text(ofs);
                d3.select('#end').text(ofs + pag - 1);
                d3.select('#btn-previous').attr('disabled', ofs - pag < 0 ? 'true' : null);
                d3.select('#btn-next').attr('disabled', ofs + pag >= catalogueNdx.size() ? 'true' : null);
            }

            var updateCatalogueTable = function () {
                catalogueTable.beginSlice(ofs);
                catalogueTable.endSlice(ofs + pag);
                displayCatalogueTable();
            };

            var catalogueTableNext = function () {
                ofs += pag;
                updateCatalogueTable();
                catalogueTable.redraw();
            };
            $('#div-cataloguetable-paging a#btn-next').on('click', function (e) { e.preventDefault(); catalogueTableNext(); });

            var catalogueTableLast = function () {
                ofs -= pag;
                updateCatalogueTable();
                catalogueTable.redraw();
            };
            $('#div-cataloguetable-paging a#btn-previous').on('click', function (e) { e.preventDefault(); catalogueTableLast(); });

            var catalogueTable = dc.dataTable('#tbl-catalogue-detail');
            catalogueTable
                .dimension(catalogueDateDim)
                .group(function (d) { return d.year || 'Unknown'; })
                .size(Infinity)
                .columns([
                    { label: 'Branch', format: function (d) { return d.branch } },
                    { label: 'Month added', format: function (d) { return monthsFull[d.month] || 'Unknown' } },
                    { label: 'Category', format: function (d) { return d.category; } },
                    { label: 'Count', format: function (d) { return d.count; } },
                    { label: 'Cost', format: function (d) { return '£' + d.price; } }
                ]);

            updateCatalogueTable();

            dc.renderAll();

            $('#loader').hide();

            ////////////////////////////////////////////////////////////////
            // Event: Resize Window.
            ////////////////////////////////////////////////////////////////
            $(window).on('resize', function () {
                catalogueLineChart.width(document.getElementById('div-catalogue').offsetWidth);
                catalogueCategoryChart.width(document.getElementById('div-catalogue-category').offsetWidth);
                catalogueMonthBarChart.width(document.getElementById('div-catalogue-month').offsetWidth);
                catalogueDayBarChart.width(document.getElementById('div-catalogue-day').offsetWidth);
                cataloguePublisherChart.width(document.getElementById('div-catalogue-publisher').offsetWidth);
                catalogueYearChart.width(document.getElementById('div-catalogue-year').offsetWidth);
                catalogueRowBranchChart.width(document.getElementById('div-catalogue-branch').offsetWidth);
                dc.renderAll();
            });
        });
});