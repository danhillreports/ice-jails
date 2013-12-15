var JailCost = Backbone.Model.extend({
  defaults: {
    months: [],
    jails: [],
    costByMonth: {},
    maxCost: 0
  },

  initialize: function(attr) {
    _.bindAll(this);

    this.determineJails(attr.data);
    this.getCostByMonth(attr.data, attr.months);
  },

  determineJails: function(dataset) {
    this.set("jails", dataset.groupBy("Jail", ["Cost"]).column("Jail").data);
    this.set("selected-jail", this.get("jails")[0]);
  },

  getCostByMonth: function(dataset, months) {
    var costByMonth = {};
    var maxMonthlyCost = 0;
    var jailNames = this.get("jails");

    dataset.addComputedColumn("JailMonth", "string", function(row) {
      return row.Month.split(' ')[0];
    });

    _(months).each(function(month) {
      var monthData = dataset.rows(function(r) {
        return r["JailMonth"] == month;
      });

      var maxCostThisMonth = 0;
      var costByJail = monthData.groupBy("Jail", ["Cost"]);
      var jailCostMap = {};

      costByJail.each(function(row, rowIndex){
        var cost = row["Cost"];
        maxCostThisMonth = Math.max(cost, maxCostThisMonth);
        jailCostMap[row["Jail"]] = cost;
      });

      costByMonth[month] = _.map(jailNames, function(jail) {
        return { jail: jail, cost: jailCostMap[jail] || 0 };
      });

      maxMonthlyCost = Math.max(maxCostThisMonth, maxMonthlyCost);
    });

    this.set("costByMonth", costByMonth);
    this.set("maxCost", maxMonthlyCost);
  },

  getCostFor: function(month) {
    return this.get("costByMonth")[month];
  }
});

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

    scales.xAxis = d3.scale.ordinal().rangeBands([0, size.width], 0.15, 0),

    scales.yAxis = d3.scale.linear().range([0, size.barHeight]);

    scales.xAxis.domain(_.pluck(data, "jail"));
    scales.yAxis.domain([0, this.maxCost]);

    return scales;
  },

  redraw: function() {
    var data = this.data,
        labels = this.labels,
        scales = this.scales,
        size = this.size,
        chart = this.svg = d3.select(this.el).append("svg")
          .attr("width", this.size.width)
          .attr("height", this.size.height)
          .append("g")
          .attr("class", "chart"),
        axxis = d3.svg.axis()
          .scale(scales.xAxis)
          .orient("bottom"),
        ayxis = d3.svg.axis()
          .scale(scales.yAxis)
          .orient("left")

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
  }
});

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

var JailCostChart = Backbone.View.extend({

  className: "jail-cost",
  titleTemplate: _.template("<h4><%= month.substring(0,3) %></h4>"),

  initialize: function(options) {
    this.month = options.month;
    this.model = options.model;

    this.title = $(this.titleTemplate(options));

    this.barchart = new Barchart({
      id: "chart-" + this.month,
      className: "barchart",
      data: this.model.getCostFor(this.month),
      maxCost: this.model.maxCost,
      labels: options.labels
    });

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
    with (this){
      clear();
      title.appendTo($el);
      append(barchart);
      barchart.render();
    }
  }
});

var JailCostReport = Backbone.View.extend({

  className: "jail-cost-report",

  initialize: function(options) {
    this.model = options.model;
    this.key = new BarKey({ data: this.model.get("jails")});
    this.charts = this.createMonthCharts(this.model);

    _.bindAll(this);
  },

  append: function(child) {
    this.$el.append(child.el);
    child.parent = this;
  },

  prepend: function(child) {
    this.$el.prepend(child.el);
    child.parent = this;
  },

  clear: function() {
    this.$el.empty();
  },

  render: function() {
    var key = this.key;
    var charts = this.charts;
    var months = this.model.get("months");
    var report = this;

    report.clear();

    _(months).each(function(month) {
      report.append(charts[month]);
      charts[month].render();
    });

    report.prepend(key);
    key.render();
  },

  hide: function() {
    this.$el.hide();
  },

  reveal: function() {
    this.$el.find(".key").fadeTo(0,0);
    this.$el.find(".jail-cost").fadeTo(0,0);

    var delay = 0;

    console.log(this.$el);
    this.$el.show();
    this.$el.find(".jail-cost").each(function(i) {
      delay = (i + 1) * 150;
      $(this).delay(delay).fadeTo(750,1);
    });

    this.$el.find(".key").delay(delay+150).fadeTo(750,1);
  },

  createMonthCharts: function(model) {
    var charts = {};
    var months = model.get("months");
    var jails = model.get("jails");
    var maxCost = model.get("maxCost");

    var labels = _(jails).map(function(dn) { return dn.substring(0,1) });

    _(months).each(function(month) {
      charts[month] = new JailCostChart({
        id: "cost-" + month,
        month: month,
        model: model,
        labels: labels
      });
    });
    return charts;
  },
});
