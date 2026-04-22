import { BrowserRouter as Router, Routes, Route } from "react-router";
import DiagnosticoView from "@Front-end/view/DiagnosticoView";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DiagnosticoView />} />
      </Routes>
    </Router>
  );
}
