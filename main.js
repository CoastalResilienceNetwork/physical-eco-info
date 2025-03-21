// // Pull in your favorite version of jquery 
require({ 
	packages: [{ name: "jquery", location: "https://ajax.googleapis.com/ajax/libs/jquery/2.1.0/", main: "jquery.min" }] 
});
// Bring in dojo and javascript api classes as well as varObject.json, js files, and content.html
define([
	"dojo/_base/declare", "framework/PluginBase", "dijit/layout/ContentPane", "dojo/dom", "dojo/dom-style", "dojo/dom-geometry", "dojo/text!./obj.json", 
	"dojo/text!./html/content.html", './js/esriapi', './js/clicks', 'dojo/_base/lang', "esri/tasks/query", "esri/tasks/QueryTask", "esri/graphicsUtils"	
],
function ( 	declare, PluginBase, ContentPane, dom, domStyle, domGeom, obj, content,  esriapi, clicks, lang, Query, QueryTask, graphicsUtils ) {
	return declare(PluginBase, {
		// The height and width are set here when an infographic is defined. When the user click Continue it rebuilds the app window with whatever you put in.
		toolbarName:"General Physical and Ecological Info", showServiceLayersInLegend:true, allowIdentifyWhenActive:false, rendered:false, hasCustomPrint:true,  usePrintModal: false, printModalSize: [500, 600], size:'custom', width:'500', hasHelp:false, fullName:"General Physical and Ecological Info",
		
		// First function called when the user clicks the pluging icon. 
		initialize: function (frameworkParameters) {
			// Access framework parameters
			declare.safeMixin(this, frameworkParameters);
			// Define object to access global variables from JSON object. Only add variables to varObject.json that are needed by Save and Share. 
			this.obj = dojo.eval("[" + obj + "]")[0];	
			this.url = "https://cirrus.tnc.org/arcgis/rest/services/FN_MissouriHeadwaters/missouri_headwaters/MapServer";
			this.layerDefs = [];
			this.appname = "Missouri Headwaters";
		},
		// Called after initialize at plugin startup (why the tests for undefined). Also called after deactivate when user closes app by clicking X. 
		hibernate: function () {
			if (this.appDiv != undefined){
				// this.esriapi.clearAtts(this);
				this.obj.visibleLayers = [-1];
				this.dynamicLayer.setVisibleLayers(this.obj.visibleLayers);
			}
			this.open = "no";
		},
		// Called after hibernate at app startup. Calls the render function which builds the plugins elements and functions.   
		activate: function (showHelpOnStart) {
			if (this.rendered == false) {
				this.rendered = true;							
				this.render();
			}else{
				this.dynamicLayer.setVisibleLayers(this.obj.visibleLayers);
			}
			this.open = "yes";
		},
		// Called when user hits the minimize '_' icon on the pluging. Also called before hibernate when users closes app by clicking 'X'.
		deactivate: function () {
			
		},	
		// Called when user hits 'Save and Share' button. This creates the url that builds the app at a given state using JSON. 
		// Write anything to you varObject.json file you have tracked during user activity.		
		getState: function () {
			// remove this conditional statement when minimize is added
			if ( $('#' + this.id ).is(":visible") ){
				//extent
				this.obj.extent = this.map.geographicExtent;
				this.obj.stateSet = "yes";	
				var state = new Object();
				state = this.obj;
				return state;	
			}
		},
		// Called before activate only when plugin is started from a getState url. 
		//It's overwrites the default JSON definfed in initialize with the saved stae JSON.
		setState: function (state) {
			this.obj = state;
		},
		prePrintModal: function(preModalDeferred, $printSandbox, $modalSandbox, mapObject) {
			// var printReport = $(`${this.id}watershed-report`).detach();
   //        	printReport.appendTo($printSandbox)
          	window.setTimeout(function() {
          		preModalDeferred.resolve();
          	 }, 750);	
        },
		postPrintModal: function(postModalDeferred, $printSandbox, $modalSandbox, mapObject) {
            postModalDeferred.resolve();
        },	
		// Called by activate and builds the plugins elements and functions
		render: function() {
			this.mapScale  = this.map.getScale();
			// BRING IN OTHER JS FILES
			this.clicks = new clicks();
			this.esriapi = new esriapi();
			// ADD HTML TO APP
			// Define Content Pane as HTML parent		
			this.appDiv = new ContentPane({style:'padding:8px; height:100%;'});
			this.id = this.appDiv.id;
			dom.byId(this.container).appendChild(this.appDiv.domNode);	
			// hide minimize for this app
			$('#' + this.id).parent().parent().find(".plugin-minimize").hide();
			$('#' + this.id).parent().parent().find(".plugin-print").hide();
			if (this.obj.stateSet == "no"){
				$('#' + this.id).parent().parent().css('display', 'flex')
			}		
			// Get html from content.html, prepend appDiv.id to html element id's, and add to appDiv
			var idUpdate0 = content.replace(/for="/g, 'for="' + this.id);	
			var idUpdate = idUpdate0.replace(/id="/g, 'id="' + this.id);
			$('#' + this.id).html(idUpdate);
			// Add popup window for descriptions
			this.descDiv = new ContentPane({style:'display:none; padding:5px; color:#000; opacity: 1; z-index:1000; position:absolute; top:55px; left:6px; max-width:150px; border-radius:5px; box-shadow: 0 1px 2px rgba(0,0,0,0.5); background:#f9f9f9;'});
			this.descID = this.descDiv.id;
			dom.byId('map-0').appendChild(this.descDiv.domNode);
			$('#' + this.descID).html('<div id="showDesc" style="margin-bottom:-5px; display:none; cursor:pointer;"><img src="plugins/missouri-headwaters/images/info.png"></div><div id="descWrap"><div class="descDiv" id="descText">Test</div><div id="hideDesc">Minimize</div></div>');
			$("#hideDesc").click(function(c){
				$("#descWrap").hide();
				$("#showDesc").show();
			})
			$("#showDesc").click(function(c){
				$("#showDesc").hide();
				$("#descWrap").show();
			})
			// Hide unwanted map controls
			$(`#map-utils-control`).hide();	
			// Add full extent div
			this.fullExDiv = new ContentPane({style:'padding:5px; color:#000; opacity: 1; z-index:1000; position:absolute; top:145px; right:20px; border-radius:5px; border:1px solid #999; box-shadow: 0 1px 2px rgba(0,0,0,0.5); background:#fff;'});
			this.feID = this.fullExDiv.id;
			dom.byId('map-0').appendChild(this.fullExDiv.domNode);
			$(`#${this.feID}`).html(`
				<div id="fullExtent" class="fullExtent" style="margin-bottom:-5px; cursor:pointer;">
					<img src="plugins/missouri-headwaters/images/fullExtent.png" width="22" height="22">
				</div>
			`)
			// Add coordinates
			this.coorDiv = new ContentPane({style:'padding:2px; color:#000; opacity: 1; z-index:1000; position:absolute; bottom:45px; right:10px; background:rgba(255,255,255,0.75);'});
			this.coorID = this.coorDiv.id;
			dom.byId('map-0').appendChild(this.coorDiv.domNode);
			$(`#${this.coorID}`).html(`
				<div id="coordinates" style="color:#666666; font-size:12px; font-weight:bolder;"></div>
			`)
			// Add cover div for print
			$(".flex-expand").prepend(`<div id="mapCover" style="display:none; width:100%; height:100%; background:black;"></div>`)
			// Click listeners
			this.clicks.eventListeners(this);
			// Create ESRI objects and event listeners	
			this.esriapi.esriApiFunctions(this);
			this.rendered = true;	
		}
	});
});
