var BarKey = Backbone.View.extend({

  className: "key",

  initialize: function(options) {
    this.data = options.data;

    _.bindAll(this);
  },

  clear: function() {
    this.$el.empty();
  },

  render: function() {
    this.size = this.measureDimensions(this.$el);
    this.scale = this.calculateScale(this.size, this.data);

    this.clear();
    this.redraw();
  },

  measureDimensions: function(container) {
    return { width: container.width(), height: container.height() };
  },

  calculateScale: function(dimensions, data) {
    return d3.scale
              .ordinal()
              .rangeBands([0, dimensions.width], 0.1, 0)
              .domain(data);
  },

  redraw: function() {
    var data = this.data,
        scale = this.scale,
        size = this.size,
        svg = this.svg = d3.select(this.el).append("svg")
          .attr("width", this.size.width)
          .attr("height", this.size.height)
          .append("g");

    svg.selectAll(".key-item")
        .data(data)
        .enter()
        .append("g")
        .attr("class", "key-item")
        .call(addBox)
        .call(addLabel);

    function addBox() {
      this.append("rect")
          .attr("class", function(d, i) { return "square category-" + i})
          .attr("x", function(d) { return scale(d) })
          .attr("y", 0)
          .attr("width", size.height)
          .attr("height", size.height);
    }

    function addLabel() {
      this.append("text")
          .attr("class", "label")
          .text(function(d, i) { return d; })
          .attr("text-anchor", "left")
          .attr("x", function(d) { return scale(d) + 5 + size.height; })
          .attr("y", size.height * 3/4);
    }
  }
});
