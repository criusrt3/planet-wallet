import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { AddressBookPage } from '@/pages/AddressBookPage'
import { CreatePage } from '@/pages/CreatePage'
import { PassportPage } from '@/pages/PassportPage'
import { PlanetHomePage } from '@/pages/PlanetHomePage'
import { SettingsPage } from '@/pages/SettingsPage'
import { SignTutorialPage } from '@/pages/SignTutorialPage'
import { HistoryPage } from '@/pages/HistoryPage'
import { SwapPage } from '@/pages/SwapPage'
import { TransferPage } from '@/pages/TransferPage'
import { WalletsPage } from '@/pages/WalletsPage'
import { WelcomePage } from '@/pages/WelcomePage'
import { ConfirmActionProvider } from '@/components/ConfirmActionProvider'
import { WalletProvider } from '@/store/WalletContext'

export default function App() {
  return (
    <ConfirmActionProvider>
      <WalletProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/create" element={<CreatePage />} />
          <Route path="/planet" element={<PlanetHomePage />} />
          <Route path="/wallets" element={<WalletsPage />} />
          <Route path="/transfer" element={<TransferPage />} />
          <Route path="/swap" element={<SwapPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/address-book" element={<AddressBookPage />} />
          <Route path="/sign" element={<SignTutorialPage />} />
          <Route path="/passport" element={<PassportPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      </WalletProvider>
    </ConfirmActionProvider>
  )
}
