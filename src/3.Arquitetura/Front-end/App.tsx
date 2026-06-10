import { BrowserRouter as Router, Navigate, Routes, Route } from 'react-router';
import { AppProvider } from '@Front-end/context/AppContext';
import { AnalysisFlowProvider } from '@Front-end/context/AnalysisFlowContext';
import { AuthLayout } from '@Front-end/components/layout/AuthLayout';
import { AuthRequiredRoute } from '@Front-end/components/layout/AuthRequiredRoute';
import { AppShell } from '@Front-end/components/layout/AppShell';
import LoginView from '@Front-end/view/LoginView';
import CadastroView from '@Front-end/view/CadastroView';
import UploadImagemView from '@Front-end/view/UploadImagemView';
import IdentificacaoIAView from '@Front-end/view/IdentificacaoIAView';
import DiagnosticoView from '@Front-end/view/DiagnosticoView';
import HistoricoView from '@Front-end/view/HistoricoView';
import PerfilView from '@Front-end/view/PerfilView';
import ConfiguracoesView from '@Front-end/view/ConfiguracoesView';
import GeolocalizacaoView from '@Front-end/view/GeolocalizacaoView';
import PlanosView from '@Front-end/view/PlanosView';

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginView />} />
            <Route path="/cadastro" element={<CadastroView />} />
          </Route>

          <Route
            element={
              <AnalysisFlowProvider>
                <AppShell />
              </AnalysisFlowProvider>
            }
          >
            <Route path="/upload" element={<UploadImagemView />} />
            <Route path="/identificacao" element={<IdentificacaoIAView />} />
            <Route path="/resultado" element={<DiagnosticoView />} />
            <Route path="/analise" element={<UploadImagemView />} />

            <Route element={<AuthRequiredRoute />}>
              <Route path="/historico" element={<HistoricoView />} />
              <Route path="/perfil" element={<PerfilView />} />
              <Route path="/configuracoes" element={<ConfiguracoesView />} />
              <Route path="/geolocalizacao" element={<GeolocalizacaoView />} />
              <Route path="/planos" element={<PlanosView />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/upload" replace />} />
          <Route path="*" element={<Navigate to="/upload" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}
