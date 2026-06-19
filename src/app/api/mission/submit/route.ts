import { NextResponse } from "next/server";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SolutionStep {
  stepName: string;
  assigneeId: string | number;
  dueDate?: string;
}

interface MissionPayload {
  projectName: string;
  subtitle: string;
  solutionsComposition: string;
  missionLead: string | number;
  proponents: (string | number)[];
  chaosChallenge: string;
  chaosMatter: string;
  solutionsActionPlan: string;
  inspirationUplift: string;
  inspirationMission: string;
  successMeasure: string;
  successImpact: string;
  typeCategory: string;
  typeSize: string;
  startDate: string;
  dueDate: string;
  timelineMilestones: string;
  ganttUrl: string;
  solutionsSteps: SolutionStep[];
}

// ─── Markdown Description Builder ────────────────────────────────────────────

function buildMarkdownDescription(data: MissionPayload): string {
  if (data.subtitle && data.subtitle.trim().length > 0) {
    return data.subtitle.trim();
  }
  return "";
}

// ─── Validation ──────────────────────────────────────────────────────────────

function validatePayload(data: any): { valid: boolean; error?: string } {
  if (!data || typeof data !== "object") {
    return { valid: false, error: "Invalid request body" };
  }
  if (!data.projectName || typeof data.projectName !== "string" || data.projectName.trim().length === 0) {
    return { valid: false, error: "projectName is required" };
  }
  if (data.solutionsSteps && !Array.isArray(data.solutionsSteps)) {
    return { valid: false, error: "solutionsSteps must be an array" };
  }
  if (data.proponents && !Array.isArray(data.proponents)) {
    return { valid: false, error: "proponents must be an array" };
  }
  if (data.ganttUrl && typeof data.ganttUrl === "string" && data.ganttUrl.trim().length > 0) {
    try {
      new URL(data.ganttUrl);
    } catch {
      return { valid: false, error: "ganttUrl must be a valid URL" };
    }
  }
  // Validate each step has a stepName
  if (Array.isArray(data.solutionsSteps)) {
    for (let i = 0; i < data.solutionsSteps.length; i++) {
      const step = data.solutionsSteps[i];
      if (!step.stepName || typeof step.stepName !== "string" || step.stepName.trim().length === 0) {
        return { valid: false, error: `solutionsSteps[${i}].stepName is required` };
      }
    }
  }
  return { valid: true };
}

