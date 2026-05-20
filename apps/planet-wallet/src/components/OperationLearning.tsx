import { AiNavigator } from '@/components/AiNavigator'
import { SignTranslator } from '@/components/SignTranslator'
import { getOperationHint } from '@/lib/operation-hints'
import { analyzeSignRequest } from '@/lib/security'
import { useWallet } from '@/store/WalletContext'
import type { OperationScene, SignActionType } from '@/types'

interface OperationLearningProps {
  scene: OperationScene
  /** 若提供则同时展示签名/交易风险翻译器 */
  actionType?: SignActionType
  compact?: boolean
}

/** 根据设置显示操作学习提示（可在设置中关闭） */
export function OperationLearning({
  scene,
  actionType,
  compact,
}: OperationLearningProps) {
  const { settings } = useWallet()
  if (!settings.showLearningHints) return null

  return (
    <div className="space-y-3">
      <AiNavigator message={getOperationHint(scene)} compact={compact} />
      {actionType ? (
        <SignTranslator analysis={analyzeSignRequest(actionType)} />
      ) : null}
    </div>
  )
}
