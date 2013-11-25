// Create Fuzein namespace
Ext.namespace('FuzeIn');

FuzeIn.TerminologyPublishingForm = function(config) 
{
 /*this.addEvents({
   "publish_terminology":true
 });*/
 
 Ext.apply(this, config); 
 
 // call parent constructor
 FuzeIn.TerminologyPublishingForm.superclass.constructor.call(this, config);
};

//
FuzeIn.TerminologyPublishingForm = Ext.extend(Ext.Panel, 
{
 collectionDS : null,
 collectionDef : [{name:'creation_date', type: 'date'}, 
                  {name:'dictionary_description', type: 'string'},
                  {name:'dictionary_exportable', type: 'boolean'},
                  {name:'dictionary_locked', type: 'boolean'},
                  {name:'dictionary_name', type: 'string'},
                  {name:'dw_dictionary_id', type: 'string'},
                  {name:'dw_group', type: 'string'},
                  {name:'group_name', type: 'string'}],
        
 //
 initComponent : function()
 {
  var reader = new Ext.data.JsonReader({}, this.collectionDef);
 
  this.collectionDS = new Ext.data.Store({
   reader:reader,
   remoteSort:false,
   sortInfo:{field:'collection_name', direction:'ASC'}
  });
   	
 	//
  var checkboxSelectionModel = new Ext.grid.CheckboxSelectionModel({checkOnly:true});
  checkboxSelectionModel.on({'selectionchange': {fn:this.onSelectionChange, scope:this}});    
    	
  //
  var colModel = new Ext.grid.ColumnModel([
    new Ext.grid.RowNumberer(),
    {id:'dictionary_name', sortable:true, header:'Collections', menuDisabled:true, dataIndex:'dictionary_name'},
    checkboxSelectionModel
   ]);
   
  this.availableCollectionsPanel = new Ext.grid.GridPanel({
    autoExpandColumn:'dictionary_name',
    enableColumnHide:false,
    enableColumnMove:false,
    autoScroll:true,
    border:true,
    enableDragDrop:false,
    layout:'fit',
    cm:colModel,
    store:this.collectionDS,
    sm:checkboxSelectionModel,
    view: new Ext.grid.GridView({
      ignoreAdd:true,
      emptyText:'No Collections are available'
     }),
    listeners: {
     render: function(grid) {
      this.fireEvent('get_collection_list');
     },
     scope:this
    },
    buttons:[{
      id:'fuzein_terminology_publishing_publish',
      text:'Publish',
      disabled:true,
      listeners:{
       click:{
        fn: function(button, event) {
         event.stopEvent();
         
         //
         var collectionArray = new Array();
         
         var selectionModel = this.availableCollectionsPanel.getSelectionModel();
         var selectedRecords = selectionModel.getSelections();
         
         for(var iIndex = 0; iIndex < selectedRecords.length; iIndex++)
         {
         	var selectedRecord = selectedRecords[iIndex];
         	
         	//
         	var record = new Object({
         		dw_dictionary_id:selectedRecord.get('dw_dictionary_id'),
           dictionary_name:selectedRecord.get('dictionary_name'),
         		dw_group:selectedRecord.get('dw_group'),
           group_name:selectedRecord.get('group_name')
         	});
         	
         	//
         	collectionArray.push(record);
         	delete record;
         }

         //
         this.fireEvent('publish_terminology', collectionArray);
        }
       },
       scope:this
      }      
    }]      
  });
  
  // 	
  Ext.apply(this, {
    bodyStyle:'padding:5px 5px 5px 5px',
    width:250,
    height:250,
    layout:'fit',
    items:this.availableCollectionsPanel
  });
  
  //
  FuzeIn.TerminologyPublishingForm.superclass.initComponent.call(this);
 },
 
 //
 destroy : function()
 {
 	if(this.collectionDS !== null)
	 {
	 	this.collectionDS.removeAll();
	 	delete this.collectionDS;
	 	this.collectionDS = null;
	 }
 	
  if(this.availableCollectionsPanel !== null)
  {
   this.availableCollectionsPanel.destroy();
   delete this.availableCollectionsPanel;
   this.availableCollectionsPanel = null;
  }
 },
 
 onSelectionChange : function(selectionModel)
 {
  if(selectionModel.getCount() == 0) 
  {
   this.availableCollectionsPanel.buttons[0].disable();
  }
  else
  {
   this.availableCollectionsPanel.buttons[0].enable();
  }
 },

 //
 // Set
 //
 setData : function(queryResults)
 {
  // Clear DS
  this.collectionDS.removeAll();
  
  // Parse
  var recordDef = Ext.data.Record.create(this.collectionDef);

  for(var iIndex = 0; iIndex < queryResults.service_data.length; iIndex++)
  {
   var adapterData = queryResults.service_data[iIndex];
   
   for(var iAdapterDataIndex = 0; iAdapterDataIndex < adapterData.adapter_data.length; iAdapterDataIndex++)
   {
   	// We only allow Unlocked dictionaries
   	if(adapterData.adapter_data[iAdapterDataIndex].dictionary_locked === false)
   	{
	   	var dictDate = new Date(adapterData.adapter_data[iAdapterDataIndex].creation_date);
	   	
	    var terminologyRecord = new recordDef({
	     creation_date:dictDate.format('F j, Y, g:i a'),
	     dictionary_description:adapterData.adapter_data[iAdapterDataIndex].dictionary_description,
	     dictionary_exportable:adapterData.adapter_data[iAdapterDataIndex].dictionary_exportable,
	     dictionary_locked:adapterData.adapter_data[iAdapterDataIndex].dictionary_locked,
	     dictionary_name:adapterData.adapter_data[iAdapterDataIndex].dictionary_name,
	     dw_dictionary_id:adapterData.adapter_data[iAdapterDataIndex].dw_dictionary_id,
	     dw_group:adapterData.adapter_data[iAdapterDataIndex].dw_group,
	     group_name:adapterData.adapter_data[iAdapterDataIndex].group_name
	    });
	       
	    //
	    this.collectionDS.add(terminologyRecord); 
	    delete terminologyRecord;
	    delete dictDate;
	   }
   }
  }
  
  // Sort
  var currentSort = this.collectionDS.getSortState();
  this.collectionDS.sort(currentSort.field, currentSort.direction);                  
 }
});

//
Ext.reg('fuzein_terminology_publishing_form', FuzeIn.TerminologyPublishingForm);
