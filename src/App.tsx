import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { BgmProvider } from './audio/BgmContext'
import { RequireAuth } from './auth/RequireAuth'
import { ContentProvider } from './content/ContentContext'
import { Layout } from './components/Layout'
import { PageTransition } from './components/PageTransition'
import { Home } from './pages/Home'
import { Timeline } from './pages/Timeline'
import { Photos } from './pages/Photos'
import { Letter } from './pages/Letter'
import { Edit } from './pages/Edit'
import { Login } from './pages/Login'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <ContentProvider>
              <Layout>
                <PageTransition>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/timeline" element={<Timeline />} />
                    <Route path="/photos" element={<Photos />} />
                    <Route path="/letter" element={<Letter />} />
                    <Route path="/edit" element={<Edit />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </PageTransition>
              </Layout>
            </ContentProvider>
          </RequireAuth>
        }
      />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BgmProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </BgmProvider>
    </AuthProvider>
  )
}
