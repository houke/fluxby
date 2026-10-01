import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useDatabase } from '@/contexts/DatabaseContext';
import { useEncryption } from '@/contexts/EncryptionContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePrivacy } from '@/contexts/PrivacyContext';
import { useProfile } from '@/contexts/ProfileContext';
import { useConfirm } from '@/contexts/ConfirmContext';
import { useToast } from '@/contexts/ToastContext';
import { useWebMcp } from '@/contexts/WebMcpContext';
import { buildWebMcpTools, getWebMcpModelContext } from '@/lib/webmcp-tools';

/** Mounted only behind SecurityGate, so locking the app removes every tool. */
export function WebMcpBridge() {
  const { enabled } = useWebMcp();
  const { db, dataService, isReady } = useDatabase();
  const { isUnlocked } = useEncryption();
  const { isPrivacyMode } = usePrivacy();
  const { activeProfile } = useProfile();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const toast = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const modelContext = getWebMcpModelContext();
    if (
      !enabled ||
      !isReady ||
      !isUnlocked ||
      isPrivacyMode ||
      !db ||
      !dataService ||
      !activeProfile ||
      !modelContext
    )
      return;

    const controller = new AbortController();
    const tools = buildWebMcpTools({
      service: dataService,
      copy: t.webMcp,
      profile: { id: activeProfile.id, name: activeProfile.name },
      language,
      navigate,
      confirm: (title, message) => confirm({ title, message }),
      changed: async () => {
        await queryClient.invalidateQueries();
        toast.success(t.webMcp.saved);
      },
      isAvailable: () => !controller.signal.aborted,
      hasTransaction: async (id) =>
        Boolean(
          await db.queryOneAsync(
            'SELECT id FROM transactions WHERE id=? AND profile_id=? AND is_deleted=0',
            [id, activeProfile.id]
          )
        ),
    });

    void (async () => {
      for (const tool of tools) {
        if (controller.signal.aborted) break;
        try {
          await modelContext.registerTool(tool, { signal: controller.signal });
        } catch (error) {
          if (!controller.signal.aborted)
            console.warn(`Could not register WebMCP tool ${tool.name}`, error);
        }
      }
    })();

    return () => controller.abort();
  }, [
    enabled,
    isReady,
    isUnlocked,
    isPrivacyMode,
    db,
    dataService,
    activeProfile,
    language,
    t,
    navigate,
    confirm,
    toast,
    queryClient,
  ]);

  return null;
}
