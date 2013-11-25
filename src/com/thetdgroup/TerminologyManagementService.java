package com.thetdgroup;

import java.util.ArrayList;
import java.util.Iterator;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import com.thetdgroup.adapter_management.AdapterManager;
import com.thetdgroup.configurations.applicationConfiguration.ApplicationConfigurationParser;
import com.thetdgroup.configurations.serviceConfiguration.ServiceAdapterObject;
import com.thetdgroup.AdapterConstants;
import com.thetdgroup.ServiceConstants;
import com.thetdgroup.notification_controllers.FuzeInNotificationController;
import com.thetdgroup.session_management.CommonData;
import com.thetdgroup.session_management.ServiceSessionManager;
import com.thetdgroup.util.JsonError;
import com.thetdgroup.util.j2ee.JSONResponse;

public final class TerminologyManagementService extends FuzeInService
{
	private static final long serialVersionUID = 3123485103655038392L;

	// For logging at the adapter level
	private static ServiceLogger logger; 
	private static String defaultCMDocumentDirectory = "My Terminologies";
	
	//
	//
	//
	public void destroy() 
	{
		super.destroy();
	}

	//
	//
	//
	public void InitializeService() throws Exception
	{
		logger = new ServiceLogger("TERMINOLOGY_MANAGEMENT_SERVICE");
		
		FuzeInService.serviceSignature = "3b5c4c3d34693b51306a277139742d4174795148676e652733734d2739";
		
		FuzeInService.adapterConfiguration = getInitParameter("AdapterConfiguration");
		FuzeInService.userToServiceConfiguration = getInitParameter("UserToServiceConfiguration");
		FuzeInService.serviceToServiceConfiguration = getInitParameter("ServiceToServiceConfiguration");
		FuzeInService.applicationConfiguration = CommonData.getInstance().getRunningServletContext() + "/" + getInitParameter("ApplicationConfiguration");
		
		logger.logEvent(ServiceLogConstants.EVENT_TYPE_SERVICE_INIT, "Terminology Management Service was sucessfully initialized.");
	}
	
	//
	//
	//
	public boolean PostInitializeService(final String identificationKey, final ArrayList<ServiceAdapterObject> serviceAdapters) throws Exception
	{
		for(ServiceAdapterObject serviceAdapter : serviceAdapters)
		{
			BaseTerminologyAdapter baseAdapter = null;
			baseAdapter = (BaseTerminologyAdapter) AdapterManager.getInstance().getAdapter(serviceAdapter.getAdapterClassName());
		
			try
			{
				JSONObject jsonConfigurationObject = new JSONObject();
				jsonConfigurationObject.put("adapter_configuration_file", serviceAdapter.getAdapterAdditionalConfig());
				jsonConfigurationObject.put("fuzein_connection_info", ServiceSessionManager.getInstance().getFusionMessagingObject().toJSON());

				//
				logger.logEvent(ServiceLogConstants.EVENT_TYPE_SERVICE_INIT, "Initializing Adapter " + serviceAdapter.getAdapterDisplayName());
			 baseAdapter.initialize(jsonConfigurationObject);
			 logger.logEvent(ServiceLogConstants.EVENT_TYPE_SERVICE_INIT, "Adapter Initialized");
			}
			catch(Exception exception)
			{
				logger.logFatal(ServiceLogConstants.EVENT_TYPE_SERVICE_INIT, "Adapter Initialization has Failed: " + exception.toString());
				System.out.println(exception.toString());
				throw exception;
			}
		}
		
		//
  return true;
	}	
	
	//
	//
	//
	protected synchronized String ShutdownApplication(final String identificationKey, 
																																																			final String userID, 
																																																			final String applicationID)	throws Exception
	{
		System.out.println(userID + " is shutting down " + ApplicationConfigurationParser.getInstance().getApplication(applicationID).getApplicationName());
		System.out.println(CommonData.getInstance().getServletName() + " received shutdown_event");
		
		String ajaxResponse = "";
		
		//
		JSONObject jsonObject = new JSONObject();
		jsonObject.put(ServiceConstants.SERVICE_STATUS, ServiceConstants.status.SUCCESS);
		jsonObject.put("unsaved_data", true);
		
		ajaxResponse = jsonObject.toString();
		
		
		//
		return ajaxResponse;
	}
	
	//
 //
	//
	protected synchronized JSONArray RetrieveServers(final String adapterID) throws JSONException, Exception
	{
		return null;
	}
	
