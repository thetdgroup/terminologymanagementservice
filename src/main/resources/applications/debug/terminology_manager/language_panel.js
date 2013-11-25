// Create Fuzein namespace
Ext.namespace('FuzeIn');

FuzeIn.LanguagePanel = function(config) 
{
 /*this.addEvents({
   "publish_terminology":true
 });*/
 
 Ext.apply(this, config); 
 
 // call parent constructor
 FuzeIn.LanguagePanel.superclass.constructor.call(this, config);
};

//
FuzeIn.LanguagePanel = Ext.extend(Ext.Panel, 
{
 languagesListDS : null,
 languagesListDef : [{name:'analyzer', type:'string'},
                     {name:'language_family', type:'string'}, 
                     {name:'language_id', type:'string'},
                     {name:'language_iso3', type:'string'},
                     {name:'language_name', type:'string'}], 
        
 //
 initComponent : function()
 {
  var reader = new Ext.data.JsonReader({}, this.languagesListDef);
 
  this.languagesListDS = new Ext.data.GroupingStore({
   groupField:'language_family',
   reader:reader,
   remoteSort:false,
   groupOnSort:false,
   sortInfo:{field:'language_name', direction:'ASC'}
  });
    
  //
  this.colModel = new Ext.grid.ColumnModel([
    new Ext.grid.RowNumberer(),
    {id:'language_family', sortable:true, header:'Language Family', menuDisabled:true, dataIndex:'language_family'},
    {id:'language_name', sortable:true, header:'Languages', menuDisabled:true, dataIndex:'language_name'}
   ]);
   
  this.languagePanel = new Ext.grid.GridPanel({
    enableColumnHide:false,
    enableColumnMove:false,
    autoScroll:false,
    autoExpandColumn:'language_name',
    bodyStyle:'padding:3px',    
    cm:this.colModel,
    store:this.languagesListDS,
    sm:new Ext.grid.RowSelectionModel({singleSelect:true}),
    view: new Ext.grid.GroupingView({
      ignoreAdd:true,
      enableGroupingMenu:false,
      enableNoGroups:false,
      hideGroupedColumn:true,
      showGroupName:false,
      deferEmtyText:false,
      emptyText:'No Languages to display'
     }),
    listeners: {
    	
     render: function(grid) {
      this.fireEvent('get_languages');
     },
     
     rowdblclick: function(grid, rowIndex, event) {
     	event.stopEvent();
     	
      var selectedRecord = grid.store.getAt(rowIndex);
      this.fireEvent('select_language', selectedRecord);
     },
     scope:this
    }
  });
  
  //  
  Ext.apply(this, {
    title:'Languages',
    bodyStyle:'padding:5px 5px 5px 5px',
    width:250,
    height:250,
    layout:'fit',
    items:this.languagePanel
  });
  
  //
  FuzeIn.LanguagePanel.superclass.initComponent.call(this);
 },
 
 //
 destroy : function()
 {
  if(this.languagesListDS !== null)
  {
   this.languagesListDS.removeAll();
   delete this.languagesListDS;
   this.languagesListDS = null;
  }
  
  if(this.colModel !== null)
  {
   delete this.colModel;
   this.colModel = null;
  }  
  
  if(this.languagePanel !== null)
  {
   this.languagePanel.destroy();
   delete this.languagePanel;
   this.languagePanel = null;
  }
 },

 //
 // Set
 //
 setData : function(queryResults)
 {
  // Clear DS
  this.languagesListDS.removeAll();

  // Parse
  var recordDef = Ext.data.Record.create(this.languagesListDef);

  for(var iIndex = 0; iIndex < queryResults.service_data.length; iIndex++)
  {
   var adapterData = queryResults.service_data[iIndex];
   
   //
   for(var iDataIndex = 0; iDataIndex < adapterData.languages.length; iDataIndex++)
	  {
	   var record = new recordDef({
	   	 language_family:adapterData.language_family,
	     language_analyzer:adapterData.languages[iDataIndex].analyzer,
	     language_id:adapterData.languages[iDataIndex].language_id,
	     language_iso3:adapterData.languages[iDataIndex].language_iso3,
	     language_name:adapterData.languages[iDataIndex].language_name
	   });
	      
	   //
	   this.languagesListDS.add(record); 
	   delete record;
	  }
  }
  
  // Sort
  var currentSort = this.languagesListDS.getSortState();
  this.languagesListDS.sort(currentSort.field, currentSort.direction);                  
 },
 
 queryLanguage : function(languageISO)
 {
  var recordIndex = this.languagesListDS.findExact('language_iso3', languageISO);  
  
  if(recordIndex !== -1)
  {
  	return this.languagesListDS.getAt(recordIndex);
  }
  
  //
  return null;
 }
});

//
Ext.reg('fuzein_metadata_language_panel', FuzeIn.LanguagePanel);
