var Barchart = Backbone.View.extend({

  initialize: function(options) {
    this.data = options.data;
    this.labels = options.labels || _.pluck(options.data, "jail");
    this.maxCost = options.maxCost || d3.max(_.pluck(options.data, "cost"));

    _.bindAll(this);
  },

  clear: function() {
    this.$el.empty();
  },

  render: function() {
    this.size = this.measureDimensions(this.$el);
    this.scales = this.calculateScales(this.size, this.data);

    this.clear();
    this.redraw();
  },

  measureDimensions: function(el) {
    var results = {};
    var dummyLabel = $("<span>LABEL TEXT</span>").hide().appendTo(el);

    results.width = el.width();
    results.height = el.height();

    results.labelHeight = dummyLabel.height();
    results.barHeight = results.height - results.labelHeight;
    results.labelOffset = results.barHeight + results.labelHeight;

    dummyLabel.remove();

    return results;
  },

  calculateScales: function(size, data) {
    var scales = {};

    scales.xAxis = d3.scale.ordinal().rangeBands([25, size.width], 0.15, 0),

    scales.yAxis = d3.scale.linear().range([0, size.barHeight - 10]);

    scales.xAxis.domain(_.pluck(data, "jail"));
    scales.yAxis.domain([0, this.maxCost]);

    return scales;
  },

  redraw: function() {
    var data = this.data,
        labels = this.labels,
        scales = this.scales,
        size = this.size,
        ayxis = d3.svg.axis()
          .scale(scales.yAxis)
          .ticks(2)
          .tickFormat(function(d) {
            return '$' + d.toLocaleString();
          })
          .orient("left"),
        chart = this.svg = d3.select(this.el).append("svg")
          .attr("width", this.size.width)
          .attr("height", this.size.height)
          .append("g")
          .attr("class", "chart");

    chart.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", function(d, i) { return "bar category-" + i})
        .attr("x", function(d) { return scales.xAxis(d.jail) })
        .attr("y", function(d) { return size.barHeight - scales.yAxis(d.cost) })
        .attr("width", scales.xAxis.rangeBand())
        .attr("height", function(d) { return scales.yAxis(d.cost) })
        .append("title")
        .text(function(d) { return d.jail + ": $" + d.cost});

    chart.selectAll(".label")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "label")
        .text(function(d, i) { return labels[i]; })
        .attr("text-anchor", "middle")
        .attr("x", function(d) { return scales.xAxis(d.jail) + scales.xAxis.rangeBand()/2; })
        .attr("y", size.labelOffset)

    axis = this.svg.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(25, 10)")
        .call(ayxis)
  }
});