	//
 //
	//
	protected synchronized String Service2Service(final String identificationKey, 
																																															final ArrayList<ServiceAdapterObject> serviceAdapters, 
																																															final String apiMessage,	
																																															final JSONObject apiData) throws JSONException, Exception
	{
		String ajaxResponse = "";
		
		try
		{
			if(apiMessage.equals("save_terminology"))
			{
				ajaxResponse = saveTerminology(identificationKey, serviceAdapters, apiData.getJSONObject("data"));
			}	
			else if(apiMessage.equals("delete_terminology"))
			{
				ajaxResponse = deleteTerminology(identificationKey, serviceAdapters, apiData.getJSONObject("data"));
			}
			else if(apiMessage.equals("update_terminology"))
			{
				ajaxResponse = updateTerminology(identificationKey, serviceAdapters, apiData.getJSONObject("data"));
			}			
			else if(apiMessage.equals("submit_terminology"))
			{
				ajaxResponse = submitTerminology(identificationKey, serviceAdapters, apiData.getJSONObject("data"));
			}
			else if(apiMessage.equals("reject_terminology"))
			{
				ajaxResponse = rejectTerminology(identificationKey, serviceAdapters, apiData.getJSONObject("data"));
			}
			else if(apiMessage.equals("publish_terminology"))
			{
				ajaxResponse = publishTerminology(identificationKey, serviceAdapters, apiData.getJSONObject("data"));
			}			
			else if(apiMessage.equals("get_terminology_document"))
			{
				ajaxResponse = getTerminologyDocument(identificationKey, serviceAdapters, apiData.getJSONObject("data"));
			}
			else if(apiMessage.equals("get_terminology_properties"))
			{
				ajaxResponse = getTerminologyProperties(identificationKey, serviceAdapters, apiData.getJSONObject("data"));
			}
			else if(apiMessage.equals("search_terminology"))
			{
				ajaxResponse = searchTerminology(identificationKey, serviceAdapters, apiData.getJSONObject("data"));
			}
	  else if(apiMessage.equals("get_user_submittal_groups"))
			{
	  	ajaxResponse = getUserSubmittalGroups(identificationKey, serviceAdapters);
			} 	 
	  else if(apiMessage.equals("get_user_vetting_groups"))
			{
	  	ajaxResponse = getUserVettingGroups(identificationKey, serviceAdapters);
			} 
			else
			{
				ajaxResponse = JSONResponse.buildResponse(JsonError.LoadError("003", "Unsupported message"));
			}
		}
		catch(Exception exception)
		{
			System.out.println(exception.toString());
  	throw exception;
  }
			
		return ajaxResponse;
	}
	
	//
 //
	//
	protected synchronized String Application2Service(final String identificationKey, 
																																																			final String userID, 
																																																			final String applicationID,	
																																																			final ArrayList<ServiceAdapterObject> serviceAdapters, 
																																																			final String applicationMessage, 
																																																			final JSONObject applicationData) throws JSONException, Exception
	{
		String ajaxResponse = "";

		//
  if(applicationMessage.equals("get_environment"))
		{
  	ajaxResponse = getUserEnvironment(identificationKey, serviceAdapters);
		} 		
  else if(applicationMessage.equals("get_user_submittal_groups"))
		{
  	ajaxResponse = getUserSubmittalGroups(identificationKey, serviceAdapters);
		} 	 
  else if(applicationMessage.equals("get_user_vetting_groups"))
		{
  	ajaxResponse = getUserVettingGroups(identificationKey, serviceAdapters);
		} 	
  else if(applicationMessage.equals("get_languages"))
		{
  	ajaxResponse = getLanguages(identificationKey, serviceAdapters, applicationData);
		} 		
  else if(applicationMessage.equals("get_domains"))
		{
  	ajaxResponse = getDomains(identificationKey, serviceAdapters, applicationData);
		}   
  else if(applicationMessage.equals("get_types"))
		{
  	ajaxResponse = getTypes(identificationKey, serviceAdapters, applicationData);
		}  
  else if(applicationMessage.equals("get_collections"))
		{
  	ajaxResponse = getCollections(identificationKey, serviceAdapters, applicationData);
		} 	  
  else if(applicationMessage.equals("get_terminologies"))
		{
  	ajaxResponse = getTerminologies(identificationKey, serviceAdapters, applicationData);
		}  
  else if(applicationMessage.equals("get_terminology_document"))
		{
			ajaxResponse = getTerminologyDocument(identificationKey, serviceAdapters, applicationData);
		}
		else if(applicationMessage.equals("save_terminology"))
		{
			ajaxResponse = saveTerminology(identificationKey, serviceAdapters, applicationData);
		}
		else if(applicationMessage.equals("delete_terminology"))
		{
			ajaxResponse = deleteTerminology(identificationKey, serviceAdapters, applicationData);
		}
		else if(applicationMessage.equals("update_terminology"))
		{
			ajaxResponse = updateTerminology(identificationKey, serviceAdapters, applicationData);
		}	
		else if(applicationMessage.equals("submit_terminology"))
		{
			ajaxResponse = submitTerminology(identificationKey, serviceAdapters, applicationData);
		}
		else if(applicationMessage.equals("reject_terminology"))
		{
			ajaxResponse = rejectTerminology(identificationKey, serviceAdapters, applicationData);
		}
		else if(applicationMessage.equals("publish_terminology"))
		{
			ajaxResponse = publishTerminology(identificationKey, serviceAdapters, applicationData);
		}	
		else
		{
			return JSONResponse.buildResponse(JsonError.LoadError("003", "Unsupported Message"));
		}			
		
		//
	 return ajaxResponse;		
	}
	
	protected String UploadedFileAvailable(final String identificationKey, final JSONObject fileDescription, final ArrayList<ServiceAdapterObject> serviceAdapters) throws Exception
 {
		JSONObject jsonObject = new JSONObject();
		jsonObject.put(ServiceConstants.SERVICE_STATUS, ServiceConstants.status.UNSUPPORTED);
		
		return jsonObject.toString();
 }	
	
	protected String GetServiceReport(final String identificationKey, final JSONObject jsonReportParameters) throws Exception
	{
		JSONObject jsonObject = new JSONObject();
		jsonObject.put(ServiceConstants.SERVICE_STATUS, ServiceConstants.status.UNSUPPORTED);
		
		return jsonObject.toString();
	}
	
