import { NextResponse } from "next/server";

type ClickUpFieldOption = {
  id: string;
  name?: string;
  label?: string;
  color?: string;
};

type ClickUpField = {
  id: string;
  name: string;
  type_config?: {
    options?: ClickUpFieldOption[];
  };
};

function getFieldData(fields: ClickUpField[], fieldName: string) {
  const field = fields.find((item) => item.name === fieldName);
  const options = (field?.type_config?.options || []).map((option) => ({
    id: option.id,
    label: option.name || option.label || "",
    color: option.color || null,
  }));

  return {
    fieldId: field?.id || "",
    options,
  };
}

export async function GET() {
  const token = process.env.CLICKUP_API_TOKEN;
  const listId = process.env.TURNOVER_LIST_ID;

  if (!token) {
    return NextResponse.json({ error: "CLICKUP_API_TOKEN is not configured" }, { status: 500 });
  }

  if (!listId) {
    return NextResponse.json({ error: "TURNOVER_LIST_ID is not configured" }, { status: 500 });
  }

  try {
    const fieldsRes = await fetch(`https://api.clickup.com/api/v2/list/${listId}/field`, {
      headers: {
        Authorization: token,
      },
      cache: "no-store",
    });

    if (!fieldsRes.ok) {
      const errorText = await fieldsRes.text();
      throw new Error(`Failed to fetch list fields (${fieldsRes.status}): ${errorText || fieldsRes.statusText}`);
    }

    const fieldsData = await fieldsRes.json();
    const fields = Array.isArray(fieldsData.fields) ? fieldsData.fields : [];

    const vertical = getFieldData(fields, "🧑🏻‍🚀 Vertical");
    const leaveType = getFieldData(fields, "Leave Type");
    const applicant = getFieldData(fields, "Applicant");
    const geminiNotes = getFieldData(fields, "Link to Gemini Notes - Turnover");

    return NextResponse.json({
      verticalFieldId: vertical.fieldId,
      leaveTypeFieldId: leaveType.fieldId,
      applicantFieldId: applicant.fieldId,
      geminiNotesFieldId: geminiNotes.fieldId,
      verticalOptions: vertical.options,
      leaveTypeOptions: leaveType.options,
    });
  } catch (error: any) {
    console.error("ClickUp fields API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
