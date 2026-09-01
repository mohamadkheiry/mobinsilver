import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../lib/api'
import type { StoreSettings } from '../types'

const defaults: StoreSettings = {
  storeName: 'مبین سیلور',
  supportPhone: '۰۲۱-۹۱۰۰۰۰۰۰',
  supportEmail: 'info@mobinsilver.ir',
  address: 'تهران، خیابان ولیعصر',
  announcement: 'بسم الله الرحمن الرحیم • إِنَّا فَتَحْنَا لَكَ فَتْحًا مُبِينًا',
  ordersEnabled: true,
}

interface StoreValue {
  settings: StoreSettings
  refreshSettings: () => Promise<void>
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(defaults)
  const refreshSettings = useCallback(async () => {
    try { setSettings(await api.storeSettings()) } catch { setSettings(defaults) }
  }, [])
  useEffect(() => { void refreshSettings() }, [refreshSettings])
  const value = useMemo(() => ({ settings, refreshSettings }), [settings, refreshSettings])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStoreSettings() {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStoreSettings must be used inside StoreProvider')
  return context
}