	//
	@SuppressWarnings("unchecked")
	private String getUserEnvironment(final String identificationKey, final ArrayList<ServiceAdapterObject> serviceAdapters) throws Exception
	{
		JSONObject jsonObject = new JSONObject();
		
		//
		JSONObject jsonUserInformation = getUserInformation(identificationKey);
		
		//
		// Get the user's repository information from the ContentManagement Service
		//
		JSONObject serviceAPIData = new JSONObject();
		serviceAPIData.put("user_id", jsonUserInformation.getString("user_id"));
		
		JSONObject jsonServiceObject = new JSONObject();
		jsonServiceObject.put("service_meta", "fuzein_cm_service");
		jsonServiceObject.put("service_action", "get_user_repository_info");
		jsonServiceObject.put("service_api_data", serviceAPIData);
	 
	 //
		String response = FuzeInNotificationController.getInstance().callService(identificationKey, jsonServiceObject);
  JSONObject jsonResponseObject = new JSONObject(response);
  
  if(jsonResponseObject.getString(ServiceConstants.SERVICE_STATUS).equals(ServiceConstants.status.SUCCESS.toString()))
  {
  	//
  	// Extract Info provided by the ContentManagement Service
  	JSONArray jsonArray = jsonResponseObject.getJSONArray(ServiceConstants.SERVICE_DATA);
  	
  	for(int iIndex = 0; iIndex < jsonArray.length(); iIndex++)
  	{
  		JSONObject jsonDataObject = jsonArray.getJSONObject(iIndex);
	  	Iterator<String> metaIterator = jsonDataObject.keys();
	  	
	  	while(metaIterator.hasNext())			  			
	  	{
			 	String key = metaIterator.next();
			 	String value = jsonDataObject.getString(key);
			 	
			 	// Add Terminology Manager Directory
			 	if(key.equals("user_root_folder") == true)
			 	{
			 		value += "/My Documents/" + defaultCMDocumentDirectory;
			 	}

			 	jsonObject.put(key, value);
	  	}
  	}
  }
  
  ///jdoe/Desktop/Terminology Management
  // Get the User's terminology Profile ... Submittal Groups and Vetting
  String userTerminologyProfile = getUserSubmittalGroups(identificationKey, serviceAdapters);
		JSONObject jsonResponse = processServiceResponse(userTerminologyProfile);
		
		jsonResponse = jsonResponse.getJSONObject(AdapterConstants.ADAPTER_DATA).getJSONObject(AdapterConstants.ADAPTER_DATA);
  jsonObject.put("terminology_profile", jsonResponse);
  
  //
		//
		JSONObject jsonContainerObject = new JSONObject();
		jsonContainerObject.put(ServiceConstants.SERVICE_STATUS, ServiceConstants.status.SUCCESS);
		jsonContainerObject.put(ServiceConstants.SERVICE_DATA, jsonObject);
		
		//
		return jsonContainerObject.toString();	
	}
	
	//
	@SuppressWarnings("unchecked")
	private String getUserSubmittalGroups(final String identificationKey, final ArrayList<ServiceAdapterObject> serviceAdapters) throws Exception
	{
		JSONArray jsonArray = new JSONArray();
		
		for(ServiceAdapterObject serviceAdapter : serviceAdapters)
		{
			BaseTerminologyAdapter baseAdapter = null;
			baseAdapter = (BaseTerminologyAdapter) AdapterManager.getInstance().getAdapter(serviceAdapter.getAdapterClassName());
		
			//
			JSONObject jsonObject = null;

			try
			{
				JSONObject jsonUserInformation = getUserInformation(identificationKey);
				
				//
				// Prepare Terminology Package
				JSONObject jsonUserObject = new JSONObject();
				jsonUserObject.put("user_information", jsonUserInformation); 

				//
			 jsonObject = baseAdapter.getUserSubmittalGroups(identificationKey, jsonUserObject);
			 jsonObject.put(AdapterConstants.ADAPTER_NAME, serviceAdapter.getAdapterDisplayName());

			 jsonArray.put(jsonObject);
			}
			catch(Exception exception)
			{
				jsonObject.put(AdapterConstants.ADAPTER_STATUS, ServiceConstants.status.FAILED);
				jsonObject.put(ServiceConstants.ERROR_REASON, exception.toString());
				
				jsonArray.put(jsonObject);
			}
		}
		
		//
		JSONObject jsonContainerObject = new JSONObject();
		jsonContainerObject.put(ServiceConstants.SERVICE_STATUS, ServiceConstants.status.SUCCESS);
		jsonContainerObject.put(ServiceConstants.SERVICE_DATA, jsonArray);
		
		//
		return jsonContainerObject.toString();	
	}
	
