import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const token = process.env.CLICKUP_API_TOKEN;

  if (!token) {
    return NextResponse.json({ error: "CLICKUP_API_TOKEN is not configured" }, { status: 500 });
  }

  const listId = process.env.TURNOVER_LIST_ID;
  if (!listId) {
    return NextResponse.json({ error: "TURNOVER_LIST_ID is not configured in .env.local" }, { status: 500 });
  }

  try {
    const data = await req.json();

    // 1. Assemble custom fields for task creation
    //    NOTE: Users-type fields (like Applicant) CANNOT be set during creation —
    //    they must be set via a separate field-update call after the task exists.
    const customFields = [];

    // Vertical (dropdown custom field — value is the option ID string)
    if (data.verticalFieldId && data.vertical) {
      customFields.push({ id: data.verticalFieldId, value: data.vertical });
    }

    // Leave Type (dropdown custom field — value is the option ID string)
    if (data.leaveTypeFieldId && data.leaveType) {
      customFields.push({ id: data.leaveTypeFieldId, value: data.leaveType });
    }

    // Gemini Notes (text custom field)
    if (data.geminiNotesFieldId && data.geminiNotesLink) {
      customFields.push({ id: data.geminiNotesFieldId, value: data.geminiNotesLink });
    }

    // 2. Assignees — Lead Assignee goes on the task's assignees list
    const assignees: number[] = [];
    if (data.leadAssignee) assignees.push(Number(data.leadAssignee));

    // 3. Convert dates to UNIX timestamps (ms) for ClickUp
    const startDateTimestamp = data.startDate ? new Date(data.startDate).getTime() : null;
    const dueDateTimestamp   = data.endDate   ? new Date(data.endDate).getTime()   : null;

    // 4. Build main task payload — description is ONLY what the user typed
    const mainTaskPayload: any = {
      name: data.taskName || "New Turnover Task",
      description: data.taskDescription || "",
      assignees,
      custom_fields: customFields,
    };
    if (startDateTimestamp) mainTaskPayload.start_date = startDateTimestamp;
    if (dueDateTimestamp)   mainTaskPayload.due_date   = dueDateTimestamp;

    // 5. Create Main Task
    const mainTaskRes = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task`, {
      method: 'POST',
      headers: { 'Authorization': token, 'Content-Type': 'application/json' },
      body: JSON.stringify(mainTaskPayload),
    });

    if (!mainTaskRes.ok) {
      const errorData = await mainTaskRes.text();
      console.error("Failed to create ClickUp Main Task:", errorData);
      throw new Error(`ClickUp API Error (Main Task): ${mainTaskRes.status} — ${errorData}`);
    }

    const mainTaskData = await mainTaskRes.json();
    const mainTaskId = mainTaskData.id;

    // 6. Set Applicant custom field via separate API call (users-type fields require an array format [userId])
    if (data.applicantFieldId && data.applicant) {
      const applicantRes = await fetch(
        `https://api.clickup.com/api/v2/task/${mainTaskId}/field/${data.applicantFieldId}`,
        {
          method: 'POST',
          headers: { 'Authorization': token, 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            value: { 
              add: [Number(data.applicant)] 
            } 
          }),
        }
      );
      if (!applicantRes.ok) {
        const errText = await applicantRes.text();
        console.error("Failed to set Applicant custom field:", errText);
      }
    }



    // 7. Create Subtasks — description is ONLY what the user typed
    const subtasks = data.clientTurnovers || [];
    const createdSubtasks = [];

    for (const subtask of subtasks) {
      const subtaskAssignees: number[] = [];
      if (subtask.subtaskAssignee) subtaskAssignees.push(Number(subtask.subtaskAssignee));

      const subtaskPayload = {
        name: subtask.subtaskName || "Client Turnover",
        description: subtask.subtaskDescription || "",
        assignees: subtaskAssignees,
        parent: mainTaskId,
      };

      const subRes = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task`, {
        method: 'POST',
        headers: { 'Authorization': token, 'Content-Type': 'application/json' },
        body: JSON.stringify(subtaskPayload),
      });

      if (subRes.ok) {
        createdSubtasks.push(await subRes.json());
      } else {
        console.warn("Failed to create a subtask:", await subRes.text());
      }
    }

    return NextResponse.json({
      success: true,
      mainTaskId,
      subtasksCreated: createdSubtasks.length,
    });

  } catch (error: any) {
    console.error("Submit API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
