var _ = require('underscore')
var Marionette = require('marionette')
var sweetAlert = require('sweet-alert')
var chartjs = require('chart.js')

var tpl = require('tpl/logs/list_item.html')

var template = _.template(tpl)

module.exports = Marionette.ItemView.extend({
  tagName: 'tr',
  template: template,

  events: {
    'click .destroy': 'deleteLog',
    'click .performance': 'viewPerf'
  },

  deleteLog: function (event) {
    var self = this
    sweetAlert({
      title: 'Are you sure?',
      text: 'The log will be deleted from the server!',
      type: 'warning',
      showCancelButton: true,
      confirmButtonClass: 'btn-danger',
      confirmButtonText: 'Yes, delete it!'
    },
    function () {
      self.model.destroy()
    })
  },

  viewPerf: function (event) {

    function ExtractJson(text) {

      let res = [];
      let pattern = /([0-9]+:[0-9]+:[0-9]+)\s?\"JsonStatus=(.*)\"/i;
      var lines = text.split('\n');
      for (var i = 0; i < lines.length; i++) {
        let result = lines[i].match(pattern);
        if (result != null && result.length > 2) {
          let dataJson = result[2];
          const data = JSON.parse(dataJson.replaceAll("\"\"", "\""));
          data.time = result[1];
          data.playerCount = data.players.length;
          res.push(data);
        }
      }
      return res;
    };

    function computePerf(pathToLog) {
      var request = new XMLHttpRequest();
      request.open('GET', pathToLog, true);
      request.send(null);
      request.onreadystatechange = function () {
        if (request.readyState === 4 && request.status === 200) {
          const chartData = ExtractJson(request.responseText);


          // compute fps statistics
          var fps_arr = chartData.map(x => x.fps);

          let fps_min = Number.POSITIVE_INFINITY;
          let fps_avg = 0;
          let fps_max = 0; 
          
          for (let i = 0; i < fps_arr.length; i++) {
            fps_min = Math.min(fps_arr[i], fps_min);
            fps_max = Math.max(fps_arr[i], fps_max);
            fps_avg = fps_avg + parseFloat(fps_arr[i]);
          }

          if (fps_arr.length > 0)
          {
            fps_avg = fps_avg / fps_arr.length;       
          }

          document.getElementById('statsFPS').innerHTML = Math.round(fps_avg) + ", " + Math.round(fps_min) + ", " + Math.round(fps_max);

          new chartjs.Chart(
            document.getElementById('chart'),
            {
              type: 'line',
              responsive: true,
              data: {
                labels: chartData.map(row => row.time),
                datasets: [
                  {
                    label: 'FPS',
                    data: chartData.map(row => row.fps),
                    borderWidth: 1,
                    pointRadius: 0,
                    borderColor: [
                      'red'
                    ],
                    backgroundColor: [
                      'rgba(255, 0, 0, 0.2)'
                    ]
                  },
                  {
                    label: 'Players',
                    data: chartData.map(row => row.playerCount),
                    borderWidth: 1,
                    pointRadius: 0,
                    borderColor: [
                      'blue'
                    ],
                    backgroundColor: [
                      'rgba(0, 0, 255, 0.2)'
                    ]
                  }
                ]
              },
              options: {
                tooltips: {
                  callbacks: {
                    label: function(tooltipItem, data) {                      
                      var label = data.datasets[tooltipItem.datasetIndex].label + ': ' + Math.round(tooltipItem.yLabel);
                      var names = String(chartData[tooltipItem.index].players).replaceAll(',', ', ');
                      document.getElementById("playersList").innerHTML = names;      
                      return label;
                    }
                  }
                }
              }
            }
          );
        }
      }
    };

    var caller = event.target || event.srcElement;
    var logName = caller['target'];
    computePerf(logName);
    document.getElementById("chart-container").style.display = "block";
    window.scrollTo({ top: 0, behavior: 'smooth' });    
  }
})