	//
	@SuppressWarnings("unchecked")
	private String getUserVettingGroups(final String identificationKey, final ArrayList<ServiceAdapterObject> serviceAdapters) throws Exception
	{
		JSONArray jsonArray = new JSONArray();
		
		for(ServiceAdapterObject serviceAdapter : serviceAdapters)
		{
			BaseTerminologyAdapter baseAdapter = null;
			baseAdapter = (BaseTerminologyAdapter) AdapterManager.getInstance().getAdapter(serviceAdapter.getAdapterClassName());
		
			//
			JSONObject jsonObject = null;

			try
			{
				JSONObject jsonUserInformation = getUserInformation(identificationKey);
				
				//
				// Prepare Terminology Package
				JSONObject jsonUserObject = new JSONObject();
				jsonUserObject.put("user_information", jsonUserInformation); 

				//
			 jsonObject = baseAdapter.getUserVettingGroups(identificationKey, jsonUserObject);
			 jsonObject.put(AdapterConstants.ADAPTER_NAME, serviceAdapter.getAdapterDisplayName());

			 jsonArray.put(jsonObject);
			}
			catch(Exception exception)
			{
				jsonObject.put(AdapterConstants.ADAPTER_STATUS, ServiceConstants.status.FAILED);
				jsonObject.put(ServiceConstants.ERROR_REASON, exception.toString());
				
				jsonArray.put(jsonObject);
			}
		}
		
		//
		JSONObject jsonContainerObject = new JSONObject();
		jsonContainerObject.put(ServiceConstants.SERVICE_STATUS, ServiceConstants.status.SUCCESS);
		jsonContainerObject.put(ServiceConstants.SERVICE_DATA, jsonArray);
		
		//
		return jsonContainerObject.toString();	
	}
	
	//
	@SuppressWarnings("unchecked")
	private String getLanguages(final String identificationKey, final ArrayList<ServiceAdapterObject> serviceAdapters, final JSONObject jsonDataObject) throws Exception
	{
  //		
		// Get Terminology Supported Languages
		JSONObject serviceAPIData = new JSONObject();
		serviceAPIData.put("system_name", "BBN");
		
		//
		// Submit to the Metadata Service
		JSONObject jsonServiceObject = new JSONObject();
		jsonServiceObject.put("service_meta", "fuzein_metadata_service");
		jsonServiceObject.put("service_action", "get_all_system_languages");
		jsonServiceObject.put("service_api_data", serviceAPIData);
		
		String serviceResponse = FuzeInNotificationController.getInstance().callService(identificationKey, jsonServiceObject);
		JSONObject jsonResponse = processServiceResponse(serviceResponse);
		
		//
		JSONObject jsonAdapterResults = jsonResponse.getJSONObject(AdapterConstants.ADAPTER_DATA).getJSONObject(AdapterConstants.ADAPTER_RESULTS);
		
		//
		JSONArray jsonLanguages = new JSONArray();
		Iterator<String> iterator = jsonAdapterResults.keys();
		
		while(iterator.hasNext())
		{
			String key = iterator.next();
			
   JSONObject jsonObject = new JSONObject();
   jsonObject.put("language_family", key);
   jsonObject.put("languages", jsonAdapterResults.getJSONArray(key));
   
   //
   jsonLanguages.put(jsonObject);
		}
		
		//
		//
		JSONObject jsonContainerObject = new JSONObject();
		jsonContainerObject.put(ServiceConstants.SERVICE_STATUS, ServiceConstants.status.SUCCESS);
	 jsonContainerObject.put(ServiceConstants.SERVICE_DATA, jsonLanguages);
		
		//
		return jsonContainerObject.toString();		
	}
	
	private String getDomains(final String identificationKey, final ArrayList<ServiceAdapterObject> serviceAdapters, final JSONObject jsonDataObject) throws Exception
	{
  //		
		// Get Terminology Supported Domains
		JSONObject jsonServiceObject = new JSONObject();
		jsonServiceObject.put("service_meta", "fuzein_metadata_service");
		jsonServiceObject.put("service_action", "get_all_domains");
		
		String serviceResponse = FuzeInNotificationController.getInstance().callService(identificationKey, jsonServiceObject);
		JSONObject jsonResponse = processServiceResponse(serviceResponse);
		
		//
		//
		JSONObject jsonContainerObject = new JSONObject();
		jsonContainerObject.put(ServiceConstants.SERVICE_STATUS, ServiceConstants.status.SUCCESS);
	 jsonContainerObject.put(ServiceConstants.SERVICE_DATA, jsonResponse);
		
		//
		return jsonContainerObject.toString();		
	}
	
	private String getTypes(final String identificationKey, final ArrayList<ServiceAdapterObject> serviceAdapters, final JSONObject jsonDataObject) throws Exception
	{
  //		
		// Get Terminology Supported Languages
		JSONObject serviceAPIData = new JSONObject();
		serviceAPIData.put("system_name", "LLB");
		
		//
		// Submit to the Metadata Service
		JSONObject jsonServiceObject = new JSONObject();
		jsonServiceObject.put("service_meta", "fuzein_metadata_service");
		jsonServiceObject.put("service_action", "get_all_system_types");
		jsonServiceObject.put("service_api_data", serviceAPIData);
		
		String serviceResponse = FuzeInNotificationController.getInstance().callService(identificationKey, jsonServiceObject);
		JSONObject jsonResponse = processServiceResponse(serviceResponse);
		
		//
		//
		JSONObject jsonContainerObject = new JSONObject();
		jsonContainerObject.put(ServiceConstants.SERVICE_STATUS, ServiceConstants.status.SUCCESS);
	 jsonContainerObject.put(ServiceConstants.SERVICE_DATA, jsonResponse);
		
		//
		return jsonContainerObject.toString();		
	}	
	
