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
