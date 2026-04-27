import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    const { meeting_id } = body;
    
    if (!meeting_id) {
      return Response.json({ error: 'meeting_id is required' }, { status: 400 });
    }

    // Get meeting details
    const meeting = await base44.asServiceRole.entities.FeedbackMeeting.filter({ id: meeting_id });
    
    if (!meeting || meeting.length === 0) {
      return Response.json({ error: 'Meeting not found' }, { status: 404 });
    }

    const meetingData = meeting[0];
    
    // Get the intern's email
    const interns = await base44.asServiceRole.entities.Intern.filter({ id: meetingData.intern_id });
    if (!interns || interns.length === 0) {
      return Response.json({ error: 'Intern not found' }, { status: 404 });
    }
    
    const internEmail = interns[0].email;
    
    // Get Google Calendar access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');
    
    // Build event for calendar
    const startTime = new Date(meetingData.meeting_date);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour meeting
    
    // Build attendees list
    const attendees = [
      { email: internEmail, displayName: meetingData.intern_name }
    ];
    
    // Add expert attendees
    if (meetingData.invited_experts && Array.isArray(meetingData.invited_experts)) {
      for (const expert of meetingData.invited_experts) {
        const experts = await base44.asServiceRole.entities.Expert.filter({ id: expert.id });
        if (experts && experts.length > 0) {
          attendees.push({ 
            email: experts[0].email, 
            displayName: experts[0].name || expert.name 
          });
        }
      }
    }
    
    // Create calendar event
    const eventBody = {
      summary: `פגישת משוב - ${meetingData.intern_name}`,
      description: meetingData.notes || 'פגישת משוב עם מתמחה',
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'Asia/Jerusalem'
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'Asia/Jerusalem'
      },
      location: meetingData.location || '',
      attendees: attendees,
      sendNotifications: true
    };
    
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventBody)
    });
    
    if (!response.ok) {
      const error = await response.text();
      return Response.json({ error: `Google Calendar API error: ${error}` }, { status: response.status });
    }
    
    const eventData = await response.json();
    
    return Response.json({ 
      success: true, 
      event_id: eventData.id,
      message: 'Calendar invites sent successfully'
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});