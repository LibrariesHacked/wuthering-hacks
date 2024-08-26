$(function () {
  var renderAllWrapper = function () {
    renderAllWrapper()
  }
  if (window.location.pathname.indexOf('members') != -1) {
    var parseDate = d3.timeParse('%d/%m/%y %H:%M:%S')
    var parseDate2 = d3.timeParse('%d/%m/%Y %H:%M:%S')
    var parseDate3 = d3.timeParse('%d/%m/%y')
    var parseDate4 = d3.timeParse('%d/%m/%Y')
    var monthFormat = d3.timeFormat('%B %Y')
    var hourFormat = d3.timeFormat('%H')
    var monthParse = d3.timeFormat('%B %Y')

    ////////////////////////////////////////////
    // LOAD DATA
    ////////////////////////////////////////////
    $.when($.ajax(config.membersCsv), $.ajax(config.postcodesGeoJson)).then(
      function (m, p) {
        var members = $.csv.toObjects(m[0])
        members.forEach(function (m) {
          if (m['Date Added'] === '') m['Date Added'] = m['Last Used Date']
          m.dateadded = parseDate(m['Date Added'] + ' ' + m['Time Added'])
          if (m.dateadded === null)
            m.dateadded = parseDate2(m['Date Added'] + ' ' + m['Time Added'])
          if (m.dateadded === null) m.dateadded = parseDate3(m['Date Added'])
          if (m.dateadded === null) m.dateadded = parseDate4(m['Date Added'])
          m.dateaddedmonth = monthParse(monthFormat(m.dateadded))
          m.yearAdded = m.dateadded.getFullYear()
          m.monthAdded = m.dateadded.getMonth()
          m.dayAdded = m.dateadded.getDay()
          m.hourAdded = hourFormat(m.dateadded)
          m.library = toTitleCase(m['Library Registered At'])
          m.postcodedistrict = m['Postcode']
          m.postcodearea = m['Postcode'].replace(/\d/g, '')
        })

        var membersNdx = crossfilter(members)
        var membersDateDim = membersNdx.dimension(function (d) {
          return d.dateaddedmonth
        })
        var membersTotal = membersDateDim.group().reduceCount(function (d) {
          return 1
        })

        /////////////////////////////////////////
        // Number Display 1: Number of members
        /////////////////////////////////////////
        var membersNumberDisplay = dc.numberDisplay('#cht-number-members')
        var membersNumGroup = membersNdx.groupAll().reduceCount(function (d) {
          return 1
        })
        membersNumberDisplay
          .valueAccessor(function (d) {
            return d
          })
          .html({
            one: '<small class="colour1">Members</small><br/><span class="big strong colour1">%number</span>',
            some: '<small class="colour1">Members</small><br/><span class="big strong colour1">%number</span>',
            none: '<small class="colour1">Members</small><br/><span class="big strong colour1">None</span>'
          })
          .group(membersNumGroup)

        /////////////////////////////////////////
        // Number Display 2: Number of libraries
        /////////////////////////////////////////
        var branchesNumberDisplay = dc.numberDisplay('#cht-number-branches')
        var branchesNumDimension = membersNdx.dimension(function (d) {
          return d.library
        })
        var branchesGroup = branchesNumDimension.group()
        branchesNumberDisplay
          .valueAccessor(function (d) {
            return d
          })
          .html({
            one: '<small class="colour2">Libraries</small><br/><span class="big strong colour2">%number</span>',
            some: '<small class="colour2">Libraries</small><br/><span class="big strong colour2">%number</span>',
            none: '<small class="colour2">Libraries</small><br/><span class="big strong colour2">None</span>'
          })

        branchesNumberDisplay.group({
          value: function () {
            return branchesGroup.all().filter(function (kv) {
              return kv.value > 0
            }).length
          }
        })
        branchesNumberDisplay.dimension(branchesGroup)

        /////////////////////////////////////////////////////
        // Number Display 3: Number of postcode districts
        /////////////////////////////////////////////////////
        var postcodedistrictsNumberDisplay = dc.numberDisplay(
          '#cht-number-postcodedistricts'
        )
        var postcodedistrictsNumDimension = membersNdx.dimension(function (d) {
          return d.postcodedistrict
        })
        var postcodedistrictsGroup = postcodedistrictsNumDimension.group()
        postcodedistrictsNumberDisplay
          .valueAccessor(function (d) {
            return d
          })
          .html({
            one: '<small class="colour3">Postcode districts</small><br/><span class="big strong colour3">%number</span>',
            some: '<small class="colour3">Postcode districts</small><br/><span class="big strong colour3">%number</span>',
            none: '<small class="colour3">Postcode districts</small><br/><span class="big strong colour3">None</span>'
          })
        postcodedistrictsNumberDisplay.group({
          value: function () {
            return postcodedistrictsGroup.all().filter(function (kv) {
              return kv.value > 0
            }).length
          }
        })
        postcodedistrictsNumberDisplay.dimension(branchesGroup)

        ///////////////////////////////////////////////////
        // Number Display 4: Joining time
        ///////////////////////////////////////////////////
        var popularJoiningNumberDisplay = dc.numberDisplay(
          '#cht-number-popularjoining'
        )
        var joiningNumDimension = membersNdx.dimension(function (d) {
          return d.dayAdded
        })
        var joiningGroup = joiningNumDimension.group()
        popularJoiningNumberDisplay
          .valueAccessor(function (d) {
            return d
          })
          .formatNumber(function (d) {
            return daysFull[d]
          })
          .html({
            none: '<small class="colour4">Popular joining day</small><br/><span class="big strong colour4">%number</span>',
            one: '<small class="colour4">Popular joining day</small><br/><span class="big strong colour4">%number</span>',
            some: '<small class="colour4">Popular joining day</small><br/><span class="big strong colour4">%number</span>'
          })

        popularJoiningNumberDisplay.group({
          value: function () {
            return joiningGroup
              .all()
              .filter(function (kv) {
                return kv.value > 0
              })
              .sort(function (a, b) {
                return b.value - a.value
              })[0].key
          }
        })
        popularJoiningNumberDisplay.dimension(joiningGroup)

        var dataCount = dc.dataCount('.dc-data-count')
        dataCount
          .dimension(membersNdx)
          .group(membersNdx.groupAll())
          .html({
            some:
              '<strong>%filter-count</strong> selected out of <strong>%total-count</strong> records' +
              " | <a href='javascript:dc.filterAll(); renderAllWrapper();'>Reset All</a><br/> &nbsp",
            all: 'All records selected. Please click on the graphs to apply filters.<br/> &nbsp'
          })

        var postcodedimension = membersNdx.dimension(function (d) {
          return d.postcodedistrict
        })
        var postcodetotal = postcodedimension.group().reduceCount(function (d) {
          return 1
        })

        var postcodesChoro = dc_leaflet
          .choroplethChart('#map')
          .center([54.98, -1.61])
          .zoom(12)
          .width($('#div-members-map').width())
          .brushOn(true)
          .geojson(p)
          .renderPopup(false)
          .dimension(postcodedimension)
          .group(postcodetotal)
          .colors(colorbrewer.Blues[7])
          .colorDomain([
            d3.min(postcodetotal.all(), dc.pluck('value')),
            d3.max(postcodetotal.all(), dc.pluck('value'))
          ])
          .colorAccessor(function (d, i) {
            return d.value
          })
          .featureOptions(function (feature) {
            return {
              weight: 1,
              color: '#e5e5e5',
              opacity: 1,
              fillOpacity: 0.5,
              visible: true
            }
          })
          .featureKeyAccessor(function (feature) {
            return feature.properties.postdist
          })
        postcodesChoro.on('preRender', function (chart) {
          chart.colorDomain(d3.extent(chart.data(), chart.valueAccessor()))
        })
        postcodesChoro.on('preRedraw', function (chart) {
          chart.colorDomain(d3.extent(chart.data(), chart.valueAccessor()))
        })
        $('#reset-members-postcodedistrict').on('click', function (e) {
          e.preventDefault()
          postcodesChoro.filterAll()
          dc.redrawAll()
          return false
        })

        // Graph 3: Branch Row Chart
        var removeZBranches = function (group) {
          return {
            all: function () {
              return group.all().filter(function (d) {
                if (d.key.indexOf('Z') === 0) return false
                return d && d.value !== 0
              })
            }
          }
        }
        var memberBranchBarChart = dc.barChart('#cht-members-branch')
        var memberBranchDim = membersNdx.dimension(function (d) {
          return d.library
        })
        var memberBranchTotal = memberBranchDim
          .group()
          .reduceCount(function (d) {
            return 1
          })
        memberBranchBarChart
          .width($('#div-members-branch').width())
          .height(250)
          .margins({ top: 5, right: 0, bottom: 80, left: 60 })
          .group(removeZBranches(memberBranchTotal))
          .ordinalColors([config.colours[1]])
          .dimension(memberBranchDim)
          .elasticY(true)
          .elasticX(true)
          .x(d3.scaleBand())
          .xUnits(dc.units.ordinal)
          .brushOn(false)
          .yAxisLabel('Members')
          .renderHorizontalGridLines(true)
          .xAxis()
          .tickFormat(function (d) {
            return d
          })
        $('#reset-members-branch').on('click', function (e) {
          e.preventDefault()
          memberBranchBarChart.filterAll()
          dc.redrawAll()
          return false
        })
        memberBranchBarChart.renderlet(function (chart) {
          chart
            .selectAll('g.x text')
            .attr('transform', 'translate(-13,10) rotate(270)')
          chart.selectAll('.column rect').each(function (d, i) {
            var colour = d3.select(this).attr('fill')
            d3.select(this).attr('style', 'stroke-width:1; stroke:' + colour)
          })
        })

        // Graph 4: Hour Joined
        var membersHourJoinedBarChart = dc.barChart('#cht-members-hourjoined')
        var membersHourJoinedDim = membersNdx.dimension(function (d) {
          return d.hourAdded
        })
        var membersHourJoinedTotal = membersHourJoinedDim
          .group()
          .reduceCount(function (d) {
            return 1
          })
        membersHourJoinedBarChart
          .width($('#div-members-hourjoined').width())
          .height(200)
          .margins({ top: 5, right: 0, bottom: 20, left: 60 })
          .group(membersHourJoinedTotal)
          .ordinalColors([config.colours[2]])
          .dimension(membersHourJoinedDim)
          .elasticY(true)
          .elasticX(true)
          .x(d3.scaleBand())
          .xUnits(dc.units.ordinal)
          .brushOn(false)
          .yAxisLabel('Members')
          .renderHorizontalGridLines(true)
          .xAxis()
          .tickFormat(function (d) {
            return d
          })
        $('#reset-members-hourjoined').on('click', function (e) {
          e.preventDefault()
          membersHourJoinedBarChart.filterAll()
          dc.redrawAll()
          return false
        })

        // Graph 5: Day Joined
        var membersDayJoinedBarChart = dc.barChart('#cht-members-dayjoined')
        var membersDayJoinedDim = membersNdx.dimension(function (d) {
          return d.dayAdded
        })
        var membersDayJoinedTotal = membersDayJoinedDim
          .group()
          .reduceCount(function (d) {
            return 1
          })
        membersDayJoinedBarChart
          .width($('#div-members-dayjoined').width())
          .height(200)
          .margins({ top: 5, right: 0, bottom: 20, left: 60 })
          .group(membersDayJoinedTotal)
          .ordinalColors([config.colours[3]])
          .dimension(membersDayJoinedDim)
          .label(function (d) {
            return d.y
          })
          .elasticY(true)
          .elasticX(true)
          .x(d3.scaleBand())
          .xUnits(dc.units.ordinal)
          .brushOn(false)
          .yAxisLabel('Members')
          .renderHorizontalGridLines(true)
          .xAxis()
          .tickFormat(function (d) {
            return daysFull[d]
          })
        $('#reset-chart-dayjoined').on('click', function (e) {
          e.preventDefault()
          membersDayJoinedBarChart.filterAll()
          dc.redrawAll()
          return false
        })
        membersDayJoinedBarChart.yAxisPadding(20)
        $('#reset-members-dayjoined').on('click', function (e) {
          e.preventDefault()
          membersDayJoinedBarChart.filterAll()
          dc.redrawAll()
          return false
        })

        renderAllWrapper()

        // Bit of a hack.  Search through the layer list and remove the tile layer
        postcodesChoro.map().eachLayer(function (l) {
          if (l instanceof L.TileLayer) postcodesChoro.map().removeLayer(l)
        })

        // Add the Mapbox tile layer
        var zoomstack_tiles = L.mapboxGL({
          accessToken: 'none',
          style: 'style.json'
        })
        postcodesChoro.map().addLayer(zoomstack_tiles)

        // Hide the loading spinner
        $('#loader').hide()

        var width = $(window).width()
        // Event: Resize Window.  Resize all the charts based on their new container widths.
        $(window).on('resize', function () {
          if ($(window).width() != width) {
            width = $(window).width()
            membersLineChart.width($('#div-members-date').width())
            postcodesChoro.width($('#div-members-map').width())
            memberBranchBarChart.width($('#div-members-branch').width())
            membersHourJoinedBarChart.width(
              $('#div-members-hourjoined').width()
            )
            membersDayJoinedBarChart.width($('#div-members-dayjoined').width())
            renderAllWrapper()
          }
        })
      }
    )
  }
})
