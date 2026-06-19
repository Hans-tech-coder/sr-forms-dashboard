import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      const clickupToken = process.env.CLICKUP_API_TOKEN;
      if (!clickupToken) {
        console.error("CLICKUP_API_TOKEN is missing");
        return false;
      }

      try {
        // Fetch ClickUp teams to get the first workspace
        const teamRes = await fetch('https://api.clickup.com/api/v2/team', {
          headers: { Authorization: clickupToken },
        });

        if (!teamRes.ok) return false;
        const teamData = await teamRes.json();
        const firstTeamId = teamData.teams?.[0]?.id;

        if (!firstTeamId) return false;

        // Fetch members of that team
        const memberRes = await fetch(`https://api.clickup.com/api/v2/team/${firstTeamId}`, {
          headers: { Authorization: clickupToken },
        });

        if (!memberRes.ok) return false;
        const memberData = await memberRes.json();
        
        // Members might be in .members or .team.members depending on API version
        const members = memberData.team?.members || memberData.members || [];
        
        // Check if the user's Google email exists in ClickUp members
        const isMember = members.some((m: any) => 
          m.user.email.toLowerCase() === user.email?.toLowerCase()
        );

        if (!isMember) {
          console.warn(`Access denied for ${user.email}: Not a ClickUp workspace member.`);
          return false;
        }

        return true;
      } catch (error) {
        console.error("Auth membership check error:", error);
        return false;
      }
    },
    async session({ session, token }) {
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
