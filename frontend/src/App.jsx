import { BrowserRouter, Routes, Route } from "react-router-dom";

import ScrollToTop from "./components/ScrollToTop";
import DashboardPage from "./pages/DashboardPage";
import IntakeAgentPage from "./pages/IntakeAgentPage";
import OutreachAgentPage from "./pages/OutreachAgentPage";
import SchedulingAgentPage from "./pages/SchedulingAgentPage";
import DebriefAgentPage from "./pages/DebriefAgentPage";
import SubmissionAgentPage from "./pages/SubmissionAgentPage";
import SourcingAgentPage from "./pages/SourcingAgentPage";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/intake-agent" element={<IntakeAgentPage />} />
        <Route path="/outreach-agent" element={<OutreachAgentPage />} />
        <Route path="/scheduling-agent" element={<SchedulingAgentPage />} />
        <Route path="/debrief-agent" element={<DebriefAgentPage />} />
        <Route path="/submission-agent" element={<SubmissionAgentPage />} />
        <Route path="/sourcing-agent" element={<SourcingAgentPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;