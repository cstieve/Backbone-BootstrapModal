/**
 * BootstrapModalView is an extension of Backbone.View which takes out all the boilerplate needed to create a bootstrap modal,
 * while providing consistency in the look/feel of your application modals.
 *
 * @class Backbone.BootstrapModalView
 * @extends Backbone.View
 */
(function (root, factory) {

  if (typeof define === "function" && define.amd) {
    // AMD (+ global for extensions)
    define(["jquery", "underscore", "backbone"], function ($, _, Backbone) {
      return (Backbone.BootstrapModalView = factory($, _, Backbone));
    });
  } else if (typeof exports === "object") {
    // CommonJS
    module.exports = factory(require("jquery"), require("underscore"), require("backbone"));
  } else {
    // Browser
   root.Backbone.BootstrapModalView = factory(root.$, root._, root.Backbone);
  }}(this, function ($, _, Backbone) {

  var BootstrapModalView = Backbone.View.extend({

    /** @property {String} setup the 'modal' container (view's el) class*/
  	className: 'modal',

    /** @property {Array} Buttons to display and their associated click handlers
        @property {String} Object.id - Button id
        @property {String} Object.text - Button text
        @property {function} Object.click - Callback for button click, this can be empty and you can listen for events by button index (ex. on('click:btn-0',...) or id if an id is defined)
        @property {String} Object.class - Button class, we always apply the 'btn' class and if no class is defined we apply 'btn-primary'
        @property {boolean} Object.isCloseButton - Determines whether the click event causes the modal to close (defaults to true)
        @property {boolean} Object.isSubmitButton - Determines whether the submission events impact the button
        @property {String} Object.loadingIndicator - Determines whether the loading events impact this button as well as the text when loading
        @property {boolean} Object.asLink- Determines whether the button renders as a link
    */
    buttons: [],

    /** @property {boolean} determine whether we provide the X (close) option in the header */
    showTitleClose: true,

    /** @property {Object} content of the body section, can either be a {Backbone.View} or a {String} */
    bodyContent: "",

    /** @property {String} title */
    title: "",

    /** @property {String} bootstrap modal backdrop setting */
    backdrop: "static",

   	/** @property {String} modal template */
    _template:
		'<div class="modal-dialog">'+
			'<div class="modal-content">'+
				'<div class="modal-header">'+
					'{{ if(showTitleClose){ }}'+
					'<button type="button" class="close" data-dismiss="modal"'+
						'aria-hidden="true">&times;</button>'+
					'{{ } }}'+
					'<h4 class="modal-title">{{=title}}</h4>'+
				'</div>'+
				'<div class="modal-body">'+
					'<div id="js-body-view-wrapper"></div>'+
				'</div>'+
				'<div class="modal-footer">'+
					'{{ _.each(buttons, function(button, idx){  }}'+
                '{{ if (button.asLink) { }}'+
                  '<a type="button" href="#" class="btn btn-as-link" id="btn-{{=idx}}">{{=button.text}}</a>'+
                '{{ } else { }}'+
                  '<button type="button" id="btn-{{=idx}}" '+
						        'class="btn {{=button.class || "btn-primary"}}">{{=button.text}}</button>'+
					'{{  }   }) }}'+
				'</div>'+
			'</div>'+
		'</div>',

    /**
     * Initialize the ModalView object.
     *
     * @param  {Object} options
     */
    initialize: function( options )
    {
      options = options || {};

      Backbone.View.prototype.initialize.call(this, options);

      //this.buttons = options.buttons || [];
      this.buttons = options.buttons || this.buttons;
      this.showTitleClose = options.showTitleClose || this.showTitleClose;
      this.bodyContent = options.bodyContent || this.bodyContent;
      this.title = options.title || this.title;
      this.backdrop = options.backdrop || this.backdrop;

      this.render();
    },

    /**
     * Setup events, which in this case is click handlers for the provided buttons.
     */
    events: function()
    {
    	var eventsObject = {
        'hidden.bs.modal' : 'destroy'
      };

    	_.each(this.buttons, function(button, idx){
    		var eventCallback = 'processButtonClick';
        // we want the default operation on a button to be close as most buttons would
        // make the modal go away reducing the number of parameters needed on the button object.
        if(_.isUndefined(button.isCloseButton) || button.isCloseButton){
          eventCallback = function(event){
            this.processButtonClick(event);
            this.close(event);
          };
        }
        eventsObject['click #btn-'+idx] = eventCallback;
    	});

    	return eventsObject;
    },

    /**
     * Handle the click events for any of the buttons in the view
     *
     * @param  {Event} event object
     */
    processButtonClick: function(event)
    {
    	event.preventDefault();

    	var targetId = event.target.id;
    	var that = this;
    	_.each(this.buttons, function(button, idx){
        var buttonId = ('btn-'+idx);
    		if( buttonId === targetId){
          if(!_.isUndefined(button.click)){
            button.click();
          }
          if(button.isSubmitButton){
            that.trigger('submit');
          }
          that.trigger('click:' + buttonId);
    		}
    	});
    },

    /**
     * Remove and undelegate events on the ModalView and the body content if it is a {Backbone.View}
     */
    destroy: function()
    {
      if(this.bodyContent instanceof Backbone.View){
        this.bodyContent.undelegateEvents();
        this.bodyContent.remove();
      }
      this.undelegateEvents();
      this.remove();
    },

    /**
     * Open the modal
     */
    open: function()
    {
      this.$el.modal({backdrop: this.backdrop});
      return this;
    },

    /**
     * Close the modal, which will call the bootstrap modal hide method and will in turn force a destroy() call
     */
    close: function()
    {
      this.$el.modal('hide');
    },

    /**
     * Set the disabled attribute on all submit-type buttons
     *
     * @param  {boolean} isDisabled
     */
    setSubmitButtonDisabledState: function(isDisabled)
    {
      var that = this,
          buttonId;

      _.each(this.buttons, function(button, idx){
          if(button.isSubmitButton) {
            buttonId = button.id || ('btn-'+idx);
            that.setButtonDisabledState(buttonId, isDisabled);
          }
        });
    },

    /**
     * Set the loading indicator on all loading-type buttons
     *
     * @param  {boolean} isLoading
     */
    setLoadingIndicatorState: function(isLoading)
    {
      var that = this,
          buttonId;

      _.each(this.buttons, function(button, idx){
          if(_.isString(button.loadingIndicator)) {
            buttonId = button.id || ('btn-'+idx);
            that.setButtonLoadingState(buttonId, isLoading);
          } else {
            setButtonDisabledState(buttonId, isLoading);
          }
        });
    },

    /**
     * Set the disabled attribute on a specific button by id
     *
     * @param  {String} buttonId
     * @param  {boolean} isDisabled
     */
    setButtonDisabledState: function(buttonId, isDisabled)
    {
      this.$('#'+buttonId).attr('disabled', isDisabled);
    },

    /**
     * Set the loading indicator on a specific button by id
     *
     * @param  {String} buttonId
     * @param  {boolean} isLoading
     * @param  {String} loadingIndicator
     */
    setButtonLoadingState: function(buttonId, isLoading, loadingIndicator)
    {
      if(isLoading){
        this.$('#'+buttonId).text(loadingIndicator);
      }
      this.setButtonDisabledState(buttonId, isLoading);
    },

    /**
     * render the view.
     * Note: This just sets up the content, but does not actually open the modal, for that you need to call the open().
     */
    render: function()
    {
    	this.$el.html(_.template(this._template, {
    		'buttons': this.buttons,
    		'showTitleClose': this.showTitleClose,
    		'title': this.title
    	}));

    	if(_.isString(this.bodyContent)){
    		this.$('#js-body-view-wrapper').html(this.bodyContent);
    	} else if(this.bodyContent instanceof Backbone.View) {
        this.bodyContent.modalContainer = this;
        this.$('#js-body-view-wrapper').html(this.bodyContent.render().$el);
      } else {
        this.bodyContent = new this.bodyContent({'modalContainer':this});
        this.$('#js-body-view-wrapper').html(this.bodyContent.render().$el);
      }
    }
  });
  return BootstrapModalView;
}));
