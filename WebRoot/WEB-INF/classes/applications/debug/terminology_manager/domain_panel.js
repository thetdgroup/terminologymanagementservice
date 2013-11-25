// Create Fuzein namespace
Ext.namespace('FuzeIn');

FuzeIn.DomainPanel = function(config) 
{
/* this.addEvents({
   "publish_terminology":true
 });*/
 
 Ext.apply(this, config); 
 
 // call parent constructor
 FuzeIn.DomainPanel.superclass.constructor.call(this, config);
};

//
FuzeIn.DomainPanel = Ext.extend(Ext.Panel, 
{
 domainListDS : null,
 domainListDef : [{name:'domain_id', type: 'string'}, 
                  {name:'domain_name', type: 'string'},
                  {name:'domain_icon', type: 'string'}], 
        
 //
 initComponent : function()
 {
  var reader = new Ext.data.JsonReader({}, this.domainListDef);
 
  this.domainListDS = new Ext.data.Store({
   reader:reader,
   remoteSort:false,
   sortInfo:{field:'domain_name', direction:'ASC'}
  });
    
  //
  this.colModel = new Ext.grid.ColumnModel([
    new Ext.grid.RowNumberer(),
    {id:'domain_name', sortable:true, header:'Domains', menuDisabled:true, dataIndex:'domain_name'}
   ]);
   
  this.domainPanel = new Ext.grid.GridPanel({
    enableColumnHide:false,
    enableColumnMove:false,
    autoScroll:false,
    autoExpandColumn:'domain_name',
    bodyStyle:'padding:3px',
    cm:this.colModel,
    store:this.domainListDS,
    sm:new Ext.grid.RowSelectionModel({singleSelect:true}),
    view: new Ext.grid.GridView({
      ignoreAdd:true,
      emptyText:'No Domains are available'
     }),
    listeners: {
     render: function(grid) {
      this.fireEvent('get_domains');
     },
     
     rowdblclick: function(grid, rowIndex, event) {
      event.stopEvent();
      var selectedRecord = grid.store.getAt(rowIndex);
      this.fireEvent('select_domain', selectedRecord);
     },     
     scope:this
    }     
  });
  
  //  
  Ext.apply(this, {
  	 title:'Domains',
    bodyStyle:'padding:5px 5px 5px 5px',
    width:250,
    height:250,
    layout:'fit',
    items:this.domainPanel
  });
  
  //
  FuzeIn.DomainPanel.superclass.initComponent.call(this);
 },
 
 //
 destroy : function()
 {
  if(this.domainListDS !== null)
  {
   this.domainListDS.removeAll();
   delete this.domainListDS;
   this.domainListDS = null;
  }
  
  if(this.colModel !== null)
  {
   delete this.colModel;
   this.colModel = null;
  }  
  
  if(this.domainPanel !== null)
  {
   this.domainPanel.destroy();
   delete this.domainPanel;
   this.domainPanel = null;
  }
 },

 //
 // Set
 //
 setData : function(queryResults)
 {
  // Clear DS
  this.domainListDS.removeAll();
  
  // Parse
  var recordDef = Ext.data.Record.create(this.domainListDef);

  for(var iIndex = 0; iIndex < queryResults.service_data.adapter_data.adapter_results.length; iIndex++)
  {
   var adapterData = queryResults.service_data.adapter_data.adapter_results[iIndex];

   var record = new recordDef({
    domain_id:adapterData.domain_id,
    domain_name:adapterData.domain_name
   });
      
   //
   this.domainListDS.add(record); 
   delete record;
  }
  
  // Sort
  var currentSort = this.domainListDS.getSortState();
  this.domainListDS.sort(currentSort.field, currentSort.direction);                  
 }
});

//
Ext.reg('fuzein_metadata_domain_panel', FuzeIn.DomainPanel);