	//
	private String getCollections(final String identificationKey, final ArrayList<ServiceAdapterObject> serviceAdapters, final JSONObject jsonDataObject) throws Exception
	{
		//
		// Get from the Datawarehouse the list of available collections
		JSONObject jsonServiceObject = new JSONObject();
		jsonServiceObject.put("service_meta", "fuzein_datawarehouse_service");
		jsonServiceObject.put("service_action", "list_dictionaries");
		
		String response = FuzeInNotificationController.getInstance().callService(identificationKey, jsonServiceObject);
  JSONObject jsonResponseObject = new JSONObject(response);
  
  //
 	// Extract Info provided by the Datawarehouse Service
		JSONArray jsonArray = new JSONArray();
		
		if(jsonResponseObject.getString(ServiceConstants.SERVICE_STATUS).equals(ServiceConstants.status.SUCCESS.toString()))
  {
  	jsonArray = jsonResponseObject.getJSONArray(ServiceConstants.SERVICE_DATA);
  }
		
		//
		JSONObject jsonContainerObject = new JSONObject();
		jsonContainerObject.put(ServiceConstants.SERVICE_STATUS, ServiceConstants.status.SUCCESS);
		jsonContainerObject.put(ServiceConstants.SERVICE_DATA, jsonArray);
		
		//
		return jsonContainerObject.toString();		
	}
	
	//
	private String saveTerminology(final String identificationKey, final ArrayList<ServiceAdapterObject> serviceAdapters, final JSONObject jsonDataObject) throws Exception
	{
		JSONArray jsonArray = new JSONArray();

		for(ServiceAdapterObject serviceAdapter : serviceAdapters)
		{
			BaseTerminologyAdapter baseAdapter = null;
			baseAdapter = (BaseTerminologyAdapter) AdapterManager.getInstance().getAdapter(serviceAdapter.getAdapterClassName());
		
			//
			JSONObject jsonObject = new JSONObject();
		 jsonObject.put(AdapterConstants.ADAPTER_NAME, serviceAdapter.getAdapterDisplayName());

			try
			{
				JSONObject jsonUserInformation = getUserInformation(identificationKey);
				
				//
				// Prepare Terminology Package
				JSONObject jsonTerminologyObject = new JSONObject();
				jsonTerminologyObject.put("user_information", jsonUserInformation); 
				jsonTerminologyObject.put("submittal_type", jsonDataObject.getString("submittal_type"));
				jsonTerminologyObject.put("content_management_folder", jsonDataObject.getString("terminology_folder"));
				
				//
				if(jsonDataObject.getString("submittal_type").equals("json"))
				{
				 jsonTerminologyObject.put("terminology_data", jsonDataObject.getJSONObject("terminology_data"));
				}
				else if(jsonDataObject.getString("submittal_type").equals("xml"))
				{
				 jsonTerminologyObject.put("terminology_data", jsonDataObject.getString("terminology_data"));
				}
				
				// If a name is provided, use it, else it will be generated from the terminology data itself
				if(jsonDataObject.has("terminology_name"))
				{
					jsonTerminologyObject.put("terminology_name", jsonDataObject.getString("terminology_name"));
				}
				
				//
				// Submit terminology Package
			 jsonObject = baseAdapter.saveTerminology(identificationKey, jsonTerminologyObject);
			 jsonArray.put(jsonObject);
			}
			catch(Exception exception)
			{
				jsonObject.put(AdapterConstants.ADAPTER_STATUS, ServiceConstants.status.FAILED);
				jsonObject.put(ServiceConstants.ERROR_REASON, exception.toString());
				jsonArray.put(jsonObject);
			}
		}
		
		//
		JSONObject jsonContainerObject = new JSONObject();
		jsonContainerObject.put(ServiceConstants.SERVICE_STATUS, ServiceConstants.status.SUCCESS);
		jsonContainerObject.put(ServiceConstants.SERVICE_DATA, jsonArray);
		
		//
		return jsonContainerObject.toString();		
	}

	private String updateTerminology(final String identificationKey, final ArrayList<ServiceAdapterObject> serviceAdapters, final JSONObject jsonDataObject) throws Exception
	{
		JSONArray jsonArray = new JSONArray();

		for(ServiceAdapterObject serviceAdapter : serviceAdapters)
		{
			BaseTerminologyAdapter baseAdapter = null;
			baseAdapter = (BaseTerminologyAdapter) AdapterManager.getInstance().getAdapter(serviceAdapter.getAdapterClassName());
		
			//
			JSONObject jsonObject = new JSONObject();
		 jsonObject.put(AdapterConstants.ADAPTER_NAME, serviceAdapter.getAdapterDisplayName());

			try
			{
				JSONObject jsonUserInformation = getUserInformation(identificationKey);
				
				//
				// Prepare Terminology Package
				JSONObject jsonTerminologyObject = new JSONObject();
				jsonTerminologyObject.put("user_information", jsonUserInformation); 
				jsonTerminologyObject.put("submittal_type", jsonDataObject.getString("submittal_type"));
				jsonTerminologyObject.put("content_management_folder", jsonDataObject.getString("terminology_folder"));
				jsonTerminologyObject.put("terminology_name", jsonDataObject.getString("terminology_name"));
				
				//
				if(jsonDataObject.getString("submittal_type").equals("json"))
				{
				 jsonTerminologyObject.put("terminology_data", jsonDataObject.getJSONObject("terminology_data"));
				}
				else if(jsonDataObject.getString("submittal_type").equals("xml"))
				{
				 jsonTerminologyObject.put("terminology_data", jsonDataObject.getString("terminology_data"));
				}
				
				//
				// Submit Terminology Package
			 jsonObject = baseAdapter.updateTerminology(identificationKey, jsonTerminologyObject);
			 jsonArray.put(jsonObject);
			}
			catch(Exception exception)
			{
				jsonObject.put(AdapterConstants.ADAPTER_STATUS, ServiceConstants.status.FAILED);
				jsonObject.put(ServiceConstants.ERROR_REASON, exception.toString());
				jsonArray.put(jsonObject);
			}
		}
		
		//
		JSONObject jsonContainerObject = new JSONObject();
		jsonContainerObject.put(ServiceConstants.SERVICE_STATUS, ServiceConstants.status.SUCCESS);
		jsonContainerObject.put(ServiceConstants.SERVICE_DATA, jsonArray);
		
		//
		return jsonContainerObject.toString();		
	}
	
