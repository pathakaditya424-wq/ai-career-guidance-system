// ─── APP ROOT ────────────────────────────────────────────────
// This file only handles routing between pages.
// All components, pages, styles, and data live in their own files.

import { useState }    from "react";
import GlobalStyle     from "./styles/GlobalStyle";
import AuthPage        from "./pages/AuthPage";
import InputPage       from "./pages/InputPage";
import RoadmapPage     from "./pages/RoadmapPage";
import CollegesPage    from "./pages/CollegesPage";
import JobsPage        from "./pages/JobsPage";

export default function App() {
  const [page,   setPage]   = useState("auth");
  const [user,   setUser]   = useState(null);
  const [data,   setData]   = useState(null);
  const [career, setCareer] = useState(null);

  return (
    <>
      <GlobalStyle />

      {page === "auth" && (
        <AuthPage
          onAuth={u => { setUser(u); setPage("input"); }}
        />
      )}

      {page === "input" && (
        <InputPage
          user={user}
          onBack={() => setPage("auth")}
          onSubmit={d => { setData(d); setPage("roadmap"); }}
        />
      )}

      {page === "roadmap" && (
        <RoadmapPage
          data={data}
          onBack={() => setPage("input")}
          onColleges={c => { setCareer(c); setPage("colleges"); }}
          onJobs={c => { setCareer(c); setPage("jobs"); }}
        />
      )}

      {page === "colleges" && (
        <CollegesPage
          career={career}
          onBack={() => setPage("roadmap")}
        />
      )}

      {page === "jobs" && (
        <JobsPage
          career={career}
          onBack={() => setPage("roadmap")}
        />
      )}
    </>
  );
}