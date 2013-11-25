// Create Fuzein namespace
Ext.namespace('FuzeIn');

FuzeIn.TerminologySharingForm = function(config) 
{
 this.addEvents({
   "search_event":true
 });
 
 Ext.apply(this, config); 
 
 // call parent constructor
 FuzeIn.TerminologySharingForm.superclass.constructor.call(this, config);
};

//
FuzeIn.TerminologySharingForm = Ext.extend(Ext.form.FormPanel, 
{
 initComponent : function()
 {
  Ext.apply(this, {
    labelWidth:75,
    bodyStyle:'padding:5px 5px 0',
    width:250,
    labelAlign:'top',
    defaults:{width: 230},
    defaultType:'textfield',
    
    items:[
     {id:'fuzein_search_file_names', fieldLabel:'All or part of the file name'},
     {id:'fuzein_search_file_content', fieldLabel:'A word or phrase in the file'}
    ],
    
    buttons:[{
      text:'Search',
      listeners:{
       click:{
        fn: function(button, event) {
         event.stopEvent();
         
         var searchFields = this.getForm().getFieldValues();
         this.fireEvent('search_event', [searchFields.fuzein_search_file_names, searchFields.fuzein_search_file_content]);
        }
       },
       scope:this
      }      
    }]
  });

  //
  FuzeIn.TerminologySharingForm.superclass.initComponent.call(this);
 }
});

//
Ext.reg('fuzein_terminology_sharing_form', FuzeIn.TerminologySharingForm);
