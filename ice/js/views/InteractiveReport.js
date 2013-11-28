var InteractiveReport = Backbone.View.extend({

  initialize: function(options) {
    this.model = options.model;
    this.report = new JailCostReport({ model : options.model });

    _.bindAll(this);
  },

  append: function(child) {
    this.$el.append(child.el);
    child.parent = this;
  },

  clear: function() {
    this.$el.empty();
  },

  render: function() {
    var wrapper = this;
    var report = this.report;
    var model = this.model;
    var months = model.get("months");
    var currentJail = model.get("selected-jail");

    this.clear();
    this.append(report);

    report.render();

    _(months).each(function(month) {
      var chart = report.charts[month];
      var svg = chart.barchart.svg;

      wrapper.addSelectionEvents(svg, ".bar", model);
    });

    wrapper.addSelectionEvents(report.key.svg, ".key-item", model);

    model.set("selected-jail", "");
    model.set("selected-jail", currentJail);
  },

  addSelectionEvents: function(svg, nodeClass, model) {
    svg.selectAll(nodeClass)
        .on("click", function(d) {
          var jail = (d.jail) ? d.jail : d;
          model.set("selected-jail", jail);
        });

    model.on("change:selected-jail", function() {
      var selected = model.get("selected-jail");

      svg.selectAll(nodeClass)
          .classed("selected", function(d) {
            return d == selected || d.jail == selected;
          });
    });
  },

  reveal: function() {
    this.report.reveal();
  }
})
