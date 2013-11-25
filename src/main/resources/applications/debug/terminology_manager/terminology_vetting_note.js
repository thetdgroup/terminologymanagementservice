// Create Fuzein namespace
Ext.namespace('FuzeIn');

FuzeIn.Terminology_VettingNote = function(config) 
{
 Ext.apply(this, config); 
 
 //
 this.reference_id = config.reference_id;
 this.tab_index = config.tab_index;
 
 // call parent constructor
 FuzeIn.Terminology_VettingNote.superclass.constructor.call(this, config);
};

//
FuzeIn.Terminology_VettingNote = Ext.extend(Ext.Panel, 
{
 //
 editingArea : null,
 
 //
 initComponent : function()
 {
  //
  FuzeIn.Terminology_VettingNote.superclass.initComponent.call(this);
  
  //
  // Create panel for the note entry
  this.editingArea = new Ext.Panel({
   reference_id:this.reference_id,
   title:'Vetting Note ' + this.tab_index,
   collapsible:true,
   titleCollapse:true,
   closable:true,
   margins:'3 3 3 0', // top, right, bottom, left
   cmargins:'3 3 3 3',
   bodyStyle:'padding:7px',      
   layout:'column',
   autoScroll:true,
   autoHeight:false,
   autoWidth:false,
   height:'300',
   border:true,
   iconCls:'fuzein_terminology_vetting_note_icon',
   items:[{
     border:false,
     columnWidth:1,
     bodyStyle:'padding:1px',
     layout:'fit',
     items:[{
      xtype:'textarea',
      grow:true,
      hideLabel:true,
      tabIndex:this.tab_index,
      emptyText:'Enter your note here. This will not be searchable'
     }]
   }],
   tools:[{
   	id:'close',
   	handler: function(event, toolEl, panel) {
   		event.stopEvent();
   		this.fireEvent('delete_note', panel);
   	},
   	scope:this
   }],
   listeners: {
    render: function(component) {
     component.body.on('click', function() {
       component.fireEvent('activate_terminology_unit');
     });
    },
    activate_terminology_unit:function() {
     this.fireEvent('activate_terminology_unit', {unit_type:'note_unit', unit_ref_object:this});
    },
    scope:this
   }   
  });
  
  //
  // Set default text class
  var inputArea = this.editingArea.findByType('textarea');
  inputArea[0].addClass('regular_text');  
 },
 
 //
 destroy : function()
 {
  if(this.editingArea !== null)
  {
   this.editingArea.destroy();
   delete this.editingArea;
   this.editingArea = null;
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
  
  var inputArea = this.editingArea.findByType('textarea');
  inputArea[0].reset();
  inputArea[0].setValue('Enter your note here. This will not be searchable');
  inputArea[0].setHeight(50);
  inputArea[0].removeClass('arabic_text');
  inputArea[0].addClass('regular_text');
 }, 
 
 //
 getEditor : function()
 {
  return this.editingArea;
 },
 
 setUnitData : function(terminologySenseData)
 {
  var recordDef = Ext.data.Record.create(this.terminologyUnitListDef);
   
  //
  for(iIndex = 0; iIndex < terminologySenseData.terminology_sense_equivalents.length; iIndex++)
  {
   var equivalentRepresentation = terminologySenseData.terminology_sense_equivalents[iIndex];
   
   //
   var writtenForm = "";
   var script = "";
   var language = "";

   //
   // Extract all features
   for(iFeatureIndex = 0; iFeatureIndex < equivalentRepresentation.terminology_equivalent_features.length; iFeatureIndex++)
   {
    var feature = equivalentRepresentation.terminology_equivalent_features[iFeatureIndex];

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
     var featureRecord = new recordDef({
      feature_name:feature.feature_name,
      feature_value:feature.feature_value
     });
     
     //
     this.terminologyMetadataDisplayDS.add(featureRecord); 
     delete featureRecord;
    }
    else if(feature.feature_name == 'orthographyName')
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
   var inputArea = this.editingArea.findByType('textarea');
   inputArea[0].setValue(feature.feature_value);
   
   if(script == 'Arab')
   {
    inputArea[0].addClass('arabic_text');
   }
   else
   {
    inputArea[0].addClass('regular_text');
   }
  }
  
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
   
   var terminologyObject = new Object({
    feature_name:object.data.feature_name,
    feature_value:object.data.feature_value
   });
   
   //
   featureArray.push(terminologyObject);
   delete terminologyObject;
  }
  
  //
  // Get WrittenForm
  var inputArea = this.editingArea.findByType('textarea');
  
  var terminologyObject = new Object({
   feature_name:"writtenForm",
   feature_value:inputArea[0].getValue()
  });
  
  featureArray.push(terminologyObject);
  delete terminologyObject;
  
  //
  var FeatureObject = new Object({
   features:featureArray
  });
  
  //
  return FeatureObject;  
 }
});

//
Ext.reg('fuzein_terminology_vetting_note', FuzeIn.Terminology_VettingNote);
