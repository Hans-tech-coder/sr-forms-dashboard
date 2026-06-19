import { NextResponse } from "next/server";

export async function GET() {
  const token = process.env.CLICKUP_API_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "CLICKUP_API_TOKEN is not configured" }, { status: 500 });
  }

  const listId = process.env.MISSION_LIST_ID;
  if (!listId) {
    return NextResponse.json({ error: "MISSION_LIST_ID is not configured in .env.local" }, { status: 500 });
  }

  const fieldComposition = process.env.CLICKUP_FIELD_COMPOSITION;
  const fieldCategory = process.env.CLICKUP_FIELD_CATEGORY;
  const fieldSize = process.env.CLICKUP_FIELD_SIZE;

  try {
    const res = await fetch(`https://api.clickup.com/api/v2/list/${listId}/field`, {
      headers: { Authorization: token },
      cache: "no-store",
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Failed to fetch ClickUp fields:", errText);
      throw new Error(`ClickUp API Error: ${res.status}`);
    }

    const data = await res.json();
    const fields = data.fields || [];

    // Helper to map options from a specific field ID
    const getOptionsForField = (fieldId: string | undefined) => {
      if (!fieldId || fieldId === "REPLACE_WITH_FIELD_ID") return [];
      
      const field = fields.find((f: any) => f.id === fieldId);
      if (!field || !field.type_config || !Array.isArray(field.type_config.options)) {
        return [];
      }
      
      return field.type_config.options.map((opt: any) => ({
        id: opt.id,
        label: opt.name || opt.label || "Unnamed Option",
        color: opt.color,
      }));
    };

    return NextResponse.json({
      compositionOptions: getOptionsForField(fieldComposition),
      categoryOptions: getOptionsForField(fieldCategory),
      sizeOptions: getOptionsForField(fieldSize),
    });
  } catch (error: any) {
    console.error("Fields API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
