// Create Fuzein namespace
Ext.namespace('FuzeIn');

FuzeIn.Terminology_Lemma = function(config) 
{
 this.addEvents({
   "select_language":true
 });
 	
 Ext.apply(this, config); 
 
 this.reference_id = config.reference_id; 
 
 // call parent constructor
 FuzeIn.Terminology_Lemma.superclass.constructor.call(this, config);
};

//
FuzeIn.Terminology_Lemma = Ext.extend(Ext.Panel, 
{
 //
 terminologyDate : '',
 terminologyName : '',
 terminologyOriginalAuthor : '',
 terminologyModificationAuthor : '',
 terminologyPath : '',
 terminologySchemaName : '',
 terminologyStatus : 'NOT_ASSIGNED',
 
	//
	formRepresentionPanel : null,
	
	//
 terminologyMetadataDisplayDS : null,
 terminologyUnitListDef : [{name:'feature_id', type:'string'},
                           {name:'feature_name', type:'string'}, 
                           {name:'feature_value', type:'string'}], 
                           
	//
 initComponent : function()
 {
  //
  FuzeIn.Terminology_Lemma.superclass.initComponent.call(this);
  
  //
  var reader = new Ext.data.JsonReader({}, this.terminologyUnitListDef);
  
  this.terminologyMetadataDisplayDS = new Ext.data.GroupingStore({
   groupField:'feature_name',
   reader:reader,
   remoteSort:false,
   groupOnSort:false,    
   sortInfo:{field:'feature_value', direction:'ASC'}
  });
  
  //
  this.terminologyInputPanel = new Ext.Panel({
    title:'Form Representation',
    border:true,
    frame:true,
    draggable:false,
    autoHeight:true,
    bodyStyle:'padding:1px',
    items:[{
      border:false,
      columnWidth:.6,
      bodyStyle:'padding:1px',
      layout:'fit',
      items:[{
			    xtype:'textarea',
			    grow:true,
			    hideLabel:true,
			    tabIndex:1,
			    emptyText:'Enter your Lemma here.'
      }]
    }]
   });   

  // Create Metadata grid area
  var removeRow = new Ext.grid.DeleteColumn({
    enableHeaderControl:false,
    tooltip:'Remove the selected metadata item.',
    width:20
  });
  
  //
  this.metadataInputGridPanel = new Ext.grid.GridPanel({
    title:'Lemma Metadata',
    border:true,
    frame:true,
    draggable:false,
    autoHeight:true,
    bodyStyle:'padding:3px',
    enableHdMenu:false,
    hideHeaders:true,
    store:this.terminologyMetadataDisplayDS,
    plugins:[removeRow],
    columns:[
      removeRow,
      {hidden:true, sortable:false, dataIndex:'feature_name'},
      {sortable:false, dataIndex:'feature_value'}
    ],
    view: new Ext.grid.GroupingView({
      startCollapsed:false,
      showGroupName:false,
      forceFit:true,
      enableGroupingMenu:false,
      enableNoGroups:false,
      groupTextTpl:'{text}'
     }),
    viewConfig:{
     forceFit:true
    },        
	   listeners: {
	    cellclick: function(grid, rowIndex, columnIndex, event) {
	    	
	    	// remove row
	     if(columnIndex === 0)
	     {
	     	var record = grid.getStore().getAt(rowIndex);
	     	grid.getStore().remove(record);
	     	
					  // Sort
					  var currentSort = this.terminologyMetadataDisplayDS.getSortState();
					  this.terminologyMetadataDisplayDS.sort(currentSort.field, currentSort.direction); 	     	
       
       // Reset input to regular text
       if(record.get('feature_name') == 'language')
       {
        var inputArea = this.formRepresentionPanel.findByType('textarea');
        inputArea[0].removeClass('arabic_text');
        inputArea[0].addClass('regular_text');
       }
	     }
	    },
	    scope:this
	   }
  });

  //
  // Create panel that will support both, the editor and metadata panels
  this.formRepresentionPanel = new Ext.Panel({
   reference_id:this.reference_id,  	
   title:'Lemma',
   collapsible:false,
   margins:'3 3 3 0', // top, right, bottom, left
   cmargins:'3 3 3 3',
   bodyStyle:'padding:7px',      
   layout:'column',
   autoScroll:true,
   autoHeight:false,
   autoWidth:false,
   height:'300',
   border:true,
   iconCls:'fuzein_terminology_lemma_icon',
   items:[{
     border:false,
     columnWidth:.6,
     bodyStyle:'padding-right:7px',
     layout:'fit',
     items:this.terminologyInputPanel
    },{
     border:false,
     columnWidth:.4,
     layout:'fit',
     items:this.metadataInputGridPanel
    }],
   listeners: {
    render: function(component) {
     component.body.on('click', function() {
     	 return component.fireEvent('activate_terminology_unit');
     });
     
     //
     // Set initial focus after render
     component.fireEvent('activate_terminology_unit');
    },
    activate_terminology_unit:function() {
    	this.fireEvent('activate_terminology_unit', {unit_type:'lemma_unit', unit_ref_object:this});
    }, 
    scope:this
   }
  });
  
  //
  // Set default text class
  var inputArea = this.formRepresentionPanel.findByType('textarea');
  inputArea[0].addClass('regular_text');   
 },
 
 //
 destroy : function()
 {
  if(this.terminologyMetadataDisplayDS !== null)
  {
  	this.terminologyMetadataDisplayDS.removeAll();
  	delete this.terminologyMetadataDisplayDS;
  	this.terminologyMetadataDisplayDS = null;
  }
  
  if(this.formRepresentionPanel !== null)
  {
  	this.formRepresentionPanel.destroy();
  	delete this.formRepresentionPanel;
  	this.formRepresentionPanel = null;
  }
  
  if(this.terminologyInputPanel !== null)
  {
   this.terminologyInputPanel.destroy();
   delete this.terminologyInputPanel;
   this.terminologyInputPanel = null;  	
  }
  
  if(this.metadataInputGridPanel !== null)
  {
   this.metadataInputGridPanel.destroy();
   delete this.metadataInputGridPanel;
   this.metadataInputGridPanel = null;   
  }  
 },
 
 //
 hasModifications : function()
 {
 	return false;
 },
 
 //
 setFocus : function(hasFocus)
 {
 	var element = Ext.get(this.formRepresentionPanel.id);
 	
 	if(hasFocus === true)
 	{
   element.addClass('has_focus');
 	}
 	else
 	{
 		element.removeClass('has_focus');
 	}
 },
 
 //
 resetUnit : function()
 {
 	this.terminologyMetadataDisplayDS.removeAll();
 	
  var inputArea = this.formRepresentionPanel.findByType('textarea');
  inputArea[0].reset();
  inputArea[0].setValue('Enter your Lemma here.');
  inputArea[0].setHeight(54);
  inputArea[0].removeClass('arabic_text');
  inputArea[0].addClass('regular_text');
  
  //
  this.terminologyDate = '';
  this.terminologyName = '';
  this.terminologyOriginalAuthor = '';
  this.terminologyModificationAuthor = '';
  this.terminologyFolder = '';
  this.terminologySchemaName = '';
  this.terminologyStatus = 'NOT_ASSIGNED'; 
  
  //
  this.formRepresentionPanel.setTitle('Lemma');
  this.fireEvent('activate_terminology_unit', {unit_type:'lemma_unit', unit_ref_object:this});
 },
 
 //
 getEditor : function()
 {
 	return this.formRepresentionPanel;
 },
 
 //
 setTerminologyDescriptor : function(terminologyDescriptorData)
 {
 	this.terminologyDate = terminologyDescriptorData.terminology_date;
  this.terminologyName = terminologyDescriptorData.terminology_name;
  this.terminologyOriginalAuthor = terminologyDescriptorData.terminology_original_author;
  this.terminologyModificationAuthor = terminologyDescriptorData.terminology_modification_author;
  this.terminologyFolder = terminologyDescriptorData.terminology_folder;
  this.terminologySchemaName = terminologyDescriptorData.terminology_schema_name;
  this.terminologyStatus = terminologyDescriptorData.terminology_status;
  
  //
  if(this.terminologyName !== null && typeof(this.terminologyName) !== "undefined")
  {
   this.formRepresentionPanel.setTitle(this.terminologyName);
  }
 },
 
 //
 getTerminologyDescriptor : function()
 {
 	var descriptor = new Object({
   terminology_date : this.terminologyDate,
   terminology_name : this.terminologyName,
   terminology_original_author : this.terminologyOriginalAuthor,
   terminology_modification_author : this.terminologyModificationAuthor,
   terminology_folder : this.terminologyFolder,
   terminology_schema_name : this.terminologySchemaName,
   terminology_status : this.terminologyStatus
 	});
 	
 	//
 	return descriptor;
 }, 
 
 getTerminologyStatus : function()
 {
 	return this.terminologyStatus;
 },
 
 //
 setUnitData : function(terminologyData, languageRef)
 {
  var recordDef = Ext.data.Record.create(this.terminologyUnitListDef);
 	  
 	//
 	for(iIndex = 0; iIndex < terminologyData.form_representation.length; iIndex++)
 	{
 		var formRepresentation = terminologyData.form_representation[iIndex];
 		
 	 //
 	 var writtenForm = "";
 	 var script = "";
 	 var languageAnalyzer = "";

   //
 	 // Extract all features
 	 for(iFeatureIndex = 0; iFeatureIndex < formRepresentation.length; iFeatureIndex++)
   {
 	  var feature = formRepresentation[iFeatureIndex];

    //
    if(feature.feature_name == 'writtenForm')
    {
    	writtenForm = feature.feature_value;
    }
    else if(feature.feature_name === 'script')
    {
     var featureRecord = new recordDef({
      feature_name:feature.feature_name,
      feature_value:feature.feature_value
     });
     
     //
     this.terminologyMetadataDisplayDS.add(featureRecord); 
     delete featureRecord;
     
    	script = feature.feature_value;
    }
    else if(feature.feature_name == 'language')
    {
     var languageRec = languageRef.queryLanguage(feature.feature_value);
     
     if(languageRec !== null)
     {
			   var featureRecord = new recordDef({
			    feature_id:languageRec.get('language_id'),
			    feature_name:feature.feature_name,
			    feature_value:languageRec.get('language_name'),
			    language_analyzer:languageRec.get('language_analyzer')
			   });
	       	
	     //
	     this.terminologyMetadataDisplayDS.add(featureRecord); 
	     delete featureRecord;
	     
	     //
	     languageAnalyzer = languageRec.get('language_analyzer');
     } 
    }
    else
    {
     var featureRecord = new recordDef({
      feature_name:feature.feature_name,
      feature_value:feature.feature_value
     });
     
     //
     this.terminologyMetadataDisplayDS.add(featureRecord); 
     delete featureRecord;    	
    }
   }		
   
   //
   // Set Text
  	var inputArea = this.formRepresentionPanel.findByType('textarea');
  	inputArea[0].setValue(feature.feature_value);
   
   if(languageAnalyzer == 'ara')
   {
    inputArea[0].removeClass('regular_text');
   	inputArea[0].addClass('arabic_text');
   }
   else if(languageAnalyzer == 'pes')
   {
    inputArea[0].removeClass('regular_text');
    inputArea[0].addClass('arabic_text');
   }
   else
   {
    inputArea[0].removeClass('arabic_text');
   	inputArea[0].addClass('regular_text');
   }
 	}
  
  // Sort
  var currentSort = this.terminologyMetadataDisplayDS.getSortState();
  this.terminologyMetadataDisplayDS.sort(currentSort.field, currentSort.direction); 	
 },
 
 //
 setUnitMetadata : function(metadataType, metadataRecord)
 {
 	var recordDef = Ext.data.Record.create(this.terminologyUnitListDef);
 	
 	//
 	if(metadataType === 'language')
 	{
 		var recordIndex = this.terminologyMetadataDisplayDS.findExact('feature_name', metadataType);  
 		
 		// We only allow a single language
   if(recordIndex !== -1)
   {
   	return;
   }
 		
 		//
	  var featureRecord = new recordDef({
	  	feature_id:metadataRecord.get('language_id'),
	   feature_name:metadataType,
	   feature_value:metadataRecord.get('language_name'),
	   language_analyzer:metadataRecord.get('language_analyzer')
	  });
	  
   //
   // Update Text Class based on choosen language
   var inputArea = this.formRepresentionPanel.findByType('textarea');

   if(featureRecord.get('language_analyzer') == 'ara')
   {
    inputArea[0].removeClass('regular_text');
    inputArea[0].addClass('arabic_text');
   }
   else if(featureRecord.get('language_analyzer') == 'pes')
   {
    inputArea[0].removeClass('regular_text');
    inputArea[0].addClass('arabic_text');
   }
   else
   {
    inputArea[0].removeClass('arabic_text');
    inputArea[0].addClass('regular_text');
   }
 	}
 	else if(metadataType === 'domain')
 	{
   var recordIndex = this.terminologyMetadataDisplayDS.findExact('feature_value', metadataRecord.get('domain_name'));  
   
   // Dont allow the same feature to be added again 
   if(recordIndex !== -1)
   {
    return;
   }
    		
   var featureRecord = new recordDef({
    feature_id:metadataRecord.get('domain_id'),
    feature_name:metadataType,
    feature_value:metadataRecord.get('domain_name')
   }); 		
 	}
  else if(metadataType === 'type')
  {
   var recordIndex = this.terminologyMetadataDisplayDS.findExact('feature_value', metadataRecord.get('type_name'));  
   
   // Dont allow the same feature to be added again 
   if(recordIndex !== -1)
   {
    return;
   }
     	
   var featureRecord = new recordDef({
    feature_id:metadataRecord.get('type_id'),
    feature_name:metadataType,
    feature_value:metadataRecord.get('type_name')
   });   
  }
  
  //
  this.terminologyMetadataDisplayDS.add(featureRecord); 
  delete featureRecord;  
  
  // Sort
  var currentSort = this.terminologyMetadataDisplayDS.getSortState();
  this.terminologyMetadataDisplayDS.sort(currentSort.field, currentSort.direction);  
 },
 
 //
 getUnitData : function()
 {
 	var featureArray = new Array();
 	
 	//
 	// Get all Features
 	for(var iIndex = 0; iIndex < this.terminologyMetadataDisplayDS.getCount(); iIndex++)
 	{
 		var object = this.terminologyMetadataDisplayDS.getAt(iIndex);
 		
 		//
 		// In this case of Languages.. we pass the Analyzer back and not the name
 		var featureObject = null;
 		
 		if(object.data.feature_name  === 'language')
 		{
	   featureObject = new Object({
     feature_name:object.data.feature_name,
     feature_value:object.data.language_analyzer
    });
 		}
 		else
 		{
	   featureObject = new Object({
	    feature_name:object.data.feature_name,
	    feature_value:object.data.feature_value
	   });
 		}

   //
   featureArray.push(featureObject);
   delete featureObject;
 	}
 	
  //
  // Get WrittenForm
  var inputArea = this.formRepresentionPanel.findByType('textarea');
  
  var terminologyObject = new Object({
  	feature_name:"writtenForm",
   feature_value:inputArea[0].getValue()
  });
  
  featureArray.push(terminologyObject);
  delete terminologyObject;  
  
  //
  //
  var formRepresentationObject = new Object({
   formRepresentation:featureArray
  });  
 	
 	//
 	return formRepresentationObject;
 },
 
 //
 getTerminologyName : function()
 {
 	return this.terminologyName;
 },
 
 generateTerminologyName : function()
 {
 	var inputArea = this.formRepresentionPanel.findByType('textarea');
 	
 	return inputArea[0].getValue();
 }
});

//
Ext.reg('fuzein_terminology_unit_lemma', FuzeIn.Terminology_Lemma);
