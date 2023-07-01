var _ = require('underscore')
var Backbone = require('backbone')
var Marionette = require('marionette')
var BootstrapModal = require('backbone.bootstrap-modal')

var ServersListView = require('app/views/navigation/servers/list')
var SettingsView = require('app/views/settings')
var tpl = require('tpl/navigation.html')

module.exports = Marionette.ItemView.extend({
  template: _.template(tpl),

  templateHelpers: function () {
    return {
      isActiveRoute: function (route) {
        return Backbone.history.fragment === route ? 'active' : ''
      }
    }
  },

  events: {
    'click #settings': 'settings',
    'click #restart': 'restart'    
  },

  initialize: function (options) {
    this.settings = options.settings
    this.servers = options.servers
    this.serversListView = new ServersListView({ collection: this.servers })
    Backbone.history.on('route', this.render)
  },

  onDomRefresh: function () {
    this.serversListView.setElement('#servers-list')
    this.serversListView.render()
  },

  settings: function (event) {
    event.preventDefault()
    var view = new SettingsView({ model: this.settings })
    new BootstrapModal({ content: view, animate: true, cancelText: false }).open()
  },

  restart: function (event) {
    event.preventDefault()
    sweetAlert({
      title: 'WARNING!\nAre you sure?',
      text: 'The service and all servers will stopped in order to complete the update.',
      type: 'warning',
      showCancelButton: true,
      confirmButtonClass: 'btn-warning',
      confirmButtonText: "Yes, update it!"
    },
    function () {
      event.preventDefault()

      var self = this
      $.ajax({
        url: '/api/servers/restart',
        type: 'POST'        
      })
    })
  }
})
