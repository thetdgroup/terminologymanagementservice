// Create Fuzein namespace
Ext.namespace('FuzeIn');

FuzeIn.TypePanel = function(config) 
{
/* this.addEvents({
   "publish_terminology":true
 });*/
 
 Ext.apply(this, config); 
 
 // call parent constructor
 FuzeIn.TypePanel.superclass.constructor.call(this, config);
};

//
FuzeIn.TypePanel = Ext.extend(Ext.Panel, 
{
 typeListDS : null,
 domainListDef : [{name:'type_family', type: 'string'},
                  {name:'type_id', type: 'string'}, 
                  {name:'type_name', type: 'string'},
                  {name:'type_icon', type: 'string'}], 
        
 //
 initComponent : function()
 {
  var reader = new Ext.data.JsonReader({}, this.domainListDef);
 
  this.typeListDS = new Ext.data.GroupingStore({
   groupField:'type_family',
   reader:reader,
   remoteSort:false,
   groupOnSort:false,
   sortInfo:{field:'type_name', direction:'ASC'}
  });
    
  //
  this.colModel = new Ext.grid.ColumnModel([
    new Ext.grid.RowNumberer(),
    {id:'type_family', sortable:true, header:'Type Family', menuDisabled:true, dataIndex:'type_family'},
    {id:'type_name', sortable:true, header:'Types', menuDisabled:true, dataIndex:'type_name'}
   ]);
   
  this.typePanel = new Ext.grid.GridPanel({
    enableColumnHide:false,
    enableColumnMove:false,
    autoScroll:false,
    autoExpandColumn:'type_name',
    bodyStyle:'padding:3px',
    cm:this.colModel,
    store:this.typeListDS,
    sm:new Ext.grid.RowSelectionModel({singleSelect:true}),
    view: new Ext.grid.GroupingView({
      ignoreAdd:true,
      enableGroupingMenu:false,
      enableNoGroups:false,
      hideGroupedColumn:true,
      showGroupName:false,
      deferEmtyText:false,
      emptyText:'No Types to display'
     }),
    listeners: {
    	
     render: function(grid) {
      this.fireEvent('get_types');
     },

     rowdblclick: function(grid, rowIndex, event) {
      event.stopEvent();
      
      var selectedRecord = grid.store.getAt(rowIndex);
      this.fireEvent('select_type', selectedRecord);
     }, 
     scope:this
    }     
  });
  
  //  
  Ext.apply(this, {
  	 title:'Types',
    bodyStyle:'padding:5px 5px 5px 5px',
    width:250,
    height:250,
    layout:'fit',
    items:this.typePanel
  });
  
  //
  FuzeIn.TypePanel.superclass.initComponent.call(this);
 },
 
 //
 destroy : function()
 {
  if(this.typeListDS !== null)
  {
   this.typeListDS.removeAll();
   delete this.typeListDS;
   this.typeListDS = null;
  }
  
  if(this.colModel !== null)
  {
   delete this.colModel;
   this.colModel = null;
  }  
  
  if(this.typePanel !== null)
  {
   this.typePanel.destroy();
   delete this.typePanel;
   this.typePanel = null;
  }
 },

 //
 // Set
 //
 setData : function(queryResults)
 {
  // Clear DS
  this.typeListDS.removeAll();
  
  // Parse
  var recordDef = Ext.data.Record.create(this.domainListDef);

  for(var iIndex = 0; iIndex < queryResults.service_data.adapter_data.adapter_results.length; iIndex++)
  {
   var adapterData = queryResults.service_data.adapter_data.adapter_results[iIndex];

   var record = new recordDef({
     type_family:'ll',
     type_id:adapterData.type_id,
     type_name:adapterData.type_name
   });
      
   //
   this.typeListDS.add(record); 
   delete record;
  }
  
  // Sort
  var currentSort = this.typeListDS.getSortState();
  this.typeListDS.sort(currentSort.field, currentSort.direction);                  
 }
});

//
Ext.reg('fuzein_metadata_type_panel', FuzeIn.TypePanel);
