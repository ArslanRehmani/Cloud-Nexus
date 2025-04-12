function Mass_Delete(rec_type,rec_id)
{
	try
	{
		nlapiDeleteRecord(rec_type,rec_id);
	}
	catch(err)
	{
		nlapiLogExecution("error","Error Deleting Record","Record Type: " + rec_type + "\n\nRecord ID: " + rec_id + "\n\nDetails: " + err.message);
	}
}
