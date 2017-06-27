$(function () {

    var parseDate = d3.time.format("%d/%m/%y %H:%M:%S").parse;
    var parseDate2 = d3.time.format("%d/%m/%Y %H:%M:%S").parse;
    var parseDate3 = d3.time.format("%d/%m/%y").parse;
    var parseDate4 = d3.time.format("%d/%m/%Y").parse;
    var monthFormat = d3.time.format("%B %Y");
    var hourFormat = d3.time.format("%H");
    var dayFormat = d3.time.format("%d");
    var monthParse = d3.time.format("%B %Y").parse;

    // Load in the data
    $.when($.ajax(config.membersCsv), $.ajax(config.postcodesGeoJson))
        .then(function (m, p) {

            var members = $.csv.toObjects(m[0]);
            members.forEach(function (m) {
                if (m['Date Added'] === '') m['Date Added'] = m['Last Used Date'];
                m.dateadded = parseDate(m['Date Added'] + ' ' + m['Time Added']);
                if (m.dateadded === null) m.dateadded = parseDate2(m['Date Added'] + ' ' + m['Time Added']);
                if (m.dateadded === null) m.dateadded = parseDate3(m['Date Added']);
                if (m.dateadded === null) m.dateadded = parseDate4(m['Date Added']);
                m.dateaddedmonth = monthParse(monthFormat(m.dateadded));
                m.yearAdded = m.dateadded.getFullYear();
                m.monthAdded = m.dateadded.getMonth();
                m.dayAdded = m.dateadded.getDay();
                m.hourAdded = hourFormat(m.dateadded);
                m.library = toTitleCase(m['Library Registered At']);
                m.postcodedistrict = m['Postcode'];
                m.postcodearea = m['Postcode'].replace(/\d/g, '');
                //m.lastused = m['Last Used Date'] ? parseDate(m['Last Used Date'] + ' ' + m['Last Used Time']) : 0;
                //m.lastusedday = m['Last Used Date'] ? dayFormat(m.lastused) : 0;
                //m.lastusedhour = m['Last Used Date'] ? hourFormat(m.lastused) : 0;
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


            var membersNdx = crossfilter(members);
            var membersDateDim = membersNdx.dimension(function (d) { return d.dateaddedmonth; });
            var membersTotal = membersDateDim.group().reduceCount(function (d) { return 1; });


            var membersNumberDisplay = dc.numberDisplay('#cht-number-members');
            var membersNumGroup = membersNdx.groupAll().reduceCount(function (d) { return 1; });
            membersNumberDisplay
                .valueAccessor(function (d) {
                    return d;
                })
                .html({
                    one: '<small>members</small><br/><span class="lead strong">%number</span>',
                    some: '<small>members</small><br/><span class="lead strong">%number</span>',
                    none: '<small>members</small><br/><span class="lead strong">None</span>'
                })
                .group(membersNumGroup);















            // Graph 1: Timeline
            var minDate = membersDateDim.bottom(1)[0].dateadded;
            var maxDate = membersDateDim.top(1)[0].dateadded;

            var membersLineChart = dc.lineChart('#cht-members-date');
            membersLineChart
                .width($('#div-members-date').width())
                .height(250)
                .dimension(membersDateDim)
                .group(membersTotal)
                .margins({ top: 40, right: 60, bottom: 30, left: 60 })
                .elasticX(true)
                .elasticY(true)
                .renderHorizontalGridLines(true)
                .x(d3.time.scale().domain([minDate, maxDate]))
                .xAxisLabel('Month')
                .yAxisLabel('Members Added');


            // Graph 2: Map
            var postcodedimension = membersNdx.dimension(function (d) { return d.postcodedistrict; });
            var postcodetotal = postcodedimension.group().reduceCount(function (d) { return 1; });

            var mapboxtiles = L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>.  Geolytix postcode polygons.',
                maxZoom: 18,
                id: 'mapbox.light',
                accessToken: 'pk.eyJ1IjoibGlicmFyaWVzaGFja2VkIiwiYSI6IlctaDdxSm8ifQ.bxf1OpyYLiriHsZN33TD2A'
            });

            var postcodesChoro = dc_leaflet.choroplethChart('#map')
                .dimension(postcodedimension)
                .group(postcodetotal)
                .width($('#div-members-map').width())
                .height($('#div-members-map').height())
                .center([55, -1.62])
                .zoom(11)
                .geojson(p)
                .colors(colorbrewer.OrRd[7])
                .colorDomain([
                    d3.min(postcodetotal.all(), dc.pluck('value')),
                    d3.max(postcodetotal.all(), dc.pluck('value'))
                ])
                .colorAccessor(function (d, i) {
                    return d.value;
                })
                .featureOptions({
                    'fillColor': 'black',
                    'color': 'gray',
                    'opacity': 0.4,
                    'fillOpacity': 0.6,
                    'weight': 1
                })
                .colorCalculator(function (d) {
                    if (d.value == 0) {
                        return "#FFF";
                    } else {
                        return d.Color
                    };
                })
                .featureKeyAccessor(function (feature) {
                    return feature.properties.postdist;
                })
                .renderPopup(true)
                .popup(function (d, feature) {
                    return feature.properties.postdist + " : " + d.value;
                })
                .legend(dc_leaflet.legend().position('bottomright'));

            // Graph 3: Branch bar
            var memberBranchBarChart = dc.barChart("#cht-members-branch");
            var memberBranchDim = membersNdx.dimension(function (d) { return d.library; });
            var memberBranchTotal = memberBranchDim.group().reduceCount(function (d) { return 1; });
            memberBranchBarChart
                .width($('#div-members-branch').width())
                .height(300)
                .margins({ top: 5, right: 0, bottom: 80, left: 60 })
                .group(memberBranchTotal)
                .dimension(memberBranchDim)
                .elasticY(true)
                .elasticX(true)
                .xUnits(dc.units.ordinal)
                .brushOn(false)
                .x(d3.scale.ordinal())
                .yAxisLabel('Members')
                .renderHorizontalGridLines(true);
            $('#reset-chart-branch').on('click', function (e) {
                e.preventDefault();
                memberBranchBarChart.filterAll();
                dc.redrawAll();
                return false;
            });
            memberBranchBarChart.on('renderlet', function (chart) {
                chart.selectAll("g.x text").attr('transform', "translate(-13,10) rotate(270)");
            });

            // Graph 4: Hour Joined
            var membersHourJoinedBarChart = dc.barChart("#cht-members-hourjoined");
            var membersHourJoinedDim = membersNdx.dimension(function (d) { return d.hourAdded; });
            var membersHourJoinedTotal = membersHourJoinedDim.group().reduceCount(function (d) { return 1; });
            membersHourJoinedBarChart
                .width($('#div-members-hourjoined').width())
                .height(250)
                .margins({ top: 5, right: 0, bottom: 20, left: 60 })
                .group(membersHourJoinedTotal)
                .dimension(membersHourJoinedDim)
                .elasticY(true)
                .elasticX(true)
                .xUnits(dc.units.ordinal)
                .brushOn(false)
                .x(d3.scale.ordinal())
                .yAxisLabel('Members')
                .renderHorizontalGridLines(true);
            $('#reset-chart-hourjoined').on('click', function (e) {
                e.preventDefault();
                membersHourJoinedBarChart.filterAll();
                dc.redrawAll();
                return false;
            });

            // Graph 5: Hour Joined
            var membersDayJoinedBarChart = dc.barChart("#cht-members-dayjoined");
            var membersDayJoinedDim = membersNdx.dimension(function (d) { return d.dayAdded; });
            var membersDayJoinedTotal = membersDayJoinedDim.group().reduceCount(function (d) { return 1; });
            membersDayJoinedBarChart
                .width($('#div-members-dayjoined').width())
                .height(250)
                .margins({ top: 5, right: 0, bottom: 20, left: 60 })
                .group(membersDayJoinedTotal)
                .dimension(membersDayJoinedDim)
                .elasticY(true)
                .elasticX(true)
                .xUnits(dc.units.ordinal)
                .brushOn(false)
                .x(d3.scale.ordinal())
                .yAxisLabel('Members')
                .renderHorizontalGridLines(true);
            $('#reset-chart-dayjoined').on('click', function (e) {
                e.preventDefault();
                membersDayJoinedBarChart.filterAll();
                dc.redrawAll();
                return false;
            });

            dc.renderAll();

            // Bit of a hack.  Search through the layer list and remove the tile layer
            postcodesChoro.map().eachLayer(function (l) {
                if (l instanceof L.TileLayer) postcodesChoro.map().removeLayer(l);
            });
            // Add the Mapbox tile layer
            postcodesChoro.map().addLayer(mapboxtiles);
        });
});