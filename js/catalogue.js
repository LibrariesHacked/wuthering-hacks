$(function () {

    // Load in all the CSVs.  These are the main grouping of catalogue data, and the lookups for branches and categories
    $.when(

        $.ajax(config.catalogueBranchesCsv),
        $.ajax(config.catalogueCategoriesCsv),
        $.ajax(config.catalogueGroupedCsv)
    )
        .then(function (br, ca, cl) {
            var branches = $.csv.toObjects(br[0]);
            var categories = $.csv.toObjects(ca[0]);
            var catalogue = $.csv.toObjects(cl[0]);

            var branchLookup = {};
            $.each(branches, function (i, x) { branchLookup[x.id] = x.branch; });
            var catLookup = {};
            $.each(categories, function (i, x) { catLookup[x.id] = x.category; });

            // For each row in the usage CSV, format all the fields required
            catalogue.forEach(function (d) {
                d.branch = toTitleCase(branchLookup[d.branch_id]);
                d.category = toTitleCase(catLookup[d.category_id]);
                d.count = +d.count;
                d.issues = +d.issues;
                d.price = +d.price;
                d.published_year = d.published_year;
                d.renewals = +d.renewals;
                d.year_added = +d.year_added;
                d.day = +d.day_added;
            });

            // Function: removeEmpty. Removes from the chart where the value is not zero
            var removeEmpty = function (group) {
                return {
                    all: function () {
                        return group.all().filter(function (d) {
                            return d && d.key && d.value >= 1;
                        });
                    }
                };
            };

            // Function: removeOther
            var removeOther = function (group) {
                return {
                    all: function () {
                        return group.all().filter(function (d) {
                            return d.key !== 'Other' && d.key !== 'Unknown';
                        });
                    }
                };
            };

            // Function: removeEmptyCost
            var removeEmptyCost = function (group) {
                return {
                    all: function () {
                        return group.all().filter(function (d) {
                            return (d && d.key && d.value >= 1);
                        });
                    }
                };
            };

            var catalogueNdx = crossfilter(catalogue);
            var catalogueDateDim = catalogueNdx.dimension(function (d) { return d.year_added; });
            var itemsTotal = removeEmpty(catalogueDateDim.group().reduceSum(function (d) { return d['count']; }));
            var priceTotal = removeEmptyCost(catalogueDateDim.group().reduceSum(function (d) { return d['price']; }));
            var issuesTotal = removeEmpty(catalogueDateDim.group().reduceSum(function (d) { return d['issues']; }));
            var renewalsTotal = removeEmpty(catalogueDateDim.group().reduceSum(function (d) { return d['renewals']; }));

            ////////////////////////////////////////////////////////////////
            // Chart: Items Number Display
            ////////////////////////////////////////////////////////////////
            var itemsNumberDisplay = dc.numberDisplay('#cht-number-items');
            var itemsNumGroup = catalogueNdx.groupAll().reduceSum(function (d) { return d['count']; });
            itemsNumberDisplay
                .valueAccessor(function (d) {
                    return d;
                })
                .html({
                    one: '<small>Items</small><br/><span class="big colour1">%number</span>',
                    some: '<small>Items</small><br/><span class="big colour1">%number</span>',
                    none: '<small>Items</small><br/><span class="big colour1">None</span>'
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
                    one: '<small>Issues</small><br/><span class="big colour2">%number</span>',
                    some: '<small>Issues</small><br/><span class="big colour2">%number</span>',
                    none: '<small>Issues</small><br/><span class="big colour2">None</span>'
                })
                .group(issuesNumGroup);

            ////////////////////////////////////////////////////////////////
            // Chart: Issuea and Renewals Number Display
            ////////////////////////////////////////////////////////////////
            var renewalsNumberDisplay = dc.numberDisplay('#cht-number-renewals');
            var renewalsNumGroup = catalogueNdx.groupAll().reduceSum(function (d) { return d['renewals']; });
            renewalsNumberDisplay
                .valueAccessor(function (d) {
                    return d;
                })
                .html({
                    one: '<small>Renewals</small><br/><span class="big colour3">%number</span>',
                    some: '<small>Renewals</small><br/><span class="big colour3">%number</span>',
                    none: '<small>Renewals</small><br/><span class="big colour3">None</span>'
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
                    one: '<small>Cost</small><br/><span class="big colour4">£%number</span>',
                    some: '<small>Cost</small><br/><span class="big colour4">£%number</span>',
                    none: '<small>Cost</small><br/><span class="big colour4">£0</span>'
                })
                .group(costNumGroup);

            var dataCount = dc.dataCount('.dc-data-count');
            dataCount
                .dimension(catalogueNdx)
                .group(catalogueNdx.groupAll())
                .html({
                    some: '<strong>%filter-count</strong> selected out of <strong>%total-count</strong> records' +
                        ' | <a href=\'javascript:dc.filterAll(); dc.renderAll();\'>Reset All</a><br/> &nbsp',
                    all: 'All records selected. Please click on the graphs to filter the data.<br/> &nbsp'
                });

            ////////////////////////////////////////////////////////////////
            // Chart: Filter by Year (Bar Chart)
            ////////////////////////////////////////////////////////////////
            var catalogueYearChart = dc.barChart("#cht-catalogue-year");
            var catalogueYearDim = catalogueNdx.dimension(function (d) { return +d.year_added; });
            var catalogueYearTotal = catalogueYearDim.group().reduceSum(function (d) { return d.count; });
            catalogueYearChart
                .width($('div-catalogue-year').width())
                .height(250)
                .margins({ top: 5, right: 0, bottom: 40, left: 60 })
                .group(catalogueYearTotal)
                .dimension(catalogueYearDim)
                .elasticY(true)
                .elasticX(true)
                .xUnits(dc.units.ordinal)
                .brushOn(false)
                .x(d3.scaleBand())
                .ordinalColors([config.colours[1]])
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
            // Chart: Filter by Day (Row Chart)
            ////////////////////////////////////////////////////////////////
            var catalogueDayBarChart = dc.rowChart("#cht-catalogue-day");
            var catalogueDayDim = catalogueNdx.dimension(function (d) { return d.day; });
            var catalogueDayTotal = catalogueDayDim.group().reduceSum(function (d) { return d['count']; });
            catalogueDayBarChart
                .width($('div-catalogue-day').width())
                .height(250)
                .label(function (d) {
                    return daysFull[d.key];
                })
                .margins({ top: 5, right: 0, bottom: 40, left: 5 })
                .group(catalogueDayTotal)
                .dimension(catalogueDayDim)
                .ordering(function (d) { return d })
                .ordinalColors([config.colours[1]])
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
            // Chart: Filter by Category (Bar Chart)
            ////////////////////////////////////////////////////////////////
            var catalogueCategoryChart = dc.barChart("#cht-catalogue-category");
            var catalogueCategoryDim = catalogueNdx.dimension(function (d) { return d.category; });
            var catalogueCategoryTotal = removeOther(catalogueCategoryDim.group().reduceSum(function (d) { return d['count']; }));
            catalogueCategoryChart
                .width($('div-catalogue-category').width())
                .height(250)
                .margins({ top: 5, right: 0, bottom: 110, left: 60 })
                .group(catalogueCategoryTotal)
                .dimension(catalogueCategoryDim)
                .elasticY(true)
                .elasticX(true)
                .xUnits(dc.units.ordinal)
                .brushOn(false)
                .x(d3.scaleBand())
                .ordinalColors([config.colours[0]])
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
            // Chart: Filter by Branch (Bar Chart)
            ////////////////////////////////////////////////////////////////
            var catalogueRowBranchChart = dc.barChart("#cht-catalogue-branch");
            var catalogueBranchDim = catalogueNdx.dimension(function (d) { return d.branch; });
            var catalogueBranchTotal = catalogueBranchDim.group().reduceSum(function (d) { return d['count']; });
            catalogueRowBranchChart
                .width($('div-catalogue-branch').width())
                .height(250)
                .margins({ top: 5, right: 0, bottom: 125, left: 60 })
                .group(catalogueBranchTotal)
                .dimension(catalogueBranchDim)
                .elasticY(true)
                .elasticX(true)
                .xUnits(dc.units.ordinal)
                .brushOn(false)
                .x(d3.scaleBand())
                .ordinalColors([config.colours[0]])
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

            // Startup: Render all the charts
            dc.renderAll();

            $('#loader').hide();

            var width = $(window).width();
            ////////////////////////////////////////////////////////////////
            // Event: Resize Window.
            ////////////////////////////////////////////////////////////////
            $(window).on('resize', function () {
                if ($(window).width() != width) {
                    width = $(window).width();
                    catalogueLineChart.width(document.getElementById('div-catalogue').offsetWidth);
                    catalogueCategoryChart.width(document.getElementById('div-catalogue-category').offsetWidth);
                    catalogueDayBarChart.width(document.getElementById('div-catalogue-day').offsetWidth);
                    catalogueYearChart.width(document.getElementById('div-catalogue-year').offsetWidth);
                    catalogueRowBranchChart.width(document.getElementById('div-catalogue-branch').offsetWidth);
                    dc.renderAll();
                }
            });
        })
});