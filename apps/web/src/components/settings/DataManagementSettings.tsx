import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { api } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/contexts/ProfileContext';

export function DataManagementSettings() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { switchProfile, refreshProfiles } = useProfile();
  const [dataNotice, setDataNotice] = useState<{
    type: 'success' | 'error' | 'warning';
    text: string;
  } | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Auto-hide notice (keep warnings visible longer)
  React.useEffect(() => {
    if (!dataNotice) return;
    const delay = dataNotice.type === 'warning' ? 10000 : 4000;
    const t = setTimeout(() => setDataNotice(null), delay);
    return () => clearTimeout(t);
  }, [dataNotice]);

  return (
    <Card data-onboarding='settings-data-management'>
      <CardHeader>
        <CardTitle>{t.settings.dataManagement.title}</CardTitle>
        <CardDescription>
          {t.settings.dataManagement.description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {dataNotice && (
            <div
              className={`whitespace-pre-wrap rounded border px-3 py-2 text-sm ${
                dataNotice.type === 'success'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : dataNotice.type === 'warning'
                    ? 'border-amber-300 bg-amber-50 text-amber-800'
                    : 'border-rose-300 bg-rose-50 text-rose-800'
              }`}
            >
              {dataNotice.text}
            </div>
          )}

          <div className='flex items-center justify-between py-3'>
            <div>
              <p className='font-medium'>
                {t.settings.dataManagement.exportTitle}
              </p>
              <p className='text-sm text-muted-foreground'>
                {t.settings.dataManagement.exportDescription}
              </p>
            </div>
            <Button
              variant='outline'
              disabled={isDataLoading}
              onClick={async () => {
                setIsDataLoading(true);
                try {
                  const data = await api.exportAll();
                  const blob = new Blob([JSON.stringify(data, null, 2)], {
                    type: 'application/json',
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `finance-export-${
                    new Date().toISOString().split('T')[0]
                  }.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                  setDataNotice({
                    type: 'success',
                    text: t.settings.dataManagement.exportSuccess,
                  });
                } catch {
                  setDataNotice({
                    type: 'error',
                    text: t.settings.dataManagement.exportError,
                  });
                } finally {
                  setIsDataLoading(false);
                }
              }}
            >
              {isDataLoading ? (
                <RefreshCcw className='mr-2 h-4 w-4 animate-spin' />
              ) : null}
              {t.settings.dataManagement.exportButton}
            </Button>
          </div>

          <div className='flex items-center justify-between border-t py-3'>
            <div>
              <p className='font-medium'>
                {t.settings.dataManagement.importTitle}
              </p>
              <p className='text-sm text-muted-foreground'>
                {t.settings.dataManagement.importDescription}
              </p>
            </div>
            <input
              type='file'
              accept='application/json'
              className='hidden'
              id='import-json-input'
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (!confirm(t.settings.dataManagement.importConfirm)) {
                  e.target.value = '';
                  return;
                }
                setIsDataLoading(true);
                try {
                  const text = await file.text();
                  const payload = JSON.parse(text);
                  const result = await api.importAll(payload);
                  queryClient.invalidateQueries();

                  // Check if any category rules were skipped
                  const skippedRules = (
                    result as {
                      categoryRulesSkipped?: Array<{
                        pattern: string;
                        reason: string;
                      }>;
                    }
                  )?.categoryRulesSkipped;

                  if (skippedRules && skippedRules.length > 0) {
                    const skippedList = skippedRules
                      .map((r) => `• "${r.pattern}": ${r.reason}`)
                      .join('\n');
                    setDataNotice({
                      type: 'warning',
                      text: `${t.settings.dataManagement.importSuccess}\n\n${t.settings.dataManagement.skippedRules || 'Overgeslagen categorieregels'}:\n${skippedList}`,
                    });
                  } else {
                    setDataNotice({
                      type: 'success',
                      text: t.settings.dataManagement.importSuccess,
                    });
                  }
                } catch {
                  setDataNotice({
                    type: 'error',
                    text: t.settings.dataManagement.importError,
                  });
                } finally {
                  setIsDataLoading(false);
                  e.target.value = '';
                }
              }}
            />
            <Button
              variant='outline'
              disabled={isDataLoading}
              onClick={() => {
                const input = document.getElementById(
                  'import-json-input'
                ) as HTMLInputElement | null;
                input?.click();
              }}
            >
              {isDataLoading ? (
                <RefreshCcw className='mr-2 h-4 w-4 animate-spin' />
              ) : null}
              {t.settings.dataManagement.importButton}
            </Button>
          </div>
          <div className='flex items-center justify-between border-t py-3'>
            <div>
              <p className='font-medium text-destructive'>
                {t.settings.dataManagement.deleteAllTitle}
              </p>
              <p className='text-sm text-muted-foreground'>
                {t.settings.dataManagement.deleteAllDescription}
              </p>
            </div>
            <Button
              variant='destructive'
              disabled={isDataLoading}
              onClick={async () => {
                if (confirm(t.settings.dataManagement.deleteAllConfirm)) {
                  setIsDataLoading(true);
                  try {
                    // Reset all data and get demo profile ID
                    const result = await api.resetAllData();

                    // Refresh profiles list and switch to demo profile
                    await refreshProfiles();
                    if (result.demoProfileId) {
                      switchProfile(result.demoProfileId);

                      // Seed demo data for the profile
                      await api.seedDemoData(result.demoProfileId);
                    }

                    queryClient.invalidateQueries();
                    setDataNotice({
                      type: 'success',
                      text: t.settings.dataManagement.deleteAllSuccess,
                    });
                  } catch {
                    setDataNotice({
                      type: 'error',
                      text: t.settings.dataManagement.deleteAllError,
                    });
                  } finally {
                    setIsDataLoading(false);
                  }
                }
              }}
            >
              {isDataLoading ? (
                <RefreshCcw className='mr-2 h-4 w-4 animate-spin' />
              ) : null}
              {t.settings.dataManagement.deleteAllButton}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
