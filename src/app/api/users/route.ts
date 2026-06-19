import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.CLICKUP_API_TOKEN;
  
  if (!token) {
    return NextResponse.json({ error: "CLICKUP_API_TOKEN is not configured" }, { status: 500 });
  }

  try {
    // Fetch the Team/Workspace ID from ClickUp
    const teamRes = await fetch('https://api.clickup.com/api/v2/team', {
      headers: {
        Authorization: token,
      },
    });

    if (!teamRes.ok) {
      throw new Error(`Failed to fetch ClickUp teams: ${teamRes.statusText}`);
    }

    const teamData = await teamRes.json();
    
    if (!teamData.teams || teamData.teams.length === 0) {
      return NextResponse.json({ error: "No teams found" }, { status: 404 });
    }

    const firstTeam = teamData.teams[0];
    let members = firstTeam.members || [];

    // If for some reason members are not included in the first payload,
    // fetch them specifically as requested by the user logic.
    if (members.length === 0) {
      const specificTeamRes = await fetch(`https://api.clickup.com/api/v2/team/${firstTeam.id}`, {
        headers: {
          Authorization: token,
        },
      });
      if (specificTeamRes.ok) {
        const specificTeamData = await specificTeamRes.json();
        // Assume API returns the team object with a members array
        members = specificTeamData.team?.members || specificTeamData.members || [];
      }
    }

    // Map the users to the requested structured format
    const users = members.map((member: any) => {
      const u = member.user;
      return {
        id: u.id,
        username: u.username,
        profilePicture: u.profilePicture || null,
      };
    });

    return NextResponse.json(users);
  } catch (error: any) {
    console.error("ClickUp API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