	private String deleteTerminology(final String identificationKey, final ArrayList<ServiceAdapterObject> serviceAdapters, final JSONObject jsonDataObject) throws Exception
	{
		JSONArray jsonArray = new JSONArray();
		
		for(ServiceAdapterObject serviceAdapter : serviceAdapters)
		{
			BaseTerminologyAdapter baseAdapter = null;
			baseAdapter = (BaseTerminologyAdapter) AdapterManager.getInstance().getAdapter(serviceAdapter.getAdapterClassName());
		
			//
			JSONObject jsonObject = new JSONObject();
		 jsonObject.put(AdapterConstants.ADAPTER_NAME, serviceAdapter.getAdapterDisplayName());

			try
			{
				JSONObject jsonUserInformation = getUserInformation(identificationKey);
				
				//
				// Prepare Terminology Package
				JSONObject jsonTerminologyObject = new JSONObject();
				jsonTerminologyObject.put("user_information", jsonUserInformation); 
				jsonTerminologyObject.put("content_management_folder", jsonDataObject.getString("terminology_folder"));
				jsonTerminologyObject.put("terminology_name", jsonDataObject.getString("terminology_name"));
				
				//
				// Submit terminology Package
			 jsonObject = baseAdapter.deleteTerminology(identificationKey, jsonTerminologyObject);
			 jsonArray.put(jsonObject);
			}
			catch(Exception exception)
			{
				jsonObject.put(AdapterConstants.ADAPTER_STATUS, ServiceConstants.status.FAILED);
				jsonObject.put(ServiceConstants.ERROR_REASON, exception.toString());
				jsonArray.put(jsonObject);
			}
		}
		
		//
		JSONObject jsonContainerObject = new JSONObject();
		jsonContainerObject.put(ServiceConstants.SERVICE_STATUS, ServiceConstants.status.SUCCESS);
		jsonContainerObject.put(ServiceConstants.SERVICE_DATA, jsonArray);
		
		//
		return jsonContainerObject.toString();		
	}
	
	private String getTerminologies(final String identificationKey, final ArrayList<ServiceAdapterObject> serviceAdapters, final JSONObject jsonDataObject) throws Exception
	{
		JSONArray jsonArray = new JSONArray();
		
		for(ServiceAdapterObject serviceAdapter : serviceAdapters)
		{
			BaseTerminologyAdapter baseAdapter = null;
			baseAdapter = (BaseTerminologyAdapter) AdapterManager.getInstance().getAdapter(serviceAdapter.getAdapterClassName());
		
			//
			JSONObject jsonObject = null;

			try
			{
				JSONObject jsonUserInformation = getUserInformation(identificationKey);
				
				//
				// Prepare Terminology Package
				JSONObject jsonTerminologyObject = new JSONObject();
				jsonTerminologyObject.put("user_information", jsonUserInformation); 

				//
			 jsonObject = baseAdapter.getTerminologies(identificationKey, jsonTerminologyObject);
			 jsonObject.put(AdapterConstants.ADAPTER_NAME, serviceAdapter.getAdapterDisplayName());

			 jsonArray.put(jsonObject);
			}
			catch(Exception exception)
			{
				jsonObject.put(AdapterConstants.ADAPTER_STATUS, ServiceConstants.status.FAILED);
				jsonObject.put(ServiceConstants.ERROR_REASON, exception.toString());
				
				jsonArray.put(jsonObject);
			}
		}
		
		//
		JSONObject jsonContainerObject = new JSONObject();
		jsonContainerObject.put(ServiceConstants.SERVICE_STATUS, ServiceConstants.status.SUCCESS);
		jsonContainerObject.put(ServiceConstants.SERVICE_DATA, jsonArray);
		
		//
		return jsonContainerObject.toString();		
	}
	
