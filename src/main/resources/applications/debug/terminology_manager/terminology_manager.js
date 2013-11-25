// Create Fuzein namespace
Ext.namespace('FuzeIn');

FuzeIn.TerminologyManager = function(config) 
{
 this.fuzeInCore = config.fuzeInCore;
 
 Ext.apply(this, config); 
 
 // call parent constructor
 FuzeIn.TerminologyManager.superclass.constructor.call(this, config);
};

// Fix to update tree icons
Ext.override(Ext.tree.TreeNode,
{
 refresh: function(attributes)
 {
  // Update the node's properties
  this.expanded = attributes.expanded === true;
  this.isTarget = attributes.isTarget !== false;
  this.draggable = attributes.draggable !== false && attributes.allowDrag !== false;
  this.allowChildren = attributes.allowChildren !== false && attributes.allowDrop !== false;
  this.text = attributes.text || this.text;
  this.cls = attributes.cls || this.cls;
  this.icon = attributes.icon || this.icon;
  this.iconCls = attributes.iconCls || this.iconCls;
  
  // re-render the ui if it is rendered
  if(this.rendered)
  {
   this.rendered = false;
   this.ui.rendered = false;
   Ext.fly(this.ui.wrap).remove();
   this.render();
  }
 }
});

//
FuzeIn.TerminologyManager = Ext.extend(FuzeIn.FuzeInWindow, 
{
 //
 title:'FuzeIn Terminology Manager',
 titleText:'FuzeIn Terminology Manager',
 width:965,
 height:650,
 iconCls:'fuzein_terminology_mgmt_16', 
 
 //
 // List of User terminologies
 terminologyDocumentsDS : null,
 terminologyDocumentsDef : [{name:'terminology_folder', type: 'string'}, 
                            {name:'terminology_name', type: 'string'},
						                      {name:'terminology_status', type: 'string'},
						                      {name:'terminology_original_author', type: 'string'},
						                      {name:'terminology_date', type: 'date', dateFormat: 'Y-m-d'}], 
						 
 //
 // List of terminology units
 terminologyUnitDS : null,
 terminologyUnitListDef : [{name:'unit_id', type: 'integer'}, 
                           {name:'reference_id', type: 'string'},
                           {name:'unit_name', type: 'string'},
                           {name:'unit_object', type: 'object'}], 
                           
 vettingNoteDS : null,
 vettingNoteListDef : [{name:'unit_id', type: 'integer'}, 
                       {name:'reference_id', type: 'string'},
                       {name:'unit_name', type: 'string'},
                       {name:'unit_object', type: 'object'}],         
                       
 groupSubmittalDS : null,
 groupSubmittalDef : [{name:'group_id', type: 'string'}, 
                      {name:'group_name', type: 'string'},
                      {name:'is_vetter', type: 'boolean'}], 
                 
 //
 shareForm : null,
 publishForm : null,  
 searchForm : null,
 templateForm : null,
 lemmaUnit : null,
 
 activeUnitObject : null,
 
 //
 userRepositoryRoot : '',
 
 // 
 initComponent : function()
 {
  //
  this.shareForm = new FuzeIn.TerminologySharingForm();
  this.shareForm.on({'search_event': {fn:this.onSearch, scope:this}});  
  
  this.publishForm = new FuzeIn.TerminologyPublishingForm();
  this.publishForm.on({'get_collection_list': {fn:this.onGetCollectionListing, scope:this}});  
  this.publishForm.on({'publish_terminology': {fn:this.onPublish, scope:this}});  
  
  this.searchForm = new FuzeIn.TerminologySearchForm();
  this.searchForm.on({'search_event': {fn:this.onSearch, scope:this}});    
  
  this.templateForm = new FuzeIn.TerminologyTemplateForm();
  this.templateForm.on({'search_event': {fn:this.onSearch, scope:this}});
  
  //
  // Create Application toolbar... needs to be done before calling base class
  this.tbar = [{
   xtype:'buttongroup',
   title:'Document',
   columns:4,
   items:[{
     id:'fuzein_terminology_operation_new',
     text:'New Document',
     iconCls:'fuzein_terminology_toolbar_new',
     scale:'medium',
     iconAlign:'top',
     rowspan:3,
     listeners:{
      click:{
       fn: function(button, event) {
        event.stopEvent();
        
        // Check if terminology was modified
        if(this.onValidateTerminologyUpdate() == false)
        {
						   this.resetTerminologyManager();
						   this.centerPanel.doLayout(); 
        }
        else
        {
        }

        //
        this.updateToolbar();
       }
      },
      scope:this
     }
    },{
     id:'fuzein_terminology_operation_save',
     text:'Save',
     iconCls:'fuzein_terminology_toolbar_save',
     scale:'small',
     disabled:false,
     listeners:{
      click:{
       fn: function(button, event) {
        event.stopEvent();
        
        // Submit Terminology to backend
        this.onSaveTerminology();
        this.updateToolbar();
       }
      },
      scope:this
     }
   },{
     id:'fuzein_terminology_operation_delete',
     text:'Delete',
     iconCls:'fuzein_terminology_toolbar_delete',
     scale:'small',
     disabled:true,
     listeners:{
      click:{
       fn: function(button, event) {
        event.stopEvent();
        
        // Delete terminology
        this.onDeleteTerminology();
        this.updateToolbar();
       }
      },
      scope:this
     }          
   },{
     id:'fuzein_terminology_operation_submit',
     text:'Submit',
     iconCls:'fuzein_terminology_toolbar_submit',
     scale:'small',
     disabled:true,
     listeners:{
      click:{
       fn: function(button, event) {
        event.stopEvent();
        
        //
        // Get terminology Descriptor
        var terminologyDescriptor = this.lemmaUnit.getTerminologyDescriptor();
        
        //
        // Get Group to Submit to
        var submitToGroupObject = this.groupSubmittalDS.getAt(0);
        
        //
        // Submit to backend
        var record = new Object({
         terminology_folder:terminologyDescriptor.terminology_folder,
         terminology_name:this.lemmaUnit.getTerminologyName(),
         group_id:submitToGroupObject.get('group_id')
        });
        
        //
        delete terminologyDescriptor;
        
        if(record !== null)
        {
         var jsonParams = Ext.util.JSON.encode(record);
         delete record;  
      
         // Submit
         this.notifyService('submit_terminology', jsonParams);
        }        
       }
     },
     scope:this
    }         
   },{
     id:'fuzein_terminology_operation_saveas',
     text:'Save As',
     iconCls:'fuzein_terminology_toolbar_saveas',
     disabled:true,
     scale:'small',
     listeners:{
      click:{
       fn: function(button, event) {
        event.stopEvent();
        this.updateToolbar();        
       }
      },
      scope:this
     }          
   },{
     id:'fuzein_terminology_operation_refresh_term',
     text:'Refresh',
     iconCls:'fuzein_terminology_toolbar_refresh_term',
     disabled:false,
     scale:'small',
     listeners:{
      click:{
       fn: function(button, event) {
        event.stopEvent();
        this.refreshTerminologies();
       }
      },
      scope:this
     }          
   }]
  },{
   xtype:'buttongroup',
   title:'View',
   columns:4,
   items:[{
     id:'fuzein_terminology_view_document',
     text:'Documents',
     iconCls:'fuzein_terminology_toolbar_view_document',
     scale:'medium',
     iconAlign:'top',
     enableToggle:true,
     pressed:true,
     toggleHandler:this.onToggleDocumentMode,
     scope:this
    },{
     id:'fuzein_terminology_view_metadata',
     text:'Metadata',
     iconCls:'fuzein_terminology_toolbar_view_metadata',
     scale:'medium',
     iconAlign:'top',
     enableToggle:true,
     pressed:true,
     toggleHandler:this.onToggleMetadataMode,
     scope:this
    },{
     id:'fuzein_terminology_view_templates',
     text:'Templates',
     iconCls:'fuzein_terminology_toolbar_view_templates',
     disabled:true,
     scale:'medium',
     iconAlign:'top',
     arrowAlign:'right',
     menu:[this.templateForm]
    }]  
  },{
   xtype:'buttongroup',
   title:'Terminology Form Representation',
   columns:5,
   items:[{
     id:'fuzein_terminology_text',
     text:'Sense Form',
     iconCls:'fuzein_terminology_toolbar_text',
     scale:'medium',
     iconAlign:'top',
     listeners:{
      click:{
       fn: function(button, event) {
        event.stopEvent();
        
        //
        var terminologyObject = new FuzeIn.Terminology_Sense({
        	reference_id:Ext.id(),
         tab_index:this.terminologyUnitDS.getCount() + 1
        });
        
        //
        var recordDef = Ext.data.Record.create(this.terminologyUnitListDef);
        
        var Record = new recordDef({
         reference_id:terminologyObject.reference_id,
         unit_id:this.terminologyUnitDS.getCount() + 1,
         unit_object:terminologyObject
        });        
        
        //
        this.terminologyUnitDS.add(Record);
        delete Record;
        
        this.centerPanel.add(terminologyObject.getEditor());
        this.centerPanel.doLayout();
        
        // Set up events
        terminologyObject.on({'activate_terminology_unit': {fn:this.onUnitActivate, scope:this}});
        terminologyObject.on({'delete_sense': {fn:this.onDeleteSense, scope:this}});
       }
      },
      scope:this
     }
    },{
     id:'fuzein_terminology_image',
     text:'Image Form',
     iconCls:'fuzein_terminology_toolbar_image',
     scale:'medium',
     iconAlign:'top',
     disabled:true,
     listeners:{
      click:{
       fn: function(button, event) {
        event.stopEvent();
       }
      },
      scope:this
     }
    },{
     id:'fuzein_terminology_audio',
     text:'Audio Form',
     iconCls:'fuzein_terminology_toolbar_audio',
     scale:'medium',
     iconAlign:'top',
     disabled:true,
     listeners:{
      click:{
       fn: function(button, event) {
        event.stopEvent();
       }
      },
      scope:this
     }
    },{
     id:'fuzein_terminology_video',
     text:'Video Form',
     iconCls:'fuzein_terminology_toolbar_video',
     scale:'medium',
     iconAlign:'top',
     disabled:true,
     listeners:{
      click:{
       fn: function(button, event) {
        event.stopEvent();
       }
      },
      scope:this
     }
    }]
  },{
   xtype:'buttongroup',
   title:'Transport',
   columns:2,
   items:[{
     id:'fuzein_terminology_transport_upload',
     text:'Upload',
     iconCls:'fuzein_terminology_toolbar_upload',
     scale:'medium',
     iconAlign:'top',
     listeners:{
      click:{
       fn: function(button, event) {
        event.stopEvent();
       }
      },
      scope:this
     }     
    },{
     id:'fuzein_terminology_transport_download',
     text:'Download',
     iconCls:'fuzein_terminology_toolbar_download',
     disabled:true,
     scale:'medium',
     iconAlign:'top',
     listeners:{
      click:{
       fn: function(button, event) {
        event.stopEvent();
       }
     },
     scope:this
     }     
    }]
  },{
  	id:'fuzein_terminology_vetting_group',
   xtype:'buttongroup',
   title:'Vetting',
   columns:3,
   items:[{
     id:'fuzein_terminology_vetting_note',
     text:'Add Note',
     iconCls:'fuzein_terminology_toolbar_vetting_note',
     disabled:true,
     scale:'medium',
     iconAlign:'top',
     arrowAlign:'right',
     listeners:{
      click:{
       fn: function(button, event) {
        event.stopEvent();
        
        //
        var vettingNoteObject = new FuzeIn.Terminology_VettingNote({
        	reference_id:Ext.id,
         tab_index:this.terminologyUnitDS.getCount() + 1
        });
        
        //
        var recordDef = Ext.data.Record.create(this.vettingNoteListDef);
        
        var Record = new recordDef({
         reference_id:vettingNoteObject.reference_id,
         unit_id:this.vettingNoteDS.getCount() + 1,
         unit_object:vettingNoteObject
        });
        
        //
        this.vettingNoteDS.add(Record);
        delete Record;
        
        this.centerPanel.add(vettingNoteObject.getEditor());
        this.centerPanel.doLayout();
        
        // Set up events
        vettingNoteObject.on({'activate_terminology_unit': {fn:this.onUnitActivate, scope:this}});
        vettingNoteObject.on({'delete_note': {fn:this.onDeleteNote, scope:this}});
       }
     },
     scope:this
     }
    },{
     id:'fuzein_terminology_vetting_reject',
     text:'Reject',
     iconCls:'fuzein_terminology_toolbar_vetting_reject',
     disabled:true,
     scale:'medium',
     iconAlign:'top',
     arrowAlign:'right',
     listeners:{
      click:{
       fn: function(button, event) {
        event.stopEvent();
        
						  //
						  // Get terminology Descriptor
						  var terminologyDescriptor = this.lemmaUnit.getTerminologyDescriptor();    
						  
						  //
						  // Submit to backend
						  var record = new Object({
						   terminology_folder:terminologyDescriptor.terminology_folder,
						   terminology_name:this.lemmaUnit.getTerminologyName()
						  });
						  
						  //
						  delete terminologyDescriptor;
						  
						  if(record !== null)
						  {
						   var jsonParams = Ext.util.JSON.encode(record);
						   delete record;  
						
						   // Submit
						   this.notifyService('reject_terminology', jsonParams);
						  }						  
       }
     },
     scope:this
     }
    },{
     id:'fuzein_terminology_publish_terminology',
     text:'Publish',
     iconCls:'fuzein_terminology_toolbar_publish_terminology',
     disabled:true,
     scale:'medium',
     iconAlign:'top',
     arrowAlign:'right',
     menu:[this.publishForm]
    }]
  }/*,{
   xtype:'buttongroup',
   title:'Community',
   columns:1,
   items:[{
     id:'fuzein_terminology_share_terminology',
     text:'Share Term',
     iconCls:'fuzein_terminology_toolbar_share_terminology',
     disabled:true,
     scale:'medium',
     iconAlign:'top',
     arrowAlign:'right',
     menu:[this.shareForm]
    }]
  },{
   xtype:'buttongroup',
   title:'Search',
   columns:1,
   items:[{
     id:'fuzein_terminology_toolbar_search',
     text:'Search',
     iconCls:'fuzein_terminology_toolbar_search',
     scale:'medium',
     iconAlign:'top',
     arrowAlign:'right',
     menu:[this.searchForm]
    }]
  }*/];
  
  //
  // Class Base Class
  FuzeIn.FuzeInWindow.superclass.initComponent.call(this);
  
  //
  //
  var reader = new Ext.data.JsonReader({}, this.terminologyUnitListDef);
 
  this.terminologyUnitDS = new Ext.data.ArrayStore({
   autoDestroy:true,
   reader:reader
  });  
  
  //
  reader = new Ext.data.JsonReader({}, this.vettingNoteListDef);
 
  this.vettingNoteDS = new Ext.data.ArrayStore({
   autoDestroy:true,
   reader:reader
  });
  
  //
  reader = new Ext.data.JsonReader({}, this.groupSubmittalDef);
  
  this.groupSubmittalDS = new Ext.data.Store({
   reader:reader,
   sortInfo:{field:'group_name', direction:'DESC'}
  });
  
  //
  // Terminology Documents
  reader = new Ext.data.JsonReader({}, this.terminologyDocumentsDef);
 
  this.terminologyDocumentsDS = new Ext.data.GroupingStore({
   groupField:'terminology_status',
   reader:reader,
   remoteSort:false,
   groupOnSort:false,
   sortInfo:{field:'terminology_date', direction:'DESC'}
  });  

  //
  // WEST
  this.westPanel = this.createWestPanel();
  this.terminologyList = this.createTerminologyListPanel();
  //this.sharedTerminologyList = this.createSharedTerminologyListPanel();
  
  this.westPanel.add(this.terminologyList);
  //this.westPanel.add(this.sharedTerminologyList);
  this.westPanel.setActiveTab(0);
  
  //
  // CENTER
  this.centerPanel = this.createCenterPanel();
  
  //
  // EAST
  this.eastPanel = this.createEastPanel();
  
  this.languageListPanel = new FuzeIn.LanguagePanel();
  this.languageListPanel.on({'get_languages': {fn:this.onGetLanguages, scope:this}});  
  this.languageListPanel.on({'select_language': {fn:this.onSelectLanguage, scope:this}});  
  
  this.domainListPanel = new FuzeIn.DomainPanel();
  this.domainListPanel.on({'get_domains': {fn:this.onGetDomains, scope:this}});  
  this.domainListPanel.on({'select_domain': {fn:this.onSelectDomain, scope:this}});    

  this.typeListPanel = new FuzeIn.TypePanel();
  this.typeListPanel.on({'get_types': {fn:this.onGetTypes, scope:this}});  
  this.typeListPanel.on({'select_type': {fn:this.onSelectType, scope:this}});  
   
  this.eastPanel.add(this.languageListPanel);
  this.eastPanel.add(this.domainListPanel);
  this.eastPanel.add(this.typeListPanel);
  this.eastPanel.setActiveTab(0);
  
  //
  this.layout = 'border';
  this.add(this.westPanel);
  this.add(this.centerPanel);
  this.add(this.eastPanel);
  
  // Set up window events
  this.on({'render': {fn:this.onRendered, scope:this}});
  this.on({'request_data_ready': {fn:this.onRequestDataAvailable, scope:this}});
  this.on({'remote_application_loaded': {fn:this.onRemoteApplicationLoaded, scope:this}}); 
 },
 
 destroy : function()
 {
 	// Clean up Lemma
 	if(this.lemmaUnit !== null)
 	{
 	 this.lemmaUnit.destroy();
 	 delete this.lemmaUnit;
 	 this.lemmaUnit = null;
 	}
 	
 	//
  // Clean up terminology units
  this.terminologyUnitDS.each(function(dsRecord, index, count)
  {
   dsRecord.data.unit_object.destroy()
   delete dsRecord.data.unit_object;
  });
  
  //
  // Clean up vetting notes
  this.vettingNoteDS.each(function(dsRecord, index, count)
  {
   dsRecord.data.unit_object.destroy()
   delete dsRecord.data.unit_object;
  });
  
  //
  if(this.groupSubmittalDS !== null)
  {
  	this.groupSubmittalDS.removeAll();
  	delete this.groupSubmittalDS;
  	this.groupSubmittalDS = null;
  }
  
  //
  if(this.shareForm !== null)
  {
  	this.shareForm.destroy();
  	delete this.shareForm;
  	this.shareForm = null;
  }
  
  if(this.publishForm !== null)
  {
   this.publishForm.destroy();
   delete this.publishForm;
   this.publishForm = null;
  }
  
  if(this.searchForm !== null)
  {
   this.searchForm.destroy();
   delete this.searchForm;
   this.searchForm = null;
  }

  if(this.templateForm !== null)
  {
   this.templateForm.destroy();
   delete this.templateForm;
   this.templateForm = null;
  }
  
  if(this.languageListPanel !== null)
  {
   this.languageListPanel.destroy();
   delete this.languageListPanel;
   this.languageListPanel = null;  	
  }

  if(this.domainListPanel !== null)
  {
   this.domainListPanel.destroy();
   delete this.domainListPanel;
   this.domainListPanel = null;   
  }

  if(this.typeListPanel !== null)
  {
   this.typeListPanel.destroy();
   delete this.typeListPanel;
   this.typeListPanel = null;   
  }

  if(this.eastPanel !== null)
  {
   this.eastPanel.destroy();
   delete this.eastPanel;
   this.eastPanel = null;   
  }
  
  if(this.centerPanel !== null)
  {
   this.centerPanel.destroy();
   delete this.centerPanel;
   this.centerPanel = null;   
  }
  
  if(this.westPanel !== null)
  {
   this.westPanel.destroy();
   delete this.westPanel;
   this.westPanel = null;   
  }  

  // Call base class
  FuzeIn.FuzeInWindow.superclass.destroy.call(this);
 },
 
 show : function()
 {
  // Call base class
  FuzeIn.FuzeInWindow.superclass.show.call(this);
 },
 
 resize : function(object, width, height)
 {
  // Call base class
  FuzeIn.FuzeInWindow.superclass.resize.call(object, width, height);  
 },
 
 onRendered : function(_this, layout)
 {
 	this.updateToolbar();
  this.setPendingChanges(false);
  
  //
  this.notifyService('get_environment');
 },
 
 //
 // GUI
 //
 createWestPanel : function()
 {
  var panel = new Ext.TabPanel({
    region:'west',
    activeTab:0,
    split:true,
    collapsible:false,
    autoScroll:false,
    layoutOnTabChange:true,
    enableTabScroll:true,
    resizeTabs:true,
    //minTabWidth:115,
    //tabWidth:135,
    border:true,
    tabPosition:'bottom',
    bodyStyle:'padding:3px 0px 3px 3px', // top, right, bottom, left
    collapseMode:'mini',
    width:'25%',
    baseCls:'x-plain'
  });
  
  //
  return panel;
 },
 
 createTerminologyListPanel : function()
 {
  var colModel = new Ext.grid.ColumnModel([
    {id:'terminology_name', sortable:true, header:'Terminology', menuDisabled:true, dataIndex:'terminology_name'},
    {id:'terminology_date', sortable:true, header:'Date', menuDisabled:true, dataIndex:'terminology_date'},
    {id:'terminology_status', sortable:true, header:'Status', menuDisabled:true, dataIndex:'terminology_status'}
   ]);
     
  //
  var panel = new Ext.grid.GridPanel({
    enableColumnHide:false,
    enableColumnMove:false,
    autoScroll:false,
    border:true,
    autoExpandColumn:'terminology_name',
    title:'Terminologies',
    iconCls:'fuzein_terminology_tab_icon',
    bodyStyle:'padding:3px',
    cm:colModel,
    store:this.terminologyDocumentsDS,
    sm:new Ext.grid.RowSelectionModel({singleSelect:true}),
    view: new Ext.grid.GroupingView({
      ignoreAdd:true,
      enableGroupingMenu:false,
      enableNoGroups:false,
      hideGroupedColumn:true,
      showGroupName:false,
      deferEmtyText:false,
      emptyText:'No Terminologies to display'
     })
    });

  //
  panel.on({'rowdblclick': {fn:this.onSelectTerminology, scope:this}});

  // 
  return panel;   	
 },
 
 //
 //
 createCenterPanel : function()
 {
  // Create panel
  var panel = new Ext.Panel({
    autoScroll:true,
    region:'center',
    margins:'3 0 3 0',  // top, right, bottom, left
    cmargins:'3 3 3 3', 
    bodyStyle:'padding:3px',
    draggable:false
  });  
  
  //
  return panel;
 }, 

 //
 //
 createEastPanel : function()
 {
  var panel = new Ext.TabPanel({
    region:'east',
    activeTab:0,
    split:true,
    collapsible:false,
    autoScroll:false,
    enableTabScroll:true,
    resizeTabs:true,
    minTabWidth:80,
    tabWidth:105,
    layoutOnTabChange:true,
    border:true,
    tabPosition:'bottom',
    bodyStyle:'padding:3px 3px 3px 0px', // top, right, bottom, left
    collapseMode:'mini',
    width:'28%',
    baseCls:'x-plain'
  });
  
  //
  return panel;
 },
 
 //
 //
 //  
 prepareTerminologyObject : function()
 {
  //
  // Get terminology Descriptor
  var terminologyDescriptor = this.lemmaUnit.getTerminologyDescriptor();

  //
  // Get Lemma data
  var lemmaUnitData = this.lemmaUnit.getUnitData();
  
  //
  // Get All Senses
  var senseArray = new Array();
  
  for(var iIndex = 0; iIndex < this.terminologyUnitDS.getCount(); iIndex++)
  {
   var senseObject = this.terminologyUnitDS.getAt(iIndex).data.unit_object.getUnitData();
   
   var record = new Object({
    Equivalent:senseObject
   });
   
   senseArray.push(record);
   delete record;
  }
  
  //
  // Get All vetting Notes
  var vettingNotesArray = new Array();
  
  for(var iIndex = 0; iIndex < this.vettingNoteDS.getCount(); iIndex++)
  {
   var vettingNote = this.vettingNoteDS.getAt(iIndex).data.unit_object.getUnitData();
   
   var record = new Object({
    VettingNotes:vettingNote
   });
   
   vettingNotesArray.push(record);
   delete record;
  }
  
  // 
  // Combine into one object
  var terminologyRecord = new Object({
   Lemma:lemmaUnitData,
   Senses:senseArray,
   VettingNotes:vettingNotesArray
  });
  
  //
  // Get Terminology Name
  var terminologyName = this.lemmaUnit.getTerminologyName();
  
  if(terminologyName === '' || typeof(terminologyName) === 'undefined')
  {
   terminologyName = this.lemmaUnit.generateTerminologyName();
  }
  
  //
  // Create record
  var preparedRecord = new Object({ 
   terminology_data:terminologyRecord,
   terminology_folder:terminologyDescriptor.terminology_folder,
   terminology_name:terminologyName,
   submittal_type:'json'
  });
  
  // Clean up
  delete terminologyRecord;
  delete vettingNotesArray;
  delete senseArray;
  delete lemmaUnitData;
  delete terminologyDescriptor;   	
  
  //
  return preparedRecord;
 },
 
 //
 // Events
 //
 resetToolbar : function()
 {
 	var toolBar = this.getTopToolbar();
 	
  toolBar.findById('fuzein_terminology_operation_new').enable();
  toolBar.findById('fuzein_terminology_operation_save').enable();
  toolBar.findById('fuzein_terminology_operation_delete').disable();
  toolBar.findById('fuzein_terminology_operation_saveas').disable();
  toolBar.findById('fuzein_terminology_operation_refresh_term').enable();
  toolBar.findById('fuzein_terminology_operation_submit').disable();
  toolBar.findById('fuzein_terminology_view_document').enable();
  toolBar.findById('fuzein_terminology_view_metadata').enable();
  //toolBar.findById('fuzein_terminology_view_templates').disable();
  toolBar.findById('fuzein_terminology_text').enable();
  //toolBar.findById('fuzein_terminology_image').disable();
  //toolBar.findById('fuzein_terminology_audio').disable();
  //toolBar.findById('fuzein_terminology_video').disable();
  //toolBar.findById('fuzein_terminology_vetting_note').disable();
  toolBar.findById('fuzein_terminology_vetting_reject').disable();
  toolBar.findById('fuzein_terminology_publish_terminology').disable();
  //toolBar.findById('fuzein_terminology_transport_upload').disable();
  //toolBar.findById('fuzein_terminology_transport_download').enable();
  //toolBar.findById('fuzein_terminology_share_terminology').enable();
  //toolBar.findById('fuzein_terminology_toolbar_search').enable();     	
 },
 
 updateToolbar : function(selectedAction, enable)
 {
  var toolBar = this.getTopToolbar();
   
  //
  if(selectedAction === null || typeof(selectedAction) == 'undefined')
  {
   if(this.lemmaUnit !== null && this.lemmaUnit.getTerminologyStatus() === 'NEW_TERMINOLOGY')
 		{
    toolBar.findById('fuzein_terminology_operation_new').enable();
    toolBar.findById('fuzein_terminology_operation_save').enable();
    toolBar.findById('fuzein_terminology_operation_delete').enable();
    toolBar.findById('fuzein_terminology_operation_saveas').enable();
    toolBar.findById('fuzein_terminology_operation_refresh_term').enable();
    toolBar.findById('fuzein_terminology_operation_submit').enable();
    toolBar.findById('fuzein_terminology_view_document').enable();
    toolBar.findById('fuzein_terminology_view_metadata').enable();
    //toolBar.findById('fuzein_terminology_view_templates').disable();
    toolBar.findById('fuzein_terminology_text').enable();
    //toolBar.findById('fuzein_terminology_image').disable();
    //toolBar.findById('fuzein_terminology_audio').disable();
    //toolBar.findById('fuzein_terminology_video').disable();
    //toolBar.findById('fuzein_terminology_vetting_note').disable();
    toolBar.findById('fuzein_terminology_vetting_reject').disable();
    toolBar.findById('fuzein_terminology_publish_terminology').disable();
    //toolBar.findById('fuzein_terminology_transport_upload').disable();
    //toolBar.findById('fuzein_terminology_transport_download').enable();
    //toolBar.findById('fuzein_terminology_share_terminology').enable();
    //toolBar.findById('fuzein_terminology_toolbar_search').enable();    
 		}
 		else if(this.lemmaUnit !== null && this.lemmaUnit.getTerminologyStatus() === 'UPDATED_TERMINOLOGY')
 		{
    toolBar.findById('fuzein_terminology_operation_new').enable();
    toolBar.findById('fuzein_terminology_operation_save').enable();
    toolBar.findById('fuzein_terminology_operation_delete').enable();
    toolBar.findById('fuzein_terminology_operation_saveas').enable();
    toolBar.findById('fuzein_terminology_operation_refresh_term').enable();
    toolBar.findById('fuzein_terminology_operation_submit').enable();
    toolBar.findById('fuzein_terminology_view_document').enable();
    toolBar.findById('fuzein_terminology_view_metadata').enable();
   // toolBar.findById('fuzein_terminology_view_templates').disable();
    toolBar.findById('fuzein_terminology_text').enable();
    //toolBar.findById('fuzein_terminology_image').disable();
    //toolBar.findById('fuzein_terminology_audio').disable();
    //toolBar.findById('fuzein_terminology_video').disable();
    //toolBar.findById('fuzein_terminology_vetting_note').disable();
    toolBar.findById('fuzein_terminology_vetting_reject').disable();
    toolBar.findById('fuzein_terminology_publish_terminology').disable();
    //toolBar.findById('fuzein_terminology_transport_upload').disable();
    //toolBar.findById('fuzein_terminology_transport_download').enable();
    //toolBar.findById('fuzein_terminology_share_terminology').enable();
    //toolBar.findById('fuzein_terminology_toolbar_search').enable();    			
 		}
   else if(this.lemmaUnit !== null && this.lemmaUnit.getTerminologyStatus() === 'SUBMITTED_TERMINOLOGY')
   {
    toolBar.findById('fuzein_terminology_operation_new').enable();
    toolBar.findById('fuzein_terminology_operation_save').disable();
    toolBar.findById('fuzein_terminology_operation_delete').disable();
    toolBar.findById('fuzein_terminology_operation_saveas').enable();
    toolBar.findById('fuzein_terminology_operation_refresh_term').enable();
    toolBar.findById('fuzein_terminology_operation_submit').disable();
    toolBar.findById('fuzein_terminology_view_document').enable();
    toolBar.findById('fuzein_terminology_view_metadata').enable();
    //toolBar.findById('fuzein_terminology_view_templates').disable();
    toolBar.findById('fuzein_terminology_text').disable();
    //toolBar.findById('fuzein_terminology_image').disable();
    //toolBar.findById('fuzein_terminology_audio').disable();
    //toolBar.findById('fuzein_terminology_video').disable();
    //toolBar.findById('fuzein_terminology_vetting_note').enable();
    toolBar.findById('fuzein_terminology_vetting_reject').enable();
    toolBar.findById('fuzein_terminology_publish_terminology').enable();
    //toolBar.findById('fuzein_terminology_transport_upload').disable();
    //toolBar.findById('fuzein_terminology_transport_download').enable();
    //toolBar.findById('fuzein_terminology_share_terminology').enable();
    //toolBar.findById('fuzein_terminology_toolbar_search').enable();       
   }  		
   else if(this.lemmaUnit !== null && this.lemmaUnit.getTerminologyStatus() === 'REJECTED_TERMINOLOGY')
   {
    toolBar.findById('fuzein_terminology_operation_new').enable();
    toolBar.findById('fuzein_terminology_operation_save').enable();
    toolBar.findById('fuzein_terminology_operation_delete').enable();
    toolBar.findById('fuzein_terminology_operation_saveas').enable();
    toolBar.findById('fuzein_terminology_operation_refresh_term').enable();
    toolBar.findById('fuzein_terminology_operation_submit').enable();
    toolBar.findById('fuzein_terminology_view_document').enable();
    toolBar.findById('fuzein_terminology_view_metadata').enable();
    //toolBar.findById('fuzein_terminology_view_templates').disable();
    toolBar.findById('fuzein_terminology_text').enable();
    //toolBar.findById('fuzein_terminology_image').disable();
    //toolBar.findById('fuzein_terminology_audio').disable();
    //toolBar.findById('fuzein_terminology_video').disable();
    //toolBar.findById('fuzein_terminology_vetting_note').disable();
    toolBar.findById('fuzein_terminology_vetting_reject').disable();
    toolBar.findById('fuzein_terminology_publish_terminology').disable();
    //toolBar.findById('fuzein_terminology_transport_upload').disable();
    //toolBar.findById('fuzein_terminology_transport_download').enable();
    //toolBar.findById('fuzein_terminology_share_terminology').enable();
    //toolBar.findById('fuzein_terminology_toolbar_search').enable();       
   }
   else if(this.lemmaUnit !== null && this.lemmaUnit.getTerminologyStatus() === 'APPROVED_TERMINOLOGY')
   {
    toolBar.findById('fuzein_terminology_operation_new').enable();
    toolBar.findById('fuzein_terminology_operation_save').disable();
    toolBar.findById('fuzein_terminology_operation_delete').disable();
    toolBar.findById('fuzein_terminology_operation_saveas').enable();
    toolBar.findById('fuzein_terminology_operation_refresh_term').enable();
    toolBar.findById('fuzein_terminology_operation_submit').disable();
    toolBar.findById('fuzein_terminology_view_document').enable();
    toolBar.findById('fuzein_terminology_view_metadata').enable();
    //toolBar.findById('fuzein_terminology_view_templates').disable();
    toolBar.findById('fuzein_terminology_text').disable();
    //toolBar.findById('fuzein_terminology_image').disable();
    //toolBar.findById('fuzein_terminology_audio').disable();
    //toolBar.findById('fuzein_terminology_video').disable();
    //toolBar.findById('fuzein_terminology_vetting_note').disable();
    toolBar.findById('fuzein_terminology_vetting_reject').disable();
    toolBar.findById('fuzein_terminology_publish_terminology').disable();
    //toolBar.findById('fuzein_terminology_transport_upload').disable();
    //toolBar.findById('fuzein_terminology_transport_download').enable();
    //toolBar.findById('fuzein_terminology_share_terminology').enable();
    //toolBar.findById('fuzein_terminology_toolbar_search').enable();       
   }
  }
  else
  {
  	if(enable === true)
  	{
  	 toolBar.findById(selectedAction).enable();
  	}
  	else
  	{
    toolBar.findById(selectedAction).disable();
  	}
  }
 }, 
 
 //
 onToggleDocumentMode : function(item, checked)
 {
  if(checked == true)
   this.westPanel.expand();
  else
   this.westPanel.collapse();
 },
 
 //
 onToggleMetadataMode : function(item, checked)
 {
  if(checked == true)
   this.eastPanel.expand();
  else
   this.eastPanel.collapse();
 },
 
 //
 onSearch : function(searchParameters)
 {
  //
  var record = new Object({
    starting_node_id:'',
    file_name:searchParameters[0],
    file_content:searchParameters[1]
  });

  if(record !== null)
  {
   var jsonParams = Ext.util.JSON.encode(record);
   delete record;  
   
   // Submit
   this.notifyService('search_cm', jsonParams);
  }  
 },
 
 //
 onGetCollectionListing : function()
 {
 	this.notifyService('get_collections');
 },
 
 onGetLanguages : function()
 {
  this.notifyService('get_languages');
 }, 
 
 onGetDomains : function()
 {
  this.notifyService('get_domains');
 }, 
 
 onGetTypes : function()
 {
  this.notifyService('get_types');
 }, 
 
 //
 onUnitActivate : function(unitInfo)
 {
 	if(this.activeUnitObject !== null)
 	{
 		this.activeUnitObject.unit_ref_object.setFocus(false);
 	}
 	
 	this.activeUnitObject = unitInfo;
 	this.activeUnitObject.unit_ref_object.setFocus(true);
 },
 
 //
 onSelectLanguage : function(selectedRecord)
 {
 	if(this.activeUnitObject !== null && typeof(this.activeUnitObject.unit_ref_object) !== 'undefined')
 	{
 		this.activeUnitObject.unit_ref_object.setUnitMetadata('language', selectedRecord);
 	}
 },
 
 onSelectDomain : function(selectedRecord)
 {
  if(this.activeUnitObject !== null && typeof(this.activeUnitObject.unit_ref_object) !== 'undefined')
  {
   this.activeUnitObject.unit_ref_object.setUnitMetadata('domain', selectedRecord);
  }
 },
 
 onSelectType: function(selectedRecord)
 {
  if(this.activeUnitObject !== null && typeof(this.activeUnitObject.unit_ref_object) !== 'undefined')
  {
   this.activeUnitObject.unit_ref_object.setUnitMetadata('type', selectedRecord);
  }
 },
 
 //
 refreshTerminologies : function()
 {
  //
  var record = new Object({
    terminology_folder:this.userRepositoryRoot
  });

  if(record !== null)
  {
   var jsonParams = Ext.util.JSON.encode(record);
   delete record;  
   
   // Submit
   this.notifyService('get_terminologies', jsonParams);
  }  	
 },
 
 //
 onSelectTerminology : function(grid, rowIndex, event)
 {
 	event.stopEvent();
 	
 	//
 	//
  if(this.onValidateTerminologyUpdate() === true)
  {
  	
  }
 	else
 	{
   //
   // Reset and repaint
   this.resetTerminologyManager();
   this.centerPanel.doLayout(); 
 	}
 	
 	//
  // Get terminology path and fetch from backend
  var selectedRecord = grid.store.getAt(rowIndex);

 	var record = new Object({
 		terminology_folder:selectedRecord.get('terminology_folder'),
   terminology_name:selectedRecord.get('terminology_name')
  });
  
		if(record !== null)
	 {
	  var jsonParams = Ext.util.JSON.encode(record);
	  delete record; 	
	  
			// Submit
			this.notifyService('get_terminology_document', jsonParams);
	 }
 },
 
 //
 onValidateTerminologyUpdate : function()
 {
 	var terminologyModified = false;
 	
 	//
 	// Check if Lemma has been modified
 	if(this.lemmaUnit.hasModifications() === true)
 	{
 		terminologyModified = true;
 	}
  
  //
  // Check if any Terminology unit have been modified
  if(terminologyModified === false)
  {
	 	for(var iIndex = 0; iIndex < this.terminologyUnitDS.length; iIndex++)
	 	{
	 		var terminologyObject = this.terminologyUnitDS[iIndex];
	 		
	 		if(terminologyObject.unit_object.hasModifications() === true)
	 		{
	 			terminologyModified = true;
	 			break;
	 		}
	 	}
  }
  
  return terminologyModified;
 },
 
 //
 resetTerminologyManager : function()
 {
  //
  // Destroy Lemma
  if(this.lemmaUnit !== null)
  {
  	this.lemmaUnit.resetUnit();
  }
  else
  {
   this.lemmaUnit = new FuzeIn.Terminology_Lemma({reference_id:Ext.id()});
   this.lemmaUnit.on({'activate_terminology_unit': {fn:this.onUnitActivate, scope:this}});
   
   this.centerPanel.add(this.lemmaUnit.getEditor());
  }
  
  //
  // Get terminology Descriptor information and give to lemma
  var terminologyDescriptorObject = new Object({
   terminology_status:'NOT_ASSIGNED',
   terminology_folder:this.userRepositoryRoot
  });
  
  this.lemmaUnit.setTerminologyDescriptor(terminologyDescriptorObject);
  delete terminologyDescriptorObject;  

  //
  // Destroy all terminology units
  for(var iIndex = 0; iIndex < this.terminologyUnitDS.getCount(); iIndex++)
  {
   var terminologyObject = this.terminologyUnitDS.getAt(iIndex);
   
   this.centerPanel.remove(terminologyObject.data.unit_object.getEditor(), true);
   terminologyObject.data.unit_object.destroy();
   
   delete terminologyObject; 
  }
  
  //
  //  Destroy all vetting notes
  for(var iIndex = 0; iIndex < this.vettingNoteDS.getCount(); iIndex++)
  {
   var noteObject = this.vettingNoteDS.getAt(iIndex);
   
   this.centerPanel.remove(noteObject.data.unit_object.getEditor(), true);
   noteObject.data.unit_object.destroy();
   
   delete noteObject; 
  }
  
  // Clear Datastores
  this.terminologyUnitDS.removeAll();
  this.vettingNoteDS.removeAll();
  
  //
  this.resetToolbar();
 }, 
 
 //
 onSaveTerminology : function()
 {
 	var record = this.prepareTerminologyObject();

  if(record !== null)
  {
   var jsonParams = Ext.util.JSON.encode(record);
   delete record;  
   
   //
   // Submit
   if(this.lemmaUnit.getTerminologyStatus() == 'NOT_ASSIGNED')
   {
    this.notifyService('save_terminology', jsonParams);
   }
   else if(this.lemmaUnit.getTerminologyStatus() == 'NEW_TERMINOLOGY')
   {
    this.notifyService('update_terminology', jsonParams);
   }   
   else if(this.lemmaUnit.getTerminologyStatus() == 'UPDATED_TERMINOLOGY')
   {
   	this.notifyService('update_terminology', jsonParams);
   }
   else if(this.lemmaUnit.getTerminologyStatus() == 'REJECTED_TERMINOLOGY')
   {
    this.notifyService('update_terminology', jsonParams);
   }   
  }  
 },
 
 //
 onPublish : function(selectedCollection)
 {
  //
  // Get terminology Descriptor
  var terminologyDescriptor = this.lemmaUnit.getTerminologyDescriptor();

  //
  // Get Terminology Name
  var terminologyName = this.lemmaUnit.getTerminologyName();
  
  if(terminologyName == '')
  {
   terminologyName = this.lemmaUnit.generateTerminologyName();
  }

  //
  // Submit to backend
  var record = new Object({
   terminology_folder:terminologyDescriptor.terminology_folder,
   terminology_name:terminologyName,
   collection:selectedCollection,
   submittal_type:'json'
  });
  
  //
  delete terminologyDescriptor;
  
  if(record !== null)
  {
   var jsonParams = Ext.util.JSON.encode(record);
   delete record;  
   delete selectedCollection;

   // Submit
   this.notifyService('publish_terminology', jsonParams);
  }
 },
 
 //
 onDeleteTerminology : function()
 {
  //
  // Get terminology Descriptor
  var terminologyDescriptor = this.lemmaUnit.getTerminologyDescriptor();
  
  //
  var record = new Object({
   terminology_folder:terminologyDescriptor.terminology_folder,
   terminology_name:terminologyDescriptor.terminology_name
  });
  
  //
  delete terminologyDescriptor;
  
  if(record !== null)
  {
   var jsonParams = Ext.util.JSON.encode(record);
   delete record;  
   
   // Submit
   if(this.lemmaUnit.getTerminologyStatus() == 'NEW_TERMINOLOGY' || 
      this.lemmaUnit.getTerminologyStatus() == 'UPDATED_TERMINOLOGY' || 
      this.lemmaUnit.getTerminologyStatus() == 'REJECTED_TERMINOLOGY' ||
      this.lemmaUnit.getTerminologyStatus() == 'APPROVED_TERMINOLOGY')
   {
    this.notifyService('delete_terminology', jsonParams);
   }
  }
 },
 
 //
 // Unit deletions
 //
 onDeleteSense : function(panel)
 {
  var recordIndex = this.terminologyUnitDS.findExact('reference_id', panel.reference_id); 	
 	
  if(recordIndex !== -1)
  {
   var terminologyRecord = this.terminologyUnitDS.getAt(recordIndex);
   var terminologyUnit = terminologyRecord.data.unit_object;
   
   //
   this.centerPanel.remove(terminologyUnit.getEditor(), true);
   terminologyUnit.destroy();
   delete terminologyUnit;
   
   //
   this.terminologyUnitDS.removeAt(recordIndex);
   this.terminologyUnitDS.commitChanges();
   
   //
   this.updateToolbar(); 	
  }
 },
 
 //
 onDeleteNote : function(panel)
 {
  var recordIndex = this.vettingNoteDS.findExact('reference_id', panel.reference_id);  
  
  if(recordIndex !== -1)
  {
   var terminologyRecord = this.vettingNoteDS.getAt(recordIndex);
   var terminologyUnit = terminologyRecord.data.unit_object;
   
   //
   this.centerPanel.remove(terminologyUnit.getEditor(), true);
   terminologyUnit.destroy();
   delete terminologyUnit;
   
   //
   this.vettingNoteDS.removeAt(recordIndex);
   this.vettingNoteDS.commitChanges();
   
   //
   this.updateToolbar();  
  }
 },
 
 //
 // Received when the requested application is instantiated and ready
 //
 onRemoteApplicationLoaded : function(applicationConstructor, submittedData)
 {
 },
 
 //
 // Received when an Application Submits data to this Application
 //
 onInterApplicationDataSubmitted : function(submittedFromApplication, applicationMessage, applicationData)
 {
  if(submittedFromApplication == "FuzeIn.ContentViewer")
  {
   if(applicationMessage === 'load_document')
   {
    var record = new Object({
     node_path:applicationData.node_path
    });
    
    if(record !== null)
    {
     var jsonParams = Ext.util.JSON.encode(record);
     delete record;
     
     // Submit
     this.notifyService('load_document', jsonParams);
    }
   }
  }  
 },
 
 //
 // Backend Request handlers
 //
 onRequestDataAvailable : function(actionMessage, queryResults)
 {
 	if(actionMessage === 'get_environment')
 	{
 		this.getEnvironment(queryResults);
 	}
 	else if(actionMessage === "get_languages")
  {
   if(this.languageListPanel !== null)
   {
    this.languageListPanel.setData(queryResults);
   }
  }
  else if(actionMessage === "get_domains")
  {
   if(this.domainListPanel !== null)
   {
    this.domainListPanel.setData(queryResults);
   }
  }
  else if(actionMessage === "get_types")
  {
   if(this.typeListPanel !== null)
   {
    this.typeListPanel.setData(queryResults);
   }
  }    
  else if(actionMessage === "load_document")
  {
   this.loadDocument(queryResults.documents[0].loaded_documents);
  }
  else if(actionMessage === "get_terminologies")
  {
  	this.getTerminologies(queryResults);
  }
  else if(actionMessage === "get_terminology_document")
  {
  	this.getTerminologyDocument(queryResults);
  }
  else if(actionMessage === "get_collections")
  { 
  	if(this.publishForm !== null)
  	{
  		this.publishForm.setData(queryResults);
  	}
  }
  else if(actionMessage === "save_terminology")
  {
   this.saveTerminology(queryResults);
  }
  else if(actionMessage === "update_terminology")
  {
   this.updateTerminology(queryResults);
  }  
  else if(actionMessage === "delete_terminology")
  {
   this.deleteTerminology(queryResults);
  }  
  else if(actionMessage === "reject_terminology")
  {
   this.rejectTerminology(queryResults);
  }   
  else if(actionMessage === "submit_terminology")
  {
   this.submitTerminology(queryResults);
  } 
  else if(actionMessage === "publish_terminology")
  {
  	this.publishTerminology(queryResults);
  }
 },
 
 //
 getEnvironment : function(queryResults)
 {
 	//
 	this.userRepositoryRoot = queryResults.service_data.user_root_folder;
 	this.resetTerminologyManager();
 	
 	//
 	// 
  var isVetter = false
  var recordDef = Ext.data.Record.create(this.groupSubmittalDef);

 	for(var iIndex = 0; iIndex < queryResults.service_data.terminology_profile.groups.length; iIndex++)
 	{
 		var groupSubmittalObject = queryResults.service_data.terminology_profile.groups[iIndex];

 		var groupRecord = new recordDef({
    group_id:groupSubmittalObject.group_id,
    group_name:groupSubmittalObject.group_name
   });
   
   //
   if(groupSubmittalObject.is_vetter === true)
   {
   	isVetter = true;
   }

   //
   this.groupSubmittalDS.add(groupRecord); 
   delete groupRecord;
 	}
 	
 	//
 	// Hide Vetting Toolbar Group if user is not a vetter
 	if(isVetter === false)
 	{
 		this.getTopToolbar().get('fuzein_terminology_vetting_group').hide();
 	}
 	
  // Sort
  var currentSort = this.groupSubmittalDS.getSortState();
  this.groupSubmittalDS.sort(currentSort.field, currentSort.direction); 	
 	
 	//
  // Get user terminologies
  this.refreshTerminologies();
  this.centerPanel.doLayout(); 
 },

 //
 getTerminologies : function(queryResults)
 {
 	// Clear DS
 	this.terminologyDocumentsDS.removeAll();
 	
 	// Parse
	 var recordDef = Ext.data.Record.create(this.terminologyDocumentsDef);

	 for(var iIndex = 0; iIndex < queryResults.service_data.length; iIndex++)
	 {
	 	var adapterData = queryResults.service_data[iIndex];
	 	
	 	for(var iAdapterDataIndex = 0; iAdapterDataIndex < adapterData.adapter_data.length; iAdapterDataIndex++)
	 	{
				var terminologyRecord = new recordDef({
  		 terminology_folder:adapterData.adapter_data[iAdapterDataIndex].terminology_folder,
  		 terminology_name:adapterData.adapter_data[iAdapterDataIndex].terminology_name,
  		 terminology_date:adapterData.adapter_data[iAdapterDataIndex].terminology_date,
  		 terminology_status:adapterData.adapter_data[iAdapterDataIndex].terminology_status
   	});
  		 		
    //
    this.terminologyDocumentsDS.add(terminologyRecord);	
    delete terminologyRecord;
	 	}
	 }
	 
  // Sort
  var currentSort = this.terminologyDocumentsDS.getSortState();
  this.terminologyDocumentsDS.sort(currentSort.field, currentSort.direction);
 },
 
 //
 getTerminologyDocument : function(queryResults)
 {
  for(var iIndex = 0; iIndex < queryResults.service_data.length; iIndex++)
	 {
	 	//
	 	// Get terminology Descriptor information and give to lemma
	 	var terminologyDescriptorObject = new Object({
	 		terminology_date:queryResults.service_data[iIndex].adapter_data.terminology_date,
	 		terminology_name:queryResults.service_data[iIndex].adapter_data.terminology_name,
	 		terminology_original_author:queryResults.service_data[iIndex].adapter_data.terminology_original_author,
	 		terminology_modification_author:queryResults.service_data[iIndex].adapter_data.terminology_modification_author,
	 		terminology_folder:queryResults.service_data[iIndex].adapter_data.terminology_folder,
	 		terminology_schema_name:queryResults.service_data[iIndex].adapter_data.terminology_schema_name,
	 		terminology_status:queryResults.service_data[iIndex].adapter_data.terminology_status
	 	});
	 	
	 	this.lemmaUnit.setTerminologyDescriptor(terminologyDescriptorObject);
	 	delete terminologyDescriptorObject;
	 	
   //
   // 
	 	var lexicalEntry = queryResults.service_data[iIndex].adapter_data.lexical_entry;
	 	
	 	//
	 	// Process Lemma
	 	var terminologyLemmaObject = lexicalEntry.terminology_lemma;
	  this.lemmaUnit.setUnitData(terminologyLemmaObject, this.languageListPanel);
	  
	  //
	  // Process Senses
	  for(var iSenseIndex = 0; iSenseIndex < lexicalEntry.terminology_senses.length; iSenseIndex++)
	  {
	  	var terminologySenseObject = lexicalEntry.terminology_senses[iSenseIndex];
	  	
	  	//
	  	// Create Sense Object
	  	var terminologySenseUnit = new FuzeIn.Terminology_Sense({
	  		tab_index:this.terminologyUnitDS.getCount() + 1
	  	});
	  	
	  	terminologySenseUnit.setUnitData(terminologySenseObject, this.languageListPanel);
	  	
    //
    // Add to List
    var recordDef = Ext.data.Record.create(this.terminologyUnitListDef);
    
    var Record = new recordDef({
     unit_id:this.terminologyUnitDS.getCount() + 1,
     unit_object:terminologySenseUnit
    });

    //
    this.terminologyUnitDS.add(Record);
    delete Record;

    // Set up events
    terminologySenseUnit.on({'activate_terminology_unit': {fn:this.onUnitActivate, scope:this}});
    terminologySenseUnit.on({'delete_sense': {fn:this.onDeleteSense, scope:this}});    
    
    // Add Unit to work area
    this.centerPanel.add(terminologySenseUnit.getEditor());
	  }
	  
	  //
	  // Process Notes
	  
	 }
	 
  //
  // Paint and update toolbar
  this.centerPanel.doLayout();	 
  this.updateToolbar();
 }, 
 
 //
 saveTerminology : function(queryResults)
 {
  var recordDef = Ext.data.Record.create(this.terminologyDocumentsDef);
 	  
  //
  for(var iIndex = 0; iIndex < queryResults.service_data.length; iIndex++)
  {
   //
   // Get terminology Descriptor information and give to lemma
   var terminologyDescriptorObject = new Object({
    terminology_date:queryResults.service_data[iIndex].adapter_data.terminology_date,
    terminology_name:queryResults.service_data[iIndex].adapter_data.terminology_name,
    terminology_original_author:queryResults.service_data[iIndex].adapter_data.terminology_original_author,
    terminology_modification_author:queryResults.service_data[iIndex].adapter_data.terminology_modification_author,
    terminology_folder:queryResults.service_data[iIndex].adapter_data.terminology_folder,
    terminology_schema_name:queryResults.service_data[iIndex].adapter_data.terminology_schema_name,
    terminology_status:queryResults.service_data[iIndex].adapter_data.terminology_status
   });
   
   this.lemmaUnit.setTerminologyDescriptor(terminologyDescriptorObject);
   delete terminologyDescriptorObject;
   
   //
   // Add to Terminology Listing DS
   //
   if(queryResults.service_data[iIndex].adapter_data.terminology_status == 'NEW_TERMINOLOGY')
   {
	   var terminologyRecord = new recordDef({
	    terminology_folder:queryResults.service_data[iIndex].adapter_data.terminology_folder,
	    terminology_name:queryResults.service_data[iIndex].adapter_data.terminology_name,
	    terminology_date:queryResults.service_data[iIndex].adapter_data.terminology_date,
	    terminology_status:queryResults.service_data[iIndex].adapter_data.terminology_status
	   });
	      
	   //
	   this.terminologyDocumentsDS.add(terminologyRecord); 
	   delete terminologyRecord;
	  }
  }
  
  // Sort
  var currentSort = this.terminologyDocumentsDS.getSortState();
  this.terminologyDocumentsDS.sort(currentSort.field, currentSort.direction);
  
  //
  this.updateToolbar();
 },
 
 updateTerminology : function(queryResults)
 {
  var recordDef = Ext.data.Record.create(this.terminologyDocumentsDef);
    
  //
  for(var iIndex = 0; iIndex < queryResults.service_data.length; iIndex++)
  {
   //
   // Get terminology Descriptor information and give to lemma
   var terminologyDescriptorObject = new Object({
    terminology_date:queryResults.service_data[iIndex].adapter_data.terminology_date,
    terminology_name:queryResults.service_data[iIndex].adapter_data.terminology_name,
    terminology_original_author:queryResults.service_data[iIndex].adapter_data.terminology_original_author,
    terminology_modification_author:queryResults.service_data[iIndex].adapter_data.terminology_modification_author,
    terminology_folder:queryResults.service_data[iIndex].adapter_data.terminology_folder,
    terminology_schema_name:queryResults.service_data[iIndex].adapter_data.terminology_schema_name,
    terminology_status:queryResults.service_data[iIndex].adapter_data.terminology_status
   });
   
   this.lemmaUnit.setTerminologyDescriptor(terminologyDescriptorObject);
   delete terminologyDescriptorObject;
   
   //
   // Update Terminology Listing DS
   if(queryResults.service_data[iIndex].adapter_data.terminology_status == 'UPDATED_TERMINOLOGY')
   {
    var terminologyName = queryResults.service_data[iIndex].adapter_data.terminology_name;
    var terminologyIndex = this.terminologyDocumentsDS.findExact('terminology_name', terminologyName);

    if(terminologyIndex !== -1)
    {    
     var record = this.terminologyDocumentsDS.getAt(terminologyIndex);
     record.set('terminology_status', queryResults.service_data[iIndex].adapter_data.terminology_status);
     
     //
     record.commit();
    }
   }
  }
  
  // Sort
  var currentSort = this.terminologyDocumentsDS.getSortState();
  this.terminologyDocumentsDS.sort(currentSort.field, currentSort.direction);  
  
  //
  this.updateToolbar();
 }, 
 
 //
 deleteTerminology : function(queryResults)
 {
  for(var iIndex = 0; iIndex < queryResults.service_data.length; iIndex++)
  {
  	var terminologyName = queryResults.service_data[iIndex].adapter_data.terminology_name;
   var terminologyIndex = this.terminologyDocumentsDS.findExact('terminology_name', terminologyName);
   
   if(terminologyIndex !== -1)
   {
   	// Remove 
   	var record = this.terminologyDocumentsDS.getAt(terminologyIndex);
   	this.terminologyDocumentsDS.remove(record);
   	  
		  // Sort
		  var currentSort = this.terminologyDocumentsDS.getSortState();
		  this.terminologyDocumentsDS.sort(currentSort.field, currentSort.direction);  
		  
		  // Reset
		  this.resetTerminologyManager();
    this.centerPanel.doLayout(); 
   }
  }
  
  //
  this.updateToolbar();
 },
 
 //
 submitTerminology : function(queryResults)
 {
  for(var iIndex = 0; iIndex < queryResults.service_data.length; iIndex++)
  {
   //
   // Update Terminology Listing DS
   //
   if(queryResults.service_data[iIndex].adapter_data.terminology_status == 'SUBMITTED_TERMINOLOGY')
   {
    var terminologyName = queryResults.service_data[iIndex].adapter_data.terminology_name;
    var terminologyIndex = this.terminologyDocumentsDS.findExact('terminology_name', terminologyName);

    if(terminologyIndex !== -1)
    {    
     //
     // Get terminology Descriptor information and give to lemma
     var terminologyDescriptorObject = new Object({
      terminology_date:queryResults.service_data[iIndex].adapter_data.terminology_date,
      terminology_name:queryResults.service_data[iIndex].adapter_data.terminology_name,
      terminology_original_author:queryResults.service_data[iIndex].adapter_data.terminology_original_author,
      terminology_modification_author:queryResults.service_data[iIndex].adapter_data.terminology_modification_author,
      terminology_folder:queryResults.service_data[iIndex].adapter_data.terminology_folder,
      terminology_schema_name:queryResults.service_data[iIndex].adapter_data.terminology_schema_name,
      terminology_status:queryResults.service_data[iIndex].adapter_data.terminology_status
     });
     
     this.lemmaUnit.setTerminologyDescriptor(terminologyDescriptorObject);
     delete terminologyDescriptorObject;        	
    	
     //
     // Update Terminology Listing DS
     var record = this.terminologyDocumentsDS.getAt(terminologyIndex);
     record.set('terminology_status', queryResults.service_data[iIndex].adapter_data.terminology_status);
     
     //
     record.commit();
    }
   }
  }
  
  // Sort
  var currentSort = this.terminologyDocumentsDS.getSortState();
  this.terminologyDocumentsDS.sort(currentSort.field, currentSort.direction); 
  
  //
  this.updateToolbar();
 },
 
 //
 rejectTerminology : function(queryResults)
 {
  for(var iIndex = 0; iIndex < queryResults.service_data.length; iIndex++)
  {
   //
   // Update Terminology Listing DS
   //
   if(queryResults.service_data[iIndex].adapter_data.terminology_status == 'REJECTED_TERMINOLOGY')
   {
    var terminologyName = queryResults.service_data[iIndex].adapter_data.terminology_name;
    var terminologyIndex = this.terminologyDocumentsDS.findExact('terminology_name', terminologyName);

    if(terminologyIndex !== -1)
    {
    	//
    	// Handle the case where the Terminology rejected is NOT owned by the user
    	if(queryResults.service_data[iIndex].adapter_data.remove_terminology === true)
    	{
    		this.terminologyDocumentsDS.removeAt(terminologyIndex);
    		
		    // Reset
		    this.resetTerminologyManager();
		    this.centerPanel.doLayout();
    	}
    	else
    	{
			   //
			   // Get terminology Descriptor information and give to lemma
			   var terminologyDescriptorObject = new Object({
			    terminology_date:queryResults.service_data[iIndex].adapter_data.terminology_date,
			    terminology_name:queryResults.service_data[iIndex].adapter_data.terminology_name,
			    terminology_original_author:queryResults.service_data[iIndex].adapter_data.terminology_original_author,
			    terminology_modification_author:queryResults.service_data[iIndex].adapter_data.terminology_modification_author,
			    terminology_folder:queryResults.service_data[iIndex].adapter_data.terminology_folder,
			    terminology_schema_name:queryResults.service_data[iIndex].adapter_data.terminology_schema_name,
			    terminology_status:queryResults.service_data[iIndex].adapter_data.terminology_status
			   });
			   
			   this.lemmaUnit.setTerminologyDescriptor(terminologyDescriptorObject);
			   delete terminologyDescriptorObject;    	
	    	
			   //
			   // Update Terminology Listing DS
	     var record = this.terminologyDocumentsDS.getAt(terminologyIndex);
	     record.set('terminology_status', queryResults.service_data[iIndex].adapter_data.terminology_status);
	
	     //
	     record.commit();
    	}
    }
   }
  }
  
  // Sort
  var currentSort = this.terminologyDocumentsDS.getSortState();
  this.terminologyDocumentsDS.sort(currentSort.field, currentSort.direction);  
       
  // Reset
  this.resetTerminologyManager();
  this.centerPanel.doLayout();
    
  //
  this.updateToolbar();
 },
 
 //
 publishTerminology  : function(queryResults)
 {
  for(var iIndex = 0; iIndex < queryResults.service_data.length; iIndex++)
  {
   //
   // Update Terminology Listing DS
   for(var adapterIndex = 0; adapterIndex < queryResults.service_data[iIndex].adapter_data.length; adapterIndex++)
   {
   	var adapterData = queryResults.service_data[iIndex].adapter_data[adapterIndex];

   	//
	   if(adapterData.terminology_status == 'APPROVED_TERMINOLOGY')
	   {
	    var terminologyName = adapterData.terminology_name;
	    var terminologyIndex = this.terminologyDocumentsDS.findExact('terminology_name', terminologyName);
	
	    if(terminologyIndex !== -1)
	    {
	     //
	     // Handle the case where the Terminology rejected is NOT owned by the user
	     if(adapterData.remove_terminology === true)
	     {
	      this.terminologyDocumentsDS.removeAt(terminologyIndex);
	     }
	     else
	     {	    	
		     //
		     // Get terminology Descriptor information and give to lemma
		     var terminologyDescriptorObject = new Object({
		      terminology_date:adapterData.terminology_date,
		      terminology_name:adapterData.terminology_name,
		      terminology_original_author:adapterData.terminology_original_author,
		      terminology_modification_author:adapterData.terminology_modification_author,
		      terminology_folder:adapterData.terminology_folder,
		      terminology_schema_name:adapterData.terminology_schema_name,
		      terminology_status:adapterData.terminology_status
		     });
		     
		     this.lemmaUnit.setTerminologyDescriptor(terminologyDescriptorObject);
		     delete terminologyDescriptorObject;     
		     
		     //
		     // Update Terminology Listing DS
		     var record = this.terminologyDocumentsDS.getAt(terminologyIndex);
		     record.set('terminology_status', adapterData.terminology_status);
		
		     //
		     record.commit();
		    }
	    }
	   } 
   }
  }
  
  // Sort
  var currentSort = this.terminologyDocumentsDS.getSortState();
  this.terminologyDocumentsDS.sort(currentSort.field, currentSort.direction);  
       
  // Reset
  this.resetTerminologyManager();
  this.centerPanel.doLayout();
  
  // Update
  this.updateToolbar();
  
  // Hide form
  var button = this.getTopToolbar().findById('fuzein_terminology_publish_terminology');
  button.fireEvent('menuhide', button.menu);
 }, 
 
 //
 loadDocument : function(documentData)
 {
  for(var iIndex = 0; iIndex < documentData.length; iIndex++)
  {
   var documentObject = documentData[iIndex];
   
   //
   this.getEditor().setValue(documentObject.node_content);
   
   this.textEditorPanel.signature = hex_sha256(documentObject.node_content);
   this.textEditorPanel.current_node_path = documentObject.node_path;
   this.textEditorPanel.file_name = documentObject.node_name;
   this.setTitle(this.titleText + ' - ' + documentObject.node_name);
   
   //
   this.updateToolbar();
  }
  
  //
  this.showApplication();
 }
});

//
Ext.reg('fuzein_terminology_manager', FuzeIn.TerminologyManager);
