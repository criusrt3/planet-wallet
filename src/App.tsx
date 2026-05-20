import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { CreatePage } from '@/pages/CreatePage'
import { PassportPage } from '@/pages/PassportPage'
import { PlanetHomePage } from '@/pages/PlanetHomePage'
import { SignTutorialPage } from '@/pages/SignTutorialPage'
import { WelcomePage } from '@/pages/WelcomePage'
import { WalletProvider } from '@/store/WalletContext'

export default function App() {
  return (
    <WalletProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/create" element={<CreatePage />} />
          <Route path="/planet" element={<PlanetHomePage />} />
          <Route path="/sign" element={<SignTutorialPage />} />
          <Route path="/passport" element={<PassportPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </WalletProvider>
  )
}