	private String getTerminologyDocument(final String identificationKey, final ArrayList<ServiceAdapterObject> serviceAdapters, final JSONObject jsonDataObject) throws Exception
	{
		JSONArray jsonArray = new JSONArray();
		
		for(ServiceAdapterObject serviceAdapter : serviceAdapters)
		{
			BaseTerminologyAdapter baseAdapter = null;
			baseAdapter = (BaseTerminologyAdapter) AdapterManager.getInstance().getAdapter(serviceAdapter.getAdapterClassName());
		
			//
			JSONObject jsonObject = new JSONObject();
		 jsonObject.put(AdapterConstants.ADAPTER_NAME, serviceAdapter.getAdapterDisplayName());

			try
			{
				JSONObject jsonUserInformation = getUserInformation(identificationKey);
				
				//
				// Prepare Terminology Package
				JSONObject jsonTerminologyObject = new JSONObject();
				jsonTerminologyObject.put("user_information", jsonUserInformation); 
				jsonTerminologyObject.put("content_management_folder", jsonDataObject.getString("terminology_folder"));
				jsonTerminologyObject.put("terminology_name", jsonDataObject.getString("terminology_name"));
				
				//
			 jsonObject = baseAdapter.getTerminology(identificationKey, jsonTerminologyObject);
			 jsonObject.put(AdapterConstants.ADAPTER_NAME, serviceAdapter.getAdapterDisplayName());
			 
			 jsonArray.put(jsonObject);
			}
			catch(Exception exception)
			{
				jsonObject.put(AdapterConstants.ADAPTER_STATUS, ServiceConstants.status.FAILED);
				jsonObject.put(ServiceConstants.ERROR_REASON, exception.toString());
				
				jsonArray.put(jsonObject);
			}
		}
		
		//
		JSONObject jsonContainerObject = new JSONObject();
		jsonContainerObject.put(ServiceConstants.SERVICE_STATUS, ServiceConstants.status.SUCCESS);
		jsonContainerObject.put(ServiceConstants.SERVICE_DATA, jsonArray);
		
		//
		return jsonContainerObject.toString();			
	}
	
	private String submitTerminology(final String identificationKey, final ArrayList<ServiceAdapterObject> serviceAdapters, final JSONObject jsonDataObject) throws Exception
	{
		JSONArray jsonArray = new JSONArray();

		for(ServiceAdapterObject serviceAdapter : serviceAdapters)
		{
			BaseTerminologyAdapter baseAdapter = null;
			baseAdapter = (BaseTerminologyAdapter) AdapterManager.getInstance().getAdapter(serviceAdapter.getAdapterClassName());
		
			//
			JSONObject jsonObject = new JSONObject();
		 jsonObject.put(AdapterConstants.ADAPTER_NAME, serviceAdapter.getAdapterDisplayName());

			try
			{
				JSONObject jsonUserInformation = getUserInformation(identificationKey);
				
				//
				// Prepare Terminology Package
				JSONObject jsonTerminologyObject = new JSONObject();
				jsonTerminologyObject.put("user_information", jsonUserInformation); 
				jsonTerminologyObject.put("content_management_folder", jsonDataObject.getString("terminology_folder"));
				jsonTerminologyObject.put("terminology_name", jsonDataObject.getString("terminology_name"));
				jsonTerminologyObject.put("group_id", jsonDataObject.getString("group_id"));
				
				//
				// Submit Terminology Package
			 jsonObject = baseAdapter.submitTerminology(identificationKey, jsonTerminologyObject);
			 jsonArray.put(jsonObject);
			}
			catch(Exception exception)
			{
				jsonObject.put(AdapterConstants.ADAPTER_STATUS, ServiceConstants.status.FAILED);
				jsonObject.put(ServiceConstants.ERROR_REASON, exception.toString());
				jsonArray.put(jsonObject);
			}
		}
		
		//
		JSONObject jsonContainerObject = new JSONObject();
		jsonContainerObject.put(ServiceConstants.SERVICE_STATUS, ServiceConstants.status.SUCCESS);
		jsonContainerObject.put(ServiceConstants.SERVICE_DATA, jsonArray);
		
		//
		return jsonContainerObject.toString();	
	}
	
	private String rejectTerminology(final String identificationKey, final ArrayList<ServiceAdapterObject> serviceAdapters, final JSONObject jsonDataObject) throws Exception
	{
		JSONArray jsonArray = new JSONArray();

		for(ServiceAdapterObject serviceAdapter : serviceAdapters)
		{
			BaseTerminologyAdapter baseAdapter = null;
			baseAdapter = (BaseTerminologyAdapter) AdapterManager.getInstance().getAdapter(serviceAdapter.getAdapterClassName());
		
			//
			JSONObject jsonObject = new JSONObject();
		 jsonObject.put(AdapterConstants.ADAPTER_NAME, serviceAdapter.getAdapterDisplayName());

			try
			{
				JSONObject jsonUserInformation = getUserInformation(identificationKey);
				
				//
				// Prepare Terminology Package
				JSONObject jsonTerminologyObject = new JSONObject();
				jsonTerminologyObject.put("user_information", jsonUserInformation); 
				jsonTerminologyObject.put("content_management_folder", jsonDataObject.getString("terminology_folder"));
				jsonTerminologyObject.put("terminology_name", jsonDataObject.getString("terminology_name"));
				
				//
				// Submit Terminology Package
			 jsonObject = baseAdapter.rejectTerminology(identificationKey, jsonTerminologyObject);
			 jsonArray.put(jsonObject);
			}
			catch(Exception exception)
			{
				jsonObject.put(AdapterConstants.ADAPTER_STATUS, ServiceConstants.status.FAILED);
				jsonObject.put(ServiceConstants.ERROR_REASON, exception.toString());
				jsonArray.put(jsonObject);
			}
		}
		
		//
		JSONObject jsonContainerObject = new JSONObject();
		jsonContainerObject.put(ServiceConstants.SERVICE_STATUS, ServiceConstants.status.SUCCESS);
		jsonContainerObject.put(ServiceConstants.SERVICE_DATA, jsonArray);
		
		//
		return jsonContainerObject.toString();	
	}
	
