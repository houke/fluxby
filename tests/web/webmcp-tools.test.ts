import { describe, expect, it, vi } from 'vitest';
import { buildWebMcpTools } from '@/lib/webmcp-tools';
import { webMcpEn, webMcpNl } from '@/lib/webmcp-copy';
import {
  webMcpEn as landingEn,
  webMcpNl as landingNl,
} from '../../apps/landing/src/lib/i18n/webmcp';
import type { DataService } from '@/lib/data-service';

const signal = new AbortController().signal;

function setup() {
  let available = true;
  const service = {
    getAccounts: vi
      .fn()
      .mockResolvedValue([{ id: 'account-1', name: 'Current' }]),
    getCategories: vi.fn().mockResolvedValue([{ id: 'category-1' }]),
    getTransactions: vi.fn().mockResolvedValue([
      {
        id: 'transaction-1',
        amount: -12,
        rawData: 'private bank export',
        importHash: 'private hash',
      },
    ]),
    updateTransaction: vi.fn().mockResolvedValue(undefined),
  };
  const confirm = vi.fn().mockResolvedValue(true);
  const changed = vi.fn().mockResolvedValue(undefined);
  const tools = buildWebMcpTools({
    service: service as unknown as DataService,
    copy: webMcpEn,
    profile: { id: 'profile-1', name: 'Personal' },
    language: 'en',
    navigate: vi.fn(),
    confirm,
    changed,
    isAvailable: () => available,
    hasTransaction: vi.fn().mockResolvedValue(true),
  });
  const find = (name: string) => {
    const tool = tools.find((item) => item.name === `fluxby_${name}`);
    if (!tool) throw new Error(`Missing test tool: ${name}`);
    return tool;
  };
  return {
    tools,
    find,
    service,
    confirm,
    changed,
    revoke: () => (available = false),
  };
}

describe('WebMCP tool surface', () => {
  it('covers every documented view with stable unique names and bilingual labels', () => {
    const { tools } = setup();
    const names = tools.map((tool) => tool.name);
    expect(new Set(names).size).toBe(names.length);
    expect(names).toHaveLength(20);
    expect(
      tools.find((tool) => tool.name === 'fluxby_create_transaction')
        ?.annotations.consequentialHint
    ).toBe(true);
    for (const copy of [landingEn, landingNl]) {
      const documented = copy.docs.rows.flatMap(
        ([, list]) => list.match(/fluxby_[a-z_]+/g) ?? []
      );
      expect(new Set(documented)).toEqual(new Set(names));
      expect(new Set(copy.docs.contracts.map(([name]) => name))).toEqual(
        new Set(names)
      );
    }
    for (const key of Object.keys(webMcpEn.tool) as Array<
      keyof typeof webMcpEn.tool
    >) {
      expect(webMcpEn.tool[key].title).toBeTruthy();
      expect(webMcpNl.tool[key].title).toBeTruthy();
      expect(webMcpEn.tool[key].description).toBeTruthy();
      expect(webMcpNl.tool[key].description).toBeTruthy();
    }
    expect(Object.keys(webMcpEn.fieldLabels).sort()).toEqual(
      Object.keys(webMcpNl.fieldLabels).sort()
    );
  });

  it('bounds transaction reads and excludes raw import fields', async () => {
    const { find, service, confirm } = setup();
    const tool = find('transactions');
    const result = await tool.execute({ limit: 2, offset: 5 }, { signal });
    expect(service.getTransactions).toHaveBeenCalledWith({
      limit: '2',
      offset: '5',
    });
    expect(result).toEqual({
      items: [{ id: 'transaction-1', amount: -12 }],
      limit: 2,
      offset: 5,
      hasMore: false,
    });
    await expect(tool.execute({ limit: 101 }, { signal })).rejects.toThrow(
      webMcpEn.invalidInput
    );
    await expect(tool.execute({ secret: 'x' }, { signal })).rejects.toThrow(
      webMcpEn.invalidInput
    );
    expect(confirm).not.toHaveBeenCalled();
  });

  it('requires a confirmation and active-profile ownership before a write', async () => {
    const { find, service, confirm, changed } = setup();
    const tool = find('update_transaction');
    confirm.mockResolvedValueOnce(false);
    await expect(
      tool.execute({ id: 'transaction-1', notes: 'Reviewed' }, { signal })
    ).resolves.toEqual({ cancelled: true });
    expect(service.updateTransaction).not.toHaveBeenCalled();
    await tool.execute({ id: 'transaction-1', notes: 'Reviewed' }, { signal });
    expect(service.updateTransaction).toHaveBeenCalledWith('transaction-1', {
      categoryId: undefined,
      merchantName: undefined,
      notes: 'Reviewed',
    });
    expect(confirm).toHaveBeenLastCalledWith(
      webMcpEn.confirmTitle,
      expect.stringContaining('Notes: Reviewed')
    );
    expect(changed).toHaveBeenCalledOnce();
  });

  it('rejects invalid input and revoked access without writing', async () => {
    const { find, service, confirm, revoke } = setup();
    const tool = find('create_transaction');
    await expect(
      tool.execute(
        {
          date: '2026-10-01',
          amount: -2,
          type: 'expense',
          accountId: 'foreign',
        },
        { signal }
      )
    ).rejects.toThrow(webMcpEn.notFound);
    expect(service.getAccounts).toHaveBeenCalled();
    revoke();
    await expect(
      tool.execute(
        {
          date: '2026-10-01',
          amount: -2,
          type: 'expense',
          accountId: 'account-1',
        },
        { signal }
      )
    ).rejects.toThrow(webMcpEn.unavailable);
    expect(confirm).toHaveBeenCalledOnce();
  });

  it('rejects overlapping writes and rechecks access after confirmation', async () => {
    const { find, confirm, revoke, changed } = setup();
    let accept: (value: boolean) => void = () => undefined;
    confirm.mockImplementation(
      () => new Promise<boolean>((resolve) => (accept = resolve))
    );
    const tool = find('create_category');
    const pending = tool.execute({ name: 'One' }, { signal });
    await vi.waitFor(() => expect(confirm).toHaveBeenCalledOnce());
    await expect(tool.execute({ name: 'Two' }, { signal })).rejects.toThrow(
      webMcpEn.busy
    );
    revoke();
    accept(true);
    await expect(pending).rejects.toThrow(webMcpEn.unavailable);
    expect(changed).not.toHaveBeenCalled();
  });
});
