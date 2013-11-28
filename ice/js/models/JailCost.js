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