	private String publishTerminology(final String identificationKey, final ArrayList<ServiceAdapterObject> serviceAdapters, final JSONObject jsonDataObject) throws Exception
	{
		JSONArray jsonArray = new JSONArray();

		for(ServiceAdapterObject serviceAdapter : serviceAdapters)
		{
			BaseTerminologyAdapter baseAdapter = null;
			baseAdapter = (BaseTerminologyAdapter) AdapterManager.getInstance().getAdapter(serviceAdapter.getAdapterClassName());
		
			//
			JSONObject jsonObject = new JSONObject();
		 jsonObject.put(AdapterConstants.ADAPTER_NAME, serviceAdapter.getAdapterDisplayName());

			try
			{
				JSONObject jsonUserInformation = getUserInformation(identificationKey);
				
				//
				// Prepare Terminology Package
				JSONObject jsonTerminologyObject = new JSONObject();
				jsonTerminologyObject.put("submittal_type", jsonDataObject.getString("submittal_type")); 
				jsonTerminologyObject.put("user_information", jsonUserInformation); 
				jsonTerminologyObject.put("content_management_folder", jsonDataObject.getString("terminology_folder"));
				jsonTerminologyObject.put("terminology_name", jsonDataObject.getString("terminology_name"));
				jsonTerminologyObject.put("collection", jsonDataObject.getJSONArray("collection"));
				
				//
				// Submit Terminology Package
			 jsonObject = baseAdapter.publishTerminology(identificationKey, jsonTerminologyObject);
			 jsonArray.put(jsonObject);
			}
			catch(Exception exception)
			{
				jsonObject.put(AdapterConstants.ADAPTER_STATUS, ServiceConstants.status.FAILED);
				jsonObject.put(ServiceConstants.ERROR_REASON, exception.toString());
				jsonArray.put(jsonObject);
			}
		}
		
		//
		JSONObject jsonContainerObject = new JSONObject();
		jsonContainerObject.put(ServiceConstants.SERVICE_STATUS, ServiceConstants.status.SUCCESS);
		jsonContainerObject.put(ServiceConstants.SERVICE_DATA, jsonArray);
		
		//
		return jsonContainerObject.toString();			
	}
	
	private String getTerminologyProperties(final String identificationKey, final ArrayList<ServiceAdapterObject> serviceAdapters, final JSONObject jsonDataObject) throws Exception
	{
		JSONArray jsonArray = new JSONArray();
		
		for(ServiceAdapterObject serviceAdapter : serviceAdapters)
		{
			BaseTerminologyAdapter baseAdapter = null;
			baseAdapter = (BaseTerminologyAdapter) AdapterManager.getInstance().getAdapter(serviceAdapter.getAdapterClassName());
		
			//
			JSONObject jsonObject = new JSONObject();

			try
			{
			 jsonObject = baseAdapter.getTerminologyProperties(identificationKey, jsonDataObject);
			 jsonObject.put(AdapterConstants.ADAPTER_NAME, serviceAdapter.getAdapterDisplayName());

			 jsonArray.put(jsonObject);
			}
			catch(Exception exception)
			{
				jsonObject.put(AdapterConstants.ADAPTER_STATUS, ServiceConstants.status.FAILED);
				jsonObject.put(ServiceConstants.ERROR_REASON, exception.toString());
				
				jsonArray.put(jsonObject);
			}
		}
		
		//
		JSONObject jsonContainerObject = new JSONObject();
		jsonContainerObject.put(ServiceConstants.SERVICE_STATUS, ServiceConstants.status.SUCCESS);
		jsonContainerObject.put(ServiceConstants.SERVICE_DATA, jsonArray);
		
		//
		return jsonContainerObject.toString();		
	}
	
	private String searchTerminology(final String identificationKey, final ArrayList<ServiceAdapterObject> serviceAdapters, final JSONObject jsonDataObject) throws Exception
	{
		JSONArray jsonArray = new JSONArray();
		
		for(ServiceAdapterObject serviceAdapter : serviceAdapters)
		{
			BaseTerminologyAdapter baseAdapter = null;
			baseAdapter = (BaseTerminologyAdapter) AdapterManager.getInstance().getAdapter(serviceAdapter.getAdapterClassName());
		
			//
			JSONObject jsonObject = new JSONObject();
		 jsonObject.put(AdapterConstants.ADAPTER_NAME, serviceAdapter.getAdapterDisplayName());

			try
			{
			 jsonObject = baseAdapter.searchLocalTerminology(identificationKey, jsonDataObject);
			 jsonArray.put(jsonObject);
			}
			catch(Exception exception)
			{
				jsonObject.put(AdapterConstants.ADAPTER_STATUS, ServiceConstants.status.FAILED);
				jsonObject.put(ServiceConstants.ERROR_REASON, exception.toString());
				
				jsonArray.put(jsonObject);
			}
		}
		
		//
		JSONObject jsonContainerObject = new JSONObject();
		jsonContainerObject.put(ServiceConstants.SERVICE_STATUS, ServiceConstants.status.SUCCESS);
		jsonContainerObject.put(ServiceConstants.SERVICE_DATA, jsonArray);
		
		//
		return jsonContainerObject.toString();		
	}
}