// ─── POST Handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const token = process.env.CLICKUP_API_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "CLICKUP_API_TOKEN is not configured" }, { status: 500 });
  }

  const listId = process.env.MISSION_LIST_ID;
  if (!listId) {
    return NextResponse.json({ error: "MISSION_LIST_ID is not configured in .env.local" }, { status: 500 });
  }

  // Resolve custom field IDs from environment
  const fieldMissionLead = process.env.CLICKUP_FIELD_MISSION_LEAD;
  const fieldSubtitle = process.env.CLICKUP_FIELD_SUBTITLE;
  const fieldComposition = process.env.CLICKUP_FIELD_COMPOSITION;
  const fieldCategory = process.env.CLICKUP_FIELD_CATEGORY;
  const fieldSize = process.env.CLICKUP_FIELD_SIZE;
  const fieldGanttUrl = process.env.CLICKUP_FIELD_GANTT_URL;
  const fieldMissionProponents = process.env.CLICKUP_FIELD_MISSION_PROPONENTS;
  
  // New long-form text fields
  const fieldChaosChallenge = process.env.CLICKUP_FIELD_CHAOS_CHALLENGE;
  const fieldChaosMatter = process.env.CLICKUP_FIELD_CHAOS_MATTER;
  const fieldSolutionsActionPlan = process.env.CLICKUP_FIELD_SOLUTIONS_ACTION_PLAN;
  const fieldInspirationUplift = process.env.CLICKUP_FIELD_INSPIRATION_UPLIFT;
  const fieldInspirationMission = process.env.CLICKUP_FIELD_INSPIRATION_MISSION;
  const fieldSuccessMeasure = process.env.CLICKUP_FIELD_SUCCESS_MEASURE;
  const fieldSuccessImpact = process.env.CLICKUP_FIELD_SUCCESS_IMPACT;
  const fieldTimelineMilestones = process.env.CLICKUP_FIELD_TIMELINE_MILESTONES;

  try {
    const data: MissionPayload = await req.json();

    // 1. Validate
    const validation = validatePayload(data);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // 2. Compile Markdown description
    const description = buildMarkdownDescription(data);

    // 3. Build custom fields array (only add if env var is configured & value is present)
    const customFields: { id: string; value: any }[] = [];

    // Helper to check if a field ID is valid (not empty and not the placeholder)
    const isValidFieldId = (id: string | undefined) => {
      return id && id !== "REPLACE_WITH_FIELD_ID";
    };

    if (isValidFieldId(fieldComposition) && data.solutionsComposition) {
      customFields.push({ id: fieldComposition!, value: data.solutionsComposition });
    }
    if (isValidFieldId(fieldCategory) && data.typeCategory) {
      customFields.push({ id: fieldCategory!, value: data.typeCategory });
    }
    if (isValidFieldId(fieldSize) && data.typeSize) {
      customFields.push({ id: fieldSize!, value: data.typeSize });
    }
    if (isValidFieldId(fieldGanttUrl) && data.ganttUrl) {
      customFields.push({ id: fieldGanttUrl!, value: data.ganttUrl });
    }
    
    // Add long-form text fields if IDs are provided
    if (isValidFieldId(fieldChaosChallenge) && data.chaosChallenge) {
      customFields.push({ id: fieldChaosChallenge!, value: data.chaosChallenge });
    }
    if (isValidFieldId(fieldChaosMatter) && data.chaosMatter) {
      customFields.push({ id: fieldChaosMatter!, value: data.chaosMatter });
    }
    if (isValidFieldId(fieldSolutionsActionPlan) && data.solutionsActionPlan) {
      customFields.push({ id: fieldSolutionsActionPlan!, value: data.solutionsActionPlan });
    }
    if (isValidFieldId(fieldInspirationUplift) && data.inspirationUplift) {
      customFields.push({ id: fieldInspirationUplift!, value: data.inspirationUplift });
    }
    if (isValidFieldId(fieldInspirationMission) && data.inspirationMission) {
      customFields.push({ id: fieldInspirationMission!, value: data.inspirationMission });
    }
    if (isValidFieldId(fieldSuccessMeasure) && data.successMeasure) {
      customFields.push({ id: fieldSuccessMeasure!, value: data.successMeasure });
    }
    if (isValidFieldId(fieldSuccessImpact) && data.successImpact) {
      customFields.push({ id: fieldSuccessImpact!, value: data.successImpact });
    }
    if (isValidFieldId(fieldTimelineMilestones) && data.timelineMilestones) {
      customFields.push({ id: fieldTimelineMilestones!, value: data.timelineMilestones });
    }

    // 4. Assignees — aggregate proponents, missionLead, and step assignees
    const allAssignees = new Set<number>();
    
    // Add proponents
    (data.proponents || []).forEach(id => {
      const numId = Number(id);
      if (!isNaN(numId) && numId > 0) allAssignees.add(numId);
    });

    // Add missionLead
    if (data.missionLead) {
      const numId = Number(data.missionLead);
      if (!isNaN(numId) && numId > 0) allAssignees.add(numId);
    }

    // Add step assignees
    (data.solutionsSteps || []).forEach(step => {
      if (step.assigneeId) {
        const numId = Number(step.assigneeId);
        if (!isNaN(numId) && numId > 0) allAssignees.add(numId);
      }
    });

    const assignees: number[] = Array.from(allAssignees);

    // 5. Convert dates to UNIX timestamps (ms)
    const startDateTimestamp = data.startDate ? new Date(data.startDate).getTime() : null;
    const dueDateTimestamp = data.dueDate ? new Date(data.dueDate).getTime() : null;

    // 6. Build main task payload
    const mainTaskPayload: any = {
      name: data.projectName.trim(),
      description,
      assignees,
      custom_fields: customFields,
    };
    if (startDateTimestamp) mainTaskPayload.start_date = startDateTimestamp;
    if (dueDateTimestamp) mainTaskPayload.due_date = dueDateTimestamp;

    // 7. Create Main Task
    const mainTaskRes = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task`, {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/json" },
      body: JSON.stringify(mainTaskPayload),
    });

    if (!mainTaskRes.ok) {
      const errorData = await mainTaskRes.text();
      console.error("Failed to create ClickUp Main Task:", errorData);
      throw new Error(`ClickUp API Error (Main Task): ${mainTaskRes.status} — ${errorData}`);
    }

    const mainTaskData = await mainTaskRes.json();
    const mainTaskId = mainTaskData.id;

    // 8. Set Mission Lead custom field (Users-type fields require separate POST)
    if (isValidFieldId(fieldMissionLead) && data.missionLead) {
      try {
        const missionLeadRes = await fetch(
          `https://api.clickup.com/api/v2/task/${mainTaskId}/field/${fieldMissionLead}`,
          {
            method: "POST",
            headers: { Authorization: token, "Content-Type": "application/json" },
            body: JSON.stringify({
              value: { add: [Number(data.missionLead)] },
            }),
          }
        );
        if (!missionLeadRes.ok) {
          const errText = await missionLeadRes.text();
          console.error("Failed to set Mission Lead custom field:", errText);
        }
      } catch (err) {
        console.error("Error setting Mission Lead field:", err);
      }
    }

    // Create a specific array for the explicit proponents custom field
    const explicitProponents: number[] = [];
    (data.proponents || []).forEach(id => {
      const numId = Number(id);
      if (!isNaN(numId) && numId > 0) explicitProponents.push(numId);
    });

    // 9. Set Mission Proponents custom field (Users-type fields require separate POST)
    if (isValidFieldId(fieldMissionProponents) && explicitProponents.length > 0) {
      try {
        const missionProponentsRes = await fetch(
          `https://api.clickup.com/api/v2/task/${mainTaskId}/field/${fieldMissionProponents}`,
          {
            method: "POST",
            headers: { Authorization: token, "Content-Type": "application/json" },
            body: JSON.stringify({
              value: { add: explicitProponents },
            }),
          }
        );
        if (!missionProponentsRes.ok) {
          const errText = await missionProponentsRes.text();
          console.error("Failed to set Mission Proponents custom field:", errText);
        }
      } catch (err) {
        console.error("Error setting Mission Proponents field:", err);
      }
    }

    // 10. Create Subtasks from solutionsSteps
    const steps = data.solutionsSteps || [];
    const createdSubtasks: any[] = [];
    const failedSubtasks: { index: number; stepName: string; error: string }[] = [];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const subtaskAssignees: number[] = [];
      if (step.assigneeId) {
        const id = Number(step.assigneeId);
        if (!isNaN(id) && id > 0) subtaskAssignees.push(id);
      }

      const subtaskPayload: any = {
        name: step.stepName.trim(),
        assignees: subtaskAssignees,
        parent: mainTaskId,
      };

      if (step.dueDate) {
        subtaskPayload.due_date = new Date(step.dueDate).getTime();
      }

      try {
        const subRes = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task`, {
          method: "POST",
          headers: { Authorization: token, "Content-Type": "application/json" },
          body: JSON.stringify(subtaskPayload),
        });

        if (subRes.ok) {
          createdSubtasks.push(await subRes.json());
        } else {
          const errText = await subRes.text();
          console.warn(`Failed to create subtask ${i + 1} ("${step.stepName}"):`, errText);
          failedSubtasks.push({ index: i, stepName: step.stepName, error: errText });
        }
      } catch (err: any) {
        console.warn(`Error creating subtask ${i + 1} ("${step.stepName}"):`, err?.message);
        failedSubtasks.push({ index: i, stepName: step.stepName, error: err?.message || "Unknown error" });
      }
    }

    return NextResponse.json({
      success: true,
      mainTaskId,
      subtasksCreated: createdSubtasks.length,
      subtasksFailed: failedSubtasks.length,
      ...(failedSubtasks.length > 0 && { failedSubtasks }),
    });
  } catch (error: any) {
    console.error("Submit API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
